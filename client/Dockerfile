FROM node:22-alpine AS build

WORKDIR /app

COPY package*.json ./

RUN npm i

COPY . .

# Vite bakes VITE_* variables into the bundle at build time, and .env files
# are excluded by .dockerignore, so the API URL must be passed as a build arg:
#   docker build --build-arg VITE_PUBLIC_BACKEND_URL=https://<api-host>/api .
ARG VITE_PUBLIC_BACKEND_URL
RUN test -n "$VITE_PUBLIC_BACKEND_URL" || (echo "VITE_PUBLIC_BACKEND_URL build arg is required" && exit 1)
ENV VITE_PUBLIC_BACKEND_URL=$VITE_PUBLIC_BACKEND_URL

RUN npm run build


FROM nginx:alpine

COPY --from=build /app/dist /usr/share/nginx/html

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]