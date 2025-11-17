import { Request, Response, NextFunction } from "express";
import multer, { StorageEngine } from "multer";

const storage: StorageEngine = multer.diskStorage({
  filename: function (req: Request, file, callback) {
     const uniqueName = Date.now() + "-" + file.originalname;
    callback(null, uniqueName);
  },
});

const upload = multer({ storage });
export const doctorUpload = upload.fields([
  { name: "image", maxCount: 1 },
  { name: "license", maxCount: 1 },
]);

export default upload;
