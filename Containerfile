FROM alpine:latest

WORKDIR /application

COPY package.json /application
COPY distribution /application/distribution

RUN apk add --no-cache intel-media-sdk intel-media-driver ffmpeg nodejs npm
RUN npm install --force --omit=dev
RUN apk del npm
RUN rm -r package.json package-lock.json node_modules/@types
RUN find node_modules -type f \( -name "*.ts" -o -name "*.md" \) ! -name "LICENSE.md" -delete
RUN find node_modules -type d -empty -delete

ENTRYPOINT ["node", "--require=tsconfig-paths/register", "distribution/application.js", "--max_old_space_size=4096"]	