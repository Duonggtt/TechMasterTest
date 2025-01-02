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
                // Kiểm tra xem voice._ có tồn tại không
                return voice._ || '';
            }).filter(text => text); // Lọc bỏ các text rỗng
        }
        
        // Ghi vào file output
        fs.writeFileSync('../../output/output.txt', texts.join('\n'), 'utf8');
        console.log('Đã trích xuất text thành công!');
    });
}

extractTextFromSsml();