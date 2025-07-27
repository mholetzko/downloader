const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

class DownloadDatabase {
    constructor() {
        // Create database in the downloads directory
        const downloadsDir = path.join(process.env.HOME || process.env.USERPROFILE, 'Downloads', 'bB-downloader');
        
        // Ensure downloads directory exists
        if (!fs.existsSync(downloadsDir)) {
            fs.mkdirSync(downloadsDir, { recursive: true });
        }
        
        const dbPath = path.join(downloadsDir, 'downloads.db');
        this.db = new Database(dbPath);
        this.initDatabase();
    }

    initDatabase() {
        // Create downloads table
        this.db.exec(`
            CREATE TABLE IF NOT EXISTS downloads (
                id TEXT PRIMARY KEY,
                url TEXT NOT NULL,
                title TEXT,
                artist TEXT,
                platform TEXT,
                status TEXT DEFAULT 'pending',
                progress REAL DEFAULT 0,
                file_path TEXT,
                file_size INTEGER,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                completed_at DATETIME,
                error TEXT
            )
        `);
    }

    // Add a new download
    addDownload(id, url, platform, title = null, artist = null) {
        const stmt = this.db.prepare(`
            INSERT INTO downloads (id, url, platform, title, artist, status)
            VALUES (?, ?, ?, ?, ?, 'pending')
        `);
        stmt.run(id, url, platform, title, artist);
    }

    // Update download status
    updateStatus(id, status, progress = null, filePath = null, fileSize = null, error = null) {
        let sql = 'UPDATE downloads SET status = ?';
        let params = [status];

        if (progress !== null) {
            sql += ', progress = ?';
            params.push(progress);
        }

        if (filePath !== null) {
            sql += ', file_path = ?';
            params.push(filePath);
        }

        if (fileSize !== null) {
            sql += ', file_size = ?';
            params.push(fileSize);
        }

        if (error !== null) {
            sql += ', error = ?';
            params.push(error);
        }

        if (status === 'completed') {
            sql += ', completed_at = CURRENT_TIMESTAMP';
        }

        sql += ' WHERE id = ?';
        params.push(id);

        const stmt = this.db.prepare(sql);
        stmt.run(...params);
    }

    // Get all downloads
    getDownloads() {
        const stmt = this.db.prepare(`
            SELECT * FROM downloads 
            ORDER BY created_at DESC
        `);
        return stmt.all();
    }

    // Get download by ID
    getDownload(id) {
        const stmt = this.db.prepare('SELECT * FROM downloads WHERE id = ?');
        return stmt.get(id);
    }

    // Delete download
    deleteDownload(id) {
        const stmt = this.db.prepare('DELETE FROM downloads WHERE id = ?');
        stmt.run(id);
    }

    // Check if file exists and update status if needed
    verifyFileExists(id) {
        const download = this.getDownload(id);
        if (download && download.file_path) {
            if (fs.existsSync(download.file_path)) {
                const stats = fs.statSync(download.file_path);
                this.updateStatus(id, 'completed', 100, download.file_path, stats.size);
                return true;
            } else {
                this.updateStatus(id, 'failed', 0, null, null, 'File not found');
                return false;
            }
        }
        return false;
    }

    // Close database
    close() {
        if (this.db) {
            this.db.close();
        }
    }
}

module.exports = DownloadDatabase; 