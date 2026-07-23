import { useCallback, useEffect, useLayoutEffect, useRef } from "react";
import { useNavigationType } from "react-router-dom";
import * as listScrollCache from "./listScrollCache";

/**
 * Restores an infinite-scroll listing's loaded items and scroll position when the user
 * returns to it via Back/forward. Shared by `SeriesCardList` and `UserCardsList`.
 *
 *   const { initial, persist, cancelRestore } = useListScrollRestoration(cacheKey);
 *
 * Mental model — the whole design is these five lines; the rest is defence against
 * browser/React races (see docs/scroll-restoration.md):
 *   Store              a single module-level slot, keyed by URL
 *   Save continuously  scroll writer + persist(), never on unmount
 *   Restore once       seed from `initial` at first render, scroll in a layout effect
 *   Hold briefly       a ~1.5s rAF loop re-asserts it, bailing when the user scrolls
 *   POP only           restore on Back/forward; a fresh navigation starts at the top
 *
 * CONTRACT — both rules exist because React StrictMode double-invokes in development:
 *   1. `initial` is read ONCE, at first render. Use it in lazy useState initializers
 *      (`useState(() => initial ? initial.page : 1)`), never in an effect.
 *   2. `persist` must be called from an effect BODY, never a cleanup. StrictMode fires
 *      cleanups on mount, which would snapshot transient state.
 *
 * Everything is inert unless `cacheKey` is set, so a list that doesn't opt in is unaffected.
 *
 * Only enable this on a listing the viewer cannot modify from the listing itself — restored
 * items are NOT re-fetched, so a mutable listing would show stale rows.
 *
 * @param {string|undefined} cacheKey  Identity of this listing, normally
 *                                     `location.pathname + location.search`. A different
 *                                     filter is a different key, so filter changes reset.
 */
export default function useListScrollRestoration(cacheKey) {
	const navigationType = useNavigationType();

	// Read the snapshot once, at first render, and only on a back/forward navigation. A
	// fresh navigation (clicking a link to this listing) deliberately ignores the store and
	// starts at the top. A hard reload reports POP but the in-memory store is empty then, so
	// it also starts fresh.
	const initialSnapshotBoxRef = useRef();
	if (!initialSnapshotBoxRef.current) {
		initialSnapshotBoxRef.current = {
			snapshot:
				cacheKey && navigationType === "POP"
					? listScrollCache.get(cacheKey)
					: undefined,
		};
	}
	const initial = initialSnapshotBoxRef.current.snapshot;

	const scrollYRef = useRef(0);
	const pendingRestoreScrollYRef = useRef(initial ? initial.scrollY : null);
	const restoreTargetRef = useRef(null);
	const restoreDeadlineRef = useRef(0);

	// Apply the scroll once the restored items are in the DOM — a layout effect, so it lands
	// before paint (no flash) and against a document tall enough to hold the position rather
	// than being clamped to a short one.
	//
	// Mount-only is sufficient *because* the consumer seeds its items from `initial` in a lazy
	// useState initializer: they are therefore present in the very first committed DOM, before
	// this runs. (An earlier version keyed this on the items array, but since the restore is
	// consumed on its first run every later invocation was already a no-op.)
	useLayoutEffect(() => {
		if (pendingRestoreScrollYRef.current == null) return;
		const targetScrollY = pendingRestoreScrollYRef.current;
		pendingRestoreScrollYRef.current = null;
		scrollYRef.current = targetScrollY;
		restoreTargetRef.current = targetScrollY;
		restoreDeadlineRef.current = performance.now() + 1500;
		window.scrollTo(0, targetScrollY);
	}, []);

	// Hold the restored position against late nudges (the browser, another component's
	// passive effect) for a short window. Mount-once per cacheKey so it survives both
	// `items` changing and StrictMode's cleanup double-invoke. Any real user input ends it
	// immediately, so we never fight a deliberate scroll.
	useEffect(() => {
		if (!cacheKey) return undefined;

		let rafId = 0;
		const loop = () => {
			const target = restoreTargetRef.current;
			if (target != null) {
				if (performance.now() >= restoreDeadlineRef.current) {
					restoreTargetRef.current = null;
				} else if (Math.abs(window.scrollY - target) > 2) {
					// >2px, because scroll positions are fractional on scaled displays and an
					// exact comparison would micro-correct forever.
					window.scrollTo(0, target);
					scrollYRef.current = target;
				}
			}
			rafId = requestAnimationFrame(loop);
		};
		rafId = requestAnimationFrame(loop);

		const abort = () => {
			restoreTargetRef.current = null;
		};
		window.addEventListener("wheel", abort, { passive: true });
		window.addEventListener("touchmove", abort, { passive: true });
		window.addEventListener("keydown", abort);

		return () => {
			cancelAnimationFrame(rafId);
			window.removeEventListener("wheel", abort);
			window.removeEventListener("touchmove", abort);
			window.removeEventListener("keydown", abort);
		};
	}, [cacheKey]);

	// Keep the stored snapshot's scrollY current on every scroll (throttled to one write
	// per frame). Persisting continuously — rather than at unmount — is what makes the saved
	// position reliable: it never depends on what window.scrollY happens to be during the
	// navigation instant.
	useEffect(() => {
		if (!cacheKey) return undefined;
		let ticking = false;
		const handleScroll = () => {
			if (restoreTargetRef.current != null) return;
			const y = window.scrollY;
			const prev = scrollYRef.current;

			// Ignore a clamp caused by the page collapsing during navigation: scroll dropped
			// far AND the document is now too short to still contain where we were. That's
			// the browser clamping to a tiny max as the list unmounts, not a user scroll, and
			// recording it would overwrite the real deep position with ~one row.
			if (prev - y > 3000) {
				const maxScroll = Math.max(
					0,
					document.documentElement.scrollHeight - window.innerHeight,
				);
				if (maxScroll < prev - 1000) return;
			}
			scrollYRef.current = y;
			if (ticking) return;
			ticking = true;
			requestAnimationFrame(() => {
				ticking = false;
				const snap = listScrollCache.get(cacheKey);
				if (snap) snap.scrollY = scrollYRef.current;
			});
		};
		window.addEventListener("scroll", handleScroll, { passive: true });
		return () => window.removeEventListener("scroll", handleScroll);
	}, [cacheKey]);

	// Stop the browser racing its own scroll restoration against our async content. Set
	// sticky (never restored to "auto"): the back-navigation we're guarding against happens
	// while this list is UNMOUNTED, so a value tied to the component's lifetime would already
	// be back to "auto" during the exact window that matters. Safe app-wide because scroll on
	// navigation is owned explicitly by ScrollToTop, not native restoration.
	useEffect(() => {
		if (!cacheKey) return undefined;
		window.history.scrollRestoration = "manual";
		return undefined;
	}, [cacheKey]);

	// Call from an effect BODY whenever the list state changes. `offset` is optional — a
	// listing without mutation compensation (no in-card actions) has no such concept.
	const persist = useCallback(
		({ items: nextItems, page, reachedEnd, offset = 0 }) => {
			if (!cacheKey) return;
			const prev = listScrollCache.get(cacheKey);
			const scrollY =
				restoreTargetRef.current != null
					? restoreTargetRef.current
					: prev
						? prev.scrollY
						: scrollYRef.current;
			listScrollCache.set(cacheKey, {
				items: nextItems,
				page,
				offset,
				reachedEnd,
				scrollY,
			});
		},
		[cacheKey],
	);

	// Call when the listing resets itself (a filter/search change), to drop an in-flight
	// restore so it can't be applied to the new, unrelated list.
	const cancelRestore = useCallback(() => {
		restoreTargetRef.current = null;
		pendingRestoreScrollYRef.current = null;
	}, []);

	return { initial, persist, cancelRestore };
}
