<script lang="ts">
	import { t } from '$lib/i18n';
	import { goto } from '$app/navigation';
	import { resolve } from '$app/paths';
	import { page } from '$app/stores';
	import { user } from '$lib/stores/user';

	// Get role from URL parameter
	const role = $derived($page.url.searchParams.get('role') as 'landlord' | 'seller' | null);

	let email = $state('');
	let password = $state('');
	let isSubmitting = $state(false);

	function handleLogin(e: Event) {
		e.preventDefault();
		isSubmitting = true;

		// TODO: Implement actual login logic (OTP, magic link, etc.)
		// For now, simulate login and redirect to map
		setTimeout(() => {
			isSubmitting = false;
			// Set user with the appropriate role
			if (role) {
				user.setRole(role);
			}
			goto(resolve('/map'));
		}, 1000);
	}

	function handleRegister() {
		if (!role) {
			goto(resolve('/'));
			return;
		}

		goto(resolve(`/register/${role}`));
	}

	function handleBack() {
		goto(resolve('/'));
	}
</script>

<div class="auth-page">
	<header class="auth-header">
		<button class="back-button" onclick={handleBack} aria-label={$t('back')}>
			<span class="back-icon">←</span>
		</button>
		<h1>{$t('login')}</h1>
	</header>

	<main class="auth-content">
		<p class="auth-description">{$t('loginDescription')}</p>

		<form class="auth-form" onsubmit={handleLogin}>
			<div class="form-group">
				<label for="email">{$t('email')}</label>
				<input
					type="email"
					id="email"
					bind:value={email}
					placeholder={$t('emailPlaceholder')}
					required
				/>
			</div>

			<div class="form-group">
				<label for="password">{$t('password')}</label>
				<input
					type="password"
					id="password"
					bind:value={password}
					placeholder={$t('passwordPlaceholder')}
					required
				/>
			</div>

			<button type="submit" class="login-button" disabled={isSubmitting}>
				{isSubmitting ? $t('loggingIn') : $t('login')}
			</button>
		</form>

		<div class="divider">
			<span>{$t('or')}</span>
		</div>

		<div class="register-section">
			<p class="register-text">{$t('noAccount')}</p>
			<button class="register-button" onclick={handleRegister}>
				{$t('createAccount')}
			</button>
		</div>
	</main>
</div>

<style>
	.auth-page {
		flex: 1;
		display: flex;
		flex-direction: column;
	}

	.auth-header {
		display: flex;
		align-items: center;
		gap: 12px;
		padding: 12px 16px;
		background-color: var(--tg-theme-bg-color, #ffffff);
	}

	.back-button {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 40px;
		height: 40px;
		border: none;
		border-radius: 10px;
		background-color: var(--tg-theme-secondary-bg-color, #f4f4f5);
		color: var(--tg-theme-text-color, #000000);
		cursor: pointer;
		font-size: 20px;
	}

	.back-button:active {
		transform: scale(0.95);
	}

	.auth-header h1 {
		margin: 0;
		font-size: 20px;
		font-weight: 700;
		color: var(--tg-theme-text-color, #000000);
	}

	.auth-content {
		flex: 1;
		padding: 24px 16px;
	}

	.auth-description {
		margin: 0 0 24px;
		font-size: 15px;
		color: var(--tg-theme-hint-color, #999999);
		text-align: center;
	}

	.auth-form {
		display: flex;
		flex-direction: column;
		gap: 16px;
	}

	.form-group {
		display: flex;
		flex-direction: column;
		gap: 6px;
	}

	.form-group label {
		font-size: 14px;
		font-weight: 500;
		color: var(--tg-theme-text-color, #000000);
	}

	.form-group input {
		padding: 14px 16px;
		border: 1.5px solid var(--tg-theme-hint-color, #e0e0e0);
		border-radius: 10px;
		font-size: 16px;
		background-color: var(--tg-theme-bg-color, #ffffff);
		color: var(--tg-theme-text-color, #000000);
		outline: none;
		transition: border-color 0.2s ease;
	}

	.form-group input:focus {
		border-color: var(--tg-theme-button-color, #3390ec);
	}

	.form-group input::placeholder {
		color: var(--tg-theme-hint-color, #999999);
	}

	.login-button {
		margin-top: 8px;
		padding: 16px;
		border: none;
		border-radius: 10px;
		background-color: var(--tg-theme-button-color, #3390ec);
		color: var(--tg-theme-button-text-color, #ffffff);
		font-size: 16px;
		font-weight: 600;
		cursor: pointer;
		transition: transform 0.15s ease;
	}

	.login-button:active:not(:disabled) {
		transform: scale(0.98);
	}

	.login-button:disabled {
		opacity: 0.7;
		cursor: not-allowed;
	}

	.divider {
		display: flex;
		align-items: center;
		gap: 16px;
		margin: 32px 0;
	}

	.divider::before,
	.divider::after {
		content: '';
		flex: 1;
		height: 1px;
		background-color: var(--tg-theme-hint-color, #e0e0e0);
	}

	.divider span {
		font-size: 14px;
		color: var(--tg-theme-hint-color, #999999);
	}

	.register-section {
		text-align: center;
	}

	.register-text {
		margin: 0 0 12px;
		font-size: 15px;
		color: var(--tg-theme-hint-color, #999999);
	}

	.register-button {
		width: 100%;
		padding: 16px;
		border: 1.5px solid var(--tg-theme-button-color, #3390ec);
		border-radius: 10px;
		background-color: transparent;
		color: var(--tg-theme-button-color, #3390ec);
		font-size: 16px;
		font-weight: 600;
		cursor: pointer;
		transition: transform 0.15s ease;
	}

	.register-button:active {
		transform: scale(0.98);
		background-color: var(--tg-theme-secondary-bg-color, #f4f4f5);
	}
</style>
