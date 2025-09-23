/**
 * Lightweight demo data that lets the customer flow ship ahead of the backend.
 * The structure mirrors what we expect from the future API so swapping it out
 * later is mostly a plumbing exercise.
 */

export type RestaurantMenuItem = {
  id: string
  name: string
  description?: string
  priceCents: number
  imageUrl?: string
  isAvailable: boolean
}

export type RestaurantMenuSection = {
  title: string
  items: RestaurantMenuItem[]
}

/**
 * Shape of the restaurant records rendered on the homepage and detail routes.
 *
 * @property menu - Grouped menu data surfaced on `/restaurant/[slug]` to show a
 *   believable ordering experience before real endpoints exist.
 */
export type CustomerRestaurant = {
  id: string
  slug: string
  name: string
  cuisine: string
  neighborhood: string
  priceTier: '$' | '$$' | '$$$' | '$$$$'
  rating: number
  reviewCount: number
  isOpen: boolean
  tags: string[]
  shortDescription: string
  menu: RestaurantMenuSection[]
}

/**
 * Static list of restaurants used for STORY-C001/C002/C003. Replace with API data
 * once services are wired up.
 */
export const demoCustomerRestaurants: CustomerRestaurant[] = [
  {
    id: 'rst-101',
    slug: 'citrus-and-thyme',
    name: 'Citrus & Thyme',
    cuisine: 'Mediterranean',
    neighborhood: 'Hayes Valley',
    priceTier: '$$$',
    rating: 4.7,
    reviewCount: 1200,
    isOpen: true,
    tags: ['Hayes Valley', 'Vegetarian options'],
    shortDescription:
      'Bright, seasonal plates with citrus-forward flavors, a cozy dining room, and a patio perfect for golden hour gatherings.',
    menu: [
      {
        title: 'Small Plates',
        items: [
          {
            id: 'citrus-small-olives',
            name: 'Citrus-marinated olives',
            description: 'Orange zest, rosemary',
            priceCents: 700,
            imageUrl: '/images/menu/menu-01.svg',
            isAvailable: true,
          },
          {
            id: 'citrus-small-whipped-feta',
            name: 'Whipped feta',
            description: 'Honey, thyme, sesame',
            priceCents: 1100,
            imageUrl: '/images/menu/menu-02.svg',
            isAvailable: false,
          },
        ],
      },
      {
        title: 'Mains',
        items: [
          {
            id: 'citrus-mains-herb-roasted-chicken',
            name: 'Herb roasted chicken',
            description: 'Charred lemon, jus',
            priceCents: 2400,
            imageUrl: '/images/menu/menu-03.svg',
            isAvailable: true,
          },
          {
            id: 'citrus-mains-summer-risotto',
            name: 'Summer risotto',
            description: 'Zucchini, basil, pecorino',
            priceCents: 2100,
            imageUrl: '/images/menu/menu-04.svg',
            isAvailable: true,
          },
        ],
      },
      {
        title: 'Desserts',
        items: [
          {
            id: 'citrus-desserts-olive-oil-cake',
            name: 'Olive oil cake',
            description: 'Citrus glaze',
            priceCents: 900,
            imageUrl: '/images/menu/menu-05.svg',
            isAvailable: true,
          },
          {
            id: 'citrus-desserts-pistachio-gelato',
            name: 'Pistachio gelato',
            description: 'Fresh mint',
            priceCents: 600,
            imageUrl: '/images/menu/menu-06.svg',
            isAvailable: true,
          },
        ],
      },
    ],
  },
  {
    id: 'rst-102',
    slug: 'sakura-sushi-studio',
    name: 'Sakura Sushi Studio',
    cuisine: 'Japanese',
    neighborhood: 'Downtown',
    priceTier: '$$$',
    rating: 4.9,
    reviewCount: 980,
    isOpen: true,
    tags: ['Downtown', 'Omakase'],
    shortDescription:
      'Chef-led omakase alongside a playful à la carte menu featuring local seafood and handcrafted sauces.',
    menu: [
      {
        title: 'Nigiri',
        items: [
          {
            id: 'sakura-nigiri-bluefin-toro',
            name: 'Bluefin toro',
            description: 'Soy-brushed, fresh wasabi',
            priceCents: 800,
            imageUrl: '/images/menu/menu-01.svg',
            isAvailable: true,
          },
          {
            id: 'sakura-nigiri-golden-eye-snapper',
            name: 'Golden eye snapper',
            description: 'Yuzu kosho',
            priceCents: 700,
            imageUrl: '/images/menu/menu-02.svg',
            isAvailable: true,
          },
        ],
      },
      {
        title: 'Rolls',
        items: [
          {
            id: 'sakura-rolls-sunrise-roll',
            name: 'Sunrise roll',
            description: 'Salmon, mango, avocado',
            priceCents: 1600,
            imageUrl: '/images/menu/menu-03.svg',
            isAvailable: true,
          },
          {
            id: 'sakura-rolls-tempura-garden',
            name: 'Tempura garden',
            description: 'Sweet potato, shiso',
            priceCents: 1400,
            imageUrl: '/images/menu/menu-04.svg',
            isAvailable: false,
          },
        ],
      },
      {
        title: 'Extras',
        items: [
          {
            id: 'sakura-extras-miso-soup',
            name: 'Miso soup',
            description: 'Tofu, scallion, wakame',
            priceCents: 400,
            imageUrl: '/images/menu/menu-05.svg',
            isAvailable: true,
          },
          {
            id: 'sakura-extras-matcha-custard',
            name: 'Matcha custard',
            description: 'Black sesame crumble',
            priceCents: 700,
            imageUrl: '/images/menu/menu-06.svg',
            isAvailable: true,
          },
        ],
      },
    ],
  },
  {
    id: 'rst-103',
    slug: 'verde-taqueria',
    name: 'Verde Taqueria',
    cuisine: 'Mexican',
    neighborhood: 'Mission District',
    priceTier: '$$',
    rating: 4.4,
    reviewCount: 2100,
    isOpen: false,
    tags: ['Mission', 'House-made salsas'],
    shortDescription:
      'Vibrant tacos, mezcal cocktails, and rotating seasonal specials served from a beloved neighborhood kitchen.',
    menu: [
      {
        title: 'Tacos',
        items: [
          {
            id: 'verde-tacos-al-pastor',
            name: 'Al pastor',
            description: 'Pineapple salsa, cilantro',
            priceCents: 400,
            imageUrl: '/images/menu/menu-01.svg',
            isAvailable: true,
          },
          {
            id: 'verde-tacos-crispy-cauliflower',
            name: 'Crispy cauliflower',
            description: 'Chipotle crema',
            priceCents: 400,
            imageUrl: '/images/menu/menu-02.svg',
            isAvailable: true,
          },
        ],
      },
      {
        title: 'Sides',
        items: [
          {
            id: 'verde-sides-street-corn',
            name: 'Street corn',
            description: 'Cotija, tajin, lime',
            priceCents: 600,
            imageUrl: '/images/menu/menu-03.svg',
            isAvailable: false,
          },
          {
            id: 'verde-sides-black-beans',
            name: 'Black beans',
            description: 'Queso fresco',
            priceCents: 500,
            imageUrl: '/images/menu/menu-04.svg',
            isAvailable: true,
          },
        ],
      },
      {
        title: 'Desserts',
        items: [
          {
            id: 'verde-desserts-churros',
            name: 'Churros',
            description: 'Cinnamon sugar, chocolate',
            priceCents: 600,
            imageUrl: '/images/menu/menu-05.svg',
            isAvailable: true,
          },
          {
            id: 'verde-desserts-flan',
            name: 'Flan',
            description: 'Burnt caramel',
            priceCents: 500,
            imageUrl: '/images/menu/menu-06.svg',
            isAvailable: true,
          },
        ],
      },
    ],
  },
  {
    id: 'rst-104',
    slug: 'solstice-ramen',
    name: 'Solstice Ramen',
    cuisine: 'Ramen',
    neighborhood: 'SoMa',
    priceTier: '$$',
    rating: 4.6,
    reviewCount: 860,
    isOpen: true,
    tags: ['SoMa', 'Vegan broth'],
    shortDescription:
      'Slow-simmered broths, hand-pulled noodles, and a broth bar featuring vegan and spicy miso signatures.',
    menu: [
      {
        title: 'Broths',
        items: [
          {
            id: 'solstice-broths-tonkotsu',
            name: 'Tonkotsu',
            description: '12-hour pork bone',
            priceCents: 1500,
            imageUrl: '/images/menu/menu-01.svg',
            isAvailable: true,
          },
          {
            id: 'solstice-broths-spicy-miso',
            name: 'Spicy miso',
            description: 'Chili oil, sesame',
            priceCents: 1600,
            imageUrl: '/images/menu/menu-02.svg',
            isAvailable: true,
          },
        ],
      },
      {
        title: 'Add-ons',
        items: [
          {
            id: 'solstice-addons-ajitama-egg',
            name: 'Ajitama egg',
            priceCents: 200,
            imageUrl: '/images/menu/menu-03.svg',
            isAvailable: true,
          },
          {
            id: 'solstice-addons-bamboo-shoots',
            name: 'Bamboo shoots',
            priceCents: 200,
            imageUrl: '/images/menu/menu-04.svg',
            isAvailable: false,
          },
        ],
      },
      {
        title: 'Sides',
        items: [
          {
            id: 'solstice-sides-shishito-peppers',
            name: 'Shishito peppers',
            description: 'Smoked sea salt',
            priceCents: 700,
            imageUrl: '/images/menu/menu-05.svg',
            isAvailable: true,
          },
          {
            id: 'solstice-sides-seaweed-salad',
            name: 'Seaweed salad',
            description: 'Ponzu',
            priceCents: 600,
            imageUrl: '/images/menu/menu-06.svg',
            isAvailable: true,
          },
        ],
      },
    ],
  },
  {
    id: 'rst-105',
    slug: 'ember-and-oak',
    name: 'Ember & Oak',
    cuisine: 'Steakhouse',
    neighborhood: 'Financial District',
    priceTier: '$$$$',
    rating: 4.8,
    reviewCount: 1570,
    isOpen: true,
    tags: ['Financial District', 'Prime cuts'],
    shortDescription:
      'Wood-fired steaks, refined sides, and a cellar-forward wine program for elevated nights in or out.',
    menu: [
      {
        title: 'Cuts',
        items: [
          {
            id: 'ember-cuts-dry-aged-ribeye',
            name: 'Dry-aged ribeye',
            description: 'Bone-in, 16oz',
            priceCents: 4800,
            imageUrl: '/images/menu/menu-01.svg',
            isAvailable: true,
          },
          {
            id: 'ember-cuts-filet-mignon',
            name: 'Filet mignon',
            description: 'Center cut',
            priceCents: 4400,
            imageUrl: '/images/menu/menu-02.svg',
            isAvailable: true,
          },
        ],
      },
      {
        title: 'Sides',
        items: [
          {
            id: 'ember-sides-truffle-mash',
            name: 'Truffle mash',
            description: 'Brown butter',
            priceCents: 900,
            imageUrl: '/images/menu/menu-03.svg',
            isAvailable: true,
          },
          {
            id: 'ember-sides-charred-broccolini',
            name: 'Charred broccolini',
            description: 'Garlic chili crisp',
            priceCents: 800,
            imageUrl: '/images/menu/menu-04.svg',
            isAvailable: false,
          },
        ],
      },
      {
        title: 'Sauces',
        items: [
          {
            id: 'ember-sauces-herb-chimichurri',
            name: 'Herb chimichurri',
            priceCents: 300,
            imageUrl: '/images/menu/menu-05.svg',
            isAvailable: true,
          },
          {
            id: 'ember-sauces-bone-marrow-butter',
            name: 'Bone marrow butter',
            priceCents: 400,
            imageUrl: '/images/menu/menu-06.svg',
            isAvailable: true,
          },
        ],
      },
    ],
  },
  {
    id: 'rst-106',
    slug: 'lotus-bowls',
    name: 'Lotus Bowls',
    cuisine: 'Thai',
    neighborhood: 'Inner Sunset',
    priceTier: '$$',
    rating: 4.5,
    reviewCount: 540,
    isOpen: false,
    tags: ['Inner Sunset', 'Spicy'],
    shortDescription:
      'Thai comfort dishes, silky curries, and fragrant noodle bowls designed for weeknight cravings.',
    menu: [
      {
        title: 'Curries',
        items: [
          {
            id: 'lotus-curries-green-curry',
            name: 'Green curry',
            description: 'Thai basil, bamboo',
            priceCents: 1400,
            imageUrl: '/images/menu/menu-01.svg',
            isAvailable: true,
          },
          {
            id: 'lotus-curries-panang-curry',
            name: 'Panang curry',
            description: 'Roasted peanuts',
            priceCents: 1500,
            imageUrl: '/images/menu/menu-02.svg',
            isAvailable: true,
          },
        ],
      },
      {
        title: 'Noodles',
        items: [
          {
            id: 'lotus-noodles-pad-thai',
            name: 'Pad thai',
            description: 'Tamarind, peanuts',
            priceCents: 1300,
            imageUrl: '/images/menu/menu-03.svg',
            isAvailable: true,
          },
          {
            id: 'lotus-noodles-drunken-noodles',
            name: 'Drunken noodles',
            description: 'Thai basil, chili',
            priceCents: 1300,
            imageUrl: '/images/menu/menu-04.svg',
            isAvailable: false,
          },
        ],
      },
      {
        title: 'Desserts',
        items: [
          {
            id: 'lotus-desserts-mango-sticky-rice',
            name: 'Mango sticky rice',
            description: 'Coconut cream',
            priceCents: 700,
            imageUrl: '/images/menu/menu-05.svg',
            isAvailable: true,
          },
          {
            id: 'lotus-desserts-thai-tea-panna-cotta',
            name: 'Thai tea panna cotta',
            priceCents: 600,
            imageUrl: '/images/menu/menu-06.svg',
            isAvailable: true,
          },
        ],
      },
    ],
  },
  {
    id: 'rst-107',
    slug: 'golden-hour-cafe',
    name: 'Golden Hour Café',
    cuisine: 'Cafe & Bakery',
    neighborhood: 'North Beach',
    priceTier: '$$',
    rating: 4.2,
    reviewCount: 640,
    isOpen: true,
    tags: ['North Beach', 'Pastries'],
    shortDescription:
      'Buttery croissants, seasonal quiches, and hand-poured coffees served from sunrise to late afternoon.',
    menu: [
      {
        title: 'Morning',
        items: [
          {
            id: 'golden-morning-almond-croissant',
            name: 'Almond croissant',
            description: 'House almond cream',
            priceCents: 500,
            imageUrl: '/images/menu/menu-01.svg',
            isAvailable: true,
          },
          {
            id: 'golden-morning-seasonal-quiche',
            name: 'Seasonal quiche',
            description: 'Greens side',
            priceCents: 900,
            imageUrl: '/images/menu/menu-02.svg',
            isAvailable: true,
          },
        ],
      },
      {
        title: 'Midday',
        items: [
          {
            id: 'golden-midday-smoked-salmon-toast',
            name: 'Smoked salmon toast',
            description: 'Herb cheese',
            priceCents: 1200,
            imageUrl: '/images/menu/menu-03.svg',
            isAvailable: true,
          },
          {
            id: 'golden-midday-roasted-veggie-panini',
            name: 'Roasted veggie panini',
            description: 'Pesto aioli',
            priceCents: 1100,
            imageUrl: '/images/menu/menu-04.svg',
            isAvailable: false,
          },
        ],
      },
      {
        title: 'Coffee',
        items: [
          {
            id: 'golden-coffee-honey-latte',
            name: 'Honey latte',
            description: 'Oat milk',
            priceCents: 500,
            imageUrl: '/images/menu/menu-05.svg',
            isAvailable: true,
          },
          {
            id: 'golden-coffee-cold-brew',
            name: 'Cold brew',
            description: 'Vanilla bean',
            priceCents: 400,
            imageUrl: '/images/menu/menu-06.svg',
            isAvailable: true,
          },
        ],
      },
    ],
  },
  {
    id: 'rst-108',
    slug: 'harvest-kitchen',
    name: 'Harvest Kitchen',
    cuisine: 'Farm-to-Table',
    neighborhood: 'Noe Valley',
    priceTier: '$$$',
    rating: 4.9,
    reviewCount: 430,
    isOpen: true,
    tags: ['Noe Valley', 'Organic'],
    shortDescription:
      'Farm-fresh produce meets modern California cooking with rotating chef tasting menus and family-style plates.',
    menu: [
      {
        title: 'Starters',
        items: [
          {
            id: 'harvest-starters-heirloom-tomato-salad',
            name: 'Heirloom tomato salad',
            description: 'Stracciatella, basil oil',
            priceCents: 1200,
            imageUrl: '/images/menu/menu-01.svg',
            isAvailable: true,
          },
          {
            id: 'harvest-starters-charred-peaches',
            name: 'Charred peaches',
            description: 'Prosciutto, ricotta',
            priceCents: 1100,
            imageUrl: '/images/menu/menu-02.svg',
            isAvailable: true,
          },
        ],
      },
      {
        title: 'Family Style',
        items: [
          {
            id: 'harvest-family-roasted-chicken',
            name: 'Roasted chicken',
            description: 'Herb jus, fingerlings',
            priceCents: 3200,
            imageUrl: '/images/menu/menu-03.svg',
            isAvailable: true,
          },
          {
            id: 'harvest-family-grilled-vegetable-board',
            name: 'Grilled vegetable board',
            description: 'Lemon tahini',
            priceCents: 2800,
            imageUrl: '/images/menu/menu-04.svg',
            isAvailable: false,
          },
        ],
      },
      {
        title: 'Dessert',
        items: [
          {
            id: 'harvest-dessert-stone-fruit-crumble',
            name: 'Stone fruit crumble',
            description: 'Vanilla bean ice cream',
            priceCents: 900,
            imageUrl: '/images/menu/menu-05.svg',
            isAvailable: true,
          },
          {
            id: 'harvest-dessert-chocolate-budino',
            name: 'Chocolate budino',
            description: 'Sea salt, olive oil',
            priceCents: 900,
            imageUrl: '/images/menu/menu-06.svg',
            isAvailable: true,
          },
        ],
      },
    ],
  },
]

export const uniqueCuisines = Array.from(
  new Set(demoCustomerRestaurants.map((restaurant) => restaurant.cuisine)),
)
