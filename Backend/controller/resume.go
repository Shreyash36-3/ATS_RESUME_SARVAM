package controller

import (
	"Backend/internal/db"
	"Backend/internal/schema"
	"bytes"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"os"
	"strconv"

	"github.com/gin-gonic/gin"
)

func SaveResumeHandler(c *gin.Context) {
	seekerIDStr := c.Param("id")
	seekerID, _ := strconv.Atoi(seekerIDStr)

	var input schema.CreateResumeInput
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	id, err := db.SaveResume(c.Request.Context(), seekerID, input)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to save resume"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Resume saved successfully", "id": id})
}

func GetResumesHandler(c *gin.Context) {
	seekerIDStr := c.Param("id")
	seekerID, _ := strconv.Atoi(seekerIDStr)

	resumes, err := db.GetResumesBySeeker(c.Request.Context(), seekerID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch resumes"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"resumes": resumes})
}

func GetResumeDetailHandler(c *gin.Context) {
	seekerIDStr := c.Query("seeker_id") // Pass as query param or check from context
	seekerID, _ := strconv.Atoi(seekerIDStr)
	idStr := c.Param("id")
	id, _ := strconv.Atoi(idStr)

	resume, err := db.GetResumeByID(c.Request.Context(), id, seekerID)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Resume not found"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"resume": resume})
}

func DeleteSavedResumeHandler(c *gin.Context) {
	seekerIDStr := c.Query("seeker_id")
	seekerID, _ := strconv.Atoi(seekerIDStr)
	idStr := c.Param("id")
	id, _ := strconv.Atoi(idStr)

	err := db.DeleteResume(c.Request.Context(), id, seekerID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to delete resume"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Resume deleted successfully"})
}

func ExtractResumeHandler(c *gin.Context) {
	file, header, err := c.Request.FormFile("resume")
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Failed to get resume file"})
		return
	}
	defer file.Close()

	// Extract Text from PDF
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

	// Call Sarvam AI for extraction. The shared callSarvamAI helper is defined
	// in analyze_resume_sarvam.go in the same package.
	sarvamAPIKey := os.Getenv("SARVAM_API_KEY")
	if sarvamAPIKey == "" {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "SARVAM_API_KEY is not configured"})
		return
	}

	prompt := constructExtractionPrompt(pdfText)
	analysisResult, _, err := callSarvamAI(sarvamAPIKey, prompt)
	if err != nil {
		fmt.Printf("Sarvam AI Extraction Error: %v\n", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to extract data using AI", "details": err.Error()})
		return
	}

	var extractedData map[string]interface{}
	if err := json.Unmarshal([]byte(analysisResult), &extractedData); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to parse AI response"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"success":  true,
		"data":     extractedData,
		"filename": header.Filename,
	})
}

func constructExtractionPrompt(resumeText string) string {
	return fmt.Sprintf(`
TASK: Extract structured data from the following resume text. 

FORMAT: Return ONLY a valid JSON object. No markdown, no commentary.

STRUCTURE:
{
  "first_name": string,
  "last_name": string,
  "email": string,
  "phone_number": string,
  "location": string,
  "linkedin_url": string,
  "education": [
    {
      "education_level": string (e.g. B.Tech, MBA),
      "institution_name": string,
      "field_of_study": string,
      "start_year": string,
      "end_year": string,
      "grade": string (GPA or Percentage if found)
    }
  ],
  "experience": [
    {
      "job_title": string,
      "company_name": string,
      "location": string,
      "start_date": string (ISO or YYYY-MM),
      "end_date": string (ISO or YYYY-MM or null),
      "description": string (Detailed responsibilities and achievements)
    }
  ],
  "skills": [
    {
      "name": string,
      "level": string (Beginner, Intermediate, Advanced, Expert)
    }
  ],
  "custom_sections": [
     {
       "heading": string,
       "content": string (multi-line text)
     }
  ]
}

RULES:
- If a field is missing, use an empty string "" or empty array [].
- For skills level, estimate based on experience if not explicitly stated.
- Put any sections that don't fit into the fixed categories (like Projects, Awards, Certifications, Languages) into "custom_sections".

RESUME TEXT:
"""
%s
"""
`, resumeText)
}

func UpdateResumeHandler(c *gin.Context) {
	seekerIDStr := c.Param("id") // Seeker id
	seekerID, _ := strconv.Atoi(seekerIDStr)
	resumeIDStr := c.Query("resume_id")
	resumeID, _ := strconv.Atoi(resumeIDStr)

	var input schema.CreateResumeInput
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	err := db.UpdateSavedResume(c.Request.Context(), resumeID, seekerID, input)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update resume"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Resume updated successfully"})
}
