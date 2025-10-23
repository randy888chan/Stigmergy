# ---- Builder Stage ----
# This stage installs all dependencies (including dev) and builds the application.
FROM oven/bun:1.0 AS builder
WORKDIR /usr/src/app

# Copy all source files
COPY . .

# Install all dependencies
RUN bun install

# Build the application
RUN bun build ./engine/server.js --outdir ./dist

# ---- Dependencies Stage ----
# This stage installs ONLY production dependencies to create a lean node_modules layer.
FROM oven/bun:1.0 AS deps
WORKDIR /usr/src/app
COPY package.json bun.lockb* ./
RUN bun install --production

# ---- Runner Stage ----
# This is the final, lean production image.
FROM oven/bun:1.0
WORKDIR /usr/src/app

# Copy production node_modules from the 'deps' stage.
COPY --from=deps /usr/src/app/node_modules ./node_modules

# Copy the bundled application code from the 'builder' stage.
COPY --from=builder /usr/src/app/dist ./dist

# Copy necessary runtime assets that are not part of the bundle.
# The server needs the dashboard files to serve the UI, and the core definitions.
COPY --from=builder /usr/src/app/dashboard/public ./dashboard/public
COPY --from=builder /usr/src/app/.stigmergy-core ./.stigmergy-core
COPY --from=builder /usr/src/app/stigmergy.config.js .

# Expose the port the app runs on.
EXPOSE 3010

# Define the command to run the bundled application.
CMD ["bun", "./dist/server.js"]
