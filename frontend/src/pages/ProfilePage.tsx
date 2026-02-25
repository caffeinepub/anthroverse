import { useState } from 'react';
import { useInternetIdentity } from '../hooks/useInternetIdentity';
import {
  useGetCallerUserProfile,
  useGetCallerUserRole,
  useSaveCallerUserProfile,
  useGetMyPosts,
  useGetEvents,
  useUploadProfilePic,
} from '../hooks/useQueries';
import { UserRole, Role, ExternalBlob } from '../backend';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Skeleton } from '@/components/ui/skeleton';
import { Edit2, Camera, Calendar, FileText, Shield } from 'lucide-react';

const roleLabels: Record<string, string> = {
  president: 'President',
  vicePresident: 'Vice President',
  secretaryTreasurer: 'Secretary Treasurer',
  lt: 'LT',
  mc: 'MC',
  elt: 'ELT',
  member: 'Member',
};

const roleBadgeColors: Record<string, string> = {
  president: 'bg-amber-500/20 text-amber-700 dark:text-amber-400 border-amber-500/30',
  vicePresident: 'bg-purple-500/20 text-purple-700 dark:text-purple-400 border-purple-500/30',
  secretaryTreasurer: 'bg-blue-500/20 text-blue-700 dark:text-blue-400 border-blue-500/30',
  lt: 'bg-green-500/20 text-green-700 dark:text-green-400 border-green-500/30',
  mc: 'bg-pink-500/20 text-pink-700 dark:text-pink-400 border-pink-500/30',
  elt: 'bg-orange-500/20 text-orange-700 dark:text-orange-400 border-orange-500/30',
  member: 'bg-muted text-muted-foreground border-border',
};

export default function ProfilePage() {
  const { identity } = useInternetIdentity();
  const { data: userProfile, isLoading: profileLoading } = useGetCallerUserProfile();
  const { data: userRoleData } = useGetCallerUserRole();
  const { data: myPosts = [], isLoading: postsLoading } = useGetMyPosts();
  const { data: events = [] } = useGetEvents();
  const saveProfile = useSaveCallerUserProfile();
  const uploadProfilePic = useUploadProfilePic();

  const isAdmin = userRoleData === UserRole.admin;
  const userRole = userProfile?.role as Role | undefined;

  const [editOpen, setEditOpen] = useState(false);
  const [editName, setEditName] = useState('');
  const [editEmail, setEditEmail] = useState('');

  const handleEditOpen = () => {
    setEditName(userProfile?.name ?? '');
    setEditEmail(userProfile?.email ?? '');
    setEditOpen(true);
  };

  const handleSaveProfile = async () => {
    if (!userProfile) return;
    await saveProfile.mutateAsync({
      ...userProfile,
      name: editName.trim(),
      email: editEmail.trim(),
    });
    setEditOpen(false);
  };

  const handleProfilePicChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const arrayBuffer = await file.arrayBuffer();
    const blob = ExternalBlob.fromBytes(new Uint8Array(arrayBuffer));
    await uploadProfilePic.mutateAsync(blob);
  };

  const getInitials = (name: string) =>
    name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);

  const formatDate = (timestamp: bigint) => {
    const ms = Number(timestamp) / 1_000_000;
    return new Date(ms).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const profilePicUrl = userProfile?.profilePic
    ? userProfile.profilePic.getDirectURL()
    : undefined;

  const principal = identity?.getPrincipal().toString();

  if (profileLoading) {
    return (
      <div className="max-w-2xl mx-auto space-y-6">
        <Skeleton className="h-48 w-full rounded-2xl" />
        <Skeleton className="h-32 w-full" />
      </div>
    );
  }

  if (!userProfile) {
    return (
      <div className="max-w-md mx-auto mt-16 text-center">
        <p className="text-muted-foreground">Profile not found.</p>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Profile Header */}
      <Card className="overflow-hidden">
        <div className="h-24 bg-gradient-to-r from-primary/20 via-primary/10 to-transparent" />
        <CardContent className="pt-0 pb-6">
          <div className="flex items-end justify-between -mt-12 mb-4">
            <div className="relative">
              <Avatar className="w-20 h-20 border-4 border-background shadow-lg">
                {profilePicUrl && <AvatarImage src={profilePicUrl} alt={userProfile.name} />}
                <AvatarFallback className="bg-primary/10 text-primary text-xl font-bold">
                  {getInitials(userProfile.name)}
                </AvatarFallback>
              </Avatar>
              <label className="absolute bottom-0 right-0 w-7 h-7 bg-primary rounded-full flex items-center justify-center cursor-pointer shadow-md hover:bg-primary/90 transition-colors">
                <Camera className="w-3.5 h-3.5 text-primary-foreground" />
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleProfilePicChange}
                />
              </label>
            </div>
            <Dialog open={editOpen} onOpenChange={setEditOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" size="sm" onClick={handleEditOpen} className="gap-2">
                  <Edit2 className="w-3.5 h-3.5" />
                  Edit Profile
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-md">
                <DialogHeader>
                  <DialogTitle>Edit Profile</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 mt-2">
                  <div className="space-y-1">
                    <Label htmlFor="edit-name">Full Name</Label>
                    <Input
                      id="edit-name"
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                    />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="edit-email">Email</Label>
                    <Input
                      id="edit-email"
                      type="email"
                      value={editEmail}
                      onChange={(e) => setEditEmail(e.target.value)}
                    />
                  </div>
                  <Button
                    onClick={handleSaveProfile}
                    disabled={saveProfile.isPending || !editName.trim() || !editEmail.trim()}
                    className="w-full"
                  >
                    {saveProfile.isPending ? 'Saving...' : 'Save Changes'}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          <div className="space-y-2">
            <div className="flex items-center gap-3 flex-wrap">
              <h1 className="text-xl font-bold text-foreground">{userProfile.name}</h1>
              {userRole && (
                <span
                  className={`inline-flex items-center text-xs px-2 py-0.5 rounded-full border font-medium ${
                    roleBadgeColors[userRole] || roleBadgeColors.member
                  }`}
                >
                  {roleLabels[userRole] || userRole}
                </span>
              )}
              {isAdmin && (
                <Badge variant="outline" className="text-xs gap-1 border-primary/30 text-primary">
                  <Shield className="w-3 h-3" />
                  Admin
                </Badge>
              )}
            </div>
            <p className="text-sm text-muted-foreground">{userProfile.email}</p>
            {principal && (
              <p className="text-xs text-muted-foreground/60 font-mono">
                {principal.slice(0, 20)}...
              </p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Tabs */}
      <Tabs defaultValue="posts">
        <TabsList className="w-full">
          <TabsTrigger value="posts" className="flex-1 gap-2">
            <FileText className="w-4 h-4" />
            My Posts ({myPosts.length})
          </TabsTrigger>
          <TabsTrigger value="events" className="flex-1 gap-2">
            <Calendar className="w-4 h-4" />
            Events ({events.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="posts" className="mt-4 space-y-3">
          {postsLoading ? (
            <div className="space-y-3">
              {[1, 2].map((i) => (
                <Skeleton key={i} className="h-24 w-full" />
              ))}
            </div>
          ) : myPosts.length === 0 ? (
            <div className="text-center py-10 text-muted-foreground">
              <FileText className="w-10 h-10 mx-auto mb-2 opacity-30" />
              <p className="text-sm">No posts yet</p>
            </div>
          ) : (
            myPosts.map((post) => (
              <Card key={post.id.toString()}>
                <CardContent className="pt-4 pb-4">
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <span
                      className="text-xs px-2 py-0.5 rounded-full border font-medium bg-muted text-muted-foreground border-border"
                    >
                      {post.category}
                    </span>
                    <span className="text-xs text-muted-foreground">{formatDate(post.timestamp)}</span>
                  </div>
                  <p className="text-sm text-foreground line-clamp-3">{post.content}</p>
                  <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                    <span>❤️ {post.likes.length}</span>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>

        <TabsContent value="events" className="mt-4 space-y-3">
          {events.length === 0 ? (
            <div className="text-center py-10 text-muted-foreground">
              <Calendar className="w-10 h-10 mx-auto mb-2 opacity-30" />
              <p className="text-sm">No events available</p>
            </div>
          ) : (
            events.map((event) => (
              <Card key={event.id.toString()}>
                <CardContent className="pt-4 pb-4">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="font-medium text-sm text-foreground">{event.title}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {new Date(Number(event.date) / 1_000_000).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                        })}
                      </p>
                    </div>
                    <Calendar className="w-4 h-4 text-muted-foreground shrink-0" />
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
