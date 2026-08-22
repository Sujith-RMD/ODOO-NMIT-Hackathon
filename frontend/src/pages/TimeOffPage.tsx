import React, { useState, useEffect } from 'react';
import { timeOffService } from '../services/timeOffService';
import { TimeOffRequest, TimeOffBalance } from '../types';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/table';
import { Badge } from '../components/ui/badge';
import { formatDate } from '../utils/format';
import { Button } from '../components/ui/button';
import { Plus } from 'lucide-react';

export function TimeOffPage() {
  const [requests, setRequests] = useState<TimeOffRequest[]>([]);
  const [balances, setBalances] = useState<TimeOffBalance[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        const [reqData, balData] = await Promise.all([
          timeOffService.getMyRequests(),
          timeOffService.getBalances()
        ]);
        setRequests(reqData.items);
        setBalances(balData);
      } catch (error) {
        console.error('Failed to load time off data', error);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchData();
  }, []);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'approved': return <Badge variant="outline" className="text-green-600 bg-green-50 border-green-200">Approved</Badge>;
      case 'rejected': return <Badge variant="outline" className="text-red-600 bg-red-50 border-red-200">Rejected</Badge>;
      case 'pending': return <Badge variant="outline" className="text-amber-600 bg-amber-50 border-amber-200">Pending</Badge>;
      default: return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <div className="w-full animate-in fade-in duration-300">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-page-title mb-1">Time Off</h1>
          <p className="text-muted">Manage your leaves and time off requests.</p>
        </div>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          Request Time Off
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
        {balances.map((balance, index) => (
          <Card key={index} className="overflow-hidden">
            <div className="h-2 w-full" style={{ backgroundColor: balance.time_off_type.color }} />
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">{balance.time_off_type.name}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-end justify-between mt-2">
                <div>
                  <p className="text-3xl font-bold">{balance.available_days}</p>
                  <p className="text-sm text-muted-foreground mt-1">Days Available</p>
                </div>
                <div className="text-right text-sm">
                  <p className="text-muted-foreground mb-1"><span className="text-foreground font-medium">{balance.used_days}</span> Used</p>
                  <p className="text-muted-foreground"><span className="text-foreground font-medium">{balance.allocated_days}</span> Allocated</p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>My Requests</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-4">
              {[1, 2].map(i => <div key={i} className="h-12 bg-muted/50 rounded-md animate-pulse" />)}
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Type</TableHead>
                    <TableHead>Dates</TableHead>
                    <TableHead>Duration</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="w-[100px]">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {requests.map((req) => (
                    <TableRow key={req.id}>
                      <TableCell className="font-medium">
                        <div className="flex items-center gap-2">
                          <span className="w-3 h-3 rounded-full" style={{ backgroundColor: req.time_off_type.color }} />
                          {req.time_off_type.name}
                        </div>
                      </TableCell>
                      <TableCell>{formatDate(req.start_date)} - {formatDate(req.end_date)}</TableCell>
                      <TableCell>{req.total_days} {req.total_days === 1 ? 'day' : 'days'}</TableCell>
                      <TableCell>{getStatusBadge(req.status)}</TableCell>
                      <TableCell>
                        <Button variant="ghost" size="sm" className="h-8">View</Button>
                      </TableCell>
                    </TableRow>
                  ))}
                  {requests.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                        No time off requests found.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
