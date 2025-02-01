import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from './ui/button';
import rinexisLogo from '../images/rinexis-logo.png';

const Home = () => {
  const navigate = useNavigate();

  const menuItems = [
    {
      title: 'Dashboard',
      // ... other dashboard properties
    },
    {
      title: 'Audit',
      submenu: [
        {
          title: 'User Analysis',
          // ... other properties
        },
        {
          title: 'Role Risk Analysis',
          path: '/components/RoleAnalytics',
          icon: 'your-icon-class',
          name: 'role-risk-analysis',
          component: 'RoleAnalytics'
        },
        {
          title: 'Role Authorization Review', // Added new submenu item
          path: '/role-authorization-review'
        },
        {
          title: 'User and Role Analysis',
          // ... existing properties
        },
        {
          title: 'Recommendations',
          // ... existing properties
        }
      ]
    },
    // ... other menu items
  ];

  const handleLogout = () => {
    localStorage.removeItem('isAuthenticated');
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-[#C2C8CC]">
      <nav className="bg-white shadow-sm p-4">
        <div className="container mx-auto flex justify-between items-center">
          <img src={rinexisLogo} alt="Rinexis Logo" className="h-12" />
          <Button onClick={handleLogout} variant="outline">
            Logout
          </Button>
        </div>
      </nav>

      <div className="max-w-4xl mx-auto p-8">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-[#1B365D] mb-2">Rinexis</h1>
          <p className="text-xl text-[#3B5998] italic">
            Re-invent, Innovate and Explore
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-12">
          {menuItems.map((item) => (
            <button
              key={item.title}
              onClick={() => navigate(item.path)}
              className={`${item.color} hover:opacity-90 text-white p-8 rounded-lg shadow-lg 
                        transition-transform transform hover:scale-105
                        border-2 border-white`}
            >
              <h2 className="text-xl font-semibold">{item.title}</h2>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Home; 