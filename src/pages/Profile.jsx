import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import authApi from '../services/AuthApi';

const Profile = () => {
  const navigate = useNavigate();

  const [user, setUser] = useState(() => {
    try {
      const stored = localStorage.getItem('user');
      return stored ? JSON.parse(stored) : {};
    } catch {
      return {};
    }
  });

  const [editingField, setEditingField] = useState(null);
  const [fieldValue, setFieldValue] = useState('');
  const [avatarError, setAvatarError] = useState(false);

  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [passwordForm, setPasswordForm] = useState({
    oldPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [passwordErrors, setPasswordErrors] = useState({
    oldPassword: '',
    newPassword: '',
    confirmPassword: '',
    general: '',
  });
  const [passwordLoading, setPasswordLoading] = useState(false);

  // Simple toast notification state
  const [toast, setToast] = useState({ message: '', type: 'success', visible: false });

  const showToast = (message, type = 'success') => {
    setToast({ message, type, visible: true });
    setTimeout(() => {
      setToast((prev) => ({ ...prev, visible: false }));
    }, 3000);
  };

  const displayUser = useMemo(() => ({
    name: user.name || user.fullName || user.username || 'User',
    email: user.email || user.Email || '',
    gender: user.gender || user.Gender || '',
    mobileNo: user.mobileNo || user.phone || user.Phone || '',
    secondaryMobileNo: user.secondaryMobileNo || user.secondaryPhone || '',
    dateOfBirth: user.dateOfBirth || user.dob || user.DateOfBirth || '',
    picture: user.picture || user.imageUrl || user.UserProfile || '',
  }), [user]);

  const startEdit = (fieldKey, currentValue) => {
    setEditingField(fieldKey);
    setFieldValue(currentValue || '');
  };

  const cancelEdit = () => {
    setEditingField(null);
    setFieldValue('');
  };

  const saveField = async () => {
    if (!editingField) return;
    const updated = { ...user, [editingField]: fieldValue };

    try {
      const payload = {};
      if (editingField === 'name') {
        payload.name = fieldValue;
      } else if (editingField === 'gender') {
        payload.gender = fieldValue;
      } else if (editingField === 'mobileNo') {
        payload.mobileNo = fieldValue;
      } else if (editingField === 'secondaryMobileNo') {
        payload.secondaryMobileNo = fieldValue;
      } else if (editingField === 'dateOfBirth') {
        payload.dob = fieldValue;
      } else {
        payload[editingField] = fieldValue;
      }

      const response = await authApi.updateProfileDetails(payload);

      const updatedFields = response?.updatedFields || {};
      const mergedUser = { ...user, ...updatedFields };
      setUser(mergedUser);
      try {
        localStorage.setItem('user', JSON.stringify(mergedUser));
      } catch {
        // ignore storage errors
      }
      showToast('Profile details updated successfully');
    } catch (error) {
      // If API fails, still update local state and storage so UI stays consistent
      setUser(updated);
      try {
        localStorage.setItem('user', JSON.stringify(updated));
      } catch {
        // ignore storage errors
      }
    } finally {
      setEditingField(null);
      setFieldValue('');
    }
  };

  const getAvatarLetter = () => {
    const name = displayUser.name || 'U';
    return name.trim().charAt(0).toUpperCase();
  };

  const getAvatarSrc = () => {
    if (avatarError) return '';
    const src = displayUser.picture;
    if (!src) return '';
    if (src.startsWith('http')) return src;
    return `https://api.emov.com.pk/image/${src.replace(/^\/+/, '')}`;
  };

  const handleAvatarChange = async (e) => {
    const file = e.target.files && e.target.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('image', file);

    try {
      setAvatarError(false);

      // Step 1: upload image to get transformed filename (url)
      const uploadResponse = await authApi.uploadImage(formData);
      // API returns: { status, original, url, resized }
      const fileName = uploadResponse?.url || '';

      if (!fileName) {
        throw new Error('Image URL missing from upload response');
      }

      // Determine userId from current user object
      const userId =
        user.userId ||
        user.UserId ||
        user.userID ||
        user.UserID ||
        user.id ||
        user.Id ||
        null;

      // Step 2: update profile picture reference on the server with filename and userId
      await authApi.updateProfilePic({ userId, imageUrl: fileName });

      // Store filename; UI will construct full URL via getAvatarSrc
      const updatedUser = {
        ...user,
        picture: fileName,
        imageUrl: fileName,
        UserProfile: fileName,
      };

      setUser(updatedUser);
      try {
        localStorage.setItem('user', JSON.stringify(updatedUser));
      } catch {
        // ignore storage errors
      }
      showToast('Profile picture updated successfully');
    } catch (error) {
      // If upload fails, keep old avatar and show fallback letter
      setAvatarError(true);
    }
  };

  const handlePasswordInputChange = (e) => {
    const { name, value } = e.target;
    setPasswordForm((prev) => ({
      ...prev,
      [name]: value,
    }));
    setPasswordErrors((prev) => ({
      ...prev,
      [name]: '',
      general: '',
    }));
  };

  const handleSubmitPasswordChange = async (e) => {
    e.preventDefault();

    const errors = { oldPassword: '', newPassword: '', confirmPassword: '', general: '' };
    let hasError = false;

    if (!passwordForm.oldPassword) {
      errors.oldPassword = 'Please enter your current password';
      hasError = true;
    }
    // Validate new password strength
    if (!passwordForm.newPassword) {
      errors.newPassword = 'Please enter a new password';
      hasError = true;
    } else {
      const pw = passwordForm.newPassword;
      const ruleMessages = [];
      if (pw.length < 8 || pw.length > 20) {
        ruleMessages.push('Must be between 8 and 20 characters');
      }
      if (!/[a-z]/.test(pw)) {
        ruleMessages.push('Must contain a lowercase letter');
      }
      if (!/[A-Z]/.test(pw)) {
        ruleMessages.push('Must contain an uppercase letter');
      }
      if (!/[0-9]/.test(pw)) {
        ruleMessages.push('Must contain a number');
      }
      if (!/[!@#$^&*_+=()<>]/.test(pw)) {
        ruleMessages.push('Must contain one of the following special characters: ! @ # $ ^ & * _ + = ( ) < >');
      }

      if (ruleMessages.length > 0) {
        errors.newPassword = ruleMessages.join('\n');
        hasError = true;
      }
    }
    if (!passwordForm.confirmPassword) {
      errors.confirmPassword = 'Please confirm your new password';
      hasError = true;
    } else if (passwordForm.newPassword && passwordForm.confirmPassword !== passwordForm.newPassword) {
      errors.confirmPassword = 'Passwords do not match';
      hasError = true;
    }

    if (hasError) {
      setPasswordErrors(errors);
      return;
    }

    if (!displayUser.email) {
      setPasswordErrors({
        ...errors,
        general: 'Email is missing. Please log in again.',
      });
      return;
    }

    try {
      setPasswordLoading(true);

      // Change password using authenticated endpoint
      await authApi.changePassword({
        oldPassword: passwordForm.oldPassword,
        newPassword: passwordForm.newPassword,
        confirmPassword: passwordForm.confirmPassword,
        email: displayUser.email,
      });

      setShowPasswordModal(false);
      setPasswordForm({ oldPassword: '', newPassword: '', confirmPassword: '' });
      setPasswordErrors({ oldPassword: '', newPassword: '', confirmPassword: '', general: '' });
      showToast('Password changed successfully');
    } catch (error) {
      const message = error?.message || '';
      if (message.toLowerCase().includes('invalid') || message.toLowerCase().includes('password')) {
        setPasswordErrors((prev) => ({
          ...prev,
          oldPassword: 'Password is incorrect',
        }));
      } else {
        setPasswordErrors((prev) => ({
          ...prev,
          general: message || 'Failed to change password. Please try again.',
        }));
      }
    } finally {
      setPasswordLoading(false);
    }
  };

  const fields = [
    { key: 'name', label: 'Name', editable: true },
    { key: 'email', label: 'Email', editable: false },
    { key: 'gender', label: 'Gender', editable: true },
    { key: 'mobileNo', label: 'Mobile Number', editable: true },
    { key: 'secondaryMobileNo', label: 'Secondary Mobile Number', editable: true },
    { key: 'dateOfBirth', label: 'Date of Birth', editable: true },
  ];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8 px-4 sm:px-6 lg:px-8 relative">
      {/* Toast Notification */}
      {toast.visible && (
        <div className="fixed bottom-6 left-1/2 transform -translate-x-1/2 z-50">
          <div className="px-4 py-2 rounded-lg shadow-lg bg-emerald-500 text-white text-sm font-medium">
            {toast.message}
          </div>
        </div>
      )}

      <div className="max-w-3xl mx-auto bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700 p-6 sm:p-8">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">My Profile</h1>
          <button
            onClick={() => navigate(-1)}
            className="text-sm text-gray-600 dark:text-gray-300 hover:text-emov-purple"
          >
            Back
          </button>
        </div>

        <div className="flex items-center space-x-4 sm:space-x-6 mb-8">
          <div className="relative w-16 h-16 sm:w-20 sm:h-20 rounded-full overflow-hidden bg-emov-purple/10 flex items-center justify-center text-2xl font-bold text-emov-purple">
            {getAvatarSrc() ? (
              <img
                src={getAvatarSrc()}
                alt={displayUser.name}
                className="w-full h-full object-cover"
                onError={(e) => {
                  e.currentTarget.style.display = 'none';
                  setAvatarError(true);
                }}
              />
            ) : null}
            {(!getAvatarSrc() || avatarError) && (
              <span>{getAvatarLetter()}</span>
            )}
            <input
              id="profile-avatar-input"
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleAvatarChange}
            />
          </div>
          <div>
            <p className="text-lg sm:text-xl font-semibold text-gray-900 dark:text-white">{displayUser.name}</p>
            <p className="text-sm text-gray-600 dark:text-gray-300">{displayUser.email || 'No email available'}</p>
            <label
              htmlFor="profile-avatar-input"
              className="mt-2 inline-flex items-center px-3 py-1 text-xs font-medium rounded-md border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 cursor-pointer"
            >
              Change photo
            </label>
          </div>
        </div>

        <div className="space-y-4 mb-8">
          {fields.map((field) => {
            const value = displayUser[field.key] || '';
            const isEditing = editingField === field.key;
            return (
              <div
                key={field.key}
                className="flex flex-col sm:flex-row sm:items-center justify-between py-3 px-4 rounded-lg bg-gray-50 dark:bg-gray-900/40 border border-gray-200 dark:border-gray-700"
              >
                <div className="mb-2 sm:mb-0">
                  <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                    {field.label}
                  </p>
                  {isEditing ? (
                    <input
                      className="mt-1 w-full sm:w-64 px-3 py-1.5 rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-sm text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-1 focus:ring-emov-purple"
                      value={fieldValue}
                      onChange={(e) => setFieldValue(e.target.value)}
                    />
                  ) : (
                    <p className="mt-1 text-sm text-gray-900 dark:text-gray-100">
                      {value || 'Not provided'}
                    </p>
                  )}
                </div>
                <div className="flex items-center space-x-2 mt-1 sm:mt-0">
                  {field.editable ? (
                    isEditing ? (
                      <>
                        <button
                          onClick={saveField}
                          className="px-3 py-1 text-xs font-medium rounded-md bg-emov-purple text-white hover:bg-emov-purple/90"
                        >
                          Save
                        </button>
                        <button
                          onClick={cancelEdit}
                          className="px-3 py-1 text-xs font-medium rounded-md border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700"
                        >
                          Cancel
                        </button>
                      </>
                    ) : (
                      <button
                        onClick={() => startEdit(field.key, value)}
                        className="px-3 py-1 text-xs font-medium rounded-md border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700"
                      >
                        Edit
                      </button>
                    )
                  ) : (
                    <span className="text-xs text-gray-400 dark:text-gray-500">Not editable</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        <div className="flex flex-col sm:flex-row sm:justify-between gap-4">
          <button
            onClick={() => setShowPasswordModal(true)}
            className="w-full sm:w-auto px-4 py-2.5 text-sm font-medium rounded-lg bg-emov-purple text-white hover:bg-emov-purple/90"
          >
            Change Password
          </button>
          <button
            onClick={() => navigate('/service')}
            className="w-full sm:w-auto px-4 py-2.5 text-sm font-medium rounded-lg border border-gray-300 dark:border-gray-600 text-gray-800 dark:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-800"
          >
            Contact Support
          </button>
        </div>
      </div>
      {showPasswordModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="w-full max-w-md bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Change Password</h2>
              <button
                onClick={() => setShowPasswordModal(false)}
                className="text-gray-500 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200"
              >
                ✕
              </button>
            </div>
            <form onSubmit={handleSubmitPasswordChange} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">Old Password</label>
                <input
                  type="password"
                  name="oldPassword"
                  value={passwordForm.oldPassword}
                  onChange={handlePasswordInputChange}
                  className={`w-full px-3 py-2 rounded-md border text-sm bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-1 focus:ring-emov-purple ${
                    passwordErrors.oldPassword ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                  }`}
                  placeholder="Enter your current password"
                />
                {passwordErrors.oldPassword && (
                  <p className="mt-1 text-xs text-red-500">{passwordErrors.oldPassword}</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">New Password</label>
                <input
                  type="password"
                  name="newPassword"
                  value={passwordForm.newPassword}
                  onChange={handlePasswordInputChange}
                  className={`w-full px-3 py-2 rounded-md border text-sm bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-1 focus:ring-emov-purple ${
                    passwordErrors.newPassword ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                  }`}
                  placeholder="Enter new password"
                />
                {passwordErrors.newPassword && (
                  <p className="mt-1 text-xs text-red-500">{passwordErrors.newPassword}</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">Confirm New Password</label>
                <input
                  type="password"
                  name="confirmPassword"
                  value={passwordForm.confirmPassword}
                  onChange={handlePasswordInputChange}
                  className={`w-full px-3 py-2 rounded-md border text-sm bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-1 focus:ring-emov-purple ${
                    passwordErrors.confirmPassword ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                  }`}
                  placeholder="Confirm new password"
                />
                {passwordErrors.confirmPassword && (
                  <p className="mt-1 text-xs text-red-500">{passwordErrors.confirmPassword}</p>
                )}
              </div>
              {passwordErrors.general && (
                <p className="text-xs text-red-500">{passwordErrors.general}</p>
              )}
              <div className="flex justify-end space-x-3 pt-2">
                <button
                  type="button"
                  className="px-4 py-2 text-sm rounded-md border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700"
                  onClick={() => setShowPasswordModal(false)}
                  disabled={passwordLoading}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={passwordLoading}
                  className="px-4 py-2 text-sm rounded-md bg-emov-purple text-white hover:bg-emov-purple/90 disabled:opacity-60"
                >
                  {passwordLoading ? 'Saving...' : 'Save Password'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Profile;
