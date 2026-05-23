# Software Engineering Principles — Confession Cathedral

This file documents every software engineering principle visible in the cofession-cathedral project. Each principle includes a **plain-language definition** and the **exact lines** where it appears.

The project contains these source files:
- `src/App.jsx` — main component (71 lines)
- `src/App.css` — component styles (150 lines)
- `src/main.jsx` — React entry point (10 lines)
- `src/index.css` — global reset styles (12 lines)
- `package.json` — project metadata (27 lines)
- `vite.config.js` — build config (7 lines)
- `eslint.config.js` — lint config (21 lines)
- `.gitignore` — git ignore rules (24 lines)
- `index.html` — HTML shell (13 lines)

---

## 1. Controlled Components

**Definition:** React state, not the browser's DOM, owns the value of a form input. The input's `value` comes from state, and every keystroke updates that state via `onChange`. React is always in control.

**`src/App.jsx` lines 42-43:**
```jsx
<textarea
  value={text}                           // ← state is the ONLY source of truth
  onChange={e => setText(e.target.value)} // ← every keystroke updates state
```

The flow for every keystroke:
```
You press "h" → onChange fires → setText("h") → React re-renders → textarea shows "h"
```

The textarea never holds its own value. If you removed `value={text}`, the textarea would switch to uncontrolled mode and manage its own text — which would break the app because `setText` wouldn't update the display correctly.

---

## 2. Immutability

**Definition:** Never change data directly. Always create a brand-new copy with the desired changes. This prevents two parts of the code from accidentally sharing and corrupting the same data.

**`src/App.jsx` line 30:**
```js
setEntries(prev => [{ text: trimmed, time: Date.now() }, ...prev])
```

The spread operator `...prev` copies every existing entry into a new array, then the new confession is added at the front. The original array is never modified — a fresh one is created.

If this were mutable:
```js
// ❌ BAD — mutates the existing array
entries.push({ text: trimmed, time: Date.now() })
```

That would break React's ability to detect changes and could cause stale data bugs elsewhere.

---

## 3. Functional State Updates

**Definition:** When new state depends on the old state, pass a callback function to `setState` instead of a plain value. React guarantees the callback receives the absolute latest state.

**`src/App.jsx` line 30:**
```js
setEntries(prev => [{ text: trimmed, time: Date.now() }, ...prev])
```

The `prev` parameter is guaranteed to be the most up-to-date version of `entries`, even if React batches multiple updates. If a plain value were used instead:

```js
// ❌ BAD — might use stale entries
setEntries([{ text: trimmed, time: Date.now() }, ...entries])
```

If two submissions happened rapidly, `entries` might not have the first one yet, and the second submission would lose it.

---

## 4. Separation of Concerns

**Definition:** Different kinds of work belong in different files. Styling lives in CSS, structure lives in JSX, logic lives in JavaScript, configuration lives in config files.

| File | Concern |
|---|---|
| `src/App.jsx` | Component structure + behavior (JSX + state + handlers) |
| `src/App.css` | Component visual styling (colors, layout, animations) |
| `src/index.css` | Global reset (box-sizing, body defaults) |
| `src/main.jsx` | Bootstrap — mounts React into the DOM |
| `index.html` | HTML shell — the empty page React fills |
| `package.json` | Project metadata + dependencies |
| `vite.config.js` | Build tool configuration |
| `eslint.config.js` | Code quality rules configuration |
| `.gitignore` | Files excluded from version control |

**`src/main.jsx` lines 1-9** — this file does one thing only: mount the app.
```js
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
```

It doesn't contain any app logic, state, or styling. It just plugs the component into the page.

**`src/App.css` lines 119-128** — animations live in CSS, not JavaScript:
```css
@keyframes fadeIn {
  from { opacity: 0; transform: translateY(8px); }
  to   { opacity: 1; transform: translateY(0); }
}
```

The JSX only references `className="entry"` — it doesn't know or care how the animation works.

---

## 5. Single Responsibility Principle

**Definition:** Every function, module, or component should have exactly one reason to change. If something does two different jobs, split it.

**`src/App.jsx` lines 6-15 — `timeAgo`:**
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

One job: turn a timestamp into a human-readable "X ago" string. It doesn't render anything, doesn't manage state, doesn't touch the DOM.

**`src/App.jsx` lines 26-32 — `handleSubmit`:**
```js
function handleSubmit(e) {
  e.preventDefault()
  const trimmed = text.trim()
  if (!trimmed || over) return
  setEntries(prev => [{ text: trimmed, time: Date.now() }, ...prev])
  setText('')
}
```

One job: validate the input, add a confession, clear the form. It doesn't render, doesn't style, doesn't manage timers.

**`src/App.jsx` lines 17-69 — `App` component:**
One job: render the UI for the Confession Cathedral. It owns its state and handlers internally.

---

## 6. Don't Repeat Yourself (DRY)

**Definition:** Every piece of knowledge should have a single, unambiguous representation in the system. Define something once, reference it everywhere else.

**`src/App.jsx` line 4:**
```js
const MAX = 280
```

This constant is used in two places:
- Line 22: `const over = len > MAX` — to check if the user exceeded the limit
- Line 48: `{len} / {MAX}` — to display the counter

If `280` were written directly in both places and someone decided to change it to `300`, they'd have to remember to update both. With `MAX`, it's one change.

---

## 7. Derived State (Compute, Don't Store)

**Definition:** If a value can be calculated from existing state, compute it on every render instead of storing it separately. This guarantees consistency — derived values can never get out of sync with their source.

**`src/App.jsx` lines 21-24:**
```js
const len = text.length
const over = len > MAX
const pct = len / MAX
const countClass = 'char-count' + (over ? ' danger' : pct > 0.85 ? ' warn' : '')
```

Four values are derived from a single state variable `text`:
- `len` — character count
- `over` — whether the limit is exceeded
- `pct` — fraction of the limit used
- `countClass` — which CSS class to apply

If these were separate state variables (e.g., `const [len, setLen] = useState(0)`), they could get out of sync:
```
text = "hello" (5 chars)
len  = 3        // ← someone forgot to call setLen — BUG!
```

---

## 8. Conditional Rendering

**Definition:** The UI shows different output based on the current state. Empty states, data states, and edge cases each have their own render path.

**`src/App.jsx` lines 55-66:**
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

Two states:
| State | What renders |
|---|---|
| `entries` is empty | "no confessions yet. the floor is yours." |
| `entries` has items | A card for each confession with text + timestamp |

**Line 49 — button state conditional:**
```jsx
<button ... disabled={over || !text.trim()}>
```

Button is disabled when the text is empty OR over the limit. No separate "if" needed.

---

## 9. Fail Fast

**Definition:** Check for invalid conditions at the very start of a function and return immediately. Don't proceed with bad data.

**`src/App.jsx` line 29:**
```js
if (!trimmed || over) return
```

This runs before any state updates. If the input is empty or exceeds 280 characters, the function stops instantly — no new entry is created, no state is changed. This prevents corrupt data from ever entering the system.

---

## 10. Pure Functions

**Definition:** A function that always returns the same output for the same input and has no side effects (no network calls, no file writes, no state mutations). Pure functions are predictable and testable.

**`src/App.jsx` lines 6-15 — `timeAgo`:**
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

`timeAgo` reads `Date.now()` which makes it technically impure (depends on the current time), but it doesn't modify any external state, write to the network, or touch the DOM. It reads an input and returns a string. The same timestamp always produces the same output for the same clock time.

---

## 11. Single Source of Truth

**Definition:** Every piece of data has exactly one authoritative representation in the system. All other references are derived from or point to that one source.

**`src/App.jsx` lines 18-19:**
```js
const [text, setText] = useState('')
const [entries, setEntries] = useState([])
```

These two state variables are the ONLY source of truth for the entire app:
- `text` — everything about what the user is currently typing
- `entries` — everything about posted confessions

The character counter (`len`, `over`, `pct`), the CSS class (`countClass`), the feed display, and the button's disabled state all derive from these two sources. There is no duplicated state.

---

## 12. Form Validation

**Definition:** User input is checked before it's accepted. Invalid data is rejected (by disabling the submit button or silently ignoring the submission).

**`src/App.jsx` lines 28-29 — JavaScript-side validation:**
```js
const trimmed = text.trim()
if (!trimmed || over) return
```

Two checks:
1. `!trimmed` — empty text after trimming whitespace is rejected
2. `over` — text longer than 280 characters is rejected

**`src/App.jsx` line 49 — UI-side validation (button disabled):**
```jsx
<button ... disabled={over || !text.trim()}>
```

The button becomes unclickable when:
- `over` is true (character limit exceeded)
- `!text.trim()` is true (empty input)

**`src/App.jsx` line 45 — HTML-side validation:**
```jsx
<textarea ... maxLength={500} />
```

The browser itself won't accept more than 500 characters. This is a secondary safety net, though the app's actual limit (280) is lower.

---

## 13. Guard Clauses / Defensive Programming

**Definition:** Anticipate problems before they happen. Check for potential failure conditions and handle them gracefully instead of crashing.

**`src/App.jsx` line 49:**
```jsx
<button ... disabled={over || !text.trim()}>
```

The submit button is disabled preventatively — the user can't even try to submit bad data. This is defensive because it stops the error before it reaches the handler.

**`src/App.jsx` line 29:**
```js
if (!trimmed || over) return
```

Even if the button somehow gets clicked (e.g., via keyboard or browser autofill), the handler checks again and silently returns. Double protection.

---

## 14. Unidirectional Data Flow

**Definition:** Data flows in one direction only — from state down to the UI. User events flow upward through callbacks, which update state, which flows back down.

**`src/App.jsx` — the full cycle:**
```
text state ──→ textarea displays value
                    │
                    │ user types
                    ▼
              onChange fires
                    │
                    ▼
              setText(newValue)
                    │
                    ▼
              React re-renders
                    │
                    ▼
              textarea shows new value
```

There is no two-way binding, no child component directly modifying parent state. The data flow is a circle that always moves in one direction:
```
State → Render → User Event → Handler → setState → State → ...
```

---

## 15. Unique Key Prop

**Definition:** When rendering a list of items, each item must have a stable, unique `key` prop so React can track which items are added, removed, or reordered.

**`src/App.jsx` line 60:**
```jsx
{entries.map((e, i) => (
  <div className="entry" key={e.time + '-' + i}>
```

The key is `e.time + '-' + i`, which combines the timestamp with the array index. This is reasonably unique — two confessions posted in the same millisecond could collide, but that's extremely unlikely.

A better key would be a dedicated `id` field (like `crypto.randomUUID()` used in other projects), but this approach works adequately for the app's scale.

---

## 16. Declarative Rendering

**Definition:** Describe *what* the UI should look like, not *how* to build it step by step. JSX is inherently declarative — it describes the final output.

**`src/App.jsx` lines 34-68:**
```jsx
return (
  <div className="app">
    <h1 className="title">Confession Cathedral</h1>
    <p className="subtitle">speak your truth, leave your burden</p>
    <form className="form" onSubmit={handleSubmit}>
      <textarea ... />
      <div className="row">
        <span className={countClass}>{len} / {MAX}</span>
        <button ...>absolve</button>
      </div>
    </form>
    <div className="feed">
      {entries.length === 0 ? <p>...</p> : entries.map(...)}
    </div>
  </div>
)
```

This is not a sequence of instructions ("create a div, add a heading, create a textarea..."). It's a description of the final UI tree. React handles the "how" of creating and updating the DOM.

---

## 17. CSS Animation Separation

**Definition:** Animations and visual transitions belong in CSS, not in JavaScript. CSS handles the timing, easing, and visual effects; JavaScript only toggles states.

**`src/App.css` lines 68, 89, 116 — transitions:**
```css
.char-count { transition: color 0.2s; }       /* color fades smoothly */
.btn        { transition: opacity 0.2s, transform 0.1s; }  /* hover + click */
.input      { transition: border-color 0.2s; }  /* focus border */
```

**`src/App.css` lines 119-128 — keyframe animation:**
```css
@keyframes fadeIn {
  from { opacity: 0; transform: translateY(8px); }
  to   { opacity: 1; transform: translateY(0); }
}
```

Applied to each new entry (line 116):
```css
.entry { animation: fadeIn 0.4s ease-out; }
```

The JavaScript never calls `requestAnimationFrame`, never sets `opacity` or `transform` directly. It simply adds a new `<div className="entry">` to the DOM, and CSS handles the entrance animation automatically.

---

## 18. Explicit State Transitions

**Definition:** The app has a clear, finite set of states, and transitions between them are explicit and predictable.

**`src/App.jsx` lines 55-66:**
```
State: entries.length === 0
  → Renders: "no confessions yet. the floor is yours."

State: entries.length > 0
  → Renders: list of confession cards
```

These are the only two UI states. The transition between them happens at exactly one point:
```
Line 30: setEntries(prev => [{ text: trimmed, time: Date.now() }, ...prev])
  → entries.length goes from 0 to 1
  → React re-renders
  → Empty message disappears, confession cards appear
```

---

## 19. Progressive Enhancement

**Definition:** Start with a baseline experience that works everywhere, then layer enhanced features on top for capable browsers.

**`src/App.jsx` — three layers of protection:**
| Layer | Line | What it does |
|---|---|---|
| HTML | 45 | `maxLength={500}` — browser-level limit |
| CSS | 49 | `disabled={over \|\| !text.trim()}` — UI-level guard |
| JavaScript | 29 | `if (!trimmed \|\| over) return` — code-level guard |

The HTML `maxLength` works even if JavaScript fails to load. The CSS disabled attribute provides visual feedback. The JavaScript handler is the final gatekeeper. Each layer backs up the one before it.

---

## 20. Cohesion

**Definition:** Related things are kept together. State, the functions that change it, and the UI that displays it all live in the same component.

**`src/App.jsx` lines 17-69:**
```
state       →  lines 18-19  (text, entries)
derived     →  lines 21-24  (len, over, pct, countClass)
handler     →  lines 26-32  (handleSubmit — references text, entries)
render      →  lines 34-68  (uses text, entries, len, over, countClass, handleSubmit)
```

Everything related to confessions is in one component. There's no scattering — the state and its consumers are co-located. If someone needs to understand how confession submission works, they read one function.

---

## Principles NOT in Play

Some common principles are absent from this project:

| Principle | Why it's absent |
|---|---|
| **Lifting State Up** | There's only one component. State has nowhere to be lifted to. |
| **useMemo / Memoization** | No expensive computations worth caching — `timeAgo` and derived values are trivial. |
| **useEffect / Side Effect Isolation** | No side effects — no API calls, no localStorage, no timers. |
| **Abort Controller** | No async operations that need cancelling. |
| **Error Boundaries** | No external data fetching that could fail. |
| **Prop Drilling** | No child components receive props — everything is in one component. |
| **Context API** | No deeply nested state that needs to skip layers. |
| **Reducers** | Single action per state variable — `useState` is sufficient. |
| **Custom Hooks** | Logic is simple enough to stay inline. |

---

## Summary Table

| # | Principle | Primary lines |
|---|---|---|
| 1 | **Controlled Components** | App.jsx:42-43 |
| 2 | **Immutability** | App.jsx:30 |
| 3 | **Functional State Updates** | App.jsx:30 |
| 4 | **Separation of Concerns** | App.jsx vs App.css vs main.jsx vs config files |
| 5 | **Single Responsibility** | App.jsx:6-15 (`timeAgo`), 26-32 (`handleSubmit`) |
| 6 | **DRY** | App.jsx:4 (`MAX`) |
| 7 | **Derived State** | App.jsx:21-24 (`len`, `over`, `pct`, `countClass`) |
| 8 | **Conditional Rendering** | App.jsx:56-65 (empty vs entries) |
| 9 | **Fail Fast** | App.jsx:29 |
| 10 | **Pure Functions** | App.jsx:6-15 (`timeAgo`) |
| 11 | **Single Source of Truth** | App.jsx:18-19 (`text`, `entries`) |
| 12 | **Form Validation** | App.jsx:28-29 (JS), 49 (UI), 45 (HTML) |
| 13 | **Guard Clauses** | App.jsx:29, 49 |
| 14 | **Unidirectional Data Flow** | App.jsx:42-43 → 30 → 42-43 cycle |
| 15 | **Unique Key Prop** | App.jsx:60 |
| 16 | **Declarative Rendering** | App.jsx:34-68 (JSX description) |
| 17 | **CSS Animation Separation** | App.css:68, 89, 116, 119-128 |
| 18 | **Explicit State Transitions** | App.jsx:56-65 |
| 19 | **Progressive Enhancement** | App.jsx:29 + 45 + 49 (three layers) |
| 20 | **Cohesion** | App.jsx:17-69 (state + logic + UI together) |
