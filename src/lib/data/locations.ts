export interface City {
	id: string;
	name: string;
	lat: number;
	lng: number;
	zoom?: number;
}

export interface Country {
	id: string;
	name: string;
	currency: string;
	cities: City[];
}

export const countriesData: Country[] = [
	{
		id: 'ge',
		name: 'Georgia',
		currency: 'GEL',
		cities: [
			{ id: 'tbilisi', name: 'Tbilisi', lat: 41.7151, lng: 44.8271, zoom: 12 },
			{ id: 'batumi', name: 'Batumi', lat: 41.6168, lng: 41.6367, zoom: 12 },
			{ id: 'kutaisi', name: 'Kutaisi', lat: 42.2662, lng: 42.718, zoom: 12 }
		]
	},
	{
		id: 'am',
		name: 'Armenia',
		currency: 'AMD',
		cities: [
			{ id: 'yerevan', name: 'Yerevan', lat: 40.1772, lng: 44.5035, zoom: 12 },
			{ id: 'gyumri', name: 'Gyumri', lat: 40.7894, lng: 43.8475, zoom: 12 }
		]
	},
	{
		id: 'az',
		name: 'Azerbaijan',
		currency: 'AZN',
		cities: [
			{ id: 'baku', name: 'Baku', lat: 40.4093, lng: 49.8671, zoom: 12 },
			{ id: 'ganja', name: 'Ganja', lat: 40.6828, lng: 46.3606, zoom: 12 }
		]
	}
];

export function findCountryById(countryId: string | null | undefined): Country | null {
	if (!countryId) return null;
	return countriesData.find((country) => country.id === countryId) ?? null;
}

export function findCityById(
	countryId: string | null | undefined,
	cityId: string | null | undefined
): City | null {
	if (!countryId || !cityId) return null;
	const country = findCountryById(countryId);
	if (!country) return null;
	return country.cities.find((city) => city.id === cityId) ?? null;
}
