import { useState } from 'react'
import './App.css'

function App() {
  const [uploadProgress, setUploadProgress] = useState(65)

  return (
    <div className="min-h-screen bg-video-dark">
      {/* Header */}
      <header className="bg-video-gray shadow-lg">
        <div className="container mx-auto px-4 py-6">
          <h1 className="text-4xl font-bold text-gradient text-center">
            🎥 HLS Video Streaming Platform
          </h1>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        {/* Welcome Section */}
        <div className="text-center mb-12 animate-fade-in">
          <h2 className="text-2xl font-semibold text-gray-300 mb-4">
            Upload, Process & Stream Videos with HLS
          </h2>
          <p className="text-gray-400 max-w-2xl mx-auto">
            Professional video streaming platform with adaptive bitrate, 
            multiple quality options, and real-time processing status.
          </p>
        </div>

        {/* Demo Components Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          {/* Upload Area Demo */}
          <div className="video-card p-6">
            <h3 className="text-lg font-semibold mb-4 text-blue-400">📤 Upload Area</h3>
            <div className="upload-area">
              <div className="text-4xl mb-2">📁</div>
              <p className="text-gray-400">Drag & drop video files here</p>
              <button className="btn-primary mt-4">Choose File</button>
            </div>
          </div>

          {/* Video Player Demo */}
          <div className="video-card">
            <h3 className="text-lg font-semibold p-4 text-blue-400">▶️ Video Player</h3>
            <div className="video-container bg-gray-800">
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-6xl text-gray-600">▶️</div>
              </div>
            </div>
            <div className="p-4">
              <p className="text-sm text-gray-400">Sample video player container</p>
            </div>
          </div>

          {/* Progress Demo */}
          <div className="video-card p-6">
            <h3 className="text-lg font-semibold mb-4 text-blue-400">📊 Processing</h3>
            <div className="space-y-3">
              <div className="flex justify-between text-sm">
                <span>Converting to HLS...</span>
                <span>{uploadProgress}%</span>
              </div>
              <div className="progress-bar">
                <div 
                  className="progress-fill" 
                  style={{width: `${uploadProgress}%`}}
                ></div>
              </div>
              <p className="text-xs text-gray-500">Estimated: 2 min remaining</p>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="text-center space-x-4">
          <button className="btn-primary">
            🚀 Start Development
          </button>
          <button className="btn-secondary">
            📖 Read Documentation
          </button>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-video-gray mt-16 py-8">
        <div className="container mx-auto px-4 text-center text-gray-400">
          <p>✅ Tailwind CSS v3.x configured successfully!</p>
          <p className="text-sm mt-2">Ready for HLS video streaming development 🎬</p>
        </div>
      </footer>
    </div>
  )
}

export default App