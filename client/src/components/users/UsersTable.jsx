import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table';
import { Users, Edit, Trash2, Shield, UserCheck } from 'lucide-react';

const UsersTable = ({ 
  users, 
  currentUser, 
  onEditUser, 
  onDeleteUser 
}) => {
  const getRoleBadgeVariant = (role) => {
    switch (role) {
      case 'Admin':
        return 'default';
      case 'AdminAssistant':
        return 'secondary';
      default:
        return 'outline';
    }
  };

  const getRoleIcon = (role) => {
    switch (role) {
      case 'Admin':
        return <Shield className="h-4 w-4" />;
      case 'AdminAssistant':
        return <UserCheck className="h-4 w-4" />;
      default:
        return <Users className="h-4 w-4" />;
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>System Users</CardTitle>
        <CardDescription>
          Manage administrators and admin assistants
        </CardDescription>
      </CardHeader>
      <CardContent>
        {users.length === 0 ? (
          <div className="text-center py-8">
            <Users className="h-12 w-12 mx-auto text-gray-400 mb-4" />
            <p className="text-gray-600">No users found</p>
            <p className="text-sm text-gray-500">Add your first system user to get started</p>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>User</TableHead>
                <TableHead>Username</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Phone</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {Array.isArray(users) && users.map((user) => (
                <TableRow key={user._id}>
                  <TableCell className="font-medium">
                    <div>
                      <p className="font-medium">
                        {user.firstName} {user.lastName}
                      </p>
                      <p className="text-sm text-gray-500">
                        {user._id === currentUser?._id && '(You)'}
                      </p>
                    </div>
                  </TableCell>
                  <TableCell>{user.username}</TableCell>
                  <TableCell>{user.email}</TableCell>
                  <TableCell>{user.phone || 'N/A'}</TableCell>
                  <TableCell>
                    <Badge variant={getRoleBadgeVariant(user.role)} className="flex items-center gap-1 w-fit">
                      {getRoleIcon(user.role)}
                      {user.role === 'AdminAssistant' ? 'Admin Assistant' : user.role}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant={user.isActive !== false ? 'default' : 'destructive'}>
                      {user.isActive !== false ? 'Active' : 'Inactive'}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => onEditUser(user)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      {user._id !== currentUser?._id && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => onDeleteUser(user)}
                          className="text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
};

export default UsersTable;
