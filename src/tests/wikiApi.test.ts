import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { formatDate, formatSnippet, searchWikipedia } from '@/services/wikiApi'
import type { WikiResponse } from '@/types/wiki'

describe('wikiApi service', () => {
  describe('searchWikipedia', () => {
    beforeEach(() => {
      global.fetch = vi.fn()
    })

    afterEach(() => {
      vi.restoreAllMocks()
    })

    it('should fetch Wikipedia search results successfully', async () => {
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

      const result = await searchWikipedia({ query: 'test' })

      expect(result).toEqual(mockResponse)
      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining('srsearch=test'),
        expect.objectContaining({ method: 'GET' }),
      )
    })

    it('should include offset in request when provided', async () => {
      const mockResponse: WikiResponse = {
        query: { search: [] },
      }

      vi.mocked(fetch).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      } as Response)

      await searchWikipedia({ query: 'test', offset: 15 })

      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining('sroffset=15'),
        expect.objectContaining({ method: 'GET' }),
      )
    })

    it('should handle fetch errors', async () => {
      vi.mocked(fetch).mockResolvedValueOnce({
        ok: false,
      } as Response)

      await expect(searchWikipedia({ query: 'test' })).rejects.toThrow(
        'Failed to fetch Wikipedia data',
      )
    })

    it('should pass abort signal to fetch', async () => {
      const controller = new AbortController()
      const mockResponse: WikiResponse = {
        query: { search: [] },
      }

      vi.mocked(fetch).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      } as Response)

      await searchWikipedia({ query: 'test', signal: controller.signal })

      expect(fetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({ signal: controller.signal }),
      )
    })
  })

  describe('formatSnippet', () => {
    it('should strip HTML tags from snippet', () => {
      const snippet = '<span class="searchmatch">Test</span> content'
      const result = formatSnippet(snippet)
      expect(result).toBe('Test content')
    })

    it('should truncate long snippets', () => {
      const longSnippet = 'a'.repeat(250)
      const result = formatSnippet(longSnippet)
      expect(result).toHaveLength(203) // 200 chars + '...'
      expect(result.endsWith('...')).toBe(true)
    })

    it('should not add ellipsis for short snippets', () => {
      const shortSnippet = 'Short snippet'
      const result = formatSnippet(shortSnippet)
      expect(result).toBe('Short snippet')
      expect(result.endsWith('...')).toBe(false)
    })
  })

  describe('formatDate', () => {
    it('should format timestamp correctly', () => {
      const timestamp = '2024-01-15T12:34:56Z'
      const result = formatDate(timestamp)
      expect(result).toBe('2024.01.15')
    })

    it('should replace hyphens with periods', () => {
      const timestamp = '2023-12-31T00:00:00Z'
      const result = formatDate(timestamp)
      expect(result).toBe('2023.12.31')
    })
  })
})
