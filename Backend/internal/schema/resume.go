package schema

import "time"

type SavedResume struct {
	ID           int       `json:"id"`
	JobSeekerID  int       `json:"job_seeker_id"`
	ResumeName   string    `json:"resume_name" binding:"required"`
	TemplateID   string    `json:"template_id" binding:"required"`
	Content      interface{} `json:"content" binding:"required"`
	CreatedAt    time.Time `json:"created_at"`
	UpdatedAt    time.Time `json:"updated_at"`
}

type CreateResumeInput struct {
	ResumeName  string      `json:"resume_name" binding:"required"`
	TemplateID  string      `json:"template_id" binding:"required"`
	Content     interface{} `json:"content" binding:"required"`
}
