import { useState } from 'react';
import {
  useGetEvents,
  useCreateEvent,
  useRegisterForEvent,
  useGetCallerUserProfile,
  useGetCallerUserRole,
  useIsCallerApproved,
} from '../hooks/useQueries';
import { Event, UserRole, ExternalBlob } from '../backend';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Skeleton } from '@/components/ui/skeleton';
import { Calendar, Clock, Users, Plus, ImageIcon, X } from 'lucide-react';
import { useInternetIdentity } from '../hooks/useInternetIdentity';

export default function EventsPage() {
  const { identity } = useInternetIdentity();
  const { data: userProfile } = useGetCallerUserProfile();
  const { data: userRoleData } = useGetCallerUserRole();
  const { data: isApproved } = useIsCallerApproved();

  const isAdmin = userRoleData === UserRole.admin;
  const userRole = userProfile?.role as string | undefined;

  const isLTOrAdmin =
    isAdmin ||
    userRole === 'president' ||
    userRole === 'vicePresident' ||
    userRole === 'secretaryTreasurer' ||
    userRole === 'lt';

  const isMCOrELT = userRole === 'mc' || userRole === 'elt';
  const canCreateEvent = isLTOrAdmin || isMCOrELT;

  const { data: events = [], isLoading } = useGetEvents();
  const registerForEvent = useRegisterForEvent();

  const [createOpen, setCreateOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [dateStr, setDateStr] = useState('');
  const [registrationLimit, setRegistrationLimit] = useState('');
  const [bannerFile, setBannerFile] = useState<File | null>(null);
  const [bannerPreview, setBannerPreview] = useState<string | null>(null);
  const createEvent = useCreateEvent();

  const now = Date.now();
  const upcomingEvents = events.filter((e) => Number(e.date) / 1_000_000 >= now);
  const pastEvents = events.filter((e) => Number(e.date) / 1_000_000 < now);

  const handleBannerChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setBannerFile(file);
      const reader = new FileReader();
      reader.onloadend = () => setBannerPreview(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const handleCreateEvent = async () => {
    if (!title.trim() || !dateStr) return;
    const dateMs = new Date(dateStr).getTime();
    const dateNs = BigInt(dateMs) * BigInt(1_000_000);

    let bannerBlob: ExternalBlob | null = null;
    if (bannerFile) {
      const arrayBuffer = await bannerFile.arrayBuffer();
      bannerBlob = ExternalBlob.fromBytes(new Uint8Array(arrayBuffer));
    }

    const limit = registrationLimit ? BigInt(parseInt(registrationLimit)) : null;

    await createEvent.mutateAsync({
      title: title.trim(),
      description: description.trim(),
      date: dateNs,
      banner: bannerBlob,
      registrationLimit: limit,
    });

    setTitle('');
    setDescription('');
    setDateStr('');
    setRegistrationLimit('');
    setBannerFile(null);
    setBannerPreview(null);
    setCreateOpen(false);
  };

  const formatDate = (timestamp: bigint) => {
    const ms = Number(timestamp) / 1_000_000;
    return new Date(ms).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const EventCard = ({ event, isPast }: { event: Event; isPast: boolean }) => {
    const bannerUrl = event.banner ? event.banner.getDirectURL() : null;

    return (
      <Card className={`overflow-hidden ${isPast ? 'opacity-70' : ''}`}>
        {bannerUrl && (
          <div className="h-40 overflow-hidden">
            <img src={bannerUrl} alt={event.title} className="w-full h-full object-cover" />
          </div>
        )}
        {!bannerUrl && (
          <div className="h-32 bg-gradient-to-br from-primary/10 to-primary/5 flex items-center justify-center">
            <Calendar className="w-10 h-10 text-primary/30" />
          </div>
        )}
        <CardHeader className="pb-2">
          <div className="flex items-start justify-between gap-2">
            <CardTitle className="text-base font-semibold leading-tight">{event.title}</CardTitle>
            {isPast ? (
              <Badge variant="secondary" className="text-xs shrink-0">Past</Badge>
            ) : (
              <Badge className="text-xs shrink-0 bg-green-500/10 text-green-700 dark:text-green-400 border-green-500/20 border">
                Upcoming
              </Badge>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          {event.description && (
            <p className="text-sm text-muted-foreground line-clamp-2">{event.description}</p>
          )}
          <div className="space-y-1.5">
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Clock className="w-3.5 h-3.5 shrink-0" />
              <span>{formatDate(event.date)}</span>
            </div>
            {event.registrationLimit && (
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Users className="w-3.5 h-3.5 shrink-0" />
                <span>Limit: {event.registrationLimit.toString()} attendees</span>
              </div>
            )}
          </div>
          {!isPast && isApproved && (
            <Button
              size="sm"
              variant="outline"
              className="w-full"
              onClick={() => registerForEvent.mutate(event.id)}
              disabled={registerForEvent.isPending}
            >
              {registerForEvent.isPending ? 'Registering...' : 'Register'}
            </Button>
          )}
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground font-display">Events</h1>
          <p className="text-sm text-muted-foreground">Upcoming and past chapter events</p>
        </div>
        {canCreateEvent && (
          <Dialog open={createOpen} onOpenChange={setCreateOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2">
                <Plus className="w-4 h-4" />
                Create Event
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-lg">
              <DialogHeader>
                <DialogTitle>Create New Event</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 mt-2">
                <div className="space-y-1">
                  <Label htmlFor="event-title">Title *</Label>
                  <Input
                    id="event-title"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Event title"
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="event-desc">Description</Label>
                  <Textarea
                    id="event-desc"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Event description"
                    className="min-h-[80px] resize-none"
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="event-date">Date & Time *</Label>
                  <Input
                    id="event-date"
                    type="datetime-local"
                    value={dateStr}
                    onChange={(e) => setDateStr(e.target.value)}
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="event-limit">Registration Limit (optional)</Label>
                  <Input
                    id="event-limit"
                    type="number"
                    value={registrationLimit}
                    onChange={(e) => setRegistrationLimit(e.target.value)}
                    placeholder="Leave empty for unlimited"
                    min="1"
                  />
                </div>

                {bannerPreview && (
                  <div className="relative rounded-lg overflow-hidden border border-border">
                    <img src={bannerPreview} alt="Banner preview" className="w-full max-h-40 object-cover" />
                    <button
                      onClick={() => {
                        setBannerFile(null);
                        setBannerPreview(null);
                      }}
                      className="absolute top-2 right-2 bg-background/80 rounded-full p-1 hover:bg-background transition-colors"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                )}

                <div className="flex items-center justify-between">
                  <label className="cursor-pointer flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
                    <ImageIcon className="w-4 h-4" />
                    <span>Add Banner</span>
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handleBannerChange}
                    />
                  </label>
                  <Button
                    onClick={handleCreateEvent}
                    disabled={createEvent.isPending || !title.trim() || !dateStr}
                  >
                    {createEvent.isPending ? 'Creating...' : 'Create Event'}
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        )}
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="overflow-hidden">
              <Skeleton className="h-40 w-full" />
              <CardHeader>
                <Skeleton className="h-5 w-3/4" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-4 w-full mb-2" />
                <Skeleton className="h-4 w-2/3" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <>
          {upcomingEvents.length > 0 && (
            <section>
              <h2 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
                <Calendar className="w-5 h-5 text-primary" />
                Upcoming Events
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {upcomingEvents.map((event) => (
                  <EventCard key={event.id.toString()} event={event} isPast={false} />
                ))}
              </div>
            </section>
          )}

          {pastEvents.length > 0 && (
            <section>
              <h2 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
                <Clock className="w-5 h-5 text-muted-foreground" />
                Past Events
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {pastEvents.map((event) => (
                  <EventCard key={event.id.toString()} event={event} isPast={true} />
                ))}
              </div>
            </section>
          )}

          {events.length === 0 && (
            <div className="text-center py-16 text-muted-foreground">
              <Calendar className="w-12 h-12 mx-auto mb-3 opacity-30" />
              <p className="font-medium">No events yet</p>
              <p className="text-sm mt-1">
                {canCreateEvent ? 'Create the first event!' : 'Check back later for upcoming events.'}
              </p>
            </div>
          )}
        </>
      )}
    </div>
  );
}
