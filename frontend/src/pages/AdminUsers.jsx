import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';

const AdminUsers = () => {
  const { user } = useAuth();
  const [users, setUsers] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [newUser, setNewUser] = useState({ username: '', role: 'User', departmentId: '', password: '', confirmPassword: '' });
  const [newDepartment, setNewDepartment] = useState({ name: '', description: '' });
  const [loading, setLoading] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [editDraft, setEditDraft] = useState({ username: '', role: 'User', department_id: '' });
  const [selectedDepartment, setSelectedDepartment] = useState(''); // For filtering users by department

  useEffect(() => {
    fetchUsers();
    fetchDepartments();
  }, []);

  const fetchUsers = async () => {
    try {
      const response = await fetch('/api/users', {
        headers: {
          'X-USER-ID': user?.id || ''
        }
      });
      const data = await response.json();
      setUsers(data.users || []);
    } catch (error) {
      console.error('Error fetching users:', error);
    }
  };

  const fetchDepartments = async () => {
    try {
      const response = await fetch('/api/departments', {
        headers: {
          'X-USER-ID': user?.id || ''
        }
      });
      const data = await response.json();
      setDepartments(data.departments || []);
    } catch (error) {
      console.error('Error fetching departments:', error);
    }
  };

  const handleResetPassword = async (userId) => {
    try {
      const res = await fetch(`/api/users/${userId}/reset-password`, { 
        method: 'POST',
        headers: {
          'X-USER-ID': user?.id || ''
        }
      });
      const data = await res.json();
      if (res.ok) {
        alert('New password: ' + data.password);
      } else {
        alert('Error: ' + (data.error || 'Failed to reset password'));
      }
    } catch (e) {
      alert('Error resetting password');
    }
  };

  const handleDeleteUser = async (userId) => {
    if (!confirm('Delete this user?')) return;
    try {
      const res = await fetch(`/api/users/${userId}`, { 
        method: 'DELETE',
        headers: {
          'X-USER-ID': user?.id || ''
        }
      });
      if (res.ok) {
        setUsers(users.filter(u => u.id !== userId));
      } else {
        const data = await res.json();
        alert('Error: ' + (data.error || 'Failed to delete user'));
      }
    } catch (e) {
      alert('Error deleting user');
    }
  };

  const startEdit = (user) => {
    setEditingId(user.id);
    setEditDraft({ username: user.username, role: user.role, department_id: user.department_id });
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditDraft({ username: '', role: 'User', department_id: '' });
  };

  const saveEdit = async (userId) => {
    const body = {
      username: editDraft.username,
      role: editDraft.role,
      departmentId: editDraft.department_id,
    };
    try {
      const res = await fetch(`/api/users/${userId}`, {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          'X-USER-ID': user?.id || ''
        },
        body: JSON.stringify(body)
      });
      const data = await res.json();
      if (!res.ok) {
        alert('Error: ' + (data.error || 'Failed to update user'));
        return;
      }
      await fetchUsers();
      cancelEdit();
    } catch (e) {
      alert('Error updating user');
    }
  };

  const enforceDomain = (u) => {
    const username = (u || '').trim();
    if (!username) return '';
    if (!username.includes('@')) return `${username}@gcgmail.com`;
    const [local] = username.split('@');
    return `${local}@gcgmail.com`;
  };

  const handleCreateUser = async (e) => {
    e.preventDefault();
    const username = enforceDomain(newUser.username);
    
    // Admin users don't require a department, but other roles do
    const requiresDepartment = newUser.role !== 'Admin';
    if (!username || (requiresDepartment && !newUser.departmentId)) {
      const missingFields = [];
      if (!username) missingFields.push('username');
      if (requiresDepartment && !newUser.departmentId) missingFields.push('department');
      alert(`Please fill in required fields: ${missingFields.join(', ')}`);
      return;
    }
    
    if ((newUser.password || newUser.confirmPassword) && newUser.password !== newUser.confirmPassword) {
      alert('Passwords do not match');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('/api/users', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'X-USER-ID': user?.id || ''
        },
        body: JSON.stringify({
          ...newUser,
          username,
          // Don't send department for Admin users (they can access all)
          departmentId: newUser.role === 'Admin' ? null : newUser.departmentId
        })
      });
      
      if (response.ok) {
        const result = await response.json();
        alert('User created! Password: ' + result.password);
        setNewUser({ username: '', role: 'User', departmentId: '', password: '', confirmPassword: '' });
        fetchUsers();
      } else {
        const error = await response.json();
        alert('Error: ' + error.error);
      }
    } catch (error) {
      console.error('Error creating user:', error);
      alert('Error creating user');
    }
    setLoading(false);
  };

  return (
    <div className="max-w-7xl mx-auto">
      <h1 className="text-3xl font-bold text-gray-900 mb-4">Admin Dashboard</h1>
      
      {/* Department Filter for Admins */}
      <div className="mb-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-center gap-4">
          <label className="text-sm font-medium text-blue-900">
            View Department:
          </label>
          <select
            value={selectedDepartment}
            onChange={(e) => setSelectedDepartment(e.target.value)}
            className="px-3 py-2 border border-blue-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
          >
            <option value="">All Departments</option>
            {departments.map(dept => (
              <option key={dept.id} value={dept.id}>{dept.name}</option>
            ))}
          </select>
          <span className="text-sm text-blue-700">
            {selectedDepartment 
              ? `Viewing users in: ${departments.find(d => d.id === parseInt(selectedDepartment))?.name || 'Unknown'}`
              : 'Viewing all users across all departments'
            }
          </span>
        </div>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Create New User</h2>
          <form onSubmit={handleCreateUser} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Username
              </label>
              <input
                type="text"
                value={newUser.username}
                onChange={(e) => setNewUser({...newUser, username: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
              <p className="text-xs text-gray-500 mt-1">Domain enforced: @gcgmail.com</p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
                <input
                  type="password"
                  value={newUser.password}
                  onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Leave blank to auto-generate"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Confirm Password</label>
                <input
                  type="password"
                  value={newUser.confirmPassword}
                  onChange={(e) => setNewUser({ ...newUser, confirmPassword: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Re-enter password"
                />
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Role
              </label>
              <select
                value={newUser.role}
                onChange={(e) => setNewUser({...newUser, role: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="User">User</option>
                <option value="Manager">Manager</option>
                <option value="Admin">Admin</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Department {newUser.role === 'Admin' ? '(Optional - Admins have access to all departments)' : '(Required)'}
              </label>
              <select
                value={newUser.departmentId}
                onChange={(e) => setNewUser({...newUser, departmentId: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                required={newUser.role !== 'Admin'}
              >
                <option value="">
                  {newUser.role === 'Admin' ? 'No specific department (access all)' : 'Select Department'}
                </option>
                {departments.map(dept => (
                  <option key={dept.id} value={dept.id}>{dept.name}</option>
                ))}
              </select>
            </div>
            
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 disabled:opacity-50"
            >
              {loading ? 'Creating...' : 'Create User'}
            </button>
          </form>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Departments</h2>
          <div className="space-y-3">
            {departments.map(dept => (
              <div key={dept.id} className="p-3 border border-gray-200 rounded-md">
                <h3 className="font-medium text-gray-900">{dept.name}</h3>
                {dept.description && (
                  <p className="text-sm text-gray-600 mt-1">{dept.description}</p>
                )}
                <div className="text-xs text-gray-500 mt-2">
                  Users: {users.filter(user => user.department_id === dept.id).length}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">User Count</h2>
          <div className="text-2xl font-bold text-blue-600">{users.length}</div>
          <p className="text-gray-600">Total Users</p>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-md">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">All Users</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Username
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Role
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Department
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Created
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {users
                .filter(user => {
                  if (!selectedDepartment) return true; // Show all users if no department selected
                  if (user.role === 'Admin') return true; // Always show Admin users regardless of department filter
                  return user.department_id === parseInt(selectedDepartment);
                })
                .map(user => {
                const department = departments.find(d => d.id === user.department_id);
                return (
                  <tr key={user.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {editingId === user.id ? (
                        <input
                          type="text"
                          className="border border-gray-300 rounded px-2 py-1"
                          value={editDraft.username}
                          onChange={(e)=> setEditDraft({...editDraft, username: e.target.value})}
                        />
                      ) : (
                        user.username
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {editingId === user.id ? (
                        <select
                          className="border border-gray-300 rounded px-2 py-1"
                          value={editDraft.role}
                          onChange={(e)=> setEditDraft({...editDraft, role: e.target.value})}
                        >
                          <option value="User">User</option>
                          <option value="Manager">Manager</option>
                          <option value="Admin">Admin</option>
                        </select>
                      ) : (
                        <span className={'inline-flex px-2 py-1 text-xs font-semibold rounded-full ' + 
                          (user.role === 'Admin' ? 'bg-red-100 text-red-800' :
                          user.role === 'Manager' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-green-100 text-green-800')}>
                          {user.role}
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {editingId === user.id ? (
                        <select
                          className="border border-gray-300 rounded px-2 py-1"
                          value={editDraft.department_id ?? ''}
                          onChange={(e)=> setEditDraft({...editDraft, department_id: e.target.value})}
                        >
                          <option value="">Select Department</option>
                          {departments.map(d => (
                            <option key={d.id} value={d.id}>{d.name}</option>
                          ))}
                        </select>
                      ) : (
                        department ? department.name : 'Unknown'
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(user.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {editingId === user.id ? (
                        <div className="flex gap-2">
                          <button type="button" onClick={()=> saveEdit(user.id)} className="text-green-600 hover:underline">Save</button>
                          <button type="button" onClick={cancelEdit} className="text-gray-600 hover:underline">Cancel</button>
                        </div>
                      ) : (
                        <div className="flex gap-3">
                          <button type="button" onClick={()=> startEdit(user)} className="text-blue-600 hover:underline">Edit</button>
                          <button type="button" onClick={()=> handleResetPassword(user.id)} className="text-yellow-700 hover:underline">Reset Password</button>
                          <button type="button" onClick={()=> handleDeleteUser(user.id)} className="text-red-600 hover:underline">Delete</button>
                        </div>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default AdminUsers;
