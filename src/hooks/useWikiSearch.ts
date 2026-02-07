import { useCallback, useEffect, useRef, useState } from 'react'
import { formatSnippet, searchWikipedia } from '@/services/wikiApi'
import type { WikiResult } from '@/types/wiki'

export const useWikiSearch = () => {
  const [searchQuery, setSearchQuery] = useState('')
  const [results, setResults] = useState<WikiResult[]>([])
  const [loading, setLoading] = useState(false)
  const [loadingMore, setLoadingMore] = useState(false)
  const [searched, setSearched] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [hasMore, setHasMore] = useState(true)
  const [offset, setOffset] = useState(0)

  const abortControllerRef = useRef<AbortController | null>(null)
  const isLoadingMoreRef = useRef(false)

  const handleSearch = useCallback(async () => {
    if (!searchQuery.trim()) return

    // Cancel any previous request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
    }

    // Create new AbortController for this request
    abortControllerRef.current = new AbortController()

    setLoading(true)
    setSearched(true)
    setResults([])
    setError(null)
    setHasMore(true)
    setOffset(0)

    try {
      const data = await searchWikipedia({
        query: searchQuery,
        signal: abortControllerRef.current.signal,
      })

      // Format snippets during data fetching
      const formattedResults = data.query.search.map((result) => ({
        ...result,
        formattedSnippet: formatSnippet(result.snippet),
      }))

      setResults(formattedResults)
      setHasMore(!!data.continue)
      setOffset(data.continue?.sroffset || 0)
    } catch (error) {
      // Don't show error for aborted requests
      if (error instanceof Error && error.name === 'AbortError') {
        return
      }

      console.error('Error fetching Wikipedia data:', error)
      setError('wikipediaにうまくアクセスできないようです、、')
    } finally {
      setLoading(false)
    }
  }, [searchQuery])

  const loadMore = useCallback(async () => {
    if (
      !hasMore ||
      loadingMore ||
      !searchQuery.trim() ||
      isLoadingMoreRef.current
    ) {
      return
    }

    isLoadingMoreRef.current = true
    setLoadingMore(true)
    setError(null)

    try {
      const data = await searchWikipedia({
        query: searchQuery,
        offset,
      })

      // Format snippets during data fetching
      const formattedResults = data.query.search.map((result) => ({
        ...result,
        formattedSnippet: formatSnippet(result.snippet),
      }))

      setResults((prev) => [...prev, ...formattedResults])
      setHasMore(!!data.continue)
      if (data.continue && typeof data.continue.sroffset === 'number') {
        setOffset(data.continue.sroffset)
      }
    } catch (error) {
      console.error('Error loading more results:', error)
      setError('追加の結果を読み込めませんでした。')
    } finally {
      setLoadingMore(false)
      isLoadingMoreRef.current = false
    }
  }, [hasMore, loadingMore, searchQuery, offset])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort()
      }
    }
  }, [])

  return {
    searchQuery,
    setSearchQuery,
    results,
    loading,
    loadingMore,
    searched,
    error,
    hasMore,
    handleSearch,
    loadMore,
  }
}
