'use server';

/**
 * @fileOverview An AI flow to analyze the brightness of an image.
 *
 * - analyzeImageBrightness - A function that determines if an image is 'light' or 'dark'.
 * - AnalyzeImageBrightnessInput - The input type for the function.
 * - AnalyzeImageBrightnessOutput - The return type for the function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const AnalyzeImageBrightnessInputSchema = z.object({
  photoDataUri: z
    .string()
    .describe(
      "A photo to analyze, as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."
    ),
});
export type AnalyzeImageBrightnessInput = z.infer<
  typeof AnalyzeImageBrightnessInputSchema
>;

const AnalyzeImageBrightnessOutputSchema = z.object({
  brightness: z
    .enum(['light', 'dark'])
    .describe("The overall brightness of the image, either 'light' or 'dark'."),
  reasoning: z
    .string()
    .describe('The AI reasoning for its brightness determination.'),
});
export type AnalyzeImageBrightnessOutput = z.infer<
  typeof AnalyzeImageBrightnessOutputSchema
>;

export async function analyzeImageBrightness(
  input: AnalyzeImageBrightnessInput
): Promise<AnalyzeImageBrightnessOutput | null> {
  try {
    return await analyzeImageBrightnessFlow(input);
  } catch (error) {
    console.warn('AI image brightness analysis failed, falling back to manual detection:', error);
    return null;
  }
}

const prompt = ai.definePrompt({
  name: 'analyzeImageBrightnessPrompt',
  input: {schema: AnalyzeImageBrightnessInputSchema},
  output: {schema: AnalyzeImageBrightnessOutputSchema},
  prompt: `You are an AI assistant designed to analyze image properties.

  Your task is to determine if the overall brightness of the provided image is predominantly 'light' or 'dark'.
  Consider the entire image, including its subject and background. A dark image has mostly dark colors, and a light image has mostly light colors.

  Provide your reasoning for the decision.

  Image: {{media url=photoDataUri}}

  Ensure your output is valid JSON.`,
});

const analyzeImageBrightnessFlow = ai.defineFlow(
  {
    name: 'analyzeImageBrightnessFlow',
    inputSchema: AnalyzeImageBrightnessInputSchema,
    outputSchema: AnalyzeImageBrightnessOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
