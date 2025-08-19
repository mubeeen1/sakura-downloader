// YouTube-specific functionality for scraping integration
class YouTubeHandler {
    constructor() {
        this.currentVideoData = null;
        this.init();
    }

    init() {
        this.setupEventListeners();
    }

    setupEventListeners() {
        // Setup form submission handler
        const form = document.getElementById('downloadForm');
        if (form) {
            form.addEventListener('submit', (e) => this.handleFormSubmission(e));
        }

        // Setup input handlers (YouTube-specific)
        this.setupInputHandlers();
    }

    setupInputHandlers() {
        const urlInput = document.getElementById('urlInput');
        const pasteBtn = document.getElementById('pasteBtn');
        const clearBtn = document.getElementById('clearBtn');
        const urlWarning = document.getElementById('urlWarning');
        const downloadBtn = document.getElementById('downloadBtn');

        if (!urlInput || !pasteBtn || !clearBtn || !urlWarning || !downloadBtn) {
            console.error('YouTube: Required input elements not found');
            return;
        }

        // Initial state
        this.toggleInputIcons(urlInput, pasteBtn, clearBtn);
        this.validateYouTubeUrl(urlInput, urlWarning, downloadBtn);

        // Input event listeners
        urlInput.addEventListener('input', () => {
            this.toggleInputIcons(urlInput, pasteBtn, clearBtn);
            this.validateYouTubeUrl(urlInput, urlWarning, downloadBtn);
        });

        pasteBtn.addEventListener('click', async () => {
            try {
                const text = await navigator.clipboard.readText();
                if (text) {
                    urlInput.value = text.split('\n')[0];
                    this.toggleInputIcons(urlInput, pasteBtn, clearBtn);
                    this.validateYouTubeUrl(urlInput, urlWarning, downloadBtn);
                }
            } catch (err) {
                console.error('Clipboard read error:', err);
                this.showError('Could not access clipboard. Please paste manually.');
            }
        });

        clearBtn.addEventListener('click', () => {
            urlInput.value = '';
            this.toggleInputIcons(urlInput, pasteBtn, clearBtn);
            this.validateYouTubeUrl(urlInput, urlWarning, downloadBtn);
            urlInput.focus();
        });
    }

    toggleInputIcons(urlInput, pasteBtn, clearBtn) {
        if (urlInput.value.trim() === '') {
            pasteBtn.style.display = 'flex';
            clearBtn.style.display = 'none';
        } else {
            pasteBtn.style.display = 'none';
            clearBtn.style.display = 'flex';
        }
    }

    validateYouTubeUrl(urlInput, urlWarning, downloadBtn) {
        const url = urlInput.value.trim().toLowerCase();
        if (url === '') {
            urlWarning.style.display = 'none';
            downloadBtn.disabled = false;
            return;
        }

        const youtubeDomains = ['youtube.com', 'youtu.be', 'm.youtube.com', 'youtube-nocookie.com'];
        const isValid = youtubeDomains.some(domain => url.includes(domain));
        
        if (isValid) {
            urlWarning.style.display = 'none';
            downloadBtn.disabled = false;
        } else {
            urlWarning.innerHTML = '<i class="fas fa-exclamation-triangle"></i> Not a valid YouTube URL. Please check and try again.';
            urlWarning.style.display = 'block';
            downloadBtn.disabled = true;
        }
    }

    async handleFormSubmission(e) {
        e.preventDefault();
        
        const urlInput = document.getElementById('urlInput');
        const downloadBtn = document.getElementById('downloadBtn');
        const loadingIndicator = document.getElementById('loadingIndicator');
        const resultContainer = document.getElementById('resultContainer');
        
        const url = urlInput.value.trim();
        if (!url) return;

        // Show loading state
        loadingIndicator.style.display = 'block';
        resultContainer.style.display = 'none';
        downloadBtn.disabled = true;
        downloadBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Fetching video info...';
        
        // Auto scroll to loading indicator
        this.autoScrollToLoading();

        try {
            const response = await fetch('/api/youtube/info', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ url })
            });

            const data = await response.json();

            if (!response.ok || !data.success) {
                throw new Error(data.error || 'Failed to fetch video info');
            }

            this.currentVideoData = data.data;
            this.displayVideoInfo(data.data);
            this.autoScrollToResults();
            
            // Change button to reset after successful fetch
            downloadBtn.innerHTML = '<i class="fas fa-refresh"></i> Reset';
            downloadBtn.onclick = () => this.resetForm();

        } catch (error) {
            this.showError(error.message);
            downloadBtn.disabled = false;
            downloadBtn.innerHTML = '<i class="fas fa-download"></i> Fetch Video Info';
        } finally {
            loadingIndicator.style.display = 'none';
        }
    }

    displayVideoInfo(videoData) {
        const resultContainer = document.getElementById('resultContainer');
        const resultContent = document.getElementById('resultContent');
        
        if (!resultContent || !resultContainer) return;

        let html = `
            <div class="yt-media-preview-container">
                <div class="yt-thumbnail-display">
                    <img src="${videoData.thumbnail}" alt="${this.escapeHtml(videoData.title)}" />
                </div>
                
                <div class="yt-video-info">
                    <h3 class="yt-video-title">${this.escapeHtml(videoData.title)}</h3>
                    <div class="yt-video-details">
                        <div class="yt-video-detail">
                            <strong>Duration</strong>
                            ${this.formatDuration(videoData.duration)}
                        </div>
                        <div class="yt-video-detail">
                            <strong>Channel</strong>
                            ${this.escapeHtml(videoData.author)}
                        </div>
                    </div>
                </div>
                
                <div class="yt-format-options-list">
        `;

        if (videoData.formats && videoData.formats.length > 0) {
            videoData.formats.forEach((format, index) => {
                html += `
                    <div class="yt-format-strap">
                        <div class="yt-format-details">
                            <div class="yt-format-type-quality">
                                <span class="yt-format-type">${format.type.toUpperCase()}</span>
                                <span class="yt-format-quality">${this.escapeHtml(format.quality)}</span>
                            </div>
                            <span class="yt-format-size">${this.escapeHtml(format.size || 'Unknown size')}</span>
                        </div>
                        <button class="yt-convert-button" 
                                onclick="youtubeHandler.convertVideo('${this.escapeAttribute(format.key)}', '${this.escapeAttribute(format.label)}', ${index})" 
                                id="convertBtn${index}">
                            <i class="fas fa-magic"></i> Convert
                        </button>
                    </div>
                `;
            });
        } else {
            html += '<p style="text-align: center; color: rgba(255, 255, 255, 0.7);">No download formats available for this video.</p>';
        }

        html += `
                </div>
                
                <button type="button" class="yt-reset-button" onclick="youtubeHandler.resetForm()">
                    <i class="fas fa-refresh"></i> Reset & Search New
                </button>
            </div>
        `;

        resultContent.innerHTML = html;
        resultContainer.style.display = 'flex';
        this.autoScrollToResults();
    }

    async convertVideo(k, label, buttonIndex) {
        if (!this.currentVideoData) return;

        const convertBtn = document.getElementById(`convertBtn${buttonIndex}`);
        if (!convertBtn) return;
        
        const originalText = convertBtn.innerHTML;
        convertBtn.disabled = true;
        convertBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Converting...';

        try {
            const response = await fetch('/api/youtube/convert', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    vid: this.currentVideoData.vid,
                    k: k
                })
            });

            const data = await response.json();

            if (!response.ok || !data.success) {
                throw new Error(data.error || 'Conversion failed');
            }

            this.showDownloadModal(data.data);

        } catch (error) {
            this.showError(error.message);
        } finally {
            convertBtn.disabled = false;
            convertBtn.innerHTML = originalText;
        }
    }

    showDownloadModal(downloadData) {
        // Create overlay
        const overlay = document.createElement('div');
        overlay.className = 'yt-modal-overlay';
        
        // Create modal
        const modal = document.createElement('div');
        modal.className = 'yt-download-modal';

        modal.innerHTML = `
            <button class="yt-modal-close">
                <i class="fas fa-times"></i>
            </button>
            
            <div class="yt-modal-header">
                <h3>🎉 File Ready for Download!</h3>
            </div>
            
            <div class="yt-modal-content">
                <p><strong>Title:</strong> ${this.escapeHtml(downloadData.title)}</p>
                <p><strong>Format:</strong> ${this.escapeHtml(downloadData.format.toUpperCase())}</p>
                <p><strong>Quality:</strong> ${this.escapeHtml(downloadData.quality)}</p>
            </div>
            
            <div class="yt-modal-footer">
                <a href="${this.escapeAttribute(downloadData.downloadUrl)}" 
                   class="yt-download-link" 
                   download="${this.escapeAttribute(downloadData.title)}">
                    <i class="fas fa-download"></i> Download Now
                </a>
            </div>
        `;

        overlay.appendChild(modal);
        document.body.appendChild(overlay);

        // Close modal functionality
        const closeModal = () => {
            overlay.classList.remove('show');
            setTimeout(() => {
                if (overlay.parentNode) {
                    overlay.parentNode.removeChild(overlay);
                }
            }, 300);
        };

        overlay.addEventListener('click', (e) => {
            if (e.target === overlay) closeModal();
        });

        const closeBtn = modal.querySelector('.yt-modal-close');
        if (closeBtn) {
            closeBtn.addEventListener('click', closeModal);
        }

        // Show modal with animation
        setTimeout(() => overlay.classList.add('show'), 10);
    }

    resetForm() {
        console.log('YouTube: Resetting form and clearing all UI elements');
        
        // Reset form state without page reload
        const urlInput = document.getElementById('urlInput');
        const downloadBtn = document.getElementById('downloadBtn');
        const resultContainer = document.getElementById('resultContainer');
        const resultContent = document.getElementById('resultContent');
        const urlWarning = document.getElementById('urlWarning');
        const loadingIndicator = document.getElementById('loadingIndicator');
        const pasteBtn = document.getElementById('pasteBtn');
        const clearBtn = document.getElementById('clearBtn');
        
        // Clear input
        if (urlInput) urlInput.value = '';
        
        // Completely clear result content - this prevents any old UI from persisting
        if (resultContent) {
            resultContent.innerHTML = '';
        }
        
        // Hide results and loading
        if (resultContainer) resultContainer.style.display = 'none';
        if (loadingIndicator) loadingIndicator.style.display = 'none';
        
        // Reset button
        if (downloadBtn) {
            downloadBtn.innerHTML = '<i class="fas fa-download"></i> Fetch Video Info';
            downloadBtn.disabled = false;
            downloadBtn.onclick = null; // Remove reset handler
        }
        
        // Hide warnings
        if (urlWarning) urlWarning.style.display = 'none';
        
        // Reset input buttons
        if (pasteBtn && clearBtn) {
            this.toggleInputIcons(urlInput, pasteBtn, clearBtn);
        }
        
        // Remove any non-YouTube UI elements that might have been added
        this.forceRemoveNonYouTubeElements();
        
        // Clear current video data
        this.currentVideoData = null;
        
        // Focus on input
        if (urlInput) urlInput.focus();
        
        // Scroll to top
        window.scrollTo({ top: 0, behavior: 'smooth' });
        
        console.log('YouTube: Form reset complete');
    }

    forceRemoveNonYouTubeElements() {
        // Remove any elements with non-YouTube classes that might have been created
        const nonYouTubeSelectors = [
            '.media-preview:not(.yt-media-preview-container)',
            '.media-item:not(.yt-format-strap)',
            '.media-grid:not(.yt-format-options-list)',
            '.download-media-btn:not(.yt-convert-button):not(.yt-download-link)',
            '.media-thumbnail:not(.yt-thumbnail-display img)',
            '.media-count'
        ];
        
        nonYouTubeSelectors.forEach(selector => {
            const elements = document.querySelectorAll(selector);
            elements.forEach(element => {
                if (element.parentNode) {
                    element.parentNode.removeChild(element);
                }
            });
        });
        
        console.log('YouTube: Removed non-YouTube UI elements');
    }

    showError(message) {
        const urlWarning = document.getElementById('urlWarning');
        if (urlWarning) {
            urlWarning.innerHTML = '<i class="fas fa-exclamation-triangle"></i> ' + message;
            urlWarning.style.display = 'block';
        }
    }

    formatDuration(seconds) {
        if (!seconds || isNaN(seconds)) return 'Unknown';
        
        const hours = Math.floor(seconds / 3600);
        const minutes = Math.floor((seconds % 3600) / 60);
        const remainingSeconds = seconds % 60;
        
        if (hours > 0) {
            return `${hours}:${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
        } else {
            return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
        }
    }

    escapeHtml(text) {
        if (!text) return '';
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    escapeAttribute(text) {
        if (!text) return '';
        return text.replace(/"/g, '&quot;').replace(/'/g, '&#39;');
    }

    // Autoscroll functionality for YouTube page
    scrollToElement(element, offset = 0) {
        if (!element) return;
        
        const elementPosition = element.getBoundingClientRect().top + window.pageYOffset;
        const offsetPosition = elementPosition - offset;
        
        window.scrollTo({
            top: offsetPosition,
            behavior: 'smooth'
        });
    }

    autoScrollToLoading() {
        const loadingIndicator = document.getElementById('loadingIndicator');
        if (loadingIndicator) {
            setTimeout(() => {
                this.scrollToElement(loadingIndicator, 100);
            }, 100);
        }
    }

    autoScrollToResults() {
        const resultContainer = document.getElementById('resultContainer');
        if (resultContainer) {
            setTimeout(() => {
                this.scrollToElement(resultContainer, 100);
            }, 300);
        }
    }
}

const youtubeHandler = new YouTubeHandler();
