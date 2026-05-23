# Confession Cathedral — Explained Like You're Seven

**What it does:** You type a secret (a "confession"), press a button that says "absolve," and it shows up on the page for everyone to see. Like a digital confession booth where you can get things off your chest.

The whole project is 10 files. Let's look at every single one.

---

## File 1: `index.html` — The Page Shell (13 lines)

```
C:\...\confession-cathedrals\cofession-cathedral\index.html
```

**Line 1:** `<!doctype html>` — Tells the browser "Hey, this is an HTML page!"

**Line 2:** `<html lang="en">` — Starts the page. The language is English.

**Line 3:** `<head>` — The part that isn't shown on screen. It holds settings.

**Line 4:** `<meta charset="UTF-8" />` — Says "use the character set that can handle every letter, emoji, and symbol."

**Line 5:** `<link rel="icon" type="image/svg+xml" href="/favicon.svg" />` — Points to the little icon that shows up in the browser tab. It's an SVG file (a kind of picture made of math).

**Line 6:** `<meta name="viewport" content="width=device-width, initial-scale=1.0" />` — Tells the browser "make the page fit the screen properly, whether it's a phone, tablet, or computer."

**Line 7:** `<title>Confession Cathedral</title>` — The text that appears on the browser tab: "Confession Cathedral".

**Line 8:** `</head>` — Closes the head section.

**Line 9:** `<body>` — Everything visible on the page goes here.

**Line 10:** `<div id="root"></div>` — An empty div (a box) with the ID "root". This is where React will build the whole website. Think of it as an empty stage where the actors will perform.

**Line 11:** `<script type="module" src="/src/main.jsx"></script>` — Loads the JavaScript file that starts the React app. `type="module"` means it's a modern JavaScript module.

**Line 12:** `</body>` — Closes the body.

**Line 13:** `</html>` — Closes the page.

---

## File 2: `src/main.jsx` — The Starting Point (10 lines)

```
C:\...\confession-cathedrals\cofession-cathedral\src\main.jsx
```

**Line 1:** `import { StrictMode } from 'react'` — Grabs StrictMode from React. StrictMode is like a strict teacher who checks your homework for mistakes during development.

**Line 2:** `import { createRoot } from 'react-dom/client'` — Grabs the tool that plants React into the web page. `createRoot` makes React grow inside a specific HTML element.

**Line 3:** `import './index.css'` — Loads the global styles (the look of the page).

**Line 4:** `import App from './App.jsx'` — Imports the main App component (the big machine that builds everything).

**Lines 6-9:**
```js
createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
```

This finds the empty `<div id="root">` from `index.html`, then tells React to grow there. It wraps `<App />` in `<StrictMode>` so React watches for mistakes. `<App />` is the entire confession app.

---

## File 3: `src/App.jsx` — The Main App Component (71 lines)

```
C:\...\confession-cathedrals\cofession-cathedral\src\App.jsx
```

This is the heart of the app. Everything happens here.

---

### Lines 1-4 — Setup and the character limit

**Line 1:** `import { useState } from 'react'`

Grab just one tool from React: `useState`. It's a sticky note that remembers things. We don't need `useEffect` or `useMemo` because this app is simple — no saving to disk, no heavy math.

**Line 2:** `import './App.css'`

Load the styles that make the app look pretty (purple gradient title, dark theme, animations).

**Line 4:** `const MAX = 280`

The boss says: "You can only type 280 characters!" That's the same limit old Twitter had. `MAX` is short for "maximum." This number is used in two places: to check if you've gone too far, and to show "___ / 280" on the screen.

---

### Lines 6-15 — The `timeAgo` function

```js
function timeAgo(date) {
  const sec = Math.floor((Date.now() - date) / 1000)
  if (sec < 60) return 'just now'
  const min = Math.floor(sec / 60)
  if (min < 60) return `${min}m ago`
  const hr = Math.floor(min / 60)
  if (hr < 24) return `${hr}h ago`
  const d = Math.floor(hr / 24)
  return `${d}d ago`
}
```

This function answers the question: "How long ago was this posted?"

- `Date.now()` gives the current time in milliseconds since 1970.
- `date` is the time the confession was posted, also in milliseconds.
- Subtract them, divide by 1000, and you get **seconds**.
- Less than 60 seconds → "just now"
- Less than 60 minutes → "5m ago"
- Less than 24 hours → "3h ago"
- More than 24 hours → "2d ago"

**Important note:** This function runs only when the page re-renders. It doesn't tick like a clock. So if you post something "just now" and stare at the screen, it still says "just now" until something makes the page update (like posting another confession or refreshing).

---

### Lines 17-19 — The App function and its state

```js
function App() {
  const [text, setText] = useState('')
  const [entries, setEntries] = useState([])
```

This is the main function. Everything inside is the app.

**Two sticky notes (state variables):**

| Variable | What it remembers | Starting value |
|---|---|---|
| `text` | What you're typing in the text box right now | Empty string `""` |
| `entries` | All the confessions that have been posted | Empty list `[]` |

`useState('')` starts `text` as an empty string.
`useState([])` starts `entries` as an empty array.

---

### Lines 21-24 — Derived values (calculated on the fly)

```js
const len = text.length
const over = len > MAX
const pct = len / MAX
const countClass = 'char-count' + (over ? ' danger' : pct > 0.85 ? ' warn' : '')
```

These aren't stored in state. They're calculated fresh every time the page renders:

| Variable | What it does | Example |
|---|---|---|
| `len` | How many characters you've typed | `text.length` = 5 if you typed "hello" |
| `over` | Are you OVER the limit? | `true` if `len > 280`, otherwise `false` |
| `pct` | What fraction of 280 have you used? | 140 chars = 0.5 (50%) |
| `countClass` | The CSS class for the character counter | Changes based on how full you are |

**The CSS class logic:**
- Normal (under 85%): `"char-count"` → gray text
- Warning (85% to 100%): `"char-count warn"` → yellow/orange text
- Danger (over 100%): `"char-count danger"` → red, bold text

The `countClass` variable is like choosing a traffic light color based on how close you are to the limit.

---

### Lines 26-32 — `handleSubmit` (the "Absolve" button handler)

```js
function handleSubmit(e) {
  e.preventDefault()
  const trimmed = text.trim()
  if (!trimmed || over) return
  setEntries(prev => [{ text: trimmed, time: Date.now() }, ...prev])
  setText('')
}
```

This runs when you press the "absolve" button. Let's follow it step by step:

1. **`e.preventDefault()`** — Stop the page from refreshing. Normally when you submit a form, the browser reloads the page. We don't want that! This line says "nope, stay right here."

2. **`const trimmed = text.trim()`** — Take what you typed and cut off any spaces at the beginning or end. "  hello  " becomes "hello".

3. **`if (!trimmed || over) return`** — If the trimmed text is empty (`!trimmed` means "if trimmed is falsy," which includes empty string) or you're over the 280 character limit (`over` is true), then stop right here (`return` means "exit the function, do nothing else").

4. **`setEntries(prev => [{ text: trimmed, time: Date.now() }, ...prev])`** — Make a new confession entry with:
   - `text`: the trimmed text you typed
   - `time`: the current time in milliseconds (a big number like 1716400000000)
   
   Then add it to the FRONT of the list (`...prev` spreads the old list after the new one). So the newest confession is always at the top.

5. **`setText('')`** — Clear the text box so you can type a new confession.

**Why `prev => ...` instead of just using `entries`?** This is the functional updater pattern. It always uses the LATEST version of `entries`, even if React is busy doing other things. It's safer.

---

### Lines 34-68 — The Return (what shows on screen)

Everything from here to the end describes what the user sees.

#### Lines 35-37 — Title

```jsx
<div className="app">
  <h1 className="title">Confession Cathedral</h1>
  <p className="subtitle">speak your truth, leave your burden</p>
```

- `className="app"` — the main box that holds everything, centered on the page with max width 640px.
- `<h1>` — the big heading "Confession Cathedral".
- `<p className="subtitle">` — the smaller italic text underneath: "speak your truth, leave your burden".

#### Lines 39-53 — The Form (CONTROLLED INPUT)

```jsx
<form className="form" onSubmit={handleSubmit}>
  <textarea
    className="input"
    value={text}
    onChange={e => setText(e.target.value)}
    placeholder="Type your confession here…"
    maxLength={500}
  />
  <div className="row">
    <span className={countClass}>{len} / {MAX}</span>
    <button className="btn" type="submit" disabled={over || !text.trim()}>
      absolve
    </button>
  </div>
</form>
```

#### ⭐ THE CONTROLLED INPUT (lines 40-46)

```jsx
<textarea
  className="input"
  value={text}                          // ← STATE is the boss!
  onChange={e => setText(e.target.value)}  // ← Every keystroke updates state
  placeholder="Type your confession here…"
  maxLength={500}
/>
```

This is a **controlled input**. Here's what that means:

Normally, a `<textarea>` manages its own text. But in React, we take control away from the textarea and give it to the state variable `text`. The textarea always shows whatever `text` says. When you type, `onChange` fires, which calls `setText(e.target.value)`, which updates `text`, which makes React re-render, which makes the textarea show the new text.

**The flow:** Your finger presses 'h' → `onChange` runs → `setText("h")` → React re-renders → textarea shows "h". Every. Single. Keystroke.

**Line 45 — `maxLength={500}`:** The HTML itself won't let you type more than 500 characters. But the app's limit is 280 (`MAX`). So the HTML allows 500 but the JavaScript stops you at 280. This is a tiny bug — the HTML limit should probably be 280 too. If you type 300 characters, the button will be disabled so you can't submit, but the textarea will still let you type until 500.

#### The character counter (line 48)

```jsx
<span className={countClass}>{len} / {MAX}</span>
```

Shows something like "0 / 280" or "150 / 280" or "285 / 280". The CSS class changes the color based on how full you are:
- `< 85%`: gray
- `85% - 100%`: yellow/orange (warn)
- `> 100%`: red and bold (danger)

#### The "absolve" button (lines 49-51)

```jsx
<button className="btn" type="submit" disabled={over || !text.trim()}>
  absolve
</button>
```

The button is **disabled** (grayed out, can't click) when:
- You're over the 280 character limit (`over` is true), OR
- The text is empty after trimming (`!text.trim()` is true)

The word "absolve" means "forgive" or "set free from guilt." It's a church-y word that fits the cathedral theme.

#### Lines 55-66 — The Feed (list of confessions)

```jsx
<div className="feed">
  {entries.length === 0 ? (
    <p className="empty">no confessions yet. the floor is yours.</p>
  ) : (
    entries.map((e, i) => (
      <div className="entry" key={e.time + '-' + i}>
        <p className="entry-text">{e.text}</p>
        <span className="entry-time">{timeAgo(e.time)}</span>
      </div>
    ))
  )}
</div>
```

**If there are no confessions (`entries.length === 0`):**
Show an empty message: "no confessions yet. the floor is yours." It's like saying "the stage is empty, go ahead and speak."

**If there ARE confessions:**
Loop through each entry (`entries.map(...)`) and create a card for each one:

- **Line 60 — the `key`:** `key={e.time + '-' + i}` — Every item in a list needs a unique key so React can keep track of it. This uses the timestamp plus the index. If two people post in the same millisecond, the keys would clash, but that's very unlikely.

- **Line 61 — the text:** `<p className="entry-text">{e.text}</p>` — Shows the confession text.

- **Line 62 — the timestamp:** `<span className="entry-time">{timeAgo(e.time)}</span>` — Shows "just now" or "5m ago" etc.

#### Lines 67-69 — The end

```jsx
    </div>
  )
}

export default App
```

Close the main div, close the function, and export the App so `main.jsx` can use it.

---

## File 4: `src/App.css` — All the Pretty Styles (150 lines)

```
C:\...\confession-cathedrals\cofession-cathedral\src\App.css
```

---

### `.app` (lines 1-5)

```css
.app {
  max-width: 640px;
  margin: 0 auto;
  padding: 2rem 1rem;
}
```

The main container. Max width 640px (doesn't stretch too wide on big screens). Centered with `margin: 0 auto`. Padding of 2rem on top/bottom, 1rem on left/right.

---

### Title styles (lines 7-16)

```css
.title {
  font-size: 1.75rem;
  text-align: center;
  margin-bottom: 0.25rem;
  background: linear-gradient(135deg, #a78bfa, #f472b6);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  font-weight: 600;
}
```

The title "Confession Cathedral" has a **gradient** (smooth color blend) from purple (`#a78bfa`) to pink (`#f472b6`). But it's not a normal background — it uses `background-clip: text` to make the gradient show ONLY inside the letters. The text itself is made transparent (`-webkit-text-fill-color: transparent`), so you see the gradient through it. Magic!

### Subtitle (lines 18-24)

```css
.subtitle {
  text-align: center;
  font-size: 0.85rem;
  color: #888;
  margin-bottom: 1.5rem;
  font-style: italic;
}
```

Small, centered, gray, italic. The whisper under the title.

---

### Form container (lines 26-32)

```css
.form {
  background: #1a1a2e;
  border-radius: 12px;
  padding: 1.25rem;
  margin-bottom: 2rem;
  border: 1px solid #2a2a3e;
}
```

A dark navy card (`#1a1a2e`) with rounded corners, a slightly lighter border, and padding inside. Stands out against the even darker background.

---

### Textarea (`.input`) — lines 34-56

```css
.input {
  width: 100%;
  min-height: 100px;
  background: #16162a;
  border: 1px solid #2a2a3e;
  border-radius: 8px;
  color: #e0e0e0;
  font-family: inherit;
  font-size: 0.95rem;
  padding: 0.75rem;
  resize: vertical;
  outline: none;
  transition: border-color 0.2s;        /* ← ANIMATION! */
  box-sizing: border-box;
}

.input:focus {
  border-color: #a78bfa;                /* Turns purple when you click on it */
}

.input::placeholder {
  color: #555;
}
```

The text box where you type your confession:
- Full width, at least 100px tall.
- Dark background (`#16162a`), light text (`#e0e0e0`).
- `resize: vertical` — you can drag the bottom corner to make it taller.
- `outline: none` — removes the browser's default blue outline (we replace it with a border change).
- **`transition: border-color 0.2s`** — when you click into the box (focus), the border smoothly changes from dark gray to purple over 0.2 seconds. That's an animation!
- `box-sizing: border-box` — makes sure padding doesn't make the box wider than 100%.

---

### Row (lines 58-63)

```css
.row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 0.5rem;
}
```

Puts the character counter on the left and the "absolve" button on the right, in a single row.

---

### Character counter (lines 65-78) — ⭐ ANIMATION!

```css
.char-count {
  font-size: 0.8rem;
  color: #888;
  transition: color 0.2s;              /* ← ANIMATION! */
}

.char-count.warn {
  color: #f59e0b;                      /* Yellow/amber */
}

.char-count.danger {
  color: #ef4444;                      /* Red */
  font-weight: 600;                    /* Bold */
}
```

The character counter changes color smoothly:
- Normal: gray (`#888`)
- Warning (85-100%): yellow/amber (`#f59e0b`) — like a traffic light turning yellow
- Danger (over 100%): red (`#ef4444`) and bold — like a traffic light turning red

The `transition: color 0.2s` makes the color change smooth instead of instant. It's like a fade between colors.

---

### Button (`.btn`) — lines 80-103

```css
.btn {
  background: linear-gradient(135deg, #a78bfa, #f472b6);
  border: none;
  color: #fff;
  font-weight: 600;
  font-size: 0.9rem;
  padding: 0.5rem 1.5rem;
  border-radius: 8px;
  cursor: pointer;
  transition: opacity 0.2s, transform 0.1s;   /* ← ANIMATION! */
}

.btn:hover {
  opacity: 0.9;                                 /* Slightly fades on hover */
}

.btn:active {
  transform: scale(0.97);                       /* ← ANIMATION! Shrinks when clicked */
}

.btn:disabled {
  opacity: 0.4;
  cursor: not-allowed;                          /* Grayed out, can't click */
}
```

The "absolve" button:
- Purple-to-pink gradient background (matches the title).
- White text, bold, rounded corners.
- **Hover:** Fades slightly (opacity 0.9) over 0.2 seconds.
- **Active (being clicked):** Shrinks to 97% size (`scale(0.97)`) over 0.1 seconds. It feels like the button is a physical thing you're pressing down.
- **Disabled:** Faded to 40% opacity, cursor changes to "not-allowed" (the circle-slash icon).

---

### Feed (lines 105-109)

```css
.feed {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}
```

The list of confessions — stacked vertically with a small gap between each one.

---

### Entry card (lines 111-128) — ⭐ ANIMATION!

```css
.entry {
  background: #1a1a2e;
  border: 1px solid #2a2a3e;
  border-radius: 10px;
  padding: 1rem 1.25rem;
  animation: fadeIn 0.4s ease-out;            /* ← ANIMATION! */
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(8px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
```

Each confession card:
- Dark background with a subtle border, rounded corners.
- **The `fadeIn` animation:** When a new card appears, it starts invisible (`opacity: 0`) and 8 pixels below where it should be (`translateY(8px)`). Over 0.4 seconds, it slides up to its proper spot and becomes fully visible. Like a card rising up from below and fading in at the same time.

---

### Entry text and time (lines 130-143)

```css
.entry-text {
  font-size: 0.95rem;
  line-height: 1.5;
  word-wrap: break-word;
  margin: 0;
  color: #e0e0e0;
}

.entry-time {
  font-size: 0.75rem;
  color: #666;
  margin-top: 0.5rem;
  display: block;
}
```

The confession text is light gray, 1.5 line spacing for readability. `word-wrap: break-word` stops long words from bursting out of the card.

The timestamp is tiny (0.75rem), dark gray, sits below the text with a little space.

---

### Empty state (lines 145-150)

```css
.empty {
  text-align: center;
  color: #555;
  padding: 3rem 1rem;
  font-style: italic;
}
```

When there are no confessions yet, the message is centered, medium gray, italic, with lots of padding to fill the space.

---

## File 5: `src/index.css` — Global Reset Styles (12 lines)

```
C:\...\confession-cathedrals\cofession-cathedral\src\index.css
```

### Lines 1-5 — The reset

```css
*, *::before, *::after {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
}
```

This targets EVERY element on the page (`*`), including pseudo-elements (`*::before`, `*::after`). It says:
- `box-sizing: border-box` — When you set a width, padding and border are included inside that width (so a box with width 100px and 10px padding is still 100px total, not 120px).
- `margin: 0; padding: 0;` — Remove all default spacing that browsers add (like the natural margin on `<body>` or padding on lists).

This is called a "CSS reset." It makes every browser start from the same clean slate.

### Lines 7-11 — Body styling

```css
body {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  background: #0d0d1a;
  color: #e0e0e0;
  min-height: 100vh;
}
```

- **Font:** Uses the system font (whatever your computer uses). `-apple-system` is for Mac, `BlinkMacSystemFont` is for older Macs, `'Segoe UI'` is for Windows, `Roboto` is for Android, `sans-serif` is the fallback.
- **Background:** Very dark navy (`#0d0d1a`) — the whole page is dark mode.
- **Text:** Light gray (`#e0e0e0`), not pure white (which would be harsh).
- **min-height: 100vh:** At least as tall as the full screen (100% of the viewport height).

---

## File 6: `package.json` — Project Info (27 lines)

```
C:\...\confession-cathedrals\cofession-cathedral\package.json
```

```json
{
  "name": "cofession-cathedral",
  "private": true,
  "version": "0.0.0",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "lint": "eslint .",
    "preview": "vite preview"
  },
  "dependencies": {
    "react": "^19.2.6",
    "react-dom": "^19.2.6"
  },
  "devDependencies": {
    "@eslint/js": "^10.0.1",
    "@types/react": "^19.2.14",
    "@types/react-dom": "^19.2.3",
    "@vitejs/plugin-react": "^6.0.1",
    "eslint": "^10.3.0",
    "eslint-plugin-react-hooks": "^7.1.1",
    "eslint-plugin-react-refresh": "^0.5.2",
    "globals": "^17.6.0",
    "vite": "^8.0.12"
  }
}
```

- **name:** `"cofession-cathedral"` — notice the typo! It says "cofession" instead of "confession." The `c` after `co` is missing.
- **private:** true — This project won't be published to npm (the package website).
- **version:** "0.0.0" — brand new, not released yet.
- **type:** "module" — Uses modern JavaScript module syntax (`import`/`export`).
- **scripts:** 
  - `npm run dev` → starts a development server
  - `npm run build` → makes a production version
  - `npm run lint` → checks for code mistakes
  - `npm run preview` → previews the built version
- **dependencies:** What the app needs to run: React 19 and React DOM 19.
- **devDependencies:** Tools only needed during development: Vite (the builder), ESLint (the code checker), and various plugins.

---

## File 7: `vite.config.js` — Build Configuration (7 lines)

```
C:\...\confession-cathedrals\cofession-cathedral\vite.config.js
```

```js
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
})
```

Vite is the tool that builds the website. This config file tells Vite: "Use the React plugin so you understand JSX (the HTML-looking stuff inside JavaScript)." That's all — the simplest possible setup.

---

## File 8: `eslint.config.js` — Lint Configuration (21 lines)

```
C:\...\confession-cathedrals\cofession-cathedral\eslint.config.js
```

```js
import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import { defineConfig, globalIgnores } from 'eslint/config'

export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{js,jsx}'],
    extends: [
      js.configs.recommended,
      reactHooks.configs.flat.recommended,
      reactRefresh.configs.vite,
    ],
    languageOptions: {
      globals: globals.browser,
      parserOptions: { ecmaFeatures: { jsx: true } },
    },
  },
])
```

ESLint is a spell-checker for code. It finds mistakes and bad patterns.

- `globalIgnores(['dist'])` — Don't check the built files in the `dist` folder.
- `files: ['**/*.{js,jsx}']` — Check all `.js` and `.jsx` files.
- `extends` — Three sets of rules:
  1. `js.configs.recommended` — Basic JavaScript rules.
  2. `reactHooks.configs.flat.recommended` — Rules for React Hooks (like `useState`).
  3. `reactRefresh.configs.vite` — Rules for Vite's hot reloading.
- `globals: globals.browser` — Knows about browser things like `document` and `window`.
- `ecmaFeatures: { jsx: true }` — Understands JSX syntax.

---

## File 9: `.gitignore` — What Not to Save (24 lines)

```
C:\...\confession-cathedrals\cofession-cathedral\.gitignore
```

```
# Logs
logs
*.log
npm-debug.log*
yarn-debug.log*
yarn-error.log*
pnpm-debug.log*
lerna-debug.log*

node_modules
dist
dist-ssr
*.local

# Editor directories and files
.vscode/*
!.vscode/extensions.json
.idea
.DS_Store
*.suo
*.ntvs*
*.njsproj
*.sln
*.sw?
```

This tells Git (the version control tool) to IGNORE these files — don't save them in the code history:
- **Logs** — error logs from npm/yarn/pnpm.
- **`node_modules`** — All the downloaded packages. They're huge and can be re-downloaded with `npm install`.
- **`dist`** — The built version of the website. Also can be rebuilt.
- **Editor files** — VS Code settings, .DS_Store (Mac folder settings), Visual Studio files.

---

## File 10: `README.md` — Template Readme (16 lines)

```
C:\...\confession-cathedrals\cofession-cathedral\README.md
```

```
# React + Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Oxc](https://oxc.rs)
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/)
```

This is the default README that comes with every new Vite+React project. It hasn't been customized for Confession Cathedral. It just tells you about Vite plugins.

---

# ⭐ Big Summary: The Three Things You Asked About

## 1. Controlled Inputs

The app has ONE controlled input — the `<textarea>` on line 42 of `App.jsx`:

```jsx
<textarea
  value={text}                         // ← React state is the boss
  onChange={e => setText(e.target.value)}  // ← Every keystroke updates state
/>
```

**Why it's called "controlled":** The browser's textarea normally controls its own text. But in React, we take that control away and give it to the `text` state variable. The value shown is ALWAYS whatever `text` says. You type? State updates. State updates? Textarea re-renders. React is always in charge.

**The flow for one keystroke ("h"):**
```
Your finger → onChange event → setText("h") → React re-render → textarea shows "h"
```

## 2. State Updates

The app has TWO pieces of state:

| State | What it holds | Updated when |
|---|---|---|
| `text` | String of what you're typing | Every keystroke (`onChange`) |
| `entries` | Array of all confessions | You press "absolve" (`handleSubmit`) |

**The functional updater pattern** (lines 30-31):

```js
setEntries(prev => [{ text: trimmed, time: Date.now() }, ...prev])
setText('')
```

`setEntries(prev => ...)` uses the **functional form**. The `prev` parameter is guaranteed to be the latest version of `entries`, even if React is doing multiple updates at once. This is safer than `setEntries([...entries, newItem])` because `entries` might be stale.

Both updates happen in the same function, and React batches them together — so the page only re-renders once.

**Derived values (not state):**

| Value | Calculated from | Purpose |
|---|---|---|
| `len = text.length` | `text` | Character count |
| `over = len > MAX` | `len` | Whether you're past the limit |
| `pct = len / MAX` | `len` | How full the bar is |
| `countClass` | `over`, `pct` | Which CSS class to use |

These aren't stored in state because they can be calculated instantly from `text` every render. No need for extra sticky notes.

## 3. Animation Logic

**Every animation is pure CSS.** No JavaScript animation libraries.

There are **5 animations/transitions** total:

| What | Type | Trigger | Effect |
|---|---|---|---|
| `fadeIn` | `@keyframes` | New entry appears | Slides up 8px + fades in over 0.4s |
| Button hover | `transition` | Mouse hovers | Opacity goes to 0.9 over 0.2s |
| Button click | `transition` | Mouse clicks | Shrinks to 97% over 0.1s |
| Textarea focus | `transition` | Click into box | Border turns purple over 0.2s |
| Char counter | `transition` | Typing near limit | Color fades from gray → yellow → red over 0.2s |

**The `@keyframes fadeIn` animation runs automatically when a new `<div className="entry">` is added to the page.** CSS `animation` property fires on mount, so every new confession card gets the entrance animation.

```css
@keyframes fadeIn {
  from { opacity: 0; transform: translateY(8px); }
  to   { opacity: 1; transform: translateY(0); }
}
```

The `ease-out` timing function means the animation starts fast and slows down at the end — like a card rising up and gently settling into place.
