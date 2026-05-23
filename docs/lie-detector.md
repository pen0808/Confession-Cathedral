# Lie Detector: Confession Cathedral

Five statements about how this app works. Four are true. One is a lie.

---

## The Statements

**A.** The character counter turns orange (warn) when you pass 85% of the limit, and red (danger) when you exceed 280 characters.

**B.** Confessions are saved to `localStorage` so they remain on the page even after you close and re-open your browser.

**C.** Leading and trailing whitespace is removed from confessions before they are displayed.

**D.** The HTML textarea allows up to 500 characters, but the JavaScript prevents submissions over 280 characters.

**E.** New confessions appear at the TOP of the feed (most recent first), pushing older ones down.

---

## Which is the Lie?

Write down your guess, then check below.

---

## ↓

---

## ↓

---

## ↓

---

## How to Spot the Lie

Let's check each statement against the code:

### Statement A - TRUE
`App.jsx` line 24:
```jsx
const countClass = 'char-count' + (over ? ' danger' : pct > 0.85 ? ' warn' : '')
```
And `App.css` confirms: `.char-count.warn { color: #f59e0b; }` (orange) and `.char-count.danger { color: #ef4444; }` (red).

### Statement B - **FALSE (THE LIE)**
Nowhere in `App.jsx` is there any `localStorage` usage. The app only uses React's `useState`:
```jsx
const [entries, setEntries] = useState([])
```

When you refresh the page, React state resets and all confessions vanish.

### Statement C - TRUE
`App.jsx` line 28:
```jsx
const trimmed = text.trim()
```
And it's `trimmed` that gets saved, not the original `text`.

### Statement D - TRUE
- `App.jsx` line 45: `<textarea ... maxLength={500} />` (HTML limit)
- `App.jsx` line 4: `const MAX = 280` (JS enforcement limit)
- `App.jsx` line 29: `if (over) return` blocks submission when `len > MAX`

### Statement E - TRUE
`App.jsx` line 30:
```jsx
setEntries(prev => [{ text: trimmed, time: Date.now() }, ...prev])
```

The new entry goes **first** in the array (before `...prev`), so newest displays at the top.

---

## The Lie is **Statement B**

The app does NOT use `localStorage`. Confessions only live in memory and disappear on page refresh.
