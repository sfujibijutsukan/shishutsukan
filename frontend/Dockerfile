FROM node:18-alpine
WORKDIR /app

# Copy package.json and package-lock.json first for better layer caching
COPY package*.json ./
RUN npm install

# Copy the rest of the application code
COPY . .

# Set environment variables for React dev server
ENV HOST=0.0.0.0
ENV PORT=3000

EXPOSE 3000
CMD ["./node_modules/.bin/react-scripts", "start"]
