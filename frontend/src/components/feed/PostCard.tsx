import React, { useState } from "react";
import {
  ThumbsUp, MessageCircle, Trash2, CheckCircle, ChevronDown, ChevronUp,
  Send, Loader2, Pin
} from "lucide-react";
import { PostView, PostCategory, PostStatus, Role } from "../../backend";
import {
  categoryToLabel, formatTimestamp, getInitials, isExecutiveRole, roleBadgeClass, roleToLabel
} from "../../lib/utils";
import { useGetComments, useAddComment, useDeleteComment, useGetCallerUserProfile } from "../../hooks/useQueries";
import { toast } from "sonner";
import RoleBadge from "../RoleBadge";

interface PostCardProps {
  post: PostView;
  callerPrincipal?: string;
  userRole: Role;
  onLike: (postId: bigint) => void;
  onApprove?: (postId: bigint) => void;
  onDelete?: (postId: bigint) => void;
}

export default function PostCard({ post, callerPrincipal, userRole, onLike, onApprove, onDelete }: PostCardProps) {
  const [showComments, setShowComments] = useState(false);
  const [commentText, setCommentText] = useState("");
  const { data: userProfile } = useGetCallerUserProfile();

  const { data: comments = [], isLoading: commentsLoading } = useGetComments(
    showComments ? post.id : undefined
  );
  const addComment = useAddComment();
  const deleteComment = useDeleteComment();

  const isExec = isExecutiveRole(userRole);
  const isAuthor = callerPrincipal === post.author.toString();
  const isLiked = callerPrincipal ? post.likes.some((l) => l.toString() === callerPrincipal) : false;
  const isPinned = post.category === PostCategory.announcements && post.status === PostStatus.published;

  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentText.trim()) return;
    try {
      await addComment.mutateAsync({ postId: post.id, content: commentText.trim() });
      setCommentText("");
    } catch (err: any) {
      toast.error(err?.message || "Failed to add comment");
    }
  };

  const handleDeleteComment = async (index: number) => {
    try {
      await deleteComment.mutateAsync({ postId: post.id, commentIndex: BigInt(index) });
      toast.success("Comment deleted");
    } catch (err: any) {
      toast.error(err?.message || "Failed to delete comment");
    }
  };

  return (
    <div className={`bg-white rounded-xl shadow-card overflow-hidden ${isPinned ? "border-l-4 border-gold" : ""}`}>
      {/* Header */}
      <div className="px-4 pt-4 pb-2 flex items-start justify-between gap-2">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full gradient-primary flex items-center justify-center text-white text-sm font-bold font-poppins flex-shrink-0">
            {getInitials(post.authorName)}
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-poppins font-semibold text-sm text-foreground">{post.authorName}</span>
              <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold ${roleBadgeClass(userProfile?.role ?? Role.member)}`}>
                {categoryToLabel(post.category)}
              </span>
              {post.status === PostStatus.pending && (
                <span className="badge-pending">Pending</span>
              )}
            </div>
            <p className="text-xs text-muted-foreground font-inter">{formatTimestamp(post.timestamp)}</p>
          </div>
        </div>

        <div className="flex items-center gap-1 flex-shrink-0">
          {isExec && post.status === PostStatus.pending && onApprove && (
            <button
              onClick={() => onApprove(post.id)}
              className="p-1.5 rounded-lg bg-success/10 text-success hover:bg-success/20 transition-colors"
              title="Approve"
            >
              <CheckCircle className="w-4 h-4" />
            </button>
          )}
          {(isAuthor || isExec) && onDelete && (
            <button
              onClick={() => onDelete(post.id)}
              className="p-1.5 rounded-lg bg-destructive/10 text-destructive hover:bg-destructive/20 transition-colors"
              title="Delete"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="px-4 pb-3">
        <p className="font-inter text-sm text-foreground leading-relaxed whitespace-pre-wrap">{post.content}</p>
        {post.image && (
          <div className="mt-3 rounded-lg overflow-hidden">
            <img
              src={post.image.getDirectURL()}
              alt="Post image"
              className="w-full max-h-64 object-cover"
            />
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="px-4 py-2 border-t border-border flex items-center gap-4">
        <button
          onClick={() => onLike(post.id)}
          className={`flex items-center gap-1.5 text-sm font-inter transition-colors ${
            isLiked ? "text-primary-600 font-semibold" : "text-muted-foreground hover:text-primary-600"
          }`}
        >
          <ThumbsUp className={`w-4 h-4 ${isLiked ? "fill-primary-600" : ""}`} />
          {post.likes.length > 0 && <span>{post.likes.length}</span>}
          <span>Like</span>
        </button>

        <button
          onClick={() => setShowComments(!showComments)}
          className="flex items-center gap-1.5 text-sm font-inter text-muted-foreground hover:text-primary-600 transition-colors"
        >
          <MessageCircle className="w-4 h-4" />
          <span>Comment</span>
          {showComments ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
        </button>
      </div>

      {/* Comments */}
      {showComments && (
        <div className="border-t border-border bg-muted/30 px-4 py-3 space-y-3">
          {commentsLoading ? (
            <div className="flex justify-center py-2">
              <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
            </div>
          ) : comments.length === 0 ? (
            <p className="text-xs text-muted-foreground font-inter text-center py-2">No comments yet</p>
          ) : (
            <div className="space-y-2">
              {comments.map((comment, i) => (
                <div key={i} className="flex items-start gap-2">
                  <div className="w-7 h-7 rounded-full gradient-primary flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                    {getInitials(comment.author.toString().slice(0, 4))}
                  </div>
                  <div className="flex-1 bg-white rounded-lg px-3 py-2">
                    <p className="text-xs font-inter text-foreground">{comment.content}</p>
                    <p className="text-[10px] text-muted-foreground mt-0.5">{formatTimestamp(comment.timestamp)}</p>
                  </div>
                  {(isExec || comment.author.toString() === callerPrincipal) && (
                    <button
                      onClick={() => handleDeleteComment(i)}
                      className="p-1 text-muted-foreground hover:text-destructive transition-colors"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}

          <form onSubmit={handleAddComment} className="flex gap-2">
            <input
              type="text"
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              placeholder="Write a comment..."
              className="flex-1 px-3 py-1.5 rounded-lg border border-border text-xs font-inter focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white"
            />
            <button
              type="submit"
              disabled={addComment.isPending || !commentText.trim()}
              className="p-1.5 gradient-primary text-white rounded-lg disabled:opacity-60"
            >
              {addComment.isPending ? <Loader2 className="w-3 h-3 animate-spin" /> : <Send className="w-3 h-3" />}
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
