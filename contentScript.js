// ---- contentScript.js ----
// Handles highlight detection, note creation, and sidebar rendering.
// Relies on global functions postNote() and getNotesForUrl() defined in supabaseClient.js.

let fab;
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
        // Happens if extension context is reloaded or user has disabled sync
        return "u_local_" + Math.random().toString(36).slice(2, 10);
    }
}

// ---------- Floating "+ Note" Button ----------
function ensureFab() {
    if (fab) return;
    fab = document.createElement("button");
    fab.id = "wn-fab";
    fab.textContent = "+ Note";
    fab.style.display = "none";
    document.documentElement.appendChild(fab);

    fab.addEventListener("click", async () => {
        const selection = window.getSelection();
        const selectionText = selection ? selection.toString().trim() : "";
        const pageUrl = location.origin + location.pathname;

        const noteText = prompt("Add note (public):", "");
        if (!noteText) return;

        const uid = await getOrCreateUid();

        try {
            await postNote({
                url: pageUrl,
                selection_text: selectionText || null,
                note_text: noteText,
                user_id: uid
            });
            renderSidebar();
            alert("Note posted.");
        } catch (e) {
            console.error("Post error:", e);
            alert("Failed to post note.");
        }
    });
}

function updateFabFromSelection() {
    const sel = window.getSelection();
    const hasText = sel && sel.toString().trim().length > 0;
    if (!fab) return;
    fab.style.display = hasText ? "block" : (sidebarOpen ? "block" : "none");
    if (hasText) {
        const rect = sel.getRangeAt(0).getBoundingClientRect();
        fab.style.top = `${rect.bottom + window.scrollY + 8}px`;
        fab.style.left = `${rect.right + window.scrollX + 8}px`;
    }
}

// ---------- Sidebar Toggle ----------
document.addEventListener("selectionchange", () => {
    ensureFab();
    updateFabFromSelection();
});

document.addEventListener("keydown", (e) => {
    if (e.altKey && (e.key === "n" || e.key === "N")) {
        sidebarOpen = !sidebarOpen;
        toggleSidebar(sidebarOpen);
    }
});

function toggleSidebar(open) {
    ensureFab();
    const panel = document.querySelector("#wn-panel");
    if (!panel) return;
    panel.style.display = open ? "block" : "none";
    fab.style.display = open ? "block" : "none";
    if (open) renderSidebar();
}

// ---------- Render Notes ----------
async function renderSidebar() {
    const container = document.querySelector("#wn-panel .wn-list");
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
            container.appendChild(card);
            if (n.selection_text && n.selection_text.length < 160) {
                highlightFirstOccurrence(n.selection_text);
            }
        });
    } catch (e) {
        console.error("Fetch error:", e);
        container.textContent = "Failed to load notes.";
    }
}

function highlightFirstOccurrence(text) {
    const body = document.body;
    const walker = document.createTreeWalker(body, NodeFilter.SHOW_TEXT, null);
    const target = text.trim();
    while (walker.nextNode()) {
        const node = walker.currentNode;
        const idx = node.nodeValue.indexOf(target);
        if (idx >= 0) {
            const range = document.createRange();
            range.setStart(node, idx);
            range.setEnd(node, idx + target.length);
            const mark = document.createElement("span");
            mark.className = "wn-highlight";
            range.surroundContents(mark);
            return true;
        }
    }
    return false;
}

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
ensureFab();
toggleSidebar(true);
