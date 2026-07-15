
'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Slider } from '@/components/ui/slider'
import { Search, Filter, RotateCcw } from 'lucide-react'
import { PackageFilters as FilterType } from '@/lib/types'

interface FilterOptions {
  states: string[]
  cities: string[]
  priceRange: {
    min: number
    max: number
  }
  categories: string[]
}

interface PackageFiltersProps {
  filters: FilterOptions
  currentFilters: {
    search?: string
    state?: string
    city?: string
    minPrice?: number
    maxPrice?: number
    category?: string
    sort?: 'ending-soon' | 'newly-listed' | 'highest-bid' | 'lowest-bid' | 'ended'
  }
}

export function PackageFilters({ filters, currentFilters }: PackageFiltersProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  
  const [search, setSearch] = useState(currentFilters.search || '')
  const [state, setState] = useState(currentFilters.state || '')
  const [city, setCity] = useState(currentFilters.city || '')
  const [priceRange, setPriceRange] = useState([
    currentFilters.minPrice || filters.priceRange.min,
    currentFilters.maxPrice || filters.priceRange.max
  ])
  const [category, setCategory] = useState(currentFilters.category || '')
  const [sort, setSort] = useState(currentFilters.sort || 'ending-soon')

  const updateFilters = () => {
    const params = new URLSearchParams(searchParams?.toString() || '')
    
    // Update search params
    if (search.trim()) {
      params.set('search', search.trim())
    } else {
      params.delete('search')
    }

    if (state && state !== 'all-states') {
      params.set('state', state)
    } else {
      params.delete('state')
    }

    if (city && city !== 'all-cities') {
      params.set('city', city)
    } else {
      params.delete('city')
    }

    if (priceRange[0] > filters.priceRange.min) {
      params.set('minPrice', priceRange[0].toString())
    } else {
      params.delete('minPrice')
    }

    if (priceRange[1] < filters.priceRange.max) {
      params.set('maxPrice', priceRange[1].toString())
    } else {
      params.delete('maxPrice')
    }

    if (category && category !== 'all-categories') {
      params.set('category', category)
    } else {
      params.delete('category')
    }

    if (sort !== 'ending-soon') {
      params.set('sort', sort)
    } else {
      params.delete('sort')
    }

    // Reset to first page when filtering
    params.delete('page')

    router.push(`/?${params.toString()}`)
  }

  const resetFilters = () => {
    setSearch('')
    setState('')
    setCity('')
    setPriceRange([filters.priceRange.min, filters.priceRange.max])
    setCategory('')
    setSort('ending-soon')
    router.push('/')
  }

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    updateFilters()
  }

  useEffect(() => {
    const debounceTimer = setTimeout(() => {
      if (search !== currentFilters.search) {
        updateFilters()
      }
    }, 500)

    return () => clearTimeout(debounceTimer)
  }, [search])

  return (
    <div className="seva-card p-6 h-fit sticky top-24">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-2">
          <Filter className="w-5 h-5 text-[#94B957]" />
          <h2 className="font-semibold text-[#524C4C]">Filters</h2>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={resetFilters}
          className="text-gray-500 hover:text-gray-700"
        >
          <RotateCcw className="w-4 h-4 mr-1" />
          Reset
        </Button>
      </div>

      <div className="space-y-6">
        {/* Search */}
        <form onSubmit={handleSearch}>
          <Label htmlFor="search" className="text-sm font-medium text-gray-700 mb-2 block">
            Search Auctions
          </Label>
          <div className="relative">
            <Input
              id="search"
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="seva-input pl-12"
            />
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          </div>
        </form>

        {/* Sort */}
        <div>
          <Label className="text-sm font-medium text-gray-700 mb-2 block">
            Sort By
          </Label>
          <Select value={sort} onValueChange={(value) => {
            setSort(value as any)
            // Update immediately for sort
            const params = new URLSearchParams(searchParams?.toString() || '')
            if (value !== 'ending-soon') {
              params.set('sort', value)
            } else {
              params.delete('sort')
            }
            router.push(`/?${params.toString()}`)
          }}>
            <SelectTrigger className="seva-input bg-white">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-white">
              <SelectItem value="ending-soon">Ending Soonest</SelectItem>
              <SelectItem value="newly-listed">Newly Listed</SelectItem>
              <SelectItem value="highest-bid">Highest Bid</SelectItem>
              <SelectItem value="lowest-bid">Lowest Bid</SelectItem>
              <SelectItem value="ended">Ended Auctions</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* State */}
        {filters.states.length > 0 && (
          <div>
            <Label className="text-sm font-medium text-gray-700 mb-2 block">
              State
            </Label>
            <Select value={state} onValueChange={(value) => {
              setState(value)
              setCity('') // Reset city when state changes
              setTimeout(updateFilters, 100)
            }}>
              <SelectTrigger className="seva-input bg-white">
                <SelectValue placeholder="All states" />
              </SelectTrigger>
              <SelectContent className="bg-white">
                <SelectItem value="all-states">All states</SelectItem>
                {filters.states.map((stateOption) => (
                  <SelectItem key={stateOption} value={stateOption}>
                    {stateOption}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        {/* City */}
        {filters.cities.length > 0 && (
          <div>
            <Label className="text-sm font-medium text-gray-700 mb-2 block">
              City
            </Label>
            <Select value={city} onValueChange={(value) => {
              setCity(value)
              setTimeout(updateFilters, 100)
            }}>
              <SelectTrigger className="seva-input bg-white">
                <SelectValue placeholder="All cities" />
              </SelectTrigger>
              <SelectContent className="bg-white">
                <SelectItem value="all-cities">All cities</SelectItem>
                {filters.cities.map((cityOption) => (
                  <SelectItem key={cityOption} value={cityOption}>
                    {cityOption}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        {/* Price Range */}
        <div>
          <Label className="text-sm font-medium text-gray-700 mb-3 block">
            Current Bid Range
          </Label>
          <div className="px-2">
            <Slider
              value={priceRange}
              onValueChange={setPriceRange}
              onValueCommit={updateFilters}
              min={filters.priceRange.min}
              max={filters.priceRange.max}
              step={50}
              className="w-full"
            />
            <div className="flex justify-between text-sm text-gray-500 mt-2">
              <span>${priceRange[0].toLocaleString()}</span>
              <span>${priceRange[1].toLocaleString()}</span>
            </div>
          </div>
        </div>

        {/* Category */}
        {filters.categories.length > 0 && (
          <div>
            <Label className="text-sm font-medium text-gray-700 mb-2 block">
              Category
            </Label>
            <Select value={category} onValueChange={(value) => {
              setCategory(value)
              setTimeout(updateFilters, 100)
            }}>
              <SelectTrigger className="seva-input bg-white">
                <SelectValue placeholder="All categories" />
              </SelectTrigger>
              <SelectContent className="bg-white">
                <SelectItem value="all-categories">All categories</SelectItem>
                {filters.categories.map((cat) => (
                  <SelectItem key={cat} value={cat}>
                    {cat}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        {/* Ended Auctions link */}
        <div className="pt-2 text-center">
          <button
            type="button"
            onClick={() => {
              const params = new URLSearchParams(searchParams?.toString() || '')
              params.set('sort', 'ended')
              params.delete('page')
              router.push(`/?${params.toString()}`)
            }}
            className="text-sm font-semibold text-[#94B957] hover:text-[#7A9941] underline underline-offset-4 transition-colors"
          >
            View Ended Auctions →
          </button>
        </div>
      </div>
    </div>
  )
}
