import React, { useState, useRef } from 'react';
import { useCreateEvent } from '../../hooks/useQueries';
import { ExternalBlob } from '../../backend';
import { dateToNanoseconds } from '../../utils/time';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Plus, Image, X, Loader2, Calendar } from 'lucide-react';
import { toast } from 'sonner';

export default function CreateEventForm() {
  const createEvent = useCreateEvent();
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [date, setDate] = useState('');
  const [registrationLimit, setRegistrationLimit] = useState('');
  const [bannerFile, setBannerFile] = useState<File | null>(null);
  const [bannerPreview, setBannerPreview] = useState<string | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleBannerChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setBannerFile(file);
    const reader = new FileReader();
    reader.onload = ev => setBannerPreview(ev.target?.result as string);
    reader.readAsDataURL(file);
  };

  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (!title.trim()) newErrors.title = 'Title is required';
    if (!description.trim()) newErrors.description = 'Description is required';
    if (!date) newErrors.date = 'Date is required';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    try {
      let bannerBlob: ExternalBlob | null = null;
      if (bannerFile) {
        const arrayBuffer = await bannerFile.arrayBuffer();
        const bytes = new Uint8Array(arrayBuffer);
        bannerBlob = ExternalBlob.fromBytes(bytes).withUploadProgress(pct => setUploadProgress(pct));
      }

      const dateNs = dateToNanoseconds(new Date(date));
      const limit = registrationLimit ? BigInt(parseInt(registrationLimit)) : null;

      await createEvent.mutateAsync({
        title: title.trim(),
        description: description.trim(),
        date: dateNs,
        banner: bannerBlob,
        registrationLimit: limit,
      });

      toast.success('Event created successfully!');
      setOpen(false);
      setTitle('');
      setDescription('');
      setDate('');
      setRegistrationLimit('');
      setBannerFile(null);
      setBannerPreview(null);
      setUploadProgress(0);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to create event';
      toast.error(msg);
    }
  };

  const handleOpenChange = (isOpen: boolean) => {
    setOpen(isOpen);
    if (!isOpen) {
      setErrors({});
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button className="h-9 px-4 text-sm font-semibold gold-gradient text-cosmic-deep border-0 hover:opacity-90">
          <Plus size={15} className="mr-1.5" />
          Create Event
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-lg rounded-2xl">
        <DialogHeader>
          <DialogTitle className="font-display font-bold text-xl">Create New Event</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 mt-2">
          {/* Banner */}
          <div>
            <Label className="text-sm mb-1.5 block">Event Banner</Label>
            <div
              onClick={() => fileInputRef.current?.click()}
              className="w-full h-32 rounded-xl border-2 border-dashed border-border hover:border-accent/60 transition-colors cursor-pointer overflow-hidden bg-muted/30 flex items-center justify-center relative"
            >
              {bannerPreview ? (
                <>
                  <img src={bannerPreview} alt="Banner" className="w-full h-full object-cover" />
                  <button
                    type="button"
                    onClick={e => {
                      e.stopPropagation();
                      setBannerFile(null);
                      setBannerPreview(null);
                    }}
                    className="absolute top-2 right-2 w-6 h-6 rounded-full bg-black/60 flex items-center justify-center text-white"
                  >
                    <X size={12} />
                  </button>
                </>
              ) : (
                <div className="flex flex-col items-center gap-2 text-muted-foreground">
                  <Image size={24} />
                  <span className="text-xs">Click to upload banner</span>
                </div>
              )}
            </div>
            <input ref={fileInputRef} type="file" accept="image/*" onChange={handleBannerChange} className="hidden" />
          </div>

          <div className="space-y-1.5">
            <Label className="text-sm">Title *</Label>
            <Input
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder="Event title"
              className="rounded-lg"
            />
            {errors.title && <span className="text-xs text-destructive">{errors.title}</span>}
          </div>

          <div className="space-y-1.5">
            <Label className="text-sm">Description *</Label>
            <Textarea
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder="Event description"
              className="rounded-lg min-h-[80px] resize-none"
            />
            {errors.description && <span className="text-xs text-destructive">{errors.description}</span>}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-sm">Date & Time *</Label>
              <Input
                type="datetime-local"
                value={date}
                onChange={e => setDate(e.target.value)}
                className="rounded-lg"
              />
              {errors.date && <span className="text-xs text-destructive">{errors.date}</span>}
            </div>
            <div className="space-y-1.5">
              <Label className="text-sm">Registration Limit</Label>
              <Input
                type="number"
                value={registrationLimit}
                onChange={e => setRegistrationLimit(e.target.value)}
                placeholder="Optional"
                min="1"
                className="rounded-lg"
              />
            </div>
          </div>

          {createEvent.isPending && uploadProgress > 0 && (
            <Progress value={uploadProgress} className="h-1" />
          )}

          <div className="flex gap-3 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              className="flex-1 rounded-xl"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={createEvent.isPending}
              className="flex-1 rounded-xl gold-gradient text-cosmic-deep border-0 font-semibold hover:opacity-90"
            >
              {createEvent.isPending ? (
                <><Loader2 size={14} className="animate-spin mr-1.5" />Creating...</>
              ) : (
                <><Calendar size={14} className="mr-1.5" />Create Event</>
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
