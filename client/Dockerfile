# Build stage
FROM node:20-slim AS build

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .

# Vite inlines VITE_* variables at build time, so they must be supplied as build args
ARG VITE_API_URL
ARG VITE_BACKEND_URI
ENV VITE_API_URL=$VITE_API_URL
ENV VITE_BACKEND_URI=$VITE_BACKEND_URI

RUN npm run build

# Serve stage
FROM nginx:alpine

COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
