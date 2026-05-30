document.addEventListener('DOMContentLoaded', () => {
    if (typeof lucide !== 'undefined') lucide.createIcons();

    // nav scroll bg
    const nav = document.querySelector('.nav');
    let ticking = false;
    window.addEventListener('scroll', () => {
        if (!ticking) {
            requestAnimationFrame(() => {
                nav.classList.toggle('scrolled', window.scrollY > 40);
                ticking = false;
            });
            ticking = true;
        }
    });

    // scroll reveal
    const io = new IntersectionObserver((entries) => {
        entries.forEach(e => {
            if (e.isIntersecting) {
                e.target.classList.add('in');
                io.unobserve(e.target);
            }
        });
    }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });
    document.querySelectorAll('[data-reveal]').forEach(el => io.observe(el));

    // smooth anchor offset for fixed nav
    document.querySelectorAll('a[href^="#"]').forEach(a => {
        a.addEventListener('click', (e) => {
            const id = a.getAttribute('href');
            if (id.length > 1) {
                const target = document.querySelector(id);
                if (target) {
                    e.preventDefault();
                    const y = target.getBoundingClientRect().top + window.scrollY - 70;
                    window.scrollTo({ top: y, behavior: 'smooth' });
                }
            }
        });
    });

    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const fine = window.matchMedia('(pointer:fine)').matches;

    // hero headline word-by-word rise (split reveal, not generic fade-up)
    const title = document.querySelector('.hero-title');
    if (title && !reduceMotion) {
        const lines = title.innerHTML.split('<br>');
        title.innerHTML = lines.map(line => {
            // preserve the .hl span if present
            const wrap = document.createElement('div');
            wrap.innerHTML = line.trim();
            const out = [];
            wrap.childNodes.forEach(node => {
                if (node.nodeType === 3) {
                    node.textContent.trim().split(/\s+/).filter(Boolean).forEach(w => out.push(`<span class="w"><span class="wi">${w}</span></span>`));
                } else {
                    const cls = node.className ? ' ' + node.className : '';
                    node.textContent.trim().split(/\s+/).filter(Boolean).forEach(w => out.push(`<span class="w${cls}"><span class="wi">${w}</span></span>`));
                }
            });
            return `<span class="line">${out.join(' ')}</span>`;
        }).join('');
        const wis = title.querySelectorAll('.wi');
        wis.forEach((el, i) => { el.style.transitionDelay = (i * 55) + 'ms'; });
        requestAnimationFrame(() => requestAnimationFrame(() => title.classList.add('lit')));
    }

    // magnetic primary buttons (desktop only, subtle)
    if (fine && !reduceMotion) {
        document.querySelectorAll('.btn-primary').forEach(btn => {
            btn.addEventListener('mousemove', (e) => {
                const r = btn.getBoundingClientRect();
                const mx = e.clientX - r.left - r.width / 2;
                const my = e.clientY - r.top - r.height / 2;
                btn.style.transform = `translate(${mx * 0.18}px, ${my * 0.22}px)`;
            });
            btn.addEventListener('mouseleave', () => { btn.style.transform = ''; });
        });

        // gentle tilt on work cards
        document.querySelectorAll('.work-card').forEach(card => {
            card.addEventListener('mousemove', (e) => {
                const r = card.getBoundingClientRect();
                const px = (e.clientX - r.left) / r.width - 0.5;
                const py = (e.clientY - r.top) / r.height - 0.5;
                card.style.transform = `perspective(900px) rotateX(${-py * 4}deg) rotateY(${px * 5}deg) translateY(-4px)`;
            });
            card.addEventListener('mouseleave', () => { card.style.transform = ''; });
        });
    }

    // marquee nudges faster while scrolling
});
