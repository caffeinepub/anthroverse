import type { Principal } from "@icp-sdk/core/principal";
export interface Some<T> {
    __kind__: "Some";
    value: T;
}
export interface None {
    __kind__: "None";
}
export type Option<T> = Some<T> | None;
export class ExternalBlob {
    getBytes(): Promise<Uint8Array<ArrayBuffer>>;
    getDirectURL(): string;
    static fromURL(url: string): ExternalBlob;
    static fromBytes(blob: Uint8Array<ArrayBuffer>): ExternalBlob;
    withUploadProgress(onProgress: (percentage: number) => void): ExternalBlob;
}
export type Time = bigint;
export interface Comment {
    content: string;
    author: Principal;
    timestamp: Time;
    postId: bigint;
}
export interface PostView {
    id: bigint;
    status: PostStatus;
    content: string;
    isPrivateGroup: boolean;
    authorName: string;
    author: Principal;
    likes: Array<Principal>;
    groupMembers: Array<Principal>;
    timestamp: Time;
    category: PostCategory;
    image?: ExternalBlob;
}
export interface Event {
    id: bigint;
    title: string;
    creator: Principal;
    registrationLimit?: bigint;
    date: Time;
    banner?: ExternalBlob;
    description: string;
}
export interface UserApprovalInfo {
    status: ApprovalStatus;
    principal: Principal;
}
export interface Notification {
    notificationType: Variant_roleAssigned_eventCreated_tenureSwitched_accountApproved_announcementPublished_eventReminder;
    recipient: Principal;
    isRead: boolean;
    message: string;
    timestamp: Time;
}
export interface UserProfile {
    isApproved: boolean;
    name: string;
    role: Role;
    email: string;
    profilePic?: ExternalBlob;
}
export enum ApprovalStatus {
    pending = "pending",
    approved = "approved",
    rejected = "rejected"
}
export enum PostCategory {
    fun = "fun",
    coreTeam = "coreTeam",
    general = "general",
    requirements = "requirements",
    announcements = "announcements",
    membershipCommittee = "membershipCommittee",
    leadershipTeam = "leadershipTeam"
}
export enum PostStatus {
    pending = "pending",
    published = "published"
}
export enum Role {
    lt = "lt",
    mc = "mc",
    elt = "elt",
    member = "member",
    secretaryTreasurer = "secretaryTreasurer",
    vicePresident = "vicePresident",
    president = "president"
}
export enum UserRole {
    admin = "admin",
    user = "user",
    guest = "guest"
}
export enum Variant_roleAssigned_eventCreated_tenureSwitched_accountApproved_announcementPublished_eventReminder {
    roleAssigned = "roleAssigned",
    eventCreated = "eventCreated",
    tenureSwitched = "tenureSwitched",
    accountApproved = "accountApproved",
    announcementPublished = "announcementPublished",
    eventReminder = "eventReminder"
}
export interface backendInterface {
    addComment(postId: bigint, content: string): Promise<void>;
    approvePost(postId: bigint): Promise<void>;
    assignCallerUserRole(user: Principal, role: UserRole): Promise<void>;
    assignRole(user: Principal, role: Role): Promise<void>;
    createEvent(title: string, description: string, date: Time, banner: ExternalBlob | null, registrationLimit: bigint | null): Promise<void>;
    deletePost(postId: bigint): Promise<void>;
    getCallerUserProfile(): Promise<UserProfile | null>;
    getCallerUserRole(): Promise<UserRole>;
    getComments(postId: bigint): Promise<Array<Comment>>;
    getEvents(): Promise<Array<Event>>;
    getMyNotifications(): Promise<Array<Notification>>;
    getMyPosts(): Promise<Array<PostView>>;
    getPosts(categoryFilter: PostCategory | null): Promise<Array<PostView>>;
    getUserProfile(user: Principal): Promise<UserProfile | null>;
    isCallerAdmin(): Promise<boolean>;
    isCallerApproved(): Promise<boolean>;
    listApprovals(): Promise<Array<UserApprovalInfo>>;
    markNotificationsRead(): Promise<void>;
    registerForEvent(eventId: bigint): Promise<void>;
    registerUser(name: string, email: string): Promise<void>;
    requestApproval(): Promise<void>;
    saveCallerUserProfile(profile: UserProfile): Promise<void>;
    searchPostsByMember(memberName: string): Promise<Array<PostView>>;
    setApproval(user: Principal, status: ApprovalStatus): Promise<void>;
    startNewTenure(president: Principal, vicePresident: Principal, secretaryTreasurer: Principal, startDate: Time, endDate: Time): Promise<void>;
    submitPost(category: PostCategory, content: string, image: ExternalBlob | null): Promise<void>;
    toggleLike(postId: bigint): Promise<void>;
    togglePaid(eventId: bigint, user: Principal): Promise<void>;
    uploadProfilePic(image: ExternalBlob): Promise<void>;
}
