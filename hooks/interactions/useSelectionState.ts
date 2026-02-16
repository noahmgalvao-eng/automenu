import React, { useState, useCallback } from 'react';
import { Product, MenuStyle } from '../../types';
import { InteractionProps } from './types';

export const useSelectionState = (props: InteractionProps) => {
    const { onSelectionChange, onUpdateProduct, onUpdateCategoryName, onUpdateMenuText, products } = props;

    // Selection & Editing State
    const [selectedId, setSelectedId] = useState<string | null>(null); 
    const [editingId, setEditingId] = useState<string | null>(null);
    const [showAddModal, setShowAddModal] = useState<{category: string, rect: DOMRect} | null>(null);
    const [selectedPageIndex, setSelectedPageIndex] = useState<number | null>(null);
    
    // Delete Confirmation State
    const [showDeletePageConfirm, setShowDeletePageConfirm] = useState(false);
    const [pageToDelete, setPageToDelete] = useState<number | null>(null);

    const handleSelection = useCallback((type: 'product' | 'category' | 'freeText' | 'addedImage' | null, id: string | null) => {
        setSelectedId(id);
        if (id !== null) {
            setSelectedPageIndex(null);
        }
        onSelectionChange?.({ type, id });
    }, [onSelectionChange]);

    const handleBlur = useCallback((e: React.FocusEvent<HTMLElement>, type: string, id: string, field?: string) => {
        if (type !== 'floating') setEditingId(null); 
        const newVal = e.currentTarget.innerText;
        if (type === 'product' && field && onUpdateProduct) {
            if (field === 'price') {
                const num = parseFloat(newVal.replace(/[^0-9.]/g, ''));
                if (!isNaN(num)) onUpdateProduct(id, 'price', num);
                else e.currentTarget.innerText = '$' + (products.find(p=>p.id === id)?.price.toFixed(2) || '0.00');
            } else {
                onUpdateProduct(id, field as keyof Product, newVal);
            }
        } else if (type === 'category' && onUpdateCategoryName) {
            onUpdateCategoryName(id, newVal); 
        } else if (type === 'menu' && onUpdateMenuText && field) {
            onUpdateMenuText(field as any, newVal);
        }
    }, [onUpdateProduct, onUpdateCategoryName, onUpdateMenuText, products]);

    const handleKeyDown = (e: React.KeyboardEvent<HTMLElement>) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            e.currentTarget.blur();
        }
    };

    const startEditing = (e: React.MouseEvent, id: string, elementIdToFocus?: string) => {
        e.stopPropagation();
        setEditingId(id);
        
        // Multi-stage focus attempt to ensure mobile keyboard triggers
        const triggerFocus = () => {
            const el = document.getElementById(elementIdToFocus || `product-name-${id}`);
            if (el) {
                el.focus();
                // Specific fix for iOS selection
                const range = document.createRange();
                range.selectNodeContents(el);
                const sel = window.getSelection();
                sel?.removeAllRanges();
                sel?.addRange(range);
            }
        };

        // Immediate and delayed attempts
        triggerFocus();
        setTimeout(triggerFocus, 50);
        setTimeout(triggerFocus, 100);
    };

    return {
        selectedId, setSelectedId,
        editingId, setEditingId,
        showAddModal, setShowAddModal,
        selectedPageIndex, setSelectedPageIndex,
        showDeletePageConfirm, setShowDeletePageConfirm,
        pageToDelete, setPageToDelete,
        handleSelection,
        handleBlur,
        handleKeyDown,
        startEditing
    };
};