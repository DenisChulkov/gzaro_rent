<script lang="ts">
	import { t, type TranslationKey } from '$lib/i18n';
	import { goto } from '$app/navigation';
	import { resolve } from '$app/paths';
	import { filters, type RoomType, type HeatingType } from '$lib/stores/filters';

	// Types for location data
	interface City {
		id: string;
		name: string;
	}

	interface Country {
		id: string;
		name: string;
		currency: string;
		cities: City[];
	}

	// Mock data - countries and cities with their local currencies
	const countriesData: Country[] = [
		{
			id: 'ge',
			name: 'Georgia',
			currency: 'GEL',
			cities: [
				{ id: 'tbilisi', name: 'Tbilisi' },
				{ id: 'batumi', name: 'Batumi' },
				{ id: 'kutaisi', name: 'Kutaisi' }
			]
		},
		{
			id: 'am',
			name: 'Armenia',
			currency: 'AMD',
			cities: [
				{ id: 'yerevan', name: 'Yerevan' },
				{ id: 'gyumri', name: 'Gyumri' }
			]
		},
		{
			id: 'az',
			name: 'Azerbaijan',
			currency: 'AZN',
			cities: [
				{ id: 'baku', name: 'Baku' },
				{ id: 'ganja', name: 'Ganja' }
			]
		}
	];

	// Room options
	const roomOptions: { value: RoomType; labelKey: TranslationKey }[] = [
		{ value: 'studio', labelKey: 'studio' },
		{ value: '1+1', labelKey: 'room1plus1' },
		{ value: '2+1', labelKey: 'room2plus1' },
		{ value: '3+1', labelKey: 'room3plus1' },
		{ value: '4+1', labelKey: 'room4plus1' },
		{ value: 'house', labelKey: 'privateHouse' }
	];

	// Additional options
	const additionalOptionsList: { value: string; labelKey: TranslationKey }[] = [
		{ value: 'balcony', labelKey: 'balcony' },
		{ value: 'noPetRestrictions', labelKey: 'noPetRestrictions' },
		{ value: 'dishwasher', labelKey: 'dishwasher' },
		{ value: 'oven', labelKey: 'oven' },
		{ value: 'bathtub', labelKey: 'bathtub' },
		{ value: 'twoPlusBathrooms', labelKey: 'twoPlusBathrooms' }
	];

	// Heating options
	const heatingOptions: { value: HeatingType; labelKey: TranslationKey }[] = [
		{ value: 'central', labelKey: 'centralHeating' },
		{ value: 'electric', labelKey: 'electricHeating' },
		{ value: 'airCondition', labelKey: 'airConditionHeating' },
		{ value: 'underfloor', labelKey: 'underfloorHeating' }
	];

	// Get current filter values from store
	let currentFilters = $state($filters);

	// Subscribe to store changes
	$effect(() => {
		const unsubscribe = filters.subscribe((value) => {
			currentFilters = value;
		});
		return unsubscribe;
	});

	// Derived: available cities based on selected country
	const availableCities = $derived(() => {
		if (!currentFilters.countryId) return [];
		const country = countriesData.find((c) => c.id === currentFilters.countryId);
		return country ? country.cities : [];
	});

	// Derived: local currency based on selected country
	const localCurrency = $derived(() => {
		if (!currentFilters.countryId) return null;
		const country = countriesData.find((c) => c.id === currentFilters.countryId);
		return country ? country.currency : null;
	});

	function handleBack() {
		goto(resolve('/map'));
	}

	function handleApply() {
		goto(resolve('/map'));
	}

	function handleReset() {
		filters.reset();
	}

	function handleCountryChange(event: Event) {
		const target = event.target as HTMLSelectElement;
		filters.setCountry(target.value);
	}

	function handleCityChange(event: Event) {
		const target = event.target as HTMLSelectElement;
		filters.setCity(target.value);
	}
</script>

<div class="filters-page">
	<header class="filters-header">
		<button class="back-button" onclick={handleBack} aria-label={$t('back')}>
			<span class="back-icon">←</span>
		</button>
		<h1>{$t('filters')}</h1>
		<button class="reset-button" onclick={handleReset}>
			{$t('resetFilters')}
		</button>
	</header>

	<main class="filters-content">
		<!-- Location Section -->
		<section class="filter-section">
			<h2 class="section-title">{$t('location')}</h2>
			<div class="filter-row">
				<div class="filter-field">
					<label for="country-select">{$t('country')}</label>
					<select
						id="country-select"
						value={currentFilters.countryId}
						onchange={handleCountryChange}
						class="filter-select"
					>
						<option value="">{$t('selectCountry')}</option>
						{#each countriesData as country (country.id)}
							<option value={country.id}>{country.name}</option>
						{/each}
					</select>
				</div>
				<div class="filter-field">
					<label for="city-select">{$t('city')}</label>
					<select
						id="city-select"
						value={currentFilters.cityId}
						onchange={handleCityChange}
						class="filter-select"
						disabled={!currentFilters.countryId}
					>
						<option value="">{$t('selectCity')}</option>
						{#each availableCities() as city (city.id)}
							<option value={city.id}>{city.name}</option>
						{/each}
					</select>
				</div>
			</div>
		</section>

		<!-- Category Section -->
		<section class="filter-section">
			<h2 class="section-title">{$t('category')}</h2>
			<div class="radio-group">
				<label class="radio-option" class:selected={currentFilters.category === 'rental'}>
					<input
						type="radio"
						name="category"
						value="rental"
						checked={currentFilters.category === 'rental'}
						onchange={() => filters.setCategory('rental')}
					/>
					<span class="radio-label">{$t('rental')}</span>
				</label>
				<label class="radio-option" class:selected={currentFilters.category === 'sale'}>
					<input
						type="radio"
						name="category"
						value="sale"
						checked={currentFilters.category === 'sale'}
						onchange={() => filters.setCategory('sale')}
					/>
					<span class="radio-label">{$t('sale')}</span>
				</label>
			</div>
		</section>

		<!-- Rental Type - only for rental category -->
		{#if currentFilters.category === 'rental'}
			<section class="filter-section">
				<h2 class="section-title">{$t('rentalType')}</h2>
				<div class="switcher">
					<button
						class="switcher-option"
						class:active={currentFilters.rentalType === 'long-term'}
						onclick={() => filters.setRentalType('long-term')}
					>
						{$t('longTermRental')}
					</button>
					<button
						class="switcher-option"
						class:active={currentFilters.rentalType === 'daily'}
						onclick={() => filters.setRentalType('daily')}
					>
						{$t('dailyRental')}
					</button>
				</div>
			</section>
		{/if}

		<!-- Currency -->
		<section class="filter-section">
			<h2 class="section-title">{$t('currency')}</h2>
			<div class="switcher">
				<button
					class="switcher-option"
					class:active={currentFilters.currency === 'USD'}
					onclick={() => filters.setCurrency('USD')}
				>
					USD
				</button>
				{#if localCurrency()}
					<button
						class="switcher-option"
						class:active={currentFilters.currency === 'local'}
						onclick={() => filters.setCurrency('local')}
					>
						{localCurrency()}
					</button>
				{:else}
					<button
						class="switcher-option"
						class:active={currentFilters.currency === 'local'}
						onclick={() => filters.setCurrency('local')}
						disabled
					>
						{$t('localCurrency')}
					</button>
				{/if}
			</div>
		</section>

		<!-- Price Range -->
		<section class="filter-section">
			<h2 class="section-title">{$t('priceRange')}</h2>
			<div class="price-range">
				<div class="price-field">
					<label for="price-min">{$t('priceFrom')}</label>
					<input
						type="number"
						id="price-min"
						value={currentFilters.priceMin}
						oninput={(e) => filters.setPriceMin((e.target as HTMLInputElement).value)}
						placeholder="0"
						class="price-input"
					/>
				</div>
				<span class="price-separator">—</span>
				<div class="price-field">
					<label for="price-max">{$t('priceTo')}</label>
					<input
						type="number"
						id="price-max"
						value={currentFilters.priceMax}
						oninput={(e) => filters.setPriceMax((e.target as HTMLInputElement).value)}
						placeholder="∞"
						class="price-input"
					/>
				</div>
			</div>
		</section>

		<!-- Rooms -->
		<section class="filter-section">
			<h2 class="section-title">{$t('rooms')}</h2>
			<div class="chip-group">
				{#each roomOptions as room (room.value)}
					<button
						class="chip"
						class:selected={currentFilters.rooms.includes(room.value)}
						onclick={() => filters.toggleRoom(room.value)}
					>
						{$t(room.labelKey)}
					</button>
				{/each}
			</div>
		</section>

		<!-- Additional Options -->
		<section class="filter-section">
			<h2 class="section-title">{$t('additionalOptions')}</h2>
			<div class="checkbox-group">
				{#each additionalOptionsList as option (option.value)}
					<label class="checkbox-option">
						<input
							type="checkbox"
							checked={currentFilters.additionalOptions.includes(option.value)}
							onchange={() => filters.toggleAdditionalOption(option.value)}
						/>
						<span class="checkbox-label">{$t(option.labelKey)}</span>
					</label>
				{/each}
			</div>
		</section>

		<!-- Heating -->
		<section class="filter-section">
			<h2 class="section-title">{$t('heating')}</h2>
			<div class="chip-group">
				{#each heatingOptions as heat (heat.value)}
					<button
						class="chip"
						class:selected={currentFilters.heating.includes(heat.value)}
						onclick={() => filters.toggleHeating(heat.value)}
					>
						{$t(heat.labelKey)}
					</button>
				{/each}
			</div>
		</section>
	</main>

	<footer class="filters-footer">
		<button class="apply-button" onclick={handleApply}>
			{$t('applyFilters')}
		</button>
	</footer>
</div>

<style>
	.filters-page {
		flex: 1;
		display: flex;
		flex-direction: column;
		min-height: 100vh;
	}

	.filters-header {
		display: flex;
		align-items: center;
		gap: 12px;
		padding: 12px 16px;
		background-color: var(--tg-theme-bg-color, #ffffff);
		border-bottom: 1px solid var(--tg-theme-secondary-bg-color, #e0e0e0);
		position: sticky;
		top: 0;
		z-index: 100;
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

	.filters-header h1 {
		flex: 1;
		margin: 0;
		font-size: 20px;
		font-weight: 700;
		color: var(--tg-theme-text-color, #000000);
	}

	.reset-button {
		padding: 8px 12px;
		border: none;
		border-radius: 8px;
		background-color: transparent;
		color: var(--tg-theme-button-color, #3390ec);
		font-size: 14px;
		font-weight: 500;
		cursor: pointer;
	}

	.reset-button:active {
		opacity: 0.7;
	}

	.filters-content {
		flex: 1;
		padding: 16px;
		padding-bottom: 100px;
		overflow-y: auto;
	}

	.filter-section {
		margin-bottom: 24px;
	}

	.section-title {
		margin: 0 0 12px 0;
		font-size: 16px;
		font-weight: 600;
		color: var(--tg-theme-text-color, #000000);
	}

	.filter-row {
		display: flex;
		gap: 12px;
	}

	.filter-field {
		flex: 1;
		display: flex;
		flex-direction: column;
		gap: 6px;
	}

	.filter-field label {
		font-size: 12px;
		font-weight: 500;
		color: var(--tg-theme-hint-color, #999999);
	}

	.filter-select {
		padding: 12px;
		border: 1.5px solid var(--tg-theme-secondary-bg-color, #e0e0e0);
		border-radius: 10px;
		font-size: 15px;
		background-color: var(--tg-theme-bg-color, #ffffff);
		color: var(--tg-theme-text-color, #000000);
		cursor: pointer;
		appearance: none;
		background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%23999' d='M6 8L1 3h10z'/%3E%3C/svg%3E");
		background-repeat: no-repeat;
		background-position: right 12px center;
		padding-right: 32px;
	}

	.filter-select:focus {
		outline: none;
		border-color: var(--tg-theme-button-color, #3390ec);
	}

	.filter-select:disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}

	.radio-group {
		display: flex;
		gap: 12px;
	}

	.radio-option {
		flex: 1;
		display: flex;
		align-items: center;
		justify-content: center;
		padding: 14px;
		border: 1.5px solid var(--tg-theme-secondary-bg-color, #e0e0e0);
		border-radius: 10px;
		cursor: pointer;
		transition: all 0.2s ease;
	}

	.radio-option input {
		display: none;
	}

	.radio-option.selected {
		border-color: var(--tg-theme-button-color, #3390ec);
		background-color: var(--tg-theme-button-color, #3390ec);
	}

	.radio-option.selected .radio-label {
		color: var(--tg-theme-button-text-color, #ffffff);
	}

	.radio-label {
		font-size: 15px;
		font-weight: 500;
		color: var(--tg-theme-text-color, #000000);
	}

	.switcher {
		display: flex;
		background-color: var(--tg-theme-secondary-bg-color, #f4f4f5);
		border-radius: 10px;
		padding: 4px;
	}

	.switcher-option {
		flex: 1;
		padding: 10px 16px;
		border: none;
		border-radius: 8px;
		background-color: transparent;
		color: var(--tg-theme-hint-color, #999999);
		font-size: 14px;
		font-weight: 500;
		cursor: pointer;
		transition: all 0.2s ease;
	}

	.switcher-option.active {
		background-color: var(--tg-theme-bg-color, #ffffff);
		color: var(--tg-theme-text-color, #000000);
		box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
	}

	.switcher-option:disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}

	.price-range {
		display: flex;
		align-items: flex-end;
		gap: 12px;
	}

	.price-field {
		flex: 1;
		display: flex;
		flex-direction: column;
		gap: 6px;
	}

	.price-field label {
		font-size: 12px;
		font-weight: 500;
		color: var(--tg-theme-hint-color, #999999);
	}

	.price-input {
		padding: 12px;
		border: 1.5px solid var(--tg-theme-secondary-bg-color, #e0e0e0);
		border-radius: 10px;
		font-size: 15px;
		background-color: var(--tg-theme-bg-color, #ffffff);
		color: var(--tg-theme-text-color, #000000);
	}

	.price-input:focus {
		outline: none;
		border-color: var(--tg-theme-button-color, #3390ec);
	}

	.price-input::placeholder {
		color: var(--tg-theme-hint-color, #999999);
	}

	.price-separator {
		padding-bottom: 14px;
		color: var(--tg-theme-hint-color, #999999);
	}

	.chip-group {
		display: flex;
		flex-wrap: wrap;
		gap: 8px;
	}

	.chip {
		padding: 10px 16px;
		border: 1.5px solid var(--tg-theme-secondary-bg-color, #e0e0e0);
		border-radius: 20px;
		background-color: var(--tg-theme-bg-color, #ffffff);
		color: var(--tg-theme-text-color, #000000);
		font-size: 14px;
		font-weight: 500;
		cursor: pointer;
		transition: all 0.2s ease;
	}

	.chip.selected {
		border-color: var(--tg-theme-button-color, #3390ec);
		background-color: var(--tg-theme-button-color, #3390ec);
		color: var(--tg-theme-button-text-color, #ffffff);
	}

	.chip:active {
		transform: scale(0.95);
	}

	.checkbox-group {
		display: flex;
		flex-direction: column;
		gap: 12px;
	}

	.checkbox-option {
		display: flex;
		align-items: center;
		gap: 12px;
		cursor: pointer;
	}

	.checkbox-option input[type='checkbox'] {
		width: 22px;
		height: 22px;
		accent-color: var(--tg-theme-button-color, #3390ec);
		cursor: pointer;
	}

	.checkbox-label {
		font-size: 15px;
		color: var(--tg-theme-text-color, #000000);
	}

	.filters-footer {
		position: fixed;
		bottom: 0;
		left: 0;
		right: 0;
		padding: 16px;
		background-color: var(--tg-theme-bg-color, #ffffff);
		border-top: 1px solid var(--tg-theme-secondary-bg-color, #e0e0e0);
	}

	.apply-button {
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

	.apply-button:active {
		transform: scale(0.98);
	}
</style>
