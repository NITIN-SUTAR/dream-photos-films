import type { ResponsiveImage } from "@/lib/types";

/**
 * Centralised image references. A real backend would return the same shape
 * (src + intrinsic width/height + alt), so nothing here is component-coupled.
 */
const BASE = "https://images.pexels.com/photos";

export function px(id: number, width: number, ratio: number): string {
  return `${BASE}/${id}/pexels-photo-${id}.jpeg?auto=compress&cs=tinysrgb&fit=crop&w=${width}&h=${Math.round(
    width / ratio,
  )}`;
}

function img(
  id: number,
  ratio: number,
  alt: string,
  width = 1200,
): ResponsiveImage {
  return {
    src: px(id, width, ratio),
    width,
    height: Math.round(width / ratio),
    alt,
    sizes: "(max-width: 768px) 100vw, (max-width: 1280px) 50vw, 40vw",
  };
}

export const IMG = {
  heroWide: img(
    27443997,
    16 / 9,
    "Couple dancing under warm lights at a night wedding reception",
    1800,
  ),
  heroPortrait: img(
    8325271,
    2 / 3,
    "Bride and groom embracing on a quiet shoreline at dusk",
    900,
  ),
  heroPanel: img(
    31580625,
    3 / 4,
    "Intimate outdoor engagement portrait in natural light",
    800,
  ),
  wedding1: img(
    37533096,
    3 / 2,
    "Joyful couple in traditional attire during a Hyderabad wedding",
    1400,
  ),
  wedding2: img(20518451, 3 / 2, "Couple celebrating outdoors after the rituals", 1200),
  wedding3: img(17657612, 3 / 2, "Newlyweds embracing during an outdoor ceremony", 1200),
  wedding4: img(12153956, 2 / 3, "Black and white portrait of a smiling married couple", 900),
  wedding5: img(31798270, 3 / 2, "Bride and groom reviewing their wedding photographs", 1200),
  preWedding1: img(37912248, 3 / 2, "Couple walking along the shore during golden hour", 1300),
  preWedding2: img(32060316, 2 / 3, "Couple in traditional attire photographed indoors", 900),
  event1: img(34755223, 3 / 2, "Festival crowd lit by warm string lights", 1300),
  event2: img(30554670, 3 / 2, "Street celebration with traditional musicians", 1200),
  event3: img(28914413, 3 / 2, "Young boy at a night festival lit by lanterns", 1200),
  event4: img(30318105, 3 / 2, "Guest in an orange turban at a cultural gathering", 1200),
  portrait1: img(37719871, 2 / 3, "Low key portrait of a woman in dramatic light", 900),
  portrait2: img(30403762, 3 / 2, "Black and white portrait with strong contrast", 1200),
  portrait3: img(36539100, 2 / 3, "Softly lit portrait of a woman smiling in darkness", 900),
  portrait4: img(12950669, 2 / 3, "Portrait of a woman looking upward into soft light", 900),
  portrait5: img(34766980, 2 / 3, "Editorial black and white portrait with outstretched hand", 900),
  portrait6: img(14180800, 3 / 2, "Contemplative portrait against a dark backdrop", 1200),
  editorial1: img(1038166, 3 / 2, "Profile portrait sculpted by cool blue light", 1300),
  editorial2: img(5383408, 3 / 2, "Portrait shaped by red and green studio gels", 1200),
  editorial3: img(7853666, 3 / 2, "Close portrait lit with dramatic red light", 1200),
  babyShower1: img(31236892, 3 / 2, "Joyful celebration with colour in the air", 1200),
  babyShower2: img(16125035, 3 / 2, "Family gathering during a colourful celebration", 1200),
  babyShower3: img(32851565, 2 / 3, "Candid moment inside a busy family celebration", 900),
  filmCrew: img(30396798, 16 / 9, "Film crew working with cinema camera equipment", 1500),
  filmSet: img(32610376, 16 / 9, "Cinema camera rigged on a film set", 1500),
  filmSilhouette: img(6728042, 16 / 9, "Silhouette of a filmmaker holding a camera", 1400),
  filmOperator: img(13811051, 16 / 9, "Camera operator filming outdoors", 1400),
  artist: img(38595057, 3 / 4, "Portrait of the studio's lead photographer", 900),
  lab: img(37719871, 3 / 4, "Studio portrait used for the virtual lighting demo", 1000),
  compare: img(31580625, 3 / 2, "Outdoor couple portrait used for raw versus edited comparison", 1500),
} satisfies Record<string, ResponsiveImage>;

export const VIDEOS = {
  studioSetup:
    "https://videos.pexels.com/video-files/31916297/13595529_3840_2160_60fps.mp4",
  cameraRig:
    "https://videos.pexels.com/video-files/37903859/16082177_4096_2160_30fps.mp4",
  interview:
    "https://videos.pexels.com/video-files/39077567/16628166_3840_2160_24fps.mp4",
  operator:
    "https://videos.pexels.com/video-files/38492076/16347230_4096_2160_30fps.mp4",
};
