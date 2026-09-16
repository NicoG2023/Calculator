export type BinaryOperation =
  | 'add'
  | 'subtract'
  | 'multiply'
  | 'divide'
  | 'power'

export type UnaryOperation = 'sqrt' | 'percentage'

export type Operation = BinaryOperation | UnaryOperation

export type CalculateRequest =
  | {
      operation: BinaryOperation
      a: number
      b: number
    }
  | {
      operation: UnaryOperation
      a: number
    }

export interface CalculateResponse {
  result: number
}

export interface ApiErrorResponse {
  error: string
}
