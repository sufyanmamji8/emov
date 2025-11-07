import React, { useState, useEffect } from 'react';
import Navbar from '../components/Layout/Navbar';
import { useTheme } from '../context/ThemeContext';
import axios from 'axios';

// Language translations
const translations = {
  english: {
    // Create New Ad Page
    createNewAd: "Create New Ad",
    basicDetails: "Basic Details",
    additionalDetails: "Additional Details",
    imagesAudio: "Images & Audio",
    preview: "Preview",
    next: "Next",
    previous: "Previous",
    submitAd: "Submit Ad",
    
    // Basic Details
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
    
    // Transmission Types
    manual: "Manual",
    automatic: "Automatic",
    semiAutomatic: "Semi Automatic",
    electric: "Electric",
    
    // Step 2
    images: "Images",
    audio: "Audio",
    selectMultipleImages: "Select multiple images of your vehicle",
    uploadAudioDescription: "Upload optional audio description",
    optional: "Optional",
    
    // Step 3
    engineType: "Engine Type",
    vehicleBodyType: "Vehicle Body Type",
    loadCapacity: "Load Capacity",
    ownership: "Ownership",
    serviceHistory: "Service History",
    sellerComment: "Seller Comment",
    enterLoadCapacity: "e.g., 60,000 kg",
    addComments: "Add any additional comments about your vehicle...",
    
    // Engine Types
    diesel: "Diesel",
    petrol: "Petrol",
    cng: "CNG",
    lpg: "LPG",
    
    // Ownership Types
    firstOwner: "First Owner",
    secondOwner: "Second Owner",
    thirdOwner: "Third Owner",
    companyFleetOwned: "Company / Fleet Owned",
    governmentOwned: "Government Owned",
    
    // Service History
    fullService: "Full Service",
    partialService: "Partial Service",
    noService: "No Service",
    
    // Preview Step
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
    
    // Required field
    required: "*",
  },
  
  urdu: {
    // Create New Ad Page
    createNewAd: "نیا اشتہار بنائیں",
    basicDetails: "بنیادی تفصیلات",
    additionalDetails: "اضافی تفصیلات",
    imagesAudio: "تصاویر اور آڈیو",
    preview: "پیش نظارہ",
    next: "اگلا",
    previous: "پچھلا",
    submitAd: "اشتہار جمع کریں",
    
    // Basic Details
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
    
    // Transmission Types
    manual: "مینوئل",
    automatic: "آٹومیٹک",
    semiAutomatic: "سیمی آٹومیٹک",
    electric: "الیکٹرک",
    
    // Step 2
    images: "تصاویر",
    audio: "آڈیو",
    selectMultipleImages: "اپنی گاڑی کی متعدد تصاویر منتخب کریں",
    uploadAudioDescription: "اختیاری آڈیو تفصیل اپ لوڈ کریں",
    optional: "اختیاری",
    
    // Step 3
    engineType: "انجن کی قسم",
    vehicleBodyType: "گاڑی کی باڈی قسم",
    loadCapacity: "لوڈ کی صلاحیت",
    ownership: "مالکیت",
    serviceHistory: "سروس ہسٹری",
    sellerComment: "فروخت کنندہ کا تبصرہ",
    enterLoadCapacity: "مثال کے طور پر، 60,000 کلو",
    addComments: "اپنی گاڑی کے بارے میں کوئی اضافی تبصرہ شامل کریں...",
    
    // Engine Types
    diesel: "ڈیزل",
    petrol: "پٹرول",
    cng: "سی این جی",
    lpg: "ایل پی جی",
    
    // Ownership Types
    firstOwner: "پہلا مالک",
    secondOwner: "دوسرا مالک",
    thirdOwner: "تیسرا مالک",
    companyFleetOwned: "کمپنی / فلٹ کی ملکیت",
    governmentOwned: "حکومتی ملکیت",
    
    // Service History
    fullService: "مکمل سروس",
    partialService: "جزوی سروس",
    noService: "کوئی سروس نہیں",
    
    // Preview Step
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
    
    // Required field
    required: "*",
  },
  
  french: {
    // Create New Ad Page
    createNewAd: "Créer une nouvelle annonce",
    basicDetails: "Détails de base",
    additionalDetails: "Détails supplémentaires",
    imagesAudio: "Images et audio",
    preview: "Aperçu",
    next: "Suivant",
    previous: "Précédent",
    submitAd: "Soumettre l'annonce",
    
    // Basic Details
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
    
    // Transmission Types
    manual: "Manuelle",
    automatic: "Automatique",
    semiAutomatic: "Semi-automatique",
    electric: "Électrique",
    
    // Step 2
    images: "Images",
    audio: "Audio",
    selectMultipleImages: "Sélectionnez plusieurs images de votre véhicule",
    uploadAudioDescription: "Téléchargez une description audio facultative",
    optional: "Optionnel",
    
    // Step 3
    engineType: "Type de moteur",
    vehicleBodyType: "Type de carrosserie",
    loadCapacity: "Capacité de charge",
    ownership: "Propriété",
    serviceHistory: "Historique d'entretien",
    sellerComment: "Commentaire du vendeur",
    enterLoadCapacity: "ex. 60 000 kg",
    addComments: "Ajoutez des commentaires supplémentaires sur votre véhicule...",
    
    // Engine Types
    diesel: "Diesel",
    petrol: "Essence",
    cng: "GNL",
    lpg: "GPL",
    
    // Ownership Types
    firstOwner: "Premier propriétaire",
    secondOwner: "Deuxième propriétaire",
    thirdOwner: "Troisième propriétaire",
    companyFleetOwned: "Détenu par une entreprise/flotte",
    governmentOwned: "Détenu par le gouvernement",
    
    // Service History
    fullService: "Entretien complet",
    partialService: "Entretien partiel",
    noService: "Aucun entretien",
    
    // Preview Step
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
    
    // Required field
    required: "*",
  }
};

// Dynamic data that needs translation
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
    // Basic Details
    vehicleName: '',
    price: '',
    vehicleType: '',
    vehicleBrand: '',
    vehicleModel: '',
    mileage: '',
    registrationYear: '',
    power: '',
    transmission: '',
    
    // Images & Audio
    images: [],
    audio: null,
    
    // Additional Details
    engineType: '',
    vehicleBodyType: '',
    loadCapacity: '',
    ownership: '',
    serviceHistory: '',
    sellerComment: ''
  });

  // Get translations for current language
  const t = translations[language];
  const translatedData = getTranslatedData(language);

  // Sample data for dropdowns (static data that doesn't need translation)
  const vehicleBrands = ['Toyota', 'Honda', 'Ford', 'BMW', 'Mercedes', 'Audi', 'Hyundai', 'Kia'];
  const vehicleModels = ['Model S', 'Model 3', 'Civic', 'Accord', 'Camry', 'Corolla', 'F-150', 'X5'];
  const registrationYears = Array.from({length: 30}, (_, i) => new Date().getFullYear() - i);
  const bodyTypes = ['Container Body', 'Flatbed', 'Box Truck', 'Tanker', 'Dump Truck', 'Refrigerated'];

  // Fetch user profile
  useEffect(() => {
    const fetchUserProfile = async () => {
      try {
        const savedUser = localStorage.getItem('user');
        if (savedUser) {
          const userData = JSON.parse(savedUser);
          const formattedUser = {
            name: userData.name || userData.username || 'User',
            email: userData.email || '',
            picture: userData.imageUrl ? `https://api.emov.com.pk/${userData.imageUrl.replace(/^\//, '')}` : null,
            username: userData.username
          };
          setUserProfile(formattedUser);
          return;
        }

        const token = localStorage.getItem('token');
        if (token) {
          const response = await axios.get('https://api.emov.com.pk/api/user/profile', {
            headers: { Authorization: `Bearer ${token}` }
          });
          
          const userData = response.data.data || response.data;
          const formattedUser = {
            name: userData.name || userData.username || 'User',
            email: userData.email || '',
            picture: userData.imageUrl ? `https://api.emov.com.pk/${userData.imageUrl.replace(/^\//, '')}` : null,
            username: userData.username
          };
          
          localStorage.setItem('user', JSON.stringify(formattedUser));
          setUserProfile(formattedUser);
        }
      } catch (error) {
        console.error('Error fetching user profile:', error);
        const savedUser = localStorage.getItem('user');
        if (savedUser) {
          setUserProfile(JSON.parse(savedUser));
        }
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
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleFileChange = (e) => {
    const { name, files } = e.target;
    if (name === 'images') {
      setFormData(prev => ({
        ...prev,
        images: Array.from(files)
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: files[0]
      }));
    }
  };

  const nextStep = () => {
    setCurrentStep(prev => Math.min(prev + 1, 4));
  };

  const prevStep = () => {
    setCurrentStep(prev => Math.max(prev - 1, 1));
  };

  const handleSubmit = async () => {
    try {
      const token = localStorage.getItem('token');
      const formDataToSend = new FormData();
      
      Object.keys(formData).forEach(key => {
        if (key === 'images') {
          formData.images.forEach(image => {
            formDataToSend.append('images', image);
          });
        } else if (key === 'audio' && formData.audio) {
          formDataToSend.append('audio', formData.audio);
        } else {
          formDataToSend.append(key, formData[key]);
        }
      });

      const response = await axios.post('https://api.emov.com.pk/api/ads', formDataToSend, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'multipart/form-data'
        }
      });

      console.log('Ad created successfully:', response.data);
    } catch (error) {
      console.error('Error creating ad:', error);
    }
  };

  const renderStepIndicator = () => (
    <div className="flex justify-center mb-3">
      {[1, 2, 3, 4].map((step) => (
        <div key={step} className="flex items-center">
          <div className={`w-7 h-7 rounded-full flex items-center justify-center border-2 text-sm font-bold ${
            step === currentStep 
              ? 'bg-emov-purple border-emov-purple text-white' 
              : step < currentStep 
                ? 'bg-emov-green border-emov-green text-white' 
                : 'bg-surface-secondary border-border-primary text-text-secondary'
          }`}>
            {step}
          </div>
          {step < 4 && (
            <div className={`w-6 md:w-8 h-1 mx-2 ${
              step < currentStep ? 'bg-emov-green' : 'bg-border-primary'
            }`} />
          )}
        </div>
      ))}
    </div>
  );

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="surface-secondary p-4 rounded-lg shadow-theme border border-border-primary h-full">
            <h2 className="text-lg font-bold mb-4 text-primary">{t.basicDetails}</h2>
            
            <div className="space-y-4">
              {/* First Row */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold mb-2 text-primary">
                    {t.vehicleName} <span className="text-red-500">{t.required}</span>
                  </label>
                  <input
                    type="text"
                    name="vehicleName"
                    value={formData.vehicleName}
                    onChange={handleInputChange}
                    className="w-full p-3 text-sm border border-border-primary rounded-lg surface-secondary text-primary placeholder-text-tertiary"
                    placeholder={t.enterVehicleName}
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold mb-2 text-primary">
                    {t.vehiclePrice}
                  </label>
                  <input
                    type="text"
                    name="price"
                    value={formData.price}
                    onChange={handleInputChange}
                    className="w-full p-3 text-sm border border-border-primary rounded-lg surface-secondary text-primary placeholder-text-tertiary"
                    placeholder={t.enterVehiclePrice}
                  />
                </div>
              </div>

              {/* Second Row */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold mb-2 text-primary">
                    {t.vehicleType} <span className="text-red-500">{t.required}</span>
                  </label>
                  <select
                    name="vehicleType"
                    value={formData.vehicleType}
                    onChange={handleInputChange}
                    className="w-full p-3 text-sm border border-border-primary rounded-lg surface-secondary text-primary"
                  >
                    <option value="">{t.selectVehicleType}</option>
                    {translatedData.vehicleTypes.map(type => (
                      <option key={type} value={type}>{type}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold mb-2 text-primary">
                    {t.vehicleBrand} <span className="text-red-500">{t.required}</span>
                  </label>
                  <input
                    type="text"
                    name="vehicleBrand"
                    value={formData.vehicleBrand}
                    onChange={handleInputChange}
                    className="w-full p-3 text-sm border border-border-primary rounded-lg surface-secondary text-primary placeholder-text-tertiary"
                    placeholder={t.enterVehicleBrand}
                  />
                </div>
              </div>

              {/* Third Row */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold mb-2 text-primary">
                    {t.vehicleModel} <span className="text-red-500">{t.required}</span>
                  </label>
                  <select
                    name="vehicleModel"
                    value={formData.vehicleModel}
                    onChange={handleInputChange}
                    className="w-full p-3 text-sm border border-border-primary rounded-lg surface-secondary text-primary"
                  >
                    <option value="">{t.selectVehicleModel}</option>
                    {vehicleModels.map(model => (
                      <option key={model} value={model}>{model}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold mb-2 text-primary">
                    {t.vehicleMileage} <span className="text-red-500">{t.required}</span>
                  </label>
                  <input
                    type="text"
                    name="mileage"
                    value={formData.mileage}
                    onChange={handleInputChange}
                    className="w-full p-3 text-sm border border-border-primary rounded-lg surface-secondary text-primary placeholder-text-tertiary"
                    placeholder={t.enterVehicleMileage}
                  />
                </div>
              </div>

              {/* Fourth Row */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold mb-2 text-primary">
                    {t.registrationYear} <span className="text-red-500">{t.required}</span>
                  </label>
                  <select
                    name="registrationYear"
                    value={formData.registrationYear}
                    onChange={handleInputChange}
                    className="w-full p-3 text-sm border border-border-primary rounded-lg surface-secondary text-primary"
                  >
                    <option value="">{t.selectRegistrationYear}</option>
                    {registrationYears.map(year => (
                      <option key={year} value={year}>{year}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold mb-2 text-primary">
                    {t.vehiclePower} <span className="text-red-500">{t.required}</span>
                  </label>
                  <input
                    type="text"
                    name="power"
                    value={formData.power}
                    onChange={handleInputChange}
                    className="w-full p-3 text-sm border border-border-primary rounded-lg surface-secondary text-primary placeholder-text-tertiary"
                    placeholder={t.enterVehiclePower}
                  />
                </div>
              </div>

              {/* Transmission Section */}
              <div>
                <label className="block text-sm font-semibold mb-3 text-primary">
                  {t.transmission} <span className="text-red-500">{t.required}</span>
                </label>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {translatedData.transmissionTypes.map((type) => (
                    <label key={type} className="flex items-center space-x-2 text-sm text-primary">
                      <input
                        type="radio"
                        name="transmission"
                        value={type}
                        checked={formData.transmission === type}
                        onChange={handleInputChange}
                        className="w-4 h-4 text-emov-purple focus:ring-emov-purple"
                      />
                      <span>{type}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>
          </div>
        );

      case 2:
        return (
          <div className="surface-secondary p-4 rounded-lg shadow-theme border border-border-primary h-full">
            <h2 className="text-lg font-bold mb-4 text-primary">{t.imagesAudio}</h2>
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-semibold mb-2 text-primary">{t.images}</label>
                <input
                  type="file"
                  name="images"
                  multiple
                  accept="image/*"
                  onChange={handleFileChange}
                  className="w-full p-3 text-sm border border-border-primary rounded-lg surface-secondary text-primary file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-emov-purple file:text-white hover:file:bg-opacity-90"
                />
                <p className="text-sm text-tertiary mt-2">{t.selectMultipleImages}</p>
              </div>
              <div>
                <label className="block text-sm font-medium mb-2 text-primary">
                  {t.audio} ({t.optional})
                </label>
                <input
                  type="file"
                  name="audio"
                  accept="audio/*"
                  onChange={handleFileChange}
                  className="w-full p-3 text-sm border border-border-primary rounded-lg surface-secondary text-primary file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-emov-purple file:text-white hover:file:bg-opacity-90"
                />
                <p className="text-sm text-tertiary mt-2">{t.uploadAudioDescription}</p>
              </div>
            </div>
          </div>
        );

      case 3:
        return (
          <div className="surface-secondary p-6 rounded-lg shadow-theme border border-border-primary h-full overflow-y-auto">
            <h2 className="text-xl font-bold mb-6 text-primary border-b border-border-primary pb-3">{t.additionalDetails}</h2>
            
            <div className="space-y-6">
              {/* Engine Type */}
              <div className="bg-surface-tertiary p-4 rounded-lg">
                <label className="block text-sm font-semibold mb-3 text-primary">
                  {t.engineType} <span className="text-red-500">{t.required}</span>
                </label>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {translatedData.engineTypes.map((type) => (
                    <label 
                      key={type} 
                      className={`flex items-center space-x-2 text-sm p-3 rounded-lg transition-colors cursor-pointer ${
                        formData.engineType === type 
                          ? 'bg-emov-purple/10 border border-emov-purple' 
                          : 'border border-border-primary hover:border-emov-purple/50'
                      }`}
                    >
                      <input
                        type="radio"
                        name="engineType"
                        value={type}
                        checked={formData.engineType === type}
                        onChange={handleInputChange}
                        className="w-4 h-4 text-emov-purple focus:ring-emov-purple"
                      />
                      <span className="font-medium">{type}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Vehicle Body Type */}
                <div className="bg-surface-tertiary p-4 rounded-lg">
                  <label className="block text-sm font-semibold mb-2 text-primary">
                    {t.vehicleBodyType} <span className="text-red-500">{t.required}</span>
                  </label>
                  <div className="relative">
                    <select
                      name="vehicleBodyType"
                      value={formData.vehicleBodyType}
                      onChange={handleInputChange}
                      className="w-full p-3 text-sm border border-border-primary rounded-lg surface-secondary text-primary appearance-none focus:ring-2 focus:ring-emov-purple/50 focus:border-emov-purple transition-colors"
                    >
                      <option value="">{t.selectVehicleType}</option>
                      {bodyTypes.map(type => (
                        <option key={type} value={type}>{type}</option>
                      ))}
                    </select>
                    <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                      <svg className="w-5 h-5 text-text-tertiary" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </div>
                  </div>
                </div>

                  {/* Load Capacity */}
                <div className="bg-surface-tertiary p-4 rounded-lg">
                  <label className="block text-sm font-medium mb-2 text-primary">
                    {t.loadCapacity} <span className="text-text-tertiary">({t.optional})</span>
                  </label>
                  <input
                    type="text"
                    name="loadCapacity"
                    value={formData.loadCapacity}
                    onChange={handleInputChange}
                    className="w-full p-3 text-sm border border-border-primary rounded-lg surface-secondary text-primary placeholder-text-tertiary focus:ring-2 focus:ring-emov-purple/50 focus:border-emov-purple transition-colors"
                    placeholder={t.enterLoadCapacity}
                  />
                </div>
              </div>

              {/* Ownership */}
              <div className="bg-surface-tertiary p-4 rounded-lg">
                <label className="block text-sm font-semibold mb-3 text-primary">
                  {t.ownership} <span className="text-red-500">{t.required}</span>
                </label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {translatedData.ownershipTypes.map((type) => (
                    <label 
                      key={type} 
                      className={`flex items-center space-x-2 text-sm p-3 rounded-lg transition-colors cursor-pointer ${
                        formData.ownership === type 
                          ? 'bg-emov-purple/10 border border-emov-purple' 
                          : 'border border-border-primary hover:border-emov-purple/50'
                      }`}
                    >
                      <input
                        type="radio"
                        name="ownership"
                        value={type}
                        checked={formData.ownership === type}
                        onChange={handleInputChange}
                        className="w-4 h-4 text-emov-purple focus:ring-emov-purple"
                      />
                      <span className="font-medium">{type}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Service History */}
              <div className="bg-surface-tertiary p-4 rounded-lg">
                <label className="block text-sm font-semibold mb-3 text-primary">
                  {t.serviceHistory} <span className="text-text-tertiary">({t.optional})</span>
                </label>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  {translatedData.serviceHistoryTypes.map((type) => (
                    <label 
                      key={type} 
                      className={`flex items-center space-x-2 text-sm p-3 rounded-lg transition-colors cursor-pointer ${
                        formData.serviceHistory === type 
                          ? 'bg-emov-purple/10 border border-emov-purple' 
                          : 'border border-border-primary hover:border-emov-purple/50'
                      }`}
                    >
                      <input
                        type="radio"
                        name="serviceHistory"
                        value={type}
                        checked={formData.serviceHistory === type}
                        onChange={handleInputChange}
                        className="w-4 h-4 text-emov-purple focus:ring-emov-purple"
                      />
                      <span className="font-medium">{type}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Seller Comment */}
              <div className="bg-surface-tertiary p-4 rounded-lg">
                <label className="block text-sm font-semibold mb-2 text-primary">
                  {t.sellerComment} <span className="text-text-tertiary">({t.optional})</span>
                </label>
                <textarea
                  name="sellerComment"
                  value={formData.sellerComment}
                  onChange={handleInputChange}
                  className="w-full p-3 text-sm border border-border-primary rounded-lg surface-secondary text-primary placeholder-text-tertiary focus:ring-2 focus:ring-emov-purple/50 focus:border-emov-purple transition-colors"
                  rows="4"
                  placeholder={t.addComments}
                />
              </div>
            </div>
          </div>
        );

      case 4:
        return (
          <div className="surface-secondary p-4 rounded-lg shadow-theme border border-border-primary h-full">
            <h2 className="text-lg font-bold mb-4 text-primary">{t.preview}</h2>
            
            <div className="border border-border-primary rounded-lg p-6 surface-primary">
              {/* Vehicle Header */}
              <div className="mb-6">
                <h3 className="text-xl font-bold text-primary mb-2">
                  {formData.vehicleName || t.vehicleNameNotProvided}
                </h3>
                <p className="text-xl font-semibold text-emov-green">
                  {formData.price ? `CAD ${formData.price}` : t.priceNotSet}
                </p>
              </div>

              {/* Basic Details Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <div className="space-y-3">
                  <p className="text-primary"><strong>{t.vehicleType}:</strong> {formData.vehicleType || 'N/A'}</p>
                  <p className="text-primary"><strong>{t.brand}:</strong> {formData.vehicleBrand || 'N/A'}</p>
                  <p className="text-primary"><strong>{t.model}:</strong> {formData.vehicleModel || 'N/A'}</p>
                  <p className="text-primary"><strong>{t.transmission}:</strong> {formData.transmission || 'N/A'}</p>
                </div>
                <div className="space-y-3">
                  <p className="text-primary"><strong>{t.vehicleMileage}:</strong> {formData.mileage || 'N/A'}</p>
                  <p className="text-primary"><strong>{t.registrationYear}:</strong> {formData.registrationYear || 'N/A'}</p>
                  <p className="text-primary"><strong>{t.power}:</strong> {formData.power || 'N/A'}</p>
                  <p className="text-primary"><strong>{t.engineType}:</strong> {formData.engineType || 'N/A'}</p>
                </div>
              </div>

              {/* Additional Details */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <div className="space-y-3">
                  <p className="text-primary"><strong>{t.bodyType}:</strong> {formData.vehicleBodyType || 'N/A'}</p>
                  <p className="text-primary"><strong>{t.ownership}:</strong> {formData.ownership || 'N/A'}</p>
                </div>
                <div className="space-y-3">
                  {formData.loadCapacity && <p className="text-primary"><strong>{t.loadCapacity}:</strong> {formData.loadCapacity}</p>}
                  {formData.serviceHistory && <p className="text-primary"><strong>{t.serviceHistory}:</strong> {formData.serviceHistory}</p>}
                </div>
              </div>

              {/* Seller Comment */}
              {formData.sellerComment && (
                <div className="mb-6">
                  <h4 className="font-semibold mb-3 text-primary">{t.sellerComment}</h4>
                  <p className="text-primary bg-surface-tertiary p-4 rounded-lg">
                    {formData.sellerComment}
                  </p>
                </div>
              )}

              {/* Media Summary */}
              <div className="border-t border-border-primary pt-4">
                <h4 className="font-semibold mb-3 text-primary">{t.media}</h4>
                <div className="flex flex-wrap gap-3">
                  <div className="bg-surface-tertiary px-4 py-2 rounded-lg">
                    <span className="text-primary font-medium">{t.images}: </span>
                    <span className="text-emov-green">{formData.images.length} {t.uploaded}</span>
                  </div>
                  <div className="bg-surface-tertiary px-4 py-2 rounded-lg">
                    <span className="text-primary font-medium">{t.audio}: </span>
                    <span className={formData.audio ? "text-emov-green" : "text-text-tertiary"}>
                      {formData.audio ? t.uploaded : t.notProvided}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <React.Fragment>
      {/* Top Header Section */}
      <div className="bg-white border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 sm:py-4">
          <div className="flex justify-between items-center h-8 sm:h-10">
            <div className="flex items-center space-x-2">
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{color: 'var(--emov-green, #00FFA9)'}}>
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
              </svg>
              <span className="text-sm font-medium text-gray-700">Download App</span>
            </div>
            
            <div className="flex items-center space-x-4">
              <button className="text-sm font-medium text-gray-700">
                Sign In
              </button>
              <button className="text-white px-4 py-1 rounded text-sm font-medium transition-colors"
                style={{
                  backgroundColor: 'var(--emov-green, #0DFF9A)',
                }}
                onMouseOver={(e) => e.currentTarget.style.opacity = '0.9'}
                onMouseOut={(e) => e.currentTarget.style.opacity = '1'}
              >
                Sign Up
              </button>
            </div>
          </div>
        </div>
      </div>
      
      <div className="min-h-screen surface-primary text-primary flex flex-col">
      <Navbar 
        isDark={theme === 'dark'}
        toggleTheme={toggleTheme}
        language={language}
        setLanguage={setLanguage}
        userProfile={userProfile}
        handleLogout={handleLogout}
      />
      
      {/* Main Content */}
      <div className="flex-1 flex flex-col pt-16">
        <div className="flex-1 container mx-auto px-4 py-4 max-w-4xl">
          <h1 className="text-2xl font-bold mb-4 text-primary">{t.createNewAd}</h1>
          
          {renderStepIndicator()}
          
          {/* Form Container */}
          <div className="mb-6" style={{ height: '500px' }}>
            {renderStepContent()}
          </div>
          
          {/* Navigation Buttons */}
          <div className="flex justify-between">
            <button
              onClick={prevStep}
              disabled={currentStep === 1}
              className={`px-6 py-3 text-sm rounded-lg font-medium ${
                currentStep === 1 
                  ? 'bg-surface-tertiary text-text-tertiary cursor-not-allowed' 
                  : 'bg-surface-secondary text-primary border border-border-primary hover:opacity-90'
              }`}
            >
              {t.previous}
            </button>
            
            {currentStep < 4 ? (
              <button
                onClick={nextStep}
                className="px-6 py-3 text-sm bg-emov-purple text-white rounded-lg font-medium hover:bg-opacity-90"
              >
                {t.next}
              </button>
            ) : (
              <button
                onClick={handleSubmit}
                className="px-6 py-3 text-sm bg-emov-green text-white rounded-lg font-medium hover:bg-opacity-90"
              >
                {t.submitAd}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
    </React.Fragment>
  );
}