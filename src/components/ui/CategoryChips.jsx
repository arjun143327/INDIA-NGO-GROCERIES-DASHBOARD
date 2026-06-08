export const CATEGORIES = [
  { id: 'All', label: 'All' },
  { id: 'Rice & grains', label: 'Rice & Grains' },
  { id: 'Vegetables', label: 'Vegetables' },
  { id: 'Dal / pulses', label: 'Dal' },
  { id: 'Spices & masala', label: 'Spices' },
  { id: 'Dairy & protein', label: 'Dairy' },
  { id: 'Snacks / packaged items', label: 'Snacks' }
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
