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
})
