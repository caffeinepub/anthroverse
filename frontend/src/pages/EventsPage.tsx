import React, { useState } from "react";
import {
  Calendar, MapPin, Plus, Loader2, CheckCircle, X, Users,
  CreditCard, Clock, Image as ImageIcon
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

  const { data: eventRegistrations = [] } = useGetEventRegistrations(
    selectedEvent ? selectedEvent.id : null
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
      const { Principal } = await import("@icp-sdk/core/principal");
      await togglePaid.mutateAsync({ eventId, user: Principal.fromText(userPrincipal) });
      toast.success("Payment status updated");
    } catch (err: any) {
      toast.error(err?.message || "Failed to update payment");
    }
  };

  return (
    <div className="space-y-4 animate-fade-in">
      {/* Header */}
      <div className="bg-white rounded-xl shadow-card p-5 flex items-center justify-between">
        <div>
          <h1 className="font-poppins text-xl font-bold text-primary-700">Events</h1>
          <p className="text-sm text-muted-foreground font-inter">Chapter events and activities</p>
        </div>
        {canCreate && (
          <button
            onClick={() => setShowCreate(!showCreate)}
            className="flex items-center gap-1.5 px-3 py-2 gradient-primary text-white text-sm font-semibold font-poppins rounded-lg hover:opacity-90 transition-opacity"
          >
            <Plus className="w-4 h-4" />
            Create
          </button>
        )}
      </div>

      {/* Create Event Form */}
      {showCreate && (
        <div className="bg-white rounded-xl shadow-card p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-poppins font-semibold text-foreground">New Event</h2>
            <button onClick={() => setShowCreate(false)} className="p-1 text-muted-foreground hover:text-foreground">
              <X className="w-4 h-4" />
            </button>
          </div>
          <form onSubmit={handleCreateEvent} className="space-y-3">
            <input
              type="text"
              placeholder="Event title *"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              className="w-full px-3 py-2 rounded-lg border border-border text-sm font-inter focus:outline-none focus:ring-2 focus:ring-primary-500"
              required
            />
            <textarea
              placeholder="Description"
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              rows={3}
              className="w-full px-3 py-2 rounded-lg border border-border text-sm font-inter focus:outline-none focus:ring-2 focus:ring-primary-500 resize-none"
            />
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-muted-foreground mb-1 font-poppins">Date *</label>
                <input
                  type="date"
                  value={form.date}
                  onChange={(e) => setForm({ ...form, date: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-border text-sm font-inter focus:outline-none focus:ring-2 focus:ring-primary-500"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-muted-foreground mb-1 font-poppins">Time</label>
                <input
                  type="time"
                  value={form.time}
                  onChange={(e) => setForm({ ...form, time: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-border text-sm font-inter focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>
            </div>
            <input
              type="text"
              placeholder="Venue"
              value={form.venue}
              onChange={(e) => setForm({ ...form, venue: e.target.value })}
              className="w-full px-3 py-2 rounded-lg border border-border text-sm font-inter focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
            <div className="flex gap-2 pt-1">
              <button
                type="submit"
                disabled={createEvent.isPending}
                className="flex-1 gradient-primary text-white font-poppins font-semibold py-2.5 rounded-lg disabled:opacity-60 flex items-center justify-center gap-2"
              >
                {createEvent.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                {isExec ? "Publish Event" : "Submit for Approval"}
              </button>
              <button
                type="button"
                onClick={() => setShowCreate(false)}
                className="px-4 py-2.5 border border-border rounded-lg text-sm font-inter text-muted-foreground hover:text-foreground"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Pending Events (exec only) */}
      {isExec && pendingEvents.length > 0 && (
        <div className="bg-white rounded-xl shadow-card overflow-hidden">
          <div className="px-4 py-3 border-b border-border flex items-center gap-2">
            <Clock className="w-4 h-4 text-warning" />
            <span className="font-poppins font-semibold text-sm">Pending Events ({pendingEvents.length})</span>
          </div>
          <div className="divide-y divide-border">
            {pendingEvents.map((event) => (
              <div key={event.id.toString()} className="p-4 flex items-start justify-between gap-3">
                <div className="flex-1">
                  <p className="font-poppins font-semibold text-sm text-foreground">{event.title}</p>
                  <p className="text-xs text-muted-foreground font-inter mt-0.5">{event.description}</p>
                </div>
                <div className="flex gap-2 flex-shrink-0">
                  <button
                    onClick={() => handleApprove(event.id)}
                    className="p-1.5 rounded-lg bg-success/10 text-success hover:bg-success/20 transition-colors"
                    title="Approve"
                  >
                    <CheckCircle className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Events Grid */}
      {isLoading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="w-6 h-6 animate-spin text-primary-500" />
        </div>
      ) : events.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-xl shadow-card">
          <Calendar className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
          <p className="font-poppins font-semibold text-foreground">No events yet</p>
          <p className="text-sm text-muted-foreground font-inter mt-1">Events will appear here once published.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {events.map((event) => {
            const registered = isRegistered(event.id);
            const eventDate = new Date(Number(event.date) / 1_000_000);
            return (
              <div key={event.id.toString()} className="bg-white rounded-xl shadow-card overflow-hidden hover:shadow-card-hover transition-shadow">
                {/* Banner */}
                <div className="h-32 gradient-accent flex items-center justify-center">
                  {event.banner ? (
                    <img src={event.banner.getDirectURL()} alt={event.title} className="w-full h-full object-cover" />
                  ) : (
                    <Calendar className="w-10 h-10 text-white/60" />
                  )}
                </div>

                <div className="p-4">
                  <h3 className="font-poppins font-bold text-foreground text-sm mb-2">{event.title}</h3>
                  {event.description && (
                    <p className="text-xs text-muted-foreground font-inter mb-3 line-clamp-2">{event.description}</p>
                  )}

                  <div className="space-y-1 mb-3">
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground font-inter">
                      <Calendar className="w-3.5 h-3.5" />
                      {eventDate.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric", year: "numeric" })}
                    </div>
                  </div>

                  <div className="flex items-center justify-between gap-2">
                    {registered ? (
                      <span className="badge-paid">✓ Registered</span>
                    ) : (
                      <button
                        onClick={() => handleRegister(event.id)}
                        disabled={registerForEvent.isPending}
                        className="flex-1 gradient-primary text-white text-xs font-semibold font-poppins py-2 rounded-lg disabled:opacity-60 flex items-center justify-center gap-1"
                      >
                        {registerForEvent.isPending ? <Loader2 className="w-3 h-3 animate-spin" /> : null}
                        Register
                      </button>
                    )}

                    {isExec && (
                      <button
                        onClick={() => setSelectedEvent(selectedEvent?.id === event.id ? null : event)}
                        className="px-3 py-2 border border-border rounded-lg text-xs font-inter text-muted-foreground hover:text-foreground transition-colors"
                      >
                        <Users className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>

                  {/* Registrations panel */}
                  {isExec && selectedEvent?.id === event.id && (
                    <div className="mt-3 border-t border-border pt-3">
                      <p className="text-xs font-semibold font-poppins text-foreground mb-2">Registrations</p>
                      {eventRegistrations.length === 0 ? (
                        <p className="text-xs text-muted-foreground font-inter">No registrations yet</p>
                      ) : (
                        <div className="space-y-1.5">
                          {eventRegistrations.map((reg, i) => (
                            <div key={i} className="flex items-center justify-between gap-2">
                              <span className="text-xs font-inter text-foreground truncate">
                                {reg.user.toString().slice(0, 12)}…
                              </span>
                              <button
                                onClick={() => handleTogglePaid(reg.eventId, reg.user.toString())}
                                className={`text-xs font-semibold px-2 py-0.5 rounded-full transition-colors ${
                                  reg.isPaid ? "badge-paid" : "badge-unpaid"
                                }`}
                              >
                                {reg.isPaid ? "Paid" : "Unpaid"}
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
