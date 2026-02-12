<script lang="ts">
	import { t, type TranslationKey } from '$lib/i18n';
	import { goto } from '$app/navigation';
	import { resolve } from '$app/paths';
	import { page } from '$app/stores';
	import { user } from '$lib/stores/user';
	import { get } from 'svelte/store';

	// Get coordinates from URL if coming from map click
	const latParam = $derived($page.url.searchParams.get('lat'));
	const lngParam = $derived($page.url.searchParams.get('lng'));

	// Check if coordinates were provided (from map click)
	let hasCoordinates = $derived(latParam !== null && lngParam !== null);

	// Get user role
	let currentUser = $state(get(user));
	let isLandlord = $derived(currentUser?.role === 'landlord');

	// Form state
	let photos = $state<File[]>([]);
	let photoPreview = $state<string | null>(null);
	let address = $state('');
	let addressLat = $state<number | null>(null);
	let addressLng = $state<number | null>(null);
	let rentalType = $state<'long-term' | 'daily'>('long-term');
	let price = $state('');
	let currency = $state<'USD' | 'GEL' | 'AMD' | 'AZN'>('USD');
	let selectedRoom = $state<string>('');
	let additionalOptions = $state<string[]>([]);
	let heating = $state<string[]>([]);

	let isSubmitting = $state(false);
	let errors = $state<Record<string, string>>({});

	// Address autosuggest
	interface AddressSuggestion {
		display_name: string;
		lat: string;
		lon: string;
	}
	let addressSuggestions = $state<AddressSuggestion[]>([]);
	let showSuggestions = $state(false);
	let isSearching = $state(false);
	let searchTimeout: ReturnType<typeof setTimeout> | null = null;

	// Debounced address search using Nominatim
	function handleAddressInput(event: Event) {
		const input = event.target as HTMLInputElement;
		address = input.value;
		addressLat = null;
		addressLng = null;

		if (searchTimeout) {
			clearTimeout(searchTimeout);
		}

		if (address.length < 3) {
			addressSuggestions = [];
			showSuggestions = false;
			return;
		}

		searchTimeout = setTimeout(async () => {
			await searchAddress(address);
		}, 300);
	}

	async function searchAddress(query: string) {
		if (query.length < 3) return;

		isSearching = true;
		try {
			// Limit search to Caucasus region (Georgia, Armenia, Azerbaijan)
			const response = await fetch(
				`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&countrycodes=ge,am,az&limit=5&addressdetails=1`,
				{
					headers: {
						'Accept-Language': 'en'
					}
				}
			);

			if (response.ok) {
				const data = await response.json();
				addressSuggestions = data;
				showSuggestions = data.length > 0;
			}
		} catch (error) {
			console.error('Address search error:', error);
			addressSuggestions = [];
		} finally {
			isSearching = false;
		}
	}

	function selectAddress(suggestion: AddressSuggestion) {
		address = suggestion.display_name;
		addressLat = parseFloat(suggestion.lat);
		addressLng = parseFloat(suggestion.lon);
		addressSuggestions = [];
		showSuggestions = false;
	}

	function handleAddressBlur() {
		// Delay hiding to allow click on suggestion
		setTimeout(() => {
			showSuggestions = false;
		}, 200);
	}

	type RoomOption = 'studio' | '1+1' | '2+1' | '3+1' | '4+1+' | 'house';
	type AdditionalOption =
		| 'balcony'
		| 'noPetRestrictions'
		| 'dishwasher'
		| 'oven'
		| 'bathtub'
		| 'twoPlusBathrooms';
	type HeatingOption = 'central' | 'electric' | 'airCondition' | 'underfloor';
	type CurrencyOption = 'USD' | 'GEL' | 'AMD' | 'AZN';

	// Room options
	const roomOptions: RoomOption[] = ['studio', '1+1', '2+1', '3+1', '4+1+', 'house'];

	// Additional options
	const additionalOptionsList: AdditionalOption[] = [
		'balcony',
		'noPetRestrictions',
		'dishwasher',
		'oven',
		'bathtub',
		'twoPlusBathrooms'
	];

	// Heating options
	const heatingOptions: HeatingOption[] = ['central', 'electric', 'airCondition', 'underfloor'];

	// Currency options
	const currencyOptions: CurrencyOption[] = ['USD', 'GEL', 'AMD', 'AZN'];

	function handlePhotoUpload(event: Event) {
		const input = event.target as HTMLInputElement;
		if (input.files && input.files[0]) {
			const file = input.files[0];
			photos = [file];

			// Create preview
			const reader = new FileReader();
			reader.onload = (e) => {
				photoPreview = e.target?.result as string;
			};
			reader.readAsDataURL(file);
		}
	}

	function removePhoto() {
		photos = [];
		photoPreview = null;
	}

	function toggleAdditionalOption(option: string) {
		if (additionalOptions.includes(option)) {
			additionalOptions = additionalOptions.filter((o) => o !== option);
		} else {
			additionalOptions = [...additionalOptions, option];
		}
	}

	function toggleHeating(option: string) {
		if (heating.includes(option)) {
			heating = heating.filter((h) => h !== option);
		} else {
			heating = [...heating, option];
		}
	}

	function validateForm(): boolean {
		const newErrors: Record<string, string> = {};

		if (!hasCoordinates && !address.trim()) {
			newErrors.address = get(t)('fieldRequired');
		}

		if (!price.trim()) {
			newErrors.price = get(t)('fieldRequired');
		}

		if (!selectedRoom) {
			newErrors.rooms = get(t)('fieldRequired');
		}

		errors = newErrors;
		return Object.keys(newErrors).length === 0;
	}

	function handleSubmit() {
		if (!validateForm()) {
			return;
		}

		isSubmitting = true;

		// Prepare property data
		const propertyData = {
			lat: latParam ? parseFloat(latParam) : addressLat,
			lng: lngParam ? parseFloat(lngParam) : addressLng,
			address: address.trim() || null,
			rentalType: isLandlord ? rentalType : null,
			price: parseFloat(price),
			currency,
			room: selectedRoom,
			additionalOptions,
			heating,
			photos: photos.length > 0 ? photos : null
		};

		console.log('Property data:', propertyData);

		// TODO: Save to backend
		// For now, simulate save and redirect to map
		setTimeout(() => {
			isSubmitting = false;
			// Navigate back to map with success indicator
			// eslint-disable-next-line svelte/no-navigation-without-resolve
			goto(`${resolve('/map')}?property_added=true`);
		}, 1000);
	}

	function handleBack() {
		goto(resolve('/map'));
	}

	function getHeatingLabel(option: HeatingOption): TranslationKey {
		if (option === 'central') return 'centralHeating';
		if (option === 'electric') return 'electricHeating';
		if (option === 'airCondition') return 'airConditionHeating';
		return 'underfloorHeating';
	}
</script>

<div class="property-page">
	<header class="property-header">
		<button class="back-button" onclick={handleBack} aria-label={$t('back')}>
			<span class="back-icon">←</span>
		</button>
		<h1>{$t('addPropertyTitle')}</h1>
	</header>

	<main class="property-content">
		<!-- Address input (only if no coordinates from map) -->
		{#if !hasCoordinates}
			<section class="form-section">
				<h2 class="section-title">{$t('propertyAddress')}</h2>
				<div class="form-group address-group">
					<div class="address-input-wrapper">
						<input
							type="text"
							value={address}
							oninput={handleAddressInput}
							onblur={handleAddressBlur}
							onfocus={() => (showSuggestions = addressSuggestions.length > 0)}
							placeholder={$t('enterAddress')}
							class:error={errors.address}
							autocomplete="off"
						/>
						{#if isSearching}
							<div class="address-spinner"></div>
						{/if}
					</div>
					{#if showSuggestions && addressSuggestions.length > 0}
						<ul class="address-suggestions">
							{#each addressSuggestions as suggestion (`${suggestion.lat}:${suggestion.lon}`)}
								<li>
									<button type="button" onclick={() => selectAddress(suggestion)}>
										{suggestion.display_name}
									</button>
								</li>
							{/each}
						</ul>
					{/if}
					{#if errors.address}
						<span class="error-message">{errors.address}</span>
					{/if}
				</div>
			</section>
		{/if}

		<!-- Photo upload -->
		<section class="form-section">
			<h2 class="section-title">{$t('uploadPhoto')}</h2>
			<div class="photo-upload">
				{#if photoPreview}
					<div class="photo-preview">
						<img src={photoPreview} alt="Property preview" />
						<button class="remove-photo" onclick={removePhoto}>×</button>
					</div>
				{:else}
					<label class="upload-button">
						<input type="file" accept="image/*" onchange={handlePhotoUpload} />
						<svg
							width="32"
							height="32"
							viewBox="0 0 24 24"
							fill="none"
							stroke="currentColor"
							stroke-width="2"
						>
							<rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
							<circle cx="8.5" cy="8.5" r="1.5"></circle>
							<polyline points="21 15 16 10 5 21"></polyline>
						</svg>
						<span>{$t('addPhoto')}</span>
					</label>
				{/if}
			</div>
		</section>

		<!-- Rental type (only for landlords) -->
		{#if isLandlord}
			<section class="form-section">
				<h2 class="section-title">{$t('rentalType')}</h2>
				<div class="toggle-group">
					<button
						class="toggle-button"
						class:active={rentalType === 'long-term'}
						onclick={() => (rentalType = 'long-term')}
					>
						{$t('longTermRental')}
					</button>
					<button
						class="toggle-button"
						class:active={rentalType === 'daily'}
						onclick={() => (rentalType = 'daily')}
					>
						{$t('dailyRental')}
					</button>
				</div>
			</section>
		{/if}

		<!-- Price -->
		<section class="form-section">
			<h2 class="section-title">{$t('price')}</h2>
			<div class="price-row">
				<div class="form-group price-input">
					<input type="number" bind:value={price} placeholder="0" class:error={errors.price} />
					{#if errors.price}
						<span class="error-message">{errors.price}</span>
					{/if}
				</div>
				<div class="currency-select">
					{#each currencyOptions as curr (curr)}
						<button
							class="currency-button"
							class:active={currency === curr}
							onclick={() => (currency = curr as typeof currency)}
						>
							{curr}
						</button>
					{/each}
				</div>
			</div>
		</section>

		<!-- Rooms -->
		<section class="form-section">
			<h2 class="section-title">{$t('rooms')}</h2>
			{#if errors.rooms}
				<span class="error-message section-error">{errors.rooms}</span>
			{/if}
			<div class="chip-group">
				{#each roomOptions as room (room)}
					<button
						class="chip"
						class:active={selectedRoom === room}
						onclick={() => (selectedRoom = room)}
					>
						{room === 'studio' ? $t('studio') : room === 'house' ? $t('privateHouse') : room}
					</button>
				{/each}
			</div>
		</section>

		<!-- Additional options -->
		<section class="form-section">
			<h2 class="section-title">{$t('additionalOptions')}</h2>
			<div class="chip-group">
				{#each additionalOptionsList as option (option)}
					<button
						class="chip"
						class:active={additionalOptions.includes(option)}
						onclick={() => toggleAdditionalOption(option)}
					>
						{$t(option)}
					</button>
				{/each}
			</div>
		</section>

		<!-- Heating -->
		<section class="form-section">
			<h2 class="section-title">{$t('heating')}</h2>
			<div class="chip-group">
				{#each heatingOptions as option (option)}
					<button
						class="chip"
						class:active={heating.includes(option)}
						onclick={() => toggleHeating(option)}
					>
						{$t(getHeatingLabel(option))}
					</button>
				{/each}
			</div>
		</section>

		<!-- Submit button -->
		<button class="submit-button" onclick={handleSubmit} disabled={isSubmitting}>
			{isSubmitting ? $t('saving') : $t('confirmProperty')}
		</button>
	</main>
</div>

<style>
	.property-page {
		flex: 1;
		display: flex;
		flex-direction: column;
		background-color: var(--tg-theme-secondary-bg-color, #f4f4f5);
	}

	.property-header {
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

	.property-header h1 {
		margin: 0;
		font-size: 20px;
		font-weight: 700;
		color: var(--tg-theme-text-color, #000000);
	}

	.property-content {
		flex: 1;
		padding: 16px;
		display: flex;
		flex-direction: column;
		gap: 16px;
		overflow-y: auto;
	}

	.form-section {
		background-color: var(--tg-theme-bg-color, #ffffff);
		border-radius: 12px;
		padding: 16px;
	}

	.section-title {
		margin: 0 0 12px;
		font-size: 15px;
		font-weight: 600;
		color: var(--tg-theme-text-color, #000000);
	}

	.form-group {
		display: flex;
		flex-direction: column;
		gap: 6px;
	}

	.form-group input {
		padding: 14px 16px;
		border: 1.5px solid var(--tg-theme-hint-color, #e0e0e0);
		border-radius: 10px;
		font-size: 16px;
		background-color: var(--tg-theme-bg-color, #ffffff);
		color: var(--tg-theme-text-color, #000000);
		outline: none;
	}

	.form-group input:focus {
		border-color: var(--tg-theme-button-color, #3390ec);
	}

	.form-group input::placeholder {
		color: var(--tg-theme-hint-color, #999999);
	}

	.form-group input.error {
		border-color: #e53935;
	}

	.error-message {
		font-size: 12px;
		color: #e53935;
	}

	.section-error {
		display: block;
		margin-bottom: 8px;
	}

	/* Photo upload */
	.photo-upload {
		display: flex;
		justify-content: center;
	}

	.upload-button {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		gap: 8px;
		width: 100%;
		height: 120px;
		border: 2px dashed var(--tg-theme-hint-color, #cccccc);
		border-radius: 12px;
		background-color: transparent;
		color: var(--tg-theme-hint-color, #999999);
		cursor: pointer;
		transition:
			border-color 0.2s,
			color 0.2s;
	}

	.upload-button:hover {
		border-color: var(--tg-theme-button-color, #3390ec);
		color: var(--tg-theme-button-color, #3390ec);
	}

	.upload-button input {
		display: none;
	}

	.upload-button span {
		font-size: 14px;
		font-weight: 500;
	}

	.photo-preview {
		position: relative;
		width: 100%;
		max-width: 200px;
	}

	.photo-preview img {
		width: 100%;
		height: 150px;
		object-fit: cover;
		border-radius: 12px;
	}

	.remove-photo {
		position: absolute;
		top: 8px;
		right: 8px;
		width: 28px;
		height: 28px;
		border: none;
		border-radius: 50%;
		background-color: rgba(0, 0, 0, 0.6);
		color: white;
		font-size: 18px;
		cursor: pointer;
		display: flex;
		align-items: center;
		justify-content: center;
	}

	/* Toggle group */
	.toggle-group {
		display: flex;
		gap: 8px;
	}

	.toggle-button {
		flex: 1;
		padding: 12px 16px;
		border: 1.5px solid var(--tg-theme-hint-color, #e0e0e0);
		border-radius: 10px;
		background-color: transparent;
		color: var(--tg-theme-text-color, #000000);
		font-size: 14px;
		font-weight: 500;
		cursor: pointer;
		transition: all 0.2s;
	}

	.toggle-button.active {
		border-color: var(--tg-theme-button-color, #3390ec);
		background-color: var(--tg-theme-button-color, #3390ec);
		color: var(--tg-theme-button-text-color, #ffffff);
	}

	/* Price row */
	.price-row {
		display: flex;
		gap: 12px;
		align-items: flex-start;
	}

	.price-input {
		flex: 1;
	}

	.currency-select {
		display: flex;
		gap: 4px;
	}

	.currency-button {
		padding: 14px 12px;
		border: 1.5px solid var(--tg-theme-hint-color, #e0e0e0);
		border-radius: 8px;
		background-color: transparent;
		color: var(--tg-theme-text-color, #000000);
		font-size: 13px;
		font-weight: 500;
		cursor: pointer;
		transition: all 0.2s;
	}

	.currency-button.active {
		border-color: var(--tg-theme-button-color, #3390ec);
		background-color: var(--tg-theme-button-color, #3390ec);
		color: var(--tg-theme-button-text-color, #ffffff);
	}

	/* Chip group */
	.chip-group {
		display: flex;
		flex-wrap: wrap;
		gap: 8px;
	}

	.chip {
		padding: 10px 16px;
		border: 1.5px solid var(--tg-theme-hint-color, #e0e0e0);
		border-radius: 20px;
		background-color: transparent;
		color: var(--tg-theme-text-color, #000000);
		font-size: 14px;
		font-weight: 500;
		cursor: pointer;
		transition: all 0.2s;
	}

	.chip.active {
		border-color: var(--tg-theme-button-color, #3390ec);
		background-color: var(--tg-theme-button-color, #3390ec);
		color: var(--tg-theme-button-text-color, #ffffff);
	}

	.chip:active {
		transform: scale(0.95);
	}

	/* Submit button */
	.submit-button {
		margin-top: 8px;
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

	/* Address autosuggest */
	.address-group {
		position: relative;
	}

	.address-input-wrapper {
		position: relative;
	}

	.address-input-wrapper input {
		width: 100%;
		padding-right: 40px;
	}

	.address-spinner {
		position: absolute;
		right: 14px;
		top: 50%;
		transform: translateY(-50%);
		width: 18px;
		height: 18px;
		border: 2px solid var(--tg-theme-hint-color, #e0e0e0);
		border-top-color: var(--tg-theme-button-color, #3390ec);
		border-radius: 50%;
		animation: spin 0.8s linear infinite;
	}

	@keyframes spin {
		to {
			transform: translateY(-50%) rotate(360deg);
		}
	}

	.address-suggestions {
		position: absolute;
		top: 100%;
		left: 0;
		right: 0;
		margin: 4px 0 0;
		padding: 0;
		list-style: none;
		background-color: var(--tg-theme-bg-color, #ffffff);
		border: 1.5px solid var(--tg-theme-hint-color, #e0e0e0);
		border-radius: 10px;
		box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
		z-index: 100;
		max-height: 200px;
		overflow-y: auto;
	}

	.address-suggestions li {
		border-bottom: 1px solid var(--tg-theme-secondary-bg-color, #f4f4f5);
	}

	.address-suggestions li:last-child {
		border-bottom: none;
	}

	.address-suggestions button {
		width: 100%;
		padding: 12px 16px;
		border: none;
		background: transparent;
		color: var(--tg-theme-text-color, #000000);
		font-size: 14px;
		text-align: left;
		cursor: pointer;
		line-height: 1.4;
	}

	.address-suggestions button:hover {
		background-color: var(--tg-theme-secondary-bg-color, #f4f4f5);
	}

	.address-suggestions button:active {
		background-color: var(--tg-theme-button-color, #3390ec);
		color: var(--tg-theme-button-text-color, #ffffff);
	}
</style>
