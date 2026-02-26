import { useGetCallerUserProfile, useGetPosts } from '../hooks/useQueries';
import { Role } from '../backend';
import { canAccessChapterGrowth } from '../utils/permissions';
import { roleToLabel, formatTimestamp } from '../lib/utils';
import { useInternetIdentity } from '../hooks/useInternetIdentity';
import { BarChart2, TrendingUp, Users, FileText } from 'lucide-react';

export default function ChapterGrowthPage() {
  const { identity } = useInternetIdentity();
  const { data: userProfile } = useGetCallerUserProfile();
  const { data: posts = [], isLoading: postsLoading } = useGetPosts(undefined);

  const userRole = userProfile?.role;
  const currentPrincipal = identity?.getPrincipal().toString() ?? '';

  if (userRole && !canAccessChapterGrowth(userRole)) {
    return (
      <div className="flex items-center justify-center min-h-[40vh]">
        <div className="text-center">
          <BarChart2 className="w-12 h-12 mx-auto mb-3 text-muted-foreground opacity-40" />
          <p className="text-muted-foreground">You don't have access to Chapter Growth.</p>
        </div>
      </div>
    );
  }

  const totalPosts = posts.length;
  const myPosts = posts.filter(p => p.author.toString() === currentPrincipal).length;
  const announcementCount = posts.filter(p => p.category === 'announcements' as any).length;

  return (
    <div className="max-w-4xl mx-auto py-6 px-4 space-y-6">
      <div className="flex items-center gap-3">
        <BarChart2 className="w-7 h-7 text-primary" />
        <h1 className="text-2xl font-bold text-foreground">Chapter Growth</h1>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
        <div className="bg-card border border-border rounded-xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <FileText className="w-4 h-4 text-primary" />
            <span className="text-xs font-medium text-muted-foreground">Total Posts</span>
          </div>
          <p className="text-2xl font-bold text-foreground">{totalPosts}</p>
        </div>
        <div className="bg-card border border-border rounded-xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp className="w-4 h-4 text-primary" />
            <span className="text-xs font-medium text-muted-foreground">My Posts</span>
          </div>
          <p className="text-2xl font-bold text-foreground">{myPosts}</p>
        </div>
        <div className="bg-card border border-border rounded-xl p-4 col-span-2 sm:col-span-1">
          <div className="flex items-center gap-2 mb-2">
            <Users className="w-4 h-4 text-primary" />
            <span className="text-xs font-medium text-muted-foreground">Announcements</span>
          </div>
          <p className="text-2xl font-bold text-foreground">{announcementCount}</p>
        </div>
      </div>

      {/* Profile info */}
      {userProfile && (
        <div className="bg-card border border-border rounded-xl p-4">
          <h2 className="text-sm font-semibold text-foreground mb-3">Your Profile</h2>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center text-sm font-bold text-primary">
              {userProfile.name.charAt(0).toUpperCase()}
            </div>
            <div>
              <p className="text-sm font-medium text-foreground">{userProfile.name}</p>
              <p className="text-xs text-muted-foreground">{roleToLabel(userProfile.role)}</p>
            </div>
          </div>
        </div>
      )}

      {/* Recent posts */}
      <div>
        <h2 className="text-sm font-semibold text-foreground mb-3">Recent Activity</h2>
        {postsLoading ? (
          <div className="flex justify-center py-8">
            <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        ) : posts.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-8">No posts yet.</p>
        ) : (
          <div className="space-y-2">
            {posts.slice(0, 10).map(post => (
              <div key={post.id.toString()} className="flex items-start gap-3 bg-card border border-border rounded-lg p-3">
                <div className="w-7 h-7 rounded-full bg-primary/20 flex items-center justify-center text-xs font-bold text-primary shrink-0">
                  {post.authorName.charAt(0).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="text-xs font-medium text-foreground">{post.authorName}</span>
                    <span className="text-xs text-muted-foreground">{formatTimestamp(post.timestamp)}</span>
                  </div>
                  <p className="text-xs text-muted-foreground line-clamp-2">{post.content}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Footer */}
      <footer className="text-center text-xs text-muted-foreground pt-4 pb-2">
        <p>
          © {new Date().getFullYear()} AnthroVerse — Built with{' '}
          <span className="text-rose-500">♥</span>{' '}
          using{' '}
          <a
            href={`https://caffeine.ai/?utm_source=Caffeine-footer&utm_medium=referral&utm_content=${encodeURIComponent(window.location.hostname || 'anthroverse')}`}
            target="_blank"
            rel="noopener noreferrer"
            className="underline hover:text-foreground"
          >
            caffeine.ai
          </a>
        </p>
      </footer>
    </div>
  );
}
