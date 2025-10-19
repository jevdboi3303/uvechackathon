# Web Notes — Community Notes for the Web

**Web Notes** is a Chrome extension that allows users to leave public comments and notes on any webpage. Highlight text to attach a note to a specific selection, or simply leave a general comment for the page. All notes are public, creating a layer of community discussion across the entire web.

This project uses a combination of vanilla JavaScript for the frontend logic and Supabase for the backend, providing authentication, a database, and APIs.

## ✨ Features

* **Leave Notes Anywhere:** Add public notes to any URL.
* **Contextual Highlighting:** Select text on a page to anchor your note to a specific quote.
* **Floating "Add Note" Button:** A convenient button appears whenever you highlight text.
* **Sidebar for Discussion:** A clean, collapsible sidebar displays all notes for the current page. The sidebar can be toggled with the keyboard shortcut `Alt` + `N`.
* **On-Page Highlights:** Notes attached to a selection will highlight the corresponding text on the page for all users to see.
* **User Authentication:** A secure sign-up and sign-in flow powered by Supabase Auth.
* **Shadow DOM Encapsulation:** The sidebar UI is injected using the Shadow DOM to prevent CSS conflicts with the host page.

---

## 🚀 How It Works

1.  **Select Text:** Highlight any text on a webpage. A small `+ Note` button will appear near your selection.
2.  **Add a Note:** Click the button. If you are not signed in, the sidebar will open to the sign-in screen. Once signed in, a prompt will appear asking you to enter your note.
3.  **View Notes:** Open the sidebar by pressing `Alt` + `N`. Here you can see all notes left by other users on the current page.
4.  **See Context:** Notes that were made from a text selection will display the selected text and highlight its first occurrence on the page in yellow.

---

## 🛠️ Tech Stack

* **Frontend:** Vanilla JavaScript, HTML, CSS
* **Backend:** [Supabase](https://supabase.com/) (Authentication, PostgreSQL Database)
* **Browser:** Chrome Extension (Manifest V3)

---

## 🔧 Setup and Installation

To run this extension locally, you'll need to set up a Supabase backend and then install the extension in Chrome.

### 1. Supabase Backend Setup

1.  **Create a Supabase Project:**
    * Go to [supabase.com](https://supabase.com/) and create a new project.
    * Save your project's **URL** and **anon key**. You will need them in the next step.

2.  **Configure the Extension:**
    * Open the file `supabaseClient.js`.
    * Replace the placeholder `SUPABASE_URL` and `SUPABASE_ANON_KEY` values with the keys from your own Supabase project.

    ```javascript
    // ---- supabaseClient.js ----
    const SUPABASE_URL = "YOUR_SUPABASE_URL";
    const SUPABASE_ANON_KEY = "YOUR_SUPABASE_ANON_KEY";
    ```

3.  **Set up the Database Schema:**
    * In your Supabase project, navigate to the **SQL Editor**.
    * Click "+ New query" and run the following SQL script to create the necessary tables (`profiles`, `notes`) and database functions for handling user sign-ups and note creation.

    ```sql
    -- 1. Create Profiles Table (for public user data)
    CREATE TABLE public.profiles (
      id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
      username TEXT UNIQUE NOT NULL,
      updated_at TIMESTAMPTZ DEFAULT NOW()
    );
    
    -- 2. Function to create a profile when a new user signs up
    CREATE OR REPLACE FUNCTION public.handle_new_user()
    RETURNS TRIGGER AS $$
    BEGIN
      INSERT INTO public.profiles (id, username)
      VALUES (new.id, new.raw_user_meta_data->>'username');
      RETURN new;
    END;
    $$ LANGUAGE plpgsql SECURITY DEFINER;
    
    -- 3. Trigger to execute the function on new user creation
    CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();
    
    -- 4. Create Notes Table
    CREATE TABLE public.notes (
      id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
      user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
      username TEXT, -- Denormalized for easier querying
      url TEXT NOT NULL,
      selection_text TEXT,
      note_text TEXT NOT NULL,
      like_count INT DEFAULT 0,
      created_at TIMESTAMPTZ DEFAULT NOW()
    );
    
    -- 5. Function to add username to new notes automatically
    CREATE OR REPLACE FUNCTION public.add_username_to_note()
    RETURNS TRIGGER AS $$
    BEGIN
      SELECT username INTO new.username FROM public.profiles WHERE id = new.user_id;
      RETURN new;
    END;
    $$ LANGUAGE plpgsql SECURITY DEFINER;
    
    -- 6. Trigger to add username on new note insert
    CREATE TRIGGER on_note_created
    BEFORE INSERT ON public.notes
    FOR EACH ROW EXECUTE PROCEDURE public.add_username_to_note();
    
    -- 7. Enable Row Level Security (RLS)
    ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
    ALTER TABLE public.notes ENABLE ROW LEVEL SECURITY;
    
    -- 8. RLS Policies for Profiles
    CREATE POLICY "Public profiles are viewable by everyone." ON public.profiles
    FOR SELECT USING (true);
    CREATE POLICY "Users can insert their own profile." ON public.profiles
    FOR INSERT WITH CHECK (auth.uid() = id);
    CREATE POLICY "Users can update own profile." ON public.profiles
    FOR UPDATE USING (auth.uid() = id);
    
    -- 9. RLS Policies for Notes
    CREATE POLICY "Notes are viewable by everyone." ON public.notes
    FOR SELECT USING (true);
    CREATE POLICY "Users can insert their own notes." ON public.notes
    FOR INSERT WITH CHECK (auth.uid() = user_id);
    ```

### 2. Chrome Extension Installation

1.  Clone or download this repository to your local machine.
2.  Open Google Chrome and navigate to `chrome://extensions`.
3.  Enable **Developer mode** using the toggle switch in the top-right corner.
4.  Click the **"Load unpacked"** button.
5.  Select the folder containing the extension's files (the folder with `manifest.json`).
6.  The "Web Notes" extension should now appear in your extensions list and be active!

---

## 📂 File Structure
