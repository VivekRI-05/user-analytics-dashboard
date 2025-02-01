import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { ChevronDown, ChevronRight } from 'lucide-react';
import rinexisLogo from '../images/rinexis-logo.png';

const menuItems = [
  {
    title: 'Dashboard',
    path: '/dashboard'
  },
  {
    title: 'Audit',
    submenu: [
      {
        title: 'User Analysis',
        path: '/user-analysis',
        icon: 'analysis-icon',
        name: 'user-analysis'
      },
      {
        title: 'Role Risk Analysis',
        path: '/role-analysis',
        icon: 'risk-icon',
        name: 'role-risk-analysis'
      },
      {
        title: 'User and Role Analysis',
        path: '/combined-analysis',
        icon: 'combined-icon',
        name: 'combined-analysis'
      },
      {
        title: 'Role Authorization Review',
        path: '/role-authorization-review',
        icon: 'authorization-icon',
        name: 'role-authorization-review'
      },
      {
        title: 'Recommendations',
        path: '/recommendations',
        icon: 'recommendations-icon',
        name: 'recommendations'
      }
    ]
  },
  {
    title: 'User Access Review',
    path: '/user-access-review'
  },
  {
    title: 'Administration',
    path: '/admin'
  }
];

const Layout = ({ children }) => {
  console.log('Layout rendering, children:', children); // Debug log
  const navigate = useNavigate();
  const location = useLocation();
  const [openMenus, setOpenMenus] = React.useState(['audit']);

  console.log('Layout rendering, pathname:', location.pathname);

  const isAdmin = () => localStorage.getItem('userRole') === 'admin';
  
  const getUserPermissions = () => {
    try {
      return JSON.parse(localStorage.getItem('userPermissions') || '{}');
    } catch (error) {
      console.error('Error parsing permissions:', error);
      return {};
    }
  };

  const hasPermission = (path) => {
    if (isAdmin()) return true;
    const permissions = getUserPermissions();
    console.log('Checking permissions for path:', path, 'Permissions:', permissions); // Debug log

    if (path.startsWith('/user-analysis')) return permissions?.audit?.userAnalysis;
    if (path.startsWith('/role-analysis')) return permissions?.audit?.roleAnalysis;
    if (path.startsWith('/combined-analysis')) return permissions?.audit?.combinedAnalysis;
    if (path.startsWith('/recommendations')) return permissions?.audit?.recommendations;
    if (path.startsWith('/user-access-review')) return permissions?.userAccessReview;
    if (path.startsWith('/super-user-access')) return permissions?.superUserAccess;
    if (path.startsWith('/dashboard')) return permissions?.dashboard;
    return false;
  };

  // Filter menu items based on permissions
  const filteredMenuItems = menuItems.filter(item => {
    if (item.adminOnly) return isAdmin();
    if (item.submenu) {
      const hasPermittedSubItems = item.submenu.some(subItem => hasPermission(subItem.path));
      return hasPermittedSubItems;
    }
    return hasPermission(item.path);
  });

  const handleLogout = () => {
    localStorage.removeItem('isAuthenticated');
    navigate('/login');
  };

  return (
    <div className="flex h-screen bg-gray-100">
      {/* Sidebar */}
      <div className="w-64 bg-[#1B365D] text-white min-h-screen">
        <div 
          className="p-4 cursor-pointer hover:bg-[#2B466D] transition-colors"
          onClick={() => navigate('/dashboard')}
        >
          <h1 className="text-xl font-bold text-white flex items-center">
            <span>Rinexis</span>
            <svg 
              className="w-4 h-4 ml-2" 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                strokeWidth={2} 
                d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" 
              />
            </svg>
          </h1>
        </div>
        
        <nav className="mt-4">
          {filteredMenuItems.map((item) => (
            <div key={item.title}>
              <div 
                className="px-4 py-2 hover:bg-[#3B5998] cursor-pointer"
                onClick={() => {
                  if (item.submenu) {
                    setOpenMenus(prev => 
                      prev.includes(item.title) 
                        ? prev.filter(m => m !== item.title)
                        : [...prev, item.title]
                    );
                  } else {
                    navigate(item.path);
                  }
                }}
              >
                {item.title}
              </div>
              
              {item.submenu && openMenus.includes(item.title) && (
                <div className="bg-[#2B466D]">
                  {item.submenu.map((subItem) => (
                    <div
                      key={subItem.title}
                      className="px-8 py-2 hover:bg-[#3B5998] cursor-pointer"
                      onClick={() => navigate(subItem.path)}
                    >
                      {subItem.title}
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </nav>

        {/* Logout Button */}
        <div className="absolute bottom-0 w-64 p-4">
          <button
            onClick={handleLogout}
            className="w-full bg-red-600 text-white py-2 px-4 rounded hover:bg-red-700"
          >
            Logout
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 p-8 overflow-auto">
        <div className="bg-white rounded-lg shadow p-6">
          {children}
        </div>
      </div>
    </div>
  );
};

export default Layout; 