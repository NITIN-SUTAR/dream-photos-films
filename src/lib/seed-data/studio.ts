import type {
  ActivityEntry,
  AvailabilityDay,
  Booking,
  Client,
  DayState,
  KpiStat,
  StudioSettings,
} from "@/lib/types";

/* ------------------------------------------------------------------ */
/* date helpers (pure, deterministic)                                  */
/* ------------------------------------------------------------------ */

export function toISO(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(
    d.getDate(),
  ).padStart(2, "0")}`;
}

export function addDays(iso: string, days: number): string {
  const [y, m, d] = iso.split("-").map(Number);
  const dt = new Date(y, m - 1, d + days);
  return toISO(dt);
}

/** Reference "today" — a single source of truth for all mock data. */
export const TODAY = toISO(new Date());

function hash(str: string): number {
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return Math.abs(h);
}

/* ------------------------------------------------------------------ */
/* availability                                                        */
/* ------------------------------------------------------------------ */

const CONFIRMED_OFFSETS = [6, 7, 8, 19, 26, 41, 54, 55, 72];
const PENDING_OFFSETS = [12, 13, 30, 47, 63];
const BLOCKED_OFFSETS = [3, 4, 22, 38, 58, 80];

const availabilityMap = new Map<string, AvailabilityDay>();

function seedAvailability() {
  if (availabilityMap.size) return;
  CONFIRMED_OFFSETS.forEach((o, i) => {
    const date = addDays(TODAY, o);
    availabilityMap.set(date, {
      date,
      state: "confirmed",
      label: ["Wedding — Deshpande", "Event — Bhosale", "Wedding — Patel"][i % 3],
      bookingNumber: `DPF-25${(1042 + i).toString()}`,
    });
  });
  PENDING_OFFSETS.forEach((o, i) => {
    const date = addDays(TODAY, o);
    availabilityMap.set(date, {
      date,
      state: "pending",
      label: "Awaiting confirmation",
      bookingNumber: `DPF-25${(2070 + i).toString()}`,
    });
  });
  BLOCKED_OFFSETS.forEach((o, i) => {
    const date = addDays(TODAY, o);
    availabilityMap.set(date, {
      date,
      state: "blocked",
      label: ["Studio maintenance", "Team leave", "Personal"][i % 3],
    });
  });
}
seedAvailability();

export function getDayState(iso: string): DayState {
  seedAvailability();
  const entry = availabilityMap.get(iso);
  if (entry) return entry.state;
  // deterministic scattering of a few legacy booked days for realism
  if (iso < TODAY) return hash(iso) % 5 === 0 ? "confirmed" : "available";
  return "available";
}

export function getDay(iso: string): AvailabilityDay {
  seedAvailability();
  return availabilityMap.get(iso) ?? { date: iso, state: getDayState(iso) };
}

export function listAvailability(): AvailabilityDay[] {
  seedAvailability();
  return [...availabilityMap.values()].sort((a, b) => a.date.localeCompare(b.date));
}

/* ------------------------------------------------------------------ */
/* bookings                                                            */
/* ------------------------------------------------------------------ */

export const BOOKINGS: Booking[] = [
  {
    bookingNumber: "DPF-251042",
    clientId: "cl-01",
    clientName: "Meera Deshpande",
    phone: "+91 98204 41201",
    email: "meera.deshpande@example.com",
    district: "Nashik",
    city: "Gangapur Road, Nashik",
    serviceId: "svc-wedding",
    serviceName: "Wedding Photography & Films",
    packageId: "pkg-03",
    packageName: "PACKAGE 03 — Cinematic Wedding",
    album: true,
    dates: [addDays(TODAY, 6), addDays(TODAY, 7), addDays(TODAY, 8)],
    extras: [
      { id: "ext-drone", name: "Drone Cinematography", price: 9000 },
      { id: "ext-teaser", name: "Same-Day Teaser Edit", price: 8000 },
    ],
    baseAmount: 65000,
    extrasAmount: 17000,
    estimate: 82000,
    status: "CONFIRMED",
    notes:
      "Three-day coverage. Haldi at home, wedding at Gondeshwar Grounds, reception at the club.",
    budget: "₹75,000 – ₹1,20,000",
    createdAt: addDays(TODAY, -21),
    timeline: [
      { id: "t1", label: "Request submitted", at: addDays(TODAY, -21), state: "CREATED" },
      { id: "t2", label: "Studio reviewed the request", at: addDays(TODAY, -20), state: "REVIEWED" },
      {
        id: "t3",
        label: "Booking confirmed",
        at: addDays(TODAY, -19),
        state: "CONFIRMED",
        note: "Dates locked for the studio calendar.",
      },
    ],
  },
  {
    bookingNumber: "DPF-252070",
    clientId: "cl-02",
    clientName: "Ritika Shah",
    phone: "+91 99133 88210",
    email: "ritika.shah@example.com",
    district: "Ahmedabad",
    city: "Bodakdev, Ahmedabad",
    serviceId: "svc-prewedding",
    serviceName: "Pre-Wedding Photography",
    album: false,
    dates: [addDays(TODAY, 12), addDays(TODAY, 13)],
    extras: [{ id: "ext-gallery", name: "Private Online Gallery — 12 months", price: 2500 }],
    baseAmount: 40000,
    extrasAmount: 2500,
    estimate: 42500,
    status: "PENDING",
    notes: "Two locations — old city rooftop and a coastal stretch near Dandi.",
    budget: "₹40,000 – ₹75,000",
    createdAt: addDays(TODAY, -3),
    timeline: [
      { id: "t1", label: "Request submitted", at: addDays(TODAY, -3), state: "CREATED" },
      {
        id: "t2",
        label: "Awaiting studio review",
        at: addDays(TODAY, -2),
        state: "PENDING",
        note: "Typical response time is under 24 hours.",
      },
    ],
  },
  {
    bookingNumber: "DPF-252071",
    clientId: "cl-03",
    clientName: "Kunal Bhosale",
    phone: "+91 90284 11733",
    email: "kunal.b@example.com",
    district: "Pune",
    city: "Kalyani Nagar, Pune",
    serviceId: "svc-event",
    serviceName: "Event Photography",
    album: false,
    dates: [addDays(TODAY, 19)],
    extras: [{ id: "ext-extra-shooter", name: "Additional Photographer", price: 6500 }],
    baseAmount: 15000,
    extrasAmount: 6500,
    estimate: 21500,
    status: "CONFIRMED",
    notes: "Corporate annual evening, 5pm to 11pm, indoor low light.",
    budget: "Under ₹40,000",
    createdAt: addDays(TODAY, -11),
    timeline: [
      { id: "t1", label: "Request submitted", at: addDays(TODAY, -11), state: "CREATED" },
      { id: "t2", label: "Booking confirmed", at: addDays(TODAY, -9), state: "CONFIRMED" },
    ],
  },
  {
    bookingNumber: "DPF-252072",
    clientId: "cl-04",
    clientName: "Ananya Iyer",
    phone: "+91 98675 20119",
    email: "ananya.iyer@example.com",
    district: "Mumbai Suburban",
    city: "Bandra West, Mumbai",
    serviceId: "svc-portrait",
    serviceName: "Portrait Photography",
    album: false,
    dates: [addDays(TODAY, 30)],
    extras: [],
    baseAmount: 8000,
    extrasAmount: 0,
    estimate: 8000,
    status: "PENDING",
    notes: "Professional headshots, neutral backdrop, needs files within a week.",
    budget: "Under ₹40,000",
    createdAt: addDays(TODAY, -1),
    timeline: [
      { id: "t1", label: "Request submitted", at: addDays(TODAY, -1), state: "CREATED" },
    ],
  },
  {
    bookingNumber: "DPF-251038",
    clientId: "cl-05",
    clientName: "Parth Patel",
    phone: "+91 97129 55840",
    email: "parth.patel@example.com",
    district: "Surat",
    city: "Vesu, Surat",
    serviceId: "svc-wedding",
    serviceName: "Wedding Photography & Films",
    packageId: "pkg-02",
    packageName: "PACKAGE 02 — Candid Wedding",
    album: true,
    dates: [addDays(TODAY, -30), addDays(TODAY, -29)],
    extras: [{ id: "ext-album-parent", name: "Parent Album Duplicate", price: 7000 }],
    baseAmount: 50000,
    extrasAmount: 7000,
    estimate: 57000,
    status: "CONFIRMED",
    notes: "Delivered. Album in production.",
    budget: "₹40,000 – ₹75,000",
    createdAt: addDays(TODAY, -74),
    timeline: [
      { id: "t1", label: "Request submitted", at: addDays(TODAY, -74), state: "CREATED" },
      { id: "t2", label: "Booking confirmed", at: addDays(TODAY, -71), state: "CONFIRMED" },
    ],
  },
  {
    bookingNumber: "DPF-252060",
    clientId: "cl-06",
    clientName: "Sana Qureshi",
    phone: "+91 88793 10022",
    email: "sana.q@example.com",
    district: "Thane",
    city: "Ghodbunder Road, Thane",
    serviceId: "svc-baby",
    serviceName: "Baby Shower Coverage",
    album: false,
    dates: [addDays(TODAY, -6)],
    extras: [],
    baseAmount: 12000,
    extrasAmount: 0,
    estimate: 12000,
    status: "CANCELLED",
    notes: "Client postponed the function; asked to re-book next quarter.",
    budget: "Under ₹40,000",
    createdAt: addDays(TODAY, -34),
    timeline: [
      { id: "t1", label: "Request submitted", at: addDays(TODAY, -34), state: "CREATED" },
      { id: "t2", label: "Booking confirmed", at: addDays(TODAY, -31), state: "CONFIRMED" },
      {
        id: "t3",
        label: "Cancelled by client",
        at: addDays(TODAY, -12),
        state: "CANCELLED",
        note: "Dates released back to the calendar.",
      },
    ],
  },
  {
    bookingNumber: "DPF-252055",
    clientId: "cl-07",
    clientName: "Rohan Mehta",
    phone: "+91 90999 74510",
    email: "rohan.mehta@example.com",
    district: "Vadodara",
    city: "Alkapuri, Vadodara",
    serviceId: "svc-short-film",
    serviceName: "Short Cinematic Films",
    album: false,
    dates: [addDays(TODAY, -20)],
    extras: [],
    baseAmount: 35000,
    extrasAmount: 0,
    estimate: 35000,
    status: "REJECTED",
    notes: "Requested date clashed with an existing three-day wedding block.",
    budget: "₹40,000 – ₹75,000",
    createdAt: addDays(TODAY, -40),
    timeline: [
      { id: "t1", label: "Request submitted", at: addDays(TODAY, -40), state: "CREATED" },
      {
        id: "t2",
        label: "Unable to accept",
        at: addDays(TODAY, -38),
        state: "REJECTED",
        note: "Crew unavailable for the requested window.",
      },
    ],
  },
  {
    bookingNumber: "DPF-252041",
    clientId: "cl-08",
    clientName: "Neha Kulkarni",
    phone: "+91 93261 40077",
    email: "neha.k@example.com",
    district: "Kolhapur",
    city: "Rajarampuri, Kolhapur",
    serviceId: "svc-event",
    serviceName: "Event Photography",
    album: false,
    dates: [addDays(TODAY, -55)],
    extras: [],
    baseAmount: 15000,
    extrasAmount: 0,
    estimate: 15000,
    status: "EXPIRED",
    notes: "No response received within the hold window.",
    budget: "Under ₹40,000",
    createdAt: addDays(TODAY, -70),
    timeline: [
      { id: "t1", label: "Request submitted", at: addDays(TODAY, -70), state: "CREATED" },
      {
        id: "t2",
        label: "Request expired",
        at: addDays(TODAY, -60),
        state: "EXPIRED",
        note: "Hold released automatically after 10 days.",
      },
    ],
  },
];

/* ------------------------------------------------------------------ */
/* clients                                                             */
/* ------------------------------------------------------------------ */

export const CLIENTS: Client[] = [
  {
    id: "cl-01",
    name: "Meera Deshpande",
    phone: "+91 98204 41201",
    email: "meera.deshpande@example.com",
    district: "Nashik",
    city: "Gangapur Road, Nashik",
    bookingCount: 2,
    latestBooking: "DPF-251042",
    lifetimeValue: 124000,
    tags: ["Wedding", "Repeat"],
    notes: "Prefers warm grading. Family album to be shipped to Pune address.",
    activity: [
      { id: "a1", label: "Booking confirmed — DPF-251042", at: addDays(TODAY, -19) },
      { id: "a2", label: "Gallery shared — Meera & Aarav", at: addDays(TODAY, -4) },
    ],
  },
  {
    id: "cl-02",
    name: "Ritika Shah",
    phone: "+91 99133 88210",
    email: "ritika.shah@example.com",
    district: "Ahmedabad",
    city: "Bodakdev, Ahmedabad",
    bookingCount: 1,
    latestBooking: "DPF-252070",
    lifetimeValue: 42500,
    tags: ["Pre-Wedding"],
    notes: "Asked for a 60s vertical reel alongside the stills.",
    activity: [{ id: "a1", label: "Request submitted — DPF-252070", at: addDays(TODAY, -3) }],
  },
  {
    id: "cl-03",
    name: "Kunal Bhosale",
    phone: "+91 90284 11733",
    email: "kunal.b@example.com",
    district: "Pune",
    city: "Kalyani Nagar, Pune",
    bookingCount: 3,
    latestBooking: "DPF-252071",
    lifetimeValue: 64500,
    tags: ["Corporate", "Repeat"],
    notes: "Books the same annual evening every year. Invoice to company GST.",
    activity: [
      { id: "a1", label: "Booking confirmed — DPF-252071", at: addDays(TODAY, -9) },
      { id: "a2", label: "Added additional photographer", at: addDays(TODAY, -9) },
    ],
  },
  {
    id: "cl-04",
    name: "Ananya Iyer",
    phone: "+91 98675 20119",
    email: "ananya.iyer@example.com",
    district: "Mumbai Suburban",
    city: "Bandra West, Mumbai",
    bookingCount: 1,
    latestBooking: "DPF-252072",
    lifetimeValue: 8000,
    tags: ["Portrait"],
    notes: "Needs quick turnaround for a magazine feature.",
    activity: [{ id: "a1", label: "Request submitted — DPF-252072", at: addDays(TODAY, -1) }],
  },
  {
    id: "cl-05",
    name: "Parth Patel",
    phone: "+91 97129 55840",
    email: "parth.patel@example.com",
    district: "Surat",
    city: "Vesu, Surat",
    bookingCount: 2,
    latestBooking: "DPF-251038",
    lifetimeValue: 57000,
    tags: ["Wedding"],
    notes: "Parent albums ordered — 2 copies, matte cover.",
    activity: [{ id: "a1", label: "Album sent to production", at: addDays(TODAY, -14) }],
  },
  {
    id: "cl-06",
    name: "Sana Qureshi",
    phone: "+91 88793 10022",
    email: "sana.q@example.com",
    district: "Thane",
    city: "Ghodbunder Road, Thane",
    bookingCount: 1,
    latestBooking: "DPF-252060",
    lifetimeValue: 0,
    tags: ["Baby Shower", "Follow up"],
    notes: "Postponed. Re-contact in the next quarter.",
    activity: [{ id: "a1", label: "Booking cancelled — DPF-252060", at: addDays(TODAY, -12) }],
  },
  {
    id: "cl-07",
    name: "Rohan Mehta",
    phone: "+91 90999 74510",
    email: "rohan.mehta@example.com",
    district: "Vadodara",
    city: "Alkapuri, Vadodara",
    bookingCount: 1,
    latestBooking: "DPF-252055",
    lifetimeValue: 0,
    tags: ["Films"],
    notes: "Interested in a brand film later this year.",
    activity: [{ id: "a1", label: "Request declined — DPF-252055", at: addDays(TODAY, -38) }],
  },
  {
    id: "cl-08",
    name: "Neha Kulkarni",
    phone: "+91 93261 40077",
    email: "neha.k@example.com",
    district: "Kolhapur",
    city: "Rajarampuri, Kolhapur",
    bookingCount: 1,
    latestBooking: "DPF-252041",
    lifetimeValue: 0,
    tags: ["Events"],
    notes: "Never responded to the hold reminder.",
    activity: [{ id: "a1", label: "Request expired — DPF-252041", at: addDays(TODAY, -60) }],
  },
];

/* ------------------------------------------------------------------ */
/* dashboard                                                           */
/* ------------------------------------------------------------------ */

export const KPIS: KpiStat[] = [
  { id: "k1", label: "Pending requests", value: "2", delta: 100, hint: "Awaiting your review" },
  { id: "k2", label: "Confirmed bookings", value: "3", delta: 20, hint: "Next 90 days" },
  { id: "k3", label: "Upcoming event days", value: "6", delta: 12, hint: "Across 3 bookings" },
  {
    id: "k4",
    label: "Estimated pipeline",
    value: "₹1,54,000",
    delta: 18,
    hint: "Confirmed + pending estimates",
  },
];

export const BOOKING_TREND: { month: string; requests: number; confirmed: number }[] = [
  { month: "Sep", requests: 9, confirmed: 5 },
  { month: "Oct", requests: 14, confirmed: 9 },
  { month: "Nov", requests: 18, confirmed: 12 },
  { month: "Dec", requests: 22, confirmed: 15 },
  { month: "Jan", requests: 16, confirmed: 11 },
  { month: "Feb", requests: 21, confirmed: 14 },
];

export const SERVICE_MIX: { label: string; value: number }[] = [
  { label: "Wedding", value: 46 },
  { label: "Pre-Wedding", value: 21 },
  { label: "Events", value: 18 },
  { label: "Portrait", value: 9 },
  { label: "Other", value: 6 },
];

export const ACTIVITY: ActivityEntry[] = [
  {
    id: "ac-1",
    type: "booking",
    label: "New request from Ananya Iyer",
    meta: "Portrait Photography · DPF-252072",
    at: addDays(TODAY, -1),
  },
  {
    id: "ac-2",
    type: "media",
    label: "12 photographs published to Meera & Aarav gallery",
    meta: "Client gallery",
    at: addDays(TODAY, -4),
  },
  {
    id: "ac-3",
    type: "booking",
    label: "Request from Ritika Shah awaiting review",
    meta: "Pre-Wedding · DPF-252070",
    at: addDays(TODAY, -3),
  },
  {
    id: "ac-4",
    type: "client",
    label: "Kunal Bhosale added an extra photographer",
    meta: "Event Photography · DPF-252071",
    at: addDays(TODAY, -9),
  },
  {
    id: "ac-5",
    type: "system",
    label: "6 dates blocked for studio maintenance",
    meta: "Calendar",
    at: addDays(TODAY, -10),
  },
];

export const SETTINGS: StudioSettings = {
  studioName: "DREAM PHOTO'S & FILM'S",
  tagline: "Photography and films made like cinema.",
  phone: "+91 98765 43210",
  whatsapp: "+91 98765 43210",
  email: "studio@dreamphotosfilms.in",
  address: "Unit 4, Panch Pakhadi, Thane West",
  city: "Thane, Maharashtra 400602",
  instagram: "https://instagram.com/dreamphotosfilms",
  youtube: "https://youtube.com/@dreamphotosfilms",
  facebook: "https://facebook.com/dreamphotosfilms",
  timezone: "Asia/Kolkata (IST, UTC+5:30)",
  leadTimeDays: 3,
  maxBookingDays: 5,
  autoExpireDays: 10,
  allowMultiDay: true,
  showPricesPublicly: true,
  maintenanceMode: false,
  watermark: true,
  maxUploadMb: 25,
  imageQuality: "High",
};
