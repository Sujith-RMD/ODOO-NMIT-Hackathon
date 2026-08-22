import React, { useState, useEffect } from 'react';
import { attendanceService } from '../services/attendanceService';
import { AttendanceRecord, AttendanceSummary } from '../types';
import { CheckInOutControl } from '../components/attendance/CheckInOutControl';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { formatWorkHours, formatDate } from '../utils/format';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/table';
import { Badge } from '../components/ui/badge';
import { Clock, Calendar, CheckCircle2, XCircle } from 'lucide-react';

export function AttendancePage() {
  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [summary, setSummary] = useState<AttendanceSummary | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchAttendance = async () => {
      setIsLoading(true);
      try {
        const data = await attendanceService.getMyAttendance();
        setRecords(data.records);
        setSummary(data.summary);
      } catch (error) {
        console.error('Failed to load attendance', error);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchAttendance();
  }, []);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'present': return <Badge variant="outline" className="text-green-600 bg-green-50 border-green-200">Present</Badge>;
      case 'absent': return <Badge variant="outline" className="text-red-600 bg-red-50 border-red-200">Absent</Badge>;
      case 'late': return <Badge variant="outline" className="text-amber-600 bg-amber-50 border-amber-200">Late</Badge>;
      case 'half_day': return <Badge variant="outline" className="text-orange-600 bg-orange-50 border-orange-200">Half Day</Badge>;
      default: return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <div className="w-full animate-in fade-in duration-300">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
        <div>
          <h1 className="text-page-title mb-1">My Attendance</h1>
          <p className="text-muted">Track your daily check-ins and working hours.</p>
        </div>
        <div className="flex items-center gap-4 bg-card p-2 pr-4 rounded-lg border shadow-sm">
          <div className="text-sm font-medium pl-2">Current Status:</div>
          <CheckInOutControl />
        </div>
      </div>

      {summary && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <Card>
            <CardContent className="p-6 flex items-center gap-4">
              <div className="p-3 bg-green-100 text-green-700 rounded-full">
                <CheckCircle2 className="h-6 w-6" />
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Present Days</p>
                <p className="text-2xl font-bold">{summary.present_days} / {summary.total_working_days}</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6 flex items-center gap-4">
              <div className="p-3 bg-red-100 text-red-700 rounded-full">
                <XCircle className="h-6 w-6" />
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Absent Days</p>
                <p className="text-2xl font-bold">{summary.absent_days}</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6 flex items-center gap-4">
              <div className="p-3 bg-blue-100 text-blue-700 rounded-full">
                <Clock className="h-6 w-6" />
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Work Hours</p>
                <p className="text-2xl font-bold">{summary.total_work_hours}h</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6 flex items-center gap-4">
              <div className="p-3 bg-purple-100 text-purple-700 rounded-full">
                <Calendar className="h-6 w-6" />
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">On Leave</p>
                <p className="text-2xl font-bold">{summary.on_leave_days}</p>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Attendance Log</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-4">
              {[1, 2, 3].map(i => <div key={i} className="h-12 bg-muted/50 rounded-md animate-pulse" />)}
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Check In</TableHead>
                    <TableHead>Check Out</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Work Hours</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {records.map((record) => (
                    <TableRow key={record.id}>
                      <TableCell className="font-medium">{formatDate(record.date)}</TableCell>
                      <TableCell>{record.check_in ? record.check_in.slice(0, 5) : '--:--'}</TableCell>
                      <TableCell>{record.check_out ? record.check_out.slice(0, 5) : '--:--'}</TableCell>
                      <TableCell>{getStatusBadge(record.status)}</TableCell>
                      <TableCell className="text-right font-medium">
                        {record.work_hours > 0 ? formatWorkHours(record.work_hours) : '-'}
                      </TableCell>
                    </TableRow>
                  ))}
                  {records.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                        No attendance records found for this period.
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
