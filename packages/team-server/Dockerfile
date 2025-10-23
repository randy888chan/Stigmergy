# Use an official Bun image as a parent image
FROM oven/bun:1

# Set the working directory in the container
WORKDIR /usr/src/app

# Copy the package.json and bun.lockb files
COPY package.json bun.lockb* ./

# Install app dependencies
RUN bun install --production

# Copy the rest of the application source code
COPY . .

# Expose the port the app runs on
EXPOSE 3012

# Define the command to run the app
CMD [ "bun", "start" ]
