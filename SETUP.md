# CTG — 17th Student Council site

## What's new in this version

- **Home and Answers are now separate pages.** The home page only shows board answers from the last 7 days; if nothing's new, it shows a link to `answers.html` instead of an empty box. `answers.html` holds the full, searchable history — nothing is ever deleted from there, it just ages off the home page.
- **The admin panel is now tabbed** — Questions / Prayer requests / Board — instead of one long scroll.
- **A language toggle (EN / KO)** sits in the nav on every public page. It remembers your choice (stored in the browser, not the database) and applies instantly, no reload.
- **Board answers are now bilingual.** When an admin publishes a question or adds something directly, they type it in *either* language, click **Translate & review**, and a machine-translated draft of the other language appears — editable before anything goes live. Nothing is ever posted pre-translation without a chance to fix it.

### A note on the translation
The draft comes from a free translation API (MyMemory) called directly from the browser — no signup needed for normal use. It's a solid first draft, not a professional translation, which is exactly why admins review and can edit both fields before publishing. If your Facebook page needs a nicer translation for something important, feel free to hand-edit either box before hitting the final button — nothing saves until you do.

One limit: the free tier allows roughly 5,000 characters translated per day per visitor IP (about 50,000/day if you add a contact email — see the `translateText` function in `app.js` if you ever want to add one). A student council's normal usage should stay well under this.

### A note on old board entries
If you had entries on the board from before this update, they only had one language. They'll still display correctly — the code shows the same text in both EN and KO for those until an admin edits them with a real translation.

## Two things were broken before, and both are fixed

**The logo wasn't showing** because there was no image file in the folder at all — the zip contained only the eight code files, so `gtc-logo.png` was a dead link on every page. The logo is now embedded *inside* `styles.css` as data, so it draws itself with nothing to download. `gtc-logo.png` and `favicon.png` are also included for the browser tab.

**The data wasn't going anywhere** because Firestore was refusing every request. You can tell from the recording: on the home page, the "Answered" board showed neither entries *nor* the "Nothing posted yet" message, and the admin page showed neither submissions *nor* "No new questions right now." An empty database still shows those messages. Showing nothing at all means the request failed before any answer came back — almost certainly the security rules were never published, so Firestore's default "deny everything" was still in force.

The old code swallowed that error into the browser console where you'd never see it. The new code puts it on the screen in plain English, with the exact fix. Work through the steps below and it will go green.

---

## Setup — about 10 minutes

Do these in order. Steps 1–2 you have probably done already; check them anyway.

### 1. Open your project

Go to [console.firebase.google.com](https://console.firebase.google.com) and open **ctg17thstudentcouncil**.

If that project doesn't exist, click **Add project**, create it, and then do step 7 at the end to get your new keys.

### 2. Create the Firestore database

Left sidebar → **Build** → **Firestore Database**.

- If you see a **Create database** button, click it. Choose **Start in production mode**, pick a location near Korea (`asia-northeast3` is Seoul), and create it.
- If you see a data table instead, it already exists. Good.

One thing to check: at the top it should say **Native mode**, not *Datastore mode*. Datastore mode can't be used from a website and can't be switched — you'd need a new project.

### 3. Turn on email/password login

**Build** → **Authentication** → **Get started**.

Under **Sign-in method**, click **Email/Password**, switch **Enable** on, and **Save**.

### 4. Create your admin account and copy the UID

Still in Authentication, go to the **Users** tab → **Add user**. Enter the email and password you'll log in with. Make one per staff member.

Now look at the row that appears. The last column is **User UID** — a long string like `k3Jd9xQm2bV...`. **Copy it.** Hover over it and a copy icon appears.

### 5. Publish the security rules ← this is the step that was missing

Go back to **Firestore Database** → the **Rules** tab.

Open `firestore.rules` from this folder in any text editor. Find this line near the top:

```
        'PASTE_YOUR_UID_HERE'
```

Replace `PASTE_YOUR_UID_HERE` with the UID you copied in step 4, keeping the quotes. For several staff members, one per line with commas between:

```
        'k3Jd9xQm2bV...',
        'p8Hn4zRw6cY...'
```

Then select the whole file, copy it, paste it over everything in the Rules box, and click **Publish**.

**Publish is not optional.** Edited-but-unpublished rules do nothing, and this is the most likely reason nothing was saving before.

### 6. Close the back door

**Authentication** → **Settings** tab → **User actions** → untick **Enable create (sign-up)** → **Save**.

Without this, anyone who views your page source can sign themselves up. They still wouldn't get past the UID list in step 5, but there's no reason to let strangers create accounts at all. Do this *after* step 4, or you won't be able to add your own users.

### 7. Only if you made a brand-new project

**Project settings** (gear icon) → **Your apps** → the **`</>`** web icon → nickname it → **Register app**. Copy the `firebaseConfig` block it shows you, and paste it over the one in `firebase-config.js`.

If you're using the existing `ctg17thstudentcouncil` project, skip this — the keys are already in the file.

---

## Test it

1. Open `index.html` (Live Server is fine — that's what you were using).
2. The logo should appear, top right, immediately.
3. Send a test question and a test prayer from the two forms. You should see a green confirmation.
4. Go to `admin.html`, log in with the account from step 4.
5. At the top, the **Connection check** should show three ticks:
   - Signed in
   - Public board: readable
   - Private submissions: readable
6. Your two test messages should be listed. Answer the question, post it, and check the home page — it should appear under "Answered" without a refresh.

---

## If something still fails

The connection check and the orange banner tell you which part broke and what to do. The error codes mean:

| What you see | What it means |
|---|---|
| `permission-denied` | Rules not published, or your UID isn't in the list (steps 4–5) |
| `not-found` / `failed-precondition` | Firestore database not created, or in Datastore mode (step 2) |
| `auth/operation-not-allowed` | Email/password sign-in still off (step 3) |
| `auth/invalid-credential` | Wrong email or password |
| `unavailable` | No internet, or the school network blocks `googleapis.com` |
| `config-missing` | `firebase-config.js` isn't in the same folder as the page |

For anything else, right-click → **Inspect** → **Console**. Every error is logged there with a `[CTG]` prefix.

---

## Files in this folder

| File | What it is |
|---|---|
| `index.html` | Home page — header, the two buttons, the public Answered board |
| `ask-the-pastor.html` | Question form. Answers can be posted publicly |
| `send-your-prayer.html` | Prayer form. Private, never posted |
| `admin.html` | Login, plus Questions / Prayer requests / Board editor |
| `app.js` | Shared data layer and error messages |
| `styles.css` | All styling, with the logo embedded |
| `firebase-config.js` | Your project keys |
| `firestore.rules` | Paste this into the console (step 5) |
| `gtc-logo.png`, `favicon.png` | Logo and tab icon |

---

## A note on privacy

Prayer requests can only be read by the accounts whose UID you listed in the rules. Not by other students, not by anyone who finds the URL, not by someone who signs up for a Firebase account of their own. The rules are what enforce that — the login form is just the front door.

The keys in `firebase-config.js` are safe to publish. Firebase web keys identify a project; they don't grant access to anything. This is by design, and it's why the rules matter so much.

## Hosting it

Right now you're opening the files locally. To put it online, drag this whole folder onto [app.netlify.com/drop](https://app.netlify.com/drop), or push it to a GitHub repo and turn on **Settings → Pages**. Nothing in the code needs to change.

One thing to do afterwards: in **Authentication → Settings → Authorized domains**, add whatever domain you end up with, or admin login will be refused there.
