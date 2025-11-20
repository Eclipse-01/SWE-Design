import { GoogleGenerativeAI } from "@google/generative-ai"

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
  const text = response.text()
  
  try {
    const parsed = JSON.parse(text) as GradingResult
    // Ensure score is within bounds
    parsed.score = Math.min(Math.max(parsed.score, 0), maxScore)
    return parsed
  } catch (error) {
    throw new Error("Failed to parse AI response")
  }
}

export async function checkSubscriptionAndDeduct(
  organizationId: string,
  estimatedTokens: number
): Promise<boolean> {
  // This would be implemented with actual database checks
  // For now, return true
  return true
}
