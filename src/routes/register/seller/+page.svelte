<script lang="ts">
	import { t } from '$lib/i18n';
	import { user } from '$lib/stores/user';
	import { goto } from '$app/navigation';
	import { resolve } from '$app/paths';

	let firstName = $state('');
	let lastName = $state('');
	let email = $state('');
	let phone = $state('');
	let password = $state('');
	let confirmPassword = $state('');

	let errors = $state<Record<string, string>>({});
	let isSubmitting = $state(false);

	function validateForm(): boolean {
		const newErrors: Record<string, string> = {};

		if (!firstName.trim()) {
			newErrors.firstName = $t('fieldRequired');
		}

		if (!lastName.trim()) {
			newErrors.lastName = $t('fieldRequired');
		}

		if (!email.trim()) {
			newErrors.email = $t('fieldRequired');
		} else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
			newErrors.email = $t('invalidEmail');
		}

		if (!phone.trim()) {
			newErrors.phone = $t('fieldRequired');
		} else if (!/^[\d\s\-+()]{7,20}$/.test(phone)) {
			newErrors.phone = $t('invalidPhone');
		}

		if (!password) {
			newErrors.password = $t('fieldRequired');
		} else if (password.length < 6) {
			newErrors.password = $t('passwordTooShort');
		}

		if (!confirmPassword) {
			newErrors.confirmPassword = $t('fieldRequired');
		} else if (password !== confirmPassword) {
			newErrors.confirmPassword = $t('passwordsDoNotMatch');
		}

		errors = newErrors;
		return Object.keys(newErrors).length === 0;
	}

	function handleSubmit(event: Event) {
		event.preventDefault();

		if (!validateForm()) {
			return;
		}

		isSubmitting = true;

		// Register user with seller role
		user.register(
			{
				firstName: firstName.trim(),
				lastName: lastName.trim(),
				email: email.trim(),
				phone: phone.trim(),
				password
			},
			'seller'
		);

		console.log('User registered as seller:', {
			firstName,
			lastName,
			email,
			phone,
			role: 'seller'
		});

		// eslint-disable-next-line svelte/no-navigation-without-resolve
		goto(`${resolve('/register/success')}?role=seller`);
	}

	function handleBack() {
		goto(resolve('/'));
	}
</script>

<div class="register-page">
	<header class="register-header">
		<button class="back-button" onclick={handleBack} aria-label={$t('back')}>
			<span class="back-icon">←</span>
		</button>
		<h1>{$t('sellerRegistration')}</h1>
	</header>

	<form class="register-form" onsubmit={handleSubmit}>
		<p class="form-description">{$t('sellerRegistrationDesc')}</p>

		<div class="form-group">
			<label for="firstName">{$t('firstName')}</label>
			<input
				type="text"
				id="firstName"
				bind:value={firstName}
				class:error={errors.firstName}
				placeholder={$t('firstNamePlaceholder')}
			/>
			{#if errors.firstName}
				<span class="error-message">{errors.firstName}</span>
			{/if}
		</div>

		<div class="form-group">
			<label for="lastName">{$t('lastName')}</label>
			<input
				type="text"
				id="lastName"
				bind:value={lastName}
				class:error={errors.lastName}
				placeholder={$t('lastNamePlaceholder')}
			/>
			{#if errors.lastName}
				<span class="error-message">{errors.lastName}</span>
			{/if}
		</div>

		<div class="form-group">
			<label for="email">{$t('email')}</label>
			<input
				type="email"
				id="email"
				bind:value={email}
				class:error={errors.email}
				placeholder={$t('emailPlaceholder')}
			/>
			{#if errors.email}
				<span class="error-message">{errors.email}</span>
			{/if}
		</div>

		<div class="form-group">
			<label for="phone">{$t('phone')}</label>
			<input
				type="tel"
				id="phone"
				bind:value={phone}
				class:error={errors.phone}
				placeholder={$t('phonePlaceholder')}
			/>
			{#if errors.phone}
				<span class="error-message">{errors.phone}</span>
			{/if}
		</div>

		<div class="form-group">
			<label for="password">{$t('password')}</label>
			<input
				type="password"
				id="password"
				bind:value={password}
				class:error={errors.password}
				placeholder={$t('passwordPlaceholder')}
			/>
			{#if errors.password}
				<span class="error-message">{errors.password}</span>
			{/if}
		</div>

		<div class="form-group">
			<label for="confirmPassword">{$t('confirmPassword')}</label>
			<input
				type="password"
				id="confirmPassword"
				bind:value={confirmPassword}
				class:error={errors.confirmPassword}
				placeholder={$t('confirmPasswordPlaceholder')}
			/>
			{#if errors.confirmPassword}
				<span class="error-message">{errors.confirmPassword}</span>
			{/if}
		</div>

		<button type="submit" class="submit-button" disabled={isSubmitting}>
			{isSubmitting ? $t('registering') : $t('register')}
		</button>
	</form>
</div>

<style>
	.register-page {
		flex: 1;
		display: flex;
		flex-direction: column;
		padding: 0 16px 24px;
	}

	.register-header {
		display: flex;
		align-items: center;
		gap: 12px;
		margin-bottom: 24px;
		padding-top: 8px;
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

	.register-header h1 {
		margin: 0;
		font-size: 22px;
		font-weight: 700;
		color: var(--tg-theme-text-color, #000000);
	}

	.register-form {
		display: flex;
		flex-direction: column;
		gap: 20px;
	}

	.form-description {
		margin: 0 0 8px 0;
		font-size: 14px;
		color: var(--tg-theme-hint-color, #999999);
		line-height: 1.5;
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
		border: 1.5px solid var(--tg-theme-secondary-bg-color, #e0e0e0);
		border-radius: 10px;
		font-size: 16px;
		background-color: var(--tg-theme-bg-color, #ffffff);
		color: var(--tg-theme-text-color, #000000);
		transition: border-color 0.2s ease;
	}

	.form-group input::placeholder {
		color: var(--tg-theme-hint-color, #999999);
	}

	.form-group input:focus {
		outline: none;
		border-color: var(--tg-theme-button-color, #3390ec);
	}

	.form-group input.error {
		border-color: #e53935;
	}

	.error-message {
		font-size: 12px;
		color: #e53935;
	}

	.submit-button {
		margin-top: 12px;
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

	.submit-button:active:not(:disabled) {
		transform: scale(0.98);
	}

	.submit-button:disabled {
		opacity: 0.6;
		cursor: not-allowed;
	}
</style>
