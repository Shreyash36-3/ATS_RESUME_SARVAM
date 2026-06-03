package schema

import "time"

type ResumeAnalysis struct {
	ID             int       `json:"id"`
	JobSeekerID    int       `json:"job_seeker_id"`
	ResumeURL      string    `json:"resume_url"`
	JobDescription string    `json:"job_description"`
	AnalysisType   string    `json:"analysis_type"`
	ATSScore       int       `json:"ats_score"`
	AnalysisResult string    `json:"analysis_result"`
	CreatedAt      time.Time `json:"created_at"`
}
