package calculator

import (
	"errors"
	"fmt"
	"math"
)

var (
	ErrDivisionByZero       = errors.New("division by zero")
	ErrResultOutOfRange     = errors.New("result out of range")
	ErrUnsupportedOperation = errors.New("unsupported operation")
)

func Calculate(operation string, a, b float64) (float64, error) {
	var result float64

	switch operation {
	case "add":
		result = a + b
	case "subtract":
		result = a - b
	case "multiply":
		result = a * b
	case "divide":
		if b == 0 {
			return 0, ErrDivisionByZero
		}
		result = a / b
	default:
		return 0, fmt.Errorf("%w: %q", ErrUnsupportedOperation, operation)
	}

	if math.IsInf(result, 0) || math.IsNaN(result) {
		return 0, ErrResultOutOfRange
	}

	return result, nil
}
