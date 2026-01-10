import React, { useMemo, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';
import toast from '../utils/toast.jsx';
import authApi from '../services/authApi';
import CustomPhoneInput from './CustomPhoneInput';
import OptimizedImage from '../components/OptimizedImage';
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

// Language translations
const translations = {
  english: {
    // ... (rest of the translations remain the same)
  },
  urdu: {
    // ... (rest of the translations remain the same)
  },
  french: {
    // ... (rest of the translations remain the same)
  }
};

const Profile = () => {
  // ... (rest of the code remains the same)

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
          <h1 className="text-xl font-semibold text-gray-900 dark:text-white">{t.profile}</h1>
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
                    <OptimizedImage
                      src={displayUser.picture}
                      alt={displayUser.name}
                      className="w-full h-full object-cover"
                      lazy={false}
                      placeholder="blur"
                      quality={85}
                      maxWidth={144}
                      maxHeight={144}
                      fallbackSrc=""
                      onError={() => {
                        setAvatarError(true);
                      }}
                    />
                    {(!displayUser.picture || avatarError) && (
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
                  <span className="mr-2"></span> {displayUser.email || 'No email available'}
                </p>

                <div className="w-full space-y-4 mt-8">
                  <button
                    onClick={() => setShowPasswordModal(true)}
                    className="w-full px-4 py-3 text-sm font-medium rounded-lg bg-emov-purple text-white hover:bg-emov-purple/90 transition-colors flex items-center justify-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
                    disabled={isUpdating || isSavingAvatar}
                  >
                    <FaKey className="w-4 h-4" />
                    <span>{t.changePassword}</span>
                  </button>
                  <button
                    onClick={() => navigate('/service')}
                    className="w-full px-4 py-3 text-sm font-medium rounded-lg border border-gray-300 dark:border-gray-600 text-gray-800 dark:text-gray-100 hover:bg-gray-50 dark:hover:bg-gray-900 transition-colors flex items-center justify-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
                    disabled={isUpdating || isSavingAvatar}
                  >
                    <FaHeadset className="w-4 h-4" />
                    <span>{t.contactSupport}</span>
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
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">{t.personalInfo}</h2>
                <p className="text-gray-600 dark:text-gray-400">{t.updatePersonalDetails}</p>
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
                              <option value="">{t.selectGender}</option>
                              <option value="Male">{t.male}</option>
                              <option value="Female">{t.female}</option>
                              <option value="Other">{t.other}</option>
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
                            <div className="relative">
                              <input
                                className="w-full px-4 py-2.5 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-emov-purple focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed"
                                type="text"
                                value={fieldValue}
                                onChange={(e) => setFieldValue(e.target.value)}
                                disabled={isDisabled}
                                maxLength={field.key === 'name' ? MAX_NAME_LENGTH : undefined}
                              />
                              {field.key === 'name' && (
                                <div className="absolute right-2 top-1/2 transform -translate-y-1/2 text-xs text-gray-500 dark:text-gray-400">
                                  {fieldValue.length}/{MAX_NAME_LENGTH}
                                </div>
                              )}
                            </div>
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
                                <span>{isUpdating ? t.saving : t.saveChanges}</span>
                              </button>
                              <button
                                onClick={cancelEdit}
                                className="px-5 py-2.5 text-sm font-medium rounded-lg border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors flex items-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
                                disabled={isDisabled}
                              >
                                <FaTimes className="w-4 h-4" />
                                <span>{t.cancel}</span>
                              </button>
                            </div>
                          ) : (
                            <button
                              onClick={() => startEdit(field.key, value)}
                              className="px-5 py-2.5 text-sm font-medium rounded-lg border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors flex items-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
                              disabled={isDisabled}
                            >
                              <FaEdit className="w-4 h-4" />
                              <span>{t.edit}</span>
                            </button>
                          )
                        ) : (
                          <span className="text-sm text-gray-400 dark:text-gray-500 italic">{t.notEditable}</span>
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
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">{t.changePassword}</h2>
                <button
                  onClick={() => setShowPasswordModal(false)}
                  className="text-gray-500 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200 p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  disabled={passwordLoading || isUpdating || isSavingAvatar}
                >
                  <FaTimes className="w-5 h-5" />
                </button>
              </div>
              <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">{t.updatePassword}</p>
            </div>
            
            <form onSubmit={handleSubmitPasswordChange} className="p-6 space-y-5">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">{t.currentPassword}</label>
                <div className="relative">
                  <input
                    type={showOldPassword ? "text" : "password"}
                    name="oldPassword"
                    value={passwordForm.oldPassword}
                    onChange={handlePasswordInputChange}
                    className={`w-full px-4 py-3 pr-12 rounded-lg border bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-emov-purple focus:border-transparent ${
                      passwordErrors.oldPassword ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                    }`}
                    placeholder={t.enterCurrentPassword}
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
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">{t.newPassword}</label>
                <div className="relative">
                  <input
                    type={showNewPassword ? "text" : "password"}
                    name="newPassword"
                    value={passwordForm.newPassword}
                    onChange={handlePasswordInputChange}
                    className={`w-full px-4 py-3 pr-12 rounded-lg border bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-emov-purple focus:border-transparent ${
                      passwordErrors.newPassword ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                    }`}
                    placeholder={t.enterNewPassword}
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
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">{t.confirmPassword}</label>
                <div className="relative">
                  <input
                    type={showConfirmPassword ? "text" : "password"}
                    name="confirmPassword"
                    value={passwordForm.confirmPassword}
                    onChange={handlePasswordInputChange}
                    className={`w-full px-4 py-3 pr-12 rounded-lg border bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-emov-purple focus:border-transparent ${
                      passwordErrors.confirmPassword ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                    }`}
                    placeholder={t.confirmNewPassword}
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
                  <span>{t.cancel}</span>
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
                      <span>{t.saving}</span>
                    </>
                  ) : (
                    <>
                      <FaLock className="w-4 h-4" />
                      <span>{t.savePassword}</span>
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
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">{t.deleteAccount}</h2>
                <button
                  onClick={closeDeleteModal}
                  className="text-gray-500 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200 p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  disabled={deleteLoading || isUpdating || isSavingAvatar}
                >
                  <FaTimes className="w-5 h-5" />
                </button>
              </div>
              <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">{t.deleteAccountWarning}</p>
            </div>
            
            <div className="p-6 space-y-4">
              <div className="p-4 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800">
                <div className="flex items-center space-x-2">
                  <FaExclamationTriangle className="w-5 h-5 text-red-600 dark:text-red-400" />
                  <p className="text-sm font-medium text-red-800 dark:text-red-200">
                    {t.warningDeleteAccount}
                  </p>
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  {t.enterPasswordToDelete}
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
                    placeholder={t.enterPasswordToDelete}
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
                  <span>{t.cancel}</span>
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
                      <span>{t.deleting}</span>
                    </>
                  ) : (
                    <>
                      <FaTrashAlt className="w-4 h-4" />
                    <span>{t.deleteAccount}</span>
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