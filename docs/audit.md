# Audit: Confession Cathedral

I looked at every line of the cofession-cathedral project and checked for **XSS risks**, **accessibility problems**, **performance trouble with long lists**, and **anti-patterns**. Each finding includes a fix written like a patient teacher explaining to a junior developer.

---

## 1. XSS (Cross-Site Scripting)

### What is XSS?

XSS is when a bad person types JavaScript code into a text box, and the website accidentally runs it as code instead of treating it as plain text. For example, typing `<script>alert('hacked')</script>` could pop up a box or steal data if the app doesn't protect itself.

### Finding 1A: User text is rendered via JSX — SAFE by default

**`src/App.jsx` line 61:**
```jsx
<p className="entry-text">{e.text}</p>
```

**Risk level:** ✅ None

**Why it's safe:** React's JSX automatically escapes everything inside `{}`. If someone types `<script>alert('xss')</script>`, React turns it into the literal text `<script>alert('xss')</script>` inside the `<p>`. It is never executed as code.

**Proof:** React calls `React.createElement('p', null, e.text)`, which uses `document.createTextNode()` internally. That method treats strings as text, not HTML. Even if `e.text` contains HTML tags, they appear as visible characters on the page.

**No fix needed.** But let's make sure you understand why, in case you see a different pattern somewhere else.

**If someone used `dangerouslySetInnerHTML` instead:**
```jsx
<p dangerouslySetInnerHTML={{ __html: e.text }} />  // ❌ WOULD execute scripts
```

That would be dangerous. The name `dangerouslySetInnerHTML` is intentionally scary. Never use it with user input.

### Finding 1B: No server-side validation

**`src/App.jsx` lines 26-32:**
```js
function handleSubmit(e) {
  e.preventDefault()
  const trimmed = text.trim()
  if (!trimmed || over) return
  setEntries(prev => [{ text: trimmed, time: Date.now() }, ...prev])
  setText('')
}
```

**Risk level:** 🟡 Low (no backend)

**Why it's not a problem right now:** This app is 100% client-side. There is no server, no database, no API. The data lives only in your browser's memory. So there's nowhere for an attacker to send malicious data.

**But if you add a backend later:** You must validate and sanitize on the server too. Never trust what comes from the browser. A bad actor can bypass any client-side check by sending a raw HTTP request.

### Finding 1C: Placeholder text is static — SAFE

**`src/App.jsx` line 44:**
```jsx
placeholder="Type your confession here…"
```

**Risk level:** ✅ None

The placeholder is a hardcoded string, not user input. No XSS vector.

### Finding 1D: CSS class name is dynamically built — SAFE

**`src/App.jsx` lines 24, 48:**
```js
const countClass = 'char-count' + (over ? ' danger' : pct > 0.85 ? ' warn' : '')
```
```jsx
<span className={countClass}>{len} / {MAX}</span>
```

**Risk level:** ✅ None

The class name is built from internal state (`over`, `pct`), never from user input. A user can't control what CSS class gets applied. Even if they could, React escapes className values too.

---

## 2. Accessibility

### What is accessibility?

Accessibility (a11y for short) means making sure everyone can use your app — people who can't see the screen (they use screen readers), people who can't use a mouse (they use keyboards only), people with low vision, color blindness, or other needs.

### Finding 2A: No `<label>` for the textarea

**`src/App.jsx` lines 39-53:**
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

**Problem:** The textarea has no `<label>` element. Screen readers can't announce what this input is for. The `placeholder` is visible to sighted users but is NOT a substitute for a label — screen readers often skip or treat placeholders differently.

**Fix:** Add an explicit `<label>` that's visually hidden (so sighted users still see the placeholder) but available to screen readers.

```jsx
<form className="form" onSubmit={handleSubmit}>
  <label htmlFor="confession-input" className="sr-only">
    Write your confession
  </label>
  <textarea
    id="confession-input"
    className="input"
    value={text}
    onChange={e => setText(e.target.value)}
    placeholder="Type your confession here…"
    maxLength={500}
  />
  ...
</form>
```

Add a `.sr-only` class to `App.css` (visually hidden, screen-reader-only):

```css
.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border: 0;
}
```

This is the standard "visually hidden" pattern. The label exists in the DOM for screen readers but doesn't change the visual layout.

### Finding 2B: "absolve" button text is unclear

**`src/App.jsx` lines 49-51:**
```jsx
<button className="btn" type="submit" disabled={over || !text.trim()}>
  absolve
</button>
```

**Problem:** "absolve" is a church word that means "forgive." Some users (including non-native English speakers, children, or people with cognitive disabilities) may not understand what the button does. It blends the cathedral theme with unclear functionality.

**Fix:** Keep the visual text as "absolve" for the theme, but add an `aria-label` that explains the action clearly:

```jsx
<button
  className="btn"
  type="submit"
  disabled={over || !text.trim()}
  aria-label="Submit your confession"
>
  absolve
</button>
```

Screen readers will say "Submit your confession, button" instead of just "absolve, button."

### Finding 2C: No live region for dynamic content

**`src/App.jsx` lines 55-66:**
```jsx
<div className="feed">
  {entries.length === 0 ? (
    <p className="empty">no confessions yet. the floor is yours.</p>
  ) : (
    entries.map((e, i) => (
      <div className="entry" key={e.time + '-' + i}>
        ...
      </div>
    ))
  )}
</div>
```

**Problem:** When a new confession appears, screen reader users won't know about it. There's no `aria-live` region to announce the change. The empty message is also not announced when the page first loads.

**Fix:** Add `aria-live="polite"` to the feed container so screen readers announce new content:

```jsx
<div className="feed" aria-live="polite" aria-label="Confessions feed">
```

- `aria-live="polite"` — tells the screen reader "speak up when something changes here, but wait until I'm done with what I'm doing."
- `aria-label="Confessions feed"` — gives the region a name.

Also announce the empty state for screen readers:

```jsx
{entries.length === 0 ? (
  <p className="empty" role="status">no confessions yet. the floor is yours.</p>
) : ...}
```

`role="status"` tells the screen reader this is a status message that should be announced.

### Finding 2D: No focus management after submission

**`src/App.jsx` lines 26-32:**
```js
function handleSubmit(e) {
  e.preventDefault()
  const trimmed = text.trim()
  if (!trimmed || over) return
  setEntries(prev => [{ text: trimmed, time: Date.now() }, ...prev])
  setText('')
}
```

**Problem:** After submitting, focus stays wherever it was (or moves to the `<body>`). Keyboard users and screen reader users don't know where the focus landed. They might expect to be in the textarea to type another confession.

**Fix:** Use a `ref` to focus the textarea after submission:

```jsx
import { useState, useRef } from 'react'  // add useRef

function App() {
  const [text, setText] = useState('')
  const [entries, setEntries] = useState([])
  const inputRef = useRef(null)           // create a ref

  function handleSubmit(e) {
    e.preventDefault()
    const trimmed = text.trim()
    if (!trimmed || over) return
    setEntries(prev => [{ text: trimmed, time: Date.now() }, ...prev])
    setText('')
    inputRef.current?.focus()             // move focus back to textarea
  }

  return (
    ...
    <textarea
      ref={inputRef}                      // attach ref
      id="confession-input"
      className="input"
      value={text}
      onChange={e => setText(e.target.value)}
      placeholder="Type your confession here…"
      maxLength={500}
    />
    ...
  )
}
```

Now after submitting, focus returns to the textarea so keyboard users can immediately type another one.

### Finding 2E: Color contrast issues

**`src/App.css` lines 18-24 — subtitle:**
```css
.subtitle { color: #888; }
```
Background: `#0d0d1a` (from `index.css` line 9).

**Problem:** `#888` on `#0d0d1a` has a contrast ratio of approximately 4.6:1. The WCAG AA standard requires **4.5:1 for normal text** and **3:1 for large text**. The subtitle is 0.85rem which is small (below 18px / 14px bold), so it needs 4.5:1. This passes, but barely.

**`src/App.css` lines 145-150 — empty state:**
```css
.empty { color: #555; }
```
Background: `#0d0d1a`.

**Problem:** `#555` on `#0d0d1a` has a contrast ratio of approximately **2.8:1**. This FAILS WCAG AA. Users with low vision will struggle to read this.

**`src/App.css` lines 138-143 — entry timestamps:**
```css
.entry-time { color: #666; }
```
Background: `#1a1a2e` (from `.entry`).

**Problem:** `#666` on `#1a1a2e` has a contrast ratio of approximately **3.5:1**. This FAILS WCAG AA for normal text (needs 4.5:1). Timestamps are small, decorative text, but they should still be readable.

**Fix for `.empty` and `.entry-time`:**
```css
.empty      { color: #999; }  /* 5.8:1 on #0d0d1a — passes AA */
.entry-time { color: #999; }  /* 4.8:1 on #1a1a2e — passes AA */
```

Or better, use `color-mix()` or calculate exact ratios. The general rule: on dark backgrounds, text below 18px should be at least `#999` for adequate contrast.

### Finding 2F: No skip-to-content link

**Problem:** Keyboard users must tab through the title, subtitle, form, and textarea before reaching the confessions feed. There's no way to skip directly to the content.

**Fix:** Add a skip link as the first focusable element:

```jsx
return (
  <div className="app">
    <a href="#feed" className="skip-link">
      Skip to confessions
    </a>
    <h1 className="title">Confession Cathedral</h1>
    ...
    <div className="feed" id="feed">  {/* add id */}
```

```css
.skip-link {
  position: absolute;
  top: -100%;
  left: 0;
  background: #a78bfa;
  color: #fff;
  padding: 0.5rem 1rem;
  z-index: 100;
  transition: top 0.2s;
}
.skip-link:focus {
  top: 0;
}
```

The link is hidden off-screen until focused, then slides into view.

---

## 3. Performance for Long Lists

### What is the performance concern?

If someone types hundreds or thousands of confessions, every single one is rendered in the DOM as a real HTML element. The browser has to manage all of them — layout, painting, scrolling, re-rendering when a new one is added.

### Finding 3A: No windowing or virtualization

**`src/App.jsx` lines 58-64:**
```jsx
entries.map((e, i) => (
  <div className="entry" key={e.time + '-' + i}>
    <p className="entry-text">{e.text}</p>
    <span className="entry-time">{timeAgo(e.time)}</span>
  </div>
))
```

**Problem:** All entries are rendered at once. If `entries` has 10,000 items, the DOM will have 10,000 `<div class="entry">` elements. This will:
- Use lots of memory (each DOM element ~1-2 KB → 10-20 MB for 10,000 entries)
- Make scrolling laggy
- Make adding new entries slow (React has to diff 10,000 elements)

**Severity:** 🟡 Low for THIS app. Confessions are probably short-lived (you'd refresh the page and lose them). But worth knowing for future apps.

**Fix for small apps (no library needed):** Limit the visible list:
```jsx
const VISIBLE_MAX = 50
const visibleEntries = entries.slice(0, VISIBLE_MAX)

return (
  ...
  {entries.length > VISIBLE_MAX && (
    <p className="empty">showing latest {VISIBLE_MAX} of {entries.length} confessions</p>
  )}
  {visibleEntries.map((e, i) => (...))}
  ...
)
```

**Fix for large-scale apps (use a library):** Use `react-window` or `react-virtuoso`. These only render the items that fit on screen. As you scroll, they recycle DOM elements. Thousands of items, but only ~10 DOM nodes.

```jsx
import { FixedSizeList as List } from 'react-window'

{entries.length === 0 ? (
  <p className="empty">no confessions yet. the floor is yours.</p>
) : (
  <List
    height={600}
    itemCount={entries.length}
    itemSize={80}
    width="100%"
  >
    {({ index, style }) => {
      const e = entries[index]
      return (
        <div style={style} className="entry">
          <p className="entry-text">{e.text}</p>
          <span className="entry-time">{timeAgo(e.time)}</span>
        </div>
      )
    }}
  </List>
)}
```

### Finding 3B: All entries re-render when one is added

**`src/App.jsx` line 30:**
```js
setEntries(prev => [{ text: trimmed, time: Date.now() }, ...prev])
```

**Problem:** When a new confession is added, the entire `entries` array is replaced. React re-renders every entry card. For small lists this is instant. For very large lists it causes a visible pause.

**Fix for large lists:** Add `React.memo` to memoize each entry card:

```jsx
const Entry = React.memo(function Entry({ text, time }) {
  return (
    <div className="entry">
      <p className="entry-text">{text}</p>
      <span className="entry-time">{timeAgo(time)}</span>
    </div>
  )
})
```

Then use `<Entry>` in the map. `React.memo` checks if props changed — since existing entries' props never change, React skips re-rendering them. Only the new entry renders.

### Finding 3C: `timeAgo` doesn't update automatically

**`src/App.jsx` lines 6-15 and 62:**
```js
function timeAgo(date) {
  const sec = Math.floor((Date.now() - date) / 1000)
  ...
}
```
```jsx
<span className="entry-time">{timeAgo(e.time)}</span>
```

**Problem:** `timeAgo` runs on every render, but nothing triggers a re-render over time. So a confession that was "just now" stays "just now" forever unless something else forces a render (like posting another confession). `Date.now()` gives a new value each call, but the component doesn't re-render to use it.

**Severity:** 🟢 Cosmetic. The timestamps are informative but not critical.

**Fix:** Add a `useEffect` with `setInterval` to re-render periodically (every 60 seconds is enough for minutes-precision):

```jsx
const [, forceRender] = useState(0)

useEffect(() => {
  const id = setInterval(() => forceRender(n => n + 1), 60000)
  return () => clearInterval(id)
}, [])
```

But this adds complexity for minimal gain. A simpler fix: just accept that timestamps only update on interaction. The existing behavior is fine for this app.

### Finding 3D: No infinite scroll or pagination

**`src/App.jsx` lines 55-66:** All entries shown at once, forever.

**Problem:** As the list grows, the page gets longer. Users must scroll to the bottom to see old entries, and the page height grows unbounded.

**Fix for future:** Implement "load more" or infinite scroll. But for this app, it's unnecessary — data resets on refresh.

---

## 4. Anti-patterns

### What is an anti-pattern?

An anti-pattern is a common solution that looks correct but creates problems down the road. It's like building a house on a foundation that seems fine until the second floor goes on.

### Finding 4A: `maxLength` mismatch (280 vs 500)

**`src/App.jsx` lines 4, 45:**
```js
const MAX = 280
```
```jsx
<textarea ... maxLength={500} />
```

**Problem:** The app's validation limit is 280 (`MAX`), but the HTML allows 500 characters (`maxLength={500}`). This means:
1. A user can type 300 characters.
2. The counter shows "300 / 280" in red.
3. The "absolve" button is disabled.
4. The user is confused — they can type but can't submit.
5. The textarea stops them at 500, but they were stuck since 280.

This is a bug. The HTML limit should match the app limit.

**Fix:**
```jsx
<textarea ... maxLength={MAX} />
```

Now the textarea won't accept more than 280 characters, matching the app's validation. The user gets immediate feedback at the browser level.

### Finding 4B: Weak `key` prop

**`src/App.jsx` line 60:**
```jsx
entries.map((e, i) => (
  <div className="entry" key={e.time + '-' + i}>
```

**Problem:** The key combines `e.time` (timestamp in milliseconds) with the index `i`. There are two issues:
1. **Timestamp collisions:** Two confessions in the same millisecond get the same base key.
2. **Index dependency:** If items were ever reordered (they're not in this app, but the pattern is fragile), the index-based key would cause React to mismanage DOM elements.

React uses `key` to track which items exist, were added, or were removed. A bad key can cause:
- Lost focus state
- Lost scroll position
- Incorrect animation transitions
- Duplicate or missing DOM nodes

**Fix:** Generate a unique ID when creating the entry:
```js
setEntries(prev => [{
  id: crypto.randomUUID(),   // ← add this
  text: trimmed,
  time: Date.now(),
}, ...prev])
```

Then use it as the key:
```jsx
entries.map(e => (
  <div className="entry" key={e.id}>
```

`crypto.randomUUID()` is built into modern browsers and always produces a unique value. Other projects in the same workspace already use this pattern (receipts line ~111, wahala line ~29).

**Wait, but `crypto.randomUUID()` might not be available in older browsers.** If you need to support older browsers, use a simple counter or timestamp + random fallback:

```js
function generateId() {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID()
  }
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8)
}
```

### Finding 4C: No data persistence

**`src/App.jsx` line 19:**
```js
const [entries, setEntries] = useState([])
```

**Problem:** All confessions disappear when the page is refreshed. This is surprising behavior — users who type multiple confessions will lose everything if they accidentally refresh.

This is an intentional design choice (anonymous, ephemeral confessions), but it's worth flagging so you know it's a decision, not an oversight.

**If you want persistence:** Use `localStorage`, like the receipts and Time-Locked Letters projects do:

```js
const [entries, setEntries] = useState(() => {
  try {
    const saved = localStorage.getItem('confession-entries')
    return saved ? JSON.parse(saved) : []
  } catch {
    return []
  }
})

useEffect(() => {
  localStorage.setItem('confession-entries', JSON.stringify(entries))
}, [entries])
```

**If you want to keep the ephemeral design:** Leave it as-is, but consider showing a subtle notification when the page loads so users know their data won't persist.

### Finding 4D: `timeAgo` is impure but called in render

**`src/App.jsx` lines 6-15, 62:**
```js
function timeAgo(date) {
  const sec = Math.floor((Date.now() - date) / 1000)
  ...
}
```
```jsx
<span className="entry-time">{timeAgo(e.time)}</span>
```

**Problem:** `timeAgo` calls `Date.now()` which makes it impure — its output depends on when it's called, not just its input. Calling it during render is technically fine in React (it doesn't cause side effects), but it means the displayed text depends on when the render happens, which is inconsistent.

**The fix depends on how precise you need the timestamps:**
- If "just now" is good enough: No fix needed (current behavior).
- If you want live-updating timestamps: Use a `setInterval` to force periodic re-renders (see Finding 3C).
- If you want accurate "time since" even after long idle periods: Store the timestamp and calculate outside of render using `useEffect`:

```jsx
function Entry({ text, time }) {
  const [ago, setAgo] = useState(() => timeAgo(time))

  useEffect(() => {
    const id = setInterval(() => setAgo(timeAgo(time)), 10000)
    return () => clearInterval(id)
  }, [time])

  return (
    <div className="entry">
      <p className="entry-text">{text}</p>
      <span className="entry-time">{ago}</span>
    </div>
  )
}
```

But this adds complexity. For a confession app, the simple approach is fine.

### Finding 4E: No validation for extremely long words

**`src/App.jsx` line 133 (CSS):**
```css
.entry-text { word-wrap: break-word; }
```

CSS handles long words by breaking them. But there's no JavaScript validation for excessively long single words that could break layout or cause slow rendering.

**Severity:** 🟢 Low. CSS `word-wrap: break-word` handles this reasonably.

**Optional fix:** Add a maximum word-length check:
```js
const MAX_WORD_LENGTH = 100
const hasOverlongWord = text.split(/\s+/).some(word => word.length > MAX_WORD_LENGTH)
if (hasOverlongWord) return  // reject or truncate
```

### Finding 4F: All logic is in one component

**`src/App.jsx` lines 17-69:** Everything — state, handlers, rendering — is in a single `App` function.

**Problem:** This works for 71 lines but doesn't scale. If you needed to add features (edit, delete, search, filter, user accounts), this file would grow into an unmanageable mess.

**Fix:** Split into smaller components as the app grows:

```jsx
// ConfessionForm.jsx — the textarea, counter, and button
function ConfessionForm({ text, onTextChange, onSubmit, over }) { ... }

// ConfessionFeed.jsx — the list of confessions
function ConfessionFeed({ entries }) { ... }

// ConfessionCard.jsx — a single confession entry
const ConfessionCard = React.memo(function ConfessionCard({ text, time }) { ... })
```

Each component has one job. You can test them individually. Other developers can understand them at a glance.

But for a 71-line file, this is fine. The principle to remember is: **split when a file starts doing more than one thing.**

### Finding 4G: No `htmlFor` / `id` association

This is the same as Finding 2A (accessibility), but it's also a code anti-pattern:

```jsx
<textarea
  className="input"
  value={text}
  onChange={e => setText(e.target.value)}
  placeholder="Type your confession here…"
  maxLength={500}
/>
```

A `<textarea>` without an associated `<label>` is an anti-pattern because it assumes all users can see the placeholder and understand its purpose. Placeholders disappear when you type, so even sighted users lose the hint.

Fix is the same as Finding 2A: add a `<label htmlFor="...">`.

---

## Summary

| Category | Finding | Severity | Fix |
|---|---|---|---|
| **XSS** | 1A: JSX auto-escapes | ✅ None | No action needed |
| **XSS** | 1B: No backend | 🟡 Low | Add server validation if backend is added |
| **Accessibility** | 2A: No `<label>` | 🔴 High | Add `<label htmlFor>` + `.sr-only` class |
| **Accessibility** | 2B: Unclear button | 🟡 Medium | Add `aria-label="Submit your confession"` |
| **Accessibility** | 2C: No live region | 🟡 Medium | Add `aria-live="polite"` to feed |
| **Accessibility** | 2D: No focus management | 🟡 Medium | Add `useRef` + `inputRef.current.focus()` |
| **Accessibility** | 2E: Color contrast | 🔴 High | Lighten `.empty` (#555→#999) and `.entry-time` (#666→#999) |
| **Accessibility** | 2F: No skip link | 🟡 Low | Add `<a href="#feed" class="skip-link">` |
| **Performance** | 3A: No virtualization | 🟢 Low | Add slice limit or `react-window` for big lists |
| **Performance** | 3B: Full re-render | 🟢 Low | Add `React.memo` on entry cards |
| **Performance** | 3C: Stale timestamps | 🟢 Cosmetic | Accept current behavior or add periodic tick |
| **Performance** | 3D: No pagination | 🟢 Cosmetic | Slice or infinite scroll if needed |
| **Anti-pattern** | 4A: `maxLength` mismatch | 🔴 Bug | Change `maxLength={500}` to `maxLength={MAX}` |
| **Anti-pattern** | 4B: Weak `key` prop | 🟡 Medium | Use `crypto.randomUUID()` as entry ID and key |
| **Anti-pattern** | 4C: No persistence | 🟢 Design choice | Leave ephemeral or add `localStorage` |
| **Anti-pattern** | 4D: `timeAgo` in render | 🟢 Cosmetic | Accept or add `setInterval` |
| **Anti-pattern** | 4E: Long word validation | 🟢 Low | Handled by CSS |
| **Anti-pattern** | 4F: Monolithic component | 🟢 Low | Split when it grows |
| **Anti-pattern** | 4G: Missing label association | 🔴 High | Same fix as 2A |

**Quick priorities if you want to fix things:**
1. **Fix 4A** (`maxLength`) — 1 character change, prevents confusion
2. **Fix 2A + 4G** (add `<label>`) — 2 lines, makes the form accessible
3. **Fix 2E** (color contrast) — change two color values, helps low-vision users
4. **Fix 4B** (use `crypto.randomUUID()`) — prevents rare but confusing bugs
5. **Fix 2C** (add `aria-live`) — screen reader users hear new confessions
