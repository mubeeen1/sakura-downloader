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
    // Skip validation for known video platforms that require special handling
    const trustedDomains = [
      'googlevideo.com',
      'redirector.googlevideo.com', 
      'youtube.com',
      'ytimg.com',
      'fbcdn.net',
      'cdninstagram.com',
      'tiktokcdn.com'
    ];
    
    const urlObj = new URL(url);
    const hostname = urlObj.hostname.toLowerCase();
    
    // Trust URLs from known video platforms
    if (trustedDomains.some(domain => hostname.includes(domain))) {
      return { 
        valid: true, 
        contentType: 'video/mp4', // Assume video for trusted domains
        finalUrl: url 
      };
    }
    
    // Handle redirect chains by following redirects
    const response = await axios.head(url, { 
      timeout: 15000,
      maxRedirects: 5,
      validateStatus: (status) => status < 400
    });
    
    const contentType = response.headers['content-type'];
    const contentLength = parseInt(response.headers['content-length'] || '0');
    
    // Enhanced media content type detection
    const mediaTypes = [
      'video/', 'audio/', 'image/', 
      'application/octet-stream',
      'application/mp4', 'application/x-mpegURL'
    ];
    
    const isMedia = mediaTypes.some(type => 
      contentType && contentType.toLowerCase().includes(type)
    );
    
    if (isMedia) {
      return { 
        valid: true, 
        contentType, 
        finalUrl: response.request.res.responseUrl || url 
      };
    }
    
    // Check for suspicious HTML content
    if (contentType && (
      contentType.includes('text/html') || 
      contentType.includes('text/plain') ||
      contentType.includes('application/json')
    )) {
      return { valid: false, reason: 'URL points to HTML/text content instead of media' };
    }
    
    // Check file size
    if (contentLength > 0 && contentLength < 2048) {
      return { valid: false, reason: 'File too small to be valid media' };
    }
    
    return { valid: false, reason: 'Invalid content type: ' + contentType };
  } catch (error) {
    console.error(chalk.red(`[ERROR] Failed to validate URL: ${url}`), error.message);
    return { valid: false, reason: error.message };
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
      const ytUrl = data.mp4 || data.mp3 || null;
      if (ytUrl) {
        const validation = await validateMediaUrl(ytUrl);
        mediaUrl = validation.valid ? validation.finalUrl : null;
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

// Helper function to download a file from url and save to filepath
async function downloadFile(fileUrl, filepath, retries = 3) {
  console.log(chalk.blue(`[INFO] Downloading file from URL: ${fileUrl} to path: ${filepath}`));
  
  // Validate URL before downloading
  const validation = await validateMediaUrl(fileUrl);
  if (!validation.valid) {
    throw new Error(`Invalid media URL: ${validation.reason}`);
  }
  
  const writer = fs.createWriteStream(filepath);
  
  try {
    const response = await axios({
      url: fileUrl,
      method: 'GET',
      responseType: 'stream',
      timeout: 30000
    });
    
    response.data.pipe(writer);
    
    return new Promise((resolve, reject) => {
      writer.on('finish', () => {
        console.log(chalk.green(`[INFO] Finished downloading file to: ${filepath}`));
        resolve();
      });
      writer.on('error', (err) => {
        console.error(chalk.red(`[ERROR] Error writing file to: ${filepath}`), err);
        reject(err);
      });
    });
  } catch (error) {
    if (retries > 0 && error.code !== 'ENOTFOUND') {
      console.log(chalk.yellow(`[WARN] Download failed, retrying... (${retries} attempts left)`));
      await new Promise(resolve => setTimeout(resolve, 1000 * (4 - retries)));
      return downloadFile(fileUrl, filepath, retries - 1);
    }
    throw error;
  }
}

async function sanitizeFilename(title, mediaUrl) {
  const timestamp = Date.now();
  let safeTitle = title ? title.replace(/[^a-z0-9]/gi, '_').toLowerCase() : timestamp.toString();

  // Limit filename length to 50 characters to avoid ENAMETOOLONG errors
  const maxLength = 50;
  if (safeTitle.length > maxLength) {
    safeTitle = safeTitle.substring(0, maxLength);
  }

  // Extract extension from mediaUrl without query parameters
  let ext = '';
  try {
    const urlObj = new URL(mediaUrl);
    ext = path.extname(urlObj.pathname);
    // Validate extension with mime-types: ensure ext like '.mp4' maps to a known mime type
    const extNoDot = ext.replace('.', '');
    if (!mime.lookup(extNoDot)) {
      ext = '';
    }
    if (!ext) {
      // Perform HEAD request to get content-type
      const headResp = await axios.head(mediaUrl);
      const contentType = headResp.headers['content-type'];
      if (contentType) {
        ext = '.' + mime.extension(contentType);
      }
    }
  } catch (e) {
    ext = '';
  }

  // Enhanced check to avoid .html extension for media files
  if (ext === '.html' || ext === '.htm' || ext === '.php' || ext === '.asp' || ext === '.jsp') {
    try {
      const validation = await validateMediaUrl(mediaUrl);
      if (validation.valid) {
        const contentType = validation.contentType;
        if (contentType.startsWith('video/')) {
          ext = '.mp4';
        } else if (contentType.startsWith('audio/')) {
          ext = '.mp3';
        } else if (contentType.startsWith('image/')) {
          ext = '.jpg';
        } else if (contentType.includes('application/octet-stream')) {
          ext = '.bin';
        } else {
          ext = '.mp4'; // Default fallback
        }
      } else {
        ext = '.mp4'; // Force mp4 for media files
      }
    } catch (e) {
      ext = '.mp4'; // Force mp4 on error
    }
  }

  // If no valid extension, default to .mp4 or .jpg based on content type
  if (!ext) {
    if (mediaUrl) {
      try {
        const validation = await validateMediaUrl(mediaUrl);
        if (validation.valid) {
          const contentType = validation.contentType;
          if (contentType.startsWith('image/')) {
            ext = '.jpg';
          } else if (contentType.startsWith('audio/')) {
            ext = '.mp3';
          } else {
            ext = '.mp4';
          }
        } else {
          ext = '.mp4'; // Default to mp4
        }
      } catch (e) {
        ext = '.mp4';
      }
    } else {
      ext = '.mp4';
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
  res.render('main');
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

  try {
    console.log(chalk.blue(`[INFO] Starting download for platform: ${platform}, URL: ${url}`));
    const data = await downloadFunction(url);
    console.log(chalk.blue('[INFO] Download function returned data:'), data);

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
      console.error(chalk.red(`[ERROR] No media URL found in the download data for platform: ${platform}`));
      return res.redirect(`/error?message=${encodeURIComponent("No media URL found in the download data.")}`);
    }

    console.log(chalk.blue(`[INFO] Extracted media URL: ${mediaUrl}`));
    console.log(chalk.blue(`[INFO] Extracted thumbnail URL: ${thumbnailUrl}`));
    console.log(chalk.blue(`[INFO] Extracted title: ${title}`));

    const safeMediaFilename = await sanitizeFilename(title, mediaUrl);
    const sessionTmpDir = getSessionTmpDir(req);
    const mediaFilePath = path.join(sessionTmpDir, safeMediaFilename);

    await downloadFile(mediaUrl, mediaFilePath);

    let thumbnailFilename = null;
    let thumbnailFilePath = null;
    if (thumbnailUrl) {
      const thumbExt = path.extname(thumbnailUrl.split('?')[0]) || '.jpg';
      thumbnailFilename = title.replace(/[^a-z0-9]/gi, '_').toLowerCase() + '_thumb' + thumbExt;
      thumbnailFilePath = path.join(sessionTmpDir, thumbnailFilename);
      await downloadFile(thumbnailUrl, thumbnailFilePath);
    } else {
      thumbnailFilename = 'black_placeholder.png';
      thumbnailFilePath = path.join(sessionTmpDir, thumbnailFilename);
      if (!fs.existsSync(thumbnailFilePath)) {
        // Use a static black image file as placeholder instead of canvas
        const blackPlaceholderPath = path.join(__dirname, 'public', 'images', 'black_placeholder.png');
        if (fs.existsSync(blackPlaceholderPath)) {
          fs.copyFileSync(blackPlaceholderPath, thumbnailFilePath);
        } else {
          // If static file not found, create an empty file as fallback
          fs.writeFileSync(thumbnailFilePath, '');
        }
      }
    }

    console.log(chalk.green(`[INFO] Sending response with media file: /tmp/${req.sessionID}/${safeMediaFilename} and thumbnail file: /tmp/${req.sessionID}/${thumbnailFilename}`));
    res.status(200).json({
      message: 'Media and thumbnail downloaded',
      mediaFile: `/tmp/${req.sessionID}/${safeMediaFilename}`,
      thumbnailFile: `/tmp/${req.sessionID}/${thumbnailFilename}`,
      title: title,
      description: description,
      downloadFilename: safeMediaFilename // Include the actual filename with extension
    });

  } catch (error) {
    console.error(chalk.red(`[ERROR] Error downloading from ${platform} with URL ${url}:`), error);
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

  console.log(chalk.blue(`[INFO] Download request for file: ${filename} at path: ${filePath}`));

  fs.access(filePath, fs.constants.F_OK, (err) => {
    if (err) {
      console.error(chalk.red(`[ERROR] File not found for download: ${filePath}`));
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
    
    console.log(chalk.blue(`[INFO] Sending file with content-type: ${contentType}`));
    
    res.download(filePath, filename, (err) => {
      if (err) {
        console.error(chalk.red(`[ERROR] Error sending file: ${filePath}`), err);
      } else {
        console.log(chalk.green(`[INFO] Successfully sent file: ${filename}`));
        // Delete the file after sending
        fs.unlink(filePath, (unlinkErr) => {
          if (unlinkErr) {
            console.error(chalk.red(`[ERROR] Error deleting file after download: ${filePath}`), unlinkErr);
          } else {
            console.log(chalk.green(`[INFO] Deleted file after download: ${filePath}`));
          }
        });
      }
    });
  });
});

// Start the server
app.listen(port, () => {
  console.log(`Server listening at http://localhost:${port}`);
});
