package httpapi

import (
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"
)

func TestCalculateSuccess(t *testing.T) {
	tests := []struct {
		name       string
		body       string
		wantResult float64
	}{
		{
			name:       "addition",
			body:       `{"operation":"add","a":10,"b":5}`,
			wantResult: 15,
		},
		{
			name:       "exponentiation",
			body:       `{"operation":"power","a":2,"b":8}`,
			wantResult: 256,
		},
		{
			name:       "square root without second operand",
			body:       `{"operation":"sqrt","a":81}`,
			wantResult: 9,
		},
		{
			name:       "percentage without second operand",
			body:       `{"operation":"percentage","a":25}`,
			wantResult: 0.25,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			request := httptest.NewRequest(http.MethodPost, "/api/v1/calculate", strings.NewReader(tt.body))
			response := httptest.NewRecorder()

			NewHandler().ServeHTTP(response, request)

			if response.Code != http.StatusOK {
				t.Fatalf("status = %d, want %d", response.Code, http.StatusOK)
			}
			if got := response.Header().Get("Content-Type"); got != "application/json" {
				t.Fatalf("Content-Type = %q, want application/json", got)
			}

			var body calculateResponse
			if err := json.NewDecoder(response.Body).Decode(&body); err != nil {
				t.Fatalf("decode response: %v", err)
			}
			if body.Result != tt.wantResult {
				t.Fatalf("result = %v, want %v", body.Result, tt.wantResult)
			}
		})
	}
}

func TestCalculateValidationErrors(t *testing.T) {
	tests := []struct {
		name       string
		body       string
		wantStatus int
		wantError  string
	}{
		{
			name:       "malformed JSON",
			body:       `{"operation":"add","a":10,`,
			wantStatus: http.StatusBadRequest,
			wantError:  "invalid request body",
		},
		{
			name:       "missing operation",
			body:       `{"a":10,"b":5}`,
			wantStatus: http.StatusBadRequest,
			wantError:  "operation is required",
		},
		{
			name:       "missing first operand",
			body:       `{"operation":"add","b":5}`,
			wantStatus: http.StatusBadRequest,
			wantError:  "a is required",
		},
		{
			name:       "missing second operand for binary operation",
			body:       `{"operation":"add","a":10}`,
			wantStatus: http.StatusBadRequest,
			wantError:  "b is required",
		},
		{
			name:       "multiple JSON values",
			body:       `{"operation":"add","a":10,"b":5} {}`,
			wantStatus: http.StatusBadRequest,
			wantError:  "request body must contain a single JSON object",
		},
		{
			name:       "operand outside float64 range",
			body:       `{"operation":"add","a":1e309,"b":1}`,
			wantStatus: http.StatusBadRequest,
			wantError:  "invalid request body",
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			request := httptest.NewRequest(http.MethodPost, "/api/v1/calculate", strings.NewReader(tt.body))
			response := httptest.NewRecorder()

			NewHandler().ServeHTTP(response, request)

			assertErrorResponse(t, response, tt.wantStatus, tt.wantError)
		})
	}
}

func TestCalculateDomainErrors(t *testing.T) {
	tests := []struct {
		name      string
		body      string
		wantError string
	}{
		{
			name:      "division by zero",
			body:      `{"operation":"divide","a":10,"b":0}`,
			wantError: "division by zero",
		},
		{
			name:      "negative square root",
			body:      `{"operation":"sqrt","a":-1}`,
			wantError: "square root of a negative number",
		},
		{
			name:      "unsupported operation",
			body:      `{"operation":"modulo","a":10,"b":3}`,
			wantError: `unsupported operation: "modulo"`,
		},
		{
			name:      "result outside float64 range",
			body:      `{"operation":"power","a":1e308,"b":2}`,
			wantError: "result out of range",
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			request := httptest.NewRequest(http.MethodPost, "/api/v1/calculate", strings.NewReader(tt.body))
			response := httptest.NewRecorder()

			NewHandler().ServeHTTP(response, request)

			assertErrorResponse(t, response, http.StatusBadRequest, tt.wantError)
		})
	}
}

func TestCalculateRejectsUnsupportedMethod(t *testing.T) {
	request := httptest.NewRequest(http.MethodGet, "/api/v1/calculate", nil)
	response := httptest.NewRecorder()

	NewHandler().ServeHTTP(response, request)

	assertErrorResponse(t, response, http.StatusMethodNotAllowed, "method not allowed")
	if got := response.Header().Get("Allow"); got != http.MethodPost {
		t.Fatalf("Allow = %q, want %q", got, http.MethodPost)
	}
}

func TestHealth(t *testing.T) {
	request := httptest.NewRequest(http.MethodGet, "/health", nil)
	response := httptest.NewRecorder()

	NewHandler().ServeHTTP(response, request)

	if response.Code != http.StatusOK {
		t.Fatalf("status = %d, want %d", response.Code, http.StatusOK)
	}

	var body healthResponse
	if err := json.NewDecoder(response.Body).Decode(&body); err != nil {
		t.Fatalf("decode response: %v", err)
	}
	if body.Status != "ok" {
		t.Fatalf("status body = %q, want ok", body.Status)
	}
}

func TestCORSPreflight(t *testing.T) {
	request := httptest.NewRequest(http.MethodOptions, "/api/v1/calculate", nil)
	response := httptest.NewRecorder()

	NewHandler().ServeHTTP(response, request)

	if response.Code != http.StatusNoContent {
		t.Fatalf("status = %d, want %d", response.Code, http.StatusNoContent)
	}
	if got := response.Header().Get("Access-Control-Allow-Origin"); got != "*" {
		t.Fatalf("Access-Control-Allow-Origin = %q, want *", got)
	}
}

func assertErrorResponse(t *testing.T, response *httptest.ResponseRecorder, wantStatus int, wantError string) {
	t.Helper()

	if response.Code != wantStatus {
		t.Fatalf("status = %d, want %d", response.Code, wantStatus)
	}

	var body errorResponse
	if err := json.NewDecoder(response.Body).Decode(&body); err != nil {
		t.Fatalf("decode error response: %v", err)
	}
	if body.Error != wantError {
		t.Fatalf("error = %q, want %q", body.Error, wantError)
	}
}
