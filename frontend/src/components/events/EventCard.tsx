import React, { useState } from 'react';
import type { Event } from '../../backend';
import { useRegisterForEvent } from '../../hooks/useQueries';
import { formatDate, isUpcoming } from '../../utils/time';
import { Button } from '@/components/ui/button';
import { Calendar, Users, Loader2, CheckCircle } from 'lucide-react';
import { toast } from 'sonner';

interface EventCardProps {
  event: Event;
  registeredEventIds?: Set<string>;
}

export default function EventCard({ event, registeredEventIds }: EventCardProps) {
  const registerForEvent = useRegisterForEvent();
  const [registering, setRegistering] = useState(false);

  const bannerUrl = event.banner?.getDirectURL();
  const upcoming = isUpcoming(event.date);
  const isRegistered = registeredEventIds?.has(event.id.toString());

  const handleRegister = async () => {
    setRegistering(true);
    try {
      await registerForEvent.mutateAsync(event.id);
      toast.success('Successfully registered for event!');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Registration failed';
      toast.error(msg);
    } finally {
      setRegistering(false);
    }
  };

  return (
    <article className="bg-card rounded-xl border border-border overflow-hidden shadow-xs hover:shadow-md transition-shadow animate-fade-in">
      {/* Banner */}
      <div className="w-full h-40 bg-muted overflow-hidden relative">
        {bannerUrl ? (
          <img src={bannerUrl} alt={event.title} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full cosmic-gradient flex items-center justify-center">
            <Calendar size={32} className="text-white/30" />
          </div>
        )}
        <div className={`absolute top-3 right-3 px-2.5 py-1 rounded-full text-xs font-semibold ${
          upcoming
            ? 'bg-green-500/90 text-white'
            : 'bg-black/50 text-white/70'
        }`}>
          {upcoming ? 'Upcoming' : 'Past'}
        </div>
      </div>

      <div className="p-4 space-y-3">
        <div>
          <h3 className="font-display font-bold text-base">{event.title}</h3>
          <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{event.description}</p>
        </div>

        <div className="flex items-center gap-4 text-xs text-muted-foreground">
          <div className="flex items-center gap-1.5">
            <Calendar size={13} />
            <span>{formatDate(event.date)}</span>
          </div>
          {event.registrationLimit != null && (
            <div className="flex items-center gap-1.5">
              <Users size={13} />
              <span>Limit: {event.registrationLimit.toString()}</span>
            </div>
          )}
        </div>

        {upcoming && (
          <div className="pt-1">
            {isRegistered ? (
              <div className="flex items-center gap-2 text-green-600 dark:text-green-400 text-sm font-medium">
                <CheckCircle size={15} />
                Registered
              </div>
            ) : (
              <Button
                onClick={handleRegister}
                disabled={registering}
                size="sm"
                className="h-8 px-4 text-xs font-semibold gold-gradient text-cosmic-deep border-0 hover:opacity-90"
              >
                {registering ? (
                  <><Loader2 size={12} className="animate-spin mr-1" />Registering...</>
                ) : (
                  'Register Now'
                )}
              </Button>
            )}
          </div>
        )}
      </div>
    </article>
  );
}
