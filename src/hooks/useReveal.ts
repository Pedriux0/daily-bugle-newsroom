import { useEffect, RefObject } from 'react';

/**
 * Staggered entrances: every [data-reveal] inside the container rises in once
 * as it scrolls into view. Content is only hidden after this runs, so nothing
 * stays invisible if the script fails. Set --i on an element to stagger it.
 */
const useReveal = (ref: RefObject<HTMLElement | null>) => {
  useEffect(() => {
    const root = ref.current;
    if (!root || !('IntersectionObserver' in window)) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-in');
            observer.unobserve(entry.target);
          }
        });
      },
      { rootMargin: '0px 0px 0px 0px' }
    );

    // Pick up sections that render later (headlines, reports, stories)
    const scan = () =>
      root.querySelectorAll('[data-reveal]:not(.is-in)').forEach((el) => observer.observe(el));
    scan();
    root.classList.add('motion-armed');
    const mutations = new MutationObserver(scan);
    mutations.observe(root, { childList: true, subtree: true });

    return () => {
      observer.disconnect();
      mutations.disconnect();
      root.classList.remove('motion-armed');
    };
  }, [ref]);
};

export default useReveal;
