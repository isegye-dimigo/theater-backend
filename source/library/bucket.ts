import { DeleteObjectCommand, DeleteObjectsCommand, ListObjectsCommand, ListObjectsV2Command, ListObjectsV2CommandOutput, ObjectIdentifier, PutObjectCommand, S3Client, ServiceOutputTypes } from '@aws-sdk/client-s3';
import { Readable } from 'stream';

const s3Client: S3Client = new S3Client({
	region: 'ap-northeast-2'
});

new DeleteObjectsCommand({
	Bucket: process['env']['AWS_BUCKET_NAME'],
	Delete: {
		Objects: [{
			Key: ''
		}]
	}
})

export function putObject(path: string, body: Buffer | Readable): Promise<ServiceOutputTypes> {
	return s3Client.send(new PutObjectCommand({
		Bucket: process['env']['AWS_BUCKET_NAME'],
		Key: path,
		Body: body
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
			Bucket: process['env']['AWS_BUCKET_NAME'],
			Delete: {
				Objects: objects
			}
		}));
	} else {
		return Promise.resolve({
			TagSet: '',
			$metadata: {}
		});
	}
}

export function getObjectKeys(path: string): Promise<string[]> {
	return s3Client.send(new ListObjectsV2Command({
		Bucket: process['env']['AWS_BUCKET_NAME'],
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