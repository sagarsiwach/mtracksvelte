// API endpoint
const API_URL = 'https://automation.unipack.asia/webhook/mantras';

// Fetch with retry capability
export async function fetchWithRetry(url, options = {}, maxRetries = 3) {
	let retries = 0;

	while (retries < maxRetries) {
		try {
			const response = await fetch(url, options);

			if (!response.ok) {
				throw new Error(`HTTP error: ${response.status}`);
			}

			return await response.json();
		} catch (err) {
			retries++;
			console.error(`Attempt ${retries} failed:`, err);

			if (retries >= maxRetries) {
				throw err;
			}

			// Exponential backoff
			await new Promise((resolve) => setTimeout(resolve, 500 * Math.pow(2, retries)));
		}
	}
}

export async function fetchMantras(date) {
	const formattedDate = new Date(date).toISOString().split('T')[0];
	return fetchWithRetry(`${API_URL}?date=${formattedDate}`);
}

export async function incrementMantra(name, date) {
	const formattedDate = new Date(date).toISOString().split('T')[0];

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
