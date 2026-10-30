/**
 * Brand art-direction constants (not business data).
 * Editorial imagery and studio story used by the hero, about and lab sections.
 */
export interface BrandImage {
  src: string;
  width: number;
  height: number;
  alt: string;
}

const BASE = "https://images.pexels.com/photos";
function img(id: number, width: number, ratio: number, alt: string): BrandImage {
  const height = Math.round(width / ratio);
  return {
    src: `${BASE}/${id}/pexels-photo-${id}.jpeg?auto=compress&cs=tinysrgb&fit=crop&w=${width}&h=${height}`,
    width,
    height,
    alt,
  };
}

export const BRAND_IMAGES = {
  heroWide: img(27443997, 1800, 16 / 9, "Couple dancing under warm lights at a night wedding reception"),
  heroPortrait: img(8325271, 900, 2 / 3, "Bride and groom embracing on a quiet shoreline at dusk"),
  heroPanel: img(31580625, 800, 3 / 4, "Intimate outdoor engagement portrait in natural light"),
  compare: img(31580625, 1500, 3 / 2, "Outdoor couple portrait used for the raw versus edited comparison"),
  lab: img(37719871, 1000, 3 / 4, "Studio portrait used to demonstrate lighting changes"),
  artist: img(38595057, 900, 3 / 4, "Portrait of the studio's lead photographer"),
  ctaBackdrop: img(17657612, 1600, 3 / 2, "Newlyweds embracing during an outdoor ceremony"),
  notFound: img(30403762, 1400, 3 / 2, "Dramatic black and white portrait"),
  adminBackdrop: img(30396798, 1500, 16 / 9, "Film crew working with cinema camera equipment"),
};

export const ARTIST = {
  name: "Dev Rathod",
  role: "Founder · Lead Photographer & Director",
  since: 2014,
  weddings: 240,
  films: 96,
  cities: 31,
  portrait: BRAND_IMAGES.artist,
  story: [
    "I started with a borrowed film body and a single 50mm lens, photographing family weddings in Kutch because nobody else would do it for free. Eleven years later the studio runs two photography units and a full film crew — but the approach has not changed.",
    "I do not direct moments. I position myself for them. The job is to be close enough to feel the room and invisible enough that the room forgets us.",
  ],
  philosophy: [
    {
      label: "Photography",
      text: "Light first, composition second, everything else after. A frame should survive being printed at two metres and still reward you up close.",
    },
    {
      label: "Filmmaking",
      text: "We shoot for the edit. Coverage, sound and pacing are planned before the first setup, so the film has a spine and not just pretty shots.",
    },
    {
      label: "Editing",
      text: "Every image is graded by hand in the studio. No presets applied in bulk, no plastic skin, no clipped blacks. Colour is part of the storytelling.",
    },
  ],
};

export const DISTRICTS = [
  "Mumbai Suburban",
  "Mumbai City",
  "Thane",
  "Pune",
  "Nashik",
  "Nagpur",
  "Aurangabad",
  "Kolhapur",
  "Solapur",
  "Ratnagiri",
  "Ahmedabad",
  "Surat",
  "Vadodara",
  "Rajkot",
  "Bhavnagar",
  "Jamnagar",
  "Gandhinagar",
  "Bhuj — Kutch",
];

export const BUDGET_BANDS = [
  "Under ₹40,000",
  "₹40,000 – ₹75,000",
  "₹75,000 – ₹1,20,000",
  "₹1,20,000 – ₹2,00,000",
  "Above ₹2,00,000",
];

export const PORTFOLIO_CATEGORIES = [
  "Wedding",
  "Pre-Wedding",
  "Events",
  "Portrait",
  "Baby Shower",
  "Editorial",
] as const;

export const FILM_CATEGORIES = [
  "Wedding Films",
  "Pre-Wedding Films",
  "Event Films",
  "Short Cinematic Films",
] as const;
