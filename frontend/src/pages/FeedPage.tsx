import React, { useState } from 'react';
import { PlusCircle, X, Rss } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { useGetCallerUserProfile, useGetPosts, useToggleLike, useApprovePost, useDeletePost } from '../hooks/useQueries';
import { useInternetIdentity } from '../hooks/useInternetIdentity';
import { Role, PostCategory } from '../backend';
import { canApproveContent, canDeleteAnyPost } from '../utils/permissions';
import { categoryToLabel } from '../lib/utils';
import CreatePostForm from '../components/feed/CreatePostForm';
import PendingApprovals from '../components/feed/PendingApprovals';
import PostFilters from '../components/feed/PostFilters';
import PostCard from '../components/feed/PostCard';

export default function FeedPage() {
  const { identity } = useInternetIdentity();
  const { data: userProfile } = useGetCallerUserProfile();
  const [showCreatePost, setShowCreatePost] = useState(false);
  const [activeCategory, setActiveCategory] = useState<PostCategory | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [showMyPosts, setShowMyPosts] = useState(false);

  const { data: posts = [], isLoading } = useGetPosts(activeCategory ?? undefined);
  const toggleLikeMutation = useToggleLike();
  const approvePostMutation = useApprovePost();
  const deletePostMutation = useDeletePost();

  const userRole: Role = userProfile?.role ?? Role.member;
  const callerPrincipal = identity?.getPrincipal().toString();
  const isAdmin = canApproveContent(userRole);

  const handleLike = (postId: bigint) => toggleLikeMutation.mutate(postId);
  const handleApprove = (postId: bigint) => approvePostMutation.mutate(postId);
  const handleDelete = (postId: bigint) => deletePostMutation.mutate(postId);

  // Client-side search filter
  const handleSearchChange = (q: string) => {
    setSearchQuery(q);
  };

  // Determine which posts to display
  const displayPosts = (() => {
    let filtered = posts;
    if (showMyPosts) {
      filtered = filtered.filter(p => p.author.toString() === callerPrincipal);
    }
    if (searchQuery.trim()) {
      const q = searchQuery.trim().toLowerCase();
      filtered = filtered.filter(
        p =>
          p.authorName.toLowerCase().includes(q) ||
          p.content.toLowerCase().includes(q)
      );
    }
    return filtered;
  })();

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 space-y-4">
      {/* Pending Approvals (admin only) */}
      {isAdmin && <PendingApprovals />}

      {/* Header row */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Rss className="w-5 h-5 text-primary" />
          <h2 className="text-lg font-semibold text-foreground">Community Feed</h2>
        </div>
        <Button
          variant={showCreatePost ? 'outline' : 'default'}
          size="sm"
          onClick={() => setShowCreatePost(v => !v)}
          className="flex items-center gap-1.5"
        >
          {showCreatePost ? (
            <>
              <X className="w-4 h-4" />
              Cancel
            </>
          ) : (
            <>
              <PlusCircle className="w-4 h-4" />
              New Post
            </>
          )}
        </Button>
      </div>

      {/* Create Post Form */}
      {showCreatePost && (
        <CreatePostForm onSuccess={() => setShowCreatePost(false)} />
      )}

      {/* Filters */}
      <PostFilters
        activeCategory={activeCategory}
        onCategoryChange={(cat) => {
          setActiveCategory(cat);
          setShowMyPosts(false);
          setSearchQuery('');
        }}
        searchQuery={searchQuery}
        onSearchChange={handleSearchChange}
        showMyPosts={showMyPosts}
        onMyPostsToggle={() => {
          setShowMyPosts(v => !v);
          setActiveCategory(null);
          setSearchQuery('');
        }}
      />

      {/* Posts */}
      {isLoading ? (
        <div className="space-y-4">
          {[1, 2, 3].map(i => (
            <Skeleton key={i} className="h-40 w-full rounded-xl" />
          ))}
        </div>
      ) : displayPosts.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">
          <Rss className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p className="text-base font-medium">No posts yet</p>
          <p className="text-sm mt-1">
            {activeCategory
              ? `No posts in ${categoryToLabel(activeCategory)}.`
              : showMyPosts
              ? 'You have not posted anything yet.'
              : searchQuery.trim()
              ? 'No posts match your search.'
              : 'Be the first to post something!'}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {displayPosts.map(post => (
            <PostCard
              key={post.id.toString()}
              post={post}
              userRole={userRole}
              callerPrincipal={callerPrincipal}
              onLike={handleLike}
              onApprove={canApproveContent(userRole) ? handleApprove : undefined}
              onDelete={
                canDeleteAnyPost(userRole) || post.author.toString() === callerPrincipal
                  ? handleDelete
                  : undefined
              }
            />
          ))}
        </div>
      )}
    </div>
  );
}
