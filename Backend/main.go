package main

import (
	"Backend/config"
	"Backend/controller"
	"log"

	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"
)

// Dummy auth middleware to mimic what your controllers expect
func DummyAuthMiddleware() gin.HandlerFunc {
	return func(c *gin.Context) {
		// Hardcoding a user ID of 1 for local testing
		c.Set("userID", "1")
		c.Next()
	}
}

func main() {
	// 1. Connect to Database
	config.ConnectDB()

	// 2. Initialize Gin Router
	r := gin.Default()

	// 3. Configure CORS (Allows React frontend to talk to this backend)
	// 3. Configure Custom CORS
	r.Use(cors.New(cors.Config{
		AllowAllOrigins:  true,
		AllowMethods:     []string{"GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"},
		AllowHeaders:     []string{"Origin", "Content-Type", "Accept", "Authorization"}, // <-- Allows your token!
		ExposeHeaders:    []string{"Content-Length"},
		AllowCredentials: true,
	}))

	// 4. Setup Routes
	api := r.Group("/ats")
	api.Use(DummyAuthMiddleware())
	{
		// Analysis routes (mapped to analyze_resume.go)
		api.POST("/analyze", controller.AnalyzeResume)
		api.GET("/get_resume", controller.GetResumeHandler)
		api.GET("/get_resume_analysis/:id", controller.GetAnalysisHandler)
		api.DELETE("/delete_analysis/:id", controller.DeleteAnalysisHandler)
		api.DELETE("/delete_resume", controller.DeleteResumeHandler)

		// Resume extraction & saving routes (mapped to resume.go)
		api.POST("/extract", controller.ExtractResumeHandler)
		api.POST("/save/:id", controller.SaveResumeHandler)
		api.GET("/resumes/:id", controller.GetResumesHandler)
		api.GET("/resume/:id", controller.GetResumeDetailHandler)
		api.DELETE("/resume/:id", controller.DeleteSavedResumeHandler)
		api.PUT("/resume/:id", controller.UpdateResumeHandler)
	}

	// 5. Start Server
	log.Println("Server running on http://localhost:8080")
	r.Run(":8080")
}
