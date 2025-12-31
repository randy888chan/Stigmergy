# Use the official Bun image as a base
FROM oven/bun:1.0

# Set the working directory in the container
WORKDIR /usr/src/app

# Copy dependency definition files
COPY package.json bun.lockb* ./

# Copy workspace packages to resolve dependencies
COPY packages ./packages

# Install all dependencies. Using --no-frozen-lockfile to avoid issues.
RUN bun install --no-frozen-lockfile

# Copy the rest of the application source code
COPY . .

# Expose the port the app runs on. The docker-compose.yml handles mapping.
EXPOSE 3010
