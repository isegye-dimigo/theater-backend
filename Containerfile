FROM alpine:latest

WORKDIR /application

COPY package.json /application
COPY tsconfig.json /application
COPY schema.prisma /application
COPY distribution /application/distribution

RUN apk add --no-cache intel-media-sdk intel-media-driver ffmpeg nodejs npm
RUN npm install --force --omit=dev
RUN npx prisma generate
RUN apk del npm

ENTRYPOINT ["node", "--require=tsconfig-paths/register", "distribution/application.js", "--max_old_space_size=4096"]