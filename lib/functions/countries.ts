export interface CountryData {
	name: string;
}

interface Country {
	name: string;
}

export const fetchCountriesInEurope = () => {
	const europeanCountries: Country[] = [
		{ name: 'Åland Islands' },
		{ name: 'Albania' },
		{ name: 'Andorra' },
		{ name: 'Austria' },
		{ name: 'Belarus' },
		{ name: 'Belgium' },
		{ name: 'Bosnia and Herzegovina' },
		{ name: 'Bulgaria' },
		{ name: 'Croatia' },
		{ name: 'Cyprus' },
		{ name: 'Czechia' },
		{ name: 'Denmark' },
		{ name: 'Estonia' },
		{ name: 'Faroe Islands' },
		{ name: 'Finland' },
		{ name: 'France' },
		{ name: 'Germany' },
		{ name: 'Gibraltar' },
		{ name: 'Greece' },
		{ name: 'Guernsey' },
		{ name: 'Hungary' },
		{ name: 'Iceland' },
		{ name: 'Ireland' },
		{ name: 'Isle of Man' },
		{ name: 'Italy' },
		{ name: 'Jersey' },
		{ name: 'Kosovo' },
		{ name: 'Latvia' },
		{ name: 'Liechtenstein' },
		{ name: 'Lithuania' },
		{ name: 'Luxembourg' },
		{ name: 'Malta' },
		{ name: 'Moldova' },
		{ name: 'Monaco' },
		{ name: 'Montenegro' },
		{ name: 'Netherlands' },
		{ name: 'North Macedonia' },
		{ name: 'Norway' },
		{ name: 'Poland' },
		{ name: 'Portugal' },
		{ name: 'Romania' },
		{ name: 'Russia' },
		{ name: 'San Marino' },
		{ name: 'Serbia' },
		{ name: 'Slovakia' },
		{ name: 'Slovenia' },
		{ name: 'Spain' },
		{ name: 'Svalbard and Jan Mayen' },
		{ name: 'Sweden' },
		{ name: 'Switzerland' },
		{ name: 'Ukraine' },
		{ name: 'United Kingdom' },
		{ name: 'Vatican City' },
	];

	return europeanCountries;
};
