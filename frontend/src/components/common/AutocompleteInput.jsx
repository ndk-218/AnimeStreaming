import { useState, useRef, useEffect } from 'react'

export default function AutocompleteInput({ 
  label, 
  value, 
  onChange, 
  placeholder,
  searchFunction,
  required = false,
  className = "",
  disabled = false
}) {
  const [inputValue, setInputValue] = useState(value || '')
  const [suggestions, setSuggestions] = useState([])
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [loading, setLoading] = useState(false)
  const [selectedIndex, setSelectedIndex] = useState(-1)
  
  const inputRef = useRef(null)
  const suggestionsRef = useRef(null)
  const debounceRef = useRef(null)

  // Update input value when parent value changes
  useEffect(() => {
    setInputValue(value || '')
  }, [value])

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
      setSuggestions(results)
      setShowSuggestions(results.length > 0)
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
    onChange(newValue)

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
    setInputValue(selectedValue)
    onChange(selectedValue)
    setShowSuggestions(false)
    setSuggestions([])
    setSelectedIndex(-1)
    inputRef.current?.focus()
  }

  // Handle keyboard navigation
  const handleKeyDown = (e) => {
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
        } else if (inputValue.trim()) {
          // If no suggestion selected, use current input value
          setShowSuggestions(false)
          setSuggestions([])
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
        </label>
      )}
      
      <div className="relative">
        <input
          ref={inputRef}
          type="text"
          value={inputValue}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          onFocus={() => inputValue.trim() && debouncedSearch(inputValue)}
          placeholder={placeholder}
          disabled={disabled}
          className="w-full p-3 border border-light-200 rounded-lg text-light-900 focus:border-primary-400 focus:ring-2 focus:ring-primary-100 focus:outline-none transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
        />
        
        {loading && (
          <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary-400"></div>
          </div>
        )}
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
        </div>
      )}
    </div>
  )
}
