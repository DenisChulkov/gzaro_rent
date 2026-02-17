<script lang="ts">
	import { get } from 'svelte/store';
	import { goto } from '$app/navigation';
	import { resolve } from '$app/paths';
	import { t } from '$lib/i18n';
	import { user } from '$lib/stores/user';

	const currentUser = $derived($user);

	let firstName = $state(get(user)?.firstName ?? '');
	let lastName = $state(get(user)?.lastName ?? '');
	let email = $state(get(user)?.email ?? '');
	let phone = $state(get(user)?.phone ?? '');
	let password = $state(get(user)?.password ?? '');
	let contactPhone = $state(get(user)?.contactPhone ?? '');
	let contactEmail = $state(get(user)?.contactEmail ?? '');
	let contactWhatsapp = $state(get(user)?.contactWhatsapp ?? '');
	let contactViber = $state(get(user)?.contactViber ?? '');
	let contactTelegram = $state(get(user)?.contactTelegram ?? '');
	let preferredContactMethod = $state<
		'phone' | 'email' | 'whatsapp' | 'viber' | 'telegram' | ''
	>(get(user)?.preferredContactMethod ?? '');

	let isEditMode = $state(false);
	let errors = $state<Record<string, string>>({});
	let isSaving = $state(false);
	let isSaved = $state(false);

	const hasPendingChanges = $derived(
		firstName.trim() !== (currentUser?.firstName ?? '') ||
			lastName.trim() !== (currentUser?.lastName ?? '') ||
			email.trim() !== (currentUser?.email ?? '') ||
			phone.trim() !== (currentUser?.phone ?? '') ||
			password.trim() !== (currentUser?.password ?? '') ||
			contactPhone.trim() !== (currentUser?.contactPhone ?? '') ||
			contactEmail.trim() !== (currentUser?.contactEmail ?? '') ||
			contactWhatsapp.trim() !== (currentUser?.contactWhatsapp ?? '') ||
			contactViber.trim() !== (currentUser?.contactViber ?? '') ||
			contactTelegram.trim() !== (currentUser?.contactTelegram ?? '') ||
			preferredContactMethod !== (currentUser?.preferredContactMethod ?? '')
	);

	function validateForm(): boolean {
		const nextErrors: Record<string, string> = {};

		if (!firstName.trim()) {
			nextErrors.firstName = $t('fieldRequired');
		}

		if (!lastName.trim()) {
			nextErrors.lastName = $t('fieldRequired');
		}

		if (!email.trim()) {
			nextErrors.email = $t('fieldRequired');
		} else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
			nextErrors.email = $t('invalidEmail');
		}

		if (!phone.trim()) {
			nextErrors.phone = $t('fieldRequired');
		} else if (!/^[\d\s\-+()]{7,20}$/.test(phone.trim())) {
			nextErrors.phone = $t('invalidPhone');
		}

		if (password.trim() && password.trim().length < 6) {
			nextErrors.password = $t('passwordTooShort');
		}

		const normalizedContactPhone = contactPhone.trim();
		const normalizedContactEmail = contactEmail.trim();
		const normalizedContactWhatsapp = contactWhatsapp.trim();
		const normalizedContactViber = contactViber.trim();
		const normalizedContactTelegram = contactTelegram.trim();

		const hasContactMethod =
			!!normalizedContactPhone ||
			!!normalizedContactEmail ||
			!!normalizedContactWhatsapp ||
			!!normalizedContactViber ||
			!!normalizedContactTelegram;

		if (!hasContactMethod) {
			nextErrors.contactMethods = $t('atLeastOneContactRequired');
		}

		if (normalizedContactEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedContactEmail)) {
			nextErrors.contactEmail = $t('invalidEmail');
		}

		const simplePhoneRegex = /^[\d\s\-+()]{7,20}$/;
		if (normalizedContactPhone && !simplePhoneRegex.test(normalizedContactPhone)) {
			nextErrors.contactPhone = $t('invalidPhone');
		}
		if (normalizedContactWhatsapp && !simplePhoneRegex.test(normalizedContactWhatsapp)) {
			nextErrors.contactWhatsapp = $t('invalidPhone');
		}
		if (normalizedContactViber && !simplePhoneRegex.test(normalizedContactViber)) {
			nextErrors.contactViber = $t('invalidPhone');
		}

		if (preferredContactMethod) {
			const preferredMap = {
				phone: normalizedContactPhone,
				email: normalizedContactEmail,
				whatsapp: normalizedContactWhatsapp,
				viber: normalizedContactViber,
				telegram: normalizedContactTelegram
			};
			if (!preferredMap[preferredContactMethod]) {
				nextErrors.preferredContactMethod = $t('preferredContactMustBeFilled');
			}
		}

		errors = nextErrors;
		return Object.keys(nextErrors).length === 0;
	}

	function handleBack() {
		goto(resolve('/map'));
	}

	function resetFormFromStore() {
		firstName = currentUser?.firstName ?? '';
		lastName = currentUser?.lastName ?? '';
		email = currentUser?.email ?? '';
		phone = currentUser?.phone ?? '';
		password = currentUser?.password ?? '';
		contactPhone = currentUser?.contactPhone ?? '';
		contactEmail = currentUser?.contactEmail ?? '';
		contactWhatsapp = currentUser?.contactWhatsapp ?? '';
		contactViber = currentUser?.contactViber ?? '';
		contactTelegram = currentUser?.contactTelegram ?? '';
		preferredContactMethod = currentUser?.preferredContactMethod ?? '';
		errors = {};
	}

	function toggleModify() {
		isSaved = false;

		if (isEditMode) {
			resetFormFromStore();
			isEditMode = false;
			return;
		}

		isEditMode = true;
	}

	function handleSave(event: Event) {
		event.preventDefault();
		if (!isEditMode || !hasPendingChanges || !validateForm()) return;

		isSaving = true;
		isSaved = false;

		user.updateProfile({
			firstName: firstName.trim(),
			lastName: lastName.trim(),
			email: email.trim(),
			phone: phone.trim(),
			password: password.trim(),
			contactPhone: contactPhone.trim(),
			contactEmail: contactEmail.trim(),
			contactWhatsapp: contactWhatsapp.trim(),
			contactViber: contactViber.trim(),
			contactTelegram: contactTelegram.trim(),
			preferredContactMethod: preferredContactMethod || undefined
		});

		setTimeout(() => {
			isSaving = false;
			isSaved = true;
			isEditMode = false;
		}, 350);
	}
</script>

<div class="settings-page">
	<header class="settings-header">
		<button class="back-button" onclick={handleBack} aria-label={$t('back')}>
			<span>←</span>
		</button>
		<h1>{$t('accountSettingsTitle')}</h1>
		<button type="button" class="modify-all-button" onclick={toggleModify}>
			{isEditMode ? $t('cancel') : $t('modify')}
		</button>
	</header>

	<form class="settings-form" onsubmit={handleSave}>
		<div class="form-group">
			<label for="firstName">{$t('firstName')}</label>
			<input
				id="firstName"
				type="text"
				bind:value={firstName}
				disabled={!isEditMode}
				class:error={errors.firstName}
			/>
			{#if errors.firstName}
				<span class="error-text">{errors.firstName}</span>
			{/if}
		</div>

		<div class="form-group">
			<label for="lastName">{$t('lastName')}</label>
			<input
				id="lastName"
				type="text"
				bind:value={lastName}
				disabled={!isEditMode}
				class:error={errors.lastName}
			/>
			{#if errors.lastName}
				<span class="error-text">{errors.lastName}</span>
			{/if}
		</div>

		<div class="form-group">
			<label for="email">{$t('email')}</label>
			<input
				id="email"
				type="email"
				bind:value={email}
				disabled={!isEditMode}
				class:error={errors.email}
			/>
			{#if errors.email}
				<span class="error-text">{errors.email}</span>
			{/if}
		</div>

		<div class="form-group">
			<label for="phone">{$t('phone')}</label>
			<input
				id="phone"
				type="tel"
				bind:value={phone}
				disabled={!isEditMode}
				class:error={errors.phone}
			/>
			{#if errors.phone}
				<span class="error-text">{errors.phone}</span>
			{/if}
		</div>

		<div class="form-group">
			<label for="password">{$t('password')}</label>
			<input
				id="password"
				type="password"
				bind:value={password}
				placeholder={$t('passwordPlaceholder')}
				disabled={!isEditMode}
				class:error={errors.password}
			/>
			{#if errors.password}
				<span class="error-text">{errors.password}</span>
			{/if}
		</div>

		<div class="contact-section">
			<h2>{$t('contactMethodsTitle')}</h2>
			<p class="hint">{$t('contactVisibilityHint')}</p>

			<div class="form-group">
				<label for="contactPhone">{$t('phone')}</label>
				<input
					id="contactPhone"
					type="tel"
					bind:value={contactPhone}
					disabled={!isEditMode}
					class:error={errors.contactPhone}
				/>
				{#if errors.contactPhone}
					<span class="error-text">{errors.contactPhone}</span>
				{/if}
			</div>

			<div class="form-group">
				<label for="contactEmail">{$t('email')}</label>
				<input
					id="contactEmail"
					type="email"
					bind:value={contactEmail}
					disabled={!isEditMode}
					class:error={errors.contactEmail}
				/>
				{#if errors.contactEmail}
					<span class="error-text">{errors.contactEmail}</span>
				{/if}
			</div>

			<div class="form-group">
				<label for="contactWhatsapp">WhatsApp</label>
				<input
					id="contactWhatsapp"
					type="tel"
					bind:value={contactWhatsapp}
					disabled={!isEditMode}
					class:error={errors.contactWhatsapp}
				/>
				{#if errors.contactWhatsapp}
					<span class="error-text">{errors.contactWhatsapp}</span>
				{/if}
			</div>

			<div class="form-group">
				<label for="contactViber">Viber</label>
				<input
					id="contactViber"
					type="tel"
					bind:value={contactViber}
					disabled={!isEditMode}
					class:error={errors.contactViber}
				/>
				{#if errors.contactViber}
					<span class="error-text">{errors.contactViber}</span>
				{/if}
			</div>

			<div class="form-group">
				<label for="contactTelegram">Telegram</label>
				<input
					id="contactTelegram"
					type="text"
					bind:value={contactTelegram}
					disabled={!isEditMode}
				/>
			</div>

			<div class="form-group">
				<label for="preferredContactMethod">{$t('preferredContactMethod')}</label>
				<select
					id="preferredContactMethod"
					bind:value={preferredContactMethod}
					disabled={!isEditMode}
					class:error={errors.preferredContactMethod}
				>
					<option value="">{$t('selectPreferredContactMethod')}</option>
					<option value="phone">{$t('phone')}</option>
					<option value="email">{$t('email')}</option>
					<option value="whatsapp">WhatsApp</option>
					<option value="viber">Viber</option>
					<option value="telegram">Telegram</option>
				</select>
				{#if errors.preferredContactMethod}
					<span class="error-text">{errors.preferredContactMethod}</span>
				{/if}
			</div>

			{#if errors.contactMethods}
				<span class="error-text">{errors.contactMethods}</span>
			{/if}
		</div>

		<div class="form-group">
			<label for="balance">{$t('balance')}</label>
			<input id="balance" type="text" value={(currentUser?.balance ?? 0).toFixed(2)} disabled />
			<p class="hint">{$t('balanceHint')}</p>
		</div>

		{#if isSaved}
			<p class="saved-text">{$t('settingsSaved')}</p>
		{/if}

		<button
			type="submit"
			class="save-button"
			disabled={!isEditMode || isSaving || !hasPendingChanges}
		>
			{isSaving ? $t('savingChanges') : $t('saveChanges')}
		</button>
	</form>
</div>

<style>
	.settings-page {
		flex: 1;
		display: flex;
		flex-direction: column;
		padding: 0 16px 24px;
	}

	.settings-header {
		display: flex;
		align-items: center;
		gap: 12px;
		padding: 12px 0;
	}

	.settings-header h1 {
		margin: 0;
		font-size: 22px;
		font-weight: 700;
		flex: 1;
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

	.modify-all-button {
		padding: 8px 12px;
		border: none;
		border-radius: 8px;
		background-color: var(--tg-theme-secondary-bg-color, #f4f4f5);
		color: var(--tg-theme-text-color, #000000);
		font-size: 13px;
		font-weight: 600;
		cursor: pointer;
	}

	.settings-form {
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
	}

	.form-group input,
	.form-group select {
		padding: 14px 16px;
		border: 1.5px solid var(--tg-theme-secondary-bg-color, #e0e0e0);
		border-radius: 10px;
		font-size: 16px;
		background-color: var(--tg-theme-bg-color, #ffffff);
		color: var(--tg-theme-text-color, #000000);
	}

	.form-group input:focus,
	.form-group select:focus {
		outline: none;
		border-color: var(--tg-theme-button-color, #3390ec);
	}

	.form-group input:disabled,
	.form-group select:disabled {
		opacity: 0.8;
		cursor: not-allowed;
	}

	.form-group input.error,
	.form-group select.error {
		border-color: #e53935;
	}

	.contact-section {
		display: flex;
		flex-direction: column;
		gap: 12px;
		padding: 14px;
		border: 1px solid var(--tg-theme-secondary-bg-color, #e0e0e0);
		border-radius: 12px;
		background: color-mix(in srgb, var(--tg-theme-bg-color, #ffffff) 92%, #3390ec 8%);
	}

	.contact-section h2 {
		margin: 0;
		font-size: 16px;
		font-weight: 700;
	}

	.hint {
		margin: 0;
		font-size: 12px;
		color: var(--tg-theme-hint-color, #999999);
	}

	.error-text {
		margin: 0;
		color: #e53935;
		font-size: 12px;
	}

	.saved-text {
		margin: 0;
		color: #2e7d32;
		font-size: 13px;
		font-weight: 600;
	}

	.save-button {
		padding: 16px;
		border: none;
		border-radius: 12px;
		background-color: var(--tg-theme-button-color, #3390ec);
		color: var(--tg-theme-button-text-color, #ffffff);
		font-size: 16px;
		font-weight: 600;
		cursor: pointer;
	}

	.save-button:disabled {
		opacity: 0.6;
		cursor: not-allowed;
	}
</style>
