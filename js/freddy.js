/* ═══════════════════════════════════════════════════════════════
   FREDDY — spring-physics cursor companion  v2.0
   js/freddy.js

   Sections:
    1.  Constants & flags
    2.  Cursor ring + laser dot
    3.  Freddy SVG (multi-state: sitting, lying, rizz)
    4.  Dragon SVG (Samsung easter egg)
    5.  Costume overlays (mood-driven accessories)
    6.  DOM creation
    7.  Spring physics state
    8.  Mouse tracking
    9.  Idle / sleep / lying / rizz timers
   10.  Button bat
   11.  State management
   12.  Animation loop (rAF)
   13.  Night owl mode   (1 am – 4 am)
   14.  Birthday mode    (April 1)
   15.  Samsung easter egg
   16.  Click particle system
   17.  Haptics
   18.  Mood costume system
   19.  Konami code
   20.  Console message
═══════════════════════════════════════════════════════════════ */

(function () {
  'use strict';

  /* ─────────────────────────────────────────────────────────────
     1. CONSTANTS & FLAGS
  ───────────────────────────────────────────────────────────── */
  const SPRING             = 0.025;
  const DAMPING            = 0.88;
  const IDLE_LYING_MS      = 3 * 60 * 1000;   // 3 min → lying down
  const IDLE_RIZZ_MS       = 5 * 60 * 1000;   // 5 min → 30% rizz
  const BAT_RADIUS         = 200;
  const SIDE_OFFSET        = 48;               // px between cursor and Freddy

  const _d     = new Date();
  const _month = _d.getMonth() + 1;
  const _day   = _d.getDate();
  const _hour  = _d.getHours();

  const IS_BIRTHDAY  = _month === 4 && _day === 1;
  const IS_NIGHT_OWL = _hour >= 1 && _hour < 4;
  const IS_SAMSUNG   = /SamsungBrowser/i.test(navigator.userAgent);
  const IS_TOUCH     = window.matchMedia('(hover: none) and (pointer: coarse)').matches;

  // Don't run on touch devices
  if (IS_TOUCH) return;


  /* ─────────────────────────────────────────────────────────────
     2. CURSOR RING + LASER DOT
  ───────────────────────────────────────────────────────────── */

  // Hide default cursor
  document.body.style.cursor = 'none';

  const _cursorStyle = document.createElement('style');
  _cursorStyle.textContent =
    'input,textarea,select,[contenteditable]{cursor:text    !important;}' +
    'a,button,.btn,[role="button"],label     {cursor:pointer !important;}';
  document.head.appendChild(_cursorStyle);

  // Cursor ring — organic Enso path, gold, breathing
  const cursorRing = document.createElement('div');
  cursorRing.id = 'cursor-ring';
  cursorRing.setAttribute('aria-hidden', 'true');
  cursorRing.innerHTML =
    '<svg viewBox="0 0 80 80" width="80" height="80" xmlns="http://www.w3.org/2000/svg" overflow="visible">' +
      '<path d="M40,5 C60,5 74,19 74,40 C74,61 60,75 40,75 C20,75 6,61 6,40 C6,22 17,8 34,6"' +
        ' stroke="rgba(201,168,76,0.35)" stroke-width="1.5" fill="none" stroke-linecap="round"/>' +
    '</svg>';
  Object.assign(cursorRing.style, {
    left: '-200px',
    top:  '-200px',
  });
  document.body.appendChild(cursorRing);

  // Laser dot
  const laser = document.createElement('div');
  laser.id = 'laser-dot';
  laser.setAttribute('aria-hidden', 'true');

  if (IS_BIRTHDAY) {
    laser.textContent = '🧁';
    Object.assign(laser.style, {
      position:      'fixed',
      fontSize:      '20px',
      lineHeight:    '1',
      pointerEvents: 'none',
      zIndex:        '9999',
      transform:     'translate(-50%, -50%)',
      top:           '-100px',
      left:          '-100px',
    });
  } else {
    Object.assign(laser.style, {
      position:      'fixed',
      width:         '8px',
      height:        '8px',
      background:    '#FF3B30',
      borderRadius:  '50%',
      pointerEvents: 'none',
      zIndex:        '9999',
      boxShadow:     '0 0 20px rgba(255,59,48,0.15)',
      transform:     'translate(-50%, -50%)',
      top:           '-100px',
      left:          '-100px',
      willChange:    'left, top',
    });
  }
  document.body.appendChild(laser);


  /* ─────────────────────────────────────────────────────────────
     3. FREDDY SVG — multi-state base (60×60 viewBox)
        State layers toggled via CSS classes on #freddy:
          .freddy-sitting .freddy-walking .freddy-running
          .freddy-sprinting .freddy-sleeping .freddy-lying .freddy-rizz
  ───────────────────────────────────────────────────────────── */
  const FREDDY_SVG = `
<svg id="freddy-svg"
     viewBox="0 0 60 60" width="60" height="60"
     overflow="visible"
     xmlns="http://www.w3.org/2000/svg">

  <!-- Tail -->
  <path id="freddy-tail"
        d="M40,48 C52,42 58,32 53,22"
        fill="none" stroke="#DDDBD4" stroke-width="5.5" stroke-linecap="round"/>

  <!-- Body -->
  <polygon points="18,53 30,49 42,53 40,34 20,34" fill="#F0EFE9"/>
  <polygon points="22,34 38,34 36,44 24,44"        fill="#E6E4DE" opacity="0.6"/>

  <!-- Front paws (sitting) -->
  <ellipse id="paw-l" cx="22" cy="53" rx="4" ry="3" fill="#F0EFE9"/>
  <ellipse id="paw-r" cx="38" cy="53" rx="4" ry="3" fill="#F0EFE9"/>

  <!-- Running legs (hidden unless .freddy-running/.freddy-sprinting) -->
  <g id="run-legs">
    <line id="leg-fl" x1="22" y1="50" x2="12" y2="60" stroke="#F0EFE9" stroke-width="5" stroke-linecap="round"/>
    <line id="leg-fr" x1="38" y1="50" x2="48" y2="60" stroke="#F0EFE9" stroke-width="5" stroke-linecap="round"/>
    <line id="leg-bl" x1="20" y1="52" x2="8"  y2="52" stroke="#DDDBD4" stroke-width="4.5" stroke-linecap="round"/>
    <line id="leg-br" x1="40" y1="52" x2="52" y2="52" stroke="#DDDBD4" stroke-width="4.5" stroke-linecap="round"/>
  </g>

  <!-- Head -->
  <circle cx="30" cy="21" r="13" fill="#F5F4F0"/>
  <polygon points="17,21 30,8 30,34" fill="#ECEAE4" opacity="0.4"/>

  <!-- Ears -->
  <polygon id="ear-l"  points="16,16 21,6 27,15"    fill="#F5F4F0"/>
  <polygon             points="18,15.5 21,8 25.5,15" fill="#F0BFC8" opacity="0.75"/>
  <polygon id="ear-r"  points="33,15 39,6 44,16"    fill="#F5F4F0"/>
  <polygon             points="34.5,15 39,8 42,15.5" fill="#F0BFC8" opacity="0.75"/>

  <!-- Eyes -->
  <circle cx="24.5" cy="20" r="4.5" fill="#1A1A2E"/>
  <circle cx="35.5" cy="20" r="4.5" fill="#1A1A2E"/>
  <!-- Eye shine -->
  <circle cx="25.9" cy="18.7" r="1.6" fill="white"/>
  <circle cx="36.9" cy="18.7" r="1.6" fill="white"/>
  <!-- Eye lids — scaleY(0)=open, scaleY(1)=closed -->
  <rect id="eye-lid-l" x="20"  y="15.5" width="9" height="9" rx="1" fill="#F5F4F0"/>
  <rect id="eye-lid-r" x="31" y="15.5" width="9" height="9" rx="1" fill="#F5F4F0"/>

  <!-- Rizz eyes (half-closed confident, hidden by default) -->
  <g id="rizz-eyes" style="display:none">
    <ellipse cx="24.5" cy="20" rx="4.5" ry="2.5" fill="#1A1A2E"/>
    <ellipse cx="35.5" cy="20" rx="4.5" ry="2.5" fill="#1A1A2E"/>
    <circle cx="25.9" cy="19.5" r="1.2" fill="white"/>
    <circle cx="36.9" cy="19.5" r="1.2" fill="white"/>
    <!-- Smirk -->
    <path d="M27,27 Q32,29.5 34,27.5" fill="none" stroke="#D4A0AC" stroke-width="1.1" stroke-linecap="round"/>
  </g>

  <!-- Blush marks -->
  <ellipse cx="20" cy="26" rx="3.5" ry="2" fill="#F0A0B5" opacity="0.35"/>
  <ellipse cx="40" cy="26" rx="3.5" ry="2" fill="#F0A0B5" opacity="0.35"/>

  <!-- Nose + mouth -->
  <ellipse cx="30" cy="25.5" rx="2" ry="1.4" fill="#F0A0B5"/>
  <path id="freddy-mouth" d="M27.8,27 Q30,29.2 32.2,27"
        fill="none" stroke="#D4A0AC" stroke-width="0.9" stroke-linecap="round"/>

  <!-- Whiskers -->
  <line x1="12" y1="24"   x2="26" y2="25.5" stroke="#C8C6BE" stroke-width="0.65" opacity="0.8"/>
  <line x1="11" y1="26.5" x2="25" y2="27.2" stroke="#C8C6BE" stroke-width="0.65" opacity="0.8"/>
  <line x1="34" y1="25.5" x2="48" y2="24"   stroke="#C8C6BE" stroke-width="0.65" opacity="0.8"/>
  <line x1="35" y1="27.2" x2="49" y2="26.5" stroke="#C8C6BE" stroke-width="0.65" opacity="0.8"/>

  <!-- Gold collar + bell -->
  <path d="M19,32 Q30,36 41,32"
        fill="none" stroke="#C9A84C" stroke-width="3.5" stroke-linecap="round"/>
  <circle cx="30" cy="35"   r="2.5" fill="#B8963E"/>
  <line   x1="30" y1="36.5" x2="30" y2="38" stroke="#8A6B20" stroke-width="0.9"/>

  <!-- Party hat (hidden by default) -->
  <g id="party-hat-group" style="display:none">
    <polygon points="30,1 23,14 37,14"        fill="#C9A84C"/>
    <polygon points="30,2 25,13 35,13"        fill="#B8963E" opacity="0.5"/>
    <circle  cx="30" cy="1.5" r="1.5"        fill="#F5F4F0"/>
    <circle  cx="24" cy="13"  r="1.3"        fill="#FF3B30"/>
    <circle  cx="36" cy="13"  r="1.3"        fill="#30D158"/>
    <line    x1="22" y1="14" x2="38" y2="14" stroke="#B8963E" stroke-width="1"/>
  </g>

</svg>`;


  /* ─────────────────────────────────────────────────────────────
     4. DRAGON SVG (Samsung easter egg)
  ───────────────────────────────────────────────────────────── */
  const DRAGON_SVG = `
<svg id="freddy-svg" viewBox="0 0 60 60" width="60" height="60"
     overflow="visible" xmlns="http://www.w3.org/2000/svg">
  <polygon points="12,28  0,9  18,34" fill="#C9A84C" opacity="0.72"/>
  <polygon points="48,28 60,9 42,34"  fill="#C9A84C" opacity="0.72"/>
  <polygon points="30,5 46,20 50,38 30,53 10,38 14,20" fill="#C9A84C"/>
  <polygon points="30,12 40,24 30,36 20,24" fill="#B8963E"/>
  <polygon points="24,8  30,3  28,13" fill="#F0D080"/>
  <polygon points="30,5  36,2  34,11" fill="#F0D080"/>
  <polygon points="36,8  42,5  38,14" fill="#F0D080"/>
  <circle cx="24"   cy="22" r="3.5" fill="#1A1A2E"/>
  <circle cx="36"   cy="22" r="3.5" fill="#1A1A2E"/>
  <circle cx="25.2" cy="21" r="1.2" fill="#FF3B30"/>
  <circle cx="37.2" cy="21" r="1.2" fill="#FF3B30"/>
  <path d="M36,50 C44,55 50,50 54,57"
        stroke="#C9A84C" stroke-width="4" fill="none" stroke-linecap="round"/>
  <polygon points="52,55 57,60 53,58.5" fill="#B8963E"/>
</svg>`;


  /* ─────────────────────────────────────────────────────────────
     5. COSTUME SVG DEFINITIONS (mood-driven accessories)
  ───────────────────────────────────────────────────────────── */

  // Crown for INSPIRED
  const CROWN_SVG =
    '<svg id="costume-crown" viewBox="0 0 60 20" width="60" height="20" ' +
    'style="position:absolute;top:-14px;left:0;pointer-events:none;" ' +
    'xmlns="http://www.w3.org/2000/svg" overflow="visible">' +
      '<polygon points="30,0 22,9 16,3 18,13 42,13 44,3 38,9" fill="#C9A84C"/>' +
      '<rect x="18" y="12" width="24" height="3" rx="1" fill="#B8963E"/>' +
      '<circle cx="30" cy="1.5" r="2"   fill="#F7E08A"/>' +
      '<circle cx="18" cy="5"   r="1.5" fill="#F7E08A"/>' +
      '<circle cx="42" cy="5"   r="1.5" fill="#F7E08A"/>' +
    '</svg>';

  // Glasses for CURIOUS (50%)
  const GLASSES_SVG =
    '<svg id="costume-glasses" viewBox="0 0 60 12" width="60" height="12" ' +
    'style="position:absolute;top:12px;left:0;pointer-events:none;" ' +
    'xmlns="http://www.w3.org/2000/svg" overflow="visible">' +
      '<circle cx="24.5" cy="6" r="6.5" fill="none" stroke="#C9A84C" stroke-width="1.3"/>' +
      '<circle cx="35.5" cy="6" r="6.5" fill="none" stroke="#C9A84C" stroke-width="1.3"/>' +
      '<line x1="31" y1="6" x2="29" y2="6" stroke="#C9A84C" stroke-width="1.3"/>' +
      '<line x1="18" y1="6" x2="13" y2="8" stroke="#C9A84C" stroke-width="1"/>' +
      '<line x1="42" y1="6" x2="47" y2="8" stroke="#C9A84C" stroke-width="1"/>' +
    '</svg>';

  // Monocle for CURIOUS (50%)
  const MONOCLE_SVG =
    '<svg id="costume-monocle" viewBox="0 0 60 20" width="60" height="20" ' +
    'style="position:absolute;top:10px;left:0;pointer-events:none;" ' +
    'xmlns="http://www.w3.org/2000/svg" overflow="visible">' +
      '<circle cx="35.5" cy="7" r="7" fill="none" stroke="#C9A84C" stroke-width="1.4"/>' +
      '<line x1="42.5" y1="12" x2="46" y2="19" stroke="#C9A84C" stroke-width="0.9"/>' +
    '</svg>';

  // Muscles for LOCKED IN
  const MUSCLES_SVG =
    '<svg id="costume-muscles" viewBox="0 0 80 60" width="80" height="60" ' +
    'style="position:absolute;top:20px;left:-10px;pointer-events:none;" ' +
    'xmlns="http://www.w3.org/2000/svg" overflow="visible">' +
      '<!-- Left arm -->' +
      '<ellipse cx="8"  cy="36" rx="8" ry="5.5" fill="#F0EFE9" transform="rotate(-35,8,36)"/>' +
      '<line x1="4"  y1="40" x2="0"  y2="52" stroke="#F5F4F0" stroke-width="5.5" stroke-linecap="round"/>' +
      '<!-- Right arm -->' +
      '<ellipse cx="72" cy="36" rx="8" ry="5.5" fill="#F0EFE9" transform="rotate(35,72,36)"/>' +
      '<line x1="76" y1="40" x2="80" y2="52" stroke="#F5F4F0" stroke-width="5.5" stroke-linecap="round"/>' +
    '</svg>';

  // Sweat drop for NERVOUS
  const SWEAT_SVG =
    '<svg id="costume-sweat" viewBox="0 0 60 40" width="60" height="40" ' +
    'style="position:absolute;top:-4px;left:0;pointer-events:none;" ' +
    'xmlns="http://www.w3.org/2000/svg" overflow="visible">' +
      '<path d="M46,8 C46,8 44,14 44,16.5 C44,19 45.5,20.5 47,20.5 C48.5,20.5 50,19 50,16.5 C50,14 48,8 46,8"' +
           ' fill="rgba(100,160,255,0.7)"/>' +
    '</svg>';

  // Rizz sparkles (4-pointed stars)
  const SPARKLE_SVG =
    '<svg id="costume-sparkles" viewBox="0 0 80 80" width="80" height="80" ' +
    'style="position:absolute;top:-20px;left:-10px;pointer-events:none;" ' +
    'xmlns="http://www.w3.org/2000/svg" overflow="visible">' +
      '<path d="M5,20 L7,16 L9,20 L13,22 L9,24 L7,28 L5,24 L1,22Z"  fill="#F7E08A" class="sparkle s1"/>' +
      '<path d="M73,12 L75,8  L77,12 L81,14 L77,16 L75,20 L73,16 L69,14Z" fill="#C9A84C" class="sparkle s2"/>' +
      '<path d="M60,55 L62,51 L64,55 L68,57 L64,59 L62,63 L60,59 L56,57Z" fill="#F7E08A" class="sparkle s3"/>' +
      '<path d="M10,56 L12,52 L14,56 L18,58 L14,60 L12,64 L10,60 L6,58Z"  fill="#C9A84C" class="sparkle s4"/>' +
    '</svg>';


  /* ─────────────────────────────────────────────────────────────
     6. DOM CREATION
  ───────────────────────────────────────────────────────────── */
  const freddy = document.createElement('div');
  freddy.id = 'freddy';
  freddy.setAttribute('aria-hidden', 'true');
  Object.assign(freddy.style, {
    position:      'fixed',
    pointerEvents: 'none',
    zIndex:        '9998',
    transform:     'translate(-50%, -50%)',
    left:          window.innerWidth  / 2 + 'px',
    top:           window.innerHeight / 2 + 'px',
  });

  const freddyInner = document.createElement('div');
  freddyInner.id = 'freddy-inner';
  freddyInner.style.position = 'relative';
  freddyInner.innerHTML = FREDDY_SVG;

  // Costume overlay slot
  const costumeEl = document.createElement('div');
  costumeEl.id = 'freddy-costume';
  costumeEl.setAttribute('aria-hidden', 'true');
  costumeEl.style.cssText = 'position:absolute;top:0;left:0;pointer-events:none;width:100%;height:100%;';
  freddyInner.appendChild(costumeEl);

  freddy.appendChild(freddyInner);
  document.body.appendChild(freddy);


  /* ─────────────────────────────────────────────────────────────
     7. SPRING PHYSICS STATE
  ───────────────────────────────────────────────────────────── */
  let freddyX  = window.innerWidth  / 2;
  let freddyY  = window.innerHeight / 2;
  let velX     = 0;
  let velY     = 0;
  let cursorX  = window.innerWidth  / 2;
  let cursorY  = window.innerHeight / 2;
  let isFlipped = false;  // true = Freddy on right side of ring

  let currentState = '';
  let isLying      = false;
  let isRizzing    = false;
  let isYawning    = false;
  let zzzEl        = null;
  let idleTimer    = null;
  let rizzTimer    = null;
  let sparkleEls   = null;


  /* ─────────────────────────────────────────────────────────────
     8. MOUSE TRACKING
  ───────────────────────────────────────────────────────────── */
  document.addEventListener('mousemove', function (e) {
    cursorX = e.clientX;
    cursorY = e.clientY;

    // Laser dot + ring: zero lag
    laser.style.left = cursorX + 'px';
    laser.style.top  = cursorY + 'px';
    cursorRing.style.left = cursorX + 'px';
    cursorRing.style.top  = cursorY + 'px';

    if (isLying || isRizzing) wakeUp();
    resetIdleTimer();
  }, { passive: true });


  /* ─────────────────────────────────────────────────────────────
     9. IDLE TIMERS
  ───────────────────────────────────────────────────────────── */
  function resetIdleTimer() {
    clearTimeout(idleTimer);
    idleTimer = setTimeout(goLying, IDLE_LYING_MS);
  }

  function goLying() {
    if (isLying) return;
    isLying = true;
    clearTimeout(rizzTimer);

    freddy.classList.remove('freddy-sitting', 'freddy-walking', 'freddy-running', 'freddy-sprinting');
    freddy.classList.add('freddy-lying');
    currentState = 'lying';

    if (!zzzEl) {
      zzzEl           = document.createElement('div');
      zzzEl.className = 'zzz-bubble';
      zzzEl.textContent = 'zzz';
      freddyInner.appendChild(zzzEl);
    }

    // Schedule possible rizz at 5 min
    rizzTimer = setTimeout(function() {
      if (isLying && Math.random() < 0.30) goRizz();
    }, IDLE_RIZZ_MS - IDLE_LYING_MS);
  }

  function goRizz() {
    isRizzing = true;
    freddy.classList.remove('freddy-lying');
    freddy.classList.add('freddy-rizz');
    currentState = 'rizz';
    if (zzzEl) { zzzEl.remove(); zzzEl = null; }

    // Show rizz eyes, hide normal eyes
    const rizzEyes = document.getElementById('rizz-eyes');
    const lidL     = document.getElementById('eye-lid-l');
    const lidR     = document.getElementById('eye-lid-r');
    if (rizzEyes) rizzEyes.style.display = 'block';
    if (lidL)    lidL.style.display = 'none';
    if (lidR)    lidR.style.display = 'none';

    // Add sparkles
    if (!sparkleEls) {
      const sp = document.createElement('div');
      sp.innerHTML = SPARKLE_SVG;
      sp.id = 'freddy-sparkles';
      freddyInner.appendChild(sp);
      sparkleEls = sp;
    }

    // Return to lying after 8 seconds
    setTimeout(function() {
      if (isRizzing) {
        isRizzing = false;
        freddy.classList.remove('freddy-rizz');
        freddy.classList.add('freddy-lying');
        currentState = 'lying';
        if (rizzEyes) rizzEyes.style.display = 'none';
        if (lidL)    lidL.style.display = '';
        if (lidR)    lidR.style.display = '';
        if (sparkleEls) { sparkleEls.remove(); sparkleEls = null; }
      }
    }, 8000);
  }

  function wakeUp() {
    if (!isLying && !isRizzing) return;
    isLying   = false;
    isRizzing = false;
    clearTimeout(rizzTimer);

    freddy.classList.remove('freddy-lying', 'freddy-rizz');
    if (zzzEl)       { zzzEl.remove();       zzzEl       = null; }
    if (sparkleEls)  { sparkleEls.remove();  sparkleEls  = null; }

    // Reset rizz visual overrides
    const rizzEyes = document.getElementById('rizz-eyes');
    const lidL     = document.getElementById('eye-lid-l');
    const lidR     = document.getElementById('eye-lid-r');
    if (rizzEyes) rizzEyes.style.display = 'none';
    if (lidL)    lidL.style.display = '';
    if (lidR)    lidR.style.display = '';

    // Wake-up bounce
    isYawning = true;
    freddy.classList.add('freddy-yawn');
    freddyInner.addEventListener('animationend', function onYawnEnd(e) {
      if (e.animationName !== 'freddy-yawn') return;
      freddy.classList.remove('freddy-yawn');
      freddyInner.removeEventListener('animationend', onYawnEnd);
      isYawning = false;
    });
  }

  resetIdleTimer();


  /* ─────────────────────────────────────────────────────────────
     10. BUTTON BAT
  ───────────────────────────────────────────────────────────── */
  document.addEventListener('mouseover', function (e) {
    const btn = e.target.closest('.btn');
    if (!btn || freddy.classList.contains('freddy-bat')) return;
    const rect = btn.getBoundingClientRect();
    const bx   = rect.left + rect.width  / 2;
    const by   = rect.top  + rect.height / 2;
    if (Math.hypot(freddyX - bx, freddyY - by) > BAT_RADIUS) return;

    freddy.classList.add('freddy-bat');
    haptic('light');
    setTimeout(() => freddy.classList.remove('freddy-bat'), 400);
  });


  /* ─────────────────────────────────────────────────────────────
     11. STATE MANAGEMENT
  ───────────────────────────────────────────────────────────── */
  function setFreddyState(speed) {
    if (isLying || isRizzing || isYawning) return;

    const next = speed < 0.3 ? 'sitting'
               : speed < 3   ? 'walking'
               :                'running';

    if (next === currentState) return;
    currentState = next;

    freddy.classList.remove('freddy-sitting', 'freddy-walking', 'freddy-running', 'freddy-sprinting');
    freddy.classList.add('freddy-' + next);
  }


  /* ─────────────────────────────────────────────────────────────
     12. ANIMATION LOOP
  ───────────────────────────────────────────────────────────── */
  function animate() {
    const cfg    = window.__MINERVA || {};
    const mult   = cfg.speedMult != null ? cfg.speedMult : 1;
    const frozen = !!cfg.freeze;

    if (frozen) {
      if (!isLying) goLying();
      requestAnimationFrame(animate);
      return;
    }

    // Determine which side Freddy sits on
    const leftEdge = window.innerWidth * 0.20;
    const newFlip  = cursorX < leftEdge;
    if (newFlip !== isFlipped) {
      isFlipped = newFlip;
      freddyInner.style.transition = 'transform 150ms ease';
      freddyInner.style.transform  = isFlipped ? 'scaleX(-1)' : 'scaleX(1)';
    }

    const offset = isFlipped ? SIDE_OFFSET : -SIDE_OFFSET;
    const targetX = cursorX + offset;
    const targetY = cursorY;

    velX += (targetX - freddyX) * SPRING * mult;
    velY += (targetY - freddyY) * SPRING * mult;
    velX *= DAMPING;
    velY *= DAMPING;
    freddyX += velX;
    freddyY += velY;

    freddy.style.left = freddyX + 'px';
    freddy.style.top  = freddyY + 'px';

    setFreddyState(Math.sqrt(velX * velX + velY * velY));

    requestAnimationFrame(animate);
  }

  animate();

  document.addEventListener('minerva:mood', function (e) {
    if (!e.detail.freeze && isLying) wakeUp();
  });


  /* ─────────────────────────────────────────────────────────────
     13. NIGHT OWL MODE
  ───────────────────────────────────────────────────────────── */
  if (IS_NIGHT_OWL) {
    const owlToast = document.createElement('div');
    owlToast.id        = 'night-owl-toast';
    owlToast.className = 'chromatic-glass';
    owlToast.textContent =
      'Night owl mode active. Freddy approves. Please also drink some water.';
    document.body.appendChild(owlToast);
    owlToast.addEventListener('animationend', function (e) {
      if (e.animationName === 'freddy-toast-out') owlToast.remove();
    });
  }


  /* ─────────────────────────────────────────────────────────────
     14. BIRTHDAY MODE (April 1)
  ───────────────────────────────────────────────────────────── */
  if (IS_BIRTHDAY) {
    const hatGroup = document.getElementById('party-hat-group');
    if (hatGroup) hatGroup.style.display = 'block';

    const bToast = document.createElement('div');
    bToast.id        = 'birthday-toast';
    bToast.className = 'chromatic-glass';
    Object.assign(bToast.style, {
      position:   'fixed',
      bottom:     '24px',
      left:       '24px',
      maxWidth:   '360px',
      padding:    '12px 16px',
      fontFamily: 'var(--font-body, DM Sans, sans-serif)',
      fontSize:   '14px',
      color:      'var(--dark-text, #E8E6E0)',
      lineHeight: '1.5',
      zIndex:     '9990',
      opacity:    '0',
      transform:  'translateY(6px)',
    });
    bToast.textContent = 'Happy Birthday Freddy! He does not know how old he is. Neither do we.';
    document.body.appendChild(bToast);

    requestAnimationFrame(function () {
      bToast.style.animation =
        'freddy-toast-in 0.35s ease forwards, freddy-toast-out 0.3s ease 6s forwards';
    });
    bToast.addEventListener('animationend', function (e) {
      if (e.animationName === 'freddy-toast-out') bToast.remove();
    });
  }


  /* ─────────────────────────────────────────────────────────────
     15. SAMSUNG EASTER EGG
  ───────────────────────────────────────────────────────────── */
  if (IS_SAMSUNG) {
    const originalHTML = freddyInner.innerHTML;
    freddyInner.innerHTML = DRAGON_SVG + freddyInner.querySelector('#freddy-costume').outerHTML;
    const dragonSvg = freddyInner.querySelector('svg');
    dragonSvg.style.cssText += 'opacity:0;animation:dragon-fade-in 0.25s ease forwards;';

    setTimeout(function () {
      dragonSvg.style.animation = 'dragon-fade-out 0.25s ease forwards';
      dragonSvg.addEventListener('animationend', function () {
        freddyInner.innerHTML = originalHTML;
        const restoredSvg = freddyInner.querySelector('svg');
        if (restoredSvg) {
          restoredSvg.style.cssText += 'opacity:0;animation:dragon-fade-in 0.25s ease forwards;';
        }
        if (IS_BIRTHDAY) {
          const hat = document.getElementById('party-hat-group');
          if (hat) hat.style.display = 'block';
        }
      }, { once: true });
    }, 500);
  }


  /* ─────────────────────────────────────────────────────────────
     16. CLICK PARTICLE SYSTEM
  ───────────────────────────────────────────────────────────── */
  function spawnClickParticles(x, y) {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const colors = ['#C9A84C', '#F0D080', '#FFFFFF', 'rgba(201,168,76,0.6)', '#E8EAF2'];
    const count  = 18;

    for (let i = 0; i < count; i++) {
      const p    = document.createElement('div');
      const size = 2 + Math.random() * 3;
      p.style.cssText =
        'position:fixed;' +
        'width:'  + size + 'px;' +
        'height:' + size + 'px;' +
        'border-radius:50%;' +
        'background:' + colors[Math.floor(Math.random() * colors.length)] + ';' +
        'left:' + x + 'px;' +
        'top:'  + y + 'px;' +
        'pointer-events:none;' +
        'z-index:99999;' +
        'transform:translate(-50%,-50%);';
      document.body.appendChild(p);

      // Bias upward: angles between 200°–340° in standard math (upward in CSS)
      const angle    = (Math.random() * 140 + 200) * Math.PI / 180;
      const speed    = 40 + Math.random() * 80;
      const vx       = Math.cos(angle) * speed;
      const vy       = Math.sin(angle) * speed;
      const duration = 800 + Math.random() * 700;

      p.animate([
        { transform: 'translate(-50%,-50%) scale(1)',  opacity: 1 },
        { transform: 'translate(calc(-50% + ' + vx + 'px), calc(-50% + ' + vy + 'px)) scale(0)',
          opacity: 0 }
      ], { duration, easing: 'cubic-bezier(0,0.9,0.57,1)', fill: 'forwards' })
        .onfinish = () => p.remove();
    }
  }

  document.addEventListener('click', function (e) {
    spawnClickParticles(e.clientX, e.clientY);
  });


  /* ─────────────────────────────────────────────────────────────
     17. HAPTICS
  ───────────────────────────────────────────────────────────── */
  function haptic(type) {
    if (navigator.vibrate) {
      if      (type === 'light')   navigator.vibrate(10);
      else if (type === 'medium')  navigator.vibrate(30);
      else if (type === 'heavy')   navigator.vibrate([50, 10, 50]);
      else if (type === 'success') navigator.vibrate([30, 30, 100]);
      else if (type === 'error')   navigator.vibrate([100, 50, 100, 50, 100]);
    } else {
      // iOS haptic trick via invisible checkbox
      let cb = document.getElementById('ios-haptic-checkbox');
      if (!cb) {
        cb = document.createElement('input');
        cb.type     = 'checkbox';
        cb.id       = 'ios-haptic-checkbox';
        cb.style.cssText = 'position:fixed;opacity:0;pointer-events:none;z-index:-1;';
        document.body.appendChild(cb);
      }
      const count = type === 'heavy' ? 3 : type === 'medium' ? 2 : 1;
      let i = 0;
      const toggle = () => {
        cb.click();
        if (++i < count * 2) setTimeout(toggle, 40);
      };
      toggle();
    }
  }

  // Expose haptic globally for form.js to call
  window.__haptic = haptic;

  // General button click haptic
  document.querySelectorAll('.btn').forEach(function(btn) {
    btn.addEventListener('click', function() { haptic('light'); });
  });
  // Also delegate for dynamically added buttons
  document.addEventListener('click', function(e) {
    if (e.target.closest('.btn')) haptic('light');
  });


  /* ─────────────────────────────────────────────────────────────
     18. MOOD COSTUME SYSTEM
  ───────────────────────────────────────────────────────────── */
  let currentCostume = null;

  function applyFreddyCostume(moodKey) {
    if (!costumeEl) return;
    costumeEl.innerHTML = '';

    // Remove all costume classes
    freddy.classList.remove(
      'freddy-costume-locked', 'freddy-costume-curious',
      'freddy-costume-inspired', 'freddy-costume-chaotic', 'freddy-costume-nervous'
    );

    currentCostume = moodKey;

    switch (moodKey) {
      case 'locked-in':
        costumeEl.innerHTML = MUSCLES_SVG;
        freddy.classList.add('freddy-costume-locked');
        break;

      case 'curious':
        // 50/50 monocle or glasses
        costumeEl.innerHTML = Math.random() < 0.5 ? MONOCLE_SVG : GLASSES_SVG;
        freddy.classList.add('freddy-costume-curious');
        break;

      case 'inspired':
        costumeEl.innerHTML = CROWN_SVG;
        freddy.classList.add('freddy-costume-inspired');
        break;

      case 'chaotic':
        // No static accessory — CSS handles the erratic movement
        freddy.classList.add('freddy-costume-chaotic');
        break;

      case 'nervous':
        costumeEl.innerHTML = SWEAT_SVG;
        freddy.classList.add('freddy-costume-nervous');
        break;

      default:
        break;
    }
  }

  // Expose for mood.js
  window.__applyFreddyCostume = applyFreddyCostume;

  // Apply on mood change event
  document.addEventListener('minerva:mood', function (e) {
    applyFreddyCostume(e.detail.mood);
    if (!e.detail.freeze && isLying) wakeUp();
  });

  // Apply saved mood on load
  document.addEventListener('DOMContentLoaded', function () {
    var savedMood = (window.__MINERVA && window.__MINERVA.activeMood) || 'curious';
    try { savedMood = localStorage.getItem('minerva-mood') || 'curious'; } catch(e) {}
    applyFreddyCostume(savedMood);
  });


  /* ─────────────────────────────────────────────────────────────
     19. KONAMI CODE  (↑↑↓↓←→←→BA)
  ───────────────────────────────────────────────────────────── */
  (function () {
    const SEQUENCE = [
      'ArrowUp','ArrowUp','ArrowDown','ArrowDown',
      'ArrowLeft','ArrowRight','ArrowLeft','ArrowRight',
      'KeyB','KeyA',
    ];
    let progress = 0;

    document.addEventListener('keydown', function (e) {
      if (e.code === SEQUENCE[progress]) {
        progress++;
        if (progress === SEQUENCE.length) {
          progress = 0;
          triggerKonami();
        }
      } else {
        progress = e.code === SEQUENCE[0] ? 1 : 0;
      }
    });

    function triggerKonami() {
      haptic('heavy');
      const COLORS = ['#C9A84C','#F0D080','#ffffff','#1A1A2E','#2D3561'];
      const cx = window.innerWidth  / 2;
      const cy = window.innerHeight / 2;

      for (let i = 0; i < 50; i++) {
        const angle = Math.random() * Math.PI * 2;
        const speed = Math.random() * 380 + 120;
        const tx    = Math.cos(angle) * speed;
        const ty    = Math.sin(angle) * speed;
        const conf  = document.createElement('div');
        Object.assign(conf.style, {
          position:      'fixed',
          width:         '8px',
          height:        '8px',
          borderRadius:  Math.random() > 0.5 ? '50%' : '2px',
          background:    COLORS[Math.floor(Math.random() * COLORS.length)],
          left:          cx + 'px',
          top:           cy + 'px',
          pointerEvents: 'none',
          zIndex:        '9997',
          opacity:       '1',
          transition:    'transform ' + (600 + Math.random() * 400) + 'ms cubic-bezier(0,0,0.3,1), opacity 300ms ease ' + (400 + Math.random() * 200) + 'ms',
          willChange:    'transform, opacity',
        });
        document.body.appendChild(conf);
        requestAnimationFrame(function (el, tx, ty) {
          return function () {
            el.style.transform = 'translate(' + tx + 'px, ' + (ty - 60) + 'px) rotate(' + (Math.random() * 720) + 'deg)';
            el.style.opacity   = '0';
          };
        }(conf, tx, ty));
        setTimeout(function (el) { return function () { if (el.parentNode) el.parentNode.removeChild(el); }; }(conf), 1200);
      }

      showKonamiToast();
    }

    function showKonamiToast() {
      const existing = document.getElementById('konami-toast');
      if (existing) existing.parentNode.removeChild(existing);

      const toast = document.createElement('div');
      toast.id = 'konami-toast';
      Object.assign(toast.style, {
        position:      'fixed',
        top:           '80px',
        left:          '50%',
        transform:     'translateX(-50%) translateY(-10px)',
        background:    'var(--color-surface, #fff)',
        border:        '1px solid var(--color-border, rgba(26,26,46,0.12))',
        borderRadius:  '12px',
        padding:       '16px 20px',
        fontFamily:    'var(--font-body, DM Sans, sans-serif)',
        fontSize:      '14px',
        color:         'var(--color-ink, #1A1A2E)',
        lineHeight:    '1.5',
        zIndex:        '9996',
        boxShadow:     '0 8px 32px rgba(26,26,46,0.16)',
        maxWidth:      '360px',
        width:         'calc(100vw - 48px)',
        opacity:       '0',
        transition:    'opacity 300ms ease, transform 300ms cubic-bezier(0.34,1.56,0.64,1)',
        display:       'flex',
        flexDirection: 'column',
        gap:           '10px',
      });

      const msg      = document.createElement('p');
      msg.textContent = 'Cheat code activated. Unfortunately, applications still require essays.';
      msg.style.cssText = 'margin:0;';

      const closeBtn = document.createElement('button');
      closeBtn.textContent  = 'Worth a try';
      closeBtn.style.cssText =
        'align-self:flex-start;background:var(--color-gold,#C9A84C);color:#fff;' +
        'border:none;border-radius:6px;padding:6px 14px;font-family:inherit;' +
        'font-size:13px;font-weight:500;cursor:pointer;';
      closeBtn.addEventListener('click', function () { dismissKonami(toast); });

      toast.appendChild(msg);
      toast.appendChild(closeBtn);
      document.body.appendChild(toast);

      requestAnimationFrame(function () {
        toast.style.opacity   = '1';
        toast.style.transform = 'translateX(-50%) translateY(0)';
      });

      const autoTimer = setTimeout(function () { dismissKonami(toast); }, 4000);
      toast._autoTimer = autoTimer;
    }

    function dismissKonami(toast) {
      clearTimeout(toast._autoTimer);
      toast.style.opacity   = '0';
      toast.style.transform = 'translateX(-50%) translateY(-10px)';
      setTimeout(function () { if (toast.parentNode) toast.parentNode.removeChild(toast); }, 320);
    }
  })();


  /* ─────────────────────────────────────────────────────────────
     20. CONSOLE MESSAGE
  ───────────────────────────────────────────────────────────── */
  document.addEventListener('DOMContentLoaded', function () {
    const enso =
      '          ◯◯◯◯◯◯\n' +
      '       ◯◯          ◯◯\n' +
      '     ◯◯               ◯◯\n' +
      '    ◯◯                  ◯\n' +
      '   ◯◯                    ◯\n' +
      '   ◯                      ◉\n' +
      '   ◯                      ◯\n' +
      '    ◯◯                  ◯◯\n' +
      '      ◯◯              ◯◯\n' +
      '         ◯◯◯◯◯◯◯◯◯◯';

    const gold = 'color:#C9A84C;font-size:14px;font-family:monospace;line-height:1.4;';
    const dim  = 'color:#9B99A8;font-size:13px;font-family:monospace;line-height:1.8;';

    console.log('%c' + enso, gold);
    console.log('%cCurious minds build curious things.', gold);
    console.log('%cIf you are reading this, you might be one of us.', dim);
    console.log('%c→ minerva.edu/admissions', gold);
  });

})();
