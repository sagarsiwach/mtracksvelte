/** @type {import('tailwindcss').Config} */
export default {
	content: ['./src/**/*.{html,js,svelte,ts}'],
	theme: {
		extend: {
			colors: {
				// IBM Design System colors
				'ibm-blue': '#0f62fe',
				'ibm-blue-60': '#0353e9',
				'ibm-gray-10': '#f4f4f4',
				'ibm-gray-20': '#e0e0e0',
				'ibm-gray-30': '#c6c6c6',
				'ibm-gray-40': '#a8a8a8',
				'ibm-gray-50': '#8d8d8d',
				'ibm-gray-60': '#6f6f6f',
				'ibm-gray-70': '#525252',
				'ibm-gray-80': '#393939',
				'ibm-gray-90': '#262626',
				'ibm-gray-100': '#161616',
				'ibm-red': '#da1e28',
				'ibm-red-60': '#fa4d56'
			},
			fontFamily: {
				sans: ['"IBM Plex Sans"', 'sans-serif'],
				mono: ['"IBM Plex Mono"', 'monospace']
			}
		}
	},
	plugins: []
};
