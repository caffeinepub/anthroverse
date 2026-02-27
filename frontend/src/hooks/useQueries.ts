import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useActor } from './useActor';
import { toast } from 'sonner';
import type { User, PostCategory, PostView, Comment, Event, Registration, UserApprovalInfo, Role } from '../backend';
import { ExternalBlob } from '../backend';
import { Principal } from '@dfinity/principal';

// ─── Profile ────────────────────────────────────────────────────────────────

export function useGetCallerUserProfile() {
  const { actor, isFetching: actorFetching } = useActor();

  const query = useQuery<User | null>({
    queryKey: ['currentUserProfile'],
    queryFn: async () => {
      if (!actor) throw new Error('Actor not available');
      try {
        return await actor.getCallerUserProfile();
      } catch {
        // New unregistered users will get an auth error — treat as no profile
        return null;
      }
    },
    enabled: !!actor && !actorFetching,
    retry: false,
  });

  return {
    ...query,
    isLoading: actorFetching || query.isLoading,
    isFetched: !!actor && query.isFetched,
  };
}

export function useGetUserProfile(userPrincipal: Principal | null) {
  const { actor, isFetching: actorFetching } = useActor();

  return useQuery<User | null>({
    queryKey: ['userProfile', userPrincipal?.toString()],
    queryFn: async () => {
      if (!actor || !userPrincipal) return null;
      return actor.getUserProfile(userPrincipal);
    },
    enabled: !!actor && !actorFetching && !!userPrincipal,
    retry: false,
  });
}

// ─── Registration ────────────────────────────────────────────────────────────

export function useRegisterUser() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ name, email }: { name: string; email: string }) => {
      if (!actor) throw new Error('Actor not available');
      await actor.registerUser(name, email);
      // Also call requestApproval so the user appears in the admin member list
      try {
        await actor.requestApproval();
      } catch {
        // Non-critical: ignore if requestApproval fails (e.g. root admin)
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['currentUserProfile'] });
      queryClient.invalidateQueries({ queryKey: ['approvals'] });
      queryClient.invalidateQueries({ queryKey: ['allUsers'] });
      queryClient.invalidateQueries({ queryKey: ['pendingApprovals'] });
    },
    onError: (error: any) => {
      toast.error(error?.message || 'Registration failed');
    },
  });
}

export function useSaveCallerUserProfile() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (profile: User) => {
      if (!actor) throw new Error('Actor not available');
      return actor.saveCallerUserProfile(profile);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['currentUserProfile'] });
    },
    onError: (error: any) => {
      toast.error(error?.message || 'Failed to save profile');
    },
  });
}

export function useUploadProfilePic() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (imageBlob: ExternalBlob) => {
      if (!actor) throw new Error('Actor not available');
      return actor.uploadProfilePic(imageBlob);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['currentUserProfile'] });
    },
    onError: (error: any) => {
      toast.error(error?.message || 'Failed to upload profile picture');
    },
  });
}

// ─── Posts ───────────────────────────────────────────────────────────────────

export function useGetPosts(categoryFilter: PostCategory | null = null) {
  const { actor, isFetching: actorFetching } = useActor();

  return useQuery<PostView[]>({
    queryKey: ['posts', categoryFilter],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getPosts(categoryFilter);
    },
    enabled: !!actor && !actorFetching,
  });
}

export function useGetPendingPosts() {
  const { actor, isFetching: actorFetching } = useActor();

  return useQuery<PostView[]>({
    queryKey: ['pendingPosts'],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getPendingPosts();
    },
    enabled: !!actor && !actorFetching,
  });
}

export function useGetMyPosts() {
  const { actor, isFetching: actorFetching } = useActor();

  return useQuery<PostView[]>({
    queryKey: ['myPosts'],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getMyPosts();
    },
    enabled: !!actor && !actorFetching,
  });
}

export function useSubmitPost() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      category,
      content,
      imageBlob,
    }: {
      category: PostCategory;
      content: string;
      imageBlob: ExternalBlob | null;
    }) => {
      if (!actor) throw new Error('Actor not available');
      return actor.submitPost(category, content, imageBlob);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['posts'] });
      queryClient.invalidateQueries({ queryKey: ['pendingPosts'] });
      queryClient.invalidateQueries({ queryKey: ['myPosts'] });
      toast.success('Post submitted successfully!');
    },
    onError: (error: any) => {
      toast.error(error?.message || 'Failed to submit post');
    },
  });
}

export function useApprovePost() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (postId: bigint) => {
      if (!actor) throw new Error('Actor not available');
      return actor.approvePost(postId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['posts'] });
      queryClient.invalidateQueries({ queryKey: ['pendingPosts'] });
      toast.success('Post approved!');
    },
    onError: (error: any) => {
      toast.error(error?.message || 'Failed to approve post');
    },
  });
}

export function useDeletePost() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (postId: bigint) => {
      if (!actor) throw new Error('Actor not available');
      return actor.deletePost(postId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['posts'] });
      queryClient.invalidateQueries({ queryKey: ['pendingPosts'] });
      queryClient.invalidateQueries({ queryKey: ['myPosts'] });
      toast.success('Post deleted!');
    },
    onError: (error: any) => {
      toast.error(error?.message || 'Failed to delete post');
    },
  });
}

export function useToggleLike() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (postId: bigint) => {
      if (!actor) throw new Error('Actor not available');
      return actor.toggleLike(postId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['posts'] });
    },
    onError: (error: any) => {
      toast.error(error?.message || 'Failed to toggle like');
    },
  });
}

// ─── Comments ────────────────────────────────────────────────────────────────

export function useGetComments(postId: bigint | undefined) {
  const { actor, isFetching: actorFetching } = useActor();

  return useQuery<Comment[]>({
    queryKey: ['comments', postId?.toString()],
    queryFn: async () => {
      if (!actor || postId === undefined) return [];
      return actor.getComments(postId);
    },
    enabled: !!actor && !actorFetching && postId !== undefined,
  });
}

export function useAddComment() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ postId, content }: { postId: bigint; content: string }) => {
      if (!actor) throw new Error('Actor not available');
      return actor.addComment(postId, content);
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['comments', variables.postId.toString()] });
      toast.success('Comment added!');
    },
    onError: (error: any) => {
      toast.error(error?.message || 'Failed to add comment');
    },
  });
}

export function useDeleteComment() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ postId, commentIndex }: { postId: bigint; commentIndex: bigint }) => {
      if (!actor) throw new Error('Actor not available');
      return actor.deleteComment(postId, commentIndex);
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['comments', variables.postId.toString()] });
      toast.success('Comment deleted!');
    },
    onError: (error: any) => {
      toast.error(error?.message || 'Failed to delete comment');
    },
  });
}

// ─── Events ──────────────────────────────────────────────────────────────────

export function useGetEvents() {
  const { actor, isFetching: actorFetching } = useActor();

  return useQuery<Event[]>({
    queryKey: ['events'],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getEvents();
    },
    enabled: !!actor && !actorFetching,
  });
}

export function useGetPendingEvents() {
  const { actor, isFetching: actorFetching } = useActor();

  return useQuery<Event[]>({
    queryKey: ['pendingEvents'],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getPendingEvents();
    },
    enabled: !!actor && !actorFetching,
  });
}

export function useCreateEvent() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      title,
      description,
      date,
      banner,
      registrationLimit,
    }: {
      title: string;
      description: string;
      date: bigint;
      banner: ExternalBlob | null;
      registrationLimit: bigint | null;
    }) => {
      if (!actor) throw new Error('Actor not available');
      return actor.createEvent(title, description, date, banner, registrationLimit);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['events'] });
      queryClient.invalidateQueries({ queryKey: ['pendingEvents'] });
      toast.success('Event created successfully!');
    },
    onError: (error: any) => {
      toast.error(error?.message || 'Failed to create event');
    },
  });
}

export function useApproveEvent() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (eventId: bigint) => {
      if (!actor) throw new Error('Actor not available');
      return actor.approveEvent(eventId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['events'] });
      queryClient.invalidateQueries({ queryKey: ['pendingEvents'] });
      toast.success('Event approved!');
    },
    onError: (error: any) => {
      toast.error(error?.message || 'Failed to approve event');
    },
  });
}

export function useRegisterForEvent() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (eventId: bigint) => {
      if (!actor) throw new Error('Actor not available');
      return actor.registerForEvent(eventId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['myRegistrations'] });
      toast.success('Registered for event!');
    },
    onError: (error: any) => {
      toast.error(error?.message || 'Failed to register for event');
    },
  });
}

export function useGetEventRegistrations(eventId: bigint | null) {
  const { actor, isFetching: actorFetching } = useActor();

  return useQuery<Registration[]>({
    queryKey: ['eventRegistrations', eventId?.toString()],
    queryFn: async () => {
      if (!actor || eventId === null) return [];
      return actor.getEventRegistrations(eventId);
    },
    enabled: !!actor && !actorFetching && eventId !== null,
  });
}

export function useGetMyRegistrations() {
  const { actor, isFetching: actorFetching } = useActor();

  return useQuery<Registration[]>({
    queryKey: ['myRegistrations'],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getMyRegistrations();
    },
    enabled: !!actor && !actorFetching,
  });
}

export function useTogglePaid() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ eventId, user }: { eventId: bigint; user: Principal }) => {
      if (!actor) throw new Error('Actor not available');
      return actor.togglePaid(eventId, user);
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['eventRegistrations', variables.eventId.toString()] });
    },
    onError: (error: any) => {
      toast.error(error?.message || 'Failed to toggle payment status');
    },
  });
}

// ─── Admin / Users ───────────────────────────────────────────────────────────

export function useListApprovals() {
  const { actor, isFetching: actorFetching } = useActor();

  return useQuery<UserApprovalInfo[]>({
    queryKey: ['pendingApprovals'],
    queryFn: async () => {
      if (!actor) return [];
      try {
        return await actor.listApprovals();
      } catch {
        return [];
      }
    },
    enabled: !!actor && !actorFetching,
  });
}

export function useGetAllUsers() {
  const { actor, isFetching: actorFetching } = useActor();

  return useQuery<Array<[Principal, User]>>({
    queryKey: ['allUsers'],
    queryFn: async () => {
      if (!actor) return [];
      try {
        const approvals: UserApprovalInfo[] = await actor.listApprovals();
        const results = await Promise.all(
          approvals.map(async (info) => {
            try {
              const profile = await actor.getUserProfile(info.principal);
              if (profile) {
                return [info.principal, profile] as [Principal, User];
              }
              return null;
            } catch {
              return null;
            }
          })
        );
        return results.filter((r): r is [Principal, User] => r !== null);
      } catch {
        return [];
      }
    },
    enabled: !!actor && !actorFetching,
  });
}

export function useApproveOrRejectUser() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ user, approved }: { user: Principal; approved: boolean }) => {
      if (!actor) throw new Error('Actor not available');
      const { ApprovalStatus } = await import('../backend');
      return actor.setApproval(user, approved ? ApprovalStatus.approved : ApprovalStatus.rejected);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['allUsers'] });
      queryClient.invalidateQueries({ queryKey: ['pendingApprovals'] });
      toast.success('User status updated!');
    },
    onError: (error: any) => {
      toast.error(error?.message || 'Failed to update user status');
    },
  });
}

export function useAssignRole() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ userPrincipal, role }: { userPrincipal: Principal; role: Role }) => {
      if (!actor) throw new Error('Actor not available');
      return actor.assignRole(userPrincipal, role);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['allUsers'] });
      toast.success('Role assigned successfully!');
    },
    onError: (error: any) => {
      toast.error(error?.message || 'Failed to assign role');
    },
  });
}

export function useRemoveMember() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (userPrincipal: Principal) => {
      if (!actor) throw new Error('Actor not available');
      return actor.removeMember(userPrincipal);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['allUsers'] });
      queryClient.invalidateQueries({ queryKey: ['pendingApprovals'] });
      toast.success('Member removed successfully!');
    },
    onError: (error: any) => {
      toast.error(error?.message || 'Failed to remove member');
    },
  });
}

// ─── Notifications ───────────────────────────────────────────────────────────

export function useGetMyNotifications() {
  const { actor, isFetching: actorFetching } = useActor();

  return useQuery({
    queryKey: ['notifications'],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getMyNotifications();
    },
    enabled: !!actor && !actorFetching,
  });
}

export function useMarkNotificationsRead() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      if (!actor) throw new Error('Actor not available');
      return actor.markNotificationsRead();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
  });
}

// ─── Tenure ──────────────────────────────────────────────────────────────────

export function useStartNewTenure() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      president,
      vicePresident,
      secretaryTreasurer,
      startDate,
      endDate,
    }: {
      president: Principal;
      vicePresident: Principal;
      secretaryTreasurer: Principal;
      startDate: bigint;
      endDate: bigint;
    }) => {
      if (!actor) throw new Error('Actor not available');
      return actor.startNewTenure(president, vicePresident, secretaryTreasurer, startDate, endDate);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['allUsers'] });
      toast.success('New tenure started!');
    },
    onError: (error: any) => {
      toast.error(error?.message || 'Failed to start new tenure');
    },
  });
}
