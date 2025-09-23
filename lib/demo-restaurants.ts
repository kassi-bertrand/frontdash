/**
 * Lightweight demo data that lets the customer flow ship ahead of the backend.
 * The structure mirrors what we expect from the future API so swapping it out
 * later is mostly a plumbing exercise.
 */

export type RestaurantMenuItem = {
  name: string
  description?: string
  price: string
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
 * Static list of restaurants used for STORY-C001/C002. Replace with API data
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
            name: 'Citrus-marinated olives',
            description: 'Orange zest, rosemary',
            price: '$7',
          },
          { name: 'Whipped feta', description: 'Honey, thyme, sesame', price: '$11' },
        ],
      },
      {
        title: 'Mains',
        items: [
          {
            name: 'Herb roasted chicken',
            description: 'Charred lemon, jus',
            price: '$24',
          },
          {
            name: 'Summer risotto',
            description: 'Zucchini, basil, pecorino',
            price: '$21',
          },
        ],
      },
      {
        title: 'Desserts',
        items: [
          { name: 'Olive oil cake', description: 'Citrus glaze', price: '$9' },
          { name: 'Pistachio gelato', description: 'Fresh mint', price: '$6' },
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
          { name: 'Bluefin toro', description: 'Soy-brushed, fresh wasabi', price: '$8' },
          { name: 'Golden eye snapper', description: 'Yuzu kosho', price: '$7' },
        ],
      },
      {
        title: 'Rolls',
        items: [
          { name: 'Sunrise roll', description: 'Salmon, mango, avocado', price: '$16' },
          { name: 'Tempura garden', description: 'Sweet potato, shiso', price: '$14' },
        ],
      },
      {
        title: 'Extras',
        items: [
          { name: 'Miso soup', description: 'Tofu, scallion, wakame', price: '$4' },
          { name: 'Matcha custard', description: 'Black sesame crumble', price: '$7' },
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
          { name: 'Al pastor', description: 'Pineapple salsa, cilantro', price: '$4' },
          { name: 'Crispy cauliflower', description: 'Chipotle crema', price: '$4' },
        ],
      },
      {
        title: 'Sides',
        items: [
          { name: 'Street corn', description: 'Cotija, tajin, lime', price: '$6' },
          { name: 'Black beans', description: 'Queso fresco', price: '$5' },
        ],
      },
      {
        title: 'Desserts',
        items: [
          { name: 'Churros', description: 'Cinnamon sugar, chocolate', price: '$6' },
          { name: 'Flan', description: 'Burnt caramel', price: '$5' },
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
          { name: 'Tonkotsu', description: '12-hour pork bone', price: '$15' },
          { name: 'Spicy miso', description: 'Chili oil, sesame', price: '$16' },
        ],
      },
      {
        title: 'Add-ons',
        items: [
          { name: 'Ajitama egg', price: '$2' },
          { name: 'Bamboo shoots', price: '$2' },
        ],
      },
      {
        title: 'Sides',
        items: [
          { name: 'Shishito peppers', description: 'Smoked sea salt', price: '$7' },
          { name: 'Seaweed salad', description: 'Ponzu', price: '$6' },
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
          { name: 'Dry-aged ribeye', description: 'Bone-in, 16oz', price: '$48' },
          { name: 'Filet mignon', description: 'Center cut', price: '$44' },
        ],
      },
      {
        title: 'Sides',
        items: [
          { name: 'Truffle mash', description: 'Brown butter', price: '$9' },
          { name: 'Charred broccolini', description: 'Garlic chili crisp', price: '$8' },
        ],
      },
      {
        title: 'Sauces',
        items: [
          { name: 'Herb chimichurri', price: '$3' },
          { name: 'Bone marrow butter', price: '$4' },
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
          { name: 'Green curry', description: 'Thai basil, bamboo', price: '$14' },
          { name: 'Panang curry', description: 'Roasted peanuts', price: '$15' },
        ],
      },
      {
        title: 'Noodles',
        items: [
          { name: 'Pad thai', description: 'Tamarind, peanuts', price: '$13' },
          { name: 'Drunken noodles', description: 'Thai basil, chili', price: '$13' },
        ],
      },
      {
        title: 'Desserts',
        items: [
          { name: 'Mango sticky rice', description: 'Coconut cream', price: '$7' },
          { name: 'Thai tea panna cotta', price: '$6' },
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
          { name: 'Almond croissant', description: 'House almond cream', price: '$5' },
          { name: 'Seasonal quiche', description: 'Greens side', price: '$9' },
        ],
      },
      {
        title: 'Midday',
        items: [
          { name: 'Smoked salmon toast', description: 'Herb cheese', price: '$12' },
          { name: 'Roasted veggie panini', description: 'Pesto aioli', price: '$11' },
        ],
      },
      {
        title: 'Coffee',
        items: [
          { name: 'Honey latte', description: 'Oat milk', price: '$5' },
          { name: 'Cold brew', description: 'Vanilla bean', price: '$4' },
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
            name: 'Heirloom tomato salad',
            description: 'Stracciatella, basil oil',
            price: '$12',
          },
          { name: 'Charred peaches', description: 'Prosciutto, ricotta', price: '$11' },
        ],
      },
      {
        title: 'Family Style',
        items: [
          { name: 'Roasted chicken', description: 'Herb jus, fingerlings', price: '$32' },
          { name: 'Grilled vegetable board', description: 'Lemon tahini', price: '$28' },
        ],
      },
      {
        title: 'Dessert',
        items: [
          {
            name: 'Stone fruit crumble',
            description: 'Vanilla bean ice cream',
            price: '$9',
          },
          { name: 'Chocolate budino', description: 'Sea salt, olive oil', price: '$9' },
        ],
      },
    ],
  },
]

export const uniqueCuisines = Array.from(
  new Set(demoCustomerRestaurants.map((restaurant) => restaurant.cuisine)),
)
