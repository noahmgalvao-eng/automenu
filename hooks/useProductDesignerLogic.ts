
import React, { useState, useRef } from 'react';
import { Product, MenuStyle, SortOption, AddedImage } from '../types';
import { useMenuInteractions } from '../hooks/useMenuInteractions';
import { analyzeMenuImage, fileToGenerativePart } from '../services/geminiService';
import { processDecoration } from '../utils/imageProcessor';

interface UseProductDesignerLogicProps {
  products: Product[];
  setProducts: React.Dispatch<React.SetStateAction<Product[]>>;
  style: MenuStyle;
  setStyle: React.Dispatch<React.SetStateAction<MenuStyle>>;
  setTemplates?: React.Dispatch<React.SetStateAction<MenuStyle[]>>;
  sortOption: SortOption;
}

export const useProductDesignerLogic = ({
  products,
  setProducts,
  style,
  setStyle,
  setTemplates,
  sortOption
}: UseProductDesignerLogicProps) => {
  // --- STATE ---
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set()); 
  const [collapsedCategories, setCollapsedCategories] = useState<Set<string>>(new Set());
  const [editModeId, setEditModeId] = useState<string | null>(null);
  const [menuOpenId, setMenuOpenId] = useState<string | null>(null);
  const [showInsights, setShowInsights] = useState(false);
  const [bulkPercentage, setBulkPercentage] = useState<number | string>('');
  const [isUploading, setIsUploading] = useState(false);
  
  // Draft State
  const [newItemDraft, setNewItemDraft] = useState<{ categoryId: string, type: 'product' | 'category', value: Partial<Product> } | null>(null);

  // Form State
  const [formData, setFormData] = useState<Partial<Product>>({});
  const [uploadTargetId, setUploadTargetId] = useState<string | null>(null);

  // Refs
  const fileInputRef = useRef<HTMLInputElement>(null);
  const productFileInputRef = useRef<HTMLInputElement>(null);

  // --- INTERACTION HANDLERS ---
  const handleCommitCategoryOrder = (newOrder: string[]) => {
       setStyle(prev => ({ ...prev, customCategoryOrder: newOrder, name: 'Custom' }));
  };

  const handleCommitProductOrder = (category: string, newOrder: string[]) => {
       setStyle(prev => ({
           ...prev,
           customProductOrder: { ...prev.customProductOrder, [category]: newOrder },
           name: 'Custom'
       }));
  };
  
  const handleUpdateProducts = (updates: {id: string, field: keyof Product, value: any}[]) => {
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
  
  const handleToggleVisibility = (id: string, visible: boolean) => {
      // Determine if ID is a category by checking if it's in the sorted categories list
      const isCategory = handlers.sortedCategories.includes(id);

      setStyle(prev => {
          const currentHidden = new Set(prev.hiddenProductIds || []);
          
          if (isCategory) {
              // Hide/Show ALL products in this category
              const catProducts = products.filter(p => p.category === id);
              catProducts.forEach(p => {
                  if (visible) currentHidden.delete(p.id);
                  else currentHidden.add(p.id);
              });
          } else {
              // Hide/Show Single Product
              if (visible) currentHidden.delete(id);
              else currentHidden.add(id);
          }
          
          return { ...prev, hiddenProductIds: Array.from(currentHidden), name: 'Custom' };
      });
      // Do not close menu immediately to allow user to see change, or close it if preferred.
      // setMenuOpenId(null); 
  };

  const handlers = useMenuInteractions({
      products,
      style,
      sortOption,
      onCommitCategoryOrder: handleCommitCategoryOrder,
      onCommitProductOrder: handleCommitProductOrder,
      onUpdateProducts: handleUpdateProducts,
      onToggleProductVisibility: handleToggleVisibility
  });

  // --- LOCAL HANDLERS ---

  const toggleCollapse = (cat: string) => {
    setCollapsedCategories(prev => {
        const next = new Set(prev);
        if (next.has(cat)) next.delete(cat);
        else next.add(cat);
        return next;
    });
  };

  const handleBulkAdjust = (direction: 1 | -1) => {
    const pct = Number(bulkPercentage);
    if (!pct) return;
    const multiplier = 1 + (direction * (pct / 100));
    setProducts(prev => prev.map(p => {
        if (p.isFreeText) return p;
        return { ...p, price: parseFloat((p.price * multiplier).toFixed(2)) };
    }));
  };

  const handleProductImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !uploadTargetId) return;
    try {
        const base64 = await fileToGenerativePart(file);
        const url = `data:${file.type};base64,${base64}`;
        setProducts(prev => prev.map(p => p.id === uploadTargetId ? { ...p, image: url } : p));
    } catch (err) {
        console.error(err);
    } finally {
        setUploadTargetId(null);
        if (productFileInputRef.current) productFileInputRef.current.value = '';
    }
  };

  const onProductImageClick = (id: string) => {
    setUploadTargetId(id);
    productFileInputRef.current?.click();
  };

  const onRemoveProductImage = (id: string) => {
    setProducts(prev => prev.map(p => p.id === id ? { ...p, image: '' } : p));
  };

  const startEdit = (id: string, initialData: Partial<Product>) => {
    setEditModeId(id);
    setFormData(initialData);
    setMenuOpenId(null);
  };

  const cancelEdit = () => {
    setEditModeId(null);
    setNewItemDraft(null);
    setFormData({});
  };

  const initiateAdd = (categoryId: string, type: 'product' | 'category') => {
    setNewItemDraft({ categoryId, type, value: {} });
    setEditModeId('DRAFT');
    setFormData({ name: type === 'category' ? '' : '', price: 0, description: '' });
  };

  const saveEdit = () => {
    if (!editModeId) return;
    
    if (newItemDraft) {
        if (newItemDraft.type === 'product') {
             const newProd: Product = {
                 id: crypto.randomUUID(),
                 name: formData.name || 'New Item',
                 price: formData.price || 0,
                 description: formData.description || '',
                 category: newItemDraft.categoryId,
                 image: ''
             };
             setProducts(prev => [...prev, newProd]);
             setStyle(prev => {
                 const current = prev.customProductOrder?.[newProd.category] || (handlers.groupedProducts[newProd.category] || []).map(p=>p.id);
                 return {
                     ...prev,
                     customProductOrder: { ...prev.customProductOrder, [newProd.category]: [...current, newProd.id] },
                     name: 'Custom'
                 };
             });
        } else if (newItemDraft.type === 'category') {
            const newCatName = formData.name || 'New Category';
            if (!newCatName) return; 

            // Add to custom order
            setStyle(prev => {
                const currentOrder = prev.customCategoryOrder && prev.customCategoryOrder.length > 0 ? [...prev.customCategoryOrder] : [...handlers.sortedCategories];
                const refIdx = currentOrder.indexOf(newItemDraft.categoryId);
                if (refIdx !== -1) currentOrder.splice(refIdx + 1, 0, newCatName);
                else currentOrder.push(newCatName);
                return { ...prev, customCategoryOrder: currentOrder, name: 'Custom' };
            });
            
            const newId = crypto.randomUUID();
            const placeholderProd: Product = {
                 id: newId,
                 name: 'New Item',
                 price: 0, 
                 description: 'Description',
                 category: newCatName,
                 image: ''
            };
            setProducts(prev => [...prev, placeholderProd]);
        }
        setNewItemDraft(null);
    } else {
         setProducts(prev => prev.map(p => {
             if (p.id === editModeId) return { ...p, ...formData } as Product;
             return p;
         }));
         if (handlers.sortedCategories.includes(editModeId)) {
              const oldName = editModeId;
              const newName = formData.name;
              if (newName && newName !== oldName) {
                  setProducts(prev => prev.map(p => p.category === oldName ? { ...p, category: newName } : p));
                  setStyle(prev => {
                      const newOrder = (prev.customCategoryOrder || handlers.sortedCategories).map(c => c === oldName ? newName : c);
                      const newProdOrder = { ...prev.customProductOrder };
                      if (newProdOrder[oldName]) {
                          newProdOrder[newName] = newProdOrder[oldName];
                          delete newProdOrder[oldName];
                      }
                      return { ...prev, customCategoryOrder: newOrder, customProductOrder: newProdOrder, name: 'Custom' };
                  });
              }
         }
    }
    setEditModeId(null);
    setFormData({});
  };

  const remove = (id: string, type: 'product' | 'category') => {
    // This function permanently deletes items from the database
    if (window.confirm(`Permanently delete this ${type}?`)) {
        if (type === 'product') {
            setProducts(prev => prev.filter(p => p.id !== id));
            // Cleanup references in style
            setStyle(prev => {
                const newHidden = (prev.hiddenProductIds || []).filter(hid => hid !== id);
                const newOrder = { ...prev.customProductOrder };
                // Clean from all category orders
                Object.keys(newOrder).forEach(cat => {
                    if (newOrder[cat]) {
                        newOrder[cat] = newOrder[cat].filter(pid => pid !== id);
                    }
                });
                return { ...prev, hiddenProductIds: newHidden, customProductOrder: newOrder, name: 'Custom' };
            });
        } else {
            // Delete Category = Delete all products in it
            setProducts(prev => prev.filter(p => p.category !== id));
             setStyle(prev => {
                const newCatOrder = (prev.customCategoryOrder || []).filter(c => c !== id);
                const newProdOrder = { ...prev.customProductOrder };
                delete newProdOrder[id];
                return { ...prev, customCategoryOrder: newCatOrder, customProductOrder: newProdOrder, name: 'Custom' };
            });
        }
    }
    setMenuOpenId(null);
  };

  // --- AI IMPORT LOGIC ---
  const handleAIImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsUploading(true);
    try {
        const base64 = await fileToGenerativePart(file);
        const res = await analyzeMenuImage(base64, file.type);
        
        const extractedProducts = res.products;

        if (res.styleSuggestion) {
            const aiStyle = res.styleSuggestion;
            
            const colors = aiStyle.globalColors || {};
            const layout = aiStyle.layout || {};
            const typo = aiStyle.typography || {};
            const spacing = aiStyle.spacing || {};
            const decorations = aiStyle.decorations || [];
            const freeTextElements = aiStyle.freeTextElements || [];

            const primaryColor = colors.primary || '#000000';
            const bgColor = colors.background || '#ffffff';
            const textColor = colors.text || '#1f2937';
            
            let bgUrl = '';
            if (colors.backgroundType === 'image/texture') {
                 bgUrl = URL.createObjectURL(file);
            }

            const extractedAddedImages: AddedImage[] = [];
            if (decorations && decorations.length > 0) {
                const A4_WIDTH = 794;
                const A4_HEIGHT = 1123;
                
                await Promise.all(decorations.map(async (dec: any) => {
                    if (dec.boundingBox) {
                        try {
                            const cropUrl = await processDecoration(file, dec.boundingBox);
                            const x = (dec.boundingBox.xmin / 100) * A4_WIDTH;
                            const y = (dec.boundingBox.ymin / 100) * A4_HEIGHT;
                            const w = ((dec.boundingBox.xmax - dec.boundingBox.xmin) / 100) * A4_WIDTH;
                            
                            extractedAddedImages.push({
                                id: crypto.randomUUID(),
                                url: cropUrl,
                                x: x,
                                y: y,
                                width: w,
                                pageIndex: 0 
                            });
                        } catch (cropErr) {
                            console.warn("Failed to crop decoration:", cropErr);
                        }
                    }
                }));
            }

            const newStyle: MenuStyle = {
                id: crypto.randomUUID(),
                name: `AI Design (${new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})})`,
                menuTitle: typo.mainTitle?.text || 'MENU', 
                menuSubtitle: (typo.subtitle?.exists && typo.subtitle?.text) ? typo.subtitle.text : '',
                fontFamily: typo.mainTitle?.fontFamily || 'Inter', 
                primaryColor: primaryColor,
                backgroundColor: bgColor,
                textColor: textColor,
                backgroundImage: bgUrl, 
                sourceImage: '',
                addedImages: extractedAddedImages,
                
                layoutMode: 'list', 
                showImages: false, 
                columnCount: 1,
                categoryColumnCount: layout.categoryColumnCount || 1,
                pagePadding: layout.contentPadding || 48,
                globalRadius: layout.globalRadius || 0,
                itemGap: spacing.betweenProducts || 16,
                
                customCategoryOrder: [],
                customProductOrder: {},
                hiddenProductIds: [],
                
                elementStyles: {
                    menuTitle: {
                        fontFamily: typo.mainTitle?.fontFamily,
                        fontSize: typo.mainTitle?.fontSize || 48,
                        color: typo.mainTitle?.color || primaryColor,
                        textAlign: typo.mainTitle?.alignment || 'center',
                        textTransform: typo.mainTitle?.textTransform || 'uppercase',
                        fontWeight: '700',
                        marginBottom: spacing.titleToSubtitle || 10
                    },
                    menuSubtitle: {
                        fontFamily: typo.subtitle?.fontFamily,
                        fontSize: typo.subtitle?.fontSize || 18,
                        color: typo.subtitle?.color || textColor,
                        textAlign: typo.mainTitle?.alignment || 'center',
                        textTransform: 'none',
                        marginBottom: 20
                    },
                    category: { 
                        fontFamily: typo.category?.fontFamily,
                        fontSize: typo.category?.fontSize || 24, 
                        fontWeight: '700', 
                        textAlign: typo.category?.alignment || 'left', 
                        color: typo.category?.color || primaryColor,
                        textTransform: typo.category?.textTransform || 'uppercase',
                        marginBottom: spacing.categoryToFirstProduct || 16
                    },
                    productName: { 
                        fontFamily: typo.productName?.fontFamily,
                        fontSize: typo.productName?.fontSize || 16, 
                        fontWeight: typo.productName?.fontWeight || '600', 
                        textAlign: 'left',
                        color: typo.productName?.color || textColor,
                        textTransform: 'none'
                    },
                    productPrice: { 
                        fontFamily: typo.productPrice?.fontFamily,
                        fontSize: typo.productPrice?.fontSize || 16, 
                        fontWeight: '700', 
                        textAlign: 'right', 
                        color: typo.productPrice?.color || colors.secondary || primaryColor
                    },
                    productDescription: { 
                        fontFamily: typo.productDescription?.fontFamily,
                        fontSize: typo.productDescription?.fontSize || 12, 
                        fontWeight: '400', 
                        textAlign: 'left', 
                        color: typo.productDescription?.color || textColor,
                        italic: typo.productDescription?.fontStyle === 'italic'
                    }
                }
            };

            const freeTextProducts: Product[] = freeTextElements.map((ft: any) => ({
                id: crypto.randomUUID(),
                name: ft.text,
                price: 0,
                description: '',
                category: 'ft_imported', 
                image: '',
                isFreeText: true,
                customMarginTop: 10,
                styles: {
                    fontSize: ft.fontSize,
                    color: ft.color,
                    textAlign: ft.alignment || 'left',
                    fontFamily: ft.fontFamily,
                    fontWeight: ft.fontWeight,
                    textTransform: ft.textTransform
                }
            }));

            const finalProducts = [...extractedProducts, ...freeTextProducts];

            setProducts(prev => [...prev, ...finalProducts]);
            
            if (setTemplates) {
                setTemplates(prev => [newStyle, ...prev]);
            }
            
            setStyle(newStyle);
            alert(`Import successful! extracted ${extractedAddedImages.length} decorative elements (with background removal) and text.`);
        } else {
             setProducts(prev => [...prev, ...extractedProducts]);
             alert(`Imported ${extractedProducts.length} items (No style detected).`);
        }
    } catch (err) {
        console.error(err);
        alert("Error importing menu. Please try again.");
    } finally {
        setIsUploading(false);
        if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  return {
    // State
    collapsedCategories,
    editModeId,
    menuOpenId,
    showInsights,
    bulkPercentage,
    isUploading,
    newItemDraft,
    formData,
    
    // Setters
    setMenuOpenId,
    setShowInsights,
    setBulkPercentage,
    setFormData,

    // Refs
    fileInputRef,
    productFileInputRef,

    // Handlers
    handlers,
    toggleCollapse,
    handleBulkAdjust,
    handleProductImageUpload,
    onProductImageClick,
    onRemoveProductImage,
    startEdit,
    cancelEdit,
    initiateAdd,
    saveEdit,
    remove,
    handleToggleVisibility,
    handleAIImport
  };
};
