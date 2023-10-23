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
|DATABASE_URL|mysql://{user}:{password}@{hostname}:{port}/{database}|
|CACHE_DATABASE_URL|redis://{user}:{password}@{hostname}:{port}/{index}|
|SEARCH_DATABASE_URL|https://{user}:{password}@{hostname}:{port}|
|EMAIL_HOST|{hostname}|
|EMAIL_PASSWORD|{password}|
|EMAIL_PORT|{port}|
|EMAIL_USER|{user}@{hostname}|
|PBKDF2_ITERATION|32|
|PORT|3000|
|RATE_LIMIT|1024|
|STORAGE_ENDPOINT|https://{hostname}|
|STORAGE_ACCESS_KEY_ID|{accessKeyId}|
|STORAGE_SECRET_ACCESS_KEY|{secretAccessKey}|
|STORAGE_BUCKET_NAME|{bukkitName}|
|STORAGE_URL|https://{hostname}/|
|LOG_LEVEL|debug|