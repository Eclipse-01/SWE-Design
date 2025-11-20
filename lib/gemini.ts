import { GoogleGenerativeAI } from "@google/generative-ai"
import { prisma } from "@/lib/db"

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "")

export interface GradingResult {
  score: number
  feedback: string
  strengths: string[]
  weaknesses: string[]
}

export async function gradeSubmissionWithAI(
  assignmentDescription: string,
  submissionContent: string,
  maxScore: number
): Promise<GradingResult> {
  const model = genAI.getGenerativeModel({ 
    model: "gemini-2.0-flash-exp",
    generationConfig: {
      responseMimeType: "application/json"
    }
  })

  const prompt = `You are an academic grading assistant. Grade the following submission based on the assignment requirements.

Assignment Requirements:
${assignmentDescription}

Student Submission:
${submissionContent}

Max Score: ${maxScore}

Task: Provide a comprehensive evaluation in JSON format with the following structure:
{
  "score": number (0-${maxScore}),
  "feedback": "comprehensive analysis of the submission",
  "strengths": ["strength1", "strength2", ...],
  "weaknesses": ["weakness1", "weakness2", ...]
}

Respond ONLY with valid JSON.`

  const result = await model.generateContent(prompt)
  const response = await result.response
  let text = response.text()
  
  // Fix: Remove Markdown code block markers
  text = text.replace(/```json/g, '').replace(/```/g, '').trim();
  
  try {
    // Try to find the JSON start and end braces to prevent issues with surrounding text
    const jsonStartIndex = text.indexOf('{');
    const jsonEndIndex = text.lastIndexOf('}');
    if (jsonStartIndex !== -1 && jsonEndIndex !== -1) {
      text = text.substring(jsonStartIndex, jsonEndIndex + 1);
    }
    
    const parsed = JSON.parse(text) as GradingResult
    // Ensure score is within bounds
    parsed.score = Math.min(Math.max(parsed.score, 0), maxScore)
    return parsed
  } catch (error) {
    console.error("AI JSON Parse Error:", text); // Log original text for debugging
    throw new Error("AI 返回格式异常，无法解析评分结果")
  }
}

export async function checkSubscriptionAndDeduct(
  organizationId: string,
  estimatedTokens: number
): Promise<boolean> {
  try {
    // Use transaction with atomic update to prevent race condition
    const result = await prisma.$transaction(async (tx) => {
      const org = await tx.organization.findUnique({
        where: { idString: organizationId }
      });

      if (!org) return false;

      // Check subscription status and balance
      if (org.aiSubStatus !== 'ACTIVE') return false;
      if (org.aiTokenUsage + estimatedTokens > org.aiTokenLimit) return false;

      // Deduct tokens atomically
      await tx.organization.update({
        where: { 
          idString: organizationId,
          // Add optimistic locking to ensure we're updating the expected state
          aiTokenUsage: org.aiTokenUsage
        },
        data: {
          aiTokenUsage: { increment: estimatedTokens }
        }
      });

      return true;
    });

    return result;
  } catch (error) {
    console.error("Token deduction error:", error);
    return false;
  }
}
