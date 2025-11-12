import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaArrowLeft, FaCamera, FaMicrophone, FaUpload, FaCheck, FaChevronDown, FaChevronUp, FaCaretDown, FaMoon } from 'react-icons/fa';
import apiService from '../services/Api';
import Navbar from '../components/Layout/Navbar';
import { useTheme } from '../context/ThemeContext';
import axios from 'axios';

// Language translations
const translations = {
  english: {
    basicDetails: "Basic Details",
    additionalDetails: "Additional Details",
    imagesAudio: "Images & Audio",
    preview: "Preview",
    next: "Next",
    previous: "Previous",
    submitAd: "Submit Ad",
    vehicleName: "Vehicle Name",
    vehiclePrice: "Vehicle Price (CAD)",
    vehicleType: "Vehicle Type",
    vehicleBrand: "Vehicle Brand",
    vehicleModel: "Vehicle Model",
    vehicleMileage: "Vehicle Mileage",
    registrationYear: "Registration Year",
    vehiclePower: "Vehicle Power",
    transmission: "Transmission",
    enterVehicleName: "Enter vehicle name",
    enterVehiclePrice: "Enter vehicle price",
    enterVehicleBrand: "Enter vehicle brand",
    enterVehicleMileage: "Enter vehicle mileage",
    enterVehiclePower: "Enter vehicle power",
    selectVehicleType: "Select vehicle type",
    selectVehicleModel: "Select vehicle model",
    selectRegistrationYear: "Select registration year",
    manual: "Manual",
    automatic: "Automatic",
    semiAutomatic: "Semi Automatic",
    electric: "Electric",
    images: "Images",
    audio: "Audio",
    selectMultipleImages: "Select multiple images of your vehicle",
    uploadAudioDescription: "Upload optional audio description",
    optional: "Optional",
    engineType: "Engine Type",
    vehicleBodyType: "Vehicle Body Type",
    loadCapacity: "Load Capacity",
    ownership: "Ownership",
    serviceHistory: "Service History",
    sellerComment: "Seller Comment",
    enterLoadCapacity: "e.g., 60,000 kg",
    addComments: "Add any additional comments about your vehicle...",
    diesel: "Diesel",
    petrol: "Petrol",
    cng: "CNG",
    lpg: "LPG",
    firstOwner: "First Owner",
    secondOwner: "Second Owner",
    thirdOwner: "Third Owner",
    companyFleetOwned: "Company / Fleet Owned",
    governmentOwned: "Government Owned",
    fullService: "Full Service",
    partialService: "Partial Service",
    noService: "No Service",
    brand: "Brand",
    model: "Model",
    power: "Power",
    bodyType: "Body Type",
    uploaded: "uploaded",
    notProvided: "Not provided",
    vehicleNameNotProvided: "Vehicle Name Not Provided",
    priceNotSet: "Price Not Set",
    additionalInformation: "Additional Information",
    media: "Media",
    required: "*",
  },
  urdu: {
    basicDetails: "بنیادی تفصیلات",
    additionalDetails: "اضافی تفصیلات",
    imagesAudio: "تصاویر اور آڈیو",
    preview: "پیش نظارہ",
    next: "اگلا",
    previous: "پچھلا",
    submitAd: "اشتہار جمع کریں",
    vehicleName: "گاڑی کا نام",
    vehiclePrice: "گاڑی کی قیمت (CAD)",
    vehicleType: "گاڑی کی قسم",
    vehicleBrand: "گاڑی کا برانڈ",
    vehicleModel: "گاڑی کا ماڈل",
    vehicleMileage: "گاڑی کا میلایج",
    registrationYear: "رجسٹریشن کا سال",
    vehiclePower: "گاڑی کی پاور",
    transmission: "ٹرانسمیشن",
    enterVehicleName: "گاڑی کا نام درج کریں",
    enterVehiclePrice: "گاڑی کی قیمت درج کریں",
    enterVehicleBrand: "گاڑی کا برانڈ درج کریں",
    enterVehicleMileage: "گاڑی کا میلایج درج کریں",
    enterVehiclePower: "گاڑی کی پاور درج کریں",
    selectVehicleType: "گاڑی کی قسم منتخب کریں",
    selectVehicleModel: "گاڑی کا ماڈل منتخب کریں",
    selectRegistrationYear: "رجسٹریشن کا سال منتخب کریں",
    manual: "مینوئل",
    automatic: "آٹومیٹک",
    semiAutomatic: "سیمی آٹومیٹک",
    electric: "الیکٹرک",
    images: "تصاویر",
    audio: "آڈیو",
    selectMultipleImages: "اپنی گاڑی کی متعدد تصاویر منتخب کریں",
    uploadAudioDescription: "اختیاری آڈیو تفصیل اپ لوڈ کریں",
    optional: "اختیاری",
    engineType: "انجن کی قسم",
    vehicleBodyType: "گاڑی کی باڈی قسم",
    loadCapacity: "لوڈ کی صلاحیت",
    ownership: "مالکیت",
    serviceHistory: "سروس ہسٹری",
    sellerComment: "فروخت کنندہ کا تبصرہ",
    enterLoadCapacity: "مثال کے طور پر، 60,000 کلو",
    addComments: "اپنی گاڑی کے بارے میں کوئی اضافی تبصرہ شامل کریں...",
    diesel: "ڈیزل",
    petrol: "پٹرول",
    cng: "سی این جی",
    lpg: "ایل پی جی",
    firstOwner: "پہلا مالک",
    secondOwner: "دوسرا مالک",
    thirdOwner: "تیسرا مالک",
    companyFleetOwned: "کمپنی / فلٹ کی ملکیت",
    governmentOwned: "حکومتی ملکیت",
    fullService: "مکمل سروس",
    partialService: "جزوی سروس",
    noService: "کوئی سروس نہیں",
    brand: "برانڈ",
    model: "ماڈل",
    power: "پاور",
    bodyType: "باڈی قسم",
    uploaded: "اپ لوڈ شدہ",
    notProvided: "فراہم نہیں کیا گیا",
    vehicleNameNotProvided: "گاڑی کا نام فراہم نہیں کیا گیا",
    priceNotSet: "قیمت طے نہیں کی گئی",
    additionalInformation: "اضافی معلومات",
    media: "میڈیا",
    required: "*",
  },
  french: {
    basicDetails: "Détails de base",
    additionalDetails: "Détails supplémentaires",
    imagesAudio: "Images et audio",
    preview: "Aperçu",
    next: "Suivant",
    previous: "Précédent",
    submitAd: "Soumettre l'annonce",
    vehicleName: "Nom du véhicule",
    vehiclePrice: "Prix du véhicule (CAD)",
    vehicleType: "Type de véhicule",
    vehicleBrand: "Marque du véhicule",
    vehicleModel: "Modèle du véhicule",
    vehicleMileage: "Kilométrage du véhicule",
    registrationYear: "Année d'immatriculation",
    vehiclePower: "Puissance du véhicule",
    transmission: "Transmission",
    enterVehicleName: "Entrez le nom du véhicule",
    enterVehiclePrice: "Entrez le prix du véhicule",
    enterVehicleBrand: "Entrez la marque du véhicule",
    enterVehicleMileage: "Entrez le kilométrage du véhicule",
    enterVehiclePower: "Entrez la puissance du véhicule",
    selectVehicleType: "Sélectionnez le type de véhicule",
    selectVehicleModel: "Sélectionnez le modèle du véhicule",
    selectRegistrationYear: "Sélectionnez l'année d'immatriculation",
    manual: "Manuelle",
    automatic: "Automatique",
    semiAutomatic: "Semi-automatique",
    electric: "Électrique",
    images: "Images",
    audio: "Audio",
    selectMultipleImages: "Sélectionnez plusieurs images de votre véhicule",
    uploadAudioDescription: "Téléchargez une description audio facultative",
    optional: "Optionnel",
    engineType: "Type de moteur",
    vehicleBodyType: "Type de carrosserie",
    loadCapacity: "Capacité de charge",
    ownership: "Propriété",
    serviceHistory: "Historique d'entretien",
    sellerComment: "Commentaire du vendeur",
    enterLoadCapacity: "ex. 60 000 kg",
    addComments: "Ajoutez des commentaires supplémentaires sur votre véhicule...",
    diesel: "Diesel",
    petrol: "Essence",
    cng: "GNL",
    lpg: "GPL",
    firstOwner: "Premier propriétaire",
    secondOwner: "Deuxième propriétaire",
    thirdOwner: "Troisième propriétaire",
    companyFleetOwned: "Détenu par une entreprise/flotte",
    governmentOwned: "Détenu par le gouvernement",
    fullService: "Entretien complet",
    partialService: "Entretien partiel",
    noService: "Aucun entretien",
    brand: "Marque",
    model: "Modèle",
    power: "Puissance",
    bodyType: "Type de carrosserie",
    uploaded: "téléchargé",
    notProvided: "Non fourni",
    vehicleNameNotProvided: "Nom du véhicule non fourni",
    priceNotSet: "Prix non défini",
    additionalInformation: "Informations supplémentaires",
    media: "Médias",
    required: "*",
  }
};

const getTranslatedData = (language) => {
  const t = translations[language];
  return {
    vehicleTypes: [t.manual, t.automatic, t.semiAutomatic, t.electric],
    engineTypes: [t.diesel, t.petrol, t.cng, t.lpg, t.electric],
    ownershipTypes: [t.firstOwner, t.secondOwner, t.thirdOwner, t.companyFleetOwned, t.governmentOwned],
    serviceHistoryTypes: [t.fullService, t.partialService, t.noService],
    transmissionTypes: [t.manual, t.automatic, t.semiAutomatic, t.electric]
  };
};

export default function Ads() {
  const { theme, toggleTheme } = useTheme();
  const [language, setLanguage] = useState('english');
  const [userProfile, setUserProfile] = useState(null);
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState({
    VehicleName: '',
    VehiclePrice: '',
    VehicleTypeID: '',
    VehicleBrandID: '',
    VehicleModelID: '',
    VehicleMileage: '',
    RegistrationYear: '',
    VehiclePower: '',
    Transmission: '',
    Color: '',
    SellerComment: '',
    LocationName: '',
    EngineType: '',
    VehicleBodyTypeID: '',
    LoadCapacity: '',
    Ownership: '',
    ServiceHistory: '',
    Images: [],
    AudioURL: null,
    IsFeatured: false,
    IsNegotiable: false,
    ContactNumber: '',
    City: '',
    Address: ''
  });

  const t = translations[language];
  const translatedData = getTranslatedData(language);

  const vehicleModels = ['Model S', 'Model 3', 'Civic', 'Accord', 'Camry', 'Corolla', 'F-150', 'X5'];
  const registrationYears = Array.from({length: 30}, (_, i) => new Date().getFullYear() - i);
  const bodyTypes = ['Container Body', 'Flatbed', 'Box Truck', 'Tanker', 'Dump Truck', 'Refrigerated'];

  useEffect(() => {
    const fetchUserProfile = async () => {
      try {
        const response = await apiService.user.getProfile();
        
        if (response.status === 200) {
          setUserProfile(response.data);
        } else {
          throw new Error('Failed to fetch user profile');
        }
      } catch (error) {
        console.error('Error fetching user profile:', error);
        const savedUser = localStorage.getItem('user');
        if (savedUser) setUserProfile(JSON.parse(savedUser));
      }
    };
    fetchUserProfile();
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = '/login';
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    console.log(`Field changed - ${name}:`, value, 'Type:', type);
    
    // Handle different input types
    let newValue = value;
    
    // Handle checkboxes
    if (type === 'checkbox') {
      newValue = checked;
    } 
    // Handle number inputs
    else if (['number', 'range'].includes(type)) {
      newValue = value === '' ? '' : Number(value);
    }
    // Handle select elements
    else if (e.target.tagName === 'SELECT') {
      const isNumeric = ['VehicleTypeID', 'VehicleBrandID', 'VehicleModelID', 'VehicleBodyTypeID', 'RegistrationYear'].includes(name);
      newValue = isNumeric ? (value ? Number(value) : '') : value;
    }
    
    console.log(`Updating ${name} with value:`, newValue);
    
    setFormData(prev => {
      const updated = {
        ...prev,
        [name]: newValue
      };
      console.log('Updated formData:', updated);
      return updated;
    });
    
    // Log the current state after update for debugging
    setTimeout(() => {
      console.log('Current formData:', formData);
    }, 0);
  };
  
  // Handle select changes
  const handleSelectChange = (name, value) => {
    console.log(`Select changed - ${name}:`, value);
    const isNumeric = ['VehicleTypeID', 'VehicleBrandID', 'VehicleModelID', 'VehicleBodyTypeID', 'RegistrationYear'].includes(name);
    const newValue = isNumeric ? (value ? Number(value) : '') : value;
    
    setFormData(prev => {
      const updated = {
        ...prev,
        [name]: newValue
      };
      console.log('Updated formData:', updated);
      return updated;
    });
  };

  const handleFileChange = (e) => {
    const { name, files } = e.target;
    if (name === 'images') {
      setFormData(prev => ({ ...prev, images: Array.from(files) }));
    } else {
      setFormData(prev => ({ ...prev, [name]: files[0] }));
    }
  };

  const nextStep = () => {
    if (currentStep < 4) {
      setCurrentStep(prev => prev + 1);
      setTimeout(() => {
        document.getElementById(`step-${currentStep + 1}`)?.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(prev => prev - 1);
      setTimeout(() => {
        document.getElementById(`step-${currentStep - 1}`)?.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    }
  };

  const validateForm = () => {
    const requiredFields = [
      { key: 'VehicleName', name: 'Vehicle Name' },
      { key: 'VehiclePrice', name: 'Price' },
      { key: 'VehicleTypeID', name: 'Vehicle Type' },
      { key: 'VehicleBrandID', name: 'Brand' },
      { key: 'VehicleModelID', name: 'Model' }
    ];
    
    const errors = [];
    
    requiredFields.forEach(field => {
      const value = formData[field.key];
      if (value === '' || value === null || value === undefined || (typeof value === 'number' && isNaN(value))) {
        errors.push(field.name);
      }
    });
    
    return errors;
  };

  const handleSubmit = async () => {
    try {
      console.log('Current formData:', formData);
      
      // Validate form
      const validationErrors = validateForm();
      
      if (validationErrors.length > 0) {
        // Highlight the fields with errors
        validationErrors.forEach(fieldName => {
          console.error(`Missing or invalid field: ${fieldName}`);
        });
        
        // Show the first step with errors
        setCurrentStep(1);
        
        throw new Error(`Please fill in all required fields: ${validationErrors.join(', ')}`);
      }

      console.log('Form data before submission:', formData);
      
      const formDataToSend = new FormData();
      
      // Prepare the payload with proper field mapping
      const payload = {
        VehicleName: String(formData.VehicleName || ''),
        VehicleModelID: formData.VehicleModelID ? Number(formData.VehicleModelID) : 0,
        VehiclePrice: formData.VehiclePrice ? Number(formData.VehiclePrice) : 0,
        VehicleTypeID: formData.VehicleTypeID ? Number(formData.VehicleTypeID) : 0,
        VehicleMileage: String(formData.mileage || ''),
        RegistrationYear: String(formData.registrationYear || ''),
        VehiclePower: String(formData.power || ''),
        VehicleBrandID: formData.VehicleBrandID ? Number(formData.VehicleBrandID) : 0,
        Transmission: String(formData.transmission || ''),
        Color: String(formData.Color || ''),
        SellerComment: String(formData.sellerComment || ''),
        LocationName: String(formData.location || ''),
        EngineType: String(formData.engineType || ''),
        VehicleBodyTypeID: formData.vehicleBodyType ? 
          (bodyTypes.indexOf(formData.vehicleBodyType) + 1) : 0,
        LoadCapacity: String(formData.loadCapacity || ''),
        Ownership: String(formData.ownership || ''),
        ServiceHistory: String(formData.serviceHistory || '')
      };
      
      // Append all payload fields to FormData
      Object.entries(payload).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          formDataToSend.append(key, value);
        }
      });

      // Handle images - send as JSON string
      if (formData.images && formData.images.length > 0) {
        const imageFiles = [];
        
        formData.images.forEach((image) => {
          if (image instanceof File) {
            // For file uploads, we'll handle them separately
            formDataToSend.append('Images', image);
            imageFiles.push(image.name);
          } else if (image && typeof image === 'object' && image.uri) {
            formDataToSend.append('Images', {
              uri: image.uri,
              type: image.type || 'image/jpeg',
              name: image.name || `image_${Date.now()}.jpg`
            });
            imageFiles.push(image.name || 'uploaded_image.jpg');
          }
        });
        
        // Also include the image filenames as a JSON string
        formDataToSend.append('Images', JSON.stringify(imageFiles));
      } else {
        formDataToSend.append('Images', '[]');
      }

      // Handle audio (optional)
      if (formData.audioFile) {
        if (formData.audioFile instanceof File) {
          formDataToSend.append('AudioURL', formData.audioFile);
          console.log('Appended audio file:', formData.audioFile.name);
        } else if (formData.audioFile.uri) {
          formDataToSend.append('AudioURL', {
            uri: formData.audioFile.uri,
            type: formData.audioFile.type || 'audio/mp3',
            name: formData.audioFile.name || `audio_${Date.now()}.mp3`
          });
        }
      }

      // Log form data entries for debugging
      console.log('FormData entries:');
      for (let [key, value] of formDataToSend.entries()) {
        console.log(`${key}:`, value);
      }

      console.log('Sending request to API...');
      
      // Show loading state
      setSubmitting(true);
      
      try {
        // Use the apiService to make the request
        const result = await apiService.ads.create(formDataToSend);
        
        console.log('API Response:', result);
        
        if (result && result.success) {
          // Show success message
          alert(result.message || 'Ad created successfully!');
          // Reset form
          setFormData({
            // ... your initial form state
          });
          // Redirect to dashboard or ad preview
          window.location.href = '/dashboard';
          return; // Exit the function after successful submission
        } else {
          throw new Error(result?.message || 'Failed to create ad');
        }
      } catch (error) {
        console.error('API Error:', error);
        
        let errorMessage = 'Failed to create ad. Please try again.';
        
        if (error.response) {
          console.error('Response data:', error.response.data);
          console.error('Response status:', error.response.status);
          
          // Check for specific error messages from the server
          if (error.response.data) {
            if (typeof error.response.data === 'string') {
              errorMessage = error.response.data;
            } else if (error.response.data.message) {
              errorMessage = error.response.data.message;
            } else if (error.response.data.error) {
              errorMessage = error.response.data.error;
            }
          }
          
          // Handle specific status codes
          if (error.response.status === 400) {
            errorMessage = 'Invalid data. Please check your input.';
          } else if (error.response.status === 401) {
            errorMessage = 'Session expired. Please log in again.';
            // Redirect to login
            window.location.href = '/login';
            return;
          } else if (error.response.status === 500) {
            errorMessage = 'Server error. Please try again later.';
          }
        } else if (error.request) {
          console.error('No response received:', error.request);
          errorMessage = 'No response from server. Please check your internet connection.';
        } else if (error.message) {
          errorMessage = error.message;
        }
        
        // Show error message to user
        alert(errorMessage);
        throw error; // Re-throw the error to be caught by the outer catch block
      } finally {
        // Reset submitting state
        setSubmitting(false);
      }
    } catch (error) {
      console.error('Error in handleSubmit:', error);
      let errorMessage = 'Failed to create ad. Please try again.';
      
      if (error.response) {
        if (error.response.status === 401) {
          errorMessage = 'Authentication failed. Please log in again.';
        } else if (error.response.status === 400) {
          errorMessage = 'Invalid request. Please check your input.';
          if (error.response.data?.errors) {
            errorMessage += '\n\n' + Object.entries(error.response.data.errors)
              .map(([field, messages]) => `${field}: ${Array.isArray(messages) ? messages.join(', ') : messages}`)
              .join('\n');
          }
        } else if (error.response.status === 500) {
          errorMessage = 'Server error. Please try again later.';
          if (error.response.data?.message) {
            errorMessage += `\n\n${error.response.data.message}`;
          }
        } else if (error.response.data?.message) {
          errorMessage = error.response.data.message;
        } else {
          errorMessage = `Server returned status: ${error.response.status}`;
        }
      } else if (error.request) {
        console.error('No response received:', error.request);
        errorMessage = 'No response from server. Please check your internet connection.';
      } else if (error.message) {
        console.error('Request setup error:', error.message);
        errorMessage = error.message;
      }
      
      // Show error message to user
      alert(errorMessage);
      console.error('Error details:', { error });
    }
  };

  const renderStep = (stepNumber, title, content, isActive) => (
    <div id={`step-${stepNumber}`} className={`mb-8 transition-all duration-300 ${isActive ? 'block' : 'hidden'}`}>
      <div className="flex items-center mb-6">
        <div className={`w-8 h-8 rounded-full flex items-center justify-center mr-4 ${
          currentStep >= stepNumber ? 'bg-emov-purple text-white' : 'bg-gray-300 text-gray-600'
        }`}>
          {stepNumber}
        </div>
        <h2 className="text-2xl font-bold text-gray-800 dark:text-white">
          Step {stepNumber}: {title}
        </h2>
      </div>
      <div className="ml-12">
        {content}
      </div>
    </div>
  );

  const renderBasicDetails = () => (
    <div className="space-y-6 bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-semibold mb-2 text-gray-700 dark:text-gray-300">
            {t.vehicleName} <span className="text-red-500">{t.required}</span>
          </label>
          <input
            type="text"
            name="VehicleName"
            value={formData.VehicleName || ''}
            onChange={handleInputChange}
            className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            placeholder={t.enterVehicleName}
            required
          />
        </div>
        <div>
          <label className="block text-sm font-semibold mb-2 text-gray-700 dark:text-gray-300">
            {t.vehiclePrice}
          </label>
          <input
            type="number"
            name="VehiclePrice"
            value={formData.VehiclePrice || ''}
            onChange={handleInputChange}
            className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            placeholder={t.enterVehiclePrice}
            required
            min="0"
            step="0.01"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-semibold mb-2 text-gray-700 dark:text-gray-300">
            {t.vehicleType} <span className="text-red-500">{t.required}</span>
          </label>
          <select
            name="VehicleTypeID"
            value={formData.VehicleTypeID || ''}
            onChange={handleInputChange}
            className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            required
          >
            <option value="">{t.selectVehicleType}</option>
            {translatedData.vehicleTypes.map((type, index) => (
              <option key={type} value={index + 1}>{type}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-semibold mb-2 text-gray-700 dark:text-gray-300">
            {t.vehicleBrand} <span className="text-red-500">{t.required}</span>
          </label>
          <select
            name="VehicleBrandID"
            value={formData.VehicleBrandID || ''}
            onChange={handleInputChange}
            className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            required
          >
            <option value="">{t.selectBrand}</option>
            <option value="1">Volvo</option>
            <option value="2">Scania</option>
            <option value="3">Mercedes</option>
            <option value="4">MAN</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-semibold mb-2 text-gray-700 dark:text-gray-300">
            {t.vehicleModel} <span className="text-red-500">{t.required}</span>
          </label>
          <select
            name="VehicleModelID"
            value={formData.VehicleModelID || ''}
            onChange={handleInputChange}
            className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            required
          >
            <option value="">{t.selectVehicleModel}</option>
            {vehicleModels.map((model, index) => (
              <option key={model} value={index + 1}>{model}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-semibold mb-2 text-gray-700 dark:text-gray-300">
            {t.vehicleMileage} <span className="text-red-500">{t.required}</span>
          </label>
          <input
            type="text"
            name="mileage"
            value={formData.mileage}
            onChange={handleInputChange}
            className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            placeholder={t.enterVehicleMileage}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-semibold mb-2 text-gray-700 dark:text-gray-300">
            {t.registrationYear} <span className="text-red-500">{t.required}</span>
          </label>
          <select
            name="registrationYear"
            value={formData.registrationYear}
            onChange={handleInputChange}
            className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
          >
            <option value="">{t.selectRegistrationYear}</option>
            {registrationYears.map(year => (
              <option key={year} value={year}>{year}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-semibold mb-2 text-gray-700 dark:text-gray-300">
            {t.vehiclePower} <span className="text-red-500">{t.required}</span>
          </label>
          <input
            type="text"
            name="power"
            value={formData.power}
            onChange={handleInputChange}
            className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            placeholder={t.enterVehiclePower}
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-semibold mb-3 text-gray-700 dark:text-gray-300">
          {t.transmission} <span className="text-red-500">{t.required}</span>
        </label>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {translatedData.transmissionTypes.map((type) => (
            <label key={type} className="flex items-center space-x-2 text-sm text-gray-700 dark:text-gray-300">
              <input
                type="radio"
                name="transmission"
                value={type}
                checked={formData.transmission === type}
                onChange={handleInputChange}
                className="w-4 h-4 text-emov-purple"
              />
              <span>{type}</span>
            </label>
          ))}
        </div>
      </div>
    </div>
  );

  const renderImagesAudio = () => (
    <div className="space-y-6 bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
      <div>
        <label className="block text-sm font-semibold mb-2 text-gray-700 dark:text-gray-300">{t.images}</label>
        <input
          type="file"
          name="images"
          multiple
          accept="image/*"
          onChange={handleFileChange}
          className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700"
        />
        <p className="text-sm text-gray-500 mt-2">{t.selectMultipleImages}</p>
      </div>
      <div>
        <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
          {t.audio} ({t.optional})
        </label>
        <input
          type="file"
          name="audio"
          accept="audio/*"
          onChange={handleFileChange}
          className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700"
        />
        <p className="text-sm text-gray-500 mt-2">{t.uploadAudioDescription}</p>
      </div>
    </div>
  );

  const renderAdditionalDetails = () => (
    <div className="space-y-6 bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
      <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
        <label className="block text-sm font-semibold mb-3 text-gray-700 dark:text-gray-300">
          {t.engineType} <span className="text-red-500">{t.required}</span>
        </label>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {translatedData.engineTypes.map((type) => (
            <label key={type} className={`flex items-center space-x-2 text-sm p-3 rounded-lg cursor-pointer ${
              formData.engineType === type 
                ? 'bg-emov-purple/10 border border-emov-purple' 
                : 'border border-gray-300 dark:border-gray-600'
            }`}>
              <input
                type="radio"
                name="engineType"
                value={type}
                checked={formData.engineType === type}
                onChange={handleInputChange}
                className="w-4 h-4 text-emov-purple"
              />
              <span className="font-medium">{type}</span>
            </label>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
          <label className="block text-sm font-semibold mb-2 text-gray-700 dark:text-gray-300">
            {t.vehicleBodyType} <span className="text-red-500">{t.required}</span>
          </label>
          <select
            name="vehicleBodyType"
            value={formData.vehicleBodyType}
            onChange={handleInputChange}
            className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
          >
            <option value="">{t.selectVehicleType}</option>
            {bodyTypes.map(type => (
              <option key={type} value={type}>{type}</option>
            ))}
          </select>
        </div>
        <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
          <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
            {t.loadCapacity} <span className="text-gray-500">({t.optional})</span>
          </label>
          <input
            type="text"
            name="loadCapacity"
            value={formData.loadCapacity}
            onChange={handleInputChange}
            className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            placeholder={t.enterLoadCapacity}
          />
        </div>
      </div>

      <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
        <label className="block text-sm font-semibold mb-3 text-gray-700 dark:text-gray-300">
          {t.ownership} <span className="text-red-500">{t.required}</span>
        </label>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {translatedData.ownershipTypes.map((type) => (
            <label key={type} className={`flex items-center space-x-2 text-sm p-3 rounded-lg cursor-pointer ${
              formData.ownership === type 
                ? 'bg-emov-purple/10 border border-emov-purple' 
                : 'border border-gray-300 dark:border-gray-600'
            }`}>
              <input
                type="radio"
                name="ownership"
                value={type}
                checked={formData.ownership === type}
                onChange={handleInputChange}
                className="w-4 h-4 text-emov-purple"
              />
              <span className="font-medium">{type}</span>
            </label>
          ))}
        </div>
      </div>

      <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
        <label className="block text-sm font-semibold mb-3 text-gray-700 dark:text-gray-300">
          {t.serviceHistory} <span className="text-gray-500">({t.optional})</span>
        </label>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {translatedData.serviceHistoryTypes.map((type) => (
            <label key={type} className={`flex items-center space-x-2 text-sm p-3 rounded-lg cursor-pointer ${
              formData.serviceHistory === type 
                ? 'bg-emov-purple/10 border border-emov-purple' 
                : 'border border-gray-300 dark:border-gray-600'
            }`}>
              <input
                type="radio"
                name="serviceHistory"
                value={type}
                checked={formData.serviceHistory === type}
                onChange={handleInputChange}
                className="w-4 h-4 text-emov-purple"
              />
              <span className="font-medium">{type}</span>
            </label>
          ))}
        </div>
      </div>

      <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
        <label className="block text-sm font-semibold mb-2 text-gray-700 dark:text-gray-300">
          {t.sellerComment} <span className="text-gray-500">({t.optional})</span>
        </label>
        <textarea
          name="sellerComment"
          value={formData.sellerComment}
          onChange={handleInputChange}
          className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
          rows="4"
          placeholder={t.addComments}
        />
      </div>
    </div>
  );

  const renderPreview = () => {
    // Helper function to get display value with fallback
    const getFormValue = (key) => {
      // Try camelCase first, then lowercase with spaces
      const value = formData[key] || formData[key.toLowerCase().replace(/\s+/g, '')];
      if (value === undefined || value === null || value === '') return 'N/A';
      return value;
    };

    // Get brand name from ID
    const getBrandName = (brandId) => {
      const brands = { 1: 'Volvo', 2: 'Scania', 3: 'Mercedes', 4: 'MAN' };
      return brands[brandId] || 'N/A';
    };

    // Get model name from ID
    const getModelName = (modelId) => {
      return modelId && vehicleModels[modelId - 1] ? vehicleModels[modelId - 1] : 'N/A';
    };
    
    // Get value with fallback for all possible naming conventions
    const getValue = (key) => {
      // Try different key formats
      const keysToTry = [
        key, // Original key (e.g., 'VehicleName')
        key.toLowerCase(), // lowercase (e.g., 'vehiclename')
        key.replace(/([A-Z])/g, ' $1').trim().toLowerCase() // Add space before caps and lowercase (e.g., 'vehicle name')
      ];
      
      // Try each key format until we find a value
      for (const k of keysToTry) {
        const value = formData[k];
        if (value !== undefined && value !== null && value !== '') {
          // Special handling for numeric IDs
          if (k.toLowerCase().includes('id') && typeof value === 'number') {
            return value;
          }
          return value;
        }
      }
      
      // If no value found, try to get from the original form data with spaces removed
      const keyWithoutSpaces = key.replace(/\s+/g, '');
      if (formData[keyWithoutSpaces] !== undefined) {
        return formData[keyWithoutSpaces];
      }
      
      return 'N/A';
    };

    return (
      <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
        <div className="mb-6">
          <h3 className="text-2xl font-bold text-gray-800 dark:text-white mb-2">
            {getValue('VehicleName') || t.vehicleNameNotProvided}
          </h3>
          <p className="text-xl font-semibold text-emov-green">
            {getValue('VehiclePrice') !== 'N/A' ? `CAD ${getValue('VehiclePrice')}` : t.priceNotSet}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <div className="space-y-3">
            <p className="text-gray-700 dark:text-gray-300">
              <strong>{t.vehicleType}:</strong> {formData.VehicleTypeID ? translatedData.vehicleTypes[formData.VehicleTypeID - 1] : getValue('vehicleType')}
            </p>
            <p className="text-gray-700 dark:text-gray-300">
              <strong>{t.brand}:</strong> {formData.VehicleBrandID ? getBrandName(formData.VehicleBrandID) : getValue('brand')}
            </p>
            <p className="text-gray-700 dark:text-gray-300">
              <strong>{t.model}:</strong> {formData.VehicleModelID ? getModelName(formData.VehicleModelID) : getValue('model')}
            </p>
            <p className="text-gray-700 dark:text-gray-300">
              <strong>{t.vehiclePrice}:</strong> {getValue('VehiclePrice') !== 'N/A' ? `$${getValue('VehiclePrice')}` : 'N/A'}
            </p>
            <p className="text-gray-700 dark:text-gray-300">
              <strong>{t.transmission}:</strong> {getValue('Transmission') || getValue('transmission')}
            </p>
          </div>
          <div className="space-y-3">
            <p className="text-gray-700 dark:text-gray-300">
              <strong>{t.vehicleMileage}:</strong> {getValue('mileage')}
            </p>
            <p className="text-gray-700 dark:text-gray-300">
              <strong>{t.registrationYear}:</strong> {getValue('registrationYear')}
            </p>
            <p className="text-gray-700 dark:text-gray-300">
              <strong>{t.power}:</strong> {getValue('power')}
            </p>
            <p className="text-gray-700 dark:text-gray-300">
              <strong>{t.engineType}:</strong> {getValue('engineType')}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <div className="space-y-3">
            <p className="text-gray-700 dark:text-gray-300">
              <strong>{t.bodyType}:</strong> {getValue('vehicleBodyType')}
            </p>
            <p className="text-gray-700 dark:text-gray-300">
              <strong>{t.ownership}:</strong> {getValue('ownership')}
            </p>
          </div>
          <div className="space-y-3">
            <p className="text-gray-700 dark:text-gray-300">
              <strong>{t.loadCapacity}:</strong> {getValue('loadCapacity')}
            </p>
            <p className="text-gray-700 dark:text-gray-300">
              <strong>{t.serviceHistory}:</strong> {getValue('serviceHistory')}
            </p>
          </div>
        </div>

      {formData.sellerComment && (
        <div className="mb-6">
          <h4 className="font-semibold mb-3 text-gray-800 dark:text-white">{t.sellerComment}</h4>
          <p className="text-gray-700 dark:text-gray-300 bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
            {formData.sellerComment}
          </p>
        </div>
      )}

      <div className="border-t border-gray-300 dark:border-gray-600 pt-4">
        <h4 className="font-semibold mb-3 text-gray-800 dark:text-white">{t.media}</h4>
        <div className="flex flex-wrap gap-3">
          <div className="bg-gray-50 dark:bg-gray-700 px-4 py-2 rounded-lg">
            <span className="text-gray-700 dark:text-gray-300 font-medium">{t.images}: </span>
            <span className="text-emov-green">{(formData.images && formData.images.length) || 0} {t.uploaded}</span>
          </div>
          <div className="bg-gray-50 dark:bg-gray-700 px-4 py-2 rounded-lg">
            <span className="text-gray-700 dark:text-gray-300 font-medium">{t.audio}: </span>
            <span className={formData.audio ? "text-emov-green" : "text-gray-500"}>
              {formData.audio ? t.uploaded : t.notProvided}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">

       <div className="w-full px-4 sm:px-6 lg:px-8 mx-auto flex justify-between items-center h-12 sm:h-16 py-6 border-b border-border-primary">
                  <div className=" flex items-center space-x-2 ">
                    <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{color: 'var(--emov-green, #00FFA9)'}}>
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
                    </svg>
                    <span className="text-sm font-medium text-text-primary">Download App</span>
                  </div>
      
                     {/* Right side controls */}
                          <div className="flex items-center space-x-2 sm:space-x-4">
                            {/* Desktop Language Selector and Theme Toggle */}
                            <div className="hidden md:flex items-center space-x-4">
                              {/* Language Selector */}
                              <div className="relative">
                                <select 
                                  value={language}
                                  onChange={(e) => setLanguage(e.target.value)}
                                  className="bg-transparent text-text-primary pr-6 py-1.5 sm:py-2 text-sm sm:text-base focus:outline-none focus:ring-0 border-0 transition-all duration-200 appearance-none"
                                >
                                  <option value="english">English</option>
                                  <option value="urdu">Urdu</option>
                                  <option value="french">French</option>
                                </select>
                                <div className="absolute inset-y-0 right-0 flex items-center pr-1 sm:pr-2 pointer-events-none">
                                  <FaCaretDown className="text-text-secondary w-3 h-3" />
                                </div>
                              </div>
                              
                              {/* Theme Toggle Button */}
                              <button 
                                onClick={toggleTheme}
                                className="focus:outline-none p-2 sm:p-2.5 transition-all duration-200 hover:scale-105 rounded-xl text-text-primary hover:bg-bg-tertiary"
                                style={{ borderRadius: '12px' }}
                                aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
                              >
                                {theme === 'dark' ? <FaSun className="w-4 h-4 sm:w-5 sm:h-5" /> : <FaMoon className="w-4 h-4 sm:w-5 sm:h-5" />}
                              </button>
                            </div>
                  
                  <div className="flex items-center space-x-4">
                    <button className="flex items-center space-x-1 text-sm font-medium text-text-primary hover:text-text-secondary transition-colors border-none">
                      <span>Sign In</span>
                    </button>
                    <button className="flex items-center space-x-1 text-text-primary px-4 py-1 rounded-full text-sm font-medium transition-colors"
                      style={{
                        backgroundColor: 'var(--emov-green, #27c583ff)',
                      }}
                      onMouseOver={(e) => e.currentTarget.style.opacity = '0.9'}
                      onMouseOut={(e) => e.currentTarget.style.opacity = '1'}
                    >
                      <span>Sign Up</span>
                    </button>
                    
                  </div>
                </div>
                </div>
      <Navbar 
        isDark={theme === 'dark'}
        toggleTheme={toggleTheme}
        language={language}
        setLanguage={setLanguage}
        userProfile={userProfile}
        handleLogout={handleLogout}
      />
      
      {/* Main Content */}
      <div className="pt-0">
        <div className="bg-white dark:bg-gray-800 py-12 shadow-sm mb-8">
          <div className="container mx-auto px-4 max-w-4xl">
            <div className="text-center">
              <h1 className="text-3xl md:text-4xl font-bold text-emov-purple mb-4">
                A Smarter Way to Sell Your Vehicle — in 4 Steps
              </h1>
              <p className="text-gray-600 dark:text-gray-300 text-lg">
                Experience a smooth, transparent process designed to save your <br /> time and maximize your return.
              </p>
                {/* Step Indicator */}
          <div className="flex justify-between items-center mb-8 p-4 bg-white dark:bg-gray-800 rounded-lg  mt-5">
            {[1, 2, 3, 4].map((step) => (
              <div key={step} className="flex flex-col items-center">
                <div 
                  className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-semibold mb-2 ${
                    currentStep === step 
                      ? 'bg-emov-purple text-white' 
                      : currentStep > step 
                        ? 'bg-emov-green text-white' 
                        : 'bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300'
                  }`}
                >
                  {step}
                </div>
                <span className={`text-xs font-medium text-center ${
                  currentStep >= step 
                    ? 'text-emov-purple dark:text-emov-purple-light' 
                    : 'text-gray-500 dark:text-gray-400'
                }`}>
                  {step === 1 ? t.basicDetails : 
                   step === 2 ? t.imagesAudio : 
                   step === 3 ? t.additionalDetails : t.preview}
                </span>
              </div>
            ))}
          </div>
            </div>
          </div>
        </div>

        <div className="container mx-auto px-4 py-8 max-w-4xl">
        
          
          <div className="space-y-8">
            {renderStep(1, t.basicDetails, renderBasicDetails(), currentStep >= 1)}
            {renderStep(2, t.imagesAudio, renderImagesAudio(), currentStep >= 2)}
            {renderStep(3, t.additionalDetails, renderAdditionalDetails(), currentStep >= 3)}
            {renderStep(4, t.preview, renderPreview(), currentStep >= 4)}
          </div>

          <div className="flex justify-between mt-8">
            <button
              onClick={prevStep}
              disabled={currentStep === 1}
              className={`px-6 py-3 rounded-lg font-medium ${
                currentStep === 1 
                  ? 'bg-gray-300 text-gray-500 cursor-not-allowed' 
                  : 'bg-gray-600 text-white hover:bg-gray-700'
              }`}
            >
              {t.previous}
            </button>
            
            {currentStep < 4 ? (
              <button
                onClick={nextStep}
                className="px-6 py-3 bg-emov-purple text-white rounded-lg font-medium hover:bg-emov-purple/90"
              >
                {t.next}
              </button>
            ) : (
              <button
                onClick={handleSubmit}
                className="px-6 py-3 bg-emov-green text-white rounded-lg font-medium hover:bg-emov-green/90"
              >
                {t.submitAd}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}