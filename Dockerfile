# Specify the node base image
FROM node:10-alpine

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
RUN npm i -g ts-node
RUN ./tools/copy-assets.ts

ARG SOURCE_COMMIT
ENV SOURCE_COMMIT=$SOURCE_COMMIT

CMD [ "npm", "start" ]
