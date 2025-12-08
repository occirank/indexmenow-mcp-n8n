FROM node:18-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy source code
COPY . .

# Build TypeScript
RUN npm run build

# Expose the server port for HTTP/SSE mode
EXPOSE 3000

# Set environment variable with placeholder (override at runtime)
ENV PORT=3000

# Command to run the application in HTTP mode
CMD ["node", "build/index.js"]