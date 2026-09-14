// Time zones configuration
const timeZones = [
    { id: 'ny', name: 'America/New_York', element: 'clock-ny' },
    { id: 'london', name: 'Europe/London', element: 'clock-london' },
    { id: 'paris', name: 'Europe/Paris', element: 'clock-paris' },
    { id: 'tokyo', name: 'Asia/Tokyo', element: 'clock-tokyo' },
    { id: 'sydney', name: 'Australia/Sydney', element: 'clock-sydney' },
    { id: 'dubai', name: 'Asia/Dubai', element: 'clock-dubai' },
    { id: 'sao-paulo', name: 'America/Sao_Paulo', element: 'clock-sao-paulo' },
    { id: 'la', name: 'America/Los_Angeles', element: 'clock-la' },
    { id: 'hong-kong', name: 'Asia/Hong_Kong', element: 'clock-hong-kong' },
    { id: 'singapore', name: 'Asia/Singapore', element: 'clock-singapore' },
    { id: 'moscow', name: 'Europe/Moscow', element: 'clock-moscow' },
    { id: 'india', name: 'Asia/Kolkata', element: 'clock-india' }
];

/**
 * Format time with leading zeros
 * @param {number} num - The number to format
 * @returns {string} - Formatted number with leading zero
 */
function pad(num) {
    return String(num).padStart(2, '0');
}

/**
 * Get formatted time for a specific timezone
 * @param {string} timezone - IANA timezone string
 * @returns {string} - Formatted time string (HH:MM:SS)
 */
function getTimeInTimezone(timezone) {
    try {
        const now = new Date();
        const timeString = now.toLocaleString('en-US', {
            timeZone: timezone,
            hour12: false,
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit'
        });
        return timeString;
    } catch (error) {
        console.error(`Error getting time for timezone ${timezone}:`, error);
        return '00:00:00';
    }
}

/**
 * Get local timezone offset
 * @returns {string} - Timezone offset string
 */
function getLocalTimezoneOffset() {
    const now = new Date();
    const offset = -now.getTimezoneOffset();
    const hours = Math.floor(Math.abs(offset) / 60);
    const minutes = Math.abs(offset) % 60;
    const sign = offset >= 0 ? '+' : '-';
    return `UTC ${sign}${pad(hours)}:${pad(minutes)}`;
}

/**
 * Update all clocks
 */
function updateClocks() {
    // Update timezone clocks
    timeZones.forEach(tz => {
        const element = document.getElementById(tz.element);
        if (element) {
            element.textContent = getTimeInTimezone(tz.name);
        }
    });

    // Update local time
    const now = new Date();
    const localTimeElement = document.getElementById('local-time');
    const localTzElement = document.getElementById('local-tz');

    if (localTimeElement) {
        localTimeElement.textContent = `${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}`;
    }

    if (localTzElement) {
        localTzElement.textContent = getLocalTimezoneOffset();
    }
}

/**
 * Initialize the clock
 */
function initClock() {
    // Update immediately on load
    updateClocks();

    // Update every second
    setInterval(updateClocks, 1000);
}

// Start the clock when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initClock);
} else {
    initClock();
}

// Also handle visibility changes to ensure updates continue
document.addEventListener('visibilitychange', () => {
    if (!document.hidden) {
        updateClocks();
    }
});
