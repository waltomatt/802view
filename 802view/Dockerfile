FROM node:15
WORKDIR /usr/src/802view

COPY . .
RUN npm install --prefix ./app
EXPOSE 8082
CMD ["node", "app"]