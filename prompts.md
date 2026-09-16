# AI-Assisted Development Prompts

The prompts below are **representative, consolidated versions of the instructions used during development**. Repetitive troubleshooting, command output, and minor follow-up messages were intentionally omitted. The prompts were normalized after the fact using **EARS (Easy Approach to Requirements Syntax)** so that the engineering intent, constraints, and acceptance criteria are easy to review.

AI-generated changes were always reviewed and validated locally before being committed.

## EARS convention used

The prompts use a small subset of EARS patterns:

- **Ubiquitous:** `The system shall ...`
- **Event-driven:** `WHEN <event>, the system shall ...`
- **Unwanted behavior:** `IF <undesired condition>, THEN the system shall ...`
- **State-driven:** `WHILE <state>, the system shall ...`
- **Optional/conditional:** `WHERE <condition>, the system shall ...`

The goal was not to create a formal requirements specification, but to give the coding agent precise, testable instructions.

---

## Prompt 1 — Implement the calculator backend

```text
You are a senior software engineer working as an autonomous coding agent in an existing monorepo.

Context
- Backend: Go.
- Prefer the standard library over third-party web frameworks.
- Keep the implementation proportional to a 2–4 hour technical assignment.
- Source code, identifiers, errors, comments, and API fields must be written in English.
- Do not introduce abstractions unless they improve the current implementation.

Goal
Implement a small, idiomatic calculator domain and expose it through a REST API.

Requirements — EARS
- The backend shall keep arithmetic/domain logic independent from HTTP and JSON concerns.
- The calculator domain shall support add, subtract, multiply, and divide.
- WHEN division is requested with a zero divisor, the system shall return a domain error instead of a numeric result.
- WHEN an unsupported operation is requested, the system shall return an identifiable unsupported-operation error.
- The HTTP API shall expose POST /api/v1/calculate.
- The HTTP API shall expose GET /health.
- WHEN a valid calculation request is received, the system shall return the result as JSON.
- IF a request contains invalid JSON or missing required data, THEN the API shall return a JSON error with an appropriate 4xx status.
- IF the calculator returns a domain error, THEN the HTTP layer shall translate it to an appropriate client-facing JSON error.
- IF an HTTP method is not supported by an endpoint, THEN the API shall return 405 Method Not Allowed.

Architecture constraints
- Use internal/calculator for domain logic.
- Use internal/httpapi for transport logic.
- Use cmd/server as the executable entry point.
- Prefer net/http, encoding/json, errors, and testing.
- Do not add Gin, Fiber, a dependency-injection framework, repositories, strategy classes, or persistence.

Testing
- Use concise table-driven tests for arithmetic cases that share the same behavior.
- Add focused tests for division by zero and unsupported operations.
- Add HTTP tests with httptest for successful requests and meaningful error paths.
- Do not duplicate domain tests at the HTTP layer solely to increase coverage.

Verification
Run:
  gofmt -w internal/calculator/*.go internal/httpapi/*.go cmd/server/*.go
  go test ./...
  go test -cover ./...
  go vet ./...

Before finishing, summarize the files changed, design decisions, and verification results.
```

---

## Prompt 2 — Build a real calculator UI that delegates arithmetic to the API

```text
You are an autonomous frontend engineer working in the existing React + TypeScript + Vite application.

Goal
Build an intuitive calculator interface that feels like a calculator rather than a CRUD form. Keep API communication separate from UI state and do not duplicate backend arithmetic in the browser.

Requirements — EARS
- The frontend shall render a calculator-style display and keypad.
- The frontend shall provide buttons for digits, decimal input, add, subtract, multiply, divide, clear, sign toggle, delete, and equals.
- The frontend shall provide an EXP key for entering scientific notation.
- WHEN the user selects a supported arithmetic operation and requests a result, the frontend shall call POST /api/v1/calculate.
- WHEN a backend result is received successfully, the frontend shall display that result.
- IF the backend returns a structured error, THEN the frontend shall present the error to the user without crashing.
- IF the API cannot be reached, THEN the frontend shall show a useful connection error.
- WHILE a calculation request is in flight, the UI shall prevent accidental duplicate submissions or otherwise make the pending state clear.
- WHEN the user enters an incomplete or non-finite numeric value, the frontend shall prevent an invalid request from being sent.
- The frontend shall support basic mobile layouts.
- The frontend shall default to a light theme and provide a light/dark theme toggle.
- WHEN the user changes the theme, the frontend shall persist the preference locally.
- WHEN the application loads and a saved theme exists, the frontend shall restore it.

Design constraints
- Remove decorative technical labels such as "React + Go" from the calculator UI.
- Do not display implementation-detail messages explaining that the backend performs the arithmetic.
- Keep the interface visually compact and calculator-like.
- Keep UI state in React; do not introduce Redux, Zustand, or React Query.
- Put API communication in a dedicated service module.
- UI-only input transformations such as composing scientific notation may happen locally; supported arithmetic results must come from the backend.

Accessibility
- Use semantic buttons.
- Expose pressed/selected state where appropriate.
- Use an accessible live region for results and errors.

Verification
Run:
  npm run lint
  npm run build

Then manually verify desktop and mobile layouts, both themes, decimal input, scientific notation, successful calculations, and backend errors.
```

---

## Prompt 3 — Add meaningful tests and numerical hardening

```text
Act as a senior engineer reviewing the calculator for edge cases and test quality.

Goal
Strengthen behavior that can fail in realistic usage without chasing artificial 100% coverage.

Requirements — EARS
- The backend shall continue using float64 because arbitrary-precision arithmetic is outside the assignment scope.
- IF an arithmetic operation produces NaN or infinity, THEN the calculator shall return a result-out-of-range error instead of attempting to encode a non-finite JSON number.
- IF a JSON numeric operand itself cannot be decoded into the supported numeric representation, THEN the API shall reject the request as invalid.
- WHEN several backend cases share the same expected behavior, tests shall use table-driven structure where it improves readability.
- The frontend test suite shall focus on observable user behavior rather than component implementation details.
- WHEN a user performs arithmetic, frontend tests shall verify that the API service is invoked with the expected request.
- WHEN the backend reports an error, frontend tests shall verify that the error is rendered.
- WHEN operations are chained, tests shall verify that intermediate arithmetic is also delegated to the backend.
- WHEN scientific notation is entered without a pending binary operation, the UI shall normalize and display the numeric value correctly.
- WHEN the theme changes, tests shall verify persistence and restoration.

Tooling
- Use Go's testing package for backend tests.
- Use Vitest + React Testing Library for frontend tests.
- Use V8 coverage for the frontend.
- Do not create redundant tests merely to improve a percentage.

Verification
Backend:
  go test ./...
  go test -cover ./...
  go vet ./...

Frontend:
  npm run lint
  npm run build
  npm test
  npm run test:coverage

Report uncovered areas only when they represent meaningful risk; do not add low-value tests solely to force 100% coverage.
```

## Human review and validation

The coding agent was treated as an implementation assistant, not as the final source of truth. Generated changes were reviewed before commit and validated with the project's normal quality gates, including:

```bash
git apply --check <patch>
git diff --check
```

Backend:

```bash
gofmt -w ...
go test ./...
go test -cover ./...
go vet ./...
```

Frontend:

```bash
npm run lint
npm run build
npm test
npm run test:coverage
```

Full-stack behavior was additionally checked through manual browser interaction, `curl`, Docker Compose, and GitHub Actions.
