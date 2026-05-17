// Bever Bouwbedrijf — interactive layer

(() => {
  'use strict';

  // ---------- Sticky nav shadow on scroll ----------
  const nav = document.getElementById('nav');
  const onScroll = () => {
    if (!nav) return;
    nav.classList.toggle('is-scrolled', window.scrollY > 8);
  };
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  // ---------- Mobile menu ----------
  const burger = document.getElementById('burger');
  const mobile = document.getElementById('navMobile');
  if (burger && mobile) {
    burger.addEventListener('click', () => {
      const open = mobile.classList.toggle('is-open');
      burger.setAttribute('aria-expanded', open ? 'true' : 'false');
    });
    mobile.querySelectorAll('a').forEach(a => {
      a.addEventListener('click', () => {
        mobile.classList.remove('is-open');
        burger.setAttribute('aria-expanded', 'false');
      });
    });
  }

  // ---------- Reveal-on-scroll ----------
  const io = new IntersectionObserver((entries) => {
    entries.forEach(e => {
      if (e.isIntersecting) {
        e.target.classList.add('is-in');
        io.unobserve(e.target);
      }
    });
  }, { threshold: 0.12, rootMargin: '0px 0px -60px 0px' });
  document.querySelectorAll('.reveal').forEach(el => io.observe(el));

  // ---------- Project filters ----------
  const chips = document.querySelectorAll('.chip');
  const projects = document.querySelectorAll('.proj');
  chips.forEach(chip => {
    chip.addEventListener('click', () => {
      const filter = chip.dataset.filter;
      chips.forEach(c => c.classList.toggle('is-active', c === chip));
      projects.forEach(p => {
        const match = filter === 'all' || p.dataset.cat === filter;
        p.classList.toggle('is-hidden', !match);
      });
    });
  });

  // ---------- Contact form validation ----------
  const form = document.getElementById('contactForm');
  if (form) {
    const success = document.getElementById('formSuccess');

    const validators = {
      name: (v) => v.trim().length >= 2,
      phone: (v) => /[0-9+\s\-()]{6,}/.test(v.trim()),
      email: (v) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim()),
      message: (v) => v.trim().length >= 4,
    };

    const setInvalid = (input, invalid) => {
      const field = input.closest('.field');
      if (!field) return;
      field.classList.toggle('is-invalid', invalid);
    };

    form.querySelectorAll('input, textarea').forEach(input => {
      input.addEventListener('blur', () => {
        const name = input.name;
        if (validators[name]) setInvalid(input, !validators[name](input.value));
      });
      input.addEventListener('input', () => {
        const field = input.closest('.field');
        if (field && field.classList.contains('is-invalid')) {
          const name = input.name;
          if (validators[name] && validators[name](input.value)) setInvalid(input, false);
        }
      });
    });

    form.addEventListener('submit', (e) => {
      e.preventDefault();
      let ok = true;
      Object.keys(validators).forEach(key => {
        const input = form.querySelector(`[name="${key}"]`);
        if (!input) return;
        const valid = validators[key](input.value);
        setInvalid(input, !valid);
        if (!valid) ok = false;
      });

      if (!ok) {
        const firstBad = form.querySelector('.field.is-invalid input, .field.is-invalid textarea');
        if (firstBad) firstBad.focus();
        return;
      }

      // Simulated success
      const btn = form.querySelector('button[type="submit"] .btn__label');
      if (btn) btn.textContent = 'Bedankt!';
      success.classList.add('is-visible');
      form.querySelectorAll('input, textarea, select').forEach(el => { el.value = ''; el.disabled = true; });
      setTimeout(() => {
        success.classList.remove('is-visible');
        form.querySelectorAll('input, textarea, select').forEach(el => el.disabled = false);
        if (btn) btn.textContent = 'Offerte aanvragen';
      }, 6000);
    });
  }

  // ---------- Steps scroll line ----------
  const stepsLine = document.getElementById('stepsLine');
  if (stepsLine) {
    const nums = Array.from(stepsLine.querySelectorAll('.step__num'));
    const segments = [];

    const buildSegments = () => {
      // Remove old segments
      stepsLine.querySelectorAll('.step__seg').forEach(s => s.remove());
      segments.length = 0;

      const containerRect = stepsLine.getBoundingClientRect();

      for (let i = 0; i < nums.length - 1; i++) {
        const topRect = nums[i].getBoundingClientRect();
        const botRect = nums[i + 1].getBoundingClientRect();

        // Center X of the number element, relative to container
        const cx = (topRect.left + topRect.right) / 2 - containerRect.left;
        const segTop = topRect.bottom - containerRect.top + 4;
        const segBot = botRect.top - containerRect.top - 4;
        const segHeight = segBot - segTop;

        const seg = document.createElement('div');
        seg.className = 'step__seg';
        seg.style.left = cx - 1 + 'px';
        seg.style.top = segTop + 'px';
        seg.style.height = segHeight + 'px';

        const fill = document.createElement('div');
        fill.className = 'step__seg-fill';
        seg.appendChild(fill);
        stepsLine.appendChild(seg);
        segments.push({ seg, fill, topRect, botRect });
      }
    };

    buildSegments();
    window.addEventListener('resize', buildSegments);

    const updateSegments = () => {
      const windowH = window.innerHeight;
      segments.forEach(({ fill, topRect, botRect }, i) => {
        // Re-read rects on scroll for accuracy
        const top = nums[i].getBoundingClientRect();
        const bot = nums[i + 1].getBoundingClientRect();
        // Segment starts filling when the top number is 70% into viewport
        // and finishes when the bottom number reaches 60% into viewport
        const startY = top.top + top.height / 2;
        const endY = bot.top + bot.height / 2;
        const triggerStart = windowH * 0.7;
        const triggerEnd = windowH * 0.6;
        const progress = Math.min(1, Math.max(0,
          (triggerStart - startY) / (triggerStart - triggerEnd + (endY - startY))
        ));
        fill.style.height = (progress * 100) + '%';
      });
    };

    window.addEventListener('scroll', updateSegments, { passive: true });
    updateSegments();
  }

  // ---------- Count-up animation ----------
  const countEls = document.querySelectorAll('.count-up');
  const easeOut = (t) => 1 - Math.pow(1 - t, 3);

  const animateCount = (el) => {
    const target = parseFloat(el.dataset.count);
    const suffix = el.dataset.suffix || '';
    const decimals = parseInt(el.dataset.decimals || '0');
    const decSep = el.dataset.decimalSep || '.';
    const duration = Math.min(1800, 600 + target * 3);
    const start = performance.now();

    const tick = (now) => {
      const elapsed = now - start;
      const progress = Math.min(elapsed / duration, 1);
      const value = target * easeOut(progress);
      const display = decimals > 0
        ? value.toFixed(decimals).replace('.', decSep)
        : Math.floor(value).toString();
      el.textContent = display + suffix;
      if (progress < 1) requestAnimationFrame(tick);
    };

    requestAnimationFrame(tick);
  };

  const countObserver = new IntersectionObserver((entries) => {
    entries.forEach(e => {
      if (e.isIntersecting) {
        animateCount(e.target);
        countObserver.unobserve(e.target);
      }
    });
  }, { threshold: 0.5 });

  countEls.forEach(el => countObserver.observe(el));

  // ---------- Offerte knoppen — scroll naar formulier zonder hash in URL ----------
  document.querySelectorAll('a[href="#contactForm"]').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      const target = document.getElementById('contactForm');
      if (target) target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  });

  // ---------- Dienst modal ----------
  const svcBackdrop = document.getElementById('svcModalBackdrop');
  const svcClose = document.getElementById('svcModalClose');
  const svcCta = document.getElementById('svcModalCta');

  const openSvcModal = (card) => {
    document.getElementById('svcModalTitle').textContent = card.dataset.svcTitle;
    document.getElementById('svcModalBody').textContent = card.dataset.svcBody;
    // Copy the icon SVG from the card
    const iconSrc = card.querySelector('.svc__icon').innerHTML;
    document.getElementById('svcModalIcon').innerHTML = iconSrc;
    svcBackdrop.classList.add('is-open');
    document.body.style.overflow = 'hidden';
  };

  const closeSvcModal = () => {
    svcBackdrop.classList.remove('is-open');
    document.body.style.overflow = '';
  };

  document.querySelectorAll('.svc').forEach(card => {
    card.addEventListener('click', () => openSvcModal(card));
  });

  svcClose.addEventListener('click', closeSvcModal);
  svcBackdrop.addEventListener('click', (e) => { if (e.target === svcBackdrop) closeSvcModal(); });
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape') closeSvcModal(); });
  svcCta.addEventListener('click', closeSvcModal);

  // ---------- Project modal ----------
  const backdrop = document.getElementById('modalBackdrop');
  const modalClose = document.getElementById('modalClose');
  const modalCta = document.getElementById('modalCta');

  const openModal = (proj) => {
    document.getElementById('modalImg').src = proj.querySelector('.proj__media img').src;
    document.getElementById('modalImg').alt = proj.dataset.title;
    document.getElementById('modalType').textContent = proj.dataset.type;
    document.getElementById('modalLocation').textContent = proj.dataset.location;
    document.getElementById('modalTitle').textContent = proj.dataset.title;
    document.getElementById('modalDesc').textContent = proj.dataset.desc;
    document.getElementById('modalReview').textContent = '\u201C' + proj.dataset.review + '\u201D';
    document.getElementById('modalReviewer').textContent = proj.dataset.reviewer;
    backdrop.classList.add('is-open');
    document.body.style.overflow = 'hidden';
  };

  const closeModal = () => {
    backdrop.classList.remove('is-open');
    document.body.style.overflow = '';
  };

  document.querySelectorAll('.proj').forEach(proj => {
    proj.addEventListener('click', (e) => {
      e.preventDefault();
      openModal(proj);
    });
  });

  modalClose.addEventListener('click', closeModal);
  backdrop.addEventListener('click', (e) => { if (e.target === backdrop) closeModal(); });
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape') closeModal(); });
  modalCta.addEventListener('click', closeModal);

  // ---------- Active section highlight in nav ----------
  const sections = document.querySelectorAll('main section[id]');
  const navLinks = document.querySelectorAll('.nav__links a');
  if (sections.length && navLinks.length) {
    const spy = new IntersectionObserver((entries) => {
      entries.forEach(e => {
        if (e.isIntersecting) {
          const id = e.target.id;
          navLinks.forEach(a => {
            const match = a.getAttribute('href') === '#' + id;
            a.classList.toggle('is-active', match);
          });
        }
      });
    }, { rootMargin: '-40% 0px -55% 0px', threshold: 0 });
    sections.forEach(s => spy.observe(s));
  }
})();
