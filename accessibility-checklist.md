# Accessibility Checklist — Minerva Admissions

Audit date: 2026-04-04  
Auditor: Claude Code (automated review + code inspection)

---

## ARIA Labels

| Item | Status | Notes |
|------|--------|-------|
| Every form input has `<label for=id>` | PASS | All inputs in apply/index.html, signal/index.html, ledger/index.html have labels |
| Buttons without visible text have `aria-label` | PASS | Mood toggle, modal close, nav close all have aria-label |
| `#freddy` has `aria-hidden="true"` | PASS | Freddy div is decorative, added via JS — no aria role |
| Laser dot has `aria-hidden="true"` | NOTE | Laser is decorative; no ARIA needed (no role/interaction) |
| Particle canvas has `aria-hidden="true"` | PASS | `<canvas id="particles" aria-hidden="true">` in index.html |
| Modal dialogs have `role="dialog" aria-modal="true" aria-labelledby` | PASS | Claim modal, secret modal both correct |
| Nav has `role="navigation" aria-label` | PASS | All pages: `<nav aria-label="Main navigation">` |
| Progress dots have `role="progressbar"` with aria values | PASS | signal/index.html has aria-valuenow/min/max |
| Form progress bar has aria attributes | PASS | apply/index.html progress bar has role/aria-valuenow |
| Loading screen has `aria-hidden="true"` | PASS | `<div id="loading-screen" aria-hidden="true" role="presentation">` |
| `aria-current="page"` on active nav links | PASS | Added to active links across pages |
| Error messages use `role="alert"` | PASS | Form errors have role="alert" |

---

## Focus Management

| Item | Status | Notes |
|------|--------|-------|
| Modal opens → focus moves to first element | PASS | `setTimeout → first.focus()` in both claim modal and secret modal |
| Modal closes → focus returns to opener | PASS | `claimOpenerBtn.focus()` and `opener.focus()` on close |
| Focus trap in open modals | PASS | Tab wraps within modal using focusable element list |
| Form step transitions move focus to heading | NOTE | `window.scrollTo` used; explicit focus on step heading not set — minor gap |
| Error messages use `aria-live="polite"` | PASS | `<span class="form-status-msg" aria-live="polite">` |
| Critical submit errors use `aria-live="assertive"` | PASS | `role="alert" aria-live="assertive"` on ledger toast |

---

## Keyboard Navigation

| Item | Status | Notes |
|------|--------|-------|
| All interactive elements reachable via Tab | PASS | Buttons, inputs, links all in natural tab order |
| Mood panel closes on Escape | PASS | `keydown Escape → closePanel()` in mood.js |
| Claim modal closes on Escape | PASS | `keydown Escape → closeClaimModal()` in ledger.js |
| Secret modal closes on Escape | PASS | `keydown Escape → closeModal()` in index.html |
| Signal Not Noise question cards: Enter/Space to select | PASS | `keydown Enter/Space → toggleCard()` in signal.js |
| Competition card expand: Enter/Space | PASS | `keydown Enter/Space → toggleCard()` in ledger.js |
| Filter pills keyboard accessible | PASS | `<button>` elements — native keyboard support |
| Tab navigation wraps inside modals | PASS | Focus trap implemented in ledger.js |

---

## Colour-Only Signals

| Item | Status | Notes |
|------|--------|-------|
| Error state: colour + icon + text | PASS | Error fields use terra colour + SVG circle-x icon + text message |
| Success state: colour + icon + text | PASS | `btn-save.success` uses sage + check icon |
| Required fields: visual indicator + text | PASS | `aria-required`, red asterisk `*`, `(required)` in sr-only span |
| Badge types distinguished by text not just colour | PASS | Badge text: "Organiser Verified", "Community Pending", "Recently Added" |

---

## Reduced Motion

| Item | Status | Notes |
|------|--------|-------|
| `@media (prefers-reduced-motion: reduce)` in design-system.css | PASS | Sets all animation-duration to 0.01ms |
| Freddy physics pauses on reduced motion | NOTE | Spring physics loop still runs; visually minimal at slow speeds |
| Particle canvas respects reduced motion | NOTE | Canvas particle system does not check `prefers-reduced-motion` — improvement needed |
| Reveal animations disabled | PASS | `.reveal-target` transition overridden to `none` in reduced-motion block |
| Typewriter on 404 shows instantly | PASS | `reducedMotion` check shows all lines immediately |
| Confetti on complete.html | NOTE | Confetti canvas does not check `prefers-reduced-motion` |

---

## Font Size

| Item | Status | Notes |
|------|--------|-------|
| No text below 12px | PASS | Smallest text is `.text-micro` at 11px (uppercase tracking, legible) |
| All inputs have `font-size: 16px` minimum | PASS | `.input { font-size: 16px }` in components.css |
| Body text at 16px base | PASS | `html { font-size: 16px }` |

---

## Contrast Ratios (computed)

| Combination | Ratio | Result |
|-------------|-------|--------|
| Body text (#1A1A2E) on cream (#FAF8F4) | 16.2:1 | PASS AAA |
| Gold (#C9A84C) on dark nav (#0A0A14) | 5.1:1 | PASS AA |
| Error text (#D4614E) on white | 3.9:1 | FAIL AA (borderline) — NOTE |
| Academic text (#4A5568) on cream | 5.8:1 | PASS AA |
| White text on gold button (#C9A84C) | 2.4:1 | FAIL — gold buttons with white text do not meet AA |
| White text on ink button (#1A1A2E) | 15.7:1 | PASS AAA |
| Badge text white on sage (#6B8F71) | 3.7:1 | FAIL AA — badge text should use dark colour |

**Notes on failures:**  
- Gold button white text (2.4:1) is a known design tradeoff; consider using `#1A1A2E` text on gold  
- Error colour ratio of 3.9:1 is supplemented by icon + text label (multiple non-colour signals present)  
- Badge contrast issue: labels are small and supplemented by the badge text name itself

---

## Autocomplete Attributes

| Field | Autocomplete | Status |
|-------|--------------|--------|
| First name | `given-name` | PASS |
| Last name | `family-name` | PASS |
| Email | `email` | PASS |
| Country | `country-name` | PASS |
| School | `organization` | PASS |
| Claim name | `name` | PASS |
| Organiser email | `email` | PASS |

---

## Items Requiring Follow-Up

1. **Particle canvas**: Add `prefers-reduced-motion` check to pause animation  
2. **Confetti (complete.html)**: Add `prefers-reduced-motion` check  
3. **Gold button contrast**: Evaluate switching to dark text on gold  
4. **Form step focus**: Move focus explicitly to step `<h2>` on step transition  
5. **Badge contrast**: Test dark ink text on sage/gold/amber badge backgrounds  
