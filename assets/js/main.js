/* Pusheeno – site behaviour. Plain JavaScript, no dependencies. */
(function () {
  'use strict';

  /* ---- Footer year ---- */
  var yearEl = document.getElementById('year');
  if (yearEl) yearEl.textContent = String(new Date().getFullYear());

  /* ---- Mobile navigation ---- */
  var toggle = document.querySelector('.nav-toggle');
  var menu = document.getElementById('nav-menu');

  function setMenu(open) {
    toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
    menu.classList.toggle('is-open', open);
  }

  if (toggle && menu) {
    toggle.addEventListener('click', function () {
      setMenu(toggle.getAttribute('aria-expanded') !== 'true');
    });
    menu.addEventListener('click', function (event) {
      if (event.target.closest('a')) setMenu(false);
    });
    document.addEventListener('click', function (event) {
      if (menu.classList.contains('is-open') && !event.target.closest('.nav')) setMenu(false);
    });
  }

  /* ---- Reveal sections as they scroll into view ---- */
  var revealEls = Array.prototype.slice.call(document.querySelectorAll('.reveal'));
  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  if ('IntersectionObserver' in window && !reduceMotion) {
    var observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          observer.unobserve(entry.target);
        }
      });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.08 });
    revealEls.forEach(function (el) { observer.observe(el); });
  } else {
    revealEls.forEach(function (el) { el.classList.add('is-visible'); });
  }

  /* ---- Map pins: tap to show or hide a label (hover and focus work without this) ---- */
  var pins = Array.prototype.slice.call(document.querySelectorAll('.map .pin'));
  pins.forEach(function (pin) {
    pin.addEventListener('click', function () {
      var open = !pin.classList.contains('is-open');
      pins.forEach(function (p) { p.classList.remove('is-open'); });
      if (open) pin.classList.add('is-open');
    });
  });
  document.addEventListener('click', function (event) {
    if (!event.target.closest('.map .pin')) pins.forEach(function (p) { p.classList.remove('is-open'); });
  });

  /* ---- Lightbox for the photo gallery ---- */
  var lightbox = document.getElementById('lightbox');
  var photos = Array.prototype.slice.call(document.querySelectorAll('a.photo'));

  if (lightbox && photos.length) {
    var img = lightbox.querySelector('.lb-img');
    var caption = lightbox.querySelector('.lb-caption');
    var btnClose = lightbox.querySelector('.lb-close');
    var btnPrev = lightbox.querySelector('.lb-prev');
    var btnNext = lightbox.querySelector('.lb-next');
    var focusables = [btnClose, btnPrev, btnNext];
    var index = 0;
    var lastFocus = null;
    var touchStartX = null;

    function preload(i) {
      var link = photos[(i + photos.length) % photos.length];
      var image = new Image();
      image.src = link.getAttribute('href');
    }

    function show(i) {
      index = (i + photos.length) % photos.length;
      var link = photos[index];
      var thumb = link.querySelector('img');
      img.src = link.getAttribute('href');
      img.alt = thumb ? thumb.alt : '';
      var text = link.getAttribute('data-caption') || '';
      caption.textContent = text;
      caption.hidden = !text;
      preload(index + 1);
      preload(index - 1);
    }

    function open(i) {
      lastFocus = document.activeElement;
      show(i);
      lightbox.hidden = false;
      document.body.classList.add('lb-open');
      btnClose.focus();
    }

    function close() {
      lightbox.hidden = true;
      document.body.classList.remove('lb-open');
      img.removeAttribute('src');
      if (lastFocus && typeof lastFocus.focus === 'function') lastFocus.focus();
    }

    photos.forEach(function (link, i) {
      link.addEventListener('click', function (event) {
        event.preventDefault();
        open(i);
      });
    });

    btnClose.addEventListener('click', close);
    btnPrev.addEventListener('click', function () { show(index - 1); });
    btnNext.addEventListener('click', function () { show(index + 1); });

    // Click on the dark backdrop (not the image or buttons) closes the viewer
    lightbox.addEventListener('click', function (event) {
      if (event.target === lightbox) close();
    });

    document.addEventListener('keydown', function (event) {
      if (lightbox.hidden) return;
      if (event.key === 'Escape') {
        close();
      } else if (event.key === 'ArrowLeft') {
        show(index - 1);
      } else if (event.key === 'ArrowRight') {
        show(index + 1);
      } else if (event.key === 'Tab') {
        // Keep keyboard focus inside the viewer while it is open
        var first = focusables[0];
        var last = focusables[focusables.length - 1];
        if (event.shiftKey && document.activeElement === first) {
          event.preventDefault();
          last.focus();
        } else if (!event.shiftKey && document.activeElement === last) {
          event.preventDefault();
          first.focus();
        }
      }
    });

    // Swipe left/right on touch screens
    lightbox.addEventListener('touchstart', function (event) {
      touchStartX = event.touches[0].clientX;
    }, { passive: true });
    lightbox.addEventListener('touchend', function (event) {
      if (touchStartX === null) return;
      var dx = event.changedTouches[0].clientX - touchStartX;
      touchStartX = null;
      if (Math.abs(dx) > 50) show(index + (dx < 0 ? 1 : -1));
    });

    if (photos.length < 2) {
      btnPrev.hidden = true;
      btnNext.hidden = true;
    }
  }

  /* ---- Look after Pusheeno: a small virtual-pet toy ----
     Three meters drain slowly in real time; his mood is their average, and his face follows it.
     He never looks happy. Progress is saved per visitor in localStorage. */
  (function () {
    var root = document.getElementById('gotchi');
    if (!root) return;
    var pet = root.querySelector('.gotchi-pet');
    var bubble = root.querySelector('.gotchi-bubble');
    var moodLabel = root.querySelector('.gotchi-mood-label');
    var ageEl = root.querySelector('.gotchi-age');
    var buttons = Array.prototype.slice.call(root.querySelectorAll('[data-act]'));
    var fills = {};
    Array.prototype.forEach.call(root.querySelectorAll('[data-meter]'), function (el) {
      fills[el.getAttribute('data-meter')] = el;
    });
    var slot = document.getElementById('postcard-slot');
    var pcCount = document.getElementById('pc-count');
    var pcTotal = document.getElementById('pc-total');
    var tallySnacks = document.getElementById('tally-snacks');
    var tallyTrips = document.getElementById('tally-trips');
    var photos = Array.prototype.slice.call(document.querySelectorAll('#gallery a.photo[href]'));

    var KEY = 'pusheeno-pet-v1';
    var DECAY = { snacks: 2, adventure: 1.5, cuddles: 3 };   // points lost per hour
    var LABELS = { furious: 'Furious', grumpy: 'Grumpy', mild: 'Mildly grumpy', ok: 'Tolerating you' };
    var LINES = {
      matcha: ['Matcha. Acceptable.', 'Is this ceremonial grade?', 'He’ll allow it.', 'Slurp. No comment.'],
      pandan: ['Pandan. Now we’re talking.', 'Not as good as Singapore. Still eating it.', 'Green, sweet, correct.', 'Finally, some respect.'],
      full: ['He’s full. He’s eating it anyway.', 'No more. Fine, one more.'],
      pat: ['…', 'Fine.', 'Hm.', 'He permits this.'],
      overpat: ['That’s enough.', 'Hands off the spikes.', 'One more and he bites.'],
      leave: ['Packing.', 'Off he goes. Grumbling.', 'He’s going. He’s not happy about it.'],
      back: ['Back. He brought you a postcard.', 'Home again. Postcard attached.', 'He went. He saw. He was unimpressed.'],
      all: 'Every postcard collected. He’s been everywhere. Well, not Africa.'
    };

    function clamp(v) { return Math.max(0, Math.min(100, v)); }
    function pick(list) { return list[Math.floor(Math.random() * list.length)]; }

    var saved = null;
    try { saved = JSON.parse(localStorage.getItem(KEY)); } catch (e) { saved = null; }
    var firstVisit = !saved || typeof saved !== 'object';
    var state = firstVisit ? { snacks: 55, adventure: 40, cuddles: 35, t: Date.now(), seen: [], ate: 0, trips: 0, last: '' } : saved;
    ['snacks', 'adventure', 'cuddles', 'ate', 'trips'].forEach(function (k) {
      if (typeof state[k] !== 'number' || isNaN(state[k])) state[k] = k === 'ate' || k === 'trips' ? 0 : 40;
    });
    if (!Array.isArray(state.seen)) state.seen = [];
    var hoursAway = Math.max(0, (Date.now() - (Number(state.t) || Date.now())) / 36e5);
    Object.keys(DECAY).forEach(function (k) { state[k] = clamp(state[k] - DECAY[k] * hoursAway); });

    function save() {
      state.t = Date.now();
      try { localStorage.setItem(KEY, JSON.stringify(state)); } catch (e) { /* private mode: play on without saving */ }
    }

    var hrefs = photos.map(function (a) { return a.getAttribute('href'); });
    function seenCount() {
      return state.seen.filter(function (h) { return hrefs.indexOf(h) !== -1; }).length;
    }

    var moodOverride = null, overrideTimer = null, bubbleTimer = null, patTimer = null, patStreak = 0, busy = false;

    function moodName() {
      if (moodOverride) return moodOverride;
      var v = (state.snacks + state.adventure + state.cuddles) / 3;
      return v < 25 ? 'furious' : v < 55 ? 'grumpy' : v < 85 ? 'mild' : 'ok';
    }

    function render() {
      var m = moodName();
      root.setAttribute('data-mood', m);
      moodLabel.textContent = LABELS[m];
      Object.keys(fills).forEach(function (k) {
        var v = Math.round(state[k]);
        fills[k].style.width = v + '%';
        fills[k].parentNode.setAttribute('aria-valuenow', String(v));
      });
      pcCount.textContent = String(seenCount());
      pcTotal.textContent = String(photos.length);
      tallySnacks.textContent = String(state.ate);
      tallyTrips.textContent = String(state.trips);
    }

    function say(text, ms) {
      bubble.textContent = text;
      bubble.classList.add('is-shown');
      clearTimeout(bubbleTimer);
      bubbleTimer = setTimeout(function () { bubble.classList.remove('is-shown'); }, ms || 3200);
    }

    function play(cls, ms) {
      if (reduceMotion) return;
      pet.classList.remove(cls);
      void pet.getBoundingClientRect();   // restart the animation if it is already running
      pet.classList.add(cls);
      setTimeout(function () { pet.classList.remove(cls); }, ms);
    }

    function setOverride(m, ms) {
      moodOverride = m;
      clearTimeout(overrideTimer);
      overrideTimer = setTimeout(function () { moodOverride = null; render(); }, ms);
    }

    function feed(kind) {
      var wasFull = state.snacks >= 95;
      state.snacks = clamp(state.snacks + (kind === 'pandan' ? 30 : 25));
      state.ate += 1;
      patStreak = 0;
      play('is-eating', 600);
      say(wasFull ? pick(LINES.full) : pick(LINES[kind]));
      render();
      save();
    }

    function pat() {
      if (busy) return;
      patStreak += 1;
      clearTimeout(patTimer);
      patTimer = setTimeout(function () { patStreak = 0; }, 8000);
      if (patStreak > 3) {
        state.cuddles = clamp(state.cuddles - 10);
        setOverride('furious', 2500);
        play('is-annoyed', 500);
        say(pick(LINES.overpat));
      } else {
        state.cuddles = clamp(state.cuddles + 15);
        play('is-patted', 450);
        say(pick(LINES.pat));
      }
      render();
      save();
    }

    function showPostcard(a, isNew) {
      var thumb = a.querySelector('img');
      var fig = document.createElement('figure');
      fig.className = 'postcard' + (isNew ? ' is-new' : '');
      var open = document.createElement('button');
      open.type = 'button';
      open.className = 'postcard-photo';
      open.setAttribute('aria-label', 'Open this photo in the gallery');
      var img = document.createElement('img');
      img.src = thumb ? thumb.getAttribute('src') : a.getAttribute('href');
      img.alt = thumb ? thumb.alt : '';
      open.appendChild(img);
      open.addEventListener('click', function () { a.click(); });
      var stamp = document.createElement('span');
      stamp.className = 'postcard-stamp';
      stamp.setAttribute('aria-hidden', 'true');
      var stampImg = document.createElement('img');
      stampImg.src = 'assets/img/logo.svg';
      stampImg.alt = '';
      stamp.appendChild(stampImg);
      var caption = document.createElement('figcaption');
      caption.textContent = a.getAttribute('data-caption') || '';
      fig.appendChild(open);
      fig.appendChild(stamp);
      fig.appendChild(caption);
      slot.innerHTML = '';
      slot.appendChild(fig);
    }

    function trip() {
      if (busy || !photos.length) return;
      busy = true;
      patStreak = 0;
      buttons.forEach(function (b) { b.disabled = true; });
      say(pick(LINES.leave), 1400);
      play('is-away', 1300);
      setTimeout(function () {
        var unseen = photos.filter(function (a) { return state.seen.indexOf(a.getAttribute('href')) === -1; });
        var a = pick(unseen.length ? unseen : photos);
        var href = a.getAttribute('href');
        if (state.seen.indexOf(href) === -1) state.seen.push(href);
        state.last = href;
        state.trips += 1;
        state.adventure = clamp(state.adventure + 35);
        state.snacks = clamp(state.snacks - 5);
        showPostcard(a, true);
        say(unseen.length === 1 ? LINES.all : pick(LINES.back), 3800);
        render();
        save();
        busy = false;
        buttons.forEach(function (b) { b.disabled = false; });
      }, reduceMotion ? 300 : 1300);
    }

    buttons.forEach(function (b) {
      b.addEventListener('click', function () {
        var act = b.getAttribute('data-act');
        if (act === 'matcha' || act === 'pandan') feed(act);
        else if (act === 'pat') pat();
        else if (act === 'trip') trip();
      });
    });
    pet.addEventListener('click', pat);

    // His age, from his hatch date, so it never goes stale
    var now = new Date();
    var age = now.getFullYear() - 2017 - (now.getMonth() < 3 || (now.getMonth() === 3 && now.getDate() < 9) ? 1 : 0);
    ageEl.textContent = String(age);

    // Bring back the last postcard he sent this visitor
    if (state.last) {
      var lastA = photos.filter(function (a) { return a.getAttribute('href') === state.last; })[0];
      if (lastA) showPostcard(lastA, false);
    }
    render();
    save();

    // Say hello once, when the toy first comes into view
    var greeting = now.getMonth() === 3 && now.getDate() === 9 ? 'It’s his birthday. He expects pandan cake.'
      : firstVisit ? 'This is Pusheeno. He’s been expecting you. Not fondly.'
      : hoursAway > 24 ? 'You’re back. He’s been waiting. ' + (moodName() === 'furious' ? 'Furiously.' : 'Grumpily.')
      : 'Back already? He noticed.';
    if ('IntersectionObserver' in window) {
      var greeter = new IntersectionObserver(function (entries) {
        if (entries.some(function (e) { return e.isIntersecting; })) {
          greeter.disconnect();
          setTimeout(function () { say(greeting, 4200); }, 400);
        }
      }, { threshold: 0.5 });
      greeter.observe(root);
    } else {
      say(greeting, 4200);
    }
  })();

  /* ---- Suggestions: sends to a Google Form. Stays hidden until the form's data-action is set ---- */
  (function () {
    var wrap = document.getElementById('suggest');
    var form = document.getElementById('suggest-form');
    if (!wrap || !form) return;
    var action = form.getAttribute('data-action');
    var ids = {
      place: form.getAttribute('data-entry-place'),
      idea: form.getAttribute('data-entry-idea'),
      name: form.getAttribute('data-entry-name')
    };
    if (!action || !ids.place) return;
    wrap.hidden = false;

    var status = form.querySelector('.suggest-status');
    var submit = form.querySelector('button[type="submit"]');
    var KEY = 'pusheeno-suggest-last';
    var THANKS = 'Sent. He’ll consider it. Grumpily.';

    function setStatus(text, cls) {
      status.textContent = text;
      status.className = 'suggest-status' + (cls ? ' ' + cls : '');
    }

    form.addEventListener('submit', function (event) {
      event.preventDefault();
      var place = form.elements.place.value.trim();
      var idea = form.elements.idea.value.trim();
      var name = form.elements.name.value.trim();
      if (!place) {
        setStatus('Tell him where first.', 'is-error');
        form.elements.place.focus();
        return;
      }
      if (form.elements.website.value) {   // the hidden field only bots fill in
        form.reset();
        setStatus(THANKS, 'is-ok');
        return;
      }
      var last = 0;
      try { last = Number(localStorage.getItem(KEY)) || 0; } catch (e) { last = 0; }
      if (Date.now() - last < 30000) {
        setStatus('One moment. He’s still reading your last one.', 'is-error');
        return;
      }
      var body = new URLSearchParams();
      body.append(ids.place, place);
      if (idea && ids.idea) body.append(ids.idea, idea);
      if (name && ids.name) body.append(ids.name, name);
      submit.disabled = true;
      setStatus('Sending…');
      fetch(action, { method: 'POST', mode: 'no-cors', body: body })
        .then(function () {
          try { localStorage.setItem(KEY, String(Date.now())); } catch (e) { /* ignore */ }
          form.reset();
          setStatus(THANKS, 'is-ok');
        })
        .catch(function () {
          setStatus('That didn’t send. Try again in a bit, or message him on Instagram.', 'is-error');
        })
        .then(function () { submit.disabled = false; });
    });
  })();
})();
