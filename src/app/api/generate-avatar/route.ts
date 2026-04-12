import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const { image, style, name } = await request.json();

    const apiKey = process.env.GEMINI_API_KEY;
    
    if (!apiKey) {
      return NextResponse.json(
        { error: "GEMINI_API_KEY is not configured in environment variables." },
        { status: 500 }
      );
    }

    if (!image) {
      return NextResponse.json(
        { error: "No image provided." },
        { status: 400 }
      );
    }

    // Convert base64 data URL to raw base64 if needed
    const base64Data = image.split(",")[1] || image;

    // To perform style transfer from an image using Gemini, we first need to extract facial features
    // using Gemini 1.5 Pro/Flash, and then use those features to prompt Imagen 3.
    // However, for simplicity in this implementation, we will use a direct prompt to Gemini 1.5 Pro
    // and wait for Google's native Imagen image-to-image API.
    
    // Step 1: Use Gemini 3 Flash Preview to describe the face
    const visionResponse = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-3-flash-preview:generateContent?key=${apiKey}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{
          parts: [
            { text: "Analyze this face in detail (gender, hair color, eye color, defining features, expression). Provide a short 2-sentence physical description." },
            { inlineData: { mimeType: "image/jpeg", data: base64Data } }
          ]
        }]
      })
    });

    const visionData = await visionResponse.json();
    if (!visionData.candidates || visionData.candidates.length === 0) {
      console.error("Gemini Vision API Error:", JSON.stringify(visionData, null, 2));
      const errorMessage = visionData.error?.message || (visionData.promptFeedback?.blockReason ? `Blocked by safety filter: ${visionData.promptFeedback.blockReason}` : "Failed to analyze face with Gemini.");
      throw new Error(`Gemini Error: ${errorMessage}`);
    }

    const description = visionData.candidates[0].content.parts[0].text;

    // Step 2: Use Nano Banana Pro Preview to generate the avatar
    let stylePrompt = "A beautiful stylized 3D avatar";
    if (style === "disney") stylePrompt = "A magical Disney-style 2D animated character avatar, fairytale aesthetics, expressive eyes";
    if (style === "pixar") stylePrompt = "A high-quality 3D Pixar-style character avatar, dramatic lighting, soft vibrant shading";
    if (style === "anime") stylePrompt = "A high-quality Anime-style character avatar, Studio Ghibli aesthetics, beautiful detailed eyes, cel-shaded";
    if (style === "mario") {
      if (name === "Maya" || name === "Luna") {
        stylePrompt = "A beautiful princess character in the Super Mario Bros 3D world style, dressed in an elegant royal gown similar to Princess Peach or Rosalina from Nintendo, magical elegant esthetics, colorful, soft cartoony features, tiara crown";
      } else {
        stylePrompt = "A character in the Super Mario Bros 3D world style, Nintendo esthetics, colorful, rounded cartoony features";
      }
    }

    const finalPrompt = `${stylePrompt}. Description of the person: ${description}. Clear face, front-facing portrait, isolated on a solid color background.`;

    const imageGenResponse = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/nano-banana-pro-preview:generateContent?key=${apiKey}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: finalPrompt }] }]
      })
    });

    const imageData = await imageGenResponse.json();
    
    if (imageData.error) {
      throw new Error(`Nano Banana API Error: ${imageData.error.message}`);
    }

    const parts = imageData.candidates?.[0]?.content?.parts || [];
    let generatedBase64 = "";
    let mimeType = "image/jpeg";
    
    for (const part of parts) {
      if (part.inlineData && part.inlineData.data) {
        generatedBase64 = part.inlineData.data;
        if (part.inlineData.mimeType) mimeType = part.inlineData.mimeType;
        break;
      }
    }

    if (!generatedBase64) {
      throw new Error("Failed to generate image with Nano Banana.");
    }

    const dataUrl = `data:${mimeType};base64,${generatedBase64}`;

    return NextResponse.json({ avatarUrl: dataUrl });

  } catch (error) {
    console.error("Generate Avatar Error:", error);
    const message = error instanceof Error ? error.message : "Failed to generate avatar.";
    return NextResponse.json(
      { error: message },
      { status: 500 }
    );
  }
}
