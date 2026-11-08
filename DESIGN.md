# Thiết kế web luyện ngữ pháp tiếng Anh (chạy local)

Tài liệu này mô tả yêu cầu và kiến trúc để AI agent xây dựng web. Agent cần đọc toàn bộ file này trước khi viết code.

---

## 1. Mục tiêu

Web cá nhân, chạy trên máy local, dùng để luyện ngữ pháp tiếng Anh:

- Người dùng chọn một chủ đề ngữ pháp, vào làm các câu trắc nghiệm.
- Chọn đáp án là có kết quả đúng/sai ngay lập tức, kèm giải thích chi tiết.
- Bộ câu hỏi được lưu dạng file, và có thể mở rộng bằng cách nhờ AI agent sinh thêm câu hỏi theo prompt có sẵn.

Không có tài khoản, không có server từ xa, không có database. Chỉ dùng một người.

---

## 2. Yêu cầu chức năng

### 2.1 Danh mục chủ đề
- Hiển thị danh sách chủ đề, nhóm theo nhóm lớn (Thì, Động từ, Danh từ/Mạo từ/Đại từ, Tính từ/Trạng từ, Câu và cấu trúc, Từ loại khác).
- Mỗi chủ đề hiển thị: tên, số câu hiện có, tỷ lệ đúng của người dùng (nếu đã làm), trạng thái (chưa làm / đang làm / đã đạt).
- Có ô tìm kiếm chủ đề theo tên.

### 2.2 Trang chủ đề
- Phần lý thuyết (render từ `topic.md`): công thức, cách dùng, dấu hiệu nhận biết, lỗi thường gặp.
- Nút "Làm bài" với các tùy chọn:
  - Mức độ: Cơ bản / Trung cấp / Nâng cao / Tất cả.
  - Số lượng câu: 10 / 20 / Tất cả.
  - Thứ tự: ngẫu nhiên hoặc theo thứ tự file.
  - Chỉ làm các câu đã sai trước đó (nếu có).

### 2.3 Làm bài trắc nghiệm
- Hiển thị một câu tại một thời điểm, có số thứ tự và thanh tiến độ.
- Người dùng chọn một đáp án, sau đó bấm "Kiểm tra".
- Ngay sau khi kiểm tra:
  - Đáp án đúng được tô xanh, đáp án chọn sai (nếu có) được tô đỏ.
  - Hiển thị khối giải thích đầy đủ (xem mục 2.4).
  - Nút "Câu tiếp theo".
- Không cho đổi đáp án sau khi đã kiểm tra.
- Có phím tắt: A/B/C/D để chọn, Enter để kiểm tra và chuyển câu.
- Có chế độ "Chế độ thi": không hiển thị đúng/sai cho đến khi nộp toàn bộ bài, sau đó mới xem kết quả và giải thích.

### 2.4 Khối giải thích (bắt buộc đầy đủ cho mỗi câu)
Mỗi câu hiển thị các mục, theo thứ tự:
1. **Đáp án đúng** và lý do ngắn gọn.
2. **Vì sao các đáp án còn lại sai**: từng lựa chọn sai, nêu lỗi cụ thể.
3. **Quy tắc ngữ pháp**: tóm tắt công thức hoặc quy tắc liên quan.
4. **Ví dụ**: 2 đến 3 câu minh họa.
5. **Lỗi thường gặp** của người Việt với cấu trúc này (nếu có).

Các mục có thể thu gọn/mở rộng, nhưng phải có sẵn, không ẩn hoàn toàn.

### 2.5 Trang kết quả
- Điểm số, tỷ lệ đúng, thời gian làm bài.
- Danh sách câu sai, bấm vào để xem lại giải thích.
- Nút "Làm lại các câu sai" và "Làm lại toàn bộ".
- Cập nhật tiến độ chủ đề trên trang danh mục.

### 2.6 Sổ lỗi sai
- Tự động lưu các câu đã trả lời sai.
- Trang riêng liệt kê toàn bộ câu sai, lọc theo chủ đề.
- Có thể đánh dấu "đã thuộc" để loại khỏi sổ.

### 2.7 Thi thử tổng hợp
- Chọn số câu (30 hoặc 50), trộn ngẫu nhiên nhiều chủ đề.
- Có đồng hồ đếm ngược, mặc định 30 phút cho 30 câu.
- Hết giờ thì tự nộp bài.

### 2.8 Thống kê
- Bảng hoặc biểu đồ tỷ lệ đúng theo từng chủ đề.
- Danh sách chủ đề yếu nhất (tỷ lệ đúng thấp nhất, làm nhiều lần).
- Lịch sử làm bài theo ngày.

### 2.9 Gợi ý học tiếp
- Cuối mỗi bài, hiển thị 1 đến 3 chủ đề nên học tiếp, dựa trên kết quả và chủ đề tiên quyết trong `topics.json`.

---

## 3. Yêu cầu phi chức năng

- **Chạy local:** một lệnh khởi động (ví dụ `npm run dev`), mở trình duyệt tại `localhost`.
- **Nhanh:** trang đầu tải dưới 1 giây trên máy bình thường, chuyển câu gần như tức thì.
- **Nhẹ:** không dùng framework nặng. Không thêm thư viện nếu không cần thiết.
- **Không cần mạng:** sau khi cài đặt, web chạy hoàn toàn offline.
- **Giao diện:** rõ ràng, dễ đọc, có chế độ sáng và tối. Tiếng Việt cho giao diện và giải thích, ví dụ tiếng Anh giữ nguyên.
- **Lưu tiến độ:** dữ liệu người dùng (tiến độ, sổ lỗi sai, lịch sử) lưu trong `localStorage`, có chức năng xuất/nhập ra file JSON để sao lưu.

---

## 4. Stack công nghệ

**Đề xuất chính: Svelte + Vite**
- Svelte biên dịch lúc build, runtime nhỏ, nhanh.
- Vite dev server khởi động nhanh, hot reload tức thì.
- Dùng JavaScript thuần hoặc TypeScript (ưu tiên TypeScript nếu agent có thể kiểm tra kiểu để giảm lỗi dữ liệu).

**Routing:** dùng router nhẹ của Svelte (hoặc SvelteKit ở chế độ tĩnh nếu cần). Không cần server rendering.

**Thư viện tối thiểu:**
- Render Markdown: một thư viện nhẹ (ví dụ `marked`).
- Không dùng UI framework đồ sộ; CSS viết tay hoặc dùng utility nhỏ.

**Không dùng:** Next.js, Angular, database, ORM, Docker.

**Nếu cần server nhỏ** (chỉ để ghi file sao lưu): Node với Fastify hoặc Hono, tối đa vài endpoint. Phần này là tùy chọn, mặc định dùng `localStorage`.

**Chạy:** Node.js LTS. Các lệnh cần có: `npm install`, `npm run dev`, `npm run build`, `npm run validate`.

---

## 5. Cấu trúc thư mục dự án

```
grammar-practice-web/
├── AGENTS.md                      # hướng dẫn cho AI agent: cấu trúc, lệnh, quy ước
├── DESIGN.md                      # file này
├── package.json
├── index.html
├── src/
│   ├── main.ts
│   ├── App.svelte
│   ├── routes/                    # trang: danh mục, chủ đề, làm bài, kết quả, sổ lỗi, thống kê, thi thử
│   ├── components/                # thẻ câu hỏi, khối giải thích, thanh tiến độ, bộ đếm giờ...
│   ├── lib/
│   │   ├── content-loader.ts      # đọc topics.json và questions.json
│   │   ├── storage.ts             # đọc/ghi localStorage, xuất/nhập JSON
│   │   ├── scoring.ts             # chấm điểm, tính thống kê
│   │   └── recommend.ts          # gợi ý chủ đề học tiếp
│   └── styles/
├── content/                       # NỘI DUNG HỌC, do agent sinh và bảo trì
│   ├── topics.json                # danh mục chủ đề
│   ├── prompts/
│   │   └── generate-questions.md  # prompt chuẩn để sinh câu hỏi
│   └── topics/
│       └── <topic-id>/
│           ├── topic.md           # lý thuyết
│           ├── questions.json     # bộ câu hỏi
│           └── prompt.md          # (tùy chọn) hướng dẫn riêng cho chủ đề
├── scripts/
│   └── validate.ts                # kiểm tra schema, trùng id, trùng nội dung, đáp án hợp lệ
└── tests/
```

**Quy tắc:**
- Code giao diện không chứa nội dung học. Mọi câu hỏi và lý thuyết nằm trong `content/`.
- Thêm chủ đề mới: tạo thư mục mới trong `content/topics/`, thêm một mục vào `topics.json`.

---

## 6. Thiết kế dữ liệu

### 6.1 `content/topics.json`
Danh sách mỗi chủ đề gồm:
- `id`: định danh duy nhất, dạng chữ thường nối bằng dấu gạch ngang, trùng tên thư mục.
- `name`: tên hiển thị (tiếng Việt kèm tiếng Anh, ví dụ "Hiện tại hoàn thành (Present Perfect)").
- `group`: nhóm lớn.
- `order`: thứ tự hiển thị.
- `prerequisites`: danh sách `id` chủ đề tiên quyết.

### 6.2 `content/topics/<id>/topic.md`
Markdown gồm các mục cố định:
- Công thức (khẳng định, phủ định, nghi vấn).
- Cách dùng (liệt kê, mỗi cách có ví dụ).
- Dấu hiệu nhận biết.
- Lỗi thường gặp.
- Phân biệt với các chủ đề dễ nhầm.

### 6.3 `content/topics/<id>/questions.json`
Một mảng các câu hỏi. Mỗi câu có cấu trúc:

```
{
  "id": "pp-001",                       // duy nhất trong toàn bộ dự án
  "topic": "present-perfect",           // trùng id chủ đề
  "level": "basic | intermediate | advanced",
  "type": "choose | fix-error | fill-form | rewrite | arrange",
  "question": "She ___ in London since 2018.",
  "options": ["lives", "has lived", "lived", "is living"],   // đúng 4 lựa chọn
  "answer": 1,                          // chỉ số đáp án đúng, bắt đầu từ 0
  "explanation": {
    "correct": "Lý do đáp án đúng...",
    "wrong": {
      "0": "Vì sao lựa chọn 0 sai...",
      "2": "...",
      "3": "..."
    },
    "rule": "Tóm tắt quy tắc...",
    "examples": ["...", "..."],      // 2 đến 3 câu
    "common_mistake": "Lỗi thường gặp của người Việt..."   // có thể bỏ trống
  },
  "tags": ["since-for", "present-perfect"],
  "source": "ai | human",
  "created_at": "2026-11-08"
}
```

**Lưu ý:**
- `options` luôn có đúng 4 phần tử.
- `answer` là chỉ số đúng trong mảng `options`.
- `wrong` có đủ 3 khóa tương ứng 3 đáp án sai.
- Với dạng `fix-error`, `options` là các phần của câu cần sửa, không phải câu hoàn chỉnh. Agent phải ghi rõ trong `question` cách hiển thị.

### 6.4 `content/topics/<id>/prompt.md` (tùy chọn)
Ghi chú riêng cho chủ đề: phạm vi (nên và không nên có gì), lỗi người Việt hay gặp, mức độ phù hợp, các dạng câu nên ưu tiên.

### 6.5 `content/prompts/generate-questions.md`
Prompt chuẩn để agent sinh câu hỏi. Phải quy định:
- Mục tiêu: sinh N câu cho chủ đề X, mức độ Y, dạng câu hỏi Z.
- Quy trình bắt buộc:
  1. Đọc `topic.md` của chủ đề.
  2. Đọc `questions.json` hiện có để tránh trùng.
  3. Đọc `prompt.md` của chủ đề nếu có.
  4. Sinh câu hỏi đúng schema, id tiếp theo theo số thứ tự chưa dùng.
  5. Ghi thêm vào cuối `questions.json`, không sửa hoặc xóa câu cũ trừ khi được yêu cầu.
  6. Chạy `npm run validate`, sửa đến khi không còn lỗi.
  7. Báo cáo: số câu đã thêm, phân bố mức độ, và các câu nào cần người dùng kiểm tra lại.
- Quy tắc chất lượng câu hỏi:
  - Đúng 4 lựa chọn, chỉ 1 đáp án đúng.
  - Đáp án nhiễu là lỗi người học thường mắc, không phải đáp án vô nghĩa.
  - Không dùng "tất cả đều đúng", "không đáp án nào đúng".
  - Vị trí đáp án đúng phân bố đều A/B/C/D.
  - Ngữ cảnh đa dạng, không lặp lại một mẫu câu.
  - Câu hỏi phải có đúng một đáp án theo ngữ pháp chuẩn, tránh các trường hợp có thể chấp nhận nhiều đáp án.
- Quy tắc giải thích: tiếng Việt, đủ 5 mục như mục 2.4, ví dụ tiếng Anh đúng ngữ pháp.
- Mô tả từng mức độ: cơ bản (một cấu trúc, ngữ cảnh rõ), trung cấp (phân biệt hai cấu trúc dễ nhầm), nâng cao (ngữ cảnh phức tạp, nhiều bẫy).

---

## 7. Script kiểm tra dữ liệu (`npm run validate`)

Kiểm tra và báo lỗi:
- Mỗi `id` chủ đề trong `topics.json` có thư mục tương ứng, có đủ `topic.md` và `questions.json`.
- Mỗi câu hỏi đúng schema: đủ trường, `options` có 4 phần tử, `answer` nằm trong 0–3, `wrong` có đủ 3 khóa.
- `id` câu hỏi không trùng lặp trong toàn bộ dự án.
- `topic` của câu hỏi khớp với thư mục chứa nó.
- Không có hai câu trùng nội dung câu hỏi (so sánh chuỗi đã chuẩn hóa).
- `level` và `type` nằm trong danh sách cho phép.
- Không có chủ đề tiên quyết trỏ đến id không tồn tại.

Script trả về mã lỗi khác 0 nếu có lỗi, để agent và người dùng đều thấy rõ.

---

## 8. Quy ước cho AI agent (nội dung cho `AGENTS.md`)

- Đọc `DESIGN.md` trước khi làm bất kỳ việc gì.
- Không đưa nội dung học vào code giao diện.
- Khi thêm câu hỏi, luôn làm theo `content/prompts/generate-questions.md`.
- Sau mỗi thay đổi dữ liệu, chạy `npm run validate`.
- Sau mỗi thay đổi code, chạy `npm run build` để kiểm tra không lỗi.
- Không xóa hoặc sửa câu hỏi hiện có trừ khi được yêu cầu rõ ràng.
- Giữ `id` câu hỏi ổn định, không đánh lại số.
- Commit theo từng nhóm thay đổi có ý nghĩa (ví dụ: "thêm 10 câu present perfect trung cấp").

---

## 9. Thứ tự xây dựng đề xuất

1. Khởi tạo dự án Svelte + Vite, cấu trúc thư mục như mục 5.
2. Viết `content/topics.json` với 2 chủ đề mẫu và `questions.json` với 5 câu mỗi chủ đề.
3. Viết script `validate` và chạy thử.
4. Làm trang danh mục và trang chủ đề (đọc từ `content/`).
5. Làm trang làm bài: chọn đáp án, kiểm tra, hiển thị khối giải thích đầy đủ.
6. Lưu tiến độ và sổ lỗi sai vào `localStorage`.
7. Trang kết quả và làm lại câu sai.
8. Thống kê và gợi ý học tiếp.
9. Thi thử tổng hợp có đồng hồ.
10. Chế độ thi, phím tắt, chế độ sáng/tối.
11. Xuất/nhập dữ liệu JSON để sao lưu.
12. Viết `generate-questions.md` hoàn chỉnh và thử sinh thêm câu để kiểm chứng quy trình.

---

## 10. Tiêu chí hoàn thành

- Chạy được bằng một lệnh, mở được tại localhost, không cần mạng.
- Thêm được một chủ đề mới chỉ bằng cách tạo thư mục và sửa `topics.json`.
- Nhờ agent sinh thêm câu hỏi theo prompt, `npm run validate` vẫn pass.
- Mỗi câu hỏi hiển thị đầy đủ giải thích sau khi chọn đáp án.
- Tiến độ và sổ lỗi sai không mất khi tải lại trang.
