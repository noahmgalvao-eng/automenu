
import { Product, MenuStyle } from '../types';

export const A4_HEIGHT_PX = 1123;
export const A4_WIDTH_PX = 794;
export const SAFETY_BUFFER = 20;
export const STANDARD_GAP = 15;
export const FREE_TEXT_PREFIX = 'ft_zone_';

// Helper function to estimate item height dynamically
export const calculateItemHeight = (product: Product, style: MenuStyle, isRowLayout: boolean, columnCount: number = 1): number => {
    const pagePadding = style.pagePadding || 48;
    const USABLE_WIDTH = A4_WIDTH_PX - (pagePadding * 2);

    // Determine effective font size with Conservative Multipliers
    const fontSize = product.isFreeText 
        ? (product.styles?.fontSize || style.elementStyles.productName.fontSize || 18) 
        : (style.elementStyles?.productName?.fontSize || 18);
        
    const descSize = style.elementStyles?.productDescription?.fontSize || 14;

    if (product.isFreeText) {
         // Dynamic line calculation based on font size and container width
         const charWidth = fontSize * 0.55; // Approximate width of char relative to size
         const usableColWidth = USABLE_WIDTH / (product.styles?.textAlign === 'center' ? 1 : 1); 
         const charsPerLine = Math.floor(usableColWidth / charWidth);
         
         const textLength = product.name.length;
         const lines = Math.ceil(textLength / charsPerLine) || 1;
         
         // Increased multiplier from 1.6 to 1.7 for safety in Free Text
         return (fontSize * 1.7 * lines) + (product.customMarginTop || 0) + 15;
    }

    // Standard Product Styles
    const priceSize = style.elementStyles?.productPrice?.fontSize || 18;
    const imgScale = style.imageScale || 1;
    const itemGap = style.itemGap || 16; // Use dynamic gap

    let contentHeight = 0;

    if (isRowLayout) {
        // Grid/Card Mode
        if (style.showImages && product.image) {
            contentHeight += (128 * imgScale);
        }
        
        // Name Height
        // Estimate name lines
        const usableColWidth = (USABLE_WIDTH - (24 * (columnCount - 1))) / columnCount;
        const nameCharWidth = fontSize * 0.6;
        const nameCharsPerLine = Math.floor(usableColWidth / nameCharWidth);
        const nameLines = Math.ceil(product.name.length / nameCharsPerLine) || 1;
        contentHeight += (fontSize * 1.6 * nameLines) + 6; 
        
        // Price Height
        contentHeight += (priceSize * 1.6) + 6;

        // Desc Height
        if (product.description) {
            const descCharWidth = descSize * 0.55;
            const descCharsPerLine = Math.floor(usableColWidth / descCharWidth);
            const lines = Math.ceil(product.description.length / descCharsPerLine);
            contentHeight += (descSize * 1.6 * lines) + 10;
        }
        
        contentHeight += 40; // Increased padding for Grid items

    } else {
        // List Mode
        const imgHeight = (style.showImages && product.image) ? (96 * imgScale) : 0;
        
        // Text Column Width (approx 70% if image exists, else 100%)
        const textWidth = style.showImages && product.image ? USABLE_WIDTH * 0.75 : USABLE_WIDTH;
        
        let textHeight = 0;
        
        // Name line
        const nameCharWidth = fontSize * 0.6;
        const nameLines = Math.ceil(product.name.length / Math.floor(textWidth / nameCharWidth)) || 1;
        textHeight += (fontSize * 1.6 * nameLines);
        
        // Desc block
        if (product.description) {
            const descCharWidth = descSize * 0.55;
            const descCharsPerLine = Math.floor(textWidth / descCharWidth);
            const lines = Math.ceil(product.description.length / descCharsPerLine);
            textHeight += (descSize * 1.6 * lines) + 8;
        }

        // Increased base padding/gap
        contentHeight = Math.max(imgHeight, textHeight) + itemGap;
    }

    return contentHeight + (product.customMarginTop || 0);
};

export const calculatePagination = (
    products: Product[],
    style: MenuStyle,
    groupedProducts: Record<string, Product[]>,
    sortedCategories: string[]
) => {
    const generatedPages: any[] = [];
    let currentPage: any[] = [];
    let currentHeight = 0;
    
    // VISIBILITY CHECK: Helper to check if item is hidden
    const isHidden = (id: string) => style.hiddenProductIds?.includes(id);

    // Header setup
    // Use dynamic spacing if available
    const titleToSub = style.elementStyles.menuTitle?.marginBottom || 10;
    const subToBody = style.elementStyles.menuSubtitle?.marginBottom || 20;
    
    // Estimate header height
    const titleSize = style.elementStyles.menuTitle?.fontSize || 48;
    const subSize = style.elementStyles.menuSubtitle?.fontSize || 18;
    const headerHeight = titleSize + subSize + titleToSub + subToBody + 20;

    const pagePadding = style.pagePadding || 48;
    // Calculating usable height dynamically based on padding
    const DYNAMIC_USABLE_HEIGHT = A4_HEIGHT_PX - (pagePadding * 2) - SAFETY_BUFFER;

    const catColCount = style.categoryColumnCount || 1;

    currentPage.push({ type: 'main-header' });
    currentHeight += headerHeight;

    const pageBreaks = new Set(style.pageBreaks || []);

    sortedCategories.forEach(category => {
      // Logic for Free Text Zones
      if (category.startsWith(FREE_TEXT_PREFIX)) {
           const categoryProducts = groupedProducts[category];
           if (categoryProducts && categoryProducts.length > 0) {
               categoryProducts.forEach(product => {
                  // FILTER HIDDEN PRODUCTS IN PREVIEW
                  if (isHidden(product.id)) return;

                  const pHeight = calculateItemHeight(product, style, false); 
                  
                  const availableVerticalSpace = DYNAMIC_USABLE_HEIGHT - currentHeight; 
                  
                  const isPage1 = generatedPages.length === 0;
                  const effectiveLimit = isPage1 
                      ? headerHeight + ((DYNAMIC_USABLE_HEIGHT - headerHeight) * catColCount)
                      : DYNAMIC_USABLE_HEIGHT * catColCount;

                  if (currentHeight + pHeight > effectiveLimit) {
                      generatedPages.push(currentPage);
                      currentPage = [];
                      currentHeight = 0;
                  }
                  currentPage.push({ type: 'product-item', data: product, category });
                  currentHeight += pHeight;
               });
           }
           return; 
      }

      const categoryProducts = groupedProducts[category];
      if (!categoryProducts || categoryProducts.length === 0) return;

      // FILTER HIDDEN PRODUCTS BEFORE RENDERING CATEGORY
      const visibleProducts = categoryProducts.filter(p => !isHidden(p.id));
      if (visibleProducts.length === 0) return; // Don't render category header if all products are hidden

      const isRowLayout = style.layoutMode === 'grid' || style.layoutMode === 'cards' || (style.columnCount || 1) > 1;
      const colCount = style.columnCount || 1;
      
      const catHeaderSize = style.elementStyles?.category?.fontSize || 24;
      const catMarginBottom = style.elementStyles?.category?.marginBottom || 16;
      const catHeaderHeight = catHeaderSize + catMarginBottom + 10;
      
      // Calculate height of the first content block (row or single item) to check for orphans
      let firstContentHeight = 0;
      if (visibleProducts.length > 0) {
         if (isRowLayout) {
             // For grid, take the max height of the first row
             const firstRow = visibleProducts.slice(0, colCount);
             firstContentHeight = Math.max(...firstRow.map(p => calculateItemHeight(p, style, true, colCount)));
         } else {
             firstContentHeight = calculateItemHeight(visibleProducts[0], style, false);
         }
      }

      // 1. Manual Page Break
      if (pageBreaks.has(category)) {
          if (currentPage.length > 0) {
              generatedPages.push(currentPage);
              currentPage = [];
              currentHeight = 0;
          }
      }

      // 2. ORPHAN CONTROL (Strict)
      const isPage1 = generatedPages.length === 0;
      const effectiveLimit = isPage1 
          ? headerHeight + ((DYNAMIC_USABLE_HEIGHT - headerHeight) * catColCount)
          : DYNAMIC_USABLE_HEIGHT * catColCount;

      if (currentHeight > 0 && (currentHeight + catHeaderHeight + firstContentHeight > effectiveLimit)) {
           generatedPages.push(currentPage);
           currentPage = [];
           currentHeight = 0;
      }

      // Add Header
      currentPage.push({ type: 'category-header', data: category, category: category });
      currentHeight += catHeaderHeight;

      if (isRowLayout) {
        for (let i = 0; i < visibleProducts.length; i += colCount) {
           const rowProducts = visibleProducts.slice(i, i + colCount);
           const rowHeight = Math.max(...rowProducts.map(p => calculateItemHeight(p, style, true, colCount)));
           
           const limitNow = (generatedPages.length === 0) 
               ? headerHeight + ((DYNAMIC_USABLE_HEIGHT - headerHeight) * catColCount)
               : DYNAMIC_USABLE_HEIGHT * catColCount;

           if (currentHeight + rowHeight > limitNow) {
                generatedPages.push(currentPage);
                currentPage = [];
                currentHeight = 0;
           }
           currentPage.push({ type: 'product-row', data: rowProducts, category });
           currentHeight += rowHeight;
        }
      } else {
        visibleProducts.forEach(product => {
          const pHeight = calculateItemHeight(product, style, false);
          
          const limitNow = (generatedPages.length === 0) 
               ? headerHeight + ((DYNAMIC_USABLE_HEIGHT - headerHeight) * catColCount)
               : DYNAMIC_USABLE_HEIGHT * catColCount;

          if (currentHeight + pHeight > limitNow) {
             generatedPages.push(currentPage);
             currentPage = [];
             currentHeight = 0;
           }
           currentPage.push({ type: 'product-item', data: product, category });
           currentHeight += pHeight;
        });
      }
    });

    if (currentPage.length > 0) generatedPages.push(currentPage);
    return generatedPages;
};
