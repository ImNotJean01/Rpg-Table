import { marked } from 'marked';
import DOMPurify from 'dompurify';

marked.setOptions({
  breaks: true,
  gfm: true,
});

export function renderMarkdown(texto) {
  if (!texto) return '';
  const html = marked.parse(String(texto));
  return DOMPurify.sanitize(html);
}
