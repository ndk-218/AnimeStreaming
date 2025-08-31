import { useState, useEffect, useRef } from 'react'

// Simple Autocomplete Input Component
function AutocompleteInput({ 
  label, 
  value, 
  onChange, 
  searchFunction, 
  placeholder = "Search...",
  required = false,
  className = ""
}) {
  const [isOpen, setIsOpen] = useState(false)
  const [searchTerm, setSearchTerm] = useState(value || '')
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
          setSuggestions(results || [])
        } catch (error) {
          console.error('Autocomplete search error:', error)
          setSuggestions([])
        } finally {
          setLoading(false)
        }
      }, 300)

      return () => clearTimeout(timeoutId)
    } else {
      setSuggestions([])
    }
  }, [searchTerm, searchFunction])

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
    onChange(newValue)
  }

  const handleSuggestionClick = (suggestion) => {
    const selectedValue = suggestion.name || suggestion
    setSearchTerm(selectedValue)
    onChange(selectedValue)
    setIsOpen(false)
    setSuggestions([])
  }

  const handleInputFocus = () => {
    if (searchTerm.length >= 2) {
      setIsOpen(true)
    }
  }

  return (
    <div className={`relative ${className}`} ref={dropdownRef}>
      {label && (
        <label className="block text-gray-700 text-sm font-medium mb-2">
          {label} {required && <span className="text-red-500">*</span>}
        </label>
      )}
      
      <div className="relative">
        <input
          ref={inputRef}
          type="text"
          value={searchTerm}
          onChange={handleInputChange}
          onFocus={handleInputFocus}
          placeholder={placeholder}
          className="w-full p-3 border border-gray-300 rounded-lg focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 pr-10"
        />
        
        {loading && (
          <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-indigo-600"></div>
          </div>
        )}
      </div>

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

export default AutocompleteInput
