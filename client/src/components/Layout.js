import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { ChevronDown, ChevronRight } from 'lucide-react';
import rinexisLogo from '../images/rinexis-logo.png';

const Layout = ({ children }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [openMenus, setOpenMenus] = React.useState(['audit']);

  console.log('Layout rendering, pathname:', location.pathname);
  console.log('Layout children:', children);

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
    if (path.startsWith('/sor-review')) return permissions?.sorReview;
    if (path.startsWith('/super-user-access')) return permissions?.superUserAccess;
    if (path.startsWith('/dashboard')) return permissions?.dashboard;
    return false;
  };

  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', path: '/dashboard' },
    {
      id: 'audit',
      label: 'Audit',
      submenu: [
        { id: 'user-analysis', label: 'User Analysis', path: '/user-analysis' },
        { id: 'role-analysis', label: 'Role Risk Analysis', path: '/role-analysis' },
        { id: 'combined-analysis', label: 'User and Role Analysis', path: '/combined-analysis' },
        { id: 'recommendations', label: 'Recommendations', path: '/recommendations' }
      ]
    },
    { id: 'user-access', label: 'User Access Review', path: '/user-access-review' },
    { id: 'sor', label: 'SOR Review', path: '/sor-review' },
    { id: 'super-user', label: 'Super User Access', path: '/super-user-access' },
    {
      id: 'admin',
      label: 'Administration',
      path: '/admin',
      adminOnly: true
    }
  ];

  // Filter menu items based on permissions
  const filteredMenuItems = menuItems.filter(item => {
    if (item.adminOnly) return isAdmin();
    if (item.submenu) {
      const hasPermittedSubItems = item.submenu.some(subItem => hasPermission(subItem.path));
      return hasPermittedSubItems;
    }
    return hasPermission(item.path);
  });

  const toggleMenu = (menuId) => {
    setOpenMenus(prev => 
      prev.includes(menuId) 
        ? prev.filter(id => id !== menuId)
        : [...prev, menuId]
    );
  };

  const handleLogout = () => {
    localStorage.clear();
    navigate('/login');
  };

  return (
    <div className="min-h-screen w-full flex bg-gray-50">
      {/* Sidebar */}
      <div className="w-64 min-h-screen bg-[#1B365D] text-white flex-shrink-0">
        <div 
          className="p-4 border-b border-gray-700 cursor-pointer" 
          onClick={() => navigate('/dashboard')}
        >
          <img 
            src={rinexisLogo} 
            alt="Rinexis Logo" 
            className="h-8 w-auto hover:opacity-80 transition-opacity" 
          />
        </div>
        <nav className="mt-4">
          {filteredMenuItems.map(item => {
            return (
              <div key={item.id}>
                {item.submenu ? (
                  <div>
                    <button
                      onClick={() => toggleMenu(item.id)}
                      className="w-full flex items-center justify-between px-4 py-2 hover:bg-[#2C4B7C] transition-colors"
                    >
                      <span>{item.label}</span>
                      {openMenus.includes(item.id) ? (
                        <ChevronDown className="w-4 h-4" />
                      ) : (
                        <ChevronRight className="w-4 h-4" />
                      )}
                    </button>
                    {openMenus.includes(item.id) && (
                      <div className="bg-[#2C4B7C]">
                        {item.submenu.map(subItem => {
                          if (!hasPermission(subItem.path)) return null;
                          return (
                            <button
                              key={subItem.id}
                              onClick={() => navigate(subItem.path)}
                              className={`w-full text-left px-8 py-2 hover:bg-[#3B5998] transition-colors ${
                                location.pathname === subItem.path ? 'bg-[#3B5998]' : ''
                              }`}
                            >
                              {subItem.label}
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>
                ) : (
                  <button
                    onClick={() => navigate(item.path)}
                    className={`w-full text-left px-4 py-2 hover:bg-[#2C4B7C] transition-colors ${
                      location.pathname === item.path ? 'bg-[#2C4B7C]' : ''
                    }`}
                  >
                    {item.label}
                  </button>
                )}
              </div>
            );
          })}
        </nav>
      </div>

      {/* Main content */}
      <div className="flex-1 flex flex-col min-h-screen">
        <header className="bg-white shadow-sm">
          <div className="flex items-center justify-between px-6 py-3">
            <h1 className="text-2xl font-bold text-[#1B365D]">
              Rinexis Authorization Tool
            </h1>
            <div className="flex items-center gap-4">
              <span className="text-gray-600">
                {localStorage.getItem('userId')}
              </span>
              <button
                onClick={() => {
                  localStorage.clear();
                  navigate('/login');
                }}
                className="px-4 py-2 text-gray-700 hover:text-gray-900"
              >
                Logout
              </button>
            </div>
          </div>
        </header>
        <main className="flex-1 bg-gray-100 p-6 overflow-auto">
          {children}
        </main>
      </div>
    </div>
  );
};

export default Layout; 