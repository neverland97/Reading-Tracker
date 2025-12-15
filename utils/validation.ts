
import { Book, ReadingStatus } from '../types';

/**
 * 嚴格驗證工具
 * 模擬後端/伺服器端的資料驗證邏輯。
 * 不依賴前端 HTML 的 required 屬性，而是對資料物件進行深度檢查。
 */

const MAX_TITLE_LENGTH = 100;
const MAX_AUTHOR_LENGTH = 50;
const MAX_TYPE_LENGTH = 30; // 新增類型長度限制
const MAX_REVIEW_LENGTH = 2000;
const MAX_KEYWORDS_COUNT = 10;
const MAX_KEYWORD_LENGTH = 20;

export class ValidationError extends Error {
    constructor(message: string) {
        super(message);
        this.name = "ValidationError";
    }
}

export const validateBookData = (data: Partial<Book>) => {
    // 1. 必填欄位檢查 (Sanitization & Presence)
    if (!data.title || typeof data.title !== 'string' || data.title.trim() === '') {
        throw new ValidationError("書籍標題為必填項目且必須是文字。");
    }
    
    // 作者改為選填，僅在有輸入時檢查類型
    if (data.author && typeof data.author !== 'string') {
        throw new ValidationError("作者名稱格式錯誤。");
    }

    // 2. 長度限制 (Length Constraints)
    if (data.title.length > MAX_TITLE_LENGTH) {
        throw new ValidationError(`書籍標題過長 (最大 ${MAX_TITLE_LENGTH} 字)。`);
    }
    if (data.author && data.author.length > MAX_AUTHOR_LENGTH) {
        throw new ValidationError(`作者名稱過長 (最大 ${MAX_AUTHOR_LENGTH} 字)。`);
    }
    if (data.review && data.review.length > MAX_REVIEW_LENGTH) {
        throw new ValidationError(`心得內容過長 (最大 ${MAX_REVIEW_LENGTH} 字)。`);
    }

    // 3. 類型安全與枚舉檢查 (Type Safety & Enum Integrity)
    const validStatuses = Object.values(ReadingStatus);
    if (!data.status || !validStatuses.includes(data.status as ReadingStatus)) {
        throw new ValidationError("無效的閱讀狀態。");
    }

    // 更新：允許自定義類型，只要是字串且不為空即可
    if (!data.type || typeof data.type !== 'string' || data.type.trim() === '') {
        throw new ValidationError("書籍類型為必填項目。");
    }
    if (data.type.length > MAX_TYPE_LENGTH) {
         throw new ValidationError(`書籍類型名稱過長 (最大 ${MAX_TYPE_LENGTH} 字)。`);
    }

    // 4. 數值範圍檢查 (Range Checks)
    if (typeof data.rating !== 'number' || data.rating < 0 || data.rating > 5) {
        throw new ValidationError("評分必須介於 0 到 5 之間。");
    }

    // 新增：日期格式檢查
    if (data.readAt !== undefined && data.readAt !== null) {
        if (typeof data.readAt !== 'number' || isNaN(data.readAt)) {
             throw new ValidationError("閱讀日期格式錯誤。");
        }
    }

    // 5. 陣列內容檢查 (Array Validation)
    if (!Array.isArray(data.keywords)) {
        throw new ValidationError("關鍵字格式錯誤。");
    }
    if (data.keywords.length > MAX_KEYWORDS_COUNT) {
        throw new ValidationError(`關鍵字數量過多 (最多 ${MAX_KEYWORDS_COUNT} 個)。`);
    }
    data.keywords.forEach(k => {
        if (typeof k !== 'string' || k.length > MAX_KEYWORD_LENGTH) {
            throw new ValidationError(`關鍵字 "${k}" 無效或過長。`);
        }
    });

    if (!Array.isArray(data.quotes)) {
        throw new ValidationError("名言佳句格式錯誤。");
    }
    
    // 6. XSS 防護 (簡易版) - 實際伺服器端會做更完整的消毒
    // 這裡檢查是否包含明顯的 script 標籤
    const xssPattern = /<script\b[^>]*>([\s\S]*?)<\/script>/gm;
    if (xssPattern.test(data.title) || xssPattern.test(data.author || '') || xssPattern.test(data.review || '')) {
        throw new ValidationError("偵測到潛在的惡意程式碼輸入。");
    }

    return true;
};
