import { useState, useRef, useEffect, useMemo } from 'react'
import { Search, ChevronDown } from 'lucide-react'

export default function SearchableDropdown({ items, value, onChange, placeholder = "Search or select an item..." }) {
  const [isOpen, setIsOpen] = useState(false)
  const [query, setQuery] = useState('')
  const dropdownRef = useRef(null)

  // Handle outside click
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  const selectedItem = useMemo(() => items.find(i => i.id === value), [items, value])

  const filteredItems = useMemo(() => {
    if (!query) return items
    const lowerQuery = query.toLowerCase()
    return items.filter(item => {
      const nameEn = (item.name_en || '').toLowerCase()
      const nameTa = (item.name_ta || '').toLowerCase()
      const combined = (item.name || '').toLowerCase()
      return nameEn.includes(lowerQuery) || nameTa.includes(lowerQuery) || combined.includes(lowerQuery)
    })
  }, [items, query])

  return (
    <div className="relative w-full" ref={dropdownRef}>
      <div 
        className="flex h-[36px] w-full items-center justify-between rounded-[6px] border border-app-border bg-white px-3 cursor-pointer hover:border-app-greenMid"
        onClick={() => setIsOpen(!isOpen)}
      >
        <span className={`text-[13px] truncate ${selectedItem ? 'text-app-textPrimary' : 'text-app-textSecondary'}`}>
          {selectedItem 
            ? (selectedItem.name_en ? `${selectedItem.name_en} (${selectedItem.name_ta})` : selectedItem.name) 
            : placeholder}
        </span>
        <ChevronDown size={14} className="text-app-textSecondary" />
      </div>

      {isOpen && (
        <div className="absolute z-50 mt-1 w-full rounded-[6px] border border-app-border bg-white shadow-lg">
          <div className="flex items-center border-b border-app-border px-3 py-2">
            <Search size={14} className="text-app-textSecondary mr-2" />
            <input
              type="text"
              autoFocus
              placeholder="Search by English or Tamil name..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="w-full text-[13px] text-app-textPrimary focus:outline-none placeholder:text-app-textSecondary"
            />
          </div>
          <div className="max-h-[200px] overflow-y-auto py-1">
            {filteredItems.length === 0 ? (
              <div className="px-3 py-2 text-[12px] text-app-textSecondary">No items found</div>
            ) : (
              filteredItems.map((item) => {
                const isSelected = item.id === value
                const displayName = item.name_en ? `${item.name_en} (${item.name_ta})` : item.name
                return (
                  <div
                    key={item.id}
                    onClick={() => {
                      onChange(item.id)
                      setIsOpen(false)
                      setQuery('')
                    }}
                    className={`flex items-center justify-between cursor-pointer px-3 py-2 text-[13px] transition-colors ${
                      isSelected ? 'bg-app-greenLight text-app-greenMid font-medium' : 'hover:bg-[#fafaf9] text-app-textPrimary'
                    }`}
                  >
                    <span className="truncate">{displayName}</span>
                    {item.category && <span className="text-[10px] text-app-textSecondary bg-app-surface border border-app-border px-1.5 py-0.5 rounded ml-2 whitespace-nowrap">{item.category}</span>}
                  </div>
                )
              })
            )}
          </div>
        </div>
      )}
    </div>
  )
}
