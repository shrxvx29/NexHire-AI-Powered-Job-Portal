import Groq from "groq-sdk";
// --------------------------------------------------
// Groq Configuration
// --------------------------------------------------
const groq = new Groq({
    apiKey: process.env.GROQ_API_KEY,
});
const AI_MODEL = "openai/gpt-oss-120b";
// --------------------------------------------------
// Reusable AI Helper
// --------------------------------------------------
const generateAIResponse = async (systemPrompt, userPrompt) => {
    const completion = await groq.chat.completions.create({
        model: AI_MODEL,
        messages: [
            {
                role: "system",
                content: systemPrompt,
            },
            {
                role: "user",
                content: userPrompt,
            },
        ],
        temperature: 0.5,
    });
    return completion.choices[0]?.message?.content?.trim() || "";
};
// --------------------------------------------------
// Parse JSON Safely
// --------------------------------------------------
const parseAIJson = (content) => {
    const cleanedContent = content
        .replace(/^```json\s*/i, "")
        .replace(/^```\s*/i, "")
        .trim()
        .replace(/\s*```$/, "");
    return JSON.parse(cleanedContent);
};
// --------------------------------------------------
// Error Helper
// --------------------------------------------------
const getErrorMessage = (error) => {
    return error instanceof Error
        ? error.message
        : "Unknown error occurred";
};
// ==================================================
// 1. Career Chat
// POST /api/ai/career-chat
// ==================================================
export const careerChat = async (req, res) => {
    try {
        const { message, history = [] } = req.body;
        if (typeof message !== "string" ||
            !message.trim()) {
            res.status(400).json({
                success: false,
                message: "Please enter your message.",
            });
            return;
        }
        if (message.length > 5000) {
            res.status(400).json({
                success: false,
                message: "Message must not exceed 5,000 characters.",
            });
            return;
        }
        if (!Array.isArray(history) || history.length > 10) {
            res.status(400).json({
                success: false,
                message: "Chat history must be an array containing at most 10 messages.",
            });
            return;
        }
        const validHistory = history.every((item) => typeof item === "object" &&
            item !== null &&
            "role" in item &&
            "content" in item &&
            (item.role === "user" || item.role === "assistant") &&
            typeof item.content === "string" &&
            item.content.length <= 5000);
        if (!validHistory) {
            res.status(400).json({
                success: false,
                message: "Invalid chat history format.",
            });
            return;
        }
        const messages = [
            {
                role: "system",
                content: `
You are NexHire's AI Career Assistant.

Help users with:
- Career planning and job search strategies
- Resume and interview preparation
- Technical skill development
- Career transitions and professional growth
- Job application advice

Give practical, clear, supportive answers.
Do not invent job openings, salaries, or company policies.
Ask clarifying questions when necessary.
                `.trim(),
            },
            ...history.map(({ role, content }) => ({
                role,
                content,
            })),
            {
                role: "user",
                content: message.trim(),
            },
        ];
        const completion = await groq.chat.completions.create({
            model: AI_MODEL,
            messages,
            temperature: 0.6,
        });
        const reply = completion.choices[0]?.message?.content?.trim() || "";
        res.status(200).json({
            success: true,
            message: "Career assistant response generated.",
            data: {
                reply,
            },
        });
    }
    catch (error) {
        console.error("Career chat error:", getErrorMessage(error));
        res.status(500).json({
            success: false,
            message: "Unable to generate a response. Please try again.",
        });
    }
};
// ==================================================
// 2. Resume Analysis
// POST /api/ai/analyse-resume
// ==================================================
export const analyseResume = async (req, res) => {
    try {
        const { resumeText, jobDescription = "", } = req.body;
        if (typeof resumeText !== "string" ||
            !resumeText.trim()) {
            res.status(400).json({
                success: false,
                message: "Resume text is required.",
            });
            return;
        }
        if (resumeText.length > 30000) {
            res.status(400).json({
                success: false,
                message: "Resume text must not exceed 30,000 characters.",
            });
            return;
        }
        if (typeof jobDescription !== "string" ||
            jobDescription.length > 10000) {
            res.status(400).json({
                success: false,
                message: "Job description must not exceed 10,000 characters.",
            });
            return;
        }
        const systemPrompt = `
You are an experienced resume reviewer and career advisor.

Analyze resumes honestly. Never invent qualifications, achievements,
skills, education, or experience.

If a job description is provided, evaluate the resume against it.
Otherwise, evaluate general resume quality.

Return ONLY valid JSON in this format:
{
  "summary": "Professional summary of the candidate",
  "overallScore": 0,
  "strengths": ["strength 1"],
  "weaknesses": ["weakness 1"],
  "technicalSkills": ["skill 1"],
  "missingSkills": ["skill 1"],
  "atsKeywords": ["keyword 1"],
  "improvements": ["actionable suggestion 1"]
}

overallScore must be an integer between 0 and 100.
This is an approximate AI assessment, not a real ATS score.
If evidence is missing, say it is not evident rather than claiming
the candidate definitely lacks the skill.
        `.trim();
        const userPrompt = `
RESUME:
${resumeText.trim()}

JOB DESCRIPTION:
${jobDescription.trim() || "Not provided"}
        `.trim();
        const result = await generateAIResponse(systemPrompt, userPrompt);
        let analysis;
        try {
            analysis = parseAIJson(result);
        }
        catch {
            res.status(502).json({
                success: false,
                message: "AI returned an invalid analysis. Please try again.",
            });
            return;
        }
        res.status(200).json({
            success: true,
            message: "Resume analyzed successfully.",
            data: analysis,
        });
    }
    catch (error) {
        console.error("Resume analysis error:", getErrorMessage(error));
        res.status(500).json({
            success: false,
            message: "Failed to analyze resume.",
        });
    }
};
// ==================================================
// 3. Job Match Score
// POST /api/ai/job-match-score
// ==================================================
export const jobMatchScore = async (req, res) => {
    try {
        const { resumeText, jobDescription, } = req.body;
        if (typeof resumeText !== "string" ||
            !resumeText.trim() ||
            typeof jobDescription !== "string" ||
            !jobDescription.trim()) {
            res.status(400).json({
                success: false,
                message: "Both resume text and job description are required.",
            });
            return;
        }
        if (resumeText.length > 30000 ||
            jobDescription.length > 10000) {
            res.status(400).json({
                success: false,
                message: "Resume or job description exceeds the allowed length.",
            });
            return;
        }
        const systemPrompt = `
You are an AI job-matching assistant.

Compare the candidate's resume with the job description.
Base your assessment on evidence in the supplied text.

Return ONLY valid JSON in this format:
{
  "matchScore": 0,
  "matchLevel": "Strong Match",
  "matchedSkills": ["skill 1"],
  "missingSkills": ["skill 1"],
  "relevantExperience": ["evidence from resume"],
  "recommendations": ["recommendation 1"],
  "explanation": "Short explanation of the score"
}

matchScore must be an integer between 0 and 100.
matchLevel must be one of:
"Strong Match", "Moderate Match", or "Low Match".

Do not invent experience or skills.
Do not use protected personal characteristics to determine the score.
The score is an estimate, not a hiring decision.
        `.trim();
        const userPrompt = `
CANDIDATE RESUME:
${resumeText.trim()}

JOB DESCRIPTION:
${jobDescription.trim()}
        `.trim();
        const result = await generateAIResponse(systemPrompt, userPrompt);
        let matchData;
        try {
            matchData = parseAIJson(result);
        }
        catch {
            res.status(502).json({
                success: false,
                message: "AI returned an invalid match score. Please try again.",
            });
            return;
        }
        res.status(200).json({
            success: true,
            message: "Job match analysis completed.",
            data: matchData,
        });
    }
    catch (error) {
        console.error("Job match score error:", getErrorMessage(error));
        res.status(500).json({
            success: false,
            message: "Failed to calculate job match score.",
        });
    }
};
// ==================================================
// 4. Generate Cover Letter
// POST /api/ai/generate-cover-letter
// ==================================================
export const generateCoverLetter = async (req, res) => {
    try {
        const { resumeText, jobTitle, companyName, jobDescription = "", } = req.body;
        if (typeof resumeText !== "string" ||
            !resumeText.trim() ||
            typeof jobTitle !== "string" ||
            !jobTitle.trim() ||
            typeof companyName !== "string" ||
            !companyName.trim()) {
            res.status(400).json({
                success: false,
                message: "Resume text, job title, and company name are required.",
            });
            return;
        }
        if (resumeText.length > 30000 ||
            jobTitle.length > 200 ||
            companyName.length > 200 ||
            typeof jobDescription !== "string" ||
            jobDescription.length > 10000) {
            res.status(400).json({
                success: false,
                message: "One or more fields exceed the allowed length.",
            });
            return;
        }
        const systemPrompt = `
You are a professional cover-letter writer.

Create a concise, tailored, professional cover letter using the
candidate's actual resume and the supplied job information.

Rules:
- Never invent experience, qualifications, projects, or achievements.
- Highlight relevant skills and genuine evidence from the resume.
- Do not claim the candidate has experience that is not stated.
- Avoid generic filler and exaggerated claims.
- Use a professional greeting and closing.
- Return only the finished cover letter, without Markdown fences
  or explanatory commentary.
        `.trim();
        const userPrompt = `
JOB TITLE:
${jobTitle.trim()}

COMPANY:
${companyName.trim()}

JOB DESCRIPTION:
${jobDescription.trim() || "Not provided"}

CANDIDATE RESUME:
${resumeText.trim()}

Write a tailored cover letter for this application.
        `.trim();
        const coverLetter = await generateAIResponse(systemPrompt, userPrompt);
        res.status(200).json({
            success: true,
            message: "Cover letter generated successfully.",
            data: {
                coverLetter,
            },
        });
    }
    catch (error) {
        console.error("Cover letter generation error:", getErrorMessage(error));
        res.status(500).json({
            success: false,
            message: "Failed to generate cover letter.",
        });
    }
};
//# sourceMappingURL=aiController.js.map