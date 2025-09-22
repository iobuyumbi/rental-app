import { useState, useEffect } from 'react';
import { Button } from '../components/ui/button';
import { Dialog, DialogTrigger } from '../components/ui/dialog';
import { Plus } from 'lucide-react';
import { authAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { toast } from 'sonner';

// Import our new components
import UserForm from '../components/users/UserForm';
import UsersTable from '../components/users/UsersTable';
import DeleteUserDialog from '../components/users/DeleteUserDialog';
import AccessDenied from '../components/users/AccessDenied';

const UsersPage = () => {
  const { user: currentUser, isAdmin } = useAuth();
  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState([]);
  const [showAddUser, setShowAddUser] = useState(false);
  const [showEditUser, setShowEditUser] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [userToDelete, setUserToDelete] = useState(null);
  const [showPassword, setShowPassword] = useState(false);
  const [newUser, setNewUser] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
    firstName: '',
    lastName: '',
    role: 'AdminAssistant',
    phone: ''
  });
  const [editUser, setEditUser] = useState({
    username: '',
    email: '',
    firstName: '',
    lastName: '',
    role: '',
    phone: '',
    isActive: true
  });

  useEffect(() => {
    if (isAdmin) {
      loadUsers();
    } else {
      setLoading(false);
    }
  }, [isAdmin]);

  const loadUsers = async () => {
    try {
      setLoading(true);
      const response = await authAPI.users.get();
      setUsers(response.data || []);
    } catch (error) {
      console.error('Error loading users:', error);
      toast.error('Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  const handleAddUser = async (e) => {
    e.preventDefault();
    
    if (newUser.password !== newUser.confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }

    if (newUser.password.length < 6) {
      toast.error('Password must be at least 6 characters long');
      return;
    }

    try {
      const userData = {
        username: newUser.username,
        email: newUser.email,
        password: newUser.password,
        firstName: newUser.firstName,
        lastName: newUser.lastName,
        role: newUser.role,
        phone: newUser.phone
      };
      
      await authAPI.register(userData);
      toast.success('User created successfully');
      setShowAddUser(false);
      setNewUser({
        username: '',
        email: '',
        password: '',
        confirmPassword: '',
        firstName: '',
        lastName: '',
        role: 'AdminAssistant',
        phone: ''
      });
      loadUsers();
    } catch (error) {
      console.error('Error creating user:', error);
      toast.error('Failed to create user');
    }
  };

  const handleEditUser = async (e) => {
    e.preventDefault();
    
    try {
      await authAPI.users.update(selectedUser._id, editUser);
      toast.success('User updated successfully');
      setShowEditUser(false);
      setSelectedUser(null);
      loadUsers();
    } catch (error) {
      console.error('Error updating user:', error);
      toast.error('Failed to update user');
    }
  };

  const handleDeleteUser = async () => {
    try {
      await authAPI.users.delete(userToDelete._id);
      toast.success('User deleted successfully');
      setShowDeleteDialog(false);
      setUserToDelete(null);
      loadUsers();
    } catch (error) {
      console.error('Error deleting user:', error);
      toast.error('Failed to delete user');
    }
  };

  const openEditDialog = (user) => {
    setSelectedUser(user);
    setEditUser({
      username: user.username,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role,
      phone: user.phone || '',
      isActive: user.isActive !== false
    });
    setShowEditUser(true);
  };

  const openDeleteDialog = (user) => {
    setUserToDelete(user);
    setShowDeleteDialog(true);
  };

  const handleNewUserChange = (updates) => {
    setNewUser(prev => ({ ...prev, ...updates }));
  };

  const handleEditUserChange = (updates) => {
    setEditUser(prev => ({ ...prev, ...updates }));
  };

  if (!isAdmin) {
    return <AccessDenied />;
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
          <p className="mt-2 text-gray-600">Loading users...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">User Management</h1>
          <p className="text-gray-600">Manage system users and permissions</p>
        </div>
        <Dialog open={showAddUser} onOpenChange={setShowAddUser}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Add User
            </Button>
          </DialogTrigger>
        </Dialog>
      </div>

      <UsersTable
        users={users}
        currentUser={currentUser}
        onEditUser={openEditDialog}
        onDeleteUser={openDeleteDialog}
      />

      {/* Add User Form */}
      <UserForm
        isOpen={showAddUser}
        onClose={setShowAddUser}
        onSubmit={handleAddUser}
        formData={newUser}
        onFormChange={handleNewUserChange}
        isEditing={false}
        showPassword={showPassword}
        setShowPassword={setShowPassword}
      />

      {/* Edit User Form */}
      <UserForm
        isOpen={showEditUser}
        onClose={setShowEditUser}
        onSubmit={handleEditUser}
        formData={editUser}
        onFormChange={handleEditUserChange}
        isEditing={true}
        showPassword={showPassword}
        setShowPassword={setShowPassword}
      />

      {/* Delete User Dialog */}
      <DeleteUserDialog
        isOpen={showDeleteDialog}
        onClose={setShowDeleteDialog}
        onConfirm={handleDeleteUser}
        userToDelete={userToDelete}
      />
    </div>
  );
};

export default UsersPage;
