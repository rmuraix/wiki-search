import { act, renderHook, waitFor } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { useWikiSearch } from '@/hooks/useWikiSearch'
import type { WikiResponse } from '@/types/wiki'

describe('useWikiSearch hook', () => {
  beforeEach(() => {
    global.fetch = vi.fn()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('should initialize with default values', () => {
    const { result } = renderHook(() => useWikiSearch())

    expect(result.current.searchQuery).toBe('')
    expect(result.current.results).toEqual([])
    expect(result.current.loading).toBe(false)
    expect(result.current.loadingMore).toBe(false)
    expect(result.current.searched).toBe(false)
    expect(result.current.error).toBeNull()
    expect(result.current.hasMore).toBe(true)
  })

  it('should update search query', () => {
    const { result } = renderHook(() => useWikiSearch())

    act(() => {
      result.current.setSearchQuery('test query')
    })

    expect(result.current.searchQuery).toBe('test query')
  })

  it('should handle successful search', async () => {
    const mockResponse: WikiResponse = {
      query: {
        search: [
          {
            pageid: 1,
            title: 'Test Page',
            snippet: 'Test snippet',
            timestamp: '2024-01-01T00:00:00Z',
          },
        ],
      },
      continue: {
        sroffset: 15,
        continue: '-||',
      },
    }

    vi.mocked(fetch).mockResolvedValueOnce({
      ok: true,
      json: async () => mockResponse,
    } as Response)

    const { result } = renderHook(() => useWikiSearch())

    act(() => {
      result.current.setSearchQuery('test')
    })

    await act(async () => {
      await result.current.handleSearch()
    })

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })

    expect(result.current.results).toHaveLength(1)
    expect(result.current.results[0].title).toBe('Test Page')
    expect(result.current.searched).toBe(true)
    expect(result.current.hasMore).toBe(true)
    expect(result.current.error).toBeNull()
  })

  it('should not search with empty query', async () => {
    const { result } = renderHook(() => useWikiSearch())

    act(() => {
      result.current.setSearchQuery('')
    })

    await act(async () => {
      await result.current.handleSearch()
    })

    expect(fetch).not.toHaveBeenCalled()
    expect(result.current.searched).toBe(false)
  })

  it('should handle search errors', async () => {
    vi.mocked(fetch).mockRejectedValueOnce(new Error('Network error'))

    const { result } = renderHook(() => useWikiSearch())

    act(() => {
      result.current.setSearchQuery('test')
    })

    await act(async () => {
      await result.current.handleSearch()
    })

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })

    expect(result.current.error).toBe(
      'wikipediaにうまくアクセスできないようです、、',
    )
    expect(result.current.results).toEqual([])
  })

  it('should handle aborted requests gracefully', async () => {
    const abortError = new Error('AbortError')
    abortError.name = 'AbortError'
    vi.mocked(fetch).mockRejectedValueOnce(abortError)

    const { result } = renderHook(() => useWikiSearch())

    act(() => {
      result.current.setSearchQuery('test')
    })

    await act(async () => {
      await result.current.handleSearch()
    })

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })

    expect(result.current.error).toBeNull()
  })

  it('should load more results', async () => {
    const initialResponse: WikiResponse = {
      query: {
        search: [
          {
            pageid: 1,
            title: 'First Page',
            snippet: 'First snippet',
            timestamp: '2024-01-01T00:00:00Z',
          },
        ],
      },
      continue: {
        sroffset: 15,
        continue: '-||',
      },
    }

    const moreResponse: WikiResponse = {
      query: {
        search: [
          {
            pageid: 2,
            title: 'Second Page',
            snippet: 'Second snippet',
            timestamp: '2024-01-02T00:00:00Z',
          },
        ],
      },
    }

    vi.mocked(fetch)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => initialResponse,
      } as Response)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => moreResponse,
      } as Response)

    const { result } = renderHook(() => useWikiSearch())

    act(() => {
      result.current.setSearchQuery('test')
    })

    await act(async () => {
      await result.current.handleSearch()
    })

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })

    expect(result.current.results).toHaveLength(1)

    await act(async () => {
      await result.current.loadMore()
    })

    await waitFor(() => {
      expect(result.current.loadingMore).toBe(false)
    })

    expect(result.current.results).toHaveLength(2)
    expect(result.current.results[0].title).toBe('First Page')
    expect(result.current.results[1].title).toBe('Second Page')
  })

  it('should not load more when hasMore is false', async () => {
    const mockResponse: WikiResponse = {
      query: {
        search: [
          {
            pageid: 1,
            title: 'Test Page',
            snippet: 'Test snippet',
            timestamp: '2024-01-01T00:00:00Z',
          },
        ],
      },
    }

    vi.mocked(fetch).mockResolvedValueOnce({
      ok: true,
      json: async () => mockResponse,
    } as Response)

    const { result } = renderHook(() => useWikiSearch())

    act(() => {
      result.current.setSearchQuery('test')
    })

    await act(async () => {
      await result.current.handleSearch()
    })

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })

    expect(result.current.hasMore).toBe(false)

    await act(async () => {
      await result.current.loadMore()
    })

    expect(fetch).toHaveBeenCalledTimes(1) // Only the initial search call
  })
})
