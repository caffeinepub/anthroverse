import React, { useState } from 'react';
import { Calendar, Plus, X, CheckCircle, Users, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import {
  useGetEvents,
  useGetPendingEvents,
  useApproveEvent,
  useRegisterForEvent,
  useGetMyRegistrations,
  useGetEventRegistrations,
  useTogglePaid,
  useGetCallerUserProfile,
} from '../hooks/useQueries';
import { Role, type Event } from '../backend';
import { isExecutiveRole, isLTOrAbove } from '../utils/permissions';
import CreateEventForm from '../components/events/CreateEventForm';
import { ExternalBlob } from '../backend';

function formatDate(timestamp: bigint): string {
  const date = new Date(Number(timestamp) / 1_000_000);
  return date.toLocaleDateString('en-US', {
    weekday: 'short',
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

interface EventCardProps {
  event: Event;
  userRole: Role;
  isRegistered: boolean;
  onRegister: (id: bigint) => void;
  onApprove?: (id: bigint) => void;
  isApproving?: boolean;
  isRegistering?: boolean;
  onViewRegistrations?: (event: Event) => void;
}

function EventCard({
  event,
  userRole,
  isRegistered,
  onRegister,
  onApprove,
  isApproving,
  isRegistering,
  onViewRegistrations,
}: EventCardProps) {
  const bannerUrl = event.banner
    ? (event.banner as ExternalBlob).getDirectURL()
    : null;

  return (
    <Card className="overflow-hidden">
      {bannerUrl && (
        <div className="h-40 overflow-hidden">
          <img src={bannerUrl} alt={event.title} className="w-full h-full object-cover" />
        </div>
      )}
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-2 mb-2">
          <h3 className="font-semibold text-foreground text-base leading-tight">{event.title}</h3>
          <Badge
            variant={event.status === 'approved' ? 'default' : 'secondary'}
            className="text-xs shrink-0"
          >
            {event.status === 'approved' ? 'Approved' : 'Pending'}
          </Badge>
        </div>
        <p className="text-sm text-muted-foreground mb-3 line-clamp-2">{event.description}</p>
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-3">
          <Calendar className="w-3.5 h-3.5" />
          <span>{formatDate(event.date)}</span>
        </div>
        {event.registrationLimit && (
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-3">
            <Users className="w-3.5 h-3.5" />
            <span>Limit: {event.registrationLimit.toString()}</span>
          </div>
        )}
        <div className="flex flex-wrap gap-2 mt-3">
          {event.status === 'approved' && !isRegistered && (
            <Button
              size="sm"
              onClick={() => onRegister(event.id)}
              disabled={isRegistering}
              className="flex-1 min-w-[100px]"
            >
              {isRegistering ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : null}
              Register
            </Button>
          )}
          {isRegistered && (
            <Badge variant="outline" className="text-green-600 border-green-300">
              <CheckCircle className="w-3 h-3 mr-1" />
              Registered
            </Badge>
          )}
          {isExecutiveRole(userRole) && event.status === 'pending' && onApprove && (
            <Button
              size="sm"
              variant="outline"
              onClick={() => onApprove(event.id)}
              disabled={isApproving}
              className="text-green-600 border-green-300 hover:bg-green-50"
            >
              {isApproving ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : <CheckCircle className="w-4 h-4 mr-1" />}
              Approve
            </Button>
          )}
          {isExecutiveRole(userRole) && onViewRegistrations && (
            <Button
              size="sm"
              variant="ghost"
              onClick={() => onViewRegistrations(event)}
              className="flex items-center gap-1"
            >
              <Users className="w-4 h-4" />
              Registrations
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

export default function EventsPage() {
  const { data: userProfile } = useGetCallerUserProfile();
  const userRole = userProfile?.role ?? Role.member;

  const { data: events = [], isLoading: eventsLoading } = useGetEvents();
  const { data: pendingEvents = [] } = useGetPendingEvents();
  const { data: myRegistrations = [] } = useGetMyRegistrations();
  const approveEventMutation = useApproveEvent();
  const registerMutation = useRegisterForEvent();

  const [showCreateForm, setShowCreateForm] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [approvingId, setApprovingId] = useState<bigint | null>(null);
  const [registeringId, setRegisteringId] = useState<bigint | null>(null);

  // Pass null (not undefined) when no event is selected — matches bigint | null signature
  const { data: registrations = [] } = useGetEventRegistrations(
    selectedEvent ? selectedEvent.id : null
  );
  const togglePaidMutation = useTogglePaid();

  const registeredEventIds = new Set(myRegistrations.map(r => r.eventId.toString()));

  const canCreateEvent = isLTOrAbove(userRole) || userRole === Role.mc || userRole === Role.elt;

  const handleApprove = async (eventId: bigint) => {
    setApprovingId(eventId);
    try {
      await approveEventMutation.mutateAsync(eventId);
      toast.success('Event approved');
    } catch (err: unknown) {
      toast.error('Failed to approve event');
    } finally {
      setApprovingId(null);
    }
  };

  const handleRegister = async (eventId: bigint) => {
    setRegisteringId(eventId);
    try {
      await registerMutation.mutateAsync(eventId);
      toast.success('Registered successfully!');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      toast.error(`Registration failed: ${msg}`);
    } finally {
      setRegisteringId(null);
    }
  };

  const handleTogglePaid = async (eventId: bigint, user: import('@dfinity/principal').Principal) => {
    try {
      await togglePaidMutation.mutateAsync({ eventId, user });
      toast.success('Payment status updated');
    } catch {
      toast.error('Failed to update payment status');
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Events</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Upcoming community events</p>
        </div>
        {canCreateEvent && (
          <Button
            size="sm"
            variant={showCreateForm ? 'outline' : 'default'}
            onClick={() => setShowCreateForm(v => !v)}
            className="flex items-center gap-1.5"
          >
            {showCreateForm ? <X className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
            {showCreateForm ? 'Cancel' : 'Create Event'}
          </Button>
        )}
      </div>

      {/* Create Event Form */}
      {showCreateForm && (
        <div className="mb-6">
          <CreateEventForm onSuccess={() => setShowCreateForm(false)} />
        </div>
      )}

      {/* Registration Details Panel */}
      {selectedEvent && (
        <div className="mb-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-3">
              <CardTitle className="text-base">
                Registrations: {selectedEvent.title}
              </CardTitle>
              <Button variant="ghost" size="icon" onClick={() => setSelectedEvent(null)}>
                <X className="w-4 h-4" />
              </Button>
            </CardHeader>
            <CardContent>
              {registrations.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">No registrations yet</p>
              ) : (
                <div className="space-y-2">
                  {registrations.map((reg) => (
                    <div
                      key={reg.user.toString()}
                      className="flex items-center justify-between p-3 rounded-lg border bg-card"
                    >
                      <span className="text-sm font-mono truncate max-w-[200px]">
                        {reg.user.toString()}
                      </span>
                      <div className="flex items-center gap-2">
                        <Badge variant={reg.isPaid ? 'default' : 'secondary'}>
                          {reg.isPaid ? 'Paid' : 'Unpaid'}
                        </Badge>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleTogglePaid(selectedEvent.id, reg.user)}
                          disabled={togglePaidMutation.isPending}
                        >
                          Toggle Paid
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* Events Tabs */}
      <Tabs defaultValue="upcoming">
        <TabsList className="mb-4">
          <TabsTrigger value="upcoming">Upcoming</TabsTrigger>
          {isExecutiveRole(userRole) && (
            <TabsTrigger value="pending">
              Pending
              {pendingEvents.length > 0 && (
                <Badge variant="destructive" className="ml-2 text-xs">
                  {pendingEvents.length}
                </Badge>
              )}
            </TabsTrigger>
          )}
        </TabsList>

        <TabsContent value="upcoming">
          {eventsLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-6 h-6 animate-spin text-primary" />
            </div>
          ) : events.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Calendar className="w-12 h-12 mx-auto mb-3 opacity-30" />
              <p className="font-medium">No upcoming events</p>
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2">
              {events.map(event => (
                <EventCard
                  key={event.id.toString()}
                  event={event}
                  userRole={userRole}
                  isRegistered={registeredEventIds.has(event.id.toString())}
                  onRegister={handleRegister}
                  onApprove={isExecutiveRole(userRole) ? handleApprove : undefined}
                  isApproving={approvingId === event.id}
                  isRegistering={registeringId === event.id}
                  onViewRegistrations={isExecutiveRole(userRole) ? setSelectedEvent : undefined}
                />
              ))}
            </div>
          )}
        </TabsContent>

        {isExecutiveRole(userRole) && (
          <TabsContent value="pending">
            {pendingEvents.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <CheckCircle className="w-12 h-12 mx-auto mb-3 opacity-30" />
                <p className="font-medium">No pending events</p>
              </div>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2">
                {pendingEvents.map(event => (
                  <EventCard
                    key={event.id.toString()}
                    event={event}
                    userRole={userRole}
                    isRegistered={false}
                    onRegister={handleRegister}
                    onApprove={handleApprove}
                    isApproving={approvingId === event.id}
                    onViewRegistrations={setSelectedEvent}
                  />
                ))}
              </div>
            )}
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
}
