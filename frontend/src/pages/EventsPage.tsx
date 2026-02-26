import { useState } from 'react';
import {
  useGetCallerUserProfile,
  useGetEvents,
  useCreateEvent,
  useApproveEvent,
  useRegisterForEvent,
} from '../hooks/useQueries';
import { EventStatus, Role } from '../backend';
import { ExternalBlob } from '../backend';
import { canApproveContent, canManageUsers } from '../utils/permissions';
import { formatTimestamp } from '../lib/utils';
import { Calendar, Users, Plus, CheckCircle, X, ImagePlus } from 'lucide-react';

export default function EventsPage() {
  const { data: userProfile } = useGetCallerUserProfile();
  const { data: events = [], isLoading } = useGetEvents();
  const createEvent = useCreateEvent();
  const approveEvent = useApproveEvent();
  const registerForEvent = useRegisterForEvent();

  const [showCreateForm, setShowCreateForm] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [date, setDate] = useState('');
  const [registrationLimit, setRegistrationLimit] = useState('');
  const [bannerFile, setBannerFile] = useState<File | null>(null);
  const [bannerPreview, setBannerPreview] = useState<string | null>(null);
  const [formError, setFormError] = useState('');

  const userRole = userProfile?.role;
  const canCreate = userRole ? (canApproveContent(userRole) || canManageUsers(userRole)) : false;
  const canApprove = userRole ? canApproveContent(userRole) : false;

  const handleBannerChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setBannerFile(file);
    const reader = new FileReader();
    reader.onload = ev => setBannerPreview(ev.target?.result as string);
    reader.readAsDataURL(file);
  };

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !description.trim() || !date) return;
    setFormError('');
    try {
      let bannerBlob: ExternalBlob | null = null;
      if (bannerFile) {
        const bytes = new Uint8Array(await bannerFile.arrayBuffer());
        bannerBlob = ExternalBlob.fromBytes(bytes as Uint8Array<ArrayBuffer>);
      }
      const limit = registrationLimit ? BigInt(registrationLimit) : null;
      await createEvent.mutateAsync({
        title: title.trim(),
        description: description.trim(),
        date: BigInt(new Date(date).getTime()) * BigInt(1_000_000),
        banner: bannerBlob,
        registrationLimit: limit,
      });
      setTitle(''); setDescription(''); setDate('');
      setRegistrationLimit(''); setBannerFile(null); setBannerPreview(null);
      setShowCreateForm(false);
    } catch (err: any) {
      setFormError(err?.message || 'Failed to create event');
    }
  };

  return (
    <div className="max-w-4xl mx-auto py-6 px-4 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-foreground">Events</h1>
        {canCreate && (
          <button
            onClick={() => setShowCreateForm(v => !v)}
            className="flex items-center gap-1.5 px-4 py-2 bg-primary text-primary-foreground text-sm font-medium rounded-lg hover:bg-primary/90 transition-colors"
          >
            <Plus className="w-4 h-4" />
            {showCreateForm ? 'Cancel' : 'Create Event'}
          </button>
        )}
      </div>

      {/* Create form */}
      {showCreateForm && (
        <div className="bg-card border border-border rounded-xl p-6">
          <h2 className="text-lg font-semibold text-foreground mb-4">New Event</h2>
          <form onSubmit={handleCreateSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-foreground mb-1">Title</label>
              <input type="text" value={title} onChange={e => setTitle(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary text-sm" required />
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-1">Description</label>
              <textarea value={description} onChange={e => setDescription(e.target.value)} rows={3}
                className="w-full px-3 py-2 rounded-lg border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary text-sm resize-none" required />
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-1">Date & Time</label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
                <input type="datetime-local" value={date} onChange={e => setDate(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 rounded-lg border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary text-sm" required />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-1">Registration Limit (optional)</label>
              <input type="number" value={registrationLimit} onChange={e => setRegistrationLimit(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary text-sm" min="1" />
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-1">Banner (optional)</label>
              {bannerPreview ? (
                <div className="relative">
                  <img src={bannerPreview} alt="Banner" className="w-full h-32 object-cover rounded-lg" />
                  <button type="button" onClick={() => { setBannerFile(null); setBannerPreview(null); }}
                    className="absolute top-2 right-2 bg-black/60 text-white rounded-full p-1">
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ) : (
                <label className="flex flex-col items-center justify-center w-full h-24 border-2 border-dashed border-border rounded-lg cursor-pointer hover:bg-muted/50 transition-colors">
                  <ImagePlus className="w-6 h-6 text-muted-foreground mb-1" />
                  <span className="text-xs text-muted-foreground">Upload banner</span>
                  <input type="file" accept="image/*" className="hidden" onChange={handleBannerChange} />
                </label>
              )}
            </div>
            {formError && <p className="text-destructive text-sm">{formError}</p>}
            <button type="submit" disabled={createEvent.isPending || !title.trim() || !description.trim() || !date}
              className="w-full py-2.5 bg-primary text-primary-foreground font-medium rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50 text-sm">
              {createEvent.isPending ? 'Creating…' : 'Create Event'}
            </button>
          </form>
        </div>
      )}

      {/* Events list */}
      {isLoading ? (
        <div className="flex justify-center py-12">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      ) : events.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          <Calendar className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p>No events yet.</p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {events.map(event => {
            const bannerUrl = event.banner ? event.banner.getDirectURL() : null;
            const isPending = event.status === EventStatus.pending;
            return (
              <article key={event.id.toString()} className="bg-card border border-border rounded-xl overflow-hidden">
                {bannerUrl ? (
                  <img src={bannerUrl} alt={event.title} className="w-full h-36 object-cover" />
                ) : (
                  <div className="w-full h-36 bg-muted flex items-center justify-center">
                    <Calendar className="w-10 h-10 text-muted-foreground opacity-40" />
                  </div>
                )}
                <div className="p-4 space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="font-semibold text-foreground text-sm">{event.title}</h3>
                    {isPending && (
                      <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300 shrink-0">
                        Pending
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground line-clamp-2">{event.description}</p>
                  <div className="flex items-center gap-3 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5" />
                      {formatTimestamp(event.date)}
                    </span>
                    {event.registrationLimit && (
                      <span className="flex items-center gap-1">
                        <Users className="w-3.5 h-3.5" />
                        Limit: {event.registrationLimit.toString()}
                      </span>
                    )}
                  </div>
                  <div className="flex gap-2 pt-1">
                    {!isPending && (
                      <button
                        onClick={() => registerForEvent.mutate(event.id)}
                        disabled={registerForEvent.isPending}
                        className="flex-1 py-1.5 text-xs font-medium bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50"
                      >
                        Register
                      </button>
                    )}
                    {canApprove && isPending && (
                      <button
                        onClick={() => approveEvent.mutate(event.id)}
                        disabled={approveEvent.isPending}
                        className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-green-600 border border-green-200 rounded-lg hover:bg-green-50 dark:hover:bg-green-900/20 transition-colors disabled:opacity-50"
                      >
                        <CheckCircle className="w-3.5 h-3.5" />
                        Approve
                      </button>
                    )}
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}

      {/* Footer */}
      <footer className="text-center text-xs text-muted-foreground pt-4 pb-2">
        <p>
          © {new Date().getFullYear()} AnthroVerse — Built with{' '}
          <span className="text-rose-500">♥</span>{' '}
          using{' '}
          <a
            href={`https://caffeine.ai/?utm_source=Caffeine-footer&utm_medium=referral&utm_content=${encodeURIComponent(window.location.hostname || 'anthroverse')}`}
            target="_blank"
            rel="noopener noreferrer"
            className="underline hover:text-foreground"
          >
            caffeine.ai
          </a>
        </p>
      </footer>
    </div>
  );
}
