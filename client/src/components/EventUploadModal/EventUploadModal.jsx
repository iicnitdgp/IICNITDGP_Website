import React, { useState } from 'react';
import Modal from 'react-modal';
import uploadService from '../../services/uploadService';
import apiService from '../../services/apiService';
import styles from './styles/eventUploadModal.module.scss';
import GradientText from '../../component/Core/TextStyle';

const EventUploadModal = ({ isOpen, onClose, onEventAdded }) => {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    eventDate: '',
    eventTime: '',
    location: '',
    category: 'workshop',
    registrationRequired: true,
    maxParticipants: '',
    registrationDeadline: '',
    contactEmail: '',
    contactPhone: ''
  });
  
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [previewUrls, setPreviewUrls] = useState([]);
  const [isUploading, setIsUploading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleFileSelect = (e) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;

    // Validate file types and sizes
    const validFiles = [];
    const validPreviews = [];
    
    for (const file of files) {
      if (!file.type.startsWith('image/')) {
        setError('Only image files are allowed');
        continue;
      }
      
      if (file.size > 10 * 1024 * 1024) { // 10MB limit
        setError('File size must be less than 10MB');
        continue;
      }
      
      validFiles.push(file);
      
      // Create preview URL
      const reader = new FileReader();
      reader.onload = (e) => {
        validPreviews.push(e.target.result);
        if (validPreviews.length === validFiles.length) {
          setPreviewUrls(validPreviews);
        }
      };
      reader.readAsDataURL(file);
    }

    setSelectedFiles(validFiles);
    setError('');
  };

  const removeFile = (index) => {
    const newFiles = selectedFiles.filter((_, i) => i !== index);
    const newPreviews = previewUrls.filter((_, i) => i !== index);
    setSelectedFiles(newFiles);
    setPreviewUrls(newPreviews);
  };

  const uploadFiles = async () => {
    if (selectedFiles.length === 0) return [];

    setIsUploading(true);
    const uploadedUrls = [];
    
    try {
      for (let i = 0; i < selectedFiles.length; i++) {
        const file = selectedFiles[i];
        const fileName = `${Date.now()}-${i}-${file.name}`;

        setUploadProgress(((i + 1) / selectedFiles.length) * 100);

        const uploadResult = await uploadService.uploadFile(file, fileName, 'events');
        
        if (uploadResult.success) {
          uploadedUrls.push(uploadResult.url);
        } else {
          throw new Error(`Failed to upload ${file.name}: ${uploadResult.error}`);
        }
      }
      
      return uploadedUrls;
    } catch (error) {
      console.error('Files upload failed:', error);
      setError('File upload failed. Please try again.');
      return [];
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError('');
    setSuccess('');

    try {
      // Validate required fields
      if (!formData.title || !formData.description || !formData.eventDate) {
        setError('Title, description, and event date are required');
        return;
      }

      // Upload files if selected
      const imageUrls = await uploadFiles();
      
      // Map form data to webinar schema fields
      const webinarData = {
        name: formData.title,
        details: formData.description,
        photo: imageUrls.length > 0 ? imageUrls[0] : 'https://via.placeholder.com/400x300', // Use first image as main photo
        date: formData.eventDate,
        time: formData.eventTime || '',
        location: formData.location || 'Online',
        category: formData.category,
        registrationRequired: formData.registrationRequired,
        maxParticipants: formData.maxParticipants ? parseInt(formData.maxParticipants) : null,
        registrationDeadline: formData.registrationDeadline || null,
        contactEmail: formData.contactEmail || null,
        contactPhone: formData.contactPhone || null
      };

      // Create webinar using API
      const createdWebinar = await apiService.createWebinar(webinarData);
      
      setSuccess('Event created successfully!');
      if (onEventAdded) {
        onEventAdded(createdWebinar);
      }
      
      // Reset form after short delay
      setTimeout(() => {
        handleClose();
      }, 1500);
      
    } catch (error) {
      setError(error.message || 'Failed to create event. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setFormData({
      title: '',
      description: '',
      eventDate: '',
      eventTime: '',
      location: '',
      category: 'workshop',
      registrationRequired: true,
      maxParticipants: '',
      registrationDeadline: '',
      contactEmail: '',
      contactPhone: ''
    });
    setSelectedFiles([]);
    setPreviewUrls([]);
    setError('');
    setSuccess('');
    setUploadProgress(0);
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onRequestClose={handleClose}
      className={styles.modal}
      overlayClassName={styles.overlay}
      contentLabel="Upload Event"
    >
      <div className={styles.modalContent}>
        <div className={styles.modalHeader}>
          <h2><GradientText text="Create New Event" /></h2>
          <button 
            className={styles.closeButton}
            onClick={handleClose}
            type="button"
          >
            ×
          </button>
        </div>

        <form onSubmit={handleSubmit} className={styles.form}>
          {/* Basic Event Information */}
          <div className={styles.section}>
            <h3><GradientText text="Basic Information" /></h3>
            
            <div className={styles.formRow}>
              <div className={styles.formGroup}>
                <label htmlFor="title">Event Title *</label>
                <input
                  type="text"
                  id="title"
                  name="title"
                  value={formData.title}
                  onChange={handleInputChange}
                  required
                  placeholder="Enter event title"
                />
              </div>

              <div className={styles.formGroup}>
                <label htmlFor="category">Category</label>
                <select
                  id="category"
                  name="category"
                  value={formData.category}
                  onChange={handleInputChange}
                >
                  <option value="workshop">Workshop</option>
                  <option value="seminar">Seminar</option>
                  <option value="conference">Conference</option>
                  <option value="hackathon">Hackathon</option>
                  <option value="networking">Networking</option>
                  <option value="competition">Competition</option>
                  <option value="other">Other</option>
                </select>
              </div>
            </div>

            <div className={styles.formGroup}>
              <label htmlFor="description">Description *</label>
              <textarea
                id="description"
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                required
                placeholder="Describe the event..."
                rows={4}
              />
            </div>
          </div>

          {/* Date and Location */}
          <div className={styles.section}>
            <h3><GradientText text="Date & Location" /></h3>
            
            <div className={styles.formRow}>
              <div className={styles.formGroup}>
                <label htmlFor="eventDate">Event Date *</label>
                <input
                  type="datetime-local"
                  id="eventDate"
                  name="eventDate"
                  value={formData.eventDate}
                  onChange={handleInputChange}
                  required
                />
              </div>

              <div className={styles.formGroup}>
                <label htmlFor="location">Location</label>
                <input
                  type="text"
                  id="location"
                  name="location"
                  value={formData.location}
                  onChange={handleInputChange}
                  placeholder="Event location"
                />
              </div>
            </div>
          </div>

          {/* Registration Details */}
          <div className={styles.section}>
            <h3><GradientText text="Registration" /></h3>
            
            <div className={styles.checkboxGroup}>
              <input
                type="checkbox"
                id="registrationRequired"
                name="registrationRequired"
                checked={formData.registrationRequired}
                onChange={handleInputChange}
              />
              <label htmlFor="registrationRequired">Registration Required</label>
            </div>

            {formData.registrationRequired && (
              <div className={styles.formRow}>
                <div className={styles.formGroup}>
                  <label htmlFor="maxParticipants">Max Participants</label>
                  <input
                    type="number"
                    id="maxParticipants"
                    name="maxParticipants"
                    value={formData.maxParticipants}
                    onChange={handleInputChange}
                    placeholder="Leave empty for unlimited"
                    min="1"
                  />
                </div>

                <div className={styles.formGroup}>
                  <label htmlFor="registrationDeadline">Registration Deadline</label>
                  <input
                    type="datetime-local"
                    id="registrationDeadline"
                    name="registrationDeadline"
                    value={formData.registrationDeadline}
                    onChange={handleInputChange}
                  />
                </div>
              </div>
            )}
          </div>

          {/* Contact Information */}
          <div className={styles.section}>
            <h3><GradientText text="Contact Information" /></h3>
            
            <div className={styles.formRow}>
              <div className={styles.formGroup}>
                <label htmlFor="contactEmail">Contact Email</label>
                <input
                  type="email"
                  id="contactEmail"
                  name="contactEmail"
                  value={formData.contactEmail}
                  onChange={handleInputChange}
                  placeholder="contact@example.com"
                />
              </div>

              <div className={styles.formGroup}>
                <label htmlFor="contactPhone">Contact Phone</label>
                <input
                  type="tel"
                  id="contactPhone"
                  name="contactPhone"
                  value={formData.contactPhone}
                  onChange={handleInputChange}
                  placeholder="+1234567890"
                />
              </div>
            </div>
          </div>

          {/* Image Upload */}
          <div className={styles.section}>
            <h3><GradientText text="Event Images" /></h3>
            
            <div className={styles.uploadSection}>
              <label htmlFor="images" className={styles.uploadButton}>
                Choose Images
              </label>
              <input
                id="images"
                type="file"
                accept="image/*"
                multiple
                onChange={handleFileSelect}
                className={styles.hiddenInput}
              />
              <p className={styles.uploadHint}>Max size: 10MB per image</p>
            </div>

            {previewUrls.length > 0 && (
              <div className={styles.imageGrid}>
                {previewUrls.map((url, index) => (
                  <div key={index} className={styles.imagePreview}>
                    <img src={url} alt={`Preview ${index + 1}`} />
                    <button
                      type="button"
                      className={styles.removeImageButton}
                      onClick={() => removeFile(index)}
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            )}

            {isUploading && (
              <div className={styles.uploadProgress}>
                <div className={styles.progressBar}>
                  <div 
                    className={styles.progressFill}
                    style={{ width: `${uploadProgress}%` }}
                  ></div>
                </div>
                <p>Uploading images... {Math.round(uploadProgress)}%</p>
              </div>
            )}
          </div>

          {error && (
            <div className={styles.errorMessage}>
              {error}
            </div>
          )}

          {success && (
            <div className={styles.successMessage}>
              {success}
            </div>
          )}

          <div className={styles.formActions}>
            <button
              type="button"
              onClick={handleClose}
              className={styles.cancelButton}
              disabled={isSubmitting || isUploading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className={styles.saveButton}
              disabled={isSubmitting || isUploading}
            >
              {isSubmitting ? 'Creating Event...' : 'Create Event'}
            </button>
          </div>
        </form>
      </div>
    </Modal>
  );
};

export default EventUploadModal;
