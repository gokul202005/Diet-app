FROM node:20-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./
COPY client/package*.json ./client/
COPY server/package*.json ./server/

# Install dependencies
RUN npm run install:all

# Copy all code
COPY . .

# Build client
RUN npm run build

EXPOSE 5000

CMD ["npm", "start"]
