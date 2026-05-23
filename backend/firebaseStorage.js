import admin from 'firebase-admin';
import multer from 'multer';
import { v4 as uuidv4 } from 'uuid';

export const upload = multer({ storage: multer.memoryStorage() });

export const uploadFileToCloud = async (fileObject) => {
  try {
    const bucket = admin.storage().bucket();
    const extension = fileObject.originalname.split('.').pop();
    const filename = `uploads/${uuidv4()}.${extension}`;
    const file = bucket.file(filename);

    await file.save(fileObject.buffer, {
      metadata: {
        contentType: fileObject.mimetype,
      },
    });

    try {
      await file.makePublic();
    } catch (err) {
      console.warn('Could not make file public automatically. Using alt=media URL format.', err.message);
    }

    // Return the Firebase Storage URL (alt=media format ensures it is accessible if rules allow or if made public)
    return `https://firebasestorage.googleapis.com/v0/b/${bucket.name}/o/${encodeURIComponent(filename)}?alt=media`;
  } catch (error) {
    console.error('Error uploading file to Firebase Storage:', error);
    throw error;
  }
};
