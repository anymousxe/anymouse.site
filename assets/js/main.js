document.addEventListener('DOMContentLoaded', () => {
    if (typeof lucide !== 'undefined') lucide.createIcons()

    // nav bg on scroll
    const nav = document.querySelector('.nav')
    let ticking = false
    window.addEventListener('scroll', () => {
        if (!ticking) {
            requestAnimationFrame(() => {
                nav.classList.toggle('scrolled', window.scrollY > 40)
                ticking = false
            })
            ticking = true
        }
    })

    // scroll reveal + stagger
    const targets = document.querySelectorAll('.section, .stagger')
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible')
                observer.unobserve(entry.target)
            }
        })
    }, { threshold: 0.08 })

    targets.forEach(el => {
        el.classList.add('reveal')
        observer.observe(el)
    })

    // subtle mouse-tracked glow on cards
    const cards = document.querySelectorAll('a.card')
    cards.forEach(card => {
        card.addEventListener('mousemove', (e) => {
            const rect = card.getBoundingClientRect()
            const x = ((e.clientX - rect.left) / rect.width) * 100
            const y = ((e.clientY - rect.top) / rect.height) * 100
            card.style.setProperty('--mx', `${x}%`)
            card.style.setProperty('--my', `${y}%`)
        })
    })
})
