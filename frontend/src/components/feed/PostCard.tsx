import React, { useState } from 'react';
import type { PostView } from '../../backend';
import { PostStatus, PostCategory } from '../../backend';
import { useInternetIdentity } from '../../hooks/useInternetIdentity';
import { useGetCallerUserProfile, useToggleLike, useDeletePost, useApprovePost, useGetComments, useAddComment } from '../../hooks/useQueries';
import { canDeleteAnyPost, canApproveContent } from '../../utils/permissions';
import { formatRelativeTime } from '../../utils/time';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Heart, MessageCircle, Trash2, CheckCircle, ChevronDown, ChevronUp, Loader2 } from 'lucide-react';

interface PostCardProps {
  post: PostView;
}

function getCategoryLabel(cat: PostCategory): string {
  switch (cat) {
    case PostCategory.announcements: return 'Announcement';
    case PostCategory.general: return 'General';
    case PostCategory.fun: return 'Fun';
    case PostCategory.requirements: return 'Requirements';
    case PostCategory.leadershipTeam: return 'Leadership Team';
    case PostCategory.membershipCommittee: return 'Membership Committee';
    case PostCategory.coreTeam: return 'Core Team';
    default: return 'Post';
  }
}

function getCategoryColor(cat: PostCategory): string {
  switch (cat) {
    case PostCategory.announcements: return 'bg-amber-500/20 text-amber-600 dark:text-amber-400 border-amber-500/30';
    case PostCategory.general: return 'bg-blue-500/20 text-blue-600 dark:text-blue-400 border-blue-500/30';
    case PostCategory.fun: return 'bg-pink-500/20 text-pink-600 dark:text-pink-400 border-pink-500/30';
    case PostCategory.requirements: return 'bg-green-500/20 text-green-600 dark:text-green-400 border-green-500/30';
    case PostCategory.leadershipTeam: return 'bg-purple-500/20 text-purple-600 dark:text-purple-400 border-purple-500/30';
    case PostCategory.membershipCommittee: return 'bg-teal-500/20 text-teal-600 dark:text-teal-400 border-teal-500/30';
    case PostCategory.coreTeam: return 'bg-orange-500/20 text-orange-600 dark:text-orange-400 border-orange-500/30';
    default: return 'bg-muted text-muted-foreground border-border';
  }
}

export default function PostCard({ post }: PostCardProps) {
  const { identity } = useInternetIdentity();
  const { data: profile } = useGetCallerUserProfile();
  const toggleLike = useToggleLike();
  const deletePost = useDeletePost();
  const approvePost = useApprovePost();
  const addComment = useAddComment();
  const [showComments, setShowComments] = useState(false);
  const [commentText, setCommentText] = useState('');

  // Only fetch comments when expanded; use a sentinel value to disable when collapsed
  const commentsPostId = showComments ? post.id : BigInt(-1);
  const { data: comments = [], isLoading: commentsLoading } = useGetComments(commentsPostId);

  const isAuthor = identity && post.author.toString() === identity.getPrincipal().toString();
  const canDelete = profile && (isAuthor || canDeleteAnyPost(profile.role));
  const canApprove = profile && canApproveContent(profile.role) && post.status === PostStatus.pending;
  const isLiked = identity && post.likes.some(p => p.toString() === identity.getPrincipal().toString());
  const imageUrl = post.image?.getDirectURL();

  const handleComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentText.trim()) return;
    await addComment.mutateAsync({ postId: post.id, content: commentText.trim() });
    setCommentText('');
  };

  return (
    <article className="bg-card rounded-xl border border-border shadow-xs overflow-hidden animate-fade-in">
      {/* Post Image */}
      {imageUrl && (
        <div className="w-full aspect-video bg-muted overflow-hidden">
          <img src={imageUrl} alt="Post" className="w-full h-full object-cover" />
        </div>
      )}

      <div className="p-4 space-y-3">
        {/* Header */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <Avatar className="w-9 h-9">
              <AvatarFallback className="bg-accent/20 text-accent-foreground text-xs font-bold">
                {post.authorName.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2)}
              </AvatarFallback>
            </Avatar>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-semibold text-sm">{post.authorName}</span>
                {post.status === PostStatus.pending && (
                  <span className="text-xs bg-amber-500/20 text-amber-600 dark:text-amber-400 border border-amber-500/30 px-2 py-0.5 rounded-full font-medium">
                    Pending
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2 mt-0.5">
                <span className={`text-xs px-2 py-0.5 rounded-full border font-medium ${getCategoryColor(post.category)}`}>
                  {getCategoryLabel(post.category)}
                </span>
                <span className="text-xs text-muted-foreground">{formatRelativeTime(post.timestamp)}</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-1 shrink-0">
            {canApprove && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => approvePost.mutate(post.id)}
                disabled={approvePost.isPending}
                className="h-7 px-2 text-green-600 hover:text-green-700 hover:bg-green-500/10 text-xs"
              >
                {approvePost.isPending ? (
                  <Loader2 size={12} className="animate-spin" />
                ) : (
                  <CheckCircle size={12} />
                )}
                <span className="ml-1">Approve</span>
              </Button>
            )}
            {canDelete && (
              <Button
                variant="ghost"
                size="icon"
                onClick={() => deletePost.mutate(post.id)}
                disabled={deletePost.isPending}
                className="h-7 w-7 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
              >
                {deletePost.isPending ? (
                  <Loader2 size={12} className="animate-spin" />
                ) : (
                  <Trash2 size={12} />
                )}
              </Button>
            )}
          </div>
        </div>

        {/* Content */}
        <p className="text-sm leading-relaxed text-foreground whitespace-pre-wrap">{post.content}</p>

        {/* Actions */}
        <div className="flex items-center gap-4 pt-1 border-t border-border">
          <button
            onClick={() => toggleLike.mutate(post.id)}
            disabled={toggleLike.isPending}
            className={`flex items-center gap-1.5 text-sm transition-colors ${
              isLiked ? 'text-red-500' : 'text-muted-foreground hover:text-red-500'
            }`}
          >
            <Heart size={15} fill={isLiked ? 'currentColor' : 'none'} />
            <span>{post.likes.length}</span>
          </button>

          <button
            onClick={() => setShowComments(!showComments)}
            className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <MessageCircle size={15} />
            <span>{showComments ? 'Hide' : 'Comments'}</span>
            {showComments ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
          </button>
        </div>

        {/* Comments */}
        {showComments && (
          <div className="space-y-3 pt-2 border-t border-border">
            {commentsLoading ? (
              <div className="flex justify-center py-3">
                <Loader2 size={16} className="animate-spin text-muted-foreground" />
              </div>
            ) : comments.length === 0 ? (
              <p className="text-xs text-muted-foreground text-center py-2">No comments yet. Be the first!</p>
            ) : (
              <div className="space-y-2">
                {comments.map((comment, idx) => (
                  <div key={idx} className="flex gap-2">
                    <Avatar className="w-6 h-6 shrink-0">
                      <AvatarFallback className="bg-muted text-muted-foreground text-[10px]">
                        {comment.author.toString().slice(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="bg-muted/50 rounded-lg px-3 py-2 flex-1">
                      <p className="text-xs font-medium text-foreground mb-0.5">
                        {formatRelativeTime(comment.timestamp)}
                      </p>
                      <p className="text-xs text-foreground">{comment.content}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}

            <form onSubmit={handleComment} className="flex gap-2">
              <Textarea
                value={commentText}
                onChange={e => setCommentText(e.target.value)}
                placeholder="Write a comment..."
                className="text-xs min-h-[60px] resize-none rounded-lg"
                onKeyDown={e => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleComment(e);
                  }
                }}
              />
              <Button
                type="submit"
                size="sm"
                disabled={!commentText.trim() || addComment.isPending}
                className="self-end h-8 px-3 text-xs"
              >
                {addComment.isPending ? <Loader2 size={12} className="animate-spin" /> : 'Post'}
              </Button>
            </form>
          </div>
        )}
      </div>
    </article>
  );
}
