FROM node:15
WORKDIR /usr/src/app

COPY package.json ./
RUN npm install
COPY . .
EXPOSE 8080
EXPOSE 8082
CMD ["node", "app"]