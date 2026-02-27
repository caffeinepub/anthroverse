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
export interface User {
    isApproved: boolean;
    name: string;
    role: Role;
    email: string;
    profilePic?: ExternalBlob;
}
export interface Registration {
    eventId: bigint;
    user: Principal;
    isPaid: boolean;
    timestamp: Time;
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
    status: EventStatus;
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
export enum ApprovalStatus {
    pending = "pending",
    approved = "approved",
    rejected = "rejected"
}
export enum EventStatus {
    pending = "pending",
    approved = "approved"
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
    rootAdmin = "rootAdmin",
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
    /**
     * / Approve a pending event. Only Executive Core + MasterAdmin may approve.
     */
    approveEvent(eventId: bigint): Promise<void>;
    /**
     * / Approve a pending post. Only Executive Core + MasterAdmin may approve.
     */
    approvePost(postId: bigint): Promise<void>;
    assignCallerUserRole(user: Principal, role: UserRole): Promise<void>;
    /**
     * / Assign a role to a user.
     * / Rules:
     * /   - Only MasterAdmin can assign President, VP, SecretaryTreasurer.
     * /   - Executive Core + MasterAdmin can assign other roles (LT, MC, ELT, Member).
     * /   - No one can change the MasterAdmin's role.
     */
    assignRole(user: Principal, role: Role): Promise<void>;
    /**
     * / Create an event.
     * / Executive Core + MasterAdmin publish directly; others submit as pending.
     */
    createEvent(title: string, description: string, date: Time, banner: ExternalBlob | null, registrationLimit: bigint | null): Promise<void>;
    /**
     * / Delete a comment.
     * / Rules:
     * /   - Executive Core + MasterAdmin can delete any comment.
     * /   - Regular users can only delete their own comments.
     */
    deleteComment(postId: bigint, commentIndex: bigint): Promise<void>;
    /**
     * / Delete a post.
     * / Rules:
     * /   - Executive Core + MasterAdmin can delete any post.
     * /   - Regular users can only delete their own posts.
     */
    deletePost(postId: bigint): Promise<void>;
    /**
     * / Get all users. Only Executive Core + MasterAdmin.
     */
    getAllUsers(): Promise<Array<[Principal, User]>>;
    /**
     * / Returns the caller's full profile. MasterAdmin enforcement is applied here.
     */
    getCallerUserProfile(): Promise<User | null>;
    getCallerUserRole(): Promise<UserRole>;
    getComments(postId: bigint): Promise<Array<Comment>>;
    /**
     * / Get event registrations. Only Executive Core + MasterAdmin.
     */
    getEventRegistrations(eventId: bigint): Promise<Array<Registration>>;
    /**
     * / Get events. Regular members see only approved events.
     * / Executive Core + MasterAdmin see all (including pending).
     */
    getEvents(): Promise<Array<Event>>;
    getMyNotifications(): Promise<Array<Notification>>;
    getMyPosts(): Promise<Array<PostView>>;
    getMyRegistrations(): Promise<Array<Registration>>;
    /**
     * / Get pending events. Only Executive Core + MasterAdmin.
     */
    getPendingEvents(): Promise<Array<Event>>;
    /**
     * / Get pending posts. Only Executive Core + MasterAdmin may view pending posts.
     */
    getPendingPosts(): Promise<Array<PostView>>;
    /**
     * / Get pending (unapproved) users. Only MasterAdmin.
     */
    getPendingUsers(): Promise<Array<[Principal, User]>>;
    getPosts(categoryFilter: PostCategory | null): Promise<Array<PostView>>;
    getUserProfile(user: Principal): Promise<User | null>;
    isCallerAdmin(): Promise<boolean>;
    isCallerApproved(): Promise<boolean>;
    /**
     * / List pending approvals. Only MasterAdmin may view.
     */
    listApprovals(): Promise<Array<UserApprovalInfo>>;
    markNotificationsRead(): Promise<void>;
    registerForEvent(eventId: bigint): Promise<void>;
    registerUser(name: string, email: string): Promise<void>;
    requestApproval(): Promise<void>;
    saveCallerUserProfile(profile: User): Promise<void>;
    searchPostsByMember(memberName: string): Promise<Array<PostView>>;
    /**
     * / Approve or reject a user. Only MasterAdmin may approve users.
     */
    setApproval(user: Principal, status: ApprovalStatus): Promise<void>;
    startNewTenure(president: Principal, vicePresident: Principal, secretaryTreasurer: Principal, startDate: Time, endDate: Time): Promise<void>;
    submitPost(category: PostCategory, content: string, image: ExternalBlob | null): Promise<void>;
    toggleLike(postId: bigint): Promise<void>;
    /**
     * / Mark payment status. Only Executive Core + MasterAdmin.
     */
    togglePaid(eventId: bigint, user: Principal): Promise<void>;
    uploadProfilePic(image: ExternalBlob): Promise<void>;
}
