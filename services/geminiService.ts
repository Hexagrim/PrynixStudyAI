
import { GoogleGenAI, Part } from "@google/genai";
import type { ChatMessage } from '../types';

if (!process.env.API_KEY) {
    throw new Error("API_KEY environment variable is not set.");
}

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
const model = "gemini-2.5-flash";

function fileToGenerativePart(base64Data: string, mimeType: string): Part {
    return {
        inlineData: {
            data: base64Data,
            mimeType,
        },
    };
}

export async function* streamChatResponse(bookPages: string[], userMessage: ChatMessage) {
    const { text, image } = userMessage;

    const systemInstruction = `You are an AI study assistant created by Aayush Parajuli of Prynix. Your goal is to help the user study the provided book.
Your primary and only source of knowledge is the set of book pages provided below.
First, you MUST detect the primary language used in the book pages (e.g., English, Nepali).
Then, you MUST respond to all user queries ONLY in that detected language.
It is very important that you do not assume the user's identity. Address them as 'you' or answer their questions directly.
Answer the user's questions strictly based on the content of these pages. Use any external knowledge. If the answer is not in the book, state that in the detected language and proceed to provide the answer with external sources.

---BOOK PAGES START---
`;

    const parts: Part[] = [
        { text: systemInstruction },
        ...bookPages.map(pageData => fileToGenerativePart(pageData, 'image/jpeg')),
        { text: "\n---BOOK PAGES END---\n\n---USER QUERY START---\n" },
    ];
    
    if (image) {
        const imageMimeType = image.startsWith('data:image/png') ? 'image/png' : 'image/jpeg';
        const imageData = image.split(',')[1];
        parts.push(fileToGenerativePart(imageData, imageMimeType));
        parts.push({text: `\nUser's image is above. Here is the user's question about the image and book:\n${text}`});
    } else {
        parts.push({ text: `Here is the user's question:\n${text}` });
    }
     parts.push({ text: "\n---USER QUERY END---" });


    try {
        const result = await ai.models.generateContentStream({
            model,
            contents: { role: 'user', parts },
        });

        for await (const chunk of result) {
            if (chunk.text) {
                yield chunk.text;
            }
        }
    } catch (error) {
        console.error("Error streaming chat response:", error);
        throw new Error("Failed to get a response from the AI. Please check your API key and network connection.");
    }
}
