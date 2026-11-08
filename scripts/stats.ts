// Cập nhật question-stats.json ở thư mục gốc. Chạy: npm run stats
import { writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildStats, STATS_FILE } from './stats-lib.ts';

const ROOT = fileURLToPath(new URL('..', import.meta.url));
const stats = buildStats(ROOT);
writeFileSync(join(ROOT, STATS_FILE), JSON.stringify(stats, null, 2) + '\n', 'utf8');

const s = stats.summary;
console.log(
  `Đã cập nhật ${STATS_FILE}: ${s.topics_created}/${s.topics_total} chủ đề đã tạo, ${s.questions} câu hỏi ` +
    `(basic=${s.by_level.basic}, intermediate=${s.by_level.intermediate}, advanced=${s.by_level.advanced}).`,
);
