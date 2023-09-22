# Theater-backend

Backend of Isegye Theater

## Requirements

### Program

- Node.js >= 18.16.0
- MariaDB >= 10.5.4
- FFmpeg(h264_qsv, libwebp) >= 6.0

### Environment

|Key|Value|
|-|-|
|SUB_DATABASE_URL|"redis://{user}:{password}@{hostname}:{port}/{index}"|
|DATABASE_URL|"mysql://{user}:{password}@{hostname}:{port}/{database}"|
|EMAIL_HOST|"{hostname}"|
|EMAIL_PASSWORD|"{password}"|
|EMAIL_PORT|"{port}"|
|EMAIL_USER|"{user}@{hostname}"|
|MEDIA_SERVER_URL|"https://{hostname}"|
|PBKDF2_ITERATION|"32"|
|PORT|"3000"|
|RATE_LIMIT|"1024"|
|AWS_ACCESS_KEY_ID|"{accessKey}"|
|AWS_SECRET_ACCESS_KEY|"{secretAccessKey}"|
|AWS_BUCKET_NAME|"isegye"|
|AWS_CLOUDFRONT_URL|"https://{hostname}/"|
|LOG_LEVEL|"debug"|
