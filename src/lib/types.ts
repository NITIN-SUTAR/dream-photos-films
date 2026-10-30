/**
 * Shared domain types for DREAM PHOTO'S & FILM'S.
 * These mirror the shapes a future backend would return, so mock data can be
 * swapped for real API responses without touching presentation components.
 */

export type PortfolioCategory =
  | "Wedding"
  | "Pre-Wedding"
  | "Events"
  | "Portrait"
  | "Baby Shower"
  | "Editorial";

export type FilmCategory =
  | "Wedding Films"
  | "Pre-Wedding Films"
  | "Event Films"
  | "Short Cinematic Films";

export interface ResponsiveImage {
  src: string;
  width: number;
  height: number;
  alt: string;
  /** sizes attribute hint for responsive loading */
  sizes?: string;
}

export interface PortfolioItem {
  id: string;
  title: string;
  category: PortfolioCategory;
  description: string;
  image: ResponsiveImage;
  featured: boolean;
  order: number;
  active: boolean;
  createdAt: string;
  updatedAt: string;
  location?: string;
  year?: number;
}

export interface FilmItem {
  id: string;
  title: string;
  category: FilmCategory;
  description: string;
  video: string;
  poster: ResponsiveImage;
  duration: string;
  featured: boolean;
  active: boolean;
  order: number;
}

export interface Service {
  id: string;
  name: string;
  slug: string;
  description: string;
  price: number;
  priceNote: string;
  category: "Signature" | "Add-on";
  details: string[];
  active: boolean;
  order: number;
  image?: ResponsiveImage;
}

export interface PackageAlbumPricing {
  withAlbum: number;
  withoutAlbum: number;
}

export interface PackageItem {
  id: string;
  code: string;
  name: string;
  serviceId: string;
  description: string;
  inclusions: string[];
  pricing: PackageAlbumPricing;
  active: boolean;
  order: number;
  highlight?: string;
}

export interface ExtraItem {
  id: string;
  name: string;
  description: string;
  price: number;
  unit?: string;
  appliesTo: string[];
  group: "Albums" | "Digital Deliverables" | "Additional Services";
  active: boolean;
  order: number;
}

export interface Testimonial {
  id: string;
  name: string;
  quote: string;
  event: string;
  location: string;
  rating: number;
  image?: ResponsiveImage;
  featured: boolean;
  active: boolean;
  order: number;
}

export type BookingStatus =
  | "PENDING"
  | "CONFIRMED"
  | "REJECTED"
  | "CANCELLED"
  | "EXPIRED";

export interface BookingTimelineEntry {
  id: string;
  label: string;
  at: string;
  note?: string;
  state: BookingStatus | "CREATED" | "REVIEWED";
}

export interface BookingExtraLine {
  id: string;
  name: string;
  price: number;
}

export interface Booking {
  bookingNumber: string;
  clientId: string;
  clientName: string;
  phone: string;
  email: string;
  district: string;
  city: string;
  serviceId: string;
  serviceName: string;
  packageId?: string;
  packageName?: string;
  album: boolean;
  dates: string[];
  extras: BookingExtraLine[];
  baseAmount: number;
  extrasAmount: number;
  estimate: number;
  status: BookingStatus;
  notes: string;
  budget: string;
  createdAt: string;
  timeline: BookingTimelineEntry[];
}

export interface Client {
  id: string;
  name: string;
  phone: string;
  email: string;
  district: string;
  city: string;
  bookingCount: number;
  latestBooking: string;
  lifetimeValue: number;
  tags: string[];
  notes: string;
  activity: { id: string; label: string; at: string }[];
}

export type DayState = "available" | "pending" | "confirmed" | "blocked";

export interface AvailabilityDay {
  date: string;
  state: DayState;
  label?: string;
  bookingNumber?: string;
}

export interface GalleryPhoto {
  id: string;
  image: ResponsiveImage;
  order: number;
  active: boolean;
}

export interface GalleryAlbum {
  id: string;
  slug: string;
  title: string;
  client: string;
  event: string;
  date: string;
  location: string;
  cover: ResponsiveImage;
  photos: GalleryPhoto[];
  active: boolean;
}

export interface ActivityEntry {
  id: string;
  type: "booking" | "client" | "media" | "system";
  label: string;
  meta: string;
  at: string;
}

export interface KpiStat {
  id: string;
  label: string;
  value: string;
  delta: number;
  hint: string;
}

export interface StudioSettings {
  studioName: string;
  tagline: string;
  phone: string;
  whatsapp: string;
  email: string;
  address: string;
  city: string;
  instagram: string;
  youtube: string;
  facebook: string;
  timezone: string;
  leadTimeDays: number;
  maxBookingDays: number;
  autoExpireDays: number;
  allowMultiDay: boolean;
  showPricesPublicly: boolean;
  maintenanceMode: boolean;
  watermark: boolean;
  maxUploadMb: number;
  imageQuality: "Balanced" | "High" | "Maximum";
}
