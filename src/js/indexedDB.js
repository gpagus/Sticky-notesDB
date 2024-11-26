import { INDEXDB_NAME, INDEXDB_VERSION, STORE_NAME } from "./constants.js";

export class DatabaseManager {
  constructor() {
    this.db = null;
  }

  // Open or create the database
  async open() {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(INDEXDB_NAME, INDEXDB_VERSION);

      request.onsuccess = (event) => {
        this.db = event.target.result;
        resolve(this.db);
      };

      request.onerror = (event) => {
        reject(event.target.error);
      };

      request.onupgradeneeded = (event) => {
        const db = event.target.result;
        const objectStore = db.createObjectStore(STORE_NAME, {
          keyPath: "id",
        });
      };
    });
  }

  // Save a note with full data
  async saveNote(note) {
    if (!this.db) {
      throw new Error("The database is not open.");
    }

    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([STORE_NAME], "readwrite");
      const objectStore = transaction.objectStore(STORE_NAME);

      const getRequest = objectStore.get(note.id);

      getRequest.onsuccess = (event) => {
        let oldNote;
        if (event.target.result !== undefined && event.target.result !== null) {
          oldNote = event.target.result;
        } else {
          oldNote = {};
        }

        const newNote = {};

        // sets the attributes of the updated note
        newNote.id = note.id !== undefined ? note.id : oldNote.id;
        newNote.color = note.color !== undefined ? note.color : oldNote.color;
        newNote.text = note.text !== undefined ? note.text : oldNote.text;
        newNote.left = note.left !== undefined ? note.left : oldNote.left;
        newNote.top = note.top !== undefined ? note.top : oldNote.top;

        // Saves the updated note
        const putRequest = objectStore.put(newNote);

        putRequest.onsuccess = () => resolve(putRequest.result);
        putRequest.onerror = () => reject(putRequest.error);
      };

      getRequest.onerror = () => reject(getRequest.error);
    });
  }

  async getAllNotes() {
    if (!this.db) {
      throw new Error("The database is not open.");
    }
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([STORE_NAME], "readonly");
      const objectStore = transaction.objectStore(STORE_NAME);
      const request = objectStore.getAll();

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  async deleteNote(noteId) {
    if (!this.db) {
      throw new Error("The database is not open.");
    }
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([STORE_NAME], "readwrite");
      const objectStore = transaction.objectStore(STORE_NAME);
      const request = objectStore.delete(noteId);

      request.onsuccess = () => resolve(true);
      request.onerror = () => reject(request.error);
    });
  }
}

export default new DatabaseManager();
