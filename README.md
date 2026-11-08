# Luyện ngữ pháp tiếng Anh

Web cá nhân chạy local để luyện ngữ pháp tiếng Anh bằng câu trắc nghiệm có giải thích chi tiết.

```bash
npm install      # lần đầu (cần Node.js 22.18 trở lên, khuyên dùng Node 24)
npm run dev      # mở http://localhost:5173
```

Các lệnh khác: `npm run build`, `npm run preview`, `npm run validate` (kiểm tra dữ liệu câu hỏi), `npm test`.

- Thiết kế: [DESIGN.md](DESIGN.md). Hướng dẫn cho AI agent: [AGENTS.md](AGENTS.md).
- Thêm câu hỏi: nhờ agent đọc [content/prompts/generate-questions.md](content/prompts/generate-questions.md).
- Tiến độ lưu trong trình duyệt (localStorage). Vào trang **Sao lưu** để xuất/nhập file JSON.

## Nhờ AI agent sinh thêm câu hỏi

Copy đoạn dưới, sửa các giá trị trong `[...]` rồi paste vào ô chat của agent:

```text
Đọc content/prompts/generate-questions.md và làm đúng quy trình trong đó.
Sinh [10] câu hỏi cho chủ đề [present-perfect], mức độ [mixed], dạng câu [mixed].
Ghi thêm vào cuối content/topics/[present-perfect]/questions.json, không sửa hoặc xóa câu cũ.
Chạy npm run stats, rồi npm run validate và sửa đến khi không còn lỗi.
Cuối cùng báo cáo: số câu đã thêm, dải id, phân bố mức độ / dạng câu / vị trí đáp án A-B-C-D,
và liệt kê các câu tôi nên kiểm tra lại.
```

Giá trị có thể dùng:

- **Chủ đề**: `id` trong [content/topics.json](content/topics.json), ví dụ `present-simple`, `past-simple`, `present-perfect`.
- **Mức độ**: `basic` (cơ bản), `intermediate` (trung cấp), `advanced` (nâng cao), hoặc `mixed` (trộn).
- **Dạng câu**: `choose`, `fix-error`, `fill-form`, `rewrite`, `arrange`, hoặc `mixed`.

Muốn thêm **chủ đề mới** (xem danh sách chủ đề `planned` trong [question-stats.json](question-stats.json)), dùng đoạn này:

```text
Đọc content/prompts/generate-questions.md, mục 7, và tạo chủ đề [present-perfect-continuous]
theo đúng thông tin của chủ đề đó trong question-stats.json.
Viết đầy đủ topic.md, prompt.md, thêm mục vào content/topics.json,
rồi sinh [10] câu hỏi, tập trung mức [intermediate] và [advanced], theo đúng quy trình.
Chạy npm run stats, rồi npm run validate và sửa đến khi không còn lỗi, sau đó báo cáo như quy định.
```

Để agent **tự chọn** chủ đề cần bổ sung dựa trên thống kê:

```text
Đọc question-stats.json và content/prompts/generate-questions.md.
Chọn [3] chủ đề cần bổ sung nhất (ít câu, thiếu câu trung cấp/nâng cao, hoặc chủ đề planned đã đủ tiên quyết),
giải thích ngắn vì sao chọn, rồi sinh mỗi chủ đề [10] câu theo đúng quy trình.
Chạy npm run stats, rồi npm run validate và sửa đến khi không còn lỗi, sau đó báo cáo như quy định.
```

### Thống kê câu hỏi

`npm run stats` cập nhật [question-stats.json](question-stats.json): với mỗi chủ đề có số câu theo mức độ
(`by_level`) và theo dạng câu (`by_type`), cùng tổng hợp ở `summary`. File này cũng là lộ trình đầy đủ
các chủ đề ngữ pháp: `created` là đã có, `planned` là chưa làm. `npm run validate` sẽ cảnh báo nếu file chưa cập nhật.
