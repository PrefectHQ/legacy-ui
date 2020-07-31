FROM python:3.8
LABEL maintainer="nicholas@prefect.io"

# Install GCP-related packages
RUN echo "deb [signed-by=/usr/share/keyrings/cloud.google.gpg] https://packages.cloud.google.com/apt cloud-sdk main" | tee -a /etc/apt/sources.list.d/google-cloud-sdk.list && \
    apt-get install apt-transport-https ca-certificates gnupg && \
    curl https://packages.cloud.google.com/apt/doc/apt-key.gpg | apt-key --keyring /usr/share/keyrings/cloud.google.gpg add - && \
    apt-get update && apt-get install -y google-cloud-sdk

# Get node 12
RUN \
    curl -sL https://deb.nodesource.com/setup_12.x | bash -

# Install node
RUN apt install -y nodejs

# Install pnpm
RUN npm install -g pnpm