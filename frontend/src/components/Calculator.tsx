import { type ChangeEvent, type FormEvent, useState } from 'react'
import { calculate, CalculatorApiError } from '../services/calculatorApi'
import type { BinaryOperation, UnaryOperation } from '../types/calculator'

interface CalculatorProps {
  theme: 'light' | 'dark'
  onToggleTheme: () => void
}

const operationSymbols: Record<BinaryOperation, string> = {
  add: '+',
  subtract: '−',
  multiply: '×',
  divide: '÷',
  power: '^',
}

const partialNumberPattern = /^-?(?:\d+\.?\d*|\.\d*)(?:[eE][+-]?\d*)?$/
const maxInputLength = 32

function parseNumber(value: string): number {
  if (value === '' || /[eE][+-]?$/.test(value)) {
    throw new Error('Enter a complete number')
  }

  const parsed = Number(value)
  if (!Number.isFinite(parsed)) {
    throw new Error('Number is out of range')
  }

  return parsed
}

function toDisplayValue(value: number): string {
  return String(value)
}

function unaryExpression(operation: UnaryOperation, value: string): string {
  return operation === 'sqrt' ? `√(${value})` : `${value}%`
}

export function Calculator({ theme, onToggleTheme }: CalculatorProps) {
  const [display, setDisplay] = useState('0')
  const [storedOperand, setStoredOperand] = useState<string | null>(null)
  const [operation, setOperation] = useState<BinaryOperation | null>(null)
  const [expression, setExpression] = useState('')
  const [waitingForOperand, setWaitingForOperand] = useState(false)
  const [showingResult, setShowingResult] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  const clearError = () => setError(null)

  const startFreshInput = (value: string) => {
    setDisplay(value)
    setWaitingForOperand(false)

    if (showingResult) {
      setStoredOperand(null)
      setOperation(null)
      setExpression('')
      setShowingResult(false)
    }
  }

  const inputDigit = (digit: string) => {
    if (isLoading) return

    clearError()

    if (waitingForOperand || showingResult) {
      startFreshInput(digit)
      return
    }

    if (display.length >= maxInputLength) return
    setDisplay((current) => {
      if (current === '0') return digit
      if (current === '-0') return `-${digit}`
      return `${current}${digit}`
    })
  }

  const inputDecimal = () => {
    if (isLoading) return

    clearError()

    if (waitingForOperand || showingResult) {
      startFreshInput('0.')
      return
    }

    if (display.includes('e') || display.includes('E') || display.includes('.')) {
      return
    }

    setDisplay((current) => `${current}.`)
  }

  const inputExponent = () => {
    if (isLoading) return

    clearError()

    if (waitingForOperand || showingResult) {
      startFreshInput('0e')
      return
    }

    if (display.length >= maxInputLength || /[eE]/.test(display)) return
    setDisplay((current) => `${current}e`)
  }

  const toggleSign = () => {
    if (isLoading) return

    clearError()

    if (waitingForOperand || showingResult) {
      startFreshInput('-0')
      return
    }

    const exponentMatch = display.match(/^(.*[eE])([+-]?)(\d*)$/)
    if (exponentMatch) {
      const [, mantissa, sign, exponent] = exponentMatch
      setDisplay(`${mantissa}${sign === '-' ? '' : '-'}${exponent}`)
      return
    }

    setDisplay((current) =>
      current.startsWith('-') ? current.slice(1) : `-${current}`,
    )
  }

  const clearAll = () => {
    if (isLoading) return

    setDisplay('0')
    setStoredOperand(null)
    setOperation(null)
    setExpression('')
    setWaitingForOperand(false)
    setShowingResult(false)
    setError(null)
  }

  const deleteLastCharacter = () => {
    if (isLoading) return

    clearError()

    if (waitingForOperand || showingResult) {
      startFreshInput('0')
      return
    }

    setDisplay((current) => {
      if (
        current.length <= 1 ||
        (current.length === 2 && current.startsWith('-'))
      ) {
        return '0'
      }
      return current.slice(0, -1)
    })
  }

  const requestCalculation = async (
    left: string,
    right: string,
    selectedOperation: BinaryOperation,
  ): Promise<number | null> => {
    let a: number
    let b: number

    try {
      a = parseNumber(left)
      b = parseNumber(right)
    } catch (validationError) {
      setError(
        validationError instanceof Error
          ? validationError.message
          : 'Enter valid numbers',
      )
      return null
    }

    setIsLoading(true)
    clearError()

    try {
      return await calculate({ operation: selectedOperation, a, b })
    } catch (requestError) {
      setError(
        requestError instanceof CalculatorApiError
          ? requestError.message
          : 'Unable to reach the calculator service',
      )
      return null
    } finally {
      setIsLoading(false)
    }
  }

  const requestUnaryCalculation = async (
    value: string,
    selectedOperation: UnaryOperation,
  ): Promise<number | null> => {
    let a: number

    try {
      a = parseNumber(value)
    } catch (validationError) {
      setError(
        validationError instanceof Error
          ? validationError.message
          : 'Enter a valid number',
      )
      return null
    }

    setIsLoading(true)
    clearError()

    try {
      return await calculate({ operation: selectedOperation, a })
    } catch (requestError) {
      setError(
        requestError instanceof CalculatorApiError
          ? requestError.message
          : 'Unable to reach the calculator service',
      )
      return null
    } finally {
      setIsLoading(false)
    }
  }

  const selectOperation = async (nextOperation: BinaryOperation) => {
    if (isLoading) return

    clearError()

    if (operation && storedOperand !== null && waitingForOperand) {
      setOperation(nextOperation)
      setExpression(`${storedOperand} ${operationSymbols[nextOperation]}`)
      return
    }

    if (operation && storedOperand !== null && !waitingForOperand) {
      const result = await requestCalculation(storedOperand, display, operation)

      if (result === null) return

      const resultDisplay = toDisplayValue(result)
      setDisplay(resultDisplay)
      setStoredOperand(resultDisplay)
      setOperation(nextOperation)
      setExpression(`${resultDisplay} ${operationSymbols[nextOperation]}`)
      setWaitingForOperand(true)
      setShowingResult(false)
      return
    }

    try {
      parseNumber(display)
    } catch (validationError) {
      setError(
        validationError instanceof Error
          ? validationError.message
          : 'Enter a valid number',
      )
      return
    }

    setStoredOperand(display)
    setOperation(nextOperation)
    setExpression(`${display} ${operationSymbols[nextOperation]}`)
    setWaitingForOperand(true)
    setShowingResult(false)
  }

  const applySquareRoot = async () => {
    if (isLoading) return

    clearError()

    if (waitingForOperand) {
      setError('Enter a number first')
      return
    }

    const input = display
    const result = await requestUnaryCalculation(input, 'sqrt')

    if (result === null) return

    const resultDisplay = toDisplayValue(result)
    setDisplay(resultDisplay)
    setWaitingForOperand(false)

    if (operation && storedOperand !== null) {
      setExpression(
        `${storedOperand} ${operationSymbols[operation]} ${unaryExpression('sqrt', input)}`,
      )
      setShowingResult(false)
      return
    }

    setStoredOperand(null)
    setOperation(null)
    setExpression(`${unaryExpression('sqrt', input)} =`)
    setShowingResult(true)
  }

  const applyPercentage = async () => {
    if (isLoading) return

    clearError()

    if (waitingForOperand) {
      setError('Enter a number first')
      return
    }

    const input = display
    const percentage = await requestUnaryCalculation(input, 'percentage')

    if (percentage === null) return

    if (!operation || storedOperand === null) {
      setDisplay(toDisplayValue(percentage))
      setStoredOperand(null)
      setOperation(null)
      setExpression(`${unaryExpression('percentage', input)} =`)
      setWaitingForOperand(false)
      setShowingResult(true)
      return
    }

    let rightOperand = percentage

    if (operation === 'add' || operation === 'subtract') {
      const percentageOfStoredOperand = await requestCalculation(
        storedOperand,
        toDisplayValue(percentage),
        'multiply',
      )

      if (percentageOfStoredOperand === null) return
      rightOperand = percentageOfStoredOperand
    }

    const result = await requestCalculation(
      storedOperand,
      toDisplayValue(rightOperand),
      operation,
    )

    if (result === null) return

    setDisplay(toDisplayValue(result))
    setExpression(
      `${storedOperand} ${operationSymbols[operation]} ${unaryExpression('percentage', input)} =`,
    )
    setStoredOperand(null)
    setOperation(null)
    setWaitingForOperand(false)
    setShowingResult(true)
  }

  const handleEquals = async (event?: FormEvent<HTMLFormElement>) => {
    event?.preventDefault()

    if (isLoading) return

    if (!operation || storedOperand === null) {
      try {
        const normalizedValue = toDisplayValue(parseNumber(display))
        setDisplay(normalizedValue)
        setExpression(`${display} =`)
        setShowingResult(true)
        clearError()
      } catch (validationError) {
        setError(
          validationError instanceof Error
            ? validationError.message
            : 'Enter a valid number',
        )
      }
      return
    }

    if (waitingForOperand) {
      setError('Enter the second number')
      return
    }

    const completedExpression = `${storedOperand} ${operationSymbols[operation]} ${display} =`
    const result = await requestCalculation(storedOperand, display, operation)

    if (result === null) return

    setDisplay(toDisplayValue(result))
    setExpression(completedExpression)
    setStoredOperand(null)
    setOperation(null)
    setWaitingForOperand(false)
    setShowingResult(true)
  }

  const handleDisplayChange = (event: ChangeEvent<HTMLInputElement>) => {
    if (isLoading) return

    const nextValue = event.target.value.trim()
    if (nextValue.length > maxInputLength) return

    if (nextValue === '') {
      setDisplay('')
      setWaitingForOperand(false)
      setShowingResult(false)
      clearError()
      return
    }

    if (!partialNumberPattern.test(nextValue)) return

    setDisplay(nextValue)
    setWaitingForOperand(false)
    setShowingResult(false)
    clearError()
  }

  return (
    <section className="calculator" aria-labelledby="calculator-title">
      <div className="calculator-topbar">
        <h1 id="calculator-title">Calculator</h1>
        <button
          type="button"
          className="theme-toggle"
          onClick={onToggleTheme}
          aria-label={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
          title={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
        >
          <span aria-hidden="true">{theme === 'light' ? '☾' : '☀'}</span>
        </button>
      </div>

      <form onSubmit={handleEquals}>
        <div className="display-panel">
          <div className="display-meta">
            <span className="expression" aria-live="polite">
              {expression || '\u00a0'}
            </span>
            <button
              type="button"
              className="delete-button"
              onClick={deleteLastCharacter}
              disabled={isLoading}
              aria-label="Delete last character"
              title="Delete last character"
            >
              ⌫
            </button>
          </div>

          <input
            className="calculator-display"
            type="text"
            inputMode="decimal"
            autoComplete="off"
            spellCheck="false"
            value={display}
            onChange={handleDisplayChange}
            aria-label="Calculator display"
          />

          <div className="status-line" aria-live="polite">
            {isLoading ? (
              <span className="loading-message">Calculating…</span>
            ) : error ? (
              <span className="error-message" role="alert">
                {error}
              </span>
            ) : (
              <span aria-hidden="true">&nbsp;</span>
            )}
          </div>
        </div>

        <div className="keypad" aria-label="Calculator keypad">
          <button
            type="button"
            className="key key-operation"
            onClick={() => void selectOperation('power')}
            aria-label="Power"
            title="Exponentiation"
          >
            xʸ
          </button>
          <button
            type="button"
            className="key key-operation"
            onClick={() => void applySquareRoot()}
            aria-label="Square root"
          >
            √
          </button>
          <button
            type="button"
            className="key key-operation"
            onClick={() => void applyPercentage()}
            aria-label="Percentage"
          >
            %
          </button>
          <button
            type="button"
            className="key key-operation"
            onClick={() => void selectOperation('divide')}
            aria-label="Divide"
          >
            ÷
          </button>

          <button type="button" className="key key-utility" onClick={clearAll}>
            AC
          </button>
          <button type="button" className="key key-utility" onClick={toggleSign}>
            ±
          </button>
          <button
            type="button"
            className="key key-utility key-exp"
            onClick={inputExponent}
            title="Scientific notation exponent"
          >
            EXP
          </button>
          <button
            type="button"
            className="key key-operation"
            onClick={() => void selectOperation('multiply')}
            aria-label="Multiply"
          >
            ×
          </button>

          {['7', '8', '9'].map((digit) => (
            <button
              key={digit}
              type="button"
              className="key"
              onClick={() => inputDigit(digit)}
            >
              {digit}
            </button>
          ))}
          <button
            type="button"
            className="key key-operation"
            onClick={() => void selectOperation('subtract')}
            aria-label="Subtract"
          >
            −
          </button>

          {['4', '5', '6'].map((digit) => (
            <button
              key={digit}
              type="button"
              className="key"
              onClick={() => inputDigit(digit)}
            >
              {digit}
            </button>
          ))}
          <button
            type="button"
            className="key key-operation"
            onClick={() => void selectOperation('add')}
            aria-label="Add"
          >
            +
          </button>

          {['1', '2', '3'].map((digit) => (
            <button
              key={digit}
              type="button"
              className="key"
              onClick={() => inputDigit(digit)}
            >
              {digit}
            </button>
          ))}
          <button
            type="submit"
            className="key key-equals"
            disabled={isLoading}
            aria-label="Equals"
          >
            =
          </button>

          <button
            type="button"
            className="key key-zero"
            onClick={() => inputDigit('0')}
          >
            0
          </button>
          <button
            type="button"
            className="key"
            onClick={inputDecimal}
            aria-label="Decimal point"
          >
            .
          </button>
        </div>
      </form>
    </section>
  )
}
