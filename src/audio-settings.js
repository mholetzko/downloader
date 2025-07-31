/**
 * Audio Settings Component for ALL-DLP
 * Controls volume boost and normalization settings
 */

class AudioSettings {
    constructor() {
        this.settings = {
            volume_boost: 2.0,
            normalize_loudness: true,
            target_lufs: -16.0
        };
        this.isVisible = false;
        this.init();
    }

    async init() {
        await this.loadSettings();
        this.createUI();
        this.addEventListeners();
    }

    async loadSettings() {
        try {
            // Use Electron API bridge instead of direct fetch
            if (window.electronAPI && window.electronAPI.getAudioSettings) {
                const result = await window.electronAPI.getAudioSettings();
                if (result.success) {
                    this.settings = result.settings;
                }
            }
        } catch (error) {
            console.warn('Failed to load audio settings, using defaults:', error);
        }
    }

    async saveSettings() {
        try {
            // Use Electron API bridge instead of direct fetch
            if (window.electronAPI && window.electronAPI.updateAudioSettings) {
                const result = await window.electronAPI.updateAudioSettings(this.settings);
                if (result.success) {
                    console.log('Audio settings saved successfully');
                    this.showNotification('Audio settings saved! 🎵', 'success');
                } else {
                    throw new Error(result.error || 'Failed to save settings');
                }
            } else {
                throw new Error('Electron API not available');
            }
        } catch (error) {
            console.error('Failed to save audio settings:', error);
            this.showNotification('Failed to save audio settings', 'error');
        }
    }

    createUI() {
        // Create settings panel
        const settingsPanel = document.createElement('div');
        settingsPanel.className = 'audio-settings-panel';
        settingsPanel.innerHTML = `
            <div class="settings-header">
                <h3>🔊 Audio Settings</h3>
                <p>Make your downloaded music louder and more consistent</p>
            </div>
            
            <div class="development-notice">
                <div class="dev-badge">🚧 UNDER DEVELOPMENT</div>
                <p>Audio loudness features are currently being tested and may not work as expected.</p>
            </div>
            
            <div class="setting-group">
                <label for="volume-boost">Volume Boost:</label>
                <div class="volume-control">
                    <input type="range" id="volume-boost" min="1.0" max="5.0" step="0.1" value="${this.settings.volume_boost}">
                    <span class="volume-value">${this.settings.volume_boost}x</span>
                </div>
                <small>1.0x = normal, 2.0x = 2x louder, 5.0x = 5x louder</small>
            </div>

            <div class="setting-group">
                <label>
                    <input type="checkbox" id="normalize-loudness" ${this.settings.normalize_loudness ? 'checked' : ''}>
                    Enable Loudness Normalization
                </label>
                <small>Makes all songs have consistent volume levels</small>
            </div>

            <div class="setting-group">
                <label for="target-lufs">Target Loudness:</label>
                <select id="target-lufs">
                    <option value="-14.0" ${this.settings.target_lufs === -14.0 ? 'selected' : ''}>-14 LUFS (Very Loud)</option>
                    <option value="-16.0" ${this.settings.target_lufs === -16.0 ? 'selected' : ''}>-16 LUFS (Standard)</option>
                    <option value="-18.0" ${this.settings.target_lufs === -18.0 ? 'selected' : ''}>-18 LUFS (Quieter)</option>
                    <option value="-20.0" ${this.settings.target_lufs === -20.0 ? 'selected' : ''}>-20 LUFS (Very Quiet)</option>
                </select>
                <small>Lower values = louder overall volume</small>
            </div>

            <div class="settings-actions">
                <button id="save-audio-settings" class="btn btn-primary">💾 Save Settings</button>
                <button id="reset-audio-settings" class="btn btn-secondary">🔄 Reset to Defaults</button>
            </div>

            <div class="settings-info">
                <h4>ℹ️ How it works:</h4>
                <ul>
                    <li><strong>Volume Boost:</strong> Multiplies the audio volume (1.0x = normal, 2.0x = 6dB louder)</li>
                    <li><strong>Loudness Normalization:</strong> Analyzes the audio and adjusts it to a consistent loudness level</li>
                    <li><strong>Target LUFS:</strong> The target loudness level (lower = louder)</li>
                </ul>
                <p><strong>💡 Tip:</strong> Start with 2.0x volume boost and -16 LUFS for most music!</p>
            </div>
        `;

        // Insert into the audio settings section
        const audioSettingsSection = document.getElementById('audioSettingsSection');
        if (audioSettingsSection) {
            audioSettingsSection.appendChild(settingsPanel);
        }

        // Add styles
        this.addStyles();
    }

    addEventListeners() {
        // Add toggle functionality
        const audioSettingsBtn = document.getElementById('audioSettingsBtn');
        const audioSettingsSection = document.getElementById('audioSettingsSection');
        
        if (audioSettingsBtn && audioSettingsSection) {
            audioSettingsBtn.addEventListener('click', () => {
                this.toggleVisibility();
            });
        }

        // Add settings panel event listeners
        const volumeSlider = document.getElementById('volume-boost');
        const volumeValue = document.querySelector('.volume-value');
        const normalizeCheckbox = document.getElementById('normalize-loudness');
        const targetLufs = document.getElementById('target-lufs');
        const saveButton = document.getElementById('save-audio-settings');
        const resetButton = document.getElementById('reset-audio-settings');

        if (volumeSlider && volumeValue) {
            volumeSlider.addEventListener('input', (e) => {
                this.settings.volume_boost = parseFloat(e.target.value);
                volumeValue.textContent = `${this.settings.volume_boost}x`;
            });
        }

        if (normalizeCheckbox) {
            normalizeCheckbox.addEventListener('change', (e) => {
                this.settings.normalize_loudness = e.target.checked;
            });
        }

        if (targetLufs) {
            targetLufs.addEventListener('change', (e) => {
                this.settings.target_lufs = parseFloat(e.target.value);
            });
        }

        if (saveButton) {
            saveButton.addEventListener('click', () => {
                this.saveSettings();
            });
        }

        if (resetButton) {
            resetButton.addEventListener('click', () => {
                this.settings = {
                    volume_boost: 2.0,
                    normalize_loudness: true,
                    target_lufs: -16.0
                };
                
                if (volumeSlider) volumeSlider.value = this.settings.volume_boost;
                if (volumeValue) volumeValue.textContent = `${this.settings.volume_boost}x`;
                if (normalizeCheckbox) normalizeCheckbox.checked = this.settings.normalize_loudness;
                if (targetLufs) targetLufs.value = this.settings.target_lufs;
                
                this.saveSettings();
            });
        }
    }

    toggleVisibility() {
        const audioSettingsSection = document.getElementById('audioSettingsSection');
        const audioSettingsBtn = document.getElementById('audioSettingsBtn');
        
        if (audioSettingsSection && audioSettingsBtn) {
            this.isVisible = !this.isVisible;
            
            if (this.isVisible) {
                audioSettingsSection.style.display = 'block';
                audioSettingsBtn.style.background = '#fff';
                audioSettingsBtn.style.color = '#000';
                audioSettingsBtn.style.borderColor = '#fff';
            } else {
                audioSettingsSection.style.display = 'none';
                audioSettingsBtn.style.background = '#222';
                audioSettingsBtn.style.color = '#fff';
                audioSettingsBtn.style.borderColor = '#333';
            }
        }
    }

    addStyles() {
        const style = document.createElement('style');
        style.textContent = `
            .audio-settings-panel {
                background: #111;
                border: 1px solid #333;
                border-radius: 8px;
                padding: 2rem;
                margin: 20px 0;
                color: #fff;
            }
            
            .development-notice {
                background: #2d1b0e;
                border: 1px solid #f59e0b;
                border-radius: 6px;
                padding: 12px;
                margin-bottom: 20px;
                text-align: center;
            }
            
            .dev-badge {
                display: inline-block;
                background: #f59e0b;
                color: #111;
                padding: 4px 8px;
                border-radius: 4px;
                font-size: 0.8rem;
                font-weight: bold;
                margin-bottom: 8px;
            }
            
            .development-notice p {
                margin: 0;
                color: #fbbf24;
                font-size: 0.9rem;
            }

            .settings-header h3 {
                margin: 0 0 10px 0;
                font-size: 1.5rem;
                font-weight: 400;
                color: #fff;
            }

            .settings-header p {
                margin: 0 0 20px 0;
                color: #ccc;
                font-size: 0.9rem;
            }

            .setting-group {
                margin-bottom: 1.5rem;
            }

            .setting-group label {
                display: block;
                margin-bottom: 0.5rem;
                font-size: 0.9rem;
                color: #ccc;
                font-weight: 500;
            }

            .setting-group small {
                display: block;
                margin-top: 5px;
                color: #888;
                font-size: 0.8rem;
            }

            .volume-control {
                display: flex;
                align-items: center;
                gap: 15px;
            }

            .volume-control input[type="range"] {
                flex: 1;
                height: 6px;
                border-radius: 3px;
                background: #333;
                outline: none;
                -webkit-appearance: none;
                border: 1px solid #444;
            }

            .volume-control input[type="range"]::-webkit-slider-thumb {
                -webkit-appearance: none;
                width: 20px;
                height: 20px;
                border-radius: 50%;
                background: #fff;
                cursor: pointer;
                box-shadow: 0 2px 6px rgba(0,0,0,0.3);
            }

            .volume-control input[type="range"]::-moz-range-thumb {
                width: 20px;
                height: 20px;
                border-radius: 50%;
                background: #fff;
                cursor: pointer;
                border: none;
                box-shadow: 0 2px 6px rgba(0,0,0,0.3);
            }

            .volume-value {
                font-weight: 600;
                font-size: 1rem;
                min-width: 50px;
                text-align: center;
                color: #fff;
            }

            .setting-group input[type="checkbox"] {
                margin-right: 10px;
                transform: scale(1.2);
                accent-color: #fff;
            }

            .setting-group select {
                width: 100%;
                padding: 0.75rem;
                border-radius: 4px;
                border: 1px solid #333;
                background: #000;
                color: #fff;
                font-size: 0.9rem;
            }

            .setting-group select:focus {
                outline: none;
                border-color: #fff;
            }

            .setting-group select option {
                background: #000;
                color: #fff;
            }

            .settings-actions {
                display: flex;
                gap: 15px;
                margin: 25px 0;
            }

            .btn {
                padding: 0.75rem 1.5rem;
                border: none;
                border-radius: 4px;
                font-size: 0.9rem;
                font-weight: 500;
                cursor: pointer;
                transition: all 0.2s;
            }

            .btn-primary {
                background: #fff;
                color: #000;
            }

            .btn-primary:hover {
                background: #f0f0f0;
                transform: translateY(-1px);
            }

            .btn-secondary {
                background: #222;
                color: #fff;
                border: 1px solid #333;
            }

            .btn-secondary:hover {
                background: #333;
                border-color: #444;
                transform: translateY(-1px);
            }

            .settings-info {
                background: #000;
                border: 1px solid #333;
                border-radius: 4px;
                padding: 1.5rem;
                margin-top: 20px;
            }

            .settings-info h4 {
                margin: 0 0 15px 0;
                font-size: 1rem;
                color: #fff;
                font-weight: 500;
            }

            .settings-info ul {
                margin: 0 0 15px 0;
                padding-left: 20px;
                color: #ccc;
            }

            .settings-info li {
                margin-bottom: 8px;
                line-height: 1.4;
                font-size: 0.9rem;
            }

            .settings-info p {
                margin: 0;
                font-style: italic;
                color: #ccc;
                font-size: 0.9rem;
            }

            .notification {
                position: fixed;
                top: 20px;
                right: 20px;
                padding: 15px 20px;
                border-radius: 8px;
                color: white;
                font-weight: 600;
                z-index: 1000;
                animation: slideIn 0.3s ease;
            }

            .notification.success {
                background: #111;
                border: 1px solid #333;
                color: #4ade80;
            }

            .notification.error {
                background: #111;
                border: 1px solid #333;
                color: #f87171;
            }

            @keyframes slideIn {
                from {
                    transform: translateX(100%);
                    opacity: 0;
                }
                to {
                    transform: translateX(0);
                    opacity: 1;
                }
            }

            /* Mobile responsiveness */
            @media (max-width: 768px) {
                .audio-settings-panel {
                    padding: 1.5rem;
                    margin: 15px 0;
                }

                .settings-header h3 {
                    font-size: 1.25rem;
                }

                .settings-actions {
                    flex-direction: column;
                    gap: 10px;
                }

                .btn {
                    padding: 0.75rem 1rem;
                    font-size: 0.875rem;
                }

                .volume-control {
                    flex-direction: column;
                    gap: 10px;
                }

                .volume-value {
                    text-align: center;
                }
            }
        `;
        document.head.appendChild(style);
    }

    showNotification(message, type = 'success') {
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.textContent = message;
        
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.remove();
        }, 3000);
    }
}

// Initialize audio settings when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new AudioSettings();
});

// Export for use in other modules
window.AudioSettings = AudioSettings; 