# Prompt chuẩn: sinh câu hỏi ngữ pháp

Dùng file này mỗi khi cần thêm câu hỏi. Người dùng sẽ gọi theo mẫu:

> Đọc `content/prompts/generate-questions.md` và sinh **N** câu cho chủ đề **X**, mức độ **Y**, dạng **Z**.

- **N**: số câu (mặc định 10).
- **X**: `id` chủ đề trong `content/topics.json` (ví dụ `present-perfect`).
- **Y**: `basic` | `intermediate` | `advanced` | `mixed` (mặc định `mixed`, phân bố theo `prompt.md` của chủ đề nếu có, nếu không thì 40/40/20).
- **Z**: `choose` | `fix-error` | `fill-form` | `rewrite` | `arrange` | `mixed` (mặc định `mixed`).

Nếu chủ đề **X** chưa tồn tại, hỏi người dùng có muốn tạo chủ đề mới không (xem mục 7) trước khi sinh câu.

Nếu người dùng không chỉ định chủ đề (ví dụ "sinh thêm câu hỏi"), đọc `question-stats.json` ở thư mục gốc để chọn:
ưu tiên chủ đề `created` có ít câu nhất hoặc thiếu mức `intermediate`/`advanced`, rồi đến chủ đề `planned`
có đủ chủ đề tiên quyết đã tạo.

---

## 1. Quy trình bắt buộc

1. Đọc `content/topics/X/topic.md` để nắm phạm vi lý thuyết. Câu hỏi không được vượt ra ngoài phạm vi này (trừ đáp án nhiễu).
2. Đọc toàn bộ `content/topics/X/questions.json` hiện có:
   - Ghi nhận các mẫu câu, ngữ cảnh, từ vựng đã dùng để **không lặp lại**.
   - Tìm số thứ tự lớn nhất của tiền tố `id` (ví dụ `pp-006`) để đánh số tiếp (`pp-007`, `pp-008`…). Không dùng lại số đã có, kể cả khi có khoảng trống.
3. Đọc `content/topics/X/prompt.md` nếu có, và tuân theo phạm vi, phân bố mức độ, dạng câu ưu tiên ghi trong đó.
4. Sinh câu hỏi đúng schema ở mục 2.
5. **Ghi thêm vào cuối** mảng trong `questions.json`. Không sửa, không xóa, không sắp xếp lại câu cũ trừ khi người dùng yêu cầu rõ ràng.
6. Chạy `npm run stats` để cập nhật `question-stats.json`, rồi chạy `npm run validate`. Nếu có lỗi, sửa các câu vừa thêm cho đến khi không còn lỗi.
7. Báo cáo cho người dùng:
   - Số câu đã thêm, dải `id` (ví dụ `pp-007` → `pp-016`).
   - Phân bố theo mức độ, theo dạng câu và vị trí đáp án đúng A/B/C/D.
   - Danh sách câu **cần người dùng kiểm tra lại**: câu mà bạn không chắc chắn chỉ có một đáp án đúng, câu có khác biệt Anh–Anh / Anh–Mỹ, câu dùng từ vựng hiếm.

## 2. Schema mỗi câu

```json
{
  "id": "pp-007",
  "topic": "present-perfect",
  "level": "intermediate",
  "type": "choose",
  "question": "She ___ in London since 2018.",
  "options": ["lives", "has lived", "lived", "is living"],
  "answer": 1,
  "explanation": {
    "correct": "Lý do đáp án đúng (1–3 câu).",
    "wrong": {
      "0": "Vì sao lựa chọn 0 sai, nêu lỗi cụ thể.",
      "2": "…",
      "3": "…"
    },
    "rule": "Tóm tắt công thức / quy tắc.",
    "examples": ["Câu ví dụ 1.", "Câu ví dụ 2.", "Câu ví dụ 3 (tùy chọn)."],
    "common_mistake": "Lỗi người Việt hay mắc với cấu trúc này (có thể để chuỗi rỗng)."
  },
  "tags": ["since-for"],
  "source": "ai",
  "created_at": "YYYY-MM-DD"
}
```

Ràng buộc (script `validate` sẽ kiểm tra):

- `id` duy nhất trong toàn dự án, gồm chữ thường, số và `-`. Giữ đúng tiền tố đang dùng trong chủ đề.
- `topic` trùng tên thư mục.
- `options` có **đúng 4** phần tử, không trùng nhau.
- `answer` là chỉ số 0–3 của đáp án đúng.
- `explanation.wrong` có **đúng 3 khóa** là chỉ số của 3 đáp án sai (dạng chuỗi `"0"`, `"1"`…).
- `examples` có 2–3 câu.
- `source` là `"ai"` khi bạn sinh; `created_at` là ngày hôm nay.

### Cách viết `question` theo từng dạng

Trường `question` hỗ trợ Markdown nội dòng và thẻ `<u>`.

| Dạng | Cách viết `question` | `options` |
|---|---|---|
| `choose` | Câu có chỗ trống `___`. | 4 từ/cụm điền vào chỗ trống. |
| `fill-form` | Câu có `___` và động từ/từ gốc trong ngoặc: `I have never ___ (eat) sushi.` | 4 dạng của từ gốc. |
| `fix-error` | Bắt đầu bằng `Tìm phần sai:`, gạch chân 4 phần bằng `<u>…</u>` kèm nhãn `(A)`–`(D)` theo thứ tự xuất hiện. | 4 phần được gạch chân, đúng thứ tự A–D. Chỉ một phần sai. |
| `rewrite` | Bắt đầu bằng `Chọn câu đồng nghĩa với:` + câu gốc in nghiêng. | 4 câu hoàn chỉnh, chỉ 1 câu đúng ngữ pháp và đúng nghĩa. |
| `arrange` | Bắt đầu bằng `Sắp xếp thành câu đúng:` + các mảnh ngăn cách bằng ` / `. | 4 câu hoàn chỉnh ghép từ các mảnh, chỉ 1 câu đúng. |

## 3. Quy tắc chất lượng câu hỏi

- Đúng 4 lựa chọn và **chỉ một** đáp án đúng theo ngữ pháp chuẩn. Nếu một người bản ngữ có học thức có thể chấp nhận hai đáp án, phải viết lại câu (thêm ngữ cảnh, trạng từ thời gian…) hoặc bỏ câu đó.
- Đáp án nhiễu phải là **lỗi người học thường mắc** (sai thì, sai dạng động từ, quên -s, nhầm since/for…), không phải đáp án vô nghĩa hay sai chính tả ngẫu nhiên.
- Không dùng "tất cả đều đúng", "không đáp án nào đúng", "all of the above", "none of the above".
- **Phân bố vị trí đáp án đúng đều A/B/C/D** trong mỗi đợt sinh (chênh lệch tối đa 1 câu giữa các vị trí với đợt 8 câu trở lên).
- Ngữ cảnh đa dạng: gia đình, trường học, công việc, du lịch, sức khỏe, công nghệ, thể thao… Không lặp lại một mẫu câu; tên riêng và địa danh đa dạng (có thể dùng tên và địa danh Việt Nam).
- Không trùng nội dung với câu đã có (script so sánh chuỗi đã chuẩn hóa: bỏ dấu câu, chữ hoa).
- Câu ngắn gọn, từ vựng phù hợp với mức độ. Tránh nội dung nhạy cảm.
- Tránh các điểm khác biệt Anh–Anh / Anh–Mỹ (ví dụ "Did you eat yet?"), trừ khi câu hỏi nói rõ biến thể.

## 4. Quy tắc giải thích

- Viết bằng **tiếng Việt**; ví dụ và trích dẫn tiếng Anh giữ nguyên. Có thể dùng `**đậm**` để nhấn mạnh.
- Đủ 5 mục:
  1. `correct`: đáp án đúng và lý do ngắn gọn, chỉ ra dấu hiệu trong câu (since, yesterday, every day…).
  2. `wrong`: với **từng** đáp án sai, nêu lỗi cụ thể (sai thì gì, sai dạng gì, vì sao không hợp ngữ cảnh). Không viết chung chung kiểu "sai ngữ pháp".
  3. `rule`: công thức hoặc quy tắc, 1–2 câu.
  4. `examples`: 2–3 câu tiếng Anh **đúng ngữ pháp**, minh họa đúng quy tắc, khác với câu hỏi.
  5. `common_mistake`: lỗi người Việt hay mắc (thường do ảnh hưởng tiếng Việt: không chia động từ, dịch sát từng chữ…). Để chuỗi rỗng nếu không có gì đáng nói.

## 5. Mô tả mức độ

- **basic (cơ bản)**: kiểm tra **một** cấu trúc, ngữ cảnh rõ ràng, có dấu hiệu nhận biết trực tiếp (every day, yesterday, since 2018). Từ vựng thông dụng.
- **intermediate (trung cấp)**: **phân biệt hai cấu trúc dễ nhầm** (hiện tại hoàn thành vs quá khứ đơn, since vs for, động từ trạng thái). Dấu hiệu nhận biết ít lộ hơn.
- **advanced (nâng cao)**: ngữ cảnh phức tạp, **nhiều bẫy**: câu nhiều mệnh đề, cấu trúc cố định (This is the first time…), mệnh đề thời gian, không có dấu hiệu rõ ràng mà phải suy từ nghĩa.

## 6. Tự kiểm tra trước khi ghi file

Với mỗi câu, tự hỏi:

- [ ] Thay lần lượt từng lựa chọn vào câu: có đúng **một** câu đúng ngữ pháp và tự nhiên không?
- [ ] Đáp án nhiễu có phản ánh lỗi thật của người học không?
- [ ] `answer` có trỏ đúng vị trí trong `options` không? `wrong` có đủ 3 khóa đúng chỉ số không?
- [ ] Ví dụ có đúng ngữ pháp và đúng quy tắc đang giải thích không?
- [ ] Câu có trùng ý với câu đã có không?

## 7. Thêm chủ đề mới (nếu được yêu cầu)

0. Tìm chủ đề trong `question-stats.json` (mục có `"status": "planned"`) và dùng đúng `id`, `name`, `group`, `order`, `prerequisites` ở đó. Nếu chủ đề chưa có trong lộ trình, thêm một mục mới vào mảng `topics` của file này trước.
1. Tạo thư mục `content/topics/<id>/` với `id` chữ thường nối bằng `-`.
2. Viết `topic.md` gồm các mục: **Công thức** (khẳng định, phủ định, nghi vấn), **Cách dùng** (mỗi cách có ví dụ), **Dấu hiệu nhận biết**, **Lỗi thường gặp**, **Phân biệt với các chủ đề dễ nhầm**.
3. Tạo `questions.json` (mảng câu hỏi, có thể bắt đầu bằng `[]`), chọn tiền tố `id` mới chưa dùng (ví dụ `pc-` cho present-continuous).
4. Thêm một mục vào `content/topics.json`: `id`, `name` (tiếng Việt kèm tiếng Anh trong ngoặc), `group` (một trong: Thì, Động từ, Danh từ/Mạo từ/Đại từ, Tính từ/Trạng từ, Câu và cấu trúc, Từ loại khác), `order`, `prerequisites`.
5. (Tùy chọn) Viết `prompt.md` ghi phạm vi, lỗi hay gặp, phân bố mức độ.
6. Chạy `npm run stats` (chủ đề chuyển sang `created`), rồi `npm run validate`.
