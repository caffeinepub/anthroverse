import React, { useState, useRef } from 'react';
import { PostCategory } from '../../backend';
import { ExternalBlob } from '../../backend';
import { useGetCallerUserProfile, useSubmitPost } from '../../hooks/useQueries';
import { canPostAnnouncement } from '../../utils/permissions';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';
import { Image, X, Loader2, Send } from 'lucide-react';
import { toast } from 'sonner';

interface CreatePostFormProps {
  defaultCategory?: PostCategory;
  onSuccess?: () => void;
}

const PUBLIC_CATEGORIES = [
  { value: PostCategory.general, label: 'General' },
  { value: PostCategory.fun, label: 'Fun' },
  { value: PostCategory.requirements, label: 'Requirements' },
];

const ANNOUNCEMENT_CATEGORY = { value: PostCategory.announcements, label: 'Announcement' };

export default function CreatePostForm({ defaultCategory, onSuccess }: CreatePostFormProps) {
  const { data: profile } = useGetCallerUserProfile();
  const submitPost = useSubmitPost();
  const [content, setContent] = useState('');
  const [category, setCategory] = useState<PostCategory>(defaultCategory || PostCategory.general);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const canAnnounce = profile && canPostAnnouncement(profile.role);

  const availableCategories = [
    ...PUBLIC_CATEGORIES,
    ...(canAnnounce ? [ANNOUNCEMENT_CATEGORY] : []),
  ];

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImageFile(file);
    const reader = new FileReader();
    reader.onload = ev => setImagePreview(ev.target?.result as string);
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim()) return;

    try {
      let imageBlob: ExternalBlob | null = null;
      if (imageFile) {
        const arrayBuffer = await imageFile.arrayBuffer();
        const bytes = new Uint8Array(arrayBuffer);
        imageBlob = ExternalBlob.fromBytes(bytes).withUploadProgress(pct => setUploadProgress(pct));
      }

      await submitPost.mutateAsync({ category, content: content.trim(), image: imageBlob });
      setContent('');
      setImageFile(null);
      setImagePreview(null);
      setUploadProgress(0);
      toast.success('Post created successfully!');
      onSuccess?.();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to create post';
      toast.error(msg);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="bg-card rounded-xl border border-border p-4 space-y-3">
      <div className="flex items-center gap-3">
        <Select value={category} onValueChange={v => setCategory(v as PostCategory)}>
          <SelectTrigger className="w-44 h-8 text-xs rounded-lg">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {availableCategories.map(cat => (
              <SelectItem key={cat.value} value={cat.value} className="text-xs">
                {cat.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <Textarea
        value={content}
        onChange={e => setContent(e.target.value)}
        placeholder="What's on your mind?"
        className="min-h-[80px] resize-none rounded-lg text-sm"
      />

      {imagePreview && (
        <div className="relative w-full aspect-video rounded-lg overflow-hidden bg-muted">
          <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
          <button
            type="button"
            onClick={() => { setImageFile(null); setImagePreview(null); }}
            className="absolute top-2 right-2 w-6 h-6 rounded-full bg-black/60 flex items-center justify-center text-white hover:bg-black/80 transition-colors"
          >
            <X size={12} />
          </button>
        </div>
      )}

      {submitPost.isPending && uploadProgress > 0 && (
        <Progress value={uploadProgress} className="h-1" />
      )}

      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
        >
          <Image size={14} />
          Add Image
        </button>
        <input ref={fileInputRef} type="file" accept="image/*" onChange={handleImageChange} className="hidden" />

        <Button
          type="submit"
          size="sm"
          disabled={!content.trim() || submitPost.isPending}
          className="h-8 px-4 text-xs font-semibold"
        >
          {submitPost.isPending ? (
            <Loader2 size={12} className="animate-spin mr-1" />
          ) : (
            <Send size={12} className="mr-1" />
          )}
          Post
        </Button>
      </div>
    </form>
  );
}
