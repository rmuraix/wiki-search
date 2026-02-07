export interface WikiResult {
  pageid: number
  title: string
  snippet: string
  timestamp: string
  formattedSnippet?: string
}

export interface WikiResponse {
  query: {
    search: WikiResult[]
  }
  continue?: {
    sroffset: number
    continue: string
  }
}
