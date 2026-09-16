import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { Calculator } from './Calculator'

const fetchMock = vi.fn<typeof fetch>()

function mockResponse(body: unknown, ok = true): Response {
  return {
    ok,
    json: vi.fn().mockResolvedValue(body),
  } as unknown as Response
}

async function press(...keys: string[]) {
  const user = userEvent.setup()

  for (const key of keys) {
    await user.click(screen.getByRole('button', { name: key }))
  }
}

describe('Calculator', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', fetchMock)
    fetchMock.mockReset()
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('uses the backend for arithmetic and displays the result', async () => {
    fetchMock.mockResolvedValueOnce(mockResponse({ result: 15 }))

    render(<Calculator theme="light" onToggleTheme={vi.fn()} />)

    await press('1', '0', 'Add', '5', 'Equals')

    await waitFor(() => {
      expect(screen.getByLabelText('Calculator display')).toHaveValue('15')
    })

    expect(fetchMock).toHaveBeenCalledOnce()
    expect(fetchMock).toHaveBeenCalledWith(
      'http://localhost:8080/api/v1/calculate',
      expect.objectContaining({
        body: JSON.stringify({ operation: 'add', a: 10, b: 5 }),
      }),
    )
  })



  it('uses the backend for exponentiation', async () => {
    fetchMock.mockResolvedValueOnce(mockResponse({ result: 256 }))

    render(<Calculator theme="light" onToggleTheme={vi.fn()} />)

    await press('2', 'Power', '8', 'Equals')

    await waitFor(() => {
      expect(screen.getByLabelText('Calculator display')).toHaveValue('256')
    })

    expect(fetchMock).toHaveBeenCalledWith(
      'http://localhost:8080/api/v1/calculate',
      expect.objectContaining({
        body: JSON.stringify({ operation: 'power', a: 2, b: 8 }),
      }),
    )
  })

  it('uses the backend for square root and percentage', async () => {
    fetchMock
      .mockResolvedValueOnce(mockResponse({ result: 9 }))
      .mockResolvedValueOnce(mockResponse({ result: 0.25 }))

    render(<Calculator theme="light" onToggleTheme={vi.fn()} />)

    await press('8', '1', 'Square root')

    await waitFor(() => {
      expect(screen.getByLabelText('Calculator display')).toHaveValue('9')
    })

    await press('2', '5', 'Percentage')

    await waitFor(() => {
      expect(screen.getByLabelText('Calculator display')).toHaveValue('0.25')
    })

    expect(fetchMock).toHaveBeenNthCalledWith(
      1,
      'http://localhost:8080/api/v1/calculate',
      expect.objectContaining({
        body: JSON.stringify({ operation: 'sqrt', a: 81 }),
      }),
    )
    expect(fetchMock).toHaveBeenNthCalledWith(
      2,
      'http://localhost:8080/api/v1/calculate',
      expect.objectContaining({
        body: JSON.stringify({ operation: 'percentage', a: 25 }),
      }),
    )
  })

  it('completes multiplication when percentage is used as the second operand', async () => {
    fetchMock
      .mockResolvedValueOnce(mockResponse({ result: 0.1 }))
      .mockResolvedValueOnce(mockResponse({ result: 20 }))

    render(<Calculator theme="light" onToggleTheme={vi.fn()} />)

    await press('2', '0', '0', 'Multiply', '1', '0', 'Percentage')

    await waitFor(() => {
      expect(screen.getByLabelText('Calculator display')).toHaveValue('20')
    })

    expect(fetchMock).toHaveBeenNthCalledWith(
      1,
      'http://localhost:8080/api/v1/calculate',
      expect.objectContaining({
        body: JSON.stringify({ operation: 'percentage', a: 10 }),
      }),
    )
    expect(fetchMock).toHaveBeenNthCalledWith(
      2,
      'http://localhost:8080/api/v1/calculate',
      expect.objectContaining({
        body: JSON.stringify({ operation: 'multiply', a: 200, b: 0.1 }),
      }),
    )
  })

  it('applies percentages relative to the first operand for addition', async () => {
    fetchMock
      .mockResolvedValueOnce(mockResponse({ result: 0.1 }))
      .mockResolvedValueOnce(mockResponse({ result: 20 }))
      .mockResolvedValueOnce(mockResponse({ result: 220 }))

    render(<Calculator theme="light" onToggleTheme={vi.fn()} />)

    await press('2', '0', '0', 'Add', '1', '0', 'Percentage')

    await waitFor(() => {
      expect(screen.getByLabelText('Calculator display')).toHaveValue('220')
    })

    expect(fetchMock).toHaveBeenNthCalledWith(
      1,
      'http://localhost:8080/api/v1/calculate',
      expect.objectContaining({
        body: JSON.stringify({ operation: 'percentage', a: 10 }),
      }),
    )
    expect(fetchMock).toHaveBeenNthCalledWith(
      2,
      'http://localhost:8080/api/v1/calculate',
      expect.objectContaining({
        body: JSON.stringify({ operation: 'multiply', a: 200, b: 0.1 }),
      }),
    )
    expect(fetchMock).toHaveBeenNthCalledWith(
      3,
      'http://localhost:8080/api/v1/calculate',
      expect.objectContaining({
        body: JSON.stringify({ operation: 'add', a: 200, b: 20 }),
      }),
    )
  })

  it('shows errors returned by the backend', async () => {
    fetchMock.mockResolvedValueOnce(
      mockResponse({ error: 'division by zero' }, false),
    )

    render(<Calculator theme="light" onToggleTheme={vi.fn()} />)

    await press('1', '0', 'Divide', '0', 'Equals')

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'division by zero',
    )
    expect(screen.getByLabelText('Calculator display')).toHaveValue('0')
  })

  it('normalizes scientific notation without calling the arithmetic API', async () => {
    render(<Calculator theme="light" onToggleTheme={vi.fn()} />)

    await press('1', 'EXP', '±', '3', 'Equals')

    expect(screen.getByLabelText('Calculator display')).toHaveValue('0.001')
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it('requests intermediate results when operations are chained', async () => {
    fetchMock
      .mockResolvedValueOnce(mockResponse({ result: 8 }))
      .mockResolvedValueOnce(mockResponse({ result: 16 }))

    render(<Calculator theme="light" onToggleTheme={vi.fn()} />)

    await press('5', 'Add', '3', 'Multiply')

    await waitFor(() => {
      expect(screen.getByLabelText('Calculator display')).toHaveValue('8')
    })

    await press('2', 'Equals')

    await waitFor(() => {
      expect(screen.getByLabelText('Calculator display')).toHaveValue('16')
    })

    expect(fetchMock).toHaveBeenCalledTimes(2)
    expect(fetchMock).toHaveBeenNthCalledWith(
      1,
      'http://localhost:8080/api/v1/calculate',
      expect.objectContaining({
        body: JSON.stringify({ operation: 'add', a: 5, b: 3 }),
      }),
    )
    expect(fetchMock).toHaveBeenNthCalledWith(
      2,
      'http://localhost:8080/api/v1/calculate',
      expect.objectContaining({
        body: JSON.stringify({ operation: 'multiply', a: 8, b: 2 }),
      }),
    )
  })

  it('supports direct input and calculator editing controls', async () => {
    const user = userEvent.setup()

    render(<Calculator theme="light" onToggleTheme={vi.fn()} />)

    const display = screen.getByLabelText('Calculator display')
    await user.clear(display)
    await user.type(display, '12.5')
    expect(display).toHaveValue('12.5')

    await press('Delete last character')
    expect(display).toHaveValue('12.')

    await press('±')
    expect(display).toHaveValue('-12.')
    await press('±')
    expect(display).toHaveValue('12.')

    await press('AC', '7', 'Delete last character')
    expect(display).toHaveValue('0')

    await press('±', 'Delete last character')
    expect(display).toHaveValue('0')

    await press('5', 'Equals', 'Delete last character')
    expect(display).toHaveValue('0')

    await press('±', '7')
    expect(display).toHaveValue('-7')
  })

  it('rejects invalid or oversized direct input and caps keypad input length', async () => {
    render(<Calculator theme="light" onToggleTheme={vi.fn()} />)

    const display = screen.getByLabelText('Calculator display')

    fireEvent.change(display, { target: { value: 'not-a-number' } })
    expect(display).toHaveValue('0')

    fireEvent.change(display, { target: { value: '1'.repeat(33) } })
    expect(display).toHaveValue('0')

    const maxLengthValue = '1'.repeat(32)
    fireEvent.change(display, { target: { value: maxLengthValue } })
    expect(display).toHaveValue(maxLengthValue)

    await press('2')
    expect(display).toHaveValue(maxLengthValue)
  })

  it('prevents duplicate decimal points and exponents and toggles exponent sign', async () => {
    render(<Calculator theme="light" onToggleTheme={vi.fn()} />)

    await press('1', 'Decimal point', 'Decimal point', 'EXP', 'EXP')
    expect(screen.getByLabelText('Calculator display')).toHaveValue('1.e')

    await press('±')
    expect(screen.getByLabelText('Calculator display')).toHaveValue('1.e-')

    await press('±')
    expect(screen.getByLabelText('Calculator display')).toHaveValue('1.e')
  })

  it('validates incomplete and out-of-range numbers before making a request', async () => {
    render(<Calculator theme="light" onToggleTheme={vi.fn()} />)

    await press('1', 'EXP', 'Equals')
    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Enter a complete number',
    )
    expect(fetchMock).not.toHaveBeenCalled()

    await press('AC')
    const display = screen.getByLabelText('Calculator display')
    fireEvent.change(display, { target: { value: '1e309' } })
    await press('Equals')

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Number is out of range',
    )
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it('replaces a pending operation before the second operand is entered', async () => {
    fetchMock.mockResolvedValueOnce(mockResponse({ result: 10 }))

    render(<Calculator theme="light" onToggleTheme={vi.fn()} />)

    await press('5', 'Add', 'Multiply')

    expect(fetchMock).not.toHaveBeenCalled()
    expect(screen.getByText('5 ×')).toBeInTheDocument()

    await press('2', 'Equals')

    await waitFor(() => {
      expect(screen.getByLabelText('Calculator display')).toHaveValue('10')
    })
    expect(fetchMock).toHaveBeenCalledWith(
      'http://localhost:8080/api/v1/calculate',
      expect.objectContaining({
        body: JSON.stringify({ operation: 'multiply', a: 5, b: 2 }),
      }),
    )
  })

  it('requires an operand before equals or unary operations', async () => {
    render(<Calculator theme="light" onToggleTheme={vi.fn()} />)

    await press('5', 'Add', 'Equals')
    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Enter the second number',
    )

    await press('Square root')
    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Enter a number first',
    )

    await press('Percentage')
    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Enter a number first',
    )

    expect(fetchMock).not.toHaveBeenCalled()
  })

  it('uses a square root result as the second operand of a pending operation', async () => {
    fetchMock
      .mockResolvedValueOnce(mockResponse({ result: 3 }))
      .mockResolvedValueOnce(mockResponse({ result: 8 }))

    render(<Calculator theme="light" onToggleTheme={vi.fn()} />)

    await press('5', 'Add', '9', 'Square root')

    await waitFor(() => {
      expect(screen.getByLabelText('Calculator display')).toHaveValue('3')
    })
    expect(screen.getByText('5 + √(9)')).toBeInTheDocument()

    await press('Equals')

    await waitFor(() => {
      expect(screen.getByLabelText('Calculator display')).toHaveValue('8')
    })
    expect(fetchMock).toHaveBeenNthCalledWith(
      1,
      'http://localhost:8080/api/v1/calculate',
      expect.objectContaining({
        body: JSON.stringify({ operation: 'sqrt', a: 9 }),
      }),
    )
    expect(fetchMock).toHaveBeenNthCalledWith(
      2,
      'http://localhost:8080/api/v1/calculate',
      expect.objectContaining({
        body: JSON.stringify({ operation: 'add', a: 5, b: 3 }),
      }),
    )
  })

  it('applies percentages relative to the first operand for subtraction', async () => {
    fetchMock
      .mockResolvedValueOnce(mockResponse({ result: 0.1 }))
      .mockResolvedValueOnce(mockResponse({ result: 20 }))
      .mockResolvedValueOnce(mockResponse({ result: 180 }))

    render(<Calculator theme="light" onToggleTheme={vi.fn()} />)

    await press('2', '0', '0', 'Subtract', '1', '0', 'Percentage')

    await waitFor(() => {
      expect(screen.getByLabelText('Calculator display')).toHaveValue('180')
    })

    expect(fetchMock).toHaveBeenNthCalledWith(
      3,
      'http://localhost:8080/api/v1/calculate',
      expect.objectContaining({
        body: JSON.stringify({ operation: 'subtract', a: 200, b: 20 }),
      }),
    )
  })

  it('shows a connectivity error when a binary request fails unexpectedly', async () => {
    fetchMock.mockRejectedValueOnce(new Error('network unavailable'))

    render(<Calculator theme="light" onToggleTheme={vi.fn()} />)

    await press('1', 'Add', '2', 'Equals')

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Unable to reach the calculator service',
    )
  })

  it('shows backend and connectivity errors for unary operations', async () => {
    fetchMock
      .mockResolvedValueOnce(
        mockResponse({ error: 'square root of a negative number' }, false),
      )
      .mockRejectedValueOnce(new Error('network unavailable'))

    render(<Calculator theme="light" onToggleTheme={vi.fn()} />)

    await press('±', '9', 'Square root')
    expect(await screen.findByRole('alert')).toHaveTextContent(
      'square root of a negative number',
    )

    await press('AC', '9', 'Square root')
    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Unable to reach the calculator service',
    )
  })

})
