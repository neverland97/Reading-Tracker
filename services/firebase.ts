import { initializeApp, getApps, getApp } from "firebase/app";
import { 
  getAuth, 
  GoogleAuthProvider, 
  signInWithPopup, 
  signOut, 
  onAuthStateChanged 
} from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { firebaseConfig } from "../config/firebase";

// Initialize Firebase
// ✅ 修改：使用 getApps() 和 getApp() 來檢查是否已初始化 (Modular 語法)
const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);

// ✅ 修改：使用 getAuth() 和 getFirestore() 獲取實例
const auth = getAuth(app);
const db = getFirestore(app);

// ✅ 修改：直接 new GoogleAuthProvider() (不需要 firebase.auth 前綴)
const provider = new GoogleAuthProvider();

const MOCK_USER_KEY = 'reading_tracker_demo_user';
export const MOCK_USER_ID_PREFIX = 'demo-wizard';

export const signInWithGoogle = async () => {
  try {
    // ✅ 修改：將 auth 和 provider 作為參數傳入 signInWithPopup
    const result = await signInWithPopup(auth, provider);
    
    // Clear mock data if real login succeeds
    localStorage.removeItem(MOCK_USER_KEY);
    return result.user;
  } catch (error: any) {
    // Handle unauthorized domain (common in preview environments) or other auth config errors
    if (error.code === 'auth/unauthorized-domain' || error.code === 'auth/operation-not-allowed' || error.code === 'auth/configuration-not-found') {
      console.warn("Firebase Authentication 環境未配置授權網域，自動切換至演示模式 (Demo Mode)。");
      
      const mockUser = {
        uid: `${MOCK_USER_ID_PREFIX}-001`,
        displayName: "見習魔法師",
        email: "wizard@example.com",
        photoURL: "https://api.dicebear.com/7.x/adventurer/svg?seed=Felix",
        isAnonymous: true,
        // Mock token for compatibility
        getIdToken: async () => "mock-token"
      };
      
      // Persist mock session
      localStorage.setItem(MOCK_USER_KEY, JSON.stringify(mockUser));
      
      return mockUser;
    }
    
    console.error("Error signing in with Google", error);
    throw error;
  }
};

export const logout = async () => {
  try {
    // ✅ 修改：將 auth 作為參數傳入 signOut
    await signOut(auth);
    localStorage.removeItem(MOCK_USER_KEY);
  } catch (error) {
    console.error("Error signing out", error);
    throw error;
  }
};

export const subscribeToAuthChanges = (callback: (user: any) => void) => {
  // ✅ 修改：將 auth 作為參數傳入 onAuthStateChanged
  return onAuthStateChanged(auth, (user) => {
    if (user) {
      callback(user);
    } else {
      // Fallback: Check for local mock session
      const storedMock = localStorage.getItem(MOCK_USER_KEY);
      if (storedMock) {
        try {
          const mockUser = JSON.parse(storedMock);
          callback(mockUser);
        } catch (e) {
          localStorage.removeItem(MOCK_USER_KEY);
          callback(null);
        }
      } else {
        callback(null);
      }
    }
  });
};

export { auth, db };