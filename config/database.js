const path = require('path');
const sqlite3 = require('sqlite3').verbose();

class DatabaseManager {
  constructor() {
    this.dbPath = process.env.DB_PATH || path.join(__dirname, '../database/portal.sqlite');
    this.db = null;
  }

  connect() {
    return new Promise((resolve, reject) => {
      this.db = new sqlite3.Database(this.dbPath, (err) => {
        if (err) {
          console.error('❌ Database connection failed:', err.message);
          reject(err);
        } else {
          console.log('✅ Connected to SQLite database');
          resolve(this.db);
        }
      });
    });
  }

  close() {
    return new Promise((resolve, reject) => {
      if (this.db) {
        this.db.close((err) => {
          if (err) {
            reject(err);
          } else {
            console.log('✅ Database connection closed');
            resolve();
          }
        });
      } else {
        resolve();
      }
    });
  }

  getDatabase() {
    return this.db;
  }

  // Health check method
  async healthCheck() {
    return new Promise((resolve, reject) => {
      if (!this.db) {
        reject(new Error('Database not connected'));
        return;
      }

      this.db.get('SELECT 1 as test', [], (err, row) => {
        if (err) {
          reject(err);
        } else {
          resolve({ status: 'healthy', timestamp: new Date().toISOString() });
        }
      });
    });
  }
}

module.exports = new DatabaseManager();