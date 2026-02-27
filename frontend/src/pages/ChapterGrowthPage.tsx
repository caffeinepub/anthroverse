import React from 'react';
import { TrendingUp, Users, Calendar, Activity, Loader2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useGetAllUsers, useGetEvents, useGetPosts, useGetCallerUserProfile } from '../hooks/useQueries';
import { Role, PostCategory } from '../backend';
import { canAccessChapterGrowth } from '../utils/permissions';
import { roleToLabel } from '../lib/utils';
import GroupFeed from '../components/chapter-growth/GroupFeed';

export default function ChapterGrowthPage() {
  const { data: userProfile, isLoading: profileLoading } = useGetCallerUserProfile();
  const { data: allUsers = [], isLoading: usersLoading } = useGetAllUsers();
  const { data: events = [], isLoading: eventsLoading } = useGetEvents();
  const { data: posts = [], isLoading: postsLoading } = useGetPosts();

  const userRole: Role = userProfile?.role ?? Role.member;

  if (profileLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!canAccessChapterGrowth(userRole)) {
    return (
      <div className="flex items-center justify-center py-20 text-muted-foreground">
        <div className="text-center">
          <TrendingUp className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p className="font-medium">Access Restricted</p>
          <p className="text-sm mt-1">Chapter Growth is available to LT members and above.</p>
        </div>
      </div>
    );
  }

  const approvedMembers = allUsers.filter(([, u]) => u.isApproved);
  const pendingMembers = allUsers.filter(([, u]) => !u.isApproved);
  const upcomingEvents = events.filter(e => e.status === 'approved');
  const publishedPosts = posts.filter(p => p.status === 'published');

  const roleDistribution = approvedMembers.reduce<Record<string, number>>((acc, [, u]) => {
    const label = roleToLabel(u.role);
    acc[label] = (acc[label] ?? 0) + 1;
    return acc;
  }, {});

  return (
    <div className="max-w-4xl mx-auto px-4 py-6 space-y-6">
      <div className="flex items-center gap-3 mb-2">
        <div className="p-2 rounded-lg bg-primary/10">
          <TrendingUp className="w-6 h-6 text-primary" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-foreground">Chapter Growth</h1>
          <p className="text-sm text-muted-foreground">Analytics and community insights</p>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-1">
              <Users className="w-4 h-4 text-primary" />
              <span className="text-xs text-muted-foreground font-medium">Members</span>
            </div>
            {usersLoading ? (
              <Loader2 className="w-5 h-5 animate-spin text-primary" />
            ) : (
              <p className="text-2xl font-bold text-foreground">{approvedMembers.length}</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-1">
              <Users className="w-4 h-4 text-amber-500" />
              <span className="text-xs text-muted-foreground font-medium">Pending</span>
            </div>
            {usersLoading ? (
              <Loader2 className="w-5 h-5 animate-spin text-primary" />
            ) : (
              <p className="text-2xl font-bold text-foreground">{pendingMembers.length}</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-1">
              <Calendar className="w-4 h-4 text-green-500" />
              <span className="text-xs text-muted-foreground font-medium">Events</span>
            </div>
            {eventsLoading ? (
              <Loader2 className="w-5 h-5 animate-spin text-primary" />
            ) : (
              <p className="text-2xl font-bold text-foreground">{upcomingEvents.length}</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-1">
              <Activity className="w-4 h-4 text-blue-500" />
              <span className="text-xs text-muted-foreground font-medium">Posts</span>
            </div>
            {postsLoading ? (
              <Loader2 className="w-5 h-5 animate-spin text-primary" />
            ) : (
              <p className="text-2xl font-bold text-foreground">{publishedPosts.length}</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Role Distribution */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Member Role Distribution</CardTitle>
        </CardHeader>
        <CardContent>
          {usersLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin text-primary" />
            </div>
          ) : (
            <div className="flex flex-wrap gap-2">
              {Object.entries(roleDistribution).map(([label, count]) => (
                <Badge key={label} variant="outline" className="text-sm px-3 py-1">
                  {label}: <span className="font-bold ml-1">{count}</span>
                </Badge>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Private Group Feeds */}
      <div className="space-y-4">
        <h2 className="text-lg font-semibold text-foreground">Private Group Feeds</h2>
        <GroupFeed category={PostCategory.leadershipTeam} groupName="Leadership Team" />
        <GroupFeed category={PostCategory.membershipCommittee} groupName="Membership Committee" />
        <GroupFeed category={PostCategory.coreTeam} groupName="Core Team" />
      </div>
    </div>
  );
}
