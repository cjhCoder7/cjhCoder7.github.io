/**
 * Scroll-reveal: fade + rise elements marked with [data-reveal] as they
 * enter the viewport. Honors prefers-reduced-motion, degrades gracefully
 * when IntersectionObserver is unavailable, and guarantees content is never
 * left permanently hidden (a safety net reveals anything still off-screen).
 */
(function () {
    'use strict';

    var els = Array.prototype.slice.call(document.querySelectorAll('[data-reveal]'));
    if (!els.length) return;

    var reduceMotion = window.matchMedia &&
        window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    function revealNow(el, stagger) {
        if (el.classList.contains('is-visible')) return;
        if (stagger) el.style.transitionDelay = stagger + 'ms';
        el.classList.add('is-visible');
    }

    // No IntersectionObserver or reduced motion: show everything immediately.
    if (reduceMotion || !('IntersectionObserver' in window)) {
        els.forEach(function (el) { revealNow(el); });
        return;
    }

    var observer = new IntersectionObserver(function (entries, obs) {
        entries.forEach(function (entry) {
            if (!entry.isIntersecting) return;
            var el = entry.target;
            // Stagger direct siblings that reveal together for a gentle cascade.
            var group = el.parentElement
                ? Array.prototype.slice.call(el.parentElement.children).filter(function (c) {
                    return c.hasAttribute('data-reveal');
                })
                : [el];
            var idx = group.indexOf(el);
            var delay = idx > 0 ? Math.min(idx, 6) * 70 : 0;
            revealNow(el, delay);
            obs.unobserve(el);
        });
    }, { threshold: 0, rootMargin: '0px 0px -8% 0px' });

    els.forEach(function (el) { observer.observe(el); });

    // Safety net: after the page settles, reveal anything that is already in
    // (or above) the viewport but somehow hasn't been marked yet. This guards
    // against missed observer callbacks so content is never stuck invisible.
    function sweep() {
        var vh = window.innerHeight || document.documentElement.clientHeight;
        els.forEach(function (el) {
            if (el.classList.contains('is-visible')) return;
            var rect = el.getBoundingClientRect();
            if (rect.top < vh) revealNow(el);
        });
    }

    window.addEventListener('load', function () { setTimeout(sweep, 200); });
})();
