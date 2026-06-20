import React, { useState } from 'react';
import { InteractionProps, DraftItem, NUDGE_STEP } from './interactions/types';

import { useMenuData } from './interactions/useMenuData';
import { useSelectionState } from './interactions/useSelectionState';
import { useImageManipulation } from './interactions/useImageManipulation';
import { useDraggableInteractions } from './interactions/useDraggableInteractions';
import { useKeyboardMovement } from './interactions/useKeyboardMovement';

// Re-export constants needed by components if any (legacy compatibility)
export { NUDGE_STEP };

export const useMenuInteractions = (props: InteractionProps) => {
    // 0. State needed for composition (lifted up for useKeyboardMovement)
    const [draftItem, setDraftItem] = useState<DraftItem | null>(null);

    const { 
        products, style, sortOption 
    } = props;

    // 1. Data Preparation
    const { groupedProductsBase, sortedCategoriesBase } = useMenuData({ products, style, sortOption });

    // 2. Selection & UI State
    const selectionState = useSelectionState(props);

    // 3. Image Manipulation
    const imageInteractions = useImageManipulation(props, selectionState.handleSelection);

    // 4. Draggable Interactions (Heavy Logic)
    // Calculates the *FINAL* sorted/grouped data (Live vs Saved)
    const draggableInteractions = useDraggableInteractions(
        props, 
        groupedProductsBase, 
        sortedCategoriesBase, 
        selectionState.handleSelection,
        selectionState.editingId
    );

    // 5. Keyboard & Free Text (Uses final data)
    const keyboardInteractions = useKeyboardMovement(
        props,
        draggableInteractions.sortedCategories,
        draggableInteractions.groupedProducts,
        draftItem,
        setDraftItem
    );

    // Wrapper to inject dependencies into handlePageDoubleClick
    const handlePageDoubleClickWrapper = (e: React.MouseEvent, pageIndex: number) => {
        keyboardInteractions.handlePageDoubleClick(
            e, 
            pageIndex, 
            selectionState.handleSelection, 
            selectionState.setSelectedPageIndex
        );
    };

    return {
        // ...selectionState
        selectedId: selectionState.selectedId,
        setSelectedId: selectionState.setSelectedId,
        editingId: selectionState.editingId,
        setEditingId: selectionState.setEditingId,
        showAddModal: selectionState.showAddModal,
        setShowAddModal: selectionState.setShowAddModal,
        selectedPageIndex: selectionState.selectedPageIndex,
        setSelectedPageIndex: selectionState.setSelectedPageIndex,
        showDeletePageConfirm: selectionState.showDeletePageConfirm,
        setShowDeletePageConfirm: selectionState.setShowDeletePageConfirm,
        pageToDelete: selectionState.pageToDelete,
        setPageToDelete: selectionState.setPageToDelete,
        handleSelection: selectionState.handleSelection,
        handleBlur: selectionState.handleBlur,
        handleKeyDown: selectionState.handleKeyDown,
        startEditing: selectionState.startEditing,

        // ...imageInteractions
        draggedImageId: imageInteractions.draggedImageId,
        setDraggedImageId: imageInteractions.setDraggedImageId,
        handleDragImageStart: imageInteractions.handleDragImageStart,
        handleResizeImage: imageInteractions.handleResizeImage,
        handleRemoveImage: imageInteractions.handleRemoveImage,
        handleLayerImage: imageInteractions.handleLayerImage,

        // ...draggableInteractions
        draggedItem: draggableInteractions.draggedItem,
        // liveCategoryOrder: draggableInteractions.liveCategoryOrder, // Not usually exposed but available if needed
        // liveProductOrder: draggableInteractions.liveProductOrder,
        sortedCategories: draggableInteractions.sortedCategories,
        groupedProducts: draggableInteractions.groupedProducts,
        handleDragStart: draggableInteractions.handleDragStart,
        handleDragEnd: draggableInteractions.handleDragEnd,
        handleDragOverItem: draggableInteractions.handleDragOverItem,

        // ...keyboardInteractions & Draft
        draftItem, 
        setDraftItem,
        visualList: keyboardInteractions.visualList,
        draftInputRef: keyboardInteractions.draftInputRef,
        handleGlobalMove: keyboardInteractions.handleGlobalMove,
        handleDraftCommit: keyboardInteractions.handleDraftCommit,
        handleRemove: keyboardInteractions.handleRemove,
        handleAddClick: keyboardInteractions.handleAddClick,
        
        // Wrapped handlers
        handlePageDoubleClick: handlePageDoubleClickWrapper,
    };
};