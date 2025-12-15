
import React, { useState } from 'react';
import { IconSun, IconMoon, IconDownload, IconBookmark } from './Icons';
import { Button } from './Button';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  isDarkMode: boolean;
  toggleDarkMode: () => void;
  fontSize: 'small' | 'normal' | 'large';
  setFontSize: (size: 'small' | 'normal' | 'large') => void;
  onlyFavorites: boolean;
  toggleFavorites: () => void;
  onImportJson: (json: string) => void; // New prop for manual JSON import
  onExport: () => void;
  isImporting: boolean;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  isDarkMode,
  toggleDarkMode,
  fontSize,
  setFontSize,
  onlyFavorites,
  toggleFavorites,
  onImportJson,
  onExport,
  isImporting
}) => {
  const [jsonInput, setJsonInput] = useState('');

  if (!isOpen) return null;

  const handleJsonImportSubmit = () => {
    if (!jsonInput.trim()) {
        alert("請輸入資料內容");
        return;
    }
    onImportJson(jsonInput);
    setJsonInput(''); // Clear after submit
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#000000]/60 backdrop-blur-sm animate-fade-in" onClick={onClose}>
      <div 
        className={`w-full max-w-md p-6 rounded-xl shadow-2xl border animate-unroll relative max-h-[90vh] overflow-y-auto scrollbar-hide
           ${isDarkMode ? 'bg-stone-900 border-stone-700 text-stone-200' : 'bg-white border-stone-200 text-stone-800'}
        `}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-center mb-6 pb-4 border-b border-dashed border-stone-300 dark:border-stone-700 sticky top-0 bg-inherit z-10">
          <h2 className="text-xl font-display font-bold">魔法卷軸設定</h2>
          <button onClick={onClose} className="p-1 hover:bg-stone-100 dark:hover:bg-stone-800 rounded-full transition-colors">
             <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>

        <div className="space-y-8 font-body">
            
            {/* Appearance Section */}
            <section>
                <h3 className={`text-xs font-bold uppercase tracking-widest mb-4 opacity-70 ${isDarkMode ? 'text-amber-500' : 'text-stone-500'}`}>外觀設定</h3>
                
                <div className="flex items-center justify-between mb-4">
                    <span className="font-bold">介面風格</span>
                    <button 
                        onClick={toggleDarkMode}
                        className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all border
                            ${isDarkMode 
                                ? 'bg-amber-900/30 text-amber-200 border-amber-800' 
                                : 'bg-stone-100 text-stone-600 border-stone-200 hover:bg-stone-200'}
                        `}
                    >
                        {isDarkMode ? <IconSun className="w-4 h-4" /> : <IconMoon className="w-4 h-4" />}
                        <span>{isDarkMode ? '切換日間模式' : '切換夜間模式'}</span>
                    </button>
                </div>

                <div className="flex items-center justify-between">
                    <span className="font-bold">字體大小</span>
                    <div className={`flex rounded-lg border p-1 ${isDarkMode ? 'bg-stone-950 border-stone-800' : 'bg-stone-50 border-stone-200'}`}>
                        {[
                            { id: 'small', label: '小' },
                            { id: 'normal', label: '標準' },
                            { id: 'large', label: '大' }
                        ].map((opt) => (
                            <button
                                key={opt.id}
                                onClick={() => setFontSize(opt.id as any)}
                                className={`px-3 py-1 text-sm rounded-md transition-all
                                    ${fontSize === opt.id 
                                        ? (isDarkMode ? 'bg-stone-700 text-white shadow-sm' : 'bg-white text-stone-900 shadow-sm') 
                                        : 'text-stone-400 hover:text-stone-600'}
                                `}
                            >
                                {opt.label}
                            </button>
                        ))}
                    </div>
                </div>
            </section>

            {/* Filter Section */}
            <section>
                <h3 className={`text-xs font-bold uppercase tracking-widest mb-4 opacity-70 ${isDarkMode ? 'text-amber-500' : 'text-stone-500'}`}>瀏覽偏好</h3>
                
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                         <IconBookmark className={`w-4 h-4 ${onlyFavorites ? 'fill-current text-red-500' : ''}`} />
                         <span className="font-bold">只顯示已收藏書籍</span>
                    </div>
                    
                    <button 
                        onClick={toggleFavorites}
                        className={`w-12 h-6 rounded-full p-1 transition-colors duration-300 relative
                            ${onlyFavorites 
                                ? 'bg-amber-500' 
                                : (isDarkMode ? 'bg-stone-700' : 'bg-stone-300')}
                        `}
                    >
                        <div className={`w-4 h-4 bg-white rounded-full shadow-md transform transition-transform duration-300
                            ${onlyFavorites ? 'translate-x-6' : 'translate-x-0'}
                        `}></div>
                    </button>
                </div>
            </section>

            {/* Data Section */}
            <section>
                <h3 className={`text-xs font-bold uppercase tracking-widest mb-4 opacity-70 ${isDarkMode ? 'text-amber-500' : 'text-stone-500'}`}>資料管理</h3>
                
                <div className="space-y-4">
                    {/* Export */}
                    <Button 
                        onClick={onExport} 
                        variant="secondary" 
                        className="w-full justify-center"
                        icon={<IconDownload className="w-4 h-4" />}
                    >
                        匯出備份 (JSON)
                    </Button>
                    
                    <div className={`w-full h-px ${isDarkMode ? 'bg-stone-800' : 'bg-stone-200'}`}></div>

                    {/* Manual Import */}
                    <div className="space-y-2">
                        <label className={`text-sm font-bold ${isDarkMode ? 'text-stone-400' : 'text-stone-600'}`}>
                            匯入舊資料 (貼上 JSON)
                        </label>
                        <textarea
                            value={jsonInput}
                            onChange={(e) => setJsonInput(e.target.value)}
                            className={`w-full h-24 p-3 rounded-lg border text-xs font-mono resize-none focus:outline-none focus:ring-2
                                ${isDarkMode 
                                    ? 'bg-stone-950 border-stone-700 text-stone-300 focus:ring-amber-900' 
                                    : 'bg-stone-50 border-stone-300 text-stone-600 focus:ring-amber-200'}
                            `}
                            placeholder='[{"title": "書名", ...}]'
                        />
                        <Button 
                            onClick={handleJsonImportSubmit} 
                            variant="primary" 
                            isLoading={isImporting}
                            className="w-full justify-center text-xs"
                            disabled={!jsonInput.trim()}
                        >
                            確認匯入
                        </Button>
                    </div>

                </div>
            </section>

        </div>
      </div>
    </div>
  );
};
