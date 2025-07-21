const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const os = require('os');

/**
 * Secure storage for sensitive configuration values
 * Uses encryption for file-based storage
 */
class SecureStorage {
  constructor() {
    this.storageDir = path.join(os.homedir(), '.claudebuild', 'secure');
    this.storageFile = path.join(this.storageDir, 'credentials.enc');
    this.algorithm = 'aes-256-gcm';
    this.keyDerivationIterations = 100000;
    
    this.ensureStorageDir();
  }

  ensureStorageDir() {
    if (!fs.existsSync(this.storageDir)) {
      fs.mkdirSync(this.storageDir, { recursive: true, mode: 0o700 });
    }
  }

  /**
   * Get the machine-specific key for encryption
   */
  getMachineKey() {
    // Use machine ID + username as base for key derivation
    const machineId = os.hostname() + os.userInfo().username;
    return crypto.createHash('sha256').update(machineId).digest();
  }

  /**
   * Encrypt a value
   */
  encrypt(value) {
    const key = this.getMachineKey();
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv(this.algorithm, key, iv);
    
    const encrypted = Buffer.concat([
      cipher.update(JSON.stringify(value), 'utf8'),
      cipher.final()
    ]);
    
    const authTag = cipher.getAuthTag();
    
    return {
      encrypted: encrypted.toString('base64'),
      iv: iv.toString('base64'),
      authTag: authTag.toString('base64')
    };
  }

  /**
   * Decrypt a value
   */
  decrypt(encryptedData) {
    const key = this.getMachineKey();
    const decipher = crypto.createDecipheriv(
      this.algorithm,
      key,
      Buffer.from(encryptedData.iv, 'base64')
    );
    
    decipher.setAuthTag(Buffer.from(encryptedData.authTag, 'base64'));
    
    const decrypted = Buffer.concat([
      decipher.update(Buffer.from(encryptedData.encrypted, 'base64')),
      decipher.final()
    ]);
    
    return JSON.parse(decrypted.toString('utf8'));
  }

  /**
   * Store a secure value
   */
  set(key, value) {
    let storage = this.loadStorage();
    
    // Encrypt the value
    const encrypted = this.encrypt(value);
    storage[key] = encrypted;
    
    // Save to file
    fs.writeFileSync(
      this.storageFile,
      JSON.stringify(storage, null, 2),
      { mode: 0o600 }
    );
  }

  /**
   * Retrieve a secure value
   */
  get(key) {
    const storage = this.loadStorage();
    
    if (!storage[key]) {
      return null;
    }
    
    try {
      return this.decrypt(storage[key]);
    } catch (error) {
      console.error(`Failed to decrypt credential: ${key}`);
      return null;
    }
  }

  /**
   * Delete a secure value
   */
  delete(key) {
    const storage = this.loadStorage();
    delete storage[key];
    
    fs.writeFileSync(
      this.storageFile,
      JSON.stringify(storage, null, 2),
      { mode: 0o600 }
    );
  }

  /**
   * List all stored keys (not values)
   */
  list() {
    const storage = this.loadStorage();
    return Object.keys(storage);
  }

  /**
   * Load the storage file
   */
  loadStorage() {
    if (!fs.existsSync(this.storageFile)) {
      return {};
    }
    
    try {
      const content = fs.readFileSync(this.storageFile, 'utf8');
      return JSON.parse(content);
    } catch (error) {
      console.error('Failed to load secure storage:', error.message);
      return {};
    }
  }

  /**
   * Check if running in a secure environment
   */
  isSecure() {
    // Check file permissions
    try {
      const stats = fs.statSync(this.storageFile);
      const mode = stats.mode & parseInt('777', 8);
      return mode === parseInt('600', 8);
    } catch {
      return true; // File doesn't exist yet
    }
  }
}

module.exports = new SecureStorage();