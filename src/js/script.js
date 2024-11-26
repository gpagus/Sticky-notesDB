import IndexedDBService from './indexedDB.js';

const noteColorInput = document.querySelector("#noteColor");
const addInput = document.querySelector("#addButton");
const mainElement = document.querySelector("main");

let zIndexValue = 1;

// Initialize IndexedDB when the page loads
async function initializeApp() {
    await IndexedDBService.open();
 loadSavedNotes();
}

// Loads the saved notes from the IndexedDB
async function loadSavedNotes() {
    const savedNotes = await IndexedDBService.getAllNotes();
    savedNotes.forEach(noteData => {
        createNoteFromData(noteData);
    });
}

// Create a note from stored data
function createNoteFromData(noteData) {
    let newNote = document.createElement("div");
    newNote.classList = "note";
    newNote.id = noteData.id;


    if (noteData.left !== undefined) {
        newNote.style.left = `${noteData.left}px`;
    }
    if (noteData.top !== undefined) {
        newNote.style.top = `${noteData.top}px`;
    }

    let noteHeader = document.createElement("div");
    noteHeader.classList = "noteHeader";
    noteHeader.innerHTML = `<button class="delete">X</button>`;


    if (noteData.color) {
        noteHeader.style.background = noteData.color;
    }

    newNote.appendChild(noteHeader);

    let noteContent = document.createElement("div");
    noteContent.classList = "noteContent";
    let textarea = document.createElement("textarea");
    textarea.name = "noteText";


    if (noteData.text) {
        textarea.value = noteData.text;
    }

    noteContent.appendChild(textarea);
    newNote.appendChild(noteContent);

    mainElement.appendChild(newNote);
}

// Create a new note
addInput.addEventListener("click", () => {
    const noteId = `note-${Date.now()}`; // Sets an ID wit the exact moment it was created

    let newNote = document.createElement("div");
    newNote.classList = "note";
    newNote.id = noteId;

    let noteHeader = document.createElement("div");
    noteHeader.classList = "noteHeader";
    noteHeader.innerHTML = `<button class="delete">X</button>`;
    newNote.appendChild(noteHeader);

    let noteContent = document.createElement("div");
    noteContent.classList = "noteContent";
    noteContent.innerHTML = `<textarea name="noteText" id="noteText"></textarea>`;
    newNote.appendChild(noteContent);

    noteHeader.style.background = noteColorInput.value;

    mainElement.appendChild(newNote);

    // Save complete note data to IndexedDB
    const noteData = {
        id: noteId,
        color: noteColorInput.value,
        text: '',
        left: 0,
        top: 50
    };
    IndexedDBService.saveNote(noteData);
});

// Delete note
document.addEventListener("click", async (event) => {
    if (event.target.classList.contains('delete')) {
        const note = event.target.closest('.note');
        await IndexedDBService.deleteNote(note.id);
        note.remove();
    }
});

// Dragging and positioning notes
let cursor = { x: null, y: null }
let note = { dom: null, x: null, y: null }

document.addEventListener("mousedown", (event) => {
    if (event.target.classList.contains('noteHeader')) {
        cursor = {
            x: event.clientX,
            y: event.clientY
        }

        let current = event.target.closest('.note');

        note = {
            dom: current,
            x: current.getBoundingClientRect().left,
            y: current.getBoundingClientRect().top
        }

        current.style.cursor = "grabbing";
        current.style.zIndex = zIndexValue;
        zIndexValue++;
    }
});

document.addEventListener("mousemove", (event) => {
    if (note.dom == null) { return; }

    let currentCursor = {
        x: event.clientX,
        y: event.clientY
    }

    let distance = {
        x: currentCursor.x - cursor.x,
        y: currentCursor.y - cursor.y
    }

    note.dom.style.left = (note.x + distance.x) + "px";
    note.dom.style.top = (note.y + distance.y) + "px";
});

document.addEventListener("mouseup", async (event) => {
    if (note.dom) {
        // Update note position in IndexedDB
        const noteData = {
            id: note.dom.id,
            left: parseInt(note.dom.style.left),
            top: parseInt(note.dom.style.top)
        };
        await IndexedDBService.saveNote(noteData);
    }

    note.dom = null;
    if (event.target.parentNode) {
        event.target.parentNode.style.cursor = "grab";
    }
});

// Save note text when it changes
document.addEventListener('input', async (event) => {
    if (event.target.tagName === 'TEXTAREA') {
        const note = event.target.closest('.note');
        const noteData = {
            id: note.id,
            text: event.target.value
        };
        await IndexedDBService.saveNote(noteData);
    }
});


initializeApp();