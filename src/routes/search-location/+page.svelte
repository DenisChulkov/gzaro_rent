<script lang="ts">
	import { t } from '$lib/i18n';
	import { goto } from '$app/navigation';
	import { resolve } from '$app/paths';
	import { countriesData } from '$lib/data/locations';
	import { filters } from '$lib/stores/filters';

	let selectedCountryId = $state($filters.countryId);
	let selectedCityId = $state($filters.cityId);
	let errors = $state<{ country?: string; city?: string }>({});

	const availableCities = $derived(() => {
		if (!selectedCountryId) return [];
		const country = countriesData.find((item) => item.id === selectedCountryId);
		return country ? country.cities : [];
	});

	function handleBack() {
		goto(resolve('/'));
	}

	function handleCountryChange(event: Event) {
		const target = event.target as HTMLSelectElement;
		selectedCountryId = target.value;
		selectedCityId = '';
		errors = { ...errors, country: undefined, city: undefined };
	}

	function handleCityChange(event: Event) {
		const target = event.target as HTMLSelectElement;
		selectedCityId = target.value;
		errors = { ...errors, city: undefined };
	}

	function handleContinue() {
		const nextErrors: { country?: string; city?: string } = {};

		if (!selectedCountryId) {
			nextErrors.country = $t('fieldRequired');
		}

		if (!selectedCityId) {
			nextErrors.city = $t('fieldRequired');
		}

		errors = nextErrors;
		if (Object.keys(nextErrors).length > 0) {
			return;
		}

		filters.setCountry(selectedCountryId);
		filters.setCity(selectedCityId);
		goto(resolve('/map'));
	}
</script>

<div class="location-picker-page">
	<header class="location-picker-header">
		<button class="back-button" onclick={handleBack} aria-label={$t('back')}>
			<span>←</span>
		</button>
		<h1>{$t('mapTitle')}</h1>
	</header>

	<main class="location-picker-content">
		<div class="form-group">
			<label for="country">{$t('country')}</label>
			<select id="country" value={selectedCountryId} onchange={handleCountryChange}>
				<option value="">{$t('selectCountry')}</option>
				{#each countriesData as country (country.id)}
					<option value={country.id}>{country.name}</option>
				{/each}
			</select>
			{#if errors.country}
				<span class="error-text">{errors.country}</span>
			{/if}
		</div>

		<div class="form-group">
			<label for="city">{$t('city')}</label>
			<select
				id="city"
				value={selectedCityId}
				onchange={handleCityChange}
				disabled={!selectedCountryId}
			>
				<option value="">{$t('selectCity')}</option>
				{#each availableCities() as city (city.id)}
					<option value={city.id}>{city.name}</option>
				{/each}
			</select>
			{#if errors.city}
				<span class="error-text">{errors.city}</span>
			{/if}
		</div>

		<button class="continue-button" onclick={handleContinue}>
			{$t('confirmAndContinue')}
		</button>
	</main>
</div>

<style>
	.location-picker-page {
		flex: 1;
		display: flex;
		flex-direction: column;
		padding: 0 16px 24px;
	}

	.location-picker-header {
		display: flex;
		align-items: center;
		gap: 12px;
		padding: 12px 0;
	}

	.location-picker-header h1 {
		margin: 0;
		font-size: 22px;
		font-weight: 700;
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

	.location-picker-content {
		display: flex;
		flex-direction: column;
		gap: 16px;
		padding-top: 8px;
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

	.form-group select {
		padding: 14px 16px;
		border: 1.5px solid var(--tg-theme-secondary-bg-color, #e0e0e0);
		border-radius: 10px;
		font-size: 16px;
		background-color: var(--tg-theme-bg-color, #ffffff);
		color: var(--tg-theme-text-color, #000000);
	}

	.form-group select:disabled {
		opacity: 0.6;
	}

	.error-text {
		font-size: 12px;
		color: #ef4444;
	}

	.continue-button {
		margin-top: 8px;
		padding: 14px 16px;
		border: none;
		border-radius: 10px;
		background-color: var(--tg-theme-button-color, #3390ec);
		color: var(--tg-theme-button-text-color, #ffffff);
		font-size: 16px;
		font-weight: 600;
		cursor: pointer;
	}

	.continue-button:active {
		transform: scale(0.98);
	}
</style>
