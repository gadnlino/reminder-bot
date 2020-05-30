FROM node
WORKDIR /app
COPY . .
#COPY package.json .
RUN npm install && npm update
#RUN ls
#COPY . /app/src
#COPY . .
EXPOSE 5000
ENTRYPOINT [ "npm", "start" ]