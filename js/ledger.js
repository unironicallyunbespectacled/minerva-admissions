/* ═══════════════════════════════════════════════════════════════
   VERIFICATION LEDGER — js/ledger.js

   Architecture note — no backend:
   All submitted data (new competitions, result claims, vouches)
   is persisted to localStorage.  In production these would be
   replaced with API calls to a database.  The localStorage keys
   that would map to backend endpoints are:

     'minerva-ledger-submissions'  → POST /api/competitions
     'minerva-ledger-claims'       → POST /api/competitions/:id/claims
     'minerva-ledger-vouches'      → POST /api/competitions/:id/vouches
     'minerva-ledger-user-vouches' → (client-side dedup only)
     'minerva-ledger-organisers'   → POST /api/organisers/register

   Seed data is loaded from assets/data/competitions.json via
   fetch().  Locally submitted competitions are merged in at
   load time.
═══════════════════════════════════════════════════════════════ */

(function () {
  'use strict';

  /* ─────────────────────────────────────────────────────────────
     1. STORAGE KEYS
  ───────────────────────────────────────────────────────────── */
  var LS_SUBMISSIONS  = 'minerva-ledger-submissions';   // user-added competitions
  var LS_CLAIMS       = 'minerva-ledger-claims';         // result claims
  var LS_VOUCHES      = 'minerva-ledger-vouches';        // { compId: count }
  var LS_USER_VOUCHES = 'minerva-ledger-user-vouches';   // [compId, ...] — current device
  var LS_ORGANISERS   = 'minerva-ledger-organisers';     // organiser registrations

  /* ─────────────────────────────────────────────────────────────
     2. STATE
  ───────────────────────────────────────────────────────────── */
  var allCompetitions  = [];   // seed + localStorage merged
  var filteredResults  = [];
  var activeFilter     = 'all';
  var searchQuery      = '';
  var openCardId       = null; // currently expanded card
  var claimTargetId    = null; // competition being claimed
  var claimOpenerBtn   = null; // button that opened the modal (for focus return)

  /* ─────────────────────────────────────────────────────────────
     3. localStorage HELPERS
  ───────────────────────────────────────────────────────────── */
  function lsGet(key) {
    try { return JSON.parse(localStorage.getItem(key)) || null; } catch (e) { return null; }
  }
  function lsSet(key, val) {
    try { localStorage.setItem(key, JSON.stringify(val)); } catch (e) {}
  }

  function getVouches() { return lsGet(LS_VOUCHES)      || {}; }
  function getUserVouches() { return lsGet(LS_USER_VOUCHES) || []; }

  function getVouchCount(id) {
    /* Combine seed vouch count with device-added vouches */
    var seed   = 0;
    var comp   = allCompetitions.find(function (c) { return c.id === id; });
    if (comp) seed = comp.vouches || 0;
    var stored = getVouches();
    return seed + (stored[id] || 0);
  }

  function hasUserVouched(id) {
    return getUserVouches().indexOf(id) !== -1;
  }

  function addVouch(id) {
    var stored = getVouches();
    stored[id] = (stored[id] || 0) + 1;
    lsSet(LS_VOUCHES, stored);

    var userVouches = getUserVouches();
    userVouches.push(id);
    lsSet(LS_USER_VOUCHES, userVouches);
  }

  /* Auto-upgrade: if total vouches >= 3 and status is community-pending → community-verified */
  function checkVouchUpgrade(id) {
    var comp = allCompetitions.find(function (c) { return c.id === id; });
    if (!comp) return;
    if (comp.status === 'community-pending' && getVouchCount(id) >= 3) {
      comp.status = 'community-verified';
      /* Persist upgraded submissions if it was user-added */
      var subs = lsGet(LS_SUBMISSIONS) || [];
      var idx  = subs.findIndex(function (s) { return s.id === id; });
      if (idx !== -1) {
        subs[idx].status = 'community-verified';
        lsSet(LS_SUBMISSIONS, subs);
      }
    }
  }

  /* ─────────────────────────────────────────────────────────────
     4. DATA LOAD
  ───────────────────────────────────────────────────────────── */
  function loadData() {
    fetch('../assets/data/competitions.json')
      .then(function (r) { return r.json(); })
      .then(function (seed) {
        /* Merge localStorage submissions */
        var subs = lsGet(LS_SUBMISSIONS) || [];
        allCompetitions = seed.concat(subs);
        /* Apply any auto-upgrades from stored vouches */
        allCompetitions.forEach(function (c) { checkVouchUpgrade(c.id); });
        renderResults();
      })
      .catch(function () {
        /* Fallback if fetch fails (e.g. opened as local file without server) */
        var subs = lsGet(LS_SUBMISSIONS) || [];
        allCompetitions = subs;
        renderResults();
      });
  }

  /* ─────────────────────────────────────────────────────────────
     5. SEARCH & FILTER
  ───────────────────────────────────────────────────────────── */
  function filterCompetitions() {
    var q = searchQuery.trim().toLowerCase();
    filteredResults = allCompetitions.filter(function (c) {
      var matchesFilter = activeFilter === 'all' ||
        c.country.toLowerCase().indexOf(activeFilter.toLowerCase()) !== -1 ||
        c.region.toLowerCase().indexOf(activeFilter.toLowerCase()) !== -1;

      if (!matchesFilter) return false;
      if (!q) return true;

      return (
        c.name.toLowerCase().indexOf(q)        !== -1 ||
        c.country.toLowerCase().indexOf(q)     !== -1 ||
        c.region.toLowerCase().indexOf(q)      !== -1 ||
        c.description.toLowerCase().indexOf(q) !== -1
      );
    });
  }

  /* ─────────────────────────────────────────────────────────────
     6. BADGE HELPERS
  ───────────────────────────────────────────────────────────── */
  var BADGE_MAP = {
    'organiser-verified':  { cls: 'badge-sage',    label: 'Organiser Verified' },
    'community-verified':  { cls: 'badge-sage',    label: 'Community Verified' },
    'community-pending':   { cls: 'badge-pending', label: 'Community Pending' },
    'recently-added':      { cls: 'badge-gold',    label: 'Recently Added' },
  };

  function badgeForStatus(status) {
    return BADGE_MAP[status] || { cls: 'badge-pending', label: 'Pending' };
  }

  /* ─────────────────────────────────────────────────────────────
     7. DOM HELPERS
  ───────────────────────────────────────────────────────────── */
  function el(tag, attrs, html) {
    var e = document.createElement(tag);
    if (attrs) Object.keys(attrs).forEach(function (k) {
      if      (k === 'className') e.className = attrs[k];
      else if (k === 'style')     e.style.cssText = attrs[k];
      else                        e.setAttribute(k, attrs[k]);
    });
    if (html !== undefined) e.innerHTML = html;
    return e;
  }

  /* ─────────────────────────────────────────────────────────────
     8. RENDER RESULTS
  ───────────────────────────────────────────────────────────── */
  var listEl       = document.getElementById('results-list');
  var countEl      = document.getElementById('results-count');
  var notFoundEl   = document.getElementById('not-found-state');
  var notFoundTerm = document.getElementById('not-found-term');

  function renderResults() {
    filterCompetitions();
    listEl.innerHTML = '';

    if (filteredResults.length === 0) {
      notFoundEl.style.display = 'block';
      countEl.textContent = '';
      if (searchQuery.trim()) {
        notFoundTerm.textContent = '\u201c' + searchQuery.trim() + '\u201d';
      } else {
        notFoundTerm.textContent = 'any competitions matching that filter';
      }
      return;
    }

    notFoundEl.style.display = 'none';
    countEl.textContent = filteredResults.length + ' competition' +
                          (filteredResults.length === 1 ? '' : 's') + ' found';

    filteredResults.forEach(function (comp, i) {
      var card = buildCard(comp);
      card.style.animationDelay = (i * 0.04) + 's';
      card.classList.add('reveal-target');
      listEl.appendChild(card);

      /* Kick IntersectionObserver for the card */
      setTimeout(function () {
        card.classList.add('revealed');
      }, 50 + i * 40);
    });
  }

  function buildCard(comp) {
    var badge    = badgeForStatus(comp.status);
    var isOpen   = openCardId === comp.id;
    var vouches  = getVouchCount(comp.id);
    var hasResult= Array.isArray(comp.results) && comp.results.length > 0;

    /* ── Card wrapper ── */
    var card     = el('div', { className: 'comp-card' + (isOpen ? ' card-open' : ''), 'data-id': comp.id });

    /* ── Header (toggle area) ── */
    var header   = el('div', {
      className:  'comp-card-header',
      tabindex:   '0',
      role:       'button',
      'aria-expanded': isOpen ? 'true' : 'false',
      'aria-controls': 'card-body-' + comp.id,
    });

    var meta     = el('div', { className: 'comp-meta' });
    var nameEl   = el('h3',  { className: 'comp-name' });
    nameEl.textContent = comp.name;

    var infoRow  = el('div', { className: 'comp-info-row' });
    var regionSpan = el('span', {});
    regionSpan.innerHTML = '<svg width="12" height="12" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true"><circle cx="8" cy="6" r="3"/><path d="M8 15s-5-5-5-9a5 5 0 0110 0c0 4-5 9-5 9z"/></svg>';
    regionSpan.appendChild(document.createTextNode(' ' + comp.region));

    var yearSpan = el('span', {});
    yearSpan.innerHTML = '<svg width="12" height="12" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true"><rect x="1" y="3" width="14" height="11" rx="2"/><line x1="1" y1="7" x2="15" y2="7"/><line x1="5" y1="1" x2="5" y2="5"/><line x1="11" y1="1" x2="11" y2="5"/></svg>';
    yearSpan.appendChild(document.createTextNode(' ' + comp.year));

    var countSpan = el('span', {});
    countSpan.innerHTML = '<svg width="12" height="12" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true"><circle cx="8" cy="5" r="3"/><path d="M2 14c0-3.3 2.7-6 6-6s6 2.7 6 6"/></svg>';
    countSpan.appendChild(document.createTextNode(' ' + (hasResult ? comp.results.length + ' listed' : 'No results yet')));

    infoRow.appendChild(regionSpan);
    infoRow.appendChild(yearSpan);
    infoRow.appendChild(countSpan);

    var badgeEl  = el('span', { className: 'badge ' + badge.cls }, badge.label);

    meta.appendChild(nameEl);
    meta.appendChild(infoRow);
    meta.appendChild(badgeEl);

    /* chevron */
    var chevron = el('span', { className: 'comp-chevron', 'aria-hidden': 'true' });
    chevron.innerHTML = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><polyline points="6 9 12 15 18 9"/></svg>';

    header.appendChild(meta);
    header.appendChild(chevron);

    /* ── Body ── */
    var bodyWrap = el('div', { className: 'comp-card-body-wrap' + (isOpen ? ' open' : ''), id: 'card-body-' + comp.id });
    var body     = el('div', { className: 'comp-card-body' });

    /* Description */
    var descEl = el('p', { className: 'comp-desc' });
    descEl.textContent = comp.description;
    body.appendChild(descEl);

    /* Organiser contact */
    if (comp.organiserContact) {
      var orgRow = el('p', { style: 'font-size:13px;color:var(--color-academic);margin-bottom:var(--sp-4);' });
      orgRow.innerHTML = '<strong style="color:var(--color-ink)">Organiser:</strong> ';
      var orgLink = el('a', { href: 'mailto:' + comp.organiserContact });
      orgLink.textContent = comp.organiserContact;
      orgRow.appendChild(orgLink);
      body.appendChild(orgRow);
    }

    /* Results table */
    if (hasResult) {
      var rt = el('p', { className: 'results-section-title' }, 'Verified results');
      body.appendChild(rt);

      var claims = getClaims(comp.id);
      var allRows = comp.results.concat(claims.map(function (c) {
        return { rank: c.placement, name: c.fullName + ' (Pending Review)', school: c.school, result: 'Pending' };
      }));

      var table = el('table', { className: 'results-table', role: 'table' });
      var thead = el('thead', {});
      var hrow  = el('tr', {});
      ['Rank', 'Name', 'School', 'Result'].forEach(function (h) {
        hrow.appendChild(el('th', { scope: 'col' }, h));
      });
      thead.appendChild(hrow);
      table.appendChild(thead);

      var tbody = el('tbody', {});
      allRows.forEach(function (r) {
        var tr = el('tr', {});
        [r.rank, r.name, r.school, r.result].forEach(function (cell) {
          var td = el('td', {});
          td.textContent = cell || '\u2014';
          tr.appendChild(td);
        });
        tbody.appendChild(tr);
      });
      table.appendChild(tbody);
      body.appendChild(table);
    } else {
      var noRes = el('p', { style: 'font-size:14px;color:var(--color-academic);margin-bottom:var(--sp-5);font-style:italic;' },
        'No results are listed yet. If you competed, claim your result below.');
      body.appendChild(noRes);
    }

    /* Actions */
    var actions = el('div', { className: 'comp-actions' });

    /* Claim button */
    var claimBtn = el('button', { className: 'btn btn-gold', type: 'button', 'data-claim-id': comp.id });
    claimBtn.textContent = 'I competed in this \u2014 claim my result';
    claimBtn.addEventListener('click', function () {
      openClaimModal(comp.id, comp.name, claimBtn);
    });
    actions.appendChild(claimBtn);

    /* Share link */
    var shareBtn = el('button', { className: 'btn btn-secondary', type: 'button' });
    shareBtn.textContent = 'Share this record';
    shareBtn.addEventListener('click', function () {
      var url = window.location.origin + window.location.pathname + '?comp=' + comp.id;
      try {
        navigator.clipboard.writeText(url).then(function () {
          shareBtn.textContent = 'Link copied \u2713';
          setTimeout(function () { shareBtn.textContent = 'Share this record'; }, 2000);
        });
      } catch (e) {
        prompt('Copy this link:', url);
      }
    });
    actions.appendChild(shareBtn);

    body.appendChild(actions);

    /* ── Vouch row ── */
    var totalVouches = vouches;
    var needed       = Math.max(0, 3 - totalVouches);
    var userVouched  = hasUserVouched(comp.id);
    var isVerified   = comp.status === 'organiser-verified' || comp.status === 'community-verified';

    var vouchRow = el('div', { className: 'vouch-row' });
    var vouchText = el('div', { className: 'vouch-text' });

    if (isVerified) {
      vouchText.innerHTML =
        '<strong>' + totalVouches + ' students</strong> have confirmed participating in this competition.';
    } else if (needed <= 0) {
      vouchText.innerHTML = 'Community Verified \u2014 enough students have confirmed this competition.';
    } else {
      vouchText.innerHTML =
        '<strong>' + totalVouches + ' of 3 vouches</strong> needed for Community Verified. ' +
        totalVouches + ' other ' + (totalVouches === 1 ? 'student has' : 'students have') +
        ' confirmed this competition.';
    }
    vouchRow.appendChild(vouchText);

    if (!isVerified && !userVouched) {
      var vouchBtn = el('button', { className: 'btn btn-secondary', type: 'button', style: 'font-size:13px;padding:8px 16px;' });
      vouchBtn.textContent = 'I can confirm this competition exists';
      vouchBtn.addEventListener('click', function () {
        addVouch(comp.id);
        checkVouchUpgrade(comp.id);
        vouchBtn.textContent = 'Vouched \u2713';
        vouchBtn.disabled = true;
        /* Update vouch text inline */
        var newCount = getVouchCount(comp.id);
        if (comp.status === 'community-verified') {
          vouchText.innerHTML = 'Community Verified \u2014 enough students have confirmed this competition.';
        } else {
          vouchText.innerHTML =
            '<strong>' + newCount + ' of 3 vouches</strong> needed for Community Verified.';
        }
      });
      vouchRow.appendChild(vouchBtn);
    } else if (userVouched) {
      var vouchedEl = el('span', { style: 'font-size:13px;color:var(--color-sage);' }, 'You vouched \u2713');
      vouchRow.appendChild(vouchedEl);
    }

    body.appendChild(vouchRow);
    bodyWrap.appendChild(body);

    /* ── Assemble card ── */
    card.appendChild(header);
    card.appendChild(bodyWrap);

    /* ── Toggle interaction ── */
    function toggleCard() {
      var isCurrentlyOpen = card.classList.contains('card-open');
      /* Close all others */
      document.querySelectorAll('.comp-card.card-open').forEach(function (c) {
        c.classList.remove('card-open');
        c.querySelector('.comp-card-body-wrap').classList.remove('open');
        c.querySelector('.comp-card-header').setAttribute('aria-expanded', 'false');
      });
      if (!isCurrentlyOpen) {
        card.classList.add('card-open');
        bodyWrap.classList.add('open');
        header.setAttribute('aria-expanded', 'true');
        openCardId = comp.id;
      } else {
        openCardId = null;
      }
    }

    header.addEventListener('click', toggleCard);
    header.addEventListener('keydown', function (e) {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); toggleCard(); }
    });

    return card;
  }

  /* ─────────────────────────────────────────────────────────────
     9. CLAIMS
  ───────────────────────────────────────────────────────────── */
  function getClaims(compId) {
    var all = lsGet(LS_CLAIMS) || [];
    return all.filter(function (c) { return c.compId === compId; });
  }

  function saveClaim(claim) {
    var all = lsGet(LS_CLAIMS) || [];
    all.push(claim);
    lsSet(LS_CLAIMS, all);
  }

  /* ─────────────────────────────────────────────────────────────
     10. CLAIM MODAL
  ───────────────────────────────────────────────────────────── */
  var claimModal     = document.getElementById('claim-modal');
  var claimCloseBtn  = document.getElementById('claim-modal-close');
  var claimCompName  = document.getElementById('claim-comp-name');
  var claimForm      = document.getElementById('claim-form');
  var claimFormContent = document.getElementById('claim-form-content');
  var claimSuccess   = document.getElementById('claim-success');

  function openClaimModal(compId, compName, openerBtn) {
    claimTargetId   = compId;
    claimOpenerBtn  = openerBtn || null;
    claimCompName.textContent = compName;
    claimFormContent.style.display = '';
    claimSuccess.style.display     = 'none';
    claimForm.reset();

    claimModal.removeAttribute('aria-hidden');
    claimModal.classList.add('modal-open');
    document.body.style.overflow = 'hidden';

    /* Move focus to first input */
    setTimeout(function () {
      var first = claimModal.querySelector('input, select, textarea, button');
      if (first) first.focus();
    }, 50);
  }

  function closeClaimModal() {
    claimModal.classList.remove('modal-open');
    claimModal.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
    claimTargetId = null;

    /* Return focus */
    if (claimOpenerBtn) {
      claimOpenerBtn.focus();
      claimOpenerBtn = null;
    }
  }

  claimCloseBtn.addEventListener('click', closeClaimModal);

  /* Close on overlay click */
  claimModal.addEventListener('click', function (e) {
    if (e.target === claimModal) closeClaimModal();
  });

  /* Close on Escape */
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && claimModal.classList.contains('modal-open')) closeClaimModal();
  });

  /* Focus trap inside modal */
  claimModal.addEventListener('keydown', function (e) {
    if (e.key !== 'Tab' || !claimModal.classList.contains('modal-open')) return;
    var focusable = Array.from(
      claimModal.querySelectorAll('a,button:not([disabled]),input,select,textarea,[tabindex]:not([tabindex="-1"])')
    ).filter(function (el) { return !el.closest('[style*="display:none"]'); });
    if (!focusable.length) return;
    var first = focusable[0];
    var last  = focusable[focusable.length - 1];
    if (e.shiftKey && document.activeElement === first) {
      e.preventDefault(); last.focus();
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault(); first.focus();
    }
  });

  /* Claim form submit */
  claimForm.addEventListener('submit', function (e) {
    e.preventDefault();
    var name      = document.getElementById('cl-name').value.trim();
    var placement = document.getElementById('cl-placement').value.trim();
    var school    = document.getElementById('cl-school').value.trim();
    var email     = document.getElementById('cl-email').value.trim();

    if (!name || !placement || !school || !email) {
      showToast('Please fill in all required fields.');
      return;
    }
    if (!isValidEmail(email)) {
      showToast('That email address doesn\u2019t look right.');
      return;
    }

    saveClaim({
      compId:     claimTargetId,
      fullName:   name,
      placement:  placement,
      school:     school,
      email:      email,
      status:     'pending-review',
      submitted:  new Date().toISOString(),
    });

    claimFormContent.style.display = 'none';
    claimSuccess.style.display     = 'block';
    claimSuccess.querySelector('h3').focus();

    /* Refresh card to show pending entry */
    renderResults();
  });

  /* ─────────────────────────────────────────────────────────────
     11. ADD COMPETITION FORM
  ───────────────────────────────────────────────────────────── */
  var addForm     = document.getElementById('add-comp-form');
  var acStatus    = document.getElementById('ac-status');

  addForm.addEventListener('submit', function (e) {
    e.preventDefault();
    var name  = document.getElementById('ac-name').value.trim();
    var region= document.getElementById('ac-region').value.trim();
    var year  = document.getElementById('ac-year').value.trim();
    var desc  = document.getElementById('ac-desc').value.trim();
    var email = document.getElementById('ac-email').value.trim();

    /* Simple validation */
    var valid = true;
    if (!name)  { showFieldErr('ac-name',   'ac-name-err',   true); valid = false; }
    else         { showFieldErr('ac-name',   'ac-name-err',   false); }
    if (!email || !isValidEmail(email)) {
      showToast('Please enter a valid email address.');
      valid = false;
    }
    if (!region || !year || !desc) {
      showToast('Please fill in all required fields.');
      valid = false;
    }
    if (!valid) return;

    var newComp = {
      id:          'user-' + Date.now(),
      name:        name,
      country:     region,
      region:      region,
      year:        year,
      description: desc,
      status:      'recently-added',
      organiserContact: email,
      website:     document.getElementById('ac-website').value.trim() || null,
      vouches:     0,
      results:     parseCsvResults(document.getElementById('ac-results-csv').value),
    };

    var subs = lsGet(LS_SUBMISSIONS) || [];
    subs.push(newComp);
    lsSet(LS_SUBMISSIONS, subs);

    allCompetitions.push(newComp);

    acStatus.textContent = 'Competition added \u2014 it will appear in search as \u201cRecently Added.\u201d';
    acStatus.className   = 'form-status-msg visible';
    addForm.reset();

    setTimeout(function () {
      acStatus.className = 'form-status-msg';
    }, 5000);

    renderResults();
  });

  function showFieldErr(inputId, errId, show) {
    var inp = document.getElementById(inputId);
    var err = document.getElementById(errId);
    if (!inp || !err) return;
    if (show) {
      inp.classList.add('error');
      err.style.display = 'flex';
    } else {
      inp.classList.remove('error');
      err.style.display = 'none';
    }
  }

  function parseCsvResults(raw) {
    if (!raw || !raw.trim()) return [];
    return raw.trim().split('\n').map(function (line, i) {
      var parts = line.split(',').map(function (p) { return p.trim(); });
      return {
        rank:   (i + 1) + '',
        name:   parts[0] || '',
        school: parts[1] || '',
        result: parts[3] || parts[2] || '',
      };
    }).filter(function (r) { return r.name; });
  }

  /* ─────────────────────────────────────────────────────────────
     12. ORGANISER FORM
  ───────────────────────────────────────────────────────────── */
  var orgForm   = document.getElementById('organiser-reg-form');
  var orgStatus = document.getElementById('org-status');

  orgForm.addEventListener('submit', function (e) {
    e.preventDefault();
    var orgName  = document.getElementById('org-orgname').value.trim();
    var email    = document.getElementById('org-email').value.trim();
    var compName = document.getElementById('org-compname').value.trim();

    if (!orgName || !email || !compName || !isValidEmail(email)) {
      showToast('Please fill in all required fields with a valid email.');
      return;
    }

    var reg = {
      orgName:  orgName,
      email:    email,
      compName: compName,
      submitted: new Date().toISOString(),
    };
    var regs = lsGet(LS_ORGANISERS) || [];
    regs.push(reg);
    lsSet(LS_ORGANISERS, regs);

    orgStatus.textContent = 'Submitted. We will be in touch at ' + email + ' within 48 hours.';
    orgStatus.className   = 'form-status-msg visible';
    orgForm.reset();
  });

  /* ─────────────────────────────────────────────────────────────
     13. TAB NAVIGATION
  ───────────────────────────────────────────────────────────── */
  document.querySelectorAll('.ledger-tab').forEach(function (tab) {
    tab.addEventListener('click', function () {
      document.querySelectorAll('.ledger-tab').forEach(function (t) {
        t.classList.remove('tab-active');
        t.setAttribute('aria-selected', 'false');
      });
      document.querySelectorAll('.ledger-panel').forEach(function (p) {
        p.classList.remove('panel-active');
      });
      tab.classList.add('tab-active');
      tab.setAttribute('aria-selected', 'true');
      var panelId = tab.getAttribute('aria-controls');
      var panel   = document.getElementById(panelId);
      if (panel) panel.classList.add('panel-active');
    });
  });

  /* ─────────────────────────────────────────────────────────────
     14. SEARCH + FILTER EVENTS
  ───────────────────────────────────────────────────────────── */
  var searchInput = document.getElementById('ledger-search');

  searchInput.addEventListener('input', function () {
    searchQuery = searchInput.value;
    openCardId  = null;
    renderResults();
  });

  /* "Not found" add button pre-fills the form and scrolls to it */
  document.getElementById('not-found-add-btn').addEventListener('click', function () {
    var nameInput = document.getElementById('ac-name');
    if (nameInput && searchQuery.trim()) {
      nameInput.value = searchQuery.trim();
    }
    var section = document.getElementById('add-competition-section');
    if (section) section.scrollIntoView({ behavior: 'smooth', block: 'start' });
    if (nameInput) setTimeout(function () { nameInput.focus(); }, 400);
  });

  /* Filter pills */
  document.querySelectorAll('.filter-pill').forEach(function (pill) {
    pill.addEventListener('click', function () {
      document.querySelectorAll('.filter-pill').forEach(function (p) {
        p.classList.remove('pill-active');
      });
      pill.classList.add('pill-active');
      activeFilter = pill.getAttribute('data-filter');
      openCardId   = null;
      renderResults();
    });
  });

  /* Deep-link: ?comp=id opens that card on load */
  function checkDeepLink() {
    var params = new URLSearchParams(window.location.search);
    var compId = params.get('comp');
    if (compId) {
      openCardId = compId;
      /* Scroll to it */
      setTimeout(function () {
        var card = document.querySelector('.comp-card[data-id="' + compId + '"]');
        if (card) card.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 300);
    }
  }

  /* Register as Organiser button scrolls to form */
  var regBtn = document.getElementById('register-organiser-btn');
  if (regBtn) {
    regBtn.addEventListener('click', function (e) {
      e.preventDefault();
      var form = document.getElementById('organiser-form');
      if (form) form.scrollIntoView({ behavior: 'smooth', block: 'start' });
      var first = form.querySelector('input, select, textarea');
      if (first) setTimeout(function () { first.focus(); }, 400);
    });
  }

  /* ─────────────────────────────────────────────────────────────
     15. TOAST
  ───────────────────────────────────────────────────────────── */
  function showToast(msg) {
    var existing = document.getElementById('ledger-toast');
    if (existing) existing.parentNode.removeChild(existing);

    var toast = document.createElement('div');
    toast.id        = 'ledger-toast';
    toast.setAttribute('role', 'alert');
    toast.setAttribute('aria-live', 'assertive');
    Object.assign(toast.style, {
      position:    'fixed',
      bottom:      '24px',
      left:        '50%',
      transform:   'translateX(-50%)',
      background:  'var(--color-ink)',
      color:       '#fff',
      fontFamily:  'var(--font-body)',
      fontSize:    '13px',
      padding:     '10px 20px',
      borderRadius: '9999px',
      zIndex:      '9000',
      opacity:     '0',
      transition:  'opacity 200ms ease',
      pointerEvents: 'none',
      whiteSpace:  'nowrap',
    });
    toast.textContent = msg;
    document.body.appendChild(toast);
    requestAnimationFrame(function () { toast.style.opacity = '1'; });
    setTimeout(function () {
      toast.style.opacity = '0';
      setTimeout(function () { if (toast.parentNode) toast.parentNode.removeChild(toast); }, 220);
    }, 3000);
  }

  /* ─────────────────────────────────────────────────────────────
     16. UTILS
  ───────────────────────────────────────────────────────────── */
  function isValidEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  }

  /* ─────────────────────────────────────────────────────────────
     17. INIT
  ───────────────────────────────────────────────────────────── */
  document.addEventListener('DOMContentLoaded', function () {
    loadData();
    checkDeepLink();
  });

})();
