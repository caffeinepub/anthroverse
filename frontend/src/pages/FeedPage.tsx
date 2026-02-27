import React, { useState } from "react";
import { Pin, Plus, X, Loader2, Megaphone, Smile, Image, BarChart2, Trash2, ThumbsUp, MessageCircle, CheckCircle } from "lucide-react";
import {
  useGetPosts,
  useGetPendingPosts,
  useSubmitPost,
  useApprovePost,
  useDeletePost,
  useToggleLike,
  useGetCallerUserProfile,
} from "../hooks/useQueries";
import { PostCategory, PostStatus, Role } from "../backend";
import { categoryToLabel, formatTimestamp, getInitials, isExecutiveRole, canPostAnnouncement } from "../lib/utils";
import { toast } from "sonner";
import { useInternetIdentity } from "../hooks/useInternetIdentity";
import RoleBadge from "../components/RoleBadge";
import PostCard from "../components/feed/PostCard";

const FEED_CATEGORIES = [
  { value: undefined, label: "All" },
  { value: PostCategory.announcements, label: "Announcements" },
  { value: PostCategory.general, label: "General" },
  { value: PostCategory.fun, label: "Fun" },
  { value: PostCategory.requirements, label: "Requirements" },
];

export default function FeedPage() {
  const { identity } = useInternetIdentity();
  const { data: userProfile } = useGetCallerUserProfile();
  const [categoryFilter, setCategoryFilter] = useState<PostCategory | undefined>(undefined);
  const [showCreate, setShowCreate] = useState(false);
  const [postContent, setPostContent] = useState("");
  const [postCategory, setPostCategory] = useState<PostCategory>(PostCategory.general);
  const [showPending, setShowPending] = useState(false);

  const { data: posts = [], isLoading } = useGetPosts(categoryFilter);
  const { data: pendingPosts = [] } = useGetPendingPosts();
  const submitPost = useSubmitPost();
  const approvePost = useApprovePost();
  const deletePost = useDeletePost();
  const toggleLike = useToggleLike();

  const userRole = userProfile?.role ?? Role.member;
  const isExec = isExecutiveRole(userRole);
  const callerPrincipal = identity?.getPrincipal().toString();

  // Pinned post: first published announcement or first post
  const pinnedPost = posts.find((p) => p.category === PostCategory.announcements && p.status === PostStatus.published) ?? null;

  const handleSubmitPost = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!postContent.trim()) return;
    try {
      await submitPost.mutateAsync({ category: postCategory, content: postContent.trim(), image: null });
      setPostContent("");
      setShowCreate(false);
      toast.success(isExec ? "Post published!" : "Post submitted for approval");
    } catch (err: any) {
      toast.error(err?.message || "Failed to submit post");
    }
  };

  const handleApprove = async (postId: bigint) => {
    try {
      await approvePost.mutateAsync(postId);
      toast.success("Post approved!");
    } catch (err: any) {
      toast.error(err?.message || "Failed to approve");
    }
  };

  const handleDelete = async (postId: bigint) => {
    try {
      await deletePost.mutateAsync(postId);
      toast.success("Post deleted");
    } catch (err: any) {
      toast.error(err?.message || "Failed to delete");
    }
  };

  const handleLike = async (postId: bigint) => {
    try {
      await toggleLike.mutateAsync(postId);
    } catch (err: any) {
      toast.error(err?.message || "Failed to like");
    }
  };

  const availableCategories = [
    PostCategory.general,
    PostCategory.fun,
    PostCategory.requirements,
    ...(canPostAnnouncement(userRole) ? [PostCategory.announcements] : []),
  ];

  return (
    <div className="space-y-4 animate-fade-in">
      {/* Pinned Content */}
      {pinnedPost && (
        <div className="pinned-card rounded-xl p-4 shadow-gold">
          <div className="flex items-center gap-2 mb-2">
            <Pin className="w-4 h-4 text-gold" />
            <span className="text-xs font-semibold text-gold font-poppins uppercase tracking-wide">Pinned Announcement</span>
          </div>
          <p className="font-inter text-sm text-foreground leading-relaxed">{pinnedPost.content}</p>
          <div className="flex items-center gap-2 mt-2">
            <span className="text-xs text-muted-foreground">{pinnedPost.authorName}</span>
            <span className="text-xs text-muted-foreground">·</span>
            <span className="text-xs text-muted-foreground">{formatTimestamp(pinnedPost.timestamp)}</span>
          </div>
        </div>
      )}

      {/* Create Post Button */}
      <div className="bg-white rounded-xl shadow-card p-4">
        <button
          onClick={() => setShowCreate(!showCreate)}
          className="w-full flex items-center gap-3 text-left"
        >
          <div className="w-9 h-9 rounded-full gradient-primary flex items-center justify-center text-white text-sm font-bold font-poppins flex-shrink-0">
            {getInitials(userProfile?.name || "U")}
          </div>
          <span className="text-muted-foreground font-inter text-sm flex-1 bg-muted rounded-lg px-3 py-2">
            What's on your mind?
          </span>
          <Plus className="w-5 h-5 text-primary-500" />
        </button>

        {showCreate && (
          <form onSubmit={handleSubmitPost} className="mt-4 space-y-3">
            <select
              value={postCategory}
              onChange={(e) => setPostCategory(e.target.value as PostCategory)}
              className="w-full px-3 py-2 rounded-lg border border-border text-sm font-inter focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              {availableCategories.map((cat) => (
                <option key={cat} value={cat}>{categoryToLabel(cat)}</option>
              ))}
            </select>
            <textarea
              value={postContent}
              onChange={(e) => setPostContent(e.target.value)}
              placeholder="Write your post..."
              rows={3}
              className="w-full px-3 py-2 rounded-lg border border-border text-sm font-inter focus:outline-none focus:ring-2 focus:ring-primary-500 resize-none"
            />
            <div className="flex items-center justify-between">
              <div className="flex gap-2">
                <button type="button" className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground" title="Add emoji">
                  <Smile className="w-4 h-4" />
                </button>
                <button type="button" className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground" title="Add image">
                  <Image className="w-4 h-4" />
                </button>
                <button type="button" className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground" title="Create poll">
                  <BarChart2 className="w-4 h-4" />
                </button>
              </div>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setShowCreate(false)}
                  className="px-3 py-1.5 text-sm text-muted-foreground hover:text-foreground font-inter"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitPost.isPending || !postContent.trim()}
                  className="px-4 py-1.5 gradient-primary text-white text-sm font-semibold font-poppins rounded-lg disabled:opacity-60 flex items-center gap-1.5"
                >
                  {submitPost.isPending ? <Loader2 className="w-3 h-3 animate-spin" /> : null}
                  {isExec ? "Publish" : "Submit"}
                </button>
              </div>
            </div>
          </form>
        )}
      </div>

      {/* Pending Posts (admin only) */}
      {isExec && pendingPosts.length > 0 && (
        <div className="bg-white rounded-xl shadow-card overflow-hidden">
          <button
            onClick={() => setShowPending(!showPending)}
            className="w-full flex items-center justify-between px-4 py-3 hover:bg-muted/50 transition-colors"
          >
            <div className="flex items-center gap-2">
              <Megaphone className="w-4 h-4 text-warning" />
              <span className="font-poppins font-semibold text-sm text-foreground">
                Pending Approvals ({pendingPosts.length})
              </span>
            </div>
            <span className="badge-pending">{pendingPosts.length}</span>
          </button>
          {showPending && (
            <div className="border-t border-border divide-y divide-border">
              {pendingPosts.map((post) => (
                <div key={post.id.toString()} className="p-4">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1">
                      <p className="text-xs text-muted-foreground font-inter mb-1">{post.authorName} · {categoryToLabel(post.category)}</p>
                      <p className="text-sm font-inter text-foreground">{post.content}</p>
                    </div>
                    <div className="flex gap-2 flex-shrink-0">
                      <button
                        onClick={() => handleApprove(post.id)}
                        className="p-1.5 rounded-lg bg-success/10 text-success hover:bg-success/20 transition-colors"
                        title="Approve"
                      >
                        <CheckCircle className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(post.id)}
                        className="p-1.5 rounded-lg bg-destructive/10 text-destructive hover:bg-destructive/20 transition-colors"
                        title="Delete"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Category Filters */}
      <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-1">
        {FEED_CATEGORIES.map(({ value, label }) => (
          <button
            key={label}
            onClick={() => setCategoryFilter(value)}
            className={`flex-shrink-0 px-4 py-1.5 rounded-full text-sm font-semibold font-poppins transition-colors ${
              categoryFilter === value
                ? "gradient-primary text-white"
                : "bg-white text-muted-foreground hover:text-primary-700 border border-border"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Posts Feed */}
      {isLoading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="w-6 h-6 animate-spin text-primary-500" />
        </div>
      ) : posts.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-xl shadow-card">
          <Megaphone className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
          <p className="font-poppins font-semibold text-foreground">No posts yet</p>
          <p className="text-sm text-muted-foreground font-inter mt-1">Be the first to share something!</p>
        </div>
      ) : (
        <div className="space-y-3">
          {posts.map((post) => (
            <PostCard
              key={post.id.toString()}
              post={post}
              callerPrincipal={callerPrincipal}
              userRole={userRole}
              onLike={handleLike}
              onApprove={handleApprove}
              onDelete={handleDelete}
            />
          ))}
        </div>
      )}
    </div>
  );
}
