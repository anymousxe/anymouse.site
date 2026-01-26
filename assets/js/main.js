document.addEventListener('DOMContentLoaded', () => {
    
    // --- 1. INTRO SEQUENCE ---
    const enterBtn = document.getElementById('enter-btn');
    const overlay = document.getElementById('intro-overlay');
    const bgMusic = document.getElementById('bg-music');
    const clickSfx = document.getElementById('sfx-click');
    const body = document.body;
    const main = document.getElementById('main-content');

    // Default volume
    if(bgMusic) bgMusic.volume = 0.3;
    if(clickSfx) clickSfx.volume = 0.5;

    // Enter Button Logic
    if(enterBtn) {
        enterBtn.addEventListener('click', () => {
            // Play audio
            if(clickSfx) clickSfx.play();
            if(bgMusic) bgMusic.play().catch(e => console.log("Audio autoplay prevented"));
            
            // Animate overlay away
            overlay.style.transform = 'translateY(-100%)';
            
            // Unlock scroll
            setTimeout(() => {
                body.classList.add('unlocked');
                if(main) main.classList.add('visible');
                overlay.style.display = 'none'; 
            }, 1000);
        });
    }

    // --- 2. CUSTOM CURSOR ---
    const cursor = document.querySelector('.cursor');
    const follower = document.querySelector('.cursor-follower');

    document.addEventListener('mousemove', (e) => {
        cursor.style.left = e.clientX + 'px';
        cursor.style.top = e.clientY + 'px';
        
        setTimeout(() => {
            follower.style.left = (e.clientX - 20) + 'px';
            follower.style.top = (e.clientY - 20) + 'px';
        }, 80);
    });

    // --- 3. 3D TILT EFFECT & HOVER SOUND ---
    const cards = document.querySelectorAll('.tilt-card');
    const hoverSfx = document.getElementById('sfx-hover');
    if(hoverSfx) hoverSfx.volume = 0.2;

    cards.forEach(card => {
        card.addEventListener('mousemove', (e) => {
            const rect = card.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            const centerX = rect.width / 2;
            const centerY = rect.height / 2;
            const rotateX = ((y - centerY) / centerY) * -10; 
            const rotateY = ((x - centerX) / centerX) * 10;
            card.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale(1.02)`;
        });

        card.addEventListener('mouseleave', () => {
            card.style.transform = 'perspective(1000px) rotateX(0) rotateY(0) scale(1)';
        });
        
        card.addEventListener('mouseenter', () => {
            if (body.classList.contains('unlocked') && hoverSfx) {
                hoverSfx.currentTime = 0;
                hoverSfx.play().catch(() => {});
            }
        });
    });

    // --- 4. HACKER TEXT SCRAMBLE EFFECT ---
    const letters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ1234567890@#$%&";
    document.querySelectorAll("h1, h2, h3").forEach(element => {
        element.addEventListener("mouseover", event => {  
            let iteration = 0;
            const originalText = event.target.dataset.value || event.target.innerText;
            if(!event.target.dataset.value) event.target.dataset.value = event.target.innerText;

            clearInterval(event.target.interval);

            event.target.interval = setInterval(() => {
                event.target.innerText = originalText
                    .split("")
                    .map((letter, index) => {
                        if(index < iteration) return originalText[index];
                        return letters[Math.floor(Math.random() * 26)];
                    })
                    .join("");
                
                if(iteration >= originalText.length) clearInterval(event.target.interval);
                iteration += 1 / 3;
            }, 30);
        });
    });

    // --- 5. PARTICLE BACKGROUND ---
    const canvas = document.getElementById('bg-canvas');
    if(canvas) {
        const ctx = canvas.getContext('2d');
        let particlesArray;
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;

        class Particle {
            constructor() {
                this.x = Math.random() * canvas.width;
                this.y = Math.random() * canvas.height;
                this.size = Math.random() * 2;
                this.speedX = (Math.random() * 1) - 0.5;
                this.speedY = (Math.random() * 1) - 0.5;
            }
            update() {
                this.x += this.speedX;
                this.y += this.speedY;
                if (this.x > canvas.width || this.x < 0) this.speedX = -this.speedX;
                if (this.y > canvas.height || this.y < 0) this.speedY = -this.speedY;
            }
            draw() {
                ctx.fillStyle = 'rgba(139, 92, 246, 0.5)';
                ctx.beginPath();
                ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
                ctx.fill();
            }
        }

        function init() {
            particlesArray = [];
            for (let i = 0; i < 100; i++) { particlesArray.push(new Particle()); }
        }
        function animate() {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            for (let i = 0; i < particlesArray.length; i++) {
                particlesArray[i].update();
                particlesArray[i].draw();
            }
            requestAnimationFrame(animate);
        }
        init();
        animate();
        window.addEventListener('resize', () => {
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;
            init();
        });
    }
});
