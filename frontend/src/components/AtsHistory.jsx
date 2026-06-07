import React, { useState, useEffect } from "react";
import { getToken } from "../tokenUtils";
import { 
  FaFileAlt, 
  FaHistory, 
  FaCalendarAlt,
  FaArrowLeft,
  FaChevronRight,
  FaTrash
} from 'react-icons/fa';

const AtsHistory = ({ onBack, onViewDetail }) => {
  const [resumes, setResumes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchHistory();
  }, []);

  const fetchHistory = async () => {
    try {
      setLoading(true);
      const token = getToken();
      const res = await fetch(`${import.meta.env.VITE_API_URL}/ats/get_resume`, {
        headers: {
          Authorization: token || "job-seeker-token",
        },
      });

      if (!res.ok) throw new Error("Failed to fetch history");
      const data = await res.json();
      
      // Ensure the newest scans appear at the top
      const sortedResumes = (data.resumes || []).sort(
        (a, b) => new Date(b.created_at) - new Date(a.created_at)
      );
      
      setResumes(sortedResumes);
      setLoading(false);
    } catch (err) {
      console.error(err);
      setError(err.message);
      setLoading(false);
    }
  };

  const handleDeleteResume = async (e, resumeURL) => {
    e.stopPropagation();
    if (!window.confirm("Are you sure you want to delete all analysis history for this resume?")) return;

    try {
      const token = getToken();
      const res = await fetch(`${import.meta.env.VITE_API_URL}/ats/delete_resume`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          Authorization: token || "job-seeker-token",
        },
        body: JSON.stringify({ resume_url: resumeURL }),
      });

      if (!res.ok) throw new Error("Failed to delete history");
      fetchHistory(); // Refresh the list
    } catch (err) {
      alert(err.message);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#00203f] mb-4"></div>
        <p className="text-gray-600 font-semibold">Loading your document history...</p>
      </div>
    );
  }

  return (
    <div className="animate-fadeIn font-sans">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-8 border-b-2 border-[#00203f] pb-4 gap-4">
        <div>
          <h2 className="text-2xl font-bold text-[#00203f] flex items-center gap-3 tracking-tight">
            <FaHistory className="text-[#00203f]" /> Analysis History
          </h2>
          <p className="text-gray-600 text-sm mt-1">Review all your previous document scans and scores.</p>
        </div>
        <button 
          onClick={onBack}
          className="flex items-center gap-2 text-gray-600 hover:text-[#00203f] transition-colors font-bold text-sm bg-white border border-gray-300 px-4 py-2 rounded-md shadow-sm hover:bg-gray-50"
        >
          <FaArrowLeft /> Back to Checker
        </button>
      </div>

      {/* Error State */}
      {error ? (
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center shadow-sm">
          <p className="text-red-700 mb-4 font-semibold text-sm">{error}</p>
          <button onClick={fetchHistory} className="px-6 py-2 bg-white border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 font-bold text-sm shadow-sm">
            Retry
          </button>
        </div>

      /* Empty State */
      ) : resumes.length === 0 ? (
        <div className="bg-white border border-gray-200 shadow-sm rounded-xl p-12 text-center">
          <div className="h-20 w-20 mx-auto mb-4 bg-[#f0f2f5] rounded-full flex items-center justify-center border border-gray-100">
            <FaFileAlt className="text-gray-400 text-3xl" />
          </div>
          <h3 className="text-xl font-bold text-gray-900 mb-2">No History Found</h3>
          <p className="text-gray-500 mb-8 text-sm">You haven't analyzed any documents yet.</p>
          <button 
            onClick={onBack}
            className="px-6 py-3 bg-[#00203f] text-white rounded-md font-bold hover:bg-[#001529] transition-all shadow-md text-sm"
          >
            Start Your First Analysis
          </button>
        </div>

      /* List State */
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {resumes.map((resume) => {
            // Format the date and time to match the exact style from your screenshot
            const dateObj = new Date(resume.created_at);
            const formattedDate = dateObj.toLocaleDateString('en-GB', {
              day: '2-digit', month: '2-digit', year: 'numeric'
            });
            const formattedTime = dateObj.toLocaleTimeString('en-GB', {
              hour: '2-digit', minute: '2-digit', second: '2-digit'
            });

            return (
              <div 
                key={resume.id}
                className="bg-white border border-gray-200 shadow-sm rounded-xl p-5 
                           hover:border-[#00203f]/40 hover:shadow-md transition-all group flex flex-col md:flex-row md:items-center justify-between gap-4"
              >
                
                {/* Document & Version Info */}
                <div className="flex items-center gap-4">
                  <div className="h-12 w-12 rounded-lg bg-[#f0f2f5] border border-gray-200 flex items-center justify-center text-[#00203f] text-xl flex-shrink-0">
                    <FaFileAlt />
                  </div>
                  <div>
                    <div className="flex items-center gap-2 mb-1.5">
                      <h4 className="text-base font-bold text-gray-900 truncate max-w-[200px] sm:max-w-xs md:max-w-sm">
                        {resume.resume_url ? resume.resume_url.split('/').pop() : 'Resume Document'}
                      </h4>
                      <span className="px-2 py-0.5 bg-blue-50 text-blue-700 text-[10px] font-bold rounded uppercase tracking-wider border border-blue-200">
                        {resume.analysis_type || "QUICK SCAN"}
                      </span>
                    </div>
                    <div className="flex items-center gap-3 text-xs text-gray-500 font-semibold">
                      <span className="flex items-center gap-1.5">
                        <FaCalendarAlt size={12} className="text-gray-400" /> 
                        {formattedDate}, {formattedTime}
                      </span>
                      <span className="px-2 py-0.5 bg-[#f0f2f5] border border-gray-200 rounded text-gray-700 font-bold">
                        Score: <span className={resume.ats_score >= 80 ? "text-green-600" : resume.ats_score >= 60 ? "text-blue-600" : "text-yellow-600"}>
                          {resume.ats_score}%
                        </span>
                      </span>
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-3 self-end md:self-auto">
                  <button 
                    onClick={(e) => handleDeleteResume(e, resume.resume_url)}
                    className="p-2.5 rounded-md bg-red-50 text-red-600 border border-red-100 hover:bg-red-100 hover:text-red-700 transition-all"
                    title="Delete History"
                  >
                    <FaTrash size={14} />
                  </button>
                  <button 
                    onClick={() => onViewDetail(resume.id)}
                    className="px-4 py-2.5 rounded-md bg-white border border-gray-300 text-gray-700 group-hover:bg-[#f0f2f5] group-hover:text-[#00203f] group-hover:border-[#00203f]/30
                               transition-all flex items-center gap-2 text-sm font-bold shadow-sm"
                  >
                    View Results <FaChevronRight size={12} />
                  </button>
                </div>

              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default AtsHistory;