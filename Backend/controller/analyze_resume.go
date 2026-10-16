package controller

import (
	"Backend/config"
	"Backend/internal/db"
	"Backend/internal/helpers"
	"Backend/internal/schema"
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"io"
	"log"
	"net/http"
	"os"
	"strconv"

	"github.com/gin-gonic/gin"
	"github.com/ledongthuc/pdf"
)

func AnalyzeResume(c *gin.Context) {
	// Get Seeker ID from context (set by AuthMiddleware)
	seekerIDStr, exists := c.Get("userID")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized"})
		return
	}
	seekerID, er := strconv.Atoi(fmt.Sprintf("%v", seekerIDStr))
	if er != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid user ID"})
		return
	}

	//Daily limit check
	const dailylimit = 2
	var todayCount int

	err := config.DB.QueryRow(context.Background(), "SELECT COUNT(*) FROM resume_analyses WHERE job_seeker_id = $1 AND DATE(created_at) = CURRENT_DATE", seekerID).Scan((&todayCount))

	if err != nil {
		log.Println("Error checking daily limit:", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to verify account limits"})
		return
	}

	if todayCount >= dailylimit {
		c.JSON(http.StatusTooManyRequests, gin.H{"error": "You have reached your daily limit of 2 analyses . Come back tomorrow!"})
		return
	}
	// Parse Multipart Form
	file, header, err := c.Request.FormFile("resume")
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Failed to get resume file"})
		return
	}
	defer file.Close()

	jobDescription := c.PostForm("job_description")
	analysisType := c.PostForm("analysis_type")

	// Extract Text from PDF
	// Read file into buffer for multiple uses (extraction and upload)
	fileBytes, err := io.ReadAll(file)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to read file"})
		return
	}

	pdfText, err := extractTextFromPDF(bytes.NewReader(fileBytes), int64(len(fileBytes)))
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to extract text from PDF"})
		return
	}

	// Upload to S3
	s3Client, err := helpers.NewS3Client(
		os.Getenv("AWS_ACCESS_KEY_ID"),
		os.Getenv("AWS_SECRET_ACCESS_KEY"),
		os.Getenv("AWS_REGION"),
		os.Getenv("AWS_S3_BUCKET"),
	)
	if err != nil {
		log.Println("UPLOAD ERROR : ", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to initialize S3 client"})
		return
	}

	s3Key := fmt.Sprintf("resumes/%d/%s", seekerID, header.Filename)
	resumeURL, err := s3Client.UploadFile(context.Background(), s3Key, bytes.NewReader(fileBytes), "application/pdf")
	if err != nil {
		log.Println("UPLOAD ERROR : ", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to upload to S3"})
		return
	}
	/*resumeURL := "https://dummy-url.com/" + header.Filename*/

	// Call Sarvam AI
	sarvamAPIKey := os.Getenv("SARVAM_API_KEY")
	if sarvamAPIKey == "" {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "SARVAM_API_KEY is not configured"})
		return
	}
	prompt := constructPrompt(pdfText, jobDescription, analysisType)

	analysisResult, atsScore, err := callSarvamAI(sarvamAPIKey, prompt)
	if err != nil {
		fmt.Printf("Sarvam AI Error: %v\n", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to get analysis from Sarvam AI", "details": err.Error()})
		return
	}

	// Save to DB
	analysis := schema.ResumeAnalysis{
		JobSeekerID:    seekerID,
		ResumeURL:      resumeURL,
		JobDescription: jobDescription,
		AnalysisType:   analysisType,
		ATSScore:       atsScore,
		AnalysisResult: analysisResult,
	}

	if err := db.SaveResumeAnalysis(context.Background(), analysis); err != nil {
		// Log error but don't fail the request since analysis is done
		fmt.Printf("Failed to save analysis to DB: %v\n", err)
	}

	// Return Response
	fmt.Printf("Analysis Successful: Score=%d\n", atsScore)
	c.JSON(http.StatusOK, gin.H{
		"score":   atsScore,
		"content": analysisResult,
		"type":    analysisType,
	})
}

func extractTextFromPDF(reader io.ReaderAt, size int64) (string, error) {
	r, err := pdf.NewReader(reader, size)
	if err != nil {
		return "", err
	}

	var buf bytes.Buffer
	for i := 1; i <= r.NumPage(); i++ {
		p := r.Page(i)
		if p.V.IsNull() {
			continue
		}

		content, err := p.GetPlainText(nil)
		if err != nil {
			return "", err
		}
		buf.WriteString(content)
	}
	return buf.String(), nil
}

func constructPrompt(resumeText, jd, analysisType string) string {
	var taskPrompt string

	commonRules := `
You are a senior recruiter, resume strategist, and ATS optimization expert.

Your job is to evaluate the candidate's resume using only the information provided.
Do not invent experience, metrics, tools, degrees, or employers that are not explicitly present.
Do not mention that you are an AI.

QUALITY BAR:
- Be highly specific, practical, and insightful.
- Prioritize the most important issues first.
- Use plain professional language.
- Distinguish between "missing", "unclear", and "weakly presented".
- Focus on how to improve hiring outcomes, ATS compatibility, and recruiter readability.
- Give feedback that is candid but constructive.
- Avoid generic advice unless it is directly relevant.
- If the resume is strong in an area, say so clearly.
- If the job description and resume do not align, explain the gap precisely.
- If information is unavailable, say "Not found" rather than guessing.

SCORING GUIDELINES:
- Score based on evidence in the resume, not on potential or assumed background.
- Be consistent:
  90-100 = excellent, highly competitive
  75-89 = strong with a few gaps
  60-74 = average, needs improvement
  below 60 = weak alignment or presentation

OUTPUT RULES:
- Return valid JSON only.
- No markdown.
- No code fences.
- No extra commentary outside JSON.
- Keep arrays ordered by importance.
`

	switch analysisType {
	case "Quick Scan":
		taskPrompt = `
TASK: Perform a fast but high-signal resume review.

What to evaluate:
1. Identify the candidate's most likely profession or target role.
2. Summarize the 3 strongest points in the resume.
3. Identify the 2 highest-impact improvements.
4. Estimate ATS compatibility.
5. Give a short executive summary of overall fit and clarity.

Return JSON in this structure:
{
  "profession": string,
  "strengths": [
    string,
    string,
    string
  ],
  "improvements": [
    string,
    string
  ],
  "ats_score": number,
  "summary": string,
  "fit_assessment": string
}
`

	case "Detailed Analysis":
		taskPrompt = `
TASK: Perform a deep, recruiter-style resume analysis.

What to evaluate:
1. Identify the candidate's profession, level, and likely target role.
2. Assess the resume as a whole for clarity, impact, and competitiveness.
3. List the 5 strongest elements with concrete reasoning.
4. Identify 3-5 improvements ranked by priority and impact.
5. Review the major resume sections:
   - Header / contact info
   - Summary / headline
   - Experience
   - Skills
   - Education
   - Certifications / projects / extras, if present
6. Score the resume on:
   - Impact
   - Brevity
   - Style
   - Structure
   - Skills presentation
7. Evaluate ATS readiness and keyword alignment.
8. Call out any missing quantification, weak phrasing, formatting issues, or unclear career narrative.
9. End with a clear hiring-readiness summary.

Be specific. For each weakness, explain:
- what is wrong,
- why it matters,
- how to fix it.

Return JSON in this structure:
{
  "profession": string,
  "level": string,
  "strengths": [
    string,
    string,
    string,
    string,
    string
  ],
  "improvements": [
    string,
    string,
    string,
    string,
    string
  ],
  "ratings": {
    "impact": number,
    "brevity": number,
    "style": number,
    "structure": number,
    "skills": number
  },
  "section_review": {
    "header": string,
    "summary": string,
    "experience": string,
    "skills": string,
    "education": string,
    "additional_sections": string
  },
  "ats_score": number,
  "career_story": string,
  "hiring_readiness": string,
  "final_summary": string
}
`

	case "ATS Optimization":
		taskPrompt = `
TASK: Optimize the resume specifically for ATS performance against the job description.

What to evaluate:
1. Extract the most important keywords, skills, tools, certifications, and qualifications from the job description.
2. Compare them against the resume and identify:
   - present keywords,
   - missing keywords,
   - weakly represented keywords,
   - potentially related synonyms that should be added naturally.
3. Evaluate how well the resume mirrors the job description language without sounding stuffed or robotic.
4. Recommend exact wording changes for bullets, summary, and skills section.
5. Suggest formatting improvements that help ATS parsing.
6. Identify any risky ATS issues such as:
   - tables
   - columns
   - icons
   - graphics
   - text boxes
   - unusual section names
   - missing dates
   - inconsistent formatting
7. Give a practical priority order for optimization.

Important:
- Do not recommend keyword stuffing.
- Recommend natural keyword integration.
- Focus on matching the candidate's real background to the job description.

Return JSON in this structure:
{
  "ats_score": number,
  "keyword_matches": [
    string,
    string,
    string
  ],
  "missing_keywords": [
    string,
    string,
    string
  ],
  "weakly_present_keywords": [
    string,
    string,
    string
  ],
  "reformatting_suggestions": [
    string,
    string,
    string
  ],
  "tailoring_tips": [
    string,
    string,
    string,
    string,
    string
  ],
  "keyword_density_advice": string,
  "best_match_summary": string,
  "priority_actions": [
    string,
    string,
    string
  ]
}
`

	default:
		taskPrompt = `
TASK: Analyze the resume carefully and provide useful feedback.

Return JSON with:
{
  "summary": string,
  "ats_score": number
}
`
	}

	return fmt.Sprintf(`
%s

%s

INPUTS

RESUME:
"""
%s
"""

JOB DESCRIPTION:
"""
%s
"""
`, commonRules, taskPrompt, resumeText, jd)
}

func callSarvamAI(apiKey, prompt string) (string, int, error) {
	url := "https://api.sarvam.ai/v1/chat/completions"

	payload := map[string]interface{}{
		"model": "sarvam-105b",
		"messages": []map[string]string{
			{"role": "user", "content": prompt},
		},
		"response_format":  map[string]string{"type": "json_object"},
		"reasoning_effort": nil, // Disable reasoning tokens so they do not consume the analysis output budget.
		"max_tokens":       4096,
	}

	jsonData, _ := json.Marshal(payload)
	req, err := http.NewRequest("POST", url, bytes.NewBuffer(jsonData))
	if err != nil {
		return "", 0, err
	}

	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("api-subscription-key", apiKey)

	client := &http.Client{}
	resp, err := client.Do(req)
	if err != nil {
		return "", 0, err
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		body, _ := io.ReadAll(resp.Body)
		return "", 0, fmt.Errorf("Sarvam API error: %s", string(body))
	}

	var result struct {
		Choices []struct {
			Message struct {
				Content string `json:"content"`
			} `json:"message"`
		} `json:"choices"`
	}

	if err := json.NewDecoder(resp.Body).Decode(&result); err != nil {
		return "", 0, err
	}

	if len(result.Choices) == 0 {
		return "", 0, fmt.Errorf("no response from Sarvam AI")
	}

	var analysisMap map[string]interface{}
	if err := json.Unmarshal([]byte(result.Choices[0].Message.Content), &analysisMap); err != nil {
		// Fallback if not valid JSON score/analysis
		return result.Choices[0].Message.Content, 70, nil
	}

	// Extract score from either 'ats_score' or 'score'
	score := 70
	if s, ok := analysisMap["ats_score"].(float64); ok {
		score = int(s)
	} else if s, ok := analysisMap["score"].(float64); ok {
		score = int(s)
	}

	// Return the entire map as the analysis JSON
	analysisJSON, _ := json.Marshal(analysisMap)
	return string(analysisJSON), score, nil
}

// GetResumeHandler returns all unique resumes for the authenticated job seeker
func GetResumeHandler(c *gin.Context) {
	userIDStr, exists := c.Get("userID")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized"})
		return
	}

	userID, err := strconv.Atoi(userIDStr.(string))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid user ID"})
		return
	}

	resumes, err := db.GetUniqueResumesBySeeker(context.Background(), userID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Error fetching resumes", "details": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"success": true, "resumes": resumes})
}

// GetAnalysisHandler returns the analysis history for a specific resume based on an analysis ID
func GetAnalysisHandler(c *gin.Context) {
	userIDStr, exists := c.Get("userID")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized"})
		return
	}

	userID, err := strconv.Atoi(userIDStr.(string))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid user ID"})
		return
	}

	analysisID, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid analysis ID"})
		return
	}

	// First get the specific analysis to find the resume_url
	analysis, err := db.GetAnalysisByID(context.Background(), analysisID)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Analysis not found"})
		return
	}

	// Ensure the seeker owns this analysis
	if analysis.JobSeekerID != userID {
		c.JSON(http.StatusForbidden, gin.H{"error": "Forbidden"})
		return
	}

	// Get all analyses for this resume_url
	history, err := db.GetAnalysesByResume(context.Background(), userID, analysis.ResumeURL)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Error fetching analysis history"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"current": analysis,
		"history": history,
	})
}

// DeleteAnalysisHandler deletes a specific analysis record
func DeleteAnalysisHandler(c *gin.Context) {
	userIDStr, exists := c.Get("userID")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized"})
		return
	}

	userID, _ := strconv.Atoi(userIDStr.(string))
	analysisID, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid analysis ID"})
		return
	}

	err = db.DeleteAnalysisByID(context.Background(), userID, analysisID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Error deleting analysis"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"success": true, "message": "Analysis deleted successfully"})
}

// DeleteResumeHandler deletes all analysis records for a specific resume URL
func DeleteResumeHandler(c *gin.Context) {
	userIDStr, exists := c.Get("userID")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized"})
		return
	}

	userID, _ := strconv.Atoi(userIDStr.(string))
	var req struct {
		ResumeURL string `json:"resume_url" binding:"required"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Resume URL is required"})
		return
	}

	err := db.DeleteAnalysesByResume(context.Background(), userID, req.ResumeURL)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Error deleting resume history"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"success": true, "message": "Resume history deleted successfully"})
}

func GetUsageCountHandler(c *gin.Context) {
	// Grab the hardcoded "1" from your dummy middleware
	userID := c.GetString("userID")

	var count int
	// Count how many times this user ID appears in the analyses table
	err := config.DB.QueryRow(context.Background(), "SELECT COUNT(*) FROM resume_analyses WHERE user_id = $1", userID).Scan(&count)
	if err != nil {
		log.Println("Database count error:", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to count usage"})
		return
	}

	// Send the number back to React
	c.JSON(http.StatusOK, gin.H{"usage_count": count})
}
