
import React, { useState, useEffect, useCallback } from 'react';
import MenuDesigner from './components/MenuDesigner';
import { ProductDesigner } from './components/ProductDesigner';
import { INITIAL_PRODUCTS, INITIAL_STYLE, PRESET_TEMPLATES } from './constants';
import { Product, MenuStyle, SortOption } from './types';
import { ChefHat, PanelLeftOpen, Layout, ShoppingCart, Paintbrush } from 'lucide-react';

interface HistoryState {
  products: Product[];
  style: MenuStyle;
}

const App: React.FC = () => {
  // Application State
  const [products, setProductsRaw] = useState<Product[]>(() => {
    const saved = localStorage.getItem('automenu_products');
    return saved ? JSON.parse(saved) : INITIAL_PRODUCTS;
  });

  const [style, setStyleRaw] = useState<MenuStyle>(() => {
    const saved = localStorage.getItem('automenu_style');
    return saved ? JSON.parse(saved) : INITIAL_STYLE;
  });

  const [templates, setTemplates] = useState<MenuStyle[]>(() => {
    const saved = localStorage.getItem('automenu_templates');
    return saved ? JSON.parse(saved) : PRESET_TEMPLATES;
  });

  // Shared Sort Option for synchronization
  const [sortOption, setSortOption] = useState<SortOption>({ field: 'category', direction: 'asc' });

  // Sidebar Visibility State - Mutually Exclusive logic will be handled in handlers
  const [activePanel, setActivePanel] = useState<'product' | 'style' | null>('product');
  
  // UI Visibility State (Hiding on scroll)
  const [isScrolling, setIsScrolling] = useState(false);

  // --- Undo/Redo History Management ---
  const [history, setHistory] = useState<HistoryState[]>([]);
  const [future, setFuture] = useState<HistoryState[]>([]);

  // Helper to save current state to history before modification
  const saveCheckpoint = useCallback(() => {
    setHistory(prev => {
      const newEntry = { products, style };
      // Limit history size to 50
      const newHistory = [...prev, newEntry];
      if (newHistory.length > 50) return newHistory.slice(1);
      return newHistory;
    });
    setFuture([]); // Clear redo stack on new action
  }, [products, style]);

  // Wrapper for setProducts that saves history
  const setProducts = useCallback((value: React.SetStateAction<Product[]>) => {
    saveCheckpoint();
    setProductsRaw(value);
  }, [saveCheckpoint]);

  // Wrapper for setStyle that saves history
  const setStyle = useCallback((value: React.SetStateAction<MenuStyle>) => {
    saveCheckpoint();
    setStyleRaw(value);
  }, [saveCheckpoint]);

  const undo = () => {
    if (history.length === 0) return;
    const previous = history[history.length - 1];
    const newHistory = history.slice(0, -1);
    
    // Push current to future
    setFuture(prev => [{ products, style }, ...prev]);
    
    // Restore
    setProductsRaw(previous.products);
    setStyleRaw(previous.style);
    setHistory(newHistory);
  };

  const redo = () => {
    if (future.length === 0) return;
    const next = future[0];
    const newFuture = future.slice(1);

    // Push current to history
    setHistory(prev => [...prev, { products, style }]);

    // Restore
    setProductsRaw(next.products);
    setStyleRaw(next.style);
    setFuture(newFuture);
  };

  // Panel Control Handlers (Mutually Exclusive)
  const toggleProductDesigner = () => {
    setActivePanel(activePanel === 'product' ? null : 'product');
  };

  const toggleMenuDesigner = () => {
    setActivePanel(activePanel === 'style' ? null : 'style');
  };

  // Persistence
  useEffect(() => {
    localStorage.setItem('automenu_products', JSON.stringify(products));
  }, [products]);

  useEffect(() => {
    localStorage.setItem('automenu_style', JSON.stringify(style));
  }, [style]);

  useEffect(() => {
    localStorage.setItem('automenu_templates', JSON.stringify(templates));
  }, [templates]);

  return (
    <div className="h-screen bg-slate-50 flex flex-col font-sans text-slate-900 overflow-hidden">
      {/* Navigation Header */}
      <nav className={`bg-white border-b border-slate-200 h-16 flex-shrink-0 z-30 transition-transform duration-300 ${isScrolling ? '-translate-y-full' : 'translate-y-0'}`}>
        <div className="w-full px-4 h-full flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-indigo-600 p-2 rounded-lg">
              <ChefHat className="text-white w-6 h-6" />
            </div>
            <span className="font-bold text-xl bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-violet-600 hidden sm:block">
              AutoMenu AI
            </span>
          </div>
          
          <div className="flex items-center gap-2">
             <div className="text-xs text-slate-400 font-medium">Auto-saving enabled</div>
          </div>
        </div>
      </nav>

      {/* Main Content Area - Horizontal Layout with Rail */}
      <div className={`flex-grow flex overflow-hidden relative transition-all duration-300 ${isScrolling ? '-mt-16' : ''}`}>
        
        {/* Desktop Left Rail */}
        <div className="hidden md:flex flex-col items-center gap-4 w-16 bg-white border-r border-slate-200 py-4 z-40">
            <button 
                onClick={toggleProductDesigner}
                className={`p-3 rounded-xl transition-all ${activePanel === 'product' ? 'bg-indigo-50 text-indigo-600' : 'text-slate-400 hover:text-indigo-600 hover:bg-slate-50'}`}
                title="Product Designer"
            >
                <ShoppingCart size={24} />
            </button>
            <button 
                onClick={toggleMenuDesigner}
                className={`p-3 rounded-xl transition-all ${activePanel === 'style' ? 'bg-indigo-50 text-indigo-600' : 'text-slate-400 hover:text-indigo-600 hover:bg-slate-50'}`}
                title="Style Designer"
            >
                <Paintbrush size={24} />
            </button>
        </div>

        {/* Left Pane: Product Designer */}
        <ProductDesigner 
            products={products}
            setProducts={setProducts}
            style={style}
            setStyle={setStyle}
            setTemplates={setTemplates}
            sortOption={sortOption}
            isOpen={activePanel === 'product'}
            onClose={() => setActivePanel(null)}
        />

        {/* Center/Right Pane: Preview & Menu Designer */}
        {/* We updated MenuDesigner to reverse flex direction so Style Panel is on the LEFT side of the preview, consistent with the rail */}
        <div className="flex-1 min-w-0 h-full relative">
             <MenuDesigner 
                products={products} 
                style={style} 
                setStyle={setStyle} 
                setProducts={setProducts} 
                templates={templates}
                sortOption={sortOption}
                setSortOption={setSortOption}
                undo={undo}
                redo={redo}
                canUndo={history.length > 0}
                canRedo={future.length > 0}
                isOpen={activePanel === 'style'}
                isProductDesignerOpen={activePanel === 'product'}
                onClose={() => setActivePanel(null)}
                onScrollActivity={setIsScrolling}
              />
        </div>
      </div>
      
       {/* Mobile Bottom Navigation Rail */}
       <div className={`md:hidden flex h-16 bg-white border-t border-slate-200 z-50 flex-shrink-0 transition-transform duration-300 ${isScrolling ? 'translate-y-full' : 'translate-y-0'}`}>
            <button 
                onClick={toggleProductDesigner}
                className={`flex-1 flex flex-col items-center justify-center gap-1 ${activePanel === 'product' ? 'text-indigo-600 bg-indigo-50/50' : 'text-slate-400'}`}
            >
                <ShoppingCart size={20} />
                <span className="text-[10px] font-bold">Products</span>
            </button>
            <button 
                onClick={toggleMenuDesigner}
                className={`flex-1 flex flex-col items-center justify-center gap-1 ${activePanel === 'style' ? 'text-indigo-600 bg-indigo-50/50' : 'text-slate-400'}`}
            >
                <Paintbrush size={20} />
                <span className="text-[10px] font-bold">Design</span>
            </button>
       </div>

    </div>
  );
};

export default App;
