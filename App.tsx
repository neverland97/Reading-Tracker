
import React, { useState, useEffect, useMemo } from 'react';
import { Book, FilterState, ReadingStatus, BookType } from './types';
import { BookCard } from './components/BookCard';
import { BookFormModal } from './components/BookFormModal';
import { BookDetailModal } from './components/BookDetailModal';
import { AuthorBooksModal } from './components/AuthorBooksModal';
import { SettingsModal } from './components/SettingsModal';
import { Button } from './components/Button';
import { IconFeather, IconBookOpen, IconSettings, IconBookmark } from './components/Icons';
import { LoginPage } from './components/LoginPage';
import { logout, subscribeToAuthChanges } from './services/firebase'; 
import { subscribeToBooks, saveBookToRemote, deleteBookFromRemote } from './services/bookService';
import { validateBookData, ValidationError } from './utils/validation';
import { legacyBooks } from './data/legacyBooks';

// Magic Particles Component for App Background (Dark Mode)
const MagicParticles = ({ count = 40 }: { count?: number }) => {
  const [particles, setParticles] = useState<{id: number, left: number, top: number, delay: number, size: number, duration: number}[]>([]);

  useEffect(() => {
    const newParticles = Array.from({ length: count }).map((_, i) => ({
      id: i,
      left: Math.random() * 100,
      top: Math.random() * 100,
      delay: Math.random() * 10,
      size: Math.random() * 3 + 1,
      duration: Math.random() * 10 + 10 // 10-20s duration for drift
    }));
    setParticles(newParticles);
  }, [count]);

  return (
    <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
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

// UUID Fallback generator
const generateId = () => {
    if (typeof crypto !== 'undefined' && crypto.randomUUID) {
        return crypto.randomUUID();
    }
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
};

const App: React.FC = () => {
  // Auth State
  const [user, setUser] = useState<any>(null);
  const [authLoading, setAuthLoading] = useState(true);

  // App Data State
  const [books, setBooks] = useState<Book[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingBook, setEditingBook] = useState<Book | undefined>(undefined);
  const [isImporting, setIsImporting] = useState(false);
  
  // Settings State
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [fontSize, setFontSize] = useState<'small' | 'normal' | 'large'>('normal');

  // View Details Modal State
  const [viewingBook, setViewingBook] = useState<Book | null>(null);
  
  // Viewing Author State (New Feature)
  const [viewingAuthor, setViewingAuthor] = useState<string | null>(null);

  // Dark Mode State
  const [isDarkMode, setIsDarkMode] = useState(false);

  // Initialize Filter State
  const [filters, setFilters] = useState<FilterState>({
    search: '',
    status: 'ALL',
    type: 'ALL',
    minRating: 'ALL',
    sort: 'newest',
    onlyFavorites: false,
  });

  // Auth Listener - Uses the wrapper service
  useEffect(() => {
      const unsubscribe = subscribeToAuthChanges((currentUser) => {
          setUser(currentUser);
          setAuthLoading(false);
      });
      return () => unsubscribe();
  }, []);

  // Apply dark class to body for scrollbar styling
  useEffect(() => {
    if (isDarkMode) {
      document.body.classList.add('dark');
    } else {
      document.body.classList.remove('dark');
    }
  }, [isDarkMode]);

  // Data Synchronization (Firestore / LocalStorage abstract)
  useEffect(() => {
    if (user) {
        // subscribeToBooks handles both Real Firestore (real-time) and Mock LocalStorage
        const unsubscribe = subscribeToBooks(user, (updatedBooks) => {
            setBooks(updatedBooks);
        });
        return () => unsubscribe();
    } else {
        setBooks([]);
    }
  }, [user]);

  // Aggregate Data for Auto-complete / Suggestions
  const { allAuthors, allKeywords, allTypes, stats } = useMemo(() => {
    const authors = new Set<string>();
    const keywords = new Set<string>();
    // Initialize types with default enum values
    const types = new Set<string>(Object.values(BookType)); 
    let completedCount = 0;
    let toReadCount = 0;

    books.forEach(book => {
      if (book.author) authors.add(book.author);
      book.keywords.forEach(k => keywords.add(k));
      if (book.type) types.add(book.type); // Add custom types found in data

      if (book.status === ReadingStatus.COMPLETED) completedCount++;
      if (book.status === ReadingStatus.TO_READ) toReadCount++;
    });

    return {
      allAuthors: Array.from(authors).sort(),
      allKeywords: Array.from(keywords).sort(),
      allTypes: Array.from(types).sort(),
      stats: {
        total: books.length,
        completed: completedCount,
        toRead: toReadCount
      }
    };
  }, [books]);

  // CRUD Operations with Strict Validation
  const handleAddBook = async (bookData: Omit<Book, 'id' | 'createdAt' | 'updatedAt'>) => {
    try {
        // Double check validation here as safeguard
        validateBookData(bookData);

        const newBook: Book = {
            ...bookData,
            id: generateId(),
            createdAt: Date.now(),
            updatedAt: Date.now(),
            isFavorite: false,
        };
        
        // Save to DB (UI updates via subscription)
        await saveBookToRemote(user, newBook);
        
        // UX FIX: Reset filters to ensure the user sees the newly added book immediately
        setFilters({
            search: '',
            status: 'ALL',
            type: 'ALL',
            minRating: 'ALL',
            sort: 'newest',
            onlyFavorites: false,
        });
        
    } catch (error) {
        if (error instanceof ValidationError) {
            alert(`資料驗證失敗：${error.message}`);
        } else {
            console.error(error);
            alert("發生未預期的錯誤");
        }
    }
  };

  const handleUpdateBook = async (bookData: Omit<Book, 'id' | 'createdAt' | 'updatedAt'>) => {
    if (!editingBook) return;
    try {
        // Strict Validation Check
        validateBookData(bookData);

        const updated = { ...editingBook, ...bookData, updatedAt: Date.now() };
        
        // Save to DB (UI updates via subscription)
        await saveBookToRemote(user, updated);

        setEditingBook(undefined);
        
        // If we are currently viewing this book (Detail Modal), update the view as well
        if (viewingBook && viewingBook.id === editingBook.id) {
            setViewingBook(updated);
        }
    } catch (error) {
        if (error instanceof ValidationError) {
            alert(`資料驗證失敗：${error.message}`);
        } else {
            console.error(error);
            alert("發生未預期的錯誤");
        }
    }
  };

  const handleToggleFavorite = async (book: Book) => {
      try {
          const updated = { ...book, isFavorite: !book.isFavorite, updatedAt: Date.now() };
          await saveBookToRemote(user, updated);
          
          // Update viewing states if necessary
          if (viewingBook && viewingBook.id === book.id) {
              setViewingBook(updated);
          }
      } catch (error) {
          console.error("Failed to toggle favorite", error);
      }
  };

  const handleDeleteBook = async (id: string) => {
      try {
        await deleteBookFromRemote(user, id);
        setViewingBook(null);
        setEditingBook(undefined);
        setIsModalOpen(false);
      } catch (error) {
          console.error("Delete failed", error);
          alert("刪除失敗");
      }
  };
  
  // Helper to process a book object (used for both Legacy and Manual Import)
  const processImportBook = (item: any, existingBook: Book | undefined): Book => {
      // 1. Parsing Rating
      let rating = 0;
      if (typeof item.rating === 'number') {
          rating = item.rating;
      } else if (typeof item.rating === 'string' && item.rating !== 'N/A' && item.rating !== 'X') {
          const parsed = parseFloat(item.rating);
          if (!isNaN(parsed)) rating = parsed;
      }
      
      // 2. Parsing Keywords (Tags)
      let keywords: string[] = [];
      if (item.keywords && Array.isArray(item.keywords)) {
          keywords = item.keywords;
      } else if (item.tags && Array.isArray(item.tags)) {
          keywords = item.tags;
      }
      // Add 'Imported' tag for manual imports if it doesn't exist? No, let's keep it clean.
      // For Legacy import we added '舊紀錄', for JSON import we assume the data is correct.
      // But we ensure unique tags
      keywords = Array.from(new Set(keywords));
      
      // 3. Status Mapping
      let status = ReadingStatus.COMPLETED; // Default
      if (item.status) {
          if (Object.values(ReadingStatus).includes(item.status)) {
              status = item.status;
          } else {
              // Map legacy textual status
              if (item.status === '待看') status = ReadingStatus.TO_READ;
              else if (item.status === '棄書') status = ReadingStatus.DROPPED;
              else if (item.status === '閱讀中') status = ReadingStatus.READING;
          }
      }

      // 4. Type Mapping
      const type = item.type || BookType.ORIGINAL_NOVEL;

      // 5. Comment / Review
      let review = item.review || item.comment || '';
      if (review === 'N/A') review = '';

      const bookId = existingBook ? existingBook.id : generateId();
      const createdAt = existingBook ? existingBook.createdAt : (item.createdAt || Date.now());

      return {
          id: bookId,
          title: item.title,
          author: item.author || existingBook?.author || "未知",
          status: status, 
          rating: rating,
          review: review,
          quotes: Array.isArray(item.quotes) ? item.quotes : [],
          type: type, 
          keywords: keywords,
          isFavorite: existingBook ? existingBook.isFavorite : !!item.isFavorite,
          createdAt: createdAt,
          updatedAt: Date.now(),
          readAt: item.readAt || existingBook?.readAt
      };
  };

  // Manual JSON Import
  const handleImportJson = async (jsonString: string) => {
    if (isImporting) return;
    setIsImporting(true);
    
    try {
        const parsedData = JSON.parse(jsonString);
        if (!Array.isArray(parsedData)) {
            throw new Error("匯入格式錯誤：必須是書籍陣列 ([...])");
        }

        let importedCount = 0;
        let updatedCount = 0;

        for (const item of parsedData) {
            if (!item.title) continue; // Skip invalid entries

            const existingBook = books.find(b => b.title.toLowerCase() === item.title.toLowerCase());
            const newBook = processImportBook(item, existingBook);

            await saveBookToRemote(user, newBook);
            if (existingBook) updatedCount++;
            else importedCount++;
        }

        alert(`成功匯入！新增 ${importedCount} 筆，覆蓋更新 ${updatedCount} 筆。`);
        setFilters({ search: '', status: 'ALL', type: 'ALL', minRating: 'ALL', sort: 'newest', onlyFavorites: false });
        setIsSettingsOpen(false); // Close modal on success

    } catch (error) {
        console.error("JSON Import failed", error);
        alert("匯入失敗，請檢查 JSON 格式是否正確。");
    } finally {
        setIsImporting(false);
    }
  };

  // Legacy Data Import Function
  const handleImportLegacy = async () => {
    if (isImporting) return;
    if (!legacyBooks || legacyBooks.length === 0) {
        alert("找不到內建範例資料。");
        return;
    }

    setIsImporting(true);
    try {
        let importedCount = 0;
        let updatedCount = 0;
        
        for (const item of legacyBooks) {
             const existingBook = books.find(b => b.title.toLowerCase() === item.title.toLowerCase());
             
             // Process Legacy Item specifically (adding '舊紀錄' tag)
             const newBook = processImportBook(item, existingBook);
             if (!newBook.keywords.includes('舊紀錄')) {
                 newBook.keywords.push('舊紀錄');
             }

             await saveBookToRemote(user, newBook);
             if (existingBook) updatedCount++;
             else importedCount++;
        }
        
        alert(`範例匯入完成！新增 ${importedCount} 筆，覆蓋 ${updatedCount} 筆。`);
        setFilters({ search: '', status: 'ALL', type: 'ALL', minRating: 'ALL', sort: 'newest', onlyFavorites: false });
        setIsSettingsOpen(false);

    } catch (error) {
        console.error("Import failed", error);
        alert("匯入過程中發生錯誤。");
    } finally {
        setIsImporting(false);
    }
  };

  const handleExport = () => {
    try {
        const jsonString = JSON.stringify(books, null, 2);
        const blob = new Blob([jsonString], { type: "application/json" });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `reading_tracker_backup_${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    } catch (error) {
        console.error("Export failed", error);
        alert("匯出備份失敗");
    }
  };

  const openAddModal = () => {
    setEditingBook(undefined);
    setIsModalOpen(true);
  };

  const openEditModal = (book: Book) => {
    setViewingBook(null); // Close view modal if open
    // If we are in Author View, we keep it open, edit happens on top
    setEditingBook(book);
    setIsModalOpen(true);
  };

  const openViewModal = (book: Book) => {
    setViewingBook(book);
  };

  const handleAuthorClick = (author: string) => {
      // Close detail view first to switch context cleanly
      setViewingBook(null);
      setViewingAuthor(author);
  };

  const toggleDarkMode = () => {
    setIsDarkMode(!isDarkMode);
  };

  const handleLogout = async () => {
      await logout();
      setUser(null);
  };

  // Filtering & Sorting Logic
  const filteredBooks = useMemo(() => {
    return books
      .filter(book => {
        const matchesSearch = book.title.toLowerCase().includes(filters.search.toLowerCase()) || 
                              book.author.toLowerCase().includes(filters.search.toLowerCase()) ||
                              book.keywords.some(k => k.toLowerCase().includes(filters.search.toLowerCase()));
        const matchesStatus = filters.status === 'ALL' || book.status === filters.status;
        const matchesType = filters.type === 'ALL' || book.type === filters.type;
        const matchesRating = filters.minRating === 'ALL' || book.rating >= (filters.minRating as number);
        const matchesFavorite = !filters.onlyFavorites || book.isFavorite;

        return matchesSearch && matchesStatus && matchesType && matchesRating && matchesFavorite;
      })
      .sort((a, b) => {
        switch (filters.sort) {
          case 'oldest': return a.createdAt - b.createdAt;
          case 'newest':
          default: return b.createdAt - a.createdAt;
        }
      });
  }, [books, filters]);

  // Reusable Stats Component
  const StatsDisplay = () => (
    <div className={`flex gap-4 md:gap-8 px-6 py-3 rounded-lg border shadow-sm backdrop-blur-sm justify-around w-full lg:w-auto transition-colors duration-500
      ${isDarkMode ? 'bg-stone-900/80 border-stone-700' : 'bg-white/80 border-stone-200'}
    `}>
      <div className="flex flex-col items-center">
        <span className={`text-[10px] uppercase tracking-widest font-bold mb-0.5 ${isDarkMode ? 'text-stone-400' : 'text-stone-500'}`}>總藏書</span>
        <span className={`font-display font-bold text-xl ${isDarkMode ? 'text-stone-200' : 'text-stone-700'}`}>{stats.total}</span>
      </div>
      <div className={`w-px h-8 ${isDarkMode ? 'bg-stone-700' : 'bg-stone-200'}`}></div>
      <div className="flex flex-col items-center">
        <span className={`text-[10px] uppercase tracking-widest font-bold mb-0.5 ${isDarkMode ? 'text-stone-400' : 'text-stone-500'}`}>已完食</span>
        <span className="font-display font-bold text-xl text-emerald-600">{stats.completed}</span>
      </div>
      <div className={`w-px h-8 ${isDarkMode ? 'bg-stone-700' : 'bg-stone-200'}`}></div>
      <div className="flex flex-col items-center">
        <span className={`text-[10px] uppercase tracking-widest font-bold mb-0.5 ${isDarkMode ? 'text-stone-400' : 'text-stone-500'}`}>待閱讀</span>
        <span className="font-display font-bold text-xl text-amber-600">{stats.toRead}</span>
      </div>
    </div>
  );

  // Status Tabs Configuration
  const statusTabs = [
    { id: 'ALL', label: '總藏書' }, // Rename from '全部藏書'
    { id: ReadingStatus.READING, label: '閱讀中' },
    { id: ReadingStatus.TO_READ, label: '待閱讀' }, // Rename from '待閱清單'
    { id: ReadingStatus.COMPLETED, label: '已完食' },
    { id: ReadingStatus.DROPPED, label: '棄書' },
  ];

  // Common Select Style for Filters
  const filterSelectClass = `
    border-b bg-transparent py-1.5 px-3 pr-8 text-sm focus:outline-none transition-colors cursor-pointer appearance-none font-display font-bold
    ${isDarkMode ? 'border-stone-700 text-stone-300 focus:border-amber-600' : 'border-stone-300 text-stone-600 focus:border-amber-400'}
  `;

  // Font Size Classes Mapping
  const getFontSizeClass = () => {
      switch(fontSize) {
          case 'small': return 'text-sm';
          case 'large': return 'text-lg';
          // Removed 'xl' to match state type
          default: return 'text-base';
      }
  };

  // Render Login Page if not authenticated
  if (authLoading) {
      return (
          <div className="min-h-screen bg-stone-950 flex items-center justify-center">
               <div className="animate-spin h-8 w-8 text-amber-500">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
               </div>
          </div>
      );
  }

  if (!user) {
      return <LoginPage onLoginSuccess={setUser} />;
  }

  return (
    <div className={`min-h-screen pb-20 font-body transition-colors duration-500 ${getFontSizeClass()} 
        ${isDarkMode ? 'bg-stone-950 text-amber-100' : 'bg-[#faf9f6] text-stone-700 bg-dot-grid'}
    `}>
      
      {/* Background Magic Particles in Dark Mode */}
      {isDarkMode && <MagicParticles count={40} />}

      {/* Header */}
      <header className={`sticky top-0 z-30 backdrop-blur-md border-b shadow-sm transition-colors duration-500 ${isDarkMode ? 'bg-stone-900/90 border-stone-800' : 'bg-[#faf9f6]/90 border-stone-200'}`}>
        <div className="max-w-6xl mx-auto px-4 md:px-6">
          <div className="flex flex-col md:flex-row md:justify-between md:items-center py-4 md:h-24 gap-4">
            
            {/* Top Row (Mobile): Title + User Icon */}
            <div className="flex justify-between items-center">
                <div className="flex items-center gap-3 md:gap-4">
                    <div className={`p-2 md:p-2.5 rounded-lg text-white shadow-md transition-colors duration-500 ${isDarkMode ? 'bg-stone-700' : 'bg-stone-800'}`}>
                        <IconFeather className="w-5 h-5 md:w-6 md:h-6" />
                    </div>
                    <h1 className={`text-xl md:text-4xl font-display font-bold tracking-tight transition-colors duration-500 ${isDarkMode ? 'text-amber-100' : 'text-stone-800'}`}>
                        Reading Tracker
                    </h1>
                </div>
                
                {/* Mobile Logout */}
                 <button 
                    onClick={handleLogout}
                    className="md:hidden text-xs text-stone-500 hover:text-red-500 underline"
                 >
                     登出
                 </button>
            </div>
            
            {/* Second Row (Mobile) / Right Side (Desktop): Actions */}
            <div className="flex items-center justify-end gap-2 md:gap-4 w-full md:w-auto">
               {/* Stats (Desktop Only) */}
               <div className="hidden lg:block mr-4">
                 <StatsDisplay />
               </div>

               {/* Desktop User Info & Logout */}
               <div className="hidden md:flex items-center gap-2 mr-2">
                   {user.photoURL && <img src={user.photoURL} alt="User" className="w-8 h-8 rounded-full border border-stone-300" />}
                   <button onClick={handleLogout} className="text-sm text-stone-500 hover:text-red-500 px-2">
                       登出
                   </button>
               </div>

               {/* Settings Button (Replaces Import/Dark Mode Toggles) */}
               <button 
                  onClick={() => setIsSettingsOpen(true)}
                  className={`p-2 rounded-full transition-all duration-300 group relative ${isDarkMode ? 'bg-stone-800 text-stone-400 hover:bg-stone-700 hover:text-amber-400' : 'bg-stone-200 text-stone-500 hover:bg-stone-300 hover:text-stone-700'}`}
                  title="設定"
               >
                   <IconSettings className="w-5 h-5 md:w-6 md:h-6" />
               </button>
               
               {/* Mobile Add Book Button (Dedicated Circle Icon) */}
               <button
                  onClick={openAddModal}
                  className={`md:hidden flex items-center justify-center rounded-full w-10 h-10 shadow-lg transition-all active:scale-95
                    ${isDarkMode ? 'bg-stone-800/60 backdrop-blur-md border border-stone-700/50 text-stone-200' : 'bg-stone-800 text-[#faf9f6]'}
                  `}
                  aria-label="紀錄書籍"
               >
                 <svg 
                    className="w-6 h-6 text-amber-500" 
                    fill="none" 
                    viewBox="0 0 24 24" 
                    stroke="currentColor" 
                    strokeWidth="2.5"
                 >
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                 </svg>
               </button>

               {/* Desktop Add Book Button (Standard Pill Button) */}
               <Button 
                  onClick={openAddModal} 
                  className={`hidden md:flex items-center justify-center border-none shadow-lg transition-all hover:-translate-y-0.5
                    ${isDarkMode ? 'bg-stone-800/40 backdrop-blur-md border border-stone-700/50 text-stone-200 hover:bg-stone-700/60' : 'bg-stone-800 text-[#faf9f6] hover:bg-stone-700'}
                  `}
               >
                    <span className="text-xl leading-none mr-2 font-serif text-amber-500 pb-1">+</span>
                    <span>紀錄書籍</span>
               </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-6xl mx-auto px-4 md:px-6 py-6 md:py-8 relative z-10">
        
        {/* Mobile Stats (Visible only on mobile/tablet) */}
        <div className="lg:hidden mb-6">
            <StatsDisplay />
        </div>

        {/* Tab Navigation (Category Filter) */}
        <div className="mb-6 overflow-x-auto">
            <div className={`flex space-x-2 border-b-2 pb-1 ${isDarkMode ? 'border-stone-800' : 'border-stone-200'}`}>
                {statusTabs.map(tab => {
                    const isActive = filters.status === tab.id;
                    return (
                        <button
                            key={tab.id}
                            onClick={() => setFilters(prev => ({ ...prev, status: tab.id as any }))}
                            className={`px-4 py-2 rounded-t-lg font-display font-bold text-lg transition-all whitespace-nowrap relative top-[2px] border-t border-l border-r
                                ${isActive 
                                    ? (isDarkMode ? 'bg-stone-900 text-amber-400 border-stone-700 border-b-stone-900' : 'bg-white text-stone-800 border-stone-200 border-b-white') 
                                    : (isDarkMode ? 'text-stone-500 border-transparent hover:text-stone-300' : 'text-stone-400 border-transparent hover:text-stone-600')
                                }
                            `}
                        >
                            {tab.label}
                            {isActive && <span className="sr-only">(Selected)</span>}
                        </button>
                    );
                })}
            </div>
        </div>

        {/* Secondary Filter Bar */}
        <div className={`mb-8 p-4 rounded-b-xl rounded-tr-xl border-l border-r border-b shadow-sm transition-colors duration-500 mt-[-6px]
            ${isDarkMode ? 'bg-stone-900/40 backdrop-blur-md border-stone-800' : 'bg-white border-stone-200'}
        `}>
           <div className="flex flex-col md:flex-row gap-4 md:gap-6 items-end justify-between">
              <div className="relative w-full md:w-1/3">
                 <div className="relative">
                    <input
                        type="text"
                        placeholder="搜尋書名、作者、關鍵字..."
                        className={`block w-full border-b bg-transparent py-2 pl-8 pr-1 focus:outline-none transition-colors font-medium 
                            ${isDarkMode ? 'border-stone-700 text-amber-100 placeholder-stone-600 focus:border-amber-600' : 'border-stone-300 text-stone-700 placeholder-stone-300 focus:border-amber-400'}
                        `}
                        value={filters.search}
                        onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
                    />
                    <svg className={`absolute left-0 top-1/2 -translate-y-1/2 w-5 h-5 ${isDarkMode ? 'text-stone-600' : 'text-stone-300'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                 </div>
              </div>

              <div className="flex gap-3 w-full md:w-auto overflow-x-auto items-center pb-1">

                 {/* Type Filter */}
                 <div className="flex items-center gap-2">
                     <span className={`text-xs uppercase font-bold ${isDarkMode ? 'text-stone-500' : 'text-stone-400'}`}>類型:</span>
                     <div className="relative">
                        <select 
                            className={filterSelectClass}
                            value={filters.type}
                            onChange={(e) => setFilters(prev => ({ ...prev, type: e.target.value as any }))}
                        >
                            <option value="ALL">全部</option>
                            {allTypes.map(t => <option key={t} value={t} className="bg-stone-800 text-stone-200">{t}</option>)}
                        </select>
                        <div className={`absolute right-0 top-1/2 -translate-y-1/2 pointer-events-none p-2 ${isDarkMode ? 'text-stone-500' : 'text-stone-400'}`}>
                           <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                        </div>
                     </div>
                 </div>
                
                 {/* Rating Filter */}
                 <div className="flex items-center gap-2">
                     <span className={`text-xs uppercase font-bold ${isDarkMode ? 'text-stone-500' : 'text-stone-400'}`}>評分:</span>
                     <div className="relative">
                        <select 
                            className={filterSelectClass}
                            value={filters.minRating}
                            onChange={(e) => setFilters(prev => ({ ...prev, minRating: e.target.value === 'ALL' ? 'ALL' : Number(e.target.value) }))}
                        >
                            <option value="ALL">全部</option>
                            <option value="5">5 星</option>
                            <option value="4">4+ 星</option>
                            <option value="3">3+ 星</option>
                        </select>
                        <div className={`absolute right-0 top-1/2 -translate-y-1/2 pointer-events-none p-2 ${isDarkMode ? 'text-stone-500' : 'text-stone-400'}`}>
                           <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                        </div>
                     </div>
                 </div>

                 {/* Sort */}
                 <div className="relative ml-auto">
                    <select 
                    className={filterSelectClass}
                    value={filters.sort}
                    onChange={(e) => setFilters(prev => ({ ...prev, sort: e.target.value as any }))}
                    >
                        <option value="newest">最新</option>
                        <option value="oldest">最早</option>
                    </select>
                    <div className={`absolute right-0 top-1/2 -translate-y-1/2 pointer-events-none p-2 ${isDarkMode ? 'text-stone-500' : 'text-stone-400'}`}>
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                    </div>
                 </div>
              </div>
           </div>
        </div>

        {/* Book Grid */}
        {books.length === 0 ? (
          <div className={`flex flex-col items-center justify-center py-32 rounded-xl border border-dashed ${isDarkMode ? 'border-stone-800 bg-stone-900/30' : 'border-stone-200 bg-white/50'}`}>
             <div className={`mb-6 ${isDarkMode ? 'text-stone-700' : 'text-stone-300'}`}>
                <IconBookOpen className="w-16 h-16" />
             </div>
             <h3 className={`text-2xl font-display font-bold mb-3 ${isDarkMode ? 'text-stone-400' : 'text-stone-600'}`}>
                 {user.displayName ? `歡迎回來，${user.displayName}` : '尚未有收藏'}
             </h3>
             <p className={`text-lg font-display italic mb-8 opacity-70 ${isDarkMode ? 'text-stone-500' : 'text-stone-500'}`}>"書是隨身攜帶的花園。"</p>
             <div className="flex gap-4">
                <Button onClick={openAddModal} variant="secondary" className="rounded-full px-8 py-3 text-base">開始第一筆紀錄</Button>
                {/* Fallback button for empty state import */}
                <Button onClick={handleImportLegacy} variant="ghost" className="rounded-full px-6 py-3 text-base underline">匯入舊紀錄</Button>
             </div>
          </div>
        ) : filteredBooks.length === 0 ? (
          <div className={`flex flex-col items-center justify-center py-20 ${isDarkMode ? 'text-stone-600' : 'text-stone-400'}`}>
             <IconBookmark className="w-12 h-12 mb-4 opacity-20" />
             <p className="text-lg font-display italic">此分類中沒有找到相關書籍。</p>
             <button 
                onClick={() => setFilters({ search: '', status: 'ALL', type: 'ALL', minRating: 'ALL', sort: 'newest', onlyFavorites: false })}
                className="mt-4 text-sm underline hover:text-amber-500 transition-colors"
             >
                 清除所有篩選
             </button>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 md:gap-8 animate-fade-in">
            {filteredBooks.map(book => (
              <BookCard 
                key={book.id} 
                book={book} 
                onClick={openViewModal}
                onToggleFavorite={handleToggleFavorite}
              />
            ))}
          </div>
        )}
      </main>

      {/* Edit/Create Modal */}
      <BookFormModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        onSubmit={editingBook ? handleUpdateBook : handleAddBook}
        initialData={editingBook}
        existingAuthors={allAuthors}
        existingTypes={allTypes} // Pass dynamic types
        existingKeywords={allKeywords}
        isAppDarkMode={isDarkMode}
        allBooks={books} // Pass full list for author cross-referencing
      />

      {/* View Details Modal */}
      <BookDetailModal
        book={viewingBook}
        onClose={() => setViewingBook(null)}
        onEdit={openEditModal}
        onDelete={handleDeleteBook}
        onAuthorClick={handleAuthorClick} // Pass handler
        isAppDarkMode={isDarkMode}
      />

      {/* Author Books Modal */}
      <AuthorBooksModal 
        author={viewingAuthor}
        books={books}
        onClose={() => setViewingAuthor(null)}
        onBookClick={(book) => {
            // Close Author view and open the specific book details
            setViewingBook(book); 
            // setViewingAuthor(null); // Optional: keep author view open or closed based on preference
            setViewingAuthor(null);
        }}
        isAppDarkMode={isDarkMode}
        onToggleFavorite={handleToggleFavorite}
      />

      {/* Settings Modal */}
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        isDarkMode={isDarkMode}
        toggleDarkMode={toggleDarkMode}
        fontSize={fontSize}
        setFontSize={setFontSize}
        onlyFavorites={filters.onlyFavorites}
        toggleFavorites={() => setFilters(prev => ({ ...prev, onlyFavorites: !prev.onlyFavorites }))}
        onImportJson={handleImportJson} // New manual import handler
        onExport={handleExport}
        isImporting={isImporting}
      />

    </div>
  );
};

export default App;
