const express = require("express");
const bodyParser = require("body-parser");
const session = require("express-session");
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
    

app.get("/:platform", (req, res) => {
  const platform = req.params.platform.toLowerCase();
  if (!['youtube', 'instagram', 'pinterest', 'tiktok', "facebook", "twitter"].includes(platform)) {
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
    if (mediaType === 'video' && fs.existsSync('./src/pintScrape.js')) {
      const pintscrape = require('./src/pintScrape');
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

// TikTok download route
app.post("/tiktok/download", async (req, res) => {
  try {
    const { url } = req.body;
    
    if (!url) {
      logWarning('TikTok download called without URL', 'TIKTOK_API');
      return res.status(400).json({ success: false, error: 'URL is required' });
    }

    logInfo(`TikTok download requested for: ${url}`, 'TIKTOK_API');
    
    const tiktok = require('./src/tiktok');
    const mediaItems = await tiktok.downloadTikTok(url);
    
    logSuccess(`TikTok media downloaded: ${mediaItems?.length || 0} items`, 'TIKTOK_API');
    res.json({ success: true, mediaItems });
  } catch (error) {
    logError(error, 'TIKTOK_API');
    const userFriendlyMessage = getUserFriendlyError(error);
    res.status(500).json({ success: false, error: userFriendlyMessage });
  }
});

// Facebook download route
app.post("/facebook/download", async (req, res) => {
  try {
    const { url } = req.body;
    
    if (!url) {
      logWarning('Facebook download called without URL', 'FACEBOOK_API');
      return res.status(400).json({ success: false, error: 'URL is required' });
    }

    logInfo(`Facebook download requested for: ${url}`, 'FACEBOOK_API');
    
    const facebook = require('./src/facebook');
    const mediaItems = await facebook.downloadFacebook(url);
    
    logSuccess(`Facebook media downloaded: ${mediaItems?.length || 0} items`, 'FACEBOOK_API');
    res.json({ success: true, mediaItems });
  } catch (error) {
    logError(error, 'FACEBOOK_API');
    const userFriendlyMessage = getUserFriendlyError(error);
    res.status(500).json({ success: false, error: userFriendlyMessage });
  }
});

// Twitter download route
app.post("/twitter/download", async (req, res) => {
  try {
    const { url } = req.body;
    
    if (!url) {
      logWarning('Twitter download called without URL', 'TWITTER_API');
      return res.status(400).json({ success: false, error: 'URL is required' });
    }

    logInfo(`Twitter download requested for: ${url}`, 'TWITTER_API');
    
    const twitter = require('./src/twitter');
    const mediaItems = await twitter.downloadTwitter(url);
    
    logSuccess(`Twitter media downloaded: ${mediaItems?.length || 0} items`, 'TWITTER_API');
    res.json({ success: true, mediaItems });
  } catch (error) {
    logError(error, 'TWITTER_API');
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
  logInfo('📱 Available platforms: /youtube, /instagram, /pinterest, /tiktok, /facebook, /twitter', 'SERVER');
  logInfo('✨ Enhanced logging and error handling enabled', 'SERVER');
});
