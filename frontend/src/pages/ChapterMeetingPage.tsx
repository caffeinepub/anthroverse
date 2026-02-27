import React, { useState } from 'react';
import { BookOpen, Calendar, Users, Edit3, Save, X, Loader2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { useGetCallerUserProfile, useGetEvents } from '../hooks/useQueries';
import { Role } from '../backend';
import { isExecutiveRole } from '../utils/permissions';

export default function ChapterMeetingPage() {
  const { data: userProfile } = useGetCallerUserProfile();
  const { data: events = [], isLoading } = useGetEvents();
  const userRole = userProfile?.role ?? Role.member;

  const [isEditing, setIsEditing] = useState(false);
  const [meetingNotes, setMeetingNotes] = useState('');
  const [editNotes, setEditNotes] = useState('');

  const upcomingEvents = events
    .filter(e => e.status === 'approved')
    .sort((a, b) => Number(a.date - b.date))
    .slice(0, 5);

  const handleEditStart = () => {
    setEditNotes(meetingNotes);
    setIsEditing(true);
  };

  const handleSave = () => {
    setMeetingNotes(editNotes);
    setIsEditing(false);
    toast.success('Meeting notes saved');
  };

  return (
    <div className="max-w-3xl mx-auto px-4 py-6 space-y-6">
      <div className="flex items-center gap-3 mb-2">
        <div className="p-2 rounded-lg bg-primary/10">
          <BookOpen className="w-6 h-6 text-primary" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-foreground">Chapter Meetings</h1>
          <p className="text-sm text-muted-foreground">Meeting schedule and notes</p>
        </div>
      </div>

      {/* Upcoming Meetings */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Calendar className="w-4 h-4" />
            Upcoming Events
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin text-primary" />
            </div>
          ) : upcomingEvents.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">No upcoming events scheduled</p>
          ) : (
            <div className="space-y-3">
              {upcomingEvents.map(event => (
                <div key={event.id.toString()} className="flex items-start gap-3 p-3 rounded-lg border border-border">
                  <div className="p-2 rounded-md bg-primary/10 shrink-0">
                    <Calendar className="w-4 h-4 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-foreground text-sm truncate">{event.title}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {new Date(Number(event.date) / 1_000_000).toLocaleDateString('en-US', {
                        weekday: 'short',
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </p>
                    {event.description && (
                      <p className="text-xs text-muted-foreground mt-1 line-clamp-1">{event.description}</p>
                    )}
                  </div>
                  <Badge variant="outline" className="text-xs shrink-0">Approved</Badge>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Meeting Notes */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <BookOpen className="w-4 h-4" />
            Meeting Notes
          </CardTitle>
          {isExecutiveRole(userRole) && !isEditing && (
            <Button variant="outline" size="sm" onClick={handleEditStart}>
              <Edit3 className="w-4 h-4 mr-1.5" />
              Edit
            </Button>
          )}
          {isEditing && (
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={() => setIsEditing(false)}>
                <X className="w-4 h-4 mr-1.5" />
                Cancel
              </Button>
              <Button size="sm" onClick={handleSave}>
                <Save className="w-4 h-4 mr-1.5" />
                Save
              </Button>
            </div>
          )}
        </CardHeader>
        <CardContent>
          {isEditing ? (
            <Textarea
              value={editNotes}
              onChange={e => setEditNotes(e.target.value)}
              placeholder="Enter meeting notes here..."
              rows={8}
              className="resize-none"
            />
          ) : meetingNotes ? (
            <p className="text-sm text-foreground whitespace-pre-wrap">{meetingNotes}</p>
          ) : (
            <p className="text-sm text-muted-foreground text-center py-4">
              No meeting notes yet.{isExecutiveRole(userRole) ? ' Click Edit to add notes.' : ''}
            </p>
          )}
        </CardContent>
      </Card>

      {/* Members Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Users className="w-4 h-4" />
            Attendance Tracking
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground text-center py-4">
            Attendance tracking will be available in a future update.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
