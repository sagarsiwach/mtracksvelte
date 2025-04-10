import {
	format,
	isToday,
	addDays,
	isBefore,
	isAfter,
	isSameDay,
	eachDayOfInterval
} from 'date-fns';

// Constants
export const MARCH_1_2025 = new Date(2025, 2, 1); // JavaScript months are 0-indexed

// Date navigation helper functions
export function isDateInFuture(date) {
	const today = new Date();
	today.setHours(0, 0, 0, 0);
	return isAfter(date, today);
}

export function isDateBeforeMarch2025(date) {
	return isBefore(date, MARCH_1_2025);
}

// Generate a range of dates for the slider
export function getDateRange() {
	const today = new Date();
	const daysSinceMarch1 = Math.max(0, Math.floor((today - MARCH_1_2025) / (1000 * 60 * 60 * 24)));

	// Show at least 30 days into the future
	const endDate = addDays(today, 30);

	// Show all days since March 1, 2025
	const startDate = MARCH_1_2025;

	return eachDayOfInterval({ start: startDate, end: endDate });
}

export function centerDateInSlider(date) {
	setTimeout(() => {
		const container = document.getElementById('dateSliderContainer');
		let targetId = isSameDay(date, new Date()) ? 'todayDateButton' : '';

		// If not today, find by date match
		if (!targetId) {
			const dateButtons = Array.from(container.querySelectorAll('button'));
			const targetIndex = dateButtons.findIndex((btn) => {
				const btnDate = new Date(btn.textContent.trim());
				return isSameDay(btnDate, date);
			});
			if (targetIndex >= 0) {
				targetId = `date-${targetIndex}`;
			}
		}

		const targetElement = document.getElementById(targetId);
		if (targetElement && container) {
			// Calculate center position
			const containerWidth = container.offsetWidth;
			const targetLeft = targetElement.offsetLeft;
			const targetWidth = targetElement.offsetWidth;

			// Scroll to position that centers the element
			container.scrollLeft = targetLeft - containerWidth / 2 + targetWidth / 2;
		}
	}, 100); // Small delay to ensure DOM is updated
}

export function formatDate(date, formatString) {
	return format(date, formatString);
}

export { isToday, addDays, isSameDay };
