import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { calculate, CalculatorApiError } from './calculatorApi'

const fetchMock = vi.fn<typeof fetch>()

function mockResponse(body: unknown, ok = true): Response {
  return {
    ok,
    json: vi.fn().mockResolvedValue(body),
  } as unknown as Response
}

describe('calculate', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', fetchMock)
    fetchMock.mockReset()
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('sends the calculation request and returns the backend result', async () => {
    fetchMock.mockResolvedValueOnce(mockResponse({ result: 15 }))

    await expect(
      calculate({ operation: 'add', a: 10, b: 5 }),
    ).resolves.toBe(15)

    expect(fetchMock).toHaveBeenCalledOnce()
    expect(fetchMock).toHaveBeenCalledWith(
      'http://localhost:8080/api/v1/calculate',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ operation: 'add', a: 10, b: 5 }),
      },
    )
  })

  it('keeps the error message returned by the backend', async () => {
    fetchMock.mockResolvedValueOnce(
      mockResponse({ error: 'division by zero' }, false),
    )

    await expect(
      calculate({ operation: 'divide', a: 10, b: 0 }),
    ).rejects.toEqual(new CalculatorApiError('division by zero'))
  })

  it('rejects a successful response that does not contain a result', async () => {
    fetchMock.mockResolvedValueOnce(mockResponse({ value: 15 }))

    await expect(
      calculate({ operation: 'add', a: 10, b: 5 }),
    ).rejects.toEqual(new CalculatorApiError('Invalid response from server'))
  })
})
