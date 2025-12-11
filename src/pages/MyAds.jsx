import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaArrowLeft, FaCamera, FaMicrophone, FaUpload, FaCheck, FaChevronDown, FaChevronUp, FaCaretDown, FaMoon, FaSun, FaStop, FaCircle, FaTimes } from 'react-icons/fa';
import apiService from '../services/Api';
import Navbar from '../components/Layout/Navbar';
import { useTheme } from '../context/ThemeContext';
import toast from '../utils/toast.jsx';

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
    location: "Location",
    enterLocation: "Enter location",
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
    excelConfiguration: "Excel Configuration",
    driveTrain: "Drive Train",
    fuelEfficiency: "Fuel Efficiency",
    condition: "Condition",
    certification: "Certification",
    accidentHistory: "Accident History",
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
    location: "مقام",
    enterLocation: "مقام درج کریں",
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
    selectVehicleModel: "Sélectionnez le modèle de véhicule",
    selectRegistrationYear: "Sélectionnez l'année d'immatriculation",
    location: "Emplacement",
    enterLocation: "Entrez l'emplacement",
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

// Format time in MM:SS format
const formatTime = (seconds) => {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
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
  const [pagination, setPagination] = useState({
    total: 0,
    page: 1,
    perPage: 10,
    totalPages: 0
  });
  const [currentStep, setCurrentStep] = useState(1);
  const [filterData, setFilterData] = useState(null);
  const [filterDataLoading, setFilterDataLoading] = useState(true);
  const [filterDataError, setFilterDataError] = useState(null);

  // States for filtered dropdown options
  const [filteredBrands, setFilteredBrands] = useState([]);
  const [filteredModels, setFilteredModels] = useState([]);
  const [filteredBodyTypes, setFilteredBodyTypes] = useState([]);

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
  const [fieldErrors, setFieldErrors] = useState({});
  const [stepErrors, setStepErrors] = useState({});
  
  // Add submitting state
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  // Audio recording states
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [mediaRecorder, setMediaRecorder] = useState(null);
  const [audioChunks, setAudioChunks] = useState([]);
  const [showRecordingUI, setShowRecordingUI] = useState(false);
  const recordingInterval = useRef(null);

  const t = translations[language];
  const translatedData = getTranslatedData(language);
  const navigate = useNavigate();

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
    localStorage.removeItem('accessToken');
    localStorage.removeItem('user');
    localStorage.removeItem('refreshToken');
    sessionStorage.removeItem('token');
    // Navigate to home page instead of dashboard
    window.location.href = '/';
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
      // Keep as string since API data uses strings
      newValue = value;
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
  };
  
  // Debug: Log form data changes
  useEffect(() => {
    console.log('Form data updated:', formData);
  }, [formData]);

  // Filtering functions for cascading dropdowns
  const filterBrandsByVehicleType = (vehicleTypeId) => {
    if (!vehicleTypeId || !filterData?.brand) {
      return [];
    }
    
    console.log('Filtering brands for vehicle type:', vehicleTypeId);
    console.log('Available brand data:', filterData.brand.slice(0, 3)); // Show first 3 brands for debugging
    
    const filtered = filterData.brand.filter(brand => {
      // Try different possible field names for the vehicle type relationship
      const matches = brand.VehicleTypeID === vehicleTypeId || 
                     brand.vehicle_type_id === vehicleTypeId ||
                     brand.CategoryID === vehicleTypeId ||
                     brand.category_id === vehicleTypeId;
      
      if (matches) {
        console.log('Brand matches:', brand.BrandName, brand);
      }
      
      return matches;
    });
    
    console.log('Filtered brands result:', filtered);
    return filtered;
  };

  const filterModelsByBrand = (brandId) => {
    if (!brandId || !filterData?.model) {
      return [];
    }
    
    console.log('Filtering models for brand:', brandId);
    console.log('Available model data:', filterData.model.slice(0, 2)); // Show first 2 models for debugging
    
    const filtered = filterData.model.filter(model => {
      // Try different possible field names for the brand relationship
      const matches = model.VehicleBrandID === brandId || 
                     model.vehicle_brand_id === brandId ||
                     model.BrandID === brandId ||
                     model.brand_id === brandId;
      
      if (matches) {
        console.log('Model matches:', model.ModelName || model.name, model);
      }
      
      return matches;
    });
    
    console.log('Filtered models result:', filtered);
    return filtered;
  };

  const filterBodyTypesByVehicleType = (vehicleTypeId) => {
    console.log('=== Body Type Filtering Debug ===');
    console.log('VehicleTypeId:', vehicleTypeId);
    console.log('FilterData exists:', !!filterData);
    console.log('FilterData keys:', filterData ? Object.keys(filterData) : 'none');
    console.log('body_type exists:', !!filterData?.body_type);
    console.log('bodyType exists:', !!filterData?.bodyType);
    console.log('body_type data:', filterData?.body_type);
    console.log('bodyType data:', filterData?.bodyType);
    
    // Try both possible field names for body types
    const bodyTypeData = filterData?.body_type || filterData?.bodyType || [];
    console.log('Using bodyTypeData:', bodyTypeData);
    console.log('Length:', bodyTypeData.length);
    
    if (!vehicleTypeId || bodyTypeData.length === 0) {
      console.log('Returning empty array - no vehicle type or no body type data');
      return [];
    }
    
    console.log('Sample body type structure:', bodyTypeData[0]);
    
    const filtered = bodyTypeData.filter(bodyType => {
      // Try different possible field names for the vehicle type relationship
      const matches = bodyType.VehicleTypeID === vehicleTypeId || 
                     bodyType.vehicle_type_id === vehicleTypeId ||
                     bodyType.CategoryID === vehicleTypeId ||
                     bodyType.category_id === vehicleTypeId ||
                     bodyType.VehicleType === vehicleTypeId ||
                     bodyType.vehicle_type === vehicleTypeId ||
                     bodyType.Category === vehicleTypeId ||
                     bodyType.category === vehicleTypeId;
      
      if (matches) {
        console.log('Body type matches:', bodyType.BodyTypeName || bodyType.name, bodyType);
      }
      
      return matches;
    });
    
    console.log('Filtered body types result:', filtered);
    console.log('Total body types available:', bodyTypeData.length);
    console.log('=== End Body Type Debug ===');
    return filtered;
  };

  const handleFileChange = async (e) => {
    const { name, files } = e.target;
    console.log(`File input changed - ${name}:`, files);

    if (name === 'images' && files.length > 0) {
      // Check if total images would exceed maximum limit
      const currentImageCount = formData.Images?.length || 0;
      if (currentImageCount + files.length > 5) {
        setFormData(prev => ({
          ...prev,
          imageUploadError: `Maximum 5 images allowed. You already have ${currentImageCount} images. Please select only ${5 - currentImageCount} more.`
        }));
        return;
      }
      
      try {
        setSubmitting(true);
        
        // Upload all files in parallel for better performance
        const uploadPromises = Array.from(files).map(async (file) => {
          console.log('Uploading file:', file.name);
          const response = await apiService.upload.uploadImage(file);
          if (response && response.url) {
            console.log('Image uploaded successfully:', response.url);
            
            // Store just the filename (not full URL)
            let imageUrl = response.url;
            
            // Extract just the filename if it's a full URL
            if (imageUrl.includes('/')) {
              imageUrl = imageUrl.split('/').pop();
            }
            
            console.log('Storing image filename for API:', imageUrl);
            return imageUrl;
          } else {
            throw new Error('No URL returned from image upload');
          }
        });
        
        // Wait for all uploads to complete
        const uploadedImageUrls = await Promise.all(uploadPromises);
        
        console.log('All images uploaded, storing filenames:', uploadedImageUrls);
        
        setFormData(prev => ({
          ...prev,
          Images: [...(prev.Images || []), ...uploadedImageUrls], // Append to existing images
          imageUploadError: null
        }));
        
      } catch (error) {
        console.error('Error handling file uploads:', error);
        setFormData(prev => ({
          ...prev,
          imageUploadError: error.message || 'Failed to upload images. Please try again.'
        }));
      } finally {
        setSubmitting(false);
      }
    } else if (name === 'audio' && files.length > 0) {
      try {
        // Handle audio upload similarly
        const file = files[0];
        const response = await apiService.upload.uploadAudio(file);
        if (response && response.url) {
          let audioUrl = response.url;
          if (audioUrl.includes('/')) {
            audioUrl = audioUrl.split('/').pop();
          }
          
          setFormData(prev => ({
            ...prev,
            AudioURL: audioUrl,
            audioUploadError: null
          }));
        }
      } catch (error) {
        console.error('Error uploading audio:', error);
        setFormData(prev => ({
          ...prev,
          audioUploadError: 'Failed to upload audio. Please try again.'
        }));
      }
    }
  };

  // Start audio recording
  const startRecording = async () => {
    try {
      console.log('[Audio] Starting recording...');
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      console.log('[Audio] Microphone access granted');
      const mediaRecorder = new MediaRecorder(stream);
      const audioChunks = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunks.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunks, { type: 'audio/wav' });
        
        try {
          setSubmitting(true);
          const response = await apiService.upload.uploadAudio(audioBlob);
          if (response && response.url) {
            let audioUrl = response.url;
            if (audioUrl.includes('/')) {
              audioUrl = audioUrl.split('/').pop();
            }
            
            setFormData(prev => ({
              ...prev,
              AudioURL: audioUrl,
              audioUploadError: null
            }));
          }
        } catch (error) {
          console.error('Error uploading recorded audio:', error);
          setFormData(prev => ({
            ...prev,
            audioUploadError: 'Failed to upload recorded audio. Please try again.'
          }));
        } finally {
          setSubmitting(false);
        }
        
        setAudioChunks([]);
        setRecordingTime(0);
      };

      console.log('[Audio] MediaRecorder created, starting...');
      mediaRecorder.start();
      console.log('[Audio] MediaRecorder started');
      setMediaRecorder(mediaRecorder);
      setAudioChunks(audioChunks);
      setIsRecording(true);
      setShowRecordingUI(true);
      console.log('[Audio] States set, starting timer...');

      // Start recording timer
      recordingInterval.current = setInterval(() => {
        console.log('[Audio] Timer tick - current time:', recordingTime);
        setRecordingTime(prev => {
          if (prev >= 60) { // 60 seconds max recording time
            stopRecording();
            return 0;
          }
          return prev + 1;
        });
      }, 1000);

    } catch (error) {
      console.error('Error accessing microphone:', error);
      alert('Could not access microphone. Please check permissions.');
    }
  };

  // Stop audio recording
  const stopRecording = () => {
    if (mediaRecorder && mediaRecorder.state !== 'inactive') {
      mediaRecorder.stop();
      mediaRecorder.stream.getTracks().forEach(track => track.stop());
    }
    setIsRecording(false);
    setShowRecordingUI(false);
    if (recordingInterval.current) {
      clearInterval(recordingInterval.current);
      recordingInterval.current = null;
    }
  };

  // Cancel recording
  const cancelRecording = () => {
    if (mediaRecorder && mediaRecorder.state !== 'inactive') {
      mediaRecorder.stream.getTracks().forEach(track => track.stop());
    }
    setIsRecording(false);
    setShowRecordingUI(false);
    setFormData(prev => ({
      ...prev,
      AudioURL: null
    }));
    setRecordingTime(0);
    if (recordingInterval.current) {
      clearInterval(recordingInterval.current);
      recordingInterval.current = null;
    }
  };

  // Validate step before navigation
  const validateStep = (step) => {
    const errors = {};
    
    console.log('Validating step:', step);
    console.log('Current formData:', formData);
    
    if (step === 1) {
      // Basic Details step validation
      if (!formData.VehicleName?.trim()) {
        errors.VehicleName = 'Fill this field';
        console.log('VehicleName missing');
      }
      if (!formData.VehiclePrice || formData.VehiclePrice === '') {
        errors.VehiclePrice = 'Fill this field';
        console.log('VehiclePrice missing');
      }
      if (!formData.VehicleTypeID) {
        errors.VehicleTypeID = 'Fill this field';
        console.log('VehicleTypeID missing');
      }
      if (!formData.VehicleBrandID) {
        errors.VehicleBrandID = 'Fill this field';
        console.log('VehicleBrandID missing');
      }
      if (!formData.VehicleModelID) {
        errors.VehicleModelID = 'Fill this field';
        console.log('VehicleModelID missing');
      }
      if (!formData.VehicleMileage?.trim()) {
        errors.VehicleMileage = 'Fill this field';
        console.log('VehicleMileage missing');
      }
      if (!formData.RegistrationYear || formData.RegistrationYear === '') {
        errors.RegistrationYear = 'Fill this field';
        console.log('RegistrationYear missing');
      }
      if (!formData.VehiclePower || formData.VehiclePower === '') {
        errors.VehiclePower = 'Fill this field';
        console.log('VehiclePower missing');
      }
      if (!formData.Transmission) {
        errors.Transmission = 'Select a transmission type';
        console.log('Transmission missing');
      }
      if (!formData.Color?.trim()) {
        errors.Color = 'Select a color';
        console.log('Color missing');
      }
    } else if (step === 2) {
      // Images & Audio step validation - minimum 2 and maximum 5 images required, audio is optional
      if (!formData.Images || formData.Images.length === 0) {
        errors.Images = 'Minimum 2 images are required';
        console.log('Images missing');
      } else if (formData.Images.length < 2) {
        errors.Images = 'Minimum 2 images are required';
        console.log('Not enough images');
      } else if (formData.Images.length > 5) {
        errors.Images = 'Maximum 5 images allowed';
        console.log('Too many images');
      }
      // Audio is optional - no validation needed
    } else if (step === 3) {
      // Additional Details step validation
      if (!formData.SellerComment?.trim()) {
        errors.SellerComment = 'Fill this field';
        console.log('SellerComment missing');
      }
      if (!formData.LocationName?.trim()) {
        errors.LocationName = 'Fill this field';
        console.log('LocationName missing');
      }
      if (!formData.EngineType) {
        errors.EngineType = 'Fill this field';
        console.log('EngineType missing');
      }
      if (!formData.VehicleBodyTypeID) {
        errors.VehicleBodyTypeID = 'Fill this field';
        console.log('VehicleBodyTypeID missing');
      }
      if (!formData.Ownership) {
        errors.Ownership = 'Fill this field';
        console.log('Ownership missing');
      }
      if (!formData.ServiceHistory) {
        errors.ServiceHistory = 'Fill this field';
        console.log('ServiceHistory missing');
      }
    }
    
    console.log('Validation errors:', errors);
    setFieldErrors(errors);
    const hasErrors = Object.keys(errors).length > 0;
    console.log('Has errors:', hasErrors);
    
    if (hasErrors) {
      setStepErrors(prev => ({ ...prev, [step]: true }));
    } else {
      setStepErrors(prev => ({ ...prev, [step]: false }));
    }
    
    return !hasErrors;
  };

  // Handle step navigation with validation
  const handleStepChange = (newStep) => {
    if (newStep < currentStep) {
      // Allow going back without validation
      setCurrentStep(newStep);
      return;
    }
    
    // Validate current step before moving forward
    if (validateStep(currentStep)) {
      setCurrentStep(newStep);
    }
  };

  // Fetch filter data from API
  useEffect(() => {
    const fetchFilterData = async () => {
      try {
        setFilterDataLoading(true);
        console.log('Fetching filter data for Ads page...');
        const response = await apiService.vehicles.getFilters();
        console.log('Full API response:', response);
        console.log('Response data:', response?.data);
        console.log('Body types data:', response?.data?.body_type);
        console.log('Body types array:', Array.isArray(response?.data?.body_type));
        console.log('All available keys:', Object.keys(response?.data || {}));
        if (response?.data) {
          console.log('Successfully fetched filter data for Ads:', response.data);
          setFilterData(response.data);
          setFilterDataError(null);
          
          // Store filter data in localStorage for preview access
          if (response.data.category) {
            localStorage.setItem('vehicleCategories', JSON.stringify(response.data.category));
          }
          if (response.data.brand) {
            localStorage.setItem('vehicleBrands', JSON.stringify(response.data.brand));
          }
          if (response.data.model) {
            localStorage.setItem('vehicleModels', JSON.stringify(response.data.model));
          }
          if (response.data.body_type || response.data.bodyType) {
            const bodyTypes = response.data.body_type || response.data.bodyType;
            localStorage.setItem('vehicleBodyTypes', JSON.stringify(bodyTypes));
          }
        }
      } catch (err) {
        console.error('Error fetching vehicle filters for Ads:', err);
        setFilterDataError('Failed to load vehicle data');
      } finally {
        setFilterDataLoading(false);
      }
    };

    fetchFilterData();
  }, []);

  // useEffect hooks for cascading dropdown filtering
  useEffect(() => {
    console.log('Brand filtering useEffect triggered');
    console.log('formData.VehicleTypeID:', formData.VehicleTypeID);
    console.log('filterData:', filterData ? 'loaded' : 'not loaded');
    
    if (filterData && formData.VehicleTypeID) {
      const filtered = filterBrandsByVehicleType(formData.VehicleTypeID);
      setFilteredBrands(filtered);
      console.log('Filtered brands for vehicle type', formData.VehicleTypeID, ':', filtered);
    } else {
      setFilteredBrands([]);
      console.log('Clearing filtered brands - no vehicle type or filter data');
    }
  }, [formData.VehicleTypeID, filterData]);

  useEffect(() => {
    if (filterData && formData.VehicleBrandID) {
      const filtered = filterModelsByBrand(formData.VehicleBrandID);
      setFilteredModels(filtered);
      console.log('Filtered models for brand', formData.VehicleBrandID, ':', filtered);
    } else {
      setFilteredModels([]);
    }
  }, [formData.VehicleBrandID, filterData]);

  useEffect(() => {
    if (filterData && formData.VehicleTypeID) {
      const filtered = filterBodyTypesByVehicleType(formData.VehicleTypeID);
      setFilteredBodyTypes(filtered);
      console.log('Filtered body types for vehicle type', formData.VehicleTypeID, ':', filtered);
    } else {
      setFilteredBodyTypes([]);
    }
  }, [formData.VehicleTypeID, filterData]);

  // Reset dependent dropdowns when parent selection changes
  useEffect(() => {
    if (formData.VehicleTypeID) {
      // Reset Brand and Model when Vehicle Type changes
      setFormData(prev => ({
        ...prev,
        VehicleBrandID: '',
        VehicleModelID: ''
      }));
    }
  }, [formData.VehicleTypeID]);

  useEffect(() => {
    // Reset Model when Brand changes
    if (formData.VehicleBrandID) {
      setFormData(prev => ({
        ...prev,
        VehicleModelID: ''
      }));
    }
  }, [formData.VehicleBrandID]);

  const nextStep = () => {
    console.log('nextStep called, currentStep:', currentStep);
    if (currentStep < 4) {
      // Validate current step before moving forward
      const isValid = validateStep(currentStep);
      console.log('Validation result:', isValid);
      if (isValid) {
        console.log('Moving to step:', currentStep + 1);
        setCurrentStep(prev => prev + 1);
        setTimeout(() => {
          document.getElementById(`step-${currentStep + 1}`)?.scrollIntoView({ behavior: 'smooth' });
        }, 100);
      } else {
        console.log('Validation failed, staying on current step');
      }
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
    { key: 'VehiclePrice', name: 'Vehicle Price' },
    { key: 'VehicleTypeID', name: 'Vehicle Type' },
    { key: 'VehicleBrandID', name: 'Vehicle Brand' },
    { key: 'VehicleModelID', name: 'Vehicle Model' },
    { key: 'VehicleMileage', name: 'Vehicle Mileage' },
    { key: 'RegistrationYear', name: 'Registration Year' },
    { key: 'VehiclePower', name: 'Vehicle Power' },
    { key: 'Transmission', name: 'Transmission' },
    { key: 'Color', name: 'Color' },
    { key: 'LocationName', name: 'Location' },
    { key: 'EngineType', name: 'Engine Type' },
    { key: 'VehicleBodyTypeID', name: 'Vehicle Body Type' },
    { key: 'Ownership', name: 'Ownership' },
  ];

  const errors = [];
  
  requiredFields.forEach(field => {
    const value = formData[field.key];
    
    // Check for empty strings, null, undefined, or 0 for numeric fields
    if (value === '' || value === null || value === undefined || value === 0) {
      errors.push(field.name);
    }
    
    // Additional validation for price
    if (field.key === 'VehiclePrice' && (value <= 0 || isNaN(value))) {
      errors.push(`${field.name} must be greater than 0`);
    }
    
    // Additional validation for numeric IDs
    if (['VehicleTypeID', 'VehicleBrandID', 'VehicleModelID', 'VehicleBodyTypeID'].includes(field.key)) {
      if (value <= 0 || isNaN(value)) {
        errors.push(`${field.name} must be selected`);
      }
    }
  });
  
  return errors;
};

// FIXED handleSubmit function that matches your API response format

const handleSubmit = async () => {
  try {
    console.log('🚀 Starting form submission...');
    setSubmitting(true);
    setError(null);
    
    // Check if user is authenticated
    const token = localStorage.getItem('token');
    if (!token) {
      sessionStorage.setItem('pendingAdData', JSON.stringify(formData));
      sessionStorage.setItem('redirectAfterLogin', '/post-ad');
      window.location.href = '/login';
      return;
    }
    
    console.log('📋 Current formData:', formData);
    
    // Validate form
    const validationErrors = validateForm();
    
    if (validationErrors.length > 0) {
      setCurrentStep(1);
      throw new Error(`Please fill in all required fields: ${validationErrors.join(', ')}`);
    }

    // Check if we have uploaded images
    if (!formData.Images || formData.Images.length === 0) {
      throw new Error('Please upload at least one image');
    }

    // Get user ID from localStorage or profile
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    const userId = user.id || user.UserID;
    
    if (!userId) {
      throw new Error('User not authenticated. Please log in again.');
    }

    console.log('👤 User ID:', userId);
    
    // **CRITICAL FIX**: Ensure Images is always an ARRAY
    let imagesArray;
    
    // Handle different possible formats of Images
    if (Array.isArray(formData.Images)) {
      imagesArray = formData.Images;
    } else if (typeof formData.Images === 'string') {
      // If it's a string, try to parse it as JSON array, otherwise wrap in array
      try {
        imagesArray = JSON.parse(formData.Images);
        if (!Array.isArray(imagesArray)) {
          imagesArray = [formData.Images];
        }
      } catch (e) {
        imagesArray = [formData.Images];
      }
    } else {
      imagesArray = [formData.Images];
    }
    
    // Filter out any empty/null values
    imagesArray = imagesArray.filter(img => img && img.trim() !== '');
    
    console.log('🔍 DEBUG - Images data:', {
      originalImages: formData.Images,
      processedImages: imagesArray,
      type: typeof imagesArray,
      isArray: Array.isArray(imagesArray),
      length: imagesArray.length
    });

    // Prepare the request data exactly as backend expects
    const requestData = {
      VehicleName: formData.VehicleName || '',
      VehicleModelID: formData.VehicleModelID ? Number(formData.VehicleModelID) : null,
      VehiclePrice: formData.VehiclePrice ? Number(formData.VehiclePrice) : null,
      VehicleTypeID: formData.VehicleTypeID ? Number(formData.VehicleTypeID) : null,
      VehicleMileage: formData.VehicleMileage || '',
      RegistrationYear: formData.RegistrationYear ? String(formData.RegistrationYear) : '',
      VehiclePower: formData.VehiclePower ? `${formData.VehiclePower} HP` : '',
      VehicleBrandID: formData.VehicleBrandID ? Number(formData.VehicleBrandID) : null,
      Transmission: formData.Transmission || '',
      Color: formData.Color || '',
      SellerComment: formData.SellerComment || '',
      LocationName: formData.LocationName || '',
      EngineType: formData.EngineType || '',
      VehicleBodyTypeID: formData.VehicleBodyTypeID ? Number(formData.VehicleBodyTypeID) : null,
      LoadCapacity: formData.LoadCapacity || '',
      Ownership: formData.Ownership || '',
      ServiceHistory: formData.ServiceHistory || '',
      UserID: String(userId),
      // **FIX**: Send as ARRAY of strings
      Images: imagesArray,
      AudioURL: formData.AudioURL || null
    };
    
    console.log('📤 Final request data before sending:', requestData);
    console.log('=== VEHICLEPOWER DEBUG ===');
    console.log('VehiclePower in requestData:', requestData.VehiclePower);
    console.log('Type of VehiclePower:', typeof requestData.VehiclePower);
    console.log('formData.VehiclePower:', formData.VehiclePower);
    console.log('Type of formData.VehiclePower:', typeof formData.VehiclePower);
    
    // Make the API call
    console.log('📡 Making API call to create ad...');
    const response = await apiService.ads.create(requestData);
    
    console.log('✅ API Response:', response);

    if (response && (response.status === 201 || response.success)) {
      // Success
      console.log('🎉 Ad created successfully!');
      
      // Show success message
      toast.success('Ad created successfully!', {
        position: "top-right",
        autoClose: 5000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
        progress: undefined,
      });
      
      // Reset form
      setFormData({
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
      
      // Redirect to my ads page
      setTimeout(() => {
        navigate('/my-ads');
      }, 2000);
      
    } else {
      throw new Error(response?.message || 'Failed to create ad');
    }
    
  } catch (error) {
    console.error('❌ Error in handleSubmit:', error);
    
    let errorMessage = 'Failed to create ad. Please try again.';
    
    if (error.response) {
      const { status, data } = error.response;
      console.error(`Server responded with status ${status}:`, data);
      
      if (data?.message) {
        errorMessage = data.message;
      } else if (data?.error) {
        errorMessage = data.error;
      } else if (status === 500) {
        errorMessage = 'Server error. Please check if the backend is running and try again.';
      } else if (status === 400) {
        errorMessage = 'Invalid data. Please check all fields and try again.';
      }
    } else if (error.request) {
      console.error('No response received:', error.request);
      errorMessage = 'No response from server. Please check your connection and ensure the backend is running.';
    } else {
      console.error('Error message:', error.message);
      errorMessage = error.message;
    }
    
    setError(errorMessage);
    toast.error(`Error: ${errorMessage}`, {
      position: "top-right",
      autoClose: 5000,
      hideProgressBar: false,
      closeOnClick: true,
      pauseOnHover: true,
      draggable: true,
      progress: undefined,
    });
  } finally {
    setSubmitting(false);
  }
};

const renderStep = (stepNumber, title, content, isActive) => (
  <div id={`step-${stepNumber}`} className={`mb-10 transition-all duration-300 ${isActive ? 'block' : 'hidden'}`}>
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
      {/* Step Header */}
      <div className="mb-6">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white">{title}</h2>
        <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
          {stepNumber === 1 && "Enter your vehicle's essential details to move to the next step."}
          {stepNumber === 2 && "Add images and optional audio description of your vehicle."}
          {stepNumber === 3 && "Provide additional information about your vehicle."}
          {stepNumber === 4 && "Review all the information before submitting your ad."}
        </p>
      </div>
      
      {/* Step Content */}
      <div className="space-y-6">
        {content}
      </div>
    </div>
  </div>
);

const renderBasicDetails = () => (
  <div className="space-y-8">
    <div className="space-y-1">
      
    </div>

    <div className="space-y-6">
      {/* Row 1: Vehicle Name and Price */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            {t.vehicleName} <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            name="VehicleName"
            value={formData.VehicleName || ''}
            onChange={handleInputChange}
            placeholder={t.enterVehicleName}
            className={`w-full px-4 py-2.5 border rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white
                     focus:ring-2 focus:ring-emov-purple/50 focus:border-emov-purple transition-all duration-200 ${
                       fieldErrors.VehicleName ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                     }`}
            required
          />
          {fieldErrors.VehicleName && (
            <p className="text-sm text-red-500">{fieldErrors.VehicleName}</p>
          )}
        </div>

        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            {t.vehiclePrice} <span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <input
              type="number"
              name="VehiclePrice"
              value={formData.VehiclePrice || ''}
              onChange={handleInputChange}
              className={`w-full px-4 py-2.5 border rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white
                       focus:ring-2 focus:ring-emov-purple/50 focus:border-emov-purple transition-all duration-200 ${
                         fieldErrors.VehiclePrice ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                       }`}
              placeholder={t.enterVehiclePrice}
              min="0"
              required
            />
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 dark:text-gray-400 text-sm">
              CAD
            </span>
          </div>
          {fieldErrors.VehiclePrice && (
            <p className="text-sm text-red-500">{fieldErrors.VehiclePrice}</p>
          )}
        </div>
      </div>

      {/* Row 2: Vehicle Type and Brand */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            {t.vehicleType} <span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <select
              name="VehicleTypeID"
              value={formData.VehicleTypeID || ''}
              onChange={handleInputChange}
              className="w-full px-4 py-2.5 appearance-none border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white
                       focus:ring-2 focus:ring-emov-purple/50 focus:border-emov-purple transition-all duration-200"
              required
              disabled={filterDataLoading}
            >
              <option value="">{t.selectVehicleType}</option>
              {filterData?.category?.map((category) => (
                <option key={category.VehicleTypeID} value={category.VehicleTypeID}>
                  {language === 'urdu' ? category.CategoryNameUrdu : 
                   language === 'french' ? category.CategoryNameFrench : 
                   category.CategoryName}
                </option>
              ))}
            </select>
            <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-gray-500">
              <FaCaretDown />
            </div>
          </div>
          {filterDataLoading && (
            <p className="text-sm text-gray-500">Loading vehicle types...</p>
          )}
          {filterDataError && (
            <p className="text-sm text-red-500">Failed to load vehicle types</p>
          )}
        </div>

        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            {t.brand} <span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <select
              name="VehicleBrandID"
              value={formData.VehicleBrandID || ''}
              onChange={handleInputChange}
              className="w-full px-4 py-2.5 appearance-none border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white
                       focus:ring-2 focus:ring-emov-purple/50 focus:border-emov-purple transition-all duration-200"
              required
              disabled={filterDataLoading}
            >
              <option value="">Select Brand</option>
              {(() => {
                const brandsToUse = filteredBrands;
                const uniqueBrands = [];
                const brandNames = new Set();
                
                brandsToUse.forEach(brand => {
                  if (brand.BrandName && brand.BrandName !== 'Various' && !brandNames.has(brand.BrandName)) {
                    brandNames.add(brand.BrandName);
                    uniqueBrands.push({
                      id: brand.BrandID || brand.VehicleBrandID,
                      name: brand.BrandName
                    });
                  }
                });
                
                if (uniqueBrands.length === 0 && formData.VehicleTypeID) {
                  return (
                    <option value="" disabled>
                      No brands available for selected vehicle type
                    </option>
                  );
                }
                
                return uniqueBrands.map((brand) => (
                  <option key={brand.id} value={brand.id}>
                    {brand.name}
                  </option>
                ));
              })()}
            </select>
            <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-gray-500">
              <FaCaretDown />
            </div>
          </div>
          {filterDataLoading && (
            <p className="text-sm text-gray-500">Loading brands...</p>
          )}
          {filterDataError && (
            <p className="text-sm text-red-500">Failed to load brands</p>
          )}
        </div>
      </div>

      {/* Row 3: Model and Location */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            {t.model} <span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <select
              name="VehicleModelID"
              value={formData.VehicleModelID || ''}
              onChange={handleInputChange}
              className="w-full px-4 py-2.5 appearance-none border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white
                       focus:ring-2 focus:ring-emov-purple/50 focus:border-emov-purple transition-all duration-200"
              required
              disabled={filterDataLoading}
            >
              <option value="">Select Model</option>
              {filteredModels?.length > 0 ? filteredModels.map((model) => (
                <option key={model.ModelID || model.VehicleModelID} value={model.ModelID || model.VehicleModelID}>
                  {language === 'urdu' ? (model.ModelNameUrdu || model.name) :
                   language === 'french' ? (model.ModelNameFrench || model.name) :
                   (model.ModelNameEnglish || model.ModelName || model.name)}
                </option>
              )) : formData.VehicleBrandID ? (
                <option value="" disabled>
                  No models available for selected brand
                </option>
              ) : null}
            </select>
            <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-gray-500">
              <FaCaretDown />
            </div>
          </div>
          {filterDataLoading && (
            <p className="text-sm text-gray-500">Loading models...</p>
          )}
          {filterDataError && (
            <p className="text-sm text-red-500">Failed to load models</p>
          )}
        </div>

        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            {t.location} <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            name="LocationName"
            value={formData.LocationName || ''}
            onChange={handleInputChange}
            className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white 
                     focus:ring-2 focus:ring-emov-purple/50 focus:border-emov-purple transition-all duration-200"
            placeholder={t.enterLocation}
            required
          />
        </div>
      </div>

      {/* Row 4: Mileage and Registration Year */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            {t.vehicleMileage} <span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <input
              type="text"
              name="VehicleMileage"
              value={formData.VehicleMileage || ''}
              onChange={handleInputChange}
              className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white
                       focus:ring-2 focus:ring-emov-purple/50 focus:border-emov-purple transition-all duration-200"
              placeholder={t.enterVehicleMileage}
              required
            />
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 dark:text-gray-400 text-sm">
              km
            </span>
          </div>
        </div>

        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            {t.registrationYear} <span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <select
              name="RegistrationYear"
              value={formData.RegistrationYear || ''}
              onChange={handleInputChange}
              className="w-full px-4 py-2.5 appearance-none border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white
                       focus:ring-2 focus:ring-emov-purple/50 focus:border-emov-purple transition-all duration-200"
              required
            >
              <option value="">{t.selectRegistrationYear}</option>
              {registrationYears.map(year => (
                <option key={year} value={year}>{year}</option>
              ))}
            </select>
            <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-gray-500">
              <FaCaretDown />
            </div>
          </div>
        </div>
      </div>

      {/* Row 5: Power and Color */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            {t.vehiclePower} <span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <input
              type="number"
              name="VehiclePower"
              value={formData.VehiclePower || ''}
              onChange={handleInputChange}
              placeholder="Enter power (e.g., 150)"
              className={`w-full px-4 py-2.5 pr-12 border rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white
                       focus:ring-2 focus:ring-emov-purple/50 focus:border-emov-purple transition-all duration-200 ${
                         fieldErrors.VehiclePower ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                       }`}
              required
            />
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 dark:text-gray-400">
              HP
            </span>
          </div>
          {fieldErrors.VehiclePower && (
            <p className="text-sm text-red-500">{fieldErrors.VehiclePower}</p>
          )}
        </div>
        
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Color <span className="text-red-500">*</span>
          </label>
          <div className="flex items-center space-x-3">
            <input
              type="color"
              name="Color"
              value={formData.Color || '#000000'}
              onChange={handleInputChange}
              className={`h-10 w-16 border-2 rounded-lg cursor-pointer ${
                fieldErrors.Color ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
              }`}
              required
            />
            <input
              type="text"
              value={formData.Color || ''}
              onChange={handleInputChange}
              placeholder="Select color or enter hex code"
              className={`flex-1 px-4 py-2.5 border rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white
                       focus:ring-2 focus:ring-emov-purple/50 focus:border-emov-purple transition-all duration-200 ${
                         fieldErrors.Color ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                       }`}
              readOnly
            />
          </div>
          {fieldErrors.Color && (
            <p className="text-sm text-red-500">{fieldErrors.Color}</p>
          )}
        </div>
      </div>

      {/* Transmission */}
      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
          {t.transmission} <span className="text-red-500">*</span>
        </label>
        <div className="flex flex-wrap gap-3">
          {translatedData.transmissionTypes.map((type) => (
            <label 
              key={type} 
              className={`flex items-center space-x-2 px-4 py-2 border rounded-lg cursor-pointer ${
                formData.Transmission === type
                  ? 'bg-emov-purple/10 text-emov-purple'
                  : 'border-gray-300 dark:border-gray-600'
              }`}
            >
              <input
                type="radio"
                name="Transmission"
                value={type}
                checked={formData.Transmission === type}
                onChange={handleInputChange}
                className="w-4 h-4 text-emov-purple border-gray-300"
              />
              <span className="font-medium">{type}</span>
            </label>
          ))}
        </div>
      </div>
    </div>
  </div>
);

const renderImagesAudio = () => (
  <div className="space-y-6">
    <div>
      <label className="block text-sm font-semibold mb-2 text-gray-700 dark:text-gray-300">
        {t.images} <span className="text-red-500">*</span>
      </label>
      <div className={`relative border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
        fieldErrors.Images 
          ? 'border-red-400 bg-red-50 dark:bg-red-900/20' 
          : 'border-gray-300 dark:border-gray-600 hover:border-emov-purple/50 bg-gray-50 dark:bg-gray-700'
      }`}>
        <input
          type="file"
          name="images"
          multiple
          accept="image/*"
          onChange={handleFileChange}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
          disabled={submitting}
        />
        <div className="space-y-2">
          <FaUpload className="mx-auto text-3xl text-gray-400" />
          <div>
            <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
              {submitting ? 'Uploading...' : 'Click to upload or drag and drop'}
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              Minimum 2 images, Maximum 5 images allowed
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              PNG, JPG, GIF up to 10MB each
            </p>
          </div>
        </div>
      </div>
      
      {/* Show upload error */}
      {formData.imageUploadError && (
        <div className="mt-2 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
          <p className="text-sm text-red-600 dark:text-red-400">{formData.imageUploadError}</p>
        </div>
      )}
      
      {/* Show validation error */}
      {fieldErrors.Images && (
        <div className="mt-2 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
          <p className="text-sm text-red-600 dark:text-red-400">{fieldErrors.Images}</p>
        </div>
      )}
      
      {/* Show uploaded images */}
      {formData.Images && formData.Images.length > 0 && (
        <div className="mt-4">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Uploaded Images ({formData.Images.length}/5)
            </p>
            {formData.Images.length >= 2 && (
              <span className="text-xs text-green-600 dark:text-green-400 font-medium">
                ✓ Minimum requirement met
              </span>
            )}
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
            {formData.Images.map((image, index) => (
              <div key={index} className="relative group">
                <div className="aspect-square rounded-lg overflow-hidden bg-gray-100 dark:bg-gray-700 border border-gray-200 dark:border-gray-600">
                  <img
                    src={`https://api.emov.com.pk/image/${image}`}
                    alt={`Upload ${index + 1}`}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      e.target.src = '/image-placeholder.png';
                    }}
                  />
                </div>
                <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 transition-all duration-200 rounded-lg flex items-center justify-center">
                  <span className="text-white text-xs opacity-0 group-hover:opacity-100 transition-opacity">
                    Image {index + 1}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
    
    <div>
      <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
        {t.audio} ({t.optional})
      </label>
      
      {/* Audio recording button */}
      <div className="flex gap-3 mb-3">
        <div className="relative">
          <button
            type="button"
            onClick={isRecording ? stopRecording : startRecording}
            className={`flex-shrink-0 p-3 rounded-full transition-colors ${isRecording 
              ? 'text-red-500 bg-red-100 dark:bg-red-900/30 hover:bg-red-200 dark:hover:bg-red-900/50' 
              : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'}`}
            disabled={submitting}
          >
            {isRecording ? <FaStop className="w-5 h-5" /> : <FaMicrophone className="w-5 h-5" />}
          </button>
          
          {/* Recording indicator */}
          {showRecordingUI && (
            <div className="absolute bottom-full mb-2 left-1/2 transform -translate-x-1/2 bg-red-500 text-white text-xs font-medium px-3 py-1 rounded-full flex items-center space-x-2 shadow-lg">
              <FaCircle className="animate-pulse" />
              <span>Recording... {formatTime(recordingTime)}</span>
              <button 
                onClick={(e) => {
                  e.stopPropagation();
                  cancelRecording();
                }}
                className="ml-2 text-white hover:text-gray-200"
                title="Cancel recording"
              >
                <FaTimes className="w-3 h-3" />
              </button>
            </div>
          )}
        </div>
        
        <div className="flex-1 text-sm text-gray-600 dark:text-gray-400 flex items-center">
          {isRecording ? 'Click to stop recording' : 'Click to start recording audio description'}
        </div>
      </div>
      
      {/* Audio file upload */}
      <div className="relative border-2 border-dashed rounded-lg p-4 text-center border-gray-300 dark:border-gray-600 hover:border-emov-purple/50 bg-gray-50 dark:bg-gray-700 transition-colors">
        <input
          type="file"
          name="audio"
          accept="audio/*"
          onChange={handleFileChange}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
        />
        <div className="space-y-1">
          <FaUpload className="mx-auto text-2xl text-gray-400" />
          <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
            Or upload audio file
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            MP3, WAV up to 5MB
          </p>
        </div>
      </div>
      
      {/* Show audio upload error */}
      {formData.audioUploadError && (
        <div className="mt-2 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
          <p className="text-sm text-red-600 dark:text-red-400">{formData.audioUploadError}</p>
        </div>
      )}
      
      {/* Show uploaded audio */}
      {formData.AudioURL && (
        <div className="mt-4 p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
          <p className="text-sm text-green-600 dark:text-green-400">
            ✓ Audio uploaded successfully
          </p>
        </div>
      )}
    </div>
  </div>
);

const renderAdditionalDetails = () => (
  <div className="space-y-6">
    <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
      <label className="block text-sm font-semibold mb-3 text-gray-700 dark:text-gray-300">
        {t.engineType} <span className="text-red-500">{t.required}</span>
      </label>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        {translatedData.engineTypes.map((type) => (
          <label key={type} className={`flex items-center space-x-2 text-sm p-3 rounded-lg cursor-pointer ${
            formData.EngineType === type
              ? 'bg-emov-purple/10 border border-emov-purple' 
              : 'border border-gray-300 dark:border-gray-600'
          }`}>
            <input
              type="radio"
              name="EngineType"
              value={type}
              checked={formData.EngineType === type}
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
          name="VehicleBodyTypeID"
          value={formData.VehicleBodyTypeID || ''}
          onChange={handleInputChange}
          className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
          disabled={filterDataLoading}
        >
          <option value="">Select Body Type</option>
          {(() => {
            const bodyTypesToUse = filteredBodyTypes;
            console.log('Body types data:', bodyTypesToUse);
            
            if (bodyTypesToUse.length === 0 && formData.VehicleTypeID) {
              return (
                <option value="" disabled>
                  No body types available for selected vehicle type
                </option>
              );
            }
            
            return bodyTypesToUse.map((bodyType) => (
              <option key={bodyType.BodyTypeID || bodyType.id} value={bodyType.BodyTypeID || bodyType.id}>
                {language === 'urdu' ? (bodyType.BodyTypeNameUrdu || bodyType.name) :
                 language === 'french' ? (bodyType.BodyTypeNameFrench || bodyType.name) :
                 (bodyType.BodyTypeName || bodyType.name)}
              </option>
            ));
          })()}
        </select>
        {filterDataLoading && (
          <p className="text-sm text-gray-500 mt-2">Loading body types...</p>
        )}
        {filterDataError && (
          <p className="text-sm text-red-500 mt-2">Failed to load body types</p>
        )}
      </div>
      <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
        <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
          {t.loadCapacity} <span className="text-gray-500">({t.optional})</span>
        </label>
        <input
          type="text"
          name="LoadCapacity"
          value={formData.LoadCapacity || ''}
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
            formData.Ownership === type
              ? 'bg-emov-purple/10 border border-emov-purple' 
              : 'border border-gray-300 dark:border-gray-600'
          }`}>
            <input
              type="radio"
              name="Ownership"
              value={type}
              checked={formData.Ownership === type}
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
            formData.ServiceHistory === type
              ? 'bg-emov-purple/10 border border-emov-purple' 
              : 'border border-gray-300 dark:border-gray-600'
          }`}>
            <input
              type="radio"
              name="ServiceHistory"
              value={type}
              checked={formData.ServiceHistory === type}
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
        name="SellerComment"
        value={formData.SellerComment || ''}
        onChange={handleInputChange}
        className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
        rows="4"
        placeholder={t.addComments}
      />
    </div>
  </div>
);

const renderPreview = () => {
  // Get vehicle type name from ID
  const getVehicleTypeName = (typeId) => {
    if (!typeId && typeId !== 0) return 'N/A';
    
    // Convert to string for comparison (API returns strings)
    const id = String(typeId);
    
    // Try to find in filterData
    if (filterData?.category) {
      const category = filterData.category.find(cat => 
        String(cat.VehicleTypeID || cat.id) === id
      );
      if (category) {
        return category.CategoryName || category.name || category.CategoryNameEnglish || 'N/A';
      }
    }
    
    // If not found in filterData, try to get from the stored options
    const storedCategories = JSON.parse(localStorage.getItem('vehicleCategories') || '[]');
    const category = storedCategories.find(cat => 
      String(cat.VehicleTypeID || cat.id) === id
    );
    return category ? (category.CategoryName || category.name || category.CategoryNameEnglish) : typeId;
  };

  // Get body type name from ID
  const getBodyTypeName = (bodyTypeId) => {
    if (!bodyTypeId && bodyTypeId !== 0) return 'N/A';
    
    // Convert to string for comparison (API returns strings)
    const id = String(bodyTypeId);
    
    // Try to find in filterData
    const bodyTypesData = filterData?.body_type || filterData?.bodyType || [];
    if (bodyTypesData.length > 0) {
      const bodyType = bodyTypesData.find(bt => 
        String(bt.BodyTypeID || bt.id) === id
      );
      if (bodyType) {
        return bodyType.BodyTypeName || bodyType.name || bodyType.BodyTypeNameEnglish || 'N/A';
      }
    }
    
    // If not found in filterData, try to get from the stored options
    const storedBodyTypes = JSON.parse(localStorage.getItem('vehicleBodyTypes') || '[]');
    const bodyType = storedBodyTypes.find(bt => 
      String(bt.BodyTypeID || bt.id) === id
    );
    return bodyType ? (bodyType.BodyTypeName || bodyType.name || bodyType.BodyTypeNameEnglish) : bodyTypeId;
  };

  // Get brand name from ID
  const getBrandName = (brandId) => {
    if (!brandId && brandId !== 0) return 'N/A';
    
    // Convert to string for comparison (API returns strings)
    const id = String(brandId);
    
    console.log('=== Brand Lookup ===');
    console.log('Input brandId:', brandId, 'Type:', typeof brandId);
    console.log('Converted id:', id);
    console.log('filterData?.brand:', filterData?.brand);
    
    // Try to find in filterData
    if (filterData?.brand) {
      if (filterData.brand.length > 0) {
        console.log('Sample brand structure:', filterData.brand[0]);
        console.log('Available brand IDs:', filterData.brand.map(b => b.BrandID || b.id));
      }
      const brand = filterData.brand.find(b => 
        String(b.BrandID || b.id) === id
      );
      console.log('Found brand:', brand);
      if (brand) {
        const name = brand.BrandName || brand.name || 'N/A';
        console.log('Returning brand name:', name);
        return name;
      }
    }
    
    // If not found in filterData, try to get from the stored options
    const storedBrands = JSON.parse(localStorage.getItem('vehicleBrands') || '[]');
    console.log('Checking localStorage brands:', storedBrands.length);
    const brand = storedBrands.find(b => 
      String(b.BrandID || b.id) === id
    );
    console.log('Found brand in localStorage:', brand);
    if (brand) {
      const name = brand.BrandName || brand.name;
      console.log('Returning localStorage brand name:', name);
      return name;
    }
    
    console.log('No brand match found, returning ID:', brandId);
    return brandId;
  };

  // Get model name from ID
  const getModelName = (modelId) => {
    if (!modelId && modelId !== 0) return 'N/A';
    
    // Convert to string for comparison (API returns strings)
    const id = String(modelId);
    
    console.log('=== Model Lookup ===');
    console.log('Input modelId:', modelId, 'Type:', typeof modelId);
    console.log('Converted id:', id);
    console.log('filterData?.model:', filterData?.model);
    
    // Try to find in filterData
    if (filterData?.model) {
      if (filterData.model.length > 0) {
        console.log('Sample model structure:', filterData.model[0]);
        console.log('Available model IDs:', filterData.model.map(m => m.ModelID || m.VehicleModelID || m.id));
      }
      const model = filterData.model.find(m => 
        String(m.ModelID || m.VehicleModelID || m.id) === id
      );
      console.log('Found model:', model);
      if (model) {
        const name = model.ModelName || model.name || model.ModelNameEnglish || 'N/A';
        console.log('Returning model name:', name);
        return name;
      }
    }
    
    // If not found in filterData, try to get from the stored options
    const storedModels = JSON.parse(localStorage.getItem('vehicleModels') || '[]');
    const model = storedModels.find(m => 
      String(m.ModelID || m.VehicleModelID || m.id) === id
    );
    console.log('Found model in localStorage:', model);
    if (model) {
      const name = model.ModelName || model.name || model.ModelNameEnglish;
      console.log('Returning localStorage model name:', name);
      return name;
    }
    
    console.log('No model match found, returning ID:', modelId);
    return modelId;
  };

  return (
    <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
      <div className="mb-6">
        <h3 className="text-2xl font-bold text-gray-800 dark:text-white mb-2">
          {formData.VehicleName || t.vehicleNameNotProvided}
        </h3>
        <p className="text-xl font-semibold text-emov-green">
          {formData.VehiclePrice ? `CAD ${formData.VehiclePrice}` : t.priceNotSet}
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        <div className="space-y-3">
          <p className="text-gray-700 dark:text-gray-300">
            <strong>{t.vehicleType}:</strong> {getVehicleTypeName(formData.VehicleTypeID)}
          </p>
          <p className="text-gray-700 dark:text-gray-300">
            <strong>{t.brand}:</strong> {getBrandName(formData.VehicleBrandID)}
          </p>
          <p className="text-gray-700 dark:text-gray-300">
            <strong>{t.model}:</strong> {getModelName(formData.VehicleModelID)}
          </p>
          <p className="text-gray-700 dark:text-gray-300">
            <strong>{t.vehiclePrice}:</strong> {formData.VehiclePrice ? `$${formData.VehiclePrice}` : 'N/A'}
          </p>
          <p className="text-gray-700 dark:text-gray-300">
            <strong>{t.transmission}:</strong> {formData.Transmission || 'N/A'}
          </p>
        </div>
        <div className="space-y-3">
          <p className="text-gray-700 dark:text-gray-300">
            <strong>{t.vehicleMileage}:</strong> {formData.VehicleMileage || 'N/A'}
          </p>
          <p className="text-gray-700 dark:text-gray-300">
            <strong>{t.registrationYear}:</strong> {formData.RegistrationYear || 'N/A'}
          </p>
          <p className="text-gray-700 dark:text-gray-300">
            <strong>{t.power}:</strong> {formData.VehiclePower || 'N/A'}
          </p>
          <p className="text-gray-700 dark:text-gray-300">
            <strong>{t.engineType}:</strong> {formData.EngineType || 'N/A'}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        <div className="space-y-3">
          <p className="text-gray-700 dark:text-gray-300">
            <strong>{t.bodyType}:</strong> {getBodyTypeName(formData.VehicleBodyTypeID)}
          </p>
          <p className="text-gray-700 dark:text-gray-300">
            <strong>{t.ownership}:</strong> {formData.Ownership || 'N/A'}
          </p>
        </div>
        <div className="space-y-3">
          <p className="text-gray-700 dark:text-gray-300">
            <strong>{t.loadCapacity}:</strong> {formData.LoadCapacity || 'N/A'}
          </p>
          <p className="text-gray-700 dark:text-gray-300">
            <strong>{t.serviceHistory}:</strong> {formData.ServiceHistory || 'N/A'}
          </p>
        </div>
      </div>

      {formData.SellerComment && (
        <div className="mb-6">
          <h4 className="font-semibold mb-3 text-gray-800 dark:text-white">{t.sellerComment}</h4>
          <p className="text-gray-700 dark:text-gray-300 bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
            {formData.SellerComment}
          </p>
        </div>
      )}

      <div className="border-t border-gray-300 dark:border-gray-600 pt-4">
        <h4 className="font-semibold mb-3 text-gray-800 dark:text-white">{t.media}</h4>
        <div className="flex flex-wrap gap-3">
          <div className="bg-gray-50 dark:bg-gray-700 px-4 py-2 rounded-lg">
            <span className="text-gray-700 dark:text-gray-300 font-medium">{t.images}: </span>
            <span className="text-emov-green">{(formData.Images && formData.Images.length) || 0} {t.uploaded}</span>
          </div>
          <div className="bg-gray-50 dark:bg-gray-700 px-4 py-2 rounded-lg">
            <span className="text-gray-700 dark:text-gray-300 font-medium">{t.audio}: </span>
            <span className={formData.AudioURL ? "text-emov-green" : "text-gray-500"}>
              {formData.AudioURL ? t.uploaded : t.notProvided}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
          {/* Header */}
      <div className="bg-bg-secondary border-b border-border-primary sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center">
              <button
                onClick={() => navigate(-1)}
                className="mr-4 p-2 rounded-lg hover:bg-bg-tertiary transition-colors"
              >
                <FaArrowLeft className="w-5 h-5 text-text-primary" />
              </button>
              <div className="text-xl font-semibold text-text-primary">My Ads</div>
            </div>
          </div>
        </div>
      </div>
   
      
      {/* Main Content */}
      <div className="pt-0">
        {/* Top Right Button inside Main Content */}
        <div className="container mx-auto px-0 max-w-4xl">
         
        </div>
        <div className="bg-white dark:bg-gray-800 py-12 shadow-sm mb-8">
          <div className="container mx-auto px-0 max-w-4xl">
            <div className="text-center">
    <h1 className="text-3xl md:text-4xl font-bold text-emov-purple mb-4">
                A Smarter Way to Sell Your Vehicle — in 4 Steps
              </h1>
              <p className="text-gray-600 dark:text-gray-300 text-lg">
                Post your ad in minutes and reach thousands of potential buyers
              </p>
              <p className="text-gray-600 dark:text-gray-300 text-lg">
                Experience a smooth, transparent process designed to save your <br /> time and maximize your return.
              </p>
              
              
              {/* Step Indicator */}
              <div className="flex justify-center items-center mb-8 p-6 bg-white dark:bg-gray-800 rounded-xl mt-5 relative">
                <div className="absolute left-0 right-0 top-1/2 h-0.5 bg-gray-200 dark:bg-gray-600 -translate-y-1/2 z-0" 
                     style={{ left: '10%', right: '10%' }}></div>
                <div className="flex items-center justify-between w-full max-w-2xl">
                  {[{ id: 1, label: 'Basic Details' }, { id: 2, label: t.additionalDetails }, { id: 3, label: t.media }, { id: 4, label: 'Preview' }].map((step) => (
                    <div key={step.id} className="flex flex-col items-center relative z-10">
                      <button
                        onClick={() => handleStepChange(step.id)}
                        className={`flex items-center justify-center w-12 h-12 rounded-full font-medium text-lg transition-colors ${
                          currentStep === step.id
                            ? 'bg-emov-purple text-white'
                            : currentStep > step.id
                            ? 'bg-emov-purple text-white'
                            : stepErrors[step.id]
                            ? 'bg-red-500 text-white'
                            : 'bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-400'
                        }`}
                      >
                        {step.id}
                      </button>
                      <span className={`mt-2 text-sm font-medium text-center ${
                        currentStep === step.id
                          ? 'text-emov-purple dark:text-emov-purple'
                          : currentStep > step.id
                          ? 'text-emov-purple dark:text-emov-purple'
                          : stepErrors[step.id]
                          ? 'text-red-500'
                          : 'text-gray-600 dark:text-gray-400'
                      }`}>
                        {step.label}
                      </span>
                    </div>
                  ))}
                </div>
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
                className="px-6 py-3 text-white rounded-lg font-medium"
                style={{ backgroundColor: '#0DFF9A' }}
              >
                {t.next}
              </button>
            ) : (
              <button
                onClick={handleSubmit}
                disabled={submitting}
                className={`px-6 py-3 bg-emov-green text-white rounded-lg font-medium hover:bg-emov-green/90 ${
                  submitting ? 'opacity-50 cursor-not-allowed' : ''
                }`}
              >
                {submitting ? 'Submitting...' : t.submitAd}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}