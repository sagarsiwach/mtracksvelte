<script>
	import { syncQueue, error } from '../stores/mantraStore';
	import { isOnline } from '../stores/settingsStore';
	import { processSyncQueue } from '../stores/mantraStore';
</script>

<div class="mb-4 space-y-4">
	<!-- Sync queue indicator -->
	{#if $syncQueue.length > 0}
		<div class="rounded-md border-l-4 border-yellow-500 bg-yellow-950 p-4 shadow-md">
			<p class="font-departure font-medium text-yellow-400">OFFLINE CHANGES PENDING</p>
			<p class="mt-1 text-yellow-300">
				{$syncQueue.length} change{$syncQueue.length !== 1 ? 's' : ''} will sync when you're back online.
			</p>
			{#if $isOnline}
				<button
					on:click={processSyncQueue}
					class="font-departure mt-2 rounded bg-yellow-600 px-3 py-1 text-sm text-white hover:bg-yellow-700"
				>
					SYNC NOW
				</button>
			{/if}
		</div>
	{/if}

	<!-- Offline indicator -->
	{#if !$isOnline}
		<div class="rounded-md border-l-4 border-amber-500 bg-amber-950 p-4 shadow-md">
			<p class="font-departure font-medium text-amber-400">OFFLINE MODE</p>
			<p class="mt-1 text-amber-300">
				You're currently offline. Your counts will sync when you reconnect.
			</p>
		</div>
	{/if}

	<!-- Error message -->
	{#if $error}
		<div class="rounded-md border-l-4 border-rose-500 bg-rose-950 p-4 shadow-md">
			<p class="font-departure font-medium text-rose-400">ERROR</p>
			<p class="mt-1 text-rose-300">{$error}</p>
		</div>
	{/if}
</div>
