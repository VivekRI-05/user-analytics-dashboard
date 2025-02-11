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
    
    // Admin login check - case insensitive
    if (credentials.userId.toLowerCase() === 'admin' && credentials.password === 'Admin') {
      localStorage.setItem('isAuthenticated', 'true');
      localStorage.setItem('userId', 'Admin'); // Keep original casing for display
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
      
      // Send login request to the correct endpoint
      const response = await fetch('http://localhost:8001/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username: credentials.userId,
          password: credentials.password
        })
      });

      if (!response.ok) {
        throw new Error('Invalid credentials');
      }

      const data = await response.json();
      
      if (data.success) {
        localStorage.setItem('isAuthenticated', 'true');
        localStorage.setItem('userId', data.user.username);
        localStorage.setItem('userRole', data.user.role);
        localStorage.setItem('userPermissions', JSON.stringify(data.user.permissions));
        navigate('/dashboard');
      } else {
        setError('Invalid credentials. Please try again.');
      }
    } catch (error) {
      console.error('Login error:', error);
      setError('Invalid credentials. Please try again.');
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