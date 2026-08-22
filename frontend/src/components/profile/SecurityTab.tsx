import React, { useState } from 'react';
import { EmployeeProfile } from '../../types';
import { authService } from '../../services/authService';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';

export function SecurityTab({ employee }: { employee: EmployeeProfile }) {
  const [formData, setFormData] = useState({
    current_password: '',
    new_password: '',
    confirm_password: ''
  });
  const [status, setStatus] = useState<{type: 'error' | 'success', msg: string} | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus(null);
    
    if (formData.new_password !== formData.confirm_password) {
      setStatus({ type: 'error', msg: 'New passwords do not match' });
      return;
    }

    setIsLoading(true);
    try {
      await authService.changePassword(formData);
      setStatus({ type: 'success', msg: 'Password updated successfully' });
      setFormData({ current_password: '', new_password: '', confirm_password: '' });
    } catch (err: any) {
      setStatus({ type: 'error', msg: err.response?.data?.detail || err.message || 'Failed to update password' });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6 max-w-md animate-in fade-in duration-300">
      <div>
        <h3 className="text-lg font-medium text-foreground mb-1">Change Password</h3>
        <p className="text-sm text-muted-foreground mb-6">
          Ensure your account is using a long, random password to stay secure.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {status && (
          <div className={`p-3 text-sm rounded-md ${
            status.type === 'error' ? 'text-destructive-foreground bg-destructive/90' : 'text-green-800 bg-green-100'
          }`}>
            {status.msg}
          </div>
        )}

        <div className="space-y-2">
          <Label htmlFor="current_password">Current Password</Label>
          <Input 
            id="current_password" 
            type="password" 
            value={formData.current_password}
            onChange={(e) => setFormData({...formData, current_password: e.target.value})}
            required 
          />
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="new_password">New Password</Label>
          <Input 
            id="new_password" 
            type="password" 
            value={formData.new_password}
            onChange={(e) => setFormData({...formData, new_password: e.target.value})}
            required 
          />
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="confirm_password">Confirm New Password</Label>
          <Input 
            id="confirm_password" 
            type="password" 
            value={formData.confirm_password}
            onChange={(e) => setFormData({...formData, confirm_password: e.target.value})}
            required 
          />
        </div>

        <Button type="submit" disabled={isLoading} className="mt-2">
          {isLoading ? 'Saving...' : 'Save Password'}
        </Button>
      </form>
    </div>
  );
}
