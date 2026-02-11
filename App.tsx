import React, { useState, useRef, useEffect } from 'react';
import { TranscriptionResult, AudioFile, HistoryItem } from './types';
import { SUPPORTED_FORMATS, TRANSLATIONS } from './constants';
import { transcribeAudio, polishTranscription } from './services/geminiService';
import AudioPlayer from './components/AudioPlayer';
import { jsPDF } from 'jspdf';

const App: React.FC = () => {
  const [lang, setLang] = useState<'bn' | 'en'>('bn');
  const [audio, setAudio] = useState<AudioFile | null>(null);
  const [progress, setProgress] = useState(0);
  const [progressLabel, setProgressLabel] = useState('');
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [copyToast, setCopyToast] = useState(false);
  
  // New States for AI Output
  const [polishedText, setPolishedText] = useState<string | null>(null);
  const [isPolishing, setIsPolishing] = useState(false);
  const [viewMode, setViewMode] = useState<'original' | 'ai'>('original');

  const [result, setResult] = useState<TranscriptionResult>({
    text: '',
    status: 'idle'
  });
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const resultRef = useRef<HTMLDivElement>(null);

  const t = TRANSLATIONS[lang];

  useEffect(() => {
    const savedHistory = localStorage.getItem('kothalipi_history');
    if (savedHistory) {
      try {
        setHistory(JSON.parse(savedHistory));
      } catch (e) {
        console.error("Failed to load history", e);
      }
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('kothalipi_history', JSON.stringify(history));
  }, [history]);

  useEffect(() => {
    if (result.status === 'completed' && resultRef.current) {
      resultRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [result.status]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && SUPPORTED_FORMATS.includes(file.type)) {
      setAudio({ file, previewUrl: URL.createObjectURL(file) });
      setResult({ text: '', status: 'idle' });
      setPolishedText(null);
      setViewMode('original');
      setProgress(0);
    } else if (file) {
      alert(lang === 'bn' ? "দুঃখিত, এই ফাইল ফরম্যাটটি সমর্থিত নয়।" : "File format not supported.");
    }
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file && SUPPORTED_FORMATS.includes(file.type)) {
      setAudio({ file, previewUrl: URL.createObjectURL(file) });
      setResult({ text: '', status: 'idle' });
      setPolishedText(null);
      setViewMode('original');
      setProgress(0);
    }
  };

  const addToHistory = (text: string, fileName: string) => {
    const newItem: HistoryItem = {
      id: Date.now().toString(),
      text,
      fileName,
      timestamp: Date.now()
    };
    setHistory(prev => [newItem, ...prev].slice(0, 50));
  };

  const deleteFromHistory = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setHistory(prev => prev.filter(item => item.id !== id));
  };

  const clearHistory = () => {
    if (confirm(lang === 'bn' ? "আপনি কি নিশ্চিত যে সব মুছতে চান?" : "Are you sure you want to clear all?")) {
      setHistory([]);
    }
  };

  const loadFromHistory = (item: HistoryItem) => {
    setResult({ text: item.text, status: 'completed' });
    setPolishedText(null);
    setViewMode('original');
    setAudio(null);
    setIsHistoryOpen(false);
  };

  const handleTranscription = async () => {
    if (!audio) return;
    setResult({ text: '', status: 'processing', error: undefined });
    setPolishedText(null);
    setViewMode('original');
    setProgress(5);
    setProgressLabel(t.uploading);
    let interval: any;
    try {
      const transcriptionPromise = transcribeAudio(audio.file);
      interval = setInterval(() => {
        setProgress(p => {
          if (p < 96) return Math.min(98, p + (p < 40 ? 4 : 0.5));
          if (p > 50) setProgressLabel(t.aiWorking);
          return p;
        });
      }, 500);
      let transcribed = await transcriptionPromise;
      if (interval) clearInterval(interval);
      transcribed = transcribed
        .replace(/[a-zA-Z0-9]/g, '') 
        .replace(/\[?\d{1,2}:\d{2}(:\d{2})?\]?/g, '')
        .replace(/[^\u0980-\u09FF\u0600-\u06FF\s।?!( )]/g, '') 
        .replace(/\s+/g, ' ')
        .trim();
      setProgress(100);
      setProgressLabel(t.done);
      setTimeout(() => {
        setResult({ text: transcribed, status: 'completed' });
        addToHistory(transcribed, audio.file.name);
      }, 500);
    } catch (err: any) {
      if (interval) clearInterval(interval);
      setResult({ text: '', status: 'error', error: t.errorMsg });
      setProgress(0);
    }
  };

  const handlePolish = async () => {
    if (!result.text || isPolishing) return;
    setIsPolishing(true);
    setProgressLabel(t.polishing);
    try {
      const polished = await polishTranscription(result.text);
      setPolishedText(polished);
      setViewMode('ai');
    } catch (err) {
      console.error("Polishing failed", err);
    } finally {
      setIsPolishing(false);
    }
  };

  const copyToClipboard = (text: string) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopyToast(true);
    setTimeout(() => setCopyToast(false), 3000);
  };

  const downloadPDF = () => {
    const textToPrint = viewMode === 'ai' && polishedText ? polishedText : result.text;
    const doc = new jsPDF();
    doc.setFontSize(14);
    doc.text(`Kotha Lipi ${viewMode === 'ai' ? 'AI Refined' : 'Original'} Transcription`, 10, 20);
    doc.setFontSize(11);
    const splitText = doc.splitTextToSize(textToPrint, 180);
    doc.text(splitText, 10, 40);
    doc.save(`KothaLipi_${viewMode}.pdf`);
  };

  const clearAll = () => {
    if (audio?.previewUrl) URL.revokeObjectURL(audio.previewUrl);
    setAudio(null);
    setResult({ text: '', status: 'idle' });
    setPolishedText(null);
    setViewMode('original');
    setProgress(0);
    if (fileInputRef.current) fileInputRef.current.value = '';
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const currentText = viewMode === 'ai' && polishedText ? polishedText : result.text;

  return (
    <div className="min-h-screen flex flex-col items-center bg-[#030712] relative overflow-x-hidden">
      {/* Cinematic Background */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute top-[-10%] left-[-10%] w-[70%] h-[70%] bg-blue-600/5 blur-[120px] rounded-full animate-pulse" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[60%] h-[60%] bg-indigo-600/5 blur-[120px] rounded-full animate-pulse" style={{ animationDelay: '2s' }} />
      </div>

      {/* Copy Toast */}
      <div className={`fixed top-8 left-1/2 -translate-x-1/2 z-[1000] transition-all duration-500 transform ${copyToast ? 'translate-y-0 opacity-100' : '-translate-y-12 opacity-0 pointer-events-none'}`}>
        <div className="bg-blue-600 text-white px-8 py-4 rounded-2xl shadow-2xl flex items-center gap-4 font-bold border border-white/20 backdrop-blur-xl">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
          {t.copySuccess}
        </div>
      </div>

      {/* History Sidebar */}
      <div className={`fixed right-0 top-0 h-full w-full md:w-[420px] z-[100] transition-transform duration-500 transform ${isHistoryOpen ? 'translate-x-0' : 'translate-x-full'}`}>
        <div className="h-full glass border-l border-white/10 flex flex-col shadow-2xl">
          <div className="p-10 border-b border-white/5 flex justify-between items-center">
            <h2 className={`text-2xl font-black text-white ${lang === 'bn' ? "font-['Hind_Siliguri']" : ""}`}>{t.archiveTitle}</h2>
            <button onClick={() => setIsHistoryOpen(false)} className="p-3 hover:bg-white/5 rounded-2xl transition-colors">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
          </div>
          <div className="flex-1 overflow-y-auto p-8 space-y-5">
            {history.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-slate-600 gap-6 opacity-40">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" /></svg>
                <p className={`text-lg ${lang === 'bn' ? "font-['Hind_Siliguri']" : ""}`}>{t.noHistory}</p>
              </div>
            ) : (
              history.map((item) => (
                <div key={item.id} onClick={() => loadFromHistory(item)} className="p-6 bg-white/5 border border-white/5 rounded-[2rem] hover:bg-white/10 transition-all cursor-pointer group relative overflow-hidden">
                  <div className="flex justify-between items-start mb-3">
                    <span className="text-[11px] text-slate-500 font-black uppercase tracking-widest">{new Date(item.timestamp).toLocaleDateString(lang === 'bn' ? 'bn-BD' : 'en-US')}</span>
                    <div className="flex gap-2">
                      <button onClick={(e) => { e.stopPropagation(); copyToClipboard(item.text); }} className="p-3 opacity-0 group-hover:opacity-100 hover:bg-blue-600/20 rounded-xl transition-all" title={t.quickCopy}>
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" /></svg>
                      </button>
                      <button onClick={(e) => deleteFromHistory(item.id, e)} className="p-3 opacity-0 group-hover:opacity-100 hover:bg-red-600/20 rounded-xl transition-all">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                      </button>
                    </div>
                  </div>
                  <h4 className="text-white font-bold text-sm truncate mb-3">{item.fileName}</h4>
                  <p className={`text-slate-400 text-xs line-clamp-3 leading-relaxed ${lang === 'bn' ? "font-['Hind_Siliguri']" : ""}`}>{item.text}</p>
                </div>
              ))
            )}
          </div>
          {history.length > 0 && (
            <div className="p-10 border-t border-white/5">
              <button onClick={clearHistory} className={`w-full py-5 border border-red-500/20 text-red-400/60 hover:text-red-400 hover:bg-red-500/10 rounded-2xl font-bold text-sm transition-all ${lang === 'bn' ? "font-['Hind_Siliguri']" : ""}`}>{t.clearHistory}</button>
            </div>
          )}
        </div>
      </div>

      {/* Header */}
      <div className="w-full max-w-7xl flex justify-between items-center p-6 md:p-10 z-50">
        <div className="flex items-center gap-2 group cursor-pointer" onClick={() => window.location.reload()}>
          <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center shadow-[0_0_20px_rgba(37,99,235,0.4)] group-hover:scale-110 transition-transform">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" /></svg>
          </div>
          <span className="text-xl font-black tracking-tighter text-white">KOTHA<span className="text-blue-500">LIPI</span></span>
        </div>
        <div className="flex items-center gap-4">
          <button onClick={() => setIsHistoryOpen(true)} className="p-3 glass rounded-xl text-slate-400 hover:text-white hover:border-blue-500/50 transition-all relative group">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" /></svg>
            {history.length > 0 && <span className="absolute -top-1 -right-1 w-3 h-3 bg-blue-500 rounded-full border-2 border-[#030712] animate-pulse" />}
          </button>
          <div className="glass p-1 rounded-xl flex items-center border border-white/5">
            <button onClick={() => setLang('bn')} className={`px-4 py-1.5 rounded-lg text-[10px] md:text-xs font-bold transition-all ${lang === 'bn' ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-500 hover:text-slate-300'}`}>বাংলা</button>
            <button onClick={() => setLang('en')} className={`px-4 py-1.5 rounded-lg text-[10px] md:text-xs font-bold transition-all ${lang === 'en' ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-500 hover:text-slate-300'}`}>EN</button>
          </div>
        </div>
      </div>

      <main className="w-full max-w-4xl z-10 flex flex-col gap-12 px-4 pb-24 pt-4">
        {/* Upload Interface */}
        <div className={`glass p-12 md:p-24 rounded-[3.5rem] transition-all duration-700 flex flex-col items-center text-center relative overflow-hidden border-white/5 ${isDragging ? 'border-blue-500/50 bg-blue-500/10 scale-[0.98]' : ''}`} onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }} onDragLeave={() => setIsDragging(false)} onDrop={onDrop}>
          {!audio ? (
            <div className="flex flex-col items-center gap-10">
              <div className="w-32 h-32 md:w-48 md:h-48 rounded-full bg-blue-600/5 flex items-center justify-center text-blue-500 border border-blue-600/10 shadow-[0_0_100px_-20px_rgba(37,99,235,0.15)] group">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-20 w-20 md:h-28 md:w-28 opacity-40 group-hover:opacity-100 transition-opacity" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={0.5} d="M12 4v16m8-8H4" /></svg>
              </div>
              <div className="space-y-4">
                <h2 className={`text-5xl md:text-7xl font-black text-white tracking-tighter ${lang === 'bn' ? "font-['Hind_Siliguri']" : ""}`}>{t.uploadTitle}</h2>
                <p className={`text-slate-500 text-sm md:text-xl font-medium max-w-lg mx-auto leading-relaxed ${lang === 'bn' ? "font-['Hind_Siliguri']" : ""}`}>{t.uploadSubtitle}</p>
              </div>
              <input type="file" className="hidden" ref={fileInputRef} onChange={handleFileChange} accept="audio/*" />
              <button onClick={() => fileInputRef.current?.click()} className={`px-16 py-6 bg-blue-600 hover:bg-blue-500 rounded-3xl font-black text-xl transition-all transform active:scale-95 shadow-2xl shadow-blue-900/40 ${lang === 'bn' ? "font-['Hind_Siliguri']" : ""}`}>{t.browseBtn}</button>
            </div>
          ) : (
            <div className="w-full flex flex-col items-center gap-12 animate-in fade-in zoom-in-95 duration-700">
              <div className="flex flex-col items-center gap-6">
                <div className="p-6 bg-blue-500/10 rounded-3xl border border-blue-500/20 shadow-2xl">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" /></svg>
                </div>
                <span className="font-black text-xl md:text-3xl text-white truncate max-w-xs md:max-w-2xl tracking-tight leading-normal px-4">{audio.file.name}</span>
              </div>
              <AudioPlayer url={audio.previewUrl} />
              <div className="flex flex-wrap gap-6 w-full justify-center mt-6">
                <button onClick={clearAll} disabled={result.status === 'processing'} className={`px-14 py-5 border border-slate-800 hover:bg-slate-800/50 rounded-3xl text-slate-500 font-bold transition-all disabled:opacity-30 ${lang === 'bn' ? "font-['Hind_Siliguri']" : ""}`}>{t.cancel}</button>
                <button onClick={handleTranscription} disabled={result.status === 'processing'} className={`px-16 py-5 bg-blue-600 hover:bg-blue-500 disabled:opacity-30 rounded-3xl font-black text-xl transition-all shadow-2xl shadow-blue-900/40 ${lang === 'bn' ? "font-['Hind_Siliguri']" : ""}`}>{result.status === 'processing' ? t.processing : t.start}</button>
              </div>
            </div>
          )}
        </div>

        {/* Progress Bar */}
        {(result.status === 'processing' || isPolishing) && (
          <div className="w-full flex flex-col gap-6 px-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex justify-between items-end">
              <span className="text-blue-400 font-black text-4xl md:text-7xl tracking-tighter leading-none">
                {isPolishing ? '...' : Math.floor(progress)}%
              </span>
              <span className={`text-slate-600 text-[10px] md:text-xs font-black tracking-[0.4em] uppercase opacity-70 ${lang === 'bn' ? "font-['Hind_Siliguri']" : ""}`}>
                {isPolishing ? t.polishing : progressLabel}
              </span>
            </div>
            <div className="w-full h-2.5 bg-slate-950 rounded-full overflow-hidden border border-white/5 shadow-inner">
              <div 
                className={`h-full bg-blue-600 transition-all duration-300 ease-out relative ${isPolishing ? 'animate-pulse' : ''}`} 
                style={{ width: isPolishing ? '100%' : `${progress}%` }}
              >
                <div className="absolute inset-0 bg-white/20 animate-shimmer" />
              </div>
            </div>
          </div>
        )}

        {/* Result Area */}
        {(result.status === 'completed' || result.status === 'error') && (
          <div ref={resultRef} className="glass p-12 md:p-24 rounded-[4rem] border-white/5 animate-in slide-in-from-bottom-24 duration-1000">
            
            <div className="flex flex-col gap-10 mb-16">
              <div className="flex flex-col md:flex-row justify-between items-center gap-8">
                <h3 className={`text-3xl md:text-6xl font-black flex items-center gap-6 text-white tracking-tighter ${lang === 'bn' ? "font-['Hind_Siliguri']" : ""}`}>
                  <span className="w-4 h-4 bg-blue-500 rounded-full shadow-[0_0_40px_rgba(59,130,246,1)]" />
                  {t.outputTitle}
                </h3>
                
                {result.status === 'completed' && (
                  <div className="flex flex-wrap justify-center gap-4">
                    {/* New AI Output Button */}
                    {!polishedText && (
                      <button 
                        onClick={handlePolish} 
                        disabled={isPolishing}
                        className={`flex items-center gap-3 px-8 py-4 bg-indigo-600/20 border border-indigo-500/30 hover:bg-indigo-600/40 rounded-2xl text-indigo-400 font-black transition-all hover:scale-105 active:scale-95 shadow-xl disabled:opacity-50 ${lang === 'bn' ? "font-['Hind_Siliguri']" : ""}`}
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className={`h-6 w-6 ${isPolishing ? 'animate-spin' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                        {isPolishing ? t.polishing : t.aiOutputBtn}
                      </button>
                    )}

                    <button onClick={() => copyToClipboard(currentText)} className={`flex items-center gap-3 px-8 py-4 bg-blue-600 hover:bg-blue-500 rounded-2xl text-white font-black transition-all hover:scale-105 active:scale-95 shadow-xl ${lang === 'bn' ? "font-['Hind_Siliguri']" : ""}`}>
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" /></svg>
                      {t.quickCopy}
                    </button>
                    <button onClick={downloadPDF} className="p-4 bg-white/5 hover:bg-white/10 rounded-2xl border border-white/5 transition-all hover:scale-110 active:scale-95">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                    </button>
                  </div>
                )}
              </div>

              {/* View Mode Tabs */}
              {polishedText && (
                <div className="flex justify-center animate-in slide-in-from-top-4 duration-500">
                  <div className="bg-white/5 p-1 rounded-2xl border border-white/5 flex gap-2">
                    <button 
                      onClick={() => setViewMode('original')}
                      className={`px-8 py-3 rounded-xl text-sm font-bold transition-all ${viewMode === 'original' ? 'bg-slate-800 text-white shadow-lg' : 'text-slate-500 hover:text-slate-300'} ${lang === 'bn' ? "font-['Hind_Siliguri']" : ""}`}
                    >
                      {t.originalTab}
                    </button>
                    <button 
                      onClick={() => setViewMode('ai')}
                      className={`px-8 py-3 rounded-xl text-sm font-bold transition-all ${viewMode === 'ai' ? 'bg-indigo-600 text-white shadow-[0_0_20px_rgba(79,70,229,0.4)]' : 'text-slate-500 hover:text-slate-300'} ${lang === 'bn' ? "font-['Hind_Siliguri']" : ""}`}
                    >
                      {t.aiTab}
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Display Box */}
            <div onClick={() => copyToClipboard(currentText)} className={`group relative bg-[#020617]/40 rounded-[3rem] p-12 md:p-20 border transition-all min-h-[400px] shadow-inner cursor-pointer active:scale-[0.995] ${viewMode === 'ai' ? 'border-indigo-500/20' : 'border-white/5 hover:border-blue-500/30'}`}>
              
              {result.status === 'completed' && (
                <div className="absolute top-8 right-12 flex items-center gap-2 text-[10px] font-black text-slate-600 opacity-0 group-hover:opacity-100 transition-opacity tracking-widest uppercase">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" /></svg>
                  {lang === 'bn' ? "কপি করতে ক্লিক করুন" : "Click to Copy"}
                </div>
              )}

              {result.status === 'error' ? (
                <div className="flex flex-col items-center gap-10 py-24 text-center">
                  <div className="w-20 h-20 rounded-full bg-red-500/10 flex items-center justify-center text-red-500 border border-red-500/20 shadow-3xl"><svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg></div>
                  <p className={`text-red-400 font-bold text-2xl md:text-3xl max-w-lg leading-relaxed ${lang === 'bn' ? "font-['Hind_Siliguri']" : ""}`}>{result.error}</p>
                  <button onClick={handleTranscription} className={`text-blue-400 text-sm font-black uppercase tracking-[0.4em] underline hover:text-blue-300 transition-colors ${lang === 'bn' ? "font-['Hind_Siliguri']" : ""}`}>{t.retry}</button>
                </div>
              ) : (
                <div className="relative">
                  {viewMode === 'ai' && (
                    <div className="mb-6 inline-flex items-center gap-2 text-[10px] font-black tracking-widest uppercase text-indigo-400 bg-indigo-500/10 px-4 py-1.5 rounded-full border border-indigo-500/20">
                      <span className="w-2 h-2 bg-indigo-500 rounded-full animate-pulse" />
                      Refined AI Edition
                    </div>
                  )}
                  <p className={`text-white text-4xl md:text-5xl leading-[1.8] font-medium whitespace-pre-wrap selection:bg-blue-500/40 ${lang === 'bn' ? "font-['Hind_Siliguri']" : ""}`}>
                    {currentText || t.noText}
                  </p>
                </div>
              )}
            </div>
            
            <div className="mt-20 flex justify-center">
              <button onClick={clearAll} className={`text-slate-700 hover:text-blue-500 text-xs md:text-sm font-black uppercase tracking-[0.6em] transition-all flex items-center gap-5 active:scale-95 ${lang === 'bn' ? "font-['Hind_Siliguri']" : ""}`}>
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
                {t.newFile}
              </button>
            </div>
          </div>
        )}
      </main>

      {/* History Backdrop */}
      {isHistoryOpen && <div onClick={() => setIsHistoryOpen(false)} className="fixed inset-0 bg-black/70 backdrop-blur-md z-[90] animate-in fade-in duration-300" />}

      <footer className="mt-auto py-20 text-center text-slate-800 text-[10px] md:text-[12px] font-black tracking-[0.8em] uppercase opacity-20 hover:opacity-100 transition-opacity duration-1000 px-8">
        &copy; {new Date().getFullYear()} {t.footer} <span className="mx-6 opacity-40">|</span> ABDULLAH AL MAHMUD
      </footer>
    </div>
  );
};

export default App;