/**
 * Anime Name Parser Utility
 * Extract anime names from AI response and check if they exist in database
 */

import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

/**
 * Extract anime names from AI response
 * Extracts names wrapped in **Anime Name** format
 * 
 * @param {string} text - AI response text
 * @returns {Array} - Array of {name, originalText}
 */
export function extractAnimeNames(text) {
  const animeNames = [];
  
  // Pattern: Extract text between **...**
  const boldPattern = /\*\*([^*]+)\*\*/g;
  
  let match;
  while ((match = boldPattern.exec(text)) !== null) {
    const name = match[1].trim();
    // Filter: Độ dài hợp lý cho tên anime (2-50 ký tự)
    if (name && name.length > 2 && name.length < 50) {
      animeNames.push({
        name: name,
        originalText: match[0] // Includes **...**
      });
    }
  }
  
  return animeNames;
}

/**
 * Search anime in database by name
 * @param {string} animeName - Anime name to search
 * @returns {Promise<Object|null>} - {title, slug} or null if not found
 */
export async function searchAnimeInDB(animeName) {
  try {
    const response = await axios.get(`${API_URL}/api/series/search`, {
      params: {
        q: animeName,
        limit: 1
      }
    });
    
    if (response.data.success && response.data.data.length > 0) {
      const series = response.data.data[0];
      return {
        title: series.title,
        slug: series.slug
      };
    }
    
    return null;
  } catch (error) {
    console.error('Search anime error:', error);
    return null;
  }
}

/**
 * Process AI response: extract anime names and add links
 * @param {string} text - AI response text
 * @returns {Promise<Array>} - Array of text segments with link info
 */
export async function processAnimeResponse(text) {
  // Extract anime names from response (names in **...**)
  const animeNames = extractAnimeNames(text);
  
  if (animeNames.length === 0) {
    // No anime names found, return as plain text
    return [{ type: 'text', content: text }];
  }
  
  // Search each anime in database
  const searchPromises = animeNames.map(async (anime) => {
    const result = await searchAnimeInDB(anime.name);
    return {
      ...anime,
      slug: result?.slug || null,
      found: !!result
    };
  });
  
  const animeResults = await Promise.all(searchPromises);
  
  // Build segments with link info
  const segments = [];
  let remainingText = text;
  
  for (const anime of animeResults) {
    // Find position of **Anime Name** in remaining text
    const fullMatch = anime.originalText; // **Anime Name**
    const matchIndex = remainingText.indexOf(fullMatch);
    
    if (matchIndex === -1) continue;
    
    // Add text before **Anime Name**
    if (matchIndex > 0) {
      segments.push({
        type: 'text',
        content: remainingText.substring(0, matchIndex)
      });
    }
    
    // Add anime name (with or without link)
    if (anime.found) {
      // Found in DB → clickable link
      segments.push({
        type: 'link',
        content: anime.name, // Just the name, no **
        slug: anime.slug,
        url: `/series/${anime.slug}`
      });
    } else {
      // Not found → plain bold text
      segments.push({
        type: 'text',
        content: fullMatch // Keep **...**
      });
    }
    
    // Update remaining text
    remainingText = remainingText.substring(matchIndex + fullMatch.length);
  }
  
  // Add any remaining text
  if (remainingText.length > 0) {
    segments.push({
      type: 'text',
      content: remainingText
    });
  }
  
  return segments;
}

export default {
  extractAnimeNames,
  searchAnimeInDB,
  processAnimeResponse
};
