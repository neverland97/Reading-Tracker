import { db, MOCK_USER_ID_PREFIX } from './firebase';
import { Book } from '../types';
// 👇 新增：引入必要的 Firestore 模組化函式
import { 
  collection, 
  doc, 
  query, 
  orderBy, 
  onSnapshot, 
  setDoc, 
  deleteDoc 
} from 'firebase/firestore'; 

// Simple event system for mock mode to mimic real-time updates within the session
type Listener = (books: Book[]) => void;
let mockListeners: Listener[] = [];

const notifyMockListeners = (userId: string) => {
    const key = `reading-track-data-v1-${userId}`;
    const data = localStorage.getItem(key);
    const books = data ? JSON.parse(data) : [];
    mockListeners.forEach(l => l(books));
};

/**
 * Subscribes to book updates.
 * - If User is a Demo User: Listens to local storage changes (simulated).
 * - If User is Real: Listens to Firestore real-time updates.
 */
export const subscribeToBooks = (user: any, onUpdate: (books: Book[]) => void) => {
    const isMock = user.uid.startsWith(MOCK_USER_ID_PREFIX);

    if (isMock) {
        // 1. Initial Load for Mock User
        const key = `reading-track-data-v1-${user.uid}`;
        const data = localStorage.getItem(key);
        onUpdate(data ? JSON.parse(data) : []);

        // 2. Register listener for subsequent updates
        mockListeners.push(onUpdate);
        
        // Return unsubscribe function
        return () => {
            mockListeners = mockListeners.filter(l => l !== onUpdate);
        };
    }

    // ✅ 修改：使用 Modular Syntax (模組化語法)
    // 舊寫法: db.collection('users').doc(user.uid).collection('books')
    const booksRef = collection(db, 'users', user.uid, 'books');
    
    // 舊寫法: booksRef.orderBy(...)
    const q = query(booksRef, orderBy('createdAt', 'desc'));

    // 舊寫法: q.onSnapshot(...)
    const unsubscribe = onSnapshot(q, (snapshot) => {
        const books = snapshot.docs.map(doc => doc.data() as Book);
        onUpdate(books);
    }, (error) => {
        console.error("Firestore subscription error:", error);
    });

    return unsubscribe;
};

/**
 * Saves (Create or Update) a book.
 */
export const saveBookToRemote = async (user: any, book: Book) => {
    const isMock = user.uid.startsWith(MOCK_USER_ID_PREFIX);

    if (isMock) {
         const key = `reading-track-data-v1-${user.uid}`;
         const saved = localStorage.getItem(key);
         let books: Book[] = saved ? JSON.parse(saved) : [];
         
         const index = books.findIndex(b => b.id === book.id);
         if (index >= 0) {
             books[index] = book;
         } else {
             books.unshift(book);
         }
         
         localStorage.setItem(key, JSON.stringify(books));
         notifyMockListeners(user.uid);
         return;
    }

    // ✅ 修改：使用 Modular Syntax (模組化語法)
    // 舊寫法: db.collection(...).doc(...).set(...)
    // 新寫法: 先建立參照 (Reference)，再執行 setDoc
    const bookRef = doc(db, 'users', user.uid, 'books', book.id);
    await setDoc(bookRef, book);
};

/**
 * Deletes a book.
 */
export const deleteBookFromRemote = async (user: any, bookId: string) => {
    const isMock = user.uid.startsWith(MOCK_USER_ID_PREFIX);

    if (isMock) {
        const key = `reading-track-data-v1-${user.uid}`;
         const saved = localStorage.getItem(key);
         if (saved) {
             let books: Book[] = JSON.parse(saved);
             books = books.filter(b => b.id !== bookId);
             localStorage.setItem(key, JSON.stringify(books));
             notifyMockListeners(user.uid);
         }
         return;
    }

    // ✅ 修改：使用 Modular Syntax (模組化語法)
    // 舊寫法: db.collection(...).doc(...).delete()
    const bookRef = doc(db, 'users', user.uid, 'books', bookId);
    await deleteDoc(bookRef);
};