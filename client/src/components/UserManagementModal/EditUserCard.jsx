import React, { useState, useEffect } from 'react';
import Modal from 'react-modal';
import apiService from '../../services/apiService';
import uploadService from '../../services/uploadService';
import styles from './styles/editUserCard.module.scss';
import GradientText from '../../component/Core/TextStyle';

Modal.setAppElement('#root');

const EditUserCard = ({ isOpen, user, onClose, onSaved }) => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    address: '',
    photo: '',
    role: 'user',
    designation: '',
    type: 'Other',
    isActive: true,
    rank: '',
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

  useEffect(() => {
    if (isOpen && user) {
      setFormData({
        name: user.name || '',
        email: user.email || '',
        phone: user.phone || '',
        address: user.address || '',
        photo: user.photo || '',
        role: user.role || 'user',
        designation: user.designation || '',
        type: user.type || 'Other',
        isActive: typeof user.isActive === 'boolean' ? user.isActive : true,
        rank: user.rank ?? '',
        extra: {
          linkedin: user.extra?.linkedin || '',
          github: user.extra?.github || ''
        }
      });
      setPreviewUrl(user.photo || null);
      setSelectedFile(null);
      setError('');
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
    } else if (name === 'isActive') {
      setFormData(prev => ({ ...prev, isActive: value === 'true' }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        setError('Please select an image file');
        return;
      }

      if (file.size > 5 * 1024 * 1024) {
        setError('File size must be less than 5MB');
        return;
      }

      setSelectedFile(file);
      setError('');

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
      const fileName = `profile-${user._id}-${Date.now()}.${selectedFile.name.split('.').pop()}`;
      const uploadResult = await uploadService.uploadFile(selectedFile, fileName, 'profile');

      if (uploadResult.success) {
        return uploadResult.url;
      } else {
        throw new Error(uploadResult.error || 'Upload failed');
      }
    } catch (error) {
      console.error('Photo upload failed:', error);
      setError('Photo upload failed. Please try again.');
      return formData.photo;
    } finally {
      setIsUploading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError('');

    try {
      if (!formData.name || !formData.email) {
        setError('Name and email are required');
        setIsSubmitting(false);
        return;
      }

      const photoUrl = await uploadPhoto();

      const response = await apiService.request(`/admin/users-management/${user._id}`, {
        method: 'PUT',
        body: JSON.stringify({
          name: formData.name,
          email: formData.email,
          phone: formData.phone,
          address: formData.address,
          photo: photoUrl,
          role: formData.role,
          designation: formData.designation,
          type: formData.type,
          isActive: formData.isActive,
          rank: formData.rank === '' ? null : formData.rank,
          extra: formData.extra
        })
      });

      const data = await response.json();

      if (data.success) {
        onSaved(data.user);
      } else {
        setError(data.message || 'Failed to update user');
      }
    } catch (error) {
      setError(error.message || 'Network error. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!user) return null;

  return (
    <Modal
      isOpen={isOpen}
      onRequestClose={onClose}
      className={styles.modal}
      overlayClassName={styles.overlay}
      contentLabel="Edit User"
    >
      <div className={styles.modalContent}>
        <div className={styles.modalHeader}>
          <h2><GradientText text="Edit User" /></h2>
          <button
            className={styles.closeButton}
            onClick={onClose}
            type="button"
          >
            ×
          </button>
        </div>

        <form onSubmit={handleSubmit} className={styles.form}>
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
              <label htmlFor="edit-photo-upload" className={styles.uploadButton}>
                Choose Photo
              </label>
              <input
                id="edit-photo-upload"
                type="file"
                accept="image/*"
                onChange={handleFileSelect}
                className={styles.hiddenInput}
              />
              <p className={styles.photoHint}>Max size: 5MB (optional)</p>
            </div>
          </div>

          <div className={styles.formFields}>
            <div className={styles.formRow}>
              <div className={styles.formGroup}>
                <label htmlFor="edit-name">Full Name *</label>
                <input
                  type="text"
                  id="edit-name"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  required
                  placeholder="Enter full name"
                />
              </div>

              <div className={styles.formGroup}>
                <label htmlFor="edit-email">Email Address *</label>
                <input
                  type="email"
                  id="edit-email"
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
                <label htmlFor="edit-phone">Phone Number</label>
                <input
                  type="tel"
                  id="edit-phone"
                  name="phone"
                  value={formData.phone}
                  onChange={handleInputChange}
                  placeholder="Enter phone number"
                />
              </div>

              <div className={styles.formGroup}>
                <label htmlFor="edit-role">Role</label>
                <select
                  id="edit-role"
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
              <label htmlFor="edit-address">Address</label>
              <textarea
                id="edit-address"
                name="address"
                value={formData.address}
                onChange={handleInputChange}
                placeholder="Enter address (optional)"
                rows={3}
              />
            </div>

            <div className={styles.formRow}>
              <div className={styles.formGroup}>
                <label htmlFor="edit-designation">Designation</label>
                <input
                  type="text"
                  id="edit-designation"
                  name="designation"
                  value={formData.designation}
                  onChange={handleInputChange}
                  placeholder="e.g. President, Web Coordinator"
                />
              </div>

              <div className={styles.formGroup}>
                <label htmlFor="edit-type">Type</label>
                <select
                  id="edit-type"
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
                <label htmlFor="edit-status">Account Status</label>
                <select
                  id="edit-status"
                  name="isActive"
                  value={formData.isActive}
                  onChange={handleInputChange}
                >
                  <option value="true">Active</option>
                  <option value="false">Inactive</option>
                </select>
              </div>

              <div className={styles.formGroup}>
                <label htmlFor="edit-rank">Rank</label>
                <input
                  type="number"
                  id="edit-rank"
                  name="rank"
                  value={formData.rank}
                  onChange={handleInputChange}
                  placeholder="Auto (order added)"
                />
                <p className={styles.fieldHint}>Lower rank appears first on the /team page. Leave blank to keep the automatic order.</p>
              </div>
            </div>

            <div className={styles.formRow}>
              <div className={styles.formGroup}>
                <label htmlFor="edit-linkedin">LinkedIn Profile</label>
                <input
                  type="url"
                  id="edit-linkedin"
                  name="extra.linkedin"
                  value={formData.extra.linkedin}
                  onChange={handleInputChange}
                  placeholder="https://linkedin.com/in/yourprofile (optional)"
                />
              </div>

              <div className={styles.formGroup}>
                <label htmlFor="edit-github">GitHub Profile</label>
                <input
                  type="url"
                  id="edit-github"
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

          <div className={styles.formActions}>
            <button
              type="button"
              onClick={onClose}
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

export default EditUserCard;
