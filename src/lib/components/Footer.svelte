<script>
	// Navigation tabs for bottom bar
	const tabs = [
		{ name: 'HOME', active: true },
		{ name: 'M0', active: false },
		{ name: 'M1', active: false },
		{ name: 'STATS', active: false, comingSoon: true }
	];
</script>

<footer class="fixed bottom-0 w-full border-t-2 border-yellow-900 bg-yellow-800">
	<div class="flex h-14">
		{#each tabs as tab, i}
			<div
				class="flex flex-1 items-center justify-center {tab.active ? 'bg-yellow-900' : ''}
           {i === 0 ? 'border-r border-yellow-900' : ''}"
			>
				<div class="relative">
					<span class="font-departure text-{tab.active ? 'yellow-500' : 'yellow-100'}"
						>{tab.name}</span
					>
					{#if tab.comingSoon}
						<div class="absolute right-0 -bottom-4 left-0 text-center">
							<span class="font-departure text-[8px] text-yellow-500">coming soon!</span>
						</div>
					{/if}
				</div>
			</div>
		{/each}
	</div>
</footer>
