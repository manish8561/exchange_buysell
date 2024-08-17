FROM node:18.19-alpine

WORKDIR /app

COPY package.json ./

RUN npm i -g @nestjs/cli

RUN npm i

COPY . .

RUN npm run build

RUN ls -larth

RUN touch .env

EXPOSE 3002 4002

CMD [ "npm", "run", "start:prod" ]
