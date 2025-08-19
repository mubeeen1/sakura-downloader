// Common JavaScript functionality for all platform pages with autoscroll

// Utility functions
function createParticles() {
    const particlesContainer = document.querySelector('.particles');
    if (!particlesContainer) return;
    
    const particleCount = 50;
    for (let i = 0; i < particleCount; i++) {
        const particle = document.createElement('div');
        particle.className = 'particle';
        particle.style.left = Math.random() * 100 + '%';
        particle.style.animationDelay = Math.random() * 15 + 's';
        particle.style.animationDuration = (Math.random() * 10 + 10) + 's';
        particlesContainer.appendChild(particle);
    }
}

function scrollToElement(element, offset = 0) {
    if (!element) return;
    
    const elementPosition = element.getBoundingClientRect().top + window.pageYOffset;
    const offsetPosition = elementPosition - offset;
    
    window.scrollTo({
        top: offsetPosition,
        behavior: 'smooth'
    });
}

function toggleIcons(urlInput, pasteBtn, clearBtn) {
    if (urlInput.value.trim() === '') {
        pasteBtn.style.display = 'flex';
        clearBtn.style.display = 'none';
    } else {
        pasteBtn.style.display = 'none';
        clearBtn.style.display = 'flex';
    }
}

function validateUrl(urlInput, urlWarning, downloadBtn, platform) {
    const url = urlInput.value.trim().toLowerCase();
    if (url === '') {
        urlWarning.style.display = 'none';
        downloadBtn.disabled = false;
        return;
    }

    const platformUrlPatterns = {
        instagram: ['instagram.com', 'instagr.am'],
        pinterest: ['pinterest.com', 'pin.it'],
        youtube: ['youtube.com', 'youtu.be', 'm.youtube.com', 'youtube-nocookie.com']
    };

    const domains = platformUrlPatterns[platform];
    if (!domains) return;

    const isValid = domains.some(domain => url.includes(domain));
    if (isValid) {
        urlWarning.style.display = 'none';
        downloadBtn.disabled = false;
    } else {
        urlWarning.style.display = 'block';
        downloadBtn.disabled = true;
    }
}

// Enhanced autoscroll functionality
function autoScrollToLoading() {
    const loadingIndicator = document.getElementById('loadingIndicator');
    if (loadingIndicator) {
        setTimeout(() => {
            scrollToElement(loadingIndicator, 100);
        }, 100);
    }
}

function autoScrollToResults() {
    const resultContainer = document.getElementById('resultContainer');
    if (resultContainer) {
        setTimeout(() => {
            scrollToElement(resultContainer, 100);
        }, 300);
    }
}

async function handleFormSubmission(e, platform) {
    e.preventDefault();
    
    const urlInput = document.getElementById('urlInput');
    const downloadBtn = document.getElementById('downloadBtn');
    const loadingIndicator = document.getElementById('loadingIndicator');
    const resultContainer = document.getElementById('resultContainer');
    const urlWarning = document.getElementById('urlWarning');
    
    const url = urlInput.value.trim();
    if (!url) return;

    // Auto-scroll to loading indicator
    autoScrollToLoading();

    loadingIndicator.style.display = 'block';
    resultContainer.style.display = 'none';
    urlWarning.style.display = 'none';
    downloadBtn.disabled = true;
    downloadBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Downloading...';
    
    console.log(`Submitting form for platform: ${platform} with URL: ${url}`);

    try {
        let requestBody = { url };
        
        // Add mediaType for Pinterest
        if (platform === 'pinterest') {
            const mediaType = document.querySelector('input[name="mediaType"]:checked')?.value || 'photo';
            requestBody.mediaType = mediaType;
            console.log(`Pinterest request with mediaType: ${mediaType}`);
        }
        
        const response = await fetch(`/${platform}/download`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(requestBody)
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.error || 'An error occurred during download.');
        }
        
        const mediaItems = data.mediaItems || [data];
        displayMedia(mediaItems);

        // Auto-scroll to media preview after loading
        autoScrollToResults();

    } catch (error) {
        console.error(`Error in ${platform} download:`, error);
        urlWarning.innerHTML = `<i class="fas fa-exclamation-triangle"></i> ${error.message}`;
        urlWarning.style.display = 'block';
    } finally {
        loadingIndicator.style.display = 'none';
        downloadBtn.disabled = false;
        downloadBtn.innerHTML = '<i class="fas fa-download"></i> Download Media';
    }
}

function displayMedia(mediaItems) {
    const resultContent = document.getElementById('resultContent');
    const resultContainer = document.getElementById('resultContainer');
    if (!resultContent || !resultContainer) {
        console.error('Result elements not found');
        return;
    }

    console.log(`Displaying ${mediaItems?.length || 0} media items`);
    resultContent.innerHTML = '';

    if (mediaItems.length > 1) {
        const countDiv = document.createElement('div');
        countDiv.className = 'media-count';
        countDiv.innerHTML = `<i class="fas fa-images"></i> Found ${mediaItems.length} media items`;
        resultContent.appendChild(countDiv);
    }

    const gridContainer = document.createElement('div');
    gridContainer.className = 'media-grid';
    
    mediaItems.forEach((item, index) => {
        const mediaItemDiv = document.createElement('div');
        mediaItemDiv.className = 'media-item';
        
        const mediaPreview = document.createElement('div');
        mediaPreview.className = 'media-preview';
        
        let mediaElement;
        
        if (item.type === 'video' || item.mediaUrl?.includes('.mp4') || item.mediaUrl?.includes('.mov')) {
            mediaElement = document.createElement('video');
            mediaElement.src = item.mediaUrl;
            mediaElement.controls = true;
            mediaElement.className = 'media-thumbnail';
            mediaElement.style.maxWidth = '100%';
            mediaElement.style.maxHeight = '100%';
            mediaElement.style.objectFit = 'contain';
        } else {
            mediaElement = document.createElement('img');
            mediaElement.src = item.thumbnail || item.mediaUrl;
            mediaElement.alt = item.title || `Media ${index + 1}`;
            mediaElement.className = 'media-thumbnail';
            mediaElement.style.objectFit = 'contain';
            mediaElement.style.maxWidth = '100%';
            mediaElement.style.maxHeight = '100%';
        }
        
        const downloadBtn = document.createElement('button');
        downloadBtn.className = 'download-media-btn';
        downloadBtn.innerHTML = `<i class="fas fa-download"></i> Download Media ${index + 1}`;
        downloadBtn.dataset.downloadUrl = item.downloadUrl;
        downloadBtn.dataset.title = item.title || `media_${index + 1}`;
        
        downloadBtn.addEventListener('click', function() {
            handleIndividualDownload(this.dataset.downloadUrl, this.dataset.title);
        });
        
        mediaPreview.appendChild(mediaElement);
        mediaItemDiv.appendChild(mediaPreview);
        mediaItemDiv.appendChild(downloadBtn);
        gridContainer.appendChild(mediaItemDiv);
    });
    
    resultContent.appendChild(gridContainer);
    resultContainer.style.display = 'flex';
}

function handleIndividualDownload(downloadUrl, title) {
    if (!downloadUrl) {
        console.error('No download URL provided');
        return;
    }

    console.log(`Initiating download: ${title} from ${downloadUrl}`);
    const link = document.createElement('a');
    link.href = downloadUrl;
    link.download = title || 'media_file';
    link.target = '_blank';
    link.rel = 'noopener noreferrer';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

// Initialize common functionality
document.addEventListener('DOMContentLoaded', function() {
    createParticles();
    
    const urlInput = document.getElementById('urlInput');
    const pasteBtn = document.getElementById('pasteBtn');
    const clearBtn = document.getElementById('clearBtn');
    const urlWarning = document.getElementById('urlWarning');
    const downloadBtn = document.getElementById('downloadBtn');
    const downloadForm = document.getElementById('downloadForm');

    if (!urlInput || !pasteBtn || !clearBtn || !urlWarning || !downloadBtn || !downloadForm) {
        console.error('Required elements not found');
        return;
    }

    const platform = window.location.pathname.split('/')[1];
    
    // Skip common functionality for YouTube - it has its own handler
    if (platform === 'youtube') {
        console.log('YouTube page detected - skipping common form handlers');
        return;
    }
    
    console.log(`Setting up common handlers for platform: ${platform}`);
    
    toggleIcons(urlInput, pasteBtn, clearBtn);
    validateUrl(urlInput, urlWarning, downloadBtn, platform);
    
    urlInput.addEventListener('input', () => {
        toggleIcons(urlInput, pasteBtn, clearBtn);
        validateUrl(urlInput, urlWarning, downloadBtn, platform);
    });

    pasteBtn.addEventListener('click', async () => {
        try {
            const text = await navigator.clipboard.readText();
            if (text) {
                urlInput.value = text.split('\n')[0];
                toggleIcons(urlInput, pasteBtn, clearBtn);
                validateUrl(urlInput, urlWarning, downloadBtn, platform);
            }
        } catch (err) {
            console.error('Clipboard read error:', err);
            urlWarning.innerHTML = `<i class="fas fa-exclamation-triangle"></i> Could not access clipboard. Please paste manually.`;
            urlWarning.style.display = 'block';
            setTimeout(() => {
                urlWarning.style.display = 'none';
            }, 3000);
        }
    });

    clearBtn.addEventListener('click', () => {
        urlInput.value = '';
        toggleIcons(urlInput, pasteBtn, clearBtn);
        validateUrl(urlInput, urlWarning, downloadBtn, platform);
        urlInput.focus();
    });

    downloadForm.addEventListener('submit', (e) => handleFormSubmission(e, platform));

    const loadingIndicator = document.getElementById('loadingIndicator');
    const resultContainer = document.getElementById('resultContainer');
    if (loadingIndicator) loadingIndicator.style.display = 'none';
    if (resultContainer) resultContainer.style.display = 'none';
});
