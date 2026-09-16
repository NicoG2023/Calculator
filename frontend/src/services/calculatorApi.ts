import type {
  ApiErrorResponse,
  CalculateRequest,
  CalculateResponse,
} from '../types/calculator'

const DEFAULT_API_BASE_URL = 'http://localhost:8080'
const API_BASE_URL = (
  import.meta.env.VITE_API_BASE_URL ?? DEFAULT_API_BASE_URL
).replace(/\/$/, '')

export class CalculatorApiError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'CalculatorApiError'
  }
}

export async function calculate(request: CalculateRequest): Promise<number> {
  const response = await fetch(`${API_BASE_URL}/api/v1/calculate`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(request),
  })

  const payload = (await response.json()) as
    | CalculateResponse
    | ApiErrorResponse

  if (!response.ok) {
    const message = 'error' in payload ? payload.error : 'Calculation failed'
    throw new CalculatorApiError(message)
  }

  if (!('result' in payload)) {
    throw new CalculatorApiError('Invalid response from server')
  }

  return payload.result
}
