FROM golang:1.27-alpine AS build

WORKDIR /src

COPY go.mod ./
RUN go mod download

COPY . .
RUN CGO_ENABLED=0 GOOS=linux go build \
    -trimpath \
    -ldflags="-s -w" \
    -o /out/calculator-api \
    ./cmd/server

FROM alpine:3.22

RUN addgroup -S app && adduser -S -G app app

WORKDIR /app
COPY --from=build /out/calculator-api ./calculator-api

ENV PORT=8080
EXPOSE 8080

USER app
CMD ["./calculator-api"]
