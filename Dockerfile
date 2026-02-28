# Step 1: Building the React frontend
FROM node:18-alpine AS client-builder
WORKDIR /app/client
COPY client/package*.json ./
RUN npm install
COPY client/ ./
RUN npm run build

# Step 2: Server setup
FROM node:18-alpine
WORKDIR /app

# Copy package.json from the root (server)
COPY package*.json ./
RUN npm install

# Copy all necessary folders
COPY server/ ./server/
COPY data/ ./data/
RUN mkdir -p ./uploads

# Copy the compiled frontend to the folder the server expects
COPY --from=client-builder /app/client/dist ./client/dist

EXPOSE 3000

# Start the server from the server/ folder
CMD ["node", "server/server.js"]