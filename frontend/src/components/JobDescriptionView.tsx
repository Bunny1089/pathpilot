import React, { useState, useEffect } from 'react';
import { apiService } from '../services/api';
import type { StructuredJD, MatchReport } from '../services/api';
import { 
  Upload, 
  Sparkles, 
  AlertCircle, 
  Briefcase, 
  GraduationCap, 
  Bookmark, 
  Clipboard, 
  Calendar,
  Award,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Sliders,
  ChevronDown,
  ChevronUp,
  Info,
  Layers,
  FileCheck2
} from 'lucide-react';

export const JobDescriptionView: React.FC = () => {
  const [inputText, setInputText] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [activeInputTab, setActiveInputTab] = useState<'paste' | 'upload'>('paste');
  const [analyzing, setAnalyzing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [structuredJD, setStructuredJD] = useState<StructuredJD | null>(null);

  // Resume Matching State
  const [hasResume, setHasResume] = useState<boolean | null>(null);
  const [activeViewTab, setActiveViewTab] = useState<'details' | 'matching'>('details');
  const [matching, setMatching] = useState(false);
  const [matchReport, setMatchReport] = useState<MatchReport | null>(null);
  const [matchingError, setMatchingError] = useState<string | null>(null);

  // Configurable Weights (multiplied by 100 for slider UI)
  const [reqWeight, setReqWeight] = useState(60);
  const [prefWeight, setPrefWeight] = useState(20);
  const [expWeight, setExpWeight] = useState(15);
  const [eduWeight, setEduWeight] = useState(5);
  const [showWeightConfig, setShowWeightConfig] = useState(false);

  // Active accordion sections in match report
  const [expandedSection, setExpandedSection] = useState<string | null>('required');

  const checkActiveResume = async () => {
    try {
      const res = await apiService.getActiveResume();
      setHasResume(res.has_resume);
    } catch (err) {
      console.error("Failed to query active resume:", err);
      setHasResume(false);
    }
  };

  useEffect(() => {
    checkActiveResume();
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.type !== 'application/pdf') {
        setError('Please select PDF documents only.');
        setSelectedFile(null);
        return;
      }
      setSelectedFile(file);
      setError(null);
    }
  };

  const handleAnalyze = async (e: React.FormEvent) => {
    e.preventDefault();
    setAnalyzing(true);
    setError(null);
    setMatchReport(null);
    setActiveViewTab('details');
    try {
      let result: StructuredJD;
      if (activeInputTab === 'paste') {
        if (!inputText.trim()) {
          throw new Error('Please paste a job description text to analyze.');
        }
        result = await apiService.analyzeJDText(inputText);
      } else {
        if (!selectedFile) {
          throw new Error('Please select a PDF job description file.');
        }
        result = await apiService.analyzeJDFile(selectedFile);
      }
      setStructuredJD(result);
    } catch (err: any) {
      setError(err.message || 'Job description parsing failed.');
    } finally {
      setAnalyzing(false);
    }
  };

  const handleRunMatch = async () => {
    if (!structuredJD) return;
    setMatching(true);
    setMatchingError(null);
    try {
      const total = reqWeight + prefWeight + expWeight + eduWeight;
      const payload = {
        ...structuredJD,
        weights: {
          required_skills: reqWeight / total,
          preferred_skills: prefWeight / total,
          experience: expWeight / total,
          education: eduWeight / total,
        }
      };
      const report = await apiService.matchResume(payload);
      setMatchReport(report);
      setActiveViewTab('matching');
    } catch (err: any) {
      setMatchingError(err.message || 'Failed to generate match report.');
    } finally {
      setMatching(false);
    }
  };

  const resetAnalysis = () => {
    setStructuredJD(null);
    setMatchReport(null);
    setInputText('');
    setSelectedFile(null);
    setError(null);
    setMatchingError(null);
    setActiveViewTab('details');
  };

  const totalSliderSum = reqWeight + prefWeight + expWeight + eduWeight;

  return (
    <div className="flex-1 bg-slate-950 text-slate-100 p-8 ml-64 min-h-[calc(100vh-4rem)]">
      
      {/* Title section */}
      <div className="mb-8 flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-white">Job Description Intelligence</h1>
          <p className="text-sm text-slate-400 mt-2">
            Analyze requirements and calculate resume compatibility using local semantic matching.
          </p>
        </div>
        {structuredJD && (
          <button
            onClick={resetAnalysis}
            className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-slate-200 text-xs font-bold rounded-lg border border-slate-800 transition-colors"
          >
            Clear & Analyze New
          </button>
        )}
      </div>

      {error && (
        <div className="mb-6 bg-rose-950/40 border border-rose-900/60 p-4 rounded-xl flex items-start space-x-3 text-rose-300 text-sm">
          <AlertCircle className="h-5 w-5 text-rose-400 flex-shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      {matchingError && (
        <div className="mb-6 bg-rose-950/40 border border-rose-900/60 p-4 rounded-xl flex items-start space-x-3 text-rose-300 text-sm">
          <AlertCircle className="h-5 w-5 text-rose-400 flex-shrink-0 mt-0.5" />
          <span>{matchingError}</span>
        </div>
      )}

      {!structuredJD ? (
        /* INPUT PANEL */
        <div className="max-w-4xl bg-slate-900 border border-slate-800 rounded-2xl shadow-xl overflow-hidden">
          
          {/* Tabs */}
          <div className="flex border-b border-slate-800 bg-slate-900/50">
            <button
              onClick={() => setActiveInputTab('paste')}
              className={`flex-1 py-4 text-center text-xs font-bold transition-all border-b-2 ${
                activeInputTab === 'paste'
                  ? 'border-indigo-500 text-white bg-slate-850/40'
                  : 'border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-850/10'
              }`}
            >
              Paste Job Description Text
            </button>
            <button
              onClick={() => setActiveInputTab('upload')}
              className={`flex-1 py-4 text-center text-xs font-bold transition-all border-b-2 ${
                activeInputTab === 'upload'
                  ? 'border-indigo-500 text-white bg-slate-850/40'
                  : 'border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-850/10'
              }`}
            >
              Upload PDF Document
            </button>
          </div>

          <form onSubmit={handleAnalyze} className="p-8 space-y-6">
            {activeInputTab === 'paste' ? (
              <div className="space-y-2">
                <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider">
                  Job Description Text
                </label>
                <textarea
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  placeholder="Paste the raw text of the job description here..."
                  className="w-full h-80 bg-slate-950 border border-slate-800 rounded-xl p-4 text-xs font-sans focus:border-indigo-500 focus:outline-none placeholder:text-slate-700 leading-relaxed"
                />
              </div>
            ) : (
              <div className="space-y-4">
                <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider">
                  Select PDF Job Description
                </label>
                <div className="border-2 border-dashed border-slate-800 rounded-2xl p-12 text-center hover:border-indigo-500 hover:bg-slate-850/10 transition-colors relative cursor-pointer">
                  <input
                    type="file"
                    accept=".pdf"
                    onChange={handleFileChange}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  />
                  <Upload className="h-10 w-10 mx-auto mb-4 text-slate-500" />
                  <span className="text-xs font-bold block text-slate-300">
                    {selectedFile ? selectedFile.name : 'Select Job Description PDF'}
                  </span>
                  <span className="text-[10px] text-slate-500 mt-1 block">PDF format only, up to 5MB</span>
                </div>
              </div>
            )}

            <div className="flex justify-end">
              <button
                type="submit"
                disabled={analyzing}
                className="flex items-center space-x-2 px-6 py-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold transition-all disabled:bg-slate-800 disabled:text-slate-500"
              >
                <Sparkles className="h-4 w-4" />
                <span>{analyzing ? 'Analyzing Requirements...' : 'Extract & Analyze Job'}</span>
              </button>
            </div>
          </form>
        </div>
      ) : (
        /* ANALYSIS + MATCH REPORT VIEW */
        <div className="space-y-8">
          
          {/* Tabs for Job Details vs Matching Report */}
          <div className="flex border-b border-slate-800 max-w-lg">
            <button
              onClick={() => setActiveViewTab('details')}
              className={`flex-1 py-3 text-center text-xs font-bold transition-all border-b-2 ${
                activeViewTab === 'details'
                  ? 'border-indigo-500 text-white'
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              Job Requirements
            </button>
            <button
              onClick={() => {
                setActiveViewTab('matching');
                if (!matchReport && hasResume) {
                  handleRunMatch();
                }
              }}
              className={`flex-1 py-3 text-center text-xs font-bold transition-all border-b-2 flex items-center justify-center space-x-2 ${
                activeViewTab === 'matching'
                  ? 'border-indigo-500 text-white'
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              <Sparkles className="h-3.5 w-3.5 text-indigo-400" />
              <span>Resume Match Report</span>
            </button>
          </div>

          {activeViewTab === 'details' ? (
            /* TAB 1: JOB DETAILS */
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              
              {/* Sidebar: Job info & weights config */}
              <div className="lg:col-span-1 space-y-6">
                
                {/* Header card */}
                <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-md relative overflow-hidden">
                  <div className="flex items-start justify-between">
                    <div className="p-3 bg-indigo-950/60 rounded-lg border border-indigo-800/40 text-indigo-400">
                      <Briefcase className="h-6 w-6" />
                    </div>
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded text-[10px] font-bold bg-indigo-950/60 text-indigo-300 border border-indigo-800/40">
                      Active JD
                    </span>
                  </div>
                  
                  <h2 className="text-xl font-black text-white mt-4 tracking-tight leading-snug">
                    {structuredJD.job_title || 'Unknown Title'}
                  </h2>
                  <p className="text-sm font-semibold text-slate-350 mt-1">
                    {structuredJD.company || 'Unknown Company'}
                  </p>

                  <div className="mt-6 pt-4 border-t border-slate-800 space-y-3 text-xs text-slate-400">
                    <div className="flex justify-between">
                      <span>Required Skills</span>
                      <span className="font-bold text-white">{structuredJD.required_skills.length}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Preferred Skills</span>
                      <span className="font-bold text-white">{structuredJD.preferred_skills.length}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Responsibilities</span>
                      <span className="font-bold text-white">{structuredJD.responsibilities.length}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Experience</span>
                      <span className="font-bold text-white">{structuredJD.experience.length}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Education</span>
                      <span className="font-bold text-white">{structuredJD.education.length}</span>
                    </div>
                  </div>

                  {hasResume ? (
                    <button
                      onClick={handleRunMatch}
                      disabled={matching}
                      className="w-full mt-6 flex items-center justify-center space-x-2 py-3 bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-800 text-white rounded-xl text-xs font-bold transition-all shadow-lg shadow-indigo-650/20"
                    >
                      <Sparkles className="h-4 w-4" />
                      <span>{matching ? 'Calculating Match...' : 'Calculate Resume Match'}</span>
                    </button>
                  ) : (
                    <div className="mt-6 p-4 rounded-xl bg-amber-950/30 border border-amber-900/40 text-[11px] text-amber-300/90 leading-relaxed">
                      <Info className="h-4 w-4 text-amber-400 mb-1" />
                      No active resume uploaded. Please go to the **Resume** tab to index your resume before matching.
                    </div>
                  )}
                </div>

                {/* Score weights controller */}
                <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-md">
                  <button 
                    onClick={() => setShowWeightConfig(!showWeightConfig)}
                    className="w-full flex items-center justify-between text-xs font-bold uppercase tracking-wider text-slate-400"
                  >
                    <span className="flex items-center space-x-2">
                      <Sliders className="h-4 w-4 text-indigo-400" />
                      <span>Configure Score Weights</span>
                    </span>
                    {showWeightConfig ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                  </button>

                  {showWeightConfig && (
                    <div className="mt-6 space-y-5 border-t border-slate-800/60 pt-4">
                      <p className="text-[11px] text-slate-400 leading-relaxed">
                        Adjust weights below. The matching engine computes scores relative to these proportions:
                      </p>
                      
                      {/* Required Skills Slider */}
                      <div className="space-y-2">
                        <div className="flex justify-between text-xs font-semibold">
                          <span className="text-slate-350">Required Skills</span>
                          <span className="text-white font-bold">{Math.round((reqWeight / totalSliderSum) * 100)}%</span>
                        </div>
                        <input 
                          type="range" 
                          min="0" 
                          max="100" 
                          value={reqWeight}
                          onChange={(e) => setReqWeight(Number(e.target.value))}
                          className="w-full h-1.5 bg-slate-950 rounded-lg appearance-none cursor-pointer accent-indigo-500"
                        />
                      </div>

                      {/* Preferred Skills Slider */}
                      <div className="space-y-2">
                        <div className="flex justify-between text-xs font-semibold">
                          <span className="text-slate-350">Preferred Skills</span>
                          <span className="text-white font-bold">{Math.round((prefWeight / totalSliderSum) * 100)}%</span>
                        </div>
                        <input 
                          type="range" 
                          min="0" 
                          max="100" 
                          value={prefWeight}
                          onChange={(e) => setPrefWeight(Number(e.target.value))}
                          className="w-full h-1.5 bg-slate-950 rounded-lg appearance-none cursor-pointer accent-indigo-500"
                        />
                      </div>

                      {/* Experience Slider */}
                      <div className="space-y-2">
                        <div className="flex justify-between text-xs font-semibold">
                          <span className="text-slate-350">Experience & Duties</span>
                          <span className="text-white font-bold">{Math.round((expWeight / totalSliderSum) * 100)}%</span>
                        </div>
                        <input 
                          type="range" 
                          min="0" 
                          max="100" 
                          value={expWeight}
                          onChange={(e) => setExpWeight(Number(e.target.value))}
                          className="w-full h-1.5 bg-slate-950 rounded-lg appearance-none cursor-pointer accent-indigo-500"
                        />
                      </div>

                      {/* Education Slider */}
                      <div className="space-y-2">
                        <div className="flex justify-between text-xs font-semibold">
                          <span className="text-slate-350">Education & Degrees</span>
                          <span className="text-white font-bold">{Math.round((eduWeight / totalSliderSum) * 100)}%</span>
                        </div>
                        <input 
                          type="range" 
                          min="0" 
                          max="100" 
                          value={eduWeight}
                          onChange={(e) => setEduWeight(Number(e.target.value))}
                          className="w-full h-1.5 bg-slate-950 rounded-lg appearance-none cursor-pointer accent-indigo-500"
                        />
                      </div>

                      <div className="text-[10px] bg-slate-950/80 p-2.5 rounded-lg border border-slate-800/80 text-slate-500">
                        Current weights count ratio: {reqWeight} : {prefWeight} : {expWeight} : {eduWeight}
                      </div>
                    </div>
                  )}
                </div>

              </div>

              {/* Requirements contents lists */}
              <div className="lg:col-span-2 space-y-6">
                
                {/* Required Technical Skills */}
                <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-md">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-4">
                    Required Technical Skills
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {structuredJD.required_skills.length > 0 ? (
                      structuredJD.required_skills.map((skill, index) => (
                        <span 
                          key={index} 
                          className="px-2.5 py-1 rounded bg-indigo-950/50 border border-indigo-900/60 text-[10px] font-bold text-indigo-300 uppercase tracking-wide"
                        >
                          {skill}
                        </span>
                      ))
                    ) : (
                      <p className="text-xs text-slate-500 italic">No required technical skills found.</p>
                    )}
                  </div>
                </div>

                {/* Preferred Technical Skills */}
                {structuredJD.preferred_skills.length > 0 && (
                  <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-md">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-4">
                      Preferred Skills / Nice to Haves
                    </h3>
                    <div className="flex flex-wrap gap-2">
                      {structuredJD.preferred_skills.map((skill, index) => (
                        <span 
                          key={index} 
                          className="px-2.5 py-1 rounded bg-emerald-950/40 border border-emerald-900/40 text-[10px] font-bold text-emerald-300 uppercase tracking-wide"
                        >
                          {skill}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Responsibilities */}
                {structuredJD.responsibilities.length > 0 && (
                  <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-md">
                    <h3 className="text-sm font-bold text-white mb-4 flex items-center">
                      <Clipboard className="h-4 w-4 text-indigo-400 mr-2" /> Responsibilities & Duties
                    </h3>
                    <ul className="space-y-3">
                      {structuredJD.responsibilities.map((resp, idx) => (
                        <li key={idx} className="flex items-start space-x-2 text-xs text-slate-300 leading-relaxed">
                          <span className="h-1.5 w-1.5 rounded-full bg-indigo-500 mt-1.5 flex-shrink-0" />
                          <span>{resp}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Experience & Education Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  
                  {/* Experience */}
                  <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-md">
                    <h3 className="text-sm font-bold text-white mb-4 flex items-center">
                      <Calendar className="h-4 w-4 text-indigo-400 mr-2" /> Experience Criteria
                    </h3>
                    {structuredJD.experience.length > 0 ? (
                      <ul className="space-y-3">
                        {structuredJD.experience.map((exp, idx) => (
                          <li key={idx} className="flex items-start space-x-2 text-xs text-slate-300 leading-relaxed">
                            <span className="h-1.5 w-1.5 rounded-full bg-indigo-400 mt-1.5 flex-shrink-0" />
                            <span>{exp}</span>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="text-xs text-slate-500 italic">No specific experience criteria detected.</p>
                    )}
                  </div>

                  {/* Education */}
                  <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-md">
                    <h3 className="text-sm font-bold text-white mb-4 flex items-center">
                      <GraduationCap className="h-4 w-4 text-indigo-400 mr-2" /> Education Requirements
                    </h3>
                    {structuredJD.education.length > 0 ? (
                      <ul className="space-y-3">
                        {structuredJD.education.map((edu, idx) => (
                          <li key={idx} className="flex items-start space-x-2 text-xs text-slate-300 leading-relaxed">
                            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 mt-1.5 flex-shrink-0" />
                            <span>{edu}</span>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="text-xs text-slate-500 italic">No specific education criteria detected.</p>
                    )}
                  </div>

                </div>

                {/* Other/Uncategorized */}
                {structuredJD.other_requirements.length > 0 && (
                  <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-md">
                    <h3 className="text-sm font-bold text-white mb-4 flex items-center">
                      <Bookmark className="h-4 w-4 text-indigo-400 mr-2" /> Other Requirements & Context
                    </h3>
                    <ul className="space-y-3">
                      {structuredJD.other_requirements.map((item, idx) => (
                        <li key={idx} className="flex items-start space-x-2 text-xs text-slate-300 leading-relaxed">
                          <span className="h-1.5 w-1.5 rounded-full bg-slate-500 mt-1.5 flex-shrink-0" />
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

              </div>

            </div>
          ) : (
            /* TAB 2: RESUME MATCH REPORT */
            <div className="space-y-8">
              
              {!matchReport ? (
                /* Matching state / Loading / Not started */
                <div className="max-w-xl mx-auto text-center bg-slate-900 border border-slate-800 rounded-2xl p-8 shadow-xl">
                  {matching ? (
                    <div className="space-y-4">
                      <div className="mx-auto w-10 h-10 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
                      <p className="text-xs font-semibold text-slate-300">
                        Running local matching engine... extracting vector index evidence and calculating fit score...
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-6">
                      <div className="mx-auto w-12 h-12 bg-indigo-950/60 rounded-full flex items-center justify-center border border-indigo-800/40">
                        <Sparkles className="h-6 w-6 text-indigo-400" />
                      </div>
                      <div>
                        <h3 className="text-base font-bold text-white">Generate Resume Compatibility Report</h3>
                        <p className="text-xs text-slate-400 mt-2 leading-relaxed">
                          This compares the active indexed resume with the parsed job requirements. Let's resolve skills, extract vector segments from ChromaDB, and compute the weighted fit score.
                        </p>
                      </div>
                      {hasResume ? (
                        <button
                          onClick={handleRunMatch}
                          className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-lg transition-all shadow-lg"
                        >
                          Generate Fit Report
                        </button>
                      ) : (
                        <p className="text-xs text-amber-400 italic">Please upload a resume first under the Resume tab.</p>
                      )}
                    </div>
                  )}
                </div>
              ) : (
                /* Report outputs */
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                  
                  {/* Left Column: Overall score and stats */}
                  <div className="lg:col-span-1 space-y-6">
                    
                    {/* Score Card */}
                    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-md text-center relative overflow-hidden">
                      <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-6">
                        Overall Compatibility
                      </h3>

                      {/* SVG gauge */}
                      <div className="relative w-36 h-36 mx-auto flex items-center justify-center mb-6">
                        <svg className="w-full h-full transform -rotate-90">
                          <circle
                            cx="72"
                            cy="72"
                            r="64"
                            className="stroke-slate-950"
                            strokeWidth="8"
                            fill="transparent"
                          />
                          <circle
                            cx="72"
                            cy="72"
                            r="64"
                            className={`${
                              matchReport.overall_score >= 80 ? 'stroke-emerald-500' :
                              matchReport.overall_score >= 70 ? 'stroke-indigo-500' :
                              matchReport.overall_score >= 50 ? 'stroke-amber-500' : 'stroke-rose-500'
                            } transition-all duration-1000 ease-out`}
                            strokeWidth="8"
                            fill="transparent"
                            strokeDasharray={2 * Math.PI * 64}
                            strokeDashoffset={2 * Math.PI * 64 * (1 - matchReport.overall_score / 100)}
                            strokeLinecap="round"
                          />
                        </svg>
                        <div className="absolute text-center">
                          <span className="text-3xl font-black text-white">{matchReport.overall_score}%</span>
                          <span className="text-[9px] text-slate-400 block uppercase font-bold tracking-wider mt-0.5">Fit Score</span>
                        </div>
                      </div>

                      {/* Recommendation banner */}
                      <div className={`p-4 rounded-xl border text-[11px] font-bold text-center leading-relaxed ${
                        matchReport.overall_score >= 80 ? 'bg-emerald-950/40 border-emerald-900/60 text-emerald-400' :
                        matchReport.overall_score >= 70 ? 'bg-indigo-950/40 border-indigo-900/60 text-indigo-400' :
                        matchReport.overall_score >= 50 ? 'bg-amber-950/40 border-amber-900/60 text-amber-400' :
                        'bg-rose-950/40 border-rose-900/60 text-rose-400'
                      }`}>
                        <p>{matchReport.recommendation}</p>
                      </div>

                      {/* Config weights preview */}
                      <div className="mt-6 pt-4 border-t border-slate-800 text-[11px] text-slate-450 space-y-2 text-left">
                        <p className="font-bold text-slate-400 text-xs mb-2 uppercase tracking-wide">Category Breakdown</p>
                        {Object.entries(matchReport.category_scores).map(([key, value]) => (
                          <div key={key} className="flex justify-between items-center py-1">
                            <span className="capitalize">{key.replace('_', ' ')}</span>
                            <div className="flex items-center space-x-2">
                              <span className="text-[10px] text-slate-500">({value.matched_count}/{value.total_count} matched)</span>
                              <span className="font-bold text-white">{value.score}%</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Strengths Card */}
                    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-md">
                      <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-4 flex items-center">
                        <CheckCircle2 className="h-4 w-4 text-emerald-400 mr-2" />
                        Key Strengths Identified
                      </h3>
                      {matchReport.strengths.length > 0 ? (
                        <div className="space-y-3">
                          {matchReport.strengths.map((str, idx) => (
                            <div key={idx} className="flex items-start space-x-2 text-xs text-slate-350">
                              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 mt-1.5 flex-shrink-0" />
                              <span className="font-medium text-slate-200">{str}</span>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-xs text-slate-550 italic">No strong matches identified yet.</p>
                      )}
                    </div>

                    {/* Gaps Card */}
                    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-md">
                      <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-4 flex items-center">
                        <XCircle className="h-4 w-4 text-rose-450 mr-2" />
                        Identified Gaps / Missing Items
                      </h3>
                      {matchReport.gaps.length > 0 ? (
                        <div className="space-y-3">
                          {matchReport.gaps.map((gap, idx) => (
                            <div key={idx} className="flex items-start space-x-2 text-xs text-slate-350">
                              <span className="h-1.5 w-1.5 rounded-full bg-rose-500 mt-1.5 flex-shrink-0" />
                              <span className="text-slate-200">{gap}</span>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-xs text-slate-550 italic">Zero significant gaps! Perfect match!</p>
                      )}
                    </div>

                  </div>

                  {/* Right Column: Detailed Match Breakdown list with evidence segments */}
                  <div className="lg:col-span-2 space-y-4">
                    
                    <div className="flex justify-between items-center mb-2">
                      <h3 className="text-sm font-bold text-white">Detailed Match Evidence</h3>
                      <button 
                        onClick={handleRunMatch}
                        disabled={matching}
                        className="px-3 py-1 bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 text-[10px] font-bold rounded-lg transition-colors"
                      >
                        Re-Run Match
                      </button>
                    </div>

                    {/* Category Accordion Tabs */}
                    <div className="space-y-4">
                      
                      {/* Accordion Item: Required Skills */}
                      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-sm">
                        <button
                          onClick={() => setExpandedSection(expandedSection === 'required' ? null : 'required')}
                          className="w-full px-5 py-4 flex items-center justify-between text-xs font-bold text-white bg-slate-900/60 uppercase tracking-wide border-b border-slate-800/40"
                        >
                          <span className="flex items-center space-x-2">
                            <Layers className="h-4 w-4 text-indigo-400" />
                            <span>Required Skills ({matchReport.required_skills.length})</span>
                          </span>
                          <span className="flex items-center space-x-3">
                            <span className="text-[10px] text-indigo-300 normal-case font-bold">{matchReport.category_scores.required_skills.score}% Category Score</span>
                            {expandedSection === 'required' ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                          </span>
                        </button>

                        {expandedSection === 'required' && (
                          <div className="p-5 space-y-4 bg-slate-900/30">
                            {matchReport.required_skills.length > 0 ? (
                              matchReport.required_skills.map((item, idx) => (
                                <RequirementMatchCard key={idx} item={item} />
                              ))
                            ) : (
                              <p className="text-xs text-slate-500 italic">No required skills listed.</p>
                            )}
                          </div>
                        )}
                      </div>

                      {/* Accordion Item: Preferred Skills */}
                      {matchReport.preferred_skills.length > 0 && (
                        <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-sm">
                          <button
                            onClick={() => setExpandedSection(expandedSection === 'preferred' ? null : 'preferred')}
                            className="w-full px-5 py-4 flex items-center justify-between text-xs font-bold text-white bg-slate-900/60 uppercase tracking-wide border-b border-slate-800/40"
                          >
                            <span className="flex items-center space-x-2">
                              <Award className="h-4 w-4 text-emerald-450" />
                              <span>Preferred Skills ({matchReport.preferred_skills.length})</span>
                            </span>
                            <span className="flex items-center space-x-3">
                              <span className="text-[10px] text-emerald-300 normal-case font-bold">{matchReport.category_scores.preferred_skills.score}% Category Score</span>
                              {expandedSection === 'preferred' ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                            </span>
                          </button>

                          {expandedSection === 'preferred' && (
                            <div className="p-5 space-y-4 bg-slate-900/30">
                              {matchReport.preferred_skills.map((item, idx) => (
                                <RequirementMatchCard key={idx} item={item} />
                              ))}
                            </div>
                          )}
                        </div>
                      )}

                      {/* Accordion Item: Experience & Duties */}
                      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-sm">
                        <button
                          onClick={() => setExpandedSection(expandedSection === 'experience' ? null : 'experience')}
                          className="w-full px-5 py-4 flex items-center justify-between text-xs font-bold text-white bg-slate-900/60 uppercase tracking-wide border-b border-slate-800/40"
                        >
                          <span className="flex items-center space-x-2">
                            <Briefcase className="h-4 w-4 text-sky-405" />
                            <span>Experience & Responsibilities ({matchReport.experience.length})</span>
                          </span>
                          <span className="flex items-center space-x-3">
                            <span className="text-[10px] text-sky-300 normal-case font-bold">{matchReport.category_scores.experience.score}% Category Score</span>
                            {expandedSection === 'experience' ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                          </span>
                        </button>

                        {expandedSection === 'experience' && (
                          <div className="p-5 space-y-4 bg-slate-900/30">
                            {matchReport.experience.length > 0 ? (
                              matchReport.experience.map((item, idx) => (
                                <RequirementMatchCard key={idx} item={item} />
                              ))
                            ) : (
                              <p className="text-xs text-slate-500 italic">No experience criteria listed.</p>
                            )}
                          </div>
                        )}
                      </div>

                      {/* Accordion Item: Education & Qualifications */}
                      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-sm">
                        <button
                          onClick={() => setExpandedSection(expandedSection === 'education' ? null : 'education')}
                          className="w-full px-5 py-4 flex items-center justify-between text-xs font-bold text-white bg-slate-900/60 uppercase tracking-wide border-b border-slate-800/40"
                        >
                          <span className="flex items-center space-x-2">
                            <GraduationCap className="h-4 w-4 text-violet-405" />
                            <span>Education & Qualifications ({matchReport.education.length})</span>
                          </span>
                          <span className="flex items-center space-x-3">
                            <span className="text-[10px] text-violet-300 normal-case font-bold">{matchReport.category_scores.education.score}% Category Score</span>
                            {expandedSection === 'education' ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                          </span>
                        </button>

                        {expandedSection === 'education' && (
                          <div className="p-5 space-y-4 bg-slate-900/30">
                            {matchReport.education.length > 0 ? (
                              matchReport.education.map((item, idx) => (
                                <RequirementMatchCard key={idx} item={item} />
                              ))
                            ) : (
                              <p className="text-xs text-slate-500 italic">No education criteria listed.</p>
                            )}
                          </div>
                        )}
                      </div>

                    </div>

                  </div>

                </div>
              )}

            </div>
          )}

        </div>
      )}

    </div>
  );
};

// Sub-component to render evidence and score for a single RequirementMatch
interface RequirementMatchCardProps {
  item: any;
}

const RequirementMatchCard: React.FC<RequirementMatchCardProps> = ({ item }) => {
  const { requirement, status, similarity, evidence, related_evidence } = item;

  return (
    <div className="bg-slate-950/60 border border-slate-805 rounded-xl p-4 transition-all hover:bg-slate-900/40">
      <div className="flex items-center justify-between">
        <div className="flex items-start space-x-2.5 max-w-[75%]">
          <div className="mt-0.5">
            {status === 'Strong Match' && <CheckCircle2 className="h-4 w-4 text-emerald-400" />}
            {status === 'Partial Match' && <FileCheck2 className="h-4 w-4 text-indigo-400" />}
            {status === 'Related/Weak Evidence' && <AlertTriangle className="h-4 w-4 text-amber-400" />}
            {status === 'Missing' && <XCircle className="h-4 w-4 text-rose-500" />}
          </div>
          <span className="text-xs font-bold text-slate-200 leading-normal">{requirement}</span>
        </div>
        
        <div className="flex items-center space-x-3 flex-shrink-0">
          {similarity > 0 && (
            <span className="text-[10px] font-semibold text-slate-500">
              Sim: {Math.round(similarity * 100)}%
            </span>
          )}
          <span className={`px-2.5 py-0.5 rounded text-[9px] font-extrabold uppercase tracking-wide ${
            status === 'Strong Match' ? 'bg-emerald-950/60 text-emerald-350 border border-emerald-900/40' :
            status === 'Partial Match' ? 'bg-indigo-950/60 text-indigo-350 border border-indigo-900/40' :
            status === 'Related/Weak Evidence' ? 'bg-amber-950/60 text-amber-355 border border-amber-900/40' :
            'bg-rose-950/60 text-rose-350 border border-rose-900/40'
          }`}>
            {status}
          </span>
        </div>
      </div>

      {evidence && (
        <div className="mt-3.5 pl-4 border-l border-slate-800 text-[11px] text-slate-400 leading-relaxed">
          <p className="italic">"{evidence.content}"</p>
          <div className="mt-1.5 flex items-center space-x-2 text-[10px] text-slate-500 font-semibold uppercase tracking-wider">
            <span>Retrieved from: {evidence.section}</span>
          </div>
        </div>
      )}

      {status === 'Missing' && related_evidence && (
        <div className="mt-3.5 pl-4 border-l border-rose-900/40 text-[11px] text-slate-400 leading-relaxed bg-rose-950/10 p-2.5 rounded-lg border border-rose-950/20">
          <p className="text-[10px] font-extrabold text-rose-300 uppercase tracking-wider mb-1">Related resume evidence found:</p>
          <p className="italic">"{related_evidence.content}"</p>
          <div className="mt-1.5 flex items-center space-x-2 text-[10px] text-slate-500 font-semibold uppercase tracking-wider">
            <span>Retrieved from: {related_evidence.section}</span>
            <span>•</span>
            <span>Similarity: {Math.round(related_evidence.similarity * 100)}%</span>
          </div>
        </div>
      )}
    </div>
  );
};
