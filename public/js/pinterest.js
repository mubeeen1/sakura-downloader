// Pinterest-specific JavaScript functionality
// Common utilities (autoscroll)
function scrollToElement(element, offset = 0) {
    if (!element) return;
    
    const elementPosition = element.getBoundingClientRect().top + window.pageYOffset;
    const offsetPosition = elementPosition - offset;
    
    window.scrollTo({
        top: offsetPosition,
        behavior: 'smooth'
    });
}

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

function toggleIcons(urlInput, pasteBtn, clearBtn) {
    if (urlInput.value.trim() === '') {
        pasteBtn.style.display = 'flex';
        clearBtn.style.display = 'none';
    } else {
        pasteBtn.style.display = 'none';
        clearBtn.style.display = 'flex';
    }
}

function validateUrl(urlInput, urlWarning, downloadBtn) {
    const url = urlInput.value.trim().toLowerCase();
    if (url === '') {
        urlWarning.style.display = 'none';
        downloadBtn.disabled = false;
        return;
    }

    const domains = ['pinterest.com', 'pin.it'];
    const isValid = domains.some(domain => url.includes(domain));
    
    if (isValid) {
        urlWarning.style.display = 'none';
        downloadBtn.disabled = false;
    } else {
        urlWarning.style.display = 'block';
        downloadBtn.disabled = true;
    }
}

async function handleFormSubmission(e) {
    e.preventDefault();
    
    const urlInput = document.getElementById('urlInput');
    const downloadBtn = document.getElementById('downloadBtn');
    const loadingIndicator = document.getElementById('loadingIndicator');
    const resultContainer = document.getElementById('resultContainer');
    const urlWarning = document.getElementById('urlWarning');
    const mediaType = document.querySelector('input[name="mediaType"]:checked').value;
    
    const url = urlInput.value.trim();
    if (!url) return;

    loadingIndicator.style.display = 'block';
    resultContainer.style.display = 'none';
    urlWarning.style.display = 'none';
    downloadBtn.disabled = true;
    downloadBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Downloading...';
    
    // Auto-scroll to loading indicator
    autoScrollToLoading();

    try {
        const response = await fetch('/pinterest/download', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ url, mediaType })
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.error || 'An error occurred during download.');
        }
        
        displayMedia(data.mediaItems, mediaType);
        
        // Auto-scroll to results after successful load
        autoScrollToResults();

    } catch (error) {
        urlWarning.innerHTML = `<i class="fas fa-exclamation-triangle"></i> ${error.message}`;
        urlWarning.style.display = 'block';
    } finally {
        loadingIndicator.style.display = 'none';
        downloadBtn.disabled = false;
        downloadBtn.innerHTML = '<i class="fas fa-download"></i> Download Media';
    }
}

function displayMedia(mediaItems, mediaType) {
  const resultContent = document.getElementById('resultContent');
  const resultContainer = document.getElementById('resultContainer');
  if (!resultContent || !resultContainer) return;

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
    
    if (item.type === 'video') {
      // Create video element for video type
      const videoElement = document.createElement('video');
      videoElement.src = item.mediaUrl;
      videoElement.controls = true;
      videoElement.className = 'media-thumbnail';
      videoElement.style.maxWidth = '100%';
      videoElement.style.maxHeight = '100%';
      mediaPreview.appendChild(videoElement);
    } else {
      // Create image element for photo type
      const thumbnailImg = document.createElement('img');
      thumbnailImg.src = item.thumbnail || item.mediaUrl;
      thumbnailImg.alt = item.title || `Media ${index + 1}`;
      thumbnailImg.className = 'media-thumbnail';
      mediaPreview.appendChild(thumbnailImg);
    }
    
    const downloadBtn = document.createElement('button');
    downloadBtn.className = 'download-media-btn';
    downloadBtn.innerHTML = `<i class="fas fa-download"></i> Download ${mediaType}`;
    
    // Use direct media URL for both video and photo downloads
    downloadBtn.addEventListener('click', function() {
      handleDirectDownload(item.downloadUrl || item.mediaUrl, item.title || `pinterest_media_${index + 1}`);
    });
    
    mediaItemDiv.appendChild(mediaPreview);
    mediaItemDiv.appendChild(downloadBtn);
    gridContainer.appendChild(mediaItemDiv);
  });
  
  resultContent.appendChild(gridContainer);
  resultContainer.style.display = 'flex';
  
  // Auto-scroll will be handled by caller function
}

function handleDirectDownload(downloadUrl, title) {
  if (!downloadUrl) return;

  // Create a direct download link using the media URL
  const link = document.createElement('a');
  link.href = downloadUrl;
  link.download = title || 'pinterest_media';
  link.target = '_blank';
  link.rel = 'noopener noreferrer';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

// Initialize Pinterest functionality
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

    toggleIcons(urlInput, pasteBtn, clearBtn);
    validateUrl(urlInput, urlWarning, downloadBtn);
    
    urlInput.addEventListener('input', () => {
        toggleIcons(urlInput, pasteBtn, clearBtn);
        validateUrl(urlInput, urlWarning, downloadBtn);
    });

    pasteBtn.addEventListener('click', async () => {
        try {
            const text = await navigator.clipboard.readText();
            if (text) {
                urlInput.value = text.split('\n')[0];
                toggleIcons(urlInput, pasteBtn, clearBtn);
                validateUrl(urlInput, urlWarning, downloadBtn);
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
        validateUrl(urlInput, urlWarning, downloadBtn);
        urlInput.focus();
    });

    downloadForm.addEventListener('submit', handleFormSubmission);

    const loadingIndicator = document.getElementById('loadingIndicator');
    const resultContainer = document.getElementById('resultContainer');
    if (loadingIndicator) loadingIndicator.style.display = 'none';
    if (resultContainer) resultContainer.style.display = 'none';
});
