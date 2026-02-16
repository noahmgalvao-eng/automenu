
import React, { useRef } from 'react';
import { MenuStyle, Product, ElementStyle, SortOption, AddedImage } from '../../types';
import { SAMPLE_BACKGROUNDS, FONTS } from '../../constants';
import { StyleControls } from './StyleControls';
import { 
  Type, ImagePlus, Minus, Plus, LayoutTemplate, 
  Layout, List, Grid, Maximize, Palette, ArrowUpAZ, SortAsc, SortDesc
} from 'lucide-react';

// --- ELEMENTS SECTION ---
interface ElementsSectionProps {
  selection: { type: 'product' | 'category' | 'freeText' | 'addedImage' | null, id: string | null };
  selectedFreeText: Product | null;
  selectedAddedImage: AddedImage | null;
  safeStyles: MenuStyle['elementStyles'];
  setStyle: React.Dispatch<React.SetStateAction<MenuStyle>>;
  updateFreeTextStyle: (id: string, newStyle: ElementStyle) => void;
  updateGlobalElementStyle: (elementType: keyof MenuStyle['elementStyles'], newStyle: ElementStyle) => void;
  setPreviewAction: React.Dispatch<React.SetStateAction<{ type: string, id: number } | undefined>>;
  onAddedImageUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  setSelection: (selection: { type: 'product' | 'category' | 'freeText' | 'addedImage' | null, id: string | null }) => void;
}

export const ElementsSection: React.FC<ElementsSectionProps> = ({
  selection,
  selectedFreeText,
  selectedAddedImage,
  safeStyles,
  setStyle,
  updateFreeTextStyle,
  updateGlobalElementStyle,
  setPreviewAction,
  onAddedImageUpload,
  setSelection
}) => {
  const imageInputRef = useRef<HTMLInputElement>(null);

  return (
    <section className="space-y-3">
        <div className="flex justify-between items-center">
        <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
            <Type size={14} /> Elements
        </h3>
        {selection.type && (
                <span className="text-[10px] bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded-full font-bold">
                    Editing: {selection.type === 'freeText' ? 'Free Text' : selection.type === 'category' ? 'Categories' : selection.type === 'addedImage' ? 'Custom Image' : 'Products'}
                </span>
        )}
        </div>

        {/* DYNAMIC EDIT CONTROLS */}
        {selection.type === 'freeText' && selectedFreeText ? (
            <div className="animate-fade-in border-l-2 border-indigo-500 pl-2">
                <p className="text-xs text-indigo-600 font-medium mb-2">Local Override (Only this item)</p>
                <StyleControls 
                label="Free Text Style"
                value={selectedFreeText.styles || {}}
                onChange={(newStyle) => updateFreeTextStyle(selectedFreeText.id, newStyle)}
                />
            </div>
        ) : selection.type === 'addedImage' && selectedAddedImage ? (
        <div className="animate-fade-in border-l-2 border-indigo-500 pl-2">
                <p className="text-xs text-indigo-600 font-medium mb-2">Image Controls</p>
                <p className="text-xs text-slate-500 mb-2">Drag image on preview to move.</p>
                <div className="flex items-center justify-between bg-slate-50 p-2 rounded">
                    <span className="text-xs font-bold">Size</span>
                    <div className="flex items-center gap-2">
                        <button 
                        onClick={() => setStyle(prev => ({
                            ...prev,
                            addedImages: prev.addedImages?.map(img => img.id === selectedAddedImage.id ? { ...img, width: Math.max(50, img.width - 20) } : img),
                            name: 'Custom'
                        }))}
                        className="p-1 bg-white border border-slate-200 rounded hover:bg-slate-100"
                    >
                        <Minus size={14} />
                        </button>
                        <span className="text-xs w-12 text-center">{Math.round(selectedAddedImage.width)}px</span>
                        <button 
                        onClick={() => setStyle(prev => ({
                            ...prev,
                            addedImages: prev.addedImages?.map(img => img.id === selectedAddedImage.id ? { ...img, width: Math.min(750, img.width + 20) } : img),
                            name: 'Custom'
                        }))}
                        className="p-1 bg-white border border-slate-200 rounded hover:bg-slate-100"
                    >
                        <Plus size={14} />
                        </button>
                    </div>
                </div>
                <button 
                onClick={() => {
                    setStyle(prev => ({
                        ...prev,
                        addedImages: prev.addedImages?.filter(img => img.id !== selectedAddedImage.id),
                        name: 'Custom'
                    }));
                    setSelection({ type: null, id: null });
                }}
                className="w-full mt-2 py-2 text-xs bg-red-50 text-red-600 border border-red-200 rounded hover:bg-red-100"
                >
                    Remove Image
                </button>
        </div>
        ) : (
            <div className="space-y-4 animate-fade-in">
                {(selection.type === 'category' || !selection.type) && safeStyles.category && (
                <StyleControls 
                    label="Category Headers (Global)"
                    value={safeStyles.category}
                    onChange={(s) => updateGlobalElementStyle('category', s)}
                />
                )}
                
                {(selection.type === 'product' || !selection.type) && (
                    <>
                    {safeStyles.productName && <StyleControls 
                        label="Product Names (Global)"
                        value={safeStyles.productName}
                        onChange={(s) => updateGlobalElementStyle('productName', s)}
                    />}
                    {safeStyles.productPrice && <StyleControls 
                        label="Product Prices (Global)"
                        value={safeStyles.productPrice}
                        onChange={(s) => updateGlobalElementStyle('productPrice', s)}
                    />}
                    {safeStyles.productDescription && <StyleControls 
                        label="Product Descriptions (Global)"
                        value={safeStyles.productDescription}
                        onChange={(s) => updateGlobalElementStyle('productDescription', s)}
                    />}
                    </>
                )}
            </div>
        )}

        <div className="mt-4 pt-4 border-t border-slate-100 grid grid-cols-2 gap-2">
        <button 
            onClick={() => setPreviewAction({ type: 'APPEND_FREE_TEXT', id: Date.now() })}
            className="p-3 bg-white border border-slate-200 rounded-lg shadow-sm hover:shadow-md hover:border-indigo-300 hover:bg-indigo-50 transition-all flex flex-col items-center justify-center gap-2 text-sm font-medium text-slate-700"
        >
            <Type size={18} className="text-indigo-600" />
            <span>Add Text</span>
        </button>
        
        <button 
            onClick={() => imageInputRef.current?.click()}
            className="p-3 bg-white border border-slate-200 rounded-lg shadow-sm hover:shadow-md hover:border-indigo-300 hover:bg-indigo-50 transition-all flex flex-col items-center justify-center gap-2 text-sm font-medium text-slate-700"
        >
            <ImagePlus size={18} className="text-indigo-600" />
            <span>Add Image</span>
        </button>
        <input 
            type="file" 
            ref={imageInputRef} 
            className="hidden" 
            accept="image/*"
            onChange={onAddedImageUpload}
        />
        </div>
    </section>
  );
};

// --- TEMPLATES SECTION ---
interface TemplatesSectionProps {
  templates: MenuStyle[];
  currentStyleId: string;
  applyTemplate: (template: MenuStyle) => void;
}

export const TemplatesSection: React.FC<TemplatesSectionProps> = ({ templates, currentStyleId, applyTemplate }) => (
  <section className="space-y-3">
    <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2"> <LayoutTemplate size={14} /> Templates </h3>
    <div className="grid grid-cols-2 gap-2">
        {templates.map(template => (
        <button key={template.id} onClick={() => applyTemplate(template)} className={`p-2 rounded-lg border text-left transition-all hover:shadow-sm flex items-center gap-2 group relative overflow-hidden ${currentStyleId === template.id ? 'ring-2 ring-indigo-500 border-indigo-500 bg-indigo-50' : 'border-slate-200 bg-white'}`}>
            {template.sourceImage ? ( <div className="absolute inset-0 z-0 opacity-20"> <img src={template.sourceImage} className="w-full h-full object-cover" alt="template preview" /> </div> ) : null}
            <div className="w-5 h-5 rounded-sm shadow-sm border border-black/10 relative z-10" style={{ backgroundColor: template.primaryColor }} />
            <span className="text-xs font-semibold text-slate-700 truncate relative z-10">{template.name}</span>
        </button>
        ))}
    </div>
  </section>
);

// --- LAYOUT SECTION ---
interface LayoutSectionProps {
  style: MenuStyle;
  setStyle: React.Dispatch<React.SetStateAction<MenuStyle>>;
  handleImageResize: (delta: number) => void;
}

export const LayoutSection: React.FC<LayoutSectionProps> = ({ style, setStyle, handleImageResize }) => (
  <section className="space-y-3">
    <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2"> <Layout size={14} /> Layout </h3>
    <div className="flex bg-slate-100 p-1 rounded-lg">
        {['list', 'grid', 'cards'].map((mode) => (
        <button key={mode} onClick={() => setStyle(prev => ({ ...prev, layoutMode: mode as any, name: 'Custom' }))} className={`flex-1 py-1.5 text-xs font-medium capitalize rounded-md flex items-center justify-center gap-1 transition-all ${style.layoutMode === mode ? 'bg-white text-indigo-700 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>
            {mode === 'list' && <List size={14} />}
            {mode === 'grid' && <Grid size={14} />}
            {mode === 'cards' && <Maximize size={14} />}
            <span className="hidden sm:inline">{mode}</span>
        </button>
        ))}
    </div>
    
    <div className="flex gap-2">
        <div className="flex-1 bg-slate-50 p-2 rounded border border-slate-100">
            <label className="text-[10px] text-slate-500 font-bold block mb-1">Product Columns</label>
            <div className="flex gap-1">
                {[1, 2, 3].map(cols => ( <button key={cols} onClick={() => setStyle(prev => ({ ...prev, columnCount: cols as any, name: 'Custom' }))} className={`flex-1 h-6 text-xs font-bold rounded ${style.columnCount === cols ? 'bg-indigo-600 text-white' : 'bg-white border border-slate-200 text-slate-600'}`}> {cols} </button> ))}
            </div>
        </div>
        <div className="flex-1 bg-slate-50 p-2 rounded border border-slate-100">
            <label className="text-[10px] text-slate-500 font-bold block mb-1">Category Columns</label>
            <div className="flex gap-1">
                {[1, 2, 3].map(cols => ( <button key={cols} onClick={() => setStyle(prev => ({ ...prev, categoryColumnCount: cols as any, name: 'Custom' }))} className={`flex-1 h-6 text-xs font-bold rounded ${(style.categoryColumnCount || 1) === cols ? 'bg-indigo-600 text-white' : 'bg-white border border-slate-200 text-slate-600'}`}> {cols} </button> ))}
            </div>
        </div>
    </div>
    <div className="space-y-2">
        <div className="flex items-center justify-between px-3 py-2 bg-slate-50 rounded-lg border border-slate-100">
            <span className="text-xs font-bold text-slate-500 uppercase">Image Size</span>
            <div className="flex items-center gap-2">
                    <button onClick={() => handleImageResize(-0.1)} className="p-1 bg-white rounded border border-slate-200 hover:bg-slate-100"><Minus size={14} /></button>
                    <span className="text-xs font-mono w-10 text-center">{Math.round((style.imageScale || 1) * 100)}%</span>
                    <button onClick={() => handleImageResize(0.1)} className="p-1 bg-white rounded border border-slate-200 hover:bg-slate-100"><Plus size={14} /></button>
            </div>
        </div>
    </div>
  </section>
);

// --- STYLE SECTION ---
interface StyleSectionProps {
  style: MenuStyle;
  setStyle: React.Dispatch<React.SetStateAction<MenuStyle>>;
}

export const StyleSection: React.FC<StyleSectionProps> = ({ style, setStyle }) => (
  <section className="space-y-3">
    <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2"> <Palette size={14} /> Colors & Font </h3>
    <div className="grid grid-cols-2 gap-2">
        {FONTS.map(font => ( <button key={font} onClick={() => setStyle(prev => ({ ...prev, fontFamily: font as any, name: 'Custom' }))} className={`px-2 py-1.5 text-xs border rounded hover:border-indigo-300 truncate ${style.fontFamily === font ? 'border-indigo-500 bg-indigo-50 text-indigo-700' : 'border-slate-200 text-slate-600'}`} style={{ fontFamily: font }}> {font} </button> ))}
    </div>
    <div className="flex gap-3 pt-1">
        <div className="space-y-1 flex-1">
            <label className="text-[10px] uppercase font-bold text-slate-400">Main</label>
            <div className="h-8 w-full rounded border border-slate-200 overflow-hidden relative"> <input type="color" value={style.primaryColor} onChange={(e) => setStyle(prev => ({ ...prev, primaryColor: e.target.value, name: 'Custom' }))} className="absolute -top-4 -left-4 w-[200%] h-[200%] cursor-pointer" /> </div>
        </div>
        <div className="space-y-1 flex-1">
            <label className="text-[10px] uppercase font-bold text-slate-400">Bg</label>
            <div className="h-8 w-full rounded border border-slate-200 overflow-hidden relative"> <input type="color" value={style.backgroundColor} onChange={(e) => setStyle(prev => ({ ...prev, backgroundColor: e.target.value, name: 'Custom' }))} className="absolute -top-4 -left-4 w-[200%] h-[200%] cursor-pointer" /> </div>
        </div>
        <div className="space-y-1 flex-1">
            <label className="text-[10px] uppercase font-bold text-slate-400">Text</label>
            <div className="h-8 w-full rounded border border-slate-200 overflow-hidden relative"> <input type="color" value={style.textColor} onChange={(e) => setStyle(prev => ({ ...prev, textColor: e.target.value, name: 'Custom' }))} className="absolute -top-4 -left-4 w-[200%] h-[200%] cursor-pointer" /> </div>
        </div>
    </div>
        <div className="space-y-1">
        <label className="text-[10px] uppercase font-bold text-slate-400">Background Texture</label>
        <div className="grid grid-cols-4 gap-2">
            {SAMPLE_BACKGROUNDS.map((bg, idx) => ( <button key={idx} onClick={() => setStyle(prev => ({ ...prev, backgroundImage: bg.url, name: 'Custom' }))} className={`h-8 w-full rounded border overflow-hidden relative ${style.backgroundImage === bg.url ? 'ring-2 ring-indigo-500 border-indigo-500' : 'border-slate-200'}`}> {bg.url ? ( <div className="w-full h-full opacity-60 hover:opacity-100 transition-opacity" style={{ backgroundImage: `url(${bg.url})`, backgroundSize: 'cover' }} /> ) : ( <div className="w-full h-full bg-slate-50 flex items-center justify-center text-slate-400 text-[9px]">None</div> )} </button> ))}
        </div>
    </div>
  </section>
);

// --- SORTING SECTION ---
interface SortingSectionProps {
  sortOption: SortOption;
  setSortOption: React.Dispatch<React.SetStateAction<SortOption>>;
}

export const SortingSection: React.FC<SortingSectionProps> = ({ sortOption, setSortOption }) => (
  <section className="space-y-3">
    <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2"> <ArrowUpAZ size={14} /> Sorting </h3>
    <div className="flex items-center gap-2">
    <select className="flex-1 p-2 bg-slate-50 border border-slate-200 rounded text-xs font-medium text-slate-700" value={sortOption.field} onChange={(e) => setSortOption(prev => ({...prev, field: e.target.value as any}))}>
        <option value="category">Category</option>
        <option value="name">Name</option>
        <option value="price">Price</option>
    </select>
    <button onClick={() => setSortOption(prev => ({...prev, direction: prev.direction === 'asc' ? 'desc' : 'asc'}))} className="p-2 bg-slate-50 border border-slate-200 rounded text-slate-600 hover:bg-slate-100"> {sortOption.direction === 'asc' ? <SortAsc size={16} /> : <SortDesc size={16} />} </button>
    </div>
  </section>
);
