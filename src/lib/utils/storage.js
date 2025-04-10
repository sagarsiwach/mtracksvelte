// LocalStorage cache functions
export function saveToLocalCache(date, data) {
	try {
		const formattedDate = new Date(date).toISOString().split('T')[0];
		localStorage.setItem(`mantra_data_${formattedDate}`, JSON.stringify(data));
		localStorage.setItem('mantra_last_sync', Date.now().toString());
	} catch (e) {
		console.error('Failed to cache data:', e);
	}
}

export function getFromLocalCache(date) {
	try {
		const formattedDate = new Date(date).toISOString().split('T')[0];
		const cached = localStorage.getItem(`mantra_data_${formattedDate}`);
		return cached ? JSON.parse(cached) : null;
	} catch (e) {
		console.error('Failed to retrieve cache:', e);
		return null;
	}
}

// Tab persistence
export function getLastActiveTab() {
	try {
		const savedTab = localStorage.getItem('lastActiveTab');
		return savedTab ? parseInt(savedTab, 10) : 0;
	} catch (e) {
		console.error('Failed to get last active tab:', e);
		return 0;
	}
}

export function setLastActiveTab(tabIndex) {
	try {
		localStorage.setItem('lastActiveTab', String(tabIndex));
	} catch (e) {
		console.error('Failed to save last active tab:', e);
	}
}

// Sync queue manipulation
export function getSyncQueue() {
	try {
		const queue = localStorage.getItem('mantra_sync_queue');
		return queue ? JSON.parse(queue) : [];
	} catch (e) {
		console.error('Failed to get sync queue:', e);
		return [];
	}
}

export function saveSyncQueue(queue) {
	try {
		localStorage.setItem('mantra_sync_queue', JSON.stringify(queue));
	} catch (e) {
		console.error('Failed to save sync queue:', e);
	}
}
