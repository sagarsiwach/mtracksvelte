<script>
	import { formatDate } from '../utils/dates';
</script>

<header class="border-b-2 border-yellow-900 bg-yellow-800 py-4 shadow-sm">
	<div class="container mx-auto max-w-md px-4">
		<div class="flex flex-col">
			<h1 class="font-departure text-2xl font-medium text-white">TRACKER</h1>
			<p class="font-departure text-sm text-yellow-400">
				{formatDate(new Date(), 'EEEE, MMMM d, yyyy')} · {formatDate(new Date(), 'h:mm a')}
			</p>
		</div>
	</div>
</header>
