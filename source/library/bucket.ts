import { DeleteObjectsCommand, ListObjectsV2Command, ListObjectsV2CommandOutput, ObjectIdentifier, PutObjectCommand, S3Client, ServiceOutputTypes } from '@aws-sdk/client-s3';
import { Readable } from 'stream';

const s3Client: S3Client = new S3Client({
	region: 'auto',
	endpoint: process['env']['STORAGE_ENDPOINT'],
	credentials: {
		accessKeyId: process['env']['STORAGE_ACCESS_KEY_ID'],
		secretAccessKey: process['env']['STORAGE_SECRET_ACCESS_KEY']
	}
});

export function putObject(path: string, body: Buffer | Readable, mime: string): Promise<ServiceOutputTypes> {
	return s3Client.send(new PutObjectCommand({
		Bucket: process['env']['STORAGE_BUCKET_NAME'],
		Key: path,
		Body: body,
		ContentType: mime
	}));
}

export function deleteObjects(paths: string[]): Promise<ServiceOutputTypes> {
	if(paths['length'] !== 0) {
		const objects: ObjectIdentifier[] = [];

		for(let i: number = 0; i < paths['length']; i++) {
			objects.push({
				Key: paths[i]
			});
		}

		return s3Client.send(new DeleteObjectsCommand({
			Bucket: process['env']['STORAGE_BUCKET_NAME'],
			Delete: {
				Objects: objects
			}
		}));
	} else {
		throw new Error('Paths must be exist');
	}
}

export function getObjectKeys(path: string): Promise<string[]> {
	return s3Client.send(new ListObjectsV2Command({
		Bucket: process['env']['STORAGE_BUCKET_NAME'],
		Prefix: path
	}))
	.then(function (list: ListObjectsV2CommandOutput): string[] {
		const keys: string[] = [];

		if(typeof(list['KeyCount']) === 'number' && Array.isArray(list['Contents'])) {
			for(let i: number = 0; i < list['KeyCount']; i++) {
				keys.push(list['Contents'][i]['Key'] as string);
			}
		}

		return keys;
	});
}