

export interface ElementStyle {
  fontFamily?: string;
  fontSize?: number;
  color?: string;
  textAlign?: 'left' | 'center' | 'right';
  fontWeight?: 'normal' | 'bold' | '300' | '400' | '500' | '600' | '700';
  italic?: boolean;
  // New visual properties for High Fidelity
  textTransform?: 'uppercase' | 'lowercase' | 'capitalize' | 'none';
  letterSpacing?: number; // em or px units usually treated as px in this app context or em if small
  marginBottom?: number; // px
  lineHeight?: number;
}

export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  category: string;
  image?: string; // URL or base64
  isFreeText?: boolean; // New: If true, this is a layout text item, not a menu item
  customMarginTop?: number;
  styles?: ElementStyle; // Local styles for Free Text
}

export interface FloatingTextItem {
  id: string;
  text: string;
  x: number; // percentage or px relative to page
  y: number; // percentage or px relative to page
  pageIndex: number;
}

export interface AddedImage {
  id: string;
  url: string; // Base64 or URL
  x: number; // px relative to page
  y: number; // px relative to page
  width: number; // px
  pageIndex: number;
}

export interface MenuStyle {
  id: string;
  name: string;
  menuTitle: string; // Editable main title
  menuSubtitle: string; // Editable subtitle
  fontFamily: string; // Changed from enum to string to support dynamic Google Fonts
  primaryColor: string; // Hex
  backgroundColor: string; // Hex
  textColor: string; // Hex
  backgroundImage?: string;
  sourceImage?: string; // The original uploaded image for the template
  layoutMode: 'list' | 'grid' | 'cards';
  showImages: boolean;
  imageScale?: number; 
  columnCount: 1 | 2 | 3; // Grid column count for products
  categoryColumnCount?: 1 | 2 | 3; // New: Columns for the page layout (Categories flow)
  customCategoryOrder?: string[];
  customProductOrder?: Record<string, string[]>; // categoryName -> arrayOfProductIds
  hiddenProductIds: string[]; // IDs of products in DB but hidden from menu
  floatingText?: FloatingTextItem[]; // Legacy: Free text added by user
  addedImages?: AddedImage[]; // User added background images
  pageBreaks?: string[]; // Category IDs that force a new page start
  
  // New: Global Layout Settings
  pagePadding?: number; // px
  globalRadius?: number; // px (for cards/images)
  itemGap?: number; // px (between products)

  // Global Element Styles
  elementStyles: {
    menuTitle?: ElementStyle; // New
    menuSubtitle?: ElementStyle; // New
    category: ElementStyle;
    productName: ElementStyle;
    productPrice: ElementStyle;
    productDescription: ElementStyle;
  };
}

export interface SortOption {
  field: 'name' | 'price' | 'category';
  direction: 'asc' | 'desc';
}

export interface BulkEditConfig {
  category: string;
  percentage: number; // e.g., 10 for +10%
}