
import React, { useState, useEffect, useRef } from 'react';
import { Book, BookType, ReadingStatus } from '../types';
import { Button } from './Button';
import { StarRating } from './StarRating';
import { IconQuill, IconBookmark, IconFeather, IconMagicCircle, IconStarOutline, IconMoonOutline } from './Icons';
import { validateBookData } from '../utils/validation';

interface BookFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (book: Omit<Book, 'id' | 'createdAt' | 'updatedAt'>) => void;
  initialData?: Book;
  existingAuthors: string[];
  existingTypes: string[]; 
  existingKeywords: string[];
  isAppDarkMode?: boolean;
  allBooks?: Book[];
}

const defaultFormData: Omit<Book, 'id' | 'createdAt' | 'updatedAt'> = {
  title: '',
  author: '',
  status: ReadingStatus.TO_READ,
  rating: 0,
  review: '',
  quotes: [],
  type: BookType.COMIC,
  keywords: [],
  readAt: undefined,
};

const MagicParticles = ({ count = 20 }: { count?: number }) => {
  const [particles, setParticles] = useState<{id: number, left: number, top: number, delay: number, size: number, duration: number}[]>([]);

  useEffect(() => {
    const newParticles = Array.from({ length: count }).map((_, i) => ({
      id: i,
      left: Math.random() * 100,
      top: Math.random() * 100,
      delay: Math.random() * 5,
      size: Math.random() * 2 + 1,
      duration: Math.random() * 8 + 8 
    }));
    setParticles(newParticles);
  }, [count]);

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

export const BookFormModal: React.FC<BookFormModalProps> = ({ 
  isOpen, 
  onClose, 
  onSubmit, 
  initialData,
  existingTypes,
  existingKeywords,
  isAppDarkMode
}) => {
  const [formData, setFormData] = useState(defaultFormData);
  const [initialFormState, setInitialFormState] = useState<any>(null);
  
  const [newKeywordInput, setNewKeywordInput] = useState('');
  const [quoteInput, setQuoteInput] = useState('');
  const [isClosing, setIsClosing] = useState(false);
  const [shouldRender, setShouldRender] = useState(false);
  
  const [showDiscardConfirm, setShowDiscardConfirm] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const [isTypeDropdownOpen, setIsTypeDropdownOpen] = useState(false);
  const [forceShowAllTypes, setForceShowAllTypes] = useState(false);
  const typeInputRef = useRef<HTMLInputElement>(null);

  // Tags Dropdown State
  const [isTagDropdownOpen, setIsTagDropdownOpen] = useState(false);
  const tagWrapperRef = useRef<HTMLDivElement>(null);
  const tagInputRef = useRef<HTMLInputElement>(null);
  
  const [dateStr, setDateStr] = useState('');

  const isDarkTheme = isAppDarkMode;

  useEffect(() => {
    if (isOpen) {
      setShouldRender(true);
      setIsClosing(false);
      setErrors({});
      setShowDiscardConfirm(false);
    } else {
        if (!isClosing) setShouldRender(false);
    }
  }, [isOpen]);

  useEffect(() => {
    let startState;
    if (initialData) {
      startState = { ...initialData };
      if (initialData.readAt) {
          setDateStr(new Date(initialData.readAt).toISOString().split('T')[0]);
      } else {
          setDateStr('');
      }
    } else {
      const today = new Date();
      startState = {
          ...defaultFormData,
          readAt: today.getTime()
      };
      setDateStr(today.toISOString().split('T')[0]); 
    }
    
    setFormData(startState);
    setInitialFormState(JSON.parse(JSON.stringify(startState)));
    
    setNewKeywordInput('');
    setQuoteInput('');
    setIsTagDropdownOpen(false); // Reset dropdown state on open
  }, [initialData, isOpen]);

  useEffect(() => {
      const handleClickOutside = (event: MouseEvent) => {
          // Handle Type Dropdown
          if (typeInputRef.current && !typeInputRef.current.parentElement?.contains(event.target as Node)) {
              setIsTypeDropdownOpen(false);
          }
          // Handle Tag Dropdown
          if (tagWrapperRef.current && !tagWrapperRef.current.contains(event.target as Node)) {
              setIsTagDropdownOpen(false);
          }
      };
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const isFormDirty = () => {
      if (!initialFormState) return false;
      return JSON.stringify(formData) !== JSON.stringify(initialFormState);
  };

  const handleCloseAnimation = () => {
    setIsClosing(true);
    setTimeout(() => {
        setShouldRender(false);
        setIsClosing(false);
        onClose();
    }, 500); 
  };

  const handleAttemptClose = (e?: React.MouseEvent) => {
      if (e) e.stopPropagation();
      
      if (isFormDirty()) {
          setShowDiscardConfirm(true);
      } else {
          handleCloseAnimation();
      }
  };

  const handleConfirmDiscard = () => {
      setShowDiscardConfirm(false);
      handleCloseAnimation();
  };

  const handleCancelDiscard = () => {
      setShowDiscardConfirm(false);
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    const finalFormData = { ...formData };
    if (newKeywordInput.trim()) {
        const newTag = newKeywordInput.trim();
        if (!finalFormData.keywords.includes(newTag)) {
            finalFormData.keywords = [...finalFormData.keywords, newTag];
        }
    }

    const newErrors: Record<string, string> = {};
    
    if (!finalFormData.title || !finalFormData.title.trim()) {
        newErrors.title = "請輸入書名";
    }
    if (!finalFormData.type || !finalFormData.type.trim()) {
        newErrors.type = "請選擇或輸入書籍類型";
    }

    if (Object.keys(newErrors).length > 0) {
        setErrors(newErrors);
        return;
    }

    try {
        validateBookData(finalFormData as any);
    } catch (error) {
        console.error(error);
        alert("資料格式有誤，請檢查輸入內容。");
        return; 
    }

    setIsClosing(true);

    setTimeout(() => {
        onSubmit(finalFormData);
        setShouldRender(false);
        setIsClosing(false);
        onClose();
    }, 500);
  };

  if (!shouldRender) return null;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) {
        setErrors(prev => {
            const newErrs = {...prev};
            delete newErrs[name];
            return newErrs;
        });
    }
  };

  const handleTypeInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      setFormData(prev => ({ ...prev, type: e.target.value }));
      setIsTypeDropdownOpen(true);
      setForceShowAllTypes(false);
      
      if (errors.type) {
        setErrors(prev => {
            const newErrs = {...prev};
            delete newErrs.type;
            return newErrs;
        });
      }
  };

  const handleTypeChevronClick = (e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      const nextState = !isTypeDropdownOpen;
      setIsTypeDropdownOpen(nextState);
      if (nextState) {
          setForceShowAllTypes(true);
          typeInputRef.current?.focus();
      }
  };

  const handleTypeSelect = (type: string) => {
      setFormData(prev => ({ ...prev, type }));
      setIsTypeDropdownOpen(false);
      if (errors.type) {
        setErrors(prev => {
            const newErrs = {...prev};
            delete newErrs.type;
            return newErrs;
        });
      }
  };

  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const val = e.target.value;
      setDateStr(val);
      if (val) {
          setFormData(prev => ({ ...prev, readAt: new Date(val).getTime() }));
      } else {
          setFormData(prev => ({ ...prev, readAt: undefined }));
      }
  };

  const handleRatingChange = (rating: number) => {
    setFormData(prev => ({ ...prev, rating }));
  };

  // --- Tag Handling Logic ---
  const addKeyword = (val: string) => {
    const trimmed = val.trim();
    if (trimmed && !formData.keywords.includes(trimmed)) {
      setFormData(prev => ({ ...prev, keywords: [...prev.keywords, trimmed] }));
    }
  };

  const handleTagInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === 'Enter') {
          e.preventDefault(); // Prevent form submission
          addKeyword(newKeywordInput);
          setNewKeywordInput('');
          // Don't close dropdown immediately to allow rapid entry if needed, 
          // or close it if you prefer. Here we keep focus for typing more.
      }
  };

  const handleTagSelect = (tag: string) => {
      addKeyword(tag);
      setNewKeywordInput('');
      setIsTagDropdownOpen(false); // Close after selection
      tagInputRef.current?.focus();
  };

  const handleTagInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      setNewKeywordInput(e.target.value);
      setIsTagDropdownOpen(true);
  };

  const removeKeyword = (keywordToRemove: string) => {
    setFormData(prev => ({ ...prev, keywords: prev.keywords.filter(k => k !== keywordToRemove) }));
  };
  // -------------------------

  const addQuote = () => {
    if (quoteInput.trim()) {
      setFormData(prev => ({ ...prev, quotes: [...prev.quotes, quoteInput.trim()] }));
      setQuoteInput('');
    }
  };

  const handleQuoteEdit = (index: number, newValue: string) => {
      const newQuotes = [...formData.quotes];
      newQuotes[index] = newValue;
      setFormData(prev => ({ ...prev, quotes: newQuotes }));
  };

  const removeQuote = (index: number) => {
     setFormData(prev => ({ ...prev, quotes: prev.quotes.filter((_, i) => i !== index) }));
  };

  const normalizedTypeValue = formData.type.trim().toLowerCase();
  let displayTypes = existingTypes;
  
  if (!forceShowAllTypes && normalizedTypeValue) {
      displayTypes = existingTypes.filter(t => t.toLowerCase().includes(normalizedTypeValue));
  }
  const hasExactMatch = existingTypes.some(t => t.toLowerCase() === normalizedTypeValue);

  // Filter existing keywords for suggestions in Dropdown
  const filteredTags = existingKeywords
    .filter(tag => !formData.keywords.includes(tag))
    .filter(tag => tag.toLowerCase().includes(newKeywordInput.toLowerCase()))
    .slice(0, 50); // Reasonable limit for dropdown

  const getInputClass = (fieldName: string) => `
    block w-full border-b bg-transparent p-2 transition-all font-display appearance-none
    ${isDarkTheme 
      ? errors[fieldName] ? 'border-red-500 focus:border-red-500 text-stone-200 placeholder-red-400/50' : 'border-stone-700 focus:border-amber-500 text-stone-200 placeholder-stone-600' 
      : errors[fieldName] ? 'border-red-500 focus:border-red-500 text-stone-800 placeholder-red-300' : 'border-stone-300 focus:border-amber-400 text-stone-800 placeholder-stone-300'
    }
  `;

  const labelClass = `block text-sm font-bold mb-1 uppercase tracking-wide 
    ${isDarkTheme ? 'text-stone-500' : 'text-stone-400'}`;

  const boxClass = `p-5 rounded-xl border shadow-inner transition-colors 
    ${isDarkTheme ? 'bg-stone-900/40 border-stone-800' : 'bg-stone-50/50 border-stone-100'}`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#000000]/60 backdrop-blur-sm">
      <div className={`rounded-xl w-full max-w-2xl shadow-2xl font-body relative border flex flex-col max-h-[85vh] ${isClosing ? 'animate-rollup' : 'animate-unroll'}
         ${isDarkTheme ? 'bg-stone-950 border-stone-800' : 'bg-parchment bg-dot-grid border-stone-200'}
      `}>
        
        {isDarkTheme && <MagicParticles />}

        <div className={`absolute bottom-6 right-8 w-6 h-6 rounded-full border-2 opacity-60 pointer-events-none ${isDarkTheme ? 'border-amber-500' : 'border-stone-400'}`}></div>
        <div className={`h-4 w-full absolute top-0 left-0 rounded-t-xl border-b z-10 ${isDarkTheme ? 'bg-stone-900 border-stone-800' : 'bg-stone-200/50 border-stone-200'}`}></div>

        <button 
            onClick={handleAttemptClose} 
            className={`absolute top-6 right-6 z-50 flex items-center justify-center w-10 h-10 rounded-full border shadow-md group transition-colors
              ${isDarkTheme ? 'bg-stone-800 border-stone-700 text-stone-500 hover:text-red-400 hover:border-red-900' : 'bg-white border-stone-300 text-stone-400 hover:text-red-500 hover:bg-red-50'}
            `}
            aria-label="Close"
            type="button"
        >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12"></path>
            </svg>
        </button>

        {showDiscardConfirm && (
            <div className="absolute inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-[2px] p-6 animate-in fade-in duration-200" onClick={(e) => e.stopPropagation()}>
                <div className={`w-full max-w-sm p-6 rounded-xl shadow-2xl border transform scale-100 transition-all
                    ${isDarkTheme ? 'bg-stone-900 border-stone-700' : 'bg-white border-stone-300'}
                `}>
                    <div className="flex flex-col items-center text-center">
                        <div className={`mb-4 p-3 rounded-full ${isDarkTheme ? 'bg-stone-800 text-amber-500' : 'bg-amber-50 text-amber-600'}`}>
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                            </svg>
                        </div>
                        <h3 className={`text-xl font-display font-bold mb-2 ${isDarkTheme ? 'text-stone-200' : 'text-stone-800'}`}>
                            放棄未儲存的變更？
                        </h3>
                        <p className={`text-sm mb-6 leading-relaxed px-2 ${isDarkTheme ? 'text-stone-400' : 'text-stone-600'}`}>
                            您已修改了部分內容。若現在離開，剛才施展的墨水魔法將會消失。
                        </p>
                        <div className="flex gap-3 w-full">
                            <button 
                                onClick={handleCancelDiscard}
                                className={`flex-1 px-4 py-2.5 rounded-lg text-sm font-bold transition-colors
                                    ${isDarkTheme ? 'bg-stone-800 text-stone-400 hover:bg-stone-700 hover:text-stone-200' : 'bg-stone-100 text-stone-600 hover:bg-stone-200 hover:text-stone-900'}
                                `}
                            >
                                繼續編輯
                            </button>
                            <button 
                                onClick={handleConfirmDiscard}
                                className={`flex-1 px-4 py-2.5 rounded-lg text-sm font-bold shadow-lg transition-transform active:scale-95
                                    ${isDarkTheme ? 'bg-red-900/80 hover:bg-red-800 text-red-100' : 'bg-red-600 hover:bg-red-700 text-white'}
                                `}
                            >
                                確認放棄
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        )}

        <div className={`flex-none flex justify-between items-start p-6 pb-2 pt-10 border-b relative z-10 ${isDarkTheme ? 'border-stone-800' : 'border-stone-200/50'}`}>
          <h2 className={`text-2xl md:text-3xl font-display font-bold flex items-center gap-3 ${isDarkTheme ? 'text-amber-100' : 'text-stone-800'}`}>
            <IconStarOutline className="w-8 h-8 text-amber-500" />
            {initialData ? '編輯卷軸' : '登錄新卷軸'}
          </h2>
        </div>

        <div className="flex-1 overflow-y-auto scrollbar-hide p-6 md:p-8 space-y-6 relative z-10">
            <form id="bookForm" onSubmit={handleFormSubmit} className="space-y-6">
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8">
                <div className="space-y-6">
                    <div className="relative group">
                        <label className={labelClass}>書名 Title</label>
                        <input
                            type="text"
                            name="title"
                            value={formData.title}
                            onChange={handleChange}
                            className={`${getInputClass('title')} font-bold text-xl md:text-2xl`}
                            placeholder="輸入書名..."
                        />
                        {errors.title && <p className="text-red-500 text-xs mt-1 font-bold animate-pulse">{errors.title}</p>}
                    </div>
                    
                    <div className="relative group">
                        <label className={labelClass}>作者 Author</label>
                        <input
                            type="text"
                            name="author"
                            value={formData.author}
                            onChange={handleChange}
                            className={`${getInputClass('author')} text-lg`}
                            placeholder="輸入作者... (選填)"
                        />
                        {errors.author && <p className="text-red-500 text-xs mt-1 font-bold animate-pulse">{errors.author}</p>}
                    </div>

                    <div className="relative group">
                        <label className={labelClass}>閱讀日期 Date</label>
                        <input
                            type="date"
                            name="date"
                            value={dateStr}
                            onChange={handleDateChange}
                            className={`${getInputClass('date')} text-lg`}
                        />
                    </div>
                </div>

                <div className={boxClass}>
                <div className="grid grid-cols-2 gap-4">
                    
                    <div className="relative">
                        <label className={labelClass}>類型 Type</label>
                        <div className="relative group">
                            <input
                                ref={typeInputRef}
                                type="text"
                                name="type"
                                value={formData.type}
                                onChange={handleTypeInputChange}
                                onFocus={() => setIsTypeDropdownOpen(true)}
                                className={`${getInputClass('type')} text-base font-medium pr-8`}
                                placeholder="輸入或選擇..."
                                autoComplete="off"
                            />
                            <div 
                                className={`absolute right-0 top-1/2 -translate-y-1/2 cursor-pointer p-2 ${isDarkTheme ? 'text-stone-500 hover:text-stone-300' : 'text-stone-400 hover:text-stone-600'}`}
                                onMouseDown={handleTypeChevronClick}
                            >
                                <svg className={`w-4 h-4 transition-transform ${isTypeDropdownOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                            </div>
                            
                            {errors.type && <p className="text-red-500 text-xs mt-1 font-bold animate-pulse">{errors.type}</p>}

                            {isTypeDropdownOpen && (
                                <div className={`absolute left-0 right-0 top-full mt-1 max-h-48 overflow-y-auto rounded-lg shadow-xl border z-50
                                    ${isDarkTheme ? 'bg-stone-900 border-stone-700' : 'bg-white border-stone-200'}
                                `}>
                                    {displayTypes.map((t, index) => (
                                        <button
                                            key={index}
                                            type="button"
                                            onMouseDown={(e) => e.preventDefault()} 
                                            onClick={() => handleTypeSelect(t)}
                                            className={`block w-full text-left px-4 py-2 text-sm transition-colors border-l-2 border-transparent
                                                ${isDarkTheme 
                                                    ? 'text-stone-300 hover:bg-stone-800 hover:text-amber-400 hover:border-amber-500' 
                                                    : 'text-stone-700 hover:bg-stone-50 hover:text-amber-600 hover:border-amber-400'}
                                            `}
                                        >
                                            {t}
                                        </button>
                                    ))}

                                    {!hasExactMatch && formData.type.trim() !== '' && (
                                         <button
                                            type="button"
                                            onMouseDown={(e) => e.preventDefault()}
                                            onClick={() => handleTypeSelect(formData.type)}
                                            className={`block w-full text-left px-4 py-2 text-sm transition-colors border-l-2 border-transparent font-bold border-b border-dashed
                                                ${isDarkTheme 
                                                    ? 'text-emerald-400 bg-stone-800/50 hover:bg-stone-800 border-stone-700' 
                                                    : 'text-emerald-600 bg-emerald-50 hover:bg-emerald-100 border-emerald-200'}
                                            `}
                                         >
                                            <span className="opacity-70 font-normal mr-2 text-xs uppercase tracking-wider">新增:</span> 
                                            "{formData.type}"
                                         </button>
                                    )}

                                    {displayTypes.length === 0 && formData.type.trim() === '' && (
                                        <div className={`px-4 py-3 text-xs italic text-center ${isDarkTheme ? 'text-stone-500' : 'text-stone-400'}`}>
                                            請輸入新類型或從列表選擇...
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>

                    <div>
                    <label className={labelClass}>狀態 Status</label>
                    <div className="relative">
                        <select
                            name="status"
                            value={formData.status}
                            onChange={handleChange}
                            className={`${getInputClass('status')} text-base font-medium cursor-pointer pr-8`}
                        >
                            {Object.values(ReadingStatus).map(status => (
                            <option key={status} value={status} className="bg-stone-800 text-stone-200">{status}</option>
                            ))}
                        </select>
                        <div className={`absolute right-0 top-1/2 -translate-y-1/2 pointer-events-none p-2 ${isDarkTheme ? 'text-stone-500' : 'text-stone-400'}`}>
                           <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                        </div>
                    </div>
                    </div>
                </div>

                <div className="mt-6">
                    <label className={`${labelClass} mb-2`}>評分 Rating</label>
                    <div className={`flex justify-center rounded-lg py-2 shadow-sm border 
                        ${isDarkTheme ? 'bg-stone-900 border-stone-800' : 'bg-white/80 border-stone-100'}`}>
                    <StarRating rating={formData.rating} onRatingChange={handleRatingChange} size="lg" />
                    </div>
                </div>
                </div>
            </div>

            <div>
                <label className={`${labelClass} mb-2 flex items-center gap-2`}>
                    <IconBookmark className={`w-4 h-4 ${isDarkTheme ? 'text-stone-500' : 'text-stone-400'}`} />
                    標籤 Tags
                </label>
                <div className={boxClass}>
                    <div className="flex flex-col md:flex-row gap-4 mb-4 items-end">
                        <div className="flex-1 w-full relative" ref={tagWrapperRef}>
                            <div className="flex gap-2">
                                <input
                                    ref={tagInputRef}
                                    type="text"
                                    value={newKeywordInput}
                                    onChange={handleTagInputChange}
                                    onFocus={() => setIsTagDropdownOpen(true)}
                                    onKeyDown={handleTagInputKeyDown}
                                    className={`${getInputClass('newTag')} text-base`}
                                    placeholder="輸入或搜尋標籤..."
                                    autoComplete="off"
                                />
                                <Button type="button" variant="ghost" size="sm" onClick={() => { addKeyword(newKeywordInput); setNewKeywordInput(''); }}
                                    className={isDarkTheme ? 'text-stone-400 hover:text-stone-200' : ''}
                                >新增</Button>
                            </div>

                            {/* Tags Dropdown */}
                            {isTagDropdownOpen && filteredTags.length > 0 && (
                                <div className={`absolute left-0 right-0 top-full mt-1 max-h-48 overflow-y-auto rounded-lg shadow-xl border z-50
                                    ${isDarkTheme ? 'bg-stone-900 border-stone-700' : 'bg-white border-stone-200'}
                                `}>
                                    {filteredTags.map((tag, index) => (
                                        <button
                                            key={index}
                                            type="button"
                                            onMouseDown={(e) => e.preventDefault()} 
                                            onClick={() => handleTagSelect(tag)}
                                            className={`block w-full text-left px-4 py-2 text-sm transition-colors border-l-2 border-transparent flex items-center justify-between
                                                ${isDarkTheme 
                                                    ? 'text-stone-300 hover:bg-stone-800 hover:text-amber-400 hover:border-amber-500' 
                                                    : 'text-stone-700 hover:bg-stone-50 hover:text-amber-600 hover:border-amber-400'}
                                            `}
                                        >
                                            <span>#{tag}</span>
                                            <span className={`text-xs opacity-50 ${isDarkTheme ? 'text-stone-500' : 'text-stone-400'}`}>
                                                + 加入
                                            </span>
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                    
                    <div className="flex flex-wrap gap-2">
                        {formData.keywords.map((k, i) => (
                        <span key={i} className={`inline-flex items-center px-3 py-1 rounded-lg shadow-sm text-sm border 
                            ${isDarkTheme ? 'bg-stone-800 text-stone-300 border-stone-700' : 'bg-white text-stone-600 border-stone-200'}`}>
                            #{k}
                            <button
                            type="button"
                            onClick={() => removeKeyword(k)}
                            className="ml-2 text-stone-400 hover:text-red-400 font-bold"
                            >
                            ×
                            </button>
                        </span>
                        ))}
                    </div>
                </div>
            </div>

            <div>
                <label className={`${labelClass} mb-2 flex items-center gap-2`}>
                    <IconQuill className="w-4 h-4" /> 經典名言 Quotes
                </label>
                <div className={boxClass}>
                    <div className="flex gap-4 mb-4">
                        <input 
                            type="text" 
                            value={quoteInput}
                            onChange={(e) => setQuoteInput(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addQuote())}
                            className={`${getInputClass('quote')} text-base font-display italic`}
                            placeholder="記錄下書中的金句..."
                        />
                        <Button type="button" variant="ghost" size="sm" onClick={addQuote} className={isDarkTheme ? 'text-stone-400 hover:text-stone-200' : ''}>添加</Button>
                    </div>
                    <div className="space-y-2">
                    {formData.quotes.map((quote, i) => (
                        <div key={i} className={`flex justify-between items-center p-2 rounded-lg border shadow-sm text-base group transition-colors
                            ${isDarkTheme ? 'bg-stone-800 border-stone-700 text-stone-300' : 'bg-white border-stone-200 text-stone-700'}`}>
                            <div className="flex-1 flex items-center gap-1 font-display italic">
                                <span className="opacity-50 select-none">「</span>
                                <input
                                    type="text"
                                    value={quote}
                                    onChange={(e) => handleQuoteEdit(i, e.target.value)}
                                    className={`w-full bg-transparent border-none focus:outline-none focus:ring-0 p-0 
                                        ${isDarkTheme ? 'text-stone-300 placeholder-stone-600' : 'text-stone-700 placeholder-stone-400'}
                                        border-b border-transparent focus:border-dashed focus:border-amber-400 transition-colors
                                    `}
                                />
                                <span className="opacity-50 select-none">」</span>
                            </div>
                            <button type="button" onClick={() => removeQuote(i)} className="text-stone-300 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity ml-2">×</button>
                        </div>
                    ))}
                    </div>
                </div>
            </div>

            <div className="relative">
                <label className={`${labelClass} mb-2 flex items-center gap-2`}>
                    <IconFeather className={`w-4 h-4 ${isDarkTheme ? 'text-stone-500' : 'text-stone-400'}`} />
                    心得筆記 Note
                </label>
                <div className="relative overflow-hidden rounded-xl">
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                        <IconMagicCircle className={`w-56 h-56 animate-spin-slow ${isDarkTheme ? 'text-amber-500/10' : 'text-amber-500/20'}`} />
                    </div>
                    
                    <textarea
                    name="review"
                    rows={4}
                    value={formData.review}
                    onChange={handleChange}
                    className={`block w-full border p-4 rounded-xl text-base leading-relaxed resize-none relative z-10 
                        ${isDarkTheme 
                            ? 'bg-stone-900/60 border-stone-800 text-stone-300 placeholder-stone-600 focus:border-amber-500' 
                            : 'bg-stone-50/70 border-stone-200 text-stone-700 placeholder-stone-300 focus:border-amber-400'}`}
                    placeholder="寫下您的閱讀心得..."
                    />
                </div>
            </div>
            </form>
        </div>

        <div className={`flex-none flex justify-end p-6 border-t rounded-b-xl z-20 
            ${isDarkTheme ? 'bg-stone-900/90 border-stone-800' : 'bg-parchment/90 border-stone-200'}`}>
            <Button 
                type="submit" 
                form="bookForm"
                className={`rounded-lg px-8 py-3 shadow-lg text-lg tracking-wide transform transition-transform hover:scale-105 active:scale-95 w-full md:w-auto 
                    ${isDarkTheme ? 'bg-amber-900 hover:bg-amber-800 text-amber-100 border-amber-800' : 'bg-stone-800 hover:bg-stone-700 text-white'}`}
                icon={<IconMoonOutline className="w-5 h-5 text-amber-500" />}
            >
                {initialData ? '更新紀錄' : '封存紀錄'}
            </Button>
        </div>
      </div>
    </div>
  );
};
