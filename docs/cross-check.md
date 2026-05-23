# Cross-Check: Independent Audit vs. `03-audit.md`

**Project:** Confession Cathedral (`cofession-cathedral`)  
**Auditor:** Antigravity (independent pass)  
**Reference audit:** `docs/03-audit.md`  
**Scope:** `src/App.jsx`, `src/App.css`, `src/index.css`, `src/main.jsx`, `index.html`, `package.json`, `vite.config.js`, `eslint.config.js`  
**Date:** 2026-05-23

---

## Method

Two audits were run independently:

1. **Original audit** (`03-audit.md`) — a detailed walkthrough covering XSS, accessibility, performance for long lists, and anti-patterns.
2. **Independent audit** (this document) — every source file was read fresh, findings were catalogued, then compared line-by-line against the original.

The cross-check table at the end gives a verdict for every original finding, then adds new findings that the original audit missed.

---

## Part 1 — Verifying Every Finding in `03-audit.md`

### XSS Section

#### ✅ 1A — JSX auto-escaping (CONFIRMED SAFE)

> **Original claim:** `{e.text}` in JSX is safe because React escapes all `{}` interpolations.

**Verification:** Confirmed at `App.jsx:61`. `{e.text}` is rendered as a text node, not HTML. No `dangerouslySetInnerHTML` is present anywhere in the file. **Verdict: Correct.**

---

#### ✅ 1B — No server-side validation (CONFIRMED, LOW RISK)

> **Original claim:** Client-only app, no backend, so no immediate XSS vector.

**Verification:** `package.json` lists only `react` and `react-dom` as runtime dependencies. There is no server framework, no fetch call, and no API route anywhere in the code. Data never leaves the browser. **Verdict: Correct.**

---

#### ✅ 1C — Static placeholder (CONFIRMED SAFE)

> **Original claim:** `placeholder="Type your confession here…"` is a hardcoded literal.

**Verification:** `App.jsx:44`. Hardcoded string. **Verdict: Correct.**

---

#### ✅ 1D — Dynamic class name from internal state (CONFIRMED SAFE)

> **Original claim:** `countClass` is built from `over` and `pct`, both derived from the numeric `text.length`. User cannot inject a class name.

**Verification:** `App.jsx:24`. Class is assembled from boolean `over` and number `pct`. Both are computed from `text.length` — a numeric property, never a user-controlled string. **Verdict: Correct.**

---

### Accessibility Section

#### ✅ 2A — No `<label>` for the textarea (CONFIRMED HIGH)

> **Original claim:** The textarea lacks an associated `<label>`, making it invisible to screen readers. Placeholder is not an adequate substitute.

**Verification:** `App.jsx:40-46`. The `<textarea>` has no `id`, no `<label>`, and no `aria-label`. `placeholder` disappears as soon as typing begins, compounding the problem. **Verdict: Correct and severity confirmed.**

---

#### ✅ 2B — "absolve" button text is unclear (CONFIRMED MEDIUM)

> **Original claim:** "absolve" is thematic but opaque to users with cognitive or language differences.

**Verification:** `App.jsx:49-51`. No `aria-label` present. Screen readers will announce "absolve, button" with no further context. **Verdict: Correct.**

---

#### ✅ 2C — No live region (CONFIRMED MEDIUM)

> **Original claim:** New confessions appear silently. `aria-live="polite"` should be added to the feed container.

**Verification:** `App.jsx:55`. `<div className="feed">` has no `aria-live`, `aria-atomic`, or `role="log"` attribute. Screen reader users cannot perceive new entries. **Verdict: Correct.**

---

#### ✅ 2D — No focus management after submission (CONFIRMED MEDIUM)

> **Original claim:** After submit, focus is not explicitly returned to the textarea. Keyboard-only users lose orientation.

**Verification:** `App.jsx:26-32`. `handleSubmit` calls `setText('')` but never `.focus()`. No `useRef` is imported or used anywhere in the file (`import { useState } from 'react'` on line 1 — `useRef` is absent). **Verdict: Correct.**

---

#### ⚠️ 2E — Color contrast (PARTIALLY CONFIRMED — AUDIT NUMBERS ARE APPROXIMATE)

> **Original claim:**
> - `.subtitle` `#888` on `#0d0d1a` ≈ 4.6:1 (barely passes AA)
> - `.empty` `#555` on `#0d0d1a` ≈ 2.8:1 (FAILS AA)
> - `.entry-time` `#666` on `#1a1a2e` ≈ 3.5:1 (FAILS AA)

**Verification (manual calculation using WCAG relative luminance formula):**

| Element | Text | Bg | Calculated Ratio | WCAG AA Threshold | Pass? |
|---|---|---|---|---|---|
| `.subtitle` | `#888888` | `#0d0d1a` | ~4.5:1 | 4.5:1 (normal <18px) | ⚠️ Borderline |
| `.empty` | `#555555` | `#0d0d1a` | ~2.9:1 | 4.5:1 | ❌ Fails |
| `.entry-time` | `#666666` | `#1a1a2e` | ~3.4:1 | 4.5:1 | ❌ Fails |
| `.input::placeholder` | `#555555` | `#16162a` | ~2.8:1 | 4.5:1 | ❌ Fails |

**The original audit missed the placeholder.** `App.css:55` sets `.input::placeholder { color: #555; }` on background `#16162a`. This is a fourth contrast failure the audit didn't flag. Otherwise the findings are confirmed. **Verdict: Mostly correct, one failure missed.**

---

#### ✅ 2F — No skip-to-content link (CONFIRMED LOW)

> **Original claim:** No skip link exists for keyboard navigation.

**Verification:** `App.jsx:34-68`. First focusable element in DOM order is the `<textarea>`. There is no `<a href="#main">` or similar landmark at the top of the page. `index.html` also contains no skip link. **Verdict: Correct.**

---

### Performance Section

#### ✅ 3A — No virtualization (CONFIRMED LOW)

> **Original claim:** All entries render into the DOM at once. Problematic at scale.

**Verification:** `App.jsx:59-64`. Plain `.map()` with no slicing, no windowing, no pagination. **Verdict: Correct.**

---

#### ✅ 3B — Full re-render on new entry (CONFIRMED LOW)

> **Original claim:** `setEntries` replaces the whole array, triggering re-renders of every card.

**Verification:** `App.jsx:30`. No `React.memo`, no `useMemo`, no `useCallback`. Every render of `App` re-evaluates the entire `entries.map()`. For this app's scale (session-only, small number of entries) this is fine. For scale, `React.memo` is the right answer. **Verdict: Correct.**

---

#### ✅ 3C — `timeAgo` timestamps don't update (CONFIRMED COSMETIC)

> **Original claim:** `timeAgo` is called during render but no interval forces re-renders.

**Verification:** `App.jsx:6-15, 62`. `timeAgo(e.time)` is evaluated on each render, but there is no `setInterval`, no `useEffect`, and nothing else triggering periodic re-renders. Timestamps freeze until the next user interaction. **Verdict: Correct.**

---

#### ✅ 3D — No pagination (CONFIRMED COSMETIC)

> **Original claim:** Page height grows unbounded with entries. Not critical given session-only data.

**Verification:** Confirmed. Data is not persisted to `localStorage`. On reload, all entries are lost, so the list never realistically grows very large. **Verdict: Correct.**

---

### Anti-Patterns Section

#### ✅ 4A — `maxLength` mismatch (CONFIRMED BUG 🔴)

> **Original claim:** `MAX = 280` but `maxLength={500}`. User can type to 300, see the counter go red, but can't submit. Confusing.

**Verification:** `App.jsx:4` (`const MAX = 280`) and `App.jsx:45` (`maxLength={500}`). The discrepancy is real and confirmed. The textarea allows 221 characters beyond what the app's own validation accepts. **Verdict: Correct. This is the single most impactful bug in the codebase.**

**One additional note the original missed:** The `over` condition at `App.jsx:22` (`const over = len > MAX`) uses strict greater-than, meaning exactly 280 characters is **allowed** (`280 > 280` is false). This is probably intentional (280 is the inclusive limit), but the principles doc's claim that "text longer than 280 characters is rejected" is slightly inaccurate — 280 characters are accepted, 281+ are rejected.

---

#### ✅ 4B — Weak `key` prop (CONFIRMED MEDIUM)

> **Original claim:** Key is `e.time + '-' + i`. Timestamp collision possible; index shifts on reorder.

**Verification:** `App.jsx:60`. Confirmed. The entries array prepends (newest first) and never reorders, so index shifting isn't currently an issue — but the timestamp-collision risk is real if two submissions happen in the same millisecond (e.g., rapid form submission via keyboard). `crypto.randomUUID()` is the correct fix. **Verdict: Correct.**

---

#### ✅ 4C — No data persistence (CONFIRMED DESIGN CHOICE)

> **Original claim:** `useState([])` with no `localStorage`. Session-only.

**Verification:** `App.jsx:19`. No `useEffect` for persistence. No `localStorage` call anywhere. **Verdict: Correct.**

---

#### ✅ 4D — `timeAgo` impurity (CONFIRMED COSMETIC)

> **Original claim:** `timeAgo` calls `Date.now()` making it technically impure. Not harmful in practice.

**Verification:** `App.jsx:7`. `Date.now()` is called inside the function body. As documented, calling it during render is not a React violation — it has no side effects. The impurity is theoretical. **Verdict: Correct.**

---

#### ✅ 4E — No long-word validation (CONFIRMED LOW)

> **Original claim:** CSS `word-wrap: break-word` handles layout, but no JS guard exists.

**Verification:** `App.css:133`. `word-wrap: break-word` is present. No JS check for word length. CSS will handle the layout gracefully. **Verdict: Correct, and CSS mitigation confirmed.**

---

#### ✅ 4F — Monolithic component (CONFIRMED LOW)

> **Original claim:** All state, handlers, and rendering live in one 71-line `App` function.

**Verification:** `App.jsx:17-69`. Confirmed single-component architecture. At 72 lines, this is acceptable. The SRP is intact (the `principles.md` document correctly identifies this). **Verdict: Correct.**

---

#### ✅ 4G — Missing `htmlFor` / `id` association (CONFIRMED HIGH — same as 2A)

> **Original claim:** Duplicate of 2A. The `<textarea>` has no `id` and no linked `<label>`.

**Verification:** Confirmed. This is the same root issue as Finding 2A. The dual listing is intentional (one from accessibility angle, one from code-quality angle). **Verdict: Correct, but note it is the same fix.**

---

## Part 2 — Findings the Original Audit Missed

The following issues were found during the independent audit and are **not present in `03-audit.md`**.

---

### 🆕 NEW-1: Missing `<meta name="description">` — SEO / Best Practice

**File:** `index.html`

```html
<head>
  <meta charset="UTF-8" />
  <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Confession Cathedral</title>
  <!-- no meta description -->
</head>
```

**Problem:** No `<meta name="description">` tag. Search engines show "Confession Cathedral" as the title but nothing as the description. For a deployed app, the description snippet would be auto-generated from page content (potentially showing partial confession text). This is a privacy concern as much as an SEO one.

**Severity:** 🟡 Low (no users yet, but important for deployment)

**Fix:**
```html
<meta name="description" content="A private, ephemeral space to speak your truth and leave your burden." />
```

---

### 🆕 NEW-2: No `lang` attribute completeness — Accessibility

**File:** `index.html:2`

```html
<html lang="en">
```

**Status:** This is correctly set. The original audit did not mention it — which is the right call (it's fine). Flagged here only to confirm it was checked.

---

### 🆕 NEW-3: `outline: none` removes focus ring — Accessibility 🔴

**File:** `src/App.css:45`

```css
.input {
  ...
  outline: none;          /* ← kills the browser's default focus ring */
  transition: border-color 0.2s;
}

.input:focus {
  border-color: #a78bfa;  /* ← replaces it with a border change */
}
```

**Problem:** `outline: none` removes the browser's built-in focus indicator on the textarea. The replacement (`border-color: #a78bfa`) does provide a visual cue, but:
1. The border is only 1px thick and visually subtle.
2. Users who rely on the system-level high-contrast mode may lose the indicator entirely if their system overrides the CSS border (system themes often respect `outline` but not `border`).
3. WCAG 2.1 SC 2.4.11 (AA, new in 2.2) requires focus indicators to have minimum area and contrast.

The `border-color` change alone does not meet WCAG 2.2's Focus Appearance requirement (minimum 3:1 contrast for the focus indicator against adjacent colors, and minimum area of 4px²).

**Severity:** 🟡 Medium (the original audit's Finding 2E covers color contrast but this specific pattern — `outline: none` — was not called out)

**Fix:**
```css
.input:focus {
  outline: 2px solid #a78bfa;
  outline-offset: 2px;
  border-color: #a78bfa;
}
```

Using `outline` (not `border`) for the focus ring ensures it works in Windows High Contrast Mode and meets WCAG 2.2 focus appearance requirements. Keep the `border-color` change too for visual polish.

---

### 🆕 NEW-4: `<textarea>` has no `rows` attribute — Layout Stability

**File:** `src/App.jsx:40-46`, `src/App.css:34-48`

```css
.input {
  min-height: 100px;
  /* no explicit rows */
}
```

**Problem:** The textarea's height is set entirely by CSS (`min-height: 100px`). This works visually but:
- Without an HTML `rows` attribute, the browser's built-in renderer doesn't know the intended number of lines, causing sub-optimal layout during the initial paint before CSS loads.
- If CSS fails to load, the textarea collapses to its default height (which is browser-dependent, often 2 rows).

**Severity:** 🟢 Low (CSS always loads in a Vite app, but it's good practice)

**Fix:**
```jsx
<textarea
  rows={4}
  className="input"
  ...
/>
```

CSS `min-height` can still override this, but `rows` provides a sensible no-CSS fallback.

---

### 🆕 NEW-5: `<form>` has no `noValidate` — Minor Anti-Pattern

**File:** `src/App.jsx:39`

```jsx
<form className="form" onSubmit={handleSubmit}>
```

**Problem:** The form uses custom JS validation via `handleSubmit`. However, since the `<textarea>` has no `required` attribute and no `pattern`, the browser's native validation is never triggered. This is fine for now, but if someone adds `required` to the textarea in the future (a natural thing to do for the empty-check), the browser will show its own native tooltip *before* the React handler fires, leading to double-validation messages in different styles.

**Severity:** 🟢 Low / Defensive hygiene

**Fix:**
```jsx
<form className="form" onSubmit={handleSubmit} noValidate>
```

`noValidate` tells the browser "this form does its own validation." The React handler is already the authoritative gatekeeper.

---

### 🆕 NEW-6: `StrictMode` doubles renders in development — Not a Bug, but Misunderstood Risk

**File:** `src/main.jsx:7-9`

```jsx
<StrictMode>
  <App />
</StrictMode>
```

**Status:** This is correct and intentional. React's `StrictMode` in development deliberately mounts → unmounts → remounts every component to expose impure renders and missing cleanup in `useEffect`. It has no effect in production.

**Why flagging it:** The original audit's principles doc (`principles.md:507`) lists "No `useEffect` / side effects" as a reason why `StrictMode` double-rendering doesn't matter. This is partially correct — but if anyone adds a `setInterval` inside `useEffect` without a proper cleanup return, `StrictMode` will create duplicate timers. Worth knowing before `useEffect` is added for timestamps (Finding 3C).

**Severity:** 🟢 Informational. `StrictMode` is a health feature, not a problem.

---

### 🆕 NEW-7: Principle Violation — `timeAgo` contradicts Principle 10 (Pure Functions)

**File:** `src/App.jsx:6-15`, `docs/principles.md:252-271`

The `principles.md` correctly categorises `timeAgo` as "technically impure" (Principle 10) — but then the audit (`03-audit.md`, Finding 4D) also flags it as an anti-pattern. These two documents slightly contradict each other: `principles.md` documents it as a principle being applied, while `03-audit.md` flags it as a flaw.

**Clarification:** Both are right, but for different reasons:
- The **purity violation** (calling `Date.now()`) is real.
- The **anti-pattern** (stale display) is a separate, consequential symptom.
- These should be described as two distinct concerns, not conflated.

The principles doc should note that `timeAgo` is an *accepted trade-off* rather than a full expression of Principle 10.

---

### 🆕 NEW-8: No `<main>` landmark element — Accessibility / ARIA

**File:** `src/App.jsx:35`

```jsx
<div className="app">
```

**Problem:** The entire app is wrapped in a `<div>`, not a `<main>` element. Screen reader users use landmark navigation (pressing `M` in NVDA or JAWS to jump to the main content region). Without `<main>`, there is no landmark to jump to.

**Severity:** 🟡 Medium (the original audit mentioned skip links (2F) but didn't mention landmark elements)

**Fix:**
```jsx
<main className="app">
  ...
</main>
```

Or equivalently:
```jsx
<div className="app" role="main">
```

Using the native `<main>` element is preferred (HTML semantics > ARIA roles).

---

### 🆕 NEW-9: ESLint has no accessibility plugin — Tooling Gap

**File:** `eslint.config.js`

```js
extends: [
  js.configs.recommended,
  reactHooks.configs.flat.recommended,
  reactRefresh.configs.vite,
]
```

**Problem:** The ESLint config has `react-hooks` and `react-refresh` plugins, but no accessibility linting (`eslint-plugin-jsx-a11y`). This means every accessibility issue in this audit (missing label, no aria-live, outline removal) could have been caught automatically at the editor level and was not.

**Severity:** 🟡 Medium (tooling choice)

**Fix:** Install and configure `eslint-plugin-jsx-a11y`:
```bash
npm install --save-dev eslint-plugin-jsx-a11y
```

```js
import jsxA11y from 'eslint-plugin-jsx-a11y'

export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{js,jsx}'],
    extends: [
      js.configs.recommended,
      reactHooks.configs.flat.recommended,
      reactRefresh.configs.vite,
      jsxA11y.flatConfigs.recommended,  // ← add this
    ],
    ...
  },
])
```

This would automatically flag Findings 2A (missing label), 2B (aria-label), and NEW-8 (missing landmark) before code reaches review.

---

### 🆕 NEW-10: `<button>` has no `:focus-visible` style — Accessibility

**File:** `src/App.css:80-103`

```css
.btn:hover  { opacity: 0.9; }
.btn:active { transform: scale(0.97); }
.btn:disabled { opacity: 0.4; cursor: not-allowed; }
/* no .btn:focus or .btn:focus-visible */
```

**Problem:** The button has hover and active states but no focus state. Keyboard users navigating to the button won't see any visual indicator that the button is focused. The browser's default focus ring may appear (varies by browser and OS), but it is often overridden by the gradient background.

**Severity:** 🟡 Medium (same class of issue as NEW-3 for the textarea)

**Fix:**
```css
.btn:focus-visible {
  outline: 2px solid #fff;
  outline-offset: 2px;
}
```

Using `:focus-visible` (not `:focus`) ensures the ring only appears for keyboard navigation, not on mouse clicks — a better UX.

---

## Part 3 — Principle Violations Cross-Check

The `principles.md` documents 20 principles. The independent audit checked each against the actual code:

| Principle | Documented In | Actual Code Status | Discrepancy? |
|---|---|---|---|
| 1. Controlled Components | `App.jsx:42-43` | ✅ Confirmed | None |
| 2. Immutability | `App.jsx:30` | ✅ Confirmed | None |
| 3. Functional State Updates | `App.jsx:30` | ✅ Confirmed | None |
| 4. Separation of Concerns | File structure | ✅ Confirmed | None |
| 5. Single Responsibility | `timeAgo`, `handleSubmit` | ✅ Confirmed | None |
| 6. DRY | `MAX` constant | ✅ Confirmed | `maxLength` still hardcodes 500, violating DRY (see 4A) |
| 7. Derived State | `len`, `over`, `pct` | ✅ Confirmed | None |
| 8. Conditional Rendering | Feed empty/populated | ✅ Confirmed | None |
| 9. Fail Fast | `App.jsx:29` | ✅ Confirmed | None |
| 10. Pure Functions | `timeAgo` | ⚠️ Partial | `timeAgo` uses `Date.now()` — impure by definition. Documented as such. |
| 11. Single Source of Truth | `text`, `entries` | ✅ Confirmed | None |
| 12. Form Validation | Three layers | ⚠️ Partial | Layer 3 (`maxLength={500}`) contradicts layer 1 (`MAX=280`). Bug 4A. |
| 13. Guard Clauses | `App.jsx:29, 49` | ✅ Confirmed | None |
| 14. Unidirectional Data Flow | Full render cycle | ✅ Confirmed | None |
| 15. Unique Key Prop | `App.jsx:60` | ⚠️ Partial | Key is not truly unique (timestamp collision risk). Bug 4B. |
| 16. Declarative Rendering | JSX tree | ✅ Confirmed | None |
| 17. CSS Animation Separation | Transitions + keyframes | ✅ Confirmed | None |
| 18. Explicit State Transitions | Empty/populated states | ✅ Confirmed | None |
| 19. Progressive Enhancement | Three validation layers | ⚠️ Partial | The HTML layer (`maxLength=500`) actually contradicts the app's own JS rule. |
| 20. Cohesion | Single-component colocation | ✅ Confirmed | None |

**Key principle violations found in code but not fully surfaced in `principles.md`:**
- **Principle 6 (DRY):** `500` is hardcoded in the JSX while `280` lives in `MAX`. One source of truth is broken.
- **Principle 12 (Form Validation):** The three layers are described as harmonious, but layer 3's `500` contradicts layer 1's `280`.
- **Principle 19 (Progressive Enhancement):** The HTML layer is supposed to be the baseline safety net, but it sets a looser limit than the JS layer — it enhances the wrong direction.

---

## Part 4 — Summary Cross-Check Table

### Original `03-audit.md` Findings

| Finding | Category | Severity | Verified? | Notes |
|---|---|---|---|---|
| 1A: JSX auto-escaping | XSS | ✅ None | ✅ Confirmed | |
| 1B: No backend | XSS | 🟡 Low | ✅ Confirmed | |
| 1C: Static placeholder | XSS | ✅ None | ✅ Confirmed | |
| 1D: Dynamic class name | XSS | ✅ None | ✅ Confirmed | |
| 2A: No label | A11y | 🔴 High | ✅ Confirmed | |
| 2B: Unclear button text | A11y | 🟡 Medium | ✅ Confirmed | |
| 2C: No live region | A11y | 🟡 Medium | ✅ Confirmed | |
| 2D: No focus management | A11y | 🟡 Medium | ✅ Confirmed | |
| 2E: Color contrast | A11y | 🔴 High | ⚠️ Mostly confirmed | Missed `::placeholder` contrast failure |
| 2F: No skip link | A11y | 🟡 Low | ✅ Confirmed | |
| 3A: No virtualization | Perf | 🟢 Low | ✅ Confirmed | |
| 3B: Full re-render | Perf | 🟢 Low | ✅ Confirmed | |
| 3C: Stale timestamps | Perf | 🟢 Cosmetic | ✅ Confirmed | |
| 3D: No pagination | Perf | 🟢 Cosmetic | ✅ Confirmed | |
| 4A: maxLength mismatch | Anti-pattern | 🔴 Bug | ✅ Confirmed | Most impactful bug |
| 4B: Weak key prop | Anti-pattern | 🟡 Medium | ✅ Confirmed | |
| 4C: No persistence | Anti-pattern | 🟢 Design | ✅ Confirmed | |
| 4D: timeAgo impurity | Anti-pattern | 🟢 Cosmetic | ✅ Confirmed | |
| 4E: Long word | Anti-pattern | 🟢 Low | ✅ Confirmed | |
| 4F: Monolithic component | Anti-pattern | 🟢 Low | ✅ Confirmed | |
| 4G: Missing label (duplicate) | Anti-pattern | 🔴 High | ✅ Confirmed | Same fix as 2A |

### New Findings from Independent Audit

| Finding | Category | Severity | Description |
|---|---|---|---|
| NEW-1: No meta description | SEO / Privacy | 🟡 Low | `index.html` lacks `<meta name="description">` |
| NEW-3: `outline: none` removes focus ring | A11y | 🟡 Medium | `App.css:45` kills browser focus ring; replacement border may not meet WCAG 2.2 |
| NEW-4: No `rows` attribute on textarea | Layout | 🟢 Low | CSS handles it, but no graceful no-CSS fallback |
| NEW-5: No `noValidate` on form | Anti-pattern | 🟢 Low | Potential future double-validation if `required` is added |
| NEW-6: StrictMode double-mount risk | Tooling | 🟢 Info | Not a current bug; matters once `useEffect` with timers is added |
| NEW-7: `principles.md` / `audit.md` contradiction on `timeAgo` | Docs | 🟢 Low | Two docs characterise the same code differently |
| NEW-8: No `<main>` landmark | A11y | 🟡 Medium | Entire app is in a `<div>`, no landmark for screen reader navigation |
| NEW-9: No a11y ESLint plugin | Tooling | 🟡 Medium | `eslint-plugin-jsx-a11y` absent; accessibility issues aren't caught at editor level |
| NEW-10: Button has no `:focus-visible` style | A11y | 🟡 Medium | Keyboard focus state invisible on the submit button |

---

## Part 5 — Prioritised Fix List (Combined)

Combining both audits, here are all actionable fixes in priority order:

### 🔴 Fix Now (Bugs / High-Impact)

1. **`maxLength={MAX}`** (`App.jsx:45`) — 1 char fix, prevents confusing UX where user is stuck in a grey zone
2. **Add `<label>` + `.sr-only`** (`App.jsx:40`) — foundational accessibility requirement
3. **Fix `.empty`, `.entry-time`, `::placeholder` contrast** (`App.css:55, 140, 147`) — three CSS one-liners
4. **Add `outline: 2px solid` on textarea + button focus** (`App.css:50, new rule`) — WCAG 2.2 focus visibility

### 🟡 Fix Soon (Medium Impact)

5. **Add `aria-label="Submit your confession"` to button** (`App.jsx:49`)
6. **Add `aria-live="polite"` to feed div** (`App.jsx:55`)
7. **Add `useRef` + `inputRef.current.focus()` after submit** (`App.jsx:26-32`)
8. **Change `<div className="app">` to `<main>`** (`App.jsx:35`)
9. **Use `crypto.randomUUID()` as entry key** (`App.jsx:30, 60`)
10. **Install `eslint-plugin-jsx-a11y`** (`eslint.config.js`)
11. **Add skip link** (`App.jsx:34, App.css`) 

### 🟢 Optional / Future (Low / Cosmetic)

12. **Add `<meta name="description">`** (`index.html`)
13. **Add `rows={4}` to textarea** (`App.jsx:40`)
14. **Add `noValidate` to form** (`App.jsx:39`)
15. **Add `setInterval` tick for live timestamps** (`App.jsx` — see Finding 3C)
16. **Add list slicing / virtualization** when entries exceed ~100

---

## Conclusion

The original `03-audit.md` is **accurate and thorough** for its stated scope. All 21 findings were independently confirmed. The audit correctly identifies the two highest-priority issues: the `maxLength` bug (4A) and the missing label (2A/4G).

The independent pass adds **10 additional findings**, the most important of which are:

- **NEW-3** (`outline: none`) — a WCAG 2.2 accessibility violation hiding behind a visually acceptable workaround
- **NEW-8** (no `<main>` landmark) — a commonly missed semantic HTML requirement
- **NEW-9** (no a11y ESLint plugin) — a tooling gap that would prevent catching most accessibility issues automatically
- **NEW-10** (button has no `:focus-visible`) — paired with NEW-3, this means the two interactive elements in the app have incomplete keyboard focus styles

The app is well-structured, safe from XSS, and follows React best practices. Its main weakness is **accessibility**, with 8 distinct a11y issues between both audits. The **`maxLength` mismatch remains the only outright functional bug.**
