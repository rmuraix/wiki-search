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
}

function App() {
  const [searchQuery, setSearchQuery] = useState("");
  const [results, setResults] = useState<WikiResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Refs for AbortController and debounce timer
  const abortControllerRef = useRef<AbortController | null>(null);
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);

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

    try {
      const response = await fetch(
        `https://ja.wikipedia.org/w/api.php?format=json&action=query&origin=*&list=search&srlimit=45&srsearch=${encodeURIComponent(
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

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
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
        )}
      </div>
    </div>
  );
}

export default App;
