# RelayOne portal (React) served by Nginx. Build:  docker build -t relayone-web --build-arg VITE_API_URL=https://api.example.com .
# The API address is baked into the build (Vite reads it at build time), so build once per environment.
FROM node:22-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
ARG VITE_API_URL=http://localhost:4000
ARG VITE_BASE_PATH=/
ENV VITE_API_URL=$VITE_API_URL VITE_BASE_PATH=$VITE_BASE_PATH
RUN npm run build

FROM nginx:1.27-alpine
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /usr/share/nginx/html
EXPOSE 80
HEALTHCHECK --interval=30s --timeout=3s CMD wget -qO- http://127.0.0.1/healthz || exit 1
