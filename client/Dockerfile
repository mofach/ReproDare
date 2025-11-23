# client/Dockerfile

# Tahap 1: Build React
FROM node:20-alpine as build
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
# Build production
RUN npm run build

# Tahap 2: Serve pakai Nginx
FROM nginx:alpine
# Copy hasil build ke folder nginx
COPY --from=build /app/dist /usr/share/nginx/html
# Config port agar cocok dengan Cloud Run (default 8080)
RUN sed -i 's/80/8080/g' /etc/nginx/conf.d/default.conf
EXPOSE 8080
CMD ["nginx", "-g", "daemon off;"]
