import { useState, useCallback, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Search } from "lucide-react";

interface WikiResult {
  pageid: number;
  title: string;
  snippet: string;
  timestamp: string;
  formattedSnippet?: string;
}

interface WikiResponse {
  query: {
    search: WikiResult[];
  };
  continue?: {
    sroffset: number;
    continue: string;
  };
}

function App() {
  const [searchQuery, setSearchQuery] = useState("");
  const [results, setResults] = useState<WikiResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [searched, setSearched] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(true);
  const [offset, setOffset] = useState(0);

  // Refs for AbortController and debounce timer
  const abortControllerRef = useRef<AbortController | null>(null);
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);
  const observerRef = useRef<IntersectionObserver | null>(null);
  const loadMoreTriggerRef = useRef<HTMLDivElement | null>(null);
  const isLoadingMoreRef = useRef(false);

  // Helper function to format snippets (moved to data-fetching phase)
  const formatSnippet = useCallback((snippet: string) => {
    // Create a temporary DOM element to safely strip HTML tags
    const tempDiv = document.createElement("div");
    tempDiv.innerHTML = snippet;
    const text = tempDiv.textContent || tempDiv.innerText || "";
    return text.slice(0, 200) + (text.length > 200 ? "..." : "");
  }, []);

  // Helper function to format dates - memoized to prevent recreation
  const formatDate = useCallback((timestamp: string) => {
    return timestamp.slice(0, 10).replace(/-/g, ".");
  }, []);

  const handleSearch = useCallback(async () => {
    if (!searchQuery.trim()) return;

    // Cancel any previous request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    // Create new AbortController for this request
    abortControllerRef.current = new AbortController();

    setLoading(true);
    setSearched(true);
    setResults([]);
    setError(null);
    setHasMore(true);
    setOffset(0);

    try {
      const response = await fetch(
        `https://ja.wikipedia.org/w/api.php?format=json&action=query&origin=*&list=search&srlimit=15&srsearch=${encodeURIComponent(
          searchQuery,
        )}`,
        {
          method: "GET",
          signal: abortControllerRef.current.signal,
        },
      );

      if (!response.ok) {
        throw new Error("Failed to fetch");
      }

      const data: WikiResponse = await response.json();

      // Format snippets during data fetching, not during render
      const formattedResults = data.query.search.map((result) => ({
        ...result,
        formattedSnippet: formatSnippet(result.snippet),
      }));

      setResults(formattedResults);
      setHasMore(!!data.continue);
      setOffset(data.continue?.sroffset || 0);
    } catch (error) {
      // Don't show error for aborted requests
      if (error instanceof Error && error.name === "AbortError") {
        return;
      }

      console.error("Error fetching Wikipedia data:", error);
      setError("wikipediaにうまくアクセスできないようです、、");
    } finally {
      setLoading(false);
    }
  }, [searchQuery, formatSnippet]);

  // Debounced search for automatic searching
  const debouncedSearch = useCallback(() => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    debounceTimerRef.current = setTimeout(() => {
      if (searchQuery.trim()) {
        handleSearch();
      }
    }, 300);
  }, [searchQuery, handleSearch]);

  // Load more results for infinite scrolling
  const loadMore = useCallback(async () => {
    if (
      !hasMore ||
      loadingMore ||
      !searchQuery.trim() ||
      isLoadingMoreRef.current
    ) {
      return;
    }

    isLoadingMoreRef.current = true;
    setLoadingMore(true);

    try {
      const response = await fetch(
        `https://ja.wikipedia.org/w/api.php?format=json&action=query&origin=*&list=search&srlimit=15&sroffset=${offset}&srsearch=${encodeURIComponent(
          searchQuery,
        )}`,
        {
          method: "GET",
        },
      );

      if (!response.ok) {
        throw new Error("Failed to fetch");
      }

      const data: WikiResponse = await response.json();

      // Format snippets during data fetching
      const formattedResults = data.query.search.map((result) => ({
        ...result,
        formattedSnippet: formatSnippet(result.snippet),
      }));

      setResults((prev) => [...prev, ...formattedResults]);
      setHasMore(!!data.continue);
      if (data.continue && typeof data.continue.sroffset === "number") {
        setOffset(data.continue.sroffset);
      }
    } catch (error) {
      console.error("Error loading more results:", error);
      setError("追加の結果を読み込めませんでした。");
    } finally {
      setLoadingMore(false);
      isLoadingMoreRef.current = false;
    }
  }, [hasMore, loadingMore, searchQuery, offset, formatSnippet]);

  // Setup intersection observer for infinite scrolling
  useEffect(() => {
    // Only set up observer if we have results and more to load
    if (!loadMoreTriggerRef.current || !hasMore || !searched) {
      return;
    }

    const options = {
      root: null,
      rootMargin: "100px", // Start loading before reaching the bottom
      threshold: 0.1,
    };

    const callback: IntersectionObserverCallback = (entries) => {
      const [entry] = entries;
      if (entry.isIntersecting && hasMore && !loadingMore && !loading) {
        loadMore();
      }
    };

    observerRef.current = new IntersectionObserver(callback, options);
    observerRef.current.observe(loadMoreTriggerRef.current);

    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
    // Note: loadMore is intentionally in dependencies despite causing recreation
    // This ensures the observer always has the latest loadMore function with current state
  }, [hasMore, loadMore, loadingMore, loading, searched]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, []);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === "Enter") {
        // Clear any pending debounced search
        if (debounceTimerRef.current) {
          clearTimeout(debounceTimerRef.current);
        }
        handleSearch();
      }
    },
    [handleSearch],
  );

  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setSearchQuery(e.target.value);
      // Optionally trigger debounced search on input
      // debouncedSearch();
    },
    // Empty dependency array: setSearchQuery is stable, debouncedSearch call is commented out
    [],
  );

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
  );
}

export default App;
