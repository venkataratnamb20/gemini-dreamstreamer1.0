import { GoogleGenAI } from "@google/genai";
import { ImageStyle } from "../types";

// Ensure we create a new instance when needed to capture fresh keys if they change
const createAIClient = () => {
  return new GoogleGenAI({ apiKey: process.env.API_KEY });
};

// Optimization: Compress/Resize image on client before sending to API to reduce latency
const compressImage = async (base64Str: string, maxWidth = 800, quality = 0.6): Promise<string> => {
  return new Promise((resolve) => {
    try {
      const img = new Image();
      img.src = base64Str;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;
        
        // Calculate new dimensions
        if (width > maxWidth) {
          height = Math.round((height * maxWidth) / width);
          width = maxWidth;
        }
        
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
           resolve(base64Str); // Fallback
           return;
        }
        
        // Draw and compress
        ctx.drawImage(img, 0, 0, width, height);
        // Export as JPEG which is generally smaller/faster for this than PNG
        resolve(canvas.toDataURL('image/jpeg', quality));
      };
      img.onerror = () => {
        resolve(base64Str); // Fallback to original if fail
      };
    } catch (e) {
      resolve(base64Str);
    }
  });
};

export const generateImageFromText = async (
    newInput: string,
    fullContext: string,
    referenceImageUrl?: string, 
    style: ImageStyle = 'None',
    seed?: number
): Promise<string> => {
  const ai = createAIClient();
  
  const parts: any[] = [];
  
  if (referenceImageUrl && referenceImageUrl.startsWith('data:')) {
      try {
          const compressedImage = await compressImage(referenceImageUrl);
          const base64Data = compressedImage.split(',')[1];
          const mimeType = compressedImage.split(';')[0].split(':')[1];
          
          parts.push({
              inlineData: {
                  data: base64Data,
                  mimeType: mimeType
              }
          });

          // Adjusted consistency prompt to solve "Dog vs Boy" issue.
          // We prioritize the text description for the subject while keeping style from reference.
          const consistencyPrompt = `
Description: "${newInput}"
Instruction: Generate an image that matches the Description. 
- The provided image is a reference for STYLE and ATMOSPHERE.
- The Description is the authority for the SUBJECT (characters, objects, actions).
- If the Description introduces a new subject, replace the old one.
${style !== 'None' ? `Target Style: ${style}` : ''}
`;
          parts.push({ text: consistencyPrompt });

      } catch (e) {
          console.warn("Failed to process reference image", e);
          const fallbackPrompt = `
Generate an image of: ${fullContext}
${style !== 'None' ? `Style: ${style}` : ''}
`;
          parts.push({ text: fallbackPrompt });
      }
  } else {
      // First generation - Direct positive instruction
      const creationPrompt = `
Generate an image of: ${fullContext}
${style !== 'None' ? `Style: ${style}` : ''}
`;
      parts.push({ text: creationPrompt });
  }
  
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: {
        parts: parts,
      },
      config: {
        imageConfig: {
          aspectRatio: "1:1",
        },
        seed: seed 
      }
    });

    if (response.candidates?.[0]?.content?.parts) {
      for (const part of response.candidates[0].content.parts) {
        if (part.inlineData && part.inlineData.data) {
          return `data:image/png;base64,${part.inlineData.data}`;
        }
      }
    }

    // If we got here, we might have text output but no image.
    const textOutput = response.text;
    if (textOutput) {
       console.warn("Model returned text instead of image:", textOutput);
       // Suppress text output as requested
       throw new Error("Visual generation failed. Please try again.");
    }

    throw new Error("No image data found.");

  } catch (error: any) {
    throw error;
  }
};

export const generateVideoFromText = async (
    newInput: string,
    fullContext: string,
    referenceImageUrl?: string, 
    style: ImageStyle = 'None',
    seed?: number
): Promise<string> => {
  const ai = createAIClient();
  
  // Adjusted video prompt to ensure subject accuracy
  const videoPromptText = referenceImageUrl 
    ? `Animate the following scene: ${newInput}. Use the image as a style reference.`
    : `Create a video of: ${fullContext}`;

  const requestPayload: any = {
    model: 'veo-3.1-fast-generate-preview',
    prompt: videoPromptText,
    config: {
      numberOfVideos: 1,
      resolution: '720p',
      aspectRatio: '16:9',
    }
  };

  if (referenceImageUrl && referenceImageUrl.startsWith('data:')) {
       try {
           const compressedImage = await compressImage(referenceImageUrl, 800, 0.7);
           const base64Data = compressedImage.split(',')[1];
           const mimeType = compressedImage.split(';')[0].split(':')[1];
           requestPayload.image = {
               imageBytes: base64Data,
               mimeType: mimeType
           };
       } catch (e) {
           console.warn("Failed to process reference image for video", e);
       }
  }

  try {
      let operation = await ai.models.generateVideos(requestPayload);

      while (!operation.done) {
        await new Promise(resolve => setTimeout(resolve, 3000));
        operation = await ai.operations.getVideosOperation({ operation: operation });
      }

      const videoUri = operation.response?.generatedVideos?.[0]?.video?.uri;
      
      if (!videoUri) {
        throw new Error("Video generation failed.");
      }

      const response = await fetch(`${videoUri}&key=${process.env.API_KEY}`);
      if (!response.ok) {
        throw new Error(`Failed to fetch video.`);
      }
      
      const blob = await response.blob();
      return URL.createObjectURL(blob);
  } catch (error: any) {
      console.error("Video Generation Error", error);
      throw error;
  }
};

export const checkApiKeySelection = async (): Promise<boolean> => {
  const win = window as any;
  if (win.aistudio && win.aistudio.hasSelectedApiKey) {
    return await win.aistudio.hasSelectedApiKey();
  }
  return true;
};

export const openApiKeySelection = async (): Promise<void> => {
  const win = window as any;
  if (win.aistudio && win.aistudio.openSelectKey) {
    await win.aistudio.openSelectKey();
  }
};