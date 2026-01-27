const axios = require('axios');

/**
 * ===== GEMINI AI SERVICE =====
 * Handles communication with Google Gemini API
 */

class GeminiService {
  constructor() {
    this.initialized = false;
    this.apiKey = null;
    // Use stable Gemini 1.5 Flash model (recommended)
    this.model = 'gemini-2.5-flash'; // Stable production version
    this.endpoint = null;
    
    // Generation settings
    this.generationConfig = {
      temperature: 0.7,
      topK: 40,
      topP: 0.95,
      maxOutputTokens: 8192,
    };
    
    // Safety settings
    this.safetySettings = [
      {
        category: 'HARM_CATEGORY_HARASSMENT',
        threshold: 'BLOCK_MEDIUM_AND_ABOVE'
      },
      {
        category: 'HARM_CATEGORY_HATE_SPEECH',
        threshold: 'BLOCK_MEDIUM_AND_ABOVE'
      }
    ];
    
    // System instruction for anime chatbot
    this.systemInstruction = `Trợ lý AI chuyên anime Golden Platform.

CHỈ trả lời về: anime, manga, phim hoạt hình Nhật.
Câu hỏi khác → "Xin lỗi, tôi chỉ tư vấn về anime."

Quy tắc:
- QUAN TRỌNG: Wrap tên anime trong **Tên Anime** (để tạo link)
- KHÔNG dùng ** cho từ khác, CHỈ tên anime
- Tiếng Việt tự nhiên

Hỏi CHUNG ("tìm anime..."):
- Gợi ý 3-5 anime
- Format: Số. **Tên Anime** - Năm
• Tóm tắt 1-2 câu

Hỏi CỤ THỂ ("cho biết về..."):
- KHÔNG đánh số
- Bắt đầu: **Tên Anime** là...
- 3-5 câu: tên, năm, thể loại, cốt truyện, đặc điểm`;
  }

  /**
   * Initialize the service (lazy initialization)
   */
  initialize() {
    if (this.initialized) return;
    
    // Get API key from environment variable
    this.apiKey = process.env.GEMINI_API_KEY;
    
    if (!this.apiKey) {
      console.error('❌ GEMINI_API_KEY is not defined in environment variables');
      console.error('Available env vars:', Object.keys(process.env).filter(k => k.includes('GEMINI')));
      throw new Error('GEMINI_API_KEY is not defined in environment variables');
    }
    
    // Set endpoint - Use v1beta API for gemini-2.5-flash
    this.endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${this.model}:generateContent`;
    
    this.initialized = true;
    console.log('✅ Gemini Service initialized successfully');
  }

  /**
   * Send message to Gemini and get response
   * @param {string} userMessage - User's message
   * @param {Array} conversationHistory - Previous messages [{role, message}]
   * @returns {Promise<string>} - AI response
   */
  async sendMessage(userMessage, conversationHistory = []) {
    // Ensure service is initialized
    this.initialize();
    
    const maxRetries = 3;
    const retryDelay = 2000; // 2 seconds

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        // Build request body
        const requestBody = {
          systemInstruction: {
            parts: [{ text: this.systemInstruction }]
          },
          contents: [
            ...this.formatConversationHistory(conversationHistory),
            {
              role: 'user',
              parts: [{ text: userMessage }]
            }
          ],
          generationConfig: this.generationConfig,
          safetySettings: this.safetySettings
        };

        // Call Gemini API
        const response = await axios.post(
          `${this.endpoint}?key=${this.apiKey}`,
          requestBody,
          {
            headers: {
              'Content-Type': 'application/json',
            },
            timeout: 30000 // 30 seconds timeout
          }
        );

        // Extract AI response
        const aiResponse = response.data?.candidates?.[0]?.content?.parts?.[0]?.text;
        
        if (!aiResponse) {
          throw new Error('No response from Gemini');
        }

        console.log('✅ Gemini API success');
        return aiResponse;

      } catch (error) {
        console.error(`❌ Gemini API error (attempt ${attempt}/${maxRetries}):`, error.message);
        
        // Check if it's a retryable error
        const isRetryable = 
          error.response?.status === 503 || 
          error.response?.status === 429 ||
          error.code === 'ECONNABORTED';
        
        // If last attempt or non-retryable error, throw
        if (attempt === maxRetries || !isRetryable) {
          // Provide user-friendly error message
          if (error.response?.status === 503 || error.response?.status === 429) {
            throw new Error('Server AI đang quá tải. Vui lòng thử lại sau vài phút. 🔄');
          }
          
          if (error.code === 'ECONNABORTED') {
            throw new Error('Kết nối với AI timeout. Vui lòng thử lại.');
          }
          
          const errorMessage = error.response?.data?.error?.message || error.message;
          throw new Error(`Gemini API error: ${errorMessage}`);
        }
        
        // Wait before retry with exponential backoff
        const waitTime = retryDelay * attempt;
        console.log(`⏳ Retrying in ${waitTime}ms...`);
        await new Promise(resolve => setTimeout(resolve, waitTime));
      }
    }
  }

  /**
   * Format conversation history for Gemini API
   * @param {Array} history - Array of {role, message}
   * @returns {Array} - Formatted for Gemini
   */
  formatConversationHistory(history) {
    return history.map(msg => ({
      role: msg.role === 'user' ? 'user' : 'model',
      parts: [{ text: msg.message }]
    }));
  }
}

// Export singleton instance
const geminiService = new GeminiService();
module.exports = geminiService;
