
import React, { useEffect, useState } from 'react';
import { Book, ReadingStatus } from '../types';
import { Button } from './Button';
import { StarRating } from './StarRating';
import { IconQuill, IconBookOpen, IconFeather, IconRune } from './Icons';

interface BookDetailModalProps {
  book: Book | null;
  onClose: () => void;
  onEdit: (book: Book) => void;
  onDelete: (id: string) => void;
  onAuthorClick: (author: string) => void;
  isAppDarkMode: boolean;
}

const MagicParticles = () => {
  const [particles, setParticles] = useState<{id: number, left: number, top: number, delay: number, size: number, duration: number}[]>([]);

  useEffect(() => {
    const newParticles = Array.from({ length: 15 }).map((_, i) => ({
      id: i,
      left: Math.random() * 100,
      top: Math.random() * 100,
      delay: Math.random() * 5,
      size: Math.random() * 2 + 1,
      duration: Math.random() * 8 + 8
    }));
    setParticles(newParticles);
  }, []);

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
      {particles.map(p => (
        <div 
          key={p.id}
          className="magic-dust"
          style={{
            left: `${p.left}%`,
            top: `${p.top}%`,
            width: `${p.size}px`,
            height: `${p.size}px`,
            animation: `float-drift ${p.duration}s infinite ease-in-out ${p.delay}s`
          }}
        />
      ))}
    </div>
  );
};

export const BookDetailModal: React.FC<BookDetailModalProps> = ({ 
  book, 
  onClose, 
  onEdit, 
  onDelete,
  onAuthorClick,
  isAppDarkMode 
}) => {
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  useEffect(() => {
    if (book) {
        setShowDeleteConfirm(false);
    }
  }, [book]);

  if (!book) return null;

  const isDarkTheme = !isAppDarkMode;

  const statusLabels = {
    [ReadingStatus.COMPLETED]: '完食',
    [ReadingStatus.TO_READ]: '待閱',
    [ReadingStatus.READING]: '閱讀中',
    [ReadingStatus.DROPPED]: '棄書',
  };

  const handleDeleteClick = (e: React.MouseEvent) => {
      e.stopPropagation();
      setShowDeleteConfirm(true);
  };

  const handleConfirmDelete = (e: React.MouseEvent) => {
      e.stopPropagation();
      onDelete(book.id);
  };

  const handleCancelDelete = (e: React.MouseEvent) => {
      e.stopPropagation();
      setShowDeleteConfirm(false);
  };

  const formattedReadDate = book.readAt 
      ? new Date(book.readAt).toLocaleDateString('zh-TW', { year: 'numeric', month: 'long', day: 'numeric' })
      : null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#000000]/70 backdrop-blur-sm transition-all duration-300">
      <div 
        className={`relative w-full max-w-xl max-h-[90vh] flex flex-col rounded-xl shadow-2xl overflow-hidden font-body transform transition-all border animate-unroll 
          ${isDarkTheme ? 'bg-stone-950 border-amber-900/50' : 'bg-parchment border-stone-200'}
        `}
        onClick={(e) => e.stopPropagation()}
      >
        {isDarkTheme && <MagicParticles />}

        <div className={`h-32 absolute w-full top-0 left-0 z-0 opacity-50 bg-gradient-to-b ${isDarkTheme ? 'from-stone-900 to-transparent' : 'from-stone-200 to-transparent'}`}></div>
        
        <IconRune className={`absolute top-4 left-4 w-6 h-6 z-0 ${isDarkTheme ? 'text-amber-500/20' : 'text-stone-400/20'}`} />
        <IconRune className={`absolute top-4 right-16 w-6 h-6 z-0 rotate-90 ${isDarkTheme ? 'text-amber-500/20' : 'text-stone-400/20'}`} />

        <button 
            onClick={onClose} 
            className={`absolute top-5 right-5 p-2 z-50 rounded-full transition-colors shadow-sm cursor-pointer border 
              ${isDarkTheme ? 'bg-stone-800/50 text-stone-500 hover:text-stone-300 border-stone-700' : 'bg-white/80 text-stone-400 hover:text-stone-600 border-stone-200'}
            `}
        >
          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
        </button>

        {showDeleteConfirm && (
            <div className="absolute inset-0 z-[60] flex items-center justify-center bg-black/50 backdrop-blur-[2px] p-6 animate-in fade-in duration-200" onClick={(e) => e.stopPropagation()}>
                <div className={`w-full max-w-sm p-6 rounded-xl shadow-2xl border transform scale-100 transition-all
                    ${isDarkTheme ? 'bg-stone-900 border-red-900/50' : 'bg-white border-stone-200'}
                `}>
                    <div className="flex flex-col items-center text-center">
                        <div className={`mb-4 p-3 rounded-full ${isDarkTheme ? 'bg-red-900/20 text-red-500' : 'bg-red-50 text-red-500'}`}>
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                        </div>
                        <h3 className={`text-xl font-display font-bold mb-2 ${isDarkTheme ? 'text-stone-200' : 'text-stone-800'}`}>
                            銷毀卷軸？
                        </h3>
                        <p className={`text-sm mb-6 leading-relaxed px-2 ${isDarkTheme ? 'text-stone-400' : 'text-stone-600'}`}>
                            您確定要刪除《{book.title}》的紀錄嗎？<br/>這道魔法不可逆轉，紀錄將永久消失。
                        </p>
                        <div className="flex gap-3 w-full">
                            <button 
                                onClick={handleCancelDelete}
                                className={`flex-1 px-4 py-2.5 rounded-lg text-sm font-bold transition-colors
                                    ${isDarkTheme ? 'bg-stone-800 text-stone-400 hover:bg-stone-700 hover:text-stone-200' : 'bg-stone-100 text-stone-500 hover:bg-stone-200 hover:text-stone-700'}
                                `}
                            >
                                保留
                            </button>
                            <button 
                                onClick={handleConfirmDelete}
                                className="flex-1 px-4 py-2.5 rounded-lg text-sm font-bold bg-red-600 hover:bg-red-700 text-white shadow-lg transition-transform active:scale-95"
                            >
                                確認銷毀
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        )}

        <div className={`relative p-8 pt-12 z-10 overflow-y-auto scrollbar-hide ${isDarkTheme ? 'text-stone-200' : 'text-stone-700'}`}>
            
            <div className="text-center mb-6">
                <div className={`inline-flex items-center justify-center mb-3 ${isDarkTheme ? 'text-amber-500' : 'text-amber-700'}`}>
                    <IconBookOpen className={`w-10 h-10 relative z-10 ${isDarkTheme ? 'drop-shadow-[0_0_10px_rgba(245,158,11,0.3)]' : ''}`} />
                </div>
                <h2 className={`text-2xl md:text-3xl font-display font-bold mb-2 leading-tight tracking-wide ${isDarkTheme ? 'text-stone-100' : 'text-stone-800'}`}>
                    {book.title}
                </h2>
                
                <div className={`flex items-center justify-center gap-2 text-sm mb-2 ${isDarkTheme ? 'text-stone-400' : 'text-stone-500'}`}>
                    <span className="font-display italic text-base opacity-70">by</span>
                    <button 
                        onClick={(e) => { e.stopPropagation(); onAuthorClick(book.author); }}
                        className={`font-bold border-b-2 border-transparent pb-0.5 text-base transition-all
                            ${isDarkTheme 
                                ? 'text-amber-100/90 hover:text-amber-400 hover:border-amber-400' 
                                : 'text-stone-800 hover:text-amber-600 hover:border-amber-600'}
                        `}
                        title="查看此作者的其他作品"
                    >
                        {book.author}
                    </button>
                </div>

                {formattedReadDate && (
                    <div className={`text-xs font-display italic mb-5 ${isDarkTheme ? 'text-stone-500' : 'text-stone-400'}`}>
                        已於 {formattedReadDate} 閱讀
                    </div>
                )}
                
                <div className="flex justify-center items-center gap-3 mb-4 flex-wrap">
                    <span className={`px-3 py-1 rounded-md border text-xs font-bold tracking-wide shadow-sm 
                        ${isDarkTheme ? 'bg-stone-900 border-stone-800 text-stone-300' : 'bg-stone-50 border-stone-200 text-stone-600'}
                    `}>
                        {statusLabels[book.status]}
                    </span>
                    <span className={`px-3 py-1 rounded-md border text-xs tracking-wide shadow-sm
                         ${isDarkTheme ? 'bg-stone-900 border-stone-800 text-stone-400' : 'bg-stone-50 border-stone-200 text-stone-500'}
                    `}>
                        {book.type}
                    </span>
                    <div className={`px-1.5 py-0.5 rounded-md border ${isDarkTheme ? 'bg-stone-900 border-stone-800' : 'bg-white border-stone-200'}`}>
                       <StarRating rating={book.rating} readOnly size="sm" />
                    </div>
                </div>

                {/* Moved Keywords (Tags) here, right under Rating */}
                {book.keywords.length > 0 && (
                     <div className="flex flex-wrap gap-2 justify-center mt-2 mb-4">
                        {book.keywords.map((k, i) => (
                           <span key={i} className={`text-xs px-2.5 py-1 rounded-lg border font-medium
                               ${isDarkTheme ? 'text-stone-400 bg-stone-900 border-stone-800/80' : 'text-stone-500 bg-stone-50 border-stone-200'}
                           `}>
                              #{k}
                           </span>
                        ))}
                     </div>
                )}
            </div>

            <div className="space-y-5">
                
                {book.quotes.length > 0 && (
                    <div className={`p-5 rounded-xl border relative overflow-hidden shadow-inner group
                        ${isDarkTheme ? 'bg-stone-900/50 border-stone-800' : 'bg-stone-50/50 border-stone-200'}
                    `}>
                         <div className={`absolute -right-6 -top-6 ${isDarkTheme ? 'text-stone-800' : 'text-stone-200'}`}>
                            <IconQuill className="w-24 h-24 opacity-20" />
                         </div>
                         <h3 className="text-[10px] font-bold text-amber-600/70 uppercase tracking-widest mb-3 flex items-center gap-2 relative z-10">
                            <IconQuill className="w-3 h-3" /> 經典名言
                         </h3>
                         <div className="space-y-4 relative z-10">
                            {book.quotes.map((quote, i) => (
                                <p key={i} className={`font-display text-base md:text-lg italic leading-relaxed pl-4 drop-shadow-sm border-l-2
                                    ${isDarkTheme ? 'text-stone-200 border-amber-900/50' : 'text-stone-700 border-amber-200'}
                                `}>
                                    「{quote}」
                                </p>
                            ))}
                         </div>
                    </div>
                )}

                {book.review && (
                    <div className="px-1">
                         <h3 className="text-[10px] font-bold text-amber-600/70 uppercase tracking-widest mb-2 flex items-center gap-2">
                            <IconFeather className="w-3 h-3" />
                            心得筆記
                         </h3>
                         <p className={`text-base leading-7 whitespace-pre-wrap font-light text-justify ${isDarkTheme ? 'text-stone-300' : 'text-stone-700'}`}>
                             {book.review}
                         </p>
                    </div>
                )}
            </div>

            <div className={`flex justify-between items-center mt-6 pt-5 border-t ${isDarkTheme ? 'border-stone-800' : 'border-stone-200'}`}>
                 <Button 
                    onClick={handleDeleteClick}
                    className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-stone-500 hover:bg-red-900/20 hover:text-red-400 transition-all text-xs font-medium cursor-pointer bg-transparent border-none shadow-none"
                 >
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
                    刪除紀錄
                 </Button>
                 <Button 
                    onClick={() => onEdit(book)} 
                    variant="primary"
                    className="rounded-lg px-6 py-2 bg-amber-700 hover:bg-amber-600 text-amber-50 border-none text-sm shadow-lg shadow-amber-900/20"
                 >
                    編輯
                 </Button>
            </div>
        </div>
      </div>
    </div>
  );
};
