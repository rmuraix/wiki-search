import { useState } from "react";
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

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;

    setLoading(true);
    setSearched(true);
    setResults([]);

    try {
      const response = await fetch(
        `https://ja.wikipedia.org/w/api.php?format=json&action=query&origin=*&list=search&srlimit=45&srsearch=${encodeURIComponent(
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
      setResults(data.query.search);
    } catch (error) {
      console.error("Error fetching Wikipedia data:", error);
      alert("wikipediaにうまくアクセスできないようです、、");
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      handleSearch();
    }
  };

  const formatDate = (timestamp: string) => {
    return timestamp.slice(0, 10).replace(/-/g, ".");
  };

  const formatSnippet = (snippet: string) => {
    // Create a temporary DOM element to safely strip HTML tags
    const tempDiv = document.createElement("div");
    tempDiv.innerHTML = snippet;
    const text = tempDiv.textContent || tempDiv.innerText || "";
    return text.slice(0, 200) + (text.length > 200 ? "..." : "");
  };

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
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            className="flex-1"
          />
          <Button onClick={handleSearch} disabled={loading}>
            <Search className="h-4 w-4 mr-2" />
            検索
          </Button>
        </div>

        {loading && <div className="loading-spinner" />}

        {!loading && searched && results.length === 0 && (
          <p className="text-center text-muted-foreground mt-8">
            検索したワードはヒットしませんでした。
          </p>
        )}

        {!loading && results.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-8">
            {results.map((result) => (
              <a
                key={result.pageid}
                href={`https://jp.wikipedia.org/?curid=${result.pageid}`}
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
                      {formatSnippet(result.snippet)}
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
