<script lang="ts">
	import { t } from '$lib/i18n';
	import { goto } from '$app/navigation';
	import { resolve } from '$app/paths';
	import { user } from '$lib/stores/user';
	import LanguageSwitcher from '$lib/components/LanguageSwitcher.svelte';

	type UserIntent = 'search' | 'rent-out' | 'sell';

	function handleSelection(intent: UserIntent) {
		console.log('User selected:', intent);

		switch (intent) {
			case 'rent-out':
				// eslint-disable-next-line svelte/no-navigation-without-resolve
				goto(`${resolve('/auth')}?role=landlord`);
				break;
			case 'sell':
				// eslint-disable-next-line svelte/no-navigation-without-resolve
				goto(`${resolve('/auth')}?role=seller`);
				break;
			case 'search':
				user.setAsUser();
				goto(resolve('/search-location'));
				break;
		}
	}
</script>

<div class="entry-screen">
	<nav class="top-nav">
		<LanguageSwitcher />
	</nav>
	<header class="header">
		<h1>{$t('appName')}</h1>
		<p class="subtitle">{$t('subtitle')}</p>
	</header>

	<main class="actions">
		<button class="action-btn action-btn--primary" onclick={() => handleSelection('search')}>
			<span class="action-btn__icon">🔍</span>
			<span class="action-btn__text">{$t('searchButton')}</span>
		</button>

		<button class="action-btn action-btn--secondary" onclick={() => handleSelection('rent-out')}>
			<span class="action-btn__icon">🏠</span>
			<span class="action-btn__text">{$t('rentOutButton')}</span>
		</button>

		<button class="action-btn action-btn--secondary" onclick={() => handleSelection('sell')}>
			<span class="action-btn__icon">💰</span>
			<span class="action-btn__text">{$t('sellButton')}</span>
		</button>
	</main>
</div>

<style>
	.entry-screen {
		flex: 1;
		display: flex;
		flex-direction: column;
		padding: 0 16px 24px;
	}

	.top-nav {
		display: flex;
		justify-content: flex-end;
		padding: 12px 0;
	}

	.header {
		text-align: center;
		margin-bottom: 48px;
		padding-top: 24px;
	}

	h1 {
		margin: 0 0 8px 0;
		font-size: 28px;
		font-weight: 700;
		color: var(--tg-theme-text-color, #000000);
	}

	.subtitle {
		margin: 0;
		font-size: 16px;
		color: var(--tg-theme-hint-color, #999999);
	}

	.actions {
		display: flex;
		flex-direction: column;
		gap: 12px;
	}

	.action-btn {
		display: flex;
		align-items: center;
		gap: 16px;
		width: 100%;
		padding: 20px;
		border: none;
		border-radius: 12px;
		font-size: 16px;
		font-weight: 500;
		cursor: pointer;
		transition:
			transform 0.15s ease,
			box-shadow 0.15s ease;
		text-align: left;
	}

	.action-btn:active {
		transform: scale(0.98);
	}

	.action-btn--primary {
		background-color: var(--tg-theme-button-color, #3390ec);
		color: var(--tg-theme-button-text-color, #ffffff);
	}

	.action-btn--secondary {
		background-color: var(--tg-theme-secondary-bg-color, #f4f4f5);
		color: var(--tg-theme-text-color, #000000);
	}

	.action-btn__icon {
		font-size: 24px;
		flex-shrink: 0;
	}

	.action-btn__text {
		flex: 1;
		line-height: 1.4;
	}
</style>
