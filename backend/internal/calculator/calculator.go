package calculator

import (
	"errors"
	"fmt"
)

var (
	ErrDivisionByZero       = errors.New("division by zero")
	ErrUnsupportedOperation = errors.New("unsupported operation")
)

func Calculate(operation string, a, b float64) (float64, error) {
	switch operation {
	case "add":
		return a + b, nil
	case "subtract":
		return a - b, nil
	case "multiply":
		return a * b, nil
	case "divide":
		if b == 0 {
			return 0, ErrDivisionByZero
		}
		return a / b, nil
	default:
		return 0, fmt.Errorf("%w: %q", ErrUnsupportedOperation, operation)
	}
}
