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

    // Build the style prompt based on selected style
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

    const finalPrompt = `Transform this person's photo into ${stylePrompt}. Keep the likeness, face shape, hair color, eye color, and expression as close to the original as possible. Clear face, front-facing portrait, isolated on a solid color background.`;

    // Single-step: Send the selfie directly to Nano Banana 2 (gemini-3.1-flash-image-preview)
    // so the model can SEE the actual face and produce a faithful style transfer.
    const imageGenResponse = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-3.1-flash-image-preview:generateContent?key=${apiKey}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{
          parts: [
            { text: finalPrompt },
            { inlineData: { mimeType: "image/jpeg", data: base64Data } }
          ]
        }]
      })
    });

    const imageData = await imageGenResponse.json();
    
    if (imageData.error) {
      throw new Error(`Nano Banana 2 API Error: ${imageData.error.message}`);
    }

    // Find the generated image in the response parts
    const parts = imageData.candidates?.[0]?.content?.parts || [];
    let generatedBase64 = "";
    let mimeType = "image/png";
    
    for (const part of parts) {
      if (part.inlineData && part.inlineData.data) {
        generatedBase64 = part.inlineData.data;
        if (part.inlineData.mimeType) mimeType = part.inlineData.mimeType;
        break;
      }
    }

    if (!generatedBase64) {
      throw new Error("Failed to generate image with Nano Banana 2.");
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
