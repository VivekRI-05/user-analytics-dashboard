import React from 'react';
import { useNavigate } from 'react-router-dom';

const Home = () => {
  const navigate = useNavigate();

  const analysisButtons = [
    { title: 'User Analysis', path: '/user-analysis', color: 'bg-[#1B365D]' },
    { title: 'Role Analysis', path: '/role-analysis', color: 'bg-[#3B5998]' },
    { title: 'User and Role Analysis', path: '/combined-analysis', color: 'bg-[#5B7BA5]' },
    { title: 'Recommendations', path: '/recommendations', color: 'bg-[#7B9CC2]' }
  ];

  return (
    <div className="min-h-screen bg-[#C2C8CC] p-8">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <img 
            src="/rinexis-logo.png" 
            alt="Rinexis Logo" 
            className="mx-auto w-48 h-48 mb-4"
          />
          <h1 className="text-4xl font-bold text-[#1B365D] mb-2">Rinexis</h1>
          <p className="text-xl text-[#3B5998] italic">
            Re-invent, Innovate and Explore
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-12">
          {analysisButtons.map((button) => (
            <button
              key={button.path}
              onClick={() => navigate(button.path)}
              className={`${button.color} hover:opacity-90 text-white p-8 rounded-lg shadow-lg 
                         transition-transform transform hover:scale-105
                         border-2 border-white`}
            >
              <h2 className="text-xl font-semibold">{button.title}</h2>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Home; 