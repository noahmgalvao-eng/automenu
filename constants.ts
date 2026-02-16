

import { Product, MenuStyle } from './types';

export const INITIAL_PRODUCTS: Product[] = [
  {
    id: '1',
    name: 'Classic Burger',
    description: 'Angus beef, cheddar, lettuce, tomato, house sauce.',
    price: 12.99,
    category: 'Burgers',
    image: 'https://picsum.photos/200/200?random=1'
  },
  {
    id: '2',
    name: 'Truffle Fries',
    description: 'Crispy fries tossed with truffle oil and parmesan.',
    price: 6.50,
    category: 'Sides',
    image: 'https://picsum.photos/200/200?random=2'
  },
  {
    id: '3',
    name: 'Caesar Salad',
    description: 'Romaine hearts, croutons, parmesan, caesar dressing.',
    price: 10.00,
    category: 'Salads',
    image: 'https://picsum.photos/200/200?random=3'
  },
  {
    id: '4',
    name: 'Chocolate Lava Cake',
    description: 'Warm chocolate cake with a liquid core, served with ice cream.',
    price: 8.99,
    category: 'Desserts',
    image: 'https://picsum.photos/200/200?random=4'
  },
  {
    id: '5',
    name: 'Margherita Pizza',
    description: 'San Marzano tomato sauce, fresh mozzarella, basil.',
    price: 14.50,
    category: 'Pizza',
    image: 'https://picsum.photos/200/200?random=5'
  }
];

const DEFAULT_ELEMENT_STYLES = {
  category: { fontSize: 24, fontWeight: '700' as const, textAlign: 'left' as const },
  productName: { fontSize: 18, fontWeight: '700' as const, textAlign: 'left' as const },
  productPrice: { fontSize: 18, fontWeight: '700' as const, textAlign: 'right' as const },
  productDescription: { fontSize: 14, fontWeight: '400' as const, textAlign: 'left' as const },
};

export const PRESET_TEMPLATES: MenuStyle[] = [
  {
    id: 'modern-clean',
    name: 'Modern Clean',
    menuTitle: 'MENU',
    menuSubtitle: 'Signature Selection',
    fontFamily: 'Inter',
    primaryColor: '#ea580c', // Orange-600
    backgroundColor: '#ffffff',
    textColor: '#1e293b', // Slate-800
    layoutMode: 'list',
    showImages: true,
    columnCount: 1,
    backgroundImage: '',
    customCategoryOrder: [],
    customProductOrder: {},
    hiddenProductIds: [],
    floatingText: [],
    pageBreaks: [],
    elementStyles: {
        category: { ...DEFAULT_ELEMENT_STYLES.category, color: '#ea580c' },
        productName: { ...DEFAULT_ELEMENT_STYLES.productName, color: '#1e293b' },
        productPrice: { ...DEFAULT_ELEMENT_STYLES.productPrice, color: '#059669' },
        productDescription: { ...DEFAULT_ELEMENT_STYLES.productDescription, color: '#64748b' }
    }
  },
  {
    id: 'elegant-dark',
    name: 'Elegant Bistro',
    menuTitle: 'Gourmet',
    menuSubtitle: 'Fine Dining Experience',
    fontFamily: 'Playfair Display',
    primaryColor: '#fbbf24', // Amber-400
    backgroundColor: '#1c1917', // Stone-900
    textColor: '#f5f5f4', // Stone-100
    layoutMode: 'list',
    showImages: false,
    columnCount: 2,
    backgroundImage: 'https://www.transparenttextures.com/patterns/asfalt-dark.png',
    customCategoryOrder: [],
    customProductOrder: {},
    hiddenProductIds: [],
    floatingText: [],
    pageBreaks: [],
    elementStyles: {
        category: { ...DEFAULT_ELEMENT_STYLES.category, color: '#fbbf24', textAlign: 'center' },
        productName: { ...DEFAULT_ELEMENT_STYLES.productName, color: '#f5f5f4' },
        productPrice: { ...DEFAULT_ELEMENT_STYLES.productPrice, color: '#fbbf24' },
        productDescription: { ...DEFAULT_ELEMENT_STYLES.productDescription, color: '#a8a29e' }
    }
  },
  {
    id: 'casual-grid',
    name: 'Cozy Cafe',
    menuTitle: 'CAFE',
    menuSubtitle: 'Coffee & Bites',
    fontFamily: 'Lato',
    primaryColor: '#0ea5e9', // Sky-500
    backgroundColor: '#f0f9ff', // Sky-50
    textColor: '#0f172a', // Slate-900
    layoutMode: 'grid',
    showImages: true,
    columnCount: 3,
    backgroundImage: '',
    customCategoryOrder: [],
    customProductOrder: {},
    hiddenProductIds: [],
    floatingText: [],
    pageBreaks: [],
    elementStyles: {
        category: { ...DEFAULT_ELEMENT_STYLES.category, color: '#0ea5e9', textAlign: 'center' },
        productName: { ...DEFAULT_ELEMENT_STYLES.productName, color: '#0f172a', textAlign: 'center' },
        productPrice: { ...DEFAULT_ELEMENT_STYLES.productPrice, color: '#0ea5e9', textAlign: 'center' },
        productDescription: { ...DEFAULT_ELEMENT_STYLES.productDescription, color: '#475569', textAlign: 'center' }
    }
  },
  {
    id: 'rustic-cards',
    name: 'Rustic House',
    menuTitle: 'The Barn',
    menuSubtitle: 'Farm to Table',
    fontFamily: 'Montserrat',
    primaryColor: '#78350f', // Amber-900
    backgroundColor: '#fffbeb', // Amber-50
    textColor: '#451a03', // Amber-950
    layoutMode: 'cards',
    showImages: true,
    columnCount: 2,
    backgroundImage: 'https://www.transparenttextures.com/patterns/wood-pattern.png',
    customCategoryOrder: [],
    customProductOrder: {},
    hiddenProductIds: [],
    floatingText: [],
    pageBreaks: [],
    elementStyles: {
        category: { ...DEFAULT_ELEMENT_STYLES.category, color: '#78350f' },
        productName: { ...DEFAULT_ELEMENT_STYLES.productName, color: '#451a03' },
        productPrice: { ...DEFAULT_ELEMENT_STYLES.productPrice, color: '#92400e' },
        productDescription: { ...DEFAULT_ELEMENT_STYLES.productDescription, color: '#78350f' }
    }
  }
];

export const INITIAL_STYLE: MenuStyle = PRESET_TEMPLATES[0];

export const SAMPLE_BACKGROUNDS = [
  { name: 'None', url: '' },
  { name: 'Paper Texture', url: 'https://www.transparenttextures.com/patterns/aged-paper.png' },
  { name: 'Dark Slate', url: 'https://www.transparenttextures.com/patterns/asfalt-dark.png' },
  { name: 'Wood', url: 'https://www.transparenttextures.com/patterns/wood-pattern.png' }
];

export const FONTS = ['Inter', 'Playfair Display', 'Lato', 'Montserrat'];