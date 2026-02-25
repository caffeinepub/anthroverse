import { useState } from 'react';
import { useInternetIdentity } from '../hooks/useInternetIdentity';
import {
  useGetPosts,
  useSubmitPost,
  useToggleLike,
  useDeletePost,
  useApprovePost,
  useAddComment,
  useGetComments,
  useGetCallerUserProfile,
  useGetCallerUserRole,
  useIsCallerApproved,
  useRequestApproval,
} from '../hooks/useQueries';
import { PostCategory, PostView, PostStatus, UserRole, ExternalBlob } from '../backend';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Heart,
  MessageCircle,
  Trash2,
  CheckCircle,
  Plus,
  ImageIcon,
  X,
  Clock,
  Filter,
} from 'lucide-react';
import { Principal } from '@dfinity/principal';

const categoryLabels: Record<string, string> = {
  announcements: '📢 Announcements',
  general: '💬 General',
  fun: '🎉 Fun',
  requirements: '📋 Requirements',
  leadershipTeam: '👑 Leadership Team',
  membershipCommittee: '🤝 Membership Committee',
  coreTeam: '⚙️ Core Team',
};

const categoryColors: Record<string, string> = {
  announcements: 'bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/20',
  general: 'bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-500/20',
  fun: 'bg-pink-500/10 text-pink-700 dark:text-pink-400 border-pink-500/20',
  requirements: 'bg-purple-500/10 text-purple-700 dark:text-purple-400 border-purple-500/20',
  leadershipTeam: 'bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/20',
  membershipCommittee: 'bg-teal-500/10 text-teal-700 dark:text-teal-400 border-teal-500/20',
  coreTeam: 'bg-indigo-500/10 text-indigo-700 dark:text-indigo-400 border-indigo-500/20',
};

function PostCard({
  post,
  currentPrincipal,
  isAdmin,
  isLT,
}: {
  post: PostView;
  currentPrincipal: string;
  isAdmin: boolean;
  isLT: boolean;
}) {
  const [showComments, setShowComments] = useState(false);
  const [commentText, setCommentText] = useState('');
  const toggleLike = useToggleLike();
  const deletePost = useDeletePost();
  const approvePost = useApprovePost();
  const addComment = useAddComment();
  const { data: comments = [], isLoading: commentsLoading } = useGetComments(
    showComments ? post.id : null
  );

  const isLiked = post.likes.some(
    (p: Principal) => p.toString() === currentPrincipal
  );
  const isAuthor = post.author.toString() === currentPrincipal;
  const canDelete = isAdmin || isAuthor;
  const canApprove = isAdmin || isLT;

  const profilePicUrl = undefined;

  const getInitials = (name: string) =>
    name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);

  const formatTime = (timestamp: bigint) => {
    const ms = Number(timestamp) / 1_000_000;
    const date = new Date(ms);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const handleComment = async () => {
    if (!commentText.trim()) return;
    await addComment.mutateAsync({ postId: post.id, content: commentText.trim() });
    setCommentText('');
  };

  const imageUrl = post.image ? post.image.getDirectURL() : null;

  return (
    <Card className="overflow-hidden">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <Avatar className="w-10 h-10 shrink-0">
              {profilePicUrl && <AvatarImage src={profilePicUrl} />}
              <AvatarFallback className="bg-primary/10 text-primary text-sm font-semibold">
                {getInitials(post.authorName)}
              </AvatarFallback>
            </Avatar>
            <div>
              <p className="font-semibold text-sm text-foreground">{post.authorName}</p>
              <p className="text-xs text-muted-foreground">{formatTime(post.timestamp)}</p>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <span
              className={`inline-flex items-center text-xs px-2 py-0.5 rounded-full border font-medium ${
                categoryColors[post.category] || 'bg-muted text-muted-foreground border-border'
              }`}
            >
              {categoryLabels[post.category] || post.category}
            </span>
            {post.status === PostStatus.pending && (
              <Badge variant="outline" className="text-xs border-amber-500/30 text-amber-600">
                <Clock className="w-3 h-3 mr-1" />
                Pending
              </Badge>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-0 space-y-3">
        <p className="text-sm text-foreground leading-relaxed whitespace-pre-wrap">{post.content}</p>

        {imageUrl && (
          <div className="rounded-lg overflow-hidden border border-border">
            <img src={imageUrl} alt="Post image" className="w-full max-h-80 object-cover" />
          </div>
        )}

        <div className="flex items-center gap-3 pt-1">
          <button
            onClick={() => toggleLike.mutate(post.id)}
            disabled={toggleLike.isPending}
            className={`flex items-center gap-1.5 text-sm transition-colors ${
              isLiked
                ? 'text-rose-500'
                : 'text-muted-foreground hover:text-rose-500'
            }`}
          >
            <Heart className={`w-4 h-4 ${isLiked ? 'fill-rose-500' : ''}`} />
            <span>{post.likes.length}</span>
          </button>

          <button
            onClick={() => setShowComments(!showComments)}
            className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <MessageCircle className="w-4 h-4" />
            <span>{comments.length > 0 ? comments.length : 'Comment'}</span>
          </button>

          <div className="ml-auto flex items-center gap-2">
            {post.status === PostStatus.pending && canApprove && (
              <button
                onClick={() => approvePost.mutate(post.id)}
                disabled={approvePost.isPending}
                className="flex items-center gap-1 text-xs text-green-600 hover:text-green-700 transition-colors"
              >
                <CheckCircle className="w-4 h-4" />
                <span>Approve</span>
              </button>
            )}
            {canDelete && (
              <button
                onClick={() => deletePost.mutate(post.id)}
                disabled={deletePost.isPending}
                className="text-muted-foreground hover:text-destructive transition-colors"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {showComments && (
          <div className="border-t border-border pt-3 space-y-3">
            {commentsLoading ? (
              <div className="space-y-2">
                <Skeleton className="h-8 w-full" />
                <Skeleton className="h-8 w-3/4" />
              </div>
            ) : (
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {comments.map((comment, idx) => (
                  <div key={idx} className="flex gap-2">
                    <Avatar className="w-6 h-6 shrink-0 mt-0.5">
                      <AvatarFallback className="text-[10px] bg-muted">
                        {comment.author.toString().slice(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 bg-muted/50 rounded-lg px-3 py-2">
                      <p className="text-xs font-medium text-foreground">
                        {comment.author.toString().slice(0, 8)}...
                      </p>
                      <p className="text-xs text-muted-foreground mt-0.5">{comment.content}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
            <div className="flex gap-2">
              <Textarea
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                placeholder="Write a comment..."
                className="text-sm min-h-[60px] resize-none"
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleComment();
                  }
                }}
              />
              <Button
                size="sm"
                onClick={handleComment}
                disabled={addComment.isPending || !commentText.trim()}
                className="self-end"
              >
                Post
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function CreatePostDialog({
  isAdmin,
  userRole,
}: {
  isAdmin: boolean;
  userRole: string | undefined;
}) {
  const [open, setOpen] = useState(false);
  const [category, setCategory] = useState<PostCategory>(PostCategory.general);
  const [content, setContent] = useState('');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const submitPost = useSubmitPost();

  const isLTOrAdmin =
    isAdmin ||
    userRole === 'president' ||
    userRole === 'vicePresident' ||
    userRole === 'secretaryTreasurer' ||
    userRole === 'lt';

  const isMCOrELT = userRole === 'mc' || userRole === 'elt';

  const availableCategories = Object.entries(categoryLabels).filter(([key]) => {
    if (key === 'leadershipTeam') return isLTOrAdmin;
    if (key === 'membershipCommittee') return isLTOrAdmin || isMCOrELT;
    if (key === 'coreTeam') return isLTOrAdmin || isMCOrELT;
    if (key === 'announcements') return isLTOrAdmin || isMCOrELT;
    return true;
  });

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => setImagePreview(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async () => {
    if (!content.trim()) return;

    let imageBlob: ExternalBlob | null = null;
    if (imageFile) {
      const arrayBuffer = await imageFile.arrayBuffer();
      imageBlob = ExternalBlob.fromBytes(new Uint8Array(arrayBuffer));
    }

    await submitPost.mutateAsync({ category, content: content.trim(), image: imageBlob });
    setContent('');
    setCategory(PostCategory.general);
    setImageFile(null);
    setImagePreview(null);
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="gap-2">
          <Plus className="w-4 h-4" />
          New Post
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Create a Post</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 mt-2">
          <Select value={category} onValueChange={(v) => setCategory(v as PostCategory)}>
            <SelectTrigger>
              <SelectValue placeholder="Select category" />
            </SelectTrigger>
            <SelectContent>
              {availableCategories.map(([key, label]) => (
                <SelectItem key={key} value={key}>
                  {label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="What's on your mind?"
            className="min-h-[120px] resize-none"
          />

          {imagePreview && (
            <div className="relative rounded-lg overflow-hidden border border-border">
              <img src={imagePreview} alt="Preview" className="w-full max-h-48 object-cover" />
              <button
                onClick={() => {
                  setImageFile(null);
                  setImagePreview(null);
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
              <span>Add Image</span>
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleImageChange}
              />
            </label>
            <Button
              onClick={handleSubmit}
              disabled={submitPost.isPending || !content.trim()}
            >
              {submitPost.isPending ? 'Posting...' : 'Post'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default function FeedPage() {
  const { identity } = useInternetIdentity();
  const currentPrincipal = identity?.getPrincipal().toString() ?? '';
  const [categoryFilter, setCategoryFilter] = useState<PostCategory | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  const { data: userProfile } = useGetCallerUserProfile();
  const { data: userRoleData } = useGetCallerUserRole();
  const { data: isApproved, isLoading: approvalLoading } = useIsCallerApproved();
  const requestApproval = useRequestApproval();

  const isAdmin = userRoleData === UserRole.admin;
  const userRole = userProfile?.role as string | undefined;

  const isLTOrAdmin =
    isAdmin ||
    userRole === 'president' ||
    userRole === 'vicePresident' ||
    userRole === 'secretaryTreasurer' ||
    userRole === 'lt';

  const { data: posts = [], isLoading: postsLoading, error: postsError } = useGetPosts(categoryFilter);

  const filteredPosts = searchQuery
    ? posts.filter(
        (p) =>
          p.authorName.toLowerCase().includes(searchQuery.toLowerCase()) ||
          p.content.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : posts;

  if (approvalLoading) {
    return (
      <div className="max-w-2xl mx-auto space-y-4">
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-48 w-full" />
        <Skeleton className="h-48 w-full" />
      </div>
    );
  }

  if (!isApproved) {
    return (
      <div className="max-w-md mx-auto mt-16 text-center space-y-6">
        <div className="w-16 h-16 rounded-full bg-amber-500/10 flex items-center justify-center mx-auto">
          <Clock className="w-8 h-8 text-amber-500" />
        </div>
        <div className="space-y-2">
          <h2 className="text-xl font-bold text-foreground">Account Pending Approval</h2>
          <p className="text-muted-foreground text-sm">
            Your account is awaiting approval from an administrator. You'll be notified once approved.
          </p>
        </div>
        <Button
          onClick={() => requestApproval.mutate()}
          disabled={requestApproval.isPending}
          variant="outline"
        >
          {requestApproval.isPending ? 'Requesting...' : 'Request Approval'}
        </Button>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground font-display">Community Feed</h1>
          <p className="text-sm text-muted-foreground">Stay connected with your chapter</p>
        </div>
        <CreatePostDialog isAdmin={isAdmin} userRole={userRole} />
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search posts..."
            className="w-full h-9 px-3 py-1 text-sm bg-background border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>
        <Select
          value={categoryFilter ?? 'all'}
          onValueChange={(v) => setCategoryFilter(v === 'all' ? null : (v as PostCategory))}
        >
          <SelectTrigger className="w-full sm:w-48">
            <Filter className="w-3.5 h-3.5 mr-1.5 text-muted-foreground" />
            <SelectValue placeholder="All categories" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Categories</SelectItem>
            {Object.entries(categoryLabels).map(([key, label]) => (
              <SelectItem key={key} value={key}>
                {label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {postsLoading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <Card key={i}>
              <CardHeader>
                <div className="flex items-center gap-3">
                  <Skeleton className="w-10 h-10 rounded-full" />
                  <div className="space-y-1.5">
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-3 w-24" />
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <Skeleton className="h-16 w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : postsError ? (
        <div className="text-center py-12 text-muted-foreground">
          <p>Failed to load posts. Please try again.</p>
        </div>
      ) : filteredPosts.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          <MessageCircle className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p className="font-medium">No posts yet</p>
          <p className="text-sm mt-1">Be the first to share something!</p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredPosts.map((post) => (
            <PostCard
              key={post.id.toString()}
              post={post}
              currentPrincipal={currentPrincipal}
              isAdmin={isAdmin}
              isLT={isLTOrAdmin}
            />
          ))}
        </div>
      )}
    </div>
  );
}
