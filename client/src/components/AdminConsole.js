import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Input } from './ui/input';
import { Button } from './ui/button';
import { Switch } from './ui/switch';
import { PlusCircle, Save, Trash2, Edit, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const API_URL = 'http://localhost:8001';

const AdminConsole = () => {
  const navigate = useNavigate();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingUser, setEditingUser] = useState(null);
  const [editForm, setEditForm] = useState({
    username: '',
    password: ''
  });

  const defaultPermissions = {
    audit: {
      enabled: false,
      userAnalysis: false,
      roleAnalysis: false,
      combinedAnalysis: false,
      recommendations: false
    },
    userAccessReview: false,
    dashboard: true
  };

  // Fetch users on component mount
  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const response = await fetch(`${API_URL}/users`);
      const data = await response.json();
      // Ensure each user has the correct permission structure
      const structuredUsers = data.map(user => ensurePermissionStructure(user));
      setUsers(structuredUsers);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching users:', error);
      setLoading(false);
    }
  };

  const [newUser, setNewUser] = useState({
    username: '',
    email: '',
    password: '',
    role: 'user',
    permissions: defaultPermissions
  });

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setNewUser(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handlePermissionToggle = (permission) => {
    if (permission.includes('.')) {
      // Handle nested permissions (audit.*)
      const [category, specific] = permission.split('.');
      setNewUser(prev => ({
        ...prev,
        permissions: {
          ...prev.permissions,
          [category]: {
            ...prev.permissions[category],
            [specific]: !prev.permissions[category][specific]
          }
        }
      }));
    } else {
      // Handle top-level permissions
      setNewUser(prev => ({
        ...prev,
        permissions: {
          ...prev.permissions,
          [permission]: !prev.permissions[permission]
        }
      }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const userDataToSubmit = ensurePermissionStructure(newUser);
      console.log('Attempting to create user:', userDataToSubmit);

      const response = await fetch('http://localhost:8001/users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify(userDataToSubmit)
      });

      if (response.ok) {
        const createdUser = await response.json();
        setUsers([...users, ensurePermissionStructure(createdUser)]);
        setNewUser({
          username: '',
          email: '',
          password: '',
          role: 'user',
          permissions: defaultPermissions
        });
        alert('User created successfully!');
      } else {
        const errorData = await response.text();
        throw new Error(`Server error: ${errorData}`);
      }
    } catch (error) {
      console.error('Detailed error:', error);
      alert(`Error creating user: ${error.message}`);
    }
  };

  const handleDeleteUser = async (userId) => {
    if (window.confirm('Are you sure you want to delete this user?')) {
      try {
        const response = await fetch(`${API_URL}/users/${userId}`, {
          method: 'DELETE',
        });

        if (!response.ok) throw new Error('Failed to delete user');

        setUsers(users.filter(user => user.id !== userId));
        alert('User deleted successfully!');
      } catch (error) {
        console.error('Error deleting user:', error);
        alert('Failed to delete user');
      }
    }
  };

  const handleSaveUser = async (userId) => {
    const userToSave = users.find(user => user.id === userId);
    if (userToSave) {
      try {
        // Create a complete user object with all required fields
        const updatedUserData = {
          ...userToSave,
          lastSaved: new Date().toISOString(),
          hasUnsavedChanges: false // Reset the unsaved changes flag
        };

        const response = await fetch(`${API_URL}/users/${userId}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(updatedUserData),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message || 'Failed to save user');
        }

        const savedUser = await response.json();
        setUsers(users.map(user => 
          user.id === userId ? savedUser : user
        ));
        alert('User settings saved successfully!');
      } catch (error) {
        console.error('Error saving user:', error);
        alert(`Failed to save user settings: ${error.message}`);
      }
    }
  };

  const handlePermissionChange = (userId, path, value) => {
    setUsers(users.map(user => {
      if (user.id === userId) {
        const updatedPermissions = updatePermissionPath({...user.permissions}, path, value);
        return {
          ...user,
          permissions: updatedPermissions,
          hasUnsavedChanges: true
        };
      }
      return user;
    }));
  };

  const updatePermissionPath = (permissions, path, value) => {
    const pathArray = path.split('.');
    const newPermissions = { ...permissions };
    let current = newPermissions;
    
    for (let i = 0; i < pathArray.length - 1; i++) {
      current = current[pathArray[i]];
    }
    
    current[pathArray[pathArray.length - 1]] = value;
    return newPermissions;
  };

  const handleEditClick = (user) => {
    setEditingUser(user);
    setEditForm({
      username: user.username,
      password: '' // Leave password empty initially
    });
  };

  const handleCancelEdit = () => {
    setEditingUser(null);
    setEditForm({ username: '', password: '' });
  };

  const handleUpdateUser = async (userId) => {
    try {
      // Check for duplicate username (excluding current user)
      const isDuplicate = users.some(user => 
        user.id !== userId && 
        user.username.toLowerCase() === editForm.username.toLowerCase()
      );

      if (isDuplicate) {
        alert('Username already exists');
        return;
      }

      const updatedUserData = {
        ...editingUser,
        username: editForm.username,
        ...(editForm.password && { password: editForm.password }),
        lastSaved: new Date().toISOString()
      };

      const response = await fetch(`${API_URL}/users/${userId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updatedUserData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to update user');
      }

      const savedUser = await response.json();
      setUsers(users.map(user => 
        user.id === userId ? savedUser : user
      ));
      setEditingUser(null);
      setEditForm({ username: '', password: '' });
      alert('User updated successfully!');
    } catch (error) {
      console.error('Error updating user:', error);
      alert(`Failed to update user: ${error.message}`);
    }
  };

  const ensurePermissionStructure = (user) => {
    return {
      ...user,
      permissions: {
        audit: {
          enabled: user.permissions?.audit?.enabled || false,
          userAnalysis: user.permissions?.audit?.userAnalysis || false,
          roleAnalysis: user.permissions?.audit?.roleAnalysis || false,
          combinedAnalysis: user.permissions?.audit?.combinedAnalysis || false,
          recommendations: user.permissions?.audit?.recommendations || false
        },
        userAccessReview: user.permissions?.userAccessReview || false,
        dashboard: true
      }
    };
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-[#1B365D]">Administration</h1>
        <button
          onClick={() => navigate('/dashboard')}
          className="flex items-center px-4 py-2 text-sm font-medium text-gray-600 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
        >
          <svg 
            className="w-5 h-5 mr-2" 
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24"
          >
            <path 
              strokeLinecap="round" 
              strokeLinejoin="round" 
              strokeWidth={2} 
              d="M10 19l-7-7m0 0l7-7m-7 7h18" 
            />
          </svg>
          Back to Home
        </button>
      </div>

      <div className="bg-white p-6 rounded-lg shadow">
        <h2 className="text-lg font-semibold mb-4">Create New User</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Username</label>
            <input
              type="text"
              name="username"
              value={newUser.username}
              onChange={handleInputChange}
              required
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Email</label>
            <input
              type="email"
              name="email"
              value={newUser.email}
              onChange={handleInputChange}
              required
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Password</label>
            <input
              type="password"
              name="password"
              value={newUser.password}
              onChange={handleInputChange}
              required
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Role</label>
            <select
              name="role"
              value={newUser.role}
              onChange={handleInputChange}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            >
              <option value="user">User</option>
              <option value="admin">Admin</option>
            </select>
          </div>

          <div>
            <h3 className="text-sm font-medium text-gray-700 mb-2">Permissions</h3>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span>Audit Access</span>
                <Switch
                  checked={newUser.permissions.audit.enabled}
                  onCheckedChange={(checked) => handlePermissionToggle('audit.enabled')}
                />
              </div>
              
              {/* Only show these if audit is enabled */}
              {newUser.permissions.audit.enabled && (
                <>
                  <div className="flex items-center justify-between pl-4">
                    <span>User Analysis</span>
                    <Switch
                      checked={newUser.permissions.audit.userAnalysis}
                      onCheckedChange={(checked) => handlePermissionToggle('audit.userAnalysis')}
                    />
                  </div>
                  <div className="flex items-center justify-between pl-4">
                    <span>Role Analysis</span>
                    <Switch
                      checked={newUser.permissions.audit.roleAnalysis}
                      onCheckedChange={(checked) => handlePermissionToggle('audit.roleAnalysis')}
                    />
                  </div>
                  <div className="flex items-center justify-between pl-4">
                    <span>Combined Analysis</span>
                    <Switch
                      checked={newUser.permissions.audit.combinedAnalysis}
                      onCheckedChange={(checked) => handlePermissionToggle('audit.combinedAnalysis')}
                    />
                  </div>
                  <div className="flex items-center justify-between pl-4">
                    <span>Recommendations</span>
                    <Switch
                      checked={newUser.permissions.audit.recommendations}
                      onCheckedChange={(checked) => handlePermissionToggle('audit.recommendations')}
                    />
                  </div>
                </>
              )}

              <div className="flex items-center justify-between">
                <span>User Access Review</span>
                <Switch
                  checked={newUser.permissions.userAccessReview}
                  onCheckedChange={(checked) => handlePermissionToggle('userAccessReview')}
                />
              </div>
            </div>
          </div>

          <button
            type="submit"
            className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          >
            Create User
          </button>
        </form>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-2xl font-bold">User Management</CardTitle>
        </CardHeader>
        <CardContent>
          {/* Users List */}
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="text-left bg-gray-50">
                  <th className="p-2">Username</th>
                  <th className="p-2">Password</th>
                  <th className="p-2">Audit</th>
                  <th className="p-2">User Analysis</th>
                  <th className="p-2">Role Analysis</th>
                  <th className="p-2">Combined Analysis</th>
                  <th className="p-2">Recommendations</th>
                  <th className="p-2">User Access Review</th>
                  <th className="p-2">SOR Review</th>
                  <th className="p-2">Super User Access</th>
                  <th className="p-2">Dashboard</th>
                  <th className="p-2">Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map(user => (
                  <tr key={user.id} className="border-t">
                    <td className="p-2">
                      {editingUser?.id === user.id ? (
                        <Input
                          value={editForm.username}
                          onChange={(e) => setEditForm({
                            ...editForm,
                            username: e.target.value
                          })}
                          className="w-full"
                        />
                      ) : (
                        user.username
                      )}
                    </td>
                    <td className="p-2">
                      {editingUser?.id === user.id ? (
                        <Input
                          type="password"
                          placeholder="New password"
                          value={editForm.password}
                          onChange={(e) => setEditForm({
                            ...editForm,
                            password: e.target.value
                          })}
                          className="w-full"
                        />
                      ) : (
                        "••••••••"
                      )}
                    </td>
                    <td className="p-2">
                      <Switch
                        checked={user.permissions?.audit?.enabled || false}
                        onCheckedChange={(checked) => 
                          handlePermissionChange(user.id, 'audit.enabled', checked)
                        }
                      />
                    </td>
                    <td className="p-2">
                      <Switch
                        checked={user.permissions?.audit?.userAnalysis || false}
                        onCheckedChange={(checked) => 
                          handlePermissionChange(user.id, 'audit.userAnalysis', checked)
                        }
                        disabled={!user.permissions?.audit?.enabled}
                      />
                    </td>
                    <td className="p-2">
                      <Switch
                        checked={user.permissions?.audit?.roleAnalysis || false}
                        onCheckedChange={(checked) => 
                          handlePermissionChange(user.id, 'audit.roleAnalysis', checked)
                        }
                        disabled={!user.permissions?.audit?.enabled}
                      />
                    </td>
                    <td className="p-2">
                      <Switch
                        checked={user.permissions?.audit?.combinedAnalysis || false}
                        onCheckedChange={(checked) => 
                          handlePermissionChange(user.id, 'audit.combinedAnalysis', checked)
                        }
                        disabled={!user.permissions?.audit?.enabled}
                      />
                    </td>
                    <td className="p-2">
                      <Switch
                        checked={user.permissions?.audit?.recommendations || false}
                        onCheckedChange={(checked) => 
                          handlePermissionChange(user.id, 'audit.recommendations', checked)
                        }
                        disabled={!user.permissions?.audit?.enabled}
                      />
                    </td>
                    <td className="p-2">
                      <Switch
                        checked={user.permissions?.userAccessReview || false}
                        onCheckedChange={(checked) => 
                          handlePermissionChange(user.id, 'userAccessReview', checked)
                        }
                      />
                    </td>
                    <td className="p-2">
                      <Switch
                        checked={user.permissions?.sorReview || false}
                        onCheckedChange={(checked) => 
                          handlePermissionChange(user.id, 'sorReview', checked)
                        }
                      />
                    </td>
                    <td className="p-2">
                      <Switch
                        checked={user.permissions?.superUserAccess || false}
                        onCheckedChange={(checked) => 
                          handlePermissionChange(user.id, 'superUserAccess', checked)
                        }
                      />
                    </td>
                    <td className="p-2">
                      <Switch
                        checked={user.permissions?.dashboard || false}
                        onCheckedChange={(checked) => 
                          handlePermissionChange(user.id, 'dashboard', checked)
                        }
                      />
                    </td>
                    <td className="p-2">
                      <div className="flex gap-2">
                        {editingUser?.id === user.id ? (
                          <>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleUpdateUser(user.id)}
                              className="bg-green-50 hover:bg-green-100"
                            >
                              <Save className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={handleCancelEdit}
                              className="bg-gray-50 hover:bg-gray-100"
                            >
                              <X className="w-4 h-4" />
                            </Button>
                          </>
                        ) : (
                          <>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleEditClick(user)}
                              className="bg-blue-50 hover:bg-blue-100"
                            >
                              <Edit className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleSaveUser(user.id)}
                              className="bg-green-50 hover:bg-green-100"
                            >
                              <Save className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="destructive"
                              size="sm"
                              onClick={() => handleDeleteUser(user.id)}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminConsole; 