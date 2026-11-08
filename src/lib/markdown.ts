// Render Markdown cho lý thuyết và câu hỏi. Nội dung đến từ thư mục content/ của chính dự án.
import { Marked } from 'marked';

const md = new Marked({ gfm: true, breaks: false });

export function renderMarkdown(src: string): string {
  return md.parse(src, { async: false });
}

export function renderInline(src: string): string {
  return md.parseInline(src, { async: false });
}

/** Bỏ dấu tiếng Việt để tìm kiếm không phân biệt dấu. */
export function foldText(s: string): string {
  return s
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'D')
    .toLowerCase()
    .trim();
}
