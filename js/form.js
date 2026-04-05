/* ═══════════════════════════════════════════════════════════════
   MINERVA APPLICATION FORM — js/form.js
   Sections:
   1.  Data: countries, subjects, GPA hints
   2.  State
   3.  Init (DOMContentLoaded)
   4.  Progress bar
   5.  Step navigation & slide transitions
   6.  Validation per step
   7.  Error UI helpers
   8.  Auto-save (debounced)
   9.  Draft collect / load
   10. Accomplishment blocks
   11. Language tags
   12. Essay word counters
   13. Grading system hint
   14. Review step builder
   15. Submit handler
═══════════════════════════════════════════════════════════════ */
(function () {
  'use strict';

  /* ─────────────────────────────────────────────────────────────
     1. DATA
  ───────────────────────────────────────────────────────────── */
  var COUNTRIES = [
    'Afghanistan','Albania','Algeria','Andorra','Angola','Antigua and Barbuda',
    'Argentina','Armenia','Australia','Austria','Azerbaijan','Bahamas','Bahrain',
    'Bangladesh','Barbados','Belarus','Belgium','Belize','Benin','Bhutan',
    'Bolivia','Bosnia and Herzegovina','Botswana','Brazil','Brunei','Bulgaria',
    'Burkina Faso','Burundi','Cabo Verde','Cambodia','Cameroon','Canada',
    'Central African Republic','Chad','Chile','China','Colombia','Comoros',
    'Congo (Republic)','Congo (DRC)','Costa Rica','Croatia','Cuba','Cyprus',
    'Czech Republic','Denmark','Djibouti','Dominica','Dominican Republic',
    'Ecuador','Egypt','El Salvador','Equatorial Guinea','Eritrea','Estonia',
    'Eswatini','Ethiopia','Fiji','Finland','France','Gabon','Gambia','Georgia',
    'Germany','Ghana','Greece','Grenada','Guatemala','Guinea','Guinea-Bissau',
    'Guyana','Haiti','Honduras','Hungary','Iceland','India','Indonesia','Iran',
    'Iraq','Ireland','Israel','Italy','Jamaica','Japan','Jordan','Kazakhstan',
    'Kenya','Kiribati','Kuwait','Kyrgyzstan','Laos','Latvia','Lebanon',
    'Lesotho','Liberia','Libya','Liechtenstein','Lithuania','Luxembourg',
    'Madagascar','Malawi','Malaysia','Maldives','Mali','Malta',
    'Marshall Islands','Mauritania','Mauritius','Mexico','Micronesia','Moldova',
    'Monaco','Mongolia','Montenegro','Morocco','Mozambique','Myanmar','Namibia',
    'Nauru','Nepal','Netherlands','New Zealand','Nicaragua','Niger','Nigeria',
    'North Korea','North Macedonia','Norway','Oman','Pakistan','Palau',
    'Palestine','Panama','Papua New Guinea','Paraguay','Peru','Philippines',
    'Poland','Portugal','Qatar','Romania','Russia','Rwanda',
    'Saint Kitts and Nevis','Saint Lucia','Saint Vincent and the Grenadines',
    'Samoa','San Marino','São Tomé and Príncipe','Saudi Arabia','Senegal',
    'Serbia','Seychelles','Sierra Leone','Singapore','Slovakia','Slovenia',
    'Solomon Islands','Somalia','South Africa','South Korea','South Sudan',
    'Spain','Sri Lanka','Sudan','Suriname','Sweden','Switzerland','Syria',
    'Taiwan','Tajikistan','Tanzania','Thailand','Timor-Leste','Togo','Tonga',
    'Trinidad and Tobago','Tunisia','Turkey','Turkmenistan','Tuvalu','Uganda',
    'Ukraine','United Arab Emirates','United Kingdom','United States',
    'Uruguay','Uzbekistan','Vanuatu','Vatican City','Venezuela','Vietnam',
    'Yemen','Zambia','Zimbabwe'
  ];

  var SUBJECTS = [
    'Mathematics','Physics','Chemistry','Biology',
    'Computer Science','History','Geography','Economics',
    'Literature','Philosophy','Psychology','Sociology',
    'Art & Design','Music','Languages','Engineering'
  ];

  var GPA_HINTS = {
    'gpa':        'Out of 4.0 (or 5.0 if weighted). e.g. 3.7',
    'ib':         'Out of 45 total points. e.g. 38',
    'a-levels':   'e.g. A*A*A or three A grades',
    'percentage': 'Your percentage score. e.g. 87',
    'other':      'Describe your score in your school\'s format'
  };

  var GPA_PLACEHOLDERS = {
    'gpa':        'e.g. 3.8',
    'ib':         'e.g. 38',
    'a-levels':   'e.g. A*A*A',
    'percentage': 'e.g. 87',
    'other':      'e.g. 92/100'
  };

  var ACC_CATEGORIES = [
    'Academic competition','Sports','Community','Art / Music',
    'Work / Business','Research','Leadership','Other'
  ];


  /* ─────────────────────────────────────────────────────────────
     2. STATE
  ───────────────────────────────────────────────────────────── */
  var DRAFT_KEY      = 'minerva-draft';
  var TOTAL_STEPS    = 6;
  var MAX_ACC        = 6;
  var currentStep    = 1;
  var langTags       = [];
  var accCount       = 0;
  var saveTimeout    = null;
  var lastSaveTime   = null;
  var saveTimer      = null;
  var halfwayFlags   = {};   // tracks essay halfway-flash state


  /* ─────────────────────────────────────────────────────────────
     3. INIT
  ───────────────────────────────────────────────────────────── */
  document.addEventListener('DOMContentLoaded', function () {
    populateCountries();
    populateSubjects();
    setupNavButtons();
    setupGradingHint();
    setupLanguageTags();
    addAccBlock(null);           // seed first accomplishment block
    setupAccAddBtn();
    setupEssayCounters();
    setupEmailBlurValidation();
    setupInputErrorClear();
    loadDraft();
    setupAutoSave();
    startSaveTimerDisplay();
    updateProgress();
  });


  /* ─────────────────────────────────────────────────────────────
     4. PROGRESS BAR
  ───────────────────────────────────────────────────────────── */
  // Steps → phase:  1-2=Background, 3-4=Academic, 5=Essays, 6=Submit
  var PHASE_MAP = { 1:1, 2:1, 3:2, 4:2, 5:3, 6:4 };

  function updateProgress() {
    var activePhase = PHASE_MAP[currentStep] || 1;

    document.querySelectorAll('.phase-label').forEach(function (el) {
      var p = parseInt(el.getAttribute('data-phase'), 10);
      el.classList.remove('active', 'complete');
      if (p === activePhase)       el.classList.add('active');
      else if (p < activePhase)    el.classList.add('complete');
    });

    var pct  = ((currentStep - 1) / (TOTAL_STEPS - 1)) * 100;
    var fill = document.getElementById('progress-fill');
    if (fill) {
      fill.style.width = pct + '%';
      fill.setAttribute('aria-valuenow', currentStep);
    }
  }


  /* ─────────────────────────────────────────────────────────────
     5. STEP NAVIGATION & SLIDE TRANSITIONS
  ───────────────────────────────────────────────────────────── */
  function setupNavButtons() {
    for (var i = 1; i <= TOTAL_STEPS; i++) {
      var nBtn = document.getElementById('next-' + i);
      var bBtn = document.getElementById('back-' + i);
      if (nBtn) nBtn.addEventListener('click', makeNextCb(i));
      if (bBtn) bBtn.addEventListener('click', makeBackCb(i));
    }
    var sub = document.getElementById('submit-btn');
    if (sub) sub.addEventListener('click', handleSubmit);
  }

  function makeNextCb(step) {
    return function () {
      var errs = validateStep(step);
      if (errs.length) { showErrors(errs); scrollToFirstError(); return; }
      clearStepErrors(step);
      if (step === 5) buildReviewStep();
      goToStep(step + 1, 'forward');
    };
  }

  function makeBackCb(step) {
    return function () { goToStep(step - 1, 'back'); };
  }

  function goToStep(next, dir) {
    if (next < 1 || next > TOTAL_STEPS) return;
    var clip   = document.getElementById('steps-viewport');
    var fromEl = document.querySelector('.form-step.step--active');
    var toEl   = document.getElementById('step-' + next);
    if (!fromEl || !toEl || fromEl === toEl) return;

    var W     = clip.offsetWidth;
    var fromX = dir === 'forward' ? -W :  W;
    var toX   = dir === 'forward' ?  W : -W;

    // Lock clip height so content doesn't reflow during animation
    clip.style.height = fromEl.scrollHeight + 'px';

    // Position incoming step off-screen with no transition
    toEl.style.cssText =
      'display:block;position:absolute;top:0;left:0;width:100%;' +
      'transform:translateX(' + toX + 'px);transition:none;';

    toEl.getBoundingClientRect(); // force reflow

    // Animate both simultaneously
    fromEl.style.transition = 'transform 250ms ease-in';
    fromEl.style.transform  = 'translateX(' + fromX + 'px)';
    toEl.style.transition   = 'transform 250ms ease-out';
    toEl.style.transform    = 'translateX(0)';

    setTimeout(function () {
      fromEl.classList.remove('step--active');
      fromEl.style.cssText = 'display:none;';
      toEl.style.cssText   = 'display:block;';
      toEl.classList.add('step--active');
      clip.style.height = '';
      currentStep = next;
      updateProgress();
      window.scrollTo({ top: 0, behavior: 'smooth' });
      debouncedSave();
    }, 265);
  }


  /* ─────────────────────────────────────────────────────────────
     6. VALIDATION
  ───────────────────────────────────────────────────────────── */
  function isNervous() {
    return document.documentElement.getAttribute('data-mood') === 'nervous';
  }

  /* Returns "standard" msg normally, "nervous" msg when in NERVOUS mode */
  function msg(standard, nervous) {
    return isNervous() ? nervous : standard;
  }

  function validateStep(step) {
    var errs = [];

    if (step === 1) {
      reqField('given-name',     'fg-given-name',
        msg('Please enter your given name', 'We need your given name to continue'), errs);
      reqField('family-name',    'fg-family-name',
        msg('Please enter your family name', 'We need your family name to continue'), errs);
      if (!document.querySelector('input[name="pronouns"]:checked')) {
        errs.push({ groupId: 'fg-pronouns',
          msg: msg('Please select your pronouns', 'Just let us know what to call you') });
      }
      reqSelect('country-origin', 'fg-country-origin',
        msg('Please select your country of origin', 'We need your country of origin to continue'), errs);
      reqSelect('country-study',  'fg-country-study',
        msg('Please select where you currently study', 'We need to know where you study to continue'), errs);
    }

    if (step === 2) {
      reqField('email', 'fg-email',
        msg('Please enter your email address', 'We need your email so we can reach you'), errs);
      var emailVal = val('email');
      if (emailVal && !isEmail(emailVal)) {
        errs.push({ groupId: 'fg-email',
          msg: 'Please enter a valid email address (e.g. you@example.com)' });
      }
      reqField('school-name', 'fg-school-name',
        msg('Please tell us your current school', 'We need your school name to continue'), errs);
      reqSelect('grade', 'fg-grade',
        msg('Please select your current grade or year', 'We need to know your year level'), errs);
    }

    if (step === 3) {
      reqSelect('grading-system', 'fg-grading-system',
        msg('Please select your grading system', 'We need to know your grading system'), errs);
      reqField('score', 'fg-score',
        msg('Please enter your current score or GPA', 'We need your current score to continue'), errs);
    }

    if (step === 4) {
      var firstBlock = document.querySelector('.acc-block');
      if (firstBlock) {
        var cat   = firstBlock.querySelector('.acc-category');
        var title = firstBlock.querySelector('.acc-title');
        if (cat && !cat.value) {
          errs.push({ el: cat,
            msg: 'Please select a category for your first accomplishment' });
        }
        if (title && !title.value.trim()) {
          errs.push({ el: title,
            msg: 'Please give your first accomplishment a title' });
        }
      }
    }

    if (step === 5) {
      var e1 = document.getElementById('essay1');
      var e2 = document.getElementById('essay2');
      if (e1 && wordCount(e1.value) < 10) {
        errs.push({ groupId: 'fg-essay1',
          msg: msg('Please write at least a few sentences for Essay 1',
                   'Take your time — even a few sentences is a start for Essay 1') });
      }
      if (e2 && wordCount(e2.value) < 10) {
        errs.push({ groupId: 'fg-essay2',
          msg: msg('Please write at least a few sentences for Essay 2',
                   'You\'ve got this — even a few sentences works for Essay 2') });
      }
    }

    return errs;
  }

  function reqField(id, groupId, message, errs) {
    var el = document.getElementById(id);
    if (el && !el.value.trim()) errs.push({ groupId: groupId, msg: message });
  }

  function reqSelect(id, groupId, message, errs) {
    var el = document.getElementById(id);
    if (el && !el.value) errs.push({ groupId: groupId, msg: message });
  }

  function val(id) {
    var el = document.getElementById(id);
    return el ? el.value.trim() : '';
  }

  function isEmail(v) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
  }

  function wordCount(text) {
    return text.trim().split(/\s+/).filter(function (w) { return w.length > 0; }).length;
  }


  /* ─────────────────────────────────────────────────────────────
     7. ERROR UI HELPERS
  ───────────────────────────────────────────────────────────── */
  function showErrors(errs) {
    errs.forEach(function (e) {
      var group = e.groupId
        ? document.getElementById(e.groupId)
        : (e.el ? e.el.closest('.form-group') : null);
      if (!group) return;

      group.classList.add('has-error');
      var errDiv = group.querySelector('.form-error');
      if (errDiv) { errDiv.textContent = e.msg; errDiv.style.display = 'flex'; }

      var target = e.el || group.querySelector('.input') || group;
      shakeEl(target);
    });
  }

  function shakeEl(el) {
    if (!el) return;
    el.classList.remove('shake');
    void el.offsetWidth;
    el.classList.add('shake');
    el.addEventListener('animationend', function () {
      el.classList.remove('shake');
    }, { once: true });
  }

  function clearGroup(group) {
    if (!group) return;
    group.classList.remove('has-error');
    var d = group.querySelector('.form-error');
    if (d) { d.textContent = ''; d.style.display = 'none'; }
  }

  function clearStepErrors(step) {
    var stepEl = document.getElementById('step-' + step);
    if (!stepEl) return;
    stepEl.querySelectorAll('.form-group.has-error').forEach(clearGroup);
  }

  function scrollToFirstError() {
    var first = document.querySelector('.form-group.has-error');
    if (first) first.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }

  /* Clear error as user edits the field */
  function setupInputErrorClear() {
    document.addEventListener('input', function (e) {
      var g = e.target.closest('.form-group.has-error');
      if (g) clearGroup(g);
    }, true);
    document.addEventListener('change', function (e) {
      var g = e.target.closest('.form-group.has-error');
      if (g) clearGroup(g);
    }, true);
  }


  /* ─────────────────────────────────────────────────────────────
     8. AUTO-SAVE (debounced)
  ───────────────────────────────────────────────────────────── */
  function setupAutoSave() {
    document.addEventListener('input',  debouncedSave);
    document.addEventListener('change', debouncedSave);
  }

  function debouncedSave() {
    clearTimeout(saveTimeout);
    setSaveUI('saving');
    saveTimeout = setTimeout(saveDraft, 700);
  }

  function saveDraft() {
    try {
      localStorage.setItem(DRAFT_KEY, JSON.stringify(collectDraft()));
      lastSaveTime = Date.now();
      setSaveUI('saved');
    } catch (e) {
      setSaveUI('');
    }
  }

  function setSaveUI(state) {
    var dot  = document.getElementById('save-dot');
    var text = document.getElementById('save-text');
    if (!dot || !text) return;
    dot.classList.remove('visible', 'saving');
    if (state === 'saving') {
      dot.classList.add('visible', 'saving');
      text.textContent = 'Saving…';
    } else if (state === 'saved') {
      dot.classList.add('visible');
      text.textContent = 'Draft saved just now';
    } else {
      text.textContent = '';
    }
  }

  function startSaveTimerDisplay() {
    saveTimer = setInterval(function () {
      if (!lastSaveTime) return;
      var mins = Math.floor((Date.now() - lastSaveTime) / 60000);
      var text = document.getElementById('save-text');
      if (!text) return;
      if (mins < 1)      text.textContent = 'Draft saved just now';
      else if (mins === 1) text.textContent = 'Draft saved 1 minute ago';
      else                 text.textContent = 'Draft saved ' + mins + ' minutes ago';
    }, 30000);
  }


  /* ─────────────────────────────────────────────────────────────
     9. DRAFT COLLECT & LOAD
  ───────────────────────────────────────────────────────────── */
  var SIMPLE_FIELDS = [
    'given-name','family-name','preferred-name',
    'country-origin','country-study',
    'email','phone','school-name','grade','how-heard',
    'grading-system','score','sat','act',
    'essay1','essay2'
  ];

  function collectDraft() {
    var d = {};

    SIMPLE_FIELDS.forEach(function (id) {
      var el = document.getElementById(id);
      if (el) d[id] = el.value;
    });

    var checked = document.querySelector('input[name="pronouns"]:checked');
    d.pronouns = checked ? checked.value : '';

    d.subjects = [];
    document.querySelectorAll('#subjects-grid input[type="checkbox"]:checked')
      .forEach(function (cb) { d.subjects.push(cb.value); });

    d.languages = langTags.slice();

    d.accomplishments = [];
    document.querySelectorAll('.acc-block').forEach(function (blk) {
      d.accomplishments.push({
        category: blk.querySelector('.acc-category').value,
        title:    blk.querySelector('.acc-title').value,
        desc:     blk.querySelector('.acc-desc').value,
        url:      (blk.querySelector('.acc-url') || {}).value || ''
      });
    });

    return d;
  }

  function loadDraft() {
    var raw;
    try { raw = localStorage.getItem(DRAFT_KEY); } catch (e) { return; }
    if (!raw) return;
    var d;
    try { d = JSON.parse(raw); } catch (e) { return; }
    if (!d) return;

    SIMPLE_FIELDS.forEach(function (id) {
      var el = document.getElementById(id);
      if (el && d[id] !== undefined) {
        el.value = d[id];
        if (id === 'grading-system') triggerGradingHint();
      }
    });

    if (d.pronouns) {
      var r = document.querySelector('input[name="pronouns"][value="' + d.pronouns + '"]');
      if (r) r.checked = true;
    }

    if (d.subjects && d.subjects.length) {
      d.subjects.forEach(function (s) {
        var cb = document.querySelector('#subjects-grid input[value="' + CSS.escape(s) + '"]');
        if (cb) cb.checked = true;
      });
    }

    if (d.languages && d.languages.length) {
      d.languages.forEach(addLangTag);
    }

    if (d.accomplishments && d.accomplishments.length) {
      document.getElementById('acc-blocks-container').innerHTML = '';
      accCount = 0;
      d.accomplishments.forEach(addAccBlock);
    }

    // Refresh essay counters
    ['essay1','essay2'].forEach(function (id) {
      var el = document.getElementById(id);
      if (el) updateEssayCounter(el);
    });

    lastSaveTime = Date.now();
    setSaveUI('saved');
    setTimeout(function () {
      var text = document.getElementById('save-text');
      if (text) text.textContent = 'Draft loaded';
    }, 100);
  }


  /* ─────────────────────────────────────────────────────────────
     10. ACCOMPLISHMENT BLOCKS
  ───────────────────────────────────────────────────────────── */
  function setupAccAddBtn() {
    var btn = document.getElementById('add-acc-btn');
    if (btn) btn.addEventListener('click', function () { addAccBlock(null); });
  }

  function addAccBlock(prefill) {
    if (accCount >= MAX_ACC) return;
    accCount++;
    var n = accCount;

    var catOpts = '<option value="">Select category</option>' +
      ACC_CATEGORIES.map(function (c) {
        return '<option value="' + c + '">' + c + '</option>';
      }).join('');

    var div = document.createElement('div');
    div.className = 'acc-block';
    div.setAttribute('data-acc-n', n);
    div.innerHTML =
      '<div class="acc-block-header">' +
        '<span class="acc-block-num">Accomplishment ' + n + '</span>' +
        (n > 1
          ? '<button type="button" class="acc-remove-btn" aria-label="Remove accomplishment ' + n + '">Remove</button>'
          : '') +
      '</div>' +
      '<div class="form-group">' +
        '<label class="form-label" for="acc-cat-' + n + '">Category</label>' +
        '<select class="input acc-category" id="acc-cat-' + n + '">' + catOpts + '</select>' +
      '</div>' +
      '<div class="form-group">' +
        '<label class="form-label" for="acc-title-' + n + '">Title</label>' +
        '<input class="input acc-title" type="text" id="acc-title-' + n + '" ' +
          'placeholder="What is it called?">' +
      '</div>' +
      '<div class="form-group">' +
        '<label class="form-label" for="acc-desc-' + n + '">' +
          'Description ' +
          '<span style="font-weight:400;color:var(--color-academic)">(optional · 150 words)</span>' +
        '</label>' +
        '<textarea class="input acc-desc" id="acc-desc-' + n + '" rows="4" ' +
          'placeholder="What you did, when, and why it mattered to you"></textarea>' +
        '<div class="acc-word-row">' +
          '<span class="acc-word-count"><span class="acc-wn">0</span> / 150 words</span>' +
        '</div>' +
      '</div>' +
      '<div class="form-group">' +
        '<label class="form-label" for="acc-url-' + n + '">' +
          'Verification URL ' +
          '<span style="font-weight:400;color:var(--color-academic)">(optional)</span>' +
        '</label>' +
        '<input class="input acc-url" type="url" id="acc-url-' + n + '" placeholder="https://…">' +
        '<p class="form-hint">No link? ' +
          '<a href="../ledger/index.html" style="color:var(--color-gold-dim)">Check the Verification Ledger →</a>' +
        '</p>' +
      '</div>';

    document.getElementById('acc-blocks-container').appendChild(div);

    // Remove button
    var rmBtn = div.querySelector('.acc-remove-btn');
    if (rmBtn) {
      rmBtn.addEventListener('click', function () {
        div.remove();
        accCount--;
        renumberAccBlocks();
        refreshAddAccBtn();
      });
    }

    // Description word counter
    var desc  = div.querySelector('.acc-desc');
    var wnEl  = div.querySelector('.acc-wn');
    desc.addEventListener('input', function () {
      var w = wordCount(desc.value);
      wnEl.textContent = w;
      wnEl.style.color = w > 150 ? 'var(--color-terra)' : '';
    });

    // Prefill from draft
    if (prefill) {
      div.querySelector('.acc-category').value = prefill.category || '';
      div.querySelector('.acc-title').value    = prefill.title    || '';
      div.querySelector('.acc-desc').value     = prefill.desc     || '';
      var urlEl = div.querySelector('.acc-url');
      if (urlEl) urlEl.value = prefill.url || '';
      if (wnEl) wnEl.textContent = wordCount(prefill.desc || '');
    }

    refreshAddAccBtn();
  }

  function renumberAccBlocks() {
    document.querySelectorAll('.acc-block').forEach(function (blk, i) {
      var numEl = blk.querySelector('.acc-block-num');
      if (numEl) numEl.textContent = 'Accomplishment ' + (i + 1);
    });
    accCount = document.querySelectorAll('.acc-block').length;
  }

  function refreshAddAccBtn() {
    var btn = document.getElementById('add-acc-btn');
    if (btn) btn.style.display = accCount >= MAX_ACC ? 'none' : 'block';
  }


  /* ─────────────────────────────────────────────────────────────
     11. LANGUAGE TAGS
  ───────────────────────────────────────────────────────────── */
  function setupLanguageTags() {
    var input = document.getElementById('lang-input');
    var wrap  = document.getElementById('lang-input-wrap');
    if (!input) return;

    input.addEventListener('keydown', function (e) {
      if (e.key === 'Enter' || e.key === ',') {
        e.preventDefault();
        commitLangInput();
      }
      if (e.key === 'Backspace' && !input.value && langTags.length) {
        removeLangTag(langTags[langTags.length - 1]);
      }
    });
    input.addEventListener('blur', commitLangInput);

    if (wrap) wrap.addEventListener('click', function () { input.focus(); });
  }

  function commitLangInput() {
    var input = document.getElementById('lang-input');
    if (!input) return;
    var v = input.value.trim().replace(/,+$/, '');
    if (v) { addLangTag(v); input.value = ''; }
  }

  function addLangTag(name) {
    name = name.charAt(0).toUpperCase() + name.slice(1);
    if (langTags.indexOf(name) !== -1) return;
    langTags.push(name);
    renderLangTags();
    updateLangHidden();
  }

  function removeLangTag(name) {
    langTags = langTags.filter(function (t) { return t !== name; });
    renderLangTags();
    updateLangHidden();
  }

  function renderLangTags() {
    var container = document.getElementById('lang-tags-container');
    if (!container) return;
    container.innerHTML = '';
    langTags.forEach(function (name) {
      var tag = document.createElement('span');
      tag.className = 'lang-tag';
      var xBtn = document.createElement('button');
      xBtn.className   = 'lang-tag-x';
      xBtn.type        = 'button';
      xBtn.textContent = '×';
      xBtn.setAttribute('aria-label', 'Remove ' + name);
      xBtn.addEventListener('click', function () { removeLangTag(name); });
      tag.textContent = name + '\u00A0';
      tag.appendChild(xBtn);
      container.appendChild(tag);
    });
  }

  function updateLangHidden() {
    var h = document.getElementById('languages-hidden');
    if (h) h.value = langTags.join(', ');
  }


  /* ─────────────────────────────────────────────────────────────
     12. ESSAY WORD COUNTERS
  ───────────────────────────────────────────────────────────── */
  function setupEssayCounters() {
    ['essay1','essay2'].forEach(function (id) {
      var el = document.getElementById(id);
      if (el) el.addEventListener('input', function () { updateEssayCounter(el); });
    });
  }

  function updateEssayCounter(textarea) {
    var id       = textarea.id;
    var maxWords = parseInt(textarea.getAttribute('data-max-words'), 10) || 300;
    var half     = Math.floor(maxWords / 2);
    var words    = wordCount(textarea.value);

    var counterEl = document.getElementById(id + '-counter');
    var hintEl    = document.getElementById(id + '-hint');
    if (!counterEl) return;

    counterEl.textContent = words + ' / ' + maxWords;
    counterEl.classList.remove('at-halfway','at-limit','over-limit');

    if (words > maxWords * 1.2) {
      counterEl.classList.add('over-limit');
    } else if (words >= maxWords) {
      counterEl.classList.add('at-limit');
      // Brighten the next/review button
      var nextBtn = document.getElementById('next-5');
      if (nextBtn) nextBtn.classList.add('btn-gold');
    } else if (words >= half && words > 0) {
      // Flash gold once when first crossing halfway
      if (!halfwayFlags[id]) {
        halfwayFlags[id] = true;
        counterEl.classList.add('at-halfway');
        setTimeout(function () { counterEl.classList.remove('at-halfway'); }, 1500);
      }
    } else {
      // Reset halfway flag so it can flash again if they go back below
      halfwayFlags[id] = false;
    }

    // Evolving hint text
    if (hintEl) {
      if (words === 0)              hintEl.textContent = '';
      else if (words < 50)          hintEl.textContent = 'Keep going.';
      else if (words < half)        hintEl.textContent = 'Good start. Keep going.';
      else if (words < maxWords)    hintEl.textContent = 'More than halfway there.';
      else                          hintEl.textContent = 'At the limit.';
    }
  }


  /* ─────────────────────────────────────────────────────────────
     13. GRADING SYSTEM HINT
  ───────────────────────────────────────────────────────────── */
  function setupGradingHint() {
    var sel = document.getElementById('grading-system');
    if (sel) sel.addEventListener('change', triggerGradingHint);
  }

  function triggerGradingHint() {
    var sel   = document.getElementById('grading-system');
    var hint  = document.getElementById('score-hint');
    var score = document.getElementById('score');
    if (!sel) return;
    var v = sel.value;
    if (hint) hint.textContent = GPA_HINTS[v] || 'Enter your score in your school\'s format.';
    if (score && GPA_PLACEHOLDERS[v]) score.placeholder = GPA_PLACEHOLDERS[v];
  }


  /* ─────────────────────────────────────────────────────────────
     EMAIL BLUR VALIDATION
  ───────────────────────────────────────────────────────────── */
  function setupEmailBlurValidation() {
    var el = document.getElementById('email');
    if (!el) return;
    el.addEventListener('blur', function () {
      var group = el.closest('.form-group');
      if (!el.value) { clearGroup(group); return; }
      if (!isEmail(el.value.trim())) {
        group.classList.add('has-error');
        var d = group.querySelector('.form-error');
        if (d) { d.textContent = 'Please enter a valid email (e.g. you@example.com)'; d.style.display = 'flex'; }
        shakeEl(el);
      } else {
        clearGroup(group);
      }
    });
  }


  /* ─────────────────────────────────────────────────────────────
     POPULATE COUNTRY SELECTS
  ───────────────────────────────────────────────────────────── */
  function populateCountries() {
    ['country-origin','country-study'].forEach(function (id) {
      var sel = document.getElementById(id);
      if (!sel) return;
      var frag = document.createDocumentFragment();
      COUNTRIES.forEach(function (c) {
        var opt = document.createElement('option');
        opt.value = c; opt.textContent = c;
        frag.appendChild(opt);
      });
      sel.appendChild(frag);
    });
  }

  function populateSubjects() {
    var grid = document.getElementById('subjects-grid');
    if (!grid) return;
    var frag = document.createDocumentFragment();
    SUBJECTS.forEach(function (s) {
      var label = document.createElement('label');
      label.className = 'checkbox-item';
      label.innerHTML =
        '<input type="checkbox" name="subjects" value="' + s + '">' +
        '<span class="check-box"></span>' + s;
      frag.appendChild(label);
    });
    grid.appendChild(frag);
  }


  /* ─────────────────────────────────────────────────────────────
     14. REVIEW STEP BUILDER
  ───────────────────────────────────────────────────────────── */
  function buildReviewStep() {
    var container = document.getElementById('review-container');
    if (!container) return;
    container.innerHTML = '';

    function addSection(title, stepNum, rows) {
      var sec = document.createElement('div');
      sec.className = 'review-section';

      var head = document.createElement('div');
      head.className = 'review-head';
      var label = document.createElement('span');
      label.className   = 'review-section-label';
      label.textContent = title;
      var editBtn = document.createElement('button');
      editBtn.type      = 'button';
      editBtn.className = 'review-edit-btn';
      editBtn.textContent = 'Edit →';
      editBtn.addEventListener('click', function () { goToStep(stepNum, 'back'); });
      head.appendChild(label);
      head.appendChild(editBtn);
      sec.appendChild(head);

      rows.forEach(function (row) {
        if (!row[0] && !row[1]) return;
        var div = document.createElement('div');
        div.className = 'review-row';
        var key = document.createElement('span');
        key.className   = 'review-key';
        key.textContent = row[0];
        var vEl = document.createElement('span');
        vEl.className = 'review-val';
        if (row[1]) {
          vEl.textContent = row[1];
        } else {
          vEl.innerHTML = '<em style="color:var(--color-academic)">Not provided</em>';
        }
        div.appendChild(key);
        div.appendChild(vEl);
        sec.appendChild(div);
      });

      container.appendChild(sec);
    }

    // Step 1 — Identity
    var pronounEl = document.querySelector('input[name="pronouns"]:checked');
    addSection('Basic Identity', 1, [
      ['Given name',    val('given-name')],
      ['Family name',   val('family-name')],
      ['Preferred name',val('preferred-name')],
      ['Pronouns',      pronounEl ? pronounEl.value : ''],
      ['Country of origin', val('country-origin')],
      ['Country of study',  val('country-study')],
    ]);

    // Step 2 — Contact
    addSection('Contact', 2, [
      ['Email',    val('email')],
      ['Phone',    val('phone')],
      ['School',   val('school-name')],
      ['Grade',    val('grade')],
      ['Heard via',val('how-heard')],
    ]);

    // Step 3 — Academic
    var subs = [];
    document.querySelectorAll('#subjects-grid input:checked').forEach(function (cb) {
      subs.push(cb.value);
    });
    addSection('Academic', 3, [
      ['Grading system', val('grading-system')],
      ['Score / GPA',    val('score')],
      ['Subjects',       subs.join(', ')],
      ['SAT',            val('sat')],
      ['ACT',            val('act')],
      ['Languages',      langTags.join(', ')],
    ]);

    // Step 4 — Accomplishments
    var accRows = [];
    document.querySelectorAll('.acc-block').forEach(function (blk, i) {
      var cat   = blk.querySelector('.acc-category').value;
      var title = blk.querySelector('.acc-title').value;
      if (title) accRows.push(['',
        (i + 1) + '. ' + (cat ? '[' + cat + '] ' : '') + title]);
    });
    if (!accRows.length) accRows.push(['','']);
    addSection('Accomplishments', 4, accRows);

    // Step 5 — Essays
    addSection('Essays', 5, [
      ['Essay 1', wordCount(val('essay1')) + ' words'],
      ['Essay 2', wordCount(val('essay2')) + ' words'],
    ]);
  }


  /* ─────────────────────────────────────────────────────────────
     15. SUBMIT
  ───────────────────────────────────────────────────────────── */
  function handleSubmit() {
    var errs  = [];
    var errDiv = document.getElementById('submit-error');

    if (!document.getElementById('confirm-own-work').checked) {
      errs.push('Please confirm this is your own work.');
    }
    if (!document.getElementById('confirm-terms').checked) {
      errs.push('Please agree to the terms to continue.');
    }

    if (errs.length) {
      if (errDiv) { errDiv.textContent = errs.join(' '); errDiv.style.display = 'flex'; }
      shakeEl(document.getElementById('submit-btn'));
      return;
    }

    if (errDiv) { errDiv.textContent = ''; errDiv.style.display = 'none'; }

    // Show loading state
    var btn     = document.getElementById('submit-btn');
    var spinner = document.getElementById('submit-spinner');
    btn.disabled     = true;
    btn.style.display  = 'none';
    if (spinner) spinner.style.display = 'inline-flex';

    // Clear draft on successful submit
    try { localStorage.removeItem(DRAFT_KEY); } catch (e) {}

    setTimeout(function () {
      window.location.href = 'complete.html';
    }, 1500);
  }

})();
