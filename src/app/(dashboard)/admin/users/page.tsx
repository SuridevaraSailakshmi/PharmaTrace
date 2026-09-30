'use client';

import { useState, useEffect } from 'react';
import { Card, CardHeader, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from '@/components/ui/table';
import { Search, ChevronLeft, ChevronRight } from 'lucide-react';

interface User {
  id: string;
  email: string;
  fullName: string | null;
  roleId: string;
  isActive: boolean;
  createdAt: string;
}

export default function AdminUsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [hasNext, setHasNext] = useState(false);
  const [hasPrevious, setHasPrevious] = useState(false);
  
  const [search, setSearch] = useState('');
  const [activeFilter, setActiveFilter] = useState('');
  
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchUsers = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        pageSize: '10'
      });
      if (search) params.append('search', search);
      if (activeFilter) params.append('isActive', activeFilter);

      const res = await fetch(`/api/protected/admin/users?${params.toString()}`);
      if (!res.ok) throw new Error('Failed to fetch users');
      const data = await res.json();
      
      setUsers(data.data);
      setTotal(data.total);
      setHasNext(data.hasNext);
      setHasPrevious(data.hasPrevious);
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('An unknown error occurred');
      }
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      fetchUsers();
    }, 300);
    return () => clearTimeout(delayDebounceFn);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search, activeFilter, page]);

  const handleUpdateUser = async (id: string, newRoleId: string, isActive: boolean) => {
    if (!window.confirm('Are you sure you want to modify this user?')) return;
    
    try {
      const res = await fetch(`/api/protected/admin/users/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ roleId: newRoleId, isActive })
      });
      
      if (!res.ok) {
        const d = await res.json();
        throw new Error(d.error || 'Failed to update user');
      }
      
      fetchUsers();
    } catch (err: unknown) {
      if (err instanceof Error) {
        alert(err.message);
      } else {
        alert('An unknown error occurred');
      }
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">User Management</h1>
          <p className="text-[var(--color-text-muted)]">Manage operational users and roles.</p>
        </div>
      </div>

      <Card>
        <CardHeader className="p-4 border-b bg-[var(--color-surface-muted)]">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-[var(--color-text-muted)]" />
              <Input
                placeholder="Search by email or name..."
                className="pl-9 bg-white"
                value={search}
                onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              />
            </div>

            <select 
              className="h-10 rounded-md border border-input bg-background px-3 py-2 text-sm"
              value={activeFilter}
              onChange={(e) => { setActiveFilter(e.target.value); setPage(1); }}
            >
              <option value="">All Statuses</option>
              <option value="true">Active</option>
              <option value="false">Inactive</option>
            </select>
          </div>
        </CardHeader>
        
        <CardContent className="p-0">
          {error && <div className="p-4 text-red-600 bg-red-50 border-b">{error}</div>}
          
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>User</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Created At</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={5} className="h-24 text-center">Loading users...</TableCell>
                  </TableRow>
                ) : users.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="h-24 text-center text-muted-foreground">No users found.</TableCell>
                  </TableRow>
                ) : (
                  users.filter(u => u.roleId !== 'ADMIN').map((u) => (
                    <TableRow key={u.id}>
                      <TableCell>
                        <div className="font-medium">{u.fullName || 'No Name'}</div>
                        <div className="text-xs text-[var(--color-text-muted)]">{u.email}</div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{u.roleId}</Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant={u.isActive ? 'default' : 'destructive'} className="text-xs">
                          {u.isActive ? 'Active' : 'Inactive'}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm text-[var(--color-text-muted)]">
                        {new Date(u.createdAt).toLocaleDateString()}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                            <select 
                             className="text-xs border rounded p-1"
                             value={u.roleId}
                             onChange={(e) => handleUpdateUser(u.id, e.target.value, u.isActive)}
                             disabled={u.roleId === 'ADMIN'}
                           >
                             {u.roleId === 'ADMIN' && <option value="ADMIN">ADMIN</option>}
                             <option value="WORKER">WORKER</option>
                           </select>
                           <Button 
                             variant={u.isActive ? 'outline' : 'default'} 
                             size="sm"
                             className="h-7 text-xs"
                             onClick={() => handleUpdateUser(u.id, u.roleId, !u.isActive)}
                           >
                             {u.isActive ? 'Deactivate' : 'Activate'}
                           </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
          
          <div className="border-t p-4 flex items-center justify-between">
            <div className="text-sm text-[var(--color-text-muted)]">
              Showing page {page} <span className="hidden sm:inline">(Total: {total})</span>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={() => setPage(p => p - 1)} disabled={!hasPrevious || isLoading}>
                <ChevronLeft className="h-4 w-4 mr-1" /> Prev
              </Button>
              <Button variant="outline" size="sm" onClick={() => setPage(p => p + 1)} disabled={!hasNext || isLoading}>
                Next <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
