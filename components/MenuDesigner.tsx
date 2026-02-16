import React, { useState, useEffect, useRef } from 'react';
import { Product, MenuStyle, SortOption, ElementStyle, AddedImage } from '../types';
import { INITIAL_PRODUCTS, PRESET_TEMPLATES } from '../constants';
import { MenuPreview } from './MenuPreview';
import { fileToGenerativePart } from '../services/geminiService';
import { Undo, Redo } from 'lucide-react';
import { ZoomControls } from './MenuDesigner/ZoomControls';
import { MenuSidebar } from './MenuDesigner/MenuSidebar';

interface MenuDesignerProps {
  products: Product[];
  style: MenuStyle;
  setStyle: React.Dispatch<React.SetStateAction<MenuStyle>>;
  setProducts?: React.Dispatch<React.SetStateAction<Product[]>>; 
  templates?: MenuStyle[];
  sortOption: SortOption;
  setSortOption: React.Dispatch<React.SetStateAction<SortOption>>;
  undo?: () => void;
  redo?: () => void;
  canUndo?: boolean;
  canRedo?: boolean;
  isOpen?: boolean;
  isProductDesignerOpen?: boolean;
  onClose?: () => void;
  onScrollActivity?: (isScrolling: boolean) => void;
}

const MenuDesigner: React.FC<MenuDesignerProps> = ({ products, style, setStyle, setProducts, templates = [], sortOption, setSortOption, undo, redo, canUndo, canRedo, isOpen = true, isProductDesignerOpen = false, onClose, onScrollActivity }) => {
  const [scale, setScale] = useState(0.4); 
  
  // Zoom Indicator State
  const [showZoomInfo, setShowZoomInfo] = useState(false);
  const zoomTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const scrollTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const containerRef = useRef<HTMLDivElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);
  
  // State for selection context (What element is user clicking?)
  const [selection, setSelection] = useState<{ type: 'product' | 'category' | 'freeText' | 'addedImage' | null, id: string | null }>({ type: null, id: null });
  // State to trigger imperative actions in Preview from Sidebar
  const [previewAction, setPreviewAction] = useState<{ type: string, id: number } | undefined>(undefined);

  const displayProducts = products.length > 0 ? products : INITIAL_PRODUCTS;

  useEffect(() => {
    if (!containerRef.current) return;
    const calculateInitialScale = () => {
      if (containerRef.current) {
        const { width } = containerRef.current.getBoundingClientRect();
        const a4Width = 800; 
        const widthScale = (width - 60) / a4Width;
        const targetScale = Math.min(Math.max(widthScale, 0.3), 1.2);
        setScale(targetScale);
      }
    };
    calculateInitialScale();
  }, []); 

  const updateZoom = (delta: number) => {
      const newScale = Math.min(1.5, Math.max(0.2, scale + delta));
      setScale(newScale);
      
      // Show indicator logic
      setShowZoomInfo(true);
      if (zoomTimeoutRef.current) clearTimeout(zoomTimeoutRef.current);
      zoomTimeoutRef.current = setTimeout(() => {
          setShowZoomInfo(false);
      }, 2000);
  };

  const handlePrint = () => {
    window.print();
  };

  // Scroll Activity Handler
  const handleScroll = () => {
      if (onScrollActivity) {
          onScrollActivity(true);
          if (scrollTimeoutRef.current) clearTimeout(scrollTimeoutRef.current);
          scrollTimeoutRef.current = setTimeout(() => {
              onScrollActivity(false);
          }, 300); // UI reappears after 300ms of no scroll
      }
  };

  const handleResetDesign = () => {
    // 1. Find source of truth (Preset or Imported Template)
    let originalTemplate = PRESET_TEMPLATES.find(t => t.id === style.id);
    if (!originalTemplate) {
        originalTemplate = templates.find(t => t.id === style.id);
    }
    if (!originalTemplate) originalTemplate = PRESET_TEMPLATES[0];

    // 2. Apply Visual Styles (Preserve Content)
    setStyle(prev => ({
        ...prev,
        fontFamily: originalTemplate!.fontFamily,
        primaryColor: originalTemplate!.primaryColor,
        backgroundColor: originalTemplate!.backgroundColor,
        textColor: originalTemplate!.textColor,
        backgroundImage: originalTemplate!.backgroundImage,
        layoutMode: originalTemplate!.layoutMode,
        showImages: originalTemplate!.showImages,
        columnCount: originalTemplate!.columnCount,
        imageScale: originalTemplate!.imageScale ?? 1,
        elementStyles: JSON.parse(JSON.stringify(originalTemplate!.elementStyles || prev.elementStyles)), // Deep copy
        
        // Preserve User Content
        id: prev.id, 
        menuTitle: prev.menuTitle,
        menuSubtitle: prev.menuSubtitle,
        customCategoryOrder: prev.customCategoryOrder,
        customProductOrder: prev.customProductOrder,
        hiddenProductIds: prev.hiddenProductIds,
        floatingText: prev.floatingText,
        pageBreaks: prev.pageBreaks,
        addedImages: prev.addedImages, // Preserve custom added images on reset? Usually yes for "content".
        sourceImage: prev.sourceImage || originalTemplate!.sourceImage 
    }));
  };

  const applyTemplate = (template: MenuStyle) => {
    setStyle(prev => ({
      ...template,
      customCategoryOrder: prev.customCategoryOrder || [],
      customProductOrder: prev.customProductOrder || {},
      hiddenProductIds: prev.hiddenProductIds || [],
      floatingText: prev.floatingText || [],
      addedImages: prev.addedImages || [],
      menuTitle: prev.menuTitle,
      menuSubtitle: prev.menuSubtitle
    }));
  };

  const handleProductUpdate = (id: string, field: keyof Product, value: any) => {
    if (!setProducts) return;
    setProducts(prev => prev.map(p => p.id === id ? { ...p, [field]: value } : p));
  };

  const handleBatchProductUpdate = (updates: {id: string, field: keyof Product, value: any}[]) => {
      if (!setProducts) return;
      setProducts(prev => {
          const updateMap = new Map<string, Record<string, any>>();
          updates.forEach(u => {
              const existing = updateMap.get(u.id) || {};
              existing[u.field] = u.value;
              updateMap.set(u.id, existing);
          });
          return prev.map(p => {
              if (updateMap.has(p.id)) return { ...p, ...updateMap.get(p.id) };
              return p;
          });
      });
  };

  const handleCategoryRename = (oldName: string, newName: string) => {
    if (!setProducts || oldName === newName) return;
    setProducts(prev => prev.map(p => p.category === oldName ? { ...p, category: newName } : p));
  };

  const handleMenuTextUpdate = (field: 'menuTitle' | 'menuSubtitle', value: string) => {
    setStyle(prev => ({ ...prev, [field]: value }));
  };

  const handleToggleProductVisibility = (productId: string, visible: boolean) => {
      setStyle(prev => {
          const currentHidden = new Set(prev.hiddenProductIds || []);
          if (visible) currentHidden.delete(productId);
          else currentHidden.add(productId);
          return { ...prev, hiddenProductIds: Array.from(currentHidden), name: 'Custom' };
      });
  };

  const handleDeleteProduct = (productId: string) => {
      if (setProducts) setProducts(prev => prev.filter(p => p.id !== productId));
  };

  const handleAddProduct = (category: string, productId?: string, isFreeText?: boolean, specificId?: string, initialData?: Partial<Product>) => {
      if (productId) {
          handleToggleProductVisibility(productId, true);
          return;
      }
      if (setProducts) {
          const newId = specificId || crypto.randomUUID();
          if (isFreeText) {
               setProducts(prev => [...prev, {
                  id: newId,
                  name: 'New Text',
                  price: 0, 
                  description: '', 
                  category: category,
                  image: '',
                  isFreeText: true,
                  styles: { fontSize: 20, color: style.textColor, textAlign: 'left', fontWeight: 'normal' },
                  ...initialData 
              }]);
          } else {
              setProducts(prev => [...prev, {
                  id: newId,
                  name: 'New Item',
                  price: 0,
                  description: 'Description',
                  category: category,
                  image: '',
                  ...initialData
              }]);
          }
          setStyle(prev => {
              const currentHidden = new Set(prev.hiddenProductIds || []);
              currentHidden.delete(newId);
              return { ...prev, hiddenProductIds: Array.from(currentHidden) };
          });
      }
  };

  const handleAddCategory = (nearCategory: string, position: 'before' | 'after') => {
    if (!setProducts) return;
    const newCategoryName = `New Category ${Math.floor(Math.random() * 1000)}`;
    const newId = crypto.randomUUID();
    setProducts(prev => [...prev, { id: newId, name: 'New Item', price: 0, description: 'Description', category: newCategoryName, image: '' }]);
    setStyle(prev => {
        const distinctCategories = Array.from(new Set(displayProducts.map(p => p.category))).sort();
        let currentOrder = prev.customCategoryOrder && prev.customCategoryOrder.length > 0 ? [...prev.customCategoryOrder] : [...distinctCategories];
        distinctCategories.forEach(c => { if (!currentOrder.includes(c)) currentOrder.push(c); });
        const targetIdx = currentOrder.indexOf(nearCategory);
        if (targetIdx !== -1) {
            if (position === 'before') { currentOrder.splice(targetIdx, 0, newCategoryName); } 
            else { currentOrder.splice(targetIdx + 1, 0, newCategoryName); }
        } else { currentOrder.push(newCategoryName); }
        return { ...prev, customCategoryOrder: currentOrder, name: 'Custom' };
    });
  };

  const handleMoveCategory = (category: string, direction: 'up' | 'down') => {
      setStyle(prev => {
          const distinctCategories = Array.from(new Set(displayProducts.map(p => p.category))).sort();
          let currentOrder = prev.customCategoryOrder && prev.customCategoryOrder.length > 0 ? [...prev.customCategoryOrder] : [...distinctCategories];
          distinctCategories.forEach(c => { if (!currentOrder.includes(c)) currentOrder.push(c); });
          const idx = currentOrder.indexOf(category);
          if (idx === -1) return prev;
          const newOrder = [...currentOrder];
          if (direction === 'up') {
              if (idx === 0) return prev;
              [newOrder[idx - 1], newOrder[idx]] = [newOrder[idx], newOrder[idx - 1]];
          } else {
              if (idx === newOrder.length - 1) return prev;
              [newOrder[idx + 1], newOrder[idx]] = [newOrder[idx], newOrder[idx + 1]];
          }
          return { ...prev, customCategoryOrder: newOrder, name: 'Custom' };
      });
  };

  const handleMoveProduct = (productId: string, category: string, direction: 'up' | 'down') => {
      setStyle(prev => {
           const categoryProducts = displayProducts.filter(p => p.category === category);
           let currentOrder = prev.customProductOrder?.[category] ? [...prev.customProductOrder[category]] : categoryProducts.map(p => p.id);
           const validIds = new Set(categoryProducts.map(p => p.id));
           currentOrder = currentOrder.filter(id => validIds.has(id));
           categoryProducts.forEach(p => { if (!currentOrder.includes(p.id)) currentOrder.push(p.id); });
           const idx = currentOrder.indexOf(productId);
           if (idx === -1) return prev;
           const newOrder = [...currentOrder];
           if (direction === 'up') {
               if (idx === 0) return prev;
               [newOrder[idx - 1], newOrder[idx]] = [newOrder[idx], newOrder[idx - 1]];
           } else {
               if (idx === newOrder.length - 1) return prev;
               [newOrder[idx + 1], newOrder[idx]] = [newOrder[idx], newOrder[idx + 1]];
           }
           return { ...prev, customProductOrder: { ...prev.customProductOrder, [category]: newOrder }, name: 'Custom' };
      });
  };

  const handleCommitCategoryOrder = (newOrder: string[]) => {
    setStyle(prev => ({ ...prev, customCategoryOrder: newOrder, name: 'Custom' }));
  };

  const handleCommitProductOrder = (category: string, newOrder: string[]) => {
    setStyle(prev => ({ ...prev, customProductOrder: { ...prev.customProductOrder, [category]: newOrder }, name: 'Custom' }));
  };

  const updateGlobalElementStyle = (elementType: keyof MenuStyle['elementStyles'], newStyle: ElementStyle) => {
      setStyle(prev => ({ ...prev, elementStyles: { ...prev.elementStyles, [elementType]: newStyle }, name: 'Custom' }));
  };

  const updateFreeTextStyle = (id: string, newStyle: ElementStyle) => {
      if (!setProducts) return;
      setProducts(prev => prev.map(p => p.id === id ? { ...p, styles: newStyle } : p));
  };

  const handleImageResize = (delta: number) => {
      setStyle(prev => {
          const currentScale = prev.imageScale || 1;
          const newScale = Math.max(0.5, Math.min(2, currentScale + delta));
          return { ...prev, imageScale: newScale, name: 'Custom' };
      });
  };

  const handleAddedImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;

      try {
          const base64Data = await fileToGenerativePart(file);
          const dataUrl = `data:${file.type};base64,${base64Data}`;
          const newId = crypto.randomUUID();
          
          const newImage: AddedImage = {
              id: newId,
              url: dataUrl,
              x: 100, // Default position 100px
              y: 100, // Default position 100px
              width: 300, // Default width
              pageIndex: 0 // Default to first page (could be improved to current view)
          };

          setStyle(prev => ({
              ...prev,
              addedImages: [...(prev.addedImages || []), newImage],
              name: 'Custom'
          }));

          // Automatically select it
          setTimeout(() => {
              setSelection({ type: 'addedImage', id: newId });
          }, 100);

      } catch (err) {
          console.error("Failed to add image", err);
          alert("Could not load image.");
      } finally {
          // We can't clear ref here easily as it lives in child, but standard file input behavior is okay
      }
  };

  const selectedFreeText = selection.type === 'freeText' && selection.id ? products.find(p => p.id === selection.id) || null : null;
  const selectedAddedImage = selection.type === 'addedImage' && selection.id ? (style.addedImages || []).find(img => img.id === selection.id) || null : null;

  return (
    <div className="flex flex-row-reverse h-[calc(100vh-80px)] bg-slate-100 overflow-hidden relative">
      
      {/* 1. PREVIEW AREA */}
      <div 
        className={`flex-1 w-full relative bg-slate-200/50 flex flex-col min-w-0 transition-all duration-300 h-full`}
        ref={containerRef}
      >
        <ZoomControls 
            scale={scale}
            updateZoom={updateZoom}
            showZoomInfo={showZoomInfo}
        />

        {/* Undo/Redo Controls - Dynamic Positioning for Bottom Sheet */}
        <div className={`absolute right-4 z-10 flex gap-2 transition-all duration-300 ${(isOpen || isProductDesignerOpen) ? 'bottom-[50vh] md:bottom-24' : 'bottom-24'}`}>
          <button onClick={undo} disabled={!canUndo} className={`p-2 bg-white rounded-full shadow-lg hover:bg-slate-50 text-slate-700 transition-all ${!canUndo ? 'opacity-50 cursor-not-allowed' : ''}`} title="Undo"> <Undo size={16} /> </button>
          <button onClick={redo} disabled={!canRedo} className={`p-2 bg-white rounded-full shadow-lg hover:bg-slate-50 text-slate-700 transition-all ${!canRedo ? 'opacity-50 cursor-not-allowed' : ''}`} title="Redo"> <Redo size={16} /> </button>
        </div>

        <div className="flex-1 overflow-auto custom-scrollbar p-4 md:p-8 flex items-start justify-start" onScroll={handleScroll}>
           <div style={{ transform: `scale(${scale})`, transformOrigin: 'top left', width: 'fit-content', minWidth: '794px', }} className="transition-transform duration-200 ease-out">
              <MenuPreview 
                products={displayProducts} 
                style={style} 
                sortOption={sortOption}
                onMoveCategory={handleMoveCategory}
                onMoveProduct={handleMoveProduct}
                onUpdateProduct={handleProductUpdate}
                onUpdateProducts={handleBatchProductUpdate}
                onUpdateCategoryName={handleCategoryRename}
                onUpdateMenuText={handleMenuTextUpdate}
                onCommitCategoryOrder={handleCommitCategoryOrder}
                onCommitProductOrder={handleCommitProductOrder}
                onToggleProductVisibility={handleToggleProductVisibility}
                onAddProduct={handleAddProduct}
                onAddCategory={handleAddCategory}
                onDeleteProduct={handleDeleteProduct}
                onStyleUpdate={setStyle}
                externalAction={previewAction}
                onSelectionChange={setSelection}
                undo={undo}
                redo={redo}
                canUndo={canUndo}
                canRedo={canRedo}
                scale={scale}
              />
           </div>
           <div style={{ height: '100px', width: '1px' }} />
        </div>
      </div>

      {/* 2. SIDEBAR EDITOR */}
      <MenuSidebar 
        isOpen={isOpen || false}
        onClose={onClose}
        handlePrint={handlePrint}
        handleResetDesign={handleResetDesign}
        style={style}
        setStyle={setStyle}
        templates={templates}
        applyTemplate={applyTemplate}
        sortOption={sortOption}
        setSortOption={setSortOption}
        selection={selection}
        setSelection={setSelection}
        selectedFreeText={selectedFreeText}
        selectedAddedImage={selectedAddedImage}
        updateFreeTextStyle={updateFreeTextStyle}
        updateGlobalElementStyle={updateGlobalElementStyle}
        setPreviewAction={setPreviewAction}
        handleAddedImageUpload={handleAddedImageUpload}
        handleImageResize={handleImageResize}
      />
    </div>
  );
};

export default MenuDesigner;