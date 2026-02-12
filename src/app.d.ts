// See https://svelte.dev/docs/kit/types#app.d.ts
// for information about these interfaces

declare global {
	namespace App {
		// interface Error {}
		// interface Locals {}
		// interface PageData {}
		// interface PageState {}
		// interface Platform {}
	}

	interface TelegramWebApp {
		ready(): void;
		expand(): void;
		initDataUnsafe?: {
			user?: {
				id: number;
				first_name?: string;
				last_name?: string;
				username?: string;
				language_code?: string;
			};
		};
		themeParams?: {
			bg_color?: string;
			text_color?: string;
			hint_color?: string;
			link_color?: string;
			button_color?: string;
			button_text_color?: string;
			secondary_bg_color?: string;
		};
		colorScheme?: 'light' | 'dark';
		LocationManager?: {
			isInited: boolean;
			isLocationAvailable: boolean;
			isAccessRequested: boolean;
			isAccessGranted: boolean;
			init(callback?: () => void): void;
			getLocation(
				callback: (location: { latitude: number; longitude: number } | null) => void
			): void;
			openSettings(): void;
		};
	}

	interface Window {
		Telegram?: {
			WebApp: TelegramWebApp;
		};
	}
}

export {};
