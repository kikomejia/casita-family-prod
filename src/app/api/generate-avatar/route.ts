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
    
    // Step 1: Use Gemini 1.5 Flash to describe the face
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

    // Step 2: Use Imagen 3 to generate the avatar based on the description and the selected style
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

    const imagenResponse = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/imagen-4.0-generate-001:predict?key=${apiKey}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        instances: [{ prompt: finalPrompt }],
        parameters: {
          sampleCount: 1,
          outputOptions: { mimeType: "image/jpeg" }
        }
      })
    });

    const imagenData = await imagenResponse.json();
    
    if (imagenData.error) {
      throw new Error(`Imagen API Error: ${imagenData.error.message}`);
    }

    if (!imagenData.predictions || imagenData.predictions.length === 0) {
      throw new Error("Failed to generate image with Imagen 3.");
    }

    const generatedBase64 = imagenData.predictions[0].bytesBase64Encoded;
    const dataUrl = `data:image/jpeg;base64,${generatedBase64}`;

    return NextResponse.json({ avatarUrl: dataUrl });

  } catch (error: any) {
    console.error("Generate Avatar Error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to generate avatar." },
      { status: 500 }
    );
  }
}
