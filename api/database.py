import sqlite3
import os
import threading
from pathlib import Path
from datetime import datetime

class DownloadDatabase:
    def __init__(self):
        # Create database in the user's home directory for write permissions
        home_dir = Path.home()
        app_data_dir = home_dir / ".all-dlp"
        app_data_dir.mkdir(exist_ok=True)
        
        db_path = app_data_dir / "downloads.db"
        self.db_path = str(db_path)
        self._local = threading.local()
        self.init_database()
    
    def _get_connection(self):
        """Get a database connection for the current thread"""
        if not hasattr(self._local, 'connection'):
            self._local.connection = sqlite3.connect(self.db_path)
            self._local.connection.row_factory = sqlite3.Row
        return self._local.connection
    
    def init_database(self):
        """Initialize the database with the required tables"""
        try:
            conn = self._get_connection()
            cursor = conn.cursor()
            
            # Create downloads table
            cursor.execute('''
                CREATE TABLE IF NOT EXISTS downloads (
                    id TEXT PRIMARY KEY,
                    url TEXT NOT NULL,
                    title TEXT,
                    artist TEXT,
                    album TEXT,
                    platform TEXT,
                    status TEXT DEFAULT 'pending',
                    progress REAL DEFAULT 0,
                    file_path TEXT,
                    file_size INTEGER,
                    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                    completed_at DATETIME,
                    error TEXT
                )
            ''')
            
            # Create audio_settings table
            cursor.execute('''
                CREATE TABLE IF NOT EXISTS audio_settings (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    volume_boost REAL DEFAULT 2.0,
                    normalize_loudness BOOLEAN DEFAULT 1,
                    target_lufs REAL DEFAULT -16.0,
                    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
                )
            ''')
            
            # Insert default audio settings if table is empty
            cursor.execute('SELECT COUNT(*) FROM audio_settings')
            if cursor.fetchone()[0] == 0:
                cursor.execute('''
                    INSERT INTO audio_settings (volume_boost, normalize_loudness, target_lufs)
                    VALUES (2.0, 1, -16.0)
                ''')
            
            # Add album column if it doesn't exist (for existing databases)
            try:
                cursor.execute('ALTER TABLE downloads ADD COLUMN album TEXT')
                print("Added album column to existing database")
            except sqlite3.OperationalError:
                # Column already exists
                pass
            
            conn.commit()
            print(f"Database initialized successfully at: {self.db_path}")
        except Exception as e:
            print(f"Error initializing database: {e}")
            print(f"Database path: {self.db_path}")
            raise
    
    def add_download(self, id, url, platform, title=None, artist=None):
        """Add a new download to the database"""
        conn = self._get_connection()
        cursor = conn.cursor()
        cursor.execute('''
            INSERT INTO downloads (id, url, platform, title, artist, status)
            VALUES (?, ?, ?, ?, ?, 'pending')
        ''', (id, url, platform, title, artist))
        conn.commit()
    
    def update_status(self, id, status, progress=None, file_path=None, file_size=None, error=None):
        """Update download status"""
        conn = self._get_connection()
        cursor = conn.cursor()
        
        # Build the SQL query dynamically based on what parameters are provided
        set_parts = ['status = ?']
        params = [status]
        
        if progress is not None:
            set_parts.append('progress = ?')
            params.append(progress)
        
        if file_path is not None:
            set_parts.append('file_path = ?')
            params.append(file_path)
        
        if file_size is not None:
            set_parts.append('file_size = ?')
            params.append(file_size)
        
        if error is not None:
            set_parts.append('error = ?')
            params.append(error)
        
        if status == 'completed':
            set_parts.append('completed_at = CURRENT_TIMESTAMP')
        
        sql = f"UPDATE downloads SET {', '.join(set_parts)} WHERE id = ?"
        params.append(id)
        
        cursor.execute(sql, params)
        conn.commit()
    
    def get_downloads(self):
        """Get all downloads from the database"""
        conn = self._get_connection()
        cursor = conn.cursor()
        cursor.execute('''
            SELECT * FROM downloads 
            ORDER BY created_at DESC
        ''')
        
        # Convert sqlite3.Row objects to dictionaries
        rows = cursor.fetchall()
        downloads = []
        for row in rows:
            download = dict(row)
            downloads.append(download)
        
        return downloads
    
    def get_download(self, id):
        """Get a specific download by ID"""
        conn = self._get_connection()
        cursor = conn.cursor()
        cursor.execute('SELECT * FROM downloads WHERE id = ?', (id,))
        row = cursor.fetchone()
        
        if row:
            return dict(row)
        return None
    
    def delete_download(self, id):
        """Delete a download from the database"""
        conn = self._get_connection()
        cursor = conn.cursor()
        cursor.execute('DELETE FROM downloads WHERE id = ?', (id,))
        conn.commit()
    
    def verify_file_exists(self, id):
        """Check if file exists and update status if needed"""
        download = self.get_download(id)
        if download and download.get('file_path'):
            if os.path.exists(download['file_path']):
                stats = os.stat(download['file_path'])
                self.update_status(id, 'completed', 100, download['file_path'], stats.st_size)
                return True
            else:
                self.update_status(id, 'failed', 0, None, None, 'File not found')
                return False
        return False
    
    def close(self):
        """Close the database connection"""
        if hasattr(self._local, 'connection'):
            self._local.connection.close()
            delattr(self._local, 'connection')
    
    # Alias methods for compatibility with the existing code
    def addDownload(self, id, url, platform, title=None, artist=None):
        return self.add_download(id, url, platform, title, artist)
    
    def updateStatus(self, id, status, progress=None, file_path=None, file_size=None, error=None):
        return self.update_status(id, status, progress, file_path, file_size, error)
    
    def getDownloads(self):
        return self.get_downloads()
    
    def getDownload(self, id):
        return self.get_download(id)
    
    def deleteDownload(self, id):
        return self.delete_download(id)
    
    def verifyFileExists(self, id):
        return self.verify_file_exists(id)
    
    def update_title(self, id, title):
        """Update the title of a download"""
        conn = self._get_connection()
        cursor = conn.cursor()
        cursor.execute('UPDATE downloads SET title = ? WHERE id = ?', (title, id))
        conn.commit()
    
    def update_artist(self, id, artist):
        """Update the artist of a download"""
        conn = self._get_connection()
        cursor = conn.cursor()
        cursor.execute('UPDATE downloads SET artist = ? WHERE id = ?', (artist, id))
        conn.commit()
    
    def update_album(self, id, album):
        """Update the album of a download"""
        conn = self._get_connection()
        cursor = conn.cursor()
        cursor.execute('UPDATE downloads SET album = ? WHERE id = ?', (album, id))
        conn.commit()
    
    def clear_all_downloads(self):
        """Clear all downloads from the database"""
        try:
            conn = self._get_connection()
            cursor = conn.cursor()
            cursor.execute('DELETE FROM downloads')
            conn.commit()
            print(f"Successfully cleared all downloads from database: {self.db_path}")
        except Exception as e:
            print(f"Error clearing downloads: {e}")
            print(f"Database path: {self.db_path}")
            raise
    
    def clearAllDownloads(self):
        """Clear all downloads from the database"""
        conn = self._get_connection()
        cursor = conn.cursor()
        cursor.execute('DELETE FROM downloads')
        conn.commit()
    
    def get_audio_settings(self):
        """Get the current audio settings"""
        conn = self._get_connection()
        cursor = conn.cursor()
        cursor.execute('SELECT volume_boost, normalize_loudness, target_lufs FROM audio_settings ORDER BY id DESC LIMIT 1')
        row = cursor.fetchone()
        if row:
            return {
                'volume_boost': row[0],
                'normalize_loudness': bool(row[1]),
                'target_lufs': row[2]
            }
        else:
            # Return defaults if no settings found
            return {
                'volume_boost': 2.0,
                'normalize_loudness': True,
                'target_lufs': -16.0
            }
    
    def update_audio_settings(self, volume_boost, normalize_loudness, target_lufs):
        """Update the audio settings"""
        conn = self._get_connection()
        cursor = conn.cursor()
        cursor.execute('''
            UPDATE audio_settings 
            SET volume_boost = ?, normalize_loudness = ?, target_lufs = ?, updated_at = CURRENT_TIMESTAMP
            WHERE id = (SELECT MAX(id) FROM audio_settings)
        ''', (volume_boost, 1 if normalize_loudness else 0, target_lufs))
        conn.commit() 