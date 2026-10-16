import React, { useState, useEffect } from 'react';
import { apiService } from '../services/api';
import type { 
  ActiveResumeResponse, 
  SearchResult
} from '../services/api';
import { 
  Upload, 
  FileText, 
  Search, 
  Sparkles, 
  ChevronRight, 
  Layers, 
  Grid,
  CheckCircle,
  AlertCircle,
  Clock
} from 'lucide-react';

export const ResumeView: React.FC = () => {
  const [resumeInfo, setResumeInfo] = useState<ActiveResumeResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'sections' | 'chunks'>('sections');
  
  // Search State
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [expandedSection, setExpandedSection] = useState<string | null>(null);

  // Load active resume details
  const fetchActiveResume = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await apiService.getActiveResume();
      setResumeInfo(data);
    } catch (err: any) {
      setError(err.message || 'Failed to load active resume.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchActiveResume();
  }, []);

  // Handle PDF upload
  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (file.type !== 'application/pdf') {
      setError('Please upload PDF documents only.');
      return;
    }

    setUploading(true);
    setError(null);
    try {
      await apiService.uploadResume(file);
      await fetchActiveResume(); // Reload active state
    } catch (err: any) {
      setError(err.message || 'File upload failed.');
    } finally {
      setUploading(false);
    }
  };

  // Perform semantic vector query
  const handleSemanticSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;

    setSearching(true);
    try {
      const res = await apiService.searchResume(searchQuery);
      setSearchResults(res.results);
    } catch (err: any) {
      console.error('Semantic query failed:', err);
    } finally {
      setSearching(false);
    }
  };

  // Format date utility
  const formatDate = (isoString?: string) => {
    if (!isoString) return '';
    const date = new Date(isoString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="flex-1 bg-slate-950 text-slate-100 p-8 ml-64 min-h-[calc(100vh-4rem)]">
      
      {/* Top Welcome Title */}
      <div className="mb-8">
        <h1 className="text-3xl font-extrabold tracking-tight text-white">Resume Intelligence</h1>
        <p className="text-sm text-slate-400 mt-2">
          Local PDF extraction, section-aware chunking, and local BGE-small embedding database management.
        </p>
      </div>

      {error && (
        <div className="mb-6 bg-rose-950/40 border border-rose-900/60 p-4 rounded-xl flex items-start space-x-3 text-rose-300 text-sm">
          <AlertCircle className="h-5 w-5 text-rose-400 flex-shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      {loading ? (
        <div className="py-24 text-center text-slate-400">Querying local database...</div>
      ) : resumeInfo && resumeInfo.has_resume ? (
        
        /* Render Loaded Resume Dashboard */
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Left Column: Active Metadata & Semantic Search */}
          <div className="lg:col-span-1 space-y-6">
            
            {/* Active Resume Card */}
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-md relative overflow-hidden">
              <div className="flex items-start justify-between">
                <div className="p-3 bg-indigo-950/60 rounded-lg border border-indigo-800/40 text-indigo-400">
                  <FileText className="h-6 w-6" />
                </div>
                <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-950/60 text-emerald-300 border border-emerald-800/40">
                  <CheckCircle className="h-3 w-3 mr-1" /> Active
                </span>
              </div>
              
              <h3 className="text-md font-bold text-white mt-4 truncate">{resumeInfo.filename}</h3>
              <p className="text-xs text-slate-400 flex items-center mt-2">
                <Clock className="h-3 w-3 mr-1" /> Indexed {formatDate(resumeInfo.uploaded_at)}
              </p>

              <div className="mt-6 pt-4 border-t border-slate-800 flex justify-between text-xs text-slate-400">
                <div>
                  <span className="block text-white font-semibold">{Object.keys(resumeInfo.sections || {}).length}</span>
                  <span>Sections</span>
                </div>
                <div>
                  <span className="block text-white font-semibold">{resumeInfo.chunks_count}</span>
                  <span>Vector Chunks</span>
                </div>
              </div>

              {/* Overwrite upload button */}
              <div className="mt-6">
                <label className="block w-full text-center px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-lg border border-slate-700/60 cursor-pointer transition-colors duration-150">
                  {uploading ? 'Processing PDF...' : 'Upload New Version'}
                  <input 
                    type="file" 
                    accept=".pdf" 
                    onChange={handleFileUpload} 
                    className="hidden" 
                    disabled={uploading} 
                  />
                </label>
              </div>
            </div>

            {/* Semantic Vector Search Box */}
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-md">
              <h3 className="text-md font-bold text-white flex items-center mb-2">
                <Sparkles className="h-4 w-4 text-indigo-400 mr-2" /> Vector Store Query
              </h3>
              <p className="text-xs text-slate-400 mb-4 leading-relaxed">
                Search your resume semantically. The query is embedded locally via BGE and matches nearest vector points in ChromaDB.
              </p>
              
              <form onSubmit={handleSemanticSearch} className="flex space-x-2 mb-4">
                <input 
                  type="text" 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="e.g. 'FastAPI experience' or 'degree'"
                  className="flex-1 bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs focus:border-indigo-500 focus:outline-none placeholder:text-slate-600"
                />
                <button 
                  type="submit" 
                  disabled={searching}
                  className="px-3 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-bold transition-colors"
                >
                  {searching ? 'Querying...' : <Search className="h-4 w-4" />}
                </button>
              </form>

              {/* Query Results */}
              <div className="space-y-3 max-h-[300px] overflow-y-auto pr-1">
                {searchResults.length > 0 ? (
                  searchResults.map((result) => (
                    <div key={result.id} className="bg-slate-850 border border-slate-850 p-3 rounded-lg text-xs space-y-1.5 hover:border-slate-750 transition-colors">
                      <div className="flex justify-between items-center">
                        <span className="font-bold text-indigo-400 uppercase text-[9px] tracking-wider bg-slate-900 px-1.5 py-0.5 rounded border border-slate-800">
                          {result.section}
                        </span>
                        <span className="text-[10px] font-semibold text-emerald-400">
                          Match: {Math.round(result.similarity * 100)}%
                        </span>
                      </div>
                      <p className="text-slate-300 leading-relaxed text-[11px]">{result.content}</p>
                    </div>
                  ))
                ) : searchQuery && !searching ? (
                  <p className="text-center text-xs text-slate-650 py-4">No vector records found.</p>
                ) : (
                  <p className="text-center text-xs text-slate-650 py-4">Enter a search keyword to query ChromaDB.</p>
                )}
              </div>
            </div>

          </div>

          {/* Right Column: Sections / Chunks content tabs */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* View Mode Select */}
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex justify-between items-center shadow-md">
              <div className="flex space-x-2">
                <button 
                  onClick={() => setActiveTab('sections')}
                  className={`flex items-center space-x-2 px-4 py-2 rounded-lg text-xs font-bold transition-colors ${
                    activeTab === 'sections' 
                      ? 'bg-slate-850 text-white border border-slate-750' 
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <Grid className="h-4 w-4" />
                  <span>Parsed Sections</span>
                </button>
                <button 
                  onClick={() => setActiveTab('chunks')}
                  className={`flex items-center space-x-2 px-4 py-2 rounded-lg text-xs font-bold transition-colors ${
                    activeTab === 'chunks' 
                      ? 'bg-slate-850 text-white border border-slate-750' 
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <Layers className="h-4 w-4" />
                  <span>Vector Chunks ({resumeInfo.chunks_count})</span>
                </button>
              </div>
            </div>

            {/* Content view panels */}
            {activeTab === 'sections' ? (
              <div className="space-y-4">
                {Object.entries(resumeInfo.sections || {}).map(([secName, secText]) => {
                  const isExpanded = expandedSection === secName;
                  return (
                    <div 
                      key={secName} 
                      className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-md"
                    >
                      <button
                        onClick={() => setExpandedSection(isExpanded ? null : secName)}
                        className="w-full flex items-center justify-between p-5 hover:bg-slate-850/40 text-left transition-colors"
                      >
                        <div className="flex items-center space-x-3">
                          <ChevronRight className={`h-4 w-4 text-indigo-400 transition-transform ${isExpanded ? 'rotate-90' : ''}`} />
                          <span className="font-bold text-white text-sm">{secName}</span>
                        </div>
                        <span className="text-[10px] text-slate-500 font-semibold bg-slate-950 px-2.5 py-1 rounded-full border border-slate-850">
                          {secText.split('\n').filter(Boolean).length} lines
                        </span>
                      </button>
                      
                      {isExpanded && (
                        <div className="p-6 border-t border-slate-800 bg-slate-950/20">
                          <pre className="text-xs text-slate-300 leading-relaxed font-sans whitespace-pre-wrap">
                            {secText}
                          </pre>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="space-y-4 max-h-[600px] overflow-y-auto pr-1">
                {resumeInfo.chunks?.map((chunk, idx) => (
                  <div key={idx} className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-md flex flex-col space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="font-extrabold text-[10px] uppercase text-indigo-300 tracking-wider bg-indigo-950/40 border border-indigo-900/60 px-2 py-0.5 rounded">
                        {chunk.section}
                      </span>
                      <span className="text-[10px] text-slate-500 font-medium">
                        Chunk Index: {chunk.chunk_index}
                      </span>
                    </div>
                    <p className="text-xs text-slate-300 leading-relaxed font-mono bg-slate-950/60 p-3 rounded-lg border border-slate-850">
                      {chunk.content}
                    </p>
                  </div>
                ))}
              </div>
            )}

          </div>

        </div>

      ) : (

        /* Render File Uploader Zone when resume is absent */
        <div className="max-w-2xl mx-auto mt-12 bg-slate-900 border border-slate-800 rounded-2xl p-12 text-center shadow-xl">
          <div className="mx-auto w-16 h-16 bg-indigo-950/60 rounded-full flex items-center justify-center mb-6 border border-indigo-850 text-indigo-400">
            <Upload className="h-8 w-8" />
          </div>
          
          <h2 className="text-xl font-bold text-white mb-2">Import Your Resume</h2>
          <p className="text-sm text-slate-400 leading-relaxed max-w-md mx-auto mb-8">
            Upload your resume PDF. PathPilot will extract your details locally, index your skills and experiences, and load them into your personal vector store.
          </p>

          <div className="max-w-sm mx-auto">
            <label className={`block w-full text-center px-6 py-4 border-2 border-dashed rounded-xl cursor-pointer transition-colors ${
              uploading 
                ? 'border-indigo-650 bg-indigo-950/10 text-indigo-300' 
                : 'border-slate-700 hover:border-indigo-500 hover:bg-slate-850/20 text-slate-300'
            }`}>
              <Upload className="h-6 w-6 mx-auto mb-2 text-slate-500" />
              <span className="text-xs font-bold block">
                {uploading ? 'Parsing and Embedding Resume...' : 'Select PDF Document'}
              </span>
              <span className="text-[10px] text-slate-500 mt-1 block">PDF format only, up to 10MB</span>
              <input 
                type="file" 
                accept=".pdf" 
                onChange={handleFileUpload} 
                className="hidden" 
                disabled={uploading} 
              />
            </label>
          </div>
        </div>

      )}

    </div>
  );
};
