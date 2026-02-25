import { useInternetIdentity } from '../hooks/useInternetIdentity';
import {
  useGetCallerUserProfile,
  useGetCallerUserRole,
  useGetPosts,
  useGetEvents,
  useListApprovals,
} from '../hooks/useQueries';
import { UserRole, ApprovalStatus, PostCategory, UserApprovalInfo } from '../backend';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  Legend,
} from 'recharts';
import { Users, FileText, Calendar, TrendingUp, Award, Activity } from 'lucide-react';

export default function ChapterGrowthPage() {
  const { identity } = useInternetIdentity();
  const currentPrincipal = identity?.getPrincipal().toString() ?? '';

  const { data: userProfile } = useGetCallerUserProfile();
  const { data: userRoleData } = useGetCallerUserRole();
  const { data: posts = [], isLoading: postsLoading } = useGetPosts(null);
  const { data: events = [], isLoading: eventsLoading } = useGetEvents();
  const { data: approvals = [], isLoading: approvalsLoading } = useListApprovals();

  const isAdmin = userRoleData === UserRole.admin;
  const userRole = userProfile?.role as string | undefined;

  const isLTOrAdmin =
    isAdmin ||
    userRole === 'president' ||
    userRole === 'vicePresident' ||
    userRole === 'secretaryTreasurer' ||
    userRole === 'lt';

  const isLoading = postsLoading || eventsLoading || approvalsLoading;

  // Stats
  const totalMembers = approvals.filter(
    (a: UserApprovalInfo) => a.status === ApprovalStatus.approved
  ).length;
  const pendingMembers = approvals.filter(
    (a: UserApprovalInfo) => a.status === ApprovalStatus.pending
  ).length;
  const totalPosts = posts.length;
  const totalEvents = events.length;

  // Posts by category
  const postsByCategory = Object.values(PostCategory).map((cat) => ({
    name: cat,
    count: posts.filter((p) => p.category === cat).length,
  })).filter((d) => d.count > 0);

  // Posts over time (last 7 days)
  const now = Date.now();
  const sevenDaysAgo = now - 7 * 24 * 60 * 60 * 1000;
  const postsLast7Days = Array.from({ length: 7 }, (_, i) => {
    const dayStart = sevenDaysAgo + i * 24 * 60 * 60 * 1000;
    const dayEnd = dayStart + 24 * 60 * 60 * 1000;
    const dayLabel = new Date(dayStart).toLocaleDateString('en-US', { weekday: 'short' });
    const count = posts.filter((p) => {
      const ms = Number(p.timestamp) / 1_000_000;
      return ms >= dayStart && ms < dayEnd;
    }).length;
    return { day: dayLabel, posts: count };
  });

  // Member approval status distribution
  const approvalDistribution = [
    { name: 'Approved', value: approvals.filter((a: UserApprovalInfo) => a.status === ApprovalStatus.approved).length, color: '#22c55e' },
    { name: 'Pending', value: approvals.filter((a: UserApprovalInfo) => a.status === ApprovalStatus.pending).length, color: '#f59e0b' },
    { name: 'Rejected', value: approvals.filter((a: UserApprovalInfo) => a.status === ApprovalStatus.rejected).length, color: '#ef4444' },
  ].filter((d) => d.value > 0);

  const categoryShortLabels: Record<string, string> = {
    announcements: 'Announce',
    general: 'General',
    fun: 'Fun',
    requirements: 'Require',
    leadershipTeam: 'LT',
    membershipCommittee: 'MC',
    coreTeam: 'Core',
  };

  if (isLoading) {
    return (
      <div className="max-w-5xl mx-auto space-y-6">
        <Skeleton className="h-10 w-64" />
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-28 w-full" />
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Skeleton className="h-64 w-full" />
          <Skeleton className="h-64 w-full" />
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground font-display flex items-center gap-2">
            <TrendingUp className="w-6 h-6 text-primary" />
            Chapter Growth
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Analytics and insights for your chapter
          </p>
        </div>
        {isLTOrAdmin && (
          <Badge variant="outline" className="gap-1 border-primary/30 text-primary">
            <Award className="w-3 h-3" />
            Leadership View
          </Badge>
        )}
      </div>

      {/* Banner */}
      <div className="rounded-2xl overflow-hidden h-36 relative">
        <img
          src="/assets/generated/chapter-growth-banner.dim_800x300.png"
          alt="Chapter Growth"
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-background/80 to-transparent flex items-center px-6">
          <div>
            <p className="text-lg font-bold text-foreground">Growing Together</p>
            <p className="text-sm text-muted-foreground">Track your chapter's progress</p>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-5 pb-5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-green-500/10 flex items-center justify-center shrink-0">
                <Users className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">{totalMembers}</p>
                <p className="text-xs text-muted-foreground">Active Members</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-5 pb-5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center shrink-0">
                <Activity className="w-5 h-5 text-amber-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">{pendingMembers}</p>
                <p className="text-xs text-muted-foreground">Pending Members</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-5 pb-5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center shrink-0">
                <FileText className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">{totalPosts}</p>
                <p className="text-xs text-muted-foreground">Total Posts</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-5 pb-5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-purple-500/10 flex items-center justify-center shrink-0">
                <Calendar className="w-5 h-5 text-purple-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">{totalEvents}</p>
                <p className="text-xs text-muted-foreground">Total Events</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Posts over time */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Activity className="w-4 h-4 text-primary" />
              Posts (Last 7 Days)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={postsLast7Days}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                <XAxis dataKey="day" tick={{ fontSize: 12 }} className="text-muted-foreground" />
                <YAxis tick={{ fontSize: 12 }} allowDecimals={false} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'hsl(var(--card))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px',
                    fontSize: '12px',
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="posts"
                  stroke="hsl(var(--primary))"
                  strokeWidth={2}
                  dot={{ fill: 'hsl(var(--primary))', r: 4 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Posts by category */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <FileText className="w-4 h-4 text-primary" />
              Posts by Category
            </CardTitle>
          </CardHeader>
          <CardContent>
            {postsByCategory.length === 0 ? (
              <div className="h-[200px] flex items-center justify-center text-muted-foreground text-sm">
                No posts yet
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={postsByCategory.map((d) => ({ ...d, name: categoryShortLabels[d.name] || d.name }))}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                  <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 12 }} allowDecimals={false} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'hsl(var(--card))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px',
                      fontSize: '12px',
                    }}
                  />
                  <Bar dataKey="count" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        {/* Member distribution */}
        {isLTOrAdmin && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Users className="w-4 h-4 text-primary" />
                Member Status Distribution
              </CardTitle>
            </CardHeader>
            <CardContent>
              {approvalDistribution.length === 0 ? (
                <div className="h-[200px] flex items-center justify-center text-muted-foreground text-sm">
                  No members yet
                </div>
              ) : (
                <ResponsiveContainer width="100%" height={200}>
                  <PieChart>
                    <Pie
                      data={approvalDistribution}
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={80}
                      paddingAngle={3}
                      dataKey="value"
                    >
                      {approvalDistribution.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        backgroundColor: 'hsl(var(--card))',
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '8px',
                        fontSize: '12px',
                      }}
                    />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>
        )}

        {/* Upcoming events */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Calendar className="w-4 h-4 text-primary" />
              Upcoming Events
            </CardTitle>
          </CardHeader>
          <CardContent>
            {events.filter((e) => Number(e.date) / 1_000_000 >= Date.now()).length === 0 ? (
              <div className="h-[100px] flex items-center justify-center text-muted-foreground text-sm">
                No upcoming events
              </div>
            ) : (
              <div className="space-y-2">
                {events
                  .filter((e) => Number(e.date) / 1_000_000 >= Date.now())
                  .slice(0, 4)
                  .map((event) => (
                    <div
                      key={event.id.toString()}
                      className="flex items-center justify-between gap-3 p-2.5 rounded-lg bg-muted/50"
                    >
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-foreground truncate">{event.title}</p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(Number(event.date) / 1_000_000).toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric',
                          })}
                        </p>
                      </div>
                      <Badge variant="outline" className="text-xs shrink-0 border-green-500/30 text-green-600">
                        Upcoming
                      </Badge>
                    </div>
                  ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
