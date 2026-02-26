import { useState } from 'react';
import {
  useGetCallerUserProfile,
  useGetPosts,
  useSubmitPost,
  useApprovePost,
  useDeletePost,
  useToggleLike,
  useGetComments,
  useAddComment,
} from '../hooks/useQueries';
import { PostCategory, PostStatus, Role } from '../backend';
import { ExternalBlob } from '../backend';
import { canApprovePost, canDeleteAnyPost, canCreatePost } from '../utils/permissions';
import { formatTimestamp } from '../lib/utils';
import { Heart, MessageCircle, Trash2, CheckCircle, ImagePlus, X, Send, Filter } from 'lucide-react';

const CATEGORY_LABELS: Record<PostCategory, string> = {
  [PostCategory.general]: 'General',
  [PostCategory.fun]: 'Fun',
  [PostCategory.requirements]: 'Requirements',
  [PostCategory.announcements]: 'Announcements',
  [PostCategory.leadershipTeam]: 'Leadership Team',
  [PostCategory.membershipCommittee]: 'Membership Committee',
  [PostCategory.coreTeam]: 'Core Team',
};

const CATEGORY_COLORS: Record<PostCategory, string> = {
  [PostCategory.general]: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300',
  [PostCategory.fun]: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300',
  [PostCategory.requirements]: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300',
  [PostCategory.announcements]: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300',
  [PostCategory.leadershipTeam]: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300',
  [PostCategory.membershipCommittee]: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300',
  [PostCategory.coreTeam]: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300',
};

interface CommentSectionProps {
  postId: bigint;
}

function CommentSection({ postId }: CommentSectionProps) {
  const { data: comments = [], isLoading } = useGetComments(postId);
  const addComment = useAddComment();
  const [text, setText] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim()) return;
    await addComment.mutateAsync({ postId, content: text.trim() });
    setText('');
  };

  if (isLoading) return <div className="py-2 text-xs text-muted-foreground">Loading comments…</div>;

  return (
    <div className="mt-3 space-y-2">
      {comments.map((c, i) => (
        <div key={i} className="flex gap-2 text-sm">
          <div className="w-6 h-6 rounded-full bg-muted flex items-center justify-center text-xs font-bold shrink-0">
            {c.author.toString().charAt(0).toUpperCase()}
          </div>
          <div className="flex-1 bg-muted/50 rounded-lg px-3 py-1.5">
            <p className="text-xs font-medium text-foreground mb-0.5">{c.author.toString().slice(0, 8)}…</p>
            <p className="text-xs text-muted-foreground">{c.content}</p>
          </div>
        </div>
      ))}
      <form onSubmit={handleSubmit} className="flex gap-2 mt-2">
        <input
          value={text}
          onChange={e => setText(e.target.value)}
          placeholder="Write a comment…"
          className="flex-1 text-xs px-3 py-1.5 rounded-lg border border-border bg-background text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
        />
        <button
          type="submit"
          disabled={!text.trim() || addComment.isPending}
          className="p-1.5 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 disabled:opacity-50"
        >
          <Send className="w-3.5 h-3.5" />
        </button>
      </form>
    </div>
  );
}

export default function FeedPage() {
  const { data: userProfile } = useGetCallerUserProfile();
  const [categoryFilter, setCategoryFilter] = useState<PostCategory | null>(null);
  const { data: posts = [], isLoading } = useGetPosts(categoryFilter);
  const submitPost = useSubmitPost();
  const approvePost = useApprovePost();
  const deletePost = useDeletePost();
  const toggleLike = useToggleLike();

  const [content, setContent] = useState('');
  const [category, setCategory] = useState<PostCategory>(PostCategory.general);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [expandedComments, setExpandedComments] = useState<Set<string>>(new Set());

  const userRole = userProfile?.role;
  // canCreatePost(role, category) — use general as the baseline check for showing the form
  const canPost = userRole ? canCreatePost(userRole, PostCategory.general) : false;

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
    let imageBlob: ExternalBlob | null = null;
    if (imageFile) {
      const bytes = new Uint8Array(await imageFile.arrayBuffer());
      imageBlob = ExternalBlob.fromBytes(bytes as Uint8Array<ArrayBuffer>);
    }
    await submitPost.mutateAsync({ category, content: content.trim(), image: imageBlob });
    setContent('');
    setImageFile(null);
    setImagePreview(null);
  };

  const toggleComments = (postId: string) => {
    setExpandedComments(prev => {
      const next = new Set(prev);
      if (next.has(postId)) next.delete(postId);
      else next.add(postId);
      return next;
    });
  };

  return (
    <div className="max-w-2xl mx-auto py-6 px-4 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-foreground">Community Feed</h1>
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-muted-foreground" />
          <select
            value={categoryFilter ?? ''}
            onChange={e => setCategoryFilter(e.target.value ? e.target.value as PostCategory : null)}
            className="text-xs bg-muted text-foreground border border-border rounded-lg px-2 py-1.5 focus:outline-none"
          >
            <option value="">All Categories</option>
            {Object.values(PostCategory).map(cat => (
              <option key={cat} value={cat}>{CATEGORY_LABELS[cat]}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Create post */}
      {canPost && (
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
              <button type="button" onClick={() => { setImageFile(null); setImagePreview(null); }} className="absolute top-1 right-1 bg-black/60 text-white rounded-full p-0.5">
                <X className="w-3 h-3" />
              </button>
            </div>
          )}
          <div className="flex items-center justify-between gap-2 pt-2 border-t border-border">
            <div className="flex items-center gap-2">
              <select
                value={category}
                onChange={e => setCategory(e.target.value as PostCategory)}
                className="text-xs bg-muted text-foreground border border-border rounded-lg px-2 py-1.5 focus:outline-none"
              >
                {Object.values(PostCategory).map(cat => (
                  <option key={cat} value={cat}>{CATEGORY_LABELS[cat]}</option>
                ))}
              </select>
              <label className="cursor-pointer p-1.5 rounded-lg hover:bg-muted transition-colors text-muted-foreground">
                <ImagePlus className="w-4 h-4" />
                <input type="file" accept="image/*" className="hidden" onChange={handleImageChange} />
              </label>
            </div>
            <button
              type="submit"
              disabled={!content.trim() || submitPost.isPending}
              className="flex items-center gap-1.5 px-4 py-1.5 bg-primary text-primary-foreground text-sm font-medium rounded-lg hover:bg-primary/90 disabled:opacity-50"
            >
              <Send className="w-3.5 h-3.5" />
              {submitPost.isPending ? 'Posting…' : 'Post'}
            </button>
          </div>
        </form>
      )}

      {/* Posts */}
      {isLoading ? (
        <div className="flex justify-center py-12">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      ) : posts.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          <p>No posts yet. Be the first to share something!</p>
        </div>
      ) : (
        <div className="space-y-4">
          {posts.map(post => {
            const postIdStr = post.id.toString();
            const isLiked = false;
            const likeCount = post.likes.length;
            const showComments = expandedComments.has(postIdStr);
            const canApprove = userRole ? canApprovePost(userRole) : false;
            const canDelete = userRole ? canDeleteAnyPost(userRole) : false;
            const imageUrl = post.image ? post.image.getDirectURL() : null;

            return (
              <article key={postIdStr} className="bg-card border border-border rounded-xl p-4 space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-full bg-primary/20 flex items-center justify-center text-sm font-bold text-primary shrink-0">
                      {post.authorName.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-foreground">{post.authorName}</p>
                      <p className="text-xs text-muted-foreground">{formatTimestamp(post.timestamp)}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${CATEGORY_COLORS[post.category]}`}>
                      {CATEGORY_LABELS[post.category]}
                    </span>
                    {post.status === PostStatus.pending && (
                      <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300">
                        Pending
                      </span>
                    )}
                  </div>
                </div>

                <p className="text-sm text-foreground whitespace-pre-wrap">{post.content}</p>

                {imageUrl && (
                  <img src={imageUrl} alt="Post image" className="w-full rounded-lg object-cover max-h-80" />
                )}

                <div className="flex items-center gap-3 pt-1 border-t border-border">
                  <button
                    onClick={() => toggleLike.mutate(post.id)}
                    disabled={toggleLike.isPending}
                    className={`flex items-center gap-1.5 text-xs font-medium transition-colors ${isLiked ? 'text-rose-500' : 'text-muted-foreground hover:text-rose-500'}`}
                  >
                    <Heart className={`w-4 h-4 ${isLiked ? 'fill-current' : ''}`} />
                    {likeCount}
                  </button>
                  <button
                    onClick={() => toggleComments(postIdStr)}
                    className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors"
                  >
                    <MessageCircle className="w-4 h-4" />
                    Comments
                  </button>
                  <div className="flex-1" />
                  {canApprove && post.status === PostStatus.pending && (
                    <button
                      onClick={() => approvePost.mutate(post.id)}
                      disabled={approvePost.isPending}
                      className="flex items-center gap-1 text-xs font-medium text-green-600 hover:text-green-700 transition-colors disabled:opacity-50"
                    >
                      <CheckCircle className="w-4 h-4" />
                      Approve
                    </button>
                  )}
                  {canDelete && (
                    <button
                      onClick={() => deletePost.mutate(post.id)}
                      disabled={deletePost.isPending}
                      className="flex items-center gap-1 text-xs font-medium text-destructive hover:text-destructive/80 transition-colors disabled:opacity-50"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>

                {showComments && <CommentSection postId={post.id} />}
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
