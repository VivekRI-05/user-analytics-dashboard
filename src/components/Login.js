import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Input } from './ui/input';
import { Button } from './ui/button';
import rinexisLogo from '../images/rinexis-logo.png';

const API_URL = 'http://localhost:3001';

const Login = () => {
  const [credentials, setCredentials] = useState({ userId: '', password: '' });
  const [error, setError] = useState('');
  const [showTextLogo, setShowTextLogo] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (credentials.userId === 'Admin' && credentials.password === 'Admin') {
      localStorage.setItem('isAuthenticated', 'true');
      localStorage.setItem('userId', credentials.userId);
      localStorage.setItem('userRole', 'admin');
      localStorage.setItem('userPermissions', JSON.stringify({
        audit: {
          enabled: true,
          userAnalysis: true,
          roleAnalysis: true,
          combinedAnalysis: true,
          recommendations: true
        },
        userAccessReview: true,
        sorReview: true,
        superUserAccess: true,
        dashboard: true
      }));
      navigate('/dashboard');
      return;
    }

    try {
      console.log('Attempting to log in with:', credentials.userId);
      const response = await fetch(`${API_URL}/users`);
      const users = await response.json();
      console.log('Found users:', users);
      
      const user = users.find(u => 
        u.username === credentials.userId && 
        u.password === credentials.password
      );
      
      if (user) {
        console.log('User found:', user);
        console.log('Setting permissions:', user.permissions);
        
        localStorage.setItem('isAuthenticated', 'true');
        localStorage.setItem('userId', user.username);
        localStorage.setItem('userRole', 'user');
        localStorage.setItem('userPermissions', JSON.stringify(user.permissions));
        
        // Verify the permissions were set correctly
        console.log('Stored permissions:', localStorage.getItem('userPermissions'));
        
        navigate('/dashboard');
      } else {
        console.log('No matching user found');
        setError('Invalid credentials. Please try again.');
      }
    } catch (error) {
      console.error('Login error:', error);
      setError('An error occurred during login. Please try again.');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-4 flex flex-col items-center">
          {showTextLogo ? (
            <div className="h-16 w-48 mb-4 flex items-center justify-center text-2xl font-bold text-[#003366] rounded">
              RINEXIS
            </div>
          ) : (
            <img
              src={rinexisLogo}
              alt="Rinexis Logo"
              className="h-24 w-auto mb-4"
              onError={() => setShowTextLogo(true)}
            />
          )}
          <CardTitle className="text-2xl font-bold text-center">
            Login
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="p-3 bg-red-100 border border-red-400 text-red-700 rounded">
                {error}
              </div>
            )}
            
            <div className="space-y-2">
              <label htmlFor="userId" className="text-sm font-medium">
                User ID
              </label>
              <Input
                id="userId"
                type="text"
                value={credentials.userId}
                onChange={(e) =>
                  setCredentials({ ...credentials, userId: e.target.value })
                }
                placeholder="Enter Admin as User ID"
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="password" className="text-sm font-medium">
                Password
              </label>
              <Input
                id="password"
                type="password"
                value={credentials.password}
                onChange={(e) =>
                  setCredentials({ ...credentials, password: e.target.value })
                }
                placeholder="Enter Admin as password"
              />
            </div>

            <Button type="submit" className="w-full bg-[#003366] hover:bg-[#002347]">
              Login
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default Login; 