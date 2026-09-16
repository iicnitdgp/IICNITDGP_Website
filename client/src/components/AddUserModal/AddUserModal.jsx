import React, { useState } from 'react';
import Modal from 'react-modal';
import apiService from '../../services/apiService';
import uploadService from '../../services/uploadService';
import styles from './styles/addUserModal.module.scss';
import GradientText from '../../component/Core/TextStyle';

const AddUserModal = ({ isOpen, onClose, onUserAdded }) => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    address: '',
    role: 'user',
    designation: '',
    type: 'Other',
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
  const [success, setSuccess] = useState('');

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
    if (!selectedFile) return 'https://via.placeholder.com/150';

    setIsUploading(true);
    try {
      const fileName = `user-${Date.now()}-${selectedFile.name}`;
      const uploadResult = await uploadService.uploadFile(selectedFile, fileName, 'profile');
      
      if (uploadResult.success) {
        return uploadResult.url;
      } else {
        throw new Error(uploadResult.error || 'Upload failed');
      }
    } catch (error) {
      console.error('Photo upload failed:', error);
      setError('Photo upload failed. Please try again.');
      return 'https://via.placeholder.com/150';
    } finally {
      setIsUploading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError('');
    setSuccess('');

    try {
      // Validate required fields
      if (!formData.name || !formData.email || !formData.phone) {
        setError('Name, email, and phone are required');
        return;
      }

      // Upload photo if selected
      const photoUrl = await uploadPhoto();
      
      const userData = {
        ...formData,
        photo: photoUrl,
        password: formData.phone // Password is mobile number
      };
      
      // Register user via API
      const response = await apiService.register(userData);
      
      if (response.success) {
        setSuccess('User added successfully!');
        if (onUserAdded) {
          onUserAdded(response.data.user);
        }
        // Reset form after short delay
        setTimeout(() => {
          handleClose();
        }, 1500);
      } else {
        setError(response.message || 'Failed to add user');
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
      email: '',
      phone: '',
      address: '',
      role: 'user',
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
    setSuccess('');
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onRequestClose={handleClose}
      className={styles.modal}
      overlayClassName={styles.overlay}
      contentLabel="Add New User"
    >
      <div className={styles.modalContent}>
        <div className={styles.modalHeader}>
          <h2><GradientText text="Add New User" /></h2>
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
              <p className={styles.photoHint}>Max size: 5MB (Optional)</p>
            </div>
          </div>

          {/* Form Fields */}
          <div className={styles.formFields}>
            <div className={styles.formRow}>
              <div className={styles.formGroup}>
                <label htmlFor="name">Full Name *</label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  required
                  placeholder="Enter full name"
                />
              </div>

              <div className={styles.formGroup}>
                <label htmlFor="email">Email Address *</label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  required
                  placeholder="Enter email address"
                />
              </div>
            </div>

            <div className={styles.formRow}>
              <div className={styles.formGroup}>
                <label htmlFor="phone">Phone Number *</label>
                <input
                  type="tel"
                  id="phone"
                  name="phone"
                  value={formData.phone}
                  onChange={handleInputChange}
                  required
                  placeholder="Enter phone number (will be used as password)"
                />
                <p className={styles.fieldHint}>This will be used as the user's password</p>
              </div>

              <div className={styles.formGroup}>
                <label htmlFor="role">Role</label>
                <select
                  id="role"
                  name="role"
                  value={formData.role}
                  onChange={handleInputChange}
                >
                  <option value="user">User</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
            </div>

            <div className={styles.formGroup}>
              <label htmlFor="address">Address</label>
              <textarea
                id="address"
                name="address"
                value={formData.address}
                onChange={handleInputChange}
                placeholder="Enter address (optional)"
                rows={3}
              />
            </div>

            <div className={styles.formRow}>
              <div className={styles.formGroup}>
                <label htmlFor="designation">Designation</label>
                <input
                  type="text"
                  id="designation"
                  name="designation"
                  value={formData.designation}
                  onChange={handleInputChange}
                  placeholder="Enter designation (optional)"
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
            </div>

            <div className={styles.formRow}>
              <div className={styles.formGroup}>
                <label htmlFor="linkedin">LinkedIn Profile</label>
                <input
                  type="url"
                  id="linkedin"
                  name="extra.linkedin"
                  value={formData.extra.linkedin}
                  onChange={handleInputChange}
                  placeholder="https://linkedin.com/in/yourprofile (optional)"
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
                  placeholder="https://github.com/yourusername (optional)"
                />
              </div>
            </div>
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
              {isSubmitting ? 'Adding User...' : 'Add User'}
            </button>
          </div>
        </form>
      </div>
    </Modal>
  );
};

export default AddUserModal;
