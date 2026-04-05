/* ═══════════════════════════════════════════════════════════════
   MOOD SYSTEM — js/mood.js  v2.0
   Loads before freddy.js so window.__MINERVA is set before
   the spring-physics loop begins.

   Sections:
   1.  Mood definitions
   2.  Flash-safe early apply
   3.  Global Freddy bridge
   4.  applyMood()
   5.  Mood gate (first visit — blocks site-content until selection)
   6.  Mood selector panel (nav toggle)
   7.  Cookie consent
   8.  Freddy intro text
   9.  Chaotic random bat
═══════════════════════════════════════════════════════════════ */

(function () {
  'use strict';

  /* ─────────────────────────────────────────────────────────────
     1. MOOD DEFINITIONS
  ───────────────────────────────────────────────────────────── */
  var MOODS = {
    'locked-in': {
      label:     'LOCKED IN',
      desc:      'Focus mode. Freddy is jacked.',
      accent:    '#1A1A2E',
      speedMult: 0,
      freeze:    true,
      introText: 'Freddy is keeping watch. Muscles and all. The room is yours.',
    },
    'curious': {
      label:     'CURIOUS',
      desc:      'Just exploring. Freddy has opinions.',
      accent:    '#2D3561',
      speedMult: 1,
      freeze:    false,
      introText: 'This is Freddy. He is wearing his thinking glasses. He means well.',
    },
    'nervous': {
      label:     'NERVOUS',
      desc:      'You\'ve got this. Breathe.',
      accent:    '#6B8F71',
      speedMult: 0.5,
      freeze:    false,
      introText: 'Take a breath. One section at a time. Freddy believes in you.',
    },
    'inspired': {
      label:     'INSPIRED',
      desc:      'Gold everything. Freddy is royalty.',
      accent:    '#C9A84C',
      speedMult: 1.6,
      freeze:    false,
      introText: 'Freddy has his crown on. The energy is real. Go write something brilliant.',
    },
    'chaotic': {
      label:     'CHAOTIC',
      desc:      'Maximum Freddy. Hold on.',
      accent:    '#D4614E',
      speedMult: 1.5,
      freeze:    false,
      introText: 'Freddy has no idea either. That\'s fine. Keep going.',
    },
  };

  var STORAGE_KEY  = 'minerva-mood';
  var DEFAULT_MOOD = 'curious';

  function readSavedMood() {
    try { return localStorage.getItem(STORAGE_KEY) || null; }
    catch (e) { return null; }
  }


  /* ─────────────────────────────────────────────────────────────
     2. FLASH-SAFE EARLY APPLY
  ───────────────────────────────────────────────────────────── */
  var savedMood  = readSavedMood();
  var activeMood = savedMood || DEFAULT_MOOD;
  document.documentElement.setAttribute('data-mood', activeMood);


  /* ─────────────────────────────────────────────────────────────
     3. GLOBAL FREDDY BRIDGE
  ───────────────────────────────────────────────────────────── */
  var cfg = MOODS[activeMood] || MOODS[DEFAULT_MOOD];
  window.__MINERVA = {
    speedMult:  cfg.speedMult,
    freeze:     cfg.freeze,
    activeMood: activeMood,
  };


  /* ─────────────────────────────────────────────────────────────
     4. APPLY MOOD
  ───────────────────────────────────────────────────────────── */
  function applyMood(key, persist) {
    var mood    = MOODS[key] || MOODS[DEFAULT_MOOD];
    var safeKey = MOODS[key] ? key : DEFAULT_MOOD;
    activeMood  = safeKey;

    document.documentElement.setAttribute('data-mood', safeKey);

    window.__MINERVA.speedMult  = mood.speedMult;
    window.__MINERVA.freeze     = mood.freeze;
    window.__MINERVA.activeMood = safeKey;

    document.dispatchEvent(new CustomEvent('minerva:mood', {
      detail: { mood: safeKey, freeze: mood.freeze },
    }));

    // Apply Freddy costume (freddy.js exposes this)
    if (window.__applyFreddyCostume) {
      window.__applyFreddyCostume(safeKey);
    }

    // Update intro text if still visible
    var introEl = document.querySelector('#freddy-intro .freddy-intro-text');
    if (introEl) introEl.textContent = mood.introText;

    if (persist) {
      try { localStorage.setItem(STORAGE_KEY, safeKey); } catch (e) {}
    }
  }


  /* ─────────────────────────────────────────────────────────────
     5. MOOD GATE  (first visit — main page only)
        Appears after the loading screen fades out.
        Blocks site-content until user picks a mood.
  ───────────────────────────────────────────────────────────── */
  var isFirstVisit = !savedMood;

  document.addEventListener('DOMContentLoaded', function () {
    var loadingScreen = document.getElementById('loading-screen');
    var siteContent   = document.getElementById('site-content');

    // Only run mood gate on pages with a loading screen (index.html)
    if (!loadingScreen || !isFirstVisit) return;

    // Prevent site-content from auto-fading in
    if (siteContent) {
      siteContent.style.animation = 'none';
      siteContent.style.opacity   = '0';
    }

    // Build mood gate
    var gate = document.createElement('div');
    gate.id  = 'mood-gate';
    gate.setAttribute('role',       'dialog');
    gate.setAttribute('aria-modal', 'true');
    gate.setAttribute('aria-label', 'How are you feeling today?');

    var gateOptionsHTML = Object.keys(MOODS).map(function (k) {
      var m = MOODS[k];
      return (
        '<button class="mood-gate-btn" data-mood-key="' + k + '" type="button">' +
          '<div class="mood-gate-dot" style="background:' + m.accent + ';"></div>' +
          '<span class="mood-gate-label">' + m.label + '</span>' +
          '<span class="mood-gate-desc">'  + m.desc  + '</span>' +
        '</button>'
      );
    }).join('');

    gate.innerHTML =
      '<h2 class="mood-gate-title">How are we feeling?</h2>' +
      '<p class="mood-gate-sub">This shapes your experience and Freddy\'s outfit.</p>' +
      '<div class="mood-gate-options">' + gateOptionsHTML + '</div>';

    document.body.appendChild(gate);

    // Show gate after loading screen finishes (~4.4s)
    var GATE_DELAY = 4400;
    setTimeout(function () {
      gate.classList.add('gate--visible');
      // Trap focus on gate
      var firstBtn = gate.querySelector('.mood-gate-btn');
      if (firstBtn) firstBtn.focus();
    }, GATE_DELAY);

    // Handle selection
    gate.addEventListener('click', function (e) {
      var btn = e.target.closest('.mood-gate-btn');
      if (!btn) return;
      var key = btn.dataset.moodKey;
      applyMood(key, true);

      // Dismiss gate
      gate.classList.add('gate--out');
      gate.classList.remove('gate--visible');

      // Fade in site content
      setTimeout(function () {
        if (siteContent) {
          siteContent.style.transition = 'opacity 0.65s ease';
          siteContent.style.opacity    = '1';
        }
        setTimeout(function () {
          if (gate.parentNode) gate.parentNode.removeChild(gate);
        }, 500);
      }, 300);
    });
  });


  /* ─────────────────────────────────────────────────────────────
     6. MOOD SELECTOR PANEL  (nav toggle)
  ───────────────────────────────────────────────────────────── */
  document.addEventListener('DOMContentLoaded', function () {
    var panel = document.createElement('div');
    panel.id        = 'mood-panel';
    panel.className = 'chromatic-glass';
    panel.setAttribute('role',       'listbox');
    panel.setAttribute('aria-label', 'Select mood theme');
    panel.setAttribute('aria-hidden', 'true');

    var optionsHTML = Object.keys(MOODS).map(function (k) {
      var m = MOODS[k];
      return (
        '<button class="mood-btn" role="option" data-mood-key="' + k + '" ' +
        'aria-selected="false" type="button">' +
          '<span class="mood-btn-dot" style="background:' + m.accent + '"></span>' +
          '<span class="mood-btn-inner">' +
            '<span class="mood-btn-label">' + m.label + '</span>' +
            '<span class="mood-btn-desc">'  + m.desc  + '</span>' +
          '</span>' +
        '</button>'
      );
    }).join('');

    panel.innerHTML =
      '<p class="mood-panel-eyebrow">how are we feeling?</p>' +
      '<div class="mood-options">' + optionsHTML + '</div>';

    document.body.appendChild(panel);

    function refreshActive(key) {
      panel.querySelectorAll('.mood-btn').forEach(function (btn) {
        var on = btn.dataset.moodKey === key;
        btn.classList.toggle('mood-btn--active', on);
        btn.setAttribute('aria-selected', on ? 'true' : 'false');
      });
    }
    refreshActive(activeMood);

    function openPanel() {
      var toggleEl = document.getElementById('mood-toggle');
      if (toggleEl) {
        var r = toggleEl.getBoundingClientRect();
        panel.style.top   = (r.bottom + 10) + 'px';
        panel.style.right = (window.innerWidth - r.right) + 'px';
      }
      panel.classList.add('mood-panel--open');
      panel.setAttribute('aria-hidden', 'false');
    }

    function closePanel() {
      panel.classList.remove('mood-panel--open');
      panel.setAttribute('aria-hidden', 'true');
    }

    var toggleBtn = document.getElementById('mood-toggle');
    if (toggleBtn) {
      toggleBtn.addEventListener('click', function (e) {
        e.stopPropagation();
        panel.classList.contains('mood-panel--open') ? closePanel() : openPanel();
      });
    }

    panel.addEventListener('click', function (e) {
      var btn = e.target.closest('.mood-btn');
      if (!btn) return;
      var key = btn.dataset.moodKey;
      applyMood(key, true);
      refreshActive(key);
      setTimeout(closePanel, 180);
    });

    document.addEventListener('click', function (e) {
      if (
        panel.classList.contains('mood-panel--open') &&
        !panel.contains(e.target) &&
        e.target.id !== 'mood-toggle'
      ) closePanel();
    });

    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && panel.classList.contains('mood-panel--open')) closePanel();
    });
  });


  /* ─────────────────────────────────────────────────────────────
     7. COOKIE CONSENT
  ───────────────────────────────────────────────────────────── */
  document.addEventListener('DOMContentLoaded', function () {
    var COOKIE_KEY = 'minerva-cookies-accepted';
    var decision;
    try { decision = localStorage.getItem(COOKIE_KEY); } catch (e) {}
    if (decision !== null && decision !== undefined) return;

    var MINI_FREDDY =
      '<svg viewBox="0 0 72 60" width="54" height="46" overflow="visible" ' +
      'xmlns="http://www.w3.org/2000/svg">' +
        '<path d="M40,48 C52,42 58,32 53,22" fill="none" stroke="#DDDBD4" ' +
        'stroke-width="5.5" stroke-linecap="round"/>' +
        '<polygon points="18,53 30,49 42,53 40,34 20,34" fill="#F0EFE9"/>' +
        '<polygon points="22,34 38,34 36,44 24,44" fill="#E6E4DE" opacity="0.6"/>' +
        '<circle cx="30" cy="21" r="13" fill="#F5F4F0"/>' +
        '<polygon id="ccear-l" points="16,16 21,6 27,15" fill="#F5F4F0"/>' +
        '<polygon points="18,15.5 21,8 25.5,15" fill="#F0BFC8" opacity="0.75"/>' +
        '<polygon id="ccear-r" points="33,15 39,6 44,16" fill="#F5F4F0"/>' +
        '<polygon points="34.5,15 39,8 42,15.5" fill="#F0BFC8" opacity="0.75"/>' +
        '<circle cx="24.5" cy="20" r="4.5" fill="#1A1A2E"/>' +
        '<circle cx="35.5" cy="20" r="4.5" fill="#1A1A2E"/>' +
        '<circle cx="25.9" cy="18.7" r="1.6" fill="white"/>' +
        '<circle cx="36.9" cy="18.7" r="1.6" fill="white"/>' +
        '<ellipse cx="30" cy="25.5" rx="2" ry="1.4" fill="#F0A0B5"/>' +
        '<path d="M27.8,27 Q30,29.2 32.2,27" fill="none" stroke="#D4A0AC" ' +
        'stroke-width="0.9" stroke-linecap="round"/>' +
        '<path d="M19,32 Q30,36 41,32" fill="none" stroke="#C9A84C" ' +
        'stroke-width="3.5" stroke-linecap="round"/>' +
        '<circle cx="30" cy="35" r="2.5" fill="#B8963E"/>' +
        '<g transform="translate(49,22)">' +
          '<circle cx="0" cy="0" r="9" fill="#C9A84C"/>' +
          '<circle cx="-3" cy="-2.5" r="1.6" fill="#8A6B20"/>' +
          '<circle cx="3"  cy="-3"   r="1.1" fill="#8A6B20"/>' +
          '<circle cx="-1" cy="3.5"  r="1.3" fill="#8A6B20"/>' +
          '<circle cx="4"  cy="2.5"  r="1.1" fill="#8A6B20"/>' +
          '<circle cx="1"  cy="0"    r="1"   fill="#8A6B20"/>' +
        '</g>' +
      '</svg>';

    var consent = document.createElement('div');
    consent.id        = 'cookie-consent';
    consent.className = 'chromatic-glass';
    consent.setAttribute('role',      'dialog');
    consent.setAttribute('aria-live', 'polite');

    consent.innerHTML =
      '<div class="cc-row">' +
        '<div class="cc-freddy" id="cc-freddy" aria-hidden="true">' + MINI_FREDDY + '</div>' +
        '<div class="cc-text">' +
          '<p class="cc-title">One small cookie</p>' +
          '<p class="cc-body">Freddy uses localStorage to remember your mood between visits. No tracking. No third parties.</p>' +
        '</div>' +
      '</div>' +
      '<div class="cc-actions">' +
        '<button class="btn btn-gold"      id="cc-accept"  type="button">Accept</button>' +
        '<button class="btn btn-secondary" id="cc-decline" type="button">No thanks</button>' +
      '</div>';

    document.body.appendChild(consent);

    setTimeout(function () {
      consent.classList.add('cc--visible');
    }, 5500);

    function dismiss(el) {
      el.classList.remove('cc--visible');
      setTimeout(function () {
        if (el.parentNode) el.parentNode.removeChild(el);
      }, 380);
    }

    document.getElementById('cc-accept').addEventListener('click', function () {
      try { localStorage.setItem(COOKIE_KEY, 'true'); } catch (e) {}
      dismiss(consent);
    });

    document.getElementById('cc-decline').addEventListener('click', function () {
      try { localStorage.setItem(COOKIE_KEY, 'false'); } catch (e) {}
      var earL = consent.querySelector('#ccear-l');
      var earR = consent.querySelector('#ccear-r');
      if (earL) {
        earL.setAttribute('style',
          'transform-box:fill-box;transform-origin:bottom center;' +
          'transform:rotate(-26deg) scaleY(0.72);transition:transform 380ms ease;');
      }
      if (earR) {
        earR.setAttribute('style',
          'transform-box:fill-box;transform-origin:bottom center;' +
          'transform:rotate(26deg) scaleY(0.72);transition:transform 380ms ease;');
      }
      setTimeout(function () { dismiss(consent); }, 950);
    });
  });


  /* ─────────────────────────────────────────────────────────────
     8. FREDDY INTRO TEXT  (mood-aware)
  ───────────────────────────────────────────────────────────── */
  document.addEventListener('DOMContentLoaded', function () {
    var introEl = document.querySelector('#freddy-intro .freddy-intro-text');
    var moodCfg = MOODS[activeMood] || MOODS[DEFAULT_MOOD];
    if (introEl) introEl.textContent = moodCfg.introText;
  });


  /* ─────────────────────────────────────────────────────────────
     9. CHAOTIC RANDOM BAT
  ───────────────────────────────────────────────────────────── */
  var _chaoticBatInterval = null;

  function _startChaoticBat() {
    _stopChaoticBat();
    _chaoticBatInterval = setInterval(function () {
      if (document.documentElement.getAttribute('data-mood') !== 'chaotic') return;
      if (Math.random() > 0.03) return;

      var freddyEl = document.getElementById('freddy');
      if (!freddyEl || freddyEl.classList.contains('freddy-bat')) return;

      var candidates = Array.from(
        document.querySelectorAll('.btn:not([disabled]), .card, .feature-card')
      ).filter(function (el) {
        var r = el.getBoundingClientRect();
        return r.top >= 0 && r.bottom <= window.innerHeight &&
               r.left >= 0 && r.right <= window.innerWidth;
      });
      if (!candidates.length) return;

      freddyEl.classList.add('freddy-bat');
      setTimeout(function () { freddyEl.classList.remove('freddy-bat'); }, 420);
    }, 30000);
  }

  function _stopChaoticBat() {
    if (_chaoticBatInterval) {
      clearInterval(_chaoticBatInterval);
      _chaoticBatInterval = null;
    }
  }

  document.addEventListener('DOMContentLoaded', function () {
    if (activeMood === 'chaotic') _startChaoticBat();
  });

  document.addEventListener('minerva:mood', function (e) {
    if (e.detail.mood === 'chaotic') _startChaoticBat();
    else _stopChaoticBat();
  });

})();
