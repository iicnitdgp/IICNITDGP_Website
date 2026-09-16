import React, { useState, useEffect, useRef } from 'react';
import { useForm, useFieldArray, useFormContext } from 'react-hook-form';
import Api from '../../common/api';
import uploadService from '../../services/uploadService';
import styles from './styles/audition.module.scss';
import { toast } from 'react-toastify';

const Audition = () => {
  console.log('Audition component is rendering');
  
  const { register, handleSubmit: onSubmit, control, reset, watch, setValue, formState: { errors } } = useForm({
    defaultValues: {
      name: '',
      email: '',
      mobile: '',
      rollno: '',
      domain: [],
      year: '',
      department: '',
      description: '',
      reason: '',
      otherClub: [{ value: '' }], // Start with one empty club field
      status: 'pending'
    }
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: "otherClub"
  });

  const [cvFile, setCvFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [domainDropdownOpen, setDomainDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);
  const [auditionOpen, setAuditionOpen] = useState(true);
  const [auditionMessage, setAuditionMessage] = useState('');
  const [configLoading, setConfigLoading] = useState(true);

  const watchedDomains = watch('domain');

  // Debug: Monitor domain changes
  useEffect(() => {
    console.log('Watched domains updated:', watchedDomains);
  }, [watchedDomains]);

  const domainOptions = [
    'Web/App developer and social media handle',
    'Content writing',
    'Graphic design', 
    'Video editing',
    'Event management and anchoring'
  ];

  // Domain color mapping
  const getDomainColor = (domain) => {
    const colors = {
      'Web/App developer and social media handle': '#00bfff',
      'Content writing': '#27ae60',
      'Graphic design': '#8e44ad',
      'Video editing': '#ff6b35',
      'Event management and anchoring': '#f39c12'
    };
    return colors[domain] || '#00bfff';
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        console.log('Clicked outside dropdown, closing');
        setDomainDropdownOpen(false);
      }
    };

    const handleEscapeKey = (event) => {
      if (event.key === 'Escape' && domainDropdownOpen) {
        console.log('Escape key pressed, closing dropdown');
        setDomainDropdownOpen(false);
      }
    };

    if (domainDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleEscapeKey);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscapeKey);
    };
  }, [domainDropdownOpen]);

  const handleDomainToggle = (domain) => {
    console.log('Toggling domain:', domain);
    console.log('Current domains:', watchedDomains);
    
    const currentDomains = [...(watchedDomains || [])];
    const isSelected = currentDomains.includes(domain);
    
    let newDomains;
    if (isSelected) {
      newDomains = currentDomains.filter(d => d !== domain);
    } else {
      newDomains = [...currentDomains, domain];
    }
    
    console.log('New domains:', newDomains);
    setValue('domain', newDomains);
  };

  const removeDomain = (domainToRemove) => {
    console.log('Removing domain:', domainToRemove);
    const newDomains = (watchedDomains || []).filter(d => d !== domainToRemove);
    setValue('domain', newDomains);
  };


  const handleFileChange = (e) => {
    setCvFile(e.target.files[0]);
  };

  const handleFormSubmit = async (data) => {
    setLoading(true);
    // Re-check config just before submit to avoid stale state
    try {
      const cfgResp = await fetch(Api.AuditionConfigGet.url, { method: Api.AuditionConfigGet.method });
      if (cfgResp.ok) {
        const cfg = await cfgResp.json();
        if (cfg && cfg.isOpen === false) {
          setAuditionOpen(false);
          setAuditionMessage(cfg.message || 'Auditions are currently closed.');
          toast.warn(cfg.message || 'Auditions are currently closed.');
          setLoading(false);
          return;
        }
      }
    } catch (e) {
      // If config fetch fails, proceed to server which will enforce; just log it.
      console.warn('Failed to re-check audition config before submit', e);
    }
    let cvUrl = '';
    try {
      if (cvFile) {
        const uploadResult = await uploadService.uploadFile(cvFile, null, 'cv');
        if (uploadResult.success) {
          cvUrl = uploadResult.url;
        } else {
          toast.error('CV upload failed: ' + uploadResult.error);
          setLoading(false);
          return;
        }
      }
      // Filter out empty clubs before submitting
      const filteredOtherClub = data.otherClub.filter(club => club.value && club.value.trim() !== '').map(club => club.value);
      const payload = { ...data, otherClub: filteredOtherClub, cv: cvUrl };
      const response = await fetch(Api.AuditionSubmit.url, {
        method: Api.AuditionSubmit.method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (response.ok) {
        toast.success('Audition submitted successfully!');
        reset();
        setCvFile(null);
      } else {
        if (response.status === 403) {
          const err = await response.json().catch(() => ({ message: 'Auditions are closed.' }));
          setAuditionOpen(false);
          setAuditionMessage(err.message || 'Auditions are closed.');
          toast.warn(err.message || 'Auditions are closed.');
        } else {
          toast.error('Submission failed.');
        }
      }
    } catch (err) {
      toast.error('Error: ' + err.message);
    }
    setLoading(false);
  };

  // Ensure at least one club field is always present
  useEffect(() => {
    if (fields.length === 0) {
      append({ value: '' });
    }
  }, [fields.length, append]);

  // Fetch audition config on mount
  useEffect(() => {
    const loadConfig = async () => {
      setConfigLoading(true);
      try {
        const resp = await fetch(Api.AuditionConfigGet.url, { method: Api.AuditionConfigGet.method });
        if (resp.ok) {
          const cfg = await resp.json();
          setAuditionOpen(cfg?.isOpen !== false);
          setAuditionMessage(cfg?.message || '');
        } else {
          // If cannot fetch, default to open (server will still enforce)
          setAuditionOpen(true);
        }
      } catch (e) {
        setAuditionOpen(true);
      } finally {
        setConfigLoading(false);
      }
    };
    loadConfig();
  }, []);

  return (
    <div className={styles.auditionPage}>
      <div className={styles.auditionContainer}>
        <div className={styles.headerSection}>
          <p className={styles.head}>
            JOIN OUR{" "}
            <span
              style={{
                background: "var(--primary)",
                WebkitBackgroundClip: "text",
                color: "transparent",
              }}
            >
              INNOVATION CLUB
            </span>
          </p>
          <p className={styles.subtitle}>
            Be part of the next generation of innovators and creators
          </p>
        </div>
        {!configLoading && auditionOpen === false && (
          <div
            style={{
              background: '#2a2a2a',
              border: '1px solid #444',
              borderRadius: '10px',
              padding: '1rem',
              marginBottom: '1rem',
              color: '#f1c40f',
            }}
          >
            {auditionMessage || 'Auditions are currently closed.'}
          </div>
        )}
        
        <form className={styles.auditionForm} onSubmit={onSubmit(handleFormSubmit)}>
        {auditionOpen === false && (
          <div style={{ marginBottom: '1rem', color: '#bbb' }}>
            The form is disabled while auditions are closed.
          </div>
        )}
        <label>
          Name:
          <input 
            type="text" 
            {...register('name', { required: 'Name is required' })} 
            disabled={auditionOpen === false}
          />
          {errors.name && <span className={styles.error}>{errors.name.message}</span>}
        </label>
        <label>
          Email:
          <input 
            type="email" 
            {...register('email', { required: 'Email is required' })} 
            disabled={auditionOpen === false}
          />
          {errors.email && <span className={styles.error}>{errors.email.message}</span>}
        </label>
        <label>
          Mobile:
          <input 
            type="tel" 
            {...register('mobile', { required: 'Mobile is required' })} 
            disabled={auditionOpen === false}
          />
          {errors.mobile && <span className={styles.error}>{errors.mobile.message}</span>}
        </label>
        <label>
          Roll Number:
          <input 
            type="text" 
            {...register('rollno', { required: 'Roll number is required' })} 
            disabled={auditionOpen === false}
          />
          {errors.rollno && <span className={styles.error}>{errors.rollno.message}</span>}
        </label>
        <label>
          Domain (select one or more):
          <div className={styles.customSelect} ref={dropdownRef}>
            <div 
              className={styles.selectHeader}
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                console.log('Header clicked, current state:', domainDropdownOpen);
                if (auditionOpen === false) return; 
                setDomainDropdownOpen(!domainDropdownOpen);
              }}
                style={{
                  padding: '0.75rem 1rem',
                  border: '1px solid #444',
                  borderRadius: '8px',
                  backgroundColor: '#2a2a2a',
                  color: '#ffffff',
                  cursor: 'pointer',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}
              >
                <span>{watchedDomains && watchedDomains.length > 0 ? `${watchedDomains.length} selected` : 'Select domains'}</span>
                <span className={styles.arrow}>{domainDropdownOpen ? '▲' : '▼'}</span>
              </div>            {/* Selected domains as chips */}
            {watchedDomains && watchedDomains.length > 0 && (
              <div 
                className={styles.selectedDomains}
                style={{
                  display: 'flex',
                  flexWrap: 'wrap',
                  gap: '0.5rem',
                  marginTop: '0.5rem'
                }}
              >
                {watchedDomains.map(domain => (
                  <span 
                    key={domain} 
                    className={styles.domainChip}
                    style={{
                      backgroundColor: getDomainColor(domain),
                      color: 'white',
                      padding: '0.3rem 0.6rem',
                      borderRadius: '6px',
                      fontSize: '0.85rem',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '0.4rem',
                      border: `1px solid ${getDomainColor(domain)}`,
                      fontWeight: '500',
                      boxShadow: `0 2px 4px ${getDomainColor(domain)}33`
                    }}
                  >
                    {domain}
                    <button 
                      type="button" 
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        if (auditionOpen === false) return;
                        removeDomain(domain);
                      }}
                      className={styles.removeChip}
                      style={{
                        background: 'none',
                        border: 'none',
                        color: 'white',
                        cursor: 'pointer',
                        fontSize: '1.1rem',
                        padding: '0',
                        lineHeight: '1',
                        marginLeft: '0.2rem',
                        borderRadius: '50%',
                        width: '16px',
                        height: '16px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        transition: 'background-color 0.2s'
                      }}
                      onMouseEnter={(e) => e.target.style.backgroundColor = 'rgba(255,255,255,0.2)'}
                      onMouseLeave={(e) => e.target.style.backgroundColor = 'transparent'}
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
            )}
            
            {/* Dropdown options */}
            {domainDropdownOpen && (
              <div 
                className={styles.selectOptions}
                style={{
                  position: 'absolute',
                  top: '100%',
                  left: 0,
                  right: 0,
                  backgroundColor: '#2a2a2a',
                  border: '1px solid #444',
                  borderTop: 'none',
                  borderRadius: '0 0 8px 8px',
                  maxHeight: '200px',
                  overflowY: 'auto',
                  zIndex: 10,
                  boxShadow: '0 4px 8px rgba(0,0,0,0.2)'
                }}
              >
                {domainOptions.map(domain => (
                  <div 
                    key={domain}
                    className={`${styles.selectOption} ${(watchedDomains || []).includes(domain) ? styles.selected : ''}`}
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      console.log('Clicked on domain:', domain);
                      if (auditionOpen === false) return;
                      handleDomainToggle(domain);
                    }}
                    style={{
                      padding: '0.75rem 1rem',
                      cursor: 'pointer',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      backgroundColor: (watchedDomains || []).includes(domain) ? '#00bfff' : 'transparent',
                      color: (watchedDomains || []).includes(domain) ? 'white' : '#ffffff'
                    }}
                  >
                    <span>{domain}</span>
                    {(watchedDomains || []).includes(domain) && <span className={styles.checkmark}>✓</span>}
                  </div>
                ))}
              </div>
            )}
          </div>
          {/* Hidden input for form validation */}
          <input 
            type="hidden" 
            {...register('domain', { required: 'At least one domain must be selected' })}
            value={(watchedDomains || []).join(',')} 
          />
          {errors.domain && <span className={styles.error}>{errors.domain.message}</span>}
        </label>
        <label>
          Year:
          <select {...register('year', { required: 'Year is required' })} disabled={auditionOpen === false}>
            <option value="">Select Year</option>
            <option value="1">1st Year</option>
            <option value="2">2nd Year</option>
            <option value="3">3rd Year</option>
            <option value="4">4th Year</option>
          </select>
          {errors.year && <span className={styles.error}>{errors.year.message}</span>}
        </label>
        <label>
          Department:
          <input 
            type="text" 
            {...register('department', { required: 'Department is required' })} 
            disabled={auditionOpen === false}
          />
          {errors.department && <span className={styles.error}>{errors.department.message}</span>}
        </label>
        <label>
          Upload CV (PDF/DOC) - Optional:
          <input type="file" accept=".pdf,.doc,.docx" onChange={handleFileChange} disabled={auditionOpen === false} />
        </label>
        
        <label>
          Previous Projects in Your Domain:
          <textarea 
            {...register('description', { required: 'Description is required' })} 
            placeholder="Describe your previous projects, provide project links, or showcase any relevant work in your domain..."
            rows="4"
            style={{
              minHeight: '100px',
              resize: 'vertical',
              padding: '0.75rem',
              border: '1px solid #444',
              borderRadius: '8px',
              backgroundColor: '#2a2a2a',
              color: '#ffffff',
              fontFamily: 'inherit',
              fontSize: '1rem'
            }}
            disabled={auditionOpen === false}
          />
          {errors.description && <span className={styles.error}>{errors.description.message}</span>}
        </label>
        
        <label>
          Why do you want to join IIC?
          <textarea 
            {...register('reason', { required: 'Reason is required' })} 
            placeholder="Explain why you want to join the Innovation Club and how you can contribute to IIC..."
            rows="4"
            style={{
              minHeight: '100px',
              resize: 'vertical',
              padding: '0.75rem',
              border: '1px solid #444',
              borderRadius: '8px',
              backgroundColor: '#2a2a2a',
              color: '#ffffff',
              fontFamily: 'inherit',
              fontSize: '1rem'
            }}
            disabled={auditionOpen === false}
          />
          {errors.reason && <span className={styles.error}>{errors.reason.message}</span>}
        </label>
        
        <label>
          Clubs (if any):
          <div className={styles.otherClubsContainer}>
            {fields.map((field, index) => (
              <div key={field.id} className={styles.clubInputContainer} style={{
                display: 'flex',
                gap: '0.5rem',
                marginBottom: '0.5rem',
                alignItems: 'center'
              }}>
                <input
                  type="text"
                  {...register(`otherClub.${index}.value`)}
                  placeholder={`Club ${index + 1} name (leave empty if none)`}
                  style={{
                    flex: 1,
                    padding: '0.75rem',
                    border: '1px solid #444',
                    borderRadius: '8px',
                    backgroundColor: '#2a2a2a',
                    color: '#ffffff'
                  }}
                  disabled={auditionOpen === false}
                />
                {fields.length > 1 && (
                  <button
                    type="button"
                    onClick={() => (auditionOpen === false ? null : remove(index))}
                    className={styles.removeClubButton}
                    style={{
                      background: '#ff4757',
                      color: 'white',
                      border: 'none',
                      borderRadius: '6px',
                      padding: '0.5rem 0.75rem',
                      cursor: 'pointer',
                      fontSize: '0.9rem',
                      fontWeight: '500',
                      minWidth: 'auto',
                      transition: 'all 0.2s'
                    }}
                    disabled={auditionOpen === false}
                  >
                    Remove
                  </button>
                )}
              </div>
            ))}
            <button
              type="button"
              onClick={() => (auditionOpen === false ? null : append({ value: '' }))}
              className={styles.addClubButton}
              style={{
                background: 'linear-gradient(135deg, #00bfff, #0080ff)',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                padding: '0.75rem 1rem',
                cursor: 'pointer',
                fontSize: '1rem',
                fontWeight: '500',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                marginTop: '0.5rem',
                transition: 'all 0.2s',
                boxShadow: '0 2px 4px rgba(0, 191, 255, 0.3)'
              }}
              onMouseEnter={(e) => {
                e.target.style.transform = 'translateY(-1px)';
                e.target.style.boxShadow = '0 4px 8px rgba(0, 191, 255, 0.4)';
              }}
              onMouseLeave={(e) => {
                e.target.style.transform = 'translateY(0)';
                e.target.style.boxShadow = '0 2px 4px rgba(0, 191, 255, 0.3)';
              }}
              disabled={auditionOpen === false}
            >
              <span style={{ fontSize: '1.2rem', fontWeight: 'bold' }}>+</span>
              Add Club
            </button>
          </div>
        </label>
        
        <button type="submit" disabled={loading || auditionOpen === false} className={styles.submitButton}>
          {loading ? 'Submitting...' : 'Submit Application'}
        </button>
      </form>
      </div>
    </div>
  );
};

export default Audition;
