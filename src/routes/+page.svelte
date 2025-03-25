<script>
	import { onMount } from 'svelte';
	import { format } from 'date-fns';

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
	let activeTab = 0; // Track active tab

	// API endpoint
	const API_URL = 'https://automator.congzhoumachinery.com/webhook/mantras';

	async function fetchMantras() {
		isLoading = true;
		error = null;

		try {
			console.log('Fetching mantras...');
			const response = await fetch(API_URL);

			if (!response.ok) {
				throw new Error(`HTTP error: ${response.status}`);
			}

			const data = await response.json();
			rawResponse = data; // Store for debugging
			console.log('Received data:', data);

			// Process the data - correctly extract from the nested json property
			if (Array.isArray(data)) {
				mantras = data.map((item) => ({
					name: item.json.name,
					count: item.json.count
				}));
				console.log('Processed mantras:', mantras);

				// Set active tab to the first mantra if available
				if (mantras.length > 0 && activeTab >= mantras.length) {
					activeTab = 0;
				}
			} else {
				throw new Error('Response is not an array as expected');
			}
		} catch (err) {
			console.error('Error fetching mantras:', err);
			error = `Failed to load mantras: ${err.message}`;
		} finally {
			isLoading = false;
		}
	}

	async function incrementMantra(name) {
		if (isUpdating) return;

		isUpdating = true;

		try {
			// Optimistic update
			mantras = mantras.map((mantra) =>
				mantra.name === name ? { ...mantra, count: mantra.count + 1 } : mantra
			);

			const response = await fetch(API_URL, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify({ mantraName: name })
			});

			if (!response.ok) {
				throw new Error(`HTTP error: ${response.status}`);
			}

			// The POST endpoint doesn't return updated counts, so we need to fetch them
			await fetchMantras();
		} catch (err) {
			console.error('Error incrementing mantra:', err);
			error = `Failed to increment mantra: ${err.message}`;
			// Refresh to get accurate data
			fetchMantras();
		} finally {
			isUpdating = false;
		}
	}

	async function addMantra() {
		if (!newMantra.trim()) return;

		isUpdating = true;

		try {
			const response = await fetch(API_URL, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify({ mantraName: newMantra })
			});

			if (!response.ok) {
				throw new Error(`HTTP error: ${response.status}`);
			}

			// Clear the input
			newMantra = '';

			// The POST endpoint doesn't return updated counts, so we need to fetch them
			await fetchMantras();
		} catch (err) {
			console.error('Error adding mantra:', err);
			error = `Failed to add mantra: ${err.message}`;
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

	// Fetch mantras on component mount
	onMount(() => {
		console.log('Component mounted, fetching mantras...');
		fetchMantras();
	});
</script>

<main class="min-h-screen bg-gradient-to-b from-green-50 to-teal-50 font-['IBM_Plex_Serif']">
	<!-- Header -->
	<header class="bg-white py-5 shadow-sm">
		<div class="container mx-auto max-w-md px-4">
			<div class="flex flex-col">
				<h1 class="text-2xl font-medium text-teal-700">Mantra Tracker</h1>
				<p class="text-sm text-teal-600">
					{format(new Date(), 'EEEE, MMMM d, yyyy')} · {format(new Date(), 'h:mm a')}
				</p>
			</div>
		</div>
	</header>

	<div class="container mx-auto max-w-md px-4 py-6">
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
						<button
							on:click={fetchMantras}
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
						disabled={isLoading || isUpdating || !newMantra.trim()}
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
				<p class="mt-4 text-lg font-light text-teal-700">No mantras added yet.</p>
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
							on:click={() => (activeTab = index)}
						>
							{formatMantraName(mantra.name)}
						</button>
					{/each}
				</div>
			</div>

			<!-- Tab content with donut chart -->
			<div class="mb-6 rounded-b-lg bg-white p-6 shadow-md">
				{#if mantras[activeTab]}
					<div class="mb-4 text-center">
						<h3 class="text-2xl font-medium text-teal-700">
							{formatMantraName(mantras[activeTab].name)} Mantra
						</h3>
					</div>

					<!-- Donut chart -->
					<div class="relative my-8 flex justify-center">
						<svg width="200" height="200" viewBox="0 0 100 100" class="-rotate-90 transform">
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
							class="absolute top-1/2 left-1/2 flex h-24 w-24 -translate-x-1/2 -translate-y-1/2 transform items-center justify-center rounded-full bg-gradient-to-r from-teal-100 to-green-100 text-teal-700 shadow-lg transition-shadow focus:outline-none active:shadow-inner"
							on:click={() => incrementMantra(mantras[activeTab].name)}
							disabled={isUpdating}
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
	<footer class="mt-auto py-6 text-center text-sm text-teal-700">
		<div class="container mx-auto max-w-md px-4">
			<p>🙏 Sat Saheb 🙏</p>
		</div>
	</footer>
</main>
