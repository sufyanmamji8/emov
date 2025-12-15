import React from 'react';
import { useNavigate } from 'react-router-dom';

const MobileBottomNav = ({ activePage }) => {
  const navigate = useNavigate();

  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-gray-200 rounded-t-3xl shadow-lg">
      <div className="flex items-center justify-around px-2 py-2">
        {/* Home */}
        <button 
          className={`flex flex-col items-center justify-center p-2 transition-colors duration-200 ${
            activePage === 'home' ? 'text-[#00C9FF]' : 'text-gray-400 hover:text-[#00C9FF]'
          }`}
          onClick={() => navigate('/dashboard')}
        >
          <svg className="w-6 h-6 mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
          </svg>
          <span className="text-xs font-medium">Home</span>
        </button>

        {/* Chats */}
        <button 
          className={`flex flex-col items-center justify-center p-2 transition-colors duration-200 ${
            activePage === 'chats' ? 'text-[#00C9FF]' : 'text-gray-400 hover:text-[#00C9FF]'
          }`}
          onClick={() => navigate('/chats')}
        >
          <svg className="w-6 h-6 mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
          </svg>
          <span className="text-xs font-medium">Chats</span>
        </button>

        {/* Sell Button - Large Centered */}
        <button 
          className="flex flex-col items-center justify-center p-1 transition-all duration-200 hover:scale-105 active:scale-95"
          onClick={() => navigate('/my-ads-list')}
          style={{
            background: 'linear-gradient(to right, #00C9FF, #92FE9D)',
            borderRadius: '50%',
            width: '56px',
            height: '56px',
            marginTop: '-20px'
          }}
        >
          <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M12 4v16m8-8H4" />
          </svg>
        </button>

        {/* My Ads */}
        <button 
          className={`flex flex-col items-center justify-center p-2 transition-colors duration-200 ${
            activePage === 'myads' ? 'text-[#00C9FF]' : 'text-gray-400 hover:text-[#00C9FF]'
          }`}
          onClick={() => navigate('/my-ads')}
        >
          <svg className="w-6 h-6 mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z" />
          </svg>
          <span className="text-xs font-medium">My Ads</span>
        </button>

        {/* More */}
        <button 
          className={`flex flex-col items-center justify-center p-2 transition-colors duration-200 ${
            activePage === 'more' ? 'text-[#00C9FF]' : 'text-gray-400 hover:text-[#00C9FF]'
          }`}
          onClick={() => navigate('/more')}
        >
          <svg className="w-6 h-6 mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
          <span className="text-xs font-medium">More</span>
        </button>
      </div>
    </div>
  );
};

export default MobileBottomNav;
