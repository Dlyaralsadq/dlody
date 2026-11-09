"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { getAppSession } from "@/lib/auth";
import { getActiveStoryDoctorIds } from "@/app/actions/doctorStories";

async function requirePatientUser() {
  const session = await getAppSession();
  if (!session || session.role !== "patient") return null;
  return session;
}

export type FeedPost = {
  id: string;
  content: string;
  imageUrl: string | null;
  videoUrl: string | null;
  mediaType: string | null;
  createdAt: Date;
  likeCount: number;
  commentCount: number;
  isLiked: boolean;
  isSaved: boolean;
  isFollowingDoctor: boolean;
  isSuggested?: boolean;
  doctor: {
    id: string;
    name: string;
    nameAr: string;
    logoUrl: string | null;
    specialtyId: string;
    specialty: { name: string; nameAr: string };
    hasActiveStory?: boolean;
  };
  comments: {
    id: string;
    content: string;
    createdAt: Date;
    patientId: string;
    patientName: string;
  }[];
};

function mapPost(
  post: {
    id: string;
    content: string;
    imageUrl: string | null;
    videoUrl: string | null;
    mediaType: string | null;
    createdAt: Date;
    doctor: {
      id: string;
      name: string;
      nameAr: string;
      logoUrl: string | null;
      specialtyId: string;
      specialty: { name: string; nameAr: string };
    };
    _count: { likes: number; comments: number };
    likes: { id: string }[];
    savedBy: { id: string }[];
    comments: {
      id: string;
      content: string;
      createdAt: Date;
      patientId: string;
      patient: { name: string };
    }[];
  },
  patientId: string,
  followingDoctorIds?: Set<string>,
  isSuggested = false,
  activeStoryIds?: Set<string>
): FeedPost {
  return {
    id: post.id,
    content: post.content,
    imageUrl: post.imageUrl,
    videoUrl: post.videoUrl,
    mediaType: post.mediaType,
    createdAt: post.createdAt,
    likeCount: post._count.likes,
    commentCount: post._count.comments,
    isLiked: post.likes.length > 0,
    isSaved: post.savedBy.length > 0,
    isFollowingDoctor: followingDoctorIds?.has(post.doctor.id) ?? false,
    isSuggested,
    doctor: { ...post.doctor, hasActiveStory: activeStoryIds?.has(post.doctor.id) ?? false },
    comments: post.comments.map((c) => ({
      id: c.id,
      content: c.content,
      createdAt: c.createdAt,
      patientId: c.patientId,
      patientName: c.patient.name,
    })),
  };
}

async function getFollowingSet(patientId: string, doctorIds: string[]) {
  if (doctorIds.length === 0) return new Set<string>();
  const rows = await prisma.doctorFollow.findMany({
    where: { patientId, doctorId: { in: doctorIds } },
    select: { doctorId: true },
  });
  return new Set(rows.map((r) => r.doctorId));
}

const postInclude = (patientId: string) => ({
  doctor: { include: { specialty: true } },
  _count: { select: { likes: true, comments: true } },
  likes: { where: { patientId }, select: { id: true } },
  savedBy: { where: { patientId }, select: { id: true } },
  comments: {
    orderBy: { createdAt: "asc" as const },
    include: { patient: { select: { name: true } } },
  },
});

export async function getDoctorProfilePosts(doctorId: string, patientId: string) {
  const posts = await prisma.post.findMany({
    where: { doctorId },
    orderBy: { createdAt: "desc" },
    include: postInclude(patientId),
  });
  const [following, activeStoryIds] = await Promise.all([
    getFollowingSet(patientId, [doctorId]),
    getActiveStoryDoctorIds([doctorId]),
  ]);
  return posts.map((p) => mapPost(p, patientId, following, false, activeStoryIds));
}

export async function isFollowingDoctor(doctorId: string, patientId: string) {
  const follow = await prisma.doctorFollow.findUnique({
    where: { patientId_doctorId: { patientId, doctorId } },
  });
  return !!follow;
}

export async function getDoctorFollowerCount(doctorId: string) {
  return prisma.doctorFollow.count({ where: { doctorId } });
}

export async function toggleFollowDoctor(
  doctorId: string
): Promise<{ success: boolean; following: boolean; error?: string }> {
  const session = await requirePatientUser();
  if (!session) return { success: false, following: false, error: "unauthorized" };

  const doctor = await prisma.doctor.findUnique({ where: { id: doctorId } });
  if (!doctor) return { success: false, following: false, error: "not_found" };

  const existing = await prisma.doctorFollow.findUnique({
    where: { patientId_doctorId: { patientId: session.userId, doctorId } },
  });

  if (existing) {
    await prisma.doctorFollow.delete({ where: { id: existing.id } });
    revalidateSocialPaths();
    return { success: true, following: false };
  }

  await prisma.doctorFollow.create({
    data: { patientId: session.userId, doctorId },
  });
  revalidateSocialPaths();
  return { success: true, following: true };
}

export async function getPatientFeed(patientId: string): Promise<FeedPost[]> {
  const follows = await prisma.doctorFollow.findMany({
    where: { patientId },
    select: { doctorId: true },
  });
  const doctorIds = follows.map((f) => f.doctorId);
  if (doctorIds.length === 0) return [];

  const posts = await prisma.post.findMany({
    where: { doctorId: { in: doctorIds } },
    orderBy: { createdAt: "desc" },
    take: 50,
    include: postInclude(patientId),
  });
  const [following, activeStoryIds] = await Promise.all([
    getFollowingSet(patientId, doctorIds),
    getActiveStoryDoctorIds(doctorIds),
  ]);
  return posts.map((p) => mapPost(p, patientId, following, false, activeStoryIds));
}

export type PatientHomeFeed = {
  followingPosts: FeedPost[];
  suggestedPosts: FeedPost[];
  /** Entire feed is suggested (patient follows nobody). */
  showSuggestedOnly: boolean;
  /** Show suggested block after following posts. */
  showSuggestedSection: boolean;
};

export async function getSuggestedPosts(patientId: string, limit = 30): Promise<FeedPost[]> {
  const follows = await prisma.doctorFollow.findMany({
    where: { patientId },
    select: { doctorId: true },
  });
  const followedIds = follows.map((f) => f.doctorId);

  const posts = await prisma.post.findMany({
    where: {
      doctor: { isActive: true },
      ...(followedIds.length > 0 ? { doctorId: { notIn: followedIds } } : {}),
    },
    orderBy: { createdAt: "desc" },
    take: limit * 2,
    include: postInclude(patientId),
  });

  const shuffled = [...posts].sort(() => Math.random() - 0.5).slice(0, limit);
  const doctorIds = [...new Set(shuffled.map((p) => p.doctor.id))];
  const [following, activeStoryIds] = await Promise.all([
    getFollowingSet(patientId, doctorIds),
    getActiveStoryDoctorIds(doctorIds),
  ]);
  return shuffled.map((p) => mapPost(p, patientId, following, true, activeStoryIds));
}

export async function getExplorePosts(patientId: string, limit = 50): Promise<FeedPost[]> {
  const posts = await prisma.post.findMany({
    where: { doctor: { isActive: true } },
    orderBy: { createdAt: "desc" },
    take: limit,
    include: postInclude(patientId),
  });
  const doctorIds = [...new Set(posts.map((p) => p.doctor.id))];
  const [following, activeStoryIds] = await Promise.all([
    getFollowingSet(patientId, doctorIds),
    getActiveStoryDoctorIds(doctorIds),
  ]);
  return posts.map((p) => mapPost(p, patientId, following, false, activeStoryIds));
}

export async function getExploreFeed(patientId: string): Promise<{
  suggested: FeedPost[];
  recent: FeedPost[];
}> {
  const [suggested, recent] = await Promise.all([
    getSuggestedPosts(patientId, 15),
    getExplorePosts(patientId, 40),
  ]);
  const suggestedIds = new Set(suggested.map((p) => p.id));
  const recentFiltered = recent.filter((p) => !suggestedIds.has(p.id));
  return { suggested, recent: recentFiltered };
}

export type ExploreSearchDoctor = {
  id: string;
  name: string;
  nameAr: string;
  logoUrl: string | null;
  specialtyId: string;
  specialtyAr: string;
  specialtyEn: string;
  isFollowing: boolean;
  hasActiveStory: boolean;
  priority: boolean;
};

export async function searchExplore(
  patientId: string,
  query: string
): Promise<{ posts: FeedPost[]; doctors: ExploreSearchDoctor[] }> {
  const q = query.trim();
  if (q.length < 2) return { posts: [], doctors: [] };

  const [doctorRows, posts] = await Promise.all([
    prisma.doctor.findMany({
      where: {
        isActive: true,
        OR: [{ name: { contains: q } }, { nameAr: { contains: q } }],
      },
      include: { specialty: true },
      orderBy: { nameAr: "asc" },
      take: 12,
    }),
    prisma.post.findMany({
      where: {
        doctor: { isActive: true },
        content: { contains: q },
      },
      orderBy: { createdAt: "desc" },
      take: 30,
      include: postInclude(patientId),
    }),
  ]);

  const { getPriorityDoctorIds, sortByPriority } = await import("@/lib/publicDoctors");
  const priority = await getPriorityDoctorIds(doctorRows.map((d) => d.id));
  const orderedDoctors = sortByPriority(doctorRows, priority);
  const doctorIds = [...new Set([...orderedDoctors.map((d) => d.id), ...posts.map((p) => p.doctor.id)])];
  const [following, activeStoryIds] = await Promise.all([
    getFollowingSet(patientId, doctorIds),
    getActiveStoryDoctorIds(doctorIds),
  ]);

  return {
    doctors: orderedDoctors.map((d) => ({
      id: d.id,
      name: d.name,
      nameAr: d.nameAr,
      logoUrl: d.logoUrl,
      specialtyId: d.specialtyId,
      specialtyAr: d.specialty.nameAr,
      specialtyEn: d.specialty.name,
      isFollowing: following.has(d.id),
      hasActiveStory: activeStoryIds.has(d.id),
      priority: priority.has(d.id),
    })),
    posts: posts.map((p) => mapPost(p, patientId, following, false, activeStoryIds)),
  };
}

export async function getPatientHomeFeed(patientId: string): Promise<PatientHomeFeed> {
  const follows = await prisma.doctorFollow.findMany({
    where: { patientId },
    select: { doctorId: true },
  });

  if (follows.length === 0) {
    const suggestedPosts = await getSuggestedPosts(patientId);
    return {
      followingPosts: [],
      suggestedPosts,
      showSuggestedOnly: true,
      showSuggestedSection: false,
    };
  }

  const [followingPosts, suggestedPosts] = await Promise.all([
    getPatientFeed(patientId),
    getSuggestedPosts(patientId, 15),
  ]);

  return {
    followingPosts,
    suggestedPosts,
    showSuggestedOnly: false,
    showSuggestedSection: suggestedPosts.length > 0,
  };
}

export type BrowseDoctor = {
  id: string;
  name: string;
  nameAr: string;
  logoUrl: string | null;
  specialtyId: string;
  specialtyAr: string;
  specialtyEn: string;
  experienceYears: number | null;
  postCount: number;
  isFollowing: boolean;
  hasActiveStory: boolean;
  priority: boolean;
};

export async function getBrowseDoctors(patientId: string): Promise<BrowseDoctor[]> {
  const [doctors, follows, postCounts] = await Promise.all([
    prisma.doctor.findMany({
      where: { isActive: true },
      include: { specialty: true },
      orderBy: { nameAr: "asc" },
    }),
    prisma.doctorFollow.findMany({
      where: { patientId },
      select: { doctorId: true },
    }),
    prisma.post.groupBy({
      by: ["doctorId"],
      _count: { id: true },
    }),
  ]);

  const followSet = new Set(follows.map((f) => f.doctorId));
  const countMap = new Map(postCounts.map((p) => [p.doctorId, p._count.id]));
  const activeStoryIds = await getActiveStoryDoctorIds(doctors.map((d) => d.id));
  const { getPriorityDoctorIds, sortByPriority } = await import("@/lib/publicDoctors");
  const priority = await getPriorityDoctorIds(doctors.map((d) => d.id));

  return sortByPriority(doctors, priority).map((d) => ({
    id: d.id,
    name: d.name,
    nameAr: d.nameAr,
    logoUrl: d.logoUrl,
    specialtyId: d.specialtyId,
    specialtyAr: d.specialty.nameAr,
    specialtyEn: d.specialty.name,
    experienceYears: d.experienceYears,
    postCount: countMap.get(d.id) ?? 0,
    isFollowing: followSet.has(d.id),
    hasActiveStory: activeStoryIds.has(d.id),
    priority: priority.has(d.id),
  }));
}

export async function getSavedPosts(patientId: string): Promise<FeedPost[]> {
  const saved = await prisma.savedPost.findMany({
    where: { patientId },
    orderBy: { createdAt: "desc" },
    include: {
      post: { include: postInclude(patientId) },
    },
  });
  const doctorIds = [...new Set(saved.map((s) => s.post.doctor.id))];
  const [following, activeStoryIds] = await Promise.all([
    getFollowingSet(patientId, doctorIds),
    getActiveStoryDoctorIds(doctorIds),
  ]);
  return saved.map((s) => mapPost(s.post, patientId, following, false, activeStoryIds));
}

export async function toggleLikePost(
  postId: string
): Promise<{ success: boolean; liked: boolean; likeCount: number; error?: string }> {
  const session = await requirePatientUser();
  if (!session) return { success: false, liked: false, likeCount: 0, error: "unauthorized" };

  const post = await prisma.post.findUnique({ where: { id: postId } });
  if (!post) return { success: false, liked: false, likeCount: 0, error: "not_found" };

  const existing = await prisma.postLike.findUnique({
    where: { postId_patientId: { postId, patientId: session.userId } },
  });

  if (existing) {
    await prisma.postLike.delete({ where: { id: existing.id } });
  } else {
    await prisma.postLike.create({ data: { postId, patientId: session.userId } });
  }

  const likeCount = await prisma.postLike.count({ where: { postId } });
  revalidateSocialPaths();
  return { success: true, liked: !existing, likeCount };
}

export async function toggleSavePost(
  postId: string
): Promise<{ success: boolean; saved: boolean; error?: string }> {
  const session = await requirePatientUser();
  if (!session) return { success: false, saved: false, error: "unauthorized" };

  const post = await prisma.post.findUnique({ where: { id: postId } });
  if (!post) return { success: false, saved: false, error: "not_found" };

  const existing = await prisma.savedPost.findUnique({
    where: { postId_patientId: { postId, patientId: session.userId } },
  });

  if (existing) {
    await prisma.savedPost.delete({ where: { id: existing.id } });
    revalidateSocialPaths();
    return { success: true, saved: false };
  }

  await prisma.savedPost.create({ data: { postId, patientId: session.userId } });
  revalidateSocialPaths();
  return { success: true, saved: true };
}

export async function addComment(
  postId: string,
  content: string
): Promise<{ success: boolean; error?: string }> {
  const session = await requirePatientUser();
  if (!session) return { success: false, error: "unauthorized" };

  const text = content.trim();
  if (!text) return { success: false, error: "empty_content" };

  const post = await prisma.post.findUnique({ where: { id: postId } });
  if (!post) return { success: false, error: "not_found" };

  await prisma.postComment.create({
    data: { postId, patientId: session.userId, content: text },
  });

  revalidateSocialPaths();
  return { success: true };
}

export async function updateComment(
  commentId: string,
  content: string
): Promise<{ success: boolean; error?: string }> {
  const session = await requirePatientUser();
  if (!session) return { success: false, error: "unauthorized" };

  const comment = await prisma.postComment.findUnique({ where: { id: commentId } });
  if (!comment || comment.patientId !== session.userId) {
    return { success: false, error: "not_found" };
  }

  const text = content.trim();
  if (!text) return { success: false, error: "empty_content" };

  await prisma.postComment.update({
    where: { id: commentId },
    data: { content: text },
  });

  revalidateSocialPaths();
  return { success: true };
}

export async function deleteComment(commentId: string): Promise<{ success: boolean; error?: string }> {
  const session = await requirePatientUser();
  if (!session) return { success: false, error: "unauthorized" };

  const comment = await prisma.postComment.findUnique({ where: { id: commentId } });
  if (!comment || comment.patientId !== session.userId) {
    return { success: false, error: "not_found" };
  }

  await prisma.postComment.delete({ where: { id: commentId } });
  revalidateSocialPaths();
  return { success: true };
}

function revalidateSocialPaths() {
  revalidatePath("/[locale]/patient/updates", "page");
  revalidatePath("/[locale]/patient/explore", "page");
  revalidatePath("/[locale]/patient/saved", "page");
  revalidatePath("/[locale]/patient/doctor/[id]", "page");
}
