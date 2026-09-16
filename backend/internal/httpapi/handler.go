package httpapi

import (
	"encoding/json"
	"errors"
	"io"
	"net/http"

	"github.com/NicoG2023/calculator/backend/internal/calculator"
)

type calculateRequest struct {
	Operation string   `json:"operation"`
	A         *float64 `json:"a"`
	B         *float64 `json:"b"`
}

type calculateResponse struct {
	Result float64 `json:"result"`
}

type errorResponse struct {
	Error string `json:"error"`
}

type healthResponse struct {
	Status string `json:"status"`
}

func NewHandler() http.Handler {
	mux := http.NewServeMux()
	mux.HandleFunc("/api/v1/calculate", calculateHandler)
	mux.HandleFunc("/health", healthHandler)

	return withCORS(mux)
}

func calculateHandler(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		w.Header().Set("Allow", http.MethodPost)
		writeError(w, http.StatusMethodNotAllowed, "method not allowed")
		return
	}

	request, err := decodeCalculateRequest(r)
	if err != nil {
		writeError(w, http.StatusBadRequest, err.Error())
		return
	}

	result, err := calculator.Calculate(request.Operation, *request.A, *request.B)
	if err != nil {
		handleCalculatorError(w, err)
		return
	}

	writeJSON(w, http.StatusOK, calculateResponse{Result: result})
}

func healthHandler(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		w.Header().Set("Allow", http.MethodGet)
		writeError(w, http.StatusMethodNotAllowed, "method not allowed")
		return
	}

	writeJSON(w, http.StatusOK, healthResponse{Status: "ok"})
}

func decodeCalculateRequest(r *http.Request) (calculateRequest, error) {
	var request calculateRequest

	decoder := json.NewDecoder(r.Body)
	decoder.DisallowUnknownFields()

	if err := decoder.Decode(&request); err != nil {
		return calculateRequest{}, errors.New("invalid request body")
	}

	if err := decoder.Decode(&struct{}{}); err != io.EOF {
		return calculateRequest{}, errors.New("request body must contain a single JSON object")
	}

	switch {
	case request.Operation == "":
		return calculateRequest{}, errors.New("operation is required")
	case request.A == nil:
		return calculateRequest{}, errors.New("a is required")
	case request.B == nil:
		return calculateRequest{}, errors.New("b is required")
	default:
		return request, nil
	}
}

func handleCalculatorError(w http.ResponseWriter, err error) {
	switch {
	case errors.Is(err, calculator.ErrDivisionByZero),
		errors.Is(err, calculator.ErrResultOutOfRange),
		errors.Is(err, calculator.ErrUnsupportedOperation):
		writeError(w, http.StatusBadRequest, err.Error())
	default:
		writeError(w, http.StatusInternalServerError, "internal server error")
	}
}

func writeError(w http.ResponseWriter, status int, message string) {
	writeJSON(w, status, errorResponse{Error: message})
}

func writeJSON(w http.ResponseWriter, status int, payload any) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	_ = json.NewEncoder(w).Encode(payload)
}

func withCORS(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Access-Control-Allow-Origin", "*")
		w.Header().Set("Access-Control-Allow-Headers", "Content-Type")
		w.Header().Set("Access-Control-Allow-Methods", "GET, POST, OPTIONS")

		if r.Method == http.MethodOptions {
			w.WriteHeader(http.StatusNoContent)
			return
		}

		next.ServeHTTP(w, r)
	})
}
