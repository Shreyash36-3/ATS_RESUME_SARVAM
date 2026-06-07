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
  const [view, setView] = useState("checker"); 
  const [selectedAnalysisId, setSelectedAnalysisId] = useState(null);
  const [limitError , setLimitError]=useState(null);

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
    setLimitError(null);
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

      if(response.status === 429){
        const errorData = await response.json();
        setLimitError(errorData.error);
        setLoading(false);
        setUploadProgress(0);
        return;
      }
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

  const showInputSection = !response;

  const renderResults = () => {
    if (!response && !loading) {
      return (
        <div className="flex flex-col items-center justify-center h-[80%] text-center py-12">
          <div className="h-20 w-20 mb-6 bg-[#f0f2f5] rounded-full flex items-center justify-center">
            <FaRobot className="text-gray-400 text-3xl" />
          </div>
          <h3 className="text-xl font-bold mb-2 text-gray-900">No Analysis Yet</h3>
          <p className="text-gray-500 max-w-md text-sm">
            Upload your resume and click "Analyze Resume" to see how your CV performs against the job description.
          </p>
        </div>
      );
    }

    if (!response && loading) {
      return (
        <div className="flex flex-col items-center justify-center h-[80%] text-center py-12">
          <div className="h-20 w-20 mb-6 bg-[#00203f]/10 rounded-full flex items-center justify-center animate-pulse">
            <FaRobot className="text-[#00203f] text-3xl" />
          </div>
          <h3 className="text-xl font-bold mb-2 text-gray-900">Analyzing Your Resume</h3>
          <p className="text-gray-500 max-w-md mb-6 text-sm">
            We're processing your document and cross-referencing criteria. Please wait...
          </p>
          <div className="w-64 h-2 bg-[#f0f2f5] rounded-full overflow-hidden">
            <div 
              className="h-full bg-[#00203f] rounded-full transition-all duration-300"
              style={{ width: `${uploadProgress}%` }}
            />
          </div>
        </div>
      );
    }

    if (response && response.error) {
      return (
        <div className="bg-red-50 border border-red-200 rounded-lg p-6">
          <div className="flex items-center mb-4">
            <div className="h-10 w-10 bg-red-100 rounded-full flex items-center justify-center mr-4">
              <FaExclamationTriangle className="text-red-600 text-lg" />
            </div>
            <h3 className="text-lg font-bold text-red-800">Analysis Failed</h3>
          </div>
          <p className="text-red-700 mb-6 text-sm">{response.content}</p>
          <button
            onClick={resetAnalysis}
            className="px-6 py-2 bg-white border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors inline-flex items-center font-medium shadow-sm text-sm"
          >
            Try Again
          </button>
        </div>
      );
    }

    if (response) {
      return (
        <div className="space-y-6">
          {/* Score & Summary Card */}
          <div className="bg-white rounded-xl p-8 border border-gray-200 shadow-sm">
            <div className="flex flex-col md:flex-row items-center justify-between gap-8">
              <div className="flex-1 text-center md:text-left">
                <h3 className="text-2xl font-bold text-[#00203f] mb-2">{response.type} Results</h3>
                <p className="text-gray-600 text-sm">Analysis completed successfully.</p>
                <div className="mt-4 flex flex-wrap justify-center md:justify-start gap-3">
                  <span className="px-3 py-1 bg-green-50 text-green-700 rounded-md text-xs font-bold border border-green-200 flex items-center">
                    <FaCheckCircle className="mr-1.5" /> PDF Verified
                  </span>
                  <span className="px-3 py-1 bg-[#00203f]/5 text-[#00203f] rounded-md text-xs font-bold border border-[#00203f]/20 flex items-center">
                    <FaRobot className="mr-1.5" /> AI Processed
                  </span>
                </div>
              </div>

              {response.score && (
                <div className="flex flex-col items-center justify-center p-6 bg-[#f0f2f5] rounded-xl border border-gray-200 min-w-[160px]">
                  <div className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Overall Match</div>
                  <div className={`text-4xl font-black ${
                    response.score >= 80 ? 'text-green-600' : 
                    response.score >= 60 ? 'text-blue-600' : 
                    'text-yellow-600'
                  }`}>
                    {response.score}%
                  </div>
                  <div className={`text-sm font-semibold mt-1 ${
                    response.score >= 80 ? 'text-green-600' : 
                    response.score >= 60 ? 'text-blue-600' : 
                    'text-yellow-600'
                  }`}>
                    {response.score >= 80 ? 'Excellent' : response.score >= 60 ? 'Good' : 'Needs Revision'}
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
                  <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
                    <div className="whitespace-pre-line text-gray-700 text-sm leading-relaxed">
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
                    <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
                      <h4 className="text-gray-900 font-bold mb-2 flex items-center gap-2 text-sm">
                        <FaSearch className="text-[#00203f]"/> Identified Profession
                      </h4>
                      <p className="text-gray-700 text-sm">{analysisData.profession}</p>
                    </div>
                  )}

                  {/* Ratings Grid */}
                  {analysisData.ratings && (
                    <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                      {Object.entries(analysisData.ratings).map(([key, val]) => (
                        <div key={key} className="bg-[#f0f2f5] rounded-lg p-4 text-center border border-gray-200">
                          <div className="text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-2">{key.replace(/_/g, ' ')}</div>
                          <div className="text-xl font-black text-gray-900">{val}<span className="text-xs text-gray-500 font-medium">/10</span></div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Strengths & Improvements */}
                  {(analysisData.strengths || (analysisData.improvements || analysisData.areas_for_improvement)) && (
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                       <div className="space-y-3">
                         <h4 className="text-[#00203f] font-bold flex items-center gap-2 px-1 border-b border-gray-200 pb-2 text-sm">
                           <FaCheckCircle className="text-green-600"/> Key Strengths
                         </h4>
                         {analysisData.strengths?.map((s, i) => (
                           <div key={i} className="bg-white border border-gray-200 shadow-sm rounded-lg p-4">
                             <div className="font-bold text-gray-900 text-sm mb-1">
                               {typeof s === 'string' ? s : s.strength}
                             </div>
                             {typeof s !== 'string' && s.description && <p className="text-gray-600 text-xs leading-relaxed">{s.description}</p>}
                           </div>
                         ))}
                       </div>
                       
                       <div className="space-y-3">
                         <h4 className="text-[#00203f] font-bold flex items-center gap-2 px-1 border-b border-gray-200 pb-2 text-sm">
                           <FaExclamationTriangle className="text-yellow-600"/> Areas for Improvement
                         </h4>
                         {(analysisData.improvements || analysisData.areas_for_improvement)?.map((a, i) => (
                           <div key={i} className="bg-white border border-gray-200 shadow-sm rounded-lg p-4">
                             <div className="font-bold text-gray-900 text-sm mb-1">
                               {typeof a === 'string' ? a : (a.area || a.improvement)}
                             </div>
                             {typeof a !== 'string' && a.description && <p className="text-gray-600 text-xs leading-relaxed">{a.description}</p>}
                           </div>
                         ))}
                       </div>
                    </div>
                  )}

                  {/* ATS Keywords Section */}
                  {(analysisData.job_description_keywords_to_include || analysisData.keyword_matches || analysisData.missing_keywords || analysisData.weakly_present_keywords) && (
                    <div className="space-y-4 mt-2">
                      <h4 className="text-[#00203f] font-bold flex items-center gap-2 px-1 border-b border-gray-200 pb-2 text-sm">
                        <FaMagic className="text-[#00203f]"/> Keyword Analysis
                      </h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {(analysisData.job_description_keywords_to_include || analysisData.keyword_matches) && (
                          <div className="bg-white border border-gray-200 rounded-lg p-5 shadow-sm">
                            <h5 className="text-gray-900 text-xs font-bold uppercase tracking-wider mb-3 px-1">Matches Found</h5>
                            <div className="flex flex-wrap gap-2">
                              {(analysisData.job_description_keywords_to_include || analysisData.keyword_matches).map((kw, i) => (
                                <span key={i} className="px-3 py-1 bg-green-50 text-green-800 rounded text-xs font-semibold border border-green-200">
                                  {kw}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}
                        {(analysisData.missing_keywords || analysisData.weakly_present_keywords) && (
                          <div className="bg-white border border-gray-200 rounded-lg p-5 shadow-sm">
                            <h5 className="text-gray-900 text-xs font-bold uppercase tracking-wider mb-3 px-1">Missing / Weak Gaps</h5>
                            <div className="flex flex-wrap gap-2">
                              {[...(analysisData.missing_keywords || []), ...(analysisData.weakly_present_keywords || [])].map((kw, i) => (
                                <span key={i} className="px-3 py-1 bg-red-50 text-red-800 rounded text-xs font-semibold border border-red-200">
                                  {kw}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Fit Assessment / Summaries */}
                  {(analysisData.fit_assessment || analysisData.final_summary || analysisData.career_story) && (
                    <div className="space-y-4 mt-2">
                      <h4 className="text-[#00203f] font-bold flex items-center gap-2 px-1 border-b border-gray-200 pb-2 text-sm">
                        <FaFileAlt className="text-[#00203f]"/> Executive Summary
                      </h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {(analysisData.fit_assessment || analysisData.hiring_readiness) && (
                          <div className="bg-white border border-gray-200 shadow-sm rounded-lg p-5">
                            <h5 className="text-gray-900 text-xs font-bold uppercase tracking-wider mb-2">Hiring Readiness</h5>
                            <p className="text-gray-600 text-sm leading-relaxed">{analysisData.fit_assessment || analysisData.hiring_readiness}</p>
                          </div>
                        )}
                        {(analysisData.final_summary || analysisData.summary) && (
                          <div className="bg-white border border-gray-200 shadow-sm rounded-lg p-5">
                            <h5 className="text-gray-900 text-xs font-bold uppercase tracking-wider mb-2">Final Conclusion</h5>
                            <p className="text-gray-600 text-sm leading-relaxed">{analysisData.final_summary || analysisData.summary}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </>
              );
            })()}
          </div>
          
          <div className="flex justify-center mt-8 pb-4">
            <button
              onClick={resetAnalysis}
              className="px-6 py-2.5 bg-white border border-gray-300 hover:bg-[#f0f2f5] text-gray-800 rounded-md transition-colors shadow-sm font-semibold flex items-center justify-center gap-2 text-sm"
            >
              <FaArrowLeft /> Start New Analysis
            </button>
          </div>
        </div>
      );
    }

    return null;
  };

  if (view === "history") {
    return (
      <div className="min-h-screen bg-[#f4f5f8] pt-24 pb-12 px-4">
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
      <div className="min-h-screen bg-[#f4f5f8] pt-24 pb-12 px-4">
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
    <div className="min-h-screen bg-[#f4f5f8] text-gray-900 pt-12 pb-12 px-4 sm:px-6 lg:px-8 font-sans">
      
      <div className="max-w-7xl mx-auto">
        {/* Page Header */}
        <div className="mb-10 flex flex-col md:flex-row md:items-end md:justify-between gap-4 border-b-2 border-[#00203f] pb-4">
          <div>
            <h1 className="text-3xl font-bold text-[#00203f] tracking-tight">
              Resume Checker
            </h1>
            <p className="text-gray-600 text-sm mt-1">Analyze and optimize your document against job criteria.</p>
          </div>
          
          <button 
            onClick={() => setView("history")}
            className="px-4 py-2 bg-white border border-gray-300 rounded text-gray-700 hover:text-[#00203f] hover:border-[#00203f] shadow-sm transition-all flex items-center gap-2 font-semibold text-sm"
          >
            <FaHistory className="text-gray-500" /> 
            Usage History
          </button>
        </div>

        {/* Conditional Layout */}
        {showInputSection ? (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            
            {/* Left Column: Form Input */}
            <div className="lg:col-span-5">
              <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
                <h2 className="text-lg font-bold mb-6 text-[#00203f] border-b border-gray-100 pb-3">
                  Document Details
                </h2>

                {/* Daily limit Warning Banner */}
                {limitError &&(
                  <div className="bg-red-50 border border-red-200 rounded-md p-4 mb-6 flex items-start gap-3">
                    <FaExclamationTriangle className="text-red-600 text-lg flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="font-bold text-red-800 text-sm">Daily Limit Reached</p>
                      <p className="text-red-700 text-xs mt-1">{limitError}</p>
                    </div>
                  </div>
                )}

                {/* PDF Upload Area */}
                <div className="mb-6">
                  <label className="block text-sm font-bold text-gray-900 mb-2">
                    Upload Resume <span className="text-red-500">*</span>
                  </label>
                  <div 
                    className={`relative border-2 border-dashed rounded-lg p-6 text-center transition-all cursor-pointer
                              ${!file && 'border-gray-300 bg-[#f0f2f5] hover:bg-gray-100 hover:border-gray-400'} 
                              ${dragActive ? 'border-[#00203f] bg-[#00203f]/5' : ''} 
                              ${file ? 'border-green-500 bg-green-50' : ''}`}
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
                    
                    <div className="flex flex-col items-center justify-center">
                      {file ? (
                        <>
                          <div className="h-10 w-10 mb-2 bg-white shadow-sm rounded-full flex items-center justify-center border border-green-200">
                            <FaCheckCircle className="text-green-600 text-lg" />
                          </div>
                          <p className="text-gray-900 font-semibold text-sm mb-1 truncate max-w-full px-2">{file.name}</p>
                          <p className="text-gray-500 text-xs">{Math.round(file.size / 1024)} KB</p>
                          <button 
                            onClick={(e) => {
                              e.stopPropagation();
                              setFile(null);
                            }}
                            className="mt-3 px-3 py-1 bg-white border border-gray-300 text-gray-600 rounded text-xs font-semibold hover:bg-gray-50 shadow-sm z-20 relative"
                          >
                            Change File
                          </button>
                        </>
                      ) : (
                        <>
                          <div className="h-10 w-10 mb-2 bg-white shadow-sm border border-gray-200 rounded-full flex items-center justify-center">
                            <FaFileAlt className="text-gray-500 text-lg" />
                          </div>
                          <p className="text-gray-900 font-semibold text-sm mb-1">Drag & drop your resume</p>
                          <p className="text-gray-500 text-xs mb-3">or click to browse files (PDF)</p>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                {/* Job Description */}
                <div className="mb-8">
                  <label className="block text-sm font-bold text-gray-900 mb-2">
                    Target Job Description <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    className="w-full p-3 bg-[#f0f2f5] border border-gray-200 rounded-lg text-gray-900 placeholder-gray-400 
                               focus:outline-none focus:ring-1 focus:ring-[#00203f] focus:border-[#00203f] transition-all min-h-[140px] text-sm resize-y"
                    placeholder="Paste the target job description here..."
                    value={jobDescription}
                    onChange={(e) => setJobDescription(e.target.value)}
                    disabled={loading}
                  />
                </div>
                
                {/* Submit Button */}
                <button
                  className={`w-full py-3 rounded-md font-bold transition-colors flex items-center justify-center gap-2 text-sm
                           ${loading || !file 
                             ? 'bg-gray-200 text-gray-400 cursor-not-allowed' 
                             : 'bg-[#00203f] text-white hover:bg-[#001529] shadow-md'}`}
                  onClick={analyzeResume}
                  disabled={loading || !file}
                >
                  {loading ? (
                    <>
                      <div className="animate-spin h-4 w-4 mr-2 border-2 border-white border-t-transparent rounded-full" />
                      Processing...
                    </>
                  ) : (
                    'Analyze Document'
                  )}
                </button>
              </div>
            </div>

            {/* Right Column: Results Placeholder */}
            <div className="lg:col-span-7">
              <div className="bg-white rounded-xl p-6 h-full shadow-sm border border-gray-200">
                <h2 className="text-lg font-bold mb-6 text-[#00203f] border-b border-gray-100 pb-3">
                  System Analysis
                </h2>
                {renderResults()}
              </div>
            </div>
          </div>
        ) : (
          /* Results Only Layout */
          <div className="max-w-5xl mx-auto">
            <div className="bg-white rounded-xl p-8 shadow-sm border border-gray-200">
              <div className="flex items-center justify-between mb-8 pb-4 border-b border-gray-200">
                <h2 className="text-xl font-bold text-[#00203f]">
                  Analysis Report
                </h2>
                <button
                  onClick={resetAnalysis}
                  className="px-4 py-2 bg-white border border-gray-300 hover:bg-[#f0f2f5] text-gray-700 rounded-md transition-colors flex items-center gap-2 text-sm font-semibold shadow-sm"
                >
                  <FaArrowLeft className="text-xs" /> New Scan
                </button>
              </div>
              {renderResults()}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ATSChecker;