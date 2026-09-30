FROM node:20-alpine

WORKDIR /app

# Install native dependencies required for audio processing (ffmpeg, build tools)
RUN apk add --no-cache ffmpeg python3 make g++ git

# Install dependencies
COPY package*.json ./
RUN npm install

# Copy application files and build
COPY . .
RUN npm run build

EXPOSE 3000
ENV NODE_ENV=production

CMD ["npm", "start"]
