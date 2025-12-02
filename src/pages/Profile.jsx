import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import authApi from '../services/AuthApi';
import CustomPhoneInput from './CustomPhoneInput';

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
  const [phoneErrors, setPhoneErrors] = useState({ mobileNo: '', secondaryMobileNo: '' });

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

  const showToast = (message, type = 'success') => {
    const toastOptions = {
      position: "top-right",
      autoClose: 5000,
      hideProgressBar: false,
      closeOnClick: true,
      pauseOnHover: true,
      draggable: true,
      progress: undefined,
    };
    
    if (type === 'success') {
      toast.success(message, toastOptions);
    } else if (type === 'error') {
      toast.error(message, toastOptions);
    } else if (type === 'warning') {
      toast.warning(message, toastOptions);
    } else {
      toast.info(message, toastOptions);
    }
  };

  const normalizeMobileNumber = (value) => {
    if (!value) return '';
    return value.trim();
  };

  const validateMobileNumber = (value, { required } = { required: true }) => {
    const normalized = value ? value.trim() : '';
    if (required && !normalized) {
      return 'Mobile number is required';
    }
    if (!normalized) return '';

    const digits = normalized.replace(/[^\d]/g, '');
    if (digits.length < 10 || digits.length > 15) {
      return 'Please enter a valid mobile number';
    }

    return '';
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

    let newValue = fieldValue;

    if (editingField === 'mobileNo') {
      const errorMessage = validateMobileNumber(fieldValue, { required: true });
      if (errorMessage) {
        setPhoneErrors((prev) => ({ ...prev, mobileNo: errorMessage }));
        showToast(errorMessage, 'error');
        return;
      }
      setPhoneErrors((prev) => ({ ...prev, mobileNo: '' }));
      newValue = normalizeMobileNumber(fieldValue);
    } else if (editingField === 'secondaryMobileNo') {
      const errorMessage = validateMobileNumber(fieldValue, { required: false });
      if (errorMessage) {
        setPhoneErrors((prev) => ({ ...prev, secondaryMobileNo: errorMessage }));
        showToast(errorMessage, 'error');
        return;
      }
      setPhoneErrors((prev) => ({ ...prev, secondaryMobileNo: '' }));
      newValue = normalizeMobileNumber(fieldValue);
    } else if (editingField === 'gender') {
      const trimmed = (fieldValue || '').trim();
      if (!trimmed) {
        showToast('Please select a gender', 'error');
        return;
      }
      newValue = trimmed;
    } else if (editingField === 'dateOfBirth') {
      // Validate date format YYYY-MM-DD
      const trimmed = (fieldValue || '').trim();
      if (!trimmed) {
        showToast('Please enter a date of birth', 'error');
        return;
      }
      // Check if it matches YYYY-MM-DD format
      const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
      if (!dateRegex.test(trimmed)) {
        showToast('Please enter date in YYYY-MM-DD format (e.g., 1990-01-15)', 'error');
        return;
      }
      // Validate the date is valid
      const date = new Date(trimmed);
      if (isNaN(date.getTime())) {
        showToast('Please enter a valid date', 'error');
        return;
      }
      newValue = trimmed;
    }

    const updated = { ...user, [editingField]: newValue };

    try {
      const payload = {};
      if (editingField === 'name') {
        payload.name = newValue;
      } else if (editingField === 'gender') {
        payload.gender = newValue;
      } else if (editingField === 'mobileNo') {
        payload.mobileNo = newValue;
      } else if (editingField === 'secondaryMobileNo') {
        payload.secondaryMobileNo = newValue;
      } else if (editingField === 'dateOfBirth') {
        payload.dob = newValue;
      } else {
        payload[editingField] = newValue;
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

      const uploadResponse = await authApi.uploadImage(formData);
      const fileName = uploadResponse?.url || '';

      if (!fileName) {
        throw new Error('Image URL missing from upload response');
      }

      const userId =
        user.userId ||
        user.UserId ||
        user.userID ||
        user.UserID ||
        user.id ||
        user.Id ||
        null;

      await authApi.updateProfilePic({ userId, imageUrl: fileName });

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
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto">
        {/* Header with Back button on left */}
        <div className="mb-8 flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => navigate(-1)}
              className="flex items-center space-x-2 text-gray-700 dark:text-gray-300 hover:text-emov-purple dark:hover:text-emov-purple transition-colors px-4 py-2.5 rounded-lg border border-gray-300 dark:border-gray-700 hover:border-emov-purple dark:hover:border-emov-purple"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              <span className="font-medium">Back</span>
            </button>
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">My Profile</h1>
              <p className="mt-2 text-gray-600 dark:text-gray-400">Manage your account information and preferences</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Profile Card */}
          <div className="lg:col-span-1">
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700 p-6">
              <div className="flex flex-col items-center">
                <div className="relative w-32 h-32 rounded-full overflow-hidden bg-gradient-to-br from-emov-purple/20 to-emov-green/20 flex items-center justify-center mb-6">
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
                    <span className="text-4xl font-bold text-emov-purple">{getAvatarLetter()}</span>
                  )}
                  <input
                    id="profile-avatar-input"
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleAvatarChange}
                  />
                </div>
                
                <label
                  htmlFor="profile-avatar-input"
                  className="w-full px-4 py-2.5 text-center text-sm font-medium rounded-lg border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-900 cursor-pointer transition-colors mb-4"
                >
                  Change Photo
                </label>
                
                <div className="w-full space-y-4">
                  <button
                    onClick={() => setShowPasswordModal(true)}
                    className="w-full px-4 py-3 text-sm font-medium rounded-lg bg-emov-purple text-white hover:bg-emov-purple/90 transition-colors"
                  >
                    Change Password
                  </button>
                  <button
                    onClick={() => navigate('/service')}
                    className="w-full px-4 py-3 text-sm font-medium rounded-lg border border-gray-300 dark:border-gray-600 text-gray-800 dark:text-gray-100 hover:bg-gray-50 dark:hover:bg-gray-900 transition-colors"
                  >
                    Contact Support
                  </button>
                  <button
                    onClick={async () => {
                      if (window.confirm('Are you sure you want to delete your account? This action cannot be undone and all your data will be permanently removed.')) {
                        try {
                          await authApi.deleteAccount();
                          // Clear user data and redirect to login on successful deletion
                          localStorage.removeItem('token');
                          localStorage.removeItem('user');
                          sessionStorage.removeItem('token');
                          showToast('Your account has been successfully deleted.', 'success');
                          // Redirect to home page after a short delay
                          setTimeout(() => {
                            window.location.href = '/';
                          }, 1500);
                        } catch (error) {
                          console.error('Account deletion failed:', error);
                          const errorMessage = error.message || 'Failed to delete account. Please try again or contact support.';
                          showToast(errorMessage, 'error');
                        }
                      }
                    }}
                    className="w-full px-4 py-3 text-sm font-medium rounded-lg border border-red-500 dark:border-red-700 text-white bg-red-500 hover:bg-red-600 dark:bg-red-700 dark:hover:bg-red-800 transition-colors mt-4"
                  >
                    Delete Account
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column - Profile Details */}
          <div className="lg:col-span-2">
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700 p-8">
              <div className="mb-8">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">{displayUser.name}</h2>
                <p className="text-gray-600 dark:text-gray-400 flex items-center">
                  <span className="mr-2">📧</span>
                  {displayUser.email || 'No email available'}
                </p>
              </div>

              <div className="space-y-6">
                {fields.map((field) => {
                  const value = displayUser[field.key] || '';
                  const isEditing = editingField === field.key;
                  return (
                    <div
                      key={field.key}
                      className="flex flex-col md:flex-row md:items-center justify-between p-6 rounded-xl border border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 transition-colors"
                    >
                      <div className="md:w-1/3 mb-4 md:mb-0">
                        <p className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2">
                          {field.label}
                        </p>
                        {isEditing ? (
                          field.key === 'gender' ? (
                            <select
                              className="w-full px-4 py-2.5 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-emov-purple focus:border-transparent"
                              value={fieldValue}
                              onChange={(e) => setFieldValue(e.target.value)}
                            >
                              <option value="">Select gender</option>
                              <option value="Male">Male</option>
                              <option value="Female">Female</option>
                              <option value="Other">Other</option>
                            </select>
                          ) : field.key === 'mobileNo' || field.key === 'secondaryMobileNo' ? (
                            <CustomPhoneInput
                              name={field.key}
                              value={fieldValue}
                              onChange={(val) => {
                                setFieldValue(val || '');
                                setPhoneErrors((prev) => ({ ...prev, [field.key]: '' }));
                              }}
                              defaultCountry="PK"
                              label={field.label}
                              required={field.key === 'mobileNo'}
                              error={phoneErrors[field.key]}
                            />
                          ) : field.key === 'dateOfBirth' ? (
                            <div>
                              <input
                                className="w-full px-4 py-2.5 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-emov-purple focus:border-transparent"
                                type="text"
                                value={fieldValue}
                                onChange={(e) => setFieldValue(e.target.value)}
                                placeholder="YYYY-MM-DD"
                              />
                              <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                                Format: YYYY-MM-DD (e.g., 1990-01-15)
                              </p>
                            </div>
                          ) : (
                            <input
                              className="w-full px-4 py-2.5 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-emov-purple focus:border-transparent"
                              type="text"
                              value={fieldValue}
                              onChange={(e) => setFieldValue(e.target.value)}
                            />
                          )
                        ) : (
                          <p className="text-lg font-medium text-gray-900 dark:text-gray-100">
                            {value || 'Not provided'}
                          </p>
                        )}
                      </div>
                      
                      <div className="md:w-1/3 flex justify-end">
                        {field.editable ? (
                          isEditing ? (
                            <div className="flex space-x-3">
                              <button
                                onClick={saveField}
                                className="px-5 py-2.5 text-sm font-medium rounded-lg bg-emov-green text-gray-900 hover:bg-emov-green/90 transition-colors"
                              >
                                Save
                              </button>
                              <button
                                onClick={cancelEdit}
                                className="px-5 py-2.5 text-sm font-medium rounded-lg border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                              >
                                Cancel
                              </button>
                            </div>
                          ) : (
                            <button
                              onClick={() => startEdit(field.key, value)}
                              className="px-5 py-2.5 text-sm font-medium rounded-lg border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                            >
                              Edit
                            </button>
                          )
                        ) : (
                          <span className="text-sm text-gray-400 dark:text-gray-500 italic">Not editable</span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Password Change Modal */}
      {showPasswordModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-700">
            <div className="p-6 border-b border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">Change Password</h2>
                <button
                  onClick={() => setShowPasswordModal(false)}
                  className="text-gray-500 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200 p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">Update your account password</p>
            </div>
            
            <form onSubmit={handleSubmitPasswordChange} className="p-6 space-y-5">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Current Password</label>
                <input
                  type="password"
                  name="oldPassword"
                  value={passwordForm.oldPassword}
                  onChange={handlePasswordInputChange}
                  className={`w-full px-4 py-3 rounded-lg border bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-emov-purple focus:border-transparent ${
                    passwordErrors.oldPassword ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                  }`}
                  placeholder="Enter your current password"
                />
                {passwordErrors.oldPassword && (
                  <p className="mt-2 text-sm text-red-500">{passwordErrors.oldPassword}</p>
                )}
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">New Password</label>
                <input
                  type="password"
                  name="newPassword"
                  value={passwordForm.newPassword}
                  onChange={handlePasswordInputChange}
                  className={`w-full px-4 py-3 rounded-lg border bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-emov-purple focus:border-transparent ${
                    passwordErrors.newPassword ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                  }`}
                  placeholder="Enter new password"
                />
                {passwordErrors.newPassword && (
                  <p className="mt-2 text-sm text-red-500 whitespace-pre-line">{passwordErrors.newPassword}</p>
                )}
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Confirm New Password</label>
                <input
                  type="password"
                  name="confirmPassword"
                  value={passwordForm.confirmPassword}
                  onChange={handlePasswordInputChange}
                  className={`w-full px-4 py-3 rounded-lg border bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-emov-purple focus:border-transparent ${
                    passwordErrors.confirmPassword ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                  }`}
                  placeholder="Confirm new password"
                />
                {passwordErrors.confirmPassword && (
                  <p className="mt-2 text-sm text-red-500">{passwordErrors.confirmPassword}</p>
                )}
              </div>
              
              {passwordErrors.general && (
                <div className="p-3 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800">
                  <p className="text-sm text-red-600 dark:text-red-400">{passwordErrors.general}</p>
                </div>
              )}
              
              <div className="flex justify-end space-x-3 pt-4">
                <button
                  type="button"
                  className="px-5 py-2.5 text-sm font-medium rounded-lg border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                  onClick={() => setShowPasswordModal(false)}
                  disabled={passwordLoading}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={passwordLoading}
                  className="px-5 py-2.5 text-sm font-medium rounded-lg bg-emov-purple text-white hover:bg-emov-purple/90 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {passwordLoading ? (
                    <span className="flex items-center">
                      <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                      </svg>
                      Saving...
                    </span>
                  ) : 'Save Password'}
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