import React, { useState, useEffect } from "react";
import { getToken } from "../tokenUtils";
import { 
  FaFileUpload, 
  FaFile, 
  FaRobot, 
  FaSearch, 
  FaListAlt, 
  FaCheckCircle, 
  FaExclamationTriangle, 
  FaFileAlt, 
  FaMagic,
  FaHistory,
  FaArrowLeft
} from 'react-icons/fa';
import AtsHistory from "./AtsHistory";
import AtsDetail from "./AtsDetail";


const ATSChecker = () => {
  const [file, setFile] = useState(null);
  const [jobDescription, setJobDescription] = useState("");
  const [analysisType, setAnalysisType] = useState("Quick Scan");
  const [response, setResponse] = useState(null);
  const [loading, setLoading] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [view, setView] = useState("checker"); // checker, history, detail
  const [selectedAnalysisId, setSelectedAnalysisId] = useState(null);

  // Animation settings
  useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, []);

  const handleHistoryView = (id) => {
    setSelectedAnalysisId(id);
    setView("detail");
  };

  const analyzeResume = async () => {
    if (!file) {
      alert("Please upload a resume file first");
      return;
    }
    
    setLoading(true);
    setResponse(null);
    setUploadProgress(10);

    try {
      setUploadProgress(30);

      const formData = new FormData();
      formData.append("resume", file);
      formData.append("job_description", jobDescription);
      formData.append("analysis_type", analysisType);

      const token = getToken();
      const response = await fetch(`${import.meta.env.VITE_API_URL}/ats/analyze`, {
        method: "POST",
        headers: {
          Authorization: token || "job-seeker-token",
        },
        body: formData,
      });

      setUploadProgress(70);

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to analyze resume");
      }

      const data = await response.json();
      
      setResponse({
        type: data.type,
        content: data.content,
        score: data.score,
      });
      setLoading(false);
      setUploadProgress(100);
    } catch (error) {
      console.error("Error analyzing resume:", error);
      setResponse({ 
        type: "Error", 
        content: error.message || "Failed to analyze resume. Please try again.",
        error: true
      });
      setLoading(false);
    }
  };

  const handleFileChange = (event) => {
    if (event.target.files && event.target.files[0]) {
      setFile(event.target.files[0]);
    }
  };

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      if (e.dataTransfer.files[0].type === "application/pdf") {
        setFile(e.dataTransfer.files[0]);
      } else {
        alert("Please upload a PDF file only");
      }
    }
  };

  const resetAnalysis = () => {
    setResponse(null);
    setUploadProgress(0);
  };

  // Determine if we should show the input section (left column)
  // After scanning (response exists), we hide the left section
  const showInputSection = !response;

  // Results content that will be used in both layouts
  const renderResults = () => {
    if (!response && !loading) {
      return (
        <div className="flex flex-col items-center justify-center h-[80%] text-center">
          <div className="h-20 w-20 mb-6 bg-gray-700/50 rounded-full flex items-center justify-center">
            <FaRobot className="text-gray-500 text-3xl" />
          </div>
          <h3 className="text-xl font-semibold mb-2 text-gray-300">No Analysis Yet</h3>
          <p className="text-gray-400 max-w-md">
            Upload your resume and click "Analyze Resume" to see how your CV performs with Applicant Tracking Systems
          </p>
        </div>
      );
    }

    if (!response && loading) {
      return (
        <div className="flex flex-col items-center justify-center h-[80%] text-center">
          <div className="h-20 w-20 mb-6 bg-blue-500/20 rounded-full flex items-center justify-center animate-pulse">
            <FaRobot className="text-blue-400 text-3xl" />
          </div>
          <h3 className="text-xl font-semibold mb-2 text-blue-300">Analyzing Your Resume</h3>
          <p className="text-gray-400 max-w-md mb-6">
            We're processing your resume and job description. This will only take a moment...
          </p>
          <div className="w-64 h-1.5 bg-gray-700 rounded-full overflow-hidden">
            <div 
              className="h-full bg-blue-500 rounded-full transition-all duration-300"
              style={{ width: `${uploadProgress}%` }}
            />
          </div>
        </div>
      );
    }

    if (response && response.error) {
      return (
        <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-6">
          <div className="flex items-center mb-4">
            <div className="h-12 w-12 bg-red-500/20 rounded-full flex items-center justify-center mr-4">
              <FaExclamationTriangle className="text-red-400 text-2xl" />
            </div>
            <h3 className="text-xl font-bold text-red-400">Analysis Failed</h3>
          </div>
          <p className="text-gray-300 mb-4">{response.content}</p>
          <button
            onClick={resetAnalysis}
            className="px-4 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-600 transition-colors inline-flex items-center"
          >
            Try Again
          </button>
        </div>
      );
    }

    if (response) {
      return (
        <div className="animate-fadeIn space-y-6">
          {/* Score & Summary Card */}
          <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-2xl p-8 border border-blue-500/20 shadow-2xl relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/10 rounded-full -mr-16 -mt-16 blur-3xl group-hover:bg-blue-500/20 transition-all duration-500"></div>
            
            <div className="flex flex-col md:flex-row items-center justify-between gap-8 relative z-10">
              <div className="flex-1 text-center md:text-left">
                <h3 className="text-3xl font-bold text-white mb-2">{response.type} Results</h3>
                <p className="text-gray-400">Analysis completed successfully</p>
                <div className="mt-4 flex flex-wrap justify-center md:justify-start gap-3">
                  <span className="px-3 py-1 bg-blue-500/10 text-blue-400 rounded-full text-xs font-medium border border-blue-500/20 flex items-center">
                    <FaCheckCircle className="mr-1" /> PDF Verified
                  </span>
                  <span className="px-3 py-1 bg-purple-500/10 text-purple-400 rounded-full text-xs font-medium border border-purple-500/20 flex items-center">
                    <FaRobot className="mr-1" /> AI Powered
                  </span>
                </div>
              </div>

              {response.score && (
                <div className="flex flex-col items-center justify-center p-6 bg-gray-900/50 rounded-2xl border border-gray-700/50">
                  <div className="relative h-24 w-24">
                    <svg className="w-full h-full" viewBox="0 0 36 36">
                      <path
                        d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                        fill="none"
                        stroke="#1f2937"
                        strokeWidth="3"
                      />
                      <path
                        d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                        fill="none"
                        stroke={response.score >= 80 ? "#10b981" : response.score >= 60 ? "#3b82f6" : "#f59e0b"}
                        strokeWidth="3"
                        strokeDasharray={`${response.score}, 100`}
                        className="transition-all duration-1000 ease-out"
                      />
                      <text x="18" y="20.5" textAnchor="middle" fontSize="10" fill="white" fontWeight="bold">
                        {response.score}
                      </text>
                    </svg>
                  </div>
                  <div className="mt-3 text-center">
                    <div className="text-xs font-medium text-gray-500 uppercase tracking-wider">Overall Score</div>
                    <div className={`text-xl font-bold ${
                      response.score >= 80 ? 'text-green-400' : 
                      response.score >= 60 ? 'text-blue-400' : 
                      'text-yellow-400'
                    }`}>
                      {response.score >= 80 ? 'Excellent' : response.score >= 60 ? 'Good' : 'Needs Work'}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Detailed Analysis Sections */}
          <div className="grid grid-cols-1 gap-6">
            {(() => {
              let analysisData = null;
              try {
                analysisData = typeof response.content === 'string' ? JSON.parse(response.content) : response.content;
              } catch (e) {
                return (
                  <div className="bg-gray-800/40 backdrop-blur-sm border border-gray-700/50 rounded-xl p-6">
                    <div className="whitespace-pre-line text-gray-300 leading-relaxed">
                      {response.content}
                    </div>
                  </div>
                );
              }

              if (!analysisData) return null;

              return (
                <>
                  {/* Profession */}
                  {analysisData.profession && (
                    <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-6">
                      <h4 className="text-blue-400 font-bold mb-2 flex items-center gap-2">
                        <FaSearch /> Recommended Profession
                      </h4>
                      <p className="text-gray-200 leading-relaxed">{analysisData.profession}</p>
                    </div>
                  )}

                  {/* Ratings Grid */}
                  {analysisData.ratings && (
                    <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                      {Object.entries(analysisData.ratings).map(([key, val]) => (
                        <div key={key} className="bg-gray-800/60 border border-gray-700/50 rounded-xl p-4 text-center">
                          <div className="text-xs text-gray-500 uppercase mb-1">{key}</div>
                          <div className="text-xl font-bold text-white">{val}/10</div>
                          <div className="w-full bg-gray-700 h-1 mt-2 rounded-full overflow-hidden">
                            <div className="bg-blue-500 h-full" style={{ width: `${val * 10}%` }}></div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Strengths & Improvements */}
                  {(analysisData.strengths || (analysisData.improvements || analysisData.areas_for_improvement)) && (
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                       {/* Strengths */}
                       <div className="space-y-4">
                         <h4 className="text-green-400 font-bold flex items-center gap-2 px-1">
                           <FaCheckCircle /> Key Strengths
                         </h4>
                         {analysisData.strengths?.map((s, i) => (
                           <div key={i} className="bg-green-500/5 border border-green-500/10 rounded-xl p-4">
                             <div className="font-bold text-green-400 text-sm mb-1">
                               {typeof s === 'string' ? s : s.strength}
                             </div>
                             {typeof s !== 'string' && s.description && <p className="text-gray-400 text-sm">{s.description}</p>}
                           </div>
                         ))}
                       </div>
                       
                       {/* Improvements */}
                       <div className="space-y-4">
                         <h4 className="text-yellow-400 font-bold flex items-center gap-2 px-1">
                           <FaExclamationTriangle /> Areas for Improvement
                         </h4>
                         {(analysisData.improvements || analysisData.areas_for_improvement)?.map((a, i) => (
                           <div key={i} className="bg-yellow-500/5 border border-yellow-500/10 rounded-xl p-4">
                             <div className="font-bold text-yellow-400 text-sm mb-1">
                               {typeof a === 'string' ? a : (a.area || a.improvement)}
                             </div>
                             {typeof a !== 'string' && a.description && <p className="text-gray-400 text-sm">{a.description}</p>}
                           </div>
                         ))}
                       </div>
                    </div>
                  )}

                  {/* ATS Keywords Section */}
                  {(analysisData.job_description_keywords_to_include || analysisData.keyword_matches || analysisData.missing_keywords || analysisData.weakly_present_keywords) && (
                    <div className="space-y-4">
                      <h4 className="text-blue-400 font-bold flex items-center gap-2 px-1">
                        <FaMagic /> Keyword Analysis
                      </h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {(analysisData.job_description_keywords_to_include || analysisData.keyword_matches) && (
                          <div className="bg-green-500/5 border border-green-500/10 rounded-xl p-6">
                            <h5 className="text-green-400 text-xs font-bold uppercase mb-3 px-1">Matches Found</h5>
                            <div className="flex flex-wrap gap-2">
                              {(analysisData.job_description_keywords_to_include || analysisData.keyword_matches).map((kw, i) => (
                                <span key={i} className="px-3 py-1 bg-gray-800 text-green-300 rounded-full text-xs border border-green-500/20">
                                  {kw}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}
                        {(analysisData.missing_keywords || analysisData.weakly_present_keywords) && (
                          <div className="bg-red-500/5 border border-red-500/10 rounded-xl p-6">
                            <h5 className="text-red-400 text-xs font-bold uppercase mb-3 px-1">Missing / Weak Gaps</h5>
                            <div className="flex flex-wrap gap-2">
                              {[...(analysisData.missing_keywords || []), ...(analysisData.weakly_present_keywords || [])].map((kw, i) => (
                                <span key={i} className="px-3 py-1 bg-gray-800 text-red-300 rounded-full text-xs border border-red-500/20">
                                  {kw}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Reformatting & Recommendations */}
                  {(analysisData.reformatting_suggestions || analysisData.keyword_density_recommendations || analysisData.keyword_density_advice) && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {analysisData.reformatting_suggestions && (
                        <div className="space-y-4">
                          <h4 className="text-white font-bold flex items-center gap-2 px-1">
                            <FaListAlt /> Reformatting Suggestions
                          </h4>
                          {Array.isArray(analysisData.reformatting_suggestions) ? (
                            <div className="bg-gray-800/40 border border-gray-700/50 rounded-xl p-4 space-y-2">
                              {analysisData.reformatting_suggestions.map((s, i) => (
                                <p key={i} className="text-gray-400 text-xs leading-relaxed flex gap-2">
                                  <span className="text-blue-400">•</span> {s}
                                </p>
                              ))}
                            </div>
                          ) : (
                            Object.entries(analysisData.reformatting_suggestions).map(([key, val], i) => (
                              <div key={i} className="bg-gray-800/40 border border-gray-700/50 rounded-xl p-4">
                                <div className="capitalize font-bold text-blue-400 mb-1 text-sm">{key.replace(/_/g, ' ')}</div>
                                <p className="text-gray-400 text-xs leading-relaxed">{val}</p>
                              </div>
                            ))
                          )}
                        </div>
                      )}
                      {(analysisData.keyword_density_recommendations || analysisData.keyword_density_advice) && (
                        <div className="space-y-4">
                          <h4 className="text-white font-bold flex items-center gap-2 px-1">
                            <FaSearch /> Keyword Insights
                          </h4>
                          <div className="bg-gray-800/40 border border-gray-700/50 rounded-xl p-4">
                            {typeof (analysisData.keyword_density_recommendations || analysisData.keyword_density_advice) === 'string' ? (
                              <p className="text-gray-400 text-xs leading-relaxed">{analysisData.keyword_density_recommendations || analysisData.keyword_density_advice}</p>
                            ) : (
                              Object.entries(analysisData.keyword_density_recommendations || analysisData.keyword_density_advice).map(([key, val], i) => (
                                <div key={i} className="mb-2 last:mb-0">
                                  <div className="capitalize font-bold text-purple-400 text-xs mb-1">{key.replace(/_/g, ' ')}</div>
                                  <p className="text-gray-400 text-[11px] leading-relaxed">{val}</p>
                                </div>
                              ))
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Tailoring Tips & Priority Actions */}
                  {(analysisData.tailoring_tips || analysisData.priority_actions) && (
                    <div className="space-y-4">
                      <h4 className="text-blue-400 font-bold flex items-center gap-2 px-1">
                        <FaRobot /> Strategic Recommendations
                      </h4>
                      <div className="grid grid-cols-1 gap-4">
                        {(analysisData.tailoring_tips || analysisData.priority_actions).map((tip, i) => (
                          <div key={i} className="bg-blue-500/5 border border-blue-500/10 rounded-xl p-5 group hover:bg-blue-500/10 transition-all">
                            <div className="flex gap-4">
                              <div className="h-10 w-10 rounded-lg bg-blue-500/20 flex items-center justify-center flex-shrink-0 text-blue-400 font-bold">
                                {i + 1}
                              </div>
                              <div className="space-y-1">
                                <div className="font-bold text-gray-200">
                                  {typeof tip === 'string' ? tip : tip.tip}
                                </div>
                                {typeof tip !== 'string' && tip.action && (
                                  <div className="text-sm text-gray-400 bg-gray-900/50 p-3 rounded-lg border border-gray-800 mt-2">
                                    <span className="text-blue-400 font-bold uppercase text-[10px] block mb-1">Recommended Action</span>
                                    {tip.action}
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Section Reviews */}
                  {(analysisData.review_major_sections || analysisData.section_review) && (
                    <div className="space-y-4">
                      <h4 className="text-white font-bold flex items-center gap-2 px-1">
                        <FaListAlt /> Section by Section Review
                      </h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {Object.entries(analysisData.review_major_sections || analysisData.section_review).map(([name, feedback]) => (
                          <div key={name} className="bg-gray-800/40 border border-gray-700/50 rounded-xl p-4">
                            <div className="capitalize font-bold text-blue-400 mb-2 border-b border-gray-700/50 pb-1 text-sm">{name.replace(/_/g, ' ')}</div>
                            <div className="space-y-2">
                              {typeof feedback === 'string' ? (
                                <p className="text-gray-400 text-xs leading-relaxed">{feedback}</p>
                              ) : (
                                <>
                                  <div className="text-xs">
                                    <span className="text-green-400 font-medium mr-1">Strengths:</span>
                                    <span className="text-gray-400">{feedback.strengths}</span>
                                  </div>
                                  <div className="text-xs">
                                    <span className="text-yellow-400 font-medium mr-1">Improvements:</span>
                                    <span className="text-gray-400">{feedback.improvements}</span>
                                  </div>
                                </>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Fit Assessment / Summaries */}
                  {(analysisData.fit_assessment || analysisData.final_summary || analysisData.career_story) && (
                    <div className="space-y-4">
                      <h4 className="text-purple-400 font-bold flex items-center gap-2 px-1">
                        <FaFileAlt /> Executive Summary & Strategy
                      </h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {(analysisData.fit_assessment || analysisData.hiring_readiness) && (
                          <div className="bg-purple-500/5 border border-purple-500/10 rounded-xl p-6">
                            <h5 className="text-purple-400 text-xs font-bold uppercase mb-3 px-1">Hiring Readiness</h5>
                            <p className="text-gray-300 text-sm leading-relaxed">{analysisData.fit_assessment || analysisData.hiring_readiness}</p>
                          </div>
                        )}
                        {(analysisData.final_summary || analysisData.summary) && (
                          <div className="bg-blue-500/5 border border-blue-500/10 rounded-xl p-6">
                            <h5 className="text-blue-400 text-xs font-bold uppercase mb-3 px-1">Final Conclusion</h5>
                            <p className="text-gray-300 text-sm leading-relaxed">{analysisData.final_summary || analysisData.summary}</p>
                          </div>
                        )}
                      </div>
                      {analysisData.career_story && (
                        <div className="bg-gray-800/40 border border-gray-700/50 rounded-xl p-6">
                          <h5 className="text-gray-400 text-xs font-bold uppercase mb-3 px-1">Career Narrative Assessment</h5>
                          <p className="text-gray-300 text-sm leading-relaxed">{analysisData.career_story}</p>
                        </div>
                      )}
                    </div>
                  )}
                </>
              );
            })()}
          </div>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center mt-8">
            <button
              onClick={resetAnalysis}
              className="px-8 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl 
                       transition-all duration-300 shadow-lg hover:shadow-blue-500/20 font-bold flex items-center justify-center gap-2"
            >
              <FaRobot /> New Analysis
            </button>
            <button
              onClick={() => window.print()}
              className="px-8 py-3 bg-gray-700 hover:bg-gray-600 text-white rounded-xl 
                       transition-all duration-300 font-bold flex items-center justify-center gap-2 border border-gray-600"
            >
              <FaFileUpload /> Download Report
            </button>
          </div>
        </div>
      );
    }

    return null;
  };

  if (view === "history") {
    return (
      <div className="min-h-screen bg-[#070b14] pt-24 pb-12 px-4">
        <div className="max-w-4xl mx-auto">
          <AtsHistory 
            onBack={() => setView("checker")} 
            onViewDetail={handleHistoryView} 
          />
        </div>
      </div>
    );
  }

  if (view === "detail") {
    return (
      <div className="min-h-screen bg-[#070b14] pt-24 pb-12 px-4">
        <div className="max-w-4xl mx-auto">
          <AtsDetail 
            analysisId={selectedAnalysisId} 
            onBack={() => setView("history")} 
          />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-white pt-16 pb-8 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Animated Background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 via-purple-500/10 to-pink-500/10 animate-gradient"></div>
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(59,130,246,0.1),transparent_50%)]"></div>
        {/* Floating Particles */}
        {[...Array(20)].map((_, i) => (
          <div
            key={i}
            className="absolute w-2 h-2 bg-blue-500/20 rounded-full animate-float"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 5}s`,
              animationDuration: `${5 + Math.random() * 5}s`
            }}
          />
        ))}
      </div>
      
      <div className="max-w-[1400px] mx-auto relative">
        {/* Page Header */}
        <div className={`mb-12 flex flex-col md:flex-row md:items-center md:justify-between gap-6 transition-all duration-700 delay-300 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
          <div>
            <h1 className="text-4xl md:text-5xl font-black text-white mb-4 tracking-tight">
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400">AI Resume</span> Checker
            </h1>
            <p className="text-gray-400 text-lg max-w-xl leading-relaxed">
              Optimize your resume for applicant tracking systems with detailed AI-powered insights and scoring.
            </p>
          </div>
          
          <button 
            onClick={() => setView("history")}
            className="px-6 py-3 bg-gray-800/60 border border-gray-700 rounded-xl text-gray-300 hover:text-white hover:bg-gray-700 transition-all flex items-center gap-3 font-bold group"
          >
            <FaHistory className="group-hover:rotate-[-45deg] transition-transform" /> 
            View Analysis History
          </button>
        </div>

        {/* Conditional Layout: Show both columns OR results-only */}
        {showInputSection ? (
          /* Two Column Layout (Input + Results) */
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Left Column: Resume Upload & Job Description */}
            <div className={`transform transition-all duration-500 delay-200 
                            ${mounted ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'}`}>
              <div className="bg-gray-800/50 backdrop-blur-sm border border-gray-700/50 rounded-xl p-6 shadow-xl">
                <h2 className="text-2xl font-bold mb-6 flex items-center">
                  <FaFileUpload className="mr-2 text-blue-400" />
                  Upload Your Resume
                </h2>

                {/* PDF Upload Area */}
                <div 
                  className={`relative mb-6 border-2 border-dashed rounded-xl p-8 text-center transition-all
                            ${!file && 'hover:border-blue-400'} 
                            ${dragActive ? 'border-blue-400 bg-blue-500/10' : 'border-gray-600'} 
                            ${file ? 'border-green-400 bg-green-500/10' : ''}`}
                  onDragEnter={handleDrag}
                  onDragLeave={handleDrag}
                  onDragOver={handleDrag}
                  onDrop={handleDrop}
                >
                  <input 
                    type="file" 
                    accept=".pdf" 
                    onChange={handleFileChange}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                    disabled={loading}
                  />
                  
                  <div className="flex flex-col items-center justify-center py-4">
                    {file ? (
                      <>
                        <div className="h-16 w-16 mb-4 bg-green-500/20 rounded-full flex items-center justify-center animate-pulse">
                          <FaCheckCircle className="text-green-400 text-2xl" />
                        </div>
                        <p className="text-green-400 font-medium mb-1">{file.name}</p>
                        <p className="text-gray-400 text-sm">{Math.round(file.size / 1024)} KB</p>
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            setFile(null);
                          }}
                          className="mt-4 px-3 py-1 bg-gray-700 text-gray-300 rounded-lg text-sm hover:bg-gray-600 transition-colors"
                        >
                          Change File
                        </button>
                      </>
                    ) : (
                      <>
                        <div className="h-16 w-16 mb-4 bg-blue-500/20 rounded-full flex items-center justify-center">
                          <FaFileAlt className="text-blue-400 text-2xl" />
                        </div>
                        <p className="text-white font-medium mb-2">Drag & drop your resume here</p>
                        <p className="text-gray-400 text-sm mb-4">or click to browse files (PDF only)</p>
                        <div className="px-4 py-2 bg-blue-500/20 text-blue-400 rounded-lg border border-blue-500/30 
                                    hover:bg-blue-500/30 transition-colors inline-flex items-center">
                          <FaFileUpload className="mr-2" /> Select PDF File
                        </div>
                      </>
                    )}
                  </div>
                </div>

                {/* Job Description */}
                <div className="mb-6">
                  <label className="block text-lg font-semibold mb-2 flex items-center">
                    <FaListAlt className="mr-2 text-blue-400" />
                    Job Description
                  </label>
                  <div className="relative group">
                    <textarea
                      className="w-full p-4 bg-gray-700/50 border border-gray-600/50 rounded-xl 
                               text-white placeholder-gray-400 focus:outline-none focus:border-blue-500/50 
                               focus:ring-2 focus:ring-blue-500/20 transition-all duration-300 min-h-[180px]
                               group-hover:border-blue-500/30"
                      placeholder="Paste the job description here to analyze your resume's compatibility..."
                      value={jobDescription}
                      onChange={(e) => setJobDescription(e.target.value)}
                      disabled={loading}
                    />
                  </div>
                </div>

                {/* Analysis Type */}
                <div className="mb-8">
                  <label className="block text-lg font-semibold mb-2 flex items-center">
                    <FaSearch className="mr-2 text-blue-400" />
                    Analysis Type
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    {["Quick Scan", "Detailed Analysis", "ATS Optimization"].map((type) => (
                      <div 
                        key={type}
                        onClick={() => !loading && setAnalysisType(type)} 
                        className={`p-4 rounded-xl cursor-pointer transition-all duration-300
                                  ${analysisType === type 
                                    ? 'bg-blue-500/20 border-2 border-blue-500/50 shadow-lg shadow-blue-500/10' 
                                    : 'bg-gray-700/50 border border-gray-600/50 hover:bg-gray-700/90'}`}
                      >
                        <div className="flex flex-col items-center text-center">
                          <div className={`h-10 w-10 rounded-full flex items-center justify-center mb-2
                                        ${analysisType === type ? 'bg-blue-500/30' : 'bg-gray-600/30'}`}>
                            {type === "Quick Scan" && <FaRobot className={analysisType === type ? 'text-blue-400' : 'text-gray-400'} />}
                            {type === "Detailed Analysis" && <FaSearch className={analysisType === type ? 'text-blue-400' : 'text-gray-400'} />}
                            {type === "ATS Optimization" && <FaMagic className={analysisType === type ? 'text-blue-400' : 'text-gray-400'} />}
                          </div>
                          <span className={`font-medium ${analysisType === type ? 'text-blue-400' : 'text-gray-300'}`}>
                            {type}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
                
                {/* Submit Button */}
                <button
                  className={`w-full p-4 rounded-xl transition-all duration-300 flex items-center justify-center gap-2
                           ${loading 
                             ? 'bg-gray-700 cursor-not-allowed' 
                             : file 
                               ? 'bg-blue-500 hover:bg-blue-600 shadow-lg hover:shadow-blue-500/20' 
                               : 'bg-gray-700 cursor-not-allowed'}`}
                  onClick={analyzeResume}
                  disabled={loading || !file}
                >
                  {loading ? (
                    <>
                      <div className="animate-spin h-5 w-5 mr-2 border-2 border-white border-t-transparent rounded-full" />
                      Analyzing Resume...
                    </>
                  ) : (
                    <>
                      <FaRobot className="mr-1" /> 
                      {file ? 'Analyze Resume' : 'Upload a Resume to Start'}
                    </>
                  )}
                </button>
                
                {loading && (
                  <div className="mt-4">
                    <div className="h-1.5 w-full bg-gray-700 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-blue-500 rounded-full transition-all duration-300"
                        style={{ width: `${uploadProgress}%` }}
                      />
                    </div>
                    <div className="flex justify-between text-xs text-gray-400 mt-1">
                      <span>Analyzing...</span>
                      <span>{Math.round(uploadProgress)}%</span>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Right Column: Results */}
            <div className={`transform transition-all duration-500 delay-300 
                            ${mounted ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'}`}>
              <div className="bg-gray-800/50 backdrop-blur-sm border border-gray-700/50 rounded-xl p-6 h-full shadow-xl">
                <h2 className="text-2xl font-bold mb-6 flex items-center">
                  <FaSearch className="mr-2 text-blue-400" />
                  Analysis Results
                </h2>
                {renderResults()}
              </div>
            </div>
          </div>
        ) : (
          /* Results Only Layout (after scanning - left section hidden) */
          <div className="max-w-5xl mx-auto">
            <div className="bg-gray-800/50 backdrop-blur-sm border border-gray-700/50 rounded-xl p-6 md:p-8 shadow-xl">
              <div className="flex items-center justify-between mb-6 pb-4 border-b border-gray-700/50">
                <h2 className="text-2xl font-bold flex items-center">
                  <FaSearch className="mr-2 text-blue-400" />
                  Analysis Results
                </h2>
                <button
                  onClick={resetAnalysis}
                  className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors flex items-center gap-2 text-sm"
                >
                  <FaArrowLeft className="text-sm" /> New Analysis
                </button>
              </div>
              {renderResults()}
            </div>
          </div>
        )}
      </div>

      <style>{`
        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        @keyframes gradient {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }
        
        @keyframes float {
          0% {
            transform: translateY(0) translateX(0);
          }
          50% {
            transform: translateY(-10px) translateX(5px);
          }
          100% {
            transform: translateY(0) translateX(0);
          }
        }
        
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        
        .animate-gradient {
          background-size: 200% 200%;
          animation: gradient 15s ease infinite;
        }
        
        .animate-float {
          animation: float 5s ease-in-out infinite;
        }
        
        .animate-fadeIn {
          animation: fadeIn 0.5s ease-out forwards;
        }
      `}</style>
    </div>
  );
};

export default ATSChecker;