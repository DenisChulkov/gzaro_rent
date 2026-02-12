import { writable, derived } from 'svelte/store';
import { browser } from '$app/environment';
import { translations, languages, type LanguageCode, type TranslationKey } from './translations';

function detectLanguage(): LanguageCode {
	if (!browser) return 'en';

	// Try to get language from Telegram user data
	const tgLang = window.Telegram?.WebApp?.initDataUnsafe?.user?.language_code;
	if (tgLang) {
		// Map Telegram language codes to our supported languages
		if (tgLang === 'ru' || tgLang.startsWith('ru')) return 'ru';
		if (tgLang === 'ka' || tgLang.startsWith('ka')) return 'ka';
		if (tgLang === 'hy' || tgLang.startsWith('hy')) return 'hy';
		if (tgLang === 'en' || tgLang.startsWith('en')) return 'en';
	}

	// Fallback to browser language
	const browserLang = navigator.language?.toLowerCase();
	if (browserLang) {
		if (browserLang.startsWith('ru')) return 'ru';
		if (browserLang.startsWith('ka')) return 'ka';
		if (browserLang.startsWith('hy')) return 'hy';
	}

	return 'en';
}

export const currentLanguage = writable<LanguageCode>(detectLanguage());

export const t = derived(currentLanguage, ($lang) => {
	return (key: TranslationKey): string => {
		return translations[$lang][key] || translations['en'][key] || key;
	};
});

export function setLanguage(lang: LanguageCode) {
	currentLanguage.set(lang);
}

export { languages, type LanguageCode, type TranslationKey };
