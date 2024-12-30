import React from 'react';
import { useNavigate } from 'react-router-dom';

const Home = () => {
  const navigate = useNavigate();

  const analysisButtons = [
    { title: 'User Analysis', path: '/user-analysis', color: 'bg-blue-500' },
    { title: 'Role Analysis', path: '/role-analysis', color: 'bg-green-500' },
    { title: 'User and Role Analysis', path: '/combined-analysis', color: 'bg-purple-500' },
    { title: 'Recommendations', path: '/recommendations', color: 'bg-orange-500' }
  ];

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-center mb-12">Analytics Dashboard</h1>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {analysisButtons.map((button) => (
            <button
              key={button.path}
              onClick={() => navigate(button.path)}
              className={`${button.color} hover:opacity-90 text-white p-8 rounded-lg shadow-lg 
                         transition-transform transform hover:scale-105`}
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