import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useActor } from './useActor';
import type { User, PostCategory, PostView, Comment, Event, Notification, UserApprovalInfo, Role, Registration } from '../backend';
import { ApprovalStatus, UserRole } from '../backend';
import { ExternalBlob } from '../backend';
import type { Principal } from '@dfinity/principal';

// ─── User Profile ─────────────────────────────────────────────────────────────

export function useGetCallerUserProfile() {
  const { actor, isFetching: actorFetching } = useActor();

  const query = useQuery<User | null>({
    queryKey: ['currentUserProfile'],
    queryFn: async () => {
      if (!actor) throw new Error('Actor not available');
      try {
        return await actor.getCallerUserProfile();
      } catch (err: any) {
        if (err?.message?.includes('Unauthorized') || err?.message?.includes('anonymous')) {
          return null;
        }
        throw err;
      }
    },
    enabled: !!actor && !actorFetching,
    retry: false,
    staleTime: 0,
  });

  return {
    ...query,
    isLoading: actorFetching || query.isLoading,
    isFetched: !!actor && !actorFetching && query.isFetched,
  };
}

export function useGetUserProfile(principal: Principal | undefined) {
  const { actor, isFetching: actorFetching } = useActor();

  return useQuery<User | null>({
    queryKey: ['userProfile', principal?.toString()],
    queryFn: async () => {
      if (!actor || !principal) return null;
      try {
        return await actor.getUserProfile(principal);
      } catch {
        return null;
      }
    },
    enabled: !!actor && !actorFetching && !!principal,
    retry: false,
  });
}

export function useSaveCallerUserProfile() {
  const { actor } = useActor();
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async (profile: User) => {
      if (!actor) throw new Error('Actor not available');
      await actor.saveCallerUserProfile(profile);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['currentUserProfile'] });
    },
  });
}

export function useUploadProfilePic() {
  const { actor } = useActor();
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async (image: ExternalBlob) => {
      if (!actor) throw new Error('Actor not available');
      await actor.uploadProfilePic(image);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['currentUserProfile'] });
    },
  });
}

// ─── Approval ─────────────────────────────────────────────────────────────────

export function useIsCallerApproved() {
  const { actor, isFetching: actorFetching } = useActor();

  return useQuery<boolean>({
    queryKey: ['isCallerApproved'],
    queryFn: async () => {
      if (!actor) return false;
      try {
        return await actor.isCallerApproved();
      } catch {
        return false;
      }
    },
    enabled: !!actor && !actorFetching,
    retry: false,
    staleTime: 0,
  });
}

export function useIsCallerAdmin() {
  const { actor, isFetching: actorFetching } = useActor();

  return useQuery<boolean>({
    queryKey: ['isCallerAdmin'],
    queryFn: async () => {
      if (!actor) return false;
      try {
        return await actor.isCallerAdmin();
      } catch {
        return false;
      }
    },
    enabled: !!actor && !actorFetching,
    retry: false,
    staleTime: 0,
  });
}

/** Alias kept for backward compatibility with pages that import useGetCallerUserRole */
export function useGetCallerUserRole() {
  return useIsCallerAdmin();
}

export function useRequestApproval() {
  const { actor } = useActor();
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      if (!actor) throw new Error('Actor not available');
      await actor.requestApproval();
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['isCallerApproved'] });
    },
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
    retry: false,
  });
}

export function useSetApproval() {
  const { actor } = useActor();
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async ({ user, status }: { user: Principal; status: ApprovalStatus }) => {
      if (!actor) throw new Error('Actor not available');
      await actor.setApproval(user, status);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['approvals'] });
      qc.invalidateQueries({ queryKey: ['isCallerApproved'] });
    },
  });
}

// ─── Role Assignment ──────────────────────────────────────────────────────────

export function useAssignRole() {
  const { actor } = useActor();
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async ({ user, role }: { user: Principal; role: Role }) => {
      if (!actor) throw new Error('Actor not available');
      await actor.assignRole(user, role);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['approvals'] });
      qc.invalidateQueries({ queryKey: ['currentUserProfile'] });
    },
  });
}

export function useAssignCallerUserRole() {
  const { actor } = useActor();
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async ({ user, role }: { user: Principal; role: UserRole }) => {
      if (!actor) throw new Error('Actor not available');
      await actor.assignCallerUserRole(user, role);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['approvals'] });
    },
  });
}

// ─── Posts ────────────────────────────────────────────────────────────────────

export function useGetPosts(categoryFilter?: PostCategory | null) {
  const { actor, isFetching: actorFetching } = useActor();
  const normalizedFilter = categoryFilter ?? undefined;

  return useQuery<PostView[]>({
    queryKey: ['posts', normalizedFilter ?? 'all'],
    queryFn: async () => {
      if (!actor) return [];
      try {
        return await actor.getPosts(normalizedFilter ?? null);
      } catch {
        return [];
      }
    },
    enabled: !!actor && !actorFetching,
    retry: false,
  });
}

export function useGetMyPosts() {
  const { actor, isFetching: actorFetching } = useActor();

  return useQuery<PostView[]>({
    queryKey: ['myPosts'],
    queryFn: async () => {
      if (!actor) return [];
      try {
        return await actor.getMyPosts();
      } catch {
        return [];
      }
    },
    enabled: !!actor && !actorFetching,
    retry: false,
  });
}

export function useSubmitPost() {
  const { actor } = useActor();
  const qc = useQueryClient();

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
      qc.invalidateQueries({ queryKey: ['posts'] });
      qc.invalidateQueries({ queryKey: ['myPosts'] });
    },
  });
}

export function useApprovePost() {
  const { actor } = useActor();
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async (postId: bigint) => {
      if (!actor) throw new Error('Actor not available');
      await actor.approvePost(postId);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['posts'] });
    },
  });
}

export function useDeletePost() {
  const { actor } = useActor();
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async (postId: bigint) => {
      if (!actor) throw new Error('Actor not available');
      await actor.deletePost(postId);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['posts'] });
      qc.invalidateQueries({ queryKey: ['myPosts'] });
    },
  });
}

export function useToggleLike() {
  const { actor } = useActor();
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async (postId: bigint) => {
      if (!actor) throw new Error('Actor not available');
      await actor.toggleLike(postId);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['posts'] });
    },
  });
}

export function useAddComment() {
  const { actor } = useActor();
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async ({ postId, content }: { postId: bigint; content: string }) => {
      if (!actor) throw new Error('Actor not available');
      await actor.addComment(postId, content);
    },
    onSuccess: (_data, variables) => {
      qc.invalidateQueries({ queryKey: ['comments', variables.postId.toString()] });
    },
  });
}

export function useGetComments(postId: bigint | undefined) {
  const { actor, isFetching: actorFetching } = useActor();

  return useQuery<Comment[]>({
    queryKey: ['comments', postId?.toString()],
    queryFn: async () => {
      if (!actor || postId === undefined) return [];
      try {
        return await actor.getComments(postId);
      } catch {
        return [];
      }
    },
    enabled: !!actor && !actorFetching && postId !== undefined,
    retry: false,
  });
}

export function useSearchPostsByMember() {
  const { actor } = useActor();

  return useMutation({
    mutationFn: async (memberName: string): Promise<PostView[]> => {
      if (!actor) return [];
      try {
        return await actor.searchPostsByMember(memberName);
      } catch {
        return [];
      }
    },
  });
}

// ─── Events ───────────────────────────────────────────────────────────────────

export function useGetEvents() {
  const { actor, isFetching: actorFetching } = useActor();

  return useQuery<Event[]>({
    queryKey: ['events'],
    queryFn: async () => {
      if (!actor) return [];
      try {
        return await actor.getEvents();
      } catch {
        return [];
      }
    },
    enabled: !!actor && !actorFetching,
    retry: false,
  });
}

export function useCreateEvent() {
  const { actor } = useActor();
  const qc = useQueryClient();

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
      banner?: ExternalBlob | null;
      registrationLimit?: bigint | null;
    }) => {
      if (!actor) throw new Error('Actor not available');
      await actor.createEvent(title, description, date, banner ?? null, registrationLimit ?? null);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['events'] });
    },
  });
}

export function useApproveEvent() {
  const { actor } = useActor();
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async (eventId: bigint) => {
      if (!actor) throw new Error('Actor not available');
      await actor.approveEvent(eventId);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['events'] });
    },
  });
}

export function useRegisterForEvent() {
  const { actor } = useActor();
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async (eventId: bigint) => {
      if (!actor) throw new Error('Actor not available');
      await actor.registerForEvent(eventId);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['events'] });
      qc.invalidateQueries({ queryKey: ['eventRegistrations'] });
    },
  });
}

export function useGetEventRegistrations(eventId: bigint | undefined) {
  const { actor, isFetching: actorFetching } = useActor();

  return useQuery<Registration[]>({
    queryKey: ['eventRegistrations', eventId?.toString()],
    queryFn: async () => {
      if (!actor || eventId === undefined) return [];
      try {
        return await actor.getEventRegistrations(eventId);
      } catch {
        return [];
      }
    },
    enabled: !!actor && !actorFetching && eventId !== undefined,
    retry: false,
  });
}

export function useTogglePaid() {
  const { actor } = useActor();
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async ({ eventId, user }: { eventId: bigint; user: Principal }) => {
      if (!actor) throw new Error('Actor not available');
      await actor.togglePaid(eventId, user);
    },
    onSuccess: (_data, variables) => {
      qc.invalidateQueries({ queryKey: ['eventRegistrations', variables.eventId.toString()] });
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
      try {
        return await actor.getMyNotifications();
      } catch {
        return [];
      }
    },
    enabled: !!actor && !actorFetching,
    retry: false,
    refetchInterval: 30_000,
  });
}

export function useMarkNotificationsRead() {
  const { actor } = useActor();
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      if (!actor) throw new Error('Actor not available');
      await actor.markNotificationsRead();
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['notifications'] });
    },
  });
}

// ─── Tenure ───────────────────────────────────────────────────────────────────

export function useStartNewTenure() {
  const { actor } = useActor();
  const qc = useQueryClient();

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
      qc.invalidateQueries({ queryKey: ['currentUserProfile'] });
      qc.invalidateQueries({ queryKey: ['approvals'] });
    },
  });
}
