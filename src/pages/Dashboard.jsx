import React, { useState } from 'react';
import { FaSearch, FaCar, FaMotorcycle, FaTruck, FaBus, FaShuttleVan } from 'react-icons/fa';

const Dashboard = () => {
  const [activeTab, setActiveTab] = useState('Category');

  // Your exact color scheme
  const colors = {
    purple: '#935eef',
    green: '#00FFA9',
    gradient: 'linear-gradient(135deg, #2bd6a8 0%, #bda8e9 100%)'
  };

  const categories = [
    { name: 'Cars', icon: <FaCar className="text-2xl" /> },
    { name: 'Motorcycles', icon: <FaMotorcycle className="text-2xl" /> },
    { name: 'Trucks', icon: <FaTruck className="text-2xl" /> },
    { name: 'Buses', icon: <FaBus className="text-2xl" /> },
    { name: 'Vans', icon: <FaShuttleVan className="text-2xl" /> },
    { name: 'SUVs', icon: <FaCar className="text-2xl" /> },
    { name: 'Sedans', icon: <FaCar className="text-2xl" /> },
    { name: 'Hatchbacks', icon: <FaCar className="text-2xl" /> },
  ];

  const featuredVehicles = [
    {
      id: 1,
      title: 'Toyota Corolla',
      price: '$15,000',
      year: '2020',
      mileage: '25,000 km',
      fuel: 'Petrol',
      location: 'Karachi',
      image: 'https://via.placeholder.com/300x200/935eef/ffffff?text=Toyota+Corolla'
    },
    {
      id: 2,
      title: 'Honda Civic',
      price: '$18,000',
      year: '2021',
      mileage: '20,000 km',
      fuel: 'Petrol',
      location: 'Lahore',
      image: 'https://via.placeholder.com/300x200/00FFA9/000000?text=Honda+Civic'
    },
    {
      id: 3,
      title: 'Suzuki Alto',
      price: '$8,000',
      year: '2019',
      mileage: '35,000 km',
      fuel: 'Petrol',
      location: 'Islamabad',
      image: 'https://via.placeholder.com/300x200/2bd6a8/ffffff?text=Suzuki+Alto'
    }
  ];

  // Enhanced sample car data with your colors
  const tabData = {
    Category: Array.from({ length: 12 }, (_, i) => ({
      id: i + 1,
      name: ['Automatic', 'Manual', 'Family', 'Sports', 'Luxury', 'Electric', 'Hybrid', 'Vintage', 'Convertible', 'SUV', 'Hatchback', 'Sedan'][i] + ' Cars',
      image: `https://via.placeholder.com/150x100/${i % 2 === 0 ? '935eef' : '2bd6a8'}/ffffff?text=Car+${i + 1}`,
      count: `${Math.floor(Math.random() * 200) + 50}`
    })),
    Budget: Array.from({ length: 12 }, (_, i) => ({
      id: i + 1,
      name: ['$5K-$10K', '$10K-$15K', '$15K-$20K', '$20K-$25K', '$25K-$30K', '$30K+', 'Under $5K', '$35K+', '$40K+', '$45K+', '$50K+', '$60K+'][i],
      image: `https://via.placeholder.com/150x100/${i % 2 === 0 ? '00FFA9' : '935eef'}/000000?text=$${i + 1}K`,
      count: `${Math.floor(Math.random() * 200) + 50}`
    })),
    Brand: Array.from({ length: 12 }, (_, i) => ({
      id: i + 1,
      name: ['Toyota', 'Honda', 'Suzuki', 'BMW', 'Mercedes', 'Audi', 'Ford', 'Chevrolet', 'Nissan', 'Hyundai', 'Kia', 'Mitsubishi'][i],
      image: `https://via.placeholder.com/150x100/${i % 3 === 0 ? '935eef' : i % 3 === 1 ? '00FFA9' : '2bd6a8'}/ffffff?text=${['Toyota', 'Honda', 'Suzuki', 'BMW', 'Mercedes', 'Audi', 'Ford', 'Chevrolet', 'Nissan', 'Hyundai', 'Kia', 'Mitsubishi'][i]}`,
      count: `${Math.floor(Math.random() * 300) + 100}`
    })),
    Model: Array.from({ length: 12 }, (_, i) => ({
      id: i + 1,
      name: ['Corolla', 'Civic', 'Alto', 'City', 'Cultus', 'Mehran', 'X5', 'C-Class', 'A4', 'Swift', 'Vitz', 'Prius'][i],
      image: `https://via.placeholder.com/150x100/${i % 2 === 0 ? '2bd6a8' : '935eef'}/ffffff?text=${['Corolla', 'Civic', 'Alto', 'City', 'Cultus', 'Mehran', 'X5', 'C-Class', 'A4', 'Swift', 'Vitz', 'Prius'][i]}`,
      count: `${Math.floor(Math.random() * 150) + 50}`
    })),
    BodyType: Array.from({ length: 12 }, (_, i) => ({
      id: i + 1,
      name: ['Sedan', 'SUV', 'Hatchback', 'Coupe', 'Convertible', 'Wagon', 'Minivan', 'Pickup', 'Crossover', 'Compact', 'Midsize', 'Fullsize'][i],
      image: `https://via.placeholder.com/150x100/${i % 2 === 0 ? '00FFA9' : '2bd6a8'}/000000?text=${['Sedan', 'SUV', 'Hatchback', 'Coupe', 'Convertible', 'Wagon', 'Minivan', 'Pickup', 'Crossover', 'Compact', 'Midsize', 'Fullsize'][i]}`,
      count: `${Math.floor(Math.random() * 250) + 50}`
    }))
  };

  const currentTabData = tabData[activeTab] || [];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header with Your Gradient */}
      <header 
        className="relative pt-6 pb-16 w-full"
        style={{ 
          background: colors.gradient,
        }}
      >
        <div className="w-full px-4 max-w-7xl mx-auto">
          {/* Logo and Notification Section */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 flex items-center justify-center">
                <img 
                  src="/loginemov.png" 
                  alt="Emov Logo" 
                  className="w-full h-full object-contain"
                />
              </div>
              <div className="h-8">
                <img 
                  src="/emovfont.png" 
                  alt="Emov" 
                  className="h-full w-auto"
                />
              </div>
            </div>
            
            <div className="relative">
              <button className="text-white hover:text-gray-200 focus:outline-none">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                </svg>
                <span className="absolute top-0 right-0 inline-flex items-center justify-center h-4 w-4 rounded-full bg-red-500 text-white text-xs font-medium">
                  3
                </span>
              </button>
            </div>
          </div>

          {/* Hero Text */}
          <div className="text-center mb-8">
            <h1 className="text-2xl md:text-3xl font-bold text-white mb-3">
              Find Used Commercial Vehicles
            </h1>
            <p className="text-blue-100">
              Thousands of vehicles. One that fits you.
            </p>
          </div>

          {/* Search Bar */}
          <div className="max-w-2xl mx-auto">
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <FaSearch className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="text"
                className="w-full pl-12 pr-14 py-3 bg-white rounded-lg shadow-lg border-0 focus:ring-2 focus:ring-purple-500 text-base"
                placeholder="Search for vehicles..."
              />
              <button className="absolute inset-y-0 right-0 pr-4 flex items-center focus:outline-none">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400 hover:text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="w-full px-4 max-w-7xl mx-auto -mt-8 relative z-10">
        {/* Browse Used Cars Section - No Horizontal Scroll */}
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-8 w-full border border-gray-100">
          <h2 className="text-2xl font-bold text-gray-800 mb-6">Browse Used Cars</h2>
          
          {/* Enhanced Tabs */}
          <div className="flex space-x-1 mb-8 bg-gray-50 rounded-xl p-1">
            {['Category', 'Budget', 'Brand', 'Model', 'BodyType'].map((tab) => (
              <button
                key={tab}
                className={`flex-1 px-4 py-3 text-sm font-semibold rounded-lg transition-all duration-300 ${
                  activeTab === tab
                    ? 'bg-white text-purple-600 shadow-md'
                    : 'text-gray-600 hover:text-purple-600 hover:bg-white'
                }`}
                onClick={() => setActiveTab(tab)}
                style={{
                  backgroundColor: activeTab === tab ? 'white' : 'transparent',
                  color: activeTab === tab ? colors.purple : '#4B5563'
                }}
              >
                {tab}
              </button>
            ))}
          </div>

          {/* Tab Content - Grid Layout (No Horizontal Scroll) */}
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4 py-2">
            {currentTabData.slice(0, 12).map((item) => (
              <div 
                key={item.id}
                className="bg-white border border-gray-200 rounded-xl overflow-hidden hover:shadow-lg transition-all duration-300 cursor-pointer transform hover:-translate-y-1"
              >
                <div className="h-20 bg-gradient-to-br from-purple-100 to-green-50">
                  <img 
                    src={item.image} 
                    alt={item.name}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="p-3">
                  <h3 className="text-xs font-semibold text-gray-800 mb-1 truncate">{item.name}</h3>
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-gray-500">{item.count}</span>
                    <button 
                      className="text-xs font-medium px-2 py-1 rounded-full transition-colors"
                      style={{ 
                        backgroundColor: `${colors.purple}15`,
                        color: colors.purple
                      }}
                    >
                      View
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Vehicle Categories Section - Two Lines Layout */}
        <div className="mb-8 w-full">
          <h2 className="text-2xl font-bold text-gray-800 mb-6">Browse Used Vehicles</h2>
          
          {/* First Row of Categories */}
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 mb-4">
            {categories.slice(0, 5).map((category, index) => (
              <div 
                key={index}
                className="bg-white rounded-2xl border border-gray-200 p-6 text-center cursor-pointer hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1"
                style={{ borderColor: colors.purple + '20' }}
              >
                <div 
                  className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4 transition-all duration-300"
                  style={{ 
                    backgroundColor: `${colors.purple}15`,
                    color: colors.purple
                  }}
                >
                  {category.icon}
                </div>
                <span className="text-sm font-semibold text-gray-800">{category.name}</span>
              </div>
            ))}
          </div>

          {/* Second Row of Categories */}
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {categories.slice(5, 8).map((category, index) => (
              <div 
                key={index + 5}
                className="bg-white rounded-2xl border border-gray-200 p-6 text-center cursor-pointer hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1"
                style={{ borderColor: colors.purple + '20' }}
              >
                <div 
                  className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4 transition-all duration-300"
                  style={{ 
                    backgroundColor: `${colors.purple}15`,
                    color: colors.purple
                  }}
                >
                  {category.icon}
                </div>
                <span className="text-sm font-semibold text-gray-800">{category.name}</span>
              </div>
            ))}
            {/* Add empty divs to maintain grid alignment */}
            <div className="hidden lg:block"></div>
            <div className="hidden lg:block"></div>
          </div>
        </div>

        {/* Browse Used Vehicles Section */}
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-8 w-full border border-gray-100">
          <h2 className="text-2xl font-bold text-gray-800 mb-6">Browse Used Vehicles</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              {
                type: "Sedan",
                budget: ["$5,000+", "$5,000-$10,000"],
                brand: "Toyota",
                models: ["Toyota Corolla", "Corolla Compact", "Compact"]
              },
              {
                type: "SUV",
                budget: ["$10,000+", "$10,000-$15,000"],
                brand: "Honda",
                models: ["Honda Civic", "Civic Midsize", "Midsize"]
              },
              {
                type: "Hatchback",
                budget: ["$15,000+", "$15,000-$20,000"],
                brand: "Suzuki",
                models: ["Suzuki Alto", "Alto Fullsize", "Fullsize"]
              },
              {
                type: "Coupe",
                budget: ["$20,000+", "$20,000+"],
                brand: "BMW",
                models: ["BMW X5", "X5 Luxury", "Luxury"]
              }
            ].map((vehicle, index) => (
              <div 
                key={index} 
                className="border border-gray-200 rounded-2xl p-6 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1"
                style={{ borderColor: colors.purple + '20' }}
              >
                <div className="mb-4">
                  <h3 className="font-bold text-gray-800 text-lg mb-3" style={{ color: colors.purple }}>{vehicle.type}</h3>
                  <div className="space-y-2">
                    {vehicle.budget.map((budget, idx) => (
                      <div key={idx} className="text-sm text-gray-600 hover:text-purple-600 cursor-pointer transition-colors">
                        {budget}
                      </div>
                    ))}
                  </div>
                </div>
                
                <div className="mb-4">
                  <h4 className="font-semibold text-gray-700 text-sm mb-2">Brand</h4>
                  <div className="text-sm text-gray-600 hover:text-purple-600 cursor-pointer transition-colors">
                    {vehicle.brand}
                  </div>
                </div>
                
                <div>
                  <h4 className="font-semibold text-gray-700 text-sm mb-2">Models</h4>
                  <div className="space-y-2">
                    {vehicle.models.map((model, idx) => (
                      <div key={idx} className="text-sm text-gray-600 hover:text-purple-600 cursor-pointer transition-colors">
                        {model}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Recently Added Section */}
        <div className="mb-8 w-full">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-gray-800">Recently Added</h2>
            <button 
              className="flex items-center text-sm font-semibold transition-colors"
              style={{ color: colors.purple }}
            >
              View All
              <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {featuredVehicles.map((vehicle) => (
              <div 
                key={vehicle.id} 
                className="bg-white rounded-2xl overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-500 transform hover:-translate-y-2 border border-gray-200"
              >
                <div className="h-48 bg-gradient-to-br from-purple-50 to-green-50 relative overflow-hidden">
                  <img 
                    src={vehicle.image} 
                    alt={vehicle.title}
                    className="w-full h-full object-cover transition-transform duration-500 hover:scale-105"
                  />
                  <div 
                    className="absolute top-4 right-4 px-3 py-1 rounded-full text-xs font-semibold text-white"
                    style={{ backgroundColor: colors.purple }}
                  >
                    New
                  </div>
                </div>
                <div className="p-6">
                  <div className="flex justify-between items-start mb-3">
                    <h3 className="text-lg font-bold text-gray-800">{vehicle.title}</h3>
                    <span 
                      className="text-lg font-bold"
                      style={{ color: colors.purple }}
                    >
                      {vehicle.price}
                    </span>
                  </div>
                  <div className="flex items-center text-sm text-gray-500 space-x-2 mb-4">
                    <span>{vehicle.year}</span>
                    <span>•</span>
                    <span>{vehicle.mileage}</span>
                    <span>•</span>
                    <span>{vehicle.fuel}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-500">{vehicle.location}</span>
                    <button 
                      className="text-sm font-semibold px-4 py-2 rounded-lg transition-all duration-300 hover:shadow-lg"
                      style={{ 
                        backgroundColor: colors.purple,
                        color: 'white'
                      }}
                    >
                      View Details
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Sell Your Vehicle Section */}
        <div 
          className="rounded-2xl p-8 text-white mb-8 overflow-hidden relative w-full"
          style={{ 
            background: colors.gradient,
          }}
        >
          <div className="relative z-10 text-center">
            <h2 className="text-2xl md:text-3xl font-bold mb-4">Sell Your Vehicle with Confidence</h2>
            <p className="text-blue-100 mb-6 text-lg">
              List your vehicle for free and reach thousands of buyers
            </p>
            <button 
              className="bg-white px-8 py-3 rounded-xl font-semibold transition-all duration-300 transform hover:scale-105 hover:shadow-2xl"
              style={{ color: colors.purple }}
            >
              Post Free Ad Now
            </button>
          </div>
          <div className="absolute -bottom-10 -right-10 w-40 h-40 bg-white rounded-full opacity-10"></div>
          <div className="absolute -top-10 -left-10 w-32 h-32 bg-white rounded-full opacity-10"></div>
        </div>
      </main>

      {/* Enhanced Footer with Same Images as Header */}
      <footer className="bg-gray-900 text-white py-12 w-full">
        <div className="container mx-auto px-4 max-w-7xl">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8">
            <div className="mb-6 md:mb-0">
              <div className="flex items-center space-x-3 mb-4">
                <div className="w-12 h-12 flex items-center justify-center">
                  <img 
                    src="/loginemov.png" 
                    alt="Emov Logo" 
                    className="w-full h-full object-contain"
                  />
                </div>
                <div className="h-8">
                  <img 
                    src="/emovfont.png" 
                    alt="Emov" 
                    className="h-full w-auto"
                  />
                </div>
              </div>
              <p className="text-gray-400">Find your next vehicle with confidence</p>
            </div>
            <div className="grid grid-cols-2 md:flex gap-12">
              {['Company', 'Support', 'Legal'].map((section) => (
                <div key={section}>
                  <h3 className="font-bold mb-4" style={{ color: colors.green }}>{section}</h3>
                  <ul className="space-y-3">
                    {['About Us', 'Careers', 'Blog'].map((item) => (
                      <li key={item}>
                        <a href="#" className="text-gray-400 hover:text-white transition-colors">
                          {item}
                        </a>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>
          <div className="pt-8 border-t border-gray-700">
            <div className="flex flex-col md:flex-row justify-between items-center">
              <p className="text-gray-400 mb-4 md:mb-0">
                © {new Date().getFullYear()} Emov. All rights reserved.
              </p>
              <div className="flex space-x-6">
                {['Facebook', 'Twitter', 'Instagram'].map((social) => (
                  <a 
                    key={social} 
                    href="#" 
                    className="text-gray-400 hover:text-white transition-colors"
                  >
                    {social}
                  </a>
                ))}
              </div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Dashboard;