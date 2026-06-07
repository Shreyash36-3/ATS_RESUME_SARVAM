import React, { useState, useEffect } from "react";
import { getToken } from "../tokenUtils";
import { 
  FaFileAlt, 
  FaHistory, 
  FaArrowLeft,
  FaRobot,
  FaCheckCircle,
  FaExclamationTriangle,
  FaSearch,
  FaListAlt,
  FaMagic,
  FaTrash,
  FaCalendarAlt
} from 'react-icons/fa';

const AtsDetail = ({ analysisId, onBack }) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedVersion, setSelectedVersion] = useState(null);

  useEffect(() => {
    fetchDetail();
  }, [analysisId]);

  const fetchDetail = async (id = analysisId) => {
    try {
      setLoading(true);
      const token = getToken();
      const res = await fetch(`${import.meta.env.VITE_API_URL}/ats/get_resume_analysis/${id}`, {
        headers: {
          Authorization: token || "job-seeker-token",
        },
      });

      if (!res.ok) throw new Error("Failed to fetch details");
      const result = await res.json();
      setData(result);
      setSelectedVersion(result.current);
      setLoading(false);
    } catch (err) {
      console.error(err);
      setError(err.message);
      setLoading(false);
    }
  };

  const handleDeleteVersion = async (e, id) => {
    e.stopPropagation();
    if (!window.confirm("Are you sure you want to delete this specific analysis report?")) return;

    try {
      const token = getToken();
      const res = await fetch(`${import.meta.env.VITE_API_URL}/ats/delete_analysis/${id}`, {
        method: "DELETE",
        headers: {
          Authorization: token || "job-seeker-token",
        },
      });

      if (!res.ok) throw new Error("Failed to delete analysis");
      
      // Go back to history since this specific report is now gone
      onBack();
    } catch (err) {
      alert(err.message);
    }
  };

  const renderAnalysisContent = (content, score, type) => {
    let analysisData = null;
    try {
      analysisData = typeof content === 'string' ? JSON.parse(content) : content;
    } catch (e) {
      return (
        <div className="bg-white border border-gray-200 shadow-sm rounded-xl p-6 mt-6">
          <div className="whitespace-pre-line text-gray-700 text-sm leading-relaxed">{content}</div>
        </div>
      );
    }

    if (!analysisData) return null;

    return (
      <div className="space-y-6 mt-6 animate-fadeIn">
        {/* Summary Header */}
        <div className="bg-white rounded-xl p-8 border border-gray-200 shadow-sm">
          <div className="flex flex-col md:flex-row items-center justify-between gap-8">
            <div className="flex-1 text-center md:text-left">
              <h3 className="text-2xl font-bold text-[#00203f] mb-2">{type} Results</h3>
              <p className="text-gray-600 text-sm">Detailed breakdown of your document's compatibility.</p>
              <div className="mt-4 flex flex-wrap justify-center md:justify-start gap-3">
                <span className="px-3 py-1 bg-[#00203f]/5 text-[#00203f] rounded-md text-xs font-bold border border-[#00203f]/20 flex items-center">
                  <FaRobot className="mr-1.5" /> AI Processed
                </span>
              </div>
            </div>

            <div className="flex flex-col items-center justify-center p-6 bg-[#f0f2f5] rounded-xl border border-gray-200 min-w-[160px]">
              <div className="relative h-24 w-24">
                <svg className="w-full h-full" viewBox="0 0 36 36">
                  <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="#e5e7eb" strokeWidth="3" />
                  <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke={score >= 80 ? "#10b981" : score >= 60 ? "#3b82f6" : "#f59e0b"} strokeWidth="3" strokeDasharray={`${score}, 100`} className="transition-all duration-1000 ease-out" />
                  <text x="18" y="20.5" textAnchor="middle" fontSize="10" fill="#111827" fontWeight="bold">{score}</text>
                </svg>
              </div>
              <div className="mt-3 text-center">
                <div className="text-xs font-bold text-gray-500 uppercase tracking-wider">Overall Match</div>
              </div>
            </div>
          </div>
        </div>

        {/* Flexible Content Rendering */}
        <div className="grid grid-cols-1 gap-6">
           {/* Profession / Level */}
           {(analysisData.profession || analysisData.level) && (
             <div className="bg-white border border-gray-200 shadow-sm rounded-xl p-6">
               <h4 className="text-gray-900 font-bold mb-2 flex items-center gap-2 text-sm"><FaSearch className="text-[#00203f]" /> Professional Assessment</h4>
               <p className="text-[#00203f] font-semibold">{analysisData.profession}</p>
               {analysisData.level && <p className="text-gray-500 text-xs mt-1 uppercase tracking-wider">{analysisData.level} Experience Level</p>}
             </div>
           )}

           {/* Ratings Grid */}
           {analysisData.ratings && (
             <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
               {Object.entries(analysisData.ratings).map(([key, val]) => (
                 <div key={key} className="bg-[#f0f2f5] border border-gray-200 rounded-lg p-4 text-center">
                   <div className="text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-2">{key.replace(/_/g, ' ')}</div>
                   <div className="text-xl font-black text-gray-900">{val}<span className="text-xs text-gray-500 font-medium">/100</span></div>
                   <div className="w-full bg-gray-200 h-1.5 mt-3 rounded-full overflow-hidden">
                     <div className="bg-[#00203f] h-full rounded-full" style={{ width: `${val}%` }}></div>
                   </div>
                 </div>
               ))}
             </div>
           )}

           {/* Strengths & Improvements */}
           {(analysisData.strengths || (analysisData.improvements || analysisData.areas_for_improvement)) && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="space-y-3">
                  <h4 className="text-[#00203f] font-bold flex items-center gap-2 px-1 border-b border-gray-200 pb-2 text-sm"><FaCheckCircle className="text-green-600"/> Key Strengths</h4>
                  {analysisData.strengths?.map((s, i) => (
                    <div key={i} className="bg-white border border-gray-200 shadow-sm rounded-lg p-4">
                      <div className="font-bold text-gray-900 text-sm mb-1">{typeof s === 'string' ? s : s.strength}</div>
                      {typeof s !== 'string' && s.description && <p className="text-gray-600 text-xs leading-relaxed">{s.description}</p>}
                    </div>
                  ))}
                </div>
                
                <div className="space-y-3">
                  <h4 className="text-[#00203f] font-bold flex items-center gap-2 px-1 border-b border-gray-200 pb-2 text-sm"><FaExclamationTriangle className="text-yellow-600"/> Areas for Improvement</h4>
                  {(analysisData.improvements || analysisData.areas_for_improvement)?.map((a, i) => (
                    <div key={i} className="bg-white border border-gray-200 shadow-sm rounded-lg p-4">
                      <div className="font-bold text-gray-900 text-sm mb-1">{typeof a === 'string' ? a : (a.area || a.improvement)}</div>
                      {typeof a !== 'string' && a.description && <p className="text-gray-600 text-xs leading-relaxed">{a.description}</p>}
                    </div>
                  ))}
                </div>
              </div>
           )}

           {/* ATS Keywords Section */}
           {(analysisData.job_description_keywords_to_include || analysisData.keyword_matches || analysisData.missing_keywords || analysisData.weakly_present_keywords) && (
              <div className="space-y-4">
                <h4 className="text-[#00203f] font-bold flex items-center gap-2 px-1 border-b border-gray-200 pb-2 text-sm"><FaMagic className="text-[#00203f]" /> Keyword Analysis</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {(analysisData.job_description_keywords_to_include || analysisData.keyword_matches) && (
                    <div className="bg-white border border-gray-200 rounded-lg p-5 shadow-sm">
                      <h5 className="text-gray-900 text-xs font-bold uppercase tracking-wider mb-3 px-1">Detected Keywords</h5>
                      <div className="flex flex-wrap gap-2">
                        {(analysisData.job_description_keywords_to_include || analysisData.keyword_matches).map((kw, i) => (
                          <span key={i} className="px-3 py-1 bg-green-50 text-green-800 rounded text-xs font-semibold border border-green-200">{kw}</span>
                        ))}
                      </div>
                    </div>
                  )}
                  {(analysisData.missing_keywords || analysisData.weakly_present_keywords) && (
                    <div className="bg-white border border-gray-200 rounded-lg p-5 shadow-sm">
                      <h5 className="text-gray-900 text-xs font-bold uppercase tracking-wider mb-3 px-1">Identified Gaps</h5>
                      <div className="flex flex-wrap gap-2">
                        {[...(analysisData.missing_keywords || []), ...(analysisData.weakly_present_keywords || [])].map((kw, i) => (
                          <span key={i} className="px-3 py-1 bg-red-50 text-red-800 rounded text-xs font-semibold border border-red-200">{kw}</span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
           )}

           {/* Recommendations & Tips */}
           {(analysisData.tailoring_tips || analysisData.priority_actions || analysisData.reformatting_suggestions) && (
             <div className="space-y-4">
                <h4 className="text-[#00203f] font-bold flex items-center gap-2 px-1 border-b border-gray-200 pb-2 text-sm"><FaRobot className="text-[#00203f]" /> Strategy & Tips</h4>
                <div className="grid grid-cols-1 gap-3">
                  {(analysisData.tailoring_tips || analysisData.priority_actions)?.map((tip, i) => (
                     <div key={i} className="bg-white border border-gray-200 shadow-sm rounded-xl p-5 flex gap-4">
                        <div className="h-8 w-8 rounded bg-[#f0f2f5] flex items-center justify-center flex-shrink-0 text-[#00203f] font-black text-sm">
                          {i+1}
                        </div>
                        <div className="w-full">
                          <div className="font-bold text-gray-900 text-[15px] mb-1.5">{typeof tip === 'string' ? tip : tip.tip}</div>
                          {typeof tip !== 'string' && tip.action && <div className="text-sm text-gray-600 bg-gray-50 p-3 rounded-lg border border-gray-100 mt-2"><span className="text-gray-900 font-bold uppercase text-[10px] block mb-1">Actionable Step</span>{tip.action}</div>}
                        </div>
                     </div>
                  ))}
                </div>
             </div>
           )}

           {/* Section Reviews */}
           {(analysisData.section_review || analysisData.review_major_sections) && (
             <div className="space-y-4">
                <h4 className="text-[#00203f] font-bold flex items-center gap-2 px-1 border-b border-gray-200 pb-2 text-sm"><FaListAlt className="text-[#00203f]" /> Section Feedback</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {Object.entries(analysisData.section_review || analysisData.review_major_sections).map(([name, feedback], i) => (
                     <div key={i} className="bg-white border border-gray-200 shadow-sm rounded-xl p-5">
                        <div className="font-bold text-gray-900 text-[15px] mb-3 uppercase border-b border-gray-100 pb-2">{name.replace(/_/g, ' ')}</div>
                        <p className="text-gray-600 text-sm leading-relaxed">
                          {typeof feedback === 'string' ? feedback : (feedback.strengths + " " + feedback.improvements)}
                        </p>
                     </div>
                  ))}
                </div>
             </div>
           )}
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#00203f] mb-4"></div>
        <p className="text-gray-600 font-semibold">Loading report details...</p>
      </div>
    );
  }

  // Formatting date for the static header
  const dateObj = new Date(selectedVersion.created_at);
  const formattedDate = dateObj.toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' });
  const formattedTime = dateObj.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', second: '2-digit' });

  return (
    <div className="animate-fadeIn font-sans pb-12">
      
      {/* Top Navigation */}
      <div className="flex items-center justify-between mb-6">
        <button 
          onClick={onBack}
          className="flex items-center gap-2 text-gray-600 hover:text-[#00203f] transition-colors font-bold text-sm bg-white border border-gray-300 px-4 py-2 rounded-md shadow-sm hover:bg-gray-50"
        >
          <FaArrowLeft /> Back to History
        </button>
        
        <button 
          onClick={(e) => handleDeleteVersion(e, selectedVersion.id)}
          className="flex items-center gap-2 px-4 py-2 rounded-md bg-red-50 text-red-600 border border-red-100 hover:bg-red-100 hover:text-red-700 transition-all font-bold text-sm shadow-sm"
        >
          <FaTrash size={12} /> Delete Scan
        </button>
      </div>

      {/* Static Scan Header */}
      <div className="bg-white border border-gray-200 rounded-xl px-6 py-5 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="h-12 w-12 rounded-lg bg-[#f0f2f5] border border-gray-200 flex items-center justify-center text-[#00203f] text-xl flex-shrink-0">
            <FaFileAlt />
          </div>
          <div>
            <div className="flex items-center gap-2 mb-1">
              <h4 className="text-lg font-bold text-gray-900 truncate max-w-[200px] sm:max-w-xs md:max-w-md">
                {selectedVersion.resume_url ? selectedVersion.resume_url.split('/').pop() : 'Resume Document'}
              </h4>
              <span className="px-2 py-0.5 bg-blue-50 text-blue-700 text-[10px] font-bold rounded uppercase tracking-wider border border-blue-200">
                {selectedVersion.analysis_type || "QUICK SCAN"}
              </span>
            </div>
            <div className="flex items-center gap-2 text-xs text-gray-500 font-semibold">
              <FaCalendarAlt className="text-gray-400" />
              <span>Scanned on: {formattedDate} at {formattedTime}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Report Body */}
      {selectedVersion && renderAnalysisContent(selectedVersion.analysis_result, selectedVersion.ats_score, selectedVersion.analysis_type)}
    </div>
  );
};

export default AtsDetail;