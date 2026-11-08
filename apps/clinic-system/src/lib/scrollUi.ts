/** Extra empty space so users can scroll past the last item. */

/** Standalone pages & dashboard main area */
export const PAGE_SCROLL_SPACER =
  "h-[calc(5rem+env(safe-area-inset-bottom,0px))]";

export const PAGE_SCROLL_PADDING =
  "scroll-pb-[calc(5rem+env(safe-area-inset-bottom,0px))]";

/** Modal / panel scroll bodies */
export const MODAL_SCROLL_SPACER =
  "h-[calc(3rem+env(safe-area-inset-bottom,0px))]";

/** Patient fixed bottom nav */
export const PATIENT_NAV_BOTTOM =
  "pb-[calc(6.5rem+env(safe-area-inset-bottom,0px)+5rem)]";

export const PATIENT_NAV_SPACER_HEIGHT =
  "h-[calc(6.5rem+env(safe-area-inset-bottom,0px)+5rem)]";

export const PATIENT_NAV_BOTTOM_SCROLL =
  "pb-[calc(6.5rem+env(safe-area-inset-bottom,0px)+8rem)]";

/** End spacer for patient doctor profile inner scroll */
export const PATIENT_PROFILE_SCROLL_SPACER =
  "h-[calc(6.5rem+env(safe-area-inset-bottom,0px)+8rem)]";

export const PATIENT_NAV_INSET =
  "pb-[calc(6.5rem+env(safe-area-inset-bottom,0px)+5rem)]";

export const PATIENT_NAV_BOTTOM_OFFSET =
  "bottom-[calc(6.5rem+env(safe-area-inset-bottom,0px)+0.25rem)]";

export const PATIENT_NAV_LEGEND_OFFSET =
  "bottom-[calc(6.5rem+env(safe-area-inset-bottom,0px)+5rem)]";

export const PATIENT_NAV_SCROLL_PADDING =
  "scroll-pb-[calc(6.5rem+env(safe-area-inset-bottom,0px)+5rem)]";

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
