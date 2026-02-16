import React, { useMemo, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { Product, MenuStyle, SortOption } from '../types';
import { AlertTriangle, Plus } from 'lucide-react';
import { calculatePagination } from '../utils/menuPagination';
import { useMenuInteractions } from '../hooks/useMenuInteractions';
import { MenuPage } from './MenuPage';

interface MenuPreviewProps {
  products: Product[];
  style: MenuStyle;
  sortOption: SortOption;
  onMoveCategory?: (category: string, direction: 'up' | 'down') => void;
  onMoveProduct?: (productId: string, category: string, direction: 'up' | 'down') => void;
  onUpdateProduct?: (id: string, field: keyof Product, value: any) => void;
  onUpdateProducts?: (updates: {id: string, field: keyof Product, value: any}[]) => void;
  onUpdateCategoryName?: (oldName: string, newName: string) => void;
  onUpdateMenuText?: (field: 'menuTitle' | 'menuSubtitle', value: string) => void;
  onCommitCategoryOrder?: (newOrder: string[]) => void;
  onCommitProductOrder?: (category: string, newOrder: string[]) => void;
  onToggleProductVisibility?: (productId: string, visible: boolean) => void;
  onAddProduct?: (category: string, productId?: string, isFreeText?: boolean, specificId?: string, initialData?: Partial<Product>, options?: { index?: number }) => void;
  onAddCategory?: (nearCategory: string, position: 'before' | 'after') => void;
  onDeleteProduct?: (productId: string) => void; 
  onStyleUpdate?: React.Dispatch<React.SetStateAction<MenuStyle>>;
  externalAction?: { type: string, id: number };
  onSelectionChange?: (selection: { type: 'product' | 'category' | 'freeText' | 'addedImage' | null, id: string | null }) => void;
  undo?: () => void;
  redo?: () => void;
  canUndo?: boolean;
  canRedo?: boolean;
  scale?: number;
}

// --- FONT LOADER COMPONENT ---
const DynamicFontLoader: React.FC<{ fonts: string[] }> = ({ fonts }) => {
    useEffect(() => {
        const uniqueFonts = Array.from(new Set(fonts)).filter(f => f && f !== 'Inherit');
        uniqueFonts.forEach((font: string) => {
            const linkId = `font-loader-${font.replace(/\s+/g, '-').toLowerCase()}`;
            if (!document.getElementById(linkId)) {
                const link = document.createElement('link');
                link.id = linkId;
                link.href = `https://fonts.googleapis.com/css2?family=${font.replace(/\s+/g, '+')}&display=swap`;
                link.rel = 'stylesheet';
                document.head.appendChild(link);
            }
        });
    }, [fonts]);
    return null;
};

export const MenuPreview: React.FC<MenuPreviewProps> = (props) => {
    // 1. Hook for all interactions and state
    const handlers = useMenuInteractions(props);
    const { 
        products, style, onAddProduct, onStyleUpdate, onDeleteProduct, onToggleProductVisibility
    } = props;

    // 2. Add wrapper handlers for clicking actions that need direct props access
    // This allows MenuItem to call handlers.handleAddClick
    (handlers as any).handleAddClick = (e: React.MouseEvent, category: string, isCategoryAdd: boolean, position: 'before' | 'after') => {
         e.stopPropagation();
         if (isCategoryAdd) {
             props.onAddCategory?.(category, position);
         } else {
             props.onAddProduct?.(category, undefined, false, undefined, undefined, { index: 0 }); 
         }
    };

    // 3. Font Loading
    const usedFonts = useMemo(() => {
        const fonts = new Set<string>();
        if (style.fontFamily) fonts.add(style.fontFamily);
        Object.values(style.elementStyles).forEach((es: any) => {
            if (es && es.fontFamily) fonts.add(es.fontFamily);
        });
        return Array.from(fonts);
    }, [style]);

    // 4. Pagination
    const pages = useMemo(() => {
        return calculatePagination(products, style, handlers.groupedProducts, handlers.sortedCategories);
    }, [products, style, handlers.groupedProducts, handlers.sortedCategories]);

    // 5. Page Management Handlers
    const handleAddPage = (index: number, position: 'before' | 'after' = 'after') => {
        const pageContent = pages[index];
        let referenceCategory = '';
        
        if (pageContent && pageContent.length > 0) {
            if (position === 'after') {
                for (let i = pageContent.length - 1; i >= 0; i--) {
                    if (pageContent[i].category) {
                        referenceCategory = pageContent[i].category;
                        break;
                    }
                }
            } else {
               for (let i = 0; i < pageContent.length; i++) {
                   if (pageContent[i].category) {
                       referenceCategory = pageContent[i].category;
                       break;
                   }
               }
            }
        }
        
        if (!referenceCategory) {
            if (position === 'after' && handlers.sortedCategories.length > 0) referenceCategory = handlers.sortedCategories[handlers.sortedCategories.length - 1];
            else if (handlers.sortedCategories.length > 0) referenceCategory = handlers.sortedCategories[0];
        }

        const newCategoryName = `New Section ${Math.floor(Math.random() * 10000)}`;
        const newProductId = crypto.randomUUID();
        
        onAddProduct?.(newCategoryName, undefined, false, newProductId, { name: 'New Item', price: 0, description: 'Description' });
        
        onStyleUpdate?.(prev => {
            const currentOrder = prev.customCategoryOrder && prev.customCategoryOrder.length > 0 ? [...prev.customCategoryOrder] : [...handlers.sortedCategories];
            handlers.sortedCategories.forEach(c => { if (!currentOrder.includes(c)) currentOrder.push(c); });

            const idx = currentOrder.indexOf(referenceCategory);
            if (idx !== -1) {
                if (position === 'after') {
                    currentOrder.splice(idx + 1, 0, newCategoryName);
                } else {
                    currentOrder.splice(idx, 0, newCategoryName);
                }
            } else {
                currentOrder.push(newCategoryName);
            }
            
            const currentBreaks = new Set(prev.pageBreaks || []);
            currentBreaks.add(newCategoryName); 
            
            return { ...prev, customCategoryOrder: currentOrder, pageBreaks: Array.from(currentBreaks), name: 'Custom' };
        });
    };

    const handleDeletePage = () => {
       if (handlers.pageToDelete === null) return;
       const pageItems = pages[handlers.pageToDelete];
       
       const prodIdsToHide: string[] = [];
       const freeTextIdsToDelete: string[] = [];
       
       pageItems.forEach((item: any) => {
           if (item.type === 'product-item' || item.type === 'product-row') {
               const data = Array.isArray(item.data) ? item.data : [item.data];
               data.forEach((p: Product) => {
                   if (p.isFreeText) freeTextIdsToDelete.push(p.id);
                   else prodIdsToHide.push(p.id);
               });
           }
       });
       
       if (onStyleUpdate) {
           onStyleUpdate(prev => {
               const currentHidden = new Set(prev.hiddenProductIds || []);
               prodIdsToHide.forEach(id => currentHidden.add(id));
               
               const categoriesOnPage = new Set(pageItems.map((i: any) => i.category).filter(Boolean));
               const newPageBreaks = (prev.pageBreaks || []).filter(c => !categoriesOnPage.has(c));

               return { ...prev, hiddenProductIds: Array.from(currentHidden), pageBreaks: newPageBreaks, name: 'Custom' };
           });
       }
       
       if (onDeleteProduct) {
           freeTextIdsToDelete.forEach(id => onDeleteProduct(id));
       }
       
       handlers.setShowDeletePageConfirm(false);
       handlers.setPageToDelete(null);
    };

    const restoreProduct = (id: string) => { onToggleProductVisibility?.(id, true); handlers.setShowAddModal(null); };
    const createNewInModal = () => { if (handlers.showAddModal) { onAddProduct?.(handlers.showAddModal.category); handlers.setShowAddModal(null); } };

    // FIX: GLOBAL DESELECTION
    const handleBackgroundClick = (e: React.MouseEvent) => {
        // Se o alvo do clique não for uma página, um produto ou um controle, limpe.
        const target = e.target as HTMLElement;
        if (target.closest('[data-page-index]') || target.closest('button') || target.closest('[contenteditable="true"]')) {
            return;
        }

        handlers.handleSelection(null, null);
        handlers.setEditingId(null);
        handlers.setSelectedPageIndex(null);
    };

    return (
        <div 
            className="flex justify-start w-full relative min-h-full min-w-full" 
            onClick={handleBackgroundClick}
        >
            <DynamicFontLoader fonts={usedFonts} />
            
            {handlers.showAddModal && ( createPortal( <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/20 backdrop-blur-sm" onClick={() => handlers.setShowAddModal(null)}> <div className="bg-white p-4 rounded-xl shadow-2xl animate-fade-in" onClick={e => e.stopPropagation()}> <h3 className="text-lg font-bold mb-4">Hidden Items</h3> <div className="space-y-2 max-h-60 overflow-y-auto"> {products.filter(p => p.category === handlers.showAddModal!.category && !handlers.groupedProducts[handlers.showAddModal!.category]?.find(gp => gp.id === p.id)).map(p => ( <button key={p.id} onClick={() => restoreProduct(p.id)} className="w-full p-2 text-left hover:bg-slate-100 rounded flex justify-between items-center"> <span>{p.name}</span> <Plus size={14} /> </button> ))} </div> <div className="mt-4 pt-4 border-t"> <button onClick={createNewInModal} className="w-full py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"> Create New Item </button> </div> </div> </div>, document.body ) )}

            <div className="flex flex-row gap-8 p-8 items-start min-h-full w-fit mx-auto">
                {pages.map((pageContent, i) => (
                    <MenuPage 
                        key={i}
                        pageIndex={i}
                        pageContent={pageContent}
                        style={style}
                        handlers={handlers}
                        products={products}
                        needsOverlay={!!style.sourceImage}
                        pageCount={pages.length}
                        onAddPage={handleAddPage}
                        onDeletePage={(idx) => { handlers.setShowDeletePageConfirm(true); handlers.setPageToDelete(idx); }}
                    />
                ))}
            </div>

            {handlers.showDeletePageConfirm && createPortal( <div className="fixed inset-0 z-[9999] bg-black/60 backdrop-blur-sm flex flex-col items-center justify-center p-4 animate-fade-in" onClick={(e) => e.stopPropagation()}> <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full text-center border border-slate-200 transform scale-100"> <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6 text-red-600"> <AlertTriangle size={32} /> </div> <h3 className="text-2xl font-bold text-slate-800 mb-3">Delete this page?</h3> <p className="text-slate-500 mb-8 leading-relaxed"> You are about to remove <strong>Page {handlers.pageToDelete !== null ? handlers.pageToDelete + 1 : ''}</strong>. All Free Text items will be <span className="text-red-600 font-bold">permanently deleted</span>. Products and categories will be hidden but remain in your database. </p> <div className="flex gap-4"> <button onClick={() => { handlers.setShowDeletePageConfirm(false); handlers.setPageToDelete(null); }} className="flex-1 py-3 rounded-xl border border-slate-300 text-slate-700 hover:bg-slate-50 font-semibold transition-colors"> Cancel </button> <button onClick={handleDeletePage} className="flex-1 py-3 rounded-xl bg-red-600 text-white hover:bg-red-700 font-semibold shadow-lg shadow-red-200 transition-colors"> Yes, Delete It </button> </div> </div> </div>, document.body )}
        </div>
    );
};