import React, { useState, useRef } from 'react';
import {
  User,
  Mail,
  Building,
  Edit3,
  Save,
  X,
  Camera,
  Shield,
  Loader2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { useGetCallerUserProfile, useSaveCallerUserProfile, useGetMyPosts } from '../hooks/useQueries';
import { Role, PostCategory, type User as UserType, ExternalBlob } from '../backend';
import { getInitials, roleToLabel, roleBadgeClass, categoryToLabel } from '../lib/utils';
import { isRootAdminEmail } from '../lib/utils';

const CATEGORY_OPTIONS = [
  PostCategory.general,
  PostCategory.fun,
  PostCategory.requirements,
  PostCategory.announcements,
  PostCategory.leadershipTeam,
  PostCategory.membershipCommittee,
  PostCategory.coreTeam,
];

export default function ProfilePage() {
  const { data: userProfile, isLoading } = useGetCallerUserProfile();
  const saveProfileMutation = useSaveCallerUserProfile();
  const { data: myPosts = [] } = useGetMyPosts();

  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState<Partial<UserType>>({});
  const [profilePicFile, setProfilePicFile] = useState<File | null>(null);
  const [profilePicPreview, setProfilePicPreview] = useState<string | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const profilePicUrl = userProfile?.profilePic
    ? (userProfile.profilePic as ExternalBlob).getDirectURL()
    : undefined;

  const handleEditStart = () => {
    setEditForm({
      name: userProfile?.name ?? '',
      email: userProfile?.email ?? '',
      companyName: userProfile?.companyName ?? '',
      description: userProfile?.description ?? '',
    });
    setIsEditing(true);
  };

  const handleEditCancel = () => {
    setIsEditing(false);
    setEditForm({});
    setProfilePicFile(null);
    setProfilePicPreview(null);
  };

  const handleProfilePicChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setProfilePicFile(file);
    const reader = new FileReader();
    reader.onloadend = () => setProfilePicPreview(reader.result as string);
    reader.readAsDataURL(file);
  };

  const handleSave = async () => {
    if (!userProfile) return;
    try {
      let profilePic = userProfile.profilePic;

      if (profilePicFile) {
        const bytes = new Uint8Array(await profilePicFile.arrayBuffer());
        const blob = ExternalBlob.fromBytes(bytes).withUploadProgress(pct => setUploadProgress(pct));
        profilePic = blob;
      }

      const updatedProfile: UserType = {
        name: editForm.name ?? userProfile.name,
        email: editForm.email ?? userProfile.email,
        role: userProfile.role,
        isApproved: userProfile.isApproved,
        profilePic: profilePic ?? undefined,
        companyName: editForm.companyName ?? userProfile.companyName,
        description: editForm.description ?? userProfile.description,
      };

      await saveProfileMutation.mutateAsync(updatedProfile);
      toast.success('Profile updated successfully');
      setIsEditing(false);
      setProfilePicFile(null);
      setProfilePicPreview(null);
      setUploadProgress(0);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      toast.error(`Failed to update profile: ${msg}`);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!userProfile) {
    return (
      <div className="flex items-center justify-center py-20 text-muted-foreground">
        <p>Profile not found</p>
      </div>
    );
  }

  const isRootAdmin = isRootAdminEmail(userProfile.email);

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 space-y-6">
      {/* Profile Card */}
      <Card>
        <CardHeader className="pb-4">
          <div className="flex items-start justify-between">
            <CardTitle className="text-xl">My Profile</CardTitle>
            {!isEditing ? (
              <Button variant="outline" size="sm" onClick={handleEditStart}>
                <Edit3 className="w-4 h-4 mr-1.5" />
                Edit
              </Button>
            ) : (
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={handleEditCancel}>
                  <X className="w-4 h-4 mr-1.5" />
                  Cancel
                </Button>
                <Button
                  size="sm"
                  onClick={handleSave}
                  disabled={saveProfileMutation.isPending}
                >
                  {saveProfileMutation.isPending ? (
                    <Loader2 className="w-4 h-4 animate-spin mr-1.5" />
                  ) : (
                    <Save className="w-4 h-4 mr-1.5" />
                  )}
                  Save
                </Button>
              </div>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Avatar */}
          <div className="flex items-center gap-4">
            <div className="relative">
              <Avatar className="w-20 h-20">
                {(profilePicPreview || profilePicUrl) && (
                  <AvatarImage src={profilePicPreview ?? profilePicUrl} alt={userProfile.name} />
                )}
                <AvatarFallback className="bg-primary/10 text-primary text-2xl font-bold">
                  {getInitials(userProfile.name)}
                </AvatarFallback>
              </Avatar>
              {isEditing && (
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="absolute bottom-0 right-0 p-1.5 rounded-full bg-primary text-primary-foreground shadow-md hover:bg-primary/90 transition-colors"
                >
                  <Camera className="w-3.5 h-3.5" />
                </button>
              )}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleProfilePicChange}
              />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-xl font-bold text-foreground truncate">{userProfile.name}</h2>
                {isRootAdmin && (
                  <Badge className="bg-amber-500/10 text-amber-600 border-amber-300 flex items-center gap-1">
                    <Shield className="w-3 h-3" />
                    Admin
                  </Badge>
                )}
              </div>
              <div className="flex items-center gap-2 mt-1 flex-wrap">
                <Badge className={`text-xs ${roleBadgeClass(userProfile.role)}`}>
                  {roleToLabel(userProfile.role)}
                </Badge>
                <Badge variant={userProfile.isApproved ? 'default' : 'secondary'} className="text-xs">
                  {userProfile.isApproved ? 'Approved' : 'Pending'}
                </Badge>
              </div>
            </div>
          </div>

          {uploadProgress > 0 && uploadProgress < 100 && (
            <div className="w-full bg-muted rounded-full h-1.5">
              <div
                className="bg-primary h-1.5 rounded-full transition-all"
                style={{ width: `${uploadProgress}%` }}
              />
            </div>
          )}

          {/* Fields */}
          <div className="space-y-4">
            {/* Name */}
            <div className="space-y-1.5">
              <Label className="flex items-center gap-1.5 text-sm font-medium">
                <User className="w-3.5 h-3.5" />
                Full Name
              </Label>
              {isEditing ? (
                <Input
                  value={editForm.name ?? ''}
                  onChange={e => setEditForm(f => ({ ...f, name: e.target.value }))}
                  placeholder="Your full name"
                />
              ) : (
                <p className="text-sm text-foreground">{userProfile.name}</p>
              )}
            </div>

            {/* Email */}
            <div className="space-y-1.5">
              <Label className="flex items-center gap-1.5 text-sm font-medium">
                <Mail className="w-3.5 h-3.5" />
                Email
              </Label>
              {isEditing ? (
                <Input
                  type="email"
                  value={editForm.email ?? ''}
                  onChange={e => setEditForm(f => ({ ...f, email: e.target.value }))}
                  placeholder="your@email.com"
                />
              ) : (
                <p className="text-sm text-foreground">{userProfile.email}</p>
              )}
            </div>

            {/* Company */}
            <div className="space-y-1.5">
              <Label className="flex items-center gap-1.5 text-sm font-medium">
                <Building className="w-3.5 h-3.5" />
                Company / Organization
              </Label>
              {isEditing ? (
                <Input
                  value={editForm.companyName ?? ''}
                  onChange={e => setEditForm(f => ({ ...f, companyName: e.target.value }))}
                  placeholder="Your company or organization"
                />
              ) : (
                <p className="text-sm text-foreground">{userProfile.companyName || '—'}</p>
              )}
            </div>

            {/* Bio */}
            <div className="space-y-1.5">
              <Label className="text-sm font-medium">Bio / Description</Label>
              {isEditing ? (
                <Textarea
                  value={editForm.description ?? ''}
                  onChange={e => setEditForm(f => ({ ...f, description: e.target.value }))}
                  placeholder="Tell the community about yourself..."
                  rows={3}
                />
              ) : (
                <p className="text-sm text-foreground">{userProfile.description || '—'}</p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* My Posts */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">My Posts ({myPosts.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {myPosts.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">No posts yet</p>
          ) : (
            <div className="space-y-3">
              {myPosts.map(post => (
                <div key={post.id.toString()} className="p-3 rounded-lg border border-border">
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <Badge variant="outline" className="text-xs">
                      {categoryToLabel(post.category)}
                    </Badge>
                    <Badge
                      variant={post.status === 'published' ? 'default' : 'secondary'}
                      className="text-xs"
                    >
                      {post.status}
                    </Badge>
                  </div>
                  <p className="text-sm text-foreground line-clamp-2">{post.content}</p>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
