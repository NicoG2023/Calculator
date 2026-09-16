package calculator

import (
	"errors"
	"testing"
)

func TestCalculateSupportedOperations(t *testing.T) {
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
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			got, err := Calculate(tt.operation, tt.a, tt.b)
			if err != nil {
				t.Fatalf("Calculate() returned unexpected error: %v", err)
			}

			if got != tt.want {
				t.Fatalf("Calculate() = %v, want %v", got, tt.want)
			}
		})
	}
}

func TestCalculateDivisionByZero(t *testing.T) {
	_, err := Calculate("divide", 10, 0)
	if !errors.Is(err, ErrDivisionByZero) {
		t.Fatalf("Calculate() error = %v, want %v", err, ErrDivisionByZero)
	}
}

func TestCalculateResultOutOfRange(t *testing.T) {
	_, err := Calculate("add", 1e308, 1e308)
	if !errors.Is(err, ErrResultOutOfRange) {
		t.Fatalf("Calculate() error = %v, want %v", err, ErrResultOutOfRange)
	}
}

func TestCalculateUnsupportedOperation(t *testing.T) {
	_, err := Calculate("modulo", 10, 3)
	if !errors.Is(err, ErrUnsupportedOperation) {
		t.Fatalf("Calculate() error = %v, want an unsupported operation error", err)
	}
}
