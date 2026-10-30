-- ============================================================
-- DREAM PHOTO'S & FILM'S — authoritative business logic
-- Transaction-safe booking engine, status machine, availability,
-- expiry and blocked dates. All pricing is read from the database.
-- ============================================================

create extension if not exists pgcrypto;

-- ------------------------------------------------------------
-- helpers
-- ------------------------------------------------------------

create or replace function dpf_business_today()
returns date
language sql
stable
as $$
  select (now() at time zone coalesce(
    (select value #>> '{}' from app_settings where key = 'timezone_iana'),
    'Asia/Kolkata'
  ))::date;
$$;

create or replace function dpf_next_booking_number()
returns text
language plpgsql
as $$
declare
  v_year text := to_char(dpf_business_today(), 'YYYY');
  v_seq int;
begin
  -- serialise numbering per year
  perform pg_advisory_xact_lock(hashtext('dpf-booking-number-' || v_year));
  select coalesce(max(substring(booking_number from 10)::int), 0) + 1
    into v_seq
    from bookings
   where booking_number like 'DPF-' || v_year || '-%';
  return 'DPF-' || v_year || '-' || lpad(v_seq::text, 4, '0');
end;
$$;

create or replace function dpf_fail(p_code text, p_detail text default null)
returns void
language plpgsql
as $$
begin
  raise exception '%', p_code using errcode = 'P0001', detail = coalesce(p_detail, '');
end;
$$;

-- ------------------------------------------------------------
-- availability (public-safe: no client data leaves this function)
-- ------------------------------------------------------------

create or replace function get_availability(p_from date, p_to date)
returns table (day date, state text, label text)
language sql
stable
as $$
  with span as (
    select generate_series(p_from, p_to, interval '1 day')::date as day
  )
  select
    s.day,
    case
      when bl.blocked_date is not null then 'blocked'
      when b.status = 'CONFIRMED' then 'confirmed'
      when b.status = 'PENDING' then 'pending'
      else 'available'
    end as state,
    case
      when bl.blocked_date is not null then 'Unavailable'
      when b.status = 'CONFIRMED' then 'Booked'
      when b.status = 'PENDING' then 'On hold'
      else null
    end as label
  from span s
  left join blocked_dates bl on bl.blocked_date = s.day
  left join booking_dates bd on bd.event_date = s.day and bd.active
  left join bookings b on b.id = bd.booking_id
  order by s.day;
$$;

-- ------------------------------------------------------------
-- server-authoritative quote
-- ------------------------------------------------------------

create or replace function calculate_booking_quote(p jsonb)
returns jsonb
language plpgsql
stable
as $$
declare
  v_service services%rowtype;
  v_package packages%rowtype;
  v_option package_options%rowtype;
  v_days int;
  v_base numeric(12,2) := 0;
  v_extras numeric(12,2) := 0;
  v_extra_lines jsonb := '[]'::jsonb;
  v_dates date[];
  r record;
begin
  select * into v_service from services
    where id = (p->>'serviceId')::uuid and active;
  if not found then perform dpf_fail('INVALID_INPUT', 'service'); end if;

  v_dates := coalesce(
    (select array_agg((d)::date order by (d)::date)
       from jsonb_array_elements_text(coalesce(p->'dates', '[]'::jsonb)) d),
    array[]::date[]
  );
  v_days := greatest(coalesce(array_length(v_dates, 1), 1), 1);

  if p ? 'packageId' and nullif(p->>'packageId','') is not null then
    select * into v_package from packages
      where id = (p->>'packageId')::uuid and active;
    if not found then perform dpf_fail('INVALID_INPUT', 'package'); end if;
    if v_package.service_id <> v_service.id then
      perform dpf_fail('INVALID_INPUT', 'package_service_mismatch');
    end if;

    select * into v_option from package_options
      where package_id = v_package.id
        and active
        and (
          (nullif(p->>'packageOptionId','') is not null and id = (p->>'packageOptionId')::uuid)
          or (nullif(p->>'packageOptionId','') is null
              and kind = case when coalesce((p->>'album')::boolean, true)
                              then 'WITH_ALBUM' else 'WITHOUT_ALBUM' end)
        );
    if not found then perform dpf_fail('INVALID_INPUT', 'package_option'); end if;
    v_base := v_option.price;
  else
    v_base := v_service.price * v_days;
  end if;

  for r in
    select e.id, e.name, e.price
      from extras e
      join service_extras se on se.extra_id = e.id and se.service_id = v_service.id
     where e.active
       and e.id in (
         select (x)::uuid from jsonb_array_elements_text(coalesce(p->'extras','[]'::jsonb)) x
       )
     order by e.display_order
  loop
    v_extras := v_extras + r.price;
    v_extra_lines := v_extra_lines || jsonb_build_object('id', r.id, 'name', r.name, 'price', r.price);
  end loop;

  -- every requested extra must be valid for this service
  if (select count(*) from jsonb_array_elements_text(coalesce(p->'extras','[]'::jsonb)))
     <> jsonb_array_length(v_extra_lines) then
    perform dpf_fail('INVALID_INPUT', 'extra_not_eligible');
  end if;

  return jsonb_build_object(
    'serviceId', v_service.id,
    'serviceName', v_service.name,
    'servicePrice', v_service.price,
    'packageId', v_package.id,
    'packageName', v_package.name,
    'packageCode', v_package.code,
    'packageOptionId', v_option.id,
    'packageOptionLabel', v_option.label,
    'packageOptionPrice', v_option.price,
    'days', v_days,
    'baseAmount', v_base,
    'extras', v_extra_lines,
    'extrasAmount', v_extras,
    'total', v_base + v_extras,
    'currency', v_service.currency
  );
end;
$$;

-- ------------------------------------------------------------
-- atomic booking creation
-- ------------------------------------------------------------

create or replace function create_booking_atomic(p jsonb)
returns jsonb
language plpgsql
as $$
declare
  v_quote jsonb;
  v_dates date[];
  v_date date;
  v_client clients%rowtype;
  v_booking bookings%rowtype;
  v_number text;
  v_conflict int;
  v_email text := lower(trim(p->'client'->>'email'));
  v_extra jsonb;
  v_studio_email text;
  v_hold_hours int;
begin
  v_dates := (
    select array_agg(distinct (d)::date order by (d)::date)
      from jsonb_array_elements_text(coalesce(p->'dates','[]'::jsonb)) d
  );

  if v_dates is null or array_length(v_dates, 1) = 0 then
    perform dpf_fail('INVALID_INPUT', 'dates_required');
  end if;
  if array_length(v_dates, 1) > 5 then
    perform dpf_fail('INVALID_INPUT', 'too_many_dates');
  end if;
  if v_dates[1] < dpf_business_today() then
    perform dpf_fail('INVALID_INPUT', 'date_in_past');
  end if;

  -- deterministic ordered advisory locks (sorted) to avoid deadlocks
  foreach v_date in array v_dates loop
    perform pg_advisory_xact_lock(hashtext('dpf-date-' || v_date::text));
  end loop;

  -- authoritative conflict re-check inside the locked transaction
  select count(*) into v_conflict
    from unnest(v_dates) d
   where exists (select 1 from booking_dates bd where bd.event_date = d and bd.active)
      or exists (select 1 from blocked_dates bl where bl.blocked_date = d);
  if v_conflict > 0 then
    perform dpf_fail('DATE_UNAVAILABLE', 'conflict');
  end if;

  -- price is always recalculated from the database
  v_quote := calculate_booking_quote(p);

  if v_email is null or v_email = '' then
    perform dpf_fail('INVALID_INPUT', 'client_email');
  end if;

  insert into clients (name, email, phone, district, city)
  values (
    trim(p->'client'->>'name'),
    v_email,
    trim(coalesce(p->'client'->>'phone','')),
    trim(coalesce(p->'client'->>'district','')),
    trim(coalesce(p->'client'->>'city',''))
  )
  on conflict (lower(email)) do update
    set name = excluded.name,
        phone = excluded.phone,
        district = excluded.district,
        city = excluded.city,
        updated_at = now()
  returning * into v_client;

  v_number := dpf_next_booking_number();

  select coalesce((value #>> '{}')::int, 24) into v_hold_hours
    from app_settings where key = 'pending_hold_hours';
  v_hold_hours := coalesce(v_hold_hours, 24);

  insert into bookings (
    booking_number, client_id, service_id, package_id, package_option_id,
    event_start_date, event_end_date, budget, vision_notes,
    base_price, extras_total, total_price, currency,
    pricing_snapshot, status, access_token_hash, submitted_at, expires_at
  ) values (
    v_number, v_client.id,
    (v_quote->>'serviceId')::uuid,
    nullif(v_quote->>'packageId','')::uuid,
    nullif(v_quote->>'packageOptionId','')::uuid,
    v_dates[1], v_dates[array_length(v_dates,1)],
    left(coalesce(p->>'budget',''), 80),
    left(coalesce(p->>'notes',''), 4000),
    (v_quote->>'baseAmount')::numeric,
    (v_quote->>'extrasAmount')::numeric,
    (v_quote->>'total')::numeric,
    coalesce(v_quote->>'currency','INR'),
    v_quote || jsonb_build_object('capturedAt', now()),
    'PENDING',
    p->>'accessTokenHash',
    now(),
    now() + make_interval(hours => v_hold_hours)
  ) returning * into v_booking;

  foreach v_date in array v_dates loop
    insert into booking_dates (booking_id, event_date, active)
    values (v_booking.id, v_date, true);
  end loop;

  for v_extra in select * from jsonb_array_elements(v_quote->'extras') loop
    insert into booking_extras (booking_id, extra_id, name_snapshot, price_snapshot)
    values (v_booking.id, (v_extra->>'id')::uuid, v_extra->>'name', (v_extra->>'price')::numeric);
  end loop;

  insert into booking_status_history (booking_id, old_status, new_status, actor, reason)
  values (v_booking.id, null, 'PENDING', 'CLIENT', 'Request submitted');

  select value #>> '{}' into v_studio_email from app_settings where key = 'studio_email';

  -- notification outbox (same transaction as the business state)
  insert into notification_events (booking_id, event_type, channel, recipient, payload)
  values (
    v_booking.id, 'BOOKING_CREATED', 'EMAIL',
    coalesce(v_studio_email, 'studio@dreamphotosfilms.in'),
    jsonb_build_object('bookingNumber', v_number, 'audience', 'STUDIO')
  )
  on conflict do nothing;

  insert into notification_events (booking_id, event_type, channel, recipient, payload)
  values (
    v_booking.id, 'BOOKING_CREATED', 'EMAIL', v_client.email,
    jsonb_build_object('bookingNumber', v_number, 'audience', 'CLIENT')
  )
  on conflict do nothing;

  return jsonb_build_object(
    'bookingNumber', v_booking.booking_number,
    'status', v_booking.status,
    'serviceName', v_quote->>'serviceName',
    'packageName', v_quote->>'packageName',
    'packageOption', v_quote->>'packageOptionLabel',
    'dates', to_jsonb(v_dates),
    'extras', v_quote->'extras',
    'baseAmount', v_booking.base_price,
    'extrasAmount', v_booking.extras_total,
    'estimate', v_booking.total_price,
    'currency', v_booking.currency,
    'submittedAt', v_booking.submitted_at,
    'expiresAt', v_booking.expires_at
  );
end;
$$;

-- ------------------------------------------------------------
-- status machine
-- ------------------------------------------------------------

create or replace function change_booking_status(
  p_booking_id uuid,
  p_new_status text,
  p_actor text,
  p_actor_id uuid,
  p_reason text default null
)
returns jsonb
language plpgsql
as $$
declare
  v_booking bookings%rowtype;
  v_client clients%rowtype;
  v_allowed boolean := false;
begin
  select * into v_booking from bookings where id = p_booking_id for update;
  if not found then perform dpf_fail('BOOKING_NOT_FOUND'); end if;

  v_allowed := case
    when v_booking.status = 'PENDING'
      and p_new_status in ('CONFIRMED','REJECTED','CANCELLED','EXPIRED') then true
    when v_booking.status = 'CONFIRMED' and p_new_status = 'CANCELLED' then true
    else false
  end;

  if not v_allowed then
    perform dpf_fail('INVALID_STATUS_TRANSITION', v_booking.status || '->' || p_new_status);
  end if;

  update bookings
     set status = p_new_status,
         confirmed_at = case when p_new_status = 'CONFIRMED' then now() else confirmed_at end,
         rejected_at  = case when p_new_status = 'REJECTED'  then now() else rejected_at end,
         cancelled_at = case when p_new_status = 'CANCELLED' then now() else cancelled_at end,
         expired_at   = case when p_new_status = 'EXPIRED'   then now() else expired_at end,
         expires_at   = case when p_new_status = 'CONFIRMED' then null else expires_at end,
         updated_at   = now()
   where id = v_booking.id
   returning * into v_booking;

  -- release held dates for every terminal-negative status
  if p_new_status in ('REJECTED','CANCELLED','EXPIRED') then
    update booking_dates
       set active = false, released_at = now()
     where booking_id = v_booking.id and active;
  end if;

  insert into booking_status_history (booking_id, old_status, new_status, actor, actor_id, reason)
  values (v_booking.id, v_booking.status, p_new_status, p_actor, p_actor_id, p_reason);

  select * into v_client from clients where id = v_booking.client_id;

  insert into notification_events (booking_id, event_type, channel, recipient, payload)
  values (
    v_booking.id, 'BOOKING_' || p_new_status, 'EMAIL', v_client.email,
    jsonb_build_object('bookingNumber', v_booking.booking_number, 'audience', 'CLIENT')
  )
  on conflict do nothing;

  insert into notification_events (booking_id, event_type, channel, recipient, payload)
  select v_booking.id, 'BOOKING_' || p_new_status, 'PUSH', ps.endpoint,
         jsonb_build_object('bookingNumber', v_booking.booking_number, 'audience', 'CLIENT')
    from push_subscriptions ps
   where ps.active and ps.booking_id = v_booking.id
  on conflict do nothing;

  return jsonb_build_object(
    'bookingNumber', v_booking.booking_number,
    'status', v_booking.status
  );
end;
$$;

-- fix: history must record the previous status, so capture before update
create or replace function change_booking_status(
  p_booking_id uuid,
  p_new_status text,
  p_actor text,
  p_actor_id uuid,
  p_reason text default null
)
returns jsonb
language plpgsql
as $$
declare
  v_booking bookings%rowtype;
  v_old text;
  v_client clients%rowtype;
  v_allowed boolean := false;
begin
  select * into v_booking from bookings where id = p_booking_id for update;
  if not found then perform dpf_fail('BOOKING_NOT_FOUND'); end if;
  v_old := v_booking.status;

  v_allowed := case
    when v_old = 'PENDING' and p_new_status in ('CONFIRMED','REJECTED','CANCELLED','EXPIRED') then true
    when v_old = 'CONFIRMED' and p_new_status = 'CANCELLED' then true
    else false
  end;

  if not v_allowed then
    perform dpf_fail('INVALID_STATUS_TRANSITION', v_old || '->' || p_new_status);
  end if;

  update bookings
     set status = p_new_status,
         confirmed_at = case when p_new_status = 'CONFIRMED' then now() else confirmed_at end,
         rejected_at  = case when p_new_status = 'REJECTED'  then now() else rejected_at end,
         cancelled_at = case when p_new_status = 'CANCELLED' then now() else cancelled_at end,
         expired_at   = case when p_new_status = 'EXPIRED'   then now() else expired_at end,
         expires_at   = case when p_new_status = 'CONFIRMED' then null else expires_at end,
         updated_at   = now()
   where id = v_booking.id
   returning * into v_booking;

  if p_new_status in ('REJECTED','CANCELLED','EXPIRED') then
    update booking_dates
       set active = false, released_at = now()
     where booking_id = v_booking.id and active;
  end if;

  insert into booking_status_history (booking_id, old_status, new_status, actor, actor_id, reason)
  values (v_booking.id, v_old, p_new_status, p_actor, p_actor_id, p_reason);

  select * into v_client from clients where id = v_booking.client_id;

  insert into notification_events (booking_id, event_type, channel, recipient, payload)
  values (
    v_booking.id, 'BOOKING_' || p_new_status, 'EMAIL', v_client.email,
    jsonb_build_object('bookingNumber', v_booking.booking_number, 'audience', 'CLIENT')
  )
  on conflict do nothing;

  insert into notification_events (booking_id, event_type, channel, recipient, payload)
  select v_booking.id, 'BOOKING_' || p_new_status, 'PUSH', ps.endpoint,
         jsonb_build_object('bookingNumber', v_booking.booking_number, 'audience', 'CLIENT')
    from push_subscriptions ps
   where ps.active and ps.booking_id = v_booking.id
  on conflict do nothing;

  return jsonb_build_object('bookingNumber', v_booking.booking_number, 'status', v_booking.status);
end;
$$;

-- ------------------------------------------------------------
-- 24h expiry (idempotent, safe to run repeatedly)
-- ------------------------------------------------------------

create or replace function expire_pending_bookings()
returns int
language plpgsql
as $$
declare
  r record;
  v_count int := 0;
begin
  for r in
    select id from bookings
     where status = 'PENDING'
       and expires_at is not null
       and expires_at <= now()
     order by expires_at
     for update skip locked
  loop
    perform change_booking_status(r.id, 'EXPIRED', 'SYSTEM', null, 'Pending hold expired');
    v_count := v_count + 1;
  end loop;
  return v_count;
end;
$$;

-- ------------------------------------------------------------
-- blocked dates
-- ------------------------------------------------------------

create or replace function block_date(p_date date, p_reason text, p_actor uuid)
returns jsonb
language plpgsql
as $$
begin
  perform pg_advisory_xact_lock(hashtext('dpf-date-' || p_date::text));

  if exists (
    select 1 from booking_dates bd
      join bookings b on b.id = bd.booking_id
     where bd.event_date = p_date and bd.active and b.status in ('CONFIRMED','PENDING')
  ) then
    perform dpf_fail('BOOKING_CONFLICT', 'date_occupied');
  end if;

  insert into blocked_dates (blocked_date, reason, created_by)
  values (p_date, coalesce(left(p_reason, 200), ''), p_actor)
  on conflict (blocked_date) do update
    set reason = excluded.reason, updated_at = now();

  return jsonb_build_object('date', p_date, 'state', 'blocked');
end;
$$;

create or replace function unblock_date(p_date date)
returns jsonb
language plpgsql
as $$
begin
  delete from blocked_dates where blocked_date = p_date;
  return jsonb_build_object('date', p_date, 'state', 'available');
end;
$$;

-- ------------------------------------------------------------
-- dashboard aggregates (no full-table transfer to the browser)
-- ------------------------------------------------------------

create or replace function get_dashboard_stats()
returns jsonb
language sql
stable
as $$
  select jsonb_build_object(
    'pending', (select count(*) from bookings where status = 'PENDING'),
    'confirmed', (select count(*) from bookings where status = 'CONFIRMED'),
    'upcomingDays', (
      select count(*) from booking_dates bd join bookings b on b.id = bd.booking_id
       where bd.active and b.status = 'CONFIRMED' and bd.event_date >= dpf_business_today()
    ),
    'pipeline', (
      select coalesce(sum(total_price), 0) from bookings where status in ('PENDING','CONFIRMED')
    ),
    'confirmedRevenue', (
      select coalesce(sum(total_price), 0) from bookings where status = 'CONFIRMED'
    ),
    'clients', (select count(*) from clients),
    'trend', (
      select coalesce(jsonb_agg(row_to_json(t)), '[]'::jsonb) from (
        select to_char(m, 'Mon') as month,
               (select count(*) from bookings b
                 where date_trunc('month', b.created_at) = m) as requests,
               (select count(*) from bookings b
                 where date_trunc('month', b.created_at) = m and b.status = 'CONFIRMED') as confirmed
          from generate_series(date_trunc('month', now()) - interval '5 months',
                               date_trunc('month', now()), interval '1 month') m
         order by m
      ) t
    ),
    'serviceMix', (
      select coalesce(jsonb_agg(row_to_json(x)), '[]'::jsonb) from (
        select s.name as label,
               round(100.0 * count(b.id) / nullif((select count(*) from bookings), 0)) as value
          from services s join bookings b on b.service_id = s.id
         group by s.name
         order by count(b.id) desc
         limit 5
      ) x
    )
  );
$$;
