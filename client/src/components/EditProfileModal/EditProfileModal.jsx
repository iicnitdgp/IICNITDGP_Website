import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import Modal from 'react-modal';
import { updateUser } from '../../store/slices/authSlice';
import apiService from '../../services/apiService';
import uploadService from '../../services/uploadService';
import styles from './styles/editProfileModal.module.scss';
import GradientText from '../../component/Core/TextStyle';

// Set app element for accessibility
Modal.setAppElement('#root');

const EditProfileModal = ({ isOpen, onClose }) => {
  const dispatch = useDispatch();
  const { user } = useSelector((state) => state.auth);
  
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    address: '',
    photo: '',
    designation: '',
    type: '',
    extra: {
      linkedin: '',
      github: ''
    }
  });
  
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  // Initialize form data when modal opens
  useEffect(() => {
    if (isOpen && user) {
      setFormData({
        name: user.name || '',
        phone: user.phone || '',
        address: user.address || '',
        photo: user.photo || '',
        designation: user.designation || '',
        type: user.type || 'Other',
        extra: {
          linkedin: user.extra?.linkedin || '',
          github: user.extra?.github || ''
        }
      });
      setPreviewUrl(user.photo || null);
    }
  }, [isOpen, user]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    
    if (name.startsWith('extra.')) {
      const fieldName = name.split('.')[1];
      setFormData(prev => ({
        ...prev,
        extra: {
          ...prev.extra,
          [fieldName]: value
        }
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        setError('Please select an image file');
        return;
      }
      
      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        setError('File size must be less than 5MB');
        return;
      }

      setSelectedFile(file);
      setError('');
      
      // Create preview URL
      const reader = new FileReader();
      reader.onload = (e) => {
        setPreviewUrl(e.target.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const uploadPhoto = async () => {
    if (!selectedFile) return formData.photo;

    setIsUploading(true);
    try {
      const fileName = `profile-${user._id || user.id}-${Date.now()}.${selectedFile.name.split('.').pop()}`;
      const uploadResult = await uploadService.uploadFile(selectedFile, fileName, 'profile');

      if (uploadResult.success) {
        return uploadResult.url;
      } else {
        throw new Error(uploadResult.error || 'Upload failed');
      }
    } catch (error) {
      console.error('Photo upload failed:', error);
      setError('Photo upload failed. Please try again.');
      return formData.photo; // Keep existing photo on upload failure
    } finally {
      setIsUploading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError('');

    try {
      // Upload photo if a new one is selected
      const photoUrl = await uploadPhoto();
      
      const updatedData = {
        ...formData,
        photo: photoUrl
      };

      // Update profile via API
      const response = await apiService.updateProfile(updatedData);
      
      if (response.success) {
        // Update Redux state
        dispatch(updateUser(response.data.user));
        onClose();
      } else {
        setError(response.message || 'Failed to update profile');
      }
    } catch (error) {
      setError(error.message || 'Network error. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setFormData({
      name: '',
      phone: '',
      address: '',
      photo: '',
      designation: '',
      type: 'Other',
      extra: {
        linkedin: '',
        github: ''
      }
    });
    setSelectedFile(null);
    setPreviewUrl(null);
    setError('');
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onRequestClose={handleClose}
      className={styles.modal}
      overlayClassName={styles.overlay}
      contentLabel="Edit Profile"
    >
      <div className={styles.modalContent}>
        <div className={styles.modalHeader}>
          <h2><GradientText text="Edit Profile" /></h2>
          <button 
            className={styles.closeButton}
            onClick={handleClose}
            type="button"
          >
            ×
          </button>
        </div>

        <form onSubmit={handleSubmit} className={styles.form}>
          {/* Profile Photo Section */}
          <div className={styles.photoSection}>
            <div className={styles.photoPreview}>
              <img 
                src={previewUrl || 'https://via.placeholder.com/120'} 
                alt="Profile preview"
                className={styles.previewImage}
              />
              {isUploading && (
                <div className={styles.uploadingOverlay}>
                  <div className={styles.spinner}></div>
                </div>
              )}
            </div>
            <div className={styles.photoControls}>
              <label htmlFor="photo-upload" className={styles.uploadButton}>
                Choose Photo
              </label>
              <input
                id="photo-upload"
                type="file"
                accept="image/*"
                onChange={handleFileSelect}
                className={styles.hiddenInput}
              />
              <p className={styles.photoHint}>Max size: 5MB</p>
            </div>
          </div>

          {/* Form Fields */}
          <div className={styles.formFields}>
            <div className={styles.formGroup}>
              <label htmlFor="name">Full Name</label>
              <input
                type="text"
                id="name"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                required
                placeholder="Enter your full name"
              />
            </div>

            <div className={styles.formGroup}>
              <label htmlFor="phone">Phone Number</label>
              <input
                type="tel"
                id="phone"
                name="phone"
                value={formData.phone}
                onChange={handleInputChange}
                placeholder="Enter your phone number"
              />
            </div>

            <div className={styles.formGroup}>
              <label htmlFor="address">Address</label>
              <textarea
                id="address"
                name="address"
                value={formData.address}
                onChange={handleInputChange}
                placeholder="Enter your address"
                rows={3}
              />
            </div>

            <div className={styles.formGroup}>
              <label htmlFor="designation">Designation</label>
              <input
                type="text"
                id="designation"
                name="designation"
                value={formData.designation}
                onChange={handleInputChange}
                placeholder="Enter your designation"
              />
            </div>

            <div className={styles.formGroup}>
              <label htmlFor="type">Type</label>
              <select
                id="type"
                name="type"
                value={formData.type}
                onChange={handleInputChange}
              >
                <option value="Other">Other</option>
                <option value="Faculty">Faculty</option>
                <option value="Student Volunteers">Student Volunteers</option>
                <option value="Student Council">Student Council</option>
                <option value="Advisor">Advisor</option>
                <option value="Mentor">Mentor</option>
              </select>
            </div>

            <div className={styles.formGroup}>
              <label htmlFor="linkedin">LinkedIn Profile</label>
              <input
                type="url"
                id="linkedin"
                name="extra.linkedin"
                value={formData.extra.linkedin}
                onChange={handleInputChange}
                placeholder="https://linkedin.com/in/yourprofile"
              />
            </div>

            <div className={styles.formGroup}>
              <label htmlFor="github">GitHub Profile</label>
              <input
                type="url"
                id="github"
                name="extra.github"
                value={formData.extra.github}
                onChange={handleInputChange}
                placeholder="https://github.com/yourusername"
              />
            </div>
          </div>

          {error && (
            <div className={styles.errorMessage}>
              {error}
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
              {isSubmitting ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </Modal>
  );
};

export default EditProfileModal;
