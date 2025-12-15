/**
 * Growth Interaction Widget
 * - Inject this script into any page to show the growing plant.
 * - Tracks attendance in localStorage.
 * - Displays 1 of 10 stages based on days attended.
 */

(function () {
    // Configuration
    const ASSET_PATH = 'images/growth_round/';

    // CSS Styles
    const styles = `
        .growth-widget-container {
            position: fixed;
            bottom: 50px;
            right: 50px;
            z-index: 9999;
            cursor: pointer;
            transition: transform 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
        }

        .growth-widget-container:hover {
            transform: scale(1.1);
        }

        .growth-widget-img {
            width: 100px;
            height: 100px;
            object-fit: cover;
            border-radius: 50%;
            filter: drop-shadow(0 4px 12px rgba(0,0,0,0.15));
            transition: all 0.5s ease;
        }

        /* Tooltip Container */
        .growth-widget-tooltip {
            position: absolute;
            top: -55px; /* Adjust for larger size */
            left: 50%;
            transform: translateX(-50%) translateY(10px);
            width: 120px; /* Fixed width for better wave control */
            height: 40px;
            background: rgba(255, 255, 255, 0.95);
            border-radius: 20px;
            box-shadow: 0 4px 20px rgba(0,0,0,0.1);
            opacity: 0;
            visibility: hidden;
            transition: all 0.3s ease;
            overflow: hidden; /* For wave masking */
            display: flex;
            align-items: center;
            justify-content: center;
            border: 1px solid rgba(108, 92, 231, 0.2);
        }

        .growth-widget-container:hover .growth-widget-tooltip {
            opacity: 1;
            visibility: visible;
            transform: translateX(-50%) translateY(0);
        }

        /* Base Text (Purple) */
        .gw-text-base {
            position: absolute;
            z-index: 1;
            font-size: 14px;
            font-weight: 800;
            color: #6C5CE7;
            white-space: nowrap;
        }

        /* Wave Group Container (Moves up) */
        .gw-wave-group {
            position: absolute;
            top: 120%; /* Start below */
            left: 0;
            width: 100%;
            height: 100%;
            transition: top 1.2s cubic-bezier(0.5, 0, 1, 0.5); /* Slow start -> Fast end */
            z-index: 2;
        }

        .growth-widget-container:hover .gw-wave-group {
            top: -10%; /* Rise to cover */
        }

        /* The Rotating Wave (Squircle) */
        .gw-wave {
            position: absolute;
            left: 50%;
            top: 0;
            width: 300px;
            height: 300px;
            background: linear-gradient(135deg, #6C5CE7 0%, #0984e3 100%); /* Purple-Blue Gradient */
            border-radius: 40%; /* The Squircle Shape */
            transform-origin: center center;
            animation: rotate-wave 8s infinite linear;
            margin-left: -150px;
            margin-top: -20px; /* Adjusted: Start with top edge near the water line, not pulled way up */
            opacity: 1; /* Opaque to show gradient clearly */
            box-shadow: 0 0 10px rgba(108, 92, 231, 0.3);
        }

        .gw-wave-back {
            position: absolute;
            left: 50%;
            top: 0;
            width: 310px;
            height: 310px;
            background: rgba(162, 155, 254, 0.5); /* Semi-transparent lighter purple */
            border-radius: 43%;
            transform-origin: center center;
            animation: rotate-wave 10s infinite linear reverse;
            margin-left: -155px;
            margin-top: -25px; /* Slightly offset */
            opacity: 1;
            z-index: -1;
        }

        /* Overlay Text (White) - Sits on top of everything */
        .gw-text-overlay {
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            width: 100%;
            height: 40px;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 14px;
            font-weight: 800;
            color: white;
            white-space: nowrap;
            z-index: 3;
            /* Trick: White on White BG is invisible. White on Purple Wave is visible. */
            mix-blend-mode: normal; 
            pointer-events: none;
        }

        @keyframes rotate-wave {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
        }
        
        @keyframes bounce {
            0%, 100% { transform: translateY(0); }
            50% { transform: translateY(-5px); }
        }

        .growth-bounce {
            animation: bounce 0.5s ease;
        }

        /* Float Animation */
        @keyframes float {
            0% { transform: translateY(0px); }
            50% { transform: translateY(-10px); }
            100% { transform: translateY(0px); }
        }

        .growth-float {
            animation: float 4s ease-in-out infinite;
        }

        /* Permanent Badge */
        .growth-widget-badge {
            position: absolute;
            bottom: -15px; /* Position below the image */
            left: 50%;
            transform: translateX(-50%);
            background: #6C5CE7;
            color: white;
            padding: 4px 12px;
            border-radius: 12px;
            font-size: 13px;
            font-weight: 700;
            box-shadow: 0 4px 10px rgba(108, 92, 231, 0.3);
            white-space: nowrap;
            z-index: 2;
            transition: all 0.3s ease;
        }

        .growth-widget-container:hover .growth-widget-badge {
            transform: translateX(-50%) scale(1.1);
        }
    `;

    // Inject CSS
    const styleSheet = document.createElement("style");
    styleSheet.textContent = styles;
    document.head.appendChild(styleSheet);

    // Create Widget DOM
    const container = document.createElement('div');
    container.className = 'growth-widget-container';
    container.id = 'growthWidget';

    const tooltip = document.createElement('div');
    tooltip.className = 'growth-widget-tooltip';

    // Base Text
    const baseText = document.createElement('span');
    baseText.className = 'gw-text-base';
    tooltip.appendChild(baseText);

    // Wave Group (Container for rotating waves)
    const waveGroup = document.createElement('div');
    waveGroup.className = 'gw-wave-group';

    const waveBack = document.createElement('div');
    waveBack.className = 'gw-wave-back';
    waveGroup.appendChild(waveBack);

    const wave = document.createElement('div');
    wave.className = 'gw-wave';
    waveGroup.appendChild(wave);

    tooltip.appendChild(waveGroup);

    // Overlay Text (Separate, on top)
    const overlayText = document.createElement('span');
    overlayText.className = 'gw-text-overlay';
    tooltip.appendChild(overlayText);

    container.appendChild(tooltip);

    const img = document.createElement('img');
    img.className = 'growth-widget-img growth-float'; // Add float class
    img.alt = 'My Growing Plant';
    container.appendChild(img);

    const badge = document.createElement('div');
    badge.className = 'growth-widget-badge';
    container.appendChild(badge);

    document.body.appendChild(container);

    // Logic Variables
    let attendanceDays = 0;
    let clickCount = 0;

    // Initialize
    function init() {
        checkAttendance();
        updateUI();
        setupEvents();
    }

    function checkAttendance() {
        const today = new Date().toDateString();
        const lastVisit = localStorage.getItem('lastVisitDate');
        let days = parseInt(localStorage.getItem('attendanceDays') || '0');

        if (lastVisit !== today) {
            days++;
            localStorage.setItem('attendanceDays', days);
            localStorage.setItem('lastVisitDate', today);

            // Visual feedback for new day could go here
        }

        attendanceDays = days;
    }

    function updateUI() {
        // Calculate Stage (1-10)
        // Formula: roughly 1 stage per month (30-36 days) to reach stage 10 in a year
        let stage = Math.ceil(attendanceDays / 36);
        if (stage < 1) stage = 1;
        if (stage > 10) stage = 10;

        img.src = `${ASSET_PATH}growth_round_${stage}.png`;

        const label = `🌱 Level ${stage}`;
        // Update both text layers
        container.querySelector('.gw-text-base').textContent = label;
        container.querySelector('.gw-text-overlay').textContent = label;

        badge.textContent = `🌱 D+${attendanceDays}`; // Update Badge Text
    }

    function setupEvents() {
        container.onclick = function () {
            clickCount++;
            img.classList.add('growth-bounce');
            setTimeout(() => img.classList.remove('growth-bounce'), 500);

            if (clickCount === 5) {
                // Cheat Code: Add 10 days
                attendanceDays += 10;
                localStorage.setItem('attendanceDays', attendanceDays);
                updateUI();
                clickCount = 0;

                // Show toast or alert
                // Using simple alert for now as requested in original walkthrough
                // But let's make it subtle in the tooltip?
                tooltip.textContent = `⚡ Cheat! +10 Days`;
                setTimeout(() => updateUI(), 2000);
            }

            // Reset click count
            setTimeout(() => clickCount = 0, 2000);
        };
    }

    // Run
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

})();
