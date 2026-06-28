'use client'; 

import { useState } from 'react';

export default function Home() {
  const [symptom, setSymptom] = useState('');
  const [statusText, setStatusText] = useState('');
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

  const findHospital = async () => {
    if (!symptom.trim()) {
      alert("Please describe your symptoms first.");
      return;
    }

    setLoading(true);
    setResult(null);
    setStatusText('Getting your current GPS location...');

    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const userLat = position.coords.latitude;
          const userLon = position.coords.longitude;
          
          setStatusText('Analyzing symptoms and searching database...');

          try {
            const response = await fetch('http://localhost:5000/api/healthcare/smart-search', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ symptom, userLat, userLon })
            });

            const data = await response.json();
            
            if (data.status === "error") {
               throw new Error(data.error || "API Error");
            }
            
            setResult(data);
            setStatusText('Done!');
          } catch (error) {
            setStatusText('Backend connection failed or returned an error.');
            console.error(error);
          } finally {
            setLoading(false);
          }
        },
        (error) => {
          console.error("Geoloc Error:", error);
          if (error.code === 1) {
            setStatusText('Location access denied by browser.');
          } else if (error.code === 2) {
            setStatusText('Position unavailable. Your device cannot determine its location.');
          } else {
            setStatusText(`Location Error: ${error.message}`);
          }
          setLoading(false);
        }
      );
    } else {
      setStatusText('Geolocation is not supported by your browser.');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4 font-sans text-slate-800">
      <div className="bg-white p-8 rounded-2xl shadow-xl w-full max-w-lg border border-slate-100">
        
        {/* Header Section */}
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold text-slate-800 mb-2">AI Care Navigator</h2>
          <p className="text-slate-500 font-medium">Describe your symptoms and we will find the best facility nearby.</p>
        </div>
        
        {/* SMART SYMPTOM SEARCH INPUT */}
        <div className="relative mb-6">
          <textarea 
            className="w-full p-4 border-2 border-slate-200 rounded-xl text-slate-700 bg-slate-50 focus:bg-white focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100 transition-all resize-none shadow-inner"
            rows="4" 
            placeholder="Describe your symptoms in detail... (e.g., severe headache and mild fever since morning)"
            value={symptom}
            onChange={(e) => setSymptom(e.target.value)}
            disabled={loading}
          ></textarea>
          
          <div className="absolute bottom-3 right-4 text-xs text-slate-400 font-medium bg-white px-2 py-1 rounded-md shadow-sm">
            {symptom.length > 0 ? `${symptom.length} chars` : 'Be descriptive'}
          </div>
        </div>
        
        {/* Action Button */}
        <button 
          onClick={findHospital}
          disabled={loading}
          className={`w-full p-4 rounded-xl text-white font-bold text-lg transition-all flex justify-center items-center gap-2 ${
            loading ? 'bg-slate-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700 shadow-lg hover:shadow-blue-500/30 active:scale-[0.98]'
          }`}
        >
          {loading ? 'Processing...' : 'Find Nearest Hospital'}
        </button>
        
        {/* Status Indicator */}
        {statusText && (
          <p className="text-center mt-5 text-sm font-semibold text-slate-500 bg-slate-50 py-2 rounded-lg border border-slate-100">
            {statusText}
          </p>
        )}
        
        {/* AI Response Display Box */}
        {result && (
          <div className="mt-6 flex flex-col gap-4 animate-in fade-in zoom-in duration-300">
            
            {/* The AI Bot Response */}
            <div className={`p-5 rounded-xl border-2 transition-all ${
              result.responseType === "EMERGENCY" 
                ? 'bg-red-50 border-red-200 text-red-900 shadow-sm' 
                : result.responseType === "NO_MATCH"
                  ? 'bg-slate-50 border-slate-200 text-slate-700 shadow-sm'
                  : 'bg-emerald-50 border-emerald-200 text-emerald-900 shadow-sm'
            }`}>
              {result.responseType === "EMERGENCY" && (
                <div className="font-bold text-red-700 mb-2 uppercase tracking-wide text-sm">Critical Alert</div>
              )}
              {result.responseType === "MILD" && (
                <div className="font-bold text-emerald-700 mb-2 uppercase tracking-wide text-sm">AI Recommendation</div>
              )}
              <p className="whitespace-pre-wrap leading-relaxed font-medium">{result.botResponse}</p>
            </div>

            {/* The Hospital Data Cards */}
            {result.responseType === "MILD" && result.retrievedData && result.retrievedData.length > 0 && (
              <div className="mt-2">
                <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-3">Matching Facilities</h3>
                <div className="flex flex-col gap-3">
                  {result.retrievedData.map((hospital, index) => (
                    <div key={index} className="p-4 border border-slate-200 rounded-xl bg-white shadow-sm hover:shadow-md transition-shadow flex flex-col gap-1">
                      
                      <div className="flex justify-between items-start">
                        <h4 className="font-bold text-slate-800 text-lg">{hospital.hospitalName}</h4>
                        <span className="bg-blue-100 text-blue-800 text-[10px] font-bold px-2 py-1 rounded uppercase tracking-wide">
                          {hospital.specialty}
                        </span>
                      </div>
                      
                      <div className="flex items-center justify-between mt-2">
                        <div className="flex items-center gap-1">
                          <span className="text-yellow-500 text-sm">★</span>
                          <span className="font-bold text-slate-700 text-sm">{hospital.rating}</span>
                          <span className="text-xs text-slate-400">({hospital.reviewCount} reviews)</span>
                        </div>
                        <span className="text-xs font-medium text-slate-500">📍 Near You</span>
                      </div>
                      
                    </div>
                  ))}
                </div>
              </div>
            )}

          </div>
        )}

      </div>
    </div>
  );
}