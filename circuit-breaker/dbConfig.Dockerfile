# Use the official PostgreSQL image from DockerHub
FROM postgres:17

# Set environment variables for the PostgreSQL database (default values, override during runtime)
ENV POSTGRES_USER=postgres
ENV POSTGRES_PASSWORD=postgres
ENV POSTGRES_DB=circuitBreakerConfig

# Expose PostgreSQL default port
EXPOSE 5432

# Start PostgreSQL server
CMD ["postgres"]