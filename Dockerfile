# Specify the node base image
FROM node:10-slim

###
# Install puppeteer
# https://github.com/puppeteer/puppeteer/blob/master/docs/troubleshooting.md#running-puppeteer-in-docker
###

# Install latest chrome dev package and fonts to support major charsets (Chinese, Japanese, Arabic, Hebrew, Thai and a few others)
# Note: this installs the necessary libs to make the bundled version of Chromium that Puppeteer
# installs, work.
RUN apt-get update \
    && apt-get install -y wget gnupg \
    && wget -q -O - https://dl-ssl.google.com/linux/linux_signing_key.pub | apt-key add - \
    && sh -c 'echo "deb [arch=amd64] http://dl.google.com/linux/chrome/deb/ stable main" >> /etc/apt/sources.list.d/google.list' \
    && apt-get update \
    && apt-get install -y google-chrome-unstable fonts-ipafont-gothic fonts-wqy-zenhei fonts-thai-tlwg fonts-kacst fonts-freefont-ttf \
      --no-install-recommends \
    && rm -rf /var/lib/apt/lists/*

###
# Install overseer
###

# Create app directory
WORKDIR /usr/app

# Install app dependencies
COPY *.json ./

# If you are building your code for production
RUN npm ci

# Bundle app source
COPY ./src ./src

# Build Boi
RUN npm run build

ARG SOURCE_COMMIT
ENV SOURCE_COMMIT=$SOURCE_COMMIT

CMD [ "npm", "start" ]
