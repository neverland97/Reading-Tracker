
export enum ReadingStatus {
  COMPLETED = '完食',
  TO_READ = '待閱',
  DROPPED = '棄書',
  READING = '閱讀中'
}

// 更新書籍類型
export enum BookType {
  COMIC = '漫畫',
  PHYSICAL = '實體書',
  ORIGINAL_NOVEL = '原創小說',
  FOREIGN = '外文書',
  NON_FICTION = '非小說'
}

export interface Book {
  id: string;
  title: string;
  author: string;
  status: ReadingStatus;
  rating: number; // 0 to 5
  review: string;
  quotes: string[]; // List of famous quotes
  type: string; // Changed from BookType enum to string to allow custom types
  keywords: string[];
  isFavorite?: boolean; // New field for favorite status
  readAt?: number; // Optional timestamp for when the book was read
  createdAt: number;
  updatedAt: number;
}

export interface FilterState {
  search: string;
  status: ReadingStatus | 'ALL';
  type: string | 'ALL'; // Changed to string
  minRating: number | 'ALL'; // Filter by minimum stars
  sort: 'newest' | 'oldest';
  onlyFavorites: boolean; // Filter to show only favorites
}
