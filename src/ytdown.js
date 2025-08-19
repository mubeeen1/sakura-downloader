const axios = require('axios');
const qs = require('qs');

// YouTube downloading via scraping
const BASE_URL = 'https://ssvid.net/api/ajax/search?hl=en';
const CONVERT_URL = 'https://ssvid.net/api/ajax/convert?hl=en';

const headers = {
    'Accept': '*/*',
    'Accept-Encoding': 'gzip, deflate, br, zstd',
    'Accept-Language': 'en-US,en;q=0.9,hi-IN;q=0.8,hi;q=0.7,ur-PK;q=0.6,ur;q=0.5',
    'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
    'Origin': 'https://ssvid.net',
    'Referer': 'https://ssvid.net/en',
    'Sec-CH-UA': '"Not;A=Brand";v="99", "Google Chrome";v="139", "Chromium";v="139"',
    'Sec-CH-UA-Mobile': '?0',
    'Sec-CH-UA-Platform': '"Windows"',
    'Sec-Fetch-Dest': 'empty',
    'Sec-Fetch-Mode': 'cors',
    'Sec-Fetch-Site': 'same-origin',
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36',
    'X-Requested-With': 'XMLHttpRequest'
};

class YouTubeDownloader {
    async getVideoInfo(videoUrl) {
        try {
            const data = {
                query: videoUrl,
                vt: "home"
            };

            const response = await axios.post(BASE_URL, qs.stringify(data), { headers });
            
            if (response.data.status === "ok") {
                return {
                    success: true,
                    data: {
                        title: response.data.title,
                        thumbnail: `https://img.youtube.com/vi/${response.data.vid}/maxresdefault.jpg`,
                        duration: response.data.t,
                        author: response.data.a,
                        vid: response.data.vid,
                        formats: this.parseFormats(response.data.links)
                    }
                };
            }
            
            return {
                success: false,
                error: response.data.mess || "Failed to fetch video info"
            };
        } catch (error) {
            return {
                success: false,
                error: error.message || "Network error occurred"
            };
        }
    }

    parseFormats(links) {
        const formats = [];
        
        // Parse MP4 formats
        if (links && links.mp4) {
            Object.keys(links.mp4).forEach(key => {
                const format = links.mp4[key];
                formats.push({
                    type: 'mp4',
                    quality: format.q,
                    size: format.size,
                    key: format.k,
                    label: `${format.q_text} (${format.size})`
                });
            });
        }

        // Parse MP3 formats
        if (links && links.mp3) {
            Object.keys(links.mp3).forEach(key => {
                const format = links.mp3[key];
                formats.push({
                    type: 'mp3',
                    quality: format.q,
                    size: format.size,
                    key: format.k,
                    label: `${format.q_text} (${format.size})`
                });
            });
        }

        return formats;
    }

    async convertVideo(vid, k) {
        try {
            const data = {
                vid: vid,
                k: k
            };

            const response = await axios.post(CONVERT_URL, qs.stringify(data), { headers });
            
            if (response.data.status === "ok" && response.data.c_status === "CONVERTED") {
                return {
                    success: true,
                    data: {
                        downloadUrl: response.data.dlink,
                        title: response.data.title,
                        format: response.data.ftype,
                        quality: response.data.fquality
                    }
                };
            }
            
            return {
                success: false,
                error: response.data.mess || "Conversion failed"
            };
        } catch (error) {
            return {
                success: false,
                error: error.message || "Network error occurred"
            };
        }
    }

    extractVideoId(url) {
        const match = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\n?#]+)/);
        return match ? match[1] : null;
    }
}

module.exports = new YouTubeDownloader();
