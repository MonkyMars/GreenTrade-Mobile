const ecoAttributeWeights: { [key: string]: number } = {
  'Second-hand': 1.2,
  Refurbished: 1.2,
  Upcycled: 1.2,
  'Locally Made': 0.8,
  'Organic Material': 1.2,
  Biodegradable: 1.2,
  'Energy Efficient': 1.2,
  'Plastic-free': 1.2,
  Vegan: 0.8,
  Handmade: 0.8,
  Repaired: 1.2,
}

export const calculateEcoScore = (ecoAttributes: string[]): number => {
  const maxScore = Object.values(ecoAttributeWeights).reduce((a, b) => a + b, 0)

  const totalScore = ecoAttributes.reduce((score, attribute) => {
    if (ecoAttributeWeights[attribute]) {
      return score + ecoAttributeWeights[attribute]
    }
    return score
  }, 0)

  const ecoScore = Math.pow(totalScore / maxScore, 0.25) * 5

  return Math.round(ecoScore * 10) / 10
}
