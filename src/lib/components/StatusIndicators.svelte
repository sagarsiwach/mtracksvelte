<script>
	import { syncQueue, error } from '../stores/mantraStore';
	import { isOnline } from '../stores/settingsStore';
	import { processSyncQueue } from '../stores/mantraStore';
</script>

<div class="mb-4 space-y-4">
	<!-- Sync queue indicator with count and detailed status -->
	{#if $syncQueue.length > 0}
		<div class="rounded-md border-l-4 border-yellow-500 bg-yellow-950 p-4 shadow-md">
			<div class="flex items-center justify-between">
				<p class="font-departure font-medium text-yellow-400">OFFLINE CHANGES PENDING</p>
				<span
					class="font-departure inline-flex items-center justify-center rounded-full bg-yellow-800 px-2 py-1 text-xs text-yellow-200"
				>
					{$syncQueue.length}
				</span>
			</div>
			<p class="mt-1 text-yellow-300">
				{$syncQueue.length} change{$syncQueue.length !== 1 ? 's' : ''} will sync when you're back online.
			</p>
			{#if $isOnline}
				<button
					on:click={processSyncQueue}
					class="font-departure mt-2 flex items-center rounded bg-yellow-600 px-3 py-1 text-sm text-white hover:bg-yellow-700"
				>
					<svg class="mr-1 h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							stroke-width="2"
							d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
						/>
					</svg>
					SYNC NOW
				</button>
			{/if}
		</div>
	{/if}

	<!-- Offline indicator with improved visual -->
	{#if !$isOnline}
		<div class="rounded-md border-l-4 border-amber-500 bg-amber-950 p-4 shadow-md">
			<div class="flex items-center">
				<svg
					class="mr-2 h-5 w-5 text-amber-400"
					fill="none"
					viewBox="0 0 24 24"
					stroke="currentColor"
				>
					<path
						stroke-linecap="round"
						stroke-linejoin="round"
						stroke-width="2"
						d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
					/>
				</svg>
				<p class="font-departure font-medium text-amber-400">OFFLINE MODE</p>
			</div>
			<p class="mt-1 text-amber-300">
				You're currently offline. Your counts will sync when you reconnect.
			</p>
		</div>
	{/if}

	<!-- Error message with more visual distinction -->
	{#if $error}
		<div class="rounded-md border-l-4 border-rose-500 bg-rose-950 p-4 shadow-md">
			<div class="flex items-center">
				<svg
					class="mr-2 h-5 w-5 text-rose-400"
					fill="none"
					viewBox="0 0 24 24"
					stroke="currentColor"
				>
					<path
						stroke-linecap="round"
						stroke-linejoin="round"
						stroke-width="2"
						d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
					/>
				</svg>
				<p class="font-departure font-medium text-rose-400">ERROR</p>
			</div>
			<p class="mt-1 text-rose-300">{$error}</p>

			<!-- Add retry button for certain errors -->
			{#if $error.includes('connection') || $error.includes('offline')}
				<button
					on:click={() => window.location.reload()}
					class="font-departure mt-2 rounded bg-rose-600 px-3 py-1 text-sm text-white hover:bg-rose-700"
				>
					RETRY
				</button>
			{/if}
		</div>
	{/if}
</div>
