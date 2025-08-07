# Use Node.js with Playwright pre-installed
FROM mcr.microsoft.com/playwright:v1.40.0-focal

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci

# Copy application files
COPY . .

# Create required directories
RUN mkdir -p test-results playwright-report logs public

# Set environment variables
ENV NODE_ENV=production
ENV CI=true
ENV HEADLESS=true
ENV PORT=3001
ENV HOST=0.0.0.0

# Expose port
EXPOSE 3001

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:3001/health || exit 1

# Start the API server
CMD ["npm", "start"]