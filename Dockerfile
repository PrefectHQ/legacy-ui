# syntax = docker/dockerfile:1.0-experimental
FROM node:14.7.0 as ui

# Set version args from CMD input
ARG PREFECT_VERSION=development
ENV PREFECT_VERSION=$PREFECT_VERSION

# Write the arg into the .env file
RUN echo "VUE_APP_PREFECT_VERSION=${PREFECT_VERSION}" >> .env

# Move application files to the app directory
COPY ./ /app
COPY ./LICENSE LICENSE

# Switch to the app directory
WORKDIR /app

# Install dependencies
RUN --mount=type=secret,id=FA_TOKEN cp /run/secrets/FA_TOKEN .npmrc
RUN npm ci

# Build static files
RUN npm run build

FROM nginxinc/nginx-unprivileged:stable

# Copy the previously built static files to the nginx container
COPY --from=ui /app/dist /var/www

# Replace the default nginx config
# with the one we've defined here
COPY ./nginx.conf /etc/nginx/conf.d/default.conf


# Copy and allow all users to execute both the script to start the server
# and the script that intercepts termination requests
COPY ./start_server.sh /start_server.sh
RUN chmod a+x /start_server.sh

COPY ./intercept.sh /intercept.sh
RUN chmod a+x /intercept.sh

STOPSIGNAL SIGINT

CMD ["/intercept.sh"]
