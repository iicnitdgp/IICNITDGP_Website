import React, { useState } from 'react';
import { useSelector } from 'react-redux';
import API from '../../common/api';
import styles from './styles/eventRegistrationUpload.module.scss';
import GradientText from '../../component/Core/TextStyle';
import { fetchWithTokenRefresh } from '../../utils/fetchWithTokenRefresh';

const EventRegistrationUpload = ({ isOpen, onClose, onEventCreated }) => {
  const { accessToken } = useSelector((state) => state.auth);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    date: '',
    participationType: 'single',
    maxTeamSize: '',
    maxParticipants: '',
    rules: '',
  });
  const [requiredFields, setRequiredFields] = useState([
    { fieldName: 'email', label: 'Email', type: 'email', required: true },
    { fieldName: 'phone', label: 'Phone', type: 'text', required: true },
  ]);
  const [newField, setNewField] = useState({ fieldName: '', label: '', type: 'text', required: true });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleAddField = () => {
    if (!newField.fieldName || !newField.label) {
      setError('Field name and label are required');
      return;
    }

    // Check if field already exists
    if (requiredFields.some((f) => f.fieldName === newField.fieldName)) {
      setError('Field already exists');
      return;
    }

    setRequiredFields([...requiredFields, newField]);
    setNewField({ fieldName: '', label: '', type: 'text', required: true });
    setError('');
  };

  const handleRemoveField = (fieldName) => {
    setRequiredFields(requiredFields.filter((f) => f.fieldName !== fieldName));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      if (!formData.name || !formData.description || !formData.date) {
        throw new Error('Name, description, and date are required');
      }

      if (formData.participationType === 'team' && !formData.maxTeamSize) {
        throw new Error('Max team size is required for team events');
      }

      const payload = {
        name: formData.name,
        description: formData.description,
        date: new Date(formData.date).toISOString(),
        participationType: formData.participationType,
        maxTeamSize: formData.maxTeamSize ? parseInt(formData.maxTeamSize, 10) : null,
        maxParticipants: formData.maxParticipants ? parseInt(formData.maxParticipants, 10) : null,
        rules: formData.rules,
        requiredParticipantFields: requiredFields,
        status: 'draft',
      };

      const response = await fetchWithTokenRefresh(API.EventCreate.url, {
        method: API.EventCreate.method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to create event');
      }

      const result = await response.json();
      setSuccess('Event created successfully!');
      if (onEventCreated) {
        onEventCreated(result.event);
      }

      setTimeout(() => {
        handleClose();
      }, 1500);
    } catch (err) {
      setError(err.message || 'Failed to create event');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setFormData({
      name: '',
      description: '',
      date: '',
      participationType: 'single',
      maxTeamSize: '',
      maxParticipants: '',
      rules: '',
    });
    setRequiredFields([
      { fieldName: 'email', label: 'Email', type: 'email', required: true },
      { fieldName: 'phone', label: 'Phone', type: 'text', required: true },
    ]);
    setNewField({ fieldName: '', label: '', type: 'text', required: true });
    setError('');
    setSuccess('');
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className={styles.modalOverlay} onClick={handleClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div className={styles.modalHeader}>
          <h2><GradientText text="Create Registration Event" /></h2>
          <button className={styles.closeButton} onClick={handleClose}>×</button>
        </div>

        <form onSubmit={handleSubmit} className={styles.modalContent}>
          {error && <div className={styles.errorMessage}>{error}</div>}
          {success && <div className={styles.successMessage}>{success}</div>}

          <div className={styles.formGroup}>
            <label htmlFor="name">Event Name *</label>
            <input
              type="text"
              id="name"
              name="name"
              value={formData.name}
              onChange={handleInputChange}
              placeholder="Enter event name"
              required
            />
          </div>

          <div className={styles.formGroup}>
            <label htmlFor="description">Description *</label>
            <textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleInputChange}
              placeholder="Describe the event"
              rows="4"
              required
            />
          </div>

          <div className={styles.formRow}>
            <div className={styles.formGroup}>
              <label htmlFor="date">Event Date & Time *</label>
              <input
                type="datetime-local"
                id="date"
                name="date"
                value={formData.date}
                onChange={handleInputChange}
                required
              />
            </div>

            <div className={styles.formGroup}>
              <label htmlFor="participationType">Participation Type *</label>
              <select
                id="participationType"
                name="participationType"
                value={formData.participationType}
                onChange={handleInputChange}
              >
                <option value="single">Single</option>
                <option value="team">Team</option>
              </select>
            </div>
          </div>

          {formData.participationType === 'team' && (
            <div className={styles.formGroup}>
              <label htmlFor="maxTeamSize">Max Team Size *</label>
              <input
                type="number"
                id="maxTeamSize"
                name="maxTeamSize"
                value={formData.maxTeamSize}
                onChange={handleInputChange}
                placeholder="Maximum members per team"
                min="2"
                required
              />
            </div>
          )}

          <div className={styles.formGroup}>
            <label htmlFor="maxParticipants">Max Participants (Optional)</label>
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
            <label htmlFor="rules">Rules (Optional)</label>
            <textarea
              id="rules"
              name="rules"
              value={formData.rules}
              onChange={handleInputChange}
              placeholder="Event rules and guidelines"
              rows="3"
            />
          </div>

          {/* Registration Fields Section */}
          <div className={styles.fieldsSection}>
            <h3><GradientText text="Registration Form Fields" /></h3>
            <p className={styles.fieldsDescription}>
              Define what information participants must provide when registering
            </p>

            {/* Current Fields */}
            <div className={styles.currentFields}>
              <h4>Current Fields ({requiredFields.length})</h4>
              {requiredFields.length === 0 ? (
                <p className={styles.noFields}>No fields added yet. Add at least one field.</p>
              ) : (
                <div className={styles.fieldsList}>
                  {requiredFields.map((field) => (
                    <div key={field.fieldName} className={styles.fieldItem}>
                      <div className={styles.fieldInfo}>
                        <span className={styles.fieldLabel}>{field.label}</span>
                        <span className={styles.fieldType}>({field.type})</span>
                        {field.required && <span className={styles.requiredTag}>Required</span>}
                      </div>
                      <button
                        type="button"
                        className={styles.removeFieldBtn}
                        onClick={() => handleRemoveField(field.fieldName)}
                      >
                        Remove
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Add New Field */}
            <div className={styles.addFieldSection}>
              <h4>Add New Field</h4>
              <div className={styles.fieldRow}>
                <input
                  type="text"
                  placeholder="Field name (e.g., collegeName)"
                  value={newField.fieldName}
                  onChange={(e) =>
                    setNewField({ ...newField, fieldName: e.target.value })
                  }
                />
                <input
                  type="text"
                  placeholder="Field label (e.g., College Name)"
                  value={newField.label}
                  onChange={(e) =>
                    setNewField({ ...newField, label: e.target.value })
                  }
                />
                <select
                  value={newField.type}
                  onChange={(e) =>
                    setNewField({ ...newField, type: e.target.value })
                  }
                >
                  <option value="text">Text</option>
                  <option value="email">Email</option>
                  <option value="phone">Phone</option>
                  <option value="number">Number</option>
                  <option value="textarea">Textarea</option>
                </select>
                <button
                  type="button"
                  className={styles.addFieldBtn}
                  onClick={handleAddField}
                >
                  Add Field
                </button>
              </div>
            </div>
          </div>

          <div className={styles.formActions}>
            <button type="button" className={styles.cancelBtn} onClick={handleClose}>
              Cancel
            </button>
            <button type="submit" className={styles.submitBtn} disabled={loading}>
              {loading ? 'Creating...' : 'Create Event'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EventRegistrationUpload;
