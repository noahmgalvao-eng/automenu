import React from 'react';
import { Product, MenuStyle } from '../types';
import { Minus, Plus, Trash2 } from 'lucide-react';
import { MenuItem } from './MenuItem';

interface MenuPageProps {
    pageIndex: number;
    pageContent: any[];
    style: MenuStyle;
    handlers: any; // Return from useMenuInteractions
    products: Product[];
    needsOverlay: boolean;
    pageCount: number;
    // Actions passed from parent to avoid circular ref or hook limitations
    onAddPage: (index: number, position: 'before' | 'after') => void;
    onDeletePage: (index: number) => void;
}

export const MenuPage: React.FC<MenuPageProps> = ({ 
    pageIndex, 
    pageContent, 
    style, 
    handlers, 
    products, 
    needsOverlay,
    pageCount,
    onAddPage,
    onDeletePage
}) => {
    const isPageSelected = handlers.selectedPageIndex === pageIndex;

    const pageStyle: React.CSSProperties = {
        fontFamily: style.fontFamily,
        backgroundColor: style.backgroundColor,
        color: style.textColor,
        backgroundImage: style.backgroundImage || style.sourceImage ? `url(${style.backgroundImage || style.sourceImage})` : 'none',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundBlendMode: style.sourceImage ? 'overlay' : (style.backgroundImage ? 'multiply' : 'normal'),
        width: '794px',
        height: '1123px',
        position: 'relative',
        overflow: 'hidden',
        flexShrink: 0,
    };

    const renderPageContent = () => {
        const elements: React.ReactNode[] = [];
        
        // 1. Render Main Header separately (usually top of page 1)
        const mainHeader = pageContent.find(i => i.type === 'main-header');
        if (mainHeader) {
            elements.push(<MenuItem key="main-header" item={mainHeader} idx={0} style={style} handlers={handlers} products={products} inGroup={false} />);
        }
  
        // 2. Group Body Items into "Blocks" (Category Header + Products)
        // This solves the Orphan issue (break-inside-avoid) and the Group Selection issue.
        const bodyItems = pageContent.filter(i => i.type !== 'main-header');
        const categoryBlocks: { category: string, items: any[] }[] = [];
        let currentBlock: { category: string, items: any[] } | null = null;

        bodyItems.forEach((item) => {
            if (item.type === 'category-header') {
                // If we have an open block, push it
                if (currentBlock && currentBlock.items.length > 0) {
                    categoryBlocks.push(currentBlock);
                }
                // Start a new block
                currentBlock = { category: item.category, items: [item] };
            } else {
                // Item is product or product-row
                // If it belongs to current block, add it
                if (currentBlock && item.category === currentBlock.category) {
                    currentBlock.items.push(item);
                } else {
                    // Item belongs to a different category than current block (or no block started yet - e.g. continuation from prev page)
                    if (currentBlock && currentBlock.items.length > 0) {
                        categoryBlocks.push(currentBlock);
                    }
                    // Start new block for this item's category (even if no header on this page)
                    // If the category matches the previous pushed block, we might want to merge, but simple block logic is safer for rendering order.
                    currentBlock = { category: item.category, items: [item] };
                }
            }
        });
        // Push final block
        if (currentBlock && currentBlock.items.length > 0) {
            categoryBlocks.push(currentBlock);
        }

        const columnCount = style.categoryColumnCount || 1;
        const needsColumns = columnCount > 1 && categoryBlocks.length > 0;

        // 3. Render Blocks
        const renderedBlocks = categoryBlocks.map((block, blkIdx) => {
            const isCategorySelected = handlers.selectedId === block.category;
            
            return (
                <div 
                    key={`${block.category}-${blkIdx}`}
                    // CRITICAL: translateZ(0) fixes hit-testing in Webkit/Chrome multi-column layouts where hitboxes can drift
                    // z-index ensures hit-testing works when blocks overlap visually in columns
                    className={`
                        relative mb-4 rounded-xl transition-all duration-200
                        break-inside-avoid
                        ${isCategorySelected ? 'ring-2 ring-indigo-500 bg-indigo-50/10' : 'hover:bg-slate-50/50'}
                    `}
                    style={{ 
                        transform: 'translateZ(0)',
                        zIndex: 10,
                        position: 'relative',
                        // Ensure clicks pass through to container if not hitting text
                    }} 
                    // CRITICAL: Clicking anywhere in the block selects the Category
                    onClick={(e) => {
                        e.stopPropagation();
                        // Only select category if we aren't clicking a specific product (bubbling handled in children)
                        handlers.handleSelection('category', block.category);
                        handlers.setSelectedPageIndex(null);
                    }}
                >
                    {block.items.map((item, idx) => (
                        <MenuItem 
                            key={idx} 
                            item={item} 
                            idx={idx} 
                            style={style} 
                            handlers={handlers} 
                            products={products} 
                            inGroup={true} // Tells MenuItem to adjust padding/margins for inside-block
                        />
                    ))}
                </div>
            );
        });
  
        if (needsColumns) {
             elements.push(
                 <div key={`page-cols-${pageIndex}`} style={{ 
                     columnCount: columnCount, 
                     columnGap: '2rem',
                     width: '100%',
                     position: 'relative',
                     zIndex: 1
                 }}>
                     {renderedBlocks}
                 </div>
             );
        } else {
             elements.push(...renderedBlocks);
        }
  
        if (handlers.draftItem && handlers.draftItem.pageIndex === pageIndex) {
            elements.push(
                <div key="draft-input" className="absolute left-0 right-0 z-50 px-8" style={{ top: `${handlers.draftItem.top}px` }}>
                    <div 
                        ref={handlers.draftInputRef} 
                        contentEditable 
                        suppressContentEditableWarning 
                        onBlur={handlers.handleDraftCommit} 
                        onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handlers.handleDraftCommit(); } }} 
                        className="bg-white ring-2 ring-blue-500 rounded p-1 font-normal text-xl leading-snug outline-none shadow-xl min-h-[30px] border border-blue-200 text-blue-900"
                    >
                        New Text
                    </div>
                    <div className="text-[10px] text-blue-500 mt-1 font-semibold uppercase tracking-wide">Press Enter to Save</div>
                </div>
            )
        }
        return elements;
    };

    return (
        <div className="relative flex-shrink-0">
            <div 
                data-page-index={pageIndex} 
                style={pageStyle} 
                className={`shadow-2xl bg-white print:shadow-none print:mb-0 print:break-after-page group/page transition-all ${isPageSelected ? 'ring-4 ring-blue-500' : ''}`} 
                onClick={(e) => { e.stopPropagation(); handlers.setSelectedPageIndex(pageIndex); handlers.setSelectedId(null); handlers.handleSelection(null, null); handlers.setEditingId(null); }}
                onDoubleClick={(e) => handlers.handlePageDoubleClick(e, pageIndex)}
            >
                {needsOverlay && ( <div className="absolute inset-0 bg-white/90 pointer-events-none z-0" /> )}
                
                {(style.addedImages || []).filter(img => img && img.id && (img.pageIndex || 0) === pageIndex).map((img, imgIdx) => { 
                    const isSelected = handlers.selectedId === img.id;
                    const isFront = isPageSelected || isSelected;
                    
                    return (
                        <div 
                            key={img.id || imgIdx}
                            className={`absolute group cursor-move ${isFront ? 'z-20' : 'z-0'}`}
                            style={{ 
                                left: `${img.x}px`, 
                                top: `${img.y}px`, 
                                width: `${img.width}px`,
                                touchAction: 'none'
                            }}
                            onPointerDown={(e) => handlers.handleImageDragStart(e, img.id)}
                        >
                            <img src={img.url} alt="added" className={`w-full h-auto pointer-events-none select-none ${isSelected ? 'ring-2 ring-indigo-500' : ''}`} />
                            {isSelected && (
                                <div className="absolute -top-10 left-1/2 -translate-x-1/2 bg-white shadow-lg rounded-full flex gap-1 p-1 z-50">
                                    <button onPointerDown={(e) => e.stopPropagation()} onClick={(e) => handlers.handleResizeImage(e, img.id, -20)} className="p-1 hover:bg-slate-100 rounded text-slate-600"><Minus size={14}/></button>
                                    <button onPointerDown={(e) => e.stopPropagation()} onClick={(e) => handlers.handleResizeImage(e, img.id, 20)} className="p-1 hover:bg-slate-100 rounded text-slate-600"><Plus size={14}/></button>
                                    <div className="w-px bg-slate-200 mx-1"></div>
                                    <button onPointerDown={(e) => e.stopPropagation()} onClick={(e) => handlers.handleRemoveImage(e, img.id)} className="p-1 hover:bg-red-50 rounded text-red-500"><Trash2 size={14}/></button>
                                </div>
                            )}
                        </div>
                    )
                })}
                
                <div 
                    className="relative z-10 h-full flex flex-col" 
                    style={{ padding: `${style.pagePadding || 48}px` }}
                > 
                    {renderPageContent()} 
                </div>
                
                <div className="absolute bottom-4 left-0 right-0 text-center text-xs opacity-40 pointer-events-none"> {pageIndex + 1} </div>
            </div>
            {isPageSelected && (
                <>
                    <button 
                        onClick={(e) => { e.stopPropagation(); onAddPage(pageIndex, 'after'); }} 
                        className="absolute right-[-32px] top-1/2 -translate-y-1/2 translate-x-1/2 z-30 p-2 bg-blue-600 rounded-full shadow-lg text-white hover:bg-blue-700 hover:scale-110 transition-all border-2 border-white" 
                        title="Add Page After"
                    > 
                        <Plus size={24} /> 
                    </button>
                    {pageIndex > 0 && ( 
                        <button 
                            onClick={(e) => { e.stopPropagation(); onAddPage(pageIndex, 'before'); }} 
                            className="absolute left-[-32px] top-1/2 -translate-y-1/2 -translate-x-1/2 z-30 p-2 bg-blue-600 rounded-full shadow-lg text-white hover:bg-blue-700 hover:scale-110 transition-all border-2 border-white" 
                            title="Add Page Before"
                        > 
                            <Plus size={24} /> 
                        </button> 
                    )}
                    {pageCount > 1 && pageIndex !== 0 && ( 
                        <button 
                            onClick={(e) => { e.stopPropagation(); onDeletePage(pageIndex); }} 
                            className="absolute bottom-[-16px] left-1/2 -translate-x-1/2 z-30 p-2 bg-red-600 rounded-full shadow-lg text-white hover:bg-red-700 hover:scale-110 transition-all border-2 border-white" 
                            title="Delete Page"
                        > 
                            <Trash2 size={20} /> 
                        </button> 
                    )}
                </>
            )}
        </div>
    );
};