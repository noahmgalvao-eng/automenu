import React, { useRef, useMemo } from 'react';
import { Product } from '../../types';
import { InteractionProps, DraftItem, NUDGE_STEP, FREE_TEXT_PREFIX, STANDARD_GAP, A4_HEIGHT_PX } from './types';

export const useKeyboardMovement = (
    props: InteractionProps,
    sortedCategories: string[],
    groupedProducts: Record<string, Product[]>,
    draftItem: DraftItem | null,
    setDraftItem: (item: DraftItem | null) => void
) => {
    const { 
        products, scale,
        onMoveCategory, onMoveProduct, onUpdateProduct, onUpdateProducts,
        onCommitProductOrder, onStyleUpdate, onAddProduct, onAddCategory, onToggleProductVisibility, onDeleteProduct
    } = props;

    const draftInputRef = useRef<HTMLDivElement>(null);

    // 3. Flattened Visual List (For Arrow Navigation)
    const visualList = useMemo(() => {
        const list: { type: 'header' | 'product', id: string, category: string, product?: Product, globalIndex: number }[] = [];
        let gIdx = 0;
        sortedCategories.forEach(cat => {
            list.push({type: 'header',id: cat,category: cat,globalIndex: gIdx++});
            const prods = groupedProducts[cat] || [];
            prods.forEach(p => {
                list.push({ type: 'product', id: p.id, category: cat, product: p, globalIndex: gIdx++ });
            });
        });
        return list;
    }, [sortedCategories, groupedProducts]);

    const handleGlobalMove = (e: React.MouseEvent, type: 'category' | 'product', id: string, catName: string, direction: 'up' | 'down') => {
        e.stopPropagation();
        
        // Standard Category Move
        if (type === 'category') {
            onMoveCategory?.(id, direction);
            return;
        }
        
        const product = products.find(p => p.id === id);
        if (!product) return;

        if (!product.isFreeText) {
            onMoveProduct?.(id, catName, direction);
            return;
        }
        
        // --- UNIFIED FREE TEXT MOTION LOGIC ---
        const currentIndex = visualList.findIndex(item => item.id === id);
        if (currentIndex === -1) return;
        
        const neighbor = direction === 'up' ? visualList[currentIndex - 1] : visualList[currentIndex + 1];
        
        // --- MOVE UP (FAIL-SAFE FLOW) ---
        if (direction === 'up') {
            // 1. ROBUST DATA FETCHING
            const currentMargin = Number(product.customMarginTop || 0);
            const neighborAbove = visualList[currentIndex - 1]; 
            const neighborBelow = visualList[currentIndex + 1];

            // Helper to get the actual item below to compensate (skipping its header if needed)
            const getCompensatableNeighborBelow = () => {
                let target = neighborBelow;
                if (target && target.type === 'header') {
                    // If neighbor below is a header, look at the first product inside it
                    target = visualList[currentIndex + 2];
                }
                return (target && target.type === 'product' && target.product) ? target : null;
            };

            // 2. INTERACTION PHASE (Only if touching neighbor above)
            if (neighborAbove && currentMargin <= STANDARD_GAP) {
                
                // Try A: SWAP (Free Text or Same Category)
                if (neighborAbove.type === 'product' && neighborAbove.product &&
                    (neighborAbove.product.isFreeText || neighborAbove.product.category === product.category)) {
                    
                    if (onUpdateProducts && onCommitProductOrder) {
                        const neighborMargin = Number(neighborAbove.product.customMarginTop ?? 0);
                        const updates: { id: string, field: keyof Product, value: any }[] = [
                            { id: product.id, field: 'customMarginTop' as keyof Product, value: neighborMargin },
                            { id: neighborAbove.id, field: 'customMarginTop' as keyof Product, value: currentMargin },
                        ];
                        if (product.category !== neighborAbove.product.category) {
                            updates.push({ id: product.id, field: 'category' as keyof Product, value: neighborAbove.product.category });
                            updates.push({ id: neighborAbove.id, field: 'category' as keyof Product, value: product.category });
                        }
                        onUpdateProducts(updates);

                        if (product.category === neighborAbove.product.category) {
                            const currentOrder = groupedProducts[product.category].map(p => p.id);
                            const idx1 = currentOrder.indexOf(id);
                            const idx2 = currentOrder.indexOf(neighborAbove.id);
                            if (idx1 !== -1 && idx2 !== -1) {
                                const newOrder = [...currentOrder];
                                [newOrder[idx1], newOrder[idx2]] = [newOrder[idx2], newOrder[idx1]];
                                onCommitProductOrder(product.category, newOrder);
                            }
                        }
                    }
                    return; // Success
                }

                // Try B: ENTER CATEGORY (Bottom-Up Entry - Direct Neighbor Product)
                if (neighborAbove.type === 'product' && neighborAbove.product && 
                    !neighborAbove.product.category.startsWith(FREE_TEXT_PREFIX)) {
                        
                        const targetCat = neighborAbove.product.category;
                        if (onUpdateProducts && onCommitProductOrder) {
                            const currentOrder = groupedProducts[targetCat]?.map(p => p.id) || [];
                            const neighborIndex = currentOrder.indexOf(neighborAbove.id);
                            const newOrder = [...currentOrder];
                            
                            // Append after neighbor (index + 1)
                            if (neighborIndex !== -1) newOrder.splice(neighborIndex + 1, 0, product.id);
                            else newOrder.push(product.id);

                            const updates: { id: string, field: keyof Product, value: any }[] = [
                                { id: product.id, field: 'category' as keyof Product, value: targetCat },
                                { id: product.id, field: 'customMarginTop' as keyof Product, value: 0 }
                            ];

                            // COMPENSATION FIX: Pass ONLY margin to neighbor below (Height is conserved by flow)
                            const compensatableNeighbor = getCompensatableNeighborBelow();
                            if (compensatableNeighbor && compensatableNeighbor.product) {
                                const nextMargin = Number(compensatableNeighbor.product.customMarginTop || 0);
                                updates.push({
                                    id: compensatableNeighbor.id,
                                    field: 'customMarginTop',
                                    value: nextMargin + currentMargin
                                });
                            }

                            onUpdateProducts(updates);
                            onCommitProductOrder(targetCat, newOrder);
                        }
                        return; // Success
                }
                
                // Try C: HEADER EXIT
                if (neighborAbove.type === 'header') {
                        // MERGE INTO CATEGORY ABOVE logic
                        const itemAboveHeader = visualList[currentIndex - 2];

                        // Common Logic for merging up
                        const performMergeUp = (targetCat: string) => {
                             if (onUpdateProducts && onCommitProductOrder) {
                                 const currentOrder = groupedProducts[targetCat]?.map(p => p.id) || [];
                                 const newOrder = currentOrder.includes(product.id) ? currentOrder : [...currentOrder, product.id];
                                 
                                 const updates: { id: string, field: keyof Product, value: any }[] = [
                                     { id: product.id, field: 'category' as keyof Product, value: targetCat },
                                     { id: product.id, field: 'customMarginTop' as keyof Product, value: 0 }
                                 ];

                                 // COMPENSATION FIX: Pass ONLY margin to neighbor below (Height is conserved by flow)
                                 const compensatableNeighbor = getCompensatableNeighborBelow();
                                 if (compensatableNeighbor && compensatableNeighbor.product) {
                                     const nextMargin = Number(compensatableNeighbor.product.customMarginTop || 0);
                                     updates.push({
                                         id: compensatableNeighbor.id,
                                         field: 'customMarginTop',
                                         value: nextMargin + currentMargin
                                     });
                                 }

                                 onUpdateProducts(updates);
                                 onCommitProductOrder(targetCat, newOrder);
                            }
                        };

                        // Case 1: Above header is a product in a regular category
                        if (itemAboveHeader && itemAboveHeader.type === 'product' && 
                            !itemAboveHeader.category.startsWith(FREE_TEXT_PREFIX)) {
                                performMergeUp(itemAboveHeader.category);
                                return;
                        }

                        // Case 2: Above header is a header of a regular category (empty)
                        if (itemAboveHeader && itemAboveHeader.type === 'header' && 
                            !itemAboveHeader.category.startsWith(FREE_TEXT_PREFIX)) {
                                performMergeUp(itemAboveHeader.category);
                                return;
                        }

                        // Fallback: Create new ghost category
                        if (onStyleUpdate && onUpdateProduct) {
                            const newGhostCat = `${FREE_TEXT_PREFIX}${crypto.randomUUID()}`;
                            onStyleUpdate(prev => {
                                const cats = [...(prev.customCategoryOrder || sortedCategories)];
                                const idx = cats.indexOf(neighborAbove.category);
                                if (idx !== -1) cats.splice(idx, 0, newGhostCat);
                                return { ...prev, customCategoryOrder: cats, name: 'Custom' };
                            });
                            onUpdateProduct(id, 'category', newGhostCat);
                        }
                        return; // Success
                }

                // Try D: FORCE SWAP (Fallback for Blocking)
                // If we reached here, we are touching a product but couldn't enter. 
                // We MUST jump over it to prevent getting stuck.
                if (neighborAbove.type === 'product' && neighborAbove.product) {
                        // Treat as swap even if different category (simplistic fallback)
                        if (onUpdateProducts) {
                            const neighborMargin = Number(neighborAbove.product.customMarginTop ?? 0);
                            onUpdateProducts([
                            { id: product.id, field: 'customMarginTop' as keyof Product, value: neighborMargin },
                            { id: neighborAbove.id, field: 'customMarginTop' as keyof Product, value: currentMargin },
                            // Swap categories
                            { id: product.id, field: 'category' as keyof Product, value: neighborAbove.product.category },
                            { id: neighborAbove.id, field: 'category' as keyof Product, value: product.category }
                        ]);
                        }
                        return;
                }
            }

            // 3. MOVEMENT PHASE (Nudge Up)
            // If we didn't interact (or had space), we move up.
            
            const newMyMargin = Math.max(0, currentMargin - NUDGE_STEP);
            const updates: { id: string, field: keyof Product, value: any }[] = [
                { id: product.id, field: 'customMarginTop', value: newMyMargin }
            ];

            // B. COMPENSATE NEIGHBOR BELOW (The Snowplow Fix)
            // CRITICAL: This MUST run if neighborBelow exists, regardless of anything else.
            
            let neighborToCompensate = neighborBelow;

            // Fix for Free Text / Cross-Category: 
            // If the immediate neighbor is a header, we check the item AFTER the header.
            // If that item is a product, we apply compensation to it instead.
            if (neighborToCompensate && neighborToCompensate.type === 'header') {
                const nextVisual = visualList[currentIndex + 2];
                if (nextVisual && nextVisual.type === 'product') {
                    neighborToCompensate = nextVisual;
                }
            }

            if (neighborToCompensate && neighborToCompensate.type === 'product' && neighborToCompensate.product) {
                const nextMarginRaw = neighborToCompensate.product.customMarginTop;
                // Force Number() to prevent NaN
                const nextMarginSafe = Number(nextMarginRaw ?? 0); 
                
                // We add EXACTLY the same amount we subtracted from the item above (Conservation of Space)
                updates.push({ 
                    id: neighborToCompensate.id, 
                    field: 'customMarginTop', 
                    value: nextMarginSafe + NUDGE_STEP 
                });
            }

            onUpdateProducts?.(updates);
        }

        // --- MOVE DOWN ---
        if (direction === 'down') {
            // Bottom Exit (Leaving Category Downwards)
            if ((!neighbor || neighbor.type === 'header') && !catName.startsWith(FREE_TEXT_PREFIX)) {
                if (onStyleUpdate && onUpdateProducts) {
                    const newGhostCat = `${FREE_TEXT_PREFIX}${crypto.randomUUID()}`;
                    onStyleUpdate(prev => {
                        const cats = [...(prev.customCategoryOrder || sortedCategories)];
                        const idx = cats.indexOf(catName);
                        if (idx !== -1) cats.splice(idx + 1, 0, newGhostCat); // Insert AFTER
                        else cats.push(newGhostCat);
                        return { ...prev, customCategoryOrder: cats, name: 'Custom' };
                    });
                    onUpdateProducts([
                        { id: product.id, field: 'category' as keyof Product, value: newGhostCat },
                        { id: product.id, field: 'customMarginTop' as keyof Product, value: STANDARD_GAP }
                    ]);
                }
                return;
            }

            // Allow moving down (increasing margin) even if no neighbor in a ghost zone
            if (!neighbor && catName.startsWith(FREE_TEXT_PREFIX)) {
                    const myMargin = product.customMarginTop || 0;
                    onUpdateProduct?.(id, 'customMarginTop', myMargin + NUDGE_STEP);
                    return;
            }

            if (!neighbor) return;

            // 1. Physics Check (Nudge Down)
            if (neighbor.type === 'product' && neighbor.product) {
                const neighborMargin = neighbor.product.customMarginTop || 0;

                // If neighbor has margin, consume it (Zero-Sum)
                if (neighborMargin > STANDARD_GAP) {
                    const myMargin = product.customMarginTop || 0;
                    onUpdateProducts?.([
                        { id: product.id, field: 'customMarginTop' as keyof Product, value: myMargin + NUDGE_STEP },
                        { id: neighbor.id, field: 'customMarginTop' as keyof Product, value: neighborMargin - NUDGE_STEP }
                    ]);
                    return;
                } else if (catName.startsWith(FREE_TEXT_PREFIX)) {
                        // Fallthrough to collision
                }
            }

            // --- COLLISION LOGIC ---

            // FT vs FT Collision (Down)
            if (neighbor.type === 'product' && neighbor.product?.isFreeText) {
                    if (onUpdateProducts) {
                        const myMargin = product.customMarginTop || 0;
                        const neighborMargin = neighbor.product.customMarginTop || 0;
                        onUpdateProducts([
                            { id: product.id, field: 'customMarginTop' as keyof Product, value: neighborMargin },
                            { id: neighbor.id, field: 'customMarginTop' as keyof Product, value: myMargin },
                            { id: product.id, field: 'category' as keyof Product, value: neighbor.category },
                            { id: neighbor.id, field: 'category' as keyof Product, value: catName }
                        ]);
                        if (neighbor.category === catName && onCommitProductOrder) {
                        const currentOrder = groupedProducts[catName].map(p => p.id);
                        const idx1 = currentOrder.indexOf(id);
                        const idx2 = currentOrder.indexOf(neighbor.id);
                        const newOrder = [...currentOrder];
                        [newOrder[idx1], newOrder[idx2]] = [newOrder[idx2], newOrder[idx1]];
                        onCommitProductOrder(catName, newOrder);
                    }
                    }
                    return;
            }
            
            // Case A: Neighbor is Header (Next Category)
            if (neighbor.type === 'header') {
                // Enter Category (Top)
                if (onUpdateProducts && onCommitProductOrder) {
                    const targetCat = neighbor.id;
                    onUpdateProducts([
                        { id: product.id, field: 'category' as keyof Product, value: targetCat },
                        { id: product.id, field: 'customMarginTop' as keyof Product, value: 0 }
                    ]);
                    const currentOrder = groupedProducts[targetCat]?.map(p => p.id) || [];
                    onCommitProductOrder(targetCat, [product.id, ...currentOrder]);
                }
                return;
            }

            // Case B: Neighbor is Product
            if (neighbor.type === 'product' && neighbor.product) {
                    if (neighbor.category === catName) {
                        if (onCommitProductOrder && onUpdateProducts) {
                            const currentOrder = groupedProducts[catName].map(p => p.id);
                            const idx1 = currentOrder.indexOf(id);
                            const idx2 = currentOrder.indexOf(neighbor.id);
                            const newOrder = [...currentOrder];
                            [newOrder[idx1], newOrder[idx2]] = [newOrder[idx2], newOrder[idx1]];

                            const myMargin = product.customMarginTop || 0;
                            const neighborMargin = neighbor.product.customMarginTop || 0;
                            onUpdateProducts([
                                { id: product.id, field: 'customMarginTop' as keyof Product, value: neighborMargin },
                                { id: neighbor.id, field: 'customMarginTop' as keyof Product, value: myMargin }
                            ]);
                            onCommitProductOrder(catName, newOrder);
                        }
                        return;
                    }
                    
                    // Subcase B2: Different Category
                    if (neighbor.category !== catName) {
                        const targetCat = neighbor.category;
                        if (onUpdateProducts && onCommitProductOrder) {
                            onUpdateProducts([
                                { id: product.id, field: 'category' as keyof Product, value: targetCat },
                                { id: product.id, field: 'customMarginTop' as keyof Product, value: 0 }
                            ]);
                            // Insert Before Neighbor
                            const currentOrder = groupedProducts[targetCat]?.map(p => p.id) || [];
                            const nIdx = currentOrder.indexOf(neighbor.id);
                            const newOrder = [...currentOrder];
                            if (nIdx !== -1) newOrder.splice(nIdx, 0, product.id);
                            else newOrder.unshift(product.id);
                            
                            onCommitProductOrder(targetCat, newOrder);
                        }
                        return;
                    }
            }
        }
    };

    const handlePageDoubleClick = (e: React.MouseEvent, pageIndex: number, handleSelection: any, setSelectedPageIndex: any) => {
        e.stopPropagation();
        handleSelection(null, null);
        
        const pageEl = e.currentTarget as HTMLElement;
        const pageRect = pageEl.getBoundingClientRect();
        const currentScale = (typeof scale === 'number' && scale > 0) ? scale : 1;
        const clickY = (e.clientY - pageRect.top) / currentScale;
        
        let floorId: string | null = null;
        let floorBottom = 0; 
        let ceilingId: string | null = null;
        let ceilingTop = A4_HEIGHT_PX; 
        
        let minDistAbove = Infinity;
        let minDistBelow = Infinity;

        const allElements = pageEl.querySelectorAll('[id^="product-container-"], [id^="category-header-"], [data-block-id="main-header"]');
        
        allElements.forEach(el => {
            const rect = el.getBoundingClientRect();
            const itemTop = (rect.top - pageRect.top) / currentScale;
            const itemHeight = rect.height / currentScale;
            const itemBottom = itemTop + itemHeight;
            
            let id = el.getAttribute('data-category-id') || el.getAttribute('data-block-id');
            if (!id && el.id.startsWith('product-container-')) id = el.id.replace('product-container-', '');
            if (!id) return;
            
            if (itemBottom < clickY) {
                const dist = clickY - itemBottom;
                if (dist < minDistAbove) {
                    minDistAbove = dist;
                    floorId = id;
                    floorBottom = itemBottom;
                }
            } else if (itemTop > clickY) {
                const dist = itemTop - clickY;
                if (dist < minDistBelow) {
                    minDistBelow = dist;
                    ceilingId = id;
                    ceilingTop = itemTop;
                }
            }
        });
        
        setDraftItem({
            pageIndex,
            top: clickY,
            floorId,
            floorBottom,
            ceilingId,
            ceilingTop
        });

        setTimeout(() => {
            if (draftInputRef.current) draftInputRef.current.focus();
        }, 50);
    };

    const handleDraftCommit = () => {
        if (!draftItem || !onAddProduct || !onStyleUpdate || !draftInputRef.current) return;
        const text = draftInputRef.current.innerText || "New Text";
        const newId = crypto.randomUUID();
        const ghostCategoryName = `${FREE_TEXT_PREFIX}${newId}`;
        
        const newItemMargin = Math.max(0, draftItem.top - draftItem.floorBottom);
        
        if (draftItem.ceilingId && onUpdateProduct) {
            const currentGap = draftItem.ceilingTop - draftItem.floorBottom;
            const ESTIMATED_HEIGHT = 40; 
            const newCeilingMargin = Math.max(0, currentGap - newItemMargin - ESTIMATED_HEIGHT);
            
            const isCeilingProduct = products.find(p => p.id === draftItem.ceilingId);
            if (isCeilingProduct) {
                onUpdateProduct(draftItem.ceilingId, 'customMarginTop', newCeilingMargin);
            }
        }
        
        onStyleUpdate(prev => {
            const currentOrder = prev.customCategoryOrder && prev.customCategoryOrder.length > 0 
                ? [...prev.customCategoryOrder] 
                : [...sortedCategories];
            
            sortedCategories.forEach(c => { if (!currentOrder.includes(c)) currentOrder.push(c); });

            let insertIndex = currentOrder.length;
            
            if (draftItem.ceilingId) {
               const cProd = products.find(p => p.id === draftItem.ceilingId);
               const cCat = cProd ? cProd.category : (currentOrder.includes(draftItem.ceilingId!) ? draftItem.ceilingId : null);
               if (cCat) {
                   const idx = currentOrder.indexOf(cCat);
                   if (idx !== -1) insertIndex = idx;
               }
            } else if (draftItem.floorId) {
               const fProd = products.find(p => p.id === draftItem.floorId);
               const fCat = fProd ? fProd.category : (currentOrder.includes(draftItem.floorId!) ? draftItem.floorId : null);
               if (fCat) {
                   const idx = currentOrder.indexOf(fCat);
                   if (idx !== -1) insertIndex = idx + 1;
               }
            }

            currentOrder.splice(insertIndex, 0, ghostCategoryName);

            const newProdOrder = { ...(prev.customProductOrder || {}) };
            newProdOrder[ghostCategoryName] = [newId];

            return {
                ...prev,
                customCategoryOrder: currentOrder,
                customProductOrder: newProdOrder,
                name: 'Custom'
            };
        });

        onAddProduct(ghostCategoryName, undefined, true, newId, { customMarginTop: newItemMargin, name: text });
        setDraftItem(null);
    };

    const handleRemove = (e: React.MouseEvent, id: string, type: 'product' | 'category') => {
        e.stopPropagation();
        e.preventDefault();
        
        if (type === 'product') {
             const product = products.find(p => p.id === id);
             if (product?.isFreeText) {
                 // Free Text: PERMANENT DELETE
                 onDeleteProduct?.(id);
             } else {
                 // Regular Product: HIDE (toggle off)
                 onToggleProductVisibility?.(id, false);
             }
        } else {
            // Category: HIDE ALL PRODUCTS inside (toggle off)
            const catProducts = groupedProducts[id] || [];
            if (onStyleUpdate) {
                 onStyleUpdate(prev => {
                     const currentHidden = new Set(prev.hiddenProductIds || []);
                     catProducts.forEach(p => currentHidden.add(p.id));
                     return { ...prev, hiddenProductIds: Array.from(currentHidden), name: 'Custom' };
                 });
            }
        }
    };
    
    // Wrapper for add functionality if handlers needs to expose it for MenuItem convenience
    const handleAddClick = (e: React.MouseEvent, category: string, isCategoryAdd: boolean, position: 'before' | 'after') => {
        if (isCategoryAdd) {
            onAddCategory?.(category, position);
        } else {
            onAddProduct?.(category, undefined, false, undefined, undefined, { index: 0 }); 
        }
    };

    return {
        visualList,
        draftInputRef,
        handleGlobalMove,
        handlePageDoubleClick,
        handleDraftCommit,
        handleRemove,
        handleAddClick
    };
};