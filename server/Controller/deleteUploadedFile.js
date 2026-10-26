
const fs = require('fs');
const path = require('path');

const UPLOADS_ROOT = path.resolve(
  __dirname,
  '..',
  'public',
  'uploads'
);

const deleteUploadedFile = async (fileUrl, folder) => {
  if (!fileUrl || !folder) {
    throw new Error('File URL and folder are required');
  }

  const parsedUrl = new URL(fileUrl);
  const prefix = `/uploads/${folder}/`;

  if (!parsedUrl.pathname.startsWith(prefix)) {
    throw new Error(`URL does not belong to ${folder}`);
  }

  const fileName = decodeURIComponent(
    parsedUrl.pathname.slice(prefix.length)
  );

  if (
    !fileName ||
    fileName.includes('/') ||
    fileName.includes('\\') ||
    fileName === '.' ||
    fileName === '..'
  ) {
    throw new Error('Invalid filename');
  }

  const filePath = path.join(
    UPLOADS_ROOT,
    folder,
    fileName
  );

  // console.log('Uploads root:', UPLOADS_ROOT);
  // console.log('URL received:', fileUrl);
  // console.log('File path to delete:', filePath);
  // console.log('File exists:', fs.existsSync(filePath));

  await fs.promises.unlink(filePath);

  // console.log('File successfully deleted:', filePath);

  return true;
};

module.exports = deleteUploadedFile;
