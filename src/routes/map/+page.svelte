<script lang="ts">
	import { onMount } from 'svelte';
	import { browser } from '$app/environment';
	import { t, type TranslationKey } from '$lib/i18n';
	import { get } from 'svelte/store';
	import { goto } from '$app/navigation';
	import { resolve } from '$app/paths';
	import { findCityById } from '$lib/data/locations';
	import { user } from '$lib/stores/user';
	import { filters } from '$lib/stores/filters';
	import { tg } from '$lib/telegram';

	let mapContainer: HTMLDivElement;
	let map: L.Map | null = null;
	let userMarker: L.Marker | null = null;
	let propertyMarker: L.Marker | null = null;
	let L: typeof import('leaflet') | null = null;

	let isLoading = $state(true);
	let locationError = $state<string | null>(null);
	let telegramPermissionDenied = $state(false);
	let detectedLocation = $state<{ lat: number; lng: number } | null>(null);
	let activeFilterCount = $derived(filters.getActiveCount($filters));
	let propertyLocation = $state<{ lat: number; lng: number } | null>(null);
	let showAddPropertyHint = $state(false);

	// Get user role
	let currentUser = $state(get(user));
	let isPropertyOwner = $derived(
		currentUser?.role === 'landlord' || currentUser?.role === 'seller'
	);

	// Default to Caucasus region center (Tbilisi)
	const defaultCenter: [number, number] = [41.7151, 44.8271];
	const defaultZoom = 10;
	const LOCATION_CACHE_KEY = 'rent-caucasus:last-known-location';

	// Helper to get translation in async context
	function tr(key: TranslationKey): string {
		return get(t)(key);
	}

	function loadCachedLocation(): { lat: number; lng: number } | null {
		if (!browser) return null;
		try {
			const raw = sessionStorage.getItem(LOCATION_CACHE_KEY);
			if (!raw) return null;
			const parsed = JSON.parse(raw) as { lat?: number; lng?: number };
			if (typeof parsed.lat !== 'number' || typeof parsed.lng !== 'number') return null;
			return { lat: parsed.lat, lng: parsed.lng };
		} catch {
			return null;
		}
	}

	function persistLocation(lat: number, lng: number) {
		if (!browser) return;
		try {
			sessionStorage.setItem(LOCATION_CACHE_KEY, JSON.stringify({ lat, lng }));
		} catch {
			// ignore cache write errors
		}
	}

	function handleLocationFailure(errorKey: TranslationKey, permissionDenied = false) {
		// If we already have a known location, keep using it and avoid showing error overlay.
		if (detectedLocation) {
			console.log('Location request failed, using cached location');
			telegramPermissionDenied = false;
			locationError = null;
			isLoading = false;
			return;
		}

		telegramPermissionDenied = permissionDenied;
		locationError = tr(errorKey);
		isLoading = false;
	}

	onMount(() => {
		if (!browser) return;

		// Subscribe to user store
		const unsubscribe = user.subscribe((value) => {
			currentUser = value;
		});
		const unsubscribeFilters = filters.subscribe(() => {
			if (!map || isPropertyOwner) return;
			if (!focusOnSearchLocation()) {
				goto(resolve('/search-location'));
			}
		});

		if (isPropertyOwner) {
			detectedLocation = loadCachedLocation();
			if (detectedLocation) {
				isLoading = false;
			}
			requestLocation();
		}
		initMap();

		return () => {
			map?.off();
			map?.remove();
			map = null;
			L = null;
			userMarker = null;
			propertyMarker = null;
			unsubscribe();
			unsubscribeFilters();
		};
	});

	async function initMap() {
		try {
			// Import Leaflet
			L = await import('leaflet');

			// Fix Leaflet default marker icon issue
			delete (L.Icon.Default.prototype as unknown as Record<string, unknown>)._getIconUrl;
			L.Icon.Default.mergeOptions({
				iconRetinaUrl:
					'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
				iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
				shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png'
			});

			// Initialize map
			map = L.map(mapContainer).setView(defaultCenter, defaultZoom);

			// Add OpenStreetMap tiles
			L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
				attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
				maxZoom: 19
			}).addTo(map);

			// Add click listener for property owners
			map.on('click', handleMapClick);

			// If location was detected before map initialization, apply it now
			if (isPropertyOwner && detectedLocation) {
				showUserLocation(detectedLocation.lat, detectedLocation.lng);
			}

			if (!isPropertyOwner) {
				const isLocationApplied = focusOnSearchLocation();
				if (!isLocationApplied) {
					goto(resolve('/search-location'));
				}
			}
		} catch (err) {
			console.error('Map init error:', err);
			isLoading = false;
		}
	}

	function focusOnSearchLocation(): boolean {
		if (!map) return false;

		const currentFilters = get(filters);
		const city = findCityById(currentFilters.countryId, currentFilters.cityId);
		if (!city) {
			return false;
		}

		if (userMarker) {
			userMarker.remove();
			userMarker = null;
		}

		map.setView([city.lat, city.lng], city.zoom ?? 12);
		isLoading = false;
		locationError = null;
		return true;
	}

	function requestLocation() {
		console.log('Requesting location...');
		locationError = null;
		telegramPermissionDenied = false;
		let hasFallenBack = false;

		const fallbackToBrowser = () => {
			if (hasFallenBack) return;
			hasFallenBack = true;
			requestBrowserLocation();
		};

		const locationManager = tg?.LocationManager;
		if (locationManager) {
			let telegramRequestCompleted = false;
			const telegramTimeoutId = setTimeout(() => {
				if (telegramRequestCompleted) return;
				console.log('Telegram location timed out, falling back to browser geolocation');
				fallbackToBrowser();
			}, 2500);

			try {
				const requestFromTelegram = () => {
					locationManager.getLocation((location) => {
						telegramRequestCompleted = true;
						clearTimeout(telegramTimeoutId);

						if (location) {
							console.log('Telegram location received');
							detectedLocation = {
								lat: location.latitude,
								lng: location.longitude
							};
							persistLocation(location.latitude, location.longitude);
							showUserLocation(location.latitude, location.longitude);
							return;
						}

						if (locationManager.isAccessRequested && !locationManager.isAccessGranted) {
							console.log('Telegram location permission denied');
							handleLocationFailure('locationPermissionDenied', true);
							return;
						}

						console.log('Telegram location unavailable, falling back to browser geolocation');
						fallbackToBrowser();
					});
				};

				if (locationManager.isInited) {
					requestFromTelegram();
				} else {
					locationManager.init(requestFromTelegram);
				}
				return;
			} catch (err) {
				clearTimeout(telegramTimeoutId);
				telegramRequestCompleted = true;
				console.error('Telegram location error:', err);
			}
		}

		fallbackToBrowser();
	}

	function requestBrowserLocation() {
		if (!navigator.geolocation) {
			console.error('Geolocation not supported');
			handleLocationFailure('geolocationNotSupported');
			return;
		}

		// Request location with timeout
		const timeoutId = setTimeout(() => {
			console.error('Location request timed out');
			handleLocationFailure('locationTimeout');
		}, 10000);

		navigator.geolocation.getCurrentPosition(
			(position) => {
				clearTimeout(timeoutId);
				console.log('Browser location received:', position.coords);
				detectedLocation = {
					lat: position.coords.latitude,
					lng: position.coords.longitude
				};
				persistLocation(position.coords.latitude, position.coords.longitude);
				showUserLocation(position.coords.latitude, position.coords.longitude);
			},
			(error) => {
				clearTimeout(timeoutId);
				console.error('Geolocation error:', error.code, error.message);

				switch (error.code) {
					case 1:
						handleLocationFailure('locationPermissionDenied');
						break;
					case 2:
						handleLocationFailure('locationUnavailable');
						break;
					case 3:
						handleLocationFailure('locationTimeout');
						break;
					default:
						handleLocationFailure('locationError');
				}
			},
			{
				enableHighAccuracy: false,
				timeout: 5000,
				maximumAge: 300000
			}
		);
	}

	function showUserLocation(lat: number, lng: number) {
		if (!map || !L) return;

		// Property owners see city-level map without personal marker.
		map.setView([lat, lng], 12);
		if (userMarker) {
			userMarker.remove();
			userMarker = null;
		}

		isLoading = false;
		locationError = null;
	}

	function handleFilters() {
		goto(resolve('/filters'));
	}

	function handleSettings() {
		goto(resolve('/settings'));
	}

	function handleMapClick(e: L.LeafletMouseEvent) {
		// Only allow property owners to place markers
		if (!isPropertyOwner || !map || !L) return;

		const { lat, lng } = e.latlng;
		placePropertyMarker(lat, lng);
	}

	function placePropertyMarker(lat: number, lng: number) {
		if (!map || !L) return;

		// Remove existing property marker
		if (propertyMarker) {
			propertyMarker.remove();
		}

		// Create a custom icon for property marker
		const propertyIcon = L.divIcon({
			className: 'property-marker',
			html: `<div class="property-marker-inner">
				<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2">
					<path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
					<polyline points="9 22 9 12 15 12 15 22"></polyline>
				</svg>
			</div>`,
			iconSize: [40, 40],
			iconAnchor: [20, 40]
		});

		// Add marker
		propertyMarker = L.marker([lat, lng], {
			icon: propertyIcon,
			draggable: true
		}).addTo(map);

		// Update location on drag
		propertyMarker.on('dragend', () => {
			const pos = propertyMarker?.getLatLng();
			if (pos) {
				propertyLocation = { lat: pos.lat, lng: pos.lng };
			}
		});

		propertyLocation = { lat, lng };
		showAddPropertyHint = false;

		// Center map on the marker
		map.setView([lat, lng], map.getZoom());
	}

	function handleAddProperty() {
		if (propertyLocation) {
			// Navigate to property form with location from map
			// eslint-disable-next-line svelte/no-navigation-without-resolve
			goto(`${resolve('/property/add')}?lat=${propertyLocation.lat}&lng=${propertyLocation.lng}`);
		} else {
			// Navigate to property form where user can enter address
			goto(resolve('/property/add'));
		}
	}

	function handleRetry() {
		if (telegramPermissionDenied) {
			tg?.LocationManager?.openSettings();
			return;
		}
		isLoading = true;
		locationError = null;
		requestLocation();
	}

	function handleSkip() {
		isLoading = false;
		locationError = null;
	}

	function handleBack() {
		goto(resolve('/'));
	}

	function dismissError() {
		locationError = null;
	}
</script>

<svelte:head>
	<link
		rel="stylesheet"
		href="https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.css"
	/>
</svelte:head>

<div class="map-page">
	<header class="map-header" class:map-header--owner={isPropertyOwner}>
		<button class="back-button" onclick={handleBack} aria-label={$t('back')}>
			<span class="back-icon">←</span>
		</button>
		<h1>{isPropertyOwner ? $t('addPropertyTitle') : $t('mapTitle')}</h1>
		{#if isPropertyOwner}
			<div class="owner-actions">
				<button class="settings-button" onclick={handleSettings}>
					<svg
						width="18"
						height="18"
						viewBox="0 0 24 24"
						fill="none"
						stroke="currentColor"
						stroke-width="2"
					>
						<circle cx="12" cy="12" r="3"></circle>
						<path
							d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09a1.65 1.65 0 0 0-1-1.51 1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06A1.65 1.65 0 0 0 4.6 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06A1.65 1.65 0 0 0 8.92 4a1.65 1.65 0 0 0 1-1.51V2a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9c.2.61.76 1.02 1.4 1.05H21a2 2 0 0 1 0 4h-.09c-.64.03-1.2.44-1.51 1.05z"
						></path>
					</svg>
					<span>{$t('accountSettings')}</span>
				</button>
				<button class="add-property-button" onclick={handleAddProperty}>
					<svg
						width="20"
						height="20"
						viewBox="0 0 24 24"
						fill="none"
						stroke="currentColor"
						stroke-width="2"
					>
						<line x1="12" y1="5" x2="12" y2="19"></line>
						<line x1="5" y1="12" x2="19" y2="12"></line>
					</svg>
					<span>{$t('addProperty')}</span>
				</button>
			</div>
		{:else}
			<button class="filter-button" onclick={handleFilters}>
				<svg
					width="20"
					height="20"
					viewBox="0 0 24 24"
					fill="none"
					stroke="currentColor"
					stroke-width="2"
				>
					<polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"></polygon>
				</svg>
				<span>{$t('filters')}</span>
				{#if activeFilterCount > 0}
					<span class="filter-badge">{activeFilterCount}</span>
				{/if}
			</button>
		{/if}
	</header>

	<div class="map-container" bind:this={mapContainer}>
		{#if isLoading && isPropertyOwner}
			<div class="map-overlay">
				<div class="loading-spinner"></div>
				<p>{$t('loadingLocation')}</p>
				<button class="skip-button" onclick={handleSkip}>
					{$t('skip')}
				</button>
			</div>
		{/if}

		{#if locationError && isPropertyOwner}
			<div class="map-overlay map-overlay--error">
				<p class="error-message">{locationError}</p>
				<p class="error-hint">{$t('mapShowingDefault')}</p>
				<div class="button-row">
					<button class="retry-button" onclick={handleRetry}>
						{$t('retry')}
					</button>
					<button class="dismiss-button" onclick={dismissError}>
						{$t('ok')}
					</button>
				</div>
			</div>
		{/if}

		{#if showAddPropertyHint && isPropertyOwner}
			<div class="map-overlay map-overlay--hint">
				<p class="hint-message">{$t('tapToPlaceMarker')}</p>
				<button class="dismiss-button" onclick={() => (showAddPropertyHint = false)}>
					{$t('ok')}
				</button>
			</div>
		{/if}

		{#if propertyLocation && isPropertyOwner}
			<div class="property-info-bar">
				<p>{$t('propertyLocationSet')}</p>
				<button class="confirm-location-button" onclick={handleAddProperty}>
					{$t('confirmAndContinue')}
				</button>
			</div>
		{/if}
	</div>
</div>

<style>
	.map-page {
		flex: 1;
		display: flex;
		flex-direction: column;
		height: 100%;
		width: 100%;
		overflow: hidden;
	}

	.map-header {
		display: flex;
		align-items: center;
		gap: 12px;
		padding: 12px 16px;
		background-color: var(--tg-theme-bg-color, #ffffff);
		z-index: 1000;
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

	.map-header h1 {
		flex: 1;
		min-width: 0;
		margin: 0;
		font-size: 20px;
		font-weight: 700;
		color: var(--tg-theme-text-color, #000000);
	}

	.filter-button {
		display: flex;
		align-items: center;
		gap: 6px;
		padding: 8px 12px;
		border: 1.5px solid var(--tg-theme-secondary-bg-color, #e0e0e0);
		border-radius: 10px;
		background-color: var(--tg-theme-bg-color, #ffffff);
		color: var(--tg-theme-text-color, #000000);
		font-size: 14px;
		font-weight: 500;
		cursor: pointer;
		position: relative;
		max-width: 100%;
		min-width: 0;
	}

	.filter-button:active {
		transform: scale(0.95);
	}

	.filter-button svg {
		flex-shrink: 0;
	}

	.filter-badge {
		display: flex;
		align-items: center;
		justify-content: center;
		min-width: 18px;
		height: 18px;
		padding: 0 5px;
		border-radius: 9px;
		background-color: var(--tg-theme-button-color, #3390ec);
		color: var(--tg-theme-button-text-color, #ffffff);
		font-size: 11px;
		font-weight: 600;
	}

	.map-container {
		flex: 1;
		position: relative;
		min-height: 400px;
	}

	.map-container :global(.leaflet-container) {
		height: 100%;
		width: 100%;
	}

	.map-overlay {
		position: absolute;
		top: 50%;
		left: 50%;
		transform: translate(-50%, -50%);
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 12px;
		padding: 24px;
		background-color: var(--tg-theme-bg-color, rgba(255, 255, 255, 0.95));
		border-radius: 12px;
		box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
		z-index: 1000;
		text-align: center;
	}

	.map-overlay--error {
		max-width: 280px;
	}

	.loading-spinner {
		width: 40px;
		height: 40px;
		border: 3px solid var(--tg-theme-secondary-bg-color, #f4f4f5);
		border-top-color: var(--tg-theme-button-color, #3390ec);
		border-radius: 50%;
		animation: spin 1s linear infinite;
	}

	@keyframes spin {
		to {
			transform: rotate(360deg);
		}
	}

	.map-overlay p {
		margin: 0;
		font-size: 14px;
		color: var(--tg-theme-text-color, #000000);
	}

	.error-message {
		font-weight: 500;
	}

	.error-hint {
		font-size: 13px !important;
		color: var(--tg-theme-hint-color, #999999) !important;
	}

	.button-row {
		display: flex;
		gap: 8px;
		margin-top: 8px;
	}

	.skip-button {
		margin-top: 8px;
		padding: 8px 24px;
		border: none;
		border-radius: 8px;
		background-color: transparent;
		color: var(--tg-theme-hint-color, #999999);
		font-size: 14px;
		font-weight: 500;
		cursor: pointer;
		text-decoration: underline;
	}

	.skip-button:active {
		opacity: 0.7;
	}

	.retry-button {
		padding: 10px 20px;
		border: 1.5px solid var(--tg-theme-button-color, #3390ec);
		border-radius: 8px;
		background-color: transparent;
		color: var(--tg-theme-button-color, #3390ec);
		font-size: 14px;
		font-weight: 600;
		cursor: pointer;
	}

	.retry-button:active {
		transform: scale(0.98);
		background-color: var(--tg-theme-secondary-bg-color, #f4f4f5);
	}

	.dismiss-button {
		padding: 10px 20px;
		border: none;
		border-radius: 8px;
		background-color: var(--tg-theme-button-color, #3390ec);
		color: var(--tg-theme-button-text-color, #ffffff);
		font-size: 14px;
		font-weight: 600;
		cursor: pointer;
	}

	.dismiss-button:active {
		transform: scale(0.98);
	}

	.add-property-button {
		display: flex;
		align-items: center;
		gap: 6px;
		padding: 8px 12px;
		border: none;
		border-radius: 10px;
		background-color: var(--tg-theme-button-color, #3390ec);
		color: var(--tg-theme-button-text-color, #ffffff);
		font-size: 14px;
		font-weight: 500;
		cursor: pointer;
		white-space: nowrap;
		min-width: 0;
	}

	.owner-actions {
		display: flex;
		align-items: center;
		gap: 8px;
		flex-shrink: 0;
		max-width: 100%;
		min-width: 0;
	}

	.settings-button {
		display: flex;
		align-items: center;
		gap: 6px;
		padding: 8px 12px;
		border: 1.5px solid var(--tg-theme-secondary-bg-color, #e0e0e0);
		border-radius: 10px;
		background-color: var(--tg-theme-bg-color, #ffffff);
		color: var(--tg-theme-text-color, #000000);
		font-size: 14px;
		font-weight: 500;
		cursor: pointer;
		white-space: nowrap;
		min-width: 0;
		max-width: 100%;
	}

	.settings-button:active {
		transform: scale(0.95);
	}

	.add-property-button:active {
		transform: scale(0.95);
	}

	.add-property-button svg {
		flex-shrink: 0;
	}

	.settings-button span,
	.add-property-button span,
	.filter-button span {
		overflow: hidden;
		text-overflow: ellipsis;
	}

	.map-overlay--hint {
		max-width: 260px;
	}

	.hint-message {
		font-weight: 500;
	}

	:global(.property-marker) {
		background: transparent;
		border: none;
	}

	:global(.property-marker-inner) {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 40px;
		height: 40px;
		background-color: var(--tg-theme-button-color, #3390ec);
		border-radius: 50% 50% 50% 0;
		transform: rotate(-45deg);
		box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
	}

	:global(.property-marker-inner svg) {
		transform: rotate(45deg);
	}

	.property-info-bar {
		position: absolute;
		bottom: 0;
		left: 0;
		right: 0;
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 12px;
		padding: 16px;
		background-color: var(--tg-theme-bg-color, rgba(255, 255, 255, 0.95));
		box-shadow: 0 -2px 12px rgba(0, 0, 0, 0.1);
		z-index: 1000;
	}

	.property-info-bar p {
		margin: 0;
		font-size: 14px;
		font-weight: 500;
		color: var(--tg-theme-text-color, #000000);
	}

	.confirm-location-button {
		padding: 10px 16px;
		border: none;
		border-radius: 8px;
		background-color: var(--tg-theme-button-color, #3390ec);
		color: var(--tg-theme-button-text-color, #ffffff);
		font-size: 14px;
		font-weight: 600;
		cursor: pointer;
		white-space: nowrap;
	}

	.confirm-location-button:active {
		transform: scale(0.98);
	}

	@media (max-width: 768px) {
		.map-header.map-header--owner {
			display: grid;
			grid-template-columns: 40px 1fr;
			grid-template-areas:
				'back title'
				'actions actions';
			row-gap: 10px;
		}

		.map-header.map-header--owner .back-button {
			grid-area: back;
		}

		.map-header.map-header--owner h1 {
			grid-area: title;
			font-size: 18px;
		}

		.owner-actions {
			grid-area: actions;
			display: grid;
			grid-template-columns: 1fr 1fr;
			width: 100%;
		}

		.settings-button,
		.add-property-button {
			width: 100%;
			justify-content: center;
		}
	}

	@media (max-width: 420px) {
		.map-header {
			padding: 10px 12px;
			gap: 8px;
		}

		.settings-button span,
		.add-property-button span {
			display: none;
		}

		.settings-button,
		.add-property-button {
			padding: 10px;
			justify-content: center;
		}
	}
</style>
