import React, { useState, useRef } from 'react';
import { Camera, Edit2, Save, X, Building2, FileText, Tag, User as UserIcon, Mail, Shield } from 'lucide-react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';
import { ExternalBlob, Role, User } from '../backend';
import {
  useGetCallerUserProfile,
  useSaveProfile,
  useUploadProfilePic,
  useGetMyPosts,
} from '../hooks/useQueries';
import { roleToLabel, getInitials, roleBadgeClass, ROOT_ADMIN_EMAIL } from '../lib/utils';
import { useInternetIdentity } from '../hooks/useInternetIdentity';

const CATEGORY_OPTIONS = [
  'Technology',
  'Marketing',
  'Finance',
  'Operations',
  'Human Resources',
  'Sales',
  'Design',
  'Engineering',
  'Legal',
  'Other',
];

export default function ProfilePage() {
  const { identity } = useInternetIdentity();
  const { data: userProfile, isLoading } = useGetCallerUserProfile();
  const saveProfileMutation = useSaveProfile();
  const uploadProfilePicMutation = useUploadProfilePic();
  const { data: myPosts = [] } = useGetMyPosts();

  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [editCompanyName, setEditCompanyName] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [editCategory, setEditCategory] = useState('');
  const [picFile, setPicFile] = useState<File | null>(null);
  const [picPreview, setPicPreview] = useState<string | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const isAdmin = userProfile?.role === Role.rootAdmin;
  const isRootAdminEmail = userProfile?.email === ROOT_ADMIN_EMAIL;

  const startEditing = () => {
    if (!userProfile) return;
    setEditName(userProfile.name);
    setEditEmail(userProfile.email);
    setEditCompanyName(userProfile.companyName || '');
    setEditDescription(userProfile.description || '');
    setEditCategory('');
    setPicFile(null);
    setPicPreview(null);
    setIsEditing(true);
  };

  const cancelEditing = () => {
    setIsEditing(false);
    setPicFile(null);
    setPicPreview(null);
    setUploadProgress(0);
  };

  const handlePicChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setPicFile(file);
    const reader = new FileReader();
    reader.onload = (ev) => setPicPreview(ev.target?.result as string);
    reader.readAsDataURL(file);
  };

  const handleSave = async () => {
    if (!userProfile) return;
    if (!editName.trim()) {
      toast.error('Name is required');
      return;
    }

    try {
      let newProfilePic = userProfile.profilePic;

      // Upload new profile picture if selected
      if (picFile) {
        const bytes = new Uint8Array(await picFile.arrayBuffer());
        const blob = ExternalBlob.fromBytes(bytes).withUploadProgress((pct) => {
          setUploadProgress(pct);
        });
        await uploadProfilePicMutation.mutateAsync(blob);
        newProfilePic = blob;
      }

      const updatedProfile: User = {
        name: editName.trim(),
        email: editEmail.trim() || userProfile.email,
        role: userProfile.role,
        isApproved: userProfile.isApproved,
        profilePic: newProfilePic,
        companyName: editCompanyName.trim(),
        description: editDescription.trim(),
      };

      await saveProfileMutation.mutateAsync(updatedProfile);
      toast.success('Profile updated successfully!');
      setIsEditing(false);
      setPicFile(null);
      setPicPreview(null);
      setUploadProgress(0);
    } catch (error: any) {
      toast.error(error?.message || 'Failed to update profile');
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary" />
      </div>
    );
  }

  if (!userProfile) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <p className="text-muted-foreground">Profile not found</p>
      </div>
    );
  }

  const profilePicUrl = picPreview || (userProfile.profilePic ? userProfile.profilePic.getDirectURL() : null);

  return (
    <div className="container mx-auto px-4 py-8 max-w-3xl">
      <Card className="overflow-hidden">
        {/* Header Banner */}
        <div className="h-32 bg-gradient-to-r from-primary/30 via-primary/20 to-accent/30" />

        <CardContent className="relative pt-0 pb-6 px-6">
          {/* Avatar */}
          <div className="relative -mt-16 mb-4 flex items-end justify-between">
            <div className="relative">
              <div className="h-28 w-28 rounded-full border-4 border-background overflow-hidden bg-muted shadow-lg">
                {profilePicUrl ? (
                  <img src={profilePicUrl} alt={userProfile.name} className="h-full w-full object-cover" />
                ) : (
                  <div className="h-full w-full flex items-center justify-center bg-primary/10">
                    <span className="text-3xl font-bold text-primary">{getInitials(userProfile.name)}</span>
                  </div>
                )}
              </div>
              {isEditing && (
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="absolute bottom-1 right-1 p-1.5 bg-primary text-primary-foreground rounded-full shadow-md hover:bg-primary/90 transition-colors"
                >
                  <Camera className="h-3.5 w-3.5" />
                </button>
              )}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handlePicChange}
              />
            </div>

            {/* Edit / Save buttons */}
            <div className="flex gap-2 mb-2">
              {!isEditing ? (
                <Button variant="outline" size="sm" onClick={startEditing} className="flex items-center gap-1.5">
                  <Edit2 className="h-3.5 w-3.5" />
                  Edit Profile
                </Button>
              ) : (
                <>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={cancelEditing}
                    disabled={saveProfileMutation.isPending || uploadProfilePicMutation.isPending}
                  >
                    <X className="h-3.5 w-3.5 mr-1" />
                    Cancel
                  </Button>
                  <Button
                    size="sm"
                    onClick={handleSave}
                    disabled={saveProfileMutation.isPending || uploadProfilePicMutation.isPending}
                    className="flex items-center gap-1.5"
                  >
                    {(saveProfileMutation.isPending || uploadProfilePicMutation.isPending) ? (
                      <div className="animate-spin rounded-full h-3.5 w-3.5 border-b-2 border-primary-foreground" />
                    ) : (
                      <Save className="h-3.5 w-3.5" />
                    )}
                    Save
                  </Button>
                </>
              )}
            </div>
          </div>

          {/* Upload progress */}
          {uploadProgress > 0 && uploadProgress < 100 && (
            <div className="mb-4">
              <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                <div
                  className="h-full bg-primary transition-all duration-300"
                  style={{ width: `${uploadProgress}%` }}
                />
              </div>
              <p className="text-xs text-muted-foreground mt-1">Uploading... {uploadProgress}%</p>
            </div>
          )}

          {/* Profile Info */}
          {!isEditing ? (
            <div className="space-y-4">
              {/* Name + Badges */}
              <div>
                <div className="flex items-center flex-wrap gap-2 mb-1">
                  <h1 className="text-2xl font-bold text-foreground">{userProfile.name}</h1>
                  {(isAdmin || isRootAdminEmail) && (
                    <Badge className="bg-rose-500 text-white flex items-center gap-1">
                      <Shield className="h-3 w-3" />
                      Admin
                    </Badge>
                  )}
                  <Badge className={roleBadgeClass(userProfile.role)}>
                    {roleToLabel(userProfile.role)}
                  </Badge>
                </div>
                <div className="flex items-center gap-1.5 text-muted-foreground text-sm">
                  <Mail className="h-3.5 w-3.5" />
                  <span>{userProfile.email}</span>
                </div>
              </div>

              {/* Company */}
              {userProfile.companyName && (
                <div className="flex items-center gap-2 text-sm text-foreground">
                  <Building2 className="h-4 w-4 text-muted-foreground" />
                  <span>{userProfile.companyName}</span>
                </div>
              )}

              {/* Description */}
              {userProfile.description && (
                <div className="flex items-start gap-2 text-sm text-foreground">
                  <FileText className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
                  <p className="leading-relaxed">{userProfile.description}</p>
                </div>
              )}

              {/* Approval status */}
              <div className="flex items-center gap-2">
                <Badge variant={userProfile.isApproved ? 'default' : 'outline'} className={userProfile.isApproved ? 'bg-green-500 text-white' : 'text-amber-600 border-amber-300'}>
                  {userProfile.isApproved ? 'Approved Member' : 'Pending Approval'}
                </Badge>
              </div>

              {/* Stats */}
              <Separator />
              <div className="flex gap-6 text-sm">
                <div className="text-center">
                  <p className="font-bold text-lg text-foreground">{myPosts.length}</p>
                  <p className="text-muted-foreground text-xs">Posts</p>
                </div>
              </div>
            </div>
          ) : (
            /* Edit Form */
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label htmlFor="edit-name" className="flex items-center gap-1.5 text-sm">
                    <UserIcon className="h-3.5 w-3.5" />
                    Full Name *
                  </Label>
                  <Input
                    id="edit-name"
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    placeholder="Your full name"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="edit-email" className="flex items-center gap-1.5 text-sm">
                    <Mail className="h-3.5 w-3.5" />
                    Email
                  </Label>
                  <Input
                    id="edit-email"
                    type="email"
                    value={editEmail}
                    onChange={(e) => setEditEmail(e.target.value)}
                    placeholder="your@email.com"
                    disabled={userProfile.email === ROOT_ADMIN_EMAIL}
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="edit-company" className="flex items-center gap-1.5 text-sm">
                    <Building2 className="h-3.5 w-3.5" />
                    Company Name
                  </Label>
                  <Input
                    id="edit-company"
                    value={editCompanyName}
                    onChange={(e) => setEditCompanyName(e.target.value)}
                    placeholder="Your company or organization"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="edit-category" className="flex items-center gap-1.5 text-sm">
                    <Tag className="h-3.5 w-3.5" />
                    Category / Industry
                  </Label>
                  <select
                    id="edit-category"
                    value={editCategory}
                    onChange={(e) => setEditCategory(e.target.value)}
                    className="w-full h-9 rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-ring"
                  >
                    <option value="">Select category...</option>
                    {CATEGORY_OPTIONS.map((cat) => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="edit-description" className="flex items-center gap-1.5 text-sm">
                  <FileText className="h-3.5 w-3.5" />
                  Bio / Description
                </Label>
                <Textarea
                  id="edit-description"
                  value={editDescription}
                  onChange={(e) => setEditDescription(e.target.value)}
                  placeholder="Tell the community about yourself..."
                  rows={4}
                  className="resize-none"
                />
              </div>

              {/* Current role display (read-only) */}
              <div className="flex items-center gap-2 p-3 rounded-lg bg-muted/50">
                <Shield className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">Role:</span>
                <Badge className={roleBadgeClass(userProfile.role)}>
                  {roleToLabel(userProfile.role)}
                </Badge>
                <span className="text-xs text-muted-foreground ml-1">(assigned by admin)</span>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
