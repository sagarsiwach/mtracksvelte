<script>
	import { mantras, activeTab, formatMantraName } from '../stores/mantraStore';
	import { setLastActiveTab } from '../utils/storage';
	import { triggerHapticFeedback } from '../utils/haptics';

	// Tab switching function
	function switchTab(index) {
		activeTab.set(index);
		setLastActiveTab(index);
		triggerHapticFeedback('light');
	}
</script>

<div class="mb-0 overflow-hidden rounded-t-lg border border-stone-900 bg-stone-600 shadow-md">
	<div class="flex border-b border-stone-900">
		{#each $mantras as mantra, index}
			<button
				class="font-departure flex-1 px-4 py-3 text-center transition-colors
          {$activeTab === index
					? 'border-b-2 border-yellow-500 bg-stone-700 font-medium text-stone-100'
					: 'text-stone-300 hover:bg-stone-500'}"
				on:click={() => switchTab(index)}
				aria-selected={$activeTab === index}
				role="tab"
			>
				{formatMantraName(mantra.name)}
			</button>
		{/each}
	</div>
</div>
