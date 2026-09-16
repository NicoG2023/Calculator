package calculator

import (
	"errors"
	"testing"
)

func operand(value float64) *float64 {
	return &value
}

func TestCalculateBinaryOperations(t *testing.T) {
	tests := []struct {
		name      string
		operation string
		a         float64
		b         float64
		want      float64
	}{
		{name: "addition", operation: "add", a: 10, b: 5, want: 15},
		{name: "subtraction", operation: "subtract", a: 10, b: 5, want: 5},
		{name: "multiplication", operation: "multiply", a: -4, b: 2.5, want: -10},
		{name: "division", operation: "divide", a: 10, b: 4, want: 2.5},
		{name: "exponentiation", operation: "power", a: 2, b: 8, want: 256},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			got, err := Calculate(tt.operation, tt.a, operand(tt.b))
			if err != nil {
				t.Fatalf("Calculate() returned unexpected error: %v", err)
			}

			if got != tt.want {
				t.Fatalf("Calculate() = %v, want %v", got, tt.want)
			}
		})
	}
}

func TestCalculateUnaryOperations(t *testing.T) {
	tests := []struct {
		name      string
		operation string
		a         float64
		want      float64
	}{
		{name: "square root", operation: "sqrt", a: 81, want: 9},
		{name: "percentage", operation: "percentage", a: 25, want: 0.25},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			got, err := Calculate(tt.operation, tt.a, nil)
			if err != nil {
				t.Fatalf("Calculate() returned unexpected error: %v", err)
			}

			if got != tt.want {
				t.Fatalf("Calculate() = %v, want %v", got, tt.want)
			}
		})
	}
}

func TestCalculateRequiresSecondOperandForBinaryOperations(t *testing.T) {
	_, err := Calculate("add", 10, nil)
	if !errors.Is(err, ErrSecondOperandRequired) {
		t.Fatalf("Calculate() error = %v, want %v", err, ErrSecondOperandRequired)
	}
}

func TestCalculateDivisionByZero(t *testing.T) {
	_, err := Calculate("divide", 10, operand(0))
	if !errors.Is(err, ErrDivisionByZero) {
		t.Fatalf("Calculate() error = %v, want %v", err, ErrDivisionByZero)
	}
}

func TestCalculateNegativeSquareRoot(t *testing.T) {
	_, err := Calculate("sqrt", -1, nil)
	if !errors.Is(err, ErrNegativeSquareRoot) {
		t.Fatalf("Calculate() error = %v, want %v", err, ErrNegativeSquareRoot)
	}
}

func TestCalculateResultOutOfRange(t *testing.T) {
	_, err := Calculate("power", 1e308, operand(2))
	if !errors.Is(err, ErrResultOutOfRange) {
		t.Fatalf("Calculate() error = %v, want %v", err, ErrResultOutOfRange)
	}
}

func TestCalculateUnsupportedOperation(t *testing.T) {
	_, err := Calculate("modulo", 10, operand(3))
	if !errors.Is(err, ErrUnsupportedOperation) {
		t.Fatalf("Calculate() error = %v, want an unsupported operation error", err)
	}
}
