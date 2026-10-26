
import React, { useEffect, useState } from 'react';
import Modal from 'react-modal';
import apiService from '../../services/apiService';
import styles from './styles/DeleteCarouselImage.module.scss';

const DeleteCarouselImage = ({ isOpen, onClose, onImageDeleted }) => {
  const [images, setImages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const [error, setError] = useState('');
  useEffect(() => {
    if (!isOpen) return;

    let isActive = true;

    const fetchImages = async () => {
      setLoading(true);
      setError('');

      try {
        const response = await apiService.request('/carousel-images');
        if (!response.ok) {
          throw new Error(`Failed to fetch images (${response.status})`);
        }
        const result = await response.json();

        console.log('Carousel images:', result);

        const fetchedImages = Array.isArray(result)
          ? result
          : result?.images ?? result?.data ?? [];

        if (!Array.isArray(fetchedImages)) {
          throw new Error('Invalid image data received from server.');
        }

        if (isActive) {
          setImages(fetchedImages);
        }
      } catch (err) {
        console.error('Failed to fetch carousel images:', err);

        if (isActive) {
          setError(err.message || 'Failed to load carousel images.');
          setImages([]);
        }
      } finally {
        if (isActive) {
          setLoading(false);
        }
      }
    };

    fetchImages();

    return () => {
      isActive = false;
    };
  }, [isOpen]);

  const handleClose = () => {
    if (deletingId !== null) return;
    onClose();
  };

  const handleDelete = async (id) => {
  const confirmed = window.confirm(
    'Are you sure you want to delete this carousel image?'
  );

  if (!confirmed) return;

  setDeletingId(id);

  try {
    await apiService.deleteCarouselImage(id);

    setImages((previousImages) =>
      previousImages.filter((image) => image._id !== id)
    );

    if (onImageDeleted) {
      onImageDeleted(id);
    }
  } catch (err) {
    console.error('Failed to delete carousel image:', err);

    window.alert(
      `Failed to delete carousel image:  Please try again.`
    );
  } finally {
    setDeletingId(null);
  }
};

  return (
    <Modal
      isOpen={isOpen}
      onRequestClose={handleClose}
      className={styles.eventsManagerModal}
      overlayClassName={styles.modalOverlay}
      ariaHideApp={false}
      contentLabel="Delete Carousel Images"
    >
      <div className={styles.modalHeader}>
        <h2>Manage Carousel Images</h2>

        <button
          type="button"
          className={styles.closeButton}
          onClick={handleClose}
          disabled={deletingId !== null}
          aria-label="Close modal"
        >
          ×
        </button>
      </div>

      <div className={styles.modalContent}>

        {loading ? (
          <div className={styles.loadingContainer}>
            <div className={styles.loader} />
            <p>Loading carousel images...</p>
          </div>
        ) : images.length > 0 ? (
          <div className={styles.eventsList}>
            {images.map((item) => (
              <div key={item._id} className={styles.eventItem}>
                <div className={styles.eventInfo}>
                  <div className={styles.eventImageContainer}>
                    <img
                      src={item.image}
                      alt={item.name || 'Carousel image'}
                      className={styles.eventImage}
                      loading="lazy"
                      onError={(event) => {
                        event.currentTarget.style.opacity = '0.3';
                        console.error(
                          'Failed to load image:',
                          item.image
                        );
                      }}
                    />
                  </div>

                  <div className={styles.eventDetails}>
                    <h4>{item.name || 'Carousel Image'}</h4>
                    <p className={styles.eventMeta}>
                      ID: {item._id}
                    </p>
                  </div>
                </div>

                <div className={styles.eventActions}>
                  <button
                    type="button"
                    className={styles.deleteEventButton}
                    onClick={() => handleDelete(item._id)}
                    disabled={deletingId !== null}
                  >
                    {deletingId === item._id
                      ? 'Deleting...'
                      : 'Delete'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : !error && !loading ? (
          <div className={styles.noEventsContainer}>
            <p>No carousel images found.</p>
          </div>
        ) : null}
      </div>
    </Modal>
  );
};

export default DeleteCarouselImage;
