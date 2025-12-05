// main.js
// Simple script to handle scroll animations and console greetings

document.addEventListener('DOMContentLoaded', () => {
    console.log("System initialized... Welcome to Anymousxe's site.");

    // Simple scroll observer for fading elements in
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.style.opacity = '1';
                entry.target.style.transform = 'translateY(0)';
            }
        });
    });

    // Select elements that aren't already animated by CSS load
    const hiddenElements = document.querySelectorAll('.news-item');
    hiddenElements.forEach((el) => {
        el.style.opacity = '0';
        el.style.transform = 'translateY(20px)';
        el.style.transition = 'all 0.6s ease-out';
        observer.observe(el);
    });
});
