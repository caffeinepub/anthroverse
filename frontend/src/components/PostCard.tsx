import React, { useState } from 'react';
import { Heart, MessageCircle, Trash2, CheckCircle, MoreVertical } from 'lucide-react';
import { type PostView, PostCategory, PostStatus, Role } from '../backend';
import { useInternetIdentity } from '../hooks/useInternetIdentity';
import {
  useToggleLike,
  useDeletePost,
  useApprovePost,
  useGetComments,
  useAddComment,
} from '../hooks/useQueries';
import {
  categoryToLabel,
  formatTimestamp,
  canApproveContent,
  getInitials,
} from '../lib/utils';
import RoleBadge from './RoleBadge';
import LoadingSpinner from './LoadingSpinner';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface PostCardProps {
  post: PostView;
  userRole: Role;
  isAdmin: boolean;
  currentPrincipal?: string;
}

export default function PostCard({ post, userRole, isAdmin, currentPrincipal }: PostCardProps) {
  const { identity } = useInternetIdentity();
  const [showComments, setShowComments] = useState(false);
  const [commentText, setCommentText] = useState('');

  const toggleLike = useToggleLike();
  const deletePost = useDeletePost();
  const approvePost = useApprovePost();
  const addComment = useAddComment();
  const { data: comments = [], isLoading: commentsLoading } = useGetComments(
    showComments ? post.id : null
  );

  const isLiked = identity
    ? post.likes.some((p) => p.toString() === identity.getPrincipal().toString())
    : false;

  const isAuthor = currentPrincipal && post.author.toString() === currentPrincipal;
  const canApprove = canApproveContent(userRole, isAdmin) && post.status === PostStatus.pending;
  const canDelete = isAdmin || isAuthor;
  const isAnnouncement = post.category === PostCategory.announcements;
  const isPending = post.status === PostStatus.pending;

  const handleComment = async () => {
    if (!commentText.trim()) return;
    await addComment.mutateAsync({ postId: post.id, content: commentText.trim() });
    setCommentText('');
  };

  return (
    <article
      className={`bg-card rounded-2xl card-shadow border border-border overflow-hidden animate-fade-in ${
        isAnnouncement ? 'announcement-card' : ''
      }`}
    >
      {/* Header */}
      <div className="px-4 pt-4 pb-3 flex items-start justify-between gap-2">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-9 h-9 rounded-full purple-gradient flex items-center justify-center text-white font-poppins font-semibold text-xs flex-shrink-0">
            {getInitials(post.authorName)}
          </div>
          <div className="min-w-0">
            <p className="font-poppins font-semibold text-sm text-foreground truncate">
              {post.authorName}
            </p>
            <p className="text-xs text-muted-foreground">{formatTimestamp(post.timestamp)}</p>
          </div>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <span className="text-xs px-2 py-0.5 rounded-full bg-muted text-muted-foreground font-inter">
            {categoryToLabel(post.category)}
          </span>
          {isPending && (
            <span className="text-xs px-2 py-0.5 rounded-full bg-warning/15 text-warning border border-warning/30 font-inter">
              Pending
            </span>
          )}
          {(canDelete || canApprove) && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="w-7 h-7">
                  <MoreVertical className="w-4 h-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {canApprove && (
                  <DropdownMenuItem
                    onClick={() => approvePost.mutate(post.id)}
                    disabled={approvePost.isPending}
                    className="text-success"
                  >
                    <CheckCircle className="w-4 h-4 mr-2" />
                    Approve Post
                  </DropdownMenuItem>
                )}
                {canDelete && (
                  <DropdownMenuItem
                    onClick={() => deletePost.mutate(post.id)}
                    disabled={deletePost.isPending}
                    className="text-destructive"
                  >
                    <Trash2 className="w-4 h-4 mr-2" />
                    Delete Post
                  </DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="px-4 pb-3">
        <p className="text-sm text-foreground leading-relaxed font-inter whitespace-pre-wrap">
          {post.content}
        </p>
      </div>

      {/* Image */}
      {post.image && (
        <div className="px-4 pb-3">
          <img
            src={post.image.getDirectURL()}
            alt="Post"
            className="w-full rounded-xl object-cover max-h-64"
          />
        </div>
      )}

      {/* Actions */}
      <div className="px-4 py-3 border-t border-border flex items-center gap-4">
        <button
          onClick={() => identity && toggleLike.mutate(post.id)}
          disabled={!identity || toggleLike.isPending}
          className={`flex items-center gap-1.5 text-sm font-inter transition-colors ${
            isLiked ? 'text-destructive' : 'text-muted-foreground hover:text-destructive'
          }`}
        >
          <Heart className={`w-4 h-4 ${isLiked ? 'fill-current' : ''}`} />
          <span>{post.likes.length}</span>
        </button>
        <button
          onClick={() => setShowComments(!showComments)}
          className="flex items-center gap-1.5 text-sm font-inter text-muted-foreground hover:text-foreground transition-colors"
        >
          <MessageCircle className="w-4 h-4" />
          <span>{comments.length > 0 ? comments.length : 'Comment'}</span>
        </button>
      </div>

      {/* Comments */}
      {showComments && (
        <div className="px-4 pb-4 border-t border-border pt-3 space-y-3">
          {commentsLoading ? (
            <div className="flex justify-center py-2">
              <LoadingSpinner size="sm" />
            </div>
          ) : (
            comments.map((comment, i) => (
              <div key={i} className="flex gap-2">
                <div className="w-7 h-7 rounded-full bg-muted flex items-center justify-center text-xs font-poppins font-semibold flex-shrink-0">
                  {comment.author.toString().slice(0, 2).toUpperCase()}
                </div>
                <div className="flex-1 bg-muted rounded-xl px-3 py-2">
                  <p className="text-xs text-muted-foreground mb-0.5">
                    {formatTimestamp(comment.timestamp)}
                  </p>
                  <p className="text-sm text-foreground font-inter">{comment.content}</p>
                </div>
              </div>
            ))
          )}
          {identity && (
            <div className="flex gap-2 mt-2">
              <Textarea
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                placeholder="Write a comment..."
                className="text-sm resize-none min-h-[60px] rounded-xl"
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
                disabled={!commentText.trim() || addComment.isPending}
                className="self-end"
              >
                {addComment.isPending ? <LoadingSpinner size="sm" /> : 'Post'}
              </Button>
            </div>
          )}
        </div>
      )}
    </article>
  );
}
