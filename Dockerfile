FROM node:14

# Create the app directory
WORKDIR /usr/src/app

# Install needed dependencies
COPY package*.json ./

RUN npm install
# If running for production enable this:
# RUN npm ci --only=production

# Bundle the app source
COPY . .

EXPOSE 8080

CMD ["npm", "run", "start"]