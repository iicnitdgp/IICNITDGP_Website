import React from 'react';
import { useParams } from 'react-router-dom';
import { useForm, useFieldArray } from 'react-hook-form';
import { toast } from 'react-toastify';
import API from '../../common/api';
import styles from './EventRegistration.module.scss';

const defaultParticipant = { name: '', email: '', phone: '' };

const EventRegistrationPage = () => {
  const { eventId } = useParams();
  const [event, setEvent] = React.useState(null);
  const [loading, setLoading] = React.useState(true);
  const [submitting, setSubmitting] = React.useState(false);
  const [participantTemplate, setParticipantTemplate] = React.useState(defaultParticipant);

  const { register, control, handleSubmit, watch, reset, setValue } = useForm({
    defaultValues: {
      type: 'single',
      teamName: '',
      participants: [defaultParticipant],
    },
  });

  const selectedType = watch('type');
  const watchedParticipants = watch('participants');
  const { fields, append, remove } = useFieldArray({
    control,
    name: 'participants',
  });

  React.useEffect(() => {
    if (event && event.participationType === 'single' && watchedParticipants?.length > 1) {
      setValue('participants', [watchedParticipants[0]]);
    }
  }, [event, setValue, watchedParticipants]);

  React.useEffect(() => {
    const fetchEvent = async () => {
      try {
        const response = await fetch(API.EventById.url.replace(':id', eventId), {
          method: API.EventById.method,
          headers: {
            'Content-Type': 'application/json',
          },
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message || 'Failed to load event');
        }

        const data = await response.json();
        setEvent(data);

        // build participant template from event.requiredParticipantFields
        let defs = (data.requiredParticipantFields && data.requiredParticipantFields.length)
          ? [...data.requiredParticipantFields]
          : [
              { fieldName: 'name', label: 'Full name', type: 'text', required: true },
              { fieldName: 'email', label: 'Email', type: 'email', required: true },
              { fieldName: 'phone', label: 'Phone', type: 'text', required: true },
            ];

        // Ensure 'name' (Full name) is always the first field
        if (!defs.some((f) => (f.fieldName || '').toLowerCase() === 'name')) {
          defs.unshift({ fieldName: 'name', label: 'Full name', type: 'text', required: true });
        }

        const template = {};
        defs.forEach((f) => {
          const key = (f.fieldName || f.label || 'field');
          template[key] = '';
        });

        setParticipantTemplate(template);

        reset({
          type: data.participationType || 'single',
          teamName: '',
          participants: [template],
        });
      } catch (error) {
        toast.error(error.message);
      } finally {
        setLoading(false);
      }
    };

    fetchEvent();
  }, [eventId, reset]);

  const onSubmit = async (formData) => {
    setSubmitting(true);
    try {
      const response = await fetch(API.EventRegistrationSubmit.url.replace(':eventId', eventId), {
        method: API.EventRegistrationSubmit.method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          type: event.participationType,
          teamName: formData.teamName,
          participants: formData.participants,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to submit registration');
      }

      toast.success('Registration request submitted successfully');
      reset({
        type: event?.participationType || 'single',
        teamName: '',
        participants: [participantTemplate],
      });
    } catch (error) {
      toast.error(error.message);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <div className={styles.loadingBox}>Loading event...</div>;
  }

  if (!event) {
    return <div className={styles.errorBox}>Event not found.</div>;
  }

  const canRegister = event.status === 'active';

  return (
    <div className={styles.container}>
      <div className={styles.headerSection}>
        <p className={styles.subtitle}>Event Registration</p>
        <h1>{event.name}</h1>
        <div className={styles.description} dangerouslySetInnerHTML={{ __html: event.description }} />

        {event.rules && (
          <div className={styles.rulesSection}>
            <h3>Rules & Guidelines</h3>
            <div className={styles.rulesContent} dangerouslySetInnerHTML={{ __html: typeof event.rules === 'string' ? event.rules : Array.isArray(event.rules) ? event.rules.join('') : String(event.rules) }} />
          </div>
        )}

        <div className={styles.meta}>
          <span>📅 {new Date(event.date).toLocaleString()}</span>
          <span>👥 {event.participationType === 'single' ? 'Individual' : 'Team'}</span>
          <span>✅ {event.status === 'active' ? 'Open for registration' : 'Not yet open'}</span>
        </div>
      </div>

      {!canRegister ? (
        <div className={`${styles.infoBox} ${styles.inactive}`}>
          <p>Registration is not active yet. Please check back later.</p>
        </div>
      ) : (
        <>
          {event.participationType === 'team' && event.maxTeamSize && (
            <div className={`${styles.infoBox} ${styles.team}`}>
              <p>
                👥 <strong>Maximum team size:</strong> {event.maxTeamSize} members per team
              </p>
            </div>
          )}

          {event.participationType === 'team' && (
            <div className={`${styles.infoBox} ${styles.teamLeader}`}>
              <p>
                ⭐ <strong>Team Leader:</strong> The 1st member will be designated as the Team Leader
              </p>
            </div>
          )}

          {event.maxParticipants && (
            <div className={`${styles.infoBox} ${styles.participants}`}>
              <p>
                📊 <strong>Maximum participants:</strong> {event.maxParticipants} total registrations allowed
              </p>
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className={styles.formContainer}>
            <div className={styles.formHeader}>
              <h2>{event.name} Registration</h2>
              <div className={styles.date}>{new Date(event.date).toLocaleString()}</div>
            </div>

            {event.participationType === 'team' && (
              <div className={`${styles.formGroup} ${styles.teamNameGroup}`}>
                <label htmlFor="teamName">Team Name *</label>
                <input
                  id="teamName"
                  {...register('teamName')}
                  placeholder="Enter your team name"
                  required
                />
              </div>
            )}

            <div className={styles.participantsSection}>
              <div className={styles.sectionHeader}>
                <h3>Participants Details</h3>
                {event.participationType === 'team' && (
                  <button
                    type="button"
                    onClick={() => append(participantTemplate)}
                    className={styles.addButton}
                  >
                    + Add Participant
                  </button>
                )}
              </div>
              {fields.map((field, index) => {
                let defs = (event.requiredParticipantFields && event.requiredParticipantFields.length)
                  ? [...event.requiredParticipantFields]
                  : [
                      { fieldName: 'name', label: 'Full name', type: 'text' },
                      { fieldName: 'email', label: 'Email', type: 'email' },
                      { fieldName: 'phone', label: 'Phone', type: 'text' },
                    ];

                if (!defs.some((f) => (f.fieldName || '').toLowerCase() === 'name')) {
                  defs.unshift({ fieldName: 'name', label: 'Full name', type: 'text' });
                }

                return (
                  <div key={field.id} className={styles.participantCard}>
                    <div className={styles.inputGrid}>
                      {defs.map((def) => (
                        def.type === 'textarea' ? (
                          <textarea
                            key={def.fieldName}
                            {...register(`participants.${index}.${def.fieldName}`)}
                            placeholder={def.label || def.fieldName}
                          />
                        ) : (
                          <input
                            key={def.fieldName}
                            {...register(`participants.${index}.${def.fieldName}`)}
                            placeholder={def.label || def.fieldName}
                            type={def.type === 'email' ? 'email' : 'text'}
                          />
                        )
                      ))}
                    </div>
                    {fields.length > 1 && (
                      <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                        <button
                          type="button"
                          onClick={() => remove(index)}
                          className={styles.removeButton}
                        >
                          Remove
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <button type="submit" disabled={submitting} className={styles.submitButton}>
                {submitting ? 'Submitting...' : 'Submit Registration'}
              </button>
            </div>
          </form>
        </>
      )}
    </div>
  );
};

export default EventRegistrationPage;