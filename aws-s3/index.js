import { createInterface } from "node:readline/promises";
import pLimit from 'p-limit'
import fs from 'fs';
import {
  S3Client,
  PutObjectCommand,
  CreateBucketCommand,
  DeleteObjectCommand,
  DeleteBucketCommand,
  paginateListObjectsV2,
  GetObjectCommand,
} from "@aws-sdk/client-s3";

const limit = pLimit(50)

const sampleText = `# AWS S3 Testing Document

## Introduction to Cloud Storage

Amazon Simple Storage Service (S3) is an object storage service offering industry-leading scalability...
[full text from artifact]
`;

const s3Client = new S3Client({
  region: 'us-east-1', credentials: {
    accessKeyId: process.env.accessKey,
    secretAccessKey: process.env.secretKey
  }
});

async function getS3Object(bucket, key, range = '') {
  const { Body, ContentRange } = await s3Client.send(
    new GetObjectCommand({
      Bucket: bucket,
      Key: key,
      Range: range
    }),
  );
  return { Body, ContentRange }
}

async function getS3Text(bucket, key, range = '') {
  const { Body, ContentRange } = await getS3Object(bucket, key, range)
  console.log('Logging text content range:', ContentRange)
  return await Body.transformToString();
}

async function getS3Binary(bucket, key) {
  const { Body, ContentRange } = await getS3Object(bucket, key)
  console.log('Logging biinary content range:', ContentRange)
  return await Body.transformToByteArray()
}

async function putS3Object(bucket, key, body) {
  const Body = await s3Client.send(
    new PutObjectCommand({
      Bucket: bucket,
      Key: key,
      Body: body,
    }))
  return Body
}

const uploadFile = async (bucket, key, body) => {
  return await s3Client.send(
    new PutObjectCommand({
      Bucket: bucket,
      Key: key,
      Body: body,
    }))
}

const uploadBatch = async (bucket, files) => {
  const BATCH_SIZE = 50;
  for (let i = 0; i < files.length; i += BATCH_SIZE) {
    const batch = files.slice(i, i + BATCH_SIZE);
    await Promise.all(batch.map(file => uploadFile(bucket, file.name, file.content)))
    console.log(`Uploaded batch ${i / BATCH_SIZE + 1}`);
  }
}

const uploadTasksPlimit = (files) => files.map((file) => {
  return limit(() => s3Client.send(new PutObjectCommand({
    Bucket: bucketName,
    Key: file.name,
    Body: file.buffer
  })));
});

// This starts 50 uploads immediately and starts a new one 
// whenever one finishes until all are done.
// await Promise.all(uploadTasks);


export async function main() {
  const bucketName = 'mycloudfrontwebb';

  const indexHtml = await getS3Text(bucketName, 'index.html', 'bytes=0-9')
  console.log('loggin index.html contents: ', indexHtml);

  const imageBuffer = await getS3Binary(bucketName, 'apple.jpeg');
  fs.writeFileSync('apple.jpeg', imageBuffer);
  const base64Image = Buffer.from(imageBuffer).toString('base64');
  console.log(`data:image/jpeg;base64: ,${base64Image.substring(0, 100)} `);

  const bucketNameTest = `test-bucket-1dfafsdfdasf`;
  const createdBucket = await s3Client.send(
    new CreateBucketCommand({
      Bucket: bucketNameTest,
    }),
  );
  console.log('Created Bucket:', createdBucket)

  const purFirst = await putS3Object(bucketNameTest, "my-first-object.txt", sampleText)
  console.log('Put first:', purFirst)

  const putFirstRetrieved = await getS3Text(bucketNameTest, "my-first-object.txt")
  console.log('Put retrieved:', putFirstRetrieved)

  const prompt = createInterface({
    input: process.stdin,
    output: process.stdout,
  });
  const result = await prompt.question("Empty and delete bucket? (y/n) ");
  prompt.close();

  if (result === "y") {
    const paginator = paginateListObjectsV2(
      { client: s3Client },
      { Bucket: bucketNameTest },
    );
    for await (const page of paginator) {
      const objects = page.Contents;
      if (objects) {
        for (const object of objects) {
          await s3Client.send(
            new DeleteObjectCommand({ Bucket: bucketNameTest, Key: object.Key }),
          );
        }
      }
    }

    await s3Client.send(new DeleteBucketCommand({ Bucket: bucketNameTest }));
  }
}

import { fileURLToPath } from "node:url";
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  main();
}
