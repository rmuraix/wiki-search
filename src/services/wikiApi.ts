import type { WikiResponse } from '@/types/wiki'

const BASE_URL = 'https://ja.wikipedia.org/w/api.php'
const SEARCH_LIMIT = 15

export interface SearchParams {
  query: string
  offset?: number
  signal?: AbortSignal
}

export const searchWikipedia = async ({
  query,
  offset = 0,
  signal,
}: SearchParams): Promise<WikiResponse> => {
  const params = new URLSearchParams({
    format: 'json',
    action: 'query',
    origin: '*',
    list: 'search',
    srlimit: SEARCH_LIMIT.toString(),
    srsearch: query,
  })

  if (offset > 0) {
    params.append('sroffset', offset.toString())
  }

  const response = await fetch(`${BASE_URL}?${params.toString()}`, {
    method: 'GET',
    signal,
  })

  if (!response.ok) {
    throw new Error('Failed to fetch Wikipedia data')
  }

  return response.json()
}

export const formatSnippet = (snippet: string): string => {
  const doc = new DOMParser().parseFromString(snippet, 'text/html')
  const text = doc.body.textContent || ''
  return text.slice(0, 200) + (text.length > 200 ? '...' : '')
}

export const formatDate = (timestamp: string): string => {
  return timestamp.slice(0, 10).replace(/-/g, '.')
}
