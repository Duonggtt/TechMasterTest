const fs = require('fs');

function extractTimestamp() {
    try {
        // Đọc file timestamp.json
        const jsonData = fs.readFileSync('../../input/timestamp.json', 'utf8');
        const data = JSON.parse(jsonData);

        // Trích xuất mảng timestamp
        const timestamps = data.timestamp;
        
        // Format mỗi timestamp thành một dòng, các số cách nhau bởi dấu phẩy
        const formattedTimestamps = timestamps.map(timestamp => timestamp.join(','));

        // Ghi vào file output
        fs.writeFileSync('../../output/timestamp.txt', formattedTimestamps.join('\n'), 'utf8');
        console.log('Đã trích xuất timestamp thành công!');
    } catch (error) {
        console.error('Lỗi:', error);
    }
}

extractTimestamp();