// === DISCORD COPY FUNCTION ===
function copyDiscord() {
    const discordTag = "anymousxe._.";
    navigator.clipboard.writeText(discordTag).then(() => {
        const tooltip = document.querySelector('.discord .tooltip');
        const originalText = tooltip.innerText;
        
        tooltip.innerText = "Copied!";
        tooltip.style.opacity = 1;
        
        setTimeout(() => {
            tooltip.innerText = originalText;
            tooltip.style.opacity = 0; // Reset
        }, 2000);
    }).catch(err => {
        console.error('Failed to copy: ', err);
    });
}

// === PAGE SWITCHING LOGIC ===
const mainInterface = document.getElementById('main-interface');
const mouselandInterface = document.getElementById('mouseland-interface');
const enterBtn = document.getElementById('enter-mouseland-btn');
const exitBtn = document.getElementById('exit-mouseland-btn');

// Enter Mouseland
enterBtn.addEventListener('click', () => {
    // 1. Fade out Main
    mainInterface.style.opacity = '0';
    
    setTimeout(() => {
        // 2. Hide Main, Show Mouseland
        mainInterface.classList.add('hidden');
        mouselandInterface.classList.remove('hidden');
        
        // 3. Change Browser Title for immersion
        document.title = "⚠ RESTRICTED: MOUSELAND GOV";
        
        // 4. Scroll to top
        window.scrollTo(0,0);
    }, 500); // Wait for transition
});

// Return to Reality
exitBtn.addEventListener('click', () => {
    // 1. Hide Mouseland, Show Main (but with opacity 0)
    mouselandInterface.classList.add('hidden');
    mainInterface.classList.remove('hidden');
    
    // 2. Restore Title
    document.title = "Anymousxe | Dev & Creator";
    
    // 3. Small delay then fade in
    setTimeout(() => {
        mainInterface.style.opacity = '1';
    }, 50);
});

// Console Easter Egg
console.log("%c STOP.", "color: red; font-size: 40px; font-weight: bold;");
console.log("If you aren't Anymousxe, what are you doing in the console? - Lux");
