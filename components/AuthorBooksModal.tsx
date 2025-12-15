
import React from 'react';
import { Book } from '../types';
import { BookCard } from './BookCard';
import { IconFeather } from './Icons';

interface AuthorBooksModalProps {
  author: string | null;
  books: Book[];
  onClose: () => void;
  onBookClick: (book: Book) => void;
  isAppDarkMode: boolean;
  onToggleFavorite: (book: Book) => void;
}

export const AuthorBooksModal: React.FC<AuthorBooksModalProps> = ({ 
  author, 
  books, 
  onClose, 
  onBookClick, 
  isAppDarkMode,
  onToggleFavorite
}) => {
  if (!author) return null;

  // Filter books by this author
  const authorBooks = books.filter(b => b.author.trim().toLowerCase() === author.trim().toLowerCase());
  
  // Sort by date (newest first)
  authorBooks.sort((a, b) => b.createdAt - a.createdAt);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#000000]/80 backdrop-blur-sm transition-all duration-300">
      <div 
        className={`relative w-full max-w-5xl h-[85vh] flex flex-col rounded-xl shadow-2xl overflow-hidden font-body animate-unroll border
          ${isAppDarkMode ? 'bg-stone-950 border-stone-800' : 'bg-parchment border-stone-200'}
        `}
      >
        {/* Header */}
        <div className={`p-6 border-b flex justify-between items-center z-10
            ${isAppDarkMode ? 'border-stone-800 bg-stone-900/50' : 'border-stone-200 bg-white/50'}
        `}>
            <div className="flex items-center gap-4">
                <div className={`p-3 rounded-full border ${isAppDarkMode ? 'bg-stone-800 border-stone-700 text-amber-500' : 'bg-white border-stone-200 text-amber-600'}`}>
                    <IconFeather className="w-6 h-6" />
                </div>
                <div>
                    <h2 className={`text-2xl font-display font-bold ${isAppDarkMode ? 'text-amber-100' : 'text-stone-800'}`}>
                        {author}
                    </h2>
                    <p className={`text-sm ${isAppDarkMode ? 'text-stone-400' : 'text-stone-500'}`}>
                        收錄作品集 · 共 {authorBooks.length} 本
                    </p>
                </div>
            </div>
            
            <button 
                onClick={onClose}
                className={`p-2 rounded-full transition-colors ${isAppDarkMode ? 'hover:bg-stone-800 text-stone-400' : 'hover:bg-stone-100 text-stone-500'}`}
            >
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
            </button>
        </div>

        {/* Content Grid */}
        <div className={`flex-1 overflow-y-auto p-6 md:p-8 ${isAppDarkMode ? 'bg-stone-950' : 'bg-transparent'}`}>
            {authorBooks.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    {authorBooks.map(book => (
                        <div key={book.id} className="h-64"> 
                            {/* Fixed height container for consistency in this view */}
                            <BookCard book={book} onClick={onBookClick} onToggleFavorite={onToggleFavorite} />
                        </div>
                    ))}
                </div>
            ) : (
                <div className="h-full flex items-center justify-center opacity-50">
                    <p>沒有找到相關書籍。</p>
                </div>
            )}
        </div>
      </div>
    </div>
  );
};
