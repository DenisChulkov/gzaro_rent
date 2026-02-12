import { browser } from '$app/environment';

export const tg = browser ? window.Telegram?.WebApp : undefined;

export const tgUser = tg?.initDataUnsafe?.user;

export const isTelegram = !!tg;

export function initTelegram() {
	if (!tg) return;

	tg.ready();
	tg.expand();
}
