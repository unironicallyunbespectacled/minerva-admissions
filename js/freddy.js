/* ═══════════════════════════════════════════════════════════════
   FREDDY — spring-physics cursor companion
   js/freddy.js

   Sections:
   1.  Constants & flags
   2.  Cursor (laser dot + native cursor overrides)
   3.  Freddy SVG definition
   4.  Dragon SVG definition (Samsung easter egg)
   5.  DOM creation
   6.  Spring physics state
   7.  Mouse tracking
   8.  Idle / sleep timer
   9.  Button bat
   10. State management
   11. Animation loop (rAF)
   12. Night owl mode   (1 am – 4 am)
   13. Birthday mode    (April 1)
   14. Samsung easter egg
═══════════════════════════════════════════════════════════════ */

(function () {
  'use strict';

  /* ─────────────────────────────────────────────────────────────
     1. CONSTANTS & FLAGS
  ───────────────────────────────────────────────────────────── */
  const SPRING             = 0.04;
  const DAMPING            = 0.85;
  const IDLE_THRESHOLD_MS  = 3 * 60 * 1000; // 3 minutes
  const BAT_RADIUS         = 200;            // px

  const _d     = new Date();
  const _month = _d.getMonth() + 1;   // 1-based
  const _day   = _d.getDate();
  const _hour  = _d.getHours();

  const IS_BIRTHDAY  = _month === 4 && _day === 1;
  const IS_NIGHT_OWL = _hour >= 1 && _hour < 4;
  const IS_SAMSUNG   = /SamsungBrowser/i.test(navigator.userAgent);


  /* ─────────────────────────────────────────────────────────────
     2. CURSOR
  ───────────────────────────────────────────────────────────── */

  // Hide the default cursor globally
  document.body.style.cursor = 'none';

  // Restore native cursors on interactive elements so the OS
  // text cursor / pointer still renders where it's needed.
  const _cursorStyle = document.createElement('style');
  _cursorStyle.textContent =
    'input,textarea,select,[contenteditable]{cursor:text    !important;}' +
    'a,button,.btn,[role="button"],label     {cursor:pointer !important;}';
  document.head.appendChild(_cursorStyle);

  // Laser dot element
  const laser = document.createElement('div');
  laser.id = 'laser-dot';

  if (IS_BIRTHDAY) {
    // Swap dot for a cupcake on birthdays
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
     3. FREDDY SVG — geometric low-poly cat, 60 × 60 viewBox
        Key elements with IDs:
          #freddy-svg       — root, filter target for sprinting blur
          #freddy-tail      — rotates when sitting/sleeping
          #ear-l / #ear-r   — fold back when running/sprinting
          #eye-lid-l / -r   — scaleY 0→1 to open/close eyes
          #party-hat-group  — hidden; shown on IS_BIRTHDAY
  ───────────────────────────────────────────────────────────── */
  const FREDDY_SVG = `
<svg id="freddy-svg"
     viewBox="0 0 60 60" width="60" height="60"
     overflow="visible"
     xmlns="http://www.w3.org/2000/svg">

  <!-- Tail (drawn first so it sits behind the body) -->
  <path id="freddy-tail"
        d="M40,48 C52,42 58,32 53,22"
        fill="none" stroke="#DDDBD4" stroke-width="5.5" stroke-linecap="round"/>

  <!-- Body — low-poly triangulated polygons -->
  <polygon points="18,53 30,49 42,53 40,34 20,34" fill="#F0EFE9"/>
  <polygon points="22,34 38,34 36,44 24,44"        fill="#E6E4DE" opacity="0.6"/>

  <!-- Head -->
  <circle cx="30" cy="21" r="13" fill="#F5F4F0"/>
  <!-- Low-poly shading triangle on head -->
  <polygon points="17,21 30,8 30,34" fill="#ECEAE4" opacity="0.4"/>

  <!-- Left ear -->
  <polygon id="ear-l"  points="16,16 21,6 27,15"    fill="#F5F4F0"/>
  <polygon             points="18,15.5 21,8 25.5,15" fill="#F0BFC8" opacity="0.75"/>
  <!-- Right ear -->
  <polygon id="ear-r"  points="33,15 39,6 44,16"    fill="#F5F4F0"/>
  <polygon             points="34.5,15 39,8 42,15.5" fill="#F0BFC8" opacity="0.75"/>

  <!-- Eyes (dark iris circles) -->
  <circle cx="24.5" cy="20" r="4.5" fill="#1A1A2E"/>
  <circle cx="35.5" cy="20" r="4.5" fill="#1A1A2E"/>
  <!-- Eye shine -->
  <circle cx="25.9" cy="18.7" r="1.6" fill="white"/>
  <circle cx="36.9" cy="18.7" r="1.6" fill="white"/>

  <!-- Eye lids — same fill as head so they blend.
       scaleY(0) = invisible (eyes open);
       scaleY(1) = fully covering the eye circle (eyes closed).
       Height 9 covers the full r=4.5 eye circle. -->
  <rect id="eye-lid-l" x="20"  y="15.5" width="9" height="9" rx="1" fill="#F5F4F0"/>
  <rect id="eye-lid-r" x="31" y="15.5" width="9" height="9" rx="1" fill="#F5F4F0"/>

  <!-- Nose -->
  <ellipse cx="30" cy="25.5" rx="2" ry="1.4" fill="#F0A0B5"/>
  <!-- Mouth -->
  <path d="M27.8,27 Q30,29.2 32.2,27"
        fill="none" stroke="#D4A0AC" stroke-width="0.9" stroke-linecap="round"/>

  <!-- Whiskers left -->
  <line x1="12" y1="24"   x2="26" y2="25.5" stroke="#C8C6BE" stroke-width="0.65" opacity="0.8"/>
  <line x1="11" y1="26.5" x2="25" y2="27.2" stroke="#C8C6BE" stroke-width="0.65" opacity="0.8"/>
  <!-- Whiskers right -->
  <line x1="34" y1="25.5" x2="48" y2="24"   stroke="#C8C6BE" stroke-width="0.65" opacity="0.8"/>
  <line x1="35" y1="27.2" x2="49" y2="26.5" stroke="#C8C6BE" stroke-width="0.65" opacity="0.8"/>

  <!-- Gold collar -->
  <path d="M19,32 Q30,36 41,32"
        fill="none" stroke="#C9A84C" stroke-width="3.5" stroke-linecap="round"/>
  <!-- Collar bell -->
  <circle cx="30" cy="35"   r="2.5" fill="#B8963E"/>
  <line   x1="30" y1="36.5" x2="30" y2="38" stroke="#8A6B20" stroke-width="0.9"/>

  <!-- Party hat — hidden by default, shown via JS on April 1 -->
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
     4. DRAGON SVG — geometric gold dragon for Samsung easter egg
  ───────────────────────────────────────────────────────────── */
  const DRAGON_SVG = `
<svg id="freddy-svg"
     viewBox="0 0 60 60" width="60" height="60"
     overflow="visible"
     xmlns="http://www.w3.org/2000/svg">

  <!-- Wings -->
  <polygon points="12,28  0,9  18,34" fill="#C9A84C" opacity="0.72"/>
  <polygon points="48,28 60,9 42,34"  fill="#C9A84C" opacity="0.72"/>
  <!-- Body -->
  <polygon points="30,5 46,20 50,38 30,53 10,38 14,20" fill="#C9A84C"/>
  <!-- Body shading -->
  <polygon points="30,12 40,24 30,36 20,24" fill="#B8963E"/>
  <!-- Dorsal spines -->
  <polygon points="24,8  30,3  28,13" fill="#F0D080"/>
  <polygon points="30,5  36,2  34,11" fill="#F0D080"/>
  <polygon points="36,8  42,5  38,14" fill="#F0D080"/>
  <!-- Eyes -->
  <circle cx="24"   cy="22" r="3.5" fill="#1A1A2E"/>
  <circle cx="36"   cy="22" r="3.5" fill="#1A1A2E"/>
  <circle cx="25.2" cy="21" r="1.2" fill="#FF3B30"/>
  <circle cx="37.2" cy="21" r="1.2" fill="#FF3B30"/>
  <!-- Tail -->
  <path d="M36,50 C44,55 50,50 54,57"
        stroke="#C9A84C" stroke-width="4" fill="none" stroke-linecap="round"/>
  <polygon points="52,55 57,60 53,58.5" fill="#B8963E"/>

</svg>`;


  /* ─────────────────────────────────────────────────────────────
     5. DOM CREATION
  ───────────────────────────────────────────────────────────── */
  const freddy = document.createElement('div');
  freddy.id = 'freddy';
  Object.assign(freddy.style, {
    position:      'fixed',
    pointerEvents: 'none',
    zIndex:        '9998',
    transform:     'translate(-50%, -50%)',
    left:          window.innerWidth  / 2 + 'px',
    top:           window.innerHeight / 2 + 'px',
  });

  const freddyInner = document.createElement('div');
  freddyInner.id        = 'freddy-inner';
  freddyInner.innerHTML = FREDDY_SVG;

  freddy.appendChild(freddyInner);
  document.body.appendChild(freddy);


  /* ─────────────────────────────────────────────────────────────
     6. SPRING PHYSICS STATE
  ───────────────────────────────────────────────────────────── */
  let freddyX = window.innerWidth  / 2;
  let freddyY = window.innerHeight / 2;
  let velX    = 0;
  let velY    = 0;
  let cursorX = window.innerWidth  / 2;
  let cursorY = window.innerHeight / 2;

  let currentState = '';    // 'sitting' | 'walking' | 'running' | 'sprinting'
  let isSleeping   = false;
  let isYawning    = false;
  let zzzEl        = null;
  let idleTimer    = null;


  /* ─────────────────────────────────────────────────────────────
     7. MOUSE TRACKING
  ───────────────────────────────────────────────────────────── */
  document.addEventListener('mousemove', function (e) {
    cursorX = e.clientX;
    cursorY = e.clientY;

    // Laser dot: zero lag — update synchronously in the event handler
    laser.style.left = cursorX + 'px';
    laser.style.top  = cursorY + 'px';

    if (isSleeping) wakeFromSleep();
    resetIdleTimer();
  }, { passive: true });


  /* ─────────────────────────────────────────────────────────────
     8. IDLE / SLEEP TIMER
  ───────────────────────────────────────────────────────────── */
  function resetIdleTimer() {
    clearTimeout(idleTimer);
    idleTimer = setTimeout(goToSleep, IDLE_THRESHOLD_MS);
  }

  function goToSleep() {
    if (isSleeping) return;
    isSleeping = true;

    freddy.classList.remove(
      'freddy-sitting', 'freddy-walking', 'freddy-running', 'freddy-sprinting'
    );
    freddy.classList.add('freddy-sleeping');
    currentState = 'sleeping';

    // Show Zzz bubble above Freddy
    if (!zzzEl) {
      zzzEl           = document.createElement('div');
      zzzEl.className = 'zzz-bubble';
      zzzEl.textContent = 'zzz';
      freddyInner.appendChild(zzzEl);
    }
  }

  function wakeFromSleep() {
    if (!isSleeping) return;
    isSleeping = false;

    freddy.classList.remove('freddy-sleeping');

    // Remove Zzz bubble
    if (zzzEl) { zzzEl.remove(); zzzEl = null; }

    // Play yawn animation before handing control back to the physics loop
    isYawning = true;
    freddy.classList.add('freddy-yawn');

    freddyInner.addEventListener('animationend', function onYawnEnd(e) {
      if (e.animationName !== 'freddy-yawn') return;
      freddy.classList.remove('freddy-yawn');
      freddyInner.removeEventListener('animationend', onYawnEnd);
      isYawning = false;
    });
  }

  // Start the idle countdown immediately on load
  resetIdleTimer();


  /* ─────────────────────────────────────────────────────────────
     9. BUTTON BAT — paw swipe when Freddy is within 200px of
        any .btn element the cursor enters.
  ───────────────────────────────────────────────────────────── */
  document.addEventListener('mouseover', function (e) {
    const btn = e.target.closest('.btn');
    if (!btn || freddy.classList.contains('freddy-bat')) return;

    const rect = btn.getBoundingClientRect();
    const bx   = rect.left + rect.width  / 2;
    const by   = rect.top  + rect.height / 2;
    if (Math.hypot(freddyX - bx, freddyY - by) > BAT_RADIUS) return;

    freddy.classList.add('freddy-bat');
    setTimeout(() => freddy.classList.remove('freddy-bat'), 400);
  });


  /* ─────────────────────────────────────────────────────────────
     10. STATE MANAGEMENT
  ───────────────────────────────────────────────────────────── */
  function setFreddyState(speed) {
    // Let sleeping / yawn animations play uninterrupted
    if (isSleeping || isYawning) return;

    const next = speed < 0.5 ? 'sitting'
               : speed < 5   ? 'walking'
               : speed < 25  ? 'running'
               :                'sprinting';

    if (next === currentState) return;
    currentState = next;

    freddy.classList.remove(
      'freddy-sitting', 'freddy-walking', 'freddy-running', 'freddy-sprinting'
    );
    freddy.classList.add('freddy-' + next);
  }


  /* ─────────────────────────────────────────────────────────────
     11. ANIMATION LOOP  (requestAnimationFrame)
  ───────────────────────────────────────────────────────────── */
  function animate() {
    // mood.js writes window.__MINERVA before this file loads
    var mult   = (window.__MINERVA && window.__MINERVA.speedMult != null)
                   ? window.__MINERVA.speedMult : 1;
    var frozen = window.__MINERVA && window.__MINERVA.freeze;

    if (frozen) {
      if (!isSleeping) goToSleep();
      requestAnimationFrame(animate);
      return;
    }

    velX += (cursorX - freddyX) * SPRING * mult;
    velY += (cursorY - freddyY) * SPRING * mult;
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

  // Wake Freddy when switching away from a frozen mood
  document.addEventListener('minerva:mood', function (e) {
    if (!e.detail.freeze && isSleeping) wakeFromSleep();
  });


  /* ─────────────────────────────────────────────────────────────
     12. NIGHT OWL MODE  (1 am – 4 am local time)
  ───────────────────────────────────────────────────────────── */
  if (IS_NIGHT_OWL) {
    const owlToast = document.createElement('div');
    owlToast.id        = 'night-owl-toast';
    owlToast.className = 'chromatic-glass';
    owlToast.textContent =
      'Night owl mode active. Freddy approves. Please also drink some water.';
    document.body.appendChild(owlToast);

    // Remove from DOM once the fade-out animation completes
    owlToast.addEventListener('animationend', function (e) {
      if (e.animationName === 'freddy-toast-out') owlToast.remove();
    });
  }


  /* ─────────────────────────────────────────────────────────────
     13. BIRTHDAY MODE  (April 1)
         • Cupcake laser dot (handled in section 2 above)
         • Party hat on the Freddy SVG
         • Birthday toast
  ───────────────────────────────────────────────────────────── */
  if (IS_BIRTHDAY) {
    // Reveal the party hat group embedded in the SVG
    const hatGroup = document.getElementById('party-hat-group');
    if (hatGroup) hatGroup.style.display = 'block';

    // Toast
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
    bToast.textContent =
      'Happy Birthday Freddy! He does not know how old he is. Neither do we.';
    document.body.appendChild(bToast);

    // Apply animation on the next frame so the initial opacity:0 is painted first
    requestAnimationFrame(function () {
      bToast.style.animation =
        'freddy-toast-in 0.35s ease forwards, freddy-toast-out 0.3s ease 6s forwards';
    });

    bToast.addEventListener('animationend', function (e) {
      if (e.animationName === 'freddy-toast-out') bToast.remove();
    });
  }


  /* ─────────────────────────────────────────────────────────────
     14. SAMSUNG EASTER EGG
         On Samsung Internet: replace Freddy with a geometric
         gold dragon for exactly 500 ms, then fade back.
  ───────────────────────────────────────────────────────────── */
  if (IS_SAMSUNG) {
    const originalHTML = freddyInner.innerHTML;

    // Swap Freddy for the dragon with a fade-in
    freddyInner.innerHTML = DRAGON_SVG;
    const dragonSvg = freddyInner.querySelector('svg');
    dragonSvg.style.cssText +=
      'opacity:0; animation: dragon-fade-in 0.25s ease forwards;';

    setTimeout(function () {
      // Fade the dragon out
      dragonSvg.style.animation = 'dragon-fade-out 0.25s ease forwards';

      dragonSvg.addEventListener('animationend', function () {
        // Restore Freddy with a fade-in
        freddyInner.innerHTML = originalHTML;

        const restoredSvg = freddyInner.querySelector('svg');
        if (restoredSvg) {
          restoredSvg.style.cssText +=
            'opacity:0; animation: dragon-fade-in 0.25s ease forwards;';
        }

        // Re-show the party hat if it was a birthday too
        if (IS_BIRTHDAY) {
          const hat = document.getElementById('party-hat-group');
          if (hat) hat.style.display = 'block';
        }
      }, { once: true });

    }, 500);
  }

})();
