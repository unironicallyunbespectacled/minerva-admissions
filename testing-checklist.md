# Testing Checklist — Minerva Admissions

Manual testing checklist. Mark each item pass/fail after testing in browser.
Last updated: 2026-04-05

---

## Core Functionality

| # | Test | Expected | Status |
|---|------|----------|--------|
| 1 | Loading animation plays on index.html | Ensō draws, pulses, spins out; confetti bursts; site fades in at ~4s | [ ] |
| 2 | Freddy appears and follows cursor | Freddy div moves with spring physics toward cursor | [ ] |
| 3 | Freddy enters sleep state after 3 minutes idle | Zzz bubble appears above Freddy | [ ] |
| 4 | Freddy wakes on mouse movement | Zzz disappears, yawn animation plays | [ ] |
| 5 | Mood selector opens via nav button | Chromatic-glass panel appears below nav button | [ ] |
| 6 | Each mood changes theme | Data-mood attribute changes; accent colours update | [ ] |
| 7 | LOCKED IN mood freezes Freddy | Freddy falls asleep; all CSS animations pause | [ ] |
| 8 | INSPIRED mood applies gold shimmer | Headings get gradient shimmer; collar glows | [ ] |
| 9 | Mood persists across page refresh | Same mood is active on reload | [ ] |
| 10 | Cookie consent appears on first visit | After ~5s, consent toast with Freddy appears | [ ] |
| 11 | Cookie Decline droops Freddy's ears | Ear droop animation plays; consent dismisses | [ ] |

---

## Visual Polish

| # | Test | Expected | Status |
|---|------|----------|--------|
| 12 | Particle system plays on index.html hero | 60 particles move slowly, connected by lines when within 120px | [ ] |
| 13 | Mouse movement repels particles | Particles drift away from cursor within 100px | [ ] |
| 14 | Particles pause when tab is hidden | Switch tab; particles freeze; return tab; resume | [ ] |
| 15 | Particle system pauses on prefers-reduced-motion | Enable OS reduced motion; particles do not appear | [ ] |
| 16 | Feature cards reveal on scroll | Cards fade+slide up with 80ms stagger on entering viewport | [ ] |
| 17 | Bento grid layout on desktop | Left card (Signal Not Noise) is wider (~60%); two right cards stack | [ ] |
| 18 | Bento grid collapses to 2-col at tablet | 768px: two columns | [ ] |
| 19 | Bento grid collapses to single column at mobile | 480px: all cards stacked | [ ] |
| 20 | Card hover: translateY(-2px) + border darkening | Smooth 200ms ease-out on all feature cards | [ ] |
| 21 | Focus ring is 3px gold on all buttons | Tab to any button: visible gold outline | [ ] |
| 22 | Dark mode applies correctly | Enable system dark mode: backgrounds, text, borders all update | [ ] |
| 23 | Hamburger nav appears at ≤768px | Nav links hide; hamburger icon appears | [ ] |
| 24 | Hamburger menu opens/closes | Click hamburger; mobile nav slides in; Escape or outside click closes | [ ] |
| 25 | Hamburger menu works on all pages | index, apply, signal, ledger all have working hamburger | [ ] |
| 26 | Print layout (index.html) | Cmd/Ctrl+P: nav, Freddy, particles hidden; content readable | [ ] |
| 27 | Print layout (apply) | Form content visible; Freddy, nav hidden | [ ] |

---

## Application Form (apply/index.html)

| # | Test | Expected | Status |
|---|------|----------|--------|
| 28 | Form loads at Step 1 | Progress at 0%; Step 1 fields visible | [ ] |
| 29 | Form auto-saves on field change | "Draft saved — you can come back any time" appears | [ ] |
| 30 | Form restores draft on return | Revisiting shows data + "Your application is waiting for you" | [ ] |
| 31 | Empty required field submit shows error | Error message appears with icon + text | [ ] |
| 32 | Step transition animates | Slide left/right between steps | [ ] |
| 33 | Focus moves to step heading on transition | Screen reader announces step title on step change | [ ] |
| 34 | "Continue →" buttons advance the form | Renamed from "Next →" | [ ] |
| 35 | "← Previous step" buttons go back | Renamed from "← Back" | [ ] |
| 36 | Essay 1 help text visible | "This is not asking for a policy proposal..." appears above textarea | [ ] |
| 37 | Essay 2 help text visible | "This could be physics, cooking..." appears above textarea | [ ] |
| 38 | GPA help text is contextual | "Use your school's scale. We will ask for context..." | [ ] |
| 39 | Essay word counter works | Counter updates as user types | [ ] |
| 40 | Essay at 50% word count turns counter gold | Counter text colour changes to gold temporarily | [ ] |
| 41 | Language tags add/remove | Typing language + Enter adds tag; × removes it | [ ] |
| 42 | Accomplishment blocks add up to 6 | Add button works; disabled after 6 | [ ] |
| 43 | Review step shows all entered data | Step 6 renders summary of all previous answers | [ ] |
| 44 | Submit redirects to complete.html | After 1.5s spinner, redirects | [ ] |
| 45 | Trust signals visible below form | Three trust items with icons visible on form | [ ] |
| 46 | Submit error uses assertive aria-live | Submit without checking boxes; error announced | [ ] |

---

## Complete Page (apply/complete.html)

| # | Test | Expected | Status |
|---|------|----------|--------|
| 47 | Confetti falls continuously | Gold/navy/white confetti particles animate | [ ] |
| 48 | Freddy with party hat bounces | Freddy spins in, then bobs; tail wags | [ ] |
| 49 | Confetti pauses on reduced motion | Enable reduced motion; confetti canvas hidden | [ ] |
| 50 | Back to Minerva link works | Link navigates to index.html | [ ] |

---

## Signal Not Noise (signal/index.html)

| # | Test | Expected | Status |
|---|------|----------|--------|
| 51 | Signal Not Noise loads Stage 1 | 5 question cards visible | [ ] |
| 52 | Question cards reveal with stagger | Cards fade in with 80ms stagger | [ ] |
| 53 | Selecting a question shows answer area | Answer textarea slides in | [ ] |
| 54 | Back button says "← Previous step" | Renamed from "← Back" | [ ] |
| 55 | GSAP transition plays between screens | Slide left on continue | [ ] |
| 56 | Depth follow-up questions match selection | Q2 follow-ups differ from Q1 follow-ups | [ ] |
| 57 | Stage 4 runs keyword analysis | 4–6 quality items appear with staggered animation | [ ] |
| 58 | Export paragraph generates from answers | Stage 6 shows paragraph built from user text | [ ] |
| 59 | Copy to clipboard works | Button text changes to "Copied ✓" | [ ] |

---

## Verification Ledger (ledger/index.html)

| # | Test | Expected | Status |
|---|------|----------|--------|
| 60 | Competitions load from JSON | Cards appear for all 15 seed competitions | [ ] |
| 61 | Cards reveal with stagger via IntersectionObserver | Cards fade in sequentially on load | [ ] |
| 62 | Ledger search filters in real-time | Typing filters cards as user types | [ ] |
| 63 | Region filter pills work | "Nigeria" pill shows only Nigerian competitions | [ ] |
| 64 | Not-found text: "We do not have X yet. Be the first to add it." | Updated copy | [ ] |
| 65 | Competition card expands on click | Results table and action buttons appear | [ ] |
| 66 | Claim modal opens from card | Modal overlays page with correct competition name | [ ] |
| 67 | Claim modal closes on Escape | Modal dismisses, focus returns to claim button | [ ] |
| 68 | Claim form submits and shows success | Form hides, success message appears | [ ] |

---

## Easter Eggs

| # | Test | Expected | Status |
|---|------|----------|--------|
| 69 | Konami code triggers confetti | ↑↑↓↓←→←→BA → confetti burst + toast | [ ] |
| 70 | 404 page displays Socratic dialogue | `/404.html` shows typewriter dialogue | [ ] |
| 71 | Console shows ASCII art + message | Open DevTools → Ensō + gold text in console | [ ] |
| 72 | 7-click wordmark opens secret modal | Click MINERVA 7× within 5s → typewriter modal | [ ] |
| 73 | Secret modal closes on Escape + returns focus | Escape closes; focus back to MINERVA wordmark | [ ] |

---

## Technical / Accessibility

| # | Test | Expected | Status |
|---|------|----------|--------|
| 74 | No JS errors in console on any page | DevTools console shows no red errors | [ ] |
| 75 | Site works at 375px viewport width | No horizontal scroll; all content accessible | [ ] |
| 76 | Tab navigation works through form | Tab key moves through all form inputs in order | [ ] |
| 77 | All internal nav links work | Apply, Signal, Ledger nav links navigate correctly | [ ] |
| 78 | Dark mode (prefers-color-scheme: dark) | Enabling system dark mode updates surface/text colours | [ ] |
| 79 | Reduced motion stops all animations | Enable in OS accessibility settings; no motion on any page | [ ] |
| 80 | Google Fonts load (with network) | DM Sans and Playfair Display render correctly | [ ] |
| 81 | Google Fonts fallback (no network) | system-ui fallback renders legibly | [ ] |
| 82 | All asset paths work from subdirectories | apply/, signal/, ledger/ pages load CSS/JS (relative paths) | [ ] |
| 83 | All inputs have font-size ≥ 16px (no zoom on iOS) | No auto-zoom on iOS when focusing inputs | [ ] |
| 84 | All tap targets ≥ 44×44px | Buttons, links, pills all large enough on mobile | [ ] |

---

## Scoring

Pass count: __ / 84
Date tested: ___________
Tester: ___________
Browser/OS: ___________
