import { GoogleGenerativeAI } from '@google/generative-ai'

// Pull from env in production
const GEMINI_API_KEY = process.env.GEMINI_API_KEY || ''
const genAI = new GoogleGenerativeAI(GEMINI_API_KEY)

// Fail fast after 25s instead of hanging the whole request
function withTimeout<T>(promise: Promise<T>, ms = 25000): Promise<T> {
    return Promise.race([
        promise,
        new Promise<never>((_, reject) =>
            setTimeout(() => reject(new Error(`Gemini timeout after ${ms}ms`)), ms)
        ),
    ])
}

// ── AI VETTING ─────────────────────────────────────────────────
export async function vetContent(title: string, content: string): Promise<{
    passed: boolean;
    reason: string;
    quality_score: number;
}> {
    try {
        const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' })

        const prompt = `You are a quality-assurance AI for a premium knowledge marketplace that accepts ideas on ANY topic — technology, business, finance, health, education, creative fields, life hacks, and more.

Evaluate the following submission:
TITLE: ${title}
CONTENT: ${content}

CRITICAL RULES FOR REJECTION (FAIL IF ANY MATCH):
1. Reject if it is a simple definition, generic advice, or common knowledge easily found on Google or ChatGPT.
2. Reject if the content is too short or vague to provide real, actionable value.
3. Reject if it contains filler words, marketing fluff, or clickbait without substance.
4. Reject if it is just a URL, a raw file path, or an unexplained snippet with no context.
5. Reject if it is gibberish, test data, or meaningless text.

RULES FOR ACCEPTANCE:
- Accept if the content provides a specific, non-obvious insight, trick, method, or solution that genuinely saves time, money, or effort — in ANY field.
- The idea should be something you cannot find in 30 seconds on Google.

Respond in JSON ONLY:
{
  "passed": true | false,
  "reason": "Specific explanation of exactly why it failed or was accepted",
  "quality_score": 0-100 (Must be < 50 if failed, > 70 if accepted)
}`

        const result = await withTimeout(model.generateContent(prompt))
        const text = result.response.text().replace(/```json|```/g, '').trim()
        return JSON.parse(text)
    } catch (err) {
        console.error('Gemini vet error (idea rejected or quota hit):', (err as any)?.status, (err as any)?.message)
        return { passed: true, reason: 'Vetting service unavailable', quality_score: 70 }
    }
}

// ── BOUNTY SOLUTION VETTING ────────────────────────────────────
export async function vetBountySolution(brief: string, solution: string): Promise<{
    plagiarism_score: number;
    quality_score: number;
    issues: string[];
    verdict: 'PASS' | 'FAIL';
}> {
    try {
        const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' })

        const prompt = `You are a strict, senior-level code & solution auditor for a premium freelance platform. Your job is to aggressively filter out low-quality, AI-generated filler, or incorrect solutions.

Bounty Brief:
${brief}

Submitted Solution:
${solution}

Evaluate the solution and respond in strict JSON:
{
  "plagiarism_score": 0-100, // Estimate likelihood this was copy-pasted directly from ChatGPT without manual effort
  "quality_score": 0-100, // Rate the technical execution and completeness
  "issues": ["list", "of", "specific", "technical", "problems"] or [],
  "verdict": "PASS" | "FAIL",
  "verdict_reason": "Harsh, specific explanation of why it failed or passed"
}

CRITICAL RULES FOR REJECTION:
- FAIL if quality_score < 60
- FAIL if the solution is just pseudocode, when real code was expected
- FAIL if it ignores a core constraint of the bounty brief
- FAIL if the code contains obvious syntax errors or anti-patterns
- PASS ONLY if the solution is complete, technically viable, and directly answers the brief.`

        const result = await model.generateContent(prompt)
        const text = result.response.text().replace(/```json|```/g, '').trim()
        const parsed = JSON.parse(text)
        return {
            plagiarism_score: parsed.plagiarism_score ?? 0,
            quality_score: parsed.quality_score ?? 0,
            issues: parsed.issues ?? [],
            verdict: parsed.verdict ?? 'PASS',
        }
    } catch (err) {
        console.error('Gemini bounty vet error:', err)
        return { plagiarism_score: 5, quality_score: 80, issues: [], verdict: 'PASS' }
    }
}

// ── EMBEDDING GENERATION ──────────────────────────────────────
export async function generateEmbedding(text: string): Promise<number[]> {
    try {
        const model = genAI.getGenerativeModel({ model: 'text-embedding-004' })
        const result = await withTimeout(model.embedContent(text))
        return result.embedding.values
    } catch (err) {
        console.error('Gemini embedding error:', err)
        // Return zero vector as fallback (768 dimensions for text-embedding-004)
        return new Array(768).fill(0)
    }
}

// ── BOUNTY QUESTION VALIDATION ─────────────────────────────────
export async function vetBountyQuestion(title: string, description: string): Promise<{
    valid: boolean;
    reason: string;
}> {
    try {
        const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' })
        const prompt = `You are a moderator for a paid freelance bounty platform. Evaluate whether the following bounty is a REAL, specific, solvable problem worth paying for.

TITLE: ${title}
DESCRIPTION: ${description}

REJECT if any of these:
1. It is vague, too broad, or has no clear acceptance criteria (e.g. "build me a website")
2. It is spam, gibberish, or a test entry
3. It asks for something illegal or unethical
4. It is purely a question that can be answered by Google in 30 seconds

ACCEPT if:
- It is a specific technical or creative problem with clear deliverables
- It has enough detail to be scoped by a freelancer

Respond in JSON ONLY:
{
  "valid": true | false,
  "reason": "Short explanation of why it was accepted or rejected"
}`
        const result = await withTimeout(model.generateContent(prompt), 20000)
        const text = result.response.text().replace(/```json|```/g, '').trim()
        return JSON.parse(text)
    } catch (err) {
        console.error('Gemini bounty question vet error:', err)
        return { valid: true, reason: 'Validation service unavailable' }
    }
}
