# Testing Checklist — Minerva Admissions

Manual testing checklist. Mark each item pass/fail after testing in browser.

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

## Application Form (apply/index.html)

| # | Test | Expected | Status |
|---|------|----------|--------|
| 12 | Form loads at Step 1 | Progress at 0%; Step 1 fields visible | [ ] |
| 13 | Form auto-saves on field change | Auto-save dot appears; localStorage updated | [ ] |
| 14 | Form restores draft on return | Revisiting page shows previously entered data | [ ] |
| 15 | Empty required field submit shows error | Error message appears with icon + text | [ ] |
| 16 | Step transition animates | Slide left/right between steps | [ ] |
| 17 | Essay word counter works | Counter updates as user types | [ ] |
| 18 | Essay at 50% word count turns counter gold | Counter text colour changes to gold temporarily | [ ] |
| 19 | Essay at word limit brightens submit button | Next button gets btn-gold class | [ ] |
| 20 | Language tags add/remove | Typing language + Enter adds tag; × removes it | [ ] |
| 21 | Accomplishment blocks add up to 6 | Add button works; disabled after 6 | [ ] |
| 22 | Review step shows all entered data | Step 6 renders summary of all previous answers | [ ] |
| 23 | Edit links in review step jump back | "Edit" link beside each section goes to correct step | [ ] |
| 24 | Submit redirects to complete.html | After 1.5s spinner, redirects | [ ] |

---

## Complete Page (apply/complete.html)

| # | Test | Expected | Status |
|---|------|----------|--------|
| 25 | Confetti falls continuously | Gold/navy/white confetti particles animate | [ ] |
| 26 | Freddy with party hat bounces | Freddy spins in, then bobs; tail wags | [ ] |
| 27 | Back to Minerva link works | Link navigates to index.html | [ ] |

---

## Signal Not Noise (signal/index.html)

| # | Test | Expected | Status |
|---|------|----------|--------|
| 28 | Signal Not Noise loads Stage 1 | 5 question cards visible | [ ] |
| 29 | Selecting a question shows answer area | Answer textarea slides in | [ ] |
| 30 | GSAP transition plays between screens | Slide left on continue | [ ] |
| 31 | Depth follow-up questions match selection | Q2 follow-ups differ from Q1 follow-ups | [ ] |
| 32 | Context form saves to state | Returning to screen 5 shows previously entered data | [ ] |
| 33 | Stage 4 runs keyword analysis | 4–6 quality items appear with staggered animation | [ ] |
| 34 | Revise button goes back to screen 1 | Screen 1 loads with back-slide animation | [ ] |
| 35 | Authenticity radio selection works | Pill highlights on selection | [ ] |
| 36 | Export paragraph generates from answers | Stage 6 shows paragraph built from user text | [ ] |
| 37 | Copy to clipboard works | Button text changes to "Copied ✓" | [ ] |
| 38 | Signal state saves to localStorage | Refreshing page restores current screen | [ ] |

---

## Verification Ledger (ledger/index.html)

| # | Test | Expected | Status |
|---|------|----------|--------|
| 39 | Competitions load from JSON | Cards appear for all 15 seed competitions | [ ] |
| 40 | Ledger search filters in real-time | Typing filters cards as user types | [ ] |
| 41 | Region filter pills work | "Nigeria" pill shows only Nigerian competitions | [ ] |
| 42 | Not-found state appears on no results | "We do not have X yet" message with add button | [ ] |
| 43 | Not-found add button pre-fills form | Add Competition form opens with search term filled | [ ] |
| 44 | Competition card expands on click | Results table and action buttons appear | [ ] |
| 45 | Only one card is open at a time | Opening a second card closes the first | [ ] |
| 46 | Claim modal opens from card | Modal overlays page with correct competition name | [ ] |
| 47 | Claim modal closes on Escape | Modal dismisses, focus returns to claim button | [ ] |
| 48 | Claim form submits and shows success | Form hides, success message appears | [ ] |
| 49 | Claimed result appears in results table | After claim, "Pending Review" row added to table | [ ] |
| 50 | Vouch button increments count | Vouch count increases; "Vouched ✓" shown | [ ] |
| 51 | 3 vouches upgrades badge | Status changes from Community Pending to Community Verified | [ ] |
| 52 | Add Competition form submits | New card appears in results with Recently Added badge | [ ] |
| 53 | For Organisers tab switches panel | Organiser panel becomes visible | [ ] |
| 54 | Organiser form submits | Success message with email address shown | [ ] |

---

## Easter Eggs

| # | Test | Expected | Status |
|---|------|----------|--------|
| 55 | Konami code triggers confetti | ↑↑↓↓←→←→BA → 50 confetti divs burst + toast | [ ] |
| 56 | Konami toast dismisses after 4s | Auto-dismisses; "Worth a try" button dismisses immediately | [ ] |
| 57 | 404 page displays Socratic dialogue | `/404.html` shows typewriter dialogue | [ ] |
| 58 | Console shows ASCII art + message | Open DevTools → Ensō + gold text in console | [ ] |
| 59 | HTML source comment visible | View source of index.html → discovery comment in `<head>` | [ ] |
| 60 | 7-click wordmark opens secret modal | Click MINERVA 7× within 5s → typewriter modal | [ ] |
| 61 | Secret modal closes on Escape | Escape key closes modal, focus returns to wordmark | [ ] |
| 62 | Birthday mode on April 1 | Freddy has party hat; cupcake laser; birthday toast | [ ] |
| 63 | Samsung browser shows dragon briefly | On Samsung Internet → dragon SVG flashes then Freddy returns | [ ] |
| 64 | Night owl mode between 1am–4am | Toast appears: "Night owl mode active..." | [ ] |

---

## Technical

| # | Test | Expected | Status |
|---|------|----------|--------|
| 65 | No JS errors in console on any page | DevTools console shows no red errors | [ ] |
| 66 | Site works at 375px viewport width | No horizontal scroll; all content accessible | [ ] |
| 67 | Tab navigation works through form | Tab key moves through all form inputs in order | [ ] |
| 68 | All internal nav links work | Apply, Signal, Ledger nav links navigate correctly | [ ] |
| 69 | Dark mode (prefers-color-scheme: dark) | Enabling system dark mode updates surface/text colours | [ ] |
| 70 | Reduced motion (prefers-reduced-motion) | Enabling in accessibility settings stops animations | [ ] |
| 71 | Google Fonts load (with network) | DM Sans and Playfair Display render correctly | [ ] |
| 72 | Google Fonts fallback (no network) | system-ui fallback renders legibly | [ ] |
| 73 | All asset paths work from subdirectories | apply/, signal/, ledger/ pages load their CSS/JS | [ ] |

---

## Scoring

Pass count: __ / 73  
Date tested: ___________  
Tester: ___________  
Browser/OS: ___________
