document.addEventListener('DOMContentLoaded', () => {
    const splashScreen = document.getElementById('splash-screen');
    const headunitContainer = document.getElementById('headunit-container');

    setTimeout(() => {
        splashScreen.classList.add('fade-out');
        splashScreen.addEventListener('transitionend', () => {
            splashScreen.style.display = 'none';
            headunitContainer.style.display = 'flex';
        }, { once: true });
    }, 2000); // 2 seconds

    // All other JavaScript logic will go here

    // Clock update
    const clockElement = document.getElementById('clock');

    function updateClock() {
        const now = new Date();
        let hours = now.getHours();
        const minutes = now.getMinutes().toString().padStart(2, '0');
        const ampm = hours >= 12 ? 'PM' : 'AM';
        hours = hours % 12;
        hours = hours ? hours : 12; // the hour '0' should be '12'
        const strTime = `${hours}:${minutes} ${ampm}`;
        clockElement.textContent = strTime;
    }

    setInterval(updateClock, 1000);
    updateClock(); // Initial call to display clock immediately

    // Speedometer and Wattmeter update
    const speedValueElement = document.getElementById('speed-value');
    const wattValueElement = document.getElementById('watt-value');
    const wattmeterFillBar = document.getElementById('wattmeter-fill-bar');

    const numberOfParallelograms = 20; // This is now a conceptual number for max watts, not actual elements
    const maxParallelogramHeight = 100; // This is now conceptually the max width percentage

    // Removed dynamic creation of parallelogram elements
    // const wattParallelograms = document.querySelectorAll('.watt-parallelogram'); // This is no longer needed

    // Autonomy update
    const autonomyValueElement = document.getElementById('autonomy-value');
    const maxAutonomy = 30; // km
    let currentAutonomy = parseFloat(localStorage.getItem('autonomy')) || maxAutonomy;

    // GPS and Speed/Autonomy/Gear Logic - Moved to top
    let currentSpeed = 0; // km/h
    let lastPosition = null; // {latitude, longitude, timestamp}
    autonomyValueElement.textContent = currentAutonomy.toFixed(1); // Initial display

    // Driving Modes
    // const modeButtons = document.querySelectorAll('.mode-button'); // Removed unused variable
    let currentMode = localStorage.getItem('currentMode') || 'COMFORT'; // Default mode, loaded from local storage
    const launchControlButton = document.getElementById('launch-control-button');

    // Get only the actual mode buttons
    const actualModeButtons = document.querySelectorAll('#mode-sport, #mode-comfort, #mode-eco, #mode-race');

    // ABS Indicator elements - Moved to top
    const absIndicator = document.getElementById('abs-indicator');

    function showAbsIndicator() {
        absIndicator.classList.add('active');
    }

    function hideAbsIndicator() {
        absIndicator.classList.remove('active');
    }

    let lastSpeed = 0;

    // TRS Indicator elements - Moved to top
    const trsIndicator = document.getElementById('trs-indicator');
    const speedometerElement = document.getElementById('speedometer');
    let speedometerPressTimer;
    let isSpeedometerRed = false;

    // Gear Indicator elements and function - Moved to top
    const gearIndicatorElement = document.getElementById('gear-indicator');
    function updateGearIndicator() {
        if (currentSpeed > 0) {
            gearIndicatorElement.textContent = 'D';
            gearIndicatorElement.classList.add('drive');
        } else {
            gearIndicatorElement.textContent = 'N';
            gearIndicatorElement.classList.remove('drive');
        }
    }

    function setMode(mode) {
        currentMode = mode;
        localStorage.setItem('currentMode', currentMode); // Save current mode to local storage
        actualModeButtons.forEach(button => {
            button.classList.remove('active');
            if (button.id === `mode-${mode.toLowerCase()}`) {
                button.classList.add('active');
            }
        });

        // Remove all existing mode classes from headunitContainer
        headunitContainer.classList.remove('mode-default', 'mode-eco', 'mode-comfort', 'mode-sport', 'mode-race');
        // Add the new mode class
        headunitContainer.classList.add(`mode-${mode.toLowerCase()}`);

        updateLaunchControlButtonVisibility();

        console.log(`Mode set to: ${currentMode}`);
        // Additional logic for mode-specific behavior would go here
    }

    actualModeButtons.forEach(button => {
        button.addEventListener('click', () => {
            // Explicitly check if the clicked button is one of the valid mode buttons
            if (button.id.startsWith('mode-')) {
                const mode = button.id.replace('mode-', '').toUpperCase();
                setMode(mode);
            }
        });
    });

    setMode(currentMode); // Set initial active mode (will now load from local storage or default)
    headunitContainer.classList.add(`mode-${currentMode.toLowerCase()}`); // Ensure initial mode class is applied to headunitContainer
    updateLaunchControlButtonVisibility(); // Ensure initial visibility is correct

    // New function to control launch control button visibility
    function updateLaunchControlButtonVisibility() {
        if (currentMode === 'RACE' && currentSpeed === 0) {
            launchControlButton.classList.add('lc-button-visible');
            launchControlButton.classList.remove('lc-button-hidden');
        } else {
            launchControlButton.classList.add('lc-button-hidden');
            launchControlButton.classList.remove('lc-button-visible');

            // Also ensure speedometer is not red and TRS is off if conditions for launch control are not met
            speedometerElement.classList.remove('red');
            isSpeedometerRed = false;
            trsIndicator.classList.remove('active');
        }
    }

    speedometerElement.addEventListener('mousedown', () => {
        // Removed old speedometer long press logic as it's replaced by the button
    });

    speedometerElement.addEventListener('mouseup', () => {
        // Removed old speedometer long press logic as it's replaced by the button
    });

    // Removed Toggle Indicators Button functionality

    launchControlButton.addEventListener('click', () => {
        // Only allow activation if in RACE mode and speed is 2 km/h or less
        if (currentMode === 'RACE' && currentSpeed <= 2) {
            speedometerElement.classList.add('red');
            isSpeedometerRed = true;
            launchControlButton.classList.add('active'); // Indicate launch control is active (pulsing yellow)
            launchControlButton.classList.add('lc-active-pulse'); // Make it red and pulse
        } else if (currentMode !== 'RACE') {
            alert('Launch Control only works in RACE mode.');
        } else if (currentSpeed > 2) {
            alert('Launch Control is only for speeds up to 2 km/h.');
        }
    });

    // Charge Button
    const chargeButton = document.getElementById('charge-button');
    const initialMaxAutonomy = 30; // Define the initial maximum autonomy here

    chargeButton.addEventListener('click', () => {
        currentAutonomy = initialMaxAutonomy; // Reset autonomy
        autonomyValueElement.textContent = currentAutonomy.toFixed(1);
        localStorage.setItem('autonomy', currentAutonomy.toFixed(1));
        alert(`Autonomy reset to ${initialMaxAutonomy} km.`);
        updateLaunchControlButtonVisibility(); // Update LC button visibility in case mode/speed allows it
    });

    function checkTrsActivation() {
        if (isSpeedometerRed && currentSpeed > 0) {
            // Speedometer should remain red until movement, then TRS activates
            trsIndicator.classList.add('active');
            launchControlButton.classList.remove('active'); // Deactivate launch control button pulse (yellow)
            launchControlButton.classList.remove('lc-active-pulse'); // Remove red pulse
            speedometerElement.classList.remove('red'); // Speedometer turns white after movement
            isSpeedometerRed = false; // Reset the flag
        } else if (currentSpeed === 0) {
            // If stationary, ensure TRS is off and update Launch Control button visibility
            trsIndicator.classList.remove('active');
            launchControlButton.classList.remove('lc-active-pulse'); // Remove red pulse if stationary
            updateLaunchControlButtonVisibility();
        } else if (trsIndicator.classList.contains('active') && currentSpeed === 0) {
            // If TRS was active and now stationary, turn it off
            trsIndicator.classList.remove('active');
            launchControlButton.classList.remove('lc-active-pulse'); // Remove red pulse if stationary
        }
    }

    // Haversine distance calculation
    function haversineDistance(coords1, coords2) {
        const R = 6371e3; // metres
        const φ1 = coords1.latitude * Math.PI / 180; // φ, λ in radians
        const φ2 = coords2.latitude * Math.PI / 180;
        const Δφ = (coords2.latitude - coords1.latitude) * Math.PI / 180;
        const Δλ = (coords2.longitude - coords1.longitude) * Math.PI / 180;

        const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
                  Math.cos(φ1) * Math.cos(φ2) *
                  Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

        return R * c; // in metres
    }

    if (navigator.geolocation) {
        navigator.geolocation.watchPosition(position => {
            const { latitude, longitude } = position.coords;
            const timestamp = position.timestamp;

            if (lastPosition) {
                const distance = haversineDistance(lastPosition, { latitude, longitude }); // in meters
                const timeElapsed = (timestamp - lastPosition.timestamp) / 1000; // in seconds

                if (timeElapsed > 0) {
                    const oldSpeed = currentSpeed; // Store currentSpeed before it's updated
                    currentSpeed = (distance / timeElapsed) * 3.6; // m/s to km/h
                    speedValueElement.textContent = Math.round(currentSpeed);

                    // Deceleration check for ABS indicator
                    const deceleration = oldSpeed - currentSpeed;
                    if (deceleration > 10 && currentSpeed < oldSpeed) {
                        showAbsIndicator();
                    } else {
                        hideAbsIndicator();
                    }

                    // Autonomy decrease based on actual distance
                    const distanceKm = distance / 1000;
                    currentAutonomy -= distanceKm; // Decrease by actual km traveled
                    if (currentAutonomy < 0) currentAutonomy = 0;
                    autonomyValueElement.textContent = currentAutonomy.toFixed(1);
                    localStorage.setItem('autonomy', currentAutonomy.toFixed(1));

                    // Update gear indicator
                    updateGearIndicator();

                    // Update wattmeter
                    updateWattmeter(currentSpeed);
                }
            } else {
                // Initial update for gear and wattmeter if no movement yet
                updateGearIndicator();
                updateWattmeter(currentSpeed);
            }
            lastPosition = { latitude, longitude, timestamp };

            updateLaunchControlButtonVisibility();

        }, error => {
            console.error('Geolocation error:', error);
            alert('Could not get GPS location. Please ensure location services are enabled.');
        }, {
            enableHighAccuracy: true,
            maximumAge: 0,
            timeout: 5000
        });
    } else {
        alert('Geolocation is not supported by your browser.');
    }

    // Refactor updateSpeedAndWatts to just handle wattmeter, as speed is now from GPS
    function updateWattmeter(speed) {
        const maxSpeed = 55; // km/h for max watts
        const maxWatts = 750;
        const watts = (speed / maxSpeed) * maxWatts;
        wattValueElement.textContent = `${Math.round(watts)} W`;

        // Update wattmeter fill bar
        const fillPercentage = (watts / maxWatts) * 100;
        wattmeterFillBar.style.width = `${fillPercentage}%`;

        // Removed parallelogram-specific logic
        /*
        wattParallelograms.forEach((bar, index) => {
            if (watts === 0) {
                bar.style.height = '5px'; // Default height when no watts
                bar.classList.remove('active-watt');
            } else {
                const thresholdWatts = (index + 1) * (maxWatts / numberOfParallelograms);
                if (watts >= thresholdWatts) {
                    bar.style.height = '100%';
                    bar.classList.add('active-watt');
                } else if (watts > (index * (maxWatts / numberOfParallelograms))) {
                    const remainingWatts = watts - (index * (maxWatts / numberOfParallelograms));
                    const percentageOfBar = remainingWatts / (maxWatts / numberOfParallelograms);
                    bar.style.height = `${percentageOfBar * 100}%`;
                    bar.classList.add('active-watt');
                } else {
                    bar.style.height = '5px'; // Default height when no watts for this bar
                    bar.classList.remove('active-watt');
                }
            }
        });
        */
    }

    // Modify originalUpdateSpeedAndWattsForBraking to also handle TRS activation
    // const originalUpdateSpeedAndWattsForBraking = () => {
    //     if (lastSpeed > 30 && currentSpeed < (lastSpeed - 20)) {
    //         showAbsIndicator();
    //     }
    //     lastSpeed = currentSpeed; // Update lastSpeed based on GPS currentSpeed
    //     checkTrsActivation(); // Check TRS activation on every speed update
    // };

    // Replace existing setInterval for speed and watts with a mechanism that calls updateWattmeter and originalUpdateSpeedAndWattsForBraking
    // No longer need setInterval(updateSpeedAndWatts, 1000) as GPS watchPosition handles updates
    // We will call updateWattmeter and originalUpdateSpeedAndWattsForBraking from within the geolocation success callback

    // Autonomy update interval is removed as it's now handled by GPS
    // Gear indicator update interval is removed as it's now handled by GPS
});
