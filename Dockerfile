# specify the node base image with your desired version node:<version>
FROM node:8-alpine

# Create app directory
WORKDIR /usr/app

# Install app dependencies
COPY *.json ./

# If you are building your code for production
RUN npm ci

# Bundle app source
COPY ./src .

# Build Boi
RUN npm run build

CMD [ "npm", "start" ]
