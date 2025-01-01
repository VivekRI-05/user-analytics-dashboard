import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Input } from './ui/input';
import { Button } from './ui/button';
import { Switch } from './ui/switch';
import { PlusCircle, Save, Trash2, Edit, X } from 'lucide-react';

const API_URL = 'http://localhost:3001';

const AdminConsole = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingUser, setEditingUser] = useState(null);
  const [editForm, setEditForm] = useState({
    username: '',
    password: ''
  });

  // Fetch users on component mount
  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const response = await fetch(`${API_URL}/users`);
      const data = await response.json();
      setUsers(data);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching users:', error);
      setLoading(false);
    }
  };

  const [newUser, setNewUser] = useState({
    username: '',
    password: '',
    permissions: {
      audit: {
        enabled: true,
        userAnalysis: false,
        roleAnalysis: false,
        combinedAnalysis: false,
        recommendations: false,
      },
      userAccessReview: false,
      sorReview: false,
      superUserAccess: false,
      dashboard: true,
    }
  });

  const handleAddUser = async () => {
    if (!newUser.username || !newUser.password) {
      alert('Username and password are required');
      return;
    }

    if (users.some(user => user.username === newUser.username)) {
      alert('Username already exists');
      return;
    }

    try {
      const response = await fetch(`${API_URL}/users`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...newUser,
          id: Date.now(),
          createdAt: new Date().toISOString()
        }),
      });

      if (!response.ok) throw new Error('Failed to create user');

      const savedUser = await response.json();
      setUsers(prevUsers => [...prevUsers, savedUser]);
      
      // Reset form
      setNewUser({
        username: '',
        password: '',
        permissions: {
          audit: {
            enabled: true,
            userAnalysis: false,
            roleAnalysis: false,
            combinedAnalysis: false,
            recommendations: false,
          },
          userAccessReview: false,
          sorReview: false,
          superUserAccess: false,
          dashboard: true,
        }
      });

      alert('User created successfully!');
    } catch (error) {
      console.error('Error creating user:', error);
      alert('Failed to create user');
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
      const updatedUserData = {
        ...editingUser,
        username: editForm.username,
        ...(editForm.password && { password: editForm.password }), // Only include password if it was changed
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

  return (
    <div className="p-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl font-bold">User Management</CardTitle>
        </CardHeader>
        <CardContent>
          {/* Add New User Section */}
          <div className="mb-8 p-4 border rounded-lg">
            <h3 className="text-lg font-semibold mb-4">Add New User</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <Input
                placeholder="Username"
                value={newUser.username}
                onChange={(e) => setNewUser({ ...newUser, username: e.target.value })}
              />
              <Input
                type="password"
                placeholder="Password"
                value={newUser.password}
                onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
              />
            </div>
            <Button 
              onClick={handleAddUser}
              className="w-full bg-[#003366] hover:bg-[#002347]"
            >
              <PlusCircle className="w-4 h-4 mr-2" />
              Add User
            </Button>
          </div>

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
                        checked={user.permissions.audit.enabled}
                        onCheckedChange={(checked) => 
                          handlePermissionChange(user.id, 'audit.enabled', checked)
                        }
                      />
                    </td>
                    <td className="p-2">
                      <Switch
                        checked={user.permissions.audit.userAnalysis}
                        onCheckedChange={(checked) => 
                          handlePermissionChange(user.id, 'audit.userAnalysis', checked)
                        }
                        disabled={!user.permissions.audit.enabled}
                      />
                    </td>
                    <td className="p-2">
                      <Switch
                        checked={user.permissions.audit.roleAnalysis}
                        onCheckedChange={(checked) => 
                          handlePermissionChange(user.id, 'audit.roleAnalysis', checked)
                        }
                        disabled={!user.permissions.audit.enabled}
                      />
                    </td>
                    <td className="p-2">
                      <Switch
                        checked={user.permissions.audit.combinedAnalysis}
                        onCheckedChange={(checked) => 
                          handlePermissionChange(user.id, 'audit.combinedAnalysis', checked)
                        }
                        disabled={!user.permissions.audit.enabled}
                      />
                    </td>
                    <td className="p-2">
                      <Switch
                        checked={user.permissions.audit.recommendations}
                        onCheckedChange={(checked) => 
                          handlePermissionChange(user.id, 'audit.recommendations', checked)
                        }
                        disabled={!user.permissions.audit.enabled}
                      />
                    </td>
                    <td className="p-2">
                      <Switch
                        checked={user.permissions.userAccessReview}
                        onCheckedChange={(checked) => 
                          handlePermissionChange(user.id, 'userAccessReview', checked)
                        }
                      />
                    </td>
                    <td className="p-2">
                      <Switch
                        checked={user.permissions.sorReview}
                        onCheckedChange={(checked) => 
                          handlePermissionChange(user.id, 'sorReview', checked)
                        }
                      />
                    </td>
                    <td className="p-2">
                      <Switch
                        checked={user.permissions.superUserAccess}
                        onCheckedChange={(checked) => 
                          handlePermissionChange(user.id, 'superUserAccess', checked)
                        }
                      />
                    </td>
                    <td className="p-2">
                      <Switch
                        checked={user.permissions.dashboard}
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