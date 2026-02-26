import { useState } from 'react';
import { useCreateEvent } from '../../hooks/useQueries';
import { ExternalBlob } from '../../backend';
import { ImagePlus, X, Calendar } from 'lucide-react';

interface CreateEventFormProps {
  onSuccess?: () => void;
}

export default function CreateEventForm({ onSuccess }: CreateEventFormProps) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [date, setDate] = useState('');
  const [bannerFile, setBannerFile] = useState<File | null>(null);
  const [bannerPreview, setBannerPreview] = useState<string | null>(null);
  const [registrationLimit, setRegistrationLimit] = useState('');
  const createEvent = useCreateEvent();

  const handleBannerChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setBannerFile(file);
    const reader = new FileReader();
    reader.onload = ev => setBannerPreview(ev.target?.result as string);
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !description.trim() || !date) return;

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

    setTitle('');
    setDescription('');
    setDate('');
    setBannerFile(null);
    setBannerPreview(null);
    setRegistrationLimit('');
    onSuccess?.();
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-foreground mb-1">Event Title</label>
        <input
          type="text"
          value={title}
          onChange={e => setTitle(e.target.value)}
          className="w-full px-3 py-2 rounded-lg border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary text-sm"
          placeholder="Enter event title"
          required
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-foreground mb-1">Description</label>
        <textarea
          value={description}
          onChange={e => setDescription(e.target.value)}
          rows={3}
          className="w-full px-3 py-2 rounded-lg border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary text-sm resize-none"
          placeholder="Describe the event"
          required
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-foreground mb-1">Date & Time</label>
        <div className="relative">
          <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
          <input
            type="datetime-local"
            value={date}
            onChange={e => setDate(e.target.value)}
            className="w-full pl-9 pr-3 py-2 rounded-lg border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary text-sm"
            required
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-foreground mb-1">Registration Limit (optional)</label>
        <input
          type="number"
          value={registrationLimit}
          onChange={e => setRegistrationLimit(e.target.value)}
          className="w-full px-3 py-2 rounded-lg border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary text-sm"
          placeholder="Leave blank for unlimited"
          min="1"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-foreground mb-1">Banner Image (optional)</label>
        {bannerPreview ? (
          <div className="relative">
            <img src={bannerPreview} alt="Banner preview" className="w-full h-32 object-cover rounded-lg" />
            <button
              type="button"
              onClick={() => { setBannerFile(null); setBannerPreview(null); }}
              className="absolute top-2 right-2 bg-black/60 text-white rounded-full p-1 hover:bg-black/80"
            >
              <X className="w-3 h-3" />
            </button>
          </div>
        ) : (
          <label className="flex flex-col items-center justify-center w-full h-24 border-2 border-dashed border-border rounded-lg cursor-pointer hover:bg-muted/50 transition-colors">
            <ImagePlus className="w-6 h-6 text-muted-foreground mb-1" />
            <span className="text-xs text-muted-foreground">Click to upload banner</span>
            <input type="file" accept="image/*" className="hidden" onChange={handleBannerChange} />
          </label>
        )}
      </div>

      <button
        type="submit"
        disabled={!title.trim() || !description.trim() || !date || createEvent.isPending}
        className="w-full py-2.5 bg-primary text-primary-foreground font-medium rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50 text-sm"
      >
        {createEvent.isPending ? 'Creating…' : 'Create Event'}
      </button>
    </form>
  );
}
