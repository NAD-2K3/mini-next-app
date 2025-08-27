FROM node:current-alpine as base

RUN apk add --no-cache libc6-compat

WORKDIR /app

COPY package.json .

RUN npm i

COPY . . 

WORKDIR /app/apps/next-app

RUN npm run build

EXPOSE 3000

ENTRYPOINT ["npm", "run", "start"]