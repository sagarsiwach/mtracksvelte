<script>
	import { isLoading, mantras } from '../stores/mantraStore';
</script>

{#if $isLoading && $mantras.length === 0}
	<div class="mb-6 rounded-lg border border-stone-900 bg-stone-600 p-8 shadow-md">
		<div class="flex justify-center">
			<div class="h-16 w-16 animate-spin rounded-full border-b-2 border-yellow-500"></div>
		</div>
		<p class="font-departure mt-4 text-center text-stone-100">LOADING YOUR MANTRAS...</p>
	</div>
{:else if $mantras.length === 0}
	<div class="mb-6 rounded-lg border border-stone-900 bg-stone-600 p-8 text-center shadow-md">
		<svg
			xmlns="http://www.w3.org/2000/svg"
			class="mx-auto h-16 w-16 text-yellow-700"
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
		<p class="font-departure mt-4 text-lg font-light text-stone-100">
			NO MANTRAS FOUND FOR THIS DATE.
		</p>
	</div>
{/if}
