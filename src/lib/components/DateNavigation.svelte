<script>
	import {
		isDateInFuture,
		isDateBeforeMarch2025,
		addDays,
		formatDate,
		isToday,
		isSameDay,
		getDateRange,
		centerDateInSlider
	} from '../utils/dates';
	import { selectedDate } from '../stores/mantraStore';
	import { triggerHapticFeedback } from '../utils/haptics';
	import { fetchMantrasForDate } from '../stores/mantraStore';

	// Function to navigate to a specific date
	function navigateDate(direction) {
		const newDate = addDays($selectedDate, direction);

		// Validate date bounds
		if (isDateInFuture(newDate) || isDateBeforeMarch2025(newDate)) {
			return;
		}

		selectedDate.set(newDate);
		fetchMantrasForDate(newDate);
		triggerHapticFeedback('light');
	}

	// Go to today
	function goToToday() {
		const today = new Date();
		selectedDate.set(today);
		fetchMantrasForDate(today);
		centerDateInSlider(today);
		triggerHapticFeedback('light');
	}
</script>

<div class="border-b-2 border-yellow-900 bg-yellow-800 py-2 shadow-sm">
	<div class="container mx-auto max-w-md px-4">
		<!-- Date slider controls -->
		<div class="mb-2 flex items-center justify-between">
			<button
				class="rounded-full p-2 text-yellow-300 hover:bg-yellow-700 disabled:cursor-not-allowed disabled:opacity-40"
				on:click={() => navigateDate(-1)}
				disabled={isDateBeforeMarch2025(addDays($selectedDate, -1))}
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

			{#if !isToday($selectedDate)}
				<button
					class="font-departure rounded-full bg-yellow-600 px-2 py-1 text-xs text-white hover:bg-yellow-700"
					on:click={goToToday}
				>
					Today
				</button>
			{:else}
				<div class="font-departure rounded-full bg-yellow-600 px-2 py-1 text-xs text-white">
					Today
				</div>
			{/if}

			<button
				class="rounded-full p-2 text-yellow-300 hover:bg-yellow-700 disabled:cursor-not-allowed disabled:opacity-40"
				on:click={() => navigateDate(1)}
				disabled={isDateInFuture(addDays($selectedDate, 1))}
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
							class="font-departure flex-shrink-0 rounded-md px-3 py-1 text-sm transition-colors
              {isSameDay(date, $selectedDate)
								? 'bg-yellow-600 text-white'
								: isDateInFuture(date)
									? 'cursor-not-allowed bg-yellow-950 text-yellow-800'
									: 'bg-yellow-900 text-yellow-400 hover:bg-yellow-700'}"
							on:click={() => {
								if (!isDateInFuture(date)) {
									selectedDate.set(date);
									fetchMantrasForDate(date);
									triggerHapticFeedback('light');
								}
							}}
							disabled={isDateInFuture(date)}
						>
							{formatDate(date, 'MM-dd')}
						</button>
					{/each}
				</div>
			</div>
		</div>
	</div>
</div>

<style>
	/* Horizontal scrolling for date slider */
	.hide-scrollbar {
		-ms-overflow-style: none; /* IE and Edge */
		scrollbar-width: none; /* Firefox */
	}

	.hide-scrollbar::-webkit-scrollbar {
		display: none; /* Chrome, Safari and Opera */
	}
</style>
