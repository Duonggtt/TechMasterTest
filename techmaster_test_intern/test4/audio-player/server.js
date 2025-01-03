import express from 'express';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import cors from 'cors';

const app = express();
app.use(cors());

// Lấy đường dẫn hiện tại
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Định nghĩa đường dẫn tới thư mục chứa files
const INPUT_DIR = join(__dirname, '../../../input');
const OUTPUT_DIR = join(__dirname, '../../../output');

// Tạo route để phục vụ files
app.get('/api/audio', (req, res) => {
  res.sendFile(join(INPUT_DIR, 'audio.opus'));
});

app.get('/api/subtitles', (req, res) => {
  res.sendFile(join(OUTPUT_DIR, 'output_AB.txt'));
});

app.get('/api/timestamps', (req, res) => {
  res.sendFile(join(OUTPUT_DIR, 'timestamp.txt'));
});

const PORT = 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});