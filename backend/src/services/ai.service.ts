import { generateText } from 'ai';
import { createOpenAI } from '@ai-sdk/openai';
import { config } from '../config/env';
import { MenteeProfile, MentorProfile } from '../types';

const openai = createOpenAI({
  apiKey: config.ai.openaiApiKey,
});

export class AIService {
  async generateMatchReasoning(
    mentee: MenteeProfile,
    mentor: MentorProfile,
    matchScore: number
  ): Promise<string> {
    try {
      const prompt = `You are an AI assistant helping to match startup founders with mentors at Capital Factory.

Mentee Profile:
- Industry Focus: ${mentee.industryFocus?.join(', ') || 'Not specified'}
- Startup Stage: ${mentee.startupStage || 'Not specified'}

Mentor Profile:
- Name: ${mentor.name || mentor.email}
- Expertise Areas: ${mentor.expertiseAreas?.join(', ') || 'Not specified'}
- Bio: ${mentor.bio || 'No bio available'}

Match Score: ${matchScore}/100

Generate a brief, professional explanation (2-3 sentences) explaining why this mentor is a good match for this mentee. Focus on:
1. How the mentor's expertise aligns with the mentee's needs
2. Why this match would be valuable
3. What the mentee can expect to learn

Keep it concise and actionable.`;

      const { text } = await generateText({
        model: openai(config.ai.model),
        prompt,
        maxTokens: 200,
      });

      return text;
    } catch (error) {
      console.error('AI service error:', error);
      // Fallback reasoning
      const expertiseMatch = mentor.expertiseAreas?.some((exp: string) =>
        mentee.industryFocus?.includes(exp)
      );
      return expertiseMatch
        ? `Strong expertise match in ${mentor.expertiseAreas?.join(' and ')}. This mentor has relevant experience that aligns with your startup stage and industry focus.`
        : `This mentor offers valuable insights based on their background and expertise areas.`;
    }
  }
}

export const aiService = new AIService();

