# CyCOS Orchestrator Manager (Node.js)
FROM node:20-alpine

# Use the built-in non-root user that comes with the Node alpine image
USER node

WORKDIR /app

# Ensure node user owns the working directory
# We switch back to root temporarily to set permissions, then back to node
USER root
RUN chown -R node:node /app
USER node

# Copy package files and install dependencies
# Note: For this to work there needs to be a package.json in System/Core/Manager
# For now we use a placeholder or assume it exists.
# COPY package*.json ./
# RUN npm ci --only=production

COPY . .

# Start the Manager
CMD ["node", "index.js"]
