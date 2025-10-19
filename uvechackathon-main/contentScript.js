// ---- contentScript.js ----
// Handles note creation and sidebar rendering.
// Relies on global functions postNote() and getNotesForUrl() defined in supabaseClient.js.

let fab; // The floating button
let sidebarOpen = false;

// ---------- UID Helper ----------
async function getOrCreateUid() {
    try {
        const stored = await chrome.storage.sync.get(["wn_uid"]);
        let uid = stored.wn_uid;
        if (!uid) {
            uid = "u_" + Math.random().toString(36).slice(2, 10);
            await chrome.storage.sync.set({ wn_uid: uid });
        }
        return uid;
    } catch (err) {
        console.warn("Storage access failed, using fallback UID:", err);
        return "u_local_" + Math.random().toString(36).slice(2, 10);
    }
}

// ---------- Floating "+ Note" Button (FOR SELECTIONS) ----------
function ensureFab() {
    if (fab) return;
    fab = document.createElement("button");
    fab.id = "wn-fab";
    fab.textContent = "+ Note";
    fab.style.display = "none";
    document.documentElement.appendChild(fab);

    fab.addEventListener("click", async (e) => {
        e.stopPropagation();
        await addSelectionNote();
    });
}

function updateFabFromSelection() {
    ensureFab();
    const sel = window.getSelection();
    const hasText = sel && sel.toString().trim().length > 0;
    
    if (hasText) {
        const rect = sel.getRangeAt(0).getBoundingClientRect();
        fab.style.display = "block";
        fab.style.top = `${rect.bottom + window.scrollY + 8}px`;
        fab.style.left = `${rect.right + window.scrollX + 8}px`;
    } else {
        fab.style.display = "none";
    }
}

// ---------- Sidebar Toggle & Events ----------
document.addEventListener("selectionchange", updateFabFromSelection);

document.addEventListener("keydown", (e) => {
    if (e.altKey && (e.key === "n" || e.key === "N")) {
        toggleSidebar(!sidebarOpen);
    }
});

function toggleSidebar(open) {
    sidebarOpen = open;
    const panel = document.querySelector("#wn-panel");
    if (!panel) return;
    panel.style.display = open ? "block" : "none";
    if (open) {
        renderSidebar();
    }
}

// ---------- Add Note Functions ----------
async function addPageNote() {
    const pageUrl = location.origin + location.pathname;
    const noteText = prompt("Add note for this page (public):", "");
    if (!noteText) return;
    const uid = await getOrCreateUid();

    try {
        await postNote({
            url: pageUrl,
            selection_text: null,
            note_text: noteText,
            user_id: uid
        });
        renderSidebar();
    } catch (e) {
        console.error("Post error:", e);
        alert("Failed to post note.");
    }
}

async function addSelectionNote() {
    const selection = window.getSelection();
    const selectionText = selection ? selection.toString().trim() : "";
    if (!selectionText) return;

    const pageUrl = location.origin + location.pathname;
    const noteText = prompt("Add note for this selection (public):", "");
    if (!noteText) return;
    const uid = await getOrCreateUid();

    try {
        await postNote({
            url: pageUrl,
            selection_text: selectionText,
            note_text: noteText,
            user_id: uid
        });
        renderSidebar();
        window.getSelection().removeAllRanges();
        fab.style.display = "none";
    } catch (e) {
        console.error("Post error:", e);
        alert("Failed to post note.");
    }
}


// ---------- Render Notes ----------
async function renderSidebar() {
    const panel = document.querySelector("#wn-panel");
    if (!panel || !panel.shadowRoot) return;
    
    const container = panel.shadowRoot.querySelector(".wn-list");
    if (!container) return;
    
    container.innerHTML = "Loading…";

    try {
        const pageUrl = location.origin + location.pathname;
        const notes = await getNotesForUrl(pageUrl);
        container.innerHTML = "";
        if (!notes.length) {
            container.textContent = "No notes yet.";
            return;
        }

        notes.forEach(n => {
            const card = document.createElement("div");
            card.className = "wn-card";
            const sel = n.selection_text ? `<div class="wn-sel">“${escapeHtml(n.selection_text)}”</div>` : "";

            card.innerHTML = `
            ${sel}
            <div class="wn-note">${escapeHtml(n.note_text)}</div>
            <div class="wn-meta">${new Date(n.created_at).toLocaleString()} · ${n.user_id}</div>
            `;

            if (n.selection_text) {
                card.style.cursor = "pointer";
                card.dataset.selectionText = n.selection_text; 
                card.addEventListener('click', handleNoteClick);
            }

            container.appendChild(card);
        });
    } catch (e) {
        console.error("Fetch error:", e);
        container.textContent = "Failed to load notes.";
    }
}

// --- NEW, SIMPLER CLICK HANDLER ---
function handleNoteClick(event) {
    const noteCard = event.currentTarget;
    const textToFind = noteCard.dataset.selectionText;
    if (!textToFind) return;

    // Clear any previous selection
    window.getSelection().removeAllRanges();

    // Use Chrome's built-in Find function
    const found = window.find(textToFind, false, false, true, false, false, false);
    // (text, caseSensitive, backwards, wrapAround, wholeWord, searchInFrames, showDialog)

    if (!found) {
        alert("Could not find this highlight on the page. The content may have changed.");
    }
}
// --- END NEW HANDLER ---

// --- highlightFirstOccurrence() FUNCTION IS NOW REMOVED ---

function escapeHtml(s) {
    return s.replace(/[&<>"']/g, c => ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        "\"": "&quot;",
        "'": "&#39;"
    }[c]));
}

// ---------- Init ----------
toggleSidebar(true); 

// Listen for events from Shadow DOM
document.addEventListener("wn-refresh", () => {
    renderSidebar();
});

document.addEventListener("wn-close", () => {
    toggleSidebar(false);
});

document.addEventListener("wn-add-note", () => {
    addPageNote();
});