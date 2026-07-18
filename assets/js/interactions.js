/**
 * Small, restrained interactions — every effect is a progressive enhancement
 * and degrades to plain behaviour if anything is unavailable.
 *
 *   1. Pointer sheen: a warm light that trails the cursor across any card,
 *      easing toward the pointer with a little inertia (pointer devices only,
 *      off for touch and reduced-motion).
 *   2. Scroll-aware navbar — flat at the top, hairline + soft lift once scrolled.
 *   3. Back-to-top chip that fades in after scrolling.
 *   4. Keyboard shortcuts (Vim-flavoured): `g h` / `g p` to navigate, `t` to
 *      toggle theme, `?` for the help panel, `Esc` to dismiss.
 *   5. A quiet console signature for the curious.
 */
(function () {
    'use strict';

    var reduceMotion = window.matchMedia &&
        window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    var finePointer = window.matchMedia &&
        window.matchMedia('(hover: hover) and (pointer: fine)').matches;

    /* -- 1. Pointer sheen with inertia ------------------------------------ */
    function initPointerSheen() {
        if (reduceMotion || !finePointer) return;
        var cards = Array.prototype.slice.call(document.querySelectorAll('.sheen-surface'));
        if (!cards.length) return;

        var active = null;           // card currently under the pointer
        var target = { x: 50, y: 30 }; // where the pointer is (%)
        var current = { x: 50, y: 30 }; // where the light is (%) — eased
        var raf = null;

        function tick() {
            // Ease the light toward the pointer for a gentle trailing feel.
            current.x += (target.x - current.x) * 0.14;
            current.y += (target.y - current.y) * 0.14;
            if (active) {
                active.style.setProperty('--mx', current.x.toFixed(2) + '%');
                active.style.setProperty('--my', current.y.toFixed(2) + '%');
            }
            var settled = Math.abs(target.x - current.x) < 0.1 &&
                Math.abs(target.y - current.y) < 0.1;
            if (active && !settled) {
                raf = window.requestAnimationFrame(tick);
            } else {
                raf = null;
            }
        }

        function kick() {
            if (raf === null) raf = window.requestAnimationFrame(tick);
        }

        cards.forEach(function (card) {
            card.addEventListener('mouseenter', function () {
                active = card;
                card.classList.add('is-pointer-active');
            });
            card.addEventListener('mousemove', function (e) {
                var rect = card.getBoundingClientRect();
                target.x = ((e.clientX - rect.left) / rect.width) * 100;
                target.y = ((e.clientY - rect.top) / rect.height) * 100;
                kick();
            });
            card.addEventListener('mouseleave', function () {
                card.classList.remove('is-pointer-active');
                if (active === card) active = null;
            });
        });
    }

    /* -- 2. Scroll-aware navbar & 3. back-to-top -------------------------- */
    function initScrollUI() {
        var navbar = document.querySelector('.navbar');
        var toTop = document.getElementById('back-to-top');
        if (!navbar && !toTop) return;

        var ticking = false;

        function onScroll() {
            var y = window.pageYOffset || document.documentElement.scrollTop || 0;
            if (navbar) navbar.classList.toggle('navbar--scrolled', y > 8);
            if (toTop) toTop.classList.toggle('is-visible', y > 400);
            ticking = false;
        }

        window.addEventListener('scroll', function () {
            if (!ticking) {
                window.requestAnimationFrame(onScroll);
                ticking = true;
            }
        }, { passive: true });

        onScroll();

        if (toTop) {
            toTop.addEventListener('click', function () {
                window.scrollTo({ top: 0, behavior: reduceMotion ? 'auto' : 'smooth' });
            });
        }
    }

    /* -- 4. Keyboard shortcuts ------------------------------------------- */
    function initShortcuts() {
        var help = document.getElementById('kbd-help');
        var baseurl = (window.__SITE_BASEURL__ || '').replace(/\/$/, '');

        function go(path) { window.location.href = baseurl + path; }
        function closeHelp() { if (help) help.classList.remove('is-open'); }
        function toggleHelp() { if (help) help.classList.toggle('is-open'); }

        if (help) {
            help.addEventListener('click', function (e) {
                if (e.target === help) closeHelp(); // click backdrop to dismiss
            });
        }

        var pendingG = false;   // waiting for the second key of a `g _` chord
        var gTimer = null;

        document.addEventListener('keydown', function (e) {
            // Never hijack typing, modifier combos, or IME composition.
            var t = e.target;
            var typing = t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' ||
                t.isContentEditable);
            if (typing || e.metaKey || e.ctrlKey || e.altKey || e.isComposing) return;

            if (e.key === 'Escape') { closeHelp(); return; }

            if (e.key === '?') { toggleHelp(); e.preventDefault(); return; }

            if (help && help.classList.contains('is-open')) {
                // While help is open, ignore other shortcuts.
                return;
            }

            if (pendingG) {
                pendingG = false;
                if (gTimer) { clearTimeout(gTimer); gTimer = null; }
                if (e.key === 'h') { go('/'); return; }
                if (e.key === 'p') { go('/publications.html'); return; }
                return;
            }

            if (e.key === 'g') {
                pendingG = true;
                gTimer = setTimeout(function () { pendingG = false; }, 800);
                return;
            }

            if (e.key === 't') {
                var btn = document.getElementById('theme-toggle-btn');
                if (btn) btn.click();
                return;
            }

            if (e.key === 'Home' && document.getElementById('back-to-top')) {
                window.scrollTo({ top: 0, behavior: reduceMotion ? 'auto' : 'smooth' });
            }
        });
    }

    /* -- 5. Console signature -------------------------------------------- */
    // A small `whoami` for anyone who opens the console. Uses the live theme
    // accent so it matches light/dark, and stays quiet — no noise, just a hello.
    function initConsoleSignature() {
        if (!window.console || !console.log) return;

        var accentVar = '';
        try {
            accentVar = getComputedStyle(document.documentElement)
                .getPropertyValue('--accent').trim();
        } catch (e) { /* ignore */ }
        var accentColor = accentVar || '#C15F3C';

        var mono = 'font-family:ui-monospace,SFMono-Regular,Menlo,Consolas,monospace';
        var accent = 'color:' + accentColor + ';font-weight:600;font-size:13px;' + mono;
        var head = 'color:' + accentColor + ';font-weight:700;font-size:14px;' + mono;
        var name = 'color:inherit;font-weight:600;font-size:13px;' + mono;
        var label = 'color:#8A867C;font-size:12px;' + mono;
        var value = 'color:inherit;font-size:12px;' + mono;

        try {
            console.log('%c$ whoami', accent);
            console.log('%cJunhang Cheng %c程浚航', head, label);
            console.log('%cBuilding LLM foundation models @ Beihang University.', value);
            console.log(
                '\n%cfocus  %c~ data · pre-training · mid-training · post-training' +
                '\n%ccode   %c~ github.com/cjhCoder7' +
                '\n%cwrite  %c~ chengjunhang7@gmail.com',
                label, value, label, value, label, value
            );
            console.log('%cTip: press %c?%c anywhere for keyboard shortcuts.',
                label, accent, label);
        } catch (err) { /* older consoles: no styling, no problem */ }
    }

    function init() {
        initPointerSheen();
        initScrollUI();
        initShortcuts();
        initConsoleSignature();
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
