# Stage 1: Build the Flutter Web application
FROM ghcr.io/cirruslabs/flutter:3.10.6 as build

WORKDIR /app

# Copy the Flutter project files
COPY . .

# Get dependencies and build for web
RUN flutter pub get
RUN flutter build web --release

# Stage 2: Serve the application with Nginx
FROM nginx:alpine

# Copy the build output from the previous stage
COPY --from=build /app/build/web /usr/share/nginx/html

# Overwrite default Nginx configuration
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
