import { useGetPosts, useApprovePost } from '../../hooks/useQueries';
import { PostStatus } from '../../backend';
import { CheckCircle, Clock } from 'lucide-react';

export default function PendingApprovals() {
  const { data: allPosts = [], isLoading } = useGetPosts(undefined);
  const approvePost = useApprovePost();

  const pendingPosts = allPosts.filter(p => p.status === PostStatus.pending);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (pendingPosts.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-8 text-muted-foreground gap-2">
        <CheckCircle className="w-8 h-8" />
        <p className="text-sm">No pending posts</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {pendingPosts.map(post => (
        <div key={post.id.toString()} className="border border-border rounded-lg p-4 bg-card">
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <Clock className="w-4 h-4 text-amber-500 shrink-0" />
                <span className="text-xs font-medium text-amber-600 dark:text-amber-400">Pending Approval</span>
              </div>
              <p className="text-sm font-medium text-foreground">{post.authorName}</p>
              <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{post.content}</p>
            </div>
            <button
              onClick={() => approvePost.mutate(post.id)}
              disabled={approvePost.isPending}
              className="shrink-0 px-3 py-1.5 text-xs font-medium bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50"
            >
              Approve
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
