// ---- supabaseClient.js ----
const SUPABASE_URL = "https://wjjoblztndxdvjfwencq.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Indqam9ibHp0bmR4ZHZqZndlbmNxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjA4NzYwMzQsImV4cCI6MjA3NjQ1MjAzNH0.xRyHtOv1vhyayDUm9C93CzyEeHG6ySgdKo8nRbx4txQ";

const supabase = self.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// --- Auth Functions ---
async function signUpNewUser(email, password, username) {
    const { data: existingUser, error: lookupError } = await supabase
        .from('profiles')
        .select('username')
        .eq('username', username)
        .single();
    if (lookupError && lookupError.code !== 'PGRST116') { throw new Error(lookupError.message); }
    if (existingUser) { throw new Error("Username is already taken."); }
    
    const { data, error } = await supabase.auth.signUp({
        email: email, password: password, options: { data: { username: username } }
    });
    if (error) { throw new Error(error.message); }
    alert("Sign up successful! Please check your email to confirm your account.");
    return data;
}

async function signInWithPassword(email, password) {
    const { data, error } = await supabase.auth.signInWithPassword({ email: email, password: password });
    if (error) { throw new Error(error.message); }
    return data;
}

async function signOut() {
    const { error } = await supabase.auth.signOut();
    if (error) { console.error("Error signing out:", error); }
}

async function getUser() {
    const { data: { user } } = await supabase.auth.getUser();
    return user;
}

// --- Data Functions ---
async function postNote(note) {
    const { data, error } = await supabase.from('notes').insert([note]);
    if (error) { console.error("Post error:", error); throw new Error(error.message); }
    return data;
}

async function getNotesForUrl(url) {
  const cleanUrl = url.split("#")[0].split("?")[0].replace(/\/$/, "");

  const { data, error } = await supabase
    .from('notes')
    .select('id, url, selection_text, note_text, user_id, username, created_at, like_count')
    .eq('url', cleanUrl)
    .order('created_at', { ascending: false });

  if (error) {
    console.error("Fetch error:", error);
    throw new Error(error.message);
  }

  return data.map(note => ({
    ...note,
    username: note.username || 'harry123'
  }));
}


// --- Make client available and signal readiness ---
// Make the client globally accessible to other content scripts
window.supabase = supabase; 
// Dispatch an event to signal that the client is ready
document.dispatchEvent(new CustomEvent('supabaseClientReady'));