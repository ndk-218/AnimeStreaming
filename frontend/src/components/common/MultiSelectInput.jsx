import { useState, useRef, useEffect } from 'react'

export default function MultiSelectInput({ 
  label, 
  value = [], 
  onChange, 
  placeholder,
  searchFunction,
  required = false,
  className = "",
  disabled = false,
  maxSelections = 10
}) {
  const [inputValue, setInputValue] = useState('')
  const [suggestions, setSuggestions] = useState([])
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [loading, setLoading] = useState(false)
  const [selectedIndex, setSelectedIndex] = useState(-1)
  
  const inputRef = useRef(null)
  const suggestionsRef = useRef(null)
  const debounceRef = useRef(null)

  // Debounced search function
  const debouncedSearch = async (query) => {
    if (!query.trim()) {
      setSuggestions([])
      setShowSuggestions(false)
      return
    }

    setLoading(true)
    try {
      const results = await searchFunction(query)
      // Filter out already selected items
      const filteredResults = results.filter(item => {
        const itemName = typeof item === 'string' ? item : item.name
        return !value.includes(itemName)
      })
      setSuggestions(filteredResults)
      setShowSuggestions(filteredResults.length > 0)
      setSelectedIndex(-1)
    } catch (error) {
      console.error('Search failed:', error)
      setSuggestions([])
      setShowSuggestions(false)
    } finally {
      setLoading(false)
    }
  }

  // Handle input change
  const handleInputChange = (e) => {
    const newValue = e.target.value
    setInputValue(newValue)

    // Clear previous debounce
    if (debounceRef.current) {
      clearTimeout(debounceRef.current)
    }

    // Debounce search by 300ms
    debounceRef.current = setTimeout(() => {
      debouncedSearch(newValue)
    }, 300)
  }

  // Handle suggestion selection
  const handleSuggestionSelect = (suggestion) => {
    const selectedValue = typeof suggestion === 'string' ? suggestion : suggestion.name
    
    if (!value.includes(selectedValue) && value.length < maxSelections) {
      onChange([...value, selectedValue])
    }
    
    setInputValue('')
    setShowSuggestions(false)
    setSuggestions([])
    setSelectedIndex(-1)
    inputRef.current?.focus()
  }

  // Remove selected item
  const handleRemoveItem = (itemToRemove) => {
    onChange(value.filter(item => item !== itemToRemove))
  }

  // Handle keyboard navigation
  const handleKeyDown = (e) => {
    if (e.key === 'Backspace' && inputValue === '' && value.length > 0) {
      // Remove last item when backspace is pressed on empty input
      handleRemoveItem(value[value.length - 1])
      return
    }

    if (!showSuggestions) return

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault()
        setSelectedIndex(prev => 
          prev < suggestions.length - 1 ? prev + 1 : prev
        )
        break
      case 'ArrowUp':
        e.preventDefault()
        setSelectedIndex(prev => prev > 0 ? prev - 1 : -1)
        break
      case 'Enter':
        e.preventDefault()
        if (selectedIndex >= 0 && selectedIndex < suggestions.length) {
          handleSuggestionSelect(suggestions[selectedIndex])
        } else if (inputValue.trim() && !value.includes(inputValue.trim())) {
          // Add new item if not in suggestions and not already selected
          if (value.length < maxSelections) {
            onChange([...value, inputValue.trim()])
            setInputValue('')
            setShowSuggestions(false)
            setSuggestions([])
          }
        }
        break
      case 'Escape':
        setShowSuggestions(false)
        setSuggestions([])
        setSelectedIndex(-1)
        break
    }
  }

  // Close suggestions when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        inputRef.current && !inputRef.current.contains(event.target) &&
        suggestionsRef.current && !suggestionsRef.current.contains(event.target)
      ) {
        setShowSuggestions(false)
        setSuggestions([])
        setSelectedIndex(-1)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  return (
    <div className={`relative ${className}`}>
      {label && (
        <label className="block text-light-700 text-sm font-medium mb-2">
          {label} {required && <span className="text-red-500">*</span>}
          <span className="text-light-500 text-xs ml-1">
            ({value.length}/{maxSelections})
          </span>
        </label>
      )}
      
      <div className="relative">
        {/* Selected items */}
        <div className="flex flex-wrap gap-2 mb-2">
          {value.map((item, index) => (
            <span
              key={index}
              className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-primary-100 text-primary-800 border border-primary-200"
            >
              {item}
              <button
                type="button"
                onClick={() => handleRemoveItem(item)}
                className="ml-2 text-primary-600 hover:text-primary-800 focus:outline-none"
              >
                ×
              </button>
            </span>
          ))}
        </div>

        {/* Input field */}
        <div className="relative">
          <input
            ref={inputRef}
            type="text"
            value={inputValue}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            onFocus={() => inputValue.trim() && debouncedSearch(inputValue)}
            placeholder={value.length >= maxSelections ? `Maximum ${maxSelections} items selected` : placeholder}
            disabled={disabled || value.length >= maxSelections}
            className="w-full p-3 border border-light-200 rounded-lg text-light-900 focus:border-primary-400 focus:ring-2 focus:ring-primary-100 focus:outline-none transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
          />
          
          {loading && (
            <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary-400"></div>
            </div>
          )}
        </div>
      </div>

      {/* Suggestions dropdown */}
      {showSuggestions && suggestions.length > 0 && (
        <div 
          ref={suggestionsRef}
          className="absolute z-50 w-full mt-1 bg-white border border-light-200 rounded-lg shadow-lg max-h-48 overflow-y-auto"
        >
          {suggestions.map((suggestion, index) => {
            const displayName = typeof suggestion === 'string' ? suggestion : suggestion.name
            return (
              <button
                key={index}
                onClick={() => handleSuggestionSelect(suggestion)}
                className={`w-full px-4 py-3 text-left hover:bg-primary-50 transition-colors border-b border-light-100 last:border-b-0 ${
                  selectedIndex === index ? 'bg-primary-50 text-primary-700' : 'text-light-900'
                }`}
              >
                <span className="font-medium">{displayName}</span>
                {suggestion.count && (
                  <span className="text-xs text-light-500 ml-2">
                    ({suggestion.count} series)
                  </span>
                )}
              </button>
            )
          })}
          
          {/* Add new item option */}
          {inputValue.trim() && !suggestions.some(s => {
            const name = typeof s === 'string' ? s : s.name
            return name.toLowerCase() === inputValue.trim().toLowerCase()
          }) && (
            <button
              onClick={() => {
                if (value.length < maxSelections) {
                  onChange([...value, inputValue.trim()])
                  setInputValue('')
                  setShowSuggestions(false)
                  setSuggestions([])
                }
              }}
              className="w-full px-4 py-3 text-left hover:bg-secondary-50 transition-colors border-t border-light-200 text-secondary-600"
            >
              <span className="font-medium">+ Add "{inputValue.trim()}"</span>
              <span className="text-xs text-light-500 ml-2">(new item)</span>
            </button>
          )}
        </div>
      )}

      {/* Helper text */}
      <p className="text-xs text-light-500 mt-1">
        Type to search or add new items. Press Backspace to remove the last item.
      </p>
    </div>
  )
}
