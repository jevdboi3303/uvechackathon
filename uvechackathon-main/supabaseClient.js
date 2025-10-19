// ---- supabaseClient.js ----
const SUPABASE_URL = "https://wjjoblztndxdvjfwencq.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Indqam9ibHp0bmR4ZHZqZndlbmNxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjA4NzYwMzQsImV4cCI6MjA3NjQ1MjAzNH0.xRyHtOv1vhyayDUm9C93CzyEeHG6ySgdKo8nRbx4txQ";

// ... (postNote and getNotesForUrl functions are unchanged) ...

async function postNote(note) {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/notes`, {
        method: "POST",
        headers: {
            "apikey": SUPABASE_ANON_KEY,
            "Authorization": `Bearer ${SUPABASE_ANON_KEY}`,
            "Content-Type": "application/json",
            "Prefer": "return=representation"
        },
        body: JSON.stringify(note)
    });

    if (!res.ok) {
        console.error("Post error:", await res.text());
        throw new Error(`Post failed ${res.status}`);
    }
    return res.json();
}

async function getNotesForUrl(url) {
    const cleanUrl = url.split("#")[0].split("?")[0].replace(/\/$/, "");
    const filter = encodeURIComponent(cleanUrl);
    const res = await fetch(`${SUPABASE_URL}/rest/v1/notes?select=*,like_count,id&url=eq.${filter}`, {
        headers: {
            "apikey": SUPABASE_ANON_KEY,
            "Authorization": `Bearer ${SUPABASE_ANON_KEY}`
        }
    });

    if (!res.ok) {
        console.error("Fetch error:", await res.text());
        throw new Error(`Fetch failed ${res.status}`);
    }
    return res.json();
}

// --- THIS IS THE CORRECT FUNCTION ---
async function likeNote(noteId) {
    // This calls the 'increment_like' function you made in Supabase
    const res = await fetch(`${SUPABASE_URL}/rpc/increment_like`, {
        method: "POST",
        headers: {
            "apikey": SUPABASE_ANON_KEY,
            "Authorization": `Bearer ${SUPABASE_ANON_KEY}`,
            "Content-Type": "application/json"
        },
        // We send the noteId as a STRING, which matches the 'uuid' type
        body: JSON.stringify({ note_id_to_inc: noteId }) 
    });

    if (!res.ok) {
        console.error("Like error:", await res.text());
        throw new Error(`Like failed ${res.status}`);
    }
    return true;
}
// --- END UPDATE ---


// expose globally for contentScript.js
window.postNote = postNote;
window.getNotesForUrl = getNotesForUrl;
window.likeNote = likeNote;