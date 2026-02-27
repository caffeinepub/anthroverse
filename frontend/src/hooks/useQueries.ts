import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useActor } from './useActor';
import { ApprovalStatus, PostCategory, Role, UserRole, type User, type PostView, type Comment, type Event, type Registration, type Notification, type UserApprovalInfo } from '../backend';
import type { Principal } from '@dfinity/principal';
import { toast } from 'sonner';

// ─── User / Profile ──────────────────────────────────────────────────────────

export function useGetCallerUserProfile() {
  const { actor, isFetching: actorFetching } = useActor();

  const query = useQuery<User | null>({
    queryKey: ['currentUserProfile'],
    queryFn: async () => {
      if (!actor) throw new Error('Actor not available');
      return actor.getCallerUserProfile();
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
      toast.success('Profile saved successfully');
    },
    onError: (error: Error) => {
      toast.error(`Failed to save profile: ${error.message}`);
    },
  });
}

export function useRegisterUser() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ name, email }: { name: string; email: string }) => {
      if (!actor) throw new Error('Actor not available');
      return actor.registerUser(name, email);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['currentUserProfile'] });
    },
    onError: (error: Error) => {
      toast.error(`Registration failed: ${error.message}`);
    },
  });
}

// ─── Posts ────────────────────────────────────────────────────────────────────

export function useGetPosts(categoryFilter?: PostCategory) {
  const { actor, isFetching: actorFetching } = useActor();

  return useQuery<PostView[]>({
    queryKey: ['posts', categoryFilter ?? 'all'],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getPosts(categoryFilter ?? null);
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
      imageBlob?: import('../backend').ExternalBlob;
    }) => {
      if (!actor) throw new Error('Actor not available');
      return actor.submitPost(category, content, imageBlob ?? null);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['posts'] });
      queryClient.invalidateQueries({ queryKey: ['myPosts'] });
      toast.success('Post submitted successfully');
    },
    onError: (error: Error) => {
      toast.error(`Failed to submit post: ${error.message}`);
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
      toast.success('Post approved');
    },
    onError: (error: Error) => {
      toast.error(`Failed to approve post: ${error.message}`);
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
      queryClient.invalidateQueries({ queryKey: ['myPosts'] });
      toast.success('Post deleted');
    },
    onError: (error: Error) => {
      toast.error(`Failed to delete post: ${error.message}`);
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
      queryClient.invalidateQueries({ queryKey: ['myPosts'] });
    },
    onError: (error: Error) => {
      toast.error(`Failed to toggle like: ${error.message}`);
    },
  });
}

// ─── Comments ─────────────────────────────────────────────────────────────────

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
    },
    onError: (error: Error) => {
      toast.error(`Failed to add comment: ${error.message}`);
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
    },
    onError: (error: Error) => {
      toast.error(`Failed to delete comment: ${error.message}`);
    },
  });
}

// ─── Users / Approvals ────────────────────────────────────────────────────────

export function useGetAllUsers() {
  const { actor, isFetching: actorFetching } = useActor();

  return useQuery<[Principal, User][]>({
    queryKey: ['allUsers'],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getAllUsers();
    },
    enabled: !!actor && !actorFetching,
  });
}

export function useGetPendingUsers() {
  const { actor, isFetching: actorFetching } = useActor();

  return useQuery<[Principal, User][]>({
    queryKey: ['pendingUsers'],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getPendingUsers();
    },
    enabled: !!actor && !actorFetching,
    retry: 1,
  });
}

export function useApproveOrRejectUser() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      userPrincipal,
      status,
    }: {
      userPrincipal: Principal;
      status: ApprovalStatus;
    }) => {
      if (!actor) throw new Error('Actor not available. Please wait for authentication.');
      return actor.approveOrRejectUser(userPrincipal, status);
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['pendingUsers'] });
      queryClient.invalidateQueries({ queryKey: ['allUsers'] });
      queryClient.invalidateQueries({ queryKey: ['pendingApprovals'] });
      const action = variables.status === ApprovalStatus.approved ? 'approved' : 'rejected';
      toast.success(`User ${action} successfully`);
    },
    onError: (error: Error) => {
      const msg = error.message || 'Unknown error';
      toast.error(`Failed to update approval: ${msg}`);
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
      toast.success('Role assigned successfully');
    },
    onError: (error: Error) => {
      toast.error(`Failed to assign role: ${error.message}`);
    },
  });
}

export function useRequestApproval() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      if (!actor) throw new Error('Actor not available');
      return actor.requestApproval();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['approvalStatus'] });
      toast.success('Approval request submitted');
    },
    onError: (error: Error) => {
      toast.error(`Failed to request approval: ${error.message}`);
    },
  });
}

export function useIsCallerApproved() {
  const { actor, isFetching: actorFetching } = useActor();

  return useQuery<boolean>({
    queryKey: ['approvalStatus'],
    queryFn: async () => {
      if (!actor) return false;
      return actor.isCallerApproved();
    },
    enabled: !!actor && !actorFetching,
  });
}

// ─── Events ───────────────────────────────────────────────────────────────────

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
      banner: import('../backend').ExternalBlob | null;
      registrationLimit: bigint | null;
    }) => {
      if (!actor) throw new Error('Actor not available');
      return actor.createEvent(title, description, date, banner, registrationLimit);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['events'] });
      queryClient.invalidateQueries({ queryKey: ['pendingEvents'] });
      toast.success('Event created successfully');
    },
    onError: (error: Error) => {
      toast.error(`Failed to create event: ${error.message}`);
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
      toast.success('Event approved');
    },
    onError: (error: Error) => {
      toast.error(`Failed to approve event: ${error.message}`);
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
      toast.success('Registered for event');
    },
    onError: (error: Error) => {
      toast.error(`Failed to register: ${error.message}`);
    },
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
    onError: (error: Error) => {
      toast.error(`Failed to update payment: ${error.message}`);
    },
  });
}

// ─── Notifications ────────────────────────────────────────────────────────────

export function useGetMyNotifications() {
  const { actor, isFetching: actorFetching } = useActor();

  return useQuery<Notification[]>({
    queryKey: ['notifications'],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getMyNotifications();
    },
    enabled: !!actor && !actorFetching,
    refetchInterval: 30000,
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

// ─── Tenure ───────────────────────────────────────────────────────────────────

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
      queryClient.invalidateQueries({ queryKey: ['currentUserProfile'] });
      toast.success('New tenure started');
    },
    onError: (error: Error) => {
      toast.error(`Failed to start tenure: ${error.message}`);
    },
  });
}

// ─── Access Control ───────────────────────────────────────────────────────────

export function useIsCallerAdmin() {
  const { actor, isFetching: actorFetching } = useActor();

  return useQuery<boolean>({
    queryKey: ['isCallerAdmin'],
    queryFn: async () => {
      if (!actor) return false;
      return actor.isCallerAdmin();
    },
    enabled: !!actor && !actorFetching,
  });
}

export function useGetCallerUserRole() {
  const { actor, isFetching: actorFetching } = useActor();

  return useQuery<UserRole>({
    queryKey: ['callerUserRole'],
    queryFn: async () => {
      if (!actor) return UserRole.guest;
      return actor.getCallerUserRole();
    },
    enabled: !!actor && !actorFetching,
  });
}

export function useListApprovals() {
  const { actor, isFetching: actorFetching } = useActor();

  return useQuery<UserApprovalInfo[]>({
    queryKey: ['listApprovals'],
    queryFn: async () => {
      if (!actor) return [];
      return actor.listApprovals();
    },
    enabled: !!actor && !actorFetching,
  });
}

export function useUploadProfilePic() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (image: import('../backend').ExternalBlob) => {
      if (!actor) throw new Error('Actor not available');
      return actor.uploadProfilePic(image);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['currentUserProfile'] });
      toast.success('Profile picture updated');
    },
    onError: (error: Error) => {
      toast.error(`Failed to upload profile picture: ${error.message}`);
    },
  });
}
