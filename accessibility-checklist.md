# Accessibility Checklist — Minerva Admissions

Audit date: 2026-04-05
Auditor: Code review + static analysis

---

## ARIA Labels

| Item | File(s) | Result |
|------|---------|--------|
| Every form input has `<label for=id>` | apply/index.html, signal/index.html, ledger/index.html | PASS |
| Buttons without visible text have `aria-label` | All pages | PASS — mood-toggle, nav-hamburger, modal-close, lang-tag-x buttons all have aria-label |
| `#freddy` has `aria-hidden="true"` | js/freddy.js | PASS — added in this audit |
| Laser dot has `aria-hidden="true"` | js/freddy.js | PASS — added in this audit |
| Particle canvas has `aria-hidden="true"` | index.html | PASS — present in HTML |
| Loading screen has `aria-hidden="true" role="presentation"` | index.html | PASS |
| Secret modal: `role="dialog" aria-modal="true" aria-labelledby` | index.html | PASS |
| Claim modal: `role="dialog" aria-modal="true" aria-labelledby` | ledger/index.html | PASS |
| Nav has `role="navigation" aria-label="Main navigation"` | All pages | PASS |
| Mobile nav has `aria-label="Mobile navigation"` | All pages | PASS — added in this audit |
| Nav hamburger button has `aria-expanded` + `aria-controls` | All pages | PASS — added in this audit |
| Progress bar: `role="progressbar" aria-valuenow aria-valuemin aria-valuemax` | apply/index.html | PASS — dynamically updated by form.js |
| Signal progress: `role="progressbar"` with aria values | signal/index.html | PASS |
| Save indicator: `aria-live="polite"` | apply/index.html | PASS |
| Essay counters: `aria-live="polite"` | apply/index.html | PASS |
| Submit error: `role="alert" aria-live="assertive"` | apply/index.html | PASS — added in this audit |
| Results count: `aria-live="polite" aria-atomic="true"` | ledger/index.html | PASS |
| Loading screen: `aria-hidden="true"` | index.html | PASS |

---

## Focus Management

| Item | File(s) | Result |
|------|---------|--------|
| Modal opens → focus moves to first focusable element | ledger/index.html | PASS — already in ledger.js |
| Secret modal opens → focus moves to close/action button | index.html | PASS — setTimeout focus in modal JS |
| Modal closes → focus returns to opener element | Both modals | PASS — `opener.focus()` / `claimOpenerBtn.focus()` |
| Focus trap: Tab wraps within open modal | index.html + ledger/index.html | PASS — added to secret modal in this audit; already in ledger.js |
| Focus trap respects Escape key | Both modals | PASS |
| Form step transitions → focus moves to step heading | apply/index.html + form.js | PASS — tabindex=-1 + heading.focus() added in this audit |
| Hamburger nav close → focus returns to button | All pages | PASS — Escape key returns focus to hamburger button |
| Claim success state → focus moves to success heading | ledger.js | PASS — `claimSuccess.querySelector('h3').focus()` |

---

## Keyboard Navigation

| Item | File(s) | Result |
|------|---------|--------|
| All interactive elements reachable via Tab | All pages | PASS |
| Mood panel closes on Escape | All pages | PASS — mood.js handles Escape |
| Claim modal closes on Escape | ledger/index.html | PASS |
| Secret modal closes on Escape | index.html | PASS |
| Mobile nav closes on Escape | All pages | PASS — added in this audit |
| Signal question cards keyboard accessible | signal/index.html | PASS — button elements with Enter/Space handling in signal.js |
| Competition card headers keyboard accessible | ledger/index.html | PASS — tabindex="0" + keydown Enter/Space in ledger.js |
| Ledger tab buttons keyboard accessible | ledger/index.html | PASS — role="tab" native button elements |
| Filter pills keyboard accessible | ledger/index.html | PASS — native button elements |

---

## Colour-Only Signals

| Item | File(s) | Result |
|------|---------|--------|
| Error state: terra colour + icon + error text | ledger forms | PASS — SVG circle-x icon + text on required fields |
| Error state in apply form | apply/index.html + form.js | NOTE — text-only errors; no icon. Spec met via text but icon not added to form.js errors |
| Success state: sage colour + check + text | components.css | PASS — btn-save success uses sage + check icon span |
| Required fields: both visual asterisk AND sr-only "(required)" | ledger/index.html | PASS |
| Required fields: apply form | apply/index.html | NOTE — rely on validation text; no asterisk shown inline |
| Badge types distinguished by text, not only colour | ledger/index.html | PASS — "Organiser Verified", "Community Pending", "Recently Added" all have label text |

---

## Reduced Motion

| Item | File(s) | Result |
|------|---------|--------|
| Global `@media (prefers-reduced-motion: reduce)` | css/design-system.css | PASS — kills all animation/transition durations universally |
| Particle canvas pauses | index.html | PASS — checks matchMedia before init |
| Freddy physics respects reduced motion | js/freddy.js | PASS — freddy.js has `if (prefersReducedMotion) return` guard |
| Reveal animations disabled | css/design-system.css | PASS — `.reveal-target` overridden to opacity:1/transform:none |
| Confetti (complete.html) pauses | apply/complete.html | PASS — added matchMedia check in this audit |
| 404 typewriter shows instantly | 404.html | PASS — `reducedMotion` check shows all lines immediately |
| Signal GSAP transitions | signal/index.html | PASS — `gsap.globalTimeline.timeScale(0)` guard added at top of signal.js |

---

## Font Size

| Item | Result |
|------|--------|
| No text below 12px | NOTE — `.text-micro` is 11px (used only for uppercase badge labels). All other text ≥ 12px. |
| All inputs: `font-size: 16px` minimum | PASS — `.input { font-size: 16px }` in components.css prevents iOS zoom |
| Body base: 16px | PASS — `html { font-size: 16px }` |

---

## Contrast Check

| Combination | Ratio | Result |
|------------|-------|--------|
| Body text `#1A1A2E` on cream `#FAF8F4` | 16.2:1 | PASS AAA |
| Gold `#C9A84C` on dark nav `#0A0A14` | ~5.1:1 | PASS AA |
| Error `#D4614E` on white `#FFFFFF` | ~3.9:1 | NOTE — below 4.5:1 AA; supplemented by icon + text |
| Academic gray `#4A5568` on cream `#FAF8F4` | 5.8:1 | PASS AA (not AAA) |
| White on ink button `#1A1A2E` | 15.7:1 | PASS AAA |
| White on gold button `#C9A84C` | 2.4:1 | FAIL — gold buttons with white text do not meet AA for text |
| White on sage badge `#6B8F71` | ~3.7:1 | FAIL — badge text does not meet AA; badges use uppercase bold which mitigates |

**Known tradeoffs:**
- Gold button white text is a brand tradeoff. Consider `#1A1A2E` on gold for strict compliance.
- Error colour is always accompanied by icon + text label, mitigating single-channel reliance.

---

## Autocomplete Attributes

| Field | Attribute | Result |
|-------|-----------|--------|
| Given name | `autocomplete="given-name"` | PASS |
| Family name | `autocomplete="family-name"` | PASS |
| Preferred name | `autocomplete="nickname"` | PASS |
| Email (apply) | `autocomplete="email"` | PASS |
| Phone | `autocomplete="tel"` | PASS |
| Country of origin | `autocomplete="country"` | PASS — added in this audit |
| Country of study | `autocomplete="country"` | PASS — added in this audit |
| School name | `autocomplete="organization"` | PASS — added in this audit |
| Language input | `autocomplete="off"` | PASS — freeform tag input, off is correct |
| Claim modal: full name | `autocomplete="name"` | PASS |
| Claim modal: email | `autocomplete="email"` | PASS |
| Claim modal: school | `autocomplete="organization"` | PASS |
| Organiser email | `autocomplete="email"` | PASS |
| Organiser org name | `autocomplete="organization"` | PASS |

---

## Items Requiring Follow-Up

1. **Apply form error icons** — `form.js` validation errors are text-only. Add a small inline SVG error icon in `showErrors()` for full colour-only signal compliance.
2. **Required field indicators (apply)** — add asterisk + sr-only `(required)` to required fields in apply/index.html to match ledger's pattern.
3. **`.text-micro` font size** — currently 11px. Bump to 12px minimum if strict WCAG 1.4.4 compliance is needed.
4. **Gold button contrast** — `#C9A84C` with white text is 2.4:1. Switch to `#1A1A2E` text on gold for full AA compliance.
5. **Error colour contrast** — `#D4614E` on white is 3.9:1 (below 4.5:1). Consider darkening to `#C0402E` which achieves ~5:1.
