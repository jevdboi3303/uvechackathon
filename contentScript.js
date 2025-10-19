// ---- contentScript.js ----
let fab;
let sidebarOpen = false;
let currentUser = null;

/* ---------------- SAFE WAIT FOR SUPABASE ---------------- */
function waitForSupabase() {
  return new Promise((resolve) => {
    if (window.supabase) return resolve(window.supabase);
    document.addEventListener("supabaseClientReady", () => resolve(window.supabase), { once: true });
  });
}

/* ---------------- INITIALIZATION ---------------- */
(async () => {
  await waitForSupabase(); // wait until supabaseClient.js has initialized
  await initAuth();
  setupGlobalListeners();
})();

/* ---------------- AUTH HANDLING ---------------- */
async function initAuth() {
  try {
    const { data: { user } } = await window.supabase.auth.getUser();
    currentUser = user;
    updateAuthUI();

    // Keep UI in sync with auth state
    window.supabase.auth.onAuthStateChange((_event, session) => {
      currentUser = session?.user || null;
      updateAuthUI();
    });
  } catch (err) {
    console.error("Auth init failed:", err);
  }
}

/* ---------------- UI + CORE LOGIC ---------------- */
function updateAuthUI() {
  const panel = document.querySelector("#wn-panel");
  if (!panel || !panel.shadowRoot) return;

  const signinView = panel.shadowRoot.querySelector("#wn-signin-view");
  const signupView = panel.shadowRoot.querySelector("#wn-signup-view");
  const userInfoDiv = panel.shadowRoot.querySelector("#wn-user-info");
  const userEmailSpan = panel.shadowRoot.querySelector("#wn-user-email");
  panel.shadowRoot.querySelector("#wn-signin-error").textContent = "";
  panel.shadowRoot.querySelector("#wn-signup-error").textContent = "";

  if (currentUser) {
    signinView.style.display = "none";
    signupView.style.display = "none";
    userInfoDiv.style.display = "block";
    userEmailSpan.textContent = `Signed in as ${currentUser.email}`;
  } else {
    userInfoDiv.style.display = "none";
    signinView.style.display = "block";
    signupView.style.display = "none";
  }
}

function setupGlobalListeners() {
  document.addEventListener("selectionchange", () => { ensureFab(); updateFabFromSelection(); });
  document.addEventListener("keydown", (e) => { if (e.altKey && (e.key === "n" || e.key === "N")) toggleSidebar(!sidebarOpen); });
}

/* ---------------- FAB BUTTON ---------------- */
function ensureFab() {
  if (fab) return;
  fab = document.createElement("button");
  fab.id = "wn-fab";
  fab.textContent = "+ Note";
  fab.style.display = "none";
  document.documentElement.appendChild(fab);
  fab.addEventListener("click", async () => {
    if (!currentUser) {
      alert("Please sign in to post a note.");
      return;
    }
    const selection = window.getSelection();
    const selectionText = selection ? selection.toString().trim() : "";
    const pageUrl = location.origin + location.pathname;
    const noteText = prompt("Add note (public):", "");
    if (!noteText) return;

    try {
      await postNote({
        url: pageUrl,
        selection_text: selectionText || null,
        note_text: noteText,
        user_id: currentUser.id,
      });
      renderSidebar();
    } catch (e) {
      console.error("Post error:", e);
      alert("Failed to post note.");
    }
  });
}

function updateFabFromSelection() {
  const sel = window.getSelection();
  if (!fab) return;
  const hasText = sel && sel.toString().trim().length > 0;
  fab.style.display = hasText ? "block" : sidebarOpen ? "block" : "none";
  if (hasText) {
    const rect = sel.getRangeAt(0).getBoundingClientRect();
    fab.style.top = `${rect.bottom + window.scrollY + 8}px`;
    fab.style.left = `${rect.right + window.scrollX + 8}px`;
  }
}

/* ---------------- SIDEBAR ---------------- */
function toggleSidebar(open) {
  sidebarOpen = open;
  ensureFab();
  const panel = document.querySelector("#wn-panel");
  if (!panel) return;
  panel.style.display = open ? "block" : "none";
  const hasText = window.getSelection().toString().trim().length > 0;
  fab.style.display = open || hasText ? "block" : "none";
  if (open) renderSidebar();
}

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
    notes.forEach((n) => {
      const card = document.createElement("div");
      card.className = "wn-card";
      const sel = n.selection_text ? `<div class="wn-sel">“${escapeHtml(n.selection_text)}”</div>` : "";
      const userIdentifier = escapeHtml(n.username || "Anonymous");
      card.innerHTML = `${sel}<div class="wn-note">${escapeHtml(n.note_text)}</div><div class="wn-meta">${new Date(n.created_at).toLocaleString()} · ${userIdentifier}</div>`;
      container.appendChild(card);
      if (n.selection_text && n.selection_text.length < 160) highlightFirstOccurrence(n.selection_text);
    });
  } catch (e) {
    console.error("Fetch error:", e);
    container.textContent = "Failed to load notes.";
  }
}

/* ---------------- HELPERS ---------------- */
function highlightFirstOccurrence(text) {
  const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT, null);
  const target = text.trim();
  while (walker.nextNode()) {
    const node = walker.currentNode;
    if (node.parentElement && node.parentElement.closest("#wn-panel")) continue;
    const idx = node.nodeValue.indexOf(target);
    if (idx >= 0) {
      if (node.parentElement.classList.contains("wn-highlight")) continue;
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
  return s.replace(/[&<>"']/g, (c) =>
    ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c])
  );
}
