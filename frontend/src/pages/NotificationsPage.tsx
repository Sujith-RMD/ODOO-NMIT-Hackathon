import React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../services/api';
import { Card, CardContent } from '../components/ui/card';
import { Skeleton } from '../components/ui/skeleton';
import { Bell, Check, Clock } from 'lucide-react';

// ── Types matching backend schema ──────────────────────────────
interface Notification {
  id: number;
  title: string;
  message: string;
  is_read: boolean;
  created_at: string;
  notification_type?: string;
}

export function NotificationsPage() {
  const queryClient = useQueryClient();

  // GET /notifications  (paginated — we use page 1 / size 50 for now)
  const { data, isLoading } = useQuery({
    queryKey: ['notifications'],
    queryFn: async () => {
      try {
        const res = await api.get('/notifications', { params: { page: 1, page_size: 50 } });
        return res.data.items as Notification[];
      } catch (e) {
        console.warn('Notifications backend not reachable — using mock data');
        return [
          { id: 1, title: 'Leave Approved', message: 'Your annual leave request for Aug 25–27 was approved.', is_read: false, created_at: new Date().toISOString() },
          { id: 2, title: 'Welcome to Dayflow', message: 'Your account is set up and ready to go.', is_read: true, created_at: new Date().toISOString() },
        ] as Notification[];
      }
    },
  });

  const notifications = data ?? [];
  const unreadCount = notifications.filter(n => !n.is_read).length;

  const markReadMutation = useMutation({
    mutationFn: async (id: number) => {
      try {
        await api.post('/notifications/mark-read', { notification_ids: [id] });
      } catch (e) {
        console.warn('Backend mark-read failed, using mock success');
      }
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['notifications'] }),
  });

  const markAllReadMutation = useMutation({
    mutationFn: async () => {
      try {
        await api.post('/notifications/mark-all-read');
      } catch (e) {
        console.warn('Backend mark-all-read failed, using mock success');
      }
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['notifications'] }),
  });

  return (
    <div className="w-full max-w-3xl mx-auto animate-in fade-in duration-300">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-foreground tracking-tight mb-1">Notifications</h1>
          <p className="text-sm text-muted-foreground">Stay updated on your HR activities.</p>
        </div>
        {unreadCount > 0 && (
          <button
            onClick={() => markAllReadMutation.mutate()}
            disabled={markAllReadMutation.isPending}
            className="text-sm text-primary hover:underline font-medium disabled:opacity-50"
          >
            Mark all as read
          </button>
        )}
      </div>

      <div className="space-y-3">
        {isLoading ? (
          [1, 2, 3].map(i => <Skeleton key={i} className="h-24 w-full rounded-xl" />)
        ) : notifications.length === 0 ? (
          <div className="text-center py-16 text-muted-foreground border rounded-xl bg-card border-dashed">
            <Bell className="h-8 w-8 mx-auto mb-3 opacity-20" />
            <p className="text-sm">You're all caught up!</p>
          </div>
        ) : (
          notifications.map(notif => (
            <Card
              key={notif.id}
              className={`border transition-colors ${
                !notif.is_read ? 'bg-primary/[0.03] border-primary/20' : 'bg-card'
              }`}
            >
              <CardContent className="p-4 flex gap-4 items-start">
                {/* Icon */}
                <div className={`p-2 rounded-full mt-0.5 shrink-0 ${
                  !notif.is_read ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
                }`}>
                  <Bell className="h-4 w-4" />
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-start gap-2 mb-0.5">
                    <h3 className={`font-semibold text-sm leading-snug ${
                      !notif.is_read ? 'text-foreground' : 'text-foreground/80'
                    }`}>
                      {notif.title}
                      {!notif.is_read && (
                        <span className="inline-block ml-2 w-1.5 h-1.5 rounded-full bg-primary align-middle" />
                      )}
                    </h3>
                    <span className="text-xs text-muted-foreground flex items-center gap-1 shrink-0">
                      <Clock className="h-3 w-3" />
                      {new Date(notif.created_at).toLocaleDateString('en-IN', {
                        day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit'
                      })}
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground">{notif.message}</p>
                </div>

                {/* Mark read button */}
                {!notif.is_read && (
                  <button
                    onClick={() => markReadMutation.mutate(notif.id)}
                    disabled={markReadMutation.isPending}
                    title="Mark as read"
                    className="p-1.5 rounded-md hover:bg-black/5 text-muted-foreground hover:text-foreground transition-colors shrink-0 disabled:opacity-50"
                  >
                    <Check className="h-4 w-4" />
                  </button>
                )}
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
