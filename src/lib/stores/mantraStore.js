import { writable } from 'svelte/store';
import { fetchMantras, incrementMantra } from '../utils/api';
import { saveToLocalCache, getFromLocalCache, getSyncQueue, saveSyncQueue } from '../utils/storage';
import { triggerHapticFeedback } from '../utils/haptics';
import { formatDate } from '../utils/dates';

// Configuration
export function getDailyTarget(mantraName) {
	return mantraName === 'third' ? 1000 : 108;
}

// Create the stores
export const mantras = writable([]);
export const isLoading = writable(true);
export const isUpdating = writable(false);
export const error = writable(null);
export const syncQueue = writable([]);
export const selectedDate = writable(new Date());
export const activeTab = writable(0);
export const rawResponse = writable(null); // For debugging
export const autoRefreshEnabled = writable(true); // Control auto-refresh

// State
let isOnline = true;
let autoRefreshInterval = null;

// Check online status
export function checkOnlineStatus() {
	const wasOffline = !isOnline;
	isOnline = navigator.onLine;

	if (wasOffline && isOnline) {
		// If we just came back online, process the sync queue
		console.log('App is back online, processing sync queue');
		processSyncQueue();
	}

	return isOnline;
}

// Start auto-refresh timer
export function startAutoRefresh() {
	// Clear any existing interval first
	if (autoRefreshInterval) {
		clearInterval(autoRefreshInterval);
	}

	autoRefreshInterval = setInterval(() => {
		let currentValue;
		autoRefreshEnabled.subscribe((value) => {
			currentValue = value;
		})();

		if (currentValue && navigator.onLine) {
			console.log('Auto-refreshing mantras data...');
			let current;
			selectedDate.subscribe((value) => {
				current = value;
			})();
			refreshDataInBackground(current);
		}
	}, 5000); // Refresh every 5 seconds

	console.log('Auto-refresh started');
}

// Stop auto-refresh timer
export function stopAutoRefresh() {
	if (autoRefreshInterval) {
		clearInterval(autoRefreshInterval);
		autoRefreshInterval = null;
		console.log('Auto-refresh stopped');
	}
}

// Process mantras data and ensure first/third exist
function processMantrasData(data) {
	if (Array.isArray(data)) {
		let processedData = data.map((item) => ({
			name: item.json ? item.json.name : item.name,
			count: item.json ? item.json.count : item.count
		}));

		// Ensure first and third mantras always exist
		const processedMantras = ensureDefaultMantras(processedData);
		mantras.set(processedMantras);

		// Set active tab based on last entry
		if (processedMantras.length > 0) {
			// Find most recent mantra with a count > 0
			const lastUsedMantra = processedMantras.reduce((last, current) => {
				return current.count > 0 && (!last || current.count > last.count) ? current : last;
			}, null);

			if (lastUsedMantra) {
				const index = processedMantras.findIndex((m) => m.name === lastUsedMantra.name);
				if (index !== -1) {
					activeTab.set(index);
				}
			}
		}

		// Return for caching
		return processedMantras;
	} else {
		throw new Error('Response is not an array as expected');
	}
}

// Function to ensure first and third mantras exist
function ensureDefaultMantras(mantrasArray) {
	const result = [...mantrasArray];

	// Check if first mantra exists
	const firstIndex = result.findIndex((m) => m.name.toLowerCase() === 'first');
	if (firstIndex === -1) {
		result.push({ name: 'first', count: 0 });
	}

	// Check if third mantra exists
	const thirdIndex = result.findIndex((m) => m.name.toLowerCase() === 'third');
	if (thirdIndex === -1) {
		result.push({ name: 'third', count: 0 });
	}

	// Sort them in a consistent order - first, then third, then any others
	return result.sort((a, b) => {
		if (a.name.toLowerCase() === 'first') return -1;
		if (b.name.toLowerCase() === 'first') return 1;
		if (a.name.toLowerCase() === 'third') return -1;
		if (b.name.toLowerCase() === 'third') return 1;
		return a.name.localeCompare(b.name);
	});
}

// Add to sync queue
function addToSyncQueue(mantraName, date) {
	const formattedDate = formatDate(date, 'yyyy-MM-dd');
	const queue = getSyncQueue();
	queue.push({ mantraName, date: formattedDate });
	saveSyncQueue(queue);
	syncQueue.set(queue); // Update store
}

// Process pending sync items with improved batch processing
export async function processSyncQueue() {
	let currentQueue;
	syncQueue.subscribe((value) => {
		currentQueue = value;
	})();

	if (!navigator.onLine || currentQueue.length === 0) return;

	console.log(`Processing sync queue with ${currentQueue.length} items...`);

	// Process in batches to avoid overwhelming the API
	const BATCH_SIZE = 5;
	const queue = [...currentQueue];

	// Clear stored queue immediately to prevent duplications
	syncQueue.set([]);
	saveSyncQueue([]);

	let currentDate;
	selectedDate.subscribe((value) => {
		currentDate = value;
	})();

	// Create a temporary queue for failed items
	const failedItems = [];

	// Process in batches
	for (let i = 0; i < queue.length; i += BATCH_SIZE) {
		const batch = queue.slice(i, i + BATCH_SIZE);

		// Process each item in the batch
		await Promise.all(
			batch.map(async (item) => {
				try {
					console.log(`Syncing ${item.mantraName} for date ${item.date}...`);
					await incrementMantra(item.mantraName, new Date(item.date));
				} catch (err) {
					console.error(`Failed to sync item: ${JSON.stringify(item)}`, err);
					// Add failed items back to the failed queue
					failedItems.push(item);
				}
			})
		);

		// Small delay between batches
		if (i + BATCH_SIZE < queue.length) {
			await new Promise((resolve) => setTimeout(resolve, 500));
		}
	}

	// If any items failed, add them back to the queue
	if (failedItems.length > 0) {
		saveSyncQueue(failedItems);
		syncQueue.set(failedItems);
	}

	// After syncing, refresh the current view
	await fetchMantrasForDate(currentDate);
}

// Fetch mantras for date with improved caching and error handling
export async function fetchMantrasForDate(date) {
	isLoading.set(true);
	error.set(null);
	selectedDate.set(date);

	// Try to get from cache first
	const cachedData = getFromLocalCache(date);
	if (cachedData) {
		mantras.set(cachedData);
		isLoading.set(false);

		// Continue with refreshing in background if online
		if (navigator.onLine) {
			refreshDataInBackground(date);
		}
		return;
	}

	// If offline and no cache, show a message
	if (!navigator.onLine) {
		error.set("You're offline and no cached data is available for this date.");
		mantras.set(ensureDefaultMantras([]));
		isLoading.set(false);
		return;
	}

	try {
		const formattedDate = formatDate(date, 'yyyy-MM-dd');
		console.log(`Fetching mantras for ${formattedDate}...`);

		const data = await fetchMantras(date);
		rawResponse.set(data); // Store for debugging
		console.log('Received data:', data);

		// Process the data and ensure default mantras exist
		const processedMantras = processMantrasData(data);

		// Cache the processed data
		saveToLocalCache(date, processedMantras);
	} catch (err) {
		console.error('Error fetching mantras:', err);

		// More user-friendly error message based on error type
		if (err.message.includes('Network connection error')) {
			error.set('Unable to connect to the server. Please check your internet connection.');
		} else {
			error.set(`Failed to load mantras: ${err.message}`);
		}

		// If error, ensure we still have first and third mantras with zero counts
		mantras.set(ensureDefaultMantras([]));
	} finally {
		isLoading.set(false);
	}
}

async function refreshDataInBackground(date) {
	try {
		const data = await fetchMantras(date);

		if (Array.isArray(data)) {
			// Process the data
			let processedData = data.map((item) => ({
				name: item.json ? item.json.name : item.name,
				count: item.json ? item.json.count : item.count
			}));

			// Ensure default mantras and update cache
			const updatedMantras = ensureDefaultMantras(processedData);
			saveToLocalCache(date, updatedMantras);

			// Check if we're still on the same date before updating UI
			let currentDate;
			selectedDate.subscribe((value) => {
				currentDate = value;
			})();

			if (formatDate(currentDate, 'yyyy-MM-dd') === formatDate(date, 'yyyy-MM-dd')) {
				mantras.set(updatedMantras);
			}
		}
	} catch (err) {
		console.error('Background refresh failed:', err);
		// Don't update UI or show errors since this is background
	}
}

export async function doIncrementMantra(name) {
	// Fix the incorrect property access - use direct subscribe pattern instead
	let isCurrentlyUpdating = false;
	isUpdating.subscribe((value) => {
		isCurrentlyUpdating = value;
	})();

	if (isCurrentlyUpdating) return;

	isUpdating.set(true);
	triggerHapticFeedback('success');

	// Save the current state for possible rollback
	let currentMantras;
	mantras.subscribe((value) => {
		currentMantras = value;
	})();
	const prevMantras = [...currentMantras];

	try {
		// Optimistic update
		mantras.update((items) =>
			items.map((mantra) =>
				mantra.name === name ? { ...mantra, count: mantra.count + 1 } : mantra
			)
		);

		let currentDate;
		selectedDate.subscribe((value) => {
			currentDate = value;
		})();

		// Save to cache immediately for offline-first experience
		mantras.subscribe((value) => {
			saveToLocalCache(currentDate, value);
		})();

		// Set the active tab to the current mantra
		mantras.subscribe((value) => {
			const activeIndex = value.findIndex((m) => m.name === name);
			if (activeIndex !== -1) {
				activeTab.set(activeIndex);
			}
		})();

		// If offline, add to sync queue for later processing
		if (!navigator.onLine) {
			console.log('Offline: Saved increment to sync queue');
			addToSyncQueue(name, currentDate);
			isUpdating.set(false);
			return;
		}

		// If online, send the request immediately - FIX: Properly await the response
		console.log(
			`Sending increment request for mantra: ${name}, date: ${formatDate(currentDate, 'yyyy-MM-dd')}`
		);

		// Use the direct API call instead of through the wrapper
		const formattedDate = formatDate(currentDate, 'yyyy-MM-dd');
		const response = await fetch('https://automation.unipack.asia/webhook/mantras', {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json'
			},
			body: JSON.stringify({
				mantraName: name,
				date: formattedDate
			})
		});

		console.log('Response status:', response.status);

		if (!response.ok) {
			const errorText = await response.text();
			console.error(`Error response: ${errorText}`);
			throw new Error(`HTTP error: ${response.status}`);
		}

		// The POST endpoint doesn't return updated counts, so we need to fetch them
		await fetchMantrasForDate(currentDate);
	} catch (err) {
		console.error('Error incrementing mantra:', err);

		// More specific error messages
		if (
			err.message.includes('Network connection error') ||
			err.message.includes('Failed to fetch')
		) {
			error.set(
				"Couldn't increment mantra due to connection issues. Your count has been saved offline."
			);
			// If we're offline despite the browser saying we're online
			addToSyncQueue(name, currentDate);
		} else {
			error.set(`Failed to increment mantra: ${err.message}`);
			triggerHapticFeedback('error');

			let currentDate;
			selectedDate.subscribe((value) => {
				currentDate = value;
			})();

			// Revert to previous state on error
			if (navigator.onLine) {
				mantras.set(prevMantras);
				saveToLocalCache(currentDate, prevMantras);

				// Refresh to get accurate data
				await fetchMantrasForDate(currentDate);
			} else {
				// If offline, still add to sync queue despite the error
				addToSyncQueue(name, currentDate);
			}
		}
	} finally {
		isUpdating.set(false);
	}
}

// Format mantra name for display (capitalize first letter)
export function formatMantraName(name) {
	return name.charAt(0).toUpperCase() + name.slice(1);
}

// Get donut chart stroke dash array
export function getStrokeDashArray(count, mantraName) {
	const percentage = Math.min((count / getDailyTarget(mantraName)) * 100, 100);
	// Circumference of circle = 2πr = 2 * π * 40 ≈ 251.327
	const circumference = 2 * Math.PI * 40;
	const dashArray = (percentage / 100) * circumference;
	return `${dashArray} ${circumference}`;
}

export function getPercentage(count, mantraName) {
	return (count / getDailyTarget(mantraName)) * 100;
}
