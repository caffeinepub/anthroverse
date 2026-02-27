import React, { useState } from 'react';
import { PostCategory, Role } from '../../backend';
import { useGetPosts, useGetCallerUserProfile } from '../../hooks/useQueries';
import PostCard from '../feed/PostCard';
import CreatePostForm from '../feed/CreatePostForm';
import { Skeleton } from '@/components/ui/skeleton';
import { Lock, PenSquare } from 'lucide-react';
import { toast } from 'sonner';
import { useToggleLike, useApprovePost, useDeletePost } from '../../hooks/useQueries';
import { useInternetIdentity } from '../../hooks/useInternetIdentity';

interface GroupFeedProps {
  category: PostCategory;
  groupName: string;
}

export default function GroupFeed({ category, groupName }: GroupFeedProps) {
  const { data: posts = [], isLoading } = useGetPosts(category);
  const { data: userProfile } = useGetCallerUserProfile();
  const { identity } = useInternetIdentity();
  const [showCreate, setShowCreate] = useState(false);

  const toggleLike = useToggleLike();
  const approvePost = useApprovePost();
  const deletePost = useDeletePost();

  const userRole = userProfile?.role ?? Role.member;
  const callerPrincipal = identity?.getPrincipal().toString();

  const handleLike = async (postId: bigint) => {
    try {
      await toggleLike.mutateAsync(postId);
    } catch (err: any) {
      toast.error(err?.message || 'Failed to like post');
    }
  };

  const handleApprove = async (postId: bigint) => {
    try {
      await approvePost.mutateAsync(postId);
      toast.success('Post approved!');
    } catch (err: any) {
      toast.error(err?.message || 'Failed to approve post');
    }
  };

  const handleDelete = async (postId: bigint) => {
    try {
      await deletePost.mutateAsync(postId);
      toast.success('Post deleted');
    } catch (err: any) {
      toast.error(err?.message || 'Failed to delete post');
    }
  };

  return (
    <div className="space-y-4">
      {/* Group header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Lock size={13} />
          <span>Private · {groupName}</span>
        </div>
        <button
          onClick={() => setShowCreate(!showCreate)}
          className="flex items-center gap-1.5 text-sm font-medium text-accent hover:text-accent/80 transition-colors"
        >
          <PenSquare size={14} />
          {showCreate ? 'Cancel' : 'New Post'}
        </button>
      </div>

      {/* Create form */}
      {showCreate && (
        <CreatePostForm
          defaultCategory={category}
          onSuccess={() => setShowCreate(false)}
        />
      )}

      {/* Posts */}
      {isLoading ? (
        <div className="space-y-4">
          {[1, 2].map(i => (
            <div key={i} className="bg-card rounded-xl border border-border p-4 space-y-3">
              <div className="flex items-center gap-3">
                <Skeleton className="w-9 h-9 rounded-full" />
                <div className="space-y-1.5">
                  <Skeleton className="h-3 w-32" />
                  <Skeleton className="h-3 w-20" />
                </div>
              </div>
              <Skeleton className="h-16 w-full" />
            </div>
          ))}
        </div>
      ) : posts.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          <Lock size={32} className="mx-auto mb-3 opacity-30" />
          <p className="font-medium text-sm">No posts in {groupName} yet</p>
          <p className="text-xs mt-1">Start the conversation!</p>
        </div>
      ) : (
        <div className="space-y-4">
          {posts.map(post => (
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
