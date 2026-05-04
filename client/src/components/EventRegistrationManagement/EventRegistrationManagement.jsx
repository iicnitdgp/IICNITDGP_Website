import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import API from '../../common/api';
import styles from './styles/eventRegistrationManagement.module.scss';
import GradientText from '../../component/Core/TextStyle';
import { fetchWithTokenRefresh } from '../../utils/fetchWithTokenRefresh';

const EventRegistrationManagement = ({ isOpen, onClose }) => {
  const { accessToken } = useSelector((state) => state.auth);
  const [events, setEvents] = useState([]);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [registrations, setRegistrations] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loadingRegistrations, setLoadingRegistrations] = useState(false);

  const fetchEvents = async () => {
    setLoading(true);
    try {
      const response = await fetchWithTokenRefresh(API.EventFetch.url, {
        method: API.EventFetch.method,
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        setEvents(Array.isArray(data) ? data : []);
      }
    } catch (error) {
      console.error('Error fetching events:', error);
    } finally {
      setLoading(false);
    }
  };

  const publishEvent = async (eventId) => {
    try {
      const response = await fetchWithTokenRefresh(API.EventUpdate.url.replace(':id', eventId), {
        method: API.EventUpdate.method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: 'active' }),
      });

      if (response.ok) {
        fetchEvents();
      } else {
        const err = await response.json();
        alert('Failed to publish event: ' + (err.message || 'Unknown error'));
      }
    } catch (error) {
      alert('Error publishing event: ' + error.message);
    }
  };

  const closeEventAdmin = async (eventId) => {
    try {
      const response = await fetchWithTokenRefresh(API.EventClose.url.replace(':id', eventId), {
        method: API.EventClose.method,
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        fetchEvents();
        if (selectedEvent && selectedEvent._id === eventId) {
          setSelectedEvent(null);
          setRegistrations([]);
        }
      } else {
        const err = await response.json();
        alert('Failed to close event: ' + (err.message || 'Unknown error'));
      }
    } catch (error) {
      alert('Error closing event: ' + error.message);
    }
  };

  const fetchRegistrations = async (eventId) => {
    setLoadingRegistrations(true);
    try {
      const response = await fetchWithTokenRefresh(
        API.EventRegistrationsByEvent.url.replace(':eventId', eventId),
        {
          method: API.EventRegistrationsByEvent.method,
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );

      if (response.ok) {
        const data = await response.json();
        setRegistrations(Array.isArray(data) ? data : []);
      }
    } catch (error) {
      console.error('Error fetching registrations:', error);
    } finally {
      setLoadingRegistrations(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchEvents();
    }
  }, [isOpen]);

  const handleEventSelect = (event) => {
    setSelectedEvent(event);
    fetchRegistrations(event._id);
  };

  const approveRegistration = async (registrationId) => {
    try {
      const response = await fetchWithTokenRefresh(
        API.EventRegistrationApprove.url.replace(':id', registrationId),
        {
          method: API.EventRegistrationApprove.method,
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );

      if (response.ok) {
        alert('Registration approved successfully');
        if (selectedEvent) {
          fetchRegistrations(selectedEvent._id);
        }
      } else {
        const error = await response.json();
        alert('Failed to approve: ' + (error.message || 'Unknown error'));
      }
    } catch (error) {
      alert('Error approving registration: ' + error.message);
    }
  };

  const rejectRegistration = async (registrationId) => {
    const reason = prompt('Enter rejection reason:');
    if (!reason) return;

    try {
      const response = await fetchWithTokenRefresh(
        API.EventRegistrationReject.url.replace(':id', registrationId),
        {
          method: API.EventRegistrationReject.method,
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ rejectionReason: reason }),
        }
      );

      if (response.ok) {
        alert('Registration rejected successfully');
        if (selectedEvent) {
          fetchRegistrations(selectedEvent._id);
        }
      } else {
        const error = await response.json();
        alert('Failed to reject: ' + (error.message || 'Unknown error'));
      }
    } catch (error) {
      alert('Error rejecting registration: ' + error.message);
    }
  };

  if (!isOpen) return null;

  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div className={styles.modalHeader}>
          <h2><GradientText text="Event Registration Management" /></h2>
          <button className={styles.closeButton} onClick={onClose}>×</button>
        </div>

        <div className={styles.modalContent}>
          <div className={styles.eventsPanel}>
            <h3>Events</h3>
            {loading ? (
              <p>Loading events...</p>
            ) : events.length > 0 ? (
              <div className={styles.eventsList}>
                {events.map((event) => (
                  <div
                    key={event._1d || event._id}
                    className={`${styles.eventItem} ${
                      selectedEvent?._id === event._id ? styles.active : ''
                    }`}
                    onClick={() => handleEventSelect(event)}
                  >
                    <div className={styles.eventSummary}>
                      <div>
                        <h4>{event.name}</h4>
                        <p>{event.participationType}</p>
                      </div>
                      <div>
                        <span className={styles.status}>{event.status}</span>
                      </div>
                    </div>

                    <div className={styles.eventActionsSmall} onClick={(e) => e.stopPropagation()}>
                      {event.status !== 'active' && (
                        <button className={styles.publishBtn} onClick={() => publishEvent(event._id)}>
                          Publish
                        </button>
                      )}

                      {event.status === 'active' && (
                        <button className={styles.closeBtn} onClick={() => closeEventAdmin(event._id)}>
                          Close
                        </button>
                      )}
                    </div>

                    {event.status === 'active' && event.registrationLink && (
                      <div className={styles.registrationLink}>
                        <a href={event.registrationLink} target="_blank" rel="noopener noreferrer">
                          Registration Link
                        </a>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <p>No events found</p>
            )}
          </div>

          <div className={styles.registrationsPanel}>
            {selectedEvent ? (
              <>
                <h3>Registrations for {selectedEvent.name}</h3>
                {loadingRegistrations ? (
                  <p>Loading registrations...</p>
                ) : registrations.length > 0 ? (
                  <div className={styles.registrationsList}>
                    {registrations.map((registration) => (
                      <div key={registration._id} className={styles.registrationItem}>
                        <div className={styles.registrationInfo}>
                          <h4>
                            {registration.type === 'team'
                              ? registration.teamName
                              : registration.participants[0]?.name}
                          </h4>
                          <p>Type: {registration.type}</p>
                          <p>Status: <span className={`${styles.status} ${styles[registration.status]}`}>{registration.status}</span></p>
                          <div className={styles.participants}>
                            {registration.participants.map((p, idx) => (
                              <div key={idx} className={styles.participantCard}>
                                {Object.keys(p).map((key) => (
                                  <div key={key} className={styles.participantField}>
                                    <strong style={{ textTransform: 'capitalize' }}>{key.replace(/([A-Z])/g, ' $1')}:</strong>
                                    <span style={{ marginLeft: 6 }}>{String(p[key] ?? '')}</span>
                                  </div>
                                ))}
                              </div>
                            ))}
                          </div>
                        </div>
                        {registration.status === 'pending' && (
                          <div className={styles.actions}>
                            <button
                              className={styles.approveBtn}
                              onClick={() => approveRegistration(registration._id)}
                            >
                              ✓ Approve
                            </button>
                            <button
                              className={styles.rejectBtn}
                              onClick={() => rejectRegistration(registration._id)}
                            >
                              ✗ Reject
                            </button>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <p>No registrations yet</p>
                )}
              </>
            ) : (
              <div className={styles.placeholder}>Select an event to view registrations</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default EventRegistrationManagement;
