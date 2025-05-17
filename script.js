document.addEventListener('DOMContentLoaded', () => {
    const pageViewsCountElement = document.getElementById('pageViewsCount');
    const mainTitleElement = document.getElementById('mainTitle');

    // Page View Counter Logic
    if (pageViewsCountElement) {
        let views = localStorage.getItem('cmspScriptsPageViews');
        if (views === null) {
            views = 0;
        } else {
            views = parseInt(views, 10);
            if (isNaN(views)) { 
                views = 0;
            }
        }
        
        views += 1;
        localStorage.setItem('cmspScriptsPageViews', views.toString());
        pageViewsCountElement.textContent = views;
    }

    // Main Title Typing Animation
    if (mainTitleElement) {
        const mainTitleText = "Central Scripts";
        let charIndex = 0;
        mainTitleElement.textContent = ''; // Clear existing text before typing

        function typeMainTitle() {
            if (charIndex < mainTitleText.length) {
                mainTitleElement.textContent += mainTitleText.charAt(charIndex);
                charIndex++;
                setTimeout(typeMainTitle, 120); // Adjust typing speed (ms)
            } else {
                mainTitleElement.classList.add('typed-cursor'); // Add blinking cursor class after typing
            }
        }
        typeMainTitle();
    }

    // Scroll Animations
    const animatedElements = document.querySelectorAll('.animatable');
    if ("IntersectionObserver" in window) {
        const observer = new IntersectionObserver((entries, observerInstance) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('animated');
                    observerInstance.unobserve(entry.target); // Animate only once
                }
            });
        }, { threshold: 0.1 }); // Trigger when 10% of the element is visible

        animatedElements.forEach(el => observer.observe(el));
    } else {
        // Fallback for older browsers: just show elements immediately
        animatedElements.forEach(el => el.classList.add('animated'));
    }

    // Sound Effects
    let audioContext;
    let clickSoundBuffer;

    async function initAudio() {
        try {
            audioContext = new (window.AudioContext || window.webkitAudioContext)();
            const response = await fetch('/click.mp3');
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const arrayBuffer = await response.arrayBuffer();
            clickSoundBuffer = await audioContext.decodeAudioData(arrayBuffer);
        } catch (error) {
            console.error('Failed to load or decode click sound:', error);
            // Disable sound if there's an error
            clickSoundBuffer = null; 
        }
    }

    function playClickSound() {
        if (!clickSoundBuffer || !audioContext) return;
        // Resume AudioContext if it's suspended (e.g., due to browser policy)
        if (audioContext.state === 'suspended') {
            audioContext.resume();
        }
        const source = audioContext.createBufferSource();
        source.buffer = clickSoundBuffer;
        source.connect(audioContext.destination);
        source.start(0);
    }

    // Initialize audio. Call this once.
    initAudio();

    const interactiveSoundElements = document.querySelectorAll('.interactive-sound');
    interactiveSoundElements.forEach(el => {
        el.addEventListener('click', (event) => {
            // Small delay to ensure sound plays before navigation if it's a link
             if (audioContext && audioContext.state !== 'suspended') {
                playClickSound();
             } else if (audioContext && audioContext.state === 'suspended') {
                 // Try to resume and play, if it fails, it's okay.
                 audioContext.resume().then(() => playClickSound()).catch(e => console.warn("Could not resume audio context for click sound.", e));
             } else if (!audioContext) {
                 // If audio context failed to init, try initing again (less likely path)
                 initAudio().then(() => playClickSound());
             }

            // For links, allow default navigation. If it was a button, might preventDefault.
            // For links, a slight delay might be needed if sound is critical, but usually not.
        });
    });
});