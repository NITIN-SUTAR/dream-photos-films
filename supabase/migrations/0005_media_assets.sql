-- ============================================================
-- MEDIA ASSETS
-- Safe for existing databases: creates missing tables/columns/indexes,
-- but does not drop data or overwrite production records.
-- ============================================================

create extension if not exists pgcrypto;

create table if not exists media_assets (
  id uuid primary key default gen_random_uuid(),
  bucket text not null default 'public-media',
  storage_path text not null,
  media_type text not null default 'IMAGE',
  mime_type text not null,
  file_size bigint not null default 0,
  width integer,
  height integer,
  duration_seconds numeric(10,2),
  status text not null default 'UPLOADING',
  original_name text not null default '',
  checksum text,
  failure_reason text,
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now()
);

create table if not exists media_variants (
  id uuid primary key default gen_random_uuid(),
  asset_id uuid not null,
  variant text not null,
  storage_path text not null,
  width integer,
  height integer,
  file_size bigint not null default 0,
  created_at timestamp with time zone not null default now()
);

alter table media_assets
  add column if not exists bucket text,
  add column if not exists storage_path text,
  add column if not exists media_type text,
  add column if not exists mime_type text,
  add column if not exists file_size bigint,
  add column if not exists width integer,
  add column if not exists height integer,
  add column if not exists duration_seconds numeric(10,2),
  add column if not exists status text,
  add column if not exists original_name text,
  add column if not exists checksum text,
  add column if not exists failure_reason text,
  add column if not exists created_at timestamp with time zone,
  add column if not exists updated_at timestamp with time zone;

alter table media_variants
  add column if not exists asset_id uuid,
  add column if not exists variant text,
  add column if not exists storage_path text,
  add column if not exists width integer,
  add column if not exists height integer,
  add column if not exists file_size bigint,
  add column if not exists created_at timestamp with time zone;

update media_assets
set bucket = 'public-media'
where bucket is null;

update media_assets
set storage_path = ''
where storage_path is null;

update media_assets
set media_type = 'IMAGE'
where media_type is null;

update media_assets
set mime_type = 'application/octet-stream'
where mime_type is null;

update media_assets
set file_size = 0
where file_size is null;

update media_assets
set status = 'UPLOADING'
where status is null;

update media_assets
set original_name = ''
where original_name is null;

update media_assets
set created_at = now()
where created_at is null;

update media_assets
set updated_at = now()
where updated_at is null;

update media_variants
set asset_id = media_assets.id
from media_assets
where media_variants.asset_id is null and media_variants.storage_path = media_assets.storage_path;

update media_variants
set variant = 'original'
where variant is null;

update media_variants
set storage_path = ''
where storage_path is null;

update media_variants
set file_size = 0
where file_size is null;

update media_variants
set created_at = now()
where created_at is null;

alter table media_assets
  alter column bucket set default 'public-media',
  alter column storage_path set not null,
  alter column media_type set default 'IMAGE',
  alter column mime_type set not null,
  alter column file_size set default 0,
  alter column status set default 'UPLOADING',
  alter column original_name set default '',
  alter column created_at set default now(),
  alter column updated_at set default now();

alter table media_variants
  alter column asset_id set not null,
  alter column variant set not null,
  alter column storage_path set not null,
  alter column file_size set default 0,
  alter column created_at set default now();

create unique index if not exists media_assets_path_key
  on media_assets (bucket, storage_path);

create unique index if not exists media_variants_unique
  on media_variants (asset_id, variant);

do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'media_assets_status_check'
  ) then
    alter table media_assets
      add constraint media_assets_status_check
      check (status in ('UPLOADING', 'PROCESSING', 'READY', 'FAILED'));
  end if;
end $$;

do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'media_assets_bucket_check'
  ) then
    alter table media_assets
      add constraint media_assets_bucket_check
      check (bucket in ('public-media', 'private-gallery', 'private-documents'));
  end if;
end $$;

do $$
begin
  if not exists (
    select 1
    from pg_constraint c
    join pg_class t on t.oid = c.conrelid
    where t.relname = 'media_variants' and c.conname = 'media_variants_asset_id_fkey'
  ) then
    alter table media_variants
      add constraint media_variants_asset_id_fkey
      foreign key (asset_id) references media_assets(id) on delete cascade;
  end if;
end $$;

create index if not exists media_assets_status_idx
  on media_assets (status);
