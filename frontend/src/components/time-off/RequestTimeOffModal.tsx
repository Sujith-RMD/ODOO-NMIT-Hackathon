import React, { useState } from 'react';
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query';
import { api } from '../../services/api';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger
} from '../ui/dialog';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Plus } from 'lucide-react';

/**
 * ════════════════════════════════════════════════════════════════
 * REQUEST TIME OFF MODAL
 * ════════════════════════════════════════════════════════════════
 *
 * OWNER: [YOUR FRIEND]
 *
 * WHAT THIS DOES:
 *   Opens a modal to submit a new leave request.
 *
 * BACKEND:
 *   GET  /time-off/types   → populate the leave type dropdown
 *   POST /time-off/my-requests
 *        Body: { time_off_type_id, start_date, end_date, reason }
 *
 * AFTER SUCCESS:
 *   queryClient.invalidateQueries({ queryKey: ['time-off', 'my-requests'] })
 *   queryClient.invalidateQueries({ queryKey: ['time-off', 'my-balances'] })
 *   Close the dialog.
 * ════════════════════════════════════════════════════════════════
 */

export function RequestTimeOffModal() {
  const [open, setOpen] = useState(false);
  const queryClient = useQueryClient();

  // 1. Fetch leave types for dropdown
  const { data: leaveTypes = [] } = useQuery({
    queryKey: ['time-off-types'],
    queryFn: async () => {
      try {
        const res = await api.get('/time-off/types');
        return res.data;
      } catch (e) {
        return [{ id: 1, name: 'Paid Time Off' }, { id: 2, name: 'Sick Leave' }];
      }
    }
  });

  // 2. Mutation to submit request
  const mutation = useMutation({
    mutationFn: async (data: any) => {
      await api.post('/time-off/request', data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['time-off', 'my-requests'] });
      queryClient.invalidateQueries({ queryKey: ['time-off', 'my-balances'] });
      setOpen(false);
    }
  });

  // Form state
  const [typeId, setTypeId] = useState('');
  const [start, setStart] = useState('');
  const [end, setEnd] = useState('');
  const [reason, setReason] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!typeId || !start || !end) return;
    mutation.mutate({
      time_off_type_id: parseInt(typeId, 10),
      start_date: start,
      end_date: end,
      reason: reason || undefined
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="gap-2">
          <Plus className="h-4 w-4" />
          Request Time Off
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Request Time Off</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 pt-4">
          <div className="space-y-2">
            <Label>Leave Type</Label>
            <select
              value={typeId}
              onChange={e => setTypeId(e.target.value)}
              className="w-full h-9 border rounded-md px-3 text-sm bg-background focus:ring-1 focus:ring-primary"
              required
            >
              <option value="" disabled>Select a type...</option>
              {leaveTypes.map((t: any) => (
                <option key={t.id} value={t.id}>{t.name}</option>
              ))}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Start Date</Label>
              <Input type="date" value={start} onChange={e => setStart(e.target.value)} required />
            </div>
            <div className="space-y-2">
              <Label>End Date</Label>
              <Input type="date" value={end} onChange={e => setEnd(e.target.value)} required />
            </div>
          </div>
          <div className="space-y-2">
            <Label>Reason (Optional)</Label>
            <Input value={reason} onChange={e => setReason(e.target.value)} placeholder="Why are you taking time off?" />
          </div>
          <DialogFooter className="pt-4">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button type="submit" disabled={mutation.isPending}>
              {mutation.isPending ? 'Submitting...' : 'Submit Request'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
