# Build stage
FROM eclipse-temurin:21-jdk-alpine AS builder
WORKDIR /app
COPY pom.xml .
COPY src ./src

# Download dependencies first (layer caching)
RUN apk add --no-cache maven && \
    mvn dependency:go-offline -B

# Build the application
RUN mvn package -DskipTests -B

# Runtime stage
FROM eclipse-temurin:21-jre-alpine
WORKDIR /app

# Create non-root user
RUN addgroup -S cipherpad && adduser -S cipherpad -G cipherpad

# Copy the built JAR
COPY --from=builder /app/target/cipherpad-1.0.0.jar app.jar

# Change ownership
RUN chown -R cipherpad:cipherpad /app
USER cipherpad

# Expose port
EXPOSE 8080

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=30s --retries=3 \
    CMD wget --no-verbose --tries=1 --spider http://localhost:8080/api/health || exit 1

# Run
ENTRYPOINT ["java", "-Dspring.profiles.active=prod", "-jar", "app.jar"]
