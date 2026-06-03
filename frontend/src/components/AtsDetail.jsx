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
  FaChevronDown,
  FaChevronUp,
  FaTrash
} from 'react-icons/fa';

const AtsDetail = ({ analysisId, onBack }) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedVersion, setSelectedVersion] = useState(null);
  const [isVersionsOpen, setIsVersionsOpen] = useState(false);

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
    if (!window.confirm("Are you sure you want to delete this specific analysis version?")) return;

    try {
      const token = getToken();
      const res = await fetch(`${import.meta.env.VITE_API_URL}/ats/delete_analysis/${id}`, {
        method: "DELETE",
        headers: {
          Authorization: token || "job-seeker-token",
        },
      });

      if (!res.ok) throw new Error("Failed to delete analysis");
      
      if (id === data.current.id && data.history.length === 1) {
        onBack(); // No versions left
      } else {
        // Find another version to show if we deleted current
        const nextId = id === selectedVersion.id 
          ? data.history.find(v => v.id !== id)?.id 
          : selectedVersion.id;
        fetchDetail(nextId);
      }
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
        <div className="bg-gray-800/40 backdrop-blur-sm border border-gray-700/50 rounded-xl p-6">
          <div className="whitespace-pre-line text-gray-300 leading-relaxed">{content}</div>
        </div>
      );
    }

    if (!analysisData) return null;

    return (
      <div className="space-y-6 animate-fadeIn">
        {/* Summary Header */}
        <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-2xl p-8 border border-blue-500/20 shadow-2xl relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/10 rounded-full -mr-16 -mt-16 blur-3xl group-hover:bg-blue-500/20 transition-all duration-500"></div>
          
          <div className="flex flex-col md:flex-row items-center justify-between gap-8 relative z-10">
            <div className="flex-1 text-center md:text-left">
              <h3 className="text-3xl font-bold text-white mb-2">{type} Results</h3>
              <p className="text-gray-400">Analysis from {new Date(selectedVersion.created_at).toLocaleString()}</p>
            </div>

            <div className="flex flex-col items-center justify-center p-6 bg-gray-900/50 rounded-2xl border border-gray-700/50">
              <div className="relative h-24 w-24">
                <svg className="w-full h-full" viewBox="0 0 36 36">
                  <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="#1f2937" strokeWidth="3" />
                  <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke={score >= 80 ? "#10b981" : score >= 60 ? "#3b82f6" : "#f59e0b"} strokeWidth="3" strokeDasharray={`${score}, 100`} />
                  <text x="18" y="20.5" textAnchor="middle" fontSize="10" fill="white" fontWeight="bold">{score}</text>
                </svg>
              </div>
              <div className="mt-3 text-center">
                <div className="text-xs font-medium text-gray-500 uppercase tracking-wider">ATS Score</div>
              </div>
            </div>
          </div>
        </div>

        {/* Flexible Content Rendering */}
        <div className="grid grid-cols-1 gap-6">
           {/* Profession / Level */}
           {(analysisData.profession || analysisData.level) && (
             <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-6">
               <h4 className="text-blue-400 font-bold mb-2 flex items-center gap-2"><FaSearch /> Professionals Analysis</h4>
               <p className="text-gray-200 leading-relaxed font-bold">{analysisData.profession}</p>
               {analysisData.level && <p className="text-gray-400 text-sm mt-1 uppercase tracking-wider">{analysisData.level} Experience Level</p>}
             </div>
           )}

           {/* Ratings Grid */}
           {analysisData.ratings && (
             <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
               {Object.entries(analysisData.ratings).map(([key, val]) => (
                 <div key={key} className="bg-gray-800/60 border border-gray-700/50 rounded-xl p-4 text-center text-white">
                   <div className="text-xs text-gray-500 uppercase mb-1">{key}</div>
                   <div className="text-xl font-bold">{val}/100</div>
                   <div className="w-full bg-gray-700 h-1 mt-2 rounded-full overflow-hidden">
                     <div className="bg-blue-500 h-full" style={{ width: `${val}%` }}></div>
                   </div>
                 </div>
               ))}
             </div>
           )}

           {/* Strengths & Improvements */}
           {(analysisData.strengths || (analysisData.improvements || analysisData.areas_for_improvement)) && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <h4 className="text-green-400 font-bold flex items-center gap-2 px-1"><FaCheckCircle /> Highlights</h4>
                  {analysisData.strengths?.map((s, i) => (
                    <div key={i} className="bg-green-500/5 border border-green-500/10 rounded-xl p-4">
                      <div className="font-bold text-green-400 text-sm mb-1">{typeof s === 'string' ? s : s.strength}</div>
                      {typeof s !== 'string' && s.description && <p className="text-gray-400 text-sm leading-relaxed">{s.description}</p>}
                    </div>
                  ))}
                </div>
                
                <div className="space-y-4">
                  <h4 className="text-yellow-400 font-bold flex items-center gap-2 px-1"><FaExclamationTriangle /> Gaps & Improvements</h4>
                  {(analysisData.improvements || analysisData.areas_for_improvement)?.map((a, i) => (
                    <div key={i} className="bg-yellow-500/5 border border-yellow-500/10 rounded-xl p-4">
                      <div className="font-bold text-yellow-400 text-sm mb-1">{typeof a === 'string' ? a : (a.area || a.improvement)}</div>
                      {typeof a !== 'string' && a.description && <p className="text-gray-400 text-sm leading-relaxed">{a.description}</p>}
                    </div>
                  ))}
                </div>
              </div>
           )}

           {/* ATS Keywords Section */}
           {(analysisData.job_description_keywords_to_include || analysisData.keyword_matches || analysisData.missing_keywords || analysisData.weakly_present_keywords) && (
              <div className="space-y-4">
                <h4 className="text-blue-400 font-bold flex items-center gap-2 px-1"><FaMagic /> Keyword Analysis</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {(analysisData.job_description_keywords_to_include || analysisData.keyword_matches) && (
                    <div className="bg-green-500/5 border border-green-500/10 rounded-xl p-5">
                      <h5 className="text-green-400 text-[10px] font-bold uppercase mb-3 px-1">Detected Keywords</h5>
                      <div className="flex flex-wrap gap-2">
                        {(analysisData.job_description_keywords_to_include || analysisData.keyword_matches).map((kw, i) => (
                          <span key={i} className="px-2 py-1 bg-gray-800 text-green-300 rounded text-[10px] border border-green-500/20">{kw}</span>
                        ))}
                      </div>
                    </div>
                  )}
                  {(analysisData.missing_keywords || analysisData.weakly_present_keywords) && (
                    <div className="bg-red-500/5 border border-red-500/10 rounded-xl p-5">
                      <h5 className="text-red-400 text-[10px] font-bold uppercase mb-3 px-1">Identified Gaps</h5>
                      <div className="flex flex-wrap gap-2">
                        {[...(analysisData.missing_keywords || []), ...(analysisData.weakly_present_keywords || [])].map((kw, i) => (
                          <span key={i} className="px-2 py-1 bg-gray-800 text-red-300 rounded text-[10px] border border-red-500/20">{kw}</span>
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
                <h4 className="text-blue-400 font-bold flex items-center gap-2 px-1"><FaRobot /> Strategy & Tips</h4>
                <div className="grid grid-cols-1 gap-3">
                  {(analysisData.tailoring_tips || analysisData.priority_actions)?.map((tip, i) => (
                     <div key={i} className="bg-gray-800/40 border border-gray-700/50 rounded-xl p-4 flex gap-4">
                        <div className="text-blue-500 font-bold">{i+1}.</div>
                        <div>
                          <div className="font-bold text-gray-200 text-sm mb-1">{typeof tip === 'string' ? tip : tip.tip}</div>
                          {typeof tip !== 'string' && tip.action && <div className="text-[11px] text-gray-400 bg-gray-900/50 p-2 rounded border border-gray-800 mt-1">{tip.action}</div>}
                        </div>
                     </div>
                  ))}
                </div>
             </div>
           )}

           {/* Section Reviews */}
           {(analysisData.section_review || analysisData.review_major_sections) && (
             <div className="space-y-4">
                <h4 className="text-white font-bold flex items-center gap-2 px-1"><FaListAlt /> Section Feedback</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {Object.entries(analysisData.section_review || analysisData.review_major_sections).map(([name, feedback], i) => (
                     <div key={i} className="bg-gray-800/50 border border-gray-700/50 rounded-xl p-4">
                        <div className="font-bold text-blue-400 text-xs mb-2 uppercase border-b border-gray-700/50 pb-1">{name.replace(/_/g, ' ')}</div>
                        <p className="text-gray-400 text-[11px] leading-relaxed">
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
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mb-4"></div>
        <p className="text-gray-400">Loading analysis details...</p>
      </div>
    );
  }

  return (
    <div className="animate-fadeIn">
      {/* Header with back button */}
      <div className="flex flex-col gap-6 mb-8">
        <div className="flex items-center justify-between">
          <button 
            onClick={onBack}
            className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors"
          >
            <FaArrowLeft /> Back to History
          </button>
          <div className="flex items-center gap-3">
             <div className="h-10 w-10 rounded-lg bg-blue-500/10 flex items-center justify-center text-blue-500">
                <FaFileAlt />
             </div>
             <div className="font-bold text-white truncate max-w-xs">
                {selectedVersion.resume_url.split('/').pop()}
             </div>
          </div>
        </div>

        {/* Version Switcher */}
        <div className="relative">
          <button 
            onClick={() => setIsVersionsOpen(!isVersionsOpen)}
            className="w-full flex items-center justify-between bg-gray-800/60 border border-gray-700 rounded-xl px-6 py-4 text-white hover:bg-gray-800 transition-all font-medium"
          >
            <div className="flex items-center gap-3">
              <FaHistory className="text-blue-400" />
              <span>Version: {new Date(selectedVersion.created_at).toLocaleString()}</span>
              <span className="px-2 py-0.5 bg-blue-600 rounded text-[10px] uppercase font-bold">
                {selectedVersion.analysis_type}
              </span>
            </div>
            {isVersionsOpen ? <FaChevronUp /> : <FaChevronDown />}
          </button>
          
          {isVersionsOpen && (
            <div className="absolute top-full left-0 right-0 mt-2 bg-gray-800 border border-gray-700 rounded-xl shadow-2xl z-50 overflow-hidden">
              {data.history.map((v) => (
                <button
                  key={v.id}
                  onClick={() => {
                    setSelectedVersion(v);
                    setIsVersionsOpen(false);
                  }}
                  className={`w-full text-left px-6 py-4 hover:bg-gray-700 transition-all border-b border-gray-700/50 last:border-0 flex items-center justify-between ${selectedVersion.id === v.id ? 'bg-blue-600/10 text-blue-400' : 'text-gray-300'}`}
                >
                  <div className="flex flex-col">
                    <span className="font-bold">{new Date(v.created_at).toLocaleString()}</span>
                    <span className="text-xs opacity-60 uppercase">{v.analysis_type}</span>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-lg font-bold">{v.ats_score}%</div>
                    <button 
                      onClick={(e) => handleDeleteVersion(e, v.id)}
                      className="p-2 rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500 hover:text-white transition-all opacity-0 group-hover:opacity-100"
                    >
                      <FaTrash size={12} />
                    </button>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {selectedVersion && renderAnalysisContent(selectedVersion.analysis_result, selectedVersion.ats_score, selectedVersion.analysis_type)}
    </div>
  );
};

export default AtsDetail;
