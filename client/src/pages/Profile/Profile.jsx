import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { loadUserFromStorage } from '../../store/slices/authSlice';
import apiService from '../../services/apiService';
import EditProfileModal from '../../components/EditProfileModal/EditProfileModal';
import AddUserModal from '../../components/AddUserModal/AddUserModal';
import EventUploadModal from '../../components/EventUploadModal/EventUploadModal';
import EventsManager from '../../components/EventsManager/EventsManager';
import EventRegistrationManagement from '../../components/EventRegistrationManagement/EventRegistrationManagement';
import EventRegistrationUpload from '../../components/EventRegistrationUpload/EventRegistrationUpload';
import UserManagementModal from '../../components/UserManagementModal/UserManagementModal';
import InnovationSubmissions from '../../components/InnovationSubmissions/InnovationSubmissions';
import AuditionManagement from '../../components/AuditionManagement/AuditionManagement';
import CarouselImageUpload from '../../components/CarouselImageUpload/CarouselImageUpload';
import GalleryImageUpload from '../../components/GalleryImageUpload/GalleryImageUpload';
import ResetPassword from '../../components/ResetPassword/ResetPassword';
import styles from './styles/profile.module.scss';
import GradientText from '../../component/Core/TextStyle';

const Profile = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { isAuthenticated, user, accessToken, refreshToken } = useSelector((state) => state.auth);
  
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isAddUserModalOpen, setIsAddUserModalOpen] = useState(false);
  const [isEventModalOpen, setIsEventModalOpen] = useState(false);
  const [isEditEventsModalOpen, setIsEditEventsModalOpen] = useState(false);
  const [isUserManagementModalOpen, setIsUserManagementModalOpen] = useState(false);
  const [isInnovationSubmissionsOpen, setIsInnovationSubmissionsOpen] = useState(false);
  const [isAuditionManagementOpen, setIsAuditionManagementOpen] = useState(false);
  const [isCarouselUploadOpen, setIsCarouselUploadOpen] = useState(false);
  const [isGalleryUploadOpen, setIsGalleryUploadOpen] = useState(false);
  const [isResetPasswordOpen, setIsResetPasswordOpen] = useState(false);
  const [isEventRegistrationManagementOpen, setIsEventRegistrationManagementOpen] = useState(false);
  const [isEventRegistrationUploadOpen, setIsEventRegistrationUploadOpen] = useState(false);

  useEffect(() => {
    // Load user data from localStorage on component mount
    dispatch(loadUserFromStorage());
  }, [dispatch]);

  useEffect(() => {
    // Redirect to login if not authenticated
    if (!isAuthenticated) {
      navigate('/login');
    }
  }, [isAuthenticated, navigate]);

  const handleLogout = async () => {
    try {
      await apiService.logout();
      navigate('/');
    } catch (error) {
      console.error('Logout error:', error);
      // Even if logout fails, redirect to home
      navigate('/');
    }
  };

  const handleUserAdded = (newUser) => {
    console.log('New user added:', newUser);
    // You can add logic here to refresh user list or show notification
  };

  const handleEventAdded = (newEvent) => {
    console.log('New event added:', newEvent);
    // Refresh will be handled by EventsManager if needed
  };

  const handleEventUpdated = () => {
    console.log('Event updated/deleted');
    // Additional logic can be added here if needed
  };

  const handleCarouselImageAdded = (newImage) => {
    console.log('New carousel image added:', newImage);
    // You can add logic here to refresh carousel or show notification
  };

  const handleGalleryImageAdded = (newImage) => {
    console.log('New gallery image added:', newImage);
    // You can add logic here to refresh gallery or show notification
  };

  const handleAuditionManagementOpen = () => {
    // Check if user has valid authentication before opening
    if (!isAuthenticated || !accessToken || !user) {
      console.log('Authentication required for audition management');
      navigate('/login');
      return;
    }
    
    if (user.role !== 'admin') {
      alert('Access denied. Admin privileges required.');
      return;
    }
    
    setIsAuditionManagementOpen(true);
  };

  if (!isAuthenticated || !user) {
    return (
      <div className={styles.loadingContainer}>
        <p>Loading...</p>
      </div>
    );
  }

  const isAdmin = user.role === 'admin';

  return (
    <div className={styles.profileContainer}>
      <div className={styles.profileCard}>
        <div className={styles.profileHeader}>
          <div className={styles.profileImageContainer}>
            <img 
              src={user.photo || 'https://via.placeholder.com/150'} 
              alt={user.name}
              className={styles.profileImage}
            />
          </div>
          <div className={styles.profileInfo}>
            <h1><GradientText text={user.name} /></h1>
            <p className={styles.userEmail}>{user.email}</p>
            {isAdmin && (
              <span className={styles.adminBadge}>Admin</span>
            )}
          </div>
        </div>

        <div className={styles.profileDetails}>
          <div className={styles.detailSection}>
            <h3><GradientText text="Personal Information" /></h3>
            <div className={styles.detailGrid}>
              <div className={styles.detailItem}>
                <label>Full Name</label>
                <p>{user.name}</p>
              </div>
              <div className={styles.detailItem}>
                <label>Email Address</label>
                <p>{user.email}</p>
              </div>
              <div className={styles.detailItem}>
                <label>Phone Number</label>
                <p>{user.phone || 'Not provided'}</p>
              </div>
              <div className={styles.detailItem}>
                <label>Address</label>
                <p>{user.address || 'Not provided'}</p>
              </div>
              <div className={styles.detailItem}>
                <label>Designation</label>
                <p>{user.designation || 'Not provided'}</p>
              </div>
              <div className={styles.detailItem}>
                <label>Type</label>
                <p>{user.type || 'Other'}</p>
              </div>
            </div>
          </div>

          {/* Social Links Section */}
          {(user.extra?.linkedin || user.extra?.github) && (
            <div className={styles.detailSection}>
              <h3><GradientText text="Social Links" /></h3>
              <div className={styles.detailGrid}>
                {user.extra?.linkedin && (
                  <div className={styles.detailItem}>
                    <label>LinkedIn</label>
                    <p>
                      <a 
                        href={user.extra.linkedin} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className={styles.socialLink}
                      >
                        {user.extra.linkedin}
                      </a>
                    </p>
                  </div>
                )}
                {user.extra?.github && (
                  <div className={styles.detailItem}>
                    <label>GitHub</label>
                    <p>
                      <a 
                        href={user.extra.github} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className={styles.socialLink}
                      >
                        {user.extra.github}
                      </a>
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}

          <div className={styles.detailSection}>
            <h3><GradientText text="Account Information" /></h3>
            <div className={styles.detailGrid}>
              <div className={styles.detailItem}>
                <label>User ID</label>
                <p>{user._id || user.id}</p>
              </div>
              <div className={styles.detailItem}>
                <label>Role</label>
                <p className={isAdmin ? styles.roleAdmin : styles.roleUser}>
                  {user.role || 'user'}
                </p>
              </div>
              <div className={styles.detailItem}>
                <label>Account Status</label>
                <p className={user.isActive ? styles.statusActive : styles.statusInactive}>
                  {user.isActive ? 'Active' : 'Inactive'}
                </p>
              </div>
              <div className={styles.detailItem}>
                <label>Last Login</label>
                <p>
                  {user.lastLogin 
                    ? new Date(user.lastLogin).toLocaleString('en-US', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })
                    : 'Never'
                  }
                </p>
              </div>
            </div>
          </div>

          {/* Token Information - Only show if user is admin */}
          {isAdmin && (
            <div className={styles.detailSection}>
              <h3><GradientText text="Token Information" /></h3>
              <div className={styles.detailGrid}>
                <div className={styles.detailItem}>
                  <label>Access Token</label>
                  <p className={styles.tokenText}>
                    {accessToken ? `${accessToken.substring(0, 20)}...` : 'Not available'}
                  </p>
                </div>
                <div className={styles.detailItem}>
                  <label>Refresh Token</label>
                  <p className={styles.tokenText}>
                    {refreshToken ? `${refreshToken.substring(0, 20)}...` : 'Not available'}
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className={styles.profileActions}>
          <div className={styles.actionRow}>
            <button 
              className={styles.editButton}
              onClick={() => setIsEditModalOpen(true)}
            >
              Edit Profile
            </button>
            <button 
              className={styles.resetPasswordButton}
              onClick={() => setIsResetPasswordOpen(true)}
            >
              Reset Password
            </button>
            <button 
              className={styles.logoutButton}
              onClick={handleLogout}
            >
              Logout
            </button>
          </div>
          
          {/* Admin Actions */}
          {isAdmin && (
            <div className={styles.adminActions}>
              <h4><GradientText text="Admin Actions" /></h4>
              <div className={styles.adminButtonsGrid}>
                <button 
                  className={styles.addUserButton}
                  onClick={() => setIsAddUserModalOpen(true)}
                >
                  Add User
                </button>
                <button 
                  className={styles.uploadEventButton}
                  onClick={() => setIsEventModalOpen(true)}
                >
                  Upload Event
                </button>
                <button 
                  className={styles.editEventsButton}
                  onClick={() => setIsEditEventsModalOpen(true)}
                >
                  Edit Events
                </button>
                <button 
                  className={styles.eventRegistrationButton}
                  onClick={() => setIsEventRegistrationManagementOpen(true)}
                >
                  Manage Registrations
                </button>
                <button 
                  className={styles.createRegistrationEventButton}
                  onClick={() => setIsEventRegistrationUploadOpen(true)}
                >
                  Create Registration Event
                </button>
                <button 
                  className={styles.manageUsersButton}
                  onClick={() => setIsUserManagementModalOpen(true)}
                >
                  Manage Users
                </button>
                <button 
                  className={styles.innovationSubmissionsButton}
                  onClick={() => setIsInnovationSubmissionsOpen(true)}
                >
                  View Submissions
                </button>
                <button 
                  className={styles.auditionManagementButton}
                  onClick={handleAuditionManagementOpen}
                >
                  Manage Auditions
                </button>
                <button 
                  className={styles.carouselUploadButton}
                  onClick={() => setIsCarouselUploadOpen(true)}
                >
                  Upload Carousel Image
                </button>
                <button 
                  className={styles.galleryUploadButton}
                  onClick={() => setIsGalleryUploadOpen(true)}
                >
                  Upload Gallery Image
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Modals */}
      <EditProfileModal 
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
      />
      
      {isAdmin && (
        <>
          <AddUserModal 
            isOpen={isAddUserModalOpen}
            onClose={() => setIsAddUserModalOpen(false)}
            onUserAdded={handleUserAdded}
          />
          
          <EventUploadModal 
            isOpen={isEventModalOpen}
            onClose={() => setIsEventModalOpen(false)}
            onEventAdded={handleEventAdded}
          />

          <EventsManager
            isOpen={isEditEventsModalOpen}
            onClose={() => setIsEditEventsModalOpen(false)}
            onEventUpdated={handleEventUpdated}
          />

          <UserManagementModal
            isOpen={isUserManagementModalOpen}
            onClose={() => setIsUserManagementModalOpen(false)}
          />

          <InnovationSubmissions
            isOpen={isInnovationSubmissionsOpen}
            onClose={() => setIsInnovationSubmissionsOpen(false)}
          />

          <AuditionManagement
            isOpen={isAuditionManagementOpen}
            onClose={() => setIsAuditionManagementOpen(false)}
          />

          <CarouselImageUpload
            isOpen={isCarouselUploadOpen}
            onClose={() => setIsCarouselUploadOpen(false)}
            onImageAdded={handleCarouselImageAdded}
          />

          <GalleryImageUpload
            isOpen={isGalleryUploadOpen}
            onClose={() => setIsGalleryUploadOpen(false)}
            onImageAdded={handleGalleryImageAdded}
          />

          <EventRegistrationManagement
            isOpen={isEventRegistrationManagementOpen}
            onClose={() => setIsEventRegistrationManagementOpen(false)}
          />

          <EventRegistrationUpload
            isOpen={isEventRegistrationUploadOpen}
            onClose={() => setIsEventRegistrationUploadOpen(false)}
          />
        </>
      )}

      {/* Reset Password Modal */}
      <ResetPassword 
        isOpen={isResetPasswordOpen}
        onClose={() => setIsResetPasswordOpen(false)}
      />
    </div>
  );
};

export default Profile;
