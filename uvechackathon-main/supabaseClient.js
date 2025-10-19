// ---- supabaseClient.js ----
const SUPABASE_URL = "https://wjjoblztndxdvjfwencq.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Indqam9ibHp0bmR4ZHZqZndlbmNxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjA4NzYwMzQsImV4cCI6MjA3NjQ1MjAzNH0.xRyHtOv1vhyayDUm9C93CzyEeHG6ySgdKo8nRbx4txQ";

// POST a note
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

// GET notes for a given URL
async function getNotesForUrl(url) {
    const cleanUrl = url.split("#")[0].split("?")[0].replace(/\/$/, "");
    const filter = encodeURIComponent(cleanUrl);
    const res = await fetch(`${SUPABASE_URL}/rest/v1/notes?url=eq.${filter}`, {
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

// expose globally for contentScript.js
window.postNote = postNote;
window.getNotesForUrl = getNotesForUrl;
