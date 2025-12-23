import React, { useMemo, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from '../utils/toast.jsx';
import authApi from '../services/authApi';
import CustomPhoneInput from './CustomPhoneInput';
import {
  FaCog,
  FaEdit,
  FaKey,
  FaHeadset,
  FaTrashAlt,
  FaArrowLeft,
  FaEye,
  FaEyeSlash,
  FaTimes,
  FaCheck,
  FaExclamationTriangle,
  FaLock,
  FaCalendarAlt
} from 'react-icons/fa';

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
  const [isUpdating, setIsUpdating] = useState(false); // Loader state for profile updates
  const [isSavingAvatar, setIsSavingAvatar] = useState(false); // Specific loader for avatar

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

  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deletePassword, setDeletePassword] = useState('');
  const [deletePasswordError, setDeletePasswordError] = useState('');
  const [deleteLoading, setDeleteLoading] = useState(false);
  
  // Password visibility states
  const [showOldPassword, setShowOldPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [showDeletePassword, setShowDeletePassword] = useState(false);

  // Date picker state
  const [showDatePicker, setShowDatePicker] = useState(false);

  const showToast = (message, type = 'success') => {
    if (type === 'success') {
      toast.success(message);
    } else if (type === 'error') {
      toast.error(message);
    } else if (type === 'warning') {
      toast.warning(message);
    } else {
      toast.info(message);
    }
  };

  // Phone number validation functions
  const normalizeMobileNumber = (value) => {
    if (!value) return '';
    // Remove all non-digit characters except plus sign
    return value.replace(/[^\d+]/g, '');
  };

  const validateMobileNumber = (value, { required } = { required: true }) => {
    const normalized = value ? value.trim() : '';
    if (required && !normalized) {
      return 'Mobile number is required';
    }
    if (!normalized) return '';

    // Remove all non-digit characters for length check
    const digits = normalized.replace(/[^\d]/g, '');
    
    // Check for minimum length (excluding country code)
    if (digits.length < 10) {
      return 'Phone number must have at least 10 digits';
    }
    
    // Check for maximum length
    if (digits.length > 15) {
      return 'Phone number cannot exceed 15 digits';
    }

    // Pakistan specific validation if number starts with 92
    if (normalized.startsWith('+92') || normalized.startsWith('92')) {
      const pakDigits = normalized.replace(/[^\d]/g, '');
      if (pakDigits.length !== 12) {
        return 'Pakistan numbers must be 12 digits (including 92 country code)';
      }
      if (!/^92[3-9]\d{9}$/.test(pakDigits)) {
        return 'Pakistan mobile numbers must start with 92 followed by 3-9';
      }
    }

    // US/Canada specific validation
    if (normalized.startsWith('+1') || normalized.startsWith('1')) {
      const usDigits = normalized.replace(/[^\d]/g, '');
      if (usDigits.length !== 11) {
        return 'US/Canada numbers must be 11 digits (including 1 country code)';
      }
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
    if (isUpdating) return; // Prevent editing while updating
    setEditingField(fieldKey);
    setFieldValue(currentValue || '');
    
    // Clear any existing errors
    if (fieldKey === 'mobileNo' || fieldKey === 'secondaryMobileNo') {
      setPhoneErrors(prev => ({ ...prev, [fieldKey]: '' }));
    }
  };

  const cancelEdit = () => {
    setEditingField(null);
    setFieldValue('');
    // Clear phone errors when canceling
    setPhoneErrors({ mobileNo: '', secondaryMobileNo: '' });
  };

  const saveField = async () => {
    if (!editingField || isUpdating) return;

    let newValue = fieldValue;
    let validationError = '';

    // Validate based on field type
    if (editingField === 'mobileNo') {
      validationError = validateMobileNumber(fieldValue, { required: true });
      if (validationError) {
        setPhoneErrors((prev) => ({ ...prev, mobileNo: validationError }));
        showToast(validationError, 'error');
        return;
      }
      setPhoneErrors((prev) => ({ ...prev, mobileNo: '' }));
      newValue = normalizeMobileNumber(fieldValue);
    } else if (editingField === 'secondaryMobileNo') {
      validationError = validateMobileNumber(fieldValue, { required: false });
      if (validationError) {
        setPhoneErrors((prev) => ({ ...prev, secondaryMobileNo: validationError }));
        showToast(validationError, 'error');
        return;
      }
      setPhoneErrors((prev) => ({ ...prev, secondaryMobileNo: '' }));
      newValue = fieldValue ? normalizeMobileNumber(fieldValue) : '';
    } else if (editingField === 'gender') {
      const trimmed = (fieldValue || '').trim();
      if (!trimmed) {
        showToast('Please select a gender', 'error');
        return;
      }
      newValue = trimmed;
    } else if (editingField === 'dateOfBirth') {
      const trimmed = (fieldValue || '').trim();
      if (!trimmed) {
        showToast('Please enter a date of birth', 'error');
        return;
      }
      
      const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
      if (!dateRegex.test(trimmed)) {
        showToast('Please enter date in YYYY-MM-DD format (e.g., 1990-01-15)', 'error');
        return;
      }
      
      const date = new Date(trimmed);
      if (isNaN(date.getTime())) {
        showToast('Please enter a valid date', 'error');
        return;
      }
      
      // Check if date is in the future
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      if (date > today) {
        showToast('Date of birth cannot be in the future', 'error');
        return;
      }
      
      newValue = trimmed;
    }

    const updated = { ...user, [editingField]: newValue };

    try {
      setIsUpdating(true); // Show loader

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
      showToast('Profile updated locally. Sync with server failed.', 'warning');
    } finally {
      setIsUpdating(false); // Hide loader
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

    // Validate file type
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif'];
    if (!validTypes.includes(file.type)) {
      showToast('Please select a valid image file (JPEG, PNG, GIF)', 'error');
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      showToast('Image size should be less than 5MB', 'error');
      return;
    }

    const formData = new FormData();
    formData.append('image', file);

    try {
      setIsSavingAvatar(true);
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

      // Create the full URL for the profile picture
      const fullImageUrl = fileName.startsWith('http') ? 
        fileName : 
        `https://api.emov.com.pk/image/${fileName.replace(/^\/+/, '')}`;

      const updatedUser = {
        ...user,
        picture: fullImageUrl,
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
      console.error('Error updating profile picture:', error);
      showToast('Failed to update profile picture', 'error');
    } finally {
      setIsSavingAvatar(false);
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

  const handleDeleteAccount = async () => {
    if (!deletePassword.trim()) {
      setDeletePasswordError('Please enter your password');
      return;
    }

    try {
      setDeleteLoading(true);
      setDeletePasswordError('');

      await authApi.deleteAccount({ password: deletePassword });

      localStorage.removeItem('token');
      localStorage.removeItem('user');
      sessionStorage.removeItem('token');
      showToast('Your account has been successfully deleted.', 'success');
      
      setTimeout(() => {
        window.location.href = '/';
      }, 1500);

    } catch (error) {
      console.error('Account deletion failed:', error);
      const errorMessage = error.message || 'Failed to delete account. Please try again or contact support.';
      setDeletePasswordError(errorMessage);
    } finally {
      setDeleteLoading(false);
    }
  };

  const openDeleteModal = () => {
    setShowDeleteModal(true);
    setDeletePassword('');
    setDeletePasswordError('');
  };

  const closeDeleteModal = () => {
    setShowDeleteModal(false);
    setDeletePassword('');
    setDeletePasswordError('');
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
        currentPassword: passwordForm.oldPassword,
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

  const formatDateForDisplay = (dateStr) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return dateStr;
    return date.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
  };

  const handleDatePickerChange = (e) => {
    const value = e.target.value;
    setFieldValue(value);
    setShowDatePicker(false);
  };

  const getTodayDate = () => {
    const today = new Date();
    return today.toISOString().split('T')[0];
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
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <style jsx>{`
        @keyframes fade-in {
          from { opacity: 0; transform: scale(0.95); }
          to { opacity: 1; transform: scale(1); }
        }
        .animate-fade-in {
          animation: fade-in 0.3s ease-in-out forwards;
        }
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        .animate-spin {
          animation: spin 1s linear infinite;
        }
      `}</style>

      {/* Loading Overlay for Profile Updates */}
      {(isUpdating || isSavingAvatar) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl p-8 flex flex-col items-center space-y-4">
            <div className="relative w-16 h-16">
              <div className="absolute inset-0 border-4 border-emov-purple/20 rounded-full"></div>
              <div className="absolute inset-0 border-4 border-emov-purple rounded-full border-t-transparent animate-spin"></div>
            </div>
            <p className="text-lg font-medium text-gray-900 dark:text-white">
              {isSavingAvatar ? 'Updating Profile Picture...' : 'Updating Profile...'}
            </p>
            <p className="text-sm text-gray-600 dark:text-gray-400">Please wait while we save your changes</p>
          </div>
        </div>
      )}

      {/* Compact Header with centered heading */}
      <div className="w-full px-4 sm:px-6 lg:px-8 mx-auto flex justify-between items-center pt-4 pb-4 sm:pt-6 sm:pb-6 border-b border-border-primary">
        <button
          onClick={() => navigate(-1)}
          className="text-gray-700 dark:text-gray-300 hover:text-emov-purple dark:hover:text-emov-purple transition-colors p-2 disabled:opacity-50 disabled:cursor-not-allowed"
          disabled={isUpdating || isSavingAvatar}
        >
          <FaArrowLeft className="w-5 h-5" />
        </button>
        <div className="absolute left-1/2 transform -translate-x-1/2">
          <h1 className="text-xl font-semibold text-gray-900 dark:text-white">My Profile</h1>
        </div>
        <div className="w-9"></div>
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Profile Card */}
          <div className="lg:col-span-1">
            <div className="relative bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700 p-6">
              <div className="flex flex-col items-center">
                {/* Avatar with Edit Icon */}
                <div className="relative w-36 h-36 mb-6">
                  <div className="w-36 h-36 rounded-full overflow-hidden bg-gradient-to-br from-emov-purple/20 to-emov-green/20 flex items-center justify-center ring-4 ring-white dark:ring-gray-800 shadow-lg">
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
                      <span className="text-5xl font-bold text-emov-purple">
                        {getAvatarLetter()}
                      </span>
                    )}
                    {isSavingAvatar && (
                      <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                        <div className="w-8 h-8 border-3 border-white border-t-transparent rounded-full animate-spin"></div>
                      </div>
                    )}
                  </div>

                  <input
                    id="profile-avatar-input"
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleAvatarChange}
                    disabled={isUpdating || isSavingAvatar}
                  />
                  <label
                    htmlFor="profile-avatar-input"
                    className={`absolute bottom-1 right-1 w-7 h-7 bg-emov-purple rounded-full flex items-center justify-center shadow-lg border-2 border-white dark:border-gray-800 transition-all z-50 ${
                      isUpdating || isSavingAvatar ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:bg-emov-purple/90'
                    }`}
                  >
                    {isSavingAvatar ? (
                      <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    ) : (
                      <FaEdit className="w-3 h-3 text-white" />
                    )}
                  </label>
                </div>

                <h3 className="text-2xl font-bold text-gray-900 dark:text-white mt-4">
                  {displayUser.name}
                </h3>
                <p className="text-gray-600 dark:text-gray-400 flex items-center mt-1">
                  <span className="mr-2">Email</span> {displayUser.email || 'No email available'}
                </p>

                <div className="w-full space-y-4 mt-8">
                  <button
                    onClick={() => setShowPasswordModal(true)}
                    className="w-full px-4 py-3 text-sm font-medium rounded-lg bg-emov-purple text-white hover:bg-emov-purple/90 transition-colors flex items-center justify-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
                    disabled={isUpdating || isSavingAvatar}
                  >
                    <FaKey className="w-4 h-4" />
                    <span>Change Password</span>
                  </button>
                  <button
                    onClick={() => navigate('/service')}
                    className="w-full px-4 py-3 text-sm font-medium rounded-lg border border-gray-300 dark:border-gray-600 text-gray-800 dark:text-gray-100 hover:bg-gray-50 dark:hover:bg-gray-900 transition-colors flex items-center justify-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
                    disabled={isUpdating || isSavingAvatar}
                  >
                    <FaHeadset className="w-4 h-4" />
                    <span>Contact Support</span>
                  </button>
                  <button
                    onClick={openDeleteModal}
                    className="w-full px-4 py-3 text-sm font-medium rounded-lg border border-red-500 dark:border-red-700 text-white bg-red-500 hover:bg-red-600 dark:bg-red-700 dark:hover:bg-red-800 transition-colors flex items-center justify-center space-x-2 mt-4 disabled:opacity-50 disabled:cursor-not-allowed"
                    disabled={isUpdating || isSavingAvatar}
                  >
                    <FaTrashAlt className="w-4 h-4" />
                    <span>Delete Account</span>
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column - Profile Details */}
          <div className="lg:col-span-2">
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700 p-8">
              <div className="mb-8">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Personal Information</h2>
                <p className="text-gray-600 dark:text-gray-400">Update your personal details here</p>
              </div>

              <div className="space-y-6">
                {fields.map((field) => {
                  const value = displayUser[field.key] || '';
                  const isEditing = editingField === field.key;
                  const isDisabled = isUpdating || isSavingAvatar;
                  
                  return (
                    <div
                      key={field.key}
                      className="flex flex-col md:flex-row md:items-center justify-between p-6 rounded-xl border border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 transition-colors bg-gray-50/50 dark:bg-gray-900/50"
                    >
                      <div className="md:w-1/3 mb-4 md:mb-0">
                        <p className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2">
                          {field.label}
                        </p>
                        {isEditing ? (
                          field.key === 'gender' ? (
                            <select
                              className="w-full px-4 py-2.5 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-emov-purple focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed"
                              value={fieldValue}
                              onChange={(e) => setFieldValue(e.target.value)}
                              disabled={isDisabled}
                            >
                              <option value="">Select gender</option>
                              <option value="Male">Male</option>
                              <option value="Female">Female</option>
                              <option value="Other">Other</option>
                            </select>
                          ) : field.key === 'mobileNo' || field.key === 'secondaryMobileNo' ? (
                            <div className="space-y-1">
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
                                disabled={isDisabled}
                              />
                              {phoneErrors[field.key] && (
                                <p className="mt-1 text-xs text-red-500">{phoneErrors[field.key]}</p>
                              )}
                            </div>
                          ) : field.key === 'dateOfBirth' ? (
                            <div className="relative">
                              <input
                                className="w-full px-4 py-2.5 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-emov-purple focus:border-transparent cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                                type="date"
                                value={fieldValue}
                                onChange={(e) => setFieldValue(e.target.value)}
                                max={getTodayDate()}
                                disabled={isDisabled}
                              />
                              <FaCalendarAlt className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none" />
                              <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                                Format: YYYY-MM-DD
                              </p>
                            </div>
                          ) : (
                            <input
                              className="w-full px-4 py-2.5 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-emov-purple focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed"
                              type="text"
                              value={fieldValue}
                              onChange={(e) => setFieldValue(e.target.value)}
                              disabled={isDisabled}
                            />
                          )
                        ) : (
                          <p className="text-lg font-medium text-gray-900 dark:text-gray-100">
                            {field.key === 'dateOfBirth' ? formatDateForDisplay(value) : value || 'Not provided'}
                          </p>
                        )}
                      </div>
                      
                      <div className="md:w-1/3 flex justify-end">
                        {field.editable ? (
                          isEditing ? (
                            <div className="flex space-x-3">
                              <button
                                onClick={saveField}
                                className="px-5 py-2.5 text-sm font-medium rounded-lg bg-emov-green text-gray-900 hover:bg-emov-green/90 transition-colors flex items-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
                                disabled={isDisabled}
                              >
                                {isUpdating ? (
                                  <div className="w-4 h-4 border-2 border-gray-900 border-t-transparent rounded-full animate-spin mr-2"></div>
                                ) : (
                                  <FaCheck className="w-4 h-4" />
                                )}
                                <span>{isUpdating ? 'Saving...' : 'Save'}</span>
                              </button>
                              <button
                                onClick={cancelEdit}
                                className="px-5 py-2.5 text-sm font-medium rounded-lg border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors flex items-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
                                disabled={isDisabled}
                              >
                                <FaTimes className="w-4 h-4" />
                                <span>Cancel</span>
                              </button>
                            </div>
                          ) : (
                            <button
                              onClick={() => startEdit(field.key, value)}
                              className="px-5 py-2.5 text-sm font-medium rounded-lg border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors flex items-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
                              disabled={isDisabled}
                            >
                              <FaEdit className="w-4 h-4" />
                              <span>Edit</span>
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 transition-all duration-300 ease-in-out">
          <div className="w-full max-w-md bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-700 transform transition-all duration-300 ease-in-out scale-95 opacity-0 animate-fade-in">
            <div className="p-6 border-b border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">Change Password</h2>
                <button
                  onClick={() => setShowPasswordModal(false)}
                  className="text-gray-500 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200 p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  disabled={passwordLoading || isUpdating || isSavingAvatar}
                >
                  <FaTimes className="w-5 h-5" />
                </button>
              </div>
              <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">Update your account password</p>
            </div>
            
            <form onSubmit={handleSubmitPasswordChange} className="p-6 space-y-5">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Current Password</label>
                <div className="relative">
                  <input
                    type={showOldPassword ? "text" : "password"}
                    name="oldPassword"
                    value={passwordForm.oldPassword}
                    onChange={handlePasswordInputChange}
                    className={`w-full px-4 py-3 pr-12 rounded-lg border bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-emov-purple focus:border-transparent ${
                      passwordErrors.oldPassword ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                    }`}
                    placeholder="Enter your current password"
                    disabled={passwordLoading}
                  />
                  <button
                    type="button"
                    onClick={() => setShowOldPassword(!showOldPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 focus:outline-none disabled:opacity-50"
                    disabled={passwordLoading}
                  >
                    {showOldPassword ? (
                      <FaEyeSlash className="w-5 h-5" />
                    ) : (
                      <FaEye className="w-5 h-5" />
                    )}
                  </button>
                </div>
                {passwordErrors.oldPassword && (
                  <p className="mt-2 text-sm text-red-500">{passwordErrors.oldPassword}</p>
                )}
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">New Password</label>
                <div className="relative">
                  <input
                    type={showNewPassword ? "text" : "password"}
                    name="newPassword"
                    value={passwordForm.newPassword}
                    onChange={handlePasswordInputChange}
                    className={`w-full px-4 py-3 pr-12 rounded-lg border bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-emov-purple focus:border-transparent ${
                      passwordErrors.newPassword ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                    }`}
                    placeholder="Enter new password"
                    disabled={passwordLoading}
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 focus:outline-none disabled:opacity-50"
                    disabled={passwordLoading}
                  >
                    {showNewPassword ? (
                      <FaEyeSlash className="w-5 h-5" />
                    ) : (
                      <FaEye className="w-5 h-5" />
                    )}
                  </button>
                </div>
                {passwordErrors.newPassword && (
                  <p className="mt-2 text-sm text-red-500 whitespace-pre-line">{passwordErrors.newPassword}</p>
                )}
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Confirm New Password</label>
                <div className="relative">
                  <input
                    type={showConfirmPassword ? "text" : "password"}
                    name="confirmPassword"
                    value={passwordForm.confirmPassword}
                    onChange={handlePasswordInputChange}
                    className={`w-full px-4 py-3 pr-12 rounded-lg border bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-emov-purple focus:border-transparent ${
                      passwordErrors.confirmPassword ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                    }`}
                    placeholder="Confirm new password"
                    disabled={passwordLoading}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 focus:outline-none disabled:opacity-50"
                    disabled={passwordLoading}
                  >
                    {showConfirmPassword ? (
                      <FaEyeSlash className="w-5 h-5" />
                    ) : (
                      <FaEye className="w-5 h-5" />
                    )}
                  </button>
                </div>
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
                  className="px-5 py-2.5 text-sm font-medium rounded-lg border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors flex items-center space-x-2 disabled:opacity-60 disabled:cursor-not-allowed"
                  onClick={() => setShowPasswordModal(false)}
                  disabled={passwordLoading}
                >
                  <FaTimes className="w-4 h-4" />
                  <span>Cancel</span>
                </button>
                <button
                  type="submit"
                  disabled={passwordLoading}
                  className="px-5 py-2.5 text-sm font-medium rounded-lg bg-emov-purple text-white hover:bg-emov-purple/90 transition-colors disabled:opacity-60 disabled:cursor-not-allowed flex items-center space-x-2"
                >
                  {passwordLoading ? (
                    <>
                      <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                      </svg>
                      <span>Saving...</span>
                    </>
                  ) : (
                    <>
                      <FaLock className="w-4 h-4" />
                      <span>Save Password</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Account Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 transition-all duration-300 ease-in-out">
          <div className="w-full max-w-md bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-700 transform transition-all duration-300 ease-in-out scale-95 opacity-0 animate-fade-in">
            <div className="p-6 border-b border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">Delete Account</h2>
                <button
                  onClick={closeDeleteModal}
                  className="text-gray-500 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200 p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  disabled={deleteLoading || isUpdating || isSavingAvatar}
                >
                  <FaTimes className="w-5 h-5" />
                </button>
              </div>
              <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                This action cannot be undone. All your data will be permanently removed.
              </p>
            </div>
            
            <div className="p-6 space-y-4">
              <div className="p-4 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800">
                <div className="flex items-center space-x-2">
                  <FaExclamationTriangle className="w-5 h-5 text-red-600 dark:text-red-400" />
                  <p className="text-sm font-medium text-red-800 dark:text-red-200">
                    Warning: This will permanently delete your account and all associated data.
                  </p>
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Enter your password to confirm deletion
                </label>
                <div className="relative">
                  <input
                    type={showDeletePassword ? "text" : "password"}
                    value={deletePassword}
                    onChange={(e) => {
                      setDeletePassword(e.target.value);
                      setDeletePasswordError('');
                    }}
                    className={`w-full px-4 py-3 pr-12 rounded-lg border bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent ${
                      deletePasswordError ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                    }`}
                    placeholder="Enter your password"
                    disabled={deleteLoading}
                  />
                  <button
                    type="button"
                    onClick={() => setShowDeletePassword(!showDeletePassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 focus:outline-none disabled:opacity-50"
                    disabled={deleteLoading}
                  >
                    {showDeletePassword ? (
                      <FaEyeSlash className="w-5 h-5" />
                    ) : (
                      <FaEye className="w-5 h-5" />
                    )}
                  </button>
                </div>
                {deletePasswordError && (
                  <p className="mt-2 text-sm text-red-500">{deletePasswordError}</p>
                )}
              </div>
              
              <div className="flex justify-end space-x-3 pt-4">
                <button
                  type="button"
                  className="px-5 py-2.5 text-sm font-medium rounded-lg border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors flex items-center space-x-2 disabled:opacity-60 disabled:cursor-not-allowed"
                  onClick={closeDeleteModal}
                  disabled={deleteLoading}
                >
                  <FaTimes className="w-4 h-4" />
                  <span>Cancel</span>
                </button>
                
                <button
                  type="button"
                  onClick={handleDeleteAccount}
                  disabled={deleteLoading}
                  className="px-5 py-2.5 text-sm font-medium rounded-lg bg-red-600 text-white hover:bg-red-700 transition-colors disabled:opacity-60 disabled:cursor-not-allowed flex items-center space-x-2"
                >
                  {deleteLoading ? (
                    <>
                      <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                      </svg>
                      <span>Deleting...</span>
                    </>
                  ) : (
                    <>
                      <FaTrashAlt className="w-4 h-4" />
                      <span>Delete Account</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Profile;