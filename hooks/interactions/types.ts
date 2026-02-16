import React from 'react';
import { Product, MenuStyle, SortOption } from '../../types';

export const NUDGE_STEP = 10;
export const A4_HEIGHT_PX = 1123;
export const FREE_TEXT_PREFIX = 'ft_zone_';
export const STANDARD_GAP = 15;

export interface DraftItem {
    pageIndex: number;
    top: number; // relative to page top
    floorId: string | null;
    floorBottom: number;
    ceilingId: string | null;
    ceilingTop: number;
}

export interface InteractionProps {
    products: Product[];
    style: MenuStyle;
    sortOption: SortOption;
    scale?: number;
    // Callbacks
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
    onSelectionChange?: (selection: { type: 'product' | 'category' | 'freeText' | 'addedImage' | null, id: string | null }) => void;
}