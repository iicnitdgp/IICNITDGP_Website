import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import API from '../../common/api';
import azureBlobService from '../../services/azureBlobService';
import GradientText from '../../component/Core/TextStyle';
import styles from './styles/editEventModal.module.scss';

const EditEventModal = ({ isOpen, onClose, event, onEventEdited }) => {
  const { accessToken } = useSelector((state) => state.auth);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    details: '',
    rules: '',
    photo: '',
    date: '',
    time: '',
    location: '',
    category: 'webinar',
    registrationRequired: false,
    maxParticipants: '',
    registrationDeadline: '',
    contactEmail: '',
    contactPhone: '',
  });
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState('');

  useEffect(() => {
    if (event && isOpen) {
      // Convert date to proper format for input
      let formattedDate = '';
      if (event.date) {
        try {
          const dateObj = new Date(event.date);
          if (!isNaN(dateObj.getTime())) {
            formattedDate = dateObj.toISOString().split('T')[0];
          }
        } catch (error) {
          console.warn('Invalid date format:', event.date);
        }
      }

      // Convert registration deadline to proper format
      let formattedRegDeadline = '';
      if (event.registrationDeadline) {
        try {
          const dateObj = new Date(event.registrationDeadline);
          if (!isNaN(dateObj.getTime())) {
            formattedRegDeadline = dateObj.toISOString().split('T')[0];
          }
        } catch (error) {
          console.warn('Invalid registration deadline format:', event.registrationDeadline);
        }
      }

      setFormData({
        name: event.name || '',
        details: event.details || '',
        rules: event.rules || '',
        photo: event.photo || '',
        date: formattedDate,
        time: event.time || '',
        location: event.location || '',
        category: event.category || 'webinar',
        registrationRequired: event.registrationRequired || false,
        maxParticipants: event.maxParticipants || '',
        registrationDeadline: formattedRegDeadline,
        contactEmail: event.contactEmail || '',
        contactPhone: event.contactPhone || '',
      });
      setImagePreview(event.photo || '');
    }
  }, [event, isOpen]);

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImageFile(file);
      const reader = new FileReader();
      reader.onload = (e) => {
        setImagePreview(e.target.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const uploadImage = async (file) => {
    try {
      // Try Azure Blob Storage first
      const result = await azureBlobService.uploadFileWithValidation(file);
      if (result.success && result.url) {
        return result.url;
      } else {
        throw new Error(result.error || 'Upload failed');
      }
    } catch (error) {
      console.warn('Azure upload failed, using base64 fallback:', error);
    }

    // Fallback to base64
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = (e) => resolve(e.target.result);
      reader.readAsDataURL(file);
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      let photoUrl = formData.photo;

      // Upload new image if selected
      if (imageFile) {
        photoUrl = await uploadImage(imageFile);
      }

      const updateData = {
        ...formData,
        photo: photoUrl,
      };

      const response = await fetch(API.WebinarUpdate.url.replace(':id', event._id), {
        method: API.WebinarUpdate.method,
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updateData),
      });

      if (response.ok) {
        const updatedEvent = await response.json();
        console.log('Event updated successfully:', updatedEvent);
        onEventEdited(updatedEvent);
        onClose();
      } else {
        const errorData = await response.json();
        console.error('Failed to update event:', errorData);
        alert('Failed to update event: ' + (errorData.message || 'Unknown error'));
      }
    } catch (error) {
      console.error('Error updating event:', error);
      alert('Error updating event: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen || !event) return null;

  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={styles.editEventModal} onClick={(e) => e.stopPropagation()}>
        <div className={styles.modalHeader}>
          <h2><GradientText text="Edit Event" /></h2>
          <button 
            className={styles.closeButton}
            onClick={onClose}
          >
            ×
          </button>
        </div>

        <form onSubmit={handleSubmit} className={styles.modalContent}>
          <div className={styles.formGroup}>
            <label htmlFor="name">Event Name *</label>
            <input
              type="text"
              id="name"
              name="name"
              value={formData.name}
              onChange={handleInputChange}
              required
            />
          </div>

          <div className={styles.formGroup}>
            <label htmlFor="details">Event Details *</label>
            <textarea
              id="details"
              name="details"
              value={formData.details}
              onChange={handleInputChange}
              rows="4"
              required
            />
          </div>

          <div className={styles.formGroup}>
            <label htmlFor="rules">Rules (Optional)</label>
            <textarea
              id="rules"
              name="rules"
              value={formData.rules}
              onChange={handleInputChange}
              rows="3"
              placeholder="Event rules and guidelines"
            />
          </div>

          <div className={styles.formRow}>
            <div className={styles.formGroup}>
              <label htmlFor="date">Date *</label>
              <input
                type="date"
                id="date"
                name="date"
                value={formData.date}
                onChange={handleInputChange}
                required
              />
            </div>

            <div className={styles.formGroup}>
              <label htmlFor="time">Time</label>
              <input
                type="time"
                id="time"
                name="time"
                value={formData.time}
                onChange={handleInputChange}
              />
            </div>
          </div>

          <div className={styles.formRow}>
            <div className={styles.formGroup}>
              <label htmlFor="location">Location</label>
              <input
                type="text"
                id="location"
                name="location"
                value={formData.location}
                onChange={handleInputChange}
                placeholder="Online, Room 101, etc."
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
                <option value="webinar">Webinar</option>
                <option value="workshop">Workshop</option>
                <option value="seminar">Seminar</option>
                <option value="conference">Conference</option>
                <option value="hackathon">Hackathon</option>
                <option value="meetup">Meetup</option>
                <option value="other">Other</option>
              </select>
            </div>
          </div>

          <div className={styles.formGroup}>
            <label className={styles.checkboxLabel}>
              <input
                type="checkbox"
                name="registrationRequired"
                checked={formData.registrationRequired}
                onChange={handleInputChange}
              />
              Registration Required
            </label>
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
                  min="1"
                />
              </div>

              <div className={styles.formGroup}>
                <label htmlFor="registrationDeadline">Registration Deadline</label>
                <input
                  type="date"
                  id="registrationDeadline"
                  name="registrationDeadline"
                  value={formData.registrationDeadline}
                  onChange={handleInputChange}
                />
              </div>
            </div>
          )}

          <div className={styles.formRow}>
            <div className={styles.formGroup}>
              <label htmlFor="contactEmail">Contact Email</label>
              <input
                type="email"
                id="contactEmail"
                name="contactEmail"
                value={formData.contactEmail}
                onChange={handleInputChange}
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
              />
            </div>
          </div>

          <div className={styles.formGroup}>
            <label htmlFor="photo">Event Image</label>
            <input
              type="file"
              id="photo"
              accept="image/*"
              onChange={handleImageChange}
            />
            {imagePreview && (
              <div className={styles.imagePreview}>
                <img src={imagePreview} alt="Event preview" />
              </div>
            )}
          </div>

          <div className={styles.modalActions}>
            <button
              type="button"
              onClick={onClose}
              className={styles.cancelButton}
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className={styles.updateButton}
              disabled={loading}
            >
              {loading ? 'Updating...' : 'Update Event'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditEventModal;
