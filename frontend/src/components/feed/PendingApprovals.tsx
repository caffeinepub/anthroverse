import React from 'react';
import { PostStatus } from '../../backend';
import { useGetPosts } from '../../hooks/useQueries';
import PostCard from './PostCard';
import { Clock } from 'lucide-react';

export default function PendingApprovals() {
  const { data: allPosts = [], isLoading } = useGetPosts(null);
  const pendingPosts = allPosts.filter(p => p.status === PostStatus.pending);

  if (isLoading || pendingPosts.length === 0) return null;

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <Clock size={16} className="text-amber-500" />
        <h3 className="font-display font-semibold text-sm">Pending Approvals</h3>
        <span className="bg-amber-500/20 text-amber-600 dark:text-amber-400 text-xs px-2 py-0.5 rounded-full font-medium border border-amber-500/30">
          {pendingPosts.length}
        </span>
      </div>
      <div className="space-y-3">
        {pendingPosts.map(post => (
          <PostCard key={post.id.toString()} post={post} />
        ))}
      </div>
    </div>
  );
}
