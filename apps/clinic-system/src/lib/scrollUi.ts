/** Extra empty space so users can scroll past the last item. */

/** Standalone pages & dashboard main area */
export const PAGE_SCROLL_SPACER =
  "h-[calc(5rem+env(safe-area-inset-bottom,0px))]";

export const PAGE_SCROLL_PADDING =
  "scroll-pb-[calc(5rem+env(safe-area-inset-bottom,0px))]";

/** Modal / panel scroll bodies */
export const MODAL_SCROLL_SPACER =
  "h-[calc(3rem+env(safe-area-inset-bottom,0px))]";

/**
 * Patient floating bottom nav constants.
 * Nav is raised 0.75rem from screen bottom + 0.75rem safe-area padding.
 * Nav visual height ≈ 4.5rem → total clearance needed = 4.5rem + 0.75rem + safe-area ≈ 6.25rem.
 * We use 7rem as a safe rounded value to leave breathing room.
 */
export const PATIENT_NAV_BOTTOM =
  "pb-[calc(7rem+env(safe-area-inset-bottom,0px)+5rem)]";

export const PATIENT_NAV_SPACER_HEIGHT =
  "h-[calc(7rem+env(safe-area-inset-bottom,0px))]";

export const PATIENT_NAV_BOTTOM_SCROLL =
  "pb-[calc(7rem+env(safe-area-inset-bottom,0px)+8rem)]";

/** End spacer for patient doctor profile inner scroll */
export const PATIENT_PROFILE_SCROLL_SPACER =
  "h-[calc(7rem+env(safe-area-inset-bottom,0px)+8rem)]";

export const PATIENT_NAV_INSET =
  "pb-[calc(7rem+env(safe-area-inset-bottom,0px)+5rem)]";

export const PATIENT_NAV_BOTTOM_OFFSET =
  "bottom-[calc(7rem+env(safe-area-inset-bottom,0px)+0.25rem)]";

export const PATIENT_NAV_LEGEND_OFFSET =
  "bottom-[calc(7rem+env(safe-area-inset-bottom,0px)+5rem)]";

export const PATIENT_NAV_SCROLL_PADDING =
  "scroll-pb-[calc(7rem+env(safe-area-inset-bottom,0px)+5rem)]";

export type ScrollSpacerVariant = "page" | "dashboard" | "modal" | "patientNav" | "patientProfile";

export const SCROLL_SPACER_BY_VARIANT: Record<ScrollSpacerVariant, string> = {
  page: PAGE_SCROLL_SPACER,
  dashboard: PAGE_SCROLL_SPACER,
  modal: MODAL_SCROLL_SPACER,
  patientNav: PATIENT_NAV_SPACER_HEIGHT,
  patientProfile: PATIENT_PROFILE_SCROLL_SPACER,
};

/** Apply on scroll containers site-wide */
export const SCROLL_CONTAINER = "overflow-y-auto overscroll-y-auto";

export const SCROLL_CONTAINER_PADDING = PAGE_SCROLL_PADDING;
