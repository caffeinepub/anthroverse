import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useActor } from './useActor';
import {
  PostCategory,
  PostView,
  User,
  Role,
  ApprovalStatus,
  UserApprovalInfo,
  ExternalBlob,
  Event,
  Comment,
  Registration,
  Notification,
} from '../backend';
import { Principal } from '@dfinity/principal';

// ─── Profile ────────────────────────────────────────────────────────────────

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

export function useSaveProfile() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (profile: User) => {
      if (!actor) throw new Error('Actor not available');
      await actor.saveCallerUserProfile(profile);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['currentUserProfile'] });
      queryClient.invalidateQueries({ queryKey: ['allUsers'] });
    },
  });
}

// Alias for backward compatibility
export const useSaveCallerUserProfile = useSaveProfile;

export function useUploadProfilePic() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (blob: ExternalBlob) => {
      if (!actor) throw new Error('Actor not available');
      await actor.uploadProfilePic(blob);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['currentUserProfile'] });
    },
  });
}

export function useRegisterUser() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ name, email }: { name: string; email: string }) => {
      if (!actor) throw new Error('Actor not available');
      await actor.registerUser(name, email);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['currentUserProfile'] });
    },
  });
}

export function useGetUserProfile(principal: Principal | null) {
  const { actor, isFetching: actorFetching } = useActor();

  return useQuery<User | null>({
    queryKey: ['userProfile', principal?.toString()],
    queryFn: async () => {
      if (!actor || !principal) return null;
      return actor.getUserProfile(principal);
    },
    enabled: !!actor && !actorFetching && !!principal,
  });
}

// ─── Posts ───────────────────────────────────────────────────────────────────

export function useGetPosts(categoryFilter?: PostCategory) {
  const { actor, isFetching: actorFetching } = useActor();

  return useQuery<PostView[]>({
    queryKey: ['posts', categoryFilter ?? 'all'],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getPosts(categoryFilter ?? null);
    },
    enabled: !!actor && !actorFetching,
    refetchOnMount: true,
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

export function useSubmitPost() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      category,
      content,
      image,
    }: {
      category: PostCategory;
      content: string;
      image?: ExternalBlob | null;
    }) => {
      if (!actor) throw new Error('Actor not available');
      await actor.submitPost(category, content, image ?? null);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['posts'] });
      queryClient.invalidateQueries({ queryKey: ['myPosts'] });
      queryClient.invalidateQueries({ queryKey: ['pendingPosts'] });
    },
  });
}

export function useApprovePost() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (postId: bigint) => {
      if (!actor) throw new Error('Actor not available');
      await actor.approvePost(postId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['posts'] });
      queryClient.invalidateQueries({ queryKey: ['pendingPosts'] });
    },
  });
}

export function useDeletePost() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (postId: bigint) => {
      if (!actor) throw new Error('Actor not available');
      await actor.deletePost(postId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['posts'] });
      queryClient.invalidateQueries({ queryKey: ['myPosts'] });
      queryClient.invalidateQueries({ queryKey: ['pendingPosts'] });
    },
  });
}

export function useToggleLike() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (postId: bigint) => {
      if (!actor) throw new Error('Actor not available');
      await actor.toggleLike(postId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['posts'] });
      queryClient.invalidateQueries({ queryKey: ['myPosts'] });
    },
  });
}

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
      await actor.addComment(postId, content);
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['comments', variables.postId.toString()] });
    },
  });
}

export function useDeleteComment() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ postId, commentIndex }: { postId: bigint; commentIndex: bigint }) => {
      if (!actor) throw new Error('Actor not available');
      await actor.deleteComment(postId, commentIndex);
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['comments', variables.postId.toString()] });
    },
  });
}

export function useSearchPostsByMember() {
  const { actor } = useActor();

  return useMutation({
    mutationFn: async (memberName: string) => {
      if (!actor) throw new Error('Actor not available');
      return actor.searchPostsByMember(memberName);
    },
  });
}

// ─── Users / Admin ───────────────────────────────────────────────────────────

export function useGetAllUsers() {
  const { actor, isFetching: actorFetching } = useActor();

  return useQuery<[Principal, User][]>({
    queryKey: ['allUsers'],
    queryFn: async () => {
      if (!actor) return [];
      try {
        return await actor.getAllUsers();
      } catch {
        return [];
      }
    },
    enabled: !!actor && !actorFetching,
    refetchOnMount: 'always',
    staleTime: 0,
  });
}

export function useGetPendingUsers() {
  const { actor, isFetching: actorFetching } = useActor();

  return useQuery<[Principal, User][]>({
    queryKey: ['pendingUsers'],
    queryFn: async () => {
      if (!actor) return [];
      try {
        return await actor.getPendingUsers();
      } catch {
        return [];
      }
    },
    enabled: !!actor && !actorFetching,
  });
}

export function useListApprovals() {
  const { actor, isFetching: actorFetching } = useActor();

  return useQuery<UserApprovalInfo[]>({
    queryKey: ['approvals'],
    queryFn: async () => {
      if (!actor) return [];
      try {
        return await actor.listApprovals();
      } catch {
        return [];
      }
    },
    enabled: !!actor && !actorFetching,
    refetchOnMount: 'always',
    staleTime: 0,
  });
}

export function useSetApproval() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ user, status }: { user: Principal; status: ApprovalStatus }) => {
      if (!actor) throw new Error('Actor not available');
      await actor.setApproval(user, status);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['approvals'] });
      queryClient.invalidateQueries({ queryKey: ['allUsers'] });
      queryClient.invalidateQueries({ queryKey: ['pendingUsers'] });
    },
  });
}

export function useApproveUser() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (user: Principal) => {
      if (!actor) throw new Error('Actor not available');
      await actor.setApproval(user, ApprovalStatus.approved);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['approvals'] });
      queryClient.invalidateQueries({ queryKey: ['allUsers'] });
      queryClient.invalidateQueries({ queryKey: ['pendingUsers'] });
    },
  });
}

export function useAssignRole() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ user, role }: { user: Principal; role: Role }) => {
      if (!actor) throw new Error('Actor not available');
      await actor.assignRole(user, role);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['allUsers'] });
      queryClient.invalidateQueries({ queryKey: ['currentUserProfile'] });
    },
  });
}

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
      await actor.startNewTenure(president, vicePresident, secretaryTreasurer, startDate, endDate);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['allUsers'] });
      queryClient.invalidateQueries({ queryKey: ['currentUserProfile'] });
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
  });
}

export function useRequestApproval() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      if (!actor) throw new Error('Actor not available');
      await actor.requestApproval();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['approvals'] });
      queryClient.invalidateQueries({ queryKey: ['currentUserProfile'] });
    },
  });
}

export function useIsCallerApproved() {
  const { actor, isFetching: actorFetching } = useActor();

  return useQuery<boolean>({
    queryKey: ['isApproved'],
    queryFn: async () => {
      if (!actor) return false;
      return actor.isCallerApproved();
    },
    enabled: !!actor && !actorFetching,
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
      try {
        return await actor.getPendingEvents();
      } catch {
        return [];
      }
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
      await actor.createEvent(title, description, date, banner, registrationLimit);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['events'] });
      queryClient.invalidateQueries({ queryKey: ['pendingEvents'] });
    },
  });
}

export function useApproveEvent() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (eventId: bigint) => {
      if (!actor) throw new Error('Actor not available');
      await actor.approveEvent(eventId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['events'] });
      queryClient.invalidateQueries({ queryKey: ['pendingEvents'] });
    },
  });
}

export function useRegisterForEvent() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (eventId: bigint) => {
      if (!actor) throw new Error('Actor not available');
      await actor.registerForEvent(eventId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['myRegistrations'] });
      queryClient.invalidateQueries({ queryKey: ['events'] });
    },
  });
}

// Accepts bigint | undefined (not null) to match query key pattern
export function useGetEventRegistrations(eventId: bigint | undefined) {
  const { actor, isFetching: actorFetching } = useActor();

  return useQuery<Registration[]>({
    queryKey: ['eventRegistrations', eventId?.toString()],
    queryFn: async () => {
      if (!actor || eventId === undefined) return [];
      return actor.getEventRegistrations(eventId);
    },
    enabled: !!actor && !actorFetching && eventId !== undefined,
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
      await actor.togglePaid(eventId, user);
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({
        queryKey: ['eventRegistrations', variables.eventId.toString()],
      });
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
      await actor.markNotificationsRead();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
  });
}
