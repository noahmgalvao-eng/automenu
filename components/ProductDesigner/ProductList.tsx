
import React from 'react';
import { Product, MenuStyle } from '../../types';
import { 
  GripVertical, MoreVertical, ChevronUp, ChevronDown, 
  Plus, Edit3, Trash2, Eye, EyeOff, ImagePlus, X 
} from 'lucide-react';
import { EditForm } from './EditForm';

interface ProductListProps {
  categories: string[];
  grouped: Record<string, Product[]>;
  style: MenuStyle;
  handlers: any; // Return type from useMenuInteractions
  collapsedCategories: Set<string>;
  toggleCollapse: (cat: string) => void;
  editModeId: string | null;
  menuOpenId: string | null;
  setMenuOpenId: (id: string | null) => void;
  formData: Partial<Product>;
  setFormData: React.Dispatch<React.SetStateAction<Partial<Product>>>;
  newItemDraft: { categoryId: string, type: 'product' | 'category', value: Partial<Product> } | null;
  
  // Actions
  startEdit: (id: string, initialData: Partial<Product>) => void;
  saveEdit: () => void;
  cancelEdit: () => void;
  remove: (id: string, type: 'product' | 'category') => void;
  handleToggleVisibility: (id: string, visible: boolean) => void;
  initiateAdd: (categoryId: string, type: 'product' | 'category') => void;
  onProductImageClick: (id: string) => void;
  onRemoveProductImage: (id: string) => void;
}

export const ProductList: React.FC<ProductListProps> = ({
  categories,
  grouped,
  style,
  handlers,
  collapsedCategories,
  toggleCollapse,
  editModeId,
  menuOpenId,
  setMenuOpenId,
  formData,
  setFormData,
  newItemDraft,
  startEdit,
  saveEdit,
  cancelEdit,
  remove,
  handleToggleVisibility,
  initiateAdd,
  onProductImageClick,
  onRemoveProductImage
}) => {
  return (
    <div>
      {categories.map((cat) => {
        const isCollapsed = collapsedCategories.has(cat);
        const isEditing = editModeId === cat;
        const isSelected = handlers.selectedId === cat;
        
        // Determine if category is fully hidden (all products hidden)
        const productsInCat = grouped[cat] || [];
        const hiddenCount = productsInCat.filter(p => style.hiddenProductIds?.includes(p.id)).length;
        // Logic check: if category has products and all are hidden, it is effectively hidden.
        const isCatHidden = productsInCat.length > 0 && hiddenCount === productsInCat.length;

        // Hide generated free text categories from this manager to reduce clutter
        if(cat.startsWith('ft_')) return null;

        return (
          <div 
            key={cat}
            id={cat}
            data-category-id={cat}
            draggable={!isEditing}
            onDragStart={(e) => handlers.handleDragStart(e, 'category', cat)}
            onDragOver={(e) => handlers.handleDragOverItem(e, cat, 'category')}
            onDragEnd={handlers.handleDragEnd}
            className={`mb-4 transition-all ${isCatHidden ? 'opacity-50 grayscale' : ''} ${!isEditing ? 'cursor-grab' : ''}`}
          >
            {/* Category Header */}
            <div className="flex items-center gap-2 group mb-2">
              <button 
                onClick={() => toggleCollapse(cat)}
                className="p-1 hover:bg-slate-200 rounded text-slate-400 transition-colors"
                onPointerDown={e => e.stopPropagation()}
              >
                {isCollapsed ? <ChevronDown size={16}/> : <ChevronUp size={16}/>}
              </button>
              
              <div className="flex-1 relative">
                {isEditing ? (
                  <EditForm 
                    type="category" 
                    formData={formData} 
                    setFormData={setFormData} 
                    saveEdit={saveEdit} 
                    cancelEdit={cancelEdit} 
                  />
                ) : (
                  <div className={`flex items-center justify-between p-2 bg-slate-100 border rounded-lg transition-colors active:cursor-grabbing ${isSelected ? 'border-indigo-500 ring-1 ring-indigo-500' : 'border-slate-200 group-hover:border-indigo-300'}`}>
                    <div className="flex items-center gap-2 font-bold text-slate-700 text-sm">
                      <GripVertical size={14} className="text-slate-400" />
                      {cat}
                    </div>
                    <div className="relative">
                      <button 
                        onClick={() => setMenuOpenId(menuOpenId === cat ? null : cat)}
                        className="p-1 hover:bg-slate-200 rounded text-slate-500"
                        onPointerDown={e => e.stopPropagation()}
                      >
                        <MoreVertical size={16} />
                      </button>
                      {menuOpenId === cat && (
                        <>
                          <div className="fixed inset-0 z-40" onClick={() => setMenuOpenId(null)} />
                          <div className="absolute right-0 top-8 z-50 bg-white shadow-xl border border-slate-100 rounded-lg py-1 w-32 animate-in fade-in zoom-in-95 flex flex-col">
                            <button onPointerDown={(e) => e.stopPropagation()} onClick={() => startEdit(cat, { name: cat })} className="px-4 py-2 text-xs text-left hover:bg-slate-50 flex items-center gap-2"> <Edit3 size={14}/> Edit </button>
                            <button 
                                onPointerDown={(e) => e.stopPropagation()} 
                                onClick={() => handleToggleVisibility(cat, !isCatHidden)} 
                                className="px-4 py-2 text-xs text-left hover:bg-slate-50 flex items-center gap-2"
                            > 
                                {isCatHidden ? <Eye size={14}/> : <EyeOff size={14}/>} {isCatHidden ? 'Show' : 'Hide'} 
                            </button>
                            <button 
                              onClick={(e) => { 
                                e.preventDefault();
                                e.stopPropagation();
                                remove(cat, 'category'); 
                              }} 
                              className="px-4 py-2 text-xs text-left hover:bg-red-50 text-red-600 flex items-center gap-2"
                            > 
                              <Trash2 size={14}/> Remove 
                            </button>
                          </div>
                        </>
                      )}
                    </div>
                    <button 
                      onClick={() => initiateAdd(cat, 'category')}
                      className="absolute -right-8 top-1/2 -translate-y-1/2 p-1.5 bg-indigo-100 text-indigo-600 rounded-full hover:bg-indigo-200 opacity-0 group-hover:opacity-100 transition-all"
                      title="Add Category Below"
                      onPointerDown={e => e.stopPropagation()}
                    >
                      <Plus size={14} />
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Products List */}
            <div className={`space-y-2 pl-8 border-l-2 border-slate-100 ml-3 transition-all duration-300 ${isCollapsed ? 'max-h-0 overflow-hidden opacity-0' : 'max-h-[2000px] opacity-100'}`}>
              {grouped[cat].map(product => {
                const pIsHidden = style.hiddenProductIds?.includes(product.id);
                const pIsEditing = editModeId === product.id;
                const pIsSelected = handlers.selectedId === product.id;
                const isBeingDragged = handlers.draggedItem?.id === product.id;
                
                return (
                  <div 
                    key={product.id} 
                    id={`product-container-${product.id}`}
                    data-category-id={cat} // Add cat ID for proper drop detection
                    draggable={!pIsEditing}
                    onDragStart={(e) => handlers.handleDragStart(e, 'product', product.id, cat)}
                    onDragOver={(e) => handlers.handleDragOverItem(e, product.id, 'product', cat)}
                    onDragEnd={handlers.handleDragEnd}
                  >
                    {pIsEditing ? (
                      <EditForm 
                        type="product" 
                        formData={formData} 
                        setFormData={setFormData} 
                        saveEdit={saveEdit} 
                        cancelEdit={cancelEdit} 
                      />
                    ) : (
                      <div className={`group flex items-start gap-3 p-2 bg-white border rounded-lg hover:shadow-sm transition-all relative ${pIsHidden ? 'opacity-50 grayscale bg-slate-50' : ''} ${pIsSelected ? 'border-indigo-500 ring-1 ring-indigo-500 bg-indigo-50/20' : 'border-slate-200'} ${isBeingDragged ? 'opacity-30' : ''}`}>
                        {/* Image Thumbnail */}
                        <div 
                          className="w-10 h-10 bg-slate-100 rounded flex-shrink-0 overflow-hidden cursor-pointer relative group/img"
                          onClick={() => onProductImageClick(product.id)}
                          onPointerDown={e => e.stopPropagation()}
                        >
                          {product.image ? (
                            <img src={product.image} className="w-full h-full object-cover" alt="" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-slate-300"><ImagePlus size={16}/></div>
                          )}
                          <div className="absolute inset-0 bg-black/50 opacity-0 group-hover/img:opacity-100 flex items-center justify-center text-white transition-opacity">
                            <Edit3 size={12} />
                          </div>
                        </div>
                        {product.image && (
                          <button 
                            onClick={() => onRemoveProductImage(product.id)}
                            className="absolute top-1 left-1 bg-red-500 text-white rounded-full p-0.5 opacity-0 group-hover:opacity-100 pointer-events-none group-hover:pointer-events-auto"
                            style={{ width: 14, height: 14 }}
                            title="Remove Image"
                          >
                            <X size={10} />
                          </button>
                        )}

                        <div 
                          className="flex-1 min-w-0 cursor-grab active:cursor-grabbing"
                          onClick={(e) => { e.stopPropagation(); handlers.handleSelection('product', product.id); }}
                        >
                          <div className="flex justify-between items-start">
                            <h4 className="text-sm font-medium text-slate-800 truncate">{product.name}</h4>
                            <span className="text-xs font-mono font-bold text-slate-600">${product.price.toFixed(2)}</span>
                          </div>
                          <p className="text-xs text-slate-400 truncate">{product.description}</p>
                        </div>

                        {/* Options Menu */}
                        <div className="relative">
                          <button 
                            onClick={() => setMenuOpenId(menuOpenId === product.id ? null : product.id)}
                            className="p-1 hover:bg-slate-100 rounded text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity"
                            onPointerDown={e => e.stopPropagation()}
                          >
                            <MoreVertical size={14} />
                          </button>
                          {menuOpenId === product.id && (
                            <>
                              <div className="fixed inset-0 z-40" onClick={() => setMenuOpenId(null)} />
                              <div className="absolute right-0 top-8 z-50 bg-white shadow-xl border border-slate-100 rounded-lg py-1 w-32 animate-in fade-in zoom-in-95 flex flex-col">
                                <button onPointerDown={(e) => e.stopPropagation()} onClick={() => startEdit(product.id, product)} className="px-4 py-2 text-xs text-left hover:bg-slate-50 flex items-center gap-2"> <Edit3 size={14}/> Edit </button>
                                <button 
                                    onPointerDown={(e) => e.stopPropagation()} 
                                    onClick={() => handleToggleVisibility(product.id, !pIsHidden)} 
                                    className="px-4 py-2 text-xs text-left hover:bg-slate-50 flex items-center gap-2"
                                > 
                                    {pIsHidden ? <Eye size={14}/> : <EyeOff size={14}/>} {pIsHidden ? 'Show' : 'Hide'} 
                                </button>
                                <button 
                                  onClick={(e) => { 
                                    e.preventDefault();
                                    e.stopPropagation(); 
                                    remove(product.id, 'product'); 
                                  }} 
                                  className="px-4 py-2 text-xs text-left hover:bg-red-50 text-red-600 flex items-center gap-2"
                                > 
                                  <Trash2 size={14}/> Remove 
                                </button>
                              </div>
                            </>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                )
              })}
              
              {/* Draft Form for New Product */}
              {newItemDraft?.type === 'product' && newItemDraft.categoryId === cat && (
                <EditForm 
                  type="product" 
                  formData={formData} 
                  setFormData={setFormData} 
                  saveEdit={saveEdit} 
                  cancelEdit={cancelEdit} 
                />
              )}
            
              {/* Add Item Button */}
              <button 
                onClick={() => initiateAdd(cat, 'product')}
                className="w-full py-2 text-xs font-medium text-slate-400 border border-dashed border-slate-300 rounded hover:bg-slate-50 hover:text-indigo-600 transition-colors flex items-center justify-center gap-2"
              >
                <Plus size={14} /> Add Item
              </button>
            </div>
            
            {/* Render Category Draft Form OUTSIDE wrapper for correct position */}
            {newItemDraft?.type === 'category' && newItemDraft.categoryId === cat && (
              <div className="mb-4 ml-4 pl-4 border-l-2 border-indigo-200">
                <EditForm 
                  type="category" 
                  formData={formData} 
                  setFormData={setFormData} 
                  saveEdit={saveEdit} 
                  cancelEdit={cancelEdit} 
                />
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};
