const express = require("express");
const bodyParser = require("body-parser");
const session = require("express-session");
const ytdown = require('./src/ytdown'); // Import the scraping module
let chalk;
try {
  chalk = require('chalk');
  if (chalk && chalk.default) chalk = chalk.default;
  // Test if chalk is working properly
  if (!chalk.red || typeof chalk.red !== 'function') {
    throw new Error('Chalk not functioning properly');
  }
} catch (e) {
  // Fallback if chalk is not available or not working
  const createChalkFallback = () => {
    const identity = (s) => s;
    const chalkObj = {
      red: identity,
      green: identity,
      yellow: identity,
      blue: identity,
      cyan: identity,
      magenta: identity,
      gray: identity,
      white: identity,
      bold: identity,
      dim: identity
    };
    
    // Add chaining support
    Object.keys(chalkObj).forEach(color => {
      chalkObj[color].bold = identity;
      chalkObj[color].dim = identity;
    });
    
    // Add bold with color support
    chalkObj.bold.red = identity;
    chalkObj.bold.green = identity;
    chalkObj.bold.yellow = identity;
    chalkObj.bold.blue = identity;
    chalkObj.bold.cyan = identity;
    chalkObj.bold.magenta = identity;
    chalkObj.bold.gray = identity;
    chalkObj.bold.white = identity;
    
    return chalkObj;
  };
  
  chalk = createChalkFallback();
  console.log('⚠️  Using chalk fallback - colors will not be displayed');
}
const axios = require('axios');
const fs = require('fs');
const path = require('path');

const app = express();
const port = process.env.PORT || 3000;

// Enhanced compact logging middleware with multiple colors
const logger = (req, res, next) => {
  const start = Date.now();
  const timestamp = new Date().toISOString().replace('T', ' ').substr(0, 19);
  
  res.on('finish', () => {
    const duration = Date.now() - start;
    const method = req.method;
    const url = req.url;
    const status = res.statusCode;
    
    // Enhanced log formatting with colors
    try {
      const gray = chalk.gray || ((s) => s);
      const boldWhite = (chalk.bold && chalk.bold.white) ? chalk.bold.white : chalk.white || ((s) => s);
      const cyan = chalk.cyan || ((s) => s);
      const blue = chalk.blue || ((s) => s);
      const red = chalk.red || ((s) => s);
      const yellow = chalk.yellow || ((s) => s);
      const green = chalk.green || ((s) => s);
      
      const timeStr = gray(`[${timestamp}]`);
      const methodStr = boldWhite(method.padEnd(4));
      const statusStr = getStatusColor(status)(status.toString());
      const durationStr = cyan(`${duration}ms`);
      const urlStr = blue(url);
      
      const logEntry = `${timeStr} ${methodStr} ${urlStr} ${statusStr} ${durationStr}`;
      
      if (status >= 500) {
        console.error(red('🔴'), logEntry);
      } else if (status >= 400) {
        console.warn(yellow('🟡'), logEntry);
      } else if (status >= 300) {
        console.info(cyan('🔵'), logEntry);
      } else {
        console.log(green('🟢'), logEntry);
      }
    } catch (e) {
      // Fallback to simple logging
      const logEntry = `[${timestamp}] ${method.padEnd(4)} ${url} ${status} ${duration}ms`;
      if (status >= 400) {
        console.error(logEntry);
      } else {
        console.log(logEntry);
      }
    }
  });
  
  next();
};

// Helper function to get appropriate color for status codes
function getStatusColor(status) {
  try {
    if (status >= 500) return chalk.red && chalk.red.bold ? chalk.red.bold : chalk.red || ((s) => s);
    if (status >= 400) return chalk.yellow && chalk.yellow.bold ? chalk.yellow.bold : chalk.yellow || ((s) => s);
    if (status >= 300) return chalk.cyan || ((s) => s);
    return chalk.green && chalk.green.bold ? chalk.green.bold : chalk.green || ((s) => s);
  } catch (e) {
    return (s) => s;
  }
}

// Enhanced error logging function
function logError(error, context = 'UNKNOWN') {
  const timestamp = new Date().toISOString().replace('T', ' ').substr(0, 19);
  try {
    const redBold = (chalk.red && chalk.red.bold) ? chalk.red.bold : chalk.red || ((s) => s);
    const gray = chalk.gray || ((s) => s);
    const magenta = chalk.magenta || ((s) => s);
    const red = chalk.red || ((s) => s);
    const white = chalk.white || ((s) => s);
    const dim = chalk.dim || ((s) => s);
    
    console.error(redBold('❌ [ERROR]'), gray(`[${timestamp}]`), magenta(`[${context}]`));
    console.error(red('Message:'), white(error.message || 'Unknown error'));
    if (error.stack) {
      console.error(dim('Stack:'));
      console.error(dim(error.stack));
    }
    console.error(red('─'.repeat(80)));
  } catch (e) {
    // Fallback to plain console.error
    console.error(`❌ [ERROR] [${timestamp}] [${context}]`);
    console.error('Message:', error.message || 'Unknown error');
    if (error.stack) {
      console.error('Stack:', error.stack);
    }
    console.error('─'.repeat(80));
  }
}

// Enhanced success logging function
function logSuccess(message, context = 'APP') {
  const timestamp = new Date().toISOString().replace('T', ' ').substr(0, 19);
  try {
    const greenBold = (chalk.green && chalk.green.bold) ? chalk.green.bold : chalk.green || ((s) => s);
    const gray = chalk.gray || ((s) => s);
    const cyan = chalk.cyan || ((s) => s);
    const white = chalk.white || ((s) => s);
    
    console.log(greenBold('✅ [SUCCESS]'), gray(`[${timestamp}]`), cyan(`[${context}]`), white(message));
  } catch (e) {
    console.log(`✅ [SUCCESS] [${timestamp}] [${context}] ${message}`);
  }
}

// Enhanced info logging function
function logInfo(message, context = 'INFO') {
  const timestamp = new Date().toISOString().replace('T', ' ').substr(0, 19);
  try {
    const blueBold = (chalk.blue && chalk.blue.bold) ? chalk.blue.bold : chalk.blue || ((s) => s);
    const gray = chalk.gray || ((s) => s);
    const cyan = chalk.cyan || ((s) => s);
    const white = chalk.white || ((s) => s);
    
    console.log(blueBold('ℹ️  [INFO]'), gray(`[${timestamp}]`), cyan(`[${context}]`), white(message));
  } catch (e) {
    console.log(`ℹ️  [INFO] [${timestamp}] [${context}] ${message}`);
  }
}

// Enhanced warning logging function
function logWarning(message, context = 'WARNING') {
  const timestamp = new Date().toISOString().replace('T', ' ').substr(0, 19);
  try {
    const yellowBold = (chalk.yellow && chalk.yellow.bold) ? chalk.yellow.bold : chalk.yellow || ((s) => s);
    const gray = chalk.gray || ((s) => s);
    const cyan = chalk.cyan || ((s) => s);
    const white = chalk.white || ((s) => s);
    
    console.warn(yellowBold('⚠️  [WARNING]'), gray(`[${timestamp}]`), cyan(`[${context}]`), white(message));
  } catch (e) {
    console.warn(`⚠️  [WARNING] [${timestamp}] [${context}] ${message}`);
  }
}

// Function to get user-friendly error message
function getUserFriendlyError(error) {
  const friendlyMessages = {
    'ENOTFOUND': 'Network connection failed. Please check your internet connection.',
    'ECONNREFUSED': 'Service is temporarily unavailable. Please try again later.',
    'ETIMEDOUT': 'Request timed out. Please try again.',
    'Invalid URL': 'The URL you provided is not valid. Please check and try again.',
    'Network Error': 'Network error occurred. Please check your connection.',
    'Parse Error': 'Unable to process the content. Please try a different URL.',
    'Rate Limited': 'Too many requests. Please wait a moment and try again.',
    'Not Found': 'The requested content could not be found.',
    'Access Denied': 'Access to this content is restricted.',
    'Service Unavailable': 'Service is temporarily unavailable. Please try again later.'
  };
  
  const errorMessage = error.message || error.toString();
  
  // Check for specific error patterns
  for (const [pattern, friendlyMsg] of Object.entries(friendlyMessages)) {
    if (errorMessage.includes(pattern)) {
      return friendlyMsg;
    }
  }
  
  // Default user-friendly message
  return 'An unexpected error occurred. Please try again or contact support if the problem persists.';
}

// Middleware
app.use(logger);
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(session({
  secret: 'your-secret-key',
  resave: false,
  saveUninitialized: true,
  cookie: { secure: false }
}));

app.set('view engine', 'ejs');
app.use(express.static(path.join(__dirname, 'public')));

// Health check
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Updated home route to render main.ejs instead of maintenance
app.get("/", (req, res) => {
  res.render('main');
});

// Error handling middleware (this is early middleware, not the global one)
app.use((err, req, res, next) => {
  logError(err, 'MIDDLEWARE');
  
  const userFriendlyMessage = getUserFriendlyError(err);
  const errorMessage = encodeURIComponent(userFriendlyMessage);
  res.redirect(`/error?message=${errorMessage}`);
});

app.get("/error", (req, res) => {
  let errorMessage = req.query.message || "An unknown error occurred.";
  try {
    errorMessage = decodeURIComponent(errorMessage);
  } catch (e) {
    logWarning('Failed to decode error message', 'ERROR_PAGE');
    errorMessage = "An unknown error occurred.";
  }
  
  logInfo(`Error page accessed: ${errorMessage}`, 'ERROR_PAGE');
  res.status(500).render('error', { errorMessage });
});

// New API routes for YouTube scraping
app.post("/api/youtube/info", async (req, res) => {
  try {
    const { url } = req.body;
    
    if (!url) {
      logWarning('YouTube API called without URL', 'YOUTUBE_API');
      return res.status(400).json({ success: false, error: 'URL is required' });
    }

    logInfo(`Fetching video info for: ${url}`, 'YOUTUBE_API');
    const result = await ytdown.getVideoInfo(url);
    
    if (result.success) {
      logSuccess(`Video info fetched successfully: ${result.data?.title || 'Unknown title'}`, 'YOUTUBE_API');
    }
    
    res.json(result);
  } catch (error) {
    logError(error, 'YOUTUBE_API');
    const userFriendlyMessage = getUserFriendlyError(error);
    res.status(500).json({ success: false, error: userFriendlyMessage });
  }
});

app.post("/api/youtube/convert", async (req, res) => {
  try {
    const { vid, k } = req.body;
    
    if (!vid || !k) {
      logWarning('YouTube convert API called without required parameters', 'YOUTUBE_API');
      return res.status(400).json({ success: false, error: 'Video ID and key are required' });
    }

    logInfo(`Converting video: ${vid} with key: ${k}`, 'YOUTUBE_API');
    const result = await ytdown.convertVideo(vid, k);
    
    if (result.success) {
      logSuccess(`Video converted successfully: ${result.data?.title || 'Unknown title'}`, 'YOUTUBE_API');
    }
    
    res.json(result);
  } catch (error) {
    logError(error, 'YOUTUBE_API');
    const userFriendlyMessage = getUserFriendlyError(error);
    res.status(500).json({ success: false, error: userFriendlyMessage });
  }
});

// YouTube download proxy endpoint to avoid external redirects
app.get("/api/youtube/download/:downloadId", async (req, res) => {
  try {
    const { downloadId } = req.params;
    
    // Decode the download URL from base64
    let downloadUrl;
    try {
      downloadUrl = Buffer.from(downloadId, 'base64').toString('utf-8');
    } catch (error) {
      logWarning('Invalid download ID provided', 'YOUTUBE_PROXY');
      return res.status(400).json({ success: false, error: 'Invalid download link' });
    }
    
    logInfo(`Proxying YouTube download from: ${downloadUrl}`, 'YOUTUBE_PROXY');
    
    // Make request to the actual download URL with proper headers
    const response = await axios({
      method: 'GET',
      url: downloadUrl,
      responseType: 'stream',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36',
        'Accept': '*/*',
        'Accept-Language': 'en-US,en;q=0.9',
        'Accept-Encoding': 'gzip, deflate, br',
        'Referer': 'https://ssvid.net/',
        'Origin': 'https://ssvid.net'
      },
      timeout: 30000, // 30 second timeout
      maxRedirects: 5
    });
    
    // Get content type and filename from headers
    const contentType = response.headers['content-type'] || 'application/octet-stream';
    const contentLength = response.headers['content-length'];
    const contentDisposition = response.headers['content-disposition'];
    
    // Extract filename from content-disposition or create a default one
    let filename = 'download';
    if (contentDisposition) {
      const match = contentDisposition.match(/filename="?([^"]+)"?/i);
      if (match) {
        filename = match[1];
      }
    } else {
      // Generate filename based on content type
      if (contentType.includes('video/mp4')) {
        filename = `video_${Date.now()}.mp4`;
      } else if (contentType.includes('audio/mpeg')) {
        filename = `audio_${Date.now()}.mp3`;
      } else {
        filename = `download_${Date.now()}`;
      }
    }
    
    // Sanitize filename to prevent path traversal and invalid characters
    filename = filename.replace(/[<>:"/\\|?*]/g, '_').replace(/\.\.+/g, '.').substring(0, 255);
    
    // Set appropriate headers for download
    res.setHeader('Content-Type', contentType);
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    
    if (contentLength) {
      res.setHeader('Content-Length', contentLength);
    }
    
    // Enable CORS for cross-origin requests
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
    
    logSuccess(`Starting download proxy for file: ${filename}`, 'YOUTUBE_PROXY');
    
    // Pipe the response stream directly to the client
    response.data.pipe(res);
    
    // Handle stream errors
    response.data.on('error', (error) => {
      logError(error, 'YOUTUBE_PROXY_STREAM');
      if (!res.headersSent) {
        res.status(500).json({ success: false, error: 'Download stream error' });
      }
    });
    
    // Log when download completes
    response.data.on('end', () => {
      logSuccess(`Download completed for: ${filename}`, 'YOUTUBE_PROXY');
    });
    
  } catch (error) {
    logError(error, 'YOUTUBE_PROXY');
    
    if (!res.headersSent) {
      if (error.code === 'ENOTFOUND' || error.code === 'ECONNREFUSED') {
        res.status(404).json({ success: false, error: 'Download link expired or invalid' });
      } else if (error.code === 'ETIMEDOUT') {
        res.status(408).json({ success: false, error: 'Download timeout - please try again' });
      } else {
        res.status(500).json({ success: false, error: 'Download failed - please try again' });
      }
    }
  }
});

app.get("/:platform", (req, res) => {
  const platform = req.params.platform.toLowerCase();
  if (!['youtube', 'instagram', 'pinterest'].includes(platform)) {
    logWarning(`Unsupported platform requested: ${platform}`, 'ROUTING');
    return res.redirect(`/error?message=${encodeURIComponent("Platform not supported")}`);
  }
  
  logInfo(`Platform page accessed: ${platform}`, 'ROUTING');
  res.render(`${platform}`, { platform });
});

// Instagram download route
app.post("/instagram/download", async (req, res) => {
  try {
    const { url } = req.body;
    
    if (!url) {
      logWarning('Instagram download called without URL', 'INSTAGRAM_API');
      return res.status(400).json({ success: false, error: 'URL is required' });
    }

    logInfo(`Instagram download requested for: ${url}`, 'INSTAGRAM_API');
    const instagram = require('./src/instagram');
    const mediaItems = await instagram.downloadInstagram(url);
    
    logSuccess(`Instagram media downloaded: ${mediaItems?.length || 0} items`, 'INSTAGRAM_API');
    res.json({ success: true, mediaItems });
  } catch (error) {
    logError(error, 'INSTAGRAM_API');
    const userFriendlyMessage = getUserFriendlyError(error);
    res.status(500).json({ success: false, error: userFriendlyMessage });
  }
});

// Pinterest download route
app.post("/pinterest/download", async (req, res) => {
  try {
    const { url, mediaType } = req.body;
    
    if (!url) {
      logWarning('Pinterest download called without URL', 'PINTEREST_API');
      return res.status(400).json({ success: false, error: 'URL is required' });
    }

    logInfo(`Pinterest download requested for: ${url} (type: ${mediaType})`, 'PINTEREST_API');
    
    // Only use pintScrape for video type, use pinterest module for photos
    if (mediaType === 'video' && fs.existsSync('./src/pintscrape.js')) {
      const pintscrape = require('./src/pintscrape');
      const mediaItems = await pintscrape.downloadPinterestVideo(url);
      logSuccess(`Pinterest video downloaded: ${mediaItems?.length || 0} items`, 'PINTEREST_API');
      res.json({ success: true, mediaItems });
    } else if (mediaType === 'photo') {
      const pinterest = require('./src/pinterest');
      const mediaItems = await pinterest.downloadPinterest(url);
      logSuccess(`Pinterest photo downloaded: ${mediaItems?.length || 0} items`, 'PINTEREST_API');
      res.json({ success: true, mediaItems });
    } else {
      throw new Error('Invalid media type or missing scraping module');
    }
  } catch (error) {
    logError(error, 'PINTEREST_API');
    const userFriendlyMessage = getUserFriendlyError(error);
    res.status(500).json({ success: false, error: userFriendlyMessage });
  }
});

// YouTube download route
app.post("/youtube/download", async (req, res) => {
  try {
    const { url } = req.body;
    
    if (!url) {
      logWarning('YouTube download called without URL', 'YOUTUBE_DOWNLOAD');
      return res.status(400).json({ success: false, error: 'URL is required' });
    }

    logInfo(`YouTube download requested for: ${url}`, 'YOUTUBE_DOWNLOAD');
    
    // Get video info using scraping module
    const videoInfo = await ytdown.getVideoInfo(url);
    
    if (!videoInfo || !videoInfo.success || !videoInfo.data || !videoInfo.data.formats || videoInfo.data.formats.length === 0) {
      logWarning('No downloadable formats found for YouTube URL', 'YOUTUBE_DOWNLOAD');
      return res.status(400).json({ 
        success: false, 
        error: 'No downloadable formats found or invalid URL' 
      });
    }

    // Create media items for display
    const mediaItems = videoInfo.data.formats.map(format => ({
      mediaUrl: format.url || format.downloadUrl,
      title: videoInfo.data.title || 'YouTube Video',
      thumbnail: videoInfo.data.thumbnail || '',
      downloadUrl: format.url || format.downloadUrl,
      type: format.type || 'video',
      quality: format.quality,
      format: format.format || format.type,
      size: format.size,
      key: format.key,
      vid: videoInfo.data.vid
    }));

    logSuccess(`YouTube formats processed: ${mediaItems.length} items`, 'YOUTUBE_DOWNLOAD');
    res.json({ success: true, mediaItems });
  } catch (error) {
    logError(error, 'YOUTUBE_DOWNLOAD');
    const userFriendlyMessage = getUserFriendlyError(error);
    res.status(500).json({ success: false, error: userFriendlyMessage });
  }
});

// Global error handling middleware
app.use((err, req, res, next) => {
  logError(err, 'GLOBAL');
  
  const userFriendlyMessage = getUserFriendlyError(err);
  const errorMessage = encodeURIComponent(userFriendlyMessage);
  
  // Don't redirect API calls, send JSON response instead
  if (req.path.startsWith('/api/')) {
    return res.status(500).json({ 
      success: false, 
      error: userFriendlyMessage
    });
  }
  
  // For web routes, redirect to error page
  res.redirect(`/error?message=${errorMessage}`);
});

// 404 handler
app.use((req, res) => {
  logWarning(`404 - Page not found: ${req.path}`, '404_HANDLER');
  const errorMessage = encodeURIComponent(`Page not found: ${req.path}`);
  res.status(404).redirect(`/error?message=${errorMessage}`);
});

app.listen(port, () => {
  logSuccess(`🌸 Sakura Downloader server running at http://localhost:${port}`, 'SERVER');
  logInfo('📱 Available platforms: /youtube, /instagram, /pinterest', 'SERVER');
  logInfo('✨ Enhanced logging and error handling enabled', 'SERVER');
});
