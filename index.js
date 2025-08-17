const express = require("express");
const bodyParser = require("body-parser");
const session = require("express-session");
const {igdl, youtube, ttdl, pinterest, twitter, fbdown , gdrive, capcut, mediafire} = require("btch-downloader");
// Chalk v5 is ESM-only. Fall back gracefully in CommonJS to avoid runtime errors.
let chalk;
try {
  chalk = require('chalk');
  if (chalk && chalk.default) chalk = chalk.default;
} catch (e) {
  chalk = { red: (s)=>s, green: (s)=>s, yellow: (s)=>s, blue: (s)=>s };
}
const mime = require('mime-types');
const axios = require('axios');
const fs = require('fs');
const path = require('path');

const app = express();
const port = process.env.PORT || 3000;

// Middleware to parse JSON bodies
app.use(bodyParser.json()); // For API requests
app.use(bodyParser.urlencoded({ extended: true })); // For form submissions

// Setup session middleware
app.use(session({
  secret: 'your-secret-key', // replace with a strong secret in production
  resave: false,
  saveUninitialized: true,
  cookie: { secure: false } // set secure: true if using HTTPS
}));

app.set('view engine', 'ejs');

// Serve static files from public directory
app.use(express.static(path.join(__dirname, 'public')));

const tmpDir = path.join(__dirname, 'tmp');

// Ensure tmp directory exists
if (!fs.existsSync(tmpDir)) {
  fs.mkdirSync(tmpDir);
}

// Helper function to get session-specific tmp directory
function getSessionTmpDir(req) {
  const sessionID = req.sessionID;
  const sessionTmpDir = path.join(tmpDir, sessionID);
  if (!fs.existsSync(sessionTmpDir)) {
    fs.mkdirSync(sessionTmpDir, { recursive: true });
  }
  return sessionTmpDir;
}

// Enhanced function to validate and sanitize media URLs
async function validateMediaUrl(url) {
  try {
    const trustedDomains = [
      'googlevideo.com', 'redirector.googlevideo.com', 'youtube.com', 'ytimg.com',
      'fbcdn.net', 'cdninstagram.com', 'tiktokcdn.com'
    ];
    
    const urlObj = new URL(url);
    const hostname = urlObj.hostname.toLowerCase();
    
    // Trust URLs from known video platforms
    if (trustedDomains.some(domain => hostname.includes(domain))) {
      return { valid: true, contentType: 'video/mp4', finalUrl: url };
    }
    
    const response = await axios.head(url, { 
      timeout: 15000, maxRedirects: 5, validateStatus: (status) => status < 400
    });
    
    const contentType = response.headers['content-type'];
    const contentLength = parseInt(response.headers['content-length'] || '0');
    
    const mediaTypes = ['video/', 'audio/', 'image/', 'application/octet-stream', 'application/mp4', 'application/x-mpegURL'];
    const isMedia = mediaTypes.some(type => contentType && contentType.toLowerCase().includes(type));
    
    if (isMedia) {
      return { valid: true, contentType, finalUrl: response.request.res.responseUrl || url };
    }
    
    if (contentType && (contentType.includes('text/html') || contentType.includes('text/plain') || contentType.includes('application/json'))) {
      return { valid: false, reason: 'URL points to HTML/text content instead of media' };
    }
    
    if (contentLength > 0 && contentLength < 2048) {
      return { valid: false, reason: 'File too small to be valid media' };
    }
    
    return { valid: false, reason: 'Invalid content type: ' + contentType };
  } catch (error) {
    console.log(chalk.red(`🌸 URL validation failed: ${error.message}`));
    return { valid: false, reason: error.message };
  }
}
// Enhanced YouTube download handling with better headers and fallback logic
async function downloadYouTubeFile(fileUrl, filepath, retries = 3) {
  const filename = path.basename(filepath);
  console.log(chalk.blue(`🌸 Downloading YouTube ${filename}...`));
  
  const dir = path.dirname(filepath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  
  // Enhanced headers specifically for YouTube/Google Video
  const youtubeHeaders = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Accept': 'video/webm,video/ogg,video/*;q=0.9,application/ogg;q=0.7,audio/*;q=0.6,*/*;q=0.5',
    'Accept-Language': 'en-US,en;q=0.9',
    'Accept-Encoding': 'identity',
    'Range': 'bytes=0-',
    'Connection': 'keep-alive',
    'Sec-Fetch-Dest': 'video',
    'Sec-Fetch-Mode': 'no-cors',
    'Sec-Fetch-Site': 'cross-site',
    'Cache-Control': 'no-cache',
    'Pragma': 'no-cache'
  };
  
  // Check if it's a YouTube/Google Video URL
  const isYoutube = fileUrl.includes('googlevideo.com') || fileUrl.includes('youtube.com');
  const headers = isYoutube ? youtubeHeaders : {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
  };
  
  const writer = fs.createWriteStream(filepath);
  let downloadSuccess = false;
  
  try {
    const response = await axios({
      url: fileUrl,
      method: 'GET',
      responseType: 'stream',
      timeout: 60000, // Increased timeout for YouTube
      headers: headers,
      maxRedirects: 10, // Increased redirects
      validateStatus: (status) => status < 400 || status === 416, // Accept 416 (Range Not Satisfiable)
    });
    
    response.data.pipe(writer);
    
    return new Promise((resolve, reject) => {
      writer.on('finish', () => {
        downloadSuccess = true;
        console.log(chalk.green(`🌺 Downloaded: ${filename}`));
        resolve();
      });
      
      writer.on('error', (err) => {
        console.log(chalk.red(`🍃 Write error: ${err.message}`));
        if (fs.existsSync(filepath)) fs.unlinkSync(filepath);
        reject(err);
      });
      
      response.data.on('error', (err) => {
        console.log(chalk.red(`🍃 Download error: ${err.message}`));
        writer.destroy();
        if (fs.existsSync(filepath)) fs.unlinkSync(filepath);
        reject(err);
      });
    });
  } catch (error) {
    if (!downloadSuccess && fs.existsSync(filepath)) {
      fs.unlinkSync(filepath);
    }
    
    // Enhanced retry logic for YouTube
    if (retries > 0) {
      const shouldRetry = 
        error.response?.status === 403 || 
        error.response?.status === 429 || 
        error.code === 'ECONNRESET' ||
        error.code === 'ETIMEDOUT' ||
        error.message.includes('timeout');
        
      if (shouldRetry) {
        const waitTime = isYoutube ? 3000 + (Math.random() * 2000) : 2000; // Random delay for YouTube
        console.log(chalk.yellow(`🌸 Retrying YouTube download... (${retries} left) - waiting ${Math.round(waitTime/1000)}s`));
        await new Promise(resolve => setTimeout(resolve, waitTime));
        return downloadYouTubeFile(fileUrl, filepath, retries - 1);
      }
    }
    
    throw error;
  }
}

// Enhanced YouTube data extraction with better URL validation
async function handleYouTubeDownload(data, sessionTmpDir, req) {
  try {
    // Try different quality options in order of preference
    const videoUrls = [
      data.mp4,           // Primary MP4
      data.video?.mp4,    // Alternative MP4
      data.audio?.mp3,    // Fallback to audio
      data.mp3            // Direct MP3
    ].filter(Boolean);
    
    if (videoUrls.length === 0) {
      throw new Error('No valid download URLs found in YouTube data');
    }
    
    let mediaUrl = null;
    let downloadError = null;
    
    // Try each URL until one works
    for (const url of videoUrls) {
      try {
        console.log(chalk.blue(`🌸 Trying YouTube URL: ${url.substring(0, 100)}...`));
        
        // Quick validation
        const validation = await validateMediaUrl(url);
        if (!validation.valid) {
          console.log(chalk.yellow(`🍃 URL validation failed: ${validation.reason}`));
          continue;
        }
        
        mediaUrl = validation.finalUrl;
        break;
      } catch (err) {
        console.log(chalk.yellow(`🍃 URL failed: ${err.message}`));
        downloadError = err;
        continue;
      }
    }
    
    if (!mediaUrl) {
      throw downloadError || new Error('All YouTube download URLs failed validation');
    }
    
    const title = data.title || 'youtube_media';
    const thumbnailUrl = data.thumbnail;
    
    console.log(chalk.blue(`🌸 YouTube URL validated successfully`));
    
    // Generate filename and download
    const safeMediaFilename = await sanitizeFilename(title, mediaUrl);
    const mediaFilePath = path.join(sessionTmpDir, safeMediaFilename);
    
    // Use the enhanced YouTube download function
    await downloadYouTubeFile(mediaUrl, mediaFilePath);
    
    // Handle thumbnail
    let thumbnailFilename = null;
    let thumbnailFilePath = null;
    
    if (thumbnailUrl) {
      try {
        const thumbExt = path.extname(thumbnailUrl.split('?')[0]) || '.jpg';
        const randomThumbName = generateRandomName(8);
        thumbnailFilename = randomThumbName + '_thumb' + thumbExt;
        thumbnailFilePath = path.join(sessionTmpDir, thumbnailFilename);
        await downloadFile(thumbnailUrl, thumbnailFilePath); // Use regular download for thumbnails
      } catch (thumbError) {
        console.log(chalk.yellow(`🍃 Thumbnail download failed: ${thumbError.message}`));
        thumbnailUrl = null; // Will create placeholder
      }
    }
    
    if (!thumbnailUrl || !thumbnailFilePath) {
      const randomPlaceholderName = generateRandomName(8);
      thumbnailFilename = randomPlaceholderName + '_placeholder.png';
      thumbnailFilePath = path.join(sessionTmpDir, thumbnailFilename);
      
      const blackPlaceholderPath = path.join(__dirname, 'public', 'images', 'black_placeholder.png');
      if (fs.existsSync(blackPlaceholderPath)) {
        fs.copyFileSync(blackPlaceholderPath, thumbnailFilePath);
      } else {
        const blackPngData = Buffer.from([0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A, 0x00, 0x00, 0x00, 0x0D, 0x49, 0x48, 0x44, 0x52, 0x00, 0x00, 0x00, 0x01, 0x00, 0x00, 0x00, 0x01, 0x08, 0x02, 0x00, 0x00, 0x00, 0x90, 0x77, 0x53, 0xDE, 0x00, 0x00, 0x00, 0x0C, 0x49, 0x44, 0x41, 0x54, 0x08, 0x1D, 0x01, 0x01, 0x00, 0x00, 0xFF, 0xFF, 0x00, 0x00, 0x00, 0x02, 0x00, 0x01, 0x02, 0x9A, 0x5C, 0x18, 0x00, 0x00, 0x00, 0x00, 0x49, 0x45, 0x4E, 0x44, 0xAE, 0x42, 0x60, 0x82]);
        fs.writeFileSync(thumbnailFilePath, blackPngData);
      }
    }
    
    return {
      mediaFile: `/tmp/${req.sessionID}/${safeMediaFilename}`,
      thumbnailFile: `/tmp/${req.sessionID}/${thumbnailFilename}`,
      title: title,
      description: data.description || null,
      downloadFilename: safeMediaFilename
    };
    
  } catch (error) {
    console.log(chalk.red(`🍃 YouTube processing failed: ${error.message}`));
    throw error;
  }
}
// Enhanced URL extraction with validation
async function extractAndValidateMediaUrl(platform, data) {
  let mediaUrl = null;
  
  // Platform-specific URL extraction with validation
  switch(platform) {
    case 'instagram':
      if (data.result && data.result.length > 0) {
        const url = data.result[0].url;
        const validation = await validateMediaUrl(url);
        if (validation.valid) {
          mediaUrl = validation.finalUrl;
        }
      }
      break;
      
    case 'tiktok':
      const videoUrl = data.video && data.video.length > 0 ? data.video[0] : null;
      if (videoUrl) {
        const validation = await validateMediaUrl(videoUrl);
        mediaUrl = validation.valid ? validation.finalUrl : null;
      }
      break;
      
    
case 'youtube':
  try {
    const youtubeResult = await handleYouTubeDownload(data, sessionTmpDir, req);
    console.log(chalk.green(`🌺 YouTube response ready: media & thumbnail`));
    return res.status(200).json(youtubeResult);
  } catch (ytError) {
    console.log(chalk.red(`🍃 YouTube download failed: ${ytError.message}`));
    return res.redirect(`/error?message=${encodeURIComponent('YouTube download failed: ' + ytError.message)}`);
  }
  break;
    case 'facebook':
      const fbUrl = data.HD || data.Normal_video || null;
      if (fbUrl) {
        const validation = await validateMediaUrl(fbUrl);
        mediaUrl = validation.valid ? validation.finalUrl : null;
      }
      break;
      
    case 'twitter':
      const twUrl = data.url || null;
      if (twUrl) {
        const validation = await validateMediaUrl(twUrl);
        mediaUrl = validation.valid ? validation.finalUrl : null;
      }
      break;
      
    case 'pinterest':
      if (data.result) {
        const pin = data.result;
        const pinUrl = pin.video_url || pin.image || null;
        if (pinUrl) {
          const validation = await validateMediaUrl(pinUrl);
          mediaUrl = validation.valid ? validation.finalUrl : null;
        }
      }
      break;
      
    case 'capcut':
      const capcutUrl = data.url || (data.data && data.data.contentUrl) || null;
      if (capcutUrl) {
        const validation = await validateMediaUrl(capcutUrl);
        mediaUrl = validation.valid ? validation.finalUrl : null;
      }
      break;
      
    case 'gdrive':
      if (data.result && data.result.downloadUrl) {
        const gdriveUrl = data.result.downloadUrl;
        const validation = await validateMediaUrl(gdriveUrl);
        mediaUrl = validation.valid ? validation.finalUrl : null;
      }
      break;
      
    case 'mediafire':
      if (data.result && data.result.url) {
        const mfUrl = data.result.url;
        const validation = await validateMediaUrl(mfUrl);
        mediaUrl = validation.valid ? validation.finalUrl : null;
      }
      break;
      
    default:
      mediaUrl = null;
  }
  
  return mediaUrl;
}

async function downloadFile(fileUrl, filepath, retries = 2) {
  const filename = path.basename(filepath);
  console.log(chalk.blue(`🌸 Downloading ${filename}...`));
  
  const validation = await validateMediaUrl(fileUrl);
  if (!validation.valid) {
    throw new Error(`🍃 Invalid media URL: ${validation.reason}`);
  }
  
  const dir = path.dirname(filepath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  
  // Check if this is a YouTube/Google Video URL
  const isYoutube = fileUrl.includes('googlevideo.com') || fileUrl.includes('youtube.com');
  
  if (isYoutube) {
    // Use the specialized YouTube download function
    return downloadYouTubeFile(fileUrl, filepath, 3);
  }
  
  // Regular download for non-YouTube URLs
  const writer = fs.createWriteStream(filepath);
  let downloadSuccess = false;
  
  try {
    const response = await axios({
      url: fileUrl, 
      method: 'GET', 
      responseType: 'stream', 
      timeout: 45000,
      headers: { 
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36' 
      },
      maxRedirects: 5
    });
    
    response.data.pipe(writer);
    
    return new Promise((resolve, reject) => {
      writer.on('finish', () => {
        downloadSuccess = true;
        console.log(chalk.green(`🌺 Downloaded: ${filename}`));
        resolve();
      });
      
      writer.on('error', (err) => {
        console.log(chalk.red(`🍃 Write error: ${err.message}`));
        if (fs.existsSync(filepath)) fs.unlinkSync(filepath);
        reject(err);
      });
      
      response.data.on('error', (err) => {
        console.log(chalk.red(`🍃 Download error: ${err.message}`));
        writer.destroy();
        if (fs.existsSync(filepath)) fs.unlinkSync(filepath);
        reject(err);
      });
    });
  } catch (error) {
    if (!downloadSuccess && fs.existsSync(filepath)) {
      fs.unlinkSync(filepath);
    }
    
    if (retries > 0 && error.code !== 'ENOTFOUND' && error.response?.status !== 404) {
      console.log(chalk.yellow(`🌸 Retrying... (${retries} left)`));
      await new Promise(resolve => setTimeout(resolve, 2000));
      return downloadFile(fileUrl, filepath, retries - 1);
    }
    throw error;
  }
        }
// Generate random alphanumeric string for unnamed media files
function generateRandomName(length = 8) {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

// Optimized filename sanitization with random naming for static titles
async function sanitizeFilename(title, mediaUrl) {
  const timestamp = Date.now();
  
  // Check if title is one of the static platform names and replace with random name
  const staticTitles = [
    'instagram_media', 'facebook_media', 'twitter_media', 'youtube_media', 
    'tiktok_media', 'pinterest_media', 'capcut_media', 'gdrive_media', 'mediafire_media'
  ];
  
  let safeTitle;
  if (!title || staticTitles.includes(title)) {
    // Generate random alphanumeric name of 7-10 characters
    const randomLength = Math.floor(Math.random() * 4) + 7; // 7-10 characters
    safeTitle = generateRandomName(randomLength);
  } else {
    safeTitle = title.replace(/[^a-z0-9]/gi, '_').toLowerCase();
  }

  // Limit filename length to 40 characters for better compatibility
  const maxLength = 40;
  if (safeTitle.length > maxLength) {
    safeTitle = safeTitle.substring(0, maxLength);
  }

  // Fast extension detection based on URL patterns and trusted domains
  let ext = '';
  try {
    const urlObj = new URL(mediaUrl);
    const hostname = urlObj.hostname.toLowerCase();
    const pathname = urlObj.pathname.toLowerCase();
    
    // Fast extension extraction from URL path
    ext = path.extname(pathname);
    
    // Platform-specific extension logic for speed
    if (hostname.includes('googlevideo.com')) {
      // YouTube/Google Video - determine by itag or mime parameter
      const params = new URLSearchParams(urlObj.search);
      const mimeParam = params.get('mime');
      if (mimeParam) {
        if (mimeParam.includes('video/mp4')) ext = '.mp4';
        else if (mimeParam.includes('audio/mp4')) ext = '.mp4';
        else if (mimeParam.includes('video/webm')) ext = '.webm';
        else if (mimeParam.includes('audio/webm')) ext = '.webm';
      } else {
        ext = '.mp4'; // Default for YouTube
      }
    } else if (hostname.includes('fbcdn.net') || hostname.includes('facebook.com')) {
      ext = '.mp4'; // Facebook videos are typically mp4
    } else if (hostname.includes('tiktokcdn.com') || hostname.includes('tiktok.com')) {
      ext = '.mp4'; // TikTok videos are mp4
    } else if (hostname.includes('cdninstagram.com') || hostname.includes('instagram.com')) {
      ext = pathname.includes('.jpg') ? '.jpg' : '.mp4'; // Instagram can be image or video
    }
    
    // Validate the extension
    if (ext && !mime.lookup(ext.replace('.', ''))) {
      ext = '';
    }
  } catch (e) {
    ext = '';
  }

  // Default extensions for invalid/missing ones
  if (!ext || ['.html', '.htm', '.php', '.asp', '.jsp'].includes(ext)) {
    // Quick determination based on URL patterns
    if (mediaUrl.includes('video') || mediaUrl.includes('mp4')) {
      ext = '.mp4';
    } else if (mediaUrl.includes('audio') || mediaUrl.includes('mp3')) {
      ext = '.mp3';
    } else if (mediaUrl.includes('image') || mediaUrl.includes('jpg') || mediaUrl.includes('png')) {
      ext = '.jpg';
    } else {
      ext = '.mp4'; // Default fallback
    }
  }

  return safeTitle + ext;
}

const platformFunctions = {
  tiktok: ttdl,
  youtube: youtube,
  facebook: fbdown,
  instagram: igdl,
  twitter: twitter,
  capcut: capcut,
  pinterest: pinterest,
  gdrive: gdrive,
  mediafire: mediafire,
  spotify: null // No function imported for spotify, handle accordingly
};

// Health check endpoint for deployment platforms like Koyeb
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'OK', timestamp: new Date().toISOString() });
});

app.get("/", (req, res) => {
  res.render('maintenance');
});

// New error route to render error.ejs with dynamic error message
app.get("/error", (req, res) => {
  let errorMessage = req.query.message || "An unknown error occurred.";
  try {
    errorMessage = decodeURIComponent(errorMessage);
  } catch (e) {
    // If decoding fails, keep original message
  }
  res.status(500).render('error', { errorMessage });
});

// Render platform page
app.get("/:platform", (req, res) => {
  const platform = req.params.platform.toLowerCase();

  if (!platformFunctions.hasOwnProperty(platform)) {
    return res.redirect(`/error?message=${encodeURIComponent("Platform not supported")}`);
  }

  res.render("platform", { platform });
});

app.post("/:platform/download", async (req, res) => {
  const platform = req.params.platform.toLowerCase();
  const url = req.body.url;

  if (!platformFunctions.hasOwnProperty(platform)) {
    return res.status(404).render('error', { errorMessage: "Platform not supported" });
  }

  if (!url) {
    return res.redirect(`/error?message=${encodeURIComponent("URL missing")}`);
  }

  const downloadFunction = platformFunctions[platform];

  if (!downloadFunction) {
    return res.redirect(`/error?message=${encodeURIComponent(`Download functionality for ${platform} is not implemented.`)}`);
  }

  // Clear previous session data when new request is made
  const sessionTmpDir = getSessionTmpDir(req);
  try {
    const files = fs.readdirSync(sessionTmpDir);
    for (const file of files) {
      const filePath = path.join(sessionTmpDir, file);
      fs.unlinkSync(filePath);
    console.log(chalk.yellow(`🌸 Cleared: ${file}`));
    }
  } catch (clearErr) {
    console.log(chalk.yellow(`🍃 Clear failed: ${clearErr.message}`));
  }

  try {
    console.log(chalk.blue(`🌸 Starting ${platform} download...`));
    const data = await downloadFunction(url);
    console.log(chalk.blue('🌸 Download data received'));

    let mediaUrl = null;
    let thumbnailUrl = null;
    let title = null;
    let description = null;

    switch(platform) {
      case 'instagram':
        if (data.result && data.result.length > 0) {
          mediaUrl = data.result[0].url;
          thumbnailUrl = data.result[0].thumbnail;
          title = 'instagram_media';
        }
        break;
      case 'tiktok':
        mediaUrl = data.video && data.video.length > 0 ? data.video[0] : null;
        thumbnailUrl = data.thumbnail || null;
        title = data.title || 'tiktok_media';
        break;
      case 'twitter':
        mediaUrl = data.url || null;
        thumbnailUrl = null;
        title = data.title || 'twitter_media';
        break;
      case 'youtube':
        mediaUrl = data.mp4 || data.mp3 || null;
        thumbnailUrl = data.thumbnail || null;
        title = data.title || 'youtube_media';
        break;
      case 'facebook':
        mediaUrl = data.HD || data.Normal_video || null;
        thumbnailUrl = null;
        title = 'facebook_media';
        break;
      case 'mediafire':
        if (data.result && data.result.url) {
          mediaUrl = data.result.url;
          thumbnailUrl = null;
          title = data.result.filename || 'mediafire_media';
        }
        break;
      case 'capcut':
        mediaUrl = data.url || (data.data && data.data.contentUrl) || null;
        thumbnailUrl = (data.data && data.data.thumbnailUrl && data.data.thumbnailUrl[0]) || null;
        title = (data.data && data.data.name) || 'capcut_media';
        description = data.data && data.data.description || null;
        break;
      case 'gdrive':
        if (data.result) {
          mediaUrl = data.result.downloadUrl || null;
          thumbnailUrl = null;
          title = data.result.filename || 'gdrive_media';
        }
        break;
      case 'pinterest':
        if (data.result) {
          const pin = data.result;
          mediaUrl = pin.video_url || pin.image || null;
          thumbnailUrl = pin.image; // Do not download thumbnail as per user request
          title = pin.title || 'pinterest_media';
          description = pin.description || null;
        }
        break;
      default:
        mediaUrl = null;
        thumbnailUrl = null;
        title = null;
    }

    if (!mediaUrl) {
      console.log(chalk.red(`🍃 No media URL found for ${platform}`));
      return res.redirect(`/error?message=${encodeURIComponent("No media URL found in the download data.")}`);
    }

    console.log(chalk.blue(`🌸 Media URL extracted`));
    if (thumbnailUrl) console.log(chalk.blue(`🌸 Thumbnail URL extracted`));
    console.log(chalk.blue(`🌸 Title: ${title || 'default'}`));

    const safeMediaFilename = await sanitizeFilename(title, mediaUrl);
    const sessionTmpDir = getSessionTmpDir(req);
    const mediaFilePath = path.join(sessionTmpDir, safeMediaFilename);

    await downloadFile(mediaUrl, mediaFilePath);

    let thumbnailFilename = null;
    let thumbnailFilePath = null;
    if (thumbnailUrl) {
      const thumbExt = path.extname(thumbnailUrl.split('?')[0]) || '.jpg';
      // Use random naming for thumbnails as well to ensure uniqueness
      const randomThumbName = generateRandomName(8);
      thumbnailFilename = randomThumbName + '_thumb' + thumbExt;
      thumbnailFilePath = path.join(sessionTmpDir, thumbnailFilename);
      await downloadFile(thumbnailUrl, thumbnailFilePath);
    } else {
      // Use random name for placeholder as well to avoid caching issues
      const randomPlaceholderName = generateRandomName(8);
      thumbnailFilename = randomPlaceholderName + '_placeholder.png';
      thumbnailFilePath = path.join(sessionTmpDir, thumbnailFilename);
      if (!fs.existsSync(thumbnailFilePath)) {
        // Use a static black image file as placeholder instead of canvas
        const blackPlaceholderPath = path.join(__dirname, 'public', 'images', 'black_placeholder.png');
        if (fs.existsSync(blackPlaceholderPath)) {
          fs.copyFileSync(blackPlaceholderPath, thumbnailFilePath);
        } else {
          // If static file not found, create a simple black PNG
          // Create a minimal 1x1 black PNG as fallback
          const blackPngData = Buffer.from([0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A, 0x00, 0x00, 0x00, 0x0D, 0x49, 0x48, 0x44, 0x52, 0x00, 0x00, 0x00, 0x01, 0x00, 0x00, 0x00, 0x01, 0x08, 0x02, 0x00, 0x00, 0x00, 0x90, 0x77, 0x53, 0xDE, 0x00, 0x00, 0x00, 0x0C, 0x49, 0x44, 0x41, 0x54, 0x08, 0x1D, 0x01, 0x01, 0x00, 0x00, 0xFF, 0xFF, 0x00, 0x00, 0x00, 0x02, 0x00, 0x01, 0x02, 0x9A, 0x5C, 0x18, 0x00, 0x00, 0x00, 0x00, 0x49, 0x45, 0x4E, 0x44, 0xAE, 0x42, 0x60, 0x82]);
          fs.writeFileSync(thumbnailFilePath, blackPngData);
        }
      }
    }

    console.log(chalk.green(`🌺 Response ready: media & thumbnail`));
    res.status(200).json({
      message: 'Media and thumbnail downloaded',
      mediaFile: `/tmp/${req.sessionID}/${safeMediaFilename}`,
      thumbnailFile: `/tmp/${req.sessionID}/${thumbnailFilename}`,
      title: title,
      description: description,
      downloadFilename: safeMediaFilename // Include the actual filename with extension
    });

  } catch (error) {
    console.log(chalk.red(`🍃 ${platform} download failed: ${error.message}`));
    res.redirect(`/error?message=${encodeURIComponent(error.message || "Error processing download request.")}`);
  }
});

// Serve files from session-specific tmp folders
app.use('/tmp/:sessionID', (req, res, next) => {
  const sessionID = req.params.sessionID;
  if (sessionID !== req.sessionID) {
    return res.status(403).send('Forbidden');
  }
  express.static(path.join(tmpDir, sessionID))(req, res, next);
});

// Route to clear tmp folder (optional, can be called after download)
app.post('/clear-tmp', (req, res) => {
  const sessionTmpDir = getSessionTmpDir(req);
  fs.readdir(sessionTmpDir, (err, files) => {
    if (err) {
      console.error(chalk.red('Error clearing tmp folder:'), err);
      return res.status(500).json({ message: 'Error clearing tmp folder' });
    }
    for (const file of files) {
      fs.unlink(path.join(sessionTmpDir, file), err => {
        if (err) console.error(chalk.red('Error deleting file:'), file, err);
      });
    }
    console.log(chalk.green('Tmp folder cleared for session:', req.sessionID));
    res.json({ message: 'Tmp folder cleared' });
  });
});

// Enhanced media download endpoint that preserves original filenames
app.get('/download/:filename', (req, res) => {
  const filename = decodeURIComponent(req.params.filename);
  const sessionTmpDir = getSessionTmpDir(req);
  const filePath = path.join(sessionTmpDir, filename);

  console.log(chalk.blue(`🌸 Download request: ${filename}`));

  fs.access(filePath, fs.constants.F_OK, (err) => {
    if (err) {
      console.log(chalk.red(`🍃 File not found: ${filename}`));
      return res.status(404).send('File not found');
    }

    // Set proper headers for file download
    const fileExtension = path.extname(filename).toLowerCase();
    let contentType = 'application/octet-stream';
    
    // Set appropriate content type based on file extension
    if (fileExtension === '.mp4') contentType = 'video/mp4';
    else if (fileExtension === '.mp3') contentType = 'audio/mpeg';
    else if (['.jpg', '.jpeg'].includes(fileExtension)) contentType = 'image/jpeg';
    else if (fileExtension === '.png') contentType = 'image/png';
    else if (fileExtension === '.gif') contentType = 'image/gif';
    else if (fileExtension === '.webm') contentType = 'video/webm';
    
    res.setHeader('Content-Type', contentType);
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    
    console.log(chalk.blue(`🌸 Sending ${contentType} file...`));
    
    res.download(filePath, filename, (err) => {
      if (err) {
        console.log(chalk.red(`🍃 Send error: ${err.message}`));
      } else {
        console.log(chalk.green(`🌺 File sent: ${filename}`));
        // Delete the media file after sending
        fs.unlink(filePath, (unlinkErr) => {
          if (unlinkErr) {
            console.log(chalk.red(`🍃 Delete error: ${unlinkErr.message}`));
          } else {
            console.log(chalk.green(`🌸 Deleted: ${filename}`));
          }
        });
        
        // Clear entire session tmp directory after successful download
        // This ensures all associated files (thumbnails, temp files) are cleaned up
        const sessionTmpDir = path.dirname(filePath);
        
        // Use setTimeout to ensure file has been fully sent before cleanup
        setTimeout(() => {
          fs.readdir(sessionTmpDir, (readErr, files) => {
            if (readErr) {
              console.error(chalk.red(`[ERROR] Error reading session tmp directory for cleanup: ${sessionTmpDir}`), readErr);
              return;
            }
            
            // Delete all remaining files in session directory
            files.forEach(file => {
              const filePath = path.join(sessionTmpDir, file);
              fs.unlink(filePath, (unlinkErr) => {
                if (unlinkErr) {
                  console.error(chalk.red(`[ERROR] Error deleting file during cleanup: ${filePath}`), unlinkErr);
                } else {
                  console.log(chalk.green(`[INFO] Cleaned up file: ${file}`));
                }
              });
            });
          });
        }, 1000); // Wait 1 second to ensure download completed
      }
    });
  });
});

// Start the server
app.listen(port, () => {
  console.log(`Server listening at http://localhost:${port}`);
});
