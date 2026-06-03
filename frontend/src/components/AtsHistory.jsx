import React, { useState, useEffect } from "react";
import { getToken } from "../tokenUtils";
import { 
  FaFileAlt, 
  FaHistory, 
  FaExternalLinkAlt, 
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
      setResumes(data.resumes || []);
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
      fetchHistory(); // Refresh
    } catch (err) {
      alert(err.message);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mb-4"></div>
        <p className="text-gray-400">Loading your resume history...</p>
      </div>
    );
  }

  return (
    <div className="animate-fadeIn">
      <div className="flex items-center justify-between mb-8">
        <button 
          onClick={onBack}
          className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors"
        >
          <FaArrowLeft /> Back to Checker
        </button>
        <h2 className="text-2xl font-bold text-white flex items-center gap-3">
          <FaHistory className="text-blue-500" /> Analysis History
        </h2>
      </div>

      {error ? (
        <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-6 text-center">
          <p className="text-red-400 mb-4">{error}</p>
          <button onClick={fetchHistory} className="px-4 py-2 bg-red-500 text-white rounded-lg">Retry</button>
        </div>
      ) : resumes.length === 0 ? (
        <div className="bg-gray-800/40 border border-gray-700/50 rounded-2xl p-12 text-center">
          <FaFileAlt className="text-gray-600 text-5xl mx-auto mb-4" />
          <h3 className="text-xl font-bold text-white mb-2">No History Found</h3>
          <p className="text-gray-400 mb-6">You haven't analyzed any resumes yet.</p>
          <button 
            onClick={onBack}
            className="px-6 py-3 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 transition-all"
          >
            Start Your First Analysis
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {resumes.map((resume) => (
            <div 
              key={resume.id}
              className="bg-gray-800/40 backdrop-blur-sm border border-gray-700/50 rounded-2xl p-6 
                         hover:border-blue-500/30 transition-all group flex items-center justify-between"
            >
              <div className="flex items-center gap-6">
                <div className="h-14 w-14 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-400 text-2xl">
                  <FaFileAlt />
                </div>
                <div>
                  <h4 className="text-lg font-bold text-white mb-1 truncate max-w-sm">
                    {resume.resume_url.split('/').pop()}
                  </h4>
                  <div className="flex items-center gap-4 text-sm text-gray-500">
                    <span className="flex items-center gap-1">
                      <FaCalendarAlt size={12} /> {new Date(resume.created_at).toLocaleDateString()}
                    </span>
                    <span className="px-2 py-0.5 bg-gray-700 rounded text-xs text-gray-300">
                      Latest Score: {resume.ats_score}%
                    </span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <button 
                  onClick={(e) => handleDeleteResume(e, resume.resume_url)}
                  className="p-3 rounded-xl bg-red-500/10 text-red-400 hover:bg-red-500 hover:text-white transition-all"
                  title="Delete History"
                >
                  <FaTrash size={14} />
                </button>
                <button 
                  onClick={() => onViewDetail(resume.id)}
                  className="p-3 rounded-xl bg-gray-700/50 text-gray-400 group-hover:bg-blue-600 
                             group-hover:text-white transition-all flex items-center gap-2"
                >
                  View Versions <FaChevronRight size={12} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default AtsHistory;
