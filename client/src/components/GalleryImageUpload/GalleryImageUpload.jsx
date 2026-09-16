import React, { useState } from 'react';
import Modal from 'react-modal';
import uploadService from '../../services/uploadService';
import apiService from '../../services/apiService';
import styles from './GalleryImageUpload.module.scss';

const GalleryImageUpload = ({ isOpen, onClose, onImageAdded }) => {
  const [selectedFile, setSelectedFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState('');

  const handleFileSelect = (event) => {
    const file = event.target.files[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        alert('Please select an image file');
        return;
      }

      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        alert('File size must be less than 5MB');
        return;
      }

      setSelectedFile(file);
      
      // Create preview
      const reader = new FileReader();
      reader.onload = (e) => {
        setImagePreview(e.target.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      alert('Please select an image first');
      return;
    }

    setUploading(true);
    setUploadProgress('Uploading image...');

    try {
      const uploadResult = await uploadService.uploadFile(
        selectedFile,
        `gallery-${Date.now()}-${selectedFile.name}`,
        'gallery'
      );

      if (!uploadResult.success) {
        throw new Error(uploadResult.error || 'Upload failed');
      }

      setUploadProgress('Saving to database...');

      // Save image URL to database
      const galleryData = {
        images: uploadResult.url
      };

      const response = await apiService.request('/gallery', {
        method: 'POST',
        body: JSON.stringify(galleryData)
      });

      if (response) {
        setUploadProgress('Upload complete!');
        
        // Call callback if provided
        if (onImageAdded) {
          onImageAdded(response);
        }

        // Reset form
        setTimeout(() => {
          handleClose();
        }, 1000);
      }
    } catch (error) {
      console.error('Upload error:', error);
      setUploadProgress('');
      alert(`Upload failed: ${error.message}`);
    } finally {
      setUploading(false);
    }
  };

  const handleClose = () => {
    setSelectedFile(null);
    setImagePreview(null);
    setUploading(false);
    setUploadProgress('');
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onRequestClose={handleClose}
      className={styles.modal}
      overlayClassName={styles.overlay}
      ariaHideApp={false}
    >
      <div className={styles.modalContent}>
        <div className={styles.modalHeader}>
          <h2>Upload Gallery Image</h2>
          <button 
            className={styles.closeButton}
            onClick={handleClose}
            disabled={uploading}
          >
            ×
          </button>
        </div>

        <div className={styles.modalBody}>
          <div className={styles.uploadSection}>
            <div className={styles.fileInputContainer}>
              <input
                type="file"
                accept="image/*"
                onChange={handleFileSelect}
                className={styles.fileInput}
                id="galleryImageInput"
                disabled={uploading}
              />
              <label htmlFor="galleryImageInput" className={styles.fileInputLabel}>
                {selectedFile ? selectedFile.name : 'Choose Image File'}
              </label>
            </div>

            {imagePreview && (
              <div className={styles.previewContainer}>
                <h4>Preview:</h4>
                <img 
                  src={imagePreview} 
                  alt="Preview" 
                  className={styles.imagePreview}
                />
              </div>
            )}

            {uploadProgress && (
              <div className={styles.progressContainer}>
                <p className={styles.progressText}>{uploadProgress}</p>
              </div>
            )}
          </div>
        </div>

        <div className={styles.modalFooter}>
          <button
            className={styles.cancelButton}
            onClick={handleClose}
            disabled={uploading}
          >
            Cancel
          </button>
          <button
            className={styles.uploadButton}
            onClick={handleUpload}
            disabled={!selectedFile || uploading}
          >
            {uploading ? 'Uploading...' : 'Upload Image'}
          </button>
        </div>
      </div>
    </Modal>
  );
};

export default GalleryImageUpload;
