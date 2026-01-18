import { spawn } from 'child_process';
import path from 'path';
import fs from 'fs/promises';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * ===== UPSCALE SERVICE =====
 * Xử lý upscale video với Python script
 */
class UpscaleService {
  constructor() {
    this._currentProcess = null;
  }
  
  /**
   * Upscale video sử dụng Python script
   * @param {string} inputPath - Đường dẫn video input
   * @param {Function} progressCallback - Callback để update progress
   * @returns {Promise<string>} - Đường dẫn video đã upscale
   */
  upscaleVideo(inputPath, progressCallback) {
    return new Promise((resolve, reject) => {
      // Path to Python script
      const scriptPath = path.join(__dirname, '..', 'upscale', 'upscale_video.py');
      
      console.log(`[Upscale] Starting upscale: ${path.basename(inputPath)}`);
      
      // Spawn Python process
      const pythonProcess = spawn('python', [scriptPath, inputPath], {
        cwd: path.dirname(scriptPath),
        env: process.env
      });
      
      let outputPath = null;
      let lastProgressTime = Date.now();
      
      // Capture stdout (progress logs)
      pythonProcess.stdout.on('data', (data) => {
        const output = data.toString();
        
        // Only log important messages
        if (output.includes('[Upscale] Input:') || 
            output.includes('[Upscale] Using:') ||
            output.includes('[Upscale] Completed:') ||
            output.includes('[Upscale] Error:')) {
          console.log(output.trim());
        }
        
        // Extract output path from FINAL log (not resolution)
        if (output.includes('[Upscale] Output:') && output.includes('.mp4')) {
          const match = output.match(/\[Upscale\] Output: (.+\.mp4)/);
          if (match) {
            outputPath = match[1].trim();
          }
        }
        
        // Update progress every 10 seconds
        if (output.includes('[Upscale] Frame')) {
          const now = Date.now();
          if (now - lastProgressTime >= 10000) {
            progressCallback?.(null, 'Upscaling video...');
            lastProgressTime = now;
          }
        }
      });
      
      // Capture stderr (errors)
      pythonProcess.stderr.on('data', (data) => {
        const error = data.toString();
        console.error(`[Upscale] Error: ${error.trim()}`);
      });
      
      // Handle process completion
      pythonProcess.on('close', (code) => {
        this._currentProcess = null;
        
        if (code === 0) {
          if (outputPath) {
            console.log(`[Upscale] Success: ${path.basename(outputPath)}`);
            resolve(outputPath);
          } else {
            reject(new Error('Upscale completed but output path not found'));
          }
        } else if (code === null) {
          reject(new Error('Upscale process was cancelled'));
        } else {
          reject(new Error(`Upscale process exited with code ${code}`));
        }
      });
      
      // Handle process errors
      pythonProcess.on('error', (error) => {
        console.error(`[Upscale] Process error:`, error);
        this._currentProcess = null;
        reject(error);
      });
      
      // Store process reference for potential cancellation
      this._currentProcess = pythonProcess;
    });
  }
  
  /**
   * Hủy upscale process đang chạy
   */
  cancelUpscale() {
    if (this._currentProcess) {
      console.log(`[Upscale] Cancelling process...`);
      this._currentProcess.kill('SIGTERM');
      
      setTimeout(() => {
        if (this._currentProcess && !this._currentProcess.killed) {
          this._currentProcess.kill('SIGKILL');
        }
      }, 5000);
      
      this._currentProcess = null;
      return true;
    }
    return false;
  }
  
  /**
   * Kiểm tra xem file có cần upscale không
   * @param {string} seasonId - Season ID
   * @returns {Promise<boolean>}
   */
  async shouldUpscale(seasonId) {
    try {
      const Season = (await import('../models/Season.js')).default;
      const season = await Season.findById(seasonId);
      return season?.isUpscaled || false;
    } catch (error) {
      console.error('[Upscale] Error checking season:', error);
      return false;
    }
  }
  
  /**
   * Cleanup temporary upscale files
   * @param {string} tempDir - Temporary directory path
   */
  async cleanupTempFiles(tempDir) {
    try {
      await fs.rm(tempDir, { recursive: true, force: true });
      console.log(`[Upscale] Cleaned up temp directory: ${tempDir}`);
    } catch (error) {
      console.error(`[Upscale] Cleanup error:`, error);
    }
  }
}

// Export singleton instance
export default new UpscaleService();
