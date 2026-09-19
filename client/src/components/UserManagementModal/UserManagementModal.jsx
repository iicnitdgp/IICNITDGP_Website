import React, { useState, useEffect } from 'react';
import Modal from 'react-modal';
import apiService from '../../services/apiService';
import EditUserCard from './EditUserCard';
import styles from './styles/userManagementModal.module.scss';
import GradientText from '../../component/Core/TextStyle';

// Set app element for accessibility
Modal.setAppElement('#root');

const TYPE_OPTIONS = ['Faculty', 'Student Volunteers', 'Student Council', 'Advisor', 'Mentor', 'Other'];

const UserManagementModal = ({ isOpen, onClose }) => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [editingUser, setEditingUser] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalUsers: 0
  });

  // Fetch users when modal opens or filters change
  useEffect(() => {
    if (isOpen) {
      fetchUsers();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, searchTerm, roleFilter, statusFilter, typeFilter, pagination.currentPage]);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      setError('');

      const params = new URLSearchParams({
        page: pagination.currentPage,
        limit: 10,
        sortBy: 'createdAt',
        sortOrder: 'desc'
      });

      if (searchTerm) params.append('search', searchTerm);
      if (roleFilter !== 'all') params.append('role', roleFilter);
      if (statusFilter !== 'all') params.append('status', statusFilter);
      if (typeFilter !== 'all') params.append('type', typeFilter);

      const response = await apiService.request(`/admin/users-management?${params}`);
      const data = await response.json();

      if (data.success) {
        setUsers(data.users);
        setPagination(data.pagination);
      } else {
        setError(data.message || 'Failed to fetch users');
      }
    } catch (error) {
      console.error('Fetch users error:', error);
      setError('Failed to fetch users');
    } finally {
      setLoading(false);
    }
  };

  const handleEditUser = (user) => {
    setEditingUser(user);
    setError('');
    setSuccess('');
  };

  const handleUserSaved = () => {
    setSuccess('User updated successfully');
    setEditingUser(null);
    fetchUsers(); // Refresh the list
  };

  const handleCancelEdit = () => {
    setEditingUser(null);
  };

  const handleSearch = (e) => {
    setSearchTerm(e.target.value);
    setPagination(prev => ({ ...prev, currentPage: 1 }));
  };

  const handleRoleFilterChange = (e) => {
    setRoleFilter(e.target.value);
    setPagination(prev => ({ ...prev, currentPage: 1 }));
  };

  const handleStatusFilterChange = (e) => {
    setStatusFilter(e.target.value);
    setPagination(prev => ({ ...prev, currentPage: 1 }));
  };

  const handleTypeFilterChange = (e) => {
    setTypeFilter(e.target.value);
    setPagination(prev => ({ ...prev, currentPage: 1 }));
  };

  const handlePageChange = (newPage) => {
    setPagination(prev => ({ ...prev, currentPage: newPage }));
  };

  const handleClose = () => {
    setUsers([]);
    setEditingUser(null);
    setSearchTerm('');
    setRoleFilter('all');
    setStatusFilter('all');
    setTypeFilter('all');
    setError('');
    setSuccess('');
    setPagination({ currentPage: 1, totalPages: 1, totalUsers: 0 });
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onRequestClose={handleClose}
      className={styles.modal}
      overlayClassName={styles.overlay}
      contentLabel="User Management"
    >
      <div className={styles.modalContent}>
        <div className={styles.modalHeader}>
          <h2><GradientText text="User Management" /></h2>
          <button
            className={styles.closeButton}
            onClick={handleClose}
            type="button"
          >
            ×
          </button>
        </div>

        {/* Filters */}
        <div className={styles.filters}>
          <div className={styles.searchContainer}>
            <input
              type="text"
              placeholder="Search by name or email..."
              value={searchTerm}
              onChange={handleSearch}
              className={styles.searchInput}
            />
          </div>
          <div className={styles.filterContainer}>
            <select
              value={roleFilter}
              onChange={handleRoleFilterChange}
              className={styles.roleFilter}
            >
              <option value="all">All Roles</option>
              <option value="admin">Admin</option>
              <option value="user">User</option>
            </select>
          </div>
          <div className={styles.filterContainer}>
            <select
              value={statusFilter}
              onChange={handleStatusFilterChange}
              className={styles.roleFilter}
            >
              <option value="all">All Statuses</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>
          <div className={styles.filterContainer}>
            <select
              value={typeFilter}
              onChange={handleTypeFilterChange}
              className={styles.roleFilter}
            >
              <option value="all">All Designations</option>
              {TYPE_OPTIONS.map(type => (
                <option key={type} value={type}>{type}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Messages */}
        {error && <div className={styles.errorMessage}>{error}</div>}
        {success && <div className={styles.successMessage}>{success}</div>}

        {/* Users Table */}
        <div className={styles.tableContainer}>
          {loading ? (
            <div className={styles.loadingContainer}>
              <p>Loading users...</p>
            </div>
          ) : users.length === 0 ? (
            <div className={styles.noUsers}>
              <p>No users found</p>
            </div>
          ) : (
            <table className={styles.usersTable}>
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Phone</th>
                  <th>Role</th>
                  <th>Designation</th>
                  <th>Status</th>
                  <th>Last Login</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map(user => (
                  <tr
                    key={user._id}
                    onClick={() => handleEditUser(user)}
                    className={styles.clickableRow}
                  >
                    <td>{user.name}</td>
                    <td>{user.email}</td>
                    <td>{user.phone || 'Not provided'}</td>
                    <td>
                      <span className={user.role === 'admin' ? styles.adminRole : styles.userRole}>
                        {user.role}
                      </span>
                    </td>
                    <td>{user.designation || user.type || 'Not set'}</td>
                    <td>
                      <span className={user.isActive ? styles.statusActive : styles.statusInactive}>
                        {user.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td>
                      {user.lastLogin ? new Date(user.lastLogin).toLocaleDateString() : 'Never'}
                    </td>
                    <td>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleEditUser(user);
                        }}
                        className={styles.editButton}
                        disabled={loading}
                      >
                        Edit
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Pagination */}
        {pagination.totalPages > 1 && (
          <div className={styles.pagination}>
            <button
              onClick={() => handlePageChange(pagination.currentPage - 1)}
              disabled={pagination.currentPage === 1}
              className={styles.paginationButton}
            >
              Previous
            </button>
            <span className={styles.paginationInfo}>
              Page {pagination.currentPage} of {pagination.totalPages}
            </span>
            <button
              onClick={() => handlePageChange(pagination.currentPage + 1)}
              disabled={pagination.currentPage === pagination.totalPages}
              className={styles.paginationButton}
            >
              Next
            </button>
          </div>
        )}

        <div className={styles.modalFooter}>
          <button
            onClick={handleClose}
            className={styles.closeModalButton}
          >
            Close
          </button>
        </div>
      </div>

      {/* Edit card - opens when a user row/edit button is clicked */}
      <EditUserCard
        isOpen={!!editingUser}
        user={editingUser}
        onClose={handleCancelEdit}
        onSaved={handleUserSaved}
      />
    </Modal>
  );
};

export default UserManagementModal;
