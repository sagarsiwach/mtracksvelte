<script>
	import { onMount } from 'svelte';
	import Header from '$lib/components/Header.svelte';
	import DateNavigation from '$lib/components/DateNavigation.svelte';
	import StatusIndicators from '$lib/components/StatusIndicators.svelte';
	import TabNavigation from '$lib/components/TabNavigation.svelte';
	import MantraCounter from '$lib/components/MantraCounter.svelte';
	import LoadingIndicator from '$lib/components/LoadingIndicator.svelte';
	import Footer from '$lib/components/Footer.svelte';

	import {
		fetchMantrasForDate,
		mantras,
		syncQueue,
		selectedDate,
		activeTab,
		checkOnlineStatus,
		processSyncQueue
	} from '$lib/stores/mantraStore';

	import { touchStartX, touchEndX, isOnline, initOnlineStatus } from '$lib/stores/settingsStore';

	import { getSyncQueue } from '$lib/utils/storage';
	import { centerDateInSlider } from '$lib/utils/dates';
	import { getLastActiveTab } from '$lib/utils/storage';

	// Initialize the active tab from localStorage
	activeTab.set(getLastActiveTab());

	// Handle swipe gestures
	function handleTouchStart(e) {
		touchStartX.set(e.touches[0].clientX);
	}

	function handleTouchEnd(e) {
		touchEndX.set(e.changedTouches[0].clientX);
		handleSwipe();
	}

	function handleSwipe() {
		let start;
		let end;

		touchStartX.subscribe((value) => {
			start = value;
		})();
		touchEndX.subscribe((value) => {
			end = value;
		})();

		const swipeThreshold = 50; // Minimum distance for a swipe
		const swipeDistance = end - start;

		if (Math.abs(swipeDistance) < swipeThreshold) {
			return; // Not a swipe, just a tap
		}

		let currentMantras;
		mantras.subscribe((value) => {
			currentMantras = value;
		})();

		if (currentMantras.length <= 1) {
			return; // No need for navigation with 0 or 1 mantra
		}

		let currentTab;
		activeTab.subscribe((value) => {
			currentTab = value;
		})();

		if (swipeDistance > 0) {
			// Swipe right - go to previous tab
			activeTab.set(currentTab === 0 ? currentMantras.length - 1 : currentTab - 1);
		} else {
			// Swipe left - go to next tab
			activeTab.set(currentTab === currentMantras.length - 1 ? 0 : currentTab + 1);
		}
	}

	onMount(() => {
		console.log('Component mounted, fetching mantras...');
		checkOnlineStatus();
		syncQueue.set(getSyncQueue());

		// Initialize online status listener
		const cleanup = initOnlineStatus();

		// Set up online/offline event handlers
		isOnline.subscribe((online) => {
			if (online) {
				console.log('App is back online');
				processSyncQueue();
			} else {
				console.log('App is offline');
			}
		});

		let current;
		selectedDate.subscribe((value) => {
			current = value;
		})();
		fetchMantrasForDate(current);
		centerDateInSlider(current);

		// Register service worker for PWA
		if ('serviceWorker' in navigator) {
			navigator.serviceWorker
				.register('/service-worker.js')
				.then((reg) => console.log('Service Worker registered', reg))
				.catch((err) => console.error('Service Worker registration failed:', err));
		}

		return cleanup;
	});
</script>

<main
	class="flex h-[100vh] min-h-screen flex-col overflow-hidden bg-yellow-950 font-['Departure_Mono']"
	on:touchstart={handleTouchStart}
	on:touchend={handleTouchEnd}
	role="application"
	aria-label="Mantra Tracker"
>
	<!-- Header with date and time -->
	<Header />

	<!-- Date Navigation UI with slider -->
	<DateNavigation />

	<!-- Main content area -->
	<div class="container mx-auto max-w-md flex-grow overflow-y-auto px-4 py-4 pb-20">
		<!-- Status indicators (offline/sync status) -->
		<StatusIndicators />

		<!-- Loading state or empty state -->
		<LoadingIndicator />

		{#if $mantras.length > 0}
			<!-- Tab navigation -->
			<TabNavigation />

			<!-- Mantra counter with donut chart -->
			<MantraCounter />
		{/if}
	</div>

	<!-- Navigation footer -->
	<Footer />
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
</style>
