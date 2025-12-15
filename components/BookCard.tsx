
import React from 'react';
import { Book, ReadingStatus } from '../types';
import { StarRating } from './StarRating';
import { IconQuill, IconFeather, IconBookmark } from './Icons';

interface BookCardProps {
  book: Book;
  onClick: (book: Book) => void;
  onToggleFavorite: (book: Book) => void;
}

export const BookCard: React.FC<BookCardProps> = ({ book, onClick, onToggleFavorite }) => {
  const statusLabels = {
    [ReadingStatus.COMPLETED]: '完食',
    [ReadingStatus.TO_READ]: '待閱',
    [ReadingStatus.READING]: '閱讀中',
    [ReadingStatus.DROPPED]: '棄書',
  };

  const statusColors = {
    [ReadingStatus.COMPLETED]: 'bg-stone-100 text-stone-600 border border-stone-200',
    [ReadingStatus.TO_READ]: 'bg-amber-50 text-amber-700 border border-amber-200',
    [ReadingStatus.READING]: 'bg-blue-50 text-blue-700 border border-blue-200',
    [ReadingStatus.DROPPED]: 'bg-red-50 text-red-700 border border-red-200',
  };

  const displayQuote = book.quotes && book.quotes.length > 0 ? book.quotes[0] : null;
  const displayReview = !displayQuote && book.review ? book.review : null;

  const handleFavoriteClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onToggleFavorite(book);
  };

  return (
    <div 
      onClick={() => onClick(book)}
      className="group cursor-pointer flowing-card w-full h-full transition-transform duration-300 hover:-translate-y-1 flex flex-col"
    >
      <div className="flowing-card-content bg-parchment shadow-sm flex flex-col p-3 md:p-5 h-full overflow-hidden relative">
        
        <div className="flex justify-between items-start mb-1.5 md:mb-2 relative z-10">
            <span className="font-display italic text-[10px] md:text-xs text-stone-400 tracking-wide font-semibold truncate max-w-[50%] pt-1">
                {book.type}
            </span>
            
            <div className="flex items-center gap-1.5 md:gap-2">
                <span className={`px-1.5 py-0.5 rounded text-[9px] md:text-[10px] font-bold tracking-wider whitespace-nowrap ${statusColors[book.status]}`}>
                    {statusLabels[book.status]}
                </span>
                
                <button 
                    onClick={handleFavoriteClick}
                    className={`transition-all duration-300 hover:scale-110 focus:outline-none ${book.isFavorite ? 'text-red-600' : 'text-stone-300 hover:text-stone-400'}`}
                    title={book.isFavorite ? "取消收藏" : "加入收藏"}
                >
                    <IconBookmark className={`w-4 h-4 md:w-5 md:h-5 ${book.isFavorite ? 'fill-current' : ''}`} />
                </button>
            </div>
        </div>

        <div className="relative z-10 mb-2 md:mb-3">
            <h3 className="font-display font-bold text-base md:text-xl text-stone-800 leading-tight mb-0.5 md:mb-1 line-clamp-2 group-hover:text-amber-600 transition-colors">
            {book.title}
            </h3>
            <div className="flex items-center gap-2">
                <span className="h-px w-3 md:w-4 bg-stone-300"></span>
                <p className="font-body text-[10px] md:text-xs font-bold text-stone-500 truncate">
                {book.author}
                </p>
            </div>
        </div>

        {(displayQuote || displayReview) ? (
            <div className="relative z-10 mb-2 md:mb-4 flex-grow min-h-[2.5rem] md:min-h-[3.5rem]">
                {displayQuote ? (
                    <div className="pl-2 md:pl-3 border-l-2 border-amber-300/40 py-1">
                        <p className="text-[10px] md:text-xs text-stone-600 font-display italic line-clamp-3 leading-relaxed">
                           <span className="mr-1 opacity-50"><IconQuill className="w-3 h-3 inline" /></span>
                           「{displayQuote}」
                        </p>
                    </div>
                ) : (
                    <div className="bg-stone-50/50 p-1.5 md:p-2 rounded-lg border border-stone-100/50">
                        <p className="text-[10px] md:text-xs text-stone-500 font-body leading-relaxed line-clamp-3 opacity-90 text-justify">
                           <span className="mr-1 opacity-50"><IconFeather className="w-3 h-3 inline" /></span>
                           {displayReview}
                        </p>
                    </div>
                )}
            </div>
        ) : (
            <div className="flex-grow min-h-[1.5rem] md:min-h-[2rem]"></div>
        )}

        <div className="flex items-center gap-2 mb-2 md:mb-3 mt-1 relative z-10 scale-90 origin-left md:scale-100">
            <StarRating rating={book.rating} readOnly size="sm" />
        </div>

        <div className="pt-2 md:pt-3 border-t border-stone-100 border-dashed relative z-10">
            {book.keywords.length > 0 ? (
                <div className="flex flex-wrap gap-1 md:gap-1.5 overflow-hidden max-h-[1.4rem] md:max-h-[1.6rem]">
                {book.keywords.slice(0, 3).map((k, i) => (
                    <span key={i} className="text-[9px] md:text-[10px] font-bold text-stone-500 bg-stone-50 px-1 md:px-1.5 py-0.5 rounded border border-stone-100 whitespace-nowrap">
                        #{k}
                    </span>
                ))}
                {book.keywords.length > 3 && <span className="text-[9px] md:text-[10px] text-stone-400 pt-0.5 font-bold">...</span>}
                </div>
            ) : (
                <span className="text-[9px] md:text-[10px] text-stone-300 font-body italic opacity-50">無標籤</span>
            )}
        </div>
      </div>
    </div>
  );
};
