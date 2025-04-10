<script>
	import {
		mantras,
		activeTab,
		isUpdating,
		doIncrementMantra,
		formatMantraName,
		getStrokeDashArray,
		getPercentage,
		getDailyTarget
	} from '../stores/mantraStore';
	import { fly, scale } from 'svelte/transition';
	import { elasticOut } from 'svelte/easing';

	let counters = [];
	let showAnimation = false;

	// Set up counter animation
	function animateCount() {
		showAnimation = true;
		setTimeout(() => {
			showAnimation = false;
		}, 500);
	}

	// Handle increment with animation
	function handleIncrement() {
		if ($mantras[$activeTab]) {
			doIncrementMantra($mantras[$activeTab].name);
			animateCount();
		}
	}
</script>

<div class="mb-6 rounded-b-lg border border-t-0 border-stone-900 bg-stone-600 p-6 shadow-md">
	{#if $mantras[$activeTab]}
		<!-- Swipe indicator -->
		<div class="mb-3 text-center text-xs text-yellow-500 select-none">
			<span class="font-departure">← SWIPE TO NAVIGATE →</span>
		</div>

		<div class="mb-4 text-center">
			<h3 class="font-departure text-2xl font-medium text-stone-100">
				{formatMantraName($mantras[$activeTab].name)} MANTRA
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
				<circle cx="50" cy="50" r="40" fill="none" stroke="#57534E" stroke-width="10" />

				<!-- Progress circle with animation -->
				<circle
					cx="50"
					cy="50"
					r="40"
					fill="none"
					stroke="url(#gradient)"
					stroke-width="10"
					stroke-linecap="round"
					stroke-dasharray={getStrokeDashArray(
						$mantras[$activeTab].count,
						$mantras[$activeTab].name
					)}
					stroke-dashoffset="0"
					class="progress-circle"
				/>

				<!-- Define gradient -->
				<defs>
					<linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="100%">
						<stop offset="0%" stop-color="#EAB308" />
						<stop offset="100%" stop-color="#FACC15" />
					</linearGradient>
				</defs>
			</svg>

			<!-- Button in center of donut -->
			<button
				class="tap-button absolute top-1/2 left-1/2 flex h-24 w-24 -translate-x-1/2 -translate-y-1/2 transform items-center justify-center rounded-full bg-gradient-to-r from-yellow-700 to-yellow-600 text-white shadow-lg transition-shadow focus:ring-2 focus:ring-yellow-500 focus:ring-offset-2 focus:outline-none active:shadow-inner"
				on:click={handleIncrement}
				disabled={$isUpdating}
				aria-label={`Increment ${$mantras[$activeTab].name} mantra count`}
			>
				<div class="text-center">
					{#if $isUpdating}
						<svg
							class="mx-auto h-8 w-8 animate-spin text-white"
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
							class="mx-auto h-8 w-8 text-white"
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
						<span class="font-departure mt-1 block text-sm font-medium">TAP</span>
					{/if}
				</div>
			</button>

			<!-- Animated count increment -->
			{#if showAnimation}
				<div
					class="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 transform"
					in:fly={{ y: -50, duration: 500, easing: elasticOut }}
					out:scale={{ duration: 300 }}
				>
					<span class="text-xl font-bold text-yellow-400">+1</span>
				</div>
			{/if}
		</div>

		<!-- Count display -->
		<div class="text-center">
			<span class="font-departure text-4xl font-medium text-stone-100">
				{$mantras[$activeTab].count}
			</span>
			<span class="text-md font-departure mt-1 block text-stone-300">
				{$mantras[$activeTab].count} / {getDailyTarget($mantras[$activeTab].name)}
				({getPercentage($mantras[$activeTab].count, $mantras[$activeTab].name).toFixed(0)}% OF DAILY
				GOAL)
			</span>
		</div>
	{/if}
</div>

<style>
	/* Circle progress animation */
	@keyframes circleProgress {
		0% {
			stroke-dasharray: 0 251.327;
		}
	}

	.progress-circle {
		animation: circleProgress 1s ease-out forwards;
	}

	/* Pulse effect for tap button */
	@keyframes pulse {
		0% {
			box-shadow: 0 0 0 0 rgba(234, 179, 8, 0.3);
		}
		70% {
			box-shadow: 0 0 0 10px rgba(234, 179, 8, 0);
		}
		100% {
			box-shadow: 0 0 0 0 rgba(234, 179, 8, 0);
		}
	}

	.tap-button:not(:disabled) {
		animation: pulse 2s infinite;
	}
</style>
