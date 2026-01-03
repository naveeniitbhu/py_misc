import { S3Client } from "@aws-sdk/client-s3";
import { Upload } from "@aws-sdk/lib-storage";
import fs from "fs";

const uploadLargeFile = async (bucket, key, filePath) => {
  const fileStream = fs.createReadStream(filePath);

  const parallelUploads3 = new Upload({
    client: new S3Client({ region: "us-east-1" }),
    params: {
      Bucket: bucket,
      Key: key,
      Body: fileStream
    },

    // Performance Options
    queueSize: 4, // Number of concurrent uploads
    partSize: 1024 * 1024 * 5, // 5MB part size (min required by S3)
    leavePartsOnError: false, // Abort upload if a failure occurs
  });

  parallelUploads3.on("httpUploadProgress", (progress) => {
    console.log(`Uploaded part: ${progress.loaded} / ${progress.total}`);
  });

  try {
    await parallelUploads3.done();
    console.log("Upload complete!");
  } catch (e) {
    console.error("Upload failed", e);
  }
};

// Usage
uploadLargeFile("my-bucket-name", "folder/large-file.zip", "./local-file.zip");