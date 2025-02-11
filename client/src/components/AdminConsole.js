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
      combinedAnalysis: false
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
    permissions: {
      audit: {
        enabled: false,
        userAnalysis: false,
        roleRiskAnalysis: false,
        userRoleAnalysis: false,
        roleAuthReview: false,
        recommendations: false
      },
      userAccessReview: false,
      dashboard: true
    }
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
      const userData = {
        username: newUser.username,
        email: newUser.email,
        password: newUser.password,
        role: newUser.role,
        permissions: {
          audit: {
            enabled: false,
            userAnalysis: false,
            roleAnalysis: false,
            combinedAnalysis: false
          },
          userAccessReview: false,
          dashboard: true
        }
      };

      console.log('Sending user data:', userData);

      const response = await fetch('http://localhost:8001/users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(userData)
      });

      console.log('Response status:', response.status); // Debug log

      if (response.ok) {
        const createdUser = await response.json();
        console.log('Server response:', createdUser); // Debug log
        setUsers(prev => [...prev, createdUser]);
        // Reset form
        setNewUser({
          username: '',
          email: '',
          password: '',
          role: 'user',
          permissions: {
            audit: {
              enabled: false,
              userAnalysis: false,
              roleAnalysis: false,
              combinedAnalysis: false
            },
            userAccessReview: false,
            dashboard: true
          }
        });
        alert('User created successfully!');
      } else {
        const errorData = await response.json();
        console.error('Server error:', errorData); // Debug log
        throw new Error(errorData.error || 'Failed to create user');
      }
    } catch (error) {
      console.error('Error creating user:', error);
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
          combinedAnalysis: user.permissions?.audit?.combinedAnalysis || false
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
              <div className="permission-group">
                <label>
                  <input
                    type="checkbox"
                    checked={newUser.permissions.audit.enabled}
                    onChange={(e) => setNewUser({
                      ...newUser,
                      permissions: {
                        ...newUser.permissions,
                        audit: {
                          ...newUser.permissions.audit,
                          enabled: e.target.checked
                        }
                      }
                    })}
                  />
                  Audit
                </label>
                
                {newUser.permissions.audit.enabled && (
                  <div className="audit-sub-permissions">
                    <label>
                      <input
                        type="checkbox"
                        checked={newUser.permissions.audit.userAnalysis}
                        onChange={(e) => setNewUser({
                          ...newUser,
                          permissions: {
                            ...newUser.permissions,
                            audit: {
                              ...newUser.permissions.audit,
                              userAnalysis: e.target.checked
                            }
                          }
                        })}
                      />
                      User Analysis
                    </label>
                    
                    <label>
                      <input
                        type="checkbox"
                        checked={newUser.permissions.audit.roleRiskAnalysis}
                        onChange={(e) => setNewUser({
                          ...newUser,
                          permissions: {
                            ...newUser.permissions,
                            audit: {
                              ...newUser.permissions.audit,
                              roleRiskAnalysis: e.target.checked
                            }
                          }
                        })}
                      />
                      Role Risk Analysis
                    </label>
                    
                    <label>
                      <input
                        type="checkbox"
                        checked={newUser.permissions.audit.userRoleAnalysis}
                        onChange={(e) => setNewUser({
                          ...newUser,
                          permissions: {
                            ...newUser.permissions,
                            audit: {
                              ...newUser.permissions.audit,
                              userRoleAnalysis: e.target.checked
                            }
                          }
                        })}
                      />
                      User and Role Analysis
                    </label>

                    <label>
                      <input
                        type="checkbox"
                        checked={newUser.permissions.audit.roleAuthReview}
                        onChange={(e) => setNewUser({
                          ...newUser,
                          permissions: {
                            ...newUser.permissions,
                            audit: {
                              ...newUser.permissions.audit,
                              roleAuthReview: e.target.checked
                            }
                          }
                        })}
                      />
                      Role Authorization Review
                    </label>

                    <label>
                      <input
                        type="checkbox"
                        checked={newUser.permissions.audit.recommendations}
                        onChange={(e) => setNewUser({
                          ...newUser,
                          permissions: {
                            ...newUser.permissions,
                            audit: {
                              ...newUser.permissions.audit,
                              recommendations: e.target.checked
                            }
                          }
                        })}
                      />
                      Recommendations
                    </label>
                  </div>
                )}
              </div>

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
                  <th className="p-2">Email</th>
                  <th className="p-2">Dashboard</th>
                  <th className="p-2">Audit</th>
                  <th className="p-2">User Analysis</th>
                  <th className="p-2">Role Risk Analysis</th>
                  <th className="p-2">User and Role Analysis</th>
                  <th className="p-2">Role Authorization Review</th>
                  <th className="p-2">Recommendations</th>
                  <th className="p-2">User Access Review</th>
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
                          type="email"
                          placeholder="New email"
                          value={editForm.email}
                          onChange={(e) => setEditForm({
                            ...editForm,
                            email: e.target.value
                          })}
                          className="w-full"
                        />
                      ) : (
                        user.email
                      )}
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
                        checked={user.permissions?.audit?.roleRiskAnalysis || false}
                        onCheckedChange={(checked) => 
                          handlePermissionChange(user.id, 'audit.roleRiskAnalysis', checked)
                        }
                        disabled={!user.permissions?.audit?.enabled}
                      />
                    </td>
                    <td className="p-2">
                      <Switch
                        checked={user.permissions?.audit?.userRoleAnalysis || false}
                        onCheckedChange={(checked) => 
                          handlePermissionChange(user.id, 'audit.userRoleAnalysis', checked)
                        }
                        disabled={!user.permissions?.audit?.enabled}
                      />
                    </td>
                    <td className="p-2">
                      <Switch
                        checked={user.permissions?.audit?.roleAuthReview || false}
                        onCheckedChange={(checked) => 
                          handlePermissionChange(user.id, 'audit.roleAuthReview', checked)
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