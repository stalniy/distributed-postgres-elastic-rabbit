FROM node:10.16-alpine

WORKDIR /app
VOLUME /app
EXPOSE 8000

CMD ["npm", "start"]