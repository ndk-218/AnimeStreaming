import GEMINI_CONFIG from '../config/gemini';

/**
 * Gemini API Service
 * Handles communication with Google Gemini API
 */

class GeminiService {
  constructor() {
    this.apiKey = GEMINI_CONFIG.apiKey;
    this.model = GEMINI_CONFIG.model;
    // Use v1beta API for gemini-pro model
    this.endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${this.model}:generateContent`;
  }

  /**
   * Send message to Gemini and get response
   * @param {string} userMessage - User's message
   * @param {Array} conversationHistory - Previous messages (optional)
   * @returns {Promise<string>} - AI response
   */
  async sendMessage(userMessage, conversationHistory = []) {
    const maxRetries = 3;
    const retryDelay = 2000; // 2 seconds

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        // Optimized systemInstruction - shortened to avoid overload
        const systemInstruction = `Trợ lý AI chuyên anime Golden Platform.

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

        // Build request body with systemInstruction
        const requestBody = {
          systemInstruction: {
            parts: [{ text: systemInstruction }]
          },
          contents: [
            ...this.formatConversationHistory(conversationHistory),
            {
              role: 'user',
              parts: [{ text: userMessage }]
            }
          ],
          generationConfig: GEMINI_CONFIG.generationConfig,
          safetySettings: GEMINI_CONFIG.safetySettings
        };

        // Call Gemini API
        const response = await fetch(`${this.endpoint}?key=${this.apiKey}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(requestBody)
        });

        // Check response status
        if (!response.ok) {
          const errorData = await response.json();
          const errorMessage = errorData.error?.message || 'Gemini API error';
          
          // Check if it's a retryable error (503, 429)
          if ((response.status === 503 || response.status === 429) && attempt < maxRetries) {
            console.log(`⚠️ Gemini API overloaded. Retrying (${attempt}/${maxRetries})...`);
            await new Promise(resolve => setTimeout(resolve, retryDelay * attempt));
            continue; // Retry
          }
          
          throw new Error(errorMessage);
        }

        // Parse response
        const data = await response.json();
        
        // Extract AI response text
        const aiResponse = data.candidates?.[0]?.content?.parts?.[0]?.text;
        
        if (!aiResponse) {
          throw new Error('No response from Gemini');
        }

        return aiResponse;

      } catch (error) {
        // If it's the last attempt or non-retryable error, throw
        if (attempt === maxRetries || error.message === 'No response from Gemini') {
          console.error('Gemini API Error:', error);
          
          // Provide user-friendly error message
          if (error.message.includes('overloaded')) {
            throw new Error('Server AI đang quá tải. Vui lòng thử lại sau vài phút. 🔄');
          }
          
          throw error;
        }
        
        // Wait before retry
        console.log(`⚠️ Retrying (${attempt}/${maxRetries})...`);
        await new Promise(resolve => setTimeout(resolve, retryDelay * attempt));
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

  /**
   * Send anime recommendation request
   * @param {string} userQuery - User's anime search query
   * @returns {Promise<string>} - AI response with recommendations
   */
  async getAnimeRecommendations(userQuery) {
    const systemPrompt = `Bạn là trợ lý AI chuyên tư vấn anime. Nhiệm vụ của bạn là:
- Hiểu mô tả mơ hồ của người dùng về anime họ muốn xem
- Gợi ý 3-5 anime phù hợp nhất
- Giải thích ngắn gọn tại sao gợi ý anime đó
- Trả lời bằng tiếng Việt, thân thiện và nhiệt tình

Người dùng hỏi: ${userQuery}`;

    return await this.sendMessage(systemPrompt);
  }
}

// Export singleton instance
const geminiService = new GeminiService();
export default geminiService;
