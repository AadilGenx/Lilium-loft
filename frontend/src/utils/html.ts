/**
 * WooCommerce descriptions are HTML. This returns their readable text (tags removed, entities decoded)
 * without ever inserting the HTML into the page.
 */
export function htmlToText(html: string | null | undefined): string {
  if (!html) return '';
  const doc = new DOMParser().parseFromString(html, 'text/html');
  // Keep paragraph and line breaks readable.
  doc.querySelectorAll('br').forEach((br) => br.replaceWith('\n'));
  doc.querySelectorAll('p, li, div, h1, h2, h3, h4, h5, h6').forEach((el) => el.append('\n'));
  return (doc.body.textContent ?? '').replace(/\n{3,}/g, '\n\n').trim();
}
