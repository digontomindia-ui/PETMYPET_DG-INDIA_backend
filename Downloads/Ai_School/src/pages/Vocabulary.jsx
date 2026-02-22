import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Sparkles, Mic } from 'lucide-react';
import api from '../api/api';

export default function Vocabulary() {
    const navigate = useNavigate();
    const [vocabText, setVocabText] = useState('');
    const [vocabStatus, setVocabStatus] = useState('idle'); // idle, recording, analyzing, result
    const [analysisResult, setAnalysisResult] = useState(null);

    const handleAnalyze = async () => {
        if (!vocabText.trim()) return;
        
        setVocabStatus('analyzing');
        try {
            const res = await api.post('/vocabulary/analyze', { text: vocabText });
            if (res.data?.data) {
                setAnalysisResult(res.data.data);
                setVocabStatus('result');
            }
        } catch (error) {
            console.error("Analysis failed", error);
            alert("Failed to analyze text");
            setVocabStatus('idle');
        }
    };

    return (
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 h-full flex flex-col bg-gray-50/50 relative">
            <div className="bg-white px-4 py-4 sticky top-0 z-10 border-b border-gray-100">
                 <div className="flex items-center gap-4 mb-4">
                     <button onClick={() => navigate('/dashboard/more')} className="w-8 h-8 rounded-full bg-gray-50 flex items-center justify-center text-gray-600">
                         <ArrowLeft className="w-5 h-5" />
                     </button>
                     <div className="flex-1">
                        <div className="flex items-center gap-2">
                             <h2 className="text-lg font-bold text-gray-900">Vocabulary Check With AI</h2>
                             <span className="bg-black text-white text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
                                <Sparkles className="w-2 h-2" /> AI
                             </span>
                        </div>
                        <p className="text-xs text-blue-500">Get instant AI feedback on your vocabulary usage</p>
                     </div>
                 </div>
            </div>

            <div className="p-4 space-y-4 flex-1 overflow-y-auto pb-24">
                {/* Input Area */}
                <div className="bg-white p-4 rounded-[24px] border border-gray-100 shadow-sm">
                    <div className="flex justify-between items-center mb-4">
                        <label className="text-xs font-bold text-gray-900">Enter Your Text</label>
                        <button 
                            type="button"
                            onClick={() => setVocabStatus('recording')}
                            className="p-1 rounded-full hover:bg-blue-50 transition-colors"
                        >
                            <Mic className="w-4 h-4 text-blue-500 cursor-pointer hover:scale-110 transition-transform" />
                        </button>
                    </div>
                    <textarea 
                        value={vocabText}
                        onChange={(e) => setVocabText(e.target.value)}
                        placeholder="Type or speak here..." 
                        className="w-full h-40 resize-none text-sm font-medium text-gray-800 focus:outline-none placeholder:text-gray-300 bg-transparent"
                    ></textarea>
                    <div className="flex justify-between items-center mt-4">
                        <span className="text-[10px] font-bold text-gray-400">{vocabText.split(/\s+/).filter(w => w).length} words</span>
                        <button 
                            onClick={handleAnalyze}
                            disabled={vocabStatus === 'analyzing' || !vocabText.trim()}
                            className="px-4 py-2 bg-black text-white rounded-lg text-xs font-bold flex items-center gap-2 shadow-lg shadow-gray-200 disabled:opacity-50"
                        >
                            <Sparkles className={`w-3 h-3 ${vocabStatus === 'analyzing' ? 'animate-spin' : ''}`} /> 
                            {vocabStatus === 'analyzing' ? 'Analyzing...' : 'Analyze with AI'}
                        </button>
                    </div>
                </div>

                {/* Results Area */}
                {vocabStatus === 'result' && analysisResult && (
                    <div className="animate-in slide-in-from-bottom-5 duration-500 space-y-4">
                        {/* Score Card */}
                        <div className="bg-[#EBE9FE] p-5 rounded-[24px] border border-[#DCD6FC]">
                            <div className="flex justify-between items-start mb-4">
                                <div>
                                    <p className="text-xs font-bold text-gray-600 mb-1">Overall Score</p>
                                    <h3 className="text-3xl font-bold text-[#6C5DD3]">{analysisResult.score}/100</h3>
                                </div>
                                <div className="text-right">
                                    <p className="text-[10px] font-bold text-gray-500 mb-1">Words analyzed</p>
                                    <p className="text-xl font-bold text-[#6C5DD3]">{analysisResult.wordCount}</p>
                                </div>
                            </div>
                            <span className="px-3 py-1 bg-white/60 text-[#6C5DD3] text-[10px] font-bold rounded-lg border border-[#6C5DD3]/20 inline-block mb-3">
                                {analysisResult.level}
                            </span>
                            <p className="text-[11px] text-gray-600 leading-relaxed">
                                {analysisResult.feedback}
                            </p>
                        </div>

                        {/* Improvements */}
                        <div className="bg-white p-5 rounded-[24px] border border-gray-100 shadow-sm">
                            <h3 className="font-bold text-gray-900 text-sm mb-4">Vocabulary Improvements</h3>
                            <div className="space-y-3">
                                {analysisResult.improvements && analysisResult.improvements.length > 0 ? (
                                    analysisResult.improvements.map((imp, idx) => (
                                        <div key={idx} className="p-3 border border-gray-100 rounded-xl bg-gray-50/50">
                                            <div className="flex gap-2 text-xs font-bold mb-1">
                                                <span className="text-gray-500 uppercase">{imp.original}</span>
                                                <span className="text-gray-400">→</span>
                                                <span className="text-green-600 uppercase">{imp.better}</span>
                                            </div>
                                            <p className="text-[10px] text-gray-500">{imp.reason}</p>
                                        </div>
                                    ))
                                ) : (
                                    <p className="text-xs text-gray-500">No specific improvements found. Great job!</p>
                                )}
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Full Screen Recording Overlay */}
            {vocabStatus === 'recording' && (
                <div className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-sm flex items-center justify-center p-6 animate-in fade-in duration-300">
                    <div className="bg-white rounded-[32px] p-8 w-full max-w-sm shadow-2xl flex flex-col items-center animate-in zoom-in-95 duration-300">
                        <p className="text-sm font-medium text-gray-500 mb-8">Tap to stop</p>
                        
                        <div className="relative mb-8">
                            <div className="absolute inset-0 bg-red-500/20 rounded-full animate-ping scale-150"></div>
                            <div className="absolute inset-0 bg-red-500/40 rounded-full animate-pulse scale-125"></div>
                            <button 
                                onClick={() => {
                                    setVocabStatus('idle');
                                    setVocabText("I am a designer and I want to improve my vocabulary. I think this is good.");
                                }} 
                                className="w-24 h-24 bg-red-600 text-white rounded-full flex items-center justify-center shadow-2xl shadow-red-500/40 relative z-10 hover:scale-105 active:scale-95 transition-transform"
                            >
                                <Mic className="w-10 h-10 fill-current ml-0.5" strokeWidth={2.5} />
                            </button>
                        </div>
                        {/* Audio Wave Dots */}
                        <div className="flex gap-1.5 h-6 items-center justify-center">
                            {[...Array(15)].map((_, i) => (
                                <div 
                                    key={i} 
                                    className="w-1.5 bg-[#4B4CED] rounded-full animate-bounce"
                                    style={{ 
                                        height: Math.random() * 16 + 6 + 'px', 
                                        animationDelay: `${i * 0.05}s`
                                    }}
                                ></div>
                            ))}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
