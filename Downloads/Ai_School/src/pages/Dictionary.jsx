import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Mic, Volume2, BookOpen, Search as SearchIcon } from 'lucide-react';
import api from '../api/api';

export default function Dictionary() {
    const navigate = useNavigate();
    const [dictQuery, setDictQuery] = useState('');
    const [dictStatus, setDictStatus] = useState('idle'); // idle, loading, result, error
    const [result, setResult] = useState(null);

    const handleSearch = async () => {
        if (!dictQuery.trim()) return;
        
        setDictStatus('loading');
        try {
            const res = await api.get(`/dictionary/search?word=${dictQuery.trim()}`);
            if (res.data?.data) {
                setResult(res.data.data);
                setDictStatus('result');
            }
        } catch (error) {
            console.error("Dictionary search failed", error);
            setDictStatus('error');
        }
    };

    const [isListening, setIsListening] = useState(false);

    const handleMicClick = () => {
        if (!('webkitSpeechRecognition' in window)) {
            alert('Speech recognition is not supported in this browser.');
            return;
        }

        if (isListening) return;

        const recognition = new window.webkitSpeechRecognition();
        recognition.continuous = false;
        recognition.interimResults = false;
        recognition.lang = 'en-US';

        recognition.onstart = () => {
            setIsListening(true);
        };

        recognition.onresult = (event) => {
            const transcript = event.results[0][0].transcript;
            setDictQuery(transcript);
            handleSearch(transcript); // Trigger search immediately with new term
            setIsListening(false);
        };

        recognition.onerror = (event) => {
            console.error('Speech recognition error', event.error);
            setIsListening(false);
        };

        recognition.onend = () => {
            setIsListening(false);
        };

        recognition.start();
    };

    const playAudio = () => {
        if (result?.audio) {
            new Audio(result.audio).play().catch(e => console.error(e));
        }
    };

    return (
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 h-full flex flex-col bg-gray-50/50">
            <div className="bg-white px-4 py-4 sticky top-0 z-10 border-b border-gray-100">
                 <div className="flex items-center gap-4 mb-2">
                     <button onClick={() => navigate('/dashboard/more')} className="w-8 h-8 rounded-full bg-gray-50 flex items-center justify-center text-gray-600">
                         <ArrowLeft className="w-5 h-5" />
                     </button>
                     <div className="flex-1">
                        <h2 className="text-lg font-bold text-gray-900">English Dictionary</h2>
                        <p className="text-xs text-gray-500 font-medium">Search for word definitions, synonyms, and usage examples</p>
                     </div>
                 </div>
            </div>

            <div className="p-4 flex-1 overflow-y-auto pb-24 space-y-4">
                {/* Search Area */}
                <div className="bg-white rounded-[24px] p-4 border border-gray-100 shadow-sm">
                    <div className="relative mb-3">
                        <input 
                            type="text" 
                            value={dictQuery}
                            onChange={(e) => setDictQuery(e.target.value)}
                            placeholder="Enter a word..." 
                            className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm font-bold text-gray-900 placeholder:text-gray-400 focus:outline-none focus:border-[#6C5DD3] focus:bg-white transition-colors uppercase tracking-wide"
                            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                        />
                        <button 
                            type="button"
                            onClick={handleMicClick}
                            className={`absolute right-3 top-1/2 -translate-y-1/2 p-1.5 rounded-full hover:bg-gray-100 transition-colors ${isListening ? 'bg-red-50 animate-pulse' : ''}`}
                        >
                            <Mic className={`w-4 h-4 ${isListening ? 'text-red-500' : 'text-gray-400'}`} />
                        </button>
                    </div>
                    <button 
                        onClick={handleSearch}
                        disabled={dictStatus === 'loading'}
                        className="w-full bg-[#6C5DD3] text-white rounded-xl py-3 text-xs font-bold shadow-lg shadow-[#6C5DD3]/20 active:scale-[0.98] transition-all hover:bg-[#5B4EC2] flex items-center justify-center gap-2"
                    >
                        {dictStatus === 'loading' ? (
                            <>
                                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                Searching...
                            </>
                        ) : (
                            <>
                                <SearchIcon className="w-4 h-4" /> Search
                            </>
                        )}
                    </button>
                </div>
                
                {/* Status: Error */}
                {dictStatus === 'error' && (
                    <div className="p-4 text-center rounded-2xl bg-red-50 text-red-600 text-sm font-bold border border-red-100">
                        Word not found or error occurred.
                    </div>
                )}

                {/* Search Result Card */}
                {dictStatus === 'result' && result && (
                    <div className="bg-white rounded-[28px] border border-[#E8E5F8] shadow-sm relative overflow-hidden animate-in slide-in-from-bottom-4">
                        {/* Purple accent top bar */}
                        <div className="h-1 bg-gradient-to-r from-[#6C5DD3] to-[#8B7CF7]"></div>
                        
                        <div className="p-5">
                            {/* Header */}
                            <div className="flex justify-between items-start mb-5">
                                <div>
                                    <h2 className="text-2xl font-black text-gray-900 mb-2 uppercase tracking-tight">{result.word}</h2>
                                    <div className="flex gap-2 items-center flex-wrap">
                                        <span className="px-2.5 py-1 bg-[#6C5DD3] text-white text-[10px] font-bold rounded-lg uppercase">
                                            {result.meanings[0]?.partOfSpeech || 'word'}
                                        </span>
                                        {result.phonetic && (
                                            <span className="text-xs font-medium text-gray-500 font-mono">
                                                {result.phonetic}
                                            </span>
                                        )}
                                    </div>
                                </div>
                                {result.audio && (
                                    <button 
                                        onClick={playAudio}
                                        className="w-10 h-10 rounded-full bg-[#EBE9FE] flex items-center justify-center text-[#6C5DD3] hover:bg-[#DCD6FC] transition-colors"
                                    >
                                        <Volume2 className="w-5 h-5" />
                                    </button>
                                )}
                            </div>

                            {/* Divider */}
                            <div className="h-px w-full bg-gray-100 mb-5"></div>

                            {/* Meanings */}
                            {result.meanings.map((meaning, idx) => (
                                <div key={idx} className="mb-6 last:mb-0">
                                    <h4 className="text-[10px] font-bold text-[#6C5DD3] uppercase tracking-widest mb-2 flex items-center gap-2">
                                        <span className="w-1.5 h-1.5 rounded-full bg-[#6C5DD3]"></span>
                                        {meaning.partOfSpeech}
                                    </h4>
                                    
                                    {/* Definitions */}
                                    <ul className="space-y-3 mb-4">
                                        {meaning.definitions.map((def, dIdx) => (
                                            <li key={dIdx} className="text-sm font-medium text-gray-700 leading-relaxed pl-2 border-l-2 border-gray-100">
                                                {def.definition}
                                                {def.example && (
                                                    <p className="mt-1 text-xs text-gray-500 italic">"{def.example}"</p>
                                                )}
                                            </li>
                                        ))}
                                    </ul>

                                    {/* Synonyms */}
                                    {meaning.synonyms.length > 0 && (
                                        <div className="mb-4">
                                            <span className="text-[10px] font-bold text-gray-400 uppercase mr-2">Synonyms:</span>
                                            <div className="inline-flex flex-wrap gap-1.5">
                                                {meaning.synonyms.map((word) => (
                                                    <span key={word} className="px-2 py-0.5 bg-gray-50 border border-gray-100 rounded text-[10px] font-bold text-gray-600">
                                                        {word}
                                                    </span>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    {/* Antonyms */}
                                    {meaning.antonyms.length > 0 && (
                                        <div>
                                            <span className="text-[10px] font-bold text-gray-400 uppercase mr-2">Antonyms:</span>
                                            <div className="inline-flex flex-wrap gap-1.5">
                                                {meaning.antonyms.map((word) => (
                                                    <span key={word} className="px-2 py-0.5 bg-gray-50 border border-gray-100 rounded text-[10px] font-bold text-gray-600">
                                                        {word}
                                                    </span>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            ))}

                            {/* Source */}
                            {result.sourceUrls && result.sourceUrls.length > 0 && (
                                <div className="mt-6 pt-4 border-t border-gray-50">
                                    <div className="flex items-center gap-2 mb-2">
                                        <BookOpen className="w-3.5 h-3.5 text-gray-400" />
                                        <h4 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">SOURCE</h4>
                                    </div>
                                    <a href={result.sourceUrls[0]} target="_blank" rel="noopener noreferrer" className="text-[10px] text-blue-500 hover:underline truncate block">
                                        {result.sourceUrls[0]}
                                    </a>
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
