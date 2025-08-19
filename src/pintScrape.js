const axios = require('axios');

const pinDown = "https://pinterestdownloader.io/frontendService/DownloaderService?url=";

async function downloadPinterestVideo(url) {
    const finalUrl = `${pinDown}${encodeURIComponent(url)}`;
    const headers = {
        'Accept': '*/*',
        'Accept-Encoding': 'gzip, deflate, br, zstd',
        'Accept-Language': 'en-US,en;q=0.9,hi-IN;q=0.8,hi;q=0.7,ur-PK;q=0.6,ur;q=0.5',
        'Cookie': 'ci_session=j0in7n231c2orisf0qpeu8dhvpsphacp',
        'Priority': 'u=1, i',
        'Referer': 'https://pinterestdownloader.io/',
        'Sec-CH-UA': '"Not;A=Brand";v="99", "Google Chrome";v="139", "Chromium";v="139"',
        'Sec-CH-UA-Mobile': '?0',
        'Sec-CH-UA-Platform': '"Windows"',
        'Sec-Fetch-Dest': 'empty',
        'Sec-Fetch-Mode': 'cors',
        'Sec-Fetch-Site': 'same-origin',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36',
        'X-Requested-With': 'XMLHttpRequest'
    };

    try {
        const response = await axios.post(finalUrl, { headers });
        if (response.data && response.data.medias && response.data.medias.length >= 4) {
            // The 4th object (index 3) contains the video URL
            const videoData = response.data.medias[3];
            return [{
                mediaUrl: videoData.url || videoData.downloadUrl,
                title: 'Pinterest Video',
                thumbnail: response.data.thumbnail || '',
                downloadUrl: videoData.url || videoData.downloadUrl,
                type: 'video',
                quality: videoData.quality || 'original'
            }];
        }
        throw new Error("No video URL found");
    } catch (error) {
        throw new Error(`Scraping failed: ${error.message}`);
    }
}

module.exports = { downloadPinterestVideo };
