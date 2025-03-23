# Use official Node.js image
FROM node:22.14.0

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy all source files
COPY . .

RUN chmod +x ./node_modules/.bin/tsc

# Build the TypeScript code
RUN npm run build

# Expose your app port
EXPOSE 5000

# Start only the Express server
CMD ["npm", "run", "start"]
