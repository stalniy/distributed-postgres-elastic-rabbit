FROM node:10.16-alpine

WORKDIR /app
VOLUME /app
EXPOSE 8000

CMD ["./node_modules/.bin/pm2-runtime", "ecosystem.yml"]