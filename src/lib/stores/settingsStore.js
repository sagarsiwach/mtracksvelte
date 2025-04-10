import { writable } from 'svelte/store';

// Debug configuration
export const DEBUG = writable(false);

// Online status
export const isOnline = writable(true);

// Create touch handlers for swipe
export const touchStartX = writable(0);
export const touchEndX = writable(0);

// Initialize online status detection
function initOnlineStatus() {
	if (typeof window !== 'undefined') {
		const updateOnlineStatus = () => {
			isOnline.set(navigator.onLine);
		};

		window.addEventListener('online', updateOnlineStatus);
		window.addEventListener('offline', updateOnlineStatus);

		// Set initial value
		updateOnlineStatus();

		return () => {
			window.removeEventListener('online', updateOnlineStatus);
			window.removeEventListener('offline', updateOnlineStatus);
		};
	}
}

export { initOnlineStatus };
