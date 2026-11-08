# AGENTS.md: hướng dẫn cho AI agent

Web luyện ngữ pháp tiếng Anh chạy local, một người dùng, không server, không database.
**Đọc `DESIGN.md` trước khi làm bất kỳ việc gì.**

## Lệnh

| Lệnh | Tác dụng |
|---|---|
| `npm install` | Cài đặt (cần Node.js ≥ 22.18, khuyên dùng Node 24 LTS) |
| `npm run dev` | Chạy dev server tại http://localhost:5173 và mở trình duyệt |
| `npm run build` | Kiểm tra kiểu (svelte-check) và build ra `dist/` |
| `npm run preview` | Chạy thử bản build |
| `npm run validate` | Kiểm tra dữ liệu trong `content/` (thoát mã 1 nếu có lỗi) |
| `npm run stats` | Cập nhật `question-stats.json`: số câu theo chủ đề / mức độ / dạng, kèm lộ trình chủ đề chưa tạo |
| `npm test` | Chạy unit test logic (`tests/*.test.ts`, dùng `node:test`) |

`validate` và `test` chạy file `.ts` trực tiếp bằng Node (type stripping), không cần thêm công cụ.
Vì vậy code trong `src/lib/*.ts` chỉ được dùng cú pháp TypeScript "xóa được" (không `enum`, không `namespace`,
không parameter properties) và import kèm đuôi `.ts`.

## Cấu trúc

```
question-stats.json       thống kê + lộ trình ngữ pháp đầy đủ (created / planned), sinh bởi npm run stats
content/                  NỘI DUNG HỌC (không đặt nội dung học trong code giao diện)
  topics.json             danh mục chủ đề: id, name, group, order, prerequisites
  prompts/generate-questions.md   prompt chuẩn để sinh câu hỏi
  topics/<id>/topic.md            lý thuyết
  topics/<id>/questions.json      bộ câu hỏi
  topics/<id>/prompt.md           (tùy chọn) ghi chú riêng của chủ đề
scripts/validate.ts       kiểm tra schema, trùng id, trùng nội dung, đáp án hợp lệ
src/
  main.ts, App.svelte     khởi động, header, điều hướng theo route
  routes/                 Catalog, TopicPage, Quiz, Result, Mistakes, Exam, Stats, DataPage
  components/             QuestionCard, ExplanationBlock, QuestionReview, ProgressBar
  lib/
    types.ts              kiểu dữ liệu, danh sách level/type hợp lệ (dùng chung với validate)
    content-loader.ts     đọc content/ qua import.meta.glob (đóng gói lúc build → chạy offline)
    storage.ts            localStorage, chuẩn hóa dữ liệu, xuất/nhập JSON
    user.svelte.ts        trạng thái người dùng (runes), ghi nhận đáp án, sổ lỗi sai
    session.svelte.ts     phiên làm bài hiện tại, kết quả gần nhất
    router.svelte.ts      router hash (#/topic/<id>, #/quiz, #/result, #/mistakes, #/exam, #/stats, #/data)
    scoring.ts            chấm điểm, thống kê chủ đề, lịch sử theo ngày
    recommend.ts          gợi ý chủ đề học tiếp
    quiz-builder.ts       chọn/xáo câu hỏi, trộn đề thi thử
tests/                    unit test cho logic thuần
```

Stack: Svelte 5 (runes) + Vite + TypeScript, `marked` để render Markdown. CSS viết tay trong
`src/styles/global.css` (biến màu cho chế độ sáng/tối) và trong từng component.

Dữ liệu người dùng lưu ở `localStorage` khóa `gp:data:v1` (xem `UserData` trong `types.ts`).
Nếu đổi cấu trúc, tăng `version` và viết phần chuyển đổi trong `storage.ts > normalize`.

## Quy ước

- Không đưa nội dung học vào code giao diện. Mọi câu hỏi và lý thuyết nằm trong `content/`.
- Khi thêm câu hỏi, **luôn** làm theo `content/prompts/generate-questions.md`.
- Sau mỗi thay đổi dữ liệu: chạy `npm run stats` rồi `npm run validate`.
- Chủ đề mới lấy id/name/group/order/prerequisites từ mục `planned` trong `question-stats.json`.
- Sau mỗi thay đổi code: chạy `npm run build` (và `npm test` nếu đụng `src/lib`).
- Không xóa hoặc sửa câu hỏi hiện có trừ khi được yêu cầu rõ ràng.
- Giữ `id` câu hỏi ổn định, không đánh lại số (tiến độ và sổ lỗi sai của người dùng tham chiếu theo `id`).
- Thêm chủ đề mới: tạo thư mục `content/topics/<id>/` và thêm một mục vào `topics.json`. Không cần sửa code.
- Commit theo từng nhóm thay đổi có ý nghĩa (ví dụ: "thêm 10 câu present perfect trung cấp").
- Giao diện và giải thích bằng tiếng Việt; ví dụ tiếng Anh giữ nguyên.
