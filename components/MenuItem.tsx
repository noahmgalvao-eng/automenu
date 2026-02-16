import React from 'react';
import { Product, MenuStyle } from '../types';
import { Plus, Trash2, ChevronUp, ChevronDown, Edit3, EyeOff } from 'lucide-react';

interface MenuItemProps {
    item: any;
    idx: number;
    style: MenuStyle;
    handlers: any; // Return type of useMenuInteractions
    products: Product[];
    inGroup: boolean;
}

const ProductControls = ({ type, id, catName, isMobileSelected, index, total, isLastInBlock, canMoveUp, canMoveDown, hideGeneralControls, isFreeText, handlers }: any) => {
    const isSelected = handlers.selectedId === (type === 'category' ? catName : id);
    const pointerEventsClass = isMobileSelected ? 'pointer-events-auto' : 'pointer-events-none md:group-hover:pointer-events-auto';
    
    return (
    <>
        {isSelected && (
             <div className="absolute inset-0 border-2 border-indigo-500 rounded-lg pointer-events-none z-10" />
        )}

        {isSelected && !isFreeText && (
            <>
                <button 
                    className="absolute -top-3 left-1/2 -translate-x-1/2 bg-indigo-600 text-white p-1 rounded-full z-50 shadow-md hover:scale-110 hover:bg-indigo-700 transition-transform cursor-pointer" 
                    onPointerDown={e => e.stopPropagation()}
                    onClick={(e) => handlers.handleAddClick?.(e, catName, type === 'category', 'before')}
                    title={`Add ${type} Above`}
                >
                    <Plus size={12}/>
                </button>
                <button 
                    className="absolute -bottom-3 left-1/2 -translate-x-1/2 bg-indigo-600 text-white p-1 rounded-full z-50 shadow-md hover:scale-110 hover:bg-indigo-700 transition-transform cursor-pointer" 
                    onPointerDown={e => e.stopPropagation()}
                    onClick={(e) => handlers.handleAddClick?.(e, catName, type === 'category', 'after')}
                    title={`Add ${type} Below`}
                >
                    <Plus size={12}/>
                </button>
            </>
        )}

        <div className={`absolute inset-0 pointer-events-none z-50 transition-opacity duration-200 ${isMobileSelected ? 'opacity-100' : 'opacity-0 md:group-hover:opacity-100'} ${handlers.editingId ? '!opacity-0' : ''}`}>
           {!hideGeneralControls && (
               <div className={`absolute top-[-10px] right-[-10px] ${pointerEventsClass} flex gap-1 z-50`}>
                    <button 
                        onClick={(e) => handlers.handleRemove(e, id || catName, type)} 
                        className={`p-1.5 bg-white border border-slate-200 shadow-md rounded-full ${isFreeText ? 'text-red-500 hover:bg-red-50' : 'text-slate-400 hover:text-red-500 hover:bg-slate-50'} hover:scale-110 transition-transform cursor-pointer`} 
                        title={isFreeText ? "Remove Forever" : "Hide Item"} 
                        onPointerDown={(e) => e.stopPropagation()}
                    >
                        {isFreeText ? <Trash2 size={14} /> : <EyeOff size={14} />}
                    </button>
               </div>
           )}
          {!hideGeneralControls && (
              <div className={`absolute top-1/2 left-[-28px] transform -translate-y-1/2 flex flex-col gap-1 ${pointerEventsClass} z-50`}>
                  {canMoveUp && (
                    <button onClick={(e) => handlers.handleGlobalMove(e, type, id || catName, catName, 'up')} className={`p-1 bg-white border border-slate-200 shadow-sm rounded-full text-slate-500 hover:text-indigo-600 hover:bg-slate-50 transition-all cursor-pointer`} onPointerDown={(e) => e.stopPropagation()}>
                        <ChevronUp size={14} />
                    </button>
                  )}
                  {canMoveDown && (
                    <button onClick={(e) => handlers.handleGlobalMove(e, type, id || catName, catName, 'down')} className={`p-1 bg-white border border-slate-200 shadow-sm rounded-full text-slate-500 hover:text-indigo-600 hover:bg-slate-50 transition-all cursor-pointer`} onPointerDown={(e) => e.stopPropagation()}>
                        <ChevronDown size={14} />
                    </button>
                  )}
              </div>
          )}
        </div>
    </>
  )};

export const MenuItem: React.FC<MenuItemProps> = ({ item, idx, style, handlers, products, inGroup }) => {
    
    if (item.type === 'main-header') {
        const titleStyle = style.elementStyles.menuTitle || {};
        const subStyle = style.elementStyles.menuSubtitle || {};
        
        return (
            <header 
                key={`header-${idx}`} 
                data-block-id="main-header" 
                className="text-center group relative" 
                style={{ marginBottom: '20px' }} 
            >
            <h1 
                className="tracking-tight outline-none focus:bg-blue-50/50 rounded cursor-text" 
                style={{ 
                    color: titleStyle.color || style.primaryColor, 
                    fontFamily: titleStyle.fontFamily || style.fontFamily,
                    fontSize: `${titleStyle.fontSize || 48}px`,
                    fontWeight: titleStyle.fontWeight || '700',
                    textAlign: titleStyle.textAlign as any,
                    textTransform: titleStyle.textTransform,
                    marginBottom: `${titleStyle.marginBottom || 10}px`
                }} 
                contentEditable suppressContentEditableWarning onBlur={(e) => handlers.handleBlur(e, 'menu', 'header', 'menuTitle')} onKeyDown={handlers.handleKeyDown}
            >
                {style.menuTitle || 'MENU'}
            </h1>
            <p 
                className="opacity-90 outline-none focus:bg-blue-50/50 rounded cursor-text" 
                style={{
                    color: subStyle.color || style.textColor,
                    fontFamily: subStyle.fontFamily || style.fontFamily,
                    fontSize: `${subStyle.fontSize || 18}px`,
                    textAlign: subStyle.textAlign as any || 'center',
                    textTransform: subStyle.textTransform,
                    letterSpacing: subStyle.letterSpacing ? `${subStyle.letterSpacing}px` : undefined,
                    marginBottom: `${subStyle.marginBottom || 20}px`
                }}
                contentEditable suppressContentEditableWarning onBlur={(e) => handlers.handleBlur(e, 'menu', 'subheader', 'menuSubtitle')} onKeyDown={handlers.handleKeyDown}
            >
                {style.menuSubtitle || 'Signature Selection'}
            </p>
            </header>
        );
    }

    if (item.type === 'category-header') {
        const isSelected = handlers.selectedId === item.data;
        const globalCatIndex = handlers.sortedCategories.indexOf(item.data);
        const canMoveUp = globalCatIndex > 0;
        const canMoveDown = globalCatIndex < handlers.sortedCategories.length - 1;
        const catStyle = style.elementStyles?.category || {};
        const elementId = `text-${item.data}`;
        
        return (
            <div 
                key={`cat-header-${item.data}`}
                draggable={!handlers.editingId}
                onDragStart={(e) => handlers.handleDragStart(e, 'category', item.data)}
                onDragOver={(e) => handlers.handleDragOverItem(e, item.data, 'category')}
                onDragEnd={handlers.handleDragEnd}
                id={`category-header-${item.data}`} 
                data-category-id={item.data} 
                className={`relative group transition-all duration-200 select-none touch-manipulation cursor-grab ${inGroup ? 'px-2 pt-2' : 'hover:bg-black/5 rounded-lg'}`} 
                style={{ 
                    marginBottom: `${catStyle.marginBottom || 16}px`,
                    breakAfter: 'avoid',
                    pageBreakAfter: 'avoid'
                }}
                onContextMenu={(e) => e.preventDefault()} 
                onClick={(e) => { e.stopPropagation(); if (!handlers.editingId) { handlers.handleSelection('category', item.data); handlers.setSelectedPageIndex(null); } }} 
                onDoubleClick={(e) => e.stopPropagation()}
            >
                <ProductControls type="category" catName={item.data} isMobileSelected={isSelected} index={idx} total={0} isLastInBlock={false} canMoveUp={canMoveUp} canMoveDown={canMoveDown} hideGeneralControls={false} handlers={handlers}/>
                <div className={`flex items-center gap-4 px-2 ${catStyle.textAlign === 'center' ? 'justify-center' : catStyle.textAlign === 'right' ? 'justify-end' : 'justify-start'}`}>
                    <h2 
                        id={elementId}
                        className={`whitespace-nowrap outline-none rounded ${handlers.editingId === item.data ? 'bg-white ring-2 ring-blue-500 z-10 cursor-text px-1' : ''}`}
                        style={{ 
                            color: catStyle.color || style.primaryColor,
                            fontFamily: catStyle.fontFamily,
                            fontSize: catStyle.fontSize ? `${catStyle.fontSize}px` : undefined,
                            fontWeight: catStyle.fontWeight,
                            textAlign: catStyle.textAlign,
                            textTransform: catStyle.textTransform,
                            letterSpacing: catStyle.letterSpacing ? `${catStyle.letterSpacing}px` : undefined
                        }}
                        contentEditable={handlers.editingId === item.data} suppressContentEditableWarning onBlur={(e) => handlers.handleBlur(e, 'category', item.data)} onKeyDown={handlers.handleKeyDown} onMouseDown={(e) => { if(handlers.editingId !== item.data) e.preventDefault(); }} onPointerDown={(e) => e.stopPropagation()}>
                        {item.data}
                    </h2>
                    <button onClick={(e) => handlers.startEditing(e, item.data, elementId)} className={`p-1.5 bg-white border border-slate-200 shadow-sm rounded-md text-slate-500 hover:text-indigo-600 hover:bg-slate-50 transition-all ${isSelected || handlers.editingId === item.data ? 'opacity-100 pointer-events-auto' : 'opacity-0 group-hover:opacity-100 pointer-events-none group-hover:pointer-events-auto'}`} onPointerDown={(e) => e.stopPropagation()}><Edit3 size={14} /></button>
                    <div className="h-px flex-grow opacity-40" style={{ backgroundColor: style.primaryColor, display: (catStyle.textAlign === 'center' || catStyle.textAlign === 'right') ? 'none' : 'block' }}></div>
                </div>
            </div>
        );
    }

    if (item.type === 'product-item') {
        const product = item.data as Product;
        const isSelected = handlers.selectedId === product.id;
        const isEditing = handlers.editingId === product.id;
        const catProducts = handlers.groupedProducts[item.category] || [];
        const pIndex = catProducts.findIndex((p: Product) => p.id === product.id);
        let canMoveUp = pIndex > 0;
        let canMoveDown = pIndex < catProducts.length - 1;
        if (product.isFreeText) { canMoveUp = true; canMoveDown = true; }
        
        const isBeingDragged = handlers.draggedItem?.id === product.id;
        const nameStyle = product.isFreeText && product.styles ? product.styles : (style.elementStyles?.productName || {});
        const priceStyle = style.elementStyles?.productPrice || {};
        const descStyle = style.elementStyles?.productDescription || {};
        
        const imgScale = style.imageScale || 1;
        const imageSizePx = 96 * imgScale;

        return (
                <div 
                    key={product.id}
                    draggable={!handlers.editingId}
                    onDragStart={(e) => handlers.handleDragStart(e, 'product', product.id, item.category)}
                    onDragOver={(e) => handlers.handleDragOverItem(e, product.id, 'product', item.category)}
                    onDragEnd={handlers.handleDragEnd}
                    id={`product-container-${product.id}`} 
                    onContextMenu={(e) => e.preventDefault()} 
                    onClick={(e) => { e.stopPropagation(); if (!handlers.editingId) { handlers.handleSelection(product.isFreeText ? 'freeText' : 'product', product.id); handlers.setSelectedPageIndex(null); } }} 
                    onDoubleClick={(e) => e.stopPropagation()} 
                    className={`relative group pl-2 rounded-lg p-2 transition-all duration-200 select-none touch-manipulation cursor-grab ${inGroup ? 'ml-0 mb-0' : '-ml-2 mb-2 hover:bg-black/5'} ${isSelected && !isEditing ? 'bg-indigo-50/30' : ''} ${product.isFreeText ? 'transition-none' : ''} ${isBeingDragged ? 'opacity-30' : ''}`} style={{ marginTop: product.customMarginTop || 0 }}
                >
                <ProductControls type="product" id={product.id} catName={item.category} isMobileSelected={isSelected} index={idx} total={0} canMoveUp={canMoveUp} canMoveDown={canMoveDown} isFreeText={product.isFreeText} handlers={handlers}/>
                
                {product.isFreeText ? (
                    <div className="">
                        <div className={`flex items-center gap-2 ${nameStyle.textAlign === 'center' ? 'justify-center' : nameStyle.textAlign === 'right' ? 'justify-end' : 'justify-start'}`}>
                            <div id={`product-name-${product.id}`} className={`leading-snug outline-none rounded whitespace-pre-wrap ${isEditing ? 'bg-white ring-2 ring-blue-500 cursor-text px-1' : ''}`}
                            style={{ 
                                color: nameStyle.color,
                                fontFamily: nameStyle.fontFamily,
                                fontSize: nameStyle.fontSize ? `${nameStyle.fontSize}px` : undefined,
                                fontWeight: nameStyle.fontWeight,
                                textAlign: nameStyle.textAlign,
                                textTransform: nameStyle.textTransform,
                                letterSpacing: nameStyle.letterSpacing ? `${nameStyle.letterSpacing}px` : undefined
                            }}
                            contentEditable={isEditing} suppressContentEditableWarning onBlur={(e) => handlers.handleBlur(e, 'product', product.id, 'name')} onKeyDown={handlers.handleKeyDown} onMouseDown={(e) => { if(!isEditing) e.preventDefault(); }} onPointerDown={(e) => e.stopPropagation()}>
                                {product.name}
                            </div>
                            <button onClick={(e) => handlers.startEditing(e, product.id, `product-name-${product.id}`)} className={`p-1.5 bg-white border border-slate-200 shadow-sm rounded-md text-slate-500 hover:text-indigo-600 hover:bg-slate-50 transition-all flex-shrink-0 ${isSelected || handlers.editingId === product.id ? 'opacity-100 pointer-events-auto' : 'opacity-0 group-hover:opacity-100 pointer-events-none group-hover:pointer-events-auto'}`} onPointerDown={(e) => e.stopPropagation()}><Edit3 size={14} /></button>
                        </div>
                    </div>
                ) : (
                <div className="flex gap-4 items-start justify-between">
                    {style.showImages && product.image && ( 
                        <div style={{ width: `${imageSizePx}px`, height: `${imageSizePx}px` }} className="rounded-md overflow-hidden flex-shrink-0 bg-gray-100 shadow-inner select-none transition-all duration-300"> 
                            <img src={product.image} alt={product.name} className="w-full h-full object-cover" /> 
                        </div> 
                    )}
                    <div className="flex-grow min-w-0">
                         <div className={`flex justify-between items-start mb-1 gap-2 ${nameStyle.textAlign === 'center' ? 'flex-col items-center' : nameStyle.textAlign === 'right' ? 'flex-row-reverse text-right' : ''}`}>
                            <div className={`flex items-center gap-2 flex-shrink min-w-0 ${nameStyle.textAlign === 'right' ? 'justify-end' : ''}`}>
                                <h3 id={`product-name-${product.id}`} className={`outline-none rounded ${isEditing ? 'bg-white ring-2 ring-blue-500 cursor-text px-1' : ''}`}
                                    style={{ 
                                        color: nameStyle.color || style.primaryColor,
                                        fontFamily: nameStyle.fontFamily,
                                        fontSize: nameStyle.fontSize ? `${nameStyle.fontSize}px` : undefined,
                                        fontWeight: nameStyle.fontWeight,
                                        textAlign: nameStyle.textAlign,
                                        textTransform: nameStyle.textTransform,
                                        letterSpacing: nameStyle.letterSpacing ? `${nameStyle.letterSpacing}px` : undefined
                                    }}
                                    contentEditable={isEditing} suppressContentEditableWarning onBlur={(e) => handlers.handleBlur(e, 'product', product.id, 'name')} onKeyDown={handlers.handleKeyDown} onPointerDown={(e) => e.stopPropagation()}
                                >
                                    {product.name}
                                </h3>
                                <button onClick={(e) => handlers.startEditing(e, product.id, `product-name-${product.id}`)} className={`p-1.5 bg-white border border-slate-200 shadow-sm rounded-md text-slate-500 hover:text-indigo-600 hover:bg-slate-50 transition-all flex-shrink-0 ${isSelected || handlers.editingId === product.id ? 'opacity-100 pointer-events-auto' : 'opacity-0 group-hover:opacity-100 pointer-events-none group-hover:pointer-events-auto'}`} onPointerDown={(e) => e.stopPropagation()}><Edit3 size={14} /></button>
                            </div>
                            <div 
                              className="flex items-center gap-1 flex-grow" 
                              style={{ 
                                minWidth: '80px', 
                                justifyContent: priceStyle.textAlign === 'left' ? 'flex-start' : (priceStyle.textAlign === 'center' ? 'center' : 'flex-end'), 
                                display: 'flex' 
                              }}
                            >
                                <span className={`outline-none rounded ${isEditing ? 'bg-white ring-2 ring-blue-500 cursor-text px-1' : ''}`}
                                    style={{ 
                                        color: priceStyle.color,
                                        fontFamily: priceStyle.fontFamily,
                                        fontSize: priceStyle.fontSize ? `${priceStyle.fontSize}px` : undefined,
                                        fontWeight: priceStyle.fontWeight,
                                        textAlign: priceStyle.textAlign,
                                        display: 'inline-block'
                                    }}
                                    contentEditable={isEditing} suppressContentEditableWarning onBlur={(e) => handlers.handleBlur(e, 'product', product.id, 'price')} onKeyDown={handlers.handleKeyDown} onPointerDown={(e) => e.stopPropagation()}
                                >
                                    ${product.price.toFixed(2)}
                                </span>
                            </div>
                        </div>
                        <p className={`opacity-80 leading-relaxed outline-none rounded ${isEditing ? 'bg-white ring-2 ring-blue-500 cursor-text px-1' : ''}`}
                            style={{ 
                                color: descStyle.color,
                                fontFamily: descStyle.fontFamily,
                                fontSize: descStyle.fontSize ? `${descStyle.fontSize}px` : undefined,
                                fontWeight: descStyle.fontWeight,
                                textAlign: descStyle.textAlign || nameStyle.textAlign,
                                fontStyle: descStyle.italic ? 'italic' : 'normal'
                            }}
                            contentEditable={isEditing} suppressContentEditableWarning onBlur={(e) => handlers.handleBlur(e, 'product', product.id, 'description')} onKeyDown={handlers.handleKeyDown} onPointerDown={(e) => e.stopPropagation()}
                        >
                            {product.description}
                        </p>
                    </div>
                    </div>
                )}
                </div>
        );
    }

    if (item.type === 'product-row') {
        const imgScale = style.imageScale || 1;
        const gridImageHeight = 128 * imgScale; 
        
        return (
            <div key={`row-${idx}`} className="grid gap-6 mb-8" style={{ gridTemplateColumns: `repeat(${style.columnCount}, 1fr)` }}>
                {(item.data as Product[]).map((product) => {
                     const isSelected = handlers.selectedId === product.id;
                     const nameStyle = style.elementStyles?.productName || {};
                     const priceStyle = style.elementStyles?.productPrice || {};
                     const descStyle = style.elementStyles?.productDescription || {};
                     const catProducts = handlers.groupedProducts[item.category] || [];
                     const pIndex = catProducts.findIndex((p: Product) => p.id === product.id);
                     const canMoveUp = pIndex > 0;
                     const canMoveDown = pIndex < catProducts.length - 1;
                     const isBeingDragged = handlers.draggedItem?.id === product.id;

                     return (
                            <div 
                                key={product.id}
                                draggable={!handlers.editingId}
                                onDragStart={(e) => handlers.handleDragStart(e, 'product', product.id, item.category)}
                                onDragOver={(e) => handlers.handleDragOverItem(e, product.id, 'product', item.category)}
                                onDragEnd={handlers.handleDragEnd}
                                onContextMenu={(e) => e.preventDefault()} 
                                onClick={(e) => { e.stopPropagation(); handlers.handleSelection('product', product.id); handlers.setSelectedPageIndex(null); }} 
                                className={`relative group rounded-lg p-3 transition-colors select-none touch-manipulation cursor-grab ${isSelected ? 'bg-indigo-50/30' : 'hover:bg-black/5'} ${isBeingDragged ? 'opacity-30' : ''}`}
                            >
                                <ProductControls type="product" id={product.id} catName={item.category} isMobileSelected={isSelected} index={idx} total={0} canMoveUp={canMoveUp} canMoveDown={canMoveDown} isFreeText={product.isFreeText} handlers={handlers}/>
                                
                                {style.layoutMode === 'grid' ? (
                                    <div className={`text-${nameStyle.textAlign || 'center'}`}>
                                        {style.showImages && product.image && ( <div style={{ height: `${gridImageHeight}px` }} className="w-full mb-3 rounded-md overflow-hidden bg-gray-100 mx-auto transition-all duration-300"> <img src={product.image} className="w-full h-full object-cover" alt={product.name} /> </div> )}
                                        <h3 className="mb-1" style={{ color: nameStyle.color || style.primaryColor, fontFamily: nameStyle.fontFamily, fontSize: nameStyle.fontSize, fontWeight: nameStyle.fontWeight, textAlign: nameStyle.textAlign, textTransform: nameStyle.textTransform }}>{product.name}</h3>
                                        <div className="mb-2" style={{ color: priceStyle.color, fontFamily: priceStyle.fontFamily, fontSize: priceStyle.fontSize, fontWeight: priceStyle.fontWeight, textAlign: priceStyle.textAlign }}>${product.price.toFixed(2)}</div>
                                        <p className="opacity-75 line-clamp-3" style={{ color: descStyle.color, fontFamily: descStyle.fontFamily, fontSize: descStyle.fontSize, fontWeight: descStyle.fontWeight, textAlign: descStyle.textAlign }}>{product.description}</p>
                                    </div>
                                ) : (
                                    <div className="h-full flex flex-col">
                                        {style.showImages && product.image && ( <div style={{ height: `${gridImageHeight * 0.75}px` }} className="w-full mb-3 rounded-md overflow-hidden bg-gray-100 transition-all duration-300"> <img src={product.image} className="w-full h-full object-cover" alt={product.name} /> </div> )}
                                        <div className="flex justify-between items-start mb-2">
                                            <h3 className="" style={{ color: nameStyle.color || style.primaryColor, fontFamily: nameStyle.fontFamily, fontSize: nameStyle.fontSize, fontWeight: nameStyle.fontWeight, textAlign: nameStyle.textAlign, textTransform: nameStyle.textTransform }}>{product.name}</h3>
                                            <span className="" style={{ color: priceStyle.color, fontFamily: priceStyle.fontFamily, fontSize: priceStyle.fontSize, fontWeight: priceStyle.fontWeight }}>${product.price.toFixed(2)}</span>
                                        </div>
                                        <p className="opacity-75 line-clamp-4 flex-grow" style={{ color: descStyle.color, fontFamily: descStyle.fontFamily, fontSize: descStyle.fontSize, fontWeight: descStyle.fontWeight, textAlign: descStyle.textAlign }}>{product.description}</p>
                                    </div>
                                )}
                            </div>
                     )
                })}
            </div>
        )
    }
    return null;
};