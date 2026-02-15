/**
 * CyCOS Skill: Gemini Vision
 * Role: The Visionary (Sight)
 * 
 * Uses Google Generative AI to analyze images.
 */

const { GoogleGenerativeAI } = require("@google/generative-ai");
const fs = require('fs');
const path = require('path');

// Configure with your API Key
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

/**
 * analyzes an image from a local path.
 * @param {string} imagePath - Path to the image file.
 * @param {string} prompt - Question or instruction for the image.
 */
async function analyzeImage(imagePath, prompt = "Describe this image in detail.") {
    try {
        if (!process.env.GEMINI_API_KEY) {
            throw new Error("GEMINI_API_KEY environment variable is not set.");
        }

        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

        const imageBuffer = fs.readFileSync(imagePath);
        const imagePart = {
            inlineData: {
                data: imageBuffer.toString("base64"),
                mimeType: "image/jpeg", // Defaults to jpeg, can be adjusted
            },
        };

        const result = await model.generateContent([prompt, imagePart]);
        const response = await result.response;
        return response.text();
    } catch (error) {
        return `Error analyzing image: ${error.message}`;
    }
}

// Self-test block
if (require.main === module) {
    const testImage = process.argv[2] || "test.jpg";
    const testPrompt = process.argv[3] || "What do you see in this image?";

    if (!fs.existsSync(testImage)) {
        console.log(`[Vision Test] Image not found: ${testImage}. Provide a path to test.`);
    } else {
        analyzeImage(testImage, testPrompt).then(console.log).catch(console.error);
    }
}

module.exports = { analyzeImage };
