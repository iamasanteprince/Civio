import { GoogleGenAI } from '@google/genai';

const SYSTEM_INSTRUCTIONS = `You are Asante, the authentic and encouraging AI mentor for Civiohub.
You provide clear, practical guidance for students applying to global universities.
Core expertise:
- Finding institutions with $0 application fees or waiver codes.
- English proficiency waivers (WAEC/WASSCE accepted, medium of instruction letters).
- Step-by-step application checklists and Statement of Purpose (SOP) strategies.
- Student visa proof-of-funds rules and working rights for US (F-1), Canada (Study Permit/PAL), UK (Student Route), and Germany (Sperrkonto).
Always format answers cleanly with markdown bullet points and maintain an empathetic, motivating peer tone.
Use the supplied Civio context as the source of truth for institution-specific policies and visa figures. Do not invent fees, deadlines, waiver rules, or eligibility requirements. If a detail is not in the context, say it is not indexed and direct the student to the institution or official government source.`;

function readResponseText(response: Awaited<ReturnType<GoogleGenAI['models']['generateContent']>>): string {
  return response.text?.trim() ?? '';
}

export async function generateAsanteResponse(query: string, context: string): Promise<string> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error('Gemini is not configured on the server.');
  }

  const ai = new GoogleGenAI({
    apiKey,
    httpOptions: { timeout: 20_000 },
  });
  const contents = `Student question:\n${query}\n\nCivio indexed context:\n${context || 'No matching record was found in Civio’s indexed data.'}`;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-lite',
      contents,
      config: { systemInstruction: SYSTEM_INSTRUCTIONS },
    });
    const text = readResponseText(response);
    if (!text) throw new Error('Gemini returned an empty response.');
    return text;
  } catch (error) {
    const message = error instanceof Error ? error.message : '';
    if (!/404|not found|not supported|unknown model/i.test(message)) throw error;

    const fallbackResponse = await ai.models.generateContent({
      model: 'gemini-1.5-flash',
      contents,
      config: { systemInstruction: SYSTEM_INSTRUCTIONS },
    });
    const text = readResponseText(fallbackResponse);
    if (!text) throw new Error('Gemini returned an empty response.');
    return text;
  }
}
