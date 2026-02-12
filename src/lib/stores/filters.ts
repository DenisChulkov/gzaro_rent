import { writable } from 'svelte/store';

export type Category = 'rental' | 'sale';
export type RentalType = 'long-term' | 'daily';
export type Currency = 'USD' | 'local';
export type RoomType = 'studio' | '1+1' | '2+1' | '3+1' | '4+1' | 'house';
export type HeatingType = 'central' | 'electric' | 'airCondition' | 'underfloor';

export interface FiltersState {
	// Location
	countryId: string;
	cityId: string;
	// Category
	category: Category;
	// Rental specific
	rentalType: RentalType;
	currency: Currency;
	priceMin: string;
	priceMax: string;
	rooms: RoomType[];
	// Additional options
	additionalOptions: string[];
	// Heating
	heating: HeatingType[];
}

const defaultFilters: FiltersState = {
	countryId: '',
	cityId: '',
	category: 'rental',
	rentalType: 'long-term',
	currency: 'USD',
	priceMin: '',
	priceMax: '',
	rooms: [],
	additionalOptions: [],
	heating: []
};

function createFiltersStore() {
	const { subscribe, set, update } = writable<FiltersState>(defaultFilters);

	return {
		subscribe,
		setCountry: (countryId: string) => update((f) => ({ ...f, countryId, cityId: '' })),
		setCity: (cityId: string) => update((f) => ({ ...f, cityId })),
		setCategory: (category: Category) => update((f) => ({ ...f, category })),
		setRentalType: (rentalType: RentalType) => update((f) => ({ ...f, rentalType })),
		setCurrency: (currency: Currency) => update((f) => ({ ...f, currency })),
		setPriceMin: (priceMin: string) => update((f) => ({ ...f, priceMin })),
		setPriceMax: (priceMax: string) => update((f) => ({ ...f, priceMax })),
		toggleRoom: (room: RoomType) =>
			update((f) => ({
				...f,
				rooms: f.rooms.includes(room) ? f.rooms.filter((r) => r !== room) : [...f.rooms, room]
			})),
		toggleAdditionalOption: (option: string) =>
			update((f) => ({
				...f,
				additionalOptions: f.additionalOptions.includes(option)
					? f.additionalOptions.filter((o) => o !== option)
					: [...f.additionalOptions, option]
			})),
		toggleHeating: (heating: HeatingType) =>
			update((f) => ({
				...f,
				heating: f.heating.includes(heating)
					? f.heating.filter((h) => h !== heating)
					: [...f.heating, heating]
			})),
		reset: () => set(defaultFilters),
		getActiveCount: (state: FiltersState): number => {
			let count = 0;
			if (state.countryId) count++;
			if (state.cityId) count++;
			if (state.priceMin || state.priceMax) count++;
			if (state.rooms.length > 0) count++;
			if (state.additionalOptions.length > 0) count++;
			if (state.heating.length > 0) count++;
			return count;
		}
	};
}

export const filters = createFiltersStore();
