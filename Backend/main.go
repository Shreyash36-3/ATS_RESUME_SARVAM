package main

import (
	"Backend/config"
	"Backend/controller"
	"log"
	"net/http"
	"os"

	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"
	"github.com/joho/godotenv"
)

// auth middleware
func InternalAuthMiddleware() gin.HandlerFunc {
	return func(c *gin.Context) {
		studentID := c.GetHeader("X-Internal-Student-ID")
		if studentID == "" {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "Missing internal authentication header"})
			c.Abort()
			return
		}
		c.Set("userID", studentID)
		c.Next()
	}
}

func main() {
	// Connect to Database
	err := godotenv.Load()
	if err != nil {
		log.Println("No .env file")
	}
	config.ConnectDB()

	// Initialize Gin Router
	r := gin.Default()

	// Configure CORS (Allows React frontend to talk to this backend)
	// Configure Custom CORS
	r.Use(cors.New(cors.Config{
		AllowAllOrigins:  true,
		AllowMethods:     []string{"GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"},
		AllowHeaders:     []string{"Origin", "Content-Type", "Accept", "Authorization"}, // <-- Allows your token!
		ExposeHeaders:    []string{"Content-Length"},
		AllowCredentials: true,
	}))

	// Setup Routes
	api := r.Group("/ats")
	api.Use(InternalAuthMiddleware())
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

	// Start Server
	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}
	log.Println("Server running on port " + port)
	r.Run(":" + port)
}
