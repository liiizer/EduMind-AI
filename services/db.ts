import { ChatMessage, MistakeRecord, StudentProfile } from '../types';

const DB_NAME = 'EduMindDB';
const DB_VERSION = 1;

/**
 * Data Access Object (DAO) Layer using IndexedDB
 */
export const dbService = {
  
  async openDB(): Promise<IDBDatabase> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onerror = (event) => reject('Database error: ' + (event.target as any).errorCode);

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        
        // 1. Users Store (Key: email)
        if (!db.objectStoreNames.contains('users')) {
          db.createObjectStore('users', { keyPath: 'email' });
        }

        // 2. Chat History Store (Key: userEmail)
        if (!db.objectStoreNames.contains('chats')) {
          db.createObjectStore('chats', { keyPath: 'userEmail' });
        }

        // 3. Mistake Book Store (Key: Auto-increment ID)
        if (!db.objectStoreNames.contains('mistakes')) {
          const mistakeStore = db.createObjectStore('mistakes', { keyPath: 'id', autoIncrement: true });
          mistakeStore.createIndex('userEmail', 'userEmail', { unique: false });
        }
      };

      request.onsuccess = (event) => {
        resolve((event.target as IDBOpenDBRequest).result);
      };
    });
  },

  // --- User Operations ---

  async createUser(user: StudentProfile): Promise<void> {
    const db = await this.openDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(['users'], 'readwrite');
      const store = transaction.objectStore('users');
      const request = store.put(user); // 'put' updates if exists, creates if not

      request.onsuccess = () => resolve();
      request.onerror = () => reject('Failed to create user');
    });
  },

  async getUser(email: string): Promise<StudentProfile | undefined> {
    const db = await this.openDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(['users'], 'readonly');
      const store = transaction.objectStore('users');
      const request = store.get(email);

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject('Failed to fetch user');
    });
  },

  // --- Chat Operations ---

  async saveChatHistory(userEmail: string, messages: ChatMessage[]): Promise<void> {
    const db = await this.openDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(['chats'], 'readwrite');
      const store = transaction.objectStore('chats');
      const request = store.put({ userEmail, messages, updatedAt: Date.now() });

      request.onsuccess = () => resolve();
      request.onerror = () => reject('Failed to save chat');
    });
  },

  async getChatHistory(userEmail: string): Promise<ChatMessage[]> {
    const db = await this.openDB();
    return new Promise((resolve) => {
      const transaction = db.transaction(['chats'], 'readonly');
      const store = transaction.objectStore('chats');
      const request = store.get(userEmail);

      request.onsuccess = () => {
        resolve(request.result ? request.result.messages : []);
      };
      request.onerror = () => resolve([]);
    });
  },

  // --- Mistake Book Operations ---

  async addMistake(record: MistakeRecord): Promise<void> {
    const db = await this.openDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(['mistakes'], 'readwrite');
      const store = transaction.objectStore('mistakes');
      const request = store.add(record);

      request.onsuccess = () => resolve();
      request.onerror = () => reject('Failed to add mistake');
    });
  },

  async getUserMistakes(userEmail: string): Promise<MistakeRecord[]> {
    const db = await this.openDB();
    return new Promise((resolve) => {
      const transaction = db.transaction(['mistakes'], 'readonly');
      const store = transaction.objectStore('mistakes');
      const index = store.index('userEmail');
      const request = index.getAll(userEmail);

      request.onsuccess = () => resolve(request.result || []);
      request.onerror = () => resolve([]);
    });
  }
};