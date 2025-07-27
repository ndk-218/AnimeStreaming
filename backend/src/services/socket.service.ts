import { Server as SocketIOServer } from 'socket.io';
import { Server as HTTPServer } from 'http';

class SocketService {
  private io: SocketIOServer | null = null;
  
  /**
   * Initialize Socket.IO server
   */
  initialize(server: HTTPServer): void {
    this.io = new SocketIOServer(server, {
      cors: {
        origin: process.env.FRONTEND_URL || 'http://localhost:5173',
        credentials: true
      }
    });
    
    this.setupEventHandlers();
  }
  
  /**
   * Setup socket event handlers
   */
  private setupEventHandlers(): void {
    if (!this.io) return;
    
    this.io.on('connection', (socket) => {
      console.log('Client connected:', socket.id);
      
      // Join room for processing updates
      socket.on('join-processing', (episodeId: string) => {
        socket.join(`processing-${episodeId}`);
        console.log(`Socket ${socket.id} joined processing room for episode ${episodeId}`);
      });
      
      // Leave processing room
      socket.on('leave-processing', (episodeId: string) => {
        socket.leave(`processing-${episodeId}`);
      });
      
      // Join admin room
      socket.on('join-admin', () => {
        socket.join('admin');
        console.log(`Socket ${socket.id} joined admin room`);
      });
      
      socket.on('disconnect', () => {
        console.log('Client disconnected:', socket.id);
      });
    });
  }
  
  /**
   * Emit video processing progress
   */
  emitProcessingProgress(data: {
    episodeId: string;
    status: string;
    progress: number;
    currentStep: string;
    error?: string;
  }): void {
    if (!this.io) return;
    
    // Emit to specific episode room
    this.io.to(`processing-${data.episodeId}`).emit('processing-progress', data);
    
    // Also emit to admin room
    this.io.to('admin').emit('processing-update', data);
  }
  
  /**
   * Emit general notification
   */
  emitNotification(data: {
    type: 'success' | 'error' | 'info' | 'warning';
    title: string;
    message: string;
    target?: 'admin' | 'all';
  }): void {
    if (!this.io) return;
    
    if (data.target === 'admin') {
      this.io.to('admin').emit('notification', data);
    } else {
      this.io.emit('notification', data);
    }
  }
  
  /**
   * Emit series update
   */
  emitSeriesUpdate(data: {
    action: 'created' | 'updated' | 'deleted';
    seriesId: string;
    series?: any;
  }): void {
    if (!this.io) return;
    
    this.io.emit('series-update', data);
  }
  
  /**
   * Emit episode update
   */
  emitEpisodeUpdate(data: {
    action: 'created' | 'updated' | 'deleted';
    episodeId: string;
    seriesId: string;
    seasonId: string;
    episode?: any;
  }): void {
    if (!this.io) return;
    
    this.io.emit('episode-update', data);
  }
  
  /**
   * Get Socket.IO instance
   */
  getIO(): SocketIOServer | null {
    return this.io;
  }
  
  /**
   * Check if socket service is initialized
   */
  isInitialized(): boolean {
    return this.io !== null;
  }
}

// Export singleton instance
export const socketService = new SocketService();