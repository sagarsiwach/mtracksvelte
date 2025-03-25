<script>
	import { onMount } from 'svelte';
	import { format } from 'date-fns';

	// State variables
	let mantras = [];
	let isLoading = true;
	let isUpdating = false;
	let error = null;
	let newMantra = '';
	let rawResponse = null; // For debugging

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

			// Process the data from the Code node output
			if (Array.isArray(data)) {
				mantras = data.map((item) => ({
					name: item.name,
					count: item.count
				}));
				console.log('Processed mantras:', mantras);
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

	// Fetch mantras on component mount
	onMount(() => {
		console.log('Component mounted, fetching mantras...');
		fetchMantras();
	});
</script>

<main class="min-h-screen bg-neutral-950">
	<!-- IBM Header -->
	<header class="bg-black py-4 text-white">
		<div class="mx-auto max-w-6xl px-4">
			<h1 class="text-2xl font-medium">Mantra Tracker</h1>
		</div>
	</header>

	<div class="mx-auto max-w-6xl p-8">
		<div class="mb-8 flex items-center justify-between">
			<h2 class="text-2xl font-medium">
				Today's Counts ({format(new Date(), 'MMMM d, yyyy')})
			</h2>
			<button on:click={fetchMantras} class="ibm-button-secondary" disabled={isLoading}>
				{isLoading ? 'Refreshing...' : 'Refresh'}
			</button>
		</div>

		<!-- Error message -->
		{#if error}
			<div class="bg-ibm-red bg-opacity-10 border-ibm-red text-ibm-red-60 mb-6 border-l-4 p-4">
				<p class="font-medium">Error</p>
				<p>{error}</p>
			</div>
		{/if}

		<!-- Debug info - you can remove this in production -->
		<div class="mb-4 text-xs">
			<p>API URL: {API_URL}</p>
			<p>Mantras count: {mantras.length}</p>
			{#if rawResponse}
				<details>
					<summary>Raw response (debug)</summary>
					<pre class="bg-ibm-gray-90 mt-2 overflow-auto p-2 text-xs">
						{JSON.stringify(rawResponse, null, 2)}
					</pre>
				</details>
			{/if}
		</div>

		<!-- Add new mantra form -->
		<div class="ibm-card mb-6">
			<h3 class="mb-4 text-lg font-medium">Add New Mantra</h3>
			<div class="flex gap-3">
				<div class="flex-grow">
					<input
						type="text"
						bind:value={newMantra}
						placeholder="Enter a new mantra"
						class="ibm-input"
						on:keypress={(e) => e.key === 'Enter' && addMantra()}
					/>
				</div>
				<button
					on:click={addMantra}
					class="ibm-button-primary"
					disabled={isLoading || isUpdating || !newMantra.trim()}
				>
					Add
				</button>
			</div>
		</div>

		<!-- Mantra list -->
		<div class="ibm-card">
			{#if isLoading && mantras.length === 0}
				<div class="text-ibm-gray-30 py-8 text-center">
					<div
						class="border-ibm-gray-60 border-t-ibm-blue mr-2 inline-block h-6 w-6 animate-spin rounded-full border-2"
					></div>
					Loading mantras...
				</div>
			{:else if mantras.length > 0}
				{#each mantras as mantra (mantra.name)}
					<div class="border-ibm-gray-70 border-b py-5 last:border-b-0">
						<div class="flex items-center justify-between">
							<div>
								<h3 class="text-xl font-medium">{mantra.name}</h3>
								<div class="mt-2 flex items-center">
									<span class="text-ibm-gray-30 mr-2">Count:</span>
									<span class="bg-ibm-gray-80 px-3 py-1 font-medium">
										{mantra.count}
									</span>
								</div>
							</div>
							<button
								on:click={() => incrementMantra(mantra.name)}
								class="ibm-button-primary"
								disabled={isUpdating}
							>
								{#if isUpdating}
									<span
										class="mr-2 inline-block h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"
									></span>
									Updating...
								{:else}
									Increment
								{/if}
							</button>
						</div>
					</div>
				{/each}
			{:else}
				<div class="text-ibm-gray-30 py-8 text-center">
					No mantras added yet. Add your first mantra above.
				</div>
			{/if}
		</div>
	</div>
</main>
