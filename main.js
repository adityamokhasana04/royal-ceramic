/* ============================================================
   Royal Ceramic Industries — site interactions
   Modules (top → bottom):
     01 helpers            08 product filter tabs
     02 header state       09 certificate slider arrows
     03 mobile menu        10 testimonial autoplay + dots
     04 search dialog      11 gallery lightbox
     05 scroll reveal      12 magnetic buttons
     06 counters           13 cursor glow
     07 hero parallax      14 contact + newsletter forms
   Every effect honors prefers-reduced-motion and stays
   transform-only / rAF-throttled to avoid layout thrashing.
   ============================================================ */

(() => {
    'use strict';

    /* ---- 01 · Helpers ---------------------------------------- */
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const isFinePointer = window.matchMedia('(pointer: fine)').matches;

    const debounce = (fn, ms = 150) => {
        let t;
        return (...args) => { clearTimeout(t); t = setTimeout(() => fn(...args), ms); };
    };

    /* ---- 02 · Header: height vars, glass + shrink on scroll --- */
    const header = document.getElementById('site-header');
    const announce = document.getElementById('announce');

    // --header-h (tall state) drives the hero layout; --header-h-min
    // (shrunk state) drives scroll-padding, because anchor jumps
    // always land scrolled. Both states are measured explicitly with
    // the padding transition suppressed, so a mid-scroll resize can
    // never poison either value with a half-transitioned height.
    const syncHeights = () => {
        if (header) {
            const row = header.querySelector('.header-row');
            const wasScrolled = header.classList.contains('scrolled');
            row.style.transition = 'none';
            header.classList.remove('scrolled');
            document.documentElement.style.setProperty('--header-h', `${header.offsetHeight}px`);
            header.classList.add('scrolled');
            document.documentElement.style.setProperty('--header-h-min', `${header.offsetHeight}px`);
            header.classList.toggle('scrolled', wasScrolled);
            void header.offsetHeight;                // flush before re-enabling
            row.style.transition = '';
        }
        if (announce) document.documentElement.style.setProperty('--announce-h', `${announce.offsetHeight}px`);
    };
    syncHeights();
    window.addEventListener('resize', debounce(syncHeights), { passive: true });

    // Brand link returns all the way to the very top (announcement
    // bar included), which a plain #home anchor jump would miss.
    const brandLink = document.querySelector('.site-header a[href="#home"]');
    if (brandLink) {
        brandLink.addEventListener('click', (e) => {
            e.preventDefault();
            window.scrollTo({ top: 0, behavior: prefersReducedMotion ? 'auto' : 'smooth' });
        });
    }

    let headerTicking = false;
    const onHeaderScroll = () => {
        if (headerTicking) return;
        headerTicking = true;
        requestAnimationFrame(() => {
            header.classList.toggle('scrolled', window.scrollY > 8);
            headerTicking = false;
        });
    };
    onHeaderScroll();
    window.addEventListener('scroll', onHeaderScroll, { passive: true });

    /* ---- 03 · Mobile menu ------------------------------------ */
    const menuOpenBtn = document.getElementById('menu-open');
    const menuCloseBtn = document.getElementById('menu-close');
    const mobileMenu = document.getElementById('mobile-menu');

    const setMenu = (open) => {
        document.body.classList.toggle('menu-open', open);
        menuOpenBtn.setAttribute('aria-expanded', String(open));
        mobileMenu.setAttribute('aria-hidden', String(!open));
        (open ? menuCloseBtn : menuOpenBtn).focus();
    };

    if (menuOpenBtn && mobileMenu) {
        menuOpenBtn.addEventListener('click', () => setMenu(true));
        menuCloseBtn.addEventListener('click', () => setMenu(false));
        mobileMenu.querySelectorAll('.mobile-link').forEach((link) =>
            link.addEventListener('click', () => setMenu(false)));
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && document.body.classList.contains('menu-open')) setMenu(false);
        });
    }

    /* ---- 04 · Search dialog: quick-jump to sections ----------- */
    const searchDialog = document.getElementById('search-dialog');
    const searchInput = document.getElementById('search-input');
    const searchResults = document.getElementById('search-results');

    const SEARCH_INDEX = [
        { label: 'About Us', href: '#about', icon: 'mdi:factory' },
        { label: 'Products', href: '#products', icon: 'mdi:cube-outline' },
        { label: 'Triangle Modular Socket', href: '#products', icon: 'mdi:power-socket-in' },
        { label: 'Porcelain Insulator', href: '#products', icon: 'mdi:power-plug-outline' },
        { label: '32AM Half DP Switch', href: '#products', icon: 'mdi:toggle-switch-outline' },
        { label: 'Refractory Products', href: '#products', icon: 'mdi:fire-circle' },
        { label: 'Manufacturing Process', href: '#process', icon: 'mdi:transit-connection-variant' },
        { label: 'Industries We Serve', href: '#industries', icon: 'mdi:domain' },
        { label: 'Certificates', href: '#certificates', icon: 'mdi:certificate-outline' },
        { label: 'Gallery', href: '#gallery', icon: 'mdi:image-multiple-outline' },
        { label: 'Testimonials', href: '#testimonials', icon: 'mdi:format-quote-open' },
        { label: 'News', href: '#news', icon: 'mdi:newspaper-variant-outline' },
        { label: 'Contact / Request Quote', href: '#contact', icon: 'mdi:chat-outline' },
    ];

    const renderSearch = (query = '') => {
        const q = query.trim().toLowerCase();
        const matches = SEARCH_INDEX.filter((item) => item.label.toLowerCase().includes(q));
        searchResults.innerHTML = matches.length
            ? matches.map((item) =>
                `<li><a class="search-link" href="${item.href}">
                    <span class="iconify text-lg text-primary" data-icon="${item.icon}"></span>${item.label}
                 </a></li>`).join('')
            : '<li class="px-4 py-3 text-sm text-graphite">No matches found.</li>';
        // Ask Iconify (if loaded) to render the freshly injected icons
        if (window.Iconify) window.Iconify.scanDOM();
        searchResults.querySelectorAll('.search-link').forEach((link) =>
            link.addEventListener('click', () => searchDialog.close()));
    };

    if (searchDialog) {
        document.getElementById('search-open').addEventListener('click', () => {
            searchDialog.showModal();
            renderSearch();
            searchInput.value = '';
            searchInput.focus();
        });
        searchInput.addEventListener('input', () => renderSearch(searchInput.value));
        searchDialog.addEventListener('click', (e) => {          // click outside closes
            if (e.target === searchDialog) searchDialog.close();
        });
    }

    /* ---- 05 · Scroll reveal (IntersectionObserver) ------------ */
    const revealEls = document.querySelectorAll('[data-reveal]');

    if (prefersReducedMotion || !('IntersectionObserver' in window)) {
        revealEls.forEach((el) => el.classList.add('in-view'));
    } else {
        const revealObserver = new IntersectionObserver((entries) => {
            entries.forEach((entry) => {
                if (!entry.isIntersecting) return;
                entry.target.classList.add('in-view');
                revealObserver.unobserve(entry.target);
            });
        }, { threshold: 0.15, rootMargin: '0px 0px -40px 0px' });
        revealEls.forEach((el) => revealObserver.observe(el));
    }

    /* ---- 06 · Animated counters ------------------------------- */
    const counters = document.querySelectorAll('[data-counter]');

    const runCounter = (el) => {
        const target = Number(el.getAttribute('data-counter')) || 0;
        if (prefersReducedMotion) { el.textContent = target; return; }
        const duration = 1600;
        const start = performance.now();
        const step = (now) => {
            const progress = Math.min((now - start) / duration, 1);
            const eased = 1 - Math.pow(1 - progress, 3);          // ease-out cubic
            el.textContent = Math.floor(eased * target);
            if (progress < 1) requestAnimationFrame(step);
            else el.textContent = target;
        };
        requestAnimationFrame(step);
    };

    if (counters.length) {
        const counterObserver = new IntersectionObserver((entries) => {
            entries.forEach((entry) => {
                if (!entry.isIntersecting) return;
                runCounter(entry.target);
                counterObserver.unobserve(entry.target);
            });
        }, { threshold: 0.5 });
        counters.forEach((el) => counterObserver.observe(el));
    }

    /* ---- 07 · Hero parallax (transform-only, rAF-throttled) --- */
    const heroMedia = document.querySelector('.hero__media');

    if (heroMedia && !prefersReducedMotion) {
        let heroTicking = false;
        window.addEventListener('scroll', () => {
            if (heroTicking) return;
            heroTicking = true;
            requestAnimationFrame(() => {
                const offset = Math.min(window.scrollY, window.innerHeight) * 0.15;
                heroMedia.style.transform = `translate3d(0, ${offset}px, 0) scale(1.06)`;
                heroTicking = false;
            });
        }, { passive: true });
    }

    /* ---- 08 · Product filter tabs ----------------------------- */
    const tabButtons = document.querySelectorAll('.tab-btn');
    const productCards = document.querySelectorAll('.product-card');

    tabButtons.forEach((btn) => {
        btn.addEventListener('click', () => {
            const filter = btn.getAttribute('data-filter');

            tabButtons.forEach((b) => {
                b.classList.toggle('is-active', b === btn);
                b.setAttribute('aria-selected', String(b === btn));
            });

            productCards.forEach((card) => {
                // Filtering is user-initiated: bypass the scroll-reveal state
                card.classList.add('in-view');
                card.classList.remove('card-pop');
                const show = filter === 'all' || card.getAttribute('data-category') === filter;
                card.classList.toggle('is-hidden', !show);
                if (show) requestAnimationFrame(() => card.classList.add('card-pop'));
            });
        });
    });

    /* ---- 09 · Certificate slider arrows ----------------------- */
    document.querySelectorAll('.slider-arrow').forEach((btn) => {
        btn.addEventListener('click', () => {
            const track = document.getElementById(btn.getAttribute('data-target'));
            if (!track) return;
            const card = track.firstElementChild;
            const step = card ? card.getBoundingClientRect().width + 20 : 320;
            track.scrollBy({ left: btn.getAttribute('data-slide') === 'next' ? step : -step, behavior: 'smooth' });
        });
    });

    /* ---- 10 · Testimonials: dots + autoplay ------------------- */
    const tSlider = document.getElementById('testimonial-slider');
    const tDots = document.getElementById('testimonial-dots');

    if (tSlider && tDots) {
        const slides = [...tSlider.children];
        const stepWidth = () => slides[0].getBoundingClientRect().width + 20;

        slides.forEach((_, i) => {
            const dot = document.createElement('button');
            dot.className = 'dot' + (i === 0 ? ' is-active' : '');
            dot.setAttribute('role', 'tab');
            dot.setAttribute('aria-label', `Show testimonial ${i + 1}`);
            dot.addEventListener('click', () => {
                tSlider.scrollTo({ left: i * stepWidth(), behavior: 'smooth' });
            });
            tDots.appendChild(dot);
        });

        const dots = [...tDots.children];
        const currentIndex = () => Math.min(slides.length - 1, Math.round(tSlider.scrollLeft / stepWidth()));

        let dotTicking = false;
        tSlider.addEventListener('scroll', () => {
            if (dotTicking) return;
            dotTicking = true;
            requestAnimationFrame(() => {
                const idx = currentIndex();
                dots.forEach((d, i) => d.classList.toggle('is-active', i === idx));
                dotTicking = false;
            });
        }, { passive: true });

        // Autoplay — pauses on hover, focus, or a hidden tab
        if (!prefersReducedMotion) {
            let paused = false;
            tSlider.addEventListener('mouseenter', () => { paused = true; });
            tSlider.addEventListener('mouseleave', () => { paused = false; });
            tSlider.addEventListener('focusin', () => { paused = true; });
            tSlider.addEventListener('focusout', () => { paused = false; });

            setInterval(() => {
                if (paused || document.hidden) return;
                const maxLeft = tSlider.scrollWidth - tSlider.clientWidth - 8;
                const next = tSlider.scrollLeft >= maxLeft ? 0 : (currentIndex() + 1) * stepWidth();
                tSlider.scrollTo({ left: next, behavior: 'smooth' });
            }, 5000);
        }
    }

    /* ---- 11 · Gallery lightbox -------------------------------- */
    const lightbox = document.getElementById('lightbox');
    const lightboxImg = document.getElementById('lightbox-img');
    const lightboxCaption = document.getElementById('lightbox-caption');

    if (lightbox) {
        document.querySelectorAll('.gallery-item').forEach((item) => {
            item.addEventListener('click', () => {
                const img = item.querySelector('img');
                lightboxImg.src = img.src;
                lightboxImg.alt = img.alt;
                lightboxCaption.textContent = item.getAttribute('data-caption') || '';
                lightbox.showModal();
            });
        });
        document.getElementById('lightbox-close').addEventListener('click', () => lightbox.close());
        lightbox.addEventListener('click', (e) => {             // click outside closes
            if (e.target === lightbox) lightbox.close();
        });
    }

    /* ---- 12 · Magnetic buttons (fine pointers only) ----------- */
    if (isFinePointer && !prefersReducedMotion) {
        document.querySelectorAll('.magnetic').forEach((el) => {
            el.addEventListener('mousemove', (e) => {
                const rect = el.getBoundingClientRect();
                const dx = (e.clientX - rect.left - rect.width / 2) / rect.width;
                const dy = (e.clientY - rect.top - rect.height / 2) / rect.height;
                el.style.setProperty('--mx', `${(dx * 10).toFixed(1)}px`);
                el.style.setProperty('--my', `${(dy * 8).toFixed(1)}px`);
            });
            el.addEventListener('mouseleave', () => {
                el.style.setProperty('--mx', '0px');
                el.style.setProperty('--my', '0px');
            });
        });
    }

    /* ---- 13 · Cursor glow (lerped follow, rAF loop) ----------- */
    const glow = document.getElementById('cursor-glow');

    if (glow && isFinePointer && !prefersReducedMotion) {
        let targetX = -240, targetY = -240, x = targetX, y = targetY, active = false;

        window.addEventListener('mousemove', (e) => {
            targetX = e.clientX - 240;
            targetY = e.clientY - 240;
            if (!active) { active = true; glow.style.opacity = '1'; tick(); }
        }, { passive: true });

        const tick = () => {
            x += (targetX - x) * 0.08;
            y += (targetY - y) * 0.08;
            glow.style.transform = `translate3d(${x.toFixed(1)}px, ${y.toFixed(1)}px, 0)`;
            requestAnimationFrame(tick);
        };
    }

    /* ---- 14 · Contact + newsletter forms ---------------------- */

    // EmailJS is optional: with placeholder keys the form falls back
    // to opening a pre-filled Gmail compose window.
    const emailjsConfig = {
        publicKey: 'YOUR_REAL_PUBLIC_KEY',
        serviceId: 'YOUR_REAL_SERVICE_ID',
        templateId: 'YOUR_REAL_TEMPLATE_ID',
    };

    const emailjsReady = () =>
        typeof emailjs !== 'undefined' &&
        !emailjsConfig.publicKey.includes('YOUR_') &&
        !emailjsConfig.serviceId.includes('YOUR_') &&
        !emailjsConfig.templateId.includes('YOUR_');

    if (typeof emailjs !== 'undefined' && !emailjsConfig.publicKey.includes('YOUR_')) {
        try { emailjs.init(emailjsConfig.publicKey); } catch (err) { console.error('EmailJS init failed:', err); }
    }

    const contactForm = document.getElementById('contact-form');

    if (contactForm) {
        contactForm.addEventListener('submit', async (event) => {
            event.preventDefault();
            const status = document.getElementById('contact-status');
            const submitBtn = contactForm.querySelector('button[type="submit"]');
            const payload = {
                name: contactForm.name.value.trim(),
                company: contactForm.company.value.trim(),
                email: contactForm.email.value.trim(),
                phone: contactForm.phone.value.trim(),
                subject: contactForm.subject.value.trim(),
                message: contactForm.message.value.trim(),
            };

            status.textContent = '';
            status.style.color = '';
            if (!payload.name || !payload.email || !payload.subject || !payload.message) {
                status.style.color = '#dc2626';
                status.textContent = 'Please complete all required fields before sending.';
                return;
            }

            submitBtn.disabled = true;

            try {
                if (!emailjsReady()) {
                    status.style.color = '#2563EB';
                    status.textContent = 'Opening Gmail with your message details…';
                    const gmailUrl = 'https://mail.google.com/mail/?view=cm&fs=1&to=sandipmokhasana@gmail.com'
                        + `&su=${encodeURIComponent(`Royal Ceramic Enquiry: ${payload.subject}`)}`
                        + `&body=${encodeURIComponent(`Name: ${payload.name}\nCompany: ${payload.company || 'N/A'}\nEmail: ${payload.email}\nPhone: ${payload.phone || 'N/A'}\n\nMessage:\n${payload.message}`)}`;
                    window.open(gmailUrl, '_blank', 'noopener,noreferrer');
                    contactForm.reset();
                    return;
                }

                const response = await emailjs.send(emailjsConfig.serviceId, emailjsConfig.templateId, {
                    from_name: payload.name,
                    company: payload.company || 'N/A',
                    from_email: payload.email,
                    phone: payload.phone || 'N/A',
                    subject: payload.subject,
                    message: payload.message,
                    to_email: 'sandipmokhasana@gmail.com',
                });

                if (response.status === 200) {
                    status.style.color = '#047857';
                    status.textContent = 'Your message was sent successfully. We reply within one business day.';
                    contactForm.reset();
                } else {
                    status.style.color = '#dc2626';
                    status.textContent = 'Unable to send your message right now. Please try again later.';
                }
            } catch (err) {
                status.style.color = '#dc2626';
                status.textContent = 'Unable to send your message right now. Please try again later.';
                console.error('EmailJS error:', err);
            } finally {
                submitBtn.disabled = false;
            }
        });
    }

    // Newsletter: front-end confirmation only — wire to a mailing
    // provider (e.g. Mailchimp endpoint) when one is available.
    const newsletterForm = document.getElementById('newsletter-form');

    if (newsletterForm) {
        newsletterForm.addEventListener('submit', (event) => {
            event.preventDefault();
            const emailField = document.getElementById('newsletter-email');
            let status = newsletterForm.querySelector('.newsletter-status');
            if (!status) {
                status = document.createElement('p');
                status.className = 'newsletter-status mt-2 w-full text-xs font-semibold';
                newsletterForm.appendChild(status);
            }
            if (!emailField.checkValidity()) {
                status.style.color = '#f87171';
                status.textContent = 'Please enter a valid email address.';
                return;
            }
            status.style.color = '#34d399';
            status.textContent = 'Thanks — you are on the list.';
            newsletterForm.reset();
        });
    }

    /* ---- Footer year ------------------------------------------ */
    const yearEl = document.getElementById('footer-year');
    if (yearEl) yearEl.textContent = String(new Date().getFullYear());
})();
