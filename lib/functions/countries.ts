export interface CountryData {
  name: string
}

interface CountryResponse {
  name: { common: string }
}

export const fetchCountriesInEurope = async () => {
  const response = await fetch('https://restcountries.com/v3.1/region/europe')
  const data = await response.json()

  const countries: CountryResponse[] = data

  const countryData: CountryData[] = countries
    .sort((a, b) => a.name.common.localeCompare(b.name.common)) // Sort by country name
    .map(country => ({
      name: country.name.common,
    }))
  return countryData
}
