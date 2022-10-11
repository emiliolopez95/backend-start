FROM node:16.17-alpine3.16
WORKDIR /usr/src/app
COPY ./package.json .
COPY prisma ./prisma/
RUN npm install
COPY . .
RUN npm run build
EXPOSE 4000
CMD ["npm", "run", "prod"]
