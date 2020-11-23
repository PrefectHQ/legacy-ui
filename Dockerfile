FROM node:10.16.0 as ui

# Set version args from CMD input
ARG PREFECT_VERSION=development
ENV PREFECT_VERSION=$PREFECT_VERSION

ARG VUE_APP_PUBLIC_PATH="/"
ENV VUE_APP_PUBLIC_PATH=$VUE_APP_PUBLIC_PATH

ARG VUE_APP_SERVER_URL="http://localhost:4200/graphql"
ENV VUE_APP_SERVER_URL=$VUE_APP_SERVER_URL

# Write the arg into the .env file
RUN echo "VUE_APP_PREFECT_VERSION=${PREFECT_VERSION}" >> .env
RUN echo "VUE_APP_PUBLIC_PATH=${VUE_APP_PUBLIC_PATH}" >> .env

# Move application files to the app directory
COPY ./ /app
COPY ./LICENSE LICENSE

# Switch to the app directory
WORKDIR /app

# Install dependencies
RUN npm ci

# Build static files
RUN npm run build

FROM nginx:stable

# Reuse the build args due to multi-stage Docker build
ARG VUE_APP_PUBLIC_PATH="/"
ENV VUE_APP_PUBLIC_PATH=$VUE_APP_PUBLIC_PATH

# Update package list and install the jq package
# which we use for manipulating settings JSON blobs
RUN apt-get update && apt-get install jq -y

# Copy the previously built static files to the nginx container
COPY --from=ui /app/dist /var/prefect-ui
RUN mkdir -p "/var/www${VUE_APP_PUBLIC_PATH}" && \
    mv -- /var/prefect-ui/* "/var/www${VUE_APP_PUBLIC_PATH}"

# Replace the default nginx config
# with the one we've defined here
RUN echo "server { \n\
  # We'll want to make this dynamic at some point  \n\
  listen 8080; \n\
  root /var/www; \n\
  index ${VUE_APP_PUBLIC_PATH}index.html; \n\
  location / { \n\
    try_files \$uri ${VUE_APP_PUBLIC_PATH}index.html =404; \n\
  } \n\
}" > /etc/nginx/conf.d/default.conf



# Copy and allow all users to execute both the script to start the server
# and the script that intercepts termination requests
COPY ./start_server.sh /start_server.sh
RUN chmod a+x /start_server.sh

COPY ./intercept.sh /intercept.sh
RUN chmod a+x /intercept.sh

STOPSIGNAL SIGINT

CMD ["/intercept.sh"]
