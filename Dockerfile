FROM node:18

WORKDIR /usr/src/app
COPY . /usr/src/app
RUN npm ci
EXPOSE 8080
CMD [ "npm", "start" ]
