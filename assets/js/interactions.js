/**
 * Small, restrained interactions — every effect is a progressive enhancement
 * and degrades to plain behaviour if anything is unavailable.
 *
 *   1. Pointer sheen: a warm light that trails the cursor across any card,
 *      easing toward the pointer with a little inertia (pointer devices only,
 *      off for touch and reduced-motion).
 *   2. Scroll-aware navbar — flat at the top, hairline + soft lift once scrolled;
 *      also drives the reading-progress hairline at the top of the viewport.
 *   3. Back-to-top chip that fades in after scrolling.
 *   4. Command palette (⌘K / Ctrl+K / "/"): fuzzy-searchable navigate + actions
 *      (jump, toggle theme, copy email, open links), full keyboard control.
 *   5. Keyboard shortcuts (Vim-flavoured): `g h` / `g p` to navigate, `t` to
 *      toggle theme, `?` for the help panel, `Esc` to dismiss.
 *   6. A quiet console signature for the curious.
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

    /* -- 1b. Depth tilt: pointer-aware 3D on images ----------------------- */
    // As the cursor crosses a `.depth-tilt` surface, tilt it a few degrees in
    // 3D toward the pointer and drift a soft glare along with it. The CSS reads
    // --rx/--ry (rotation), --gx/--gy (glare position) and --glow (its strength)
    // and eases each change; here we only set them. Progressive enhancement:
    // off for touch and reduced-motion, and the element sits flat without JS.
    function initDepthTilt() {
        if (reduceMotion || !finePointer) return;
        var tiles = Array.prototype.slice.call(document.querySelectorAll('.depth-tilt'));
        if (!tiles.length) return;

        var MAX = 10; // peak tilt in degrees — kept gentle, not a gimmick

        tiles.forEach(function (tile) {
            var raf = null;
            var pending = null; // latest pointer position, applied on the next frame

            function apply() {
                raf = null;
                if (!pending) return;
                var rect = tile.getBoundingClientRect();
                if (!rect.width || !rect.height) return;
                // Pointer position within the tile, 0..1 on each axis.
                var px = (pending.x - rect.left) / rect.width;
                var py = (pending.y - rect.top) / rect.height;
                px = Math.min(1, Math.max(0, px));
                py = Math.min(1, Math.max(0, py));
                // Turn the surface to face the cursor: the corner nearest the
                // pointer rises toward the viewer (the familiar tilt-card feel).
                // Positive rotateX tips the top away, so the top half wants a
                // negative angle; likewise the right half wants negative rotateY.
                var rx = (py - 0.5) * 2 * MAX;
                var ry = (0.5 - px) * 2 * MAX;
                tile.style.setProperty('--rx', rx.toFixed(2) + 'deg');
                tile.style.setProperty('--ry', ry.toFixed(2) + 'deg');
                tile.style.setProperty('--gx', (px * 100).toFixed(1) + '%');
                tile.style.setProperty('--gy', (py * 100).toFixed(1) + '%');
                // Glare is faintest dead-centre, brightening toward the corners.
                var dist = Math.min(1, Math.hypot(px - 0.5, py - 0.5) / 0.7071);
                tile.style.setProperty('--glow', (0.5 + dist * 0.5).toFixed(2));
            }

            tile.addEventListener('mouseenter', function () {
                tile.classList.add('is-tilting');
            });
            tile.addEventListener('mousemove', function (e) {
                pending = { x: e.clientX, y: e.clientY };
                if (raf === null) raf = window.requestAnimationFrame(apply);
            });
            tile.addEventListener('mouseleave', function () {
                if (raf !== null) { window.cancelAnimationFrame(raf); raf = null; }
                pending = null;
                tile.classList.remove('is-tilting');
                // Ease back to flat — the CSS transition carries it home.
                tile.style.setProperty('--rx', '0deg');
                tile.style.setProperty('--ry', '0deg');
            });
        });
    }

    /* -- 2. Scroll-aware navbar, 3. back-to-top & reading progress -------- */
    function initScrollUI() {
        var navbar = document.querySelector('.navbar');
        var toTop = document.getElementById('back-to-top');
        var progress = document.getElementById('scroll-progress-bar');
        if (!navbar && !toTop && !progress) return;

        var ticking = false;
        var docEl = document.documentElement;

        function onScroll() {
            var y = window.pageYOffset || docEl.scrollTop || 0;
            if (navbar) navbar.classList.toggle('navbar--scrolled', y > 8);
            if (toTop) toTop.classList.toggle('is-visible', y > 400);
            if (progress) {
                // Fraction of the page scrolled through (0 at top, 1 at bottom).
                var max = (docEl.scrollHeight - docEl.clientHeight) || 1;
                var ratio = Math.min(1, Math.max(0, y / max));
                progress.style.transform = 'scaleX(' + ratio.toFixed(4) + ')';
            }
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

    /* -- 4. Command palette (⌘K / Ctrl+K / "/") --------------------------- */
    // A search-driven menu to navigate and act on the site. Fuzzy (subsequence)
    // filter, full keyboard control, mouse hover to highlight. Returns a small
    // API {open, close, isOpen} so the keyboard-shortcut layer can summon it.
    function initCommandPalette() {
        var backdrop = document.getElementById('cmdk');
        if (!backdrop) return null;
        var input = document.getElementById('cmdk-input');
        var list = document.getElementById('cmdk-list');
        var empty = backdrop.querySelector('.cmdk-empty');
        var items = Array.prototype.slice.call(list.querySelectorAll('.cmdk-item'));
        var groups = Array.prototype.slice.call(list.querySelectorAll('.cmdk-group'));
        var baseurl = (window.__SITE_BASEURL__ || '').replace(/\/$/, '');
        var lastFocused = null;
        var activeItem = null;

        // Precompute search haystacks; give each row an id for aria-activedescendant
        // and remember its original position for stable ranking tie-breaks.
        items.forEach(function (it, i) {
            it.id = 'cmdk-item-' + i;
            it._order = i;
            var labelEl = it.querySelector('.cmdk-label');
            var label = labelEl ? labelEl.textContent : '';
            it._hay = (label + ' ' + (it.getAttribute('data-keywords') || '')).toLowerCase();
        });

        // Original DOM order (groups + items), so we can restore it when the
        // query is cleared after a scored reorder.
        var originalOrder = Array.prototype.slice.call(list.children);

        function isOpen() { return backdrop.classList.contains('is-open'); }

        // Relevance score for a query against a haystack; -1 means no match.
        // Tiers: word-boundary substring > substring > subsequence ("gh" →
        // GitHub). Earlier and tighter matches rank higher, so "git" surfaces
        // GitHub above other rows that merely contain the letters.
        function score(q, hay) {
            var idx = hay.indexOf(q);
            if (idx !== -1) {
                var boundary = idx === 0 || hay.charAt(idx - 1) === ' ';
                return 1000 + (boundary ? 500 : 0) - idx;
            }
            var i = 0, first = -1, last = -1;
            for (var j = 0; j < hay.length && i < q.length; j++) {
                if (hay.charAt(j) === q.charAt(i)) {
                    if (first < 0) first = j;
                    last = j;
                    i++;
                }
            }
            if (i !== q.length) return -1;
            return 200 - (last - first) - first * 0.5; // prefer tight, early spans
        }

        // Visible items in DOM order — which equals ranked order after a search.
        function visibleItems() {
            return Array.prototype.slice.call(list.querySelectorAll('.cmdk-item'))
                .filter(function (it) { return !it.hidden; });
        }

        function setActive(it, scroll) {
            if (activeItem) {
                activeItem.classList.remove('is-active');
                activeItem.setAttribute('aria-selected', 'false');
            }
            activeItem = it || null;
            if (activeItem) {
                activeItem.classList.add('is-active');
                activeItem.setAttribute('aria-selected', 'true');
                input.setAttribute('aria-activedescendant', activeItem.id);
                if (scroll) activeItem.scrollIntoView({ block: 'nearest' });
            } else {
                input.removeAttribute('aria-activedescendant');
            }
        }

        function filter() {
            var q = input.value.trim().toLowerCase();

            if (!q) {
                // No query: restore the original grouped layout in DOM order.
                originalOrder.forEach(function (el) { list.appendChild(el); });
                items.forEach(function (it) { it.hidden = false; });
                groups.forEach(function (g) { g.hidden = false; });
                if (empty) empty.hidden = true;
                setActive(visibleItems()[0] || null, true);
                return;
            }

            // Searching: hide group headers, rank matching items, reorder the DOM.
            groups.forEach(function (g) { g.hidden = true; });
            var scored = [];
            items.forEach(function (it) {
                var s = score(q, it._hay);
                it.hidden = s < 0;
                if (s >= 0) scored.push({ it: it, s: s });
            });
            scored.sort(function (a, b) {
                if (b.s !== a.s) return b.s - a.s;
                return a.it._order - b.it._order; // stable: original order breaks ties
            });
            scored.forEach(function (row) { list.appendChild(row.it); });

            if (empty) empty.hidden = scored.length > 0;
            setActive(scored.length ? scored[0].it : null, true);
        }

        function move(delta) {
            var vis = visibleItems();
            if (!vis.length) return;
            var idx = vis.indexOf(activeItem);
            idx = (idx + delta + vis.length) % vis.length;
            setActive(vis[idx], true);
        }

        function open() {
            if (isOpen()) return;
            lastFocused = document.activeElement;
            var help = document.getElementById('kbd-help');
            if (help) help.classList.remove('is-open'); // never stack dialogs
            backdrop.classList.add('is-open');
            backdrop.setAttribute('aria-hidden', 'false');
            input.value = '';
            filter();
            window.requestAnimationFrame(function () { input.focus(); });
        }

        function close() {
            if (!isOpen()) return;
            backdrop.classList.remove('is-open');
            backdrop.setAttribute('aria-hidden', 'true');
            // Move focus out of the now-hidden dialog. If it was opened from a
            // real control (e.g. the navbar trigger), return focus there for
            // accessibility; otherwise just blur so page shortcuts work again
            // (focusing <body> is a no-op and would strand focus in the input).
            if (document.activeElement && backdrop.contains(document.activeElement)) {
                document.activeElement.blur();
            }
            if (lastFocused && lastFocused.focus && lastFocused !== document.body) {
                lastFocused.focus();
            }
            lastFocused = null;
        }

        // Copy-to-clipboard with a graceful fallback + a brief in-row confirmation.
        // Re-entrant safe: the pristine label/icon are cached once, and any
        // pending restore is cleared, so rapid repeats can't strand the "Copied"
        // text or lose the original icon.
        function flashCopied(it) {
            var labelEl = it.querySelector('.cmdk-label');
            var icon = it.querySelector('i');
            if (!labelEl) return;
            if (it._flashTimer) {
                clearTimeout(it._flashTimer);
            } else {
                it._origLabel = labelEl.textContent;
                it._origIcon = icon ? icon.className : null;
            }
            labelEl.textContent = 'Copied to clipboard';
            if (icon) icon.className = 'fas fa-check';
            it._flashTimer = setTimeout(function () {
                labelEl.textContent = it._origLabel;
                if (icon && it._origIcon !== null) icon.className = it._origIcon;
                it._flashTimer = null;
            }, 1100);
        }

        function legacyCopy(text) {
            try {
                var ta = document.createElement('textarea');
                ta.value = text;
                ta.setAttribute('readonly', '');
                ta.style.position = 'absolute';
                ta.style.left = '-9999px';
                document.body.appendChild(ta);
                ta.select();
                document.execCommand('copy');
                document.body.removeChild(ta);
            } catch (e) { /* clipboard unavailable — nothing to do */ }
        }

        function copyText(text, it) {
            function done() { if (it) flashCopied(it); }
            if (navigator.clipboard && navigator.clipboard.writeText) {
                navigator.clipboard.writeText(text).then(done, function () { legacyCopy(text); done(); });
            } else {
                legacyCopy(text);
                done();
            }
        }

        function run(it) {
            if (!it) return;
            var action = it.getAttribute('data-action');
            var value = it.getAttribute('data-value') || '';
            switch (action) {
                case 'nav':   close(); window.location.href = baseurl + value; break;
                case 'link':  window.open(value, '_blank', 'noopener'); close(); break;
                case 'mail':  close(); window.location.href = 'mailto:' + value; break;
                case 'theme': var b = document.getElementById('theme-toggle-btn'); if (b) b.click(); close(); break;
                case 'top':   close(); window.scrollTo({ top: 0, behavior: reduceMotion ? 'auto' : 'smooth' }); break;
                case 'copy':  copyText(value, it); break; // stay open to show the confirmation
                default:      close();
            }
        }

        input.addEventListener('input', filter);

        input.addEventListener('keydown', function (e) {
            if (e.key === 'ArrowDown') { e.preventDefault(); move(1); }
            else if (e.key === 'ArrowUp') { e.preventDefault(); move(-1); }
            else if (e.key === 'Enter') { e.preventDefault(); run(activeItem); }
            else if (e.key === 'Escape') { e.preventDefault(); close(); }
        });

        backdrop.addEventListener('click', function (e) {
            if (e.target === backdrop) close(); // click outside the panel dismisses
        });

        var trigger = document.getElementById('cmdk-trigger');
        if (trigger) trigger.addEventListener('click', open);

        items.forEach(function (it) {
            it.addEventListener('click', function () { run(it); });
            it.addEventListener('mousemove', function () {
                if (activeItem !== it) setActive(it, false);
            });
        });

        return { open: open, close: close, isOpen: isOpen };
    }

    /* -- 5. Keyboard shortcuts ------------------------------------------- */
    function initShortcuts(palette) {
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
            // ⌘K / Ctrl+K summons the command palette — caught before the guards
            // below so it works even while a field is focused. (Not Alt.)
            if ((e.metaKey || e.ctrlKey) && !e.altKey &&
                (e.key === 'k' || e.key === 'K')) {
                e.preventDefault();
                if (palette) { palette.isOpen() ? palette.close() : palette.open(); }
                return;
            }

            // Never hijack typing, modifier combos, or IME composition.
            var t = e.target;
            var typing = t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' ||
                t.isContentEditable);
            if (typing || e.metaKey || e.ctrlKey || e.altKey || e.isComposing) return;

            if (e.key === 'Escape') { closeHelp(); return; }

            if (e.key === '?') { toggleHelp(); e.preventDefault(); return; }

            // "/" opens the palette — the familiar "quick search" key.
            if (e.key === '/') {
                e.preventDefault();
                if (palette) palette.open();
                return;
            }

            // While a dialog is open, ignore the plain shortcuts below.
            if (help && help.classList.contains('is-open')) return;
            if (palette && palette.isOpen()) return;

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

    /* -- 6. Console signature -------------------------------------------- */
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
            console.log('%c$ whoami █', accent); // trailing block = pixel caret
            console.log('%cJunhang Cheng %c程浚航', head, label);
            console.log('%cBuilding LLM foundation models @ Beihang University.', value);
            console.log(
                '\n%cfocus  %c~ data · pre-training · mid-training · post-training' +
                '\n%ccode   %c~ github.com/cjhCoder7' +
                '\n%cwrite  %c~ chengjunhang7@gmail.com',
                label, value, label, value, label, value
            );
            console.log('%cTip: press %c⌘K%c (or %c/%c) for the command palette, %c?%c for shortcuts.',
                label, accent, label, accent, label, accent, label);
        } catch (err) { /* older consoles: no styling, no problem */ }
    }

    function init() {
        initPointerSheen();
        initDepthTilt();
        initScrollUI();
        var palette = initCommandPalette();
        initShortcuts(palette);
        initConsoleSignature();
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
