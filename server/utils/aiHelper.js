const { GoogleGenAI } = require('@google/genai');
require('dotenv').config();

// Initialize the Google Gen AI client
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

/**
 * Analyzes an image buffer using Gemini to suggest a service category
 * @param {Buffer} buffer - Image buffer from multer memory storage
 * @param {String} mimeType - Image mime type (e.g., 'image/jpeg')
 * @returns {Object} JSON object with category, confidence, and reason
 */
const analyzeImageForCategory = async (buffer, mimeType) => {
  try {
    // Convert buffer to base64 string for Gemini
    const base64Image = buffer.toString('base64');

    const prompt = `
      You are an AI assistant for a local home services platform. 
      Look at this image and identify the household problem. 
      Choose EXACTLY ONE category from this list: Plumber, Electrician, AC Repair, Cleaning, Painter, Carpenter, RO Service.
      If the image does not show a household problem related to these categories, return "Unknown".
      
      You must respond ONLY with a valid JSON object. Do not include markdown formatting, backticks, or any other text.
      The JSON format must be exactly:
      {
        "category": "String (one of the categories or 'Unknown')",
        "confidence": Number (between 0.0 and 1.0),
        "reason": "String (one short sentence explaining why)"
      }
    `;

    // Call Gemini API
    const response = await ai.models.generateContent({
      model: process.env.GEMINI_MODEL || 'gemini-2.5-flash',
      contents: [
        prompt,
        {
          inlineData: {
            data: base64Image,
            mimeType: mimeType,
          },
        },
      ],
    });

    let responseText = response.text;

    // Strip markdown fences if the AI included them despite instructions
    responseText = responseText.replace(/```json/gi, '').replace(/```/g, '').trim();

    // Parse and return the JSON
    const parsedData = JSON.parse(responseText);
    return parsedData;

  } catch (error) {
    console.error('Gemini error:', error.message);
    console.error('Gemini API Error:', error);
    throw new Error('Failed to analyze image with AI');
  }
};

module.exports = {
  analyzeImageForCategory,
};