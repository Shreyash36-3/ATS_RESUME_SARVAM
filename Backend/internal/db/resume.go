package db

import (
	"Backend/config"
	"Backend/internal/schema"
	"context"
	"encoding/json"
)

func SaveResume(ctx context.Context, seekerID int, input schema.CreateResumeInput) (int, error) {
	contentJSON, err := json.Marshal(input.Content)
	if err != nil {
		return 0, err
	}

	query := `
		INSERT INTO saved_resumes (job_seeker_id, resume_name, template_id, content)
		VALUES ($1, $2, $3, $4)
		RETURNING id
	`
	var id int
	err = config.DB.QueryRow(ctx, query, seekerID, input.ResumeName, input.TemplateID, contentJSON).Scan(&id)
	return id, err
}

func GetResumesBySeeker(ctx context.Context, seekerID int) ([]schema.SavedResume, error) {
	query := `
		SELECT id, job_seeker_id, resume_name, template_id, content, created_at, updated_at
		FROM saved_resumes
		WHERE job_seeker_id = $1
		ORDER BY updated_at DESC
	`
	rows, err := config.DB.Query(ctx, query, seekerID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var resumes []schema.SavedResume
	for rows.Next() {
		var r schema.SavedResume
		var contentJSON []byte
		err := rows.Scan(&r.ID, &r.JobSeekerID, &r.ResumeName, &r.TemplateID, &contentJSON, &r.CreatedAt, &r.UpdatedAt)
		if err != nil {
			return nil, err
		}
		json.Unmarshal(contentJSON, &r.Content)
		resumes = append(resumes, r)
	}
	return resumes, nil
}

func GetResumeByID(ctx context.Context, id int, seekerID int) (schema.SavedResume, error) {
	query := `
		SELECT id, job_seeker_id, resume_name, template_id, content, created_at, updated_at
		FROM saved_resumes
		WHERE id = $1 AND job_seeker_id = $2
	`
	var r schema.SavedResume
	var contentJSON []byte
	err := config.DB.QueryRow(ctx, query, id, seekerID).Scan(&r.ID, &r.JobSeekerID, &r.ResumeName, &r.TemplateID, &contentJSON, &r.CreatedAt, &r.UpdatedAt)
	if err != nil {
		return r, err
	}
	json.Unmarshal(contentJSON, &r.Content)
	return r, nil
}

func DeleteResume(ctx context.Context, id int, seekerID int) error {
	query := `DELETE FROM saved_resumes WHERE id = $1 AND job_seeker_id = $2`
	_, err := config.DB.Exec(ctx, query, id, seekerID)
	return err
}

func UpdateSavedResume(ctx context.Context, id int, seekerID int, input schema.CreateResumeInput) error {
	contentJSON, err := json.Marshal(input.Content)
	if err != nil {
		return err
	}

	query := `
		UPDATE saved_resumes
		SET resume_name = $1, template_id = $2, content = $3, updated_at = CURRENT_TIMESTAMP
		WHERE id = $4 AND job_seeker_id = $5
	`
	_, err = config.DB.Exec(ctx, query, input.ResumeName, input.TemplateID, contentJSON, id, seekerID)
	return err
}
