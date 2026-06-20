import React, { useState } from 'react';
import { InteractionProps } from './types';

export const useImageManipulation = (
    props: InteractionProps, 
    handleSelection: (type: 'product' | 'category' | 'freeText' | 'addedImage' | null, id: string | null) => void
) => {
    const { onStyleUpdate, scale } = props;
    const [draggedImageId, setDraggedImageId] = useState<string | null>(null);

    const handleImageDragStart = (e: React.PointerEvent, imgId: string) => {
        e.preventDefault();
        e.stopPropagation();
        setDraggedImageId(imgId);
        handleSelection('addedImage', imgId);
        
        const el = e.currentTarget as HTMLElement;
        const startX = Number(e.clientX);
        const startY = Number(e.clientY);
        const rect = el.getBoundingClientRect();
        const parentEl = el.parentElement;
        
        if (!parentEl) return;
        
        const parentRect = parentEl.getBoundingClientRect();
        const currentScale: number = (typeof scale === 'number' && scale > 0) ? scale : 1;
        const rectLeft = Number(rect.left);
        const parentLeft = Number(parentRect.left);
        const rectTop = Number(rect.top);
        const parentTop = Number(parentRect.top);

        const initialOffX = (rectLeft - parentLeft) / currentScale;
        const initialOffY = (rectTop - parentTop) / currentScale;

        const handlePointerMove = (moveEvent: PointerEvent) => {
            const moveX = Number(moveEvent.clientX);
            const moveY = Number(moveEvent.clientY);
            const deltaX = (moveX - startX) / currentScale;
            const deltaY = (moveY - startY) / currentScale;

            if (onStyleUpdate) {
               onStyleUpdate(prev => ({
                   ...prev,
                   addedImages: prev.addedImages?.map(img => {
                       if (img.id === imgId) {
                           const newX = initialOffX + deltaX;
                           const newY = initialOffY + deltaY;
                           return { ...img, x: newX, y: newY };
                       }
                       return img;
                   }),
                   name: 'Custom'
               }));
            }
        };

        const handlePointerUp = () => {
            window.removeEventListener('pointermove', handlePointerMove);
            window.removeEventListener('pointerup', handlePointerUp);
            setDraggedImageId(null);
        };

        window.addEventListener('pointermove', handlePointerMove);
        window.addEventListener('pointerup', handlePointerUp);
    };

    const handleResizeImage = (e: React.MouseEvent, imgId: string, delta: number) => {
        e.stopPropagation();
        if (onStyleUpdate) {
            onStyleUpdate(prev => ({
                ...prev,
                addedImages: prev.addedImages?.map(img => {
                    if (img.id === imgId) return { ...img, width: Math.max(50, img.width + delta) };
                    return img;
                }),
                name: 'Custom'
            }));
        }
    };

    const handleRemoveImage = (e: React.MouseEvent, imgId: string) => {
        e.stopPropagation();
        if (onStyleUpdate) {
            onStyleUpdate(prev => ({
                ...prev,
                addedImages: prev.addedImages?.filter(img => img.id !== imgId),
                name: 'Custom'
            }));
        }
        handleSelection(null, null);
    };

    const handleLayerImage = (imgId: string, zIndexChange: number) => {
        if (onStyleUpdate) {
            onStyleUpdate(prev => ({
                ...prev,
                addedImages: prev.addedImages?.map(img => {
                    if (img.id === imgId) {
                        return { ...img, zIndex: zIndexChange };
                    }
                    return img;
                }),
                name: 'Custom'
            }));
        }
    };

    return {
        draggedImageId, setDraggedImageId,
        handleDragImageStart: handleImageDragStart,
        handleResizeImage,
        handleRemoveImage,
        handleLayerImage
    };
};