import { Buffer } from 'buffer';

// Make Buffer available globally
window.Buffer = window.Buffer || Buffer;

class UploadService {
  async uploadFile(file, fileName, folder = 'misc') {
    try {
      const finalFileName = fileName || this.generateUniqueFileName(file.name);

      const formData = new FormData();
      formData.append('file', file);
      formData.append('fileName', finalFileName);
      formData.append('folder', folder);

      const backendUrl = import.meta.env.VITE_BACKEND_URI || 'http://localhost:8000';
      const response = await fetch(`${backendUrl}/api/upload`, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Upload failed: ${response.statusText} - ${errorText}`);
      }

      const result = await response.json();

      if (result.success) {
        return {
          success: true,
          url: result.url,
          fileName: result.fileName,
          message: result.message
        };
      } else {
        throw new Error(result.message || 'Upload failed');
      }

    } catch (error) {
      console.error('Error uploading file:', error);
      return {
        success: false,
        error: error.message,
        url: null
      };
    }
  }

  isValidFileType(file) {
    const allowedTypes = [
      // Document types
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'text/plain',
      // Image types
      'image/jpeg',
      'image/jpg',
      'image/png',
      'image/gif',
      'image/webp'
    ];
    return allowedTypes.includes(file.type);
  }

  isValidFileSize(file, maxSizeMB = 10) {
    const maxSizeBytes = maxSizeMB * 1024 * 1024;
    return file.size <= maxSizeBytes;
  }

  validateFile(file) {
    const errors = [];

    if (!this.isValidFileType(file)) {
      errors.push('Invalid file type. Only PDF, DOC, DOCX, TXT, JPG, JPEG, PNG, GIF, and WEBP files are allowed.');
    }

    if (!this.isValidFileSize(file)) {
      errors.push('File size too large. Maximum size is 10MB.');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  generateUniqueFileName(originalName) {
    const timestamp = new Date().getTime();
    const randomString = Math.random().toString(36).substring(2, 15);
    const extension = originalName.split('.').pop();
    return `file_${timestamp}_${randomString}.${extension}`;
  }

  // Method to upload with validation
  async uploadFileWithValidation(file, customFileName = null, folder = 'misc') {
    try {
      const validation = this.validateFile(file);
      if (!validation.isValid) {
        return {
          success: false,
          error: validation.errors.join(' '),
          url: null
        };
      }

      const fileName = customFileName || this.generateUniqueFileName(file.name);
      return await this.uploadFile(file, fileName, folder);

    } catch (error) {
      console.error('File upload validation failed:', error);
      return {
        success: false,
        error: error.message,
        url: null
      };
    }
  }

  // Method to get file info
  getFileInfo(file) {
    return {
      name: file.name,
      size: file.size,
      type: file.type,
      lastModified: file.lastModified,
      sizeInMB: (file.size / (1024 * 1024)).toFixed(2)
    };
  }
}

const uploadService = new UploadService();

export default uploadService;
