import express from "express";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import multer from "multer";
import 'dotenv/config';

const bucketName = process.env.bucketName;
const awsConfig = {
  credentials: {
    accessKeyId: process.env.AccessKey,
    secretAccessKey: process.env.SecretKey,
  },
  region: process.env.region,
};

const s3 = new S3Client(awsConfig);

const PORT = 4040;

const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

let upload = multer({
  limits: {
    fileSize: 1024 * 1024 * 5,
  },
  fileFilter: function (req, file, done) {
    if (
      file.mimetype === "image/jpeg" ||
      file.mimetype === "image/png" ||
      file.mimetype === "image/jpg"
    ) {
      done(null, true);
    } else {
      var newError = new Error("File type is incorrect");
      newError.name = "MulterError";
      done(newError, false);
    }
  },
});

const uploadToS3 = async (fileData) => {
    try {
      const fileName = `${Date.now().toString()}.jpg`;
      const params = {
        Bucket: bucketName,
        Key: `myfile/${fileName}`,
        Body: fileData,
      };
      const command = new PutObjectCommand(params);
      const data = await s3.send(command);
      
      // Construct the file URL
      const fileUrl = `https://s3.amazonaws.com/${bucketName}/myfile/${fileName}`;
      console.log(data);
      return fileUrl;
    } catch (err) {
      console.log(err);
      throw err;
    }
  };
  

  app.post("/upload-multiple", upload.array("images", 3), async (req, res) => {
    if (req.files && req.files.length > 0) {
      try {
        let files = [];  
  
        for (const file of req.files) {
          const uploadedFile = await uploadToS3(file.buffer);  
          console.log(uploadedFile);
          files.push(uploadedFile);  
        }
  
        res.send({
          files, 
          msg: `Successfully uploaded ${req.files.length} files!`,
        });
      } catch (err) {
        res.status(500).send({ error: "Failed to upload images" });
      }
    } else {
      res.status(400).send({ error: "No files to upload" });
    }
  });
  

app.listen(PORT, () => {
    console.log(`Server is running on ${PORT}`)
});
