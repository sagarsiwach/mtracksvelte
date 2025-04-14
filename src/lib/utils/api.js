// API endpoint
const API_URL = 'https://automation.unipack.asia/webhook/mantras';

// Fetch with enhanced retry capability
export async function fetchWithRetry(url, options = {}, maxRetries = 3) {
	let retries = 0;
	let lastError;

	while (retries < maxRetries) {
		try {
			const response = await fetch(url, options);

			if (!response.ok) {
				const errorData = await response.text();
				throw new Error(`HTTP error: ${response.status} - ${errorData || 'Unknown error'}`);
			}

			return await response.json();
		} catch (err) {
			lastError = err;
			retries++;
			console.error(`Attempt ${retries} failed:`, err);

			if (retries >= maxRetries) {
				break;
			}

			// Exponential backoff
			await new Promise((resolve) => setTimeout(resolve, 500 * Math.pow(2, retries)));
		}
	}

	// Categorize errors better
	if (
		lastError.message.includes('Failed to fetch') ||
		lastError.message.includes('Network error')
	) {
		throw new Error(`Network connection error: ${lastError.message}`);
	}
	throw lastError;
}

export async function fetchMantras(date) {
	// Format date consistently - YYY-MM-DD format for the API
	const formattedDate = new Date(date).toISOString().split('T')[0];
	console.log(`Fetching mantras for date: ${formattedDate}`);
	return fetchWithRetry(`${API_URL}?date=${formattedDate}`);
}

export async function incrementMantra(name, date) {
	// Format date consistently - YYY-MM-DD format for the API
	const formattedDate = new Date(date).toISOString().split('T')[0];
	console.log(`Incrementing mantra ${name} for date: ${formattedDate}`);

	// Make sure we're using the correct API endpoint directly
	return fetch(API_URL, {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json'
		},
		body: JSON.stringify({
			mantraName: name,
			date: formattedDate
		})
	});
}

export const getApiUrl = () => API_URL;
