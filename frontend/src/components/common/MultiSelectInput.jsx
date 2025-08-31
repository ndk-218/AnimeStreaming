import { useState, useEffect, useRef } from 'react'

// Multi-Select Input Component with search and tags
function MultiSelectInput({ 
  label, 
  value = [], 
  onChange, 
  searchFunction, 
  placeholder = "Search and select...",
  required = false,
  maxSelections = 10,
  className = ""
}) {
  const [isOpen, setIsOpen] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [suggestions, setSuggestions] = useState([])
  const [loading, setLoading] = useState(false)
  const inputRef = useRef(null)
  const dropdownRef = useRef(null)

  // Debounced search
  useEffect(() => {
    if (searchTerm.length >= 2) {
      const timeoutId = setTimeout(async () => {
        setLoading(true)
        try {
          const results = await searchFunction(searchTerm)
          // Filter out already selected items
          const filteredResults = results.filter(item => {
            const itemName = item.name || item
            return !value.includes(itemName)
          })
          setSuggestions(filteredResults || [])
        } catch (error) {
          console.error('MultiSelect search error:', error)
          setSuggestions([])
        } finally {
          setLoading(false)
        }
      }, 300)

      return () => clearTimeout(timeoutId)
    } else {
      setSuggestions([])
    }
  }, [searchTerm, searchFunction, value])

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleInputChange = (e) => {
    const newValue = e.target.value
    setSearchTerm(newValue)
    setIsOpen(newValue.length >= 2)
  }

  const handleSuggestionClick = (suggestion) => {
    if (value.length >= maxSelections) {
      return
    }

    const selectedValue = suggestion.name || suggestion
    const newValue = [...value, selectedValue]
    onChange(newValue)
    setSearchTerm('')
    setIsOpen(false)
    setSuggestions([])
  }

  const handleRemoveItem = (itemToRemove) => {
    const newValue = value.filter(item => item !== itemToRemove)
    onChange(newValue)
  }

  const handleInputFocus = () => {
    if (searchTerm.length >= 2) {
      setIsOpen(true)
    }
  }

  const handleKeyDown = (e) => {
    // Handle backspace to remove last item when input is empty
    if (e.key === 'Backspace' && searchTerm === '' && value.length > 0) {
      handleRemoveItem(value[value.length - 1])
    }
  }

  return (
    <div className={`relative ${className}`} ref={dropdownRef}>
      {label && (
        <label className="block text-gray-700 text-sm font-medium mb-2">
          {label} {required && <span className="text-red-500">*</span>}
        </label>
      )}
      
      {/* Selected items */}
      {value.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-2">
          {value.map((item, index) => (
            <div
              key={index}
              className="flex items-center bg-indigo-100 text-indigo-800 px-3 py-1 rounded-full text-sm"
            >
              <span>{item}</span>
              <button
                type="button"
                onClick={() => handleRemoveItem(item)}
                className="ml-2 hover:bg-indigo-200 rounded-full p-1 transition-colors"
              >
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          ))}
        </div>
      )}
      
      <div className="relative">
        <input
          ref={inputRef}
          type="text"
          value={searchTerm}
          onChange={handleInputChange}
          onFocus={handleInputFocus}
          onKeyDown={handleKeyDown}
          placeholder={value.length >= maxSelections ? `Maximum ${maxSelections} items selected` : placeholder}
          disabled={value.length >= maxSelections}
          className="w-full p-3 border border-gray-300 rounded-lg focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 pr-10 disabled:bg-gray-100 disabled:cursor-not-allowed"
        />
        
        {loading && (
          <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-indigo-600"></div>
          </div>
        )}
      </div>

      {/* Selection count */}
      {value.length > 0 && (
        <p className="text-xs text-gray-500 mt-1">
          {value.length} of {maxSelections} selected
        </p>
      )}

      {/* Dropdown */}
      {isOpen && suggestions.length > 0 && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto">
          {suggestions.map((suggestion, index) => {
            const displayValue = suggestion.name || suggestion
            const count = suggestion.count
            
            return (
              <div
                key={index}
                onClick={() => handleSuggestionClick(suggestion)}
                className="px-4 py-2 hover:bg-indigo-50 cursor-pointer flex items-center justify-between"
              >
                <span className="text-gray-900">{displayValue}</span>
                {count !== undefined && (
                  <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
                    {count}
                  </span>
                )}
              </div>
            )
          })}
        </div>
      )}

      {/* No results */}
      {isOpen && searchTerm.length >= 2 && suggestions.length === 0 && !loading && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg p-4 text-center text-gray-500">
          No results found for "{searchTerm}"
        </div>
      )}
    </div>
  )
}

export default MultiSelectInput
