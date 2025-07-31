# Use official Node.js 18 Alpine image for a lightweight container
FROM node:18-alpine

# Set working directory
WORKDIR /app

# Copy package files and install dependencies
COPY package*.json ./
RUN npm install --production

# Install pm2 globally
RUN npm install pm2 -g

# Copy the rest of the application code
COPY . .

# Expose the port the app runs on
EXPOSE 3000

# Start the app with pm2
CMD ["pm2-runtime", "index.js"]
