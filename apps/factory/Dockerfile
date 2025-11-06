# Factory AI Web Interface Dockerfile
FROM node:18-slim

# Install system dependencies
RUN apt-get update && apt-get install -y \
    curl \
    git \
    python3 \
    python3-pip \
    build-essential \
    sudo \
    && rm -rf /var/lib/apt/lists/*

# Create a non-root user for Factory AI
RUN useradd -m -s /bin/bash factoryuser && \
    echo "factoryuser ALL=(ALL) NOPASSWD:ALL" > /etc/sudoers.d/factoryuser

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install Node.js dependencies
RUN npm install

# Copy application files
COPY . .

# Create workspace directory
RUN mkdir -p /workspace && chown -R factoryuser:factoryuser /workspace

# Switch to factoryuser for Factory AI installation
USER factoryuser

# Install Factory AI CLI
RUN curl -fsSL https://app.factory.ai/cli | sh

# Make sure Factory CLI is in PATH
ENV PATH="/home/factoryuser/.local/bin:${PATH}"

# Set environment variables
ENV NODE_ENV=production
ENV PORT=8080
ENV PROJECT_DIR=/workspace

# Switch back to root to set final permissions
USER root
RUN chown -R factoryuser:factoryuser /app

# Switch to factoryuser for runtime
USER factoryuser

# Expose port
EXPOSE 8080

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:8080/health || exit 1

# Start the application
CMD ["npm", "start"]