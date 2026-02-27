import React from 'react';
import { useGetPendingPosts, useApprovePost, useDeletePost } from '../../hooks/useQueries';
import { PostView } from '../../backend';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { CheckCircle, Trash2, Clock, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { formatTimestamp } from '../../lib/utils';

export default function PendingApprovals() {
  const { data: pendingPosts, isLoading, error } = useGetPendingPosts();
  const approvePostMutation = useApprovePost();
  const deletePostMutation = useDeletePost();

  const handleApprove = async (post: PostView) => {
    try {
      await approvePostMutation.mutateAsync(post.id);
      toast.success('Post approved and published.');
    } catch (err: any) {
      toast.error(`Failed to approve post: ${err?.message ?? String(err)}`);
    }
  };

  const handleDelete = async (post: PostView) => {
    try {
      await deletePostMutation.mutateAsync(post.id);
      toast.success('Post deleted.');
    } catch (err: any) {
      toast.error(`Failed to delete post: ${err?.message ?? String(err)}`);
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Clock className="h-4 w-4" />
            Pending Posts
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {[1, 2].map((i) => (
            <Skeleton key={i} className="h-20 w-full" />
          ))}
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="pt-6 text-center text-destructive text-sm">
          Failed to load pending posts.
        </CardContent>
      </Card>
    );
  }

  if (!pendingPosts || pendingPosts.length === 0) {
    return null;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <Clock className="h-4 w-4 text-amber-500" />
          Pending Posts ({pendingPosts.length})
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {pendingPosts.map((post) => {
          const isApprovingThis = approvePostMutation.isPending && approvePostMutation.variables === post.id;
          const isDeletingThis = deletePostMutation.isPending && deletePostMutation.variables === post.id;

          return (
            <div
              key={post.id.toString()}
              className="p-3 rounded-lg border bg-card space-y-2"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-muted-foreground mb-1">
                    <span className="font-medium text-foreground">{post.authorName}</span>
                    {' · '}
                    {formatTimestamp(post.timestamp)}
                  </p>
                  <p className="text-sm line-clamp-3">{post.content}</p>
                </div>
              </div>
              <div className="flex gap-2 justify-end">
                <Button
                  size="sm"
                  variant="outline"
                  className="text-destructive border-destructive/40 hover:bg-destructive/10 h-7 text-xs"
                  onClick={() => handleDelete(post)}
                  disabled={isDeletingThis || isApprovingThis}
                >
                  {isDeletingThis ? (
                    <Loader2 className="h-3 w-3 animate-spin mr-1" />
                  ) : (
                    <Trash2 className="h-3 w-3 mr-1" />
                  )}
                  Delete
                </Button>
                <Button
                  size="sm"
                  className="h-7 text-xs"
                  onClick={() => handleApprove(post)}
                  disabled={isApprovingThis || isDeletingThis}
                >
                  {isApprovingThis ? (
                    <Loader2 className="h-3 w-3 animate-spin mr-1" />
                  ) : (
                    <CheckCircle className="h-3 w-3 mr-1" />
                  )}
                  Approve
                </Button>
              </div>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
