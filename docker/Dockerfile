# Anwendung in normaler Distro kompilieren
FROM golang:tip-alpine3.23 AS build
WORKDIR /src
COPY ./go.mod .
RUN go mod download
COPY ./app.go .
RUN go build -trimpath -ldflags="-s -w" -o /out/app ./app.go

# Minimalistische Runtime erstellen
# Default-Port ist 3000
FROM scratch
WORKDIR /app
COPY --from=build /out/app /app/app
COPY ./arrange /app/arrange
COPY ./server.crt /app/
COPY ./server.key /app/
ENV GIN_MODE=release
EXPOSE 3000
ENTRYPOINT ["/app/app"]