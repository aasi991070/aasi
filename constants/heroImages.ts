export type SlideshowImage = {
  src: string;
  alt: string;
};

export type SuitSlide = {
  id: string;
  label: string;
  photos: [SlideshowImage, SlideshowImage, SlideshowImage];
};

/**
 * Hero lookbook: each slide is three photos of one suit / look.
 * Free Unsplash only — already allowed in next.config.
 */
export const HERO_SUIT_SLIDES: SuitSlide[] = [
  {
    id: "emerald-lawn",
    label: "Emerald lawn suit",
    photos: [
      {
        src: "https://images.unsplash.com/photo-1773439877245-79b5ac3244a8?w=1200&q=80",
        alt: "Emerald lawn suit — front with white dupatta",
      },
      {
        src: "https://images.unsplash.com/photo-1773439878437-11da66df98e9?w=1200&q=80",
        alt: "Embroidered taupe lawn suit with pink dupatta",
      },
      {
        src: "https://images.unsplash.com/photo-1773439877855-cd193d949717?w=1200&q=80",
        alt: "Gray lawn suit with black accents",
      },
    ],
  },
  {
    id: "crimson-formal",
    label: "Crimson formal suit",
    photos: [
      {
        src: "https://images.unsplash.com/photo-1733470381571-c3d082e68457?w=1200&q=80",
        alt: "Crimson formal suit before flowers",
      },
      {
        src: "https://images.unsplash.com/photo-1707576618343-26a1b377ca7a?w=1200&q=80",
        alt: "Red embroidered formal suit portrait",
      },
      {
        src: "https://images.unsplash.com/photo-1747847471517-952a3eb93a89?w=1200&q=80",
        alt: "Elaborate embroidered formal bridal look",
      },
    ],
  },
  {
    id: "floral-arch",
    label: "Floral arch formal",
    photos: [
      {
        src: "https://images.unsplash.com/photo-1733470324488-d0e10d014d80?w=1200&q=80",
        alt: "Formal suit before a floral arch",
      },
      {
        src: "https://images.unsplash.com/photo-1733470381436-bb5a2a441708?w=1200&q=80",
        alt: "Formal attire at a floral archway",
      },
      {
        src: "https://images.unsplash.com/photo-1733470381591-c5dfb9df3c3d?w=1200&q=80",
        alt: "Black and white formal outfit",
      },
    ],
  },
  {
    id: "violet-evening",
    label: "Violet evening suit",
    photos: [
      {
        src: "https://images.unsplash.com/photo-1705920824583-0e783235394d?w=1200&q=80",
        alt: "Purple formal dress with curtain backdrop",
      },
      {
        src: "https://images.unsplash.com/photo-1733731402869-57e0cce24aea?w=1200&q=80",
        alt: "Purple formal suit against a wall",
      },
      {
        src: "https://images.unsplash.com/photo-1704119142483-1269733bcedb?w=1200&q=80",
        alt: "Black evening formal dress",
      },
    ],
  },
  {
    id: "salon-edit",
    label: "Salon edit formal",
    photos: [
      {
        src: "https://images.unsplash.com/photo-1733209484732-6b094322a89f?w=1200&q=80",
        alt: "Formal ethnic wear in a living room",
      },
      {
        src: "https://images.unsplash.com/photo-1733209589578-97136bee7d7a?w=1200&q=80",
        alt: "Formal wear beside a couch",
      },
      {
        src: "https://images.unsplash.com/photo-1733209587923-77ff33202f7c?w=1200&q=80",
        alt: "Formal wear before a white couch",
      },
    ],
  },
  {
    id: "ivory-minimal",
    label: "Ivory minimal suit",
    photos: [
      {
        src: "https://images.unsplash.com/photo-1622860685754-2e0787bc8122?w=1200&q=80",
        alt: "White traditional kurta and pants",
      },
      {
        src: "https://images.unsplash.com/photo-1603347032396-898d109145f4?w=1200&q=80",
        alt: "Black and white formal ethnic wear",
      },
      {
        src: "https://images.unsplash.com/photo-1733209590486-4ed0bfcbc52a?w=1200&q=80",
        alt: "Formal wear on stairs",
      },
    ],
  },
  {
    id: "tan-mens",
    label: "Tan menswear edit",
    photos: [
      {
        src: "https://images.unsplash.com/photo-1633193231840-e8fcfcead786?w=1200&q=80",
        alt: "Man in tailored tan suit with sunglasses",
      },
      {
        src: "https://images.unsplash.com/photo-1633193020624-67cd4dc6efcf?w=1200&q=80",
        alt: "Man in tan formal suit, editorial portrait",
      },
      {
        src: "https://images.unsplash.com/photo-1720622381967-722ecebc98b7?w=1200&q=80",
        alt: "Man in traditional formal attire outdoors",
      },
    ],
  },
  {
    id: "sunlit-poolside",
    label: "Sunlit poolside edit",
    photos: [
      {
        src: "https://images.unsplash.com/photo-1733209589780-ece842d0dcf8?w=1200&q=80",
        alt: "Formal wear standing before a pool",
      },
      {
        src: "https://images.unsplash.com/photo-1701252072712-e939599623f2?w=1200&q=80",
        alt: "Yellow and white traditional outfit",
      },
      {
        src: "https://images.unsplash.com/photo-1622860685318-386b1a68089d?w=1200&q=80",
        alt: "White formal shirt and gray pants",
      },
    ],
  },
];

/** Featured section keeps single-image slides. */
export const FEATURED_SLIDESHOW_IMAGES: SlideshowImage[] = [
  {
    src: "https://images.unsplash.com/photo-1733731402869-57e0cce24aea?w=1200&q=80",
    alt: "Woman in a purple formal suit against a wall",
  },
  {
    src: "https://images.unsplash.com/photo-1733470381591-c5dfb9df3c3d?w=1200&q=80",
    alt: "Woman in a black and white formal outfit",
  },
  {
    src: "https://images.unsplash.com/photo-1704119142483-1269733bcedb?w=1200&q=80",
    alt: "Woman seated in a black formal dress",
  },
  {
    src: "https://images.unsplash.com/photo-1733209590486-4ed0bfcbc52a?w=1200&q=80",
    alt: "Woman in formal wear standing on stairs",
  },
  {
    src: "https://images.unsplash.com/photo-1733209484732-6b094322a89f?w=1200&q=80",
    alt: "Woman in formal ethnic wear in a living room",
  },
  {
    src: "https://images.unsplash.com/photo-1701252072712-e939599623f2?w=1200&q=80",
    alt: "Woman in a yellow and white traditional outfit",
  },
  {
    src: "https://images.unsplash.com/photo-1733209589578-97136bee7d7a?w=1200&q=80",
    alt: "Woman in formal wear beside a couch",
  },
  {
    src: "https://images.unsplash.com/photo-1733209587923-77ff33202f7c?w=1200&q=80",
    alt: "Woman in formal ethnic wear before a white couch",
  },
  {
    src: "https://images.unsplash.com/photo-1733209589780-ece842d0dcf8?w=1200&q=80",
    alt: "Woman in formal wear standing before a pool",
  },
  {
    src: "https://images.unsplash.com/photo-1773439877855-cd193d949717?w=1200&q=80",
    alt: "Woman in a gray formal outfit with black accents",
  },
  {
    src: "https://images.unsplash.com/photo-1622860685318-386b1a68089d?w=1200&q=80",
    alt: "Man in white formal shirt and gray pants",
  },
  {
    src: "https://images.unsplash.com/photo-1720622381967-722ecebc98b7?w=1200&q=80",
    alt: "Man in traditional formal attire seated outdoors",
  },
];
