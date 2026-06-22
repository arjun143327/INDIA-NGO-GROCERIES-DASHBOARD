export const CATEGORIES = [
  { id: 'All', label: 'All' },
  { id: 'Masala / Spices', label: 'Masala / Spices' },
  { id: 'Rice Items', label: 'Rice' },
  { id: 'Flour Items', label: 'Flour' },
  { id: 'Milk / Health Drink', label: 'Milk / Drink' },
  { id: 'Vegetables', label: 'Vegetables' },
  { id: 'Snacks / Side Items', label: 'Snacks' },
  { id: 'Dal / Pulses', label: 'Dal' },
  { id: 'Oil / Ghee', label: 'Oil / Ghee' },
  { id: 'Sweet Items', label: 'Sweets' },
  { id: 'Other Items', label: 'Others' },
  { id: 'Greens / Leaves', label: 'Greens' },
  { id: 'Fruits', label: 'Fruits' },
  { id: 'Non-Veg Items', label: 'Non-Veg' }
]

export default function CategoryChips({ selectedCategory, onSelectCategory }) {
  return (
    <div className="flex flex-wrap gap-1.5 mb-2">
      {CATEGORIES.map(category => (
        <button
          key={category.id}
          type="button"
          onClick={() => onSelectCategory(category.id)}
          className={`px-2.5 py-1 rounded-full text-[11px] font-medium transition-colors ${
            selectedCategory === category.id
              ? 'bg-app-greenMid text-white shadow-sm'
              : 'bg-gray-100 text-app-textSecondary hover:bg-gray-200'
          }`}
        >
          {category.label}
        </button>
      ))}
    </div>
  )
}
