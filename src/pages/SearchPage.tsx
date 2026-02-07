import { Search } from 'lucide-react'
import { useCallback, useEffect, useRef } from 'react'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { useWikiSearch } from '@/hooks/useWikiSearch'
import { formatDate } from '@/services/wikiApi'

export default function SearchPage() {
  const {
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
  } = useWikiSearch()

  const observerRef = useRef<IntersectionObserver | null>(null)
  const loadMoreTriggerRef = useRef<HTMLDivElement | null>(null)
  const loadMoreCallbackRef = useRef<(() => void) | null>(null)

  // Store the latest loadMore function in a ref
  useEffect(() => {
    loadMoreCallbackRef.current = loadMore
  }, [loadMore])

  // Setup intersection observer for infinite scrolling
  useEffect(() => {
    // Only set up observer if we have results and more to load
    if (!loadMoreTriggerRef.current || !hasMore || !searched) {
      return
    }

    const options = {
      root: null,
      rootMargin: '100px', // Start loading before reaching the bottom
      threshold: 0.1,
    }

    const callback: IntersectionObserverCallback = (entries) => {
      const [entry] = entries
      if (entry.isIntersecting && hasMore && !loadingMore && !loading) {
        loadMoreCallbackRef.current?.()
      }
    }

    observerRef.current = new IntersectionObserver(callback, options)
    observerRef.current.observe(loadMoreTriggerRef.current)

    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect()
      }
    }
  }, [hasMore, loadingMore, loading, searched])

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === 'Enter') {
        handleSearch()
      }
    },
    [handleSearch],
  )

  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setSearchQuery(e.target.value)
    },
    [setSearchQuery],
  )

  return (
    <div className="wiki-search-container">
      <div className="wiki-search-wrapper">
        <h1 className="text-4xl md:text-6xl font-bold text-center mb-8">
          Wiki Search
        </h1>

        <div className="flex gap-2 max-w-xl mx-auto mb-8">
          <Input
            type="text"
            placeholder="検索ワード"
            value={searchQuery}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            className="flex-1"
            aria-busy={loading}
            aria-label="検索ワード"
          />
          <Button
            type="button"
            onClick={handleSearch}
            disabled={loading}
            aria-label="検索"
          >
            <Search className="h-4 w-4 mr-2" />
            検索
          </Button>
        </div>

        {loading && <div className="loading-spinner" />}

        {error && (
          <div
            className="text-center text-red-600 mt-8 p-4 bg-red-50 rounded-md max-w-xl mx-auto"
            role="alert"
            aria-live="polite"
          >
            {error}
          </div>
        )}

        {!loading && searched && results.length === 0 && !error && (
          <p
            className="text-center text-muted-foreground mt-8"
            role="status"
            aria-live="polite"
          >
            検索したワードはヒットしませんでした。
          </p>
        )}

        {!loading && results.length > 0 && (
          <>
            <div
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-8"
              role="region"
              aria-label="検索結果"
            >
              {results.map((result) => (
                <a
                  key={result.pageid}
                  href={`https://ja.wikipedia.org/?curid=${result.pageid}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="transition-transform hover:scale-105"
                >
                  <Card className="h-full hover:shadow-lg transition-shadow">
                    <CardHeader>
                      <CardTitle className="text-xl line-clamp-2">
                        {result.title}
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <CardDescription className="line-clamp-4">
                        {result.formattedSnippet}
                      </CardDescription>
                    </CardContent>
                    <CardFooter>
                      <p className="text-xs text-muted-foreground">
                        最終更新日：{formatDate(result.timestamp)}
                      </p>
                    </CardFooter>
                  </Card>
                </a>
              ))}
            </div>

            {/* Intersection observer trigger */}
            {hasMore && (
              <div
                ref={loadMoreTriggerRef}
                className="flex justify-center mt-8"
              >
                {loadingMore && <div className="loading-spinner" />}
              </div>
            )}

            {!hasMore && (
              <p className="text-center text-muted-foreground mt-8">
                すべての結果を表示しました
              </p>
            )}
          </>
        )}
      </div>
    </div>
  )
}
