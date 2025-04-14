import { writable } from 'svelte/store';

// Debug configuration
export const DEBUG = writable(false);

// Online status
export const isOnline = writable(true);

// Create touch handlers for swipe
export const touchStartX = writable(0);
export const touchEndX = writable(0);

// Initialize online status detection with enhanced connection checking
export function initOnlineStatus() {
	if (typeof window !== 'undefined') {
		const updateOnlineStatus = () => {
			const online = navigator.onLine;
			console.log(`Connection status changed: ${online ? 'online' : 'offline'}`);
			isOnline.set(online);
		};

		// Check connection more thoroughly
		async function checkRealConnection() {
			try {
				const controller = new AbortController();
				const timeoutId = setTimeout(() => controller.abort(), 5000);

				// Use a tiny request to test real connectivity
				// This can be any small asset or even a HEAD request to your API
				const testUrl = window.location.origin + '/favicon.png';

				const response = await fetch(testUrl, {
					method: 'HEAD',
					signal: controller.signal,
					cache: 'no-store',
					headers: { 'Cache-Control': 'no-cache' }
				});

				clearTimeout(timeoutId);
				isOnline.set(true);
			} catch (error) {
				console.log('Connection test failed', error);
				if (error.name !== 'AbortError') {
					isOnline.set(false);
				}
			}
		}

		// Add event listeners
		window.addEventListener('online', updateOnlineStatus);
		window.addEventListener('offline', updateOnlineStatus);

		// Periodically check real connection when browser reports online
		const intervalId = setInterval(() => {
			if (navigator.onLine) {
				checkRealConnection();
			}
		}, 30000); // Check every 30 seconds when reported as online

		// Set initial value
		updateOnlineStatus();

		// Do an initial check after a short delay to let the app initialize
		setTimeout(() => {
			if (navigator.onLine) {
				checkRealConnection();
			}
		}, 2000);

		return () => {
			window.removeEventListener('online', updateOnlineStatus);
			window.removeEventListener('offline', updateOnlineStatus);
			clearInterval(intervalId);
		};
	}
}
