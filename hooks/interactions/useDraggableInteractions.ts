import React, { useState, useRef, useCallback, useMemo, useEffect } from 'react';
import { Product } from '../../types';
import { InteractionProps } from '../types';

export const useDraggableInteractions = (
    props: InteractionProps,
    groupedProductsBase: Record<string, Product[]>,
    sortedCategoriesBase: string[],
    handleSelection: (type: 'product' | 'category' | 'freeText' | 'addedImage' | null, id: string | null) => void,
    editingId: string | null
) => {
    const { products, onCommitCategoryOrder, onCommitProductOrder } = props;

    // --- REFS (Source of Truth) ---
    // Mantemos refs dos dados base para acesso síncrono durante eventos
    const sortedCategoriesRef = useRef(sortedCategoriesBase);
    const groupedProductsRef = useRef(groupedProductsBase);

    // Atualiza refs sempre que os props mudam
    useEffect(() => {
        sortedCategoriesRef.current = sortedCategoriesBase;
    }, [sortedCategoriesBase]);

    useEffect(() => {
        groupedProductsRef.current = groupedProductsBase;
    }, [groupedProductsBase]);

    // --- STATE ---
    const [draggedItem, setDraggedItem] = useState<{type: 'category' | 'product', id: string, group?: string} | null>(null);
    const [liveCategoryOrder, setLiveCategoryOrder] = useState<string[] | null>(null);
    const [liveProductOrder, setLiveProductOrder] = useState<Record<string, string[]> | null>(null);

    // --- REFS (Mutable State for Dragging) ---
    const draggedItemRef = useRef<{type: 'category' | 'product', id: string, group?: string} | null>(null);
    const liveCategoryOrderRef = useRef<string[] | null>(null);
    const liveProductOrderRef = useRef<Record<string, string[]> | null>(null);
    const isDraggingRef = useRef(false);

    // Helpers
    const updateLiveCategoryOrder = (order: string[]) => {
        setLiveCategoryOrder(order);
        liveCategoryOrderRef.current = order;
    };

    const updateLiveProductOrder = (orderMap: Record<string, string[]>) => {
        setLiveProductOrder(orderMap);
        liveProductOrderRef.current = orderMap;
    };
    
    // --- COMMIT LOGIC (Robust) ---
    const performCommitAndCleanup = useCallback(() => {
        // Se não estava arrastando, ignora (evita loops)
        if (!isDraggingRef.current) return;

        // 1. TENTA SALVAR CATEGORIAS (Se houver dados na ref)
        if (liveCategoryOrderRef.current && onCommitCategoryOrder) {
             onCommitCategoryOrder(liveCategoryOrderRef.current);
        } 
        
        // 2. TENTA SALVAR PRODUTOS (Se houver dados na ref)
        if (liveProductOrderRef.current && onCommitProductOrder) {
             const currentOrderMap = liveProductOrderRef.current;
             // Itera sobre TODAS as categorias que estão na memória e salva
             Object.entries(currentOrderMap).forEach(([catId, order]) => {
                 onCommitProductOrder(catId, order as string[]);
             });
        }

        // 3. LIMPEZA TOTAL
        setDraggedItem(null);
        setLiveCategoryOrder(null);
        setLiveProductOrder(null);
        
        draggedItemRef.current = null;
        liveCategoryOrderRef.current = null;
        liveProductOrderRef.current = null;
        isDraggingRef.current = false;
        
    }, [onCommitCategoryOrder, onCommitProductOrder]);

    // Listener Global para garantir que o arraste encerre mesmo se soltar fora da janela
    useEffect(() => {
        const handleGlobalDragEnd = () => {
             if (isDraggingRef.current) {
                 performCommitAndCleanup();
             }
        };
        window.addEventListener('dragend', handleGlobalDragEnd);
        window.addEventListener('mouseup', handleGlobalDragEnd); // Extra safety
        return () => {
            window.removeEventListener('dragend', handleGlobalDragEnd);
            window.removeEventListener('mouseup', handleGlobalDragEnd);
        };
    }, [performCommitAndCleanup]);

    // --- EFFECTIVE DATA ---
    const sortedCategories = useMemo(() => {
        // Prioriza a ordem visual durante o arraste
        if (draggedItem?.type === 'category' && liveCategoryOrder) {
            return liveCategoryOrder;
        }
        return sortedCategoriesBase;
    }, [sortedCategoriesBase, liveCategoryOrder, draggedItem]);

    const groupedProducts = useMemo(() => {
        // Prioriza a ordem visual durante o arraste
        if (!draggedItem || draggedItem.type !== 'product' || !liveProductOrder) {
            return groupedProductsBase;
        }
        const newMap = { ...groupedProductsBase };
        
        // Aplica a ordem visual sobre os produtos base
        Object.keys(liveProductOrder).forEach(catId => {
            const order = liveProductOrder[catId];
            const originalProds = groupedProductsBase[catId] || [];
            const reorderedProds: Product[] = [];
            
            // Reconstrói a lista na nova ordem
            order.forEach(id => {
                const p = originalProds.find(prod => prod.id === id);
                if (p) reorderedProds.push(p);
            });
            // Adiciona itens que possam ter faltado (segurança)
            originalProds.forEach(p => {
                if (!order.includes(p.id)) reorderedProds.push(p);
            });
            newMap[catId] = reorderedProds;
        });
        return newMap;
    }, [groupedProductsBase, liveProductOrder, draggedItem]);

    // --- HANDLERS ---

    const handleDragStart = (e: React.DragEvent, type: 'category' | 'product', id: string, group?: string) => {
        // Bloqueia drag se estiver editando texto ou clicando em botão
        if (editingId || (e.target as HTMLElement).closest('button') || (e.target as HTMLElement).tagName === 'INPUT') {
            e.preventDefault();
            return;
        }
        e.stopPropagation();
        
        // Seleciona o item visualmente
        handleSelection(type === 'product' && products.find(p => p.id === id)?.isFreeText ? 'freeText' : type, id);

        // Inicializa estado de Drag
        isDraggingRef.current = true;
        const newItem = { type, id, group };
        setDraggedItem(newItem);
        draggedItemRef.current = newItem; 

        // Inicializa os dados "Live" com uma cópia fresca dos dados Base
        if (type === 'category') {
          updateLiveCategoryOrder([...sortedCategoriesRef.current]);
        } else {
          const initialOrder: Record<string, string[]> = {};
          // Copia a ordem de TODAS as categorias para garantir integridade ao mover entre grupos
          Object.keys(groupedProductsRef.current).forEach(cat => {
               initialOrder[cat] = groupedProductsRef.current[cat].map(p => p.id);
          });
          updateLiveProductOrder(initialOrder);
        }

        // Configuração visual do HTML5 Drag
        e.dataTransfer.effectAllowed = 'move';
        e.dataTransfer.setData('text/plain', id); 
        // Remove a imagem fantasma padrão (opcional, já que usamos renderização customizada)
        const img = new Image();
        img.src = 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7'; 
        e.dataTransfer.setDragImage(img, 0, 0);
    };

    const handleDragEnd = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        performCommitAndCleanup();
    };

    const handleDragOverItem = useCallback((e: React.DragEvent, targetId: string, targetType: 'category' | 'product', targetGroup?: string) => {
        e.preventDefault(); 
        e.stopPropagation();
        
        const currentDragItem = draggedItemRef.current;
        if (!currentDragItem) return;

        let effectiveTargetType = targetType;
        let effectiveTargetId = targetId;
        let effectiveTargetGroup = targetGroup;

        // Se arrastar categoria sobre produto, considera como arrastar sobre a categoria do produto
        if (currentDragItem.type === 'category' && targetType === 'product') {
            if (!targetGroup) return;
            effectiveTargetType = 'category';
            effectiveTargetId = targetGroup; 
        }

        const draggedProd = products.find(p => p.id === currentDragItem.id);
        const isFreeText = draggedProd?.isFreeText;

        // Regra: Produtos normais (não free-text) só movem dentro da própria categoria
        if (currentDragItem.type === 'product' && !isFreeText) {
            if (effectiveTargetGroup && effectiveTargetGroup !== currentDragItem.group) {
                e.dataTransfer.dropEffect = 'none';
                return;
            }
        }

        // Lógica de Reordenação de Categoria
        if (currentDragItem.type === 'category' && effectiveTargetType === 'category') {
            const currentOrder = liveCategoryOrderRef.current || sortedCategoriesRef.current;
            const dragIdx = currentOrder.indexOf(currentDragItem.id);
            const targetIdx = currentOrder.indexOf(effectiveTargetId);
            
            if (dragIdx !== -1 && targetIdx !== -1 && dragIdx !== targetIdx) {
                const newOrder = [...currentOrder];
                newOrder.splice(dragIdx, 1);
                newOrder.splice(targetIdx, 0, currentDragItem.id);
                updateLiveCategoryOrder(newOrder);
            }
            
        } 
        // Lógica de Reordenação de Produto
        else if (currentDragItem.type === 'product' && effectiveTargetType === 'product') {
            if (draggedProd && !draggedProd.isFreeText) {
                const sourceGroup = currentDragItem.group!;
                const destGroup = effectiveTargetGroup || sourceGroup;
                
                if (sourceGroup !== destGroup) return;

                const currentLive = liveProductOrderRef.current || {};
                const sourceOrder = currentLive[sourceGroup] ? [...currentLive[sourceGroup]] : (groupedProductsRef.current[sourceGroup]?.map(p => p.id) || []);
                
                const dragIdx = sourceOrder.indexOf(currentDragItem.id);
                const targetIdx = sourceOrder.indexOf(effectiveTargetId);

                if (dragIdx !== -1 && targetIdx !== -1 && dragIdx !== targetIdx) {
                     // Lógica simples de troca imediata para evitar "flicker" complexo
                     const newOrder = [...sourceOrder];
                     newOrder.splice(dragIdx, 1);
                     newOrder.splice(targetIdx, 0, currentDragItem.id);
                     updateLiveProductOrder({ ...currentLive, [sourceGroup]: newOrder });
                }
            }
        }
    }, [products]);

    return {
        draggedItem,
        liveCategoryOrder,
        liveProductOrder,
        sortedCategories,
        groupedProducts,
        handleDragStart,
        handleDragEnd,
        handleDragOverItem
    };
};