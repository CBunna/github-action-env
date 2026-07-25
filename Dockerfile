FROM node:18-alpine

WORKDIR /app/backend

# Setting the environment to production
ENV NODE_ENV=production

# Copy package*.json to package.json
COPY backend/package*.json .

# Install dependencies, --omit=dev means don't install dev dependencies
# We copy package*.json first to leverage Docker cache.
# If package*.json doesn't change, Docker will reuse the cached layer for npm ci.
RUN npm ci --omit=dev

# Copy backend source into /app/backend (this WORKDIR)
COPY backend/ .

# Copy frontend as a sibling of backend/, since server.js serves it from ../frontend
COPY frontend/ /app/frontend/

EXPOSE 3000

# Run the application
CMD ["npm", "start"]
