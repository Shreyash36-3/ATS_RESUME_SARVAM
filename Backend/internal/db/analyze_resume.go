package db

import (
	"Backend/config"
	"Backend/internal/schema"
	"context"
)

func SaveResumeAnalysis(ctx context.Context, analysis schema.ResumeAnalysis) error {
	query := `
		INSERT INTO resume_analyses (job_seeker_id, resume_url, job_description, analysis_type, ats_score, analysis_result)
		VALUES ($1, $2, $3, $4, $5, $6)`

	_, err := config.DB.Exec(ctx, query, 
		analysis.JobSeekerID, 
		analysis.ResumeURL, 
		analysis.JobDescription, 
		analysis.AnalysisType, 
		analysis.ATSScore, 
		analysis.AnalysisResult)
	return err
}

func GetResumeAnalysesBySeeker(ctx context.Context, seekerID int) ([]schema.ResumeAnalysis, error) {
	var analyses []schema.ResumeAnalysis
	query := `SELECT id, job_seeker_id, resume_url, job_description, analysis_type, ats_score, analysis_result, created_at 
			  FROM resume_analyses WHERE job_seeker_id = $1 
			  ORDER BY created_at DESC`

	rows, err := config.DB.Query(ctx, query, seekerID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	for rows.Next() {
		var a schema.ResumeAnalysis
		if err := rows.Scan(&a.ID, &a.JobSeekerID, &a.ResumeURL, &a.JobDescription, &a.AnalysisType, &a.ATSScore, &a.AnalysisResult, &a.CreatedAt); err != nil {
			return nil, err
		}
		analyses = append(analyses, a)
	}

	return analyses, nil
}

func GetUniqueResumesBySeeker(ctx context.Context, seekerID int) ([]schema.ResumeAnalysis, error) {
	var analyses []schema.ResumeAnalysis
	// Select the latest analysis for each unique resume_url
	query := `SELECT DISTINCT ON (resume_url) id, job_seeker_id, resume_url, job_description, analysis_type, ats_score, analysis_result, created_at 
			  FROM resume_analyses WHERE job_seeker_id = $1 
			  ORDER BY resume_url, created_at DESC`

	rows, err := config.DB.Query(ctx, query, seekerID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	for rows.Next() {
		var a schema.ResumeAnalysis
		if err := rows.Scan(&a.ID, &a.JobSeekerID, &a.ResumeURL, &a.JobDescription, &a.AnalysisType, &a.ATSScore, &a.AnalysisResult, &a.CreatedAt); err != nil {
			return nil, err
		}
		analyses = append(analyses, a)
	}
	return analyses, nil
}

func GetAnalysesByResume(ctx context.Context, seekerID int, resumeURL string) ([]schema.ResumeAnalysis, error) {
	var analyses []schema.ResumeAnalysis
	query := `SELECT id, job_seeker_id, resume_url, job_description, analysis_type, ats_score, analysis_result, created_at 
			  FROM resume_analyses WHERE job_seeker_id = $1 AND resume_url = $2
			  ORDER BY created_at DESC`

	rows, err := config.DB.Query(ctx, query, seekerID, resumeURL)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	for rows.Next() {
		var a schema.ResumeAnalysis
		if err := rows.Scan(&a.ID, &a.JobSeekerID, &a.ResumeURL, &a.JobDescription, &a.AnalysisType, &a.ATSScore, &a.AnalysisResult, &a.CreatedAt); err != nil {
			return nil, err
		}
		analyses = append(analyses, a)
	}
	return analyses, nil
}

func GetAnalysisByID(ctx context.Context, analysisID int) (schema.ResumeAnalysis, error) {
	var a schema.ResumeAnalysis
	query := `SELECT id, job_seeker_id, resume_url, job_description, analysis_type, ats_score, analysis_result, created_at 
			  FROM resume_analyses WHERE id = $1`

	err := config.DB.QueryRow(ctx, query, analysisID).Scan(&a.ID, &a.JobSeekerID, &a.ResumeURL, &a.JobDescription, &a.AnalysisType, &a.ATSScore, &a.AnalysisResult, &a.CreatedAt)
	return a, err
}

func DeleteAnalysisByID(ctx context.Context, seekerID, analysisID int) error {
	query := `DELETE FROM resume_analyses WHERE id = $1 AND job_seeker_id = $2`
	_, err := config.DB.Exec(ctx, query, analysisID, seekerID)
	return err
}

func DeleteAnalysesByResume(ctx context.Context, seekerID int, resumeURL string) error {
	query := `DELETE FROM resume_analyses WHERE job_seeker_id = $1 AND resume_url = $2`
	_, err := config.DB.Exec(ctx, query, seekerID, resumeURL)
	return err
}
