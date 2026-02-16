
import React from 'react';
import { MenuStyle } from '../../types';
import { Loader2, Sparkles, Minus, Plus, ImageIcon, BarChart } from 'lucide-react';

interface ImportToolsProps {
  handleAIImport: (e: React.ChangeEvent<HTMLInputElement>) => void;
  isUploading: boolean;
  fileInputRef: React.RefObject<HTMLInputElement | null>;
  bulkPercentage: number | string;
  setBulkPercentage: (value: string) => void;
  handleBulkAdjust: (direction: 1 | -1) => void;
  style: MenuStyle;
  setStyle: React.Dispatch<React.SetStateAction<MenuStyle>>;
  setShowInsights: (show: boolean) => void;
}

export const ImportTools: React.FC<ImportToolsProps> = ({
  handleAIImport,
  isUploading,
  fileInputRef,
  bulkPercentage,
  setBulkPercentage,
  handleBulkAdjust,
  style,
  setStyle,
  setShowInsights
}) => {
  return (
    <div className="space-y-3 mb-6">
      <button 
        onClick={() => fileInputRef.current?.click()}
        disabled={isUploading}
        className="w-full flex items-center justify-center gap-2 py-2 bg-gradient-to-r from-violet-600 to-indigo-600 text-white rounded-lg shadow-sm hover:shadow-md transition-all text-sm font-medium"
      >
        {isUploading ? <Loader2 className="animate-spin" size={16}/> : <Sparkles size={16}/>}
        AI Import from Photo
      </button>
      <input type="file" ref={fileInputRef} className="hidden" onChange={handleAIImport} accept="image/*" />

      <div className="flex items-center gap-2">
        <div className="flex-1 bg-white border border-slate-200 rounded-lg p-1 flex items-center">
          <input 
            className="w-full bg-transparent text-xs px-2 outline-none font-mono"
            placeholder="%"
            type="number"
            value={bulkPercentage}
            onChange={e => setBulkPercentage(e.target.value)}
          />
          <div className="flex gap-1 pr-1">
            <button onClick={() => handleBulkAdjust(-1)} className="p-1 bg-slate-100 shadow-sm rounded hover:text-red-600"><Minus size={12}/></button>
            <button onClick={() => handleBulkAdjust(1)} className="p-1 bg-slate-100 shadow-sm rounded hover:text-green-600"><Plus size={12}/></button>
          </div>
        </div>
        <button 
          onClick={() => setStyle(prev => ({ ...prev, showImages: !prev.showImages, name: 'Custom' }))}
          className={`p-2 rounded-lg border ${style.showImages ? 'bg-indigo-50 border-indigo-200 text-indigo-600' : 'bg-white border-slate-200 text-slate-400'}`}
          title="Toggle Product Images"
        >
          <ImageIcon size={18} />
        </button>
        <button 
          onClick={() => setShowInsights(true)}
          className="p-2 rounded-lg bg-white border border-slate-200 text-slate-600 hover:text-indigo-600"
          title="Insights"
        >
          <BarChart size={18} />
        </button>
      </div>
    </div>
  );
};
