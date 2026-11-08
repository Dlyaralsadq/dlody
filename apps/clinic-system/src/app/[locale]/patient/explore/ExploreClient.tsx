"use client";

import { useState, useRef, useEffect, useTransition, useCallback } from "react";
import Link from "next/link";
import { Search, X, Stethoscope, Play, ImageOff, Heart, MessageCircle, ArrowLeft } from "lucide-react";
import PostCard from "../components/PostCard";
import DoctorAvatar from "@/components/ui/DoctorAvatar";
import {
  searchExplore,
  type FeedPost,
  type ExploreSearchDoctor,
} from "@/app/actions/patientSocial";

type Tab = "all" | "posts" | "doctors";

/* ── Specialty gradient palette ── */
const SPEC_GRADS: Record<string, string> = {
  default:       "linear-gradient(135deg, #1e1b4b 0%, #312e81 100%)",
  dental:        "linear-gradient(135deg, #0c4a6e 0%, #0369a1 100%)",
  cardiology:    "linear-gradient(135deg, #4c0519 0%, #9f1239 100%)",
  dermatology:   "linear-gradient(135deg, #134e4a 0%, #0d9488 100%)",
  pediatrics:    "linear-gradient(135deg, #14532d 0%, #16a34a 100%)",
  orthopedics:   "linear-gradient(135deg, #422006 0%, #92400e 100%)",
  neurology:     "linear-gradient(135deg, #2e1065 0%, #7c3aed 100%)",
};
function specGrad(specialtyId: string) {
  const s = specialtyId.toLowerCase();
  if (s.includes("dental") || s.includes("أسنان")) return SPEC_GRADS.dental;
  if (s.includes("heart") || s.includes("cardio")) return SPEC_GRADS.cardiology;
  if (s.includes("derm") || s.includes("جلد")) return SPEC_GRADS.dermatology;
  if (s.includes("child") || s.includes("أطفال")) return SPEC_GRADS.pediatrics;
  if (s.includes("ortho") || s.includes("عظام")) return SPEC_GRADS.orthopedics;
  if (s.includes("neuro") || s.includes("أعصاب")) return SPEC_GRADS.neurology;
  return SPEC_GRADS.default;
}

/* ── Single grid tile ── */
function PostTile({
  post,
  locale,
  onClick,
}: {
  post: FeedPost;
  locale: string;
  onClick: (id: string) => void;
}) {
  const ar = locale === "ar";
  const hasMedia = !!(post.imageUrl || post.videoUrl);

  return (
    <button
      type="button"
      onClick={() => onClick(post.id)}
      className="relative overflow-hidden block w-full"
      style={{ aspectRatio: "3/4" }}
    >
      {/* Media */}
      {post.imageUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={post.imageUrl}
          alt=""
          loading="lazy"
          className="w-full h-full object-cover"
        />
      ) : post.videoUrl ? (
        <video
          src={post.videoUrl}
          className="w-full h-full object-cover"
          muted
          playsInline
          preload="metadata"
        />
      ) : (
        /* Text-only post */
        <div
          className="w-full h-full flex items-center justify-center p-3"
          style={{ background: specGrad(post.doctor.specialtyId) }}
        >
          <p className="text-[11px] text-white/90 text-center line-clamp-5 leading-relaxed font-medium">
            {post.content}
          </p>
        </div>
      )}

      {/* Video badge */}
      {post.videoUrl && (
        <div className="absolute top-1.5 end-1.5">
          <Play size={13} fill="white" className="text-white drop-shadow-lg" />
        </div>
      )}

      {/* Hover / tap overlay — always-visible stats at bottom */}
      <div
        className="absolute inset-0 flex flex-col justify-end"
        style={{ background: "linear-gradient(to top, rgba(0,0,0,.65) 0%, transparent 50%)" }}
      >
        <div className="px-2 pb-2 flex items-center gap-2">
          <span className="flex items-center gap-1 text-[10px] text-white/80 font-medium">
            <Heart size={10} fill="currentColor" /> {post.likeCount}
          </span>
          {post.commentCount > 0 && (
            <span className="flex items-center gap-1 text-[10px] text-white/60">
              <MessageCircle size={10} /> {post.commentCount}
            </span>
          )}
        </div>
      </div>

      {/* No-media fallback icon */}
      {!hasMedia && post.content.length === 0 && (
        <div className="absolute inset-0 flex items-center justify-center" style={{ background: SPEC_GRADS.default }}>
          <ImageOff size={24} className="text-white/30" />
        </div>
      )}
    </button>
  );
}

/* ── Full-screen post feed (replaces modal) ── */
function PostFeed({
  posts,
  startId,
  locale,
  patientId,
  onClose,
}: {
  posts: FeedPost[];
  startId: string;
  locale: string;
  patientId: string;
  onClose: () => void;
}) {
  const ar = locale === "ar";
  const postRefs = useRef<Map<string, HTMLDivElement>>(new Map());
  const scrolledRef = useRef(false);

  // Scroll to the tapped post once the feed mounts
  useEffect(() => {
    if (scrolledRef.current) return;
    const el = postRefs.current.get(startId);
    if (el) {
      // Use a tiny delay so layout is complete
      const id = setTimeout(() => {
        el.scrollIntoView({ behavior: "instant", block: "start" });
        scrolledRef.current = true;
      }, 30);
      return () => clearTimeout(id);
    }
  }, [startId]);

  // Prevent body scroll while feed is open
  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = ""; };
  }, []);

  return (
    <div
      className="fixed inset-0 z-50 flex flex-col lg:ps-60 desktop-content-inset"
      style={{ background: "var(--bg-root)" }}
    >
      {/* Sticky header — same bar as the home feed */}
      <div
        className="shrink-0 flex items-center gap-3 px-4 py-3 backdrop-blur-xl"
        style={{ borderBottom: "1px solid var(--border)", background: "color-mix(in srgb, var(--bg-root) 92%, transparent)" }}
      >
        <button
          type="button"
          onClick={onClose}
          className="flex h-8 w-8 items-center justify-center rounded-xl transition"
          style={{ border: "1px solid var(--border)", color: "var(--text-2)" }}
        >
          <ArrowLeft size={16} className={ar ? "rotate-180" : undefined} />
        </button>
        <span className="text-base font-bold tracking-tight" style={{ color: "var(--text-1)" }}>
          {ar ? "المنشور" : "Post"}
        </span>
      </div>

      {/* Same centered column as the home feed */}
      <div className="flex-1 overflow-y-auto">
        <div className="mx-auto w-full max-w-lg">
          {posts.map((post) => (
            <div
              key={post.id}
              ref={(el) => {
                if (el) postRefs.current.set(post.id, el);
                else postRefs.current.delete(post.id);
              }}
            >
              <PostCard
                post={post}
                locale={locale}
                patientId={patientId}
                showFollowButton={!post.isFollowingDoctor}
              />
            </div>
          ))}
          <div className="h-8" />
        </div>
      </div>
    </div>
  );
}

/* ── Doctor search row ── */
function DoctorRow({ doc, locale }: { doc: ExploreSearchDoctor; locale: string }) {
  const ar = locale === "ar";
  return (
    <Link
      href={`/${locale}/patient/doctor/${doc.id}`}
      className="flex items-center gap-3 px-4 py-3 transition"
      style={{ borderBottom: "1px solid var(--border)" }}
    >
      <DoctorAvatar logoUrl={doc.logoUrl} specialtyId={doc.specialtyId} size="md" round hasStory={doc.hasActiveStory} />
      <div className="flex-1 min-w-0">
        <p className="text-sm font-bold truncate flex items-center gap-1.5" style={{ color: "var(--text-1)" }}>
          <span className="truncate">{ar ? doc.nameAr : doc.name}</span>
          {doc.priority && (
            <span className="shrink-0 rounded-full bg-amber-400/15 px-1.5 py-0.5 text-[10px] text-amber-300">{ar ? "مميّز" : "Featured"}</span>
          )}
        </p>
        <p className="text-[11px] truncate" style={{ color: "var(--indigo-l)" }}>
          {ar ? doc.specialtyAr : doc.specialtyEn}
        </p>
      </div>
      <Stethoscope size={15} style={{ color: "var(--text-3)" }} className="shrink-0" />
    </Link>
  );
}

/* ── Main component ── */
export default function ExploreClient({
  locale,
  patientId,
  suggested,
  recent,
}: {
  locale: string;
  patientId: string;
  suggested: FeedPost[];
  recent: FeedPost[];
}) {
  const ar = locale === "ar";
  const allPosts = [...suggested, ...recent];

  const [query, setQuery] = useState("");
  const [tab, setTab] = useState<Tab>("all");
  const [searchPosts, setSearchPosts] = useState<FeedPost[]>([]);
  const [searchDoctors, setSearchDoctors] = useState<ExploreSearchDoctor[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [pending, startTransition] = useTransition();
  const [activeFeedId, setActiveFeedId] = useState<string | null>(null);

  const isActiveSearch = query.trim().length >= 2;

  const runSearch = useCallback(
    (value: string, activeTab: Tab) => {
      const q = value.trim();
      if (q.length < 2) {
        setSearchPosts([]);
        setSearchDoctors([]);
        setIsSearching(false);
        return;
      }
      setIsSearching(true);
      startTransition(async () => {
        const res = await searchExplore(patientId, q);
        setSearchPosts(res.posts);
        setSearchDoctors(res.doctors);
        setIsSearching(false);
      });
    },
    [patientId]
  );

  function handleQueryChange(value: string) {
    setQuery(value);
    runSearch(value, tab);
  }

  function handleTabChange(next: Tab) {
    setTab(next);
    if (isActiveSearch) runSearch(query, next);
  }

  function clearSearch() {
    setQuery("");
    setSearchPosts([]);
    setSearchDoctors([]);
    setIsSearching(false);
  }

  const tabs: { id: Tab; label: string }[] = [
    { id: "all", label: ar ? "الكل" : "All" },
    { id: "posts", label: ar ? "منشورات" : "Posts" },
    { id: "doctors", label: ar ? "أطباء" : "Doctors" },
  ];

  const showDoctors = isActiveSearch && (tab === "all" || tab === "doctors") && searchDoctors.length > 0;
  const showPosts   = isActiveSearch && (tab === "all" || tab === "posts") && searchPosts.length > 0;

  /* posts to show in grid when not searching */
  const gridPosts = allPosts;

  return (
    <>
      {/* Search bar */}
      <div className="px-4 py-3 space-y-3" style={{ borderBottom: "1px solid var(--border)" }}>
        <div
          className="flex items-center gap-3 rounded-2xl px-3.5 py-0.5 transition focus-within:ring-1"
          style={{
            background: "var(--bg-input)",
            border: "1px solid var(--border)",
          }}
        >
          <Search size={16} style={{ color: "var(--text-3)" }} className="shrink-0 pointer-events-none" />
          <input
            value={query}
            onChange={(e) => handleQueryChange(e.target.value)}
            placeholder={ar ? "ابحث عن طبيب أو منشور..." : "Search doctors or posts…"}
            className="flex-1 min-w-0 py-2.5 bg-transparent text-sm outline-none border-0"
            style={{ color: "var(--text-1)" }}
          />
          {query && (
            <button type="button" onClick={clearSearch}
              className="shrink-0 flex h-6 w-6 items-center justify-center rounded-full"
              style={{ background: "var(--bg-hover)", color: "var(--text-3)" }}>
              <X size={12} />
            </button>
          )}
        </div>

        {isActiveSearch && (
          <div className="flex gap-2">
            {tabs.map(({ id, label }) => (
              <button key={id} type="button" onClick={() => handleTabChange(id)}
                className="rounded-full px-3.5 py-1.5 text-xs font-semibold transition"
                style={tab === id
                  ? { background: "var(--indigo)", color: "#fff" }
                  : { background: "var(--bg-hover)", color: "var(--text-3)" }}>
                {label}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* ── Search results ── */}
      {isActiveSearch ? (
        <div>
          {pending || isSearching ? (
            <p className="text-center text-sm py-12" style={{ color: "var(--text-3)" }}>
              {ar ? "جاري البحث..." : "Searching..."}
            </p>
          ) : !showDoctors && !showPosts ? (
            <p className="text-center text-sm py-12 px-4" style={{ color: "var(--text-3)" }}>
              {ar ? "لا نتائج — جرّب كلمة أخرى" : "No results — try another term"}
            </p>
          ) : (
            <>
              {showDoctors && (
                <section>
                  <p className="px-4 pt-4 pb-2 text-[11px] font-semibold uppercase tracking-wide" style={{ color: "var(--text-3)" }}>
                    {ar ? "أطباء" : "Doctors"}
                  </p>
                  {searchDoctors.map(doc => (
                    <DoctorRow key={doc.id} doc={doc} locale={locale} />
                  ))}
                </section>
              )}
              {showPosts && (
                <section>
                  <p className="px-4 pt-4 pb-2 text-[11px] font-semibold uppercase tracking-wide" style={{ color: "var(--text-3)" }}>
                    {ar ? "منشورات" : "Posts"}
                  </p>
                  {/* search posts also as grid */}
                  <div
                    className="grid grid-cols-3"
                    style={{ gap: "1px", background: "var(--border)" }}
                  >
                    {searchPosts.map(post => (
                      <PostTile key={post.id} post={post} locale={locale} onClick={setActiveFeedId} />
                    ))}
                  </div>
                </section>
              )}
            </>
          )}
        </div>
      ) : (
        /* ── Explore grid ── */
        <>
          {gridPosts.length === 0 ? (
            <p className="text-center text-sm py-16 px-4" style={{ color: "var(--text-3)" }}>
              {ar ? "لا منشورات بعد" : "No posts yet"}
            </p>
          ) : (
            <div
              className="grid grid-cols-3"
              style={{ gap: "1px", background: "var(--border)" }}
            >
              {gridPosts.map(post => (
                <PostTile key={post.id} post={post} locale={locale} onClick={setActiveFeedId} />
              ))}
            </div>
          )}
        </>
      )}

      {/* ── Full-screen post feed ── */}
      {activeFeedId && (
        <PostFeed
          posts={isActiveSearch ? searchPosts : gridPosts}
          startId={activeFeedId}
          locale={locale}
          patientId={patientId}
          onClose={() => setActiveFeedId(null)}
        />
      )}
    </>
  );
}
