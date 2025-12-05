document.addEventListener('DOMContentLoaded', () => {
    console.log("Mouseland Government System: ONLINE");

    // 1. DYNAMIC POPULATION COUNTER
    // Updates the number of mice online every few seconds to make it look active
    const counterElement = document.getElementById('count');
    let currentCount = 8432;

    setInterval(() => {
        // Randomly add or subtract mice
        const change = Math.floor(Math.random() * 10) - 3;
        currentCount += change;
        counterElement.innerText = currentCount.toLocaleString();
    }, 2000);

    // 2. CITIZEN VERIFICATION BUTTON
    // Little interaction for the user
    const btn = document.getElementById('citizen-btn');
    btn.addEventListener('click', () => {
        const originalText = btn.innerText;
        btn.innerText = "Scanning...";
        btn.style.background = "#fff";
        
        setTimeout(() => {
            btn.innerText = "ACCESS GRANTED";
            btn.style.background = "#4caf50"; // Green
            btn.style.color = "#fff";
            alert("Welcome back, MIC Anymousxe. System recognizes your admin privileges.");
        }, 1500);
    });

    // 3. SCROLL REVEAL ANIMATION
    // Adds a class to elements when they scroll into view
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.style.opacity = 1;
                entry.target.style.transform = 'translateY(0)';
            }
        });
    }, { threshold: 0.1 });

    // Target all cards for animation
    const cards = document.querySelectorAll('.card, .news-item');
    cards.forEach(card => {
        // Set initial state via JS so it degrades gracefully if JS fails
        card.style.opacity = 0;
        card.style.transform = 'translateY(20px)';
        card.style.transition = 'all 0.6s ease-out';
        observer.observe(card);
    });
});
