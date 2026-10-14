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
})();
