import { PhotoItem, ServicePackage, GearItem, Testimonial } from '../types';

export const PORTFOLIO_PHOTOS: PhotoItem[] = [
  {
    id: 'photo-1',
    title: 'Neon Odyssey',
    category: 'editorial',
    categoryLabel: 'Editorial & Fashion',
    image: 'https://images.pexels.com/photos/38149408/pexels-photo-38149408.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=1200&w=1600',
    rawImage: 'https://images.pexels.com/photos/38149408/pexels-photo-38149408.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=800&w=1200&sat=-60&exp=-1',
    featured: true,
    aspectRatio: 'landscape',
    exif: {
      camera: 'Hasselblad H6D-100c',
      lens: 'HC 100mm f/2.2',
      focalLength: '100mm',
      aperture: 'f/2.2',
      shutterSpeed: '1/250s',
      iso: 'ISO 64',
      lighting: 'Aputure 600c Pro + Nanlite RGB Tubes',
      location: 'Shinjuku, Tokyo',
      year: '2025',
      coordinates: '35.6938° N, 139.7034° E'
    },
    description: 'A striking editorial exploration of crimson luminescence and shadow play in midnight Tokyo.',
    colorPalette: ['#11050a', '#610a13', '#c71f28', '#f8585e', '#fce2e5'],
    likes: 842,
    story: 'Captured during an overcast midnight in Tokyo for Vogue Japan. We sculpted the light using custom LED diffraction gel panels to achieve hyper-saturated red light spill without blowing out skin texture.'
  },
  {
    id: 'photo-2',
    title: 'Monolith in the Void',
    category: 'architecture',
    categoryLabel: 'Cyber Architecture',
    image: 'https://images.unsplash.com/photo-1513694203232-719a280e022f?auto=format&fit=crop&w=1600&q=80',
    rawImage: 'https://images.unsplash.com/photo-1513694203232-719a280e022f?auto=format&fit=crop&w=1200&q=60',
    featured: true,
    aspectRatio: 'portrait',
    exif: {
      camera: 'Leica SL2',
      lens: 'Super-Vario-Elmar-SL 16-35mm f/3.5-4.5',
      focalLength: '21mm',
      aperture: 'f/8.0',
      shutterSpeed: '1/125s',
      iso: 'ISO 100',
      lighting: 'Natural Dusk Skylight + Archway Accents',
      location: 'Reykjavik, Iceland',
      year: '2024',
      coordinates: '64.1466° N, 21.9426° W'
    },
    description: 'Brutalist glass and titanium geometry emerging from sub-zero dusk fog.',
    colorPalette: ['#0a0e17', '#1c2836', '#3b5266', '#7fa0b5', '#d4e6f1'],
    likes: 620,
    story: 'Commissioned by Architectural Digest. The challenge was maintaining razor-sharp geometric convergence across extreme tilt angles while capturing ambient twilight hues.'
  },
  {
    id: 'photo-3',
    title: 'The Solitary Horizon',
    category: 'landscapes',
    categoryLabel: 'Cinematic Landscapes',
    image: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=1600&q=80',
    rawImage: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=1200&q=60',
    featured: false,
    aspectRatio: 'landscape',
    exif: {
      camera: 'Sony Alpha 1',
      lens: 'FE 24-70mm f/2.8 GM II',
      focalLength: '35mm',
      aperture: 'f/5.6',
      shutterSpeed: '1/500s',
      iso: 'ISO 100',
      lighting: 'Golden Hour Alpenglow',
      location: 'Yosemite National Park, CA',
      year: '2024',
      coordinates: '37.8651° N, 119.5383° W'
    },
    description: 'Ethereal mist sweeping over granite peaks during golden alpenglow.',
    colorPalette: ['#12110f', '#3d2e1e', '#8c603b', '#d99752', '#fce5ba'],
    likes: 1250,
    story: 'Shot after a 4-hour midnight hike up Glacier Point. We caught 8 minutes of pristine morning fog reflecting early sunbursts through the granite valley.'
  },
  {
    id: 'photo-4',
    title: 'Crimson Velvet',
    category: 'portraits',
    categoryLabel: 'Fine Art Portraits',
    image: 'https://images.pexels.com/photos/7277907/pexels-photo-7277907.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=1200&w=1600',
    rawImage: 'https://images.pexels.com/photos/7277907/pexels-photo-7277907.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=800&w=1200',
    featured: true,
    aspectRatio: 'portrait',
    exif: {
      camera: 'Hasselblad H6D-100c',
      lens: 'HC 120mm f/4 Macro',
      focalLength: '120mm',
      aperture: 'f/4.0',
      shutterSpeed: '1/160s',
      iso: 'ISO 64',
      lighting: 'Profoto Pro-11 Strobe + Softbox',
      location: 'Milan Studio, Italy',
      year: '2025',
      coordinates: '45.4642° N, 9.1900° E'
    },
    description: 'Intimate studio portrait exploring dramatic shadow falloff and high-contrast emotional depth.',
    colorPalette: ['#090305', '#400914', '#8c1a2d', '#e03d52', '#f9c5cd'],
    likes: 980,
    story: 'Created for an international fine art exhibition in Milan. Shot with single-source Rembrandt lighting through custom silk scrims.'
  },
  {
    id: 'photo-5',
    title: 'Aero Dynamic Cyber',
    category: 'luxury',
    categoryLabel: 'Luxury & Automotive',
    image: 'https://images.unsplash.com/photo-1617814076367-b759c7d7e738?auto=format&fit=crop&w=1600&q=80',
    rawImage: 'https://images.unsplash.com/photo-1617814076367-b759c7d7e738?auto=format&fit=crop&w=1200&q=60',
    featured: false,
    aspectRatio: 'landscape',
    exif: {
      camera: 'Sony Alpha 1',
      lens: 'FE 50mm f/1.2 GM',
      focalLength: '50mm',
      aperture: 'f/1.4',
      shutterSpeed: '1/1000s',
      iso: 'ISO 100',
      lighting: 'Light Painting Rig + Studio Strobes',
      location: 'Dubai Marina Studio',
      year: '2024',
      coordinates: '25.0772° N, 55.1330° E'
    },
    description: 'High-speed hypercar aesthetic lit with precision optical light tubes in dusk reflection.',
    colorPalette: ['#040810', '#102035', '#254b73', '#498bbb', '#b6e2fe'],
    likes: 1105,
    story: 'Special commercial campaign for a luxury hypercar launch in Dubai. Utilizing long exposure rim tracing combined with instant laser pulse firing.'
  },
  {
    id: 'photo-6',
    title: 'Shadow & Silhouette',
    category: 'portraits',
    categoryLabel: 'Fine Art Portraits',
    image: 'https://images.pexels.com/photos/19615558/pexels-photo-19615558.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=1200&w=1600',
    rawImage: 'https://images.pexels.com/photos/19615558/pexels-photo-19615558.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=800&w=1200',
    featured: false,
    aspectRatio: 'square',
    exif: {
      camera: 'Leica SL2',
      lens: 'Summilux-M 35mm f/1.4 ASPH',
      focalLength: '35mm',
      aperture: 'f/1.4',
      shutterSpeed: '1/500s',
      iso: 'ISO 200',
      lighting: 'Window Chiaroscuro Daylight',
      location: 'Berlin, Germany',
      year: '2024',
      coordinates: '52.5200° N, 13.4050° E'
    },
    description: 'Chiaroscuro study of light breaking through a narrow doorway in monochrome tones.',
    colorPalette: ['#050505', '#1e1e1e', '#4f4f4f', '#9a9a9a', '#e6e6e6'],
    likes: 710,
    story: 'Spontaneous candid capture during a gallery install in Berlin. Pure ambient sunlight passing through antique timber shutters.'
  },
  {
    id: 'photo-7',
    title: 'Vogue Cybernetic',
    category: 'editorial',
    categoryLabel: 'Editorial & Fashion',
    image: 'https://images.pexels.com/photos/15474266/pexels-photo-15474266.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=1200&w=1600',
    rawImage: 'https://images.pexels.com/photos/15474266/pexels-photo-15474266.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=800&w=1200',
    featured: false,
    aspectRatio: 'portrait',
    exif: {
      camera: 'Hasselblad H6D-100c',
      lens: 'HC 80mm f/2.8',
      focalLength: '80mm',
      aperture: 'f/2.8',
      shutterSpeed: '1/320s',
      iso: 'ISO 100',
      lighting: 'Dual RGB Edge Tubes + Soft Octabox',
      location: 'Paris Fashion Week, France',
      year: '2025',
      coordinates: '48.8566° N, 2.3522° E'
    },
    description: 'Futuristic avant-garde fashion story featured on Vogue Italia cover.',
    colorPalette: ['#0b0d12', '#232b38', '#425570', '#8aa1be', '#e2e8f0'],
    likes: 1390,
    story: 'Behind-the-scenes portrait shot backstage in Paris. Capturing raw haute-couture energy in low ambient light.'
  },
  {
    id: 'photo-8',
    title: 'Glass Horizon Metropolis',
    category: 'architecture',
    categoryLabel: 'Cyber Architecture',
    image: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=1600&q=80',
    rawImage: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=1200&q=60',
    featured: false,
    aspectRatio: 'landscape',
    exif: {
      camera: 'Sony Alpha 1',
      lens: 'FE 12-24mm f/2.8 GM',
      focalLength: '14mm',
      aperture: 'f/11',
      shutterSpeed: '1/4s',
      iso: 'ISO 50',
      lighting: 'Twilight Reflections',
      location: 'Hong Kong Central',
      year: '2024',
      coordinates: '22.3193° N, 114.1694° E'
    },
    description: 'Vertical symmetry of glass skyscraper reflection under damp cyan rain night.',
    colorPalette: ['#030914', '#0c1b33', '#1e3d59', '#3b82f6', '#93c5fd'],
    likes: 890,
    story: 'Shot from a 62nd-floor rooftop during tropical rain showers in Hong Kong. Polarizing filters eliminated street light glare to emphasize raw blue reflections.'
  }

];

export const SERVICES_LIST: ServicePackage[] = [
  {
    id: 'editorial-fashion',
    title: 'Pre-Wedding Shoot',
    subtitle: 'Premium Pre-Wedding Photography',
    tagline: 'Sculptural lighting, cinematic color grading, and haute-couture direction.',
    startingPrice: 40000,
    iconName: 'Sparkles',
    features: [
      'Luxury Creative Direction',
      'Cinematic Lighting & Colour',
      'Professional Photography',
      'Premium Skin & Outfit Retouching',
      'Print & Digital Usage Rights'
    ],
    deliverables: [
      '15 Master Color-Graded Retouched Images',
      'Full High-Res & Web Optimized Export',
      'RAW Master Backups',
      'Commercial Usage License'
    ],
    recommendedFor: 'Fashion Houses, Designer Brands & Luxury Publications',
    turnaroundTime: '4-6 Hours'
  },
  {
    id: 'architecture-spatial',
    title: 'Event Photography',
    subtitle: 'Ultra-clean architectural photography for luxury developments',
    tagline: 'Geometric precision, ambient light synthesis, and tilt-shift perfection.',
    startingPrice: 15000,
    iconName: 'Building2',
    features: [
      'Day & Twilight Photography',
      'Professional Lighting & Exposure',
      'Clean Perspective & Composition',
      'Interior & Exterior Details',
      '4K Drone Photography'
    ],
    deliverables: [
      '20 Architectural Master Retouched Files',
      'Aerial Perspective Portfolio Set',
      'Unlimited Perpetual Commercial Rights'
    ],
    recommendedFor: 'Architects, Luxury Real Estate & Hotel Groups',
    turnaroundTime: '4-6 Hours'
  },
  {
    id: 'fine-art-portrait',
    title: 'Portrait Photography',
    subtitle: 'Intimate, museum-quality personal & executive portraits',
    tagline: 'Timeless chiaroscuro lighting capturing human depth and aura.',
    startingPrice: 8000,
    iconName: 'UserCheck',
    features: [
      'Private Studio or On-Location Setup',
      'Personal Stylist & Lighting Specialist',
      'In-Studio Live Monitor Image Selection',
      'Custom Fine Art Gallery Print Voucher',
      'Private High-Security Cloud Gallery'
    ],
    deliverables: [
      '8 Museum-Grade Retouched Master Prints',
      'Signature Black & White Monochromatic Versions',
      'Archival Print Files'
    ],
    recommendedFor: 'Artists, Executives, Founders & Public Figures',
    turnaroundTime: '1-2 Hours'
  },
  {
    id: 'commercial-luxury',
    title: 'Wedding Photography',
    subtitle: 'Product, automotive, and high-end brand storytelling',
    tagline: 'Ultra-slick reflections, precise micro-details, and luxury identity.',
    startingPrice: 75000,
    iconName: 'Crown',
    features: [
      'Candid Moments & Editorial Portraits',
      'Professional Lighting & Multi-Camera Setup',
      'Detailed Décor, Jewellery & Outfit Shots',
      'Premium Colour Grading & Retouching',
      'Editorial-Style Couple & Family Portraits'
    ],
    deliverables: [
      '25 Campaign-Ready Master Images',
      'Social Media Crop Variations',
      'Layered Retouch PSD Files upon request'
    ],
    recommendedFor: 'Luxury Automotive, Timepiece & Tech Brands',
    turnaroundTime: '8-10 Hours'
  }
];

export const GEAR_ITEMS: GearItem[] = [
  {
    id: 'gear-1',
    category: 'camera',
    name: 'Hasselblad H6D-100c',
    model: 'Medium Format 100MP Digital Back',
    specs: '100 Megapixels • 16-Bit Color Depth • 15 Stops Dynamic Range',
    useCase: 'Primary medium format camera for high fashion and commercial print campaigns.',
    icon: 'Camera',
    image: 'https://images.unsplash.com/photo-1516035069371-29a1b244cc32?auto=format&fit=crop&w=600&q=80'
  },
  {
    id: 'gear-2',
    category: 'camera',
    name: 'Leica SL2',
    model: 'Full Frame Mirrorless 47.3MP',
    specs: 'Maestro III Processor • IP54 Weather Sealed • L-Mount',
    useCase: 'Documentary, street editorial, and fast-action fine art portraits.',
    icon: 'Camera',
    image: 'https://images.unsplash.com/photo-1502920917128-1aa500764cbd?auto=format&fit=crop&w=600&q=80'
  },
  {
    id: 'gear-3',
    category: 'lens',
    name: 'Leica Summilux-SL 50mm f/1.4 ASPH',
    model: 'Prime Master Lens',
    specs: 'f/1.4 Aperture • Dual Sync Drive • Zero Spherical Aberration',
    useCase: 'Unmatched bokeh and razor-sharp eye detail in low ambient light.',
    icon: 'Aperture',
    image: 'https://images.unsplash.com/photo-1617005082133-548c4dd27f35?auto=format&fit=crop&w=600&q=80'
  },
  {
    id: 'gear-4',
    category: 'lighting',
    name: 'Profoto Pro-11 2400 AirX',
    model: 'High Speed Flash Generator',
    specs: '2400Ws • 1/80,000s Freeze Duration • AirX Wireless Sync',
    useCase: 'Freezing motion in high-speed fashion and luxury action shoots.',
    icon: 'Zap',
    image: 'https://images.unsplash.com/photo-1520390138845-fd2d229dd553?auto=format&fit=crop&w=600&q=80'
  },
  {
    id: 'gear-5',
    category: 'drone',
    name: 'DJI Inspire 3 Cinema',
    model: 'Full-Frame 8K Air Cinema Drone',
    specs: 'Zenmuse X9-8K Air • ProRes RAW • Centimeter-Level RTK',
    useCase: 'Ultra-cinematic aerial architectural and landscape visuals.',
    icon: 'Wind',
    image: 'https://images.unsplash.com/photo-1527977966376-1c8408f9f108?auto=format&fit=crop&w=600&q=80'
  }
];

export const TESTIMONIALS: Testimonial[] = [
  {
    id: 't-1',
    quote:
      "Utkarsh has a rare ability to turn every frame into a story. His attention to detail and understanding of our brand made the entire campaign feel truly special.Utkarsh has a rare ability to turn every frame into a story. His attention to detail and understanding of our brand made the entire campaign feel truly special.",
    clientName: 'Aarav Mehta',
    role: 'Creative Director',
    company: 'Shahada',
    avatar:
      'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=300&q=80',
    shootName: 'Event Photography',
    rating: 5,
    year: '2025'
  },
  {
    id: 't-2',
    quote:
      "Utkarsh has an incredible eye for architecture and light. He captured our space with a sense of depth and detail that truly brought the design to life.",
    clientName: 'Rohan Patil',
    role: 'Lead Architect',
    company: 'Nashik',
    avatar:
      'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=300&q=80',
    shootName: 'Architectural Photography',
    rating: 5,
    year: '2024'
  },
  {
    id: 't-3',
    quote:
      "From the smallest details to the biggest moments, Utkarsh captured everything with incredible precision. Nothing felt forced, yet every frame looked timeless and cinematic. We couldn’t have asked for a better way to remember our wedding.",
    clientName: 'Rahul Chaudhari',
    role: 'Global Marketing VP',
    company: 'Dhule',
    avatar:
      'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=300&q=80',
    shootName: 'Wedding Photography',
    rating: 5,
    year: '2025'
  }
];

/*
 * =========================================================
 * INDIA LOCATIONS
 * =========================================================
 *
 * Only two states are intentionally included:
 * Maharashtra and Gujarat.
 *
 * District data is kept local so there is no API/database
 * request and therefore no extra loading caused by location
 * lookup.
 */

export const INDIA_LOCATIONS = {
  Maharashtra: [
    'Ahmednagar',
    'Akola',
    'Amravati',
    'Aurangabad',
    'Beed',
    'Bhandara',
    'Buldhana',
    'Chandrapur',
    'Dhule',
    'Gadchiroli',
    'Gondia',
    'Hingoli',
    'Jalgaon',
    'Jalna',
    'Kolhapur',
    'Latur',
    'Mumbai City',
    'Mumbai Suburban',
    'Nagpur',
    'Nanded',
    'Nandurbar',
    'Nashik',
    'Osmanabad',
    'Palghar',
    'Parbhani',
    'Pune',
    'Raigad',
    'Ratnagiri',
    'Sangli',
    'Satara',
    'Sindhudurg',
    'Solapur',
    'Thane',
    'Wardha',
    'Washim',
    'Yavatmal'
  ],

  Gujarat: [
    'Ahmedabad',
    'Amreli',
    'Anand',
    'Aravalli',
    'Banaskantha',
    'Bharuch',
    'Bhavnagar',
    'Botad',
    'Chhota Udaipur',
    'Dahod',
    'Dang',
    'Devbhumi Dwarka',
    'Gandhinagar',
    'Gir Somnath',
    'Jamnagar',
    'Junagadh',
    'Kheda',
    'Kutch',
    'Mahisagar',
    'Mehsana',
    'Morbi',
    'Narmada',
    'Navsari',
    'Panchmahal',
    'Patan',
    'Porbandar',
    'Rajkot',
    'Sabarkantha',
    'Surat',
    'Surendranagar',
    'Tapi',
    'Vadodara',
    'Valsad'
  ]
} as const;

/*
 * Old international tour schedule intentionally removed.
 *
 * TOUR_LOCATIONS is no longer needed by BookingSection.tsx.
 */

export const STATS = [
  { value: '6+', label: 'Years Experience' },
  { value: '450+', label: 'Editorial Shoots' },
  { value: '250+', label: 'Projects Completed' },
  { value: '100+', label: 'Stories Captured' }
];
