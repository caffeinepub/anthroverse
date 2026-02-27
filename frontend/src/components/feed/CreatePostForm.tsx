import { useState } from 'react';
import { useSubmitPost, useGetCallerUserProfile } from '../../hooks/useQueries';
import { PostCategory } from '../../backend';
import { canPostAnnouncement } from '../../utils/permissions';
import { ExternalBlob } from '../../backend';
import { ImagePlus, X, Send } from 'lucide-react';

interface CreatePostFormProps {
  defaultCategory?: PostCategory;
  onSuccess?: () => void;
}

const CATEGORY_LABELS: Record<PostCategory, string> = {
  [PostCategory.general]: 'General',
  [PostCategory.fun]: 'Fun',
  [PostCategory.requirements]: 'Requirements',
  [PostCategory.announcements]: 'Announcements',
  [PostCategory.leadershipTeam]: 'Leadership Team',
  [PostCategory.membershipCommittee]: 'Membership Committee',
  [PostCategory.coreTeam]: 'Core Team',
};

export default function CreatePostForm({ defaultCategory, onSuccess }: CreatePostFormProps) {
  const { data: userProfile } = useGetCallerUserProfile();
  const [content, setContent] = useState('');
  const [category, setCategory] = useState<PostCategory>(defaultCategory ?? PostCategory.general);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const submitPost = useSubmitPost();

  const userRole = userProfile?.role;

  const availableCategories = Object.values(PostCategory).filter(cat => {
    if (cat === PostCategory.announcements) {
      return userRole && canPostAnnouncement(userRole);
    }
    return true;
  });

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

    // Use null (not undefined) to satisfy ExternalBlob | null type
    let imageBlob: ExternalBlob | null = null;
    if (imageFile) {
      const bytes = new Uint8Array(await imageFile.arrayBuffer());
      imageBlob = ExternalBlob.fromBytes(bytes as Uint8Array<ArrayBuffer>);
    }

    await submitPost.mutateAsync({ category, content: content.trim(), imageBlob });
    setContent('');
    setImageFile(null);
    setImagePreview(null);
    onSuccess?.();
  };

  return (
    <form onSubmit={handleSubmit} className="bg-card border border-border rounded-xl p-4 space-y-3">
      <div className="flex items-start gap-3">
        <div className="w-9 h-9 rounded-full bg-primary/20 flex items-center justify-center text-sm font-bold text-primary shrink-0">
          {userProfile?.name?.charAt(0)?.toUpperCase() ?? '?'}
        </div>
        <textarea
          value={content}
          onChange={e => setContent(e.target.value)}
          placeholder="Share something with the community…"
          rows={3}
          className="flex-1 resize-none bg-transparent text-foreground placeholder:text-muted-foreground text-sm focus:outline-none"
        />
      </div>

      {imagePreview && (
        <div className="relative inline-block">
          <img src={imagePreview} alt="Preview" className="max-h-40 rounded-lg object-cover" />
          <button
            type="button"
            onClick={() => { setImageFile(null); setImagePreview(null); }}
            className="absolute top-1 right-1 bg-black/60 text-white rounded-full p-0.5 hover:bg-black/80"
          >
            <X className="w-3 h-3" />
          </button>
        </div>
      )}

      <div className="flex items-center justify-between gap-2 pt-2 border-t border-border">
        <div className="flex items-center gap-2">
          <select
            value={category}
            onChange={e => setCategory(e.target.value as PostCategory)}
            className="text-xs bg-muted text-foreground border border-border rounded-lg px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-primary"
          >
            {availableCategories.map(cat => (
              <option key={cat} value={cat}>{CATEGORY_LABELS[cat]}</option>
            ))}
          </select>
          <label className="cursor-pointer p-1.5 rounded-lg hover:bg-muted transition-colors text-muted-foreground hover:text-foreground">
            <ImagePlus className="w-4 h-4" />
            <input type="file" accept="image/*" className="hidden" onChange={handleImageChange} />
          </label>
        </div>
        <button
          type="submit"
          disabled={!content.trim() || submitPost.isPending}
          className="flex items-center gap-1.5 px-4 py-1.5 bg-primary text-primary-foreground text-sm font-medium rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50"
        >
          <Send className="w-3.5 h-3.5" />
          {submitPost.isPending ? 'Posting…' : 'Post'}
        </button>
      </div>
    </form>
  );
}
