<script>
	import { onMount } from 'svelte';
	import {
		format,
		isToday,
		addDays,
		isBefore,
		isAfter,
		isSameDay,
		eachDayOfInterval
	} from 'date-fns';

	// Configuration
	const DEBUG = false; // Set to true to show debug information
	function getDailyTarget(mantraName) {
		return mantraName === 'third' ? 1000 : 108;
	}

	// State variables
	let mantras = [];
	let isLoading = true;
	let isUpdating = false;
	let error = null;
	let newMantra = '';
	let rawResponse = null; // For debugging
	let isOnline = true; // Track online status
	let syncQueue = []; // Queue for storing offline increments

	// Date navigation state
	let selectedDate = new Date(); // Default to today
	const MARCH_1_2025 = new Date(2025, 2, 1); // JavaScript months are 0-indexed

	// Touch handling variables
	let touchStartX = 0;
	let touchEndX = 0;

	// API endpoint
	const API_URL = 'https://automator.congzhoumachinery.com/webhook/mantras';

	// Persistent active tab
	function getLastActiveTab() {
		try {
			const savedTab = localStorage.getItem('lastActiveTab');
			return savedTab ? parseInt(savedTab, 10) : 0;
		} catch (e) {
			console.error('Failed to get last active tab:', e);
			return 0;
		}
	}

	function setLastActiveTab(tabIndex) {
		try {
			localStorage.setItem('lastActiveTab', String(tabIndex));
		} catch (e) {
			console.error('Failed to save last active tab:', e);
		}
	}

	// Initialize activeTab from localStorage
	let activeTab = getLastActiveTab();

	// Tab switching function
	function switchTab(index) {
		activeTab = index;
		setLastActiveTab(index);
	}

	// Date navigation helper functions
	function isDateInFuture(date) {
		const today = new Date();
		today.setHours(0, 0, 0, 0);
		return isAfter(date, today);
	}

	function isDateBeforeMarch2025(date) {
		return isBefore(date, MARCH_1_2025);
	}

	// Generate a range of dates for the slider
	function getDateRange() {
		const today = new Date();
		const daysSinceMarch1 = Math.max(0, Math.floor((today - MARCH_1_2025) / (1000 * 60 * 60 * 24)));

		// Show at least 30 days into the future
		const endDate = addDays(today, 30);

		// Show all days since March 1, 2025
		const startDate = MARCH_1_2025;

		return eachDayOfInterval({ start: startDate, end: endDate });
	}

	function centerDateInSlider(date) {
		setTimeout(() => {
			const container = document.getElementById('dateSliderContainer');
			let targetId = isSameDay(date, new Date()) ? 'todayDateButton' : '';

			// If not today, find by date match
			if (!targetId) {
				const dateButtons = Array.from(container.querySelectorAll('button'));
				const targetIndex = dateButtons.findIndex((btn) => {
					const btnDate = new Date(btn.textContent.trim());
					return isSameDay(btnDate, date);
				});
				if (targetIndex >= 0) {
					targetId = `date-${targetIndex}`;
				}
			}

			const targetElement = document.getElementById(targetId);
			if (targetElement && container) {
				// Calculate center position
				const containerWidth = container.offsetWidth;
				const targetLeft = targetElement.offsetLeft;
				const targetWidth = targetElement.offsetWidth;

				// Scroll to position that centers the element
				container.scrollLeft = targetLeft - containerWidth / 2 + targetWidth / 2;
			}
		}, 100); // Small delay to ensure DOM is updated
	}

	// Sync queue manipulation
	function getSyncQueue() {
		try {
			const queue = localStorage.getItem('mantra_sync_queue');
			return queue ? JSON.parse(queue) : [];
		} catch (e) {
			console.error('Failed to get sync queue:', e);
			return [];
		}
	}

	function saveSyncQueue(queue) {
		try {
			localStorage.setItem('mantra_sync_queue', JSON.stringify(queue));
		} catch (e) {
			console.error('Failed to save sync queue:', e);
		}
	}

	function addToSyncQueue(mantraName, date) {
		const formattedDate = format(date, 'yyyy-MM-dd');
		const queue = getSyncQueue();
		queue.push({ mantraName, date: formattedDate });
		saveSyncQueue(queue);
		syncQueue = queue; // Update local state
	}

	// Process pending sync items
	async function processSyncQueue() {
		if (!isOnline || syncQueue.length === 0) return;

		console.log(`Processing sync queue with ${syncQueue.length} items...`);

		// Process each item one by one
		const queue = [...syncQueue];
		syncQueue = []; // Clear local queue
		saveSyncQueue([]); // Clear stored queue

		// Process each sync item individually
		for (const item of queue) {
			try {
				console.log(`Syncing ${item.mantraName} for date ${item.date}...`);

				await fetch(API_URL, {
					method: 'POST',
					headers: {
						'Content-Type': 'application/json'
					},
					body: JSON.stringify({
						mantraName: item.mantraName,
						date: item.date
					})
				});

				// Small delay between requests to prevent overwhelming the server
				await new Promise((resolve) => setTimeout(resolve, 300));
			} catch (err) {
				console.error(`Failed to sync item: ${JSON.stringify(item)}`, err);
				// If this item fails, add it back to the queue
				addToSyncQueue(item.mantraName, new Date(item.date));
			}
		}

		// After syncing, refresh the current view
		await fetchMantrasForDate(selectedDate);
	}

	// Check online status
	function checkOnlineStatus() {
		const wasOffline = !isOnline;
		isOnline = navigator.onLine;

		if (!isOnline) {
			console.log('App is offline, using cached data');
		} else if (wasOffline && isOnline) {
			// If we just came back online, process the sync queue
			console.log('App is back online, processing sync queue');
			processSyncQueue();
		}
	}

	// Haptic feedback function
	function triggerHapticFeedback(type = 'medium') {
		if (!('vibrate' in navigator)) return;

		switch (type) {
			case 'light':
				navigator.vibrate(10);
				break;
			case 'medium':
				navigator.vibrate(20);
				break;
			case 'heavy':
				navigator.vibrate([30, 30, 30]);
				break;
			case 'success':
				navigator.vibrate([15, 50, 30]);
				break;
			case 'error':
				navigator.vibrate([50, 20, 50, 20, 50]);
				break;
			default:
				navigator.vibrate(20);
		}
	}

	// Modify onMount to center the slider on today when component loads
	onMount(() => {
		console.log('Component mounted, fetching mantras...');
		checkOnlineStatus();
		syncQueue = getSyncQueue();

		// Add online/offline event listeners
		window.addEventListener('online', () => {
			console.log('App is back online');
			isOnline = true;
			processSyncQueue();
		});

		window.addEventListener('offline', () => {
			isOnline = false;
			console.log('App is offline');
		});

		fetchMantrasForDate(selectedDate);
		centerDateInSlider(selectedDate);

		// Register service worker for PWA
		if ('serviceWorker' in navigator) {
			navigator.serviceWorker
				.register('/service-worker.js')
				.then((reg) => console.log('Service Worker registered', reg))
				.catch((err) => console.error('Service Worker registration failed:', err));
		}
	});

	// Navigation functions
	function navigateDate(direction) {
		const newDate = addDays(selectedDate, direction);

		// Validate date bounds
		if (isDateInFuture(newDate) || isDateBeforeMarch2025(newDate)) {
			return;
		}

		selectedDate = newDate;
		fetchMantrasForDate(selectedDate);
		triggerHapticFeedback('light');
	}

	// Modified goToToday function to center the slider
	function goToToday() {
		selectedDate = new Date();
		fetchMantrasForDate(selectedDate);
		centerDateInSlider(selectedDate);
		triggerHapticFeedback('light');
	}

	// LocalStorage cache functions
	function saveToLocalCache(date, data) {
		try {
			const formattedDate = format(date, 'yyyy-MM-dd');
			localStorage.setItem(`mantra_data_${formattedDate}`, JSON.stringify(data));
			localStorage.setItem('mantra_last_sync', Date.now().toString());
		} catch (e) {
			console.error('Failed to cache data:', e);
		}
	}

	function getFromLocalCache(date) {
		try {
			const formattedDate = format(date, 'yyyy-MM-dd');
			const cached = localStorage.getItem(`mantra_data_${formattedDate}`);
			return cached ? JSON.parse(cached) : null;
		} catch (e) {
			console.error('Failed to retrieve cache:', e);
			return null;
		}
	}

	// Fetch with retry capability
	async function fetchWithRetry(url, options = {}, maxRetries = 3) {
		let retries = 0;

		while (retries < maxRetries) {
			try {
				const response = await fetch(url, options);

				if (!response.ok) {
					throw new Error(`HTTP error: ${response.status}`);
				}

				return await response.json();
			} catch (err) {
				retries++;
				console.error(`Attempt ${retries} failed:`, err);

				if (retries >= maxRetries) {
					throw err;
				}

				// Exponential backoff
				await new Promise((resolve) => setTimeout(resolve, 500 * Math.pow(2, retries)));
			}
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
			mantras = ensureDefaultMantras(processedData);

			// Set active tab based on last entry
			if (mantras.length > 0) {
				// Find most recent mantra with a count > 0
				const lastUsedMantra = mantras.reduce((last, current) => {
					return current.count > 0 && (!last || current.count > last.count) ? current : last;
				}, null);

				if (lastUsedMantra) {
					const index = mantras.findIndex((m) => m.name === lastUsedMantra.name);
					if (index !== -1) {
						switchTab(index);
					}
				}
			}

			// Cache the processed data
			saveToLocalCache(selectedDate, mantras);
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

	async function fetchMantrasForDate(date) {
		isLoading = true;
		error = null;

		// Try to get from cache first
		const cachedData = getFromLocalCache(date);
		if (cachedData) {
			mantras = cachedData;
			isLoading = false;

			// Continue with refreshing in background if online
			if (isOnline) {
				refreshDataInBackground(date);
			}
			return;
		}

		// If offline and no cache, show a message
		if (!isOnline) {
			error = "You're offline and no cached data is available for this date.";
			mantras = ensureDefaultMantras([]);
			isLoading = false;
			return;
		}

		try {
			const formattedDate = format(date, 'yyyy-MM-dd');
			console.log(`Fetching mantras for ${formattedDate}...`);

			const data = await fetchWithRetry(`${API_URL}?date=${formattedDate}`);
			rawResponse = data; // Store for debugging
			console.log('Received data:', data);

			// Process the data and ensure default mantras exist
			processMantrasData(data);
		} catch (err) {
			console.error('Error fetching mantras:', err);
			error = `Failed to load mantras: ${err.message}`;

			// If error, ensure we still have first and third mantras with zero counts
			mantras = ensureDefaultMantras([]);
		} finally {
			isLoading = false;
		}
	}

	async function refreshDataInBackground(date) {
		try {
			const formattedDate = format(date, 'yyyy-MM-dd');
			const data = await fetchWithRetry(`${API_URL}?date=${formattedDate}`);

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
				if (format(selectedDate, 'yyyy-MM-dd') === formattedDate) {
					mantras = updatedMantras;
				}
			}
		} catch (err) {
			console.error('Background refresh failed:', err);
			// Don't update UI or show errors since this is background
		}
	}

	async function incrementMantra(name) {
		if (isUpdating) return;

		isUpdating = true;
		triggerHapticFeedback('success');

		// Save the current state for possible rollback
		const prevMantras = [...mantras];

		try {
			// Optimistic update
			mantras = mantras.map((mantra) =>
				mantra.name === name ? { ...mantra, count: mantra.count + 1 } : mantra
			);

			// Save to cache immediately for offline-first experience
			saveToLocalCache(selectedDate, mantras);

			// Set the active tab to the current mantra
			const activeIndex = mantras.findIndex((m) => m.name === name);
			if (activeIndex !== -1) {
				switchTab(activeIndex);
			}

			// If offline, add to sync queue for later processing
			if (!isOnline) {
				console.log('Offline: Saved increment to sync queue');
				addToSyncQueue(name, selectedDate);
				isUpdating = false;
				return;
			}

			// If online, send the request immediately
			const response = await fetch(API_URL, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify({
					mantraName: name,
					date: format(selectedDate, 'yyyy-MM-dd')
				})
			});

			if (!response.ok) {
				throw new Error(`HTTP error: ${response.status}`);
			}

			// The POST endpoint doesn't return updated counts, so we need to fetch them
			await fetchMantrasForDate(selectedDate);
		} catch (err) {
			console.error('Error incrementing mantra:', err);
			error = `Failed to increment mantra: ${err.message}`;
			triggerHapticFeedback('error');

			// Revert to previous state on error
			if (isOnline) {
				mantras = prevMantras;
				saveToLocalCache(selectedDate, mantras);

				// Refresh to get accurate data
				await fetchMantrasForDate(selectedDate);
			} else {
				// If offline, still add to sync queue despite the error
				addToSyncQueue(name, selectedDate);
			}
		} finally {
			isUpdating = false;
		}
	}

	async function addMantra() {
		if (!newMantra.trim()) return;
		if (!isOnline) {
			error = 'Cannot add new mantras while offline';
			triggerHapticFeedback('error');
			return;
		}

		isUpdating = true;
		triggerHapticFeedback('medium');

		try {
			const response = await fetch(API_URL, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify({
					mantraName: newMantra,
					date: format(selectedDate, 'yyyy-MM-dd')
				})
			});

			if (!response.ok) {
				throw new Error(`HTTP error: ${response.status}`);
			}

			// Clear the input
			newMantra = '';

			// The POST endpoint doesn't return updated counts, so we need to fetch them
			await fetchMantrasForDate(selectedDate);
			triggerHapticFeedback('success');
		} catch (err) {
			console.error('Error adding mantra:', err);
			error = `Failed to add mantra: ${err.message}`;
			triggerHapticFeedback('error');
		} finally {
			isUpdating = false;
		}
	}

	function getPercentage(count, mantraName) {
		return (count / getDailyTarget(mantraName)) * 100;
	}

	// Get donut chart stroke dash array
	function getStrokeDashArray(count, mantraName) {
		const percentage = Math.min((count / getDailyTarget(mantraName)) * 100, 100);
		// Circumference of circle = 2πr = 2 * π * 40 ≈ 251.327
		const circumference = 2 * Math.PI * 40;
		const dashArray = (percentage / 100) * circumference;
		return `${dashArray} ${circumference}`;
	}

	// Format mantra name for display (capitalize first letter)
	function formatMantraName(name) {
		return name.charAt(0).toUpperCase() + name.slice(1);
	}

	// Handle swipe gestures
	function handleTouchStart(e) {
		touchStartX = e.touches[0].clientX;
	}

	function handleTouchEnd(e) {
		touchEndX = e.changedTouches[0].clientX;
		handleSwipe();
	}

	function handleSwipe() {
		const swipeThreshold = 50; // Minimum distance for a swipe
		const swipeDistance = touchEndX - touchStartX;

		if (Math.abs(swipeDistance) < swipeThreshold) {
			return; // Not a swipe, just a tap
		}

		if (mantras.length <= 1) {
			return; // No need for navigation with 0 or 1 mantra
		}

		if (swipeDistance > 0) {
			// Swipe right - go to previous tab
			switchTab(activeTab === 0 ? mantras.length - 1 : activeTab - 1);
			triggerHapticFeedback('light');
		} else {
			// Swipe left - go to next tab
			switchTab(activeTab === mantras.length - 1 ? 0 : activeTab + 1);
			triggerHapticFeedback('light');
		}
	}
</script>

<main
	class="flex h-[100vh] min-h-screen flex-col overflow-hidden bg-gradient-to-b from-green-50 to-teal-50 font-['IBM_Plex_Serif']"
	on:touchstart={handleTouchStart}
	on:touchend={handleTouchEnd}
	role="application"
	aria-label="Mantra Tracker"
>
	<!-- Header -->
	<header class="bg-white py-4 shadow-sm">
		<div class="container mx-auto max-w-md px-4">
			<div class="flex flex-col">
				<h1 class="text-2xl font-medium text-teal-700">Mantra Tracker</h1>
				<p class="text-sm text-teal-600">
					{format(new Date(), 'EEEE, MMMM d, yyyy')} · {format(new Date(), 'h:mm a')}
				</p>
			</div>
		</div>
	</header>

	<!-- Date Navigation UI with slider -->
	<div class="border-b border-teal-100 bg-white py-2 shadow-sm">
		<div class="container mx-auto max-w-md px-4">
			<!-- Date slider controls -->
			<div class="mb-2 flex items-center justify-between">
				<button
					class="rounded-full p-2 text-teal-600 hover:bg-teal-50 disabled:cursor-not-allowed disabled:opacity-40"
					on:click={() => navigateDate(-1)}
					disabled={isDateBeforeMarch2025(addDays(selectedDate, -1))}
					aria-label="Previous day"
				>
					<svg
						xmlns="http://www.w3.org/2000/svg"
						class="h-5 w-5"
						viewBox="0 0 20 20"
						fill="currentColor"
					>
						<path
							fill-rule="evenodd"
							d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z"
							clip-rule="evenodd"
						/>
					</svg>
				</button>

				{#if !isToday(selectedDate)}
					<button
						class="rounded-full bg-teal-500 px-2 py-1 text-xs text-white hover:bg-teal-600"
						on:click={goToToday}
					>
						Today
					</button>
				{:else}
					<div class="rounded-full bg-teal-100 px-2 py-1 text-xs text-teal-700">Today</div>
				{/if}

				<button
					class="rounded-full p-2 text-teal-600 hover:bg-teal-50 disabled:cursor-not-allowed disabled:opacity-40"
					on:click={() => navigateDate(1)}
					disabled={isDateInFuture(addDays(selectedDate, 1))}
					aria-label="Next day"
				>
					<svg
						xmlns="http://www.w3.org/2000/svg"
						class="h-5 w-5"
						viewBox="0 0 20 20"
						fill="currentColor"
					>
						<path
							fill-rule="evenodd"
							d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z"
							clip-rule="evenodd"
						/>
					</svg>
				</button>
			</div>

			<!-- Date slider (horizontal scroll) -->
			<div class="relative">
				<div id="dateSliderContainer" class="hide-scrollbar overflow-x-auto pb-2">
					<div class="flex min-w-min space-x-2">
						{#each getDateRange() as date, i}
							<button
								id={isSameDay(date, new Date()) ? 'todayDateButton' : `date-${i}`}
								class="flex-shrink-0 rounded-md px-3 py-1 text-sm transition-colors
                {isSameDay(date, selectedDate)
									? 'bg-teal-500 text-white'
									: isDateInFuture(date)
										? 'cursor-not-allowed bg-gray-100 text-gray-400'
										: 'bg-teal-50 text-teal-700 hover:bg-teal-100'}"
								on:click={() => {
									if (!isDateInFuture(date)) {
										selectedDate = date;
										fetchMantrasForDate(date);
										triggerHapticFeedback('light');
									}
								}}
								disabled={isDateInFuture(date)}
							>
								{format(date, 'MMM d')}
							</button>
						{/each}
					</div>
				</div>
			</div>

			<div class="container mx-auto max-w-md flex-grow overflow-y-auto px-4 py-4">
				<!-- Sync queue indicator -->
				{#if syncQueue.length > 0}
					<div class="mb-6 rounded-r-md border-l-4 border-blue-500 bg-blue-50 p-4 shadow-sm">
						<p class="font-medium text-blue-700">Offline Changes Pending</p>
						<p class="mt-1 text-blue-600">
							{syncQueue.length} change{syncQueue.length !== 1 ? 's' : ''} will sync when you're back
							online.
						</p>
						{#if isOnline}
							<button
								on:click={processSyncQueue}
								class="mt-2 rounded bg-blue-500 px-3 py-1 text-sm text-white hover:bg-blue-600"
							>
								Sync Now
							</button>
						{/if}
					</div>
				{/if}

				<!-- Offline indicator -->
				{#if !isOnline}
					<div class="mb-6 rounded-r-md border-l-4 border-amber-500 bg-amber-50 p-4 shadow-sm">
						<p class="font-medium text-amber-700">Offline Mode</p>
						<p class="mt-1 text-amber-600">
							You're currently offline. Your counts will sync when you reconnect.
						</p>
					</div>
				{/if}

				<!-- Error message -->
				{#if error}
					<div class="mb-6 rounded-r-md border-l-4 border-rose-500 bg-rose-50 p-4 shadow-sm">
						<p class="font-medium text-rose-700">Error</p>
						<p class="mt-1 text-rose-600">{error}</p>
					</div>
				{/if}

				<!-- Debug info (only shown if DEBUG is true) -->
				{#if DEBUG}
					<div class="mb-6">
						<details class="overflow-hidden rounded-md border border-teal-100 bg-white shadow-sm">
							<summary
								class="cursor-pointer p-3 text-sm text-teal-700 transition-colors hover:bg-teal-50"
							>
								Debug Information
							</summary>
							<div class="space-y-1 border-t border-teal-100 p-3 text-xs text-slate-700">
								<p>API URL: {API_URL}</p>
								<p>Mantras count: {mantras.length}</p>
								<p>Selected date: {format(selectedDate, 'yyyy-MM-dd')}</p>
								<p>Online status: {isOnline ? 'Online' : 'Offline'}</p>
								<p>Active tab: {activeTab}</p>
								<p>Sync queue: {syncQueue.length} items</p>
								<button
									on:click={() => fetchMantrasForDate(selectedDate)}
									class="mt-2 flex w-full items-center justify-center gap-2 rounded-md bg-teal-500 px-4 py-2 text-white shadow-sm transition-all duration-300 hover:bg-teal-600 focus:outline-none disabled:opacity-50"
									disabled={isLoading}
								>
									{#if isLoading}
										<svg
											class="h-4 w-4 animate-spin text-white"
											xmlns="http://www.w3.org/2000/svg"
											fill="none"
											viewBox="0 0 24 24"
										>
											<circle
												class="opacity-25"
												cx="12"
												cy="12"
												r="10"
												stroke="currentColor"
												stroke-width="4"
											></circle>
											<path
												class="opacity-75"
												fill="currentColor"
												d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
											></path>
										</svg>
										<span>Refreshing...</span>
									{:else}
										<svg
											xmlns="http://www.w3.org/2000/svg"
											class="h-4 w-4"
											fill="none"
											viewBox="0 0 24 24"
											stroke="currentColor"
										>
											<path
												stroke-linecap="round"
												stroke-linejoin="round"
												stroke-width="2"
												d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
											/>
										</svg>
										<span>Refresh</span>
									{/if}
								</button>
								{#if rawResponse}
									<details class="mt-2">
										<summary class="cursor-pointer py-1 text-teal-600">Raw response</summary>
										<pre
											class="mt-2 overflow-auto rounded-md border border-teal-100 bg-slate-50 p-2 text-slate-700">
{JSON.stringify(rawResponse, null, 2)}
												</pre>
									</details>
								{/if}
							</div>
						</details>
					</div>
				{/if}

				<!-- Add new mantra form (only shown if DEBUG is true) -->
				{#if DEBUG}
					<div class="mb-6 rounded-md border border-teal-100 bg-white p-6 shadow-sm">
						<h3 class="mb-4 text-lg font-medium text-teal-700">Add New Mantra</h3>
						<div class="flex flex-col gap-3 sm:flex-row">
							<div class="flex-grow">
								<input
									type="text"
									bind:value={newMantra}
									placeholder="Enter a new mantra..."
									class="w-full rounded-md border border-teal-200 px-4 py-2 focus:border-transparent focus:ring-2 focus:ring-teal-400 focus:outline-none"
									on:keypress={(e) => e.key === 'Enter' && addMantra()}
								/>
							</div>
							<button
								on:click={addMantra}
								class="flex items-center justify-center gap-2 rounded-md bg-teal-500 px-4 py-2 text-white shadow-sm transition-all duration-300 hover:bg-teal-600 focus:outline-none disabled:cursor-not-allowed disabled:opacity-50"
								disabled={isLoading || isUpdating || !newMantra.trim() || !isOnline}
							>
								{#if isUpdating}
									<svg
										class="h-5 w-5 animate-spin text-white"
										xmlns="http://www.w3.org/2000/svg"
										fill="none"
										viewBox="0 0 24 24"
									>
										<circle
											class="opacity-25"
											cx="12"
											cy="12"
											r="10"
											stroke="currentColor"
											stroke-width="4"
										></circle>
										<path
											class="opacity-75"
											fill="currentColor"
											d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
										></path>
									</svg>
									<span>Adding...</span>
								{:else}
									<svg
										xmlns="http://www.w3.org/2000/svg"
										class="h-5 w-5"
										fill="none"
										viewBox="0 0 24 24"
										stroke="currentColor"
									>
										<path
											stroke-linecap="round"
											stroke-linejoin="round"
											stroke-width="2"
											d="M12 4v16m8-8H4"
										/>
									</svg>
									<span>Add Mantra</span>
								{/if}
							</button>
						</div>
					</div>
				{/if}
				<!-- Loading state -->
				{#if isLoading && mantras.length === 0}
					<div class="mb-6 rounded-lg bg-white p-8 shadow-md">
						<div class="flex justify-center">
							<div class="h-16 w-16 animate-spin rounded-full border-b-2 border-teal-500"></div>
						</div>
						<p class="mt-4 text-center text-teal-700">Loading your mantras...</p>
					</div>
				{:else if mantras.length === 0}
					<div class="mb-6 rounded-lg bg-white p-8 text-center shadow-md">
						<svg
							xmlns="http://www.w3.org/2000/svg"
							class="mx-auto h-16 w-16 text-teal-300"
							fill="none"
							viewBox="0 0 24 24"
							stroke="currentColor"
						>
							<path
								stroke-linecap="round"
								stroke-linejoin="round"
								stroke-width="1"
								d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
							/>
						</svg>
						<p class="mt-4 text-lg font-light text-teal-700">No mantras found for this date.</p>
					</div>
				{:else}
					<!-- Tabs navigation -->
					<div class="mb-0 overflow-hidden rounded-t-lg bg-white shadow-md">
						<div class="flex border-b border-teal-100">
							{#each mantras as mantra, index}
								<button
									class="flex-1 px-4 py-3 text-center transition-colors {activeTab === index
										? 'border-b-2 border-teal-500 bg-teal-50 font-medium text-teal-700'
										: 'text-teal-600 hover:bg-teal-50'}"
									on:click={() => {
										switchTab(index);
										triggerHapticFeedback('light');
									}}
									aria-selected={activeTab === index}
									role="tab"
								>
									{formatMantraName(mantra.name)}
								</button>
							{/each}
						</div>
					</div>

					<!-- Tab content with donut chart -->
					<div class="mb-6 rounded-b-lg bg-white p-6 shadow-md">
						{#if mantras[activeTab]}
							<!-- Swipe indicator -->
							<div class="mb-3 text-center text-xs text-teal-500 select-none">
								<span>← Swipe to navigate →</span>
							</div>

							<div class="mb-4 text-center">
								<h3 class="text-2xl font-medium text-teal-700">
									{formatMantraName(mantras[activeTab].name)} Mantra
								</h3>
							</div>

							<!-- Donut chart -->
							<div class="relative my-8 flex justify-center">
								<svg
									width="200"
									height="200"
									viewBox="0 0 100 100"
									class="-rotate-90 transform"
									aria-hidden="true"
								>
									<!-- Background circle -->
									<circle cx="50" cy="50" r="40" fill="none" stroke="#e2e8f0" stroke-width="10" />

									<!-- Progress circle -->
									<circle
										cx="50"
										cy="50"
										r="40"
										fill="none"
										stroke="url(#gradient)"
										stroke-width="10"
										stroke-linecap="round"
										stroke-dasharray={getStrokeDashArray(
											mantras[activeTab].count,
											mantras[activeTab].name
										)}
										stroke-dashoffset="0"
									/>

									<!-- Define gradient -->
									<defs>
										<linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="100%">
											<stop offset="0%" stop-color="#38b2ac" />
											<stop offset="100%" stop-color="#4fd1c5" />
										</linearGradient>
									</defs>
								</svg>

								<!-- Button in center of donut -->
								<button
									class="tap-button absolute top-1/2 left-1/2 flex h-24 w-24 -translate-x-1/2 -translate-y-1/2 transform items-center justify-center rounded-full bg-gradient-to-r from-teal-100 to-green-100 text-teal-700 shadow-lg transition-shadow focus:ring-2 focus:ring-teal-500 focus:ring-offset-2 focus:outline-none active:shadow-inner"
									on:click={() => incrementMantra(mantras[activeTab].name)}
									disabled={isUpdating}
									aria-label={`Increment ${mantras[activeTab].name} mantra count`}
								>
									<div class="text-center">
										{#if isUpdating}
											<svg
												class="mx-auto h-8 w-8 animate-spin text-teal-700"
												xmlns="http://www.w3.org/2000/svg"
												fill="none"
												viewBox="0 0 24 24"
											>
												<circle
													class="opacity-25"
													cx="12"
													cy="12"
													r="10"
													stroke="currentColor"
													stroke-width="4"
												></circle>
												<path
													class="opacity-75"
													fill="currentColor"
													d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
												></path>
											</svg>
										{:else}
											<svg
												xmlns="http://www.w3.org/2000/svg"
												class="mx-auto h-8 w-8 text-teal-700"
												fill="none"
												viewBox="0 0 24 24"
												stroke="currentColor"
											>
												<path
													stroke-linecap="round"
													stroke-linejoin="round"
													stroke-width="2"
													d="M12 6v6m0 0v6m0-6h6m-6 0H6"
												/>
											</svg>
											<span class="mt-1 block text-sm font-medium">Tap</span>
										{/if}
									</div>
								</button>
							</div>

							<!-- Count display -->
							<div class="text-center">
								<span class="text-4xl font-medium text-teal-700">{mantras[activeTab].count}</span>
								<span class="text-md mt-1 block text-teal-600">
									{mantras[activeTab].count} / {getDailyTarget(mantras[activeTab].name)} ({getPercentage(
										mantras[activeTab].count,
										mantras[activeTab].name
									).toFixed(0)}% of daily goal)
								</span>
							</div>
						{/if}
					</div>
				{/if}
			</div>

			<!-- Footer -->
			<footer class="border-t border-teal-100 bg-white py-4 text-center text-sm text-teal-700">
				<div class="container mx-auto max-w-md px-4">
					<p>🙏 Sat Saheb 🙏</p>
				</div>
			</footer>
		</div>
	</div>
</main>

<style>
	/* Prevent overscroll bounce effect on mobile */
	:global(body) {
		overscroll-behavior: none;
		position: fixed;
		width: 100%;
		height: 100%;
		overflow: hidden;
	}

	/* Horizontal scrolling for date slider */
	.hide-scrollbar {
		-ms-overflow-style: none; /* IE and Edge */
		scrollbar-width: none; /* Firefox */
	}

	.hide-scrollbar::-webkit-scrollbar {
		display: none; /* Chrome, Safari and Opera */
	}

	/* Apply smooth transitions */
	.fade-transition {
		transition: opacity 0.3s ease-in-out;
	}

	/* When in loading state */
	.loading-overlay {
		position: absolute;
		top: 0;
		left: 0;
		right: 0;
		bottom: 0;
		background-color: rgba(255, 255, 255, 0.7);
		display: flex;
		justify-content: center;
		align-items: center;
		z-index: 100;
	}

	/* Circle progress animation */
	@keyframes circleProgress {
		0% {
			stroke-dasharray: 0 251.327;
		}
	}

	svg circle:nth-child(2) {
		animation: circleProgress 1s ease-out forwards;
	}

	/* Pulse effect for tap button */
	@keyframes pulse {
		0% {
			box-shadow: 0 0 0 0 rgba(56, 178, 172, 0.3);
		}
		70% {
			box-shadow: 0 0 0 10px rgba(56, 178, 172, 0);
		}
		100% {
			box-shadow: 0 0 0 0 rgba(56, 178, 172, 0);
		}
	}

	.tap-button:not(:disabled) {
		animation: pulse 2s infinite;
	}
</style>
