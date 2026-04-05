/* ═══════════════════════════════════════════════════════════════
   SIGNAL NOT NOISE — js/signal.js
   Socratic discovery tool. GSAP transitions between 10 screens
   across 6 stages.

   Screen map:
   1   Stage 1 — Opening Discovery (question select + first answer)
   2   Stage 2 — Depth F1
   3   Stage 2 — Depth F2
   4   Stage 2 — Depth F3
   5   Stage 3 — Context Amplifier
   6   Stage 4 — Signal Summary  (inline Revise / Accept)
   7   Stage 5 — Authenticity A1 (radio)
   8   Stage 5 — Authenticity A2 (textarea, optional)
   9   Stage 5 — Authenticity A3 (textarea, optional)
   10  Stage 6 — Export
═══════════════════════════════════════════════════════════════ */

(function () {
  'use strict';

  /* ─────────────────────────────────────────────────────────────
     1. CONSTANTS
  ───────────────────────────────────────────────────────────── */
  var DRAFT_KEY = 'minerva-signal-draft';

  var DISCOVERY_QUESTIONS = [
    'What problem have you spent years thinking about \u2014 not because someone asked you to, but because you couldn\u2019t stop?',
    'Describe a moment when you changed your mind about something you thought you fully understood.',
    'What have you built, made, or organized that revealed something surprising about how you think?',
    'When were you the only person in the room who saw what was actually happening \u2014 and what did you do with that?',
    'What would you study if there were no degrees, no careers, and no one was watching?',
  ];

  /* 3 follow-up prompts per discovery question (index-matched) */
  var DEPTH_QUESTIONS = [
    /* Q0 — the problem you couldn\u2019t stop thinking about */
    [
      'What were you wrong about first \u2014 before you understood the real shape of the problem?',
      'Who or what pushed back hardest on you, and what did that resistance cost?',
      'If you had to explain the core tension to someone encountering it for the first time, what would they almost certainly misunderstand?',
    ],
    /* Q1 — changed your mind */
    [
      'What did you believe before \u2014 and how long had you held that belief?',
      'What was the moment or piece of evidence that made the old view impossible to keep?',
      'What do you still hold loosely, knowing you might be wrong again?',
    ],
    /* Q2 — built or made something */
    [
      'What broke or failed before you got it right \u2014 and what did the failure teach you?',
      'What did the process reveal about the way you actually work, versus how you assumed you worked?',
      'What would you do completely differently if you started over today?',
    ],
    /* Q3 — only person who saw it */
    [
      'How did you know something others were missing \u2014 what gave you that angle?',
      'What did you do with that knowledge? Was it enough?',
      'Looking back, what would have happened if you had stayed quiet?',
    ],
    /* Q4 — what you\u2019d study with no constraints */
    [
      'What have you already done \u2014 without a credential, a grade, or anyone\u2019s permission \u2014 to pursue this?',
      'What draws you to it even when it is boring, hard, or going nowhere?',
      'What question in this area do you most want Minerva to help you answer?',
    ],
  ];

  var QUALITY_PATTERNS = [
    {
      label:    'Intellectual curiosity',
      desc:     'Driven by questions, not just answers',
      patterns: [/think|wonder|question|curious|fascin|obsess|why |how |kept thinking/i],
    },
    {
      label:    'Sustained focus',
      desc:     'Stays with difficult problems across time',
      patterns: [/years|months|kept|long time|persistent|wouldn.t stop|always come back|still/i],
    },
    {
      label:    'Systems thinking',
      desc:     'Sees structure beneath surface events',
      patterns: [/system|pattern|structure|underlying|connect|framework|model|emerge|root cause/i],
    },
    {
      label:    'Intellectual risk-taking',
      desc:     'Willing to be wrong in public',
      patterns: [/wrong|changed|mistake|rethink|different|surprised|admitted|realiz/i],
    },
    {
      label:    'Collaborative orientation',
      desc:     'Builds and thinks well with others',
      patterns: [/team|together|group|community| we |others|collaborat|organiz|help/i],
    },
    {
      label:    'Creative synthesis',
      desc:     'Combines ideas across domains',
      patterns: [/build|built|made|create|design|wrot|compos|invent|combin|across|bridge/i],
    },
    {
      label:    'Cross-cultural fluency',
      desc:     'Navigates different contexts with ease',
      patterns: [/different|cultur|countr|language|diverse|background|international|perspectiv/i],
    },
    {
      label:    'Self-directed learning',
      desc:     'Pursues knowledge on their own terms',
      patterns: [/myself|my own|independently|no one|without|chose to|decided to|on my own|taught/i],
    },
    {
      label:    'Analytical depth',
      desc:     'Goes below the surface to find real causes',
      patterns: [/analyz|research|studi|data|evidence|found that|discov|examin|investigat/i],
    },
    {
      label:    'Original perspective',
      desc:     'Sees what others routinely overlook',
      patterns: [/noticed|only one|no one else|alone|unusual|different way|realized that|saw /i],
    },
  ];

  /* screen index → stage number (index 0 unused) */
  var SCREEN_TO_STAGE = [0, 1, 2, 2, 2, 3, 4, 5, 5, 5, 6];


  /* ─────────────────────────────────────────────────────────────
     2. STATE
  ───────────────────────────────────────────────────────────── */
  var state = {
    question:     { selectedQ: null, answer: '' },
    depth:        { f1: '', f2: '', f3: '' },
    context:      { region: '', schoolType: '', resources: '', notes: '' },
    summary:      { qualities: [] },
    authenticity: { a1: '', a2: '', a3: '' },
  };

  var currentScreen = 1;

  function saveState() {
    try {
      localStorage.setItem(DRAFT_KEY, JSON.stringify({
        state:         state,
        currentScreen: currentScreen,
      }));
    } catch (e) {}
  }

  function loadState() {
    try {
      var raw = localStorage.getItem(DRAFT_KEY);
      if (!raw) return false;
      var saved = JSON.parse(raw);
      if (saved && saved.state) {
        Object.keys(state).forEach(function (k) {
          if (saved.state[k]) Object.assign(state[k], saved.state[k]);
        });
        if (saved.currentScreen && saved.currentScreen >= 1 && saved.currentScreen <= 10) {
          currentScreen = saved.currentScreen;
        }
        return true;
      }
    } catch (e) {}
    return false;
  }


  /* ─────────────────────────────────────────────────────────────
     3. DOM SHORTCUTS
  ───────────────────────────────────────────────────────────── */
  var viewport = document.getElementById('screen-viewport');
  var backBtn  = document.getElementById('sn-back');
  var contBtn  = document.getElementById('sn-continue');

  function updateDots(stage) {
    var dots = document.querySelectorAll('#progress-dots .pdot');
    dots.forEach(function (dot, i) {
      var s = i + 1;
      dot.classList.remove('active', 'done');
      if      (s < stage)  dot.classList.add('done');
      else if (s === stage) dot.classList.add('active');
    });
    var pd = document.getElementById('progress-dots');
    if (pd) pd.setAttribute('aria-valuenow', stage);
  }

  function updateNav(screen) {
    backBtn.style.visibility = (screen === 1) ? 'hidden' : 'visible';

    /* Screen 6 (Stage 4 summary) and screen 10 have inline action buttons */
    if (screen === 6 || screen === 10) {
      contBtn.style.display = 'none';
    } else {
      contBtn.style.display = '';
      contBtn.textContent   = (screen === 9) ? 'See My Signal \u2192' : 'Continue \u2192';
    }
  }


  /* ─────────────────────────────────────────────────────────────
     4. GSAP SCREEN TRANSITION
  ───────────────────────────────────────────────────────────── */
  function goToScreen(next, direction) {
    var dir      = (direction === 'back') ? -1 : 1;
    var outgoing = viewport.firstElementChild;

    /* Lock height so the clip doesn\u2019t collapse mid-transition */
    if (outgoing) viewport.style.height = outgoing.scrollHeight + 'px';

    var incoming         = buildScreen(next);
    incoming.style.cssText = 'position:absolute;top:0;left:0;width:100%;transform:translateX(' +
                             (dir * 100) + '%)';
    viewport.appendChild(incoming);

    if (outgoing) {
      gsap.to(outgoing, { x: -(dir * viewport.clientWidth), duration: 0.3, ease: 'power2.inOut' });
    }

    gsap.to(incoming, {
      x:        0,
      duration: 0.3,
      ease:     'power2.inOut',
      onComplete: function () {
        if (outgoing && outgoing.parentNode) outgoing.parentNode.removeChild(outgoing);
        incoming.style.cssText = '';
        viewport.style.height  = '';
        currentScreen          = next;
        updateDots(SCREEN_TO_STAGE[next]);
        updateNav(next);
        window.scrollTo({ top: 0, behavior: 'smooth' });
        saveState();
      },
    });
  }


  /* ─────────────────────────────────────────────────────────────
     5. ELEMENT HELPER
  ───────────────────────────────────────────────────────────── */
  function el(tag, attrs, html) {
    var e = document.createElement(tag);
    if (attrs) {
      Object.keys(attrs).forEach(function (k) {
        if      (k === 'className') e.className = attrs[k];
        else if (k === 'style')     e.style.cssText = attrs[k];
        else                        e.setAttribute(k, attrs[k]);
      });
    }
    if (html !== undefined) e.innerHTML = html;
    return e;
  }


  /* ─────────────────────────────────────────────────────────────
     6. SCREEN BUILDERS
  ───────────────────────────────────────────────────────────── */
  function buildScreen(n) {
    switch (n) {
      case 1:  return buildScreen1();
      case 2:  return buildDepthScreen(1, 'f1');
      case 3:  return buildDepthScreen(2, 'f2');
      case 4:  return buildDepthScreen(3, 'f3');
      case 5:  return buildScreen5();
      case 6:  return buildScreen6();
      case 7:  return buildScreen7();
      case 8:  return buildAuthTextScreen(2, 'a2',
                  'What part of your answer surprised you as you were writing it?',
                  'Optional \u2014 but this is often where the best material is.',
                  'Something I didn\u2019t expect to say\u2026');
      case 9:  return buildAuthTextScreen(3, 'a3',
                  'What\u2019s the one thing you left out \u2014 and why?',
                  'Every draft has a detail that got cut for being \u201ctoo much\u201d or \u201ctoo weird.\u201d What was yours?',
                  'The thing I almost wrote but didn\u2019t\u2026');
      case 10: return buildScreen10();
      default: return buildScreen1();
    }
  }

  /* ── Screen 1: Opening Discovery ── */
  function buildScreen1() {
    var screen  = el('div', { className: 'signal-screen' });
    var eyebrow = el('p',  { className: 'screen-eyebrow' },
      'Stage 1 of 6 &nbsp;&middot;&nbsp; Opening Discovery');
    var heading = el('h2', { className: 'screen-heading' }, 'Where does your story begin?');
    var hint    = el('p',  { className: 'screen-hint' },
      'Pick the question that lands closest to what you actually want to say. You can change your selection at any time.');

    var qList = el('div', { className: 'q-list' });

    DISCOVERY_QUESTIONS.forEach(function (q, i) {
      var btn = el('button', {
        className:      'q-card',
        type:           'button',
        'data-q-index': i,
      });
      btn.textContent = q;

      if (state.question.selectedQ === i)   btn.classList.add('q-selected');
      else if (state.question.selectedQ !== null) btn.classList.add('q-dimmed');

      btn.addEventListener('click', function () {
        qList.querySelectorAll('.q-card').forEach(function (b) {
          b.classList.remove('q-selected');
          b.classList.add('q-dimmed');
        });
        btn.classList.remove('q-dimmed');
        btn.classList.add('q-selected');
        state.question.selectedQ = i;
        saveState();

        var existing = screen.querySelector('.answer-area');
        if (existing) {
          /* Update context quote to the newly selected question */
          var ctx = existing.querySelector('.answer-area-context');
          if (ctx) ctx.textContent = '\u201c' + q + '\u201d';
          return;
        }

        var area = buildAnswerArea(q, state.question.answer, function (v) {
          state.question.answer = v;
          saveState();
        });
        screen.appendChild(area);
        gsap.from(area, { opacity: 0, y: 14, duration: 0.32, ease: 'power2.out' });
      });

      qList.appendChild(btn);
    });

    screen.appendChild(eyebrow);
    screen.appendChild(heading);
    screen.appendChild(hint);
    screen.appendChild(qList);

    /* Restore answer area if returning to this screen */
    if (state.question.selectedQ !== null) {
      var restoredQ = DISCOVERY_QUESTIONS[state.question.selectedQ];
      screen.appendChild(buildAnswerArea(restoredQ, state.question.answer, function (v) {
        state.question.answer = v;
        saveState();
      }));
    }

    return screen;
  }

  function buildAnswerArea(questionText, existingVal, onChange) {
    var area = el('div', { className: 'answer-area' });
    var ctx  = el('p',  { className: 'answer-area-context' });
    ctx.textContent = '\u201c' + questionText + '\u201d';

    var hint = el('p', {
      className: 'screen-hint',
      style:     'margin-bottom:var(--sp-4);font-size:13px;',
    }, 'Write your first honest answer. Don\u2019t edit yet \u2014 just get it down.');

    var ta = el('textarea', {
      className:   'input signal-textarea',
      placeholder: 'Start writing here\u2026',
      rows:        '6',
    });
    ta.value = existingVal || '';
    ta.addEventListener('input', function () { onChange(ta.value); });

    area.appendChild(ctx);
    area.appendChild(hint);
    area.appendChild(ta);
    return area;
  }

  /* ── Screens 2–4: Depth Interrogation ── */
  function buildDepthScreen(num, stateKey) {
    var qIdx  = state.question.selectedQ !== null ? state.question.selectedQ : 0;
    var question = DEPTH_QUESTIONS[qIdx][num - 1];

    var screen  = el('div', { className: 'signal-screen' });
    var eyebrow = el('p',  { className: 'screen-eyebrow' },
      'Stage 2 of 6 &nbsp;&middot;&nbsp; Depth Interrogation &nbsp;&middot;&nbsp; ' + num + ' of 3');
    var heading = el('h2', { className: 'screen-heading' });
    heading.textContent = question;
    var hint = el('p', { className: 'screen-hint' },
      'Push past the surface answer. What\u2019s underneath?');

    var ta = el('textarea', {
      className:   'input signal-textarea tall',
      placeholder: 'Go deeper\u2026',
      rows:        '7',
    });
    ta.value = state.depth[stateKey] || '';
    ta.addEventListener('input', function () {
      state.depth[stateKey] = ta.value;
      saveState();
    });

    screen.appendChild(eyebrow);
    screen.appendChild(heading);
    screen.appendChild(hint);
    screen.appendChild(ta);
    return screen;
  }

  /* ── Screen 5: Context Amplifier ── */
  function buildScreen5() {
    var screen  = el('div', { className: 'signal-screen' });
    var eyebrow = el('p',  { className: 'screen-eyebrow' },
      'Stage 3 of 6 &nbsp;&middot;&nbsp; Context Amplifier');
    var heading = el('h2', { className: 'screen-heading' }, 'Give us the landscape.');
    var hint    = el('p',  { className: 'screen-hint' },
      'Context doesn\u2019t determine your story \u2014 but it shapes how we read it. A few details help us understand what you were working with.');

    var card = el('div', { className: 'context-card' });

    /* Region */
    card.appendChild(buildFormGroup('ctx-region', 'Where have you spent most of your school years?',
      function () {
        var inp = el('input', {
          className:   'input',
          id:          'ctx-region',
          type:        'text',
          placeholder: 'City or country',
        });
        inp.value = state.context.region || '';
        inp.addEventListener('input', function () { state.context.region = inp.value; saveState(); });
        return inp;
      }
    ));

    /* School type */
    card.appendChild(buildFormGroup('ctx-school-type', 'What kind of school do you attend?',
      function () {
        var sel = el('select', { className: 'input', id: 'ctx-school-type' });
        [
          ['',             'Choose one\u2026'],
          ['public',       'Public / state school'],
          ['private',      'Private school'],
          ['international','International school'],
          ['homeschool',   'Homeschool'],
          ['vocational',   'Vocational / technical'],
          ['online',       'Online school'],
          ['other',        'Other'],
        ].forEach(function (opt) {
          var o = el('option', { value: opt[0] }, opt[1]);
          if (state.context.schoolType === opt[0]) o.setAttribute('selected', '');
          sel.appendChild(o);
        });
        sel.addEventListener('change', function () { state.context.schoolType = sel.value; saveState(); });
        return sel;
      }
    ));

    /* Resources */
    card.appendChild(buildFormGroup('ctx-resources', 'How would you describe your access to academic resources?',
      function () {
        var sel = el('select', { className: 'input', id: 'ctx-resources' });
        [
          ['',        'Choose one\u2026'],
          ['abundant','Abundant \u2014 strong school, extracurriculars, tutors'],
          ['adequate','Adequate \u2014 most basics covered'],
          ['limited', 'Limited \u2014 made things work with less'],
          ['scarce',  'Scarce \u2014 built most of this independently'],
        ].forEach(function (opt) {
          var o = el('option', { value: opt[0] }, opt[1]);
          if (state.context.resources === opt[0]) o.setAttribute('selected', '');
          sel.appendChild(o);
        });
        sel.addEventListener('change', function () { state.context.resources = sel.value; saveState(); });
        return sel;
      }
    ));

    /* Notes (optional) */
    card.appendChild(buildFormGroup('ctx-notes',
      'Anything else that shaped your intellectual environment? <span style="opacity:0.55;font-weight:400">(optional)</span>',
      function () {
        var ta = el('textarea', {
          className:   'input signal-textarea',
          id:          'ctx-notes',
          placeholder: 'Unusual circumstances, resources you found yourself, context we should have\u2026',
          rows:        '4',
          style:       'min-height:96px;',
        });
        ta.value = state.context.notes || '';
        ta.addEventListener('input', function () { state.context.notes = ta.value; saveState(); });
        return ta;
      }
    ));

    screen.appendChild(eyebrow);
    screen.appendChild(heading);
    screen.appendChild(hint);
    screen.appendChild(card);
    return screen;
  }

  function buildFormGroup(id, labelHTML, buildControl) {
    var group = el('div', { className: 'form-group', style: 'margin-bottom:var(--sp-5);' });
    var label = el('label', { className: 'form-label', 'for': id }, labelHTML);
    group.appendChild(label);
    group.appendChild(buildControl());
    return group;
  }

  /* ── Screen 6: Signal Summary ── */
  function buildScreen6() {
    var screen  = el('div', { className: 'signal-screen' });
    var eyebrow = el('p',  { className: 'screen-eyebrow' },
      'Stage 4 of 6 &nbsp;&middot;&nbsp; Signal Summary');
    var heading = el('h2', { className: 'screen-heading' }, 'What your words signal.');
    var hint    = el('p',  { className: 'screen-hint' },
      'These qualities emerged from your own language. We\u2019re not assigning them \u2014 your words called them out.');

    screen.appendChild(eyebrow);
    screen.appendChild(heading);
    screen.appendChild(hint);

    var qualities = analyzeQualities();
    state.summary.qualities = qualities;

    var list = el('div', { className: 'qualities-list' });
    qualities.forEach(function (q, i) {
      var item = el('div', {
        className: 'quality-item',
        style:     'animation-delay:' + (i * 0.08) + 's',
      });
      var dot = el('span', {
        style: 'width:8px;height:8px;border-radius:50%;background:var(--color-gold);' +
               'flex-shrink:0;display:inline-block;',
      });
      var label  = el('strong', {});
      label.textContent = q.label;
      var sep  = document.createTextNode(' \u2014 ');
      var desc = document.createTextNode(q.desc);
      item.appendChild(dot);
      item.appendChild(label);
      item.appendChild(sep);
      item.appendChild(desc);
      list.appendChild(item);
    });
    screen.appendChild(list);

    /* Inline actions — contBtn is hidden on this screen */
    var actions    = el('div', { className: 'stage4-actions' });
    var reviseBtn  = el('button', { className: 'btn btn-secondary', type: 'button' },
      '\u2190 Revise my answers');
    var acceptBtn  = el('button', { className: 'btn btn-gold', type: 'button' },
      'This is me \u2014 continue \u2192');

    reviseBtn.addEventListener('click', function () { goToScreen(1, 'back'); });
    acceptBtn.addEventListener('click', function () { goToScreen(7, 'forward'); });

    actions.appendChild(reviseBtn);
    actions.appendChild(acceptBtn);
    screen.appendChild(actions);
    return screen;
  }

  /* ── Screen 7: Authenticity A1 (radio) ── */
  function buildScreen7() {
    var screen  = el('div', { className: 'signal-screen' });
    var eyebrow = el('p',  { className: 'screen-eyebrow' },
      'Stage 5 of 6 &nbsp;&middot;&nbsp; Authenticity Check &nbsp;&middot;&nbsp; 1 of 3');
    var heading = el('h2', { className: 'screen-heading' },
      'Is this actually your story \u2014 or the version you think we want to hear?');
    var hint = el('p', { className: 'screen-hint' },
      'This isn\u2019t a trap. It\u2019s a calibration. The honest answer makes the final paragraph stronger.');

    var radioGroup = el('div', {
      className:    'auth-radio-group',
      role:         'radiogroup',
      'aria-label': 'Authenticity self-assessment',
    });

    [
      ['yes',      'Yes \u2014 completely mine'],
      ['somewhat', 'Somewhat \u2014 I shaped it for the application'],
      ['no',       'Not really \u2014 I\u2019m still figuring out what I actually think'],
    ].forEach(function (opt) {
      var pill  = el('label', { className: 'auth-pill' });
      var input = el('input', { type: 'radio', name: 'auth-a1', value: opt[0] });
      if (state.authenticity.a1 === opt[0]) input.setAttribute('checked', '');
      var text  = document.createTextNode(opt[1]);
      input.addEventListener('change', function () {
        state.authenticity.a1 = opt[0];
        saveState();
      });
      pill.appendChild(input);
      pill.appendChild(text);
      radioGroup.appendChild(pill);
    });

    screen.appendChild(eyebrow);
    screen.appendChild(heading);
    screen.appendChild(hint);
    screen.appendChild(radioGroup);
    return screen;
  }

  /* ── Screens 8–9: Authenticity text (reusable) ── */
  function buildAuthTextScreen(num, stateKey, questionText, hintText, placeholder) {
    var screen  = el('div', { className: 'signal-screen' });
    var eyebrow = el('p',  { className: 'screen-eyebrow' },
      'Stage 5 of 6 &nbsp;&middot;&nbsp; Authenticity Check &nbsp;&middot;&nbsp; ' + num + ' of 3');
    var heading = el('h2', { className: 'screen-heading' });
    heading.textContent = questionText;

    var hint = el('p', { className: 'screen-hint' });
    hint.innerHTML = hintText + ' <span style="opacity:0.6">Leave blank to skip.</span>';

    var ta = el('textarea', {
      className:   'input signal-textarea',
      placeholder: placeholder,
      rows:        '5',
    });
    ta.value = state.authenticity[stateKey] || '';
    ta.addEventListener('input', function () {
      state.authenticity[stateKey] = ta.value;
      saveState();
    });

    screen.appendChild(eyebrow);
    screen.appendChild(heading);
    screen.appendChild(hint);
    screen.appendChild(ta);
    return screen;
  }

  /* ── Screen 10: Export ── */
  function buildScreen10() {
    var screen  = el('div', { className: 'signal-screen' });
    var eyebrow = el('p',  { className: 'screen-eyebrow' },
      'Stage 6 of 6 &nbsp;&middot;&nbsp; Export');
    var heading = el('h2', { className: 'screen-heading' }, 'Your signal.');
    var hint    = el('p',  { className: 'screen-hint' },
      'This paragraph was built from your own words. Use it as a starting point \u2014 a raw first take to cut, expand, or contradict.');

    var card       = el('div', { className: 'chromatic-glass signal-output-card' });
    var label      = el('span', { className: 'signal-output-label' }, 'Signal paragraph');
    var outputText = el('p',   { className: 'signal-output-text' });
    outputText.textContent = generateExportParagraph();

    card.appendChild(label);
    card.appendChild(outputText);
    screen.appendChild(eyebrow);
    screen.appendChild(heading);
    screen.appendChild(hint);
    screen.appendChild(card);

    /* Actions */
    var actions = el('div', { className: 'export-actions' });

    var copyBtn = el('button', { className: 'btn btn-primary', type: 'button' }, 'Copy to clipboard');
    copyBtn.addEventListener('click', function () {
      var text = outputText.textContent;
      var doConfirm = function () {
        copyBtn.textContent = 'Copied \u2713';
        copyBtn.classList.add('btn-copy-done');
        setTimeout(function () {
          copyBtn.textContent = 'Copy to clipboard';
          copyBtn.classList.remove('btn-copy-done');
        }, 2400);
      };
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(text).then(doConfirm).catch(function () {
          fallbackCopy(text);
          doConfirm();
        });
      } else {
        fallbackCopy(text);
        doConfirm();
      }
    });

    var appBtn = el('button', { className: 'btn btn-secondary', type: 'button' },
      'Add to Application \u2192');
    appBtn.addEventListener('click', function () {
      try { sessionStorage.setItem('minerva-signal-export', outputText.textContent); } catch (e) {}
      window.location.href = '../apply/index.html?signal=1';
    });

    actions.appendChild(copyBtn);
    actions.appendChild(appBtn);
    screen.appendChild(actions);

    /* Restart (small / low-emphasis) */
    var restartBtn = el('button', {
      className: 'btn btn-secondary',
      type:      'button',
      style:     'margin-top:var(--sp-5);font-size:12px;opacity:0.65;letter-spacing:0.02em;',
    }, 'Start over');
    restartBtn.addEventListener('click', function () {
      if (!confirm('Clear your Signal Not Noise session and start over?')) return;
      try { localStorage.removeItem(DRAFT_KEY); } catch (e) {}
      /* Reset state in place (can\u2019t reassign let/const; var is fine here) */
      state.question     = { selectedQ: null, answer: '' };
      state.depth        = { f1: '', f2: '', f3: '' };
      state.context      = { region: '', schoolType: '', resources: '', notes: '' };
      state.summary      = { qualities: [] };
      state.authenticity = { a1: '', a2: '', a3: '' };
      goToScreen(1, 'back');
    });
    screen.appendChild(restartBtn);

    return screen;
  }

  function fallbackCopy(text) {
    var ta = document.createElement('textarea');
    ta.value    = text;
    ta.style.cssText = 'position:fixed;opacity:0;pointer-events:none;';
    document.body.appendChild(ta);
    ta.select();
    try { document.execCommand('copy'); } catch (e) {}
    document.body.removeChild(ta);
  }


  /* ─────────────────────────────────────────────────────────────
     7. KEYWORD ANALYSIS
  ───────────────────────────────────────────────────────────── */
  function getAllText() {
    return [
      state.question.answer,
      state.depth.f1,
      state.depth.f2,
      state.depth.f3,
      state.context.notes,
      state.authenticity.a2,
      state.authenticity.a3,
    ].join(' ');
  }

  function analyzeQualities() {
    var text    = getAllText();
    var matched = [];

    QUALITY_PATTERNS.forEach(function (qp) {
      var hit = qp.patterns.some(function (re) { return re.test(text); });
      if (hit) matched.push(qp);
    });

    /* Guarantee at least 4 qualities even for sparse text */
    var defaults = [
      QUALITY_PATTERNS[0],  // Intellectual curiosity
      QUALITY_PATTERNS[3],  // Intellectual risk-taking
      QUALITY_PATTERNS[2],  // Systems thinking
      QUALITY_PATTERNS[7],  // Self-directed learning
    ];
    defaults.forEach(function (d) {
      if (matched.length < 4 && matched.indexOf(d) === -1) matched.push(d);
    });

    return matched.slice(0, 6);
  }


  /* ─────────────────────────────────────────────────────────────
     8. EXPORT PARAGRAPH GENERATOR
  ───────────────────────────────────────────────────────────── */
  function generateExportParagraph() {
    var qIdx    = state.question.selectedQ;
    var qText   = (qIdx !== null) ? DISCOVERY_QUESTIONS[qIdx] : '';
    var answer  = trim200(state.question.answer);
    var f1      = trim200(state.depth.f1);
    var f2      = trim200(state.depth.f2);
    var f3      = trim200(state.depth.f3);

    var qs = state.summary.qualities.length
      ? state.summary.qualities.slice(0, 3).map(function (q) { return q.label.toLowerCase(); })
      : ['intellectual curiosity', 'sustained focus', 'original perspective'];

    var qStr = qs.length === 1
      ? qs[0]
      : qs.slice(0, -1).join(', ') + ' and ' + qs[qs.length - 1];

    var ctxStr  = buildContextString();
    var authEnd = buildAuthEnding();

    /* Sentence 1 — the student\u2019s own opening answer */
    var s1 = answer
      ? capitalize(answer).replace(/[.!?]*$/, '') + '.'
      : 'The question I keep returning to is: ' + qText;

    /* Sentence 2 — depth F1 */
    var s2 = f1
      ? 'Before I understood its real shape, ' + f1.charAt(0).toLowerCase() + f1.slice(1).replace(/[.!?]*$/, '') + '.'
      : '';

    /* Sentence 3 — depth F2 */
    var s3 = f2 ? capitalize(f2).replace(/[.!?]*$/, '') + '.' : '';

    /* Sentence 4 — synthesized qualities */
    var s4 = 'What emerges from this, ' + ctxStr + ', is a pattern of ' + qStr + '.';

    /* Sentence 5 — depth F3 or authenticity A2 */
    var detail = f3 || state.authenticity.a2;
    var s5     = detail ? capitalize(trim200(detail)).replace(/[.!?]*$/, '') + '.' : '';

    /* Sentence 6 — authenticity ending */
    var s6 = authEnd;

    return [s1, s2, s3, s4, s5, s6]
      .filter(function (s) { return s.trim().length > 0; })
      .join(' ');
  }

  function capitalize(str) {
    if (!str) return '';
    return str.charAt(0).toUpperCase() + str.slice(1);
  }

  function trim200(str) {
    if (!str) return '';
    str = str.trim();
    if (str.length <= 200) return str;
    var cut = str.lastIndexOf(' ', 200);
    return str.substring(0, cut > 0 ? cut : 200) + '\u2026';
  }

  function buildContextString() {
    var parts = [];
    if (state.context.region) parts.push('coming from ' + state.context.region);
    if (state.context.schoolType) {
      var schoolLabels = {
        'public':        'educated at a public school',
        'private':       'educated at a private school',
        'international': 'educated at an international school',
        'homeschool':    'coming from a homeschool background',
        'vocational':    'from a vocational program',
        'online':        'from an online school',
        'other':         'from a non-traditional schooling background',
      };
      var l = schoolLabels[state.context.schoolType];
      if (l) parts.push(l);
    }
    if (state.context.resources === 'limited' || state.context.resources === 'scarce') {
      parts.push('having built most of this independently');
    }
    return parts.length ? parts.join(', ') : 'across this body of reflection';
  }

  function buildAuthEnding() {
    if (state.authenticity.a1 === 'no') {
      return 'I\u2019m still working out what I actually think \u2014 and that honesty itself signals something.';
    }
    if (state.authenticity.a1 === 'somewhat') {
      return 'Some of this is shaped for the application; the underlying thinking is real.';
    }
    if (state.authenticity.a3 && state.authenticity.a3.trim()) {
      return capitalize(state.authenticity.a3.trim()).replace(/[.!?]*$/, '') + '.';
    }
    return '';
  }


  /* ─────────────────────────────────────────────────────────────
     9. NAVIGATION — BACK / CONTINUE WIRING
  ───────────────────────────────────────────────────────────── */
  function validate(screen) {
    switch (screen) {
      case 1:
        if (state.question.selectedQ === null) {
          showValidationMsg('Pick a question before continuing.');
          return false;
        }
        if (!state.question.answer.trim()) {
          showValidationMsg('Write at least a sentence before moving on.');
          return false;
        }
        return true;
      case 2:
        if (!state.depth.f1.trim()) {
          showValidationMsg('Take a moment with this question before moving on.');
          return false;
        }
        return true;
      case 3:
        if (!state.depth.f2.trim()) {
          showValidationMsg('Take a moment with this question before moving on.');
          return false;
        }
        return true;
      case 4:
        if (!state.depth.f3.trim()) {
          showValidationMsg('Take a moment with this question before moving on.');
          return false;
        }
        return true;
      case 7:
        if (!state.authenticity.a1) {
          showValidationMsg('Choose one of the three options to continue.');
          return false;
        }
        return true;
      default:
        return true;
    }
  }

  function showValidationMsg(msg) {
    /* Use NERVOUS mood variant if active */
    var mood = document.documentElement.getAttribute('data-mood');
    var text = (mood === 'nervous')
      ? msg.replace('before moving on', 'when you\u2019re ready \u2014 no rush')
           .replace('before continuing', 'before we go further \u2014 you\u2019re doing great')
      : msg;

    /* Inline toast */
    var existing = document.getElementById('sn-toast');
    if (existing) existing.parentNode.removeChild(existing);

    var toast = el('div', {
      id:    'sn-toast',
      style: 'position:fixed;bottom:24px;left:50%;transform:translateX(-50%);' +
             'background:var(--color-ink);color:#fff;font-family:var(--font-body);' +
             'font-size:13px;padding:10px 20px;border-radius:var(--r-full);' +
             'z-index:2000;opacity:0;transition:opacity 0.2s ease;pointer-events:none;',
    });
    toast.textContent = text;
    document.body.appendChild(toast);
    requestAnimationFrame(function () { toast.style.opacity = '1'; });
    setTimeout(function () {
      toast.style.opacity = '0';
      setTimeout(function () {
        if (toast.parentNode) toast.parentNode.removeChild(toast);
      }, 220);
    }, 2600);
  }

  contBtn.addEventListener('click', function () {
    /* Screen 6 uses inline buttons; contBtn is hidden */
    if (currentScreen === 6 || currentScreen === 10) return;
    if (!validate(currentScreen)) return;
    var next = currentScreen + 1;
    if (next > 10) return;
    goToScreen(next, 'forward');
  });

  backBtn.addEventListener('click', function () {
    if (currentScreen <= 1) return;
    goToScreen(currentScreen - 1, 'back');
  });


  /* ─────────────────────────────────────────────────────────────
     10. INIT
  ───────────────────────────────────────────────────────────── */
  document.addEventListener('DOMContentLoaded', function () {
    loadState();

    var firstScreen = buildScreen(currentScreen);
    viewport.appendChild(firstScreen);

    updateDots(SCREEN_TO_STAGE[currentScreen]);
    updateNav(currentScreen);
  });

})();
