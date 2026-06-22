export function getUsageConversion(itemName, inventoryUnit) {
  const name = (itemName || '').toLowerCase()
  
  // Explicit overrides requested by user to be tracked in Nos
  if (/(lemon|banana|coconut|egg|keerai)/i.test(name)) {
    return { usageUnit: 'nos', factor: 1 }
  }

  if (inventoryUnit === 'kg') {
    // Specific exceptions
    if (name.includes('ragi flour') || name.includes('horlicks')) {
      return { usageUnit: 'grams', factor: 1000 }
    }
    // Staples / heavy items used in kg
    if (/(rice|dal|flour|vermicelli|mutton|chicken|gram|peas|rava|chickpeas)/i.test(name)) {
      return { usageUnit: 'kg', factor: 1 }
    }
    // Vegetables, spices, powders, sugar, etc., used in grams
    return { usageUnit: 'grams', factor: 1000 }
  }

  if (inventoryUnit === 'L' || inventoryUnit === 'litre') {
    return { usageUnit: 'ml', factor: 1000 }
  }

  // Fallback: use inventory unit as is
  return { usageUnit: inventoryUnit, factor: 1 }
}
