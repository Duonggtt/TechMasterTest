const fs = require('fs');
const xml2js = require('xml2js');

function extractTextFromSsml() {
    // Đọc file SSML
    const xmlData = fs.readFileSync('../../input/ssml.xml', 'utf8');
    
    // Parse XML
    const parser = new xml2js.Parser();
    parser.parseString(xmlData, (err, result) => {
        if (err) {
            console.error('Lỗi khi parse XML:', err);
            return;
        }

        // Kiểm tra và trích xuất text từ các thẻ voice
        let texts = [];
        if (result.speak && result.speak.voice) {
            texts = result.speak.voice.map(voice => {
                const text = voice._ || '';
                // Xác định người nói dựa vào thuộc tính name
                const speaker = voice.$.name === 'en-US-AndrewMultilingualNeural' ? 'A' : 'B';
                return text ? `${speaker}: ${text}` : '';
            }).filter(text => text); // Lọc bỏ các text rỗng
        }
        
        // Ghi vào file output
        fs.writeFileSync('../../output/output_AB.txt', texts.join('\n'), 'utf8');
        console.log('Đã trích xuất text thành công!');
    });
}

extractTextFromSsml();