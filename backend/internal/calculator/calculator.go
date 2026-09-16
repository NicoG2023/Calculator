package calculator

import (
	"errors"
	"fmt"
	"math"
)

var (
	ErrDivisionByZero        = errors.New("division by zero")
	ErrNegativeSquareRoot    = errors.New("square root of a negative number")
	ErrResultOutOfRange      = errors.New("result out of range")
	ErrSecondOperandRequired = errors.New("second operand is required")
	ErrUnsupportedOperation  = errors.New("unsupported operation")
)

func Calculate(operation string, a float64, b *float64) (float64, error) {
	var result float64

	switch operation {
	case "add", "subtract", "multiply", "divide", "power":
		if b == nil {
			return 0, ErrSecondOperandRequired
		}

		switch operation {
		case "add":
			result = a + *b
		case "subtract":
			result = a - *b
		case "multiply":
			result = a * *b
		case "divide":
			if *b == 0 {
				return 0, ErrDivisionByZero
			}
			result = a / *b
		case "power":
			result = math.Pow(a, *b)
		}
	case "sqrt":
		if a < 0 {
			return 0, ErrNegativeSquareRoot
		}
		result = math.Sqrt(a)
	case "percentage":
		result = a / 100
	default:
		return 0, fmt.Errorf("%w: %q", ErrUnsupportedOperation, operation)
	}

	if math.IsInf(result, 0) || math.IsNaN(result) {
		return 0, ErrResultOutOfRange
	}

	return result, nil
}
