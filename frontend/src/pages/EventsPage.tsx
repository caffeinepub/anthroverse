import React, { useState } from "react";
import {
  Calendar, Plus, Loader2, CheckCircle, X, Users,
  CreditCard, Clock,
} from "lucide-react";
import {
  useGetEvents,
  useGetPendingEvents,
  useCreateEvent,
  useApproveEvent,
  useRegisterForEvent,
  useGetMyRegistrations,
  useGetEventRegistrations,
  useTogglePaid,
  useGetCallerUserProfile,
} from "../hooks/useQueries";
import { Event, Role, EventStatus } from "../backend";
import { formatTimestamp, isExecutiveRole, canCreateEvent } from "../lib/utils";
import { toast } from "sonner";
import { useInternetIdentity } from "../hooks/useInternetIdentity";

export default function EventsPage() {
  const { identity } = useInternetIdentity();
  const { data: userProfile } = useGetCallerUserProfile();
  const { data: events = [], isLoading } = useGetEvents();
  const { data: pendingEvents = [] } = useGetPendingEvents();
  const { data: myRegistrations = [] } = useGetMyRegistrations();
  const [showCreate, setShowCreate] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [form, setForm] = useState({ title: "", description: "", date: "", time: "", venue: "" });

  const createEvent = useCreateEvent();
  const approveEvent = useApproveEvent();
  const registerForEvent = useRegisterForEvent();
  const togglePaid = useTogglePaid();

  // Pass undefined instead of null to match the updated hook signature
  const { data: eventRegistrations = [] } = useGetEventRegistrations(
    selectedEvent ? selectedEvent.id : undefined
  );

  const userRole = userProfile?.role ?? Role.member;
  const isExec = isExecutiveRole(userRole);
  const canCreate = canCreateEvent(userRole);
  const callerPrincipal = identity?.getPrincipal().toString();

  const isRegistered = (eventId: bigint) =>
    myRegistrations.some((r) => r.eventId === eventId);

  const handleCreateEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title || !form.date) return;
    try {
      const dateTime = new Date(`${form.date}T${form.time || "00:00"}`);
      await createEvent.mutateAsync({
        title: form.title,
        description: form.description,
        date: BigInt(dateTime.getTime()) * 1_000_000n,
        banner: null,
        registrationLimit: null,
      });
      setForm({ title: "", description: "", date: "", time: "", venue: "" });
      setShowCreate(false);
      toast.success(isExec ? "Event published!" : "Event submitted for approval");
    } catch (err: any) {
      toast.error(err?.message || "Failed to create event");
    }
  };

  const handleApprove = async (eventId: bigint) => {
    try {
      await approveEvent.mutateAsync(eventId);
      toast.success("Event approved!");
    } catch (err: any) {
      toast.error(err?.message || "Failed to approve event");
    }
  };

  const handleRegister = async (eventId: bigint) => {
    try {
      await registerForEvent.mutateAsync(eventId);
      toast.success("Registered successfully!");
    } catch (err: any) {
      toast.error(err?.message || "Failed to register");
    }
  };

  const handleTogglePaid = async (eventId: bigint, userPrincipal: string) => {
    try {
      const { Principal } = await import("@dfinity/principal");
      await togglePaid.mutateAsync({ eventId, user: Principal.fromText(userPrincipal) });
      toast.success("Payment status updated");
    } catch (err: any) {
      toast.error(err?.message || "Failed to update payment");
    }
  };

  return (
    <div className="space-y-4 p-4 max-w-4xl mx-auto">
      {/* Header */}
      <div className="bg-card rounded-xl border border-border p-5 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-foreground">Events</h1>
          <p className="text-sm text-muted-foreground">Chapter events and activities</p>
        </div>
        {canCreate && (
          <button
            onClick={() => setShowCreate(!showCreate)}
            className="flex items-center gap-1.5 px-3 py-2 bg-primary text-primary-foreground text-sm font-semibold rounded-lg hover:bg-primary/90 transition-opacity"
          >
            <Plus className="w-4 h-4" />
            {showCreate ? "Cancel" : "Create Event"}
          </button>
        )}
      </div>

      {/* Create Event Form */}
      {showCreate && (
        <div className="bg-card rounded-xl border border-border p-5">
          <h2 className="font-semibold text-foreground mb-4">Create New Event</h2>
          <form onSubmit={handleCreateEvent} className="space-y-3">
            <div>
              <label className="block text-sm font-medium text-foreground mb-1">Title *</label>
              <input
                type="text"
                value={form.title}
                onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                className="w-full px-3 py-2 rounded-lg border border-border bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                placeholder="Event title"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-1">Description</label>
              <textarea
                value={form.description}
                onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                className="w-full px-3 py-2 rounded-lg border border-border bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary resize-none"
                rows={3}
                placeholder="Event description"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">Date *</label>
                <input
                  type="date"
                  value={form.date}
                  onChange={e => setForm(f => ({ ...f, date: e.target.value }))}
                  className="w-full px-3 py-2 rounded-lg border border-border bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">Time</label>
                <input
                  type="time"
                  value={form.time}
                  onChange={e => setForm(f => ({ ...f, time: e.target.value }))}
                  className="w-full px-3 py-2 rounded-lg border border-border bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
            </div>
            <div className="flex gap-2 pt-1">
              <button
                type="submit"
                disabled={createEvent.isPending}
                className="flex items-center gap-1.5 px-4 py-2 bg-primary text-primary-foreground text-sm font-medium rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50"
              >
                {createEvent.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                {createEvent.isPending ? "Creating…" : "Create Event"}
              </button>
              <button
                type="button"
                onClick={() => setShowCreate(false)}
                className="px-4 py-2 border border-border text-foreground text-sm font-medium rounded-lg hover:bg-muted transition-colors"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Pending Events (exec only) */}
      {isExec && pendingEvents.length > 0 && (
        <div className="bg-card rounded-xl border border-amber-200 dark:border-amber-800 p-5">
          <h2 className="font-semibold text-foreground mb-3 flex items-center gap-2">
            <Clock className="w-4 h-4 text-amber-500" />
            Pending Approval ({pendingEvents.length})
          </h2>
          <div className="space-y-2">
            {pendingEvents.map(event => (
              <div key={event.id.toString()} className="flex items-center justify-between p-3 rounded-lg bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800">
                <div>
                  <p className="font-medium text-sm text-foreground">{event.title}</p>
                  <p className="text-xs text-muted-foreground">{formatTimestamp(event.date)}</p>
                </div>
                <button
                  onClick={() => handleApprove(event.id)}
                  disabled={approveEvent.isPending}
                  className="flex items-center gap-1 px-3 py-1.5 bg-green-600 text-white text-xs font-medium rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
                >
                  <CheckCircle className="w-3 h-3" />
                  Approve
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Events List */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      ) : events.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          <Calendar className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p className="font-medium">No events yet</p>
          <p className="text-sm mt-1">Check back later for upcoming events</p>
        </div>
      ) : (
        <div className="space-y-3">
          {events.map(event => {
            const registered = isRegistered(event.id);
            const isSelected = selectedEvent?.id === event.id;

            return (
              <div key={event.id.toString()} className="bg-card rounded-xl border border-border overflow-hidden">
                <div className="p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="font-semibold text-foreground">{event.title}</h3>
                        {event.status === EventStatus.pending && (
                          <span className="text-xs px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 dark:bg-amber-950/30 dark:text-amber-400">
                            Pending
                          </span>
                        )}
                      </div>
                      {event.description && (
                        <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{event.description}</p>
                      )}
                      <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {formatTimestamp(event.date)}
                        </span>
                        {event.registrationLimit && (
                          <span className="flex items-center gap-1">
                            <Users className="w-3 h-3" />
                            Limit: {event.registrationLimit.toString()}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex flex-col gap-2 shrink-0">
                      {event.status === EventStatus.approved && (
                        <button
                          onClick={() => handleRegister(event.id)}
                          disabled={registered || registerForEvent.isPending}
                          className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
                            registered
                              ? "bg-green-100 text-green-700 dark:bg-green-950/30 dark:text-green-400 cursor-default"
                              : "bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
                          }`}
                        >
                          {registered ? (
                            <span className="flex items-center gap-1"><CheckCircle className="w-3 h-3" />Registered</span>
                          ) : (
                            "Register"
                          )}
                        </button>
                      )}
                      {isExec && (
                        <button
                          onClick={() => setSelectedEvent(isSelected ? null : event)}
                          className="px-3 py-1.5 text-xs font-medium rounded-lg border border-border hover:bg-muted transition-colors"
                        >
                          {isSelected ? "Hide" : "Registrations"}
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                {/* Registrations panel */}
                {isSelected && isExec && (
                  <div className="border-t border-border p-4 bg-muted/30">
                    <h4 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
                      <Users className="w-4 h-4" />
                      Registrations ({eventRegistrations.length})
                    </h4>
                    {eventRegistrations.length === 0 ? (
                      <p className="text-sm text-muted-foreground">No registrations yet</p>
                    ) : (
                      <div className="space-y-2">
                        {eventRegistrations.map(reg => (
                          <div key={reg.user.toString()} className="flex items-center justify-between p-2 rounded-lg bg-card border border-border">
                            <div>
                              <p className="text-xs font-mono text-foreground">{reg.user.toString().slice(0, 20)}…</p>
                              <p className="text-xs text-muted-foreground">{formatTimestamp(reg.timestamp)}</p>
                            </div>
                            <button
                              onClick={() => handleTogglePaid(event.id, reg.user.toString())}
                              disabled={togglePaid.isPending}
                              className={`flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-lg transition-colors ${
                                reg.isPaid
                                  ? "bg-green-100 text-green-700 dark:bg-green-950/30 dark:text-green-400"
                                  : "bg-muted text-muted-foreground hover:bg-muted/80"
                              }`}
                            >
                              <CreditCard className="w-3 h-3" />
                              {reg.isPaid ? "Paid" : "Mark Paid"}
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
