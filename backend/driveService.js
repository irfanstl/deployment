import { google } from 'googleapis';
import multer from 'multer';
import path from 'path';
import stream from 'stream';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Use multer to store the file in memory instead of saving to disk
const storage = multer.memoryStorage();
export const upload = multer({ storage: storage });

// Create a Google Drive client
const getDriveService = () => {
  const KEYFILEPATH = path.join(__dirname, 'google-credentials.json');
  const SCOPES = ['https://www.googleapis.com/auth/drive'];

  const auth = new google.auth.GoogleAuth({
    keyFile: KEYFILEPATH,
    scopes: SCOPES,
  });
  
  return google.drive({ version: 'v3', auth });
};

/**
 * Uploads a file to Google Drive
 * @param {Object} fileObject - The file object from multer (req.file)
 * @returns {Promise<string>} - The shared Google Drive link of the uploaded file
 */
export const uploadFileToDrive = async (fileObject) => {
  try {
    const driveService = getDriveService();
    const folderId = process.env.GOOGLE_DRIVE_FOLDER_ID;

    // Convert the file buffer to a stream
    const bufferStream = new stream.PassThrough();
    bufferStream.end(fileObject.buffer);

    const { data } = await driveService.files.create({
      requestBody: {
        name: fileObject.originalname,
        parents: folderId ? [folderId] : [], // Use folder ID from .env if available
      },
      media: {
        mimeType: fileObject.mimetype,
        body: bufferStream,
      },
      fields: 'id, webViewLink, webContentLink',
    });

    // Make the file public so anyone with the link can view it
    await driveService.permissions.create({
      fileId: data.id,
      requestBody: {
        role: 'reader',
        type: 'anyone',
      },
    });

    return data.webViewLink; // Returns the public view link
  } catch (error) {
    console.error('Error uploading file to Google Drive:', error.message);
    throw error;
  }
};
