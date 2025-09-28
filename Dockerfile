# ---- Base Stage ----
# Use the official Bun image, which is based on Debian.
FROM oven/bun:1.0 AS base
WORKDIR /usr/src/app

# ---- Dependencies Stage ----
# Create a separate stage for installing dependencies to leverage Docker's layer caching.
FROM base AS deps
COPY package.json bun.lockb* ./
# Install ONLY production dependencies. This creates a smaller, more secure final image.
RUN bun install --production

# ---- Final Application Stage ----
# Copy dependencies from the 'deps' stage and then copy the application code.
FROM base AS runner
COPY --from=deps /usr/src/app/node_modules ./node_modules
COPY . .

# Expose the port the app runs on.
EXPOSE 3010

# Define the command to run your app using Bun.
CMD ["bun", "start"]