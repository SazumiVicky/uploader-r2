/*
* dev: Sazumi Viki
* ig: @moe.sazumiviki
* gh: github.com/sazumivicky
* site: sazumi.moe
*/

const express = require('express');
const multer = require('multer');
const fs = require('fs');
const path = require('path');
const AWS = require('aws-sdk');
const mime = require('mime-types');
require('dotenv').config();

const app = express();
const port = process.env.PORT || 3000;

const uploadDir = path.join(__dirname, 'public', 'tmp');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

function generateRandomString() {
  return Math.random().toString(36).substring(2, 8);
}

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const uniqueName = generateRandomString() + path.extname(file.originalname);
    cb(null, uniqueName);
  }
});

const upload = multer({ storage: storage });

app.use(express.static('public'));

const s3 = new AWS.S3({
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  endpoint: process.env.CLOUDFLARE_ENDPOINT,
  region: process.env.AWS_REGION,
  signatureVersion: 'v4'
});

function checkFileSize(req, res, next) {
  if (req.file && req.file.size > 50 * 1024 * 1024) {
    res.setHeader("Content-Type", "application/json");
    return res.status(400).send(JSON.stringify({ error: 'Error: File max upload 50mb' }, null, 2));
  }
  next();
}

app.post('/upload', upload.single('fileInput'), checkFileSize, (req, res) => {
  if (!req.file) {
    res.setHeader("Content-Type", "application/json");
    return res.status(400).send(JSON.stringify({ error: 'No file uploaded.' }, null, 2));
  }

  const startTime = Date.now();
  const fileContent = fs.readFileSync(req.file.path);
  const mimeType = mime.lookup(req.file.originalname) || 'application/octet-stream';
  const params = {
    Bucket: process.env.BUCKET_NAME,
    Key: req.file.filename,
    Body: fileContent,
    ContentType: mimeType
  };

  s3.upload(params, (err, data) => {
    if (err) {
      res.setHeader("Content-Type", "application/json");
      return res.status(500).send(JSON.stringify({ error: 'Oops something went wrong' }, null, 2));
    }

    fs.unlinkSync(req.file.path);

    const endTime = Date.now();
    const responseTime = `${endTime - startTime}ms`;
    const fileSize = (req.file.size / 1024).toFixed(2) + ' KB';
    const fileUrl = `https://${req.get('host')}/file/${req.file.filename}`;

    const jsonResponse = {
      Developer: "Sazumi Viki",
      status: "success",
      response: responseTime,
      type: mimeType,
      mimetype: mimeType,
      file_size: fileSize,
      url_response: fileUrl
    };

    res.setHeader("Content-Type", "application/json");
    res.send(JSON.stringify(jsonResponse, null, 2));
  });
});

async function fetchAllFiles(params, allFiles = []) {
  const data = await s3.listObjectsV2(params).promise();
  allFiles = allFiles.concat(data.Contents);

  for (const file of data.Contents) {
    if (file.Size > 50 * 1024 * 1024) {
      await s3.deleteObject({
        Bucket: params.Bucket,
        Key: file.Key
      }).promise();
      console.log(`Deleted file: ${file.Key} (Size: ${(file.Size / (1024 * 1024)).toFixed(2)} MB)`);
    }
  }

  if (data.IsTruncated) {
    params.ContinuationToken = data.NextContinuationToken;
    return fetchAllFiles(params, allFiles);
  }

  return allFiles;
}

app.get('/files', async (req, res) => {
  const params = {
    Bucket: process.env.BUCKET_NAME,
    MaxKeys: 1000
  };

  try {
    const allFiles = await fetchAllFiles(params);
    const totalSize = allFiles.reduce((acc, file) => acc + file.Size, 0);
    const jsonResponse = {
      totalFiles: allFiles.length,
      totalSize
    };
    res.setHeader("Content-Type", "application/json");
    res.send(JSON.stringify(jsonResponse, null, 2));
  } catch (err) {
    res.setHeader("Content-Type", "application/json");
    res.status(500).send(JSON.stringify({ error: 'Oops something went wrong' }, null, 2));
  }
});

app.get('/file/:filename', (req, res) => {
  const params = {
    Bucket: process.env.BUCKET_NAME,
    Key: req.params.filename
  };

  s3.getObject(params, (err, data) => {
    if (err) {
      return res.status(404).sendFile(path.join(__dirname, 'public', 'file-notfound.html'));
    }

    res.setHeader('Content-Type', data.ContentType);
    res.send(data.Body);
  });
});

app.use(express.static('public'));

app.use((req, res, next) => {
  res.status(404).sendFile(path.join(__dirname, 'public', '404.html'));
});

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});