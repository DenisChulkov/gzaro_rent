<script lang="ts">
	import { t } from '$lib/i18n';
	import { user, type UserRole } from '$lib/stores/user';
	import { goto } from '$app/navigation';
	import { resolve } from '$app/paths';
	import { page } from '$app/stores';
	import { onMount } from 'svelte';

	const currentUser = $derived($user);
	const role = $derived($page.url.searchParams.get('role') || currentUser?.role || 'landlord');

	const welcomeKey = $derived(role === 'seller' ? 'welcomeSeller' : 'welcomeLandlord') as
		| 'welcomeSeller'
		| 'welcomeLandlord';
	const hintKey = $derived(
		role === 'seller' ? 'registrationSuccessHintSeller' : 'registrationSuccessHint'
	) as 'registrationSuccessHintSeller' | 'registrationSuccessHint';

	// Set the user role if coming from login (role in URL but not in store)
	onMount(() => {
		const urlRole = $page.url.searchParams.get('role') as UserRole | null;
		if (urlRole && (!currentUser || currentUser.role !== urlRole)) {
			user.setRole(urlRole);
		}
	});

	function handleContinue() {
		goto(resolve('/'));
	}
</script>

<div class="success-page">
	<div class="success-content">
		<div class="success-icon">✓</div>
		<h1>{$t('registrationSuccess')}</h1>
		<p class="success-message">
			{$t(welcomeKey)}
		</p>
		<p class="success-hint">{$t(hintKey)}</p>

		<button class="continue-button" onclick={handleContinue}>
			{$t('continue')}
		</button>
	</div>
</div>

<style>
	.success-page {
		flex: 1;
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		padding: 24px 16px;
		text-align: center;
	}

	.success-content {
		display: flex;
		flex-direction: column;
		align-items: center;
		max-width: 320px;
	}

	.success-icon {
		width: 80px;
		height: 80px;
		display: flex;
		align-items: center;
		justify-content: center;
		background-color: #4caf50;
		color: white;
		border-radius: 50%;
		font-size: 40px;
		margin-bottom: 24px;
	}

	h1 {
		margin: 0 0 12px 0;
		font-size: 24px;
		font-weight: 700;
		color: var(--tg-theme-text-color, #000000);
	}

	.success-message {
		margin: 0 0 8px 0;
		font-size: 16px;
		color: var(--tg-theme-text-color, #000000);
		line-height: 1.5;
	}

	.success-hint {
		margin: 0 0 32px 0;
		font-size: 14px;
		color: var(--tg-theme-hint-color, #999999);
		line-height: 1.5;
	}

	.continue-button {
		width: 100%;
		padding: 16px;
		border: none;
		border-radius: 12px;
		background-color: var(--tg-theme-button-color, #3390ec);
		color: var(--tg-theme-button-text-color, #ffffff);
		font-size: 16px;
		font-weight: 600;
		cursor: pointer;
		transition: transform 0.15s ease;
	}

	.continue-button:active {
		transform: scale(0.98);
	}
</style>
