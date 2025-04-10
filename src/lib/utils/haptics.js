// Haptic feedback utility
export function triggerHapticFeedback(type = 'medium') {
	if (!('vibrate' in navigator)) return;

	switch (type) {
		case 'light':
			navigator.vibrate(10);
			break;
		case 'medium':
			navigator.vibrate(20);
			break;
		case 'heavy':
			navigator.vibrate([30, 30, 30]);
			break;
		case 'success':
			navigator.vibrate([15, 50, 30]);
			break;
		case 'error':
			navigator.vibrate([50, 20, 50, 20, 50]);
			break;
		default:
			navigator.vibrate(20);
	}
}
