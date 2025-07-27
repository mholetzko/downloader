// Global variables
let downloads = [];
let currentDownload = null;
let currentPage = 1;
const itemsPerPage = 20;

// DOM elements
const downloadForm = document.getElementById('downloadForm');
const urlInput = document.getElementById('url');
const downloadBtn = document.getElementById('downloadBtn');
const apiStatus = document.getElementById('apiStatus');
const ffmpegStatus = document.getElementById('ffmpegStatus');
const downloadsFolderStatus = document.getElementById('downloadsFolderStatus');
const downloadsList = document.getElementById('downloadsList');
const privacyLink = document.getElementById('privacyLink');
const termsLink = document.getElementById('termsLink');
const statusBtn = document.getElementById('statusBtn');
const clearDbBtn = document.getElementById('clearDbBtn');
const prevPageBtn = document.getElementById('prevPageBtn');
const nextPageBtn = document.getElementById('nextPageBtn');
const paginationInfo = document.getElementById('paginationInfo');
const paginationControls = document.getElementById('paginationControls');

// Modal functions
function openModal(modalId) {
    document.getElementById(modalId).style.display = 'block';
}

function closeModal(modalId) {
    document.getElementById(modalId).style.display = 'none';
}

// Close modal when clicking outside
window.onclick = function(event) {
    if (event.target.classList.contains('modal')) {
        event.target.style.display = 'none';
    }
}

// Event listeners
privacyLink.addEventListener('click', (e) => {
    e.preventDefault();
    openModal('privacyModal');
});

termsLink.addEventListener('click', (e) => {
    e.preventDefault();
    openModal('termsModal');
});

statusBtn.addEventListener('click', (e) => {
    e.preventDefault();
    updateStatus(); // Update status when opening modal
    openModal('statusModal');
});

clearDbBtn.addEventListener('click', async (e) => {
    e.preventDefault();
    
    // Show confirmation dialog
    if (confirm('Are you sure you want to clear all downloads? This action cannot be undone.')) {
        try {
            console.log('Clearing database...');
            
            const result = await window.electronAPI.clearDatabase();
            
            if (result.success) {
                showNotification('All downloads cleared successfully!', 'success');
                loadDownloads(); // Refresh downloads list
            } else {
                showNotification(result.error || 'Failed to clear downloads', 'error');
            }
        } catch (error) {
            console.error('Clear database error:', error);
            showNotification('Failed to clear downloads: ' + error.message, 'error');
        }
    }
});

// Pagination event listeners
prevPageBtn.addEventListener('click', () => {
    if (currentPage > 1) {
        currentPage--;
        renderDownloads();
    }
});

nextPageBtn.addEventListener('click', () => {
    const totalPages = Math.ceil(downloads.length / itemsPerPage);
    if (currentPage < totalPages) {
        currentPage++;
        renderDownloads();
    }
});

// Handle external links
document.addEventListener('click', (e) => {
    if (e.target.tagName === 'A' && e.target.href && e.target.href.startsWith('http')) {
        e.preventDefault();
        window.electronAPI.openExternal(e.target.href);
    }
});

// Helper: Detect playlist URL
function isPlaylistUrl(url) {
    const lower = url.toLowerCase();
    // Spotify: /playlist/
    if (lower.includes('spotify.com/playlist/')) return true;
    // SoundCloud: /sets/ only
    if (lower.includes('/sets/')) return true;
    return false;
}

let pendingPlaylistUrl = null;

// Playlist confirmation modal logic
const playlistConfirmModal = document.getElementById('playlistConfirmModal');
const playlistConfirmOk = document.getElementById('playlistConfirmOk');
const playlistConfirmCancel = document.getElementById('playlistConfirmCancel');

if (playlistConfirmOk && playlistConfirmCancel && playlistConfirmModal) {
    playlistConfirmOk.onclick = async function () {
        closeModal('playlistConfirmModal');
        if (pendingPlaylistUrl) {
            await startDownload(pendingPlaylistUrl);
            pendingPlaylistUrl = null;
        }
    };
    playlistConfirmCancel.onclick = function () {
        closeModal('playlistConfirmModal');
        pendingPlaylistUrl = null;
    };
}

async function startDownload(url) {
    downloadBtn.disabled = true;
    downloadBtn.textContent = 'Downloading...';
    try {
        const downloadPromise = window.electronAPI.startDownload(url);
        const timeoutPromise = new Promise((_, reject) => 
            setTimeout(() => reject(new Error('Download request timed out')), 30000)
        );
        const result = await Promise.race([downloadPromise, timeoutPromise]);
        if (result.success) {
            showNotification('Download started successfully!', 'success');
            urlInput.value = '';
            loadDownloads();
        } else {
            showNotification(result.error || 'Download failed', 'error');
        }
    } catch (error) {
        console.error('Download error:', error);
        showNotification('Download failed: ' + error.message, 'error');
    } finally {
        downloadBtn.disabled = false;
        downloadBtn.textContent = 'Download';
    }
}

// Intercept form submit for playlist detection
downloadForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const url = urlInput.value.trim();
    if (!url) return;
    if (isPlaylistUrl(url)) {
        pendingPlaylistUrl = url;
        openModal('playlistConfirmModal');
        return;
    }
    await startDownload(url);
});

// Status updates
async function updateStatus() {
    try {
        // Check API server status
        const apiResult = await window.electronAPI.checkApiStatus();
        apiStatus.textContent = apiResult ? 'Running' : 'Not Running';
        apiStatus.className = `status-value ${apiResult ? 'success' : 'error'}`;

        // Check FFmpeg status
        const ffmpegResult = await window.electronAPI.checkFfmpegStatus();
        ffmpegStatus.textContent = ffmpegResult ? 'Available' : 'Not Found';
        ffmpegStatus.className = `status-value ${ffmpegResult ? 'success' : 'error'}`;

        // Check downloads folder
        const downloadsResult = await window.electronAPI.checkDownloadsFolder();
        downloadsFolderStatus.textContent = downloadsResult ? 'Ready' : 'Not Accessible';
        downloadsFolderStatus.className = `status-value ${downloadsResult ? 'success' : 'error'}`;

        // Update status button appearance based on overall status
        const allSystemsOk = apiResult && ffmpegResult && downloadsResult;
        if (allSystemsOk) {
            statusBtn.style.borderColor = '#4ade80';
            statusBtn.style.color = '#4ade80';
            statusBtn.classList.remove('error');
        } else {
            statusBtn.style.borderColor = '#f87171';
            statusBtn.style.color = '#f87171';
            statusBtn.classList.add('error');
        }

    } catch (error) {
        console.error('Status update error:', error);
        apiStatus.textContent = 'Error';
        apiStatus.className = 'status-value error';
        statusBtn.style.borderColor = '#f87171';
        statusBtn.style.color = '#f87171';
        statusBtn.classList.add('error');
    }
}

// Load downloads
async function loadDownloads() {
    try {
        downloads = await window.electronAPI.getDownloads();
        
        // Reset to first page when loading new data
        currentPage = 1;
        
        // Show/hide clear button based on whether there are downloads
        if (downloads.length === 0) {
            clearDbBtn.style.display = 'none';
            downloadsList.innerHTML = '<p style="color: #666; text-align: center;">No downloads yet</p>';
            paginationControls.style.display = 'none';
            return;
        } else {
            clearDbBtn.style.display = 'block';
        }

        renderDownloads();

    } catch (error) {
        console.error('Load downloads error:', error);
        downloadsList.innerHTML = '<p style="color: #f87171; text-align: center;">Error loading downloads</p>';
    }
}

// Render downloads with pagination
function renderDownloads() {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const pageDownloads = downloads.slice(startIndex, endIndex);
    const totalPages = Math.ceil(downloads.length / itemsPerPage);

    // Create table structure
    const tableHTML = `
        <table class="downloads-table">
            <thead>
                <tr>
                    <th>Title</th>
                    <th>Source</th>
                    <th>Status</th>
                    <th>File</th>
                </tr>
            </thead>
            <tbody>
                ${pageDownloads.map((download, index) => {
                    // Use title from database, fallback to filename extraction
                    let title = 'Unknown Title';
                    
                    // First priority: Use title from database
                    if (download.title && download.title !== 'Unknown Title') {
                        title = download.title;
                    } else if (download.file_path && download.status === 'completed') {
                        // Fallback: Extract filename without extension and clean it up
                        const filename = download.file_path.split('/').pop();
                        title = filename.replace(/\.[^/.]+$/, '') // Remove file extension
                            .replace(/[-_]/g, ' ') // Replace dashes and underscores with spaces
                            .replace(/\s+/g, ' ') // Replace multiple spaces with single space
                            .trim();
                        
                        // If it's a duplicate filename, add a number
                        const duplicateCount = downloads.filter((d, i) => 
                            i < startIndex + index && 
                            d.file_path && 
                            d.file_path.split('/').pop() === filename
                        ).length;
                        
                        if (duplicateCount > 0) {
                            title += ` (${duplicateCount + 1})`;
                        }
                    } else if (download.url) {
                        // Fallback: Extract domain and path from URL for better title
                        try {
                            const url = new URL(download.url);
                            if (url.hostname.includes('youtube.com')) {
                                title = 'YouTube Video';
                            } else if (url.hostname.includes('spotify.com')) {
                                title = 'Spotify Track';
                            } else if (url.hostname.includes('soundcloud.com')) {
                                title = 'SoundCloud Track';
                            } else {
                                title = url.hostname.replace('www.', '');
                            }
                        } catch (e) {
                            title = 'Unknown Source';
                        }
                    }
                    
                    // Truncate title if too long
                    if (title.length > 30) {
                        title = title.substring(0, 27) + '...';
                    }

                    // Create file link if file exists
                    let fileLink = '';
                    if (download.file_path && download.status === 'completed') {
                        const filename = download.file_path.split('/').pop();
                        // Show full filename with UUID
                        fileLink = `<button class="file-link-btn" onclick="openFileInSystem('${download.file_path}')" title="${filename}">📁 ${filename}</button>`;
                    } else if (download.status === 'file_missing') {
                        fileLink = `<div class="file-missing">
                            <span class="missing-text">File not found</span>
                            <button class="redownload-btn" onclick="redownloadFile('${download.id}')">Download Again</button>
                        </div>`;
                    } else if (download.status === 'downloading') {
                        fileLink = '<span class="downloading-text">Downloading...</span>';
                    } else if (download.status === 'failed') {
                        fileLink = '<span class="failed-text">Failed</span>';
                    } else {
                        fileLink = '<span class="pending-text">Pending</span>';
                    }

                    // Create source link
                    const sourceLink = `<a href="${download.url}" target="_blank" class="source-link">${new URL(download.url).hostname.replace('www.', '')}</a>`;

                    return `
                        <tr class="download-row ${download.status}">
                            <td class="download-title">${title}</td>
                            <td class="download-source">${sourceLink}</td>
                            <td class="download-status">
                                <span class="status-badge ${download.status}">${getStatusText(download.status)}</span>
                                ${download.progress && download.status === 'downloading' ? `
                                    <div class="progress-bar">
                                        <div class="progress-fill" style="width: ${download.progress}%"></div>
                                    </div>
                                ` : ''}
                            </td>
                            <td class="download-file">${fileLink}</td>
                        </tr>
                        ${download.error ? `
                            <tr class="error-row">
                                <td colspan="4" class="download-error">Error: ${download.error}</td>
                            </tr>
                        ` : ''}
                    `;
                }).join('')}
            </tbody>
        </table>
    `;

    downloadsList.innerHTML = tableHTML;

    // Update pagination controls
    if (totalPages > 1) {
        paginationControls.style.display = 'flex';
        paginationInfo.textContent = `Page ${currentPage} of ${totalPages}`;
        prevPageBtn.disabled = currentPage === 1;
        nextPageBtn.disabled = currentPage === totalPages;
    } else {
        paginationControls.style.display = 'none';
    }
}

// Function to open file in system file manager
function openFileInSystem(filePath) {
    window.electronAPI.openFileInSystem(filePath);
}

// Function to re-download a file
async function redownloadFile(downloadId) {
    try {
        console.log('Re-downloading file:', downloadId);
        
        const result = await window.electronAPI.redownloadFile(downloadId);
        
        if (result.success) {
            showNotification('Re-download started successfully!', 'success');
            loadDownloads(); // Refresh downloads list
        } else {
            showNotification(result.error || 'Re-download failed', 'error');
        }
    } catch (error) {
        console.error('Re-download error:', error);
        showNotification('Re-download failed: ' + error.message, 'error');
    }
}

function getStatusText(status) {
    switch (status) {
        case 'completed': return 'Completed';
        case 'failed': return 'Failed';
        case 'downloading': return 'Downloading...';
        case 'file_missing': return 'File Missing';
        default: return 'Unknown';
    }
}

// Show notification
function showNotification(message, type = 'info') {
    // Create notification element
    const notification = document.createElement('div');
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 1rem 1.5rem;
        border-radius: 4px;
        color: #fff;
        font-weight: 500;
        z-index: 1001;
        max-width: 300px;
        word-wrap: break-word;
    `;

    // Set background color based on type
    switch (type) {
        case 'success':
            notification.style.background = '#4ade80';
            break;
        case 'error':
            notification.style.background = '#f87171';
            break;
        case 'warning':
            notification.style.background = '#fbbf24';
            break;
        default:
            notification.style.background = '#60a5fa';
    }

    notification.textContent = message;
    document.body.appendChild(notification);

    // Remove after 3 seconds
    setTimeout(() => {
        if (notification.parentNode) {
            notification.parentNode.removeChild(notification);
        }
    }, 3000);
}

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    updateStatus();
    loadDownloads();
    
    // Update status every 5 seconds
    setInterval(updateStatus, 5000);
    
    // Update downloads every 2 seconds
    setInterval(loadDownloads, 2000);
}); 