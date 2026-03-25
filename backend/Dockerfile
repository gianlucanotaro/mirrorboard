FROM golang:1.23-alpine AS builder
WORKDIR /app
COPY go.mod go.sum ./
RUN go mod download
COPY . .
RUN CGO_ENABLED=0 GOOS=linux go build -o mirrorboard .

FROM alpine:3.20
# ca-certificates required for outbound HTTPS calls (e.g. Habitica API)
RUN apk --no-cache add ca-certificates
WORKDIR /app
COPY --from=builder /app/mirrorboard .
EXPOSE 8080
CMD ["./mirrorboard"]
