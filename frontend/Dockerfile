# Build stage
FROM node:20-alpine AS build

WORKDIR /app

# Copy dependency configuration
COPY package*.json ./
RUN npm ci

# Copy source code and build
COPY . .
# Set build environment variable for base API URL
ENV VITE_API_URL=""
RUN npm run build

# Run stage
FROM nginx:alpine

# Copy custom Nginx configuration
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copy build artifacts to Nginx html directory
COPY --from=build /app/dist /usr/share/nginx/html

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
