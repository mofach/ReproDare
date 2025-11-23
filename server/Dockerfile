# server/Dockerfile
FROM node:18-alpine

WORKDIR /app

# Copy dependency defs
COPY package*.json ./
COPY prisma ./prisma/

# Install dependencies
RUN npm install

# Generate Prisma Client
RUN npx prisma generate

# Copy source code
COPY . .

# Environment variable default (nanti ditimpa di GUI)
ENV PORT=8080

# Start command
CMD ["npm", "start"]