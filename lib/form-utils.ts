/**
 * Scroll to the topmost (highest in the DOM) field that matches one of
 * the given error keys. Used by step validate() to take the user to the
 * first invalid field on the page when "Next" is pressed.
 */
export function scrollToTopmost(errorKeys: string[]): void {
  if (typeof document === "undefined") return;
  const elements: HTMLElement[] = [];
  for (const key of errorKeys) {
    const el = document.querySelector<HTMLElement>(`[name="${key}"]`);
    if (el) elements.push(el);
  }
  if (!elements.length) return;
  const topmost = elements.reduce((a, b) =>
    a.getBoundingClientRect().top < b.getBoundingClientRect().top ? a : b
  );
  topmost.scrollIntoView({ behavior: "smooth", block: "center" });
  topmost.focus();
}
