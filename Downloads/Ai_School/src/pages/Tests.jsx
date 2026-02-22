import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Lock, Unlock, Trophy, Target, Clock, HelpCircle, ChevronRight, Star, Zap, Check, X, MessageSquare, Lightbulb, Flag, SkipForward } from 'lucide-react';
import api from '../api/api';

const TIERS_CONFIG = {
    1: { id: 'bronze', icon: '🥉', color: '#CD7F32', bgGradient: 'from-amber-50 to-orange-50', borderColor: 'border-amber-200', subjects: ['English', 'Math'] },
    2: { id: 'silver', icon: '🥈', color: '#C0C0C0', bgGradient: 'from-gray-50 to-slate-100', borderColor: 'border-gray-300', subjects: ['English', 'Math', 'Spanish'] },
    3: { id: 'gold', icon: '🥇', color: '#FFD700', bgGradient: 'from-yellow-50 to-amber-50', borderColor: 'border-yellow-300', subjects: ['English', 'Math', 'Science'] },
    4: { id: 'platinum', icon: '💎', color: '#E5E4E2', bgGradient: 'from-slate-50 to-zinc-100', borderColor: 'border-slate-300', subjects: ['Math', 'Science', 'French'] },
    5: { id: 'diamond', icon: '💠', color: '#B9F2FF', bgGradient: 'from-cyan-50 to-sky-50', borderColor: 'border-cyan-300', subjects: ['Science', 'French', 'History'] },
    6: { id: 'elite', icon: '👑', color: '#9B59B6', bgGradient: 'from-purple-50 to-violet-50', borderColor: 'border-purple-300', subjects: ['All Advanced'] }
};

export default function Tests() {
    const navigate = useNavigate();
    const [currentRating, setCurrentRating] = useState(0);
    const [testsAttempted, setTestsAttempted] = useState(0);
    const [tiers, setTiers] = useState([]);
    
    // Test states
    const [testState, setTestState] = useState('list'); // list, playing, result
    const [selectedCert, setSelectedCert] = useState(null);
    const [currentTestId, setCurrentTestId] = useState(null);
    const [questions, setQuestions] = useState([]);
    const [currentQuestion, setCurrentQuestion] = useState(0);
    const [selectedAnswer, setSelectedAnswer] = useState(null);
    const [score, setScore] = useState(0);
    const [answers, setAnswers] = useState([]);
    const [testTimer, setTestTimer] = useState(0);
    const [resultData, setResultData] = useState(null);

    // Fetch Initial Data
    useEffect(() => {
        fetchDashboardData();
    }, []);

    const fetchDashboardData = async () => {
        try {
            const [tiersRes, statsRes, userRes] = await Promise.all([
                api.get('/certification/tiers/all'),
                api.get('/certification/user/statistics'),
                api.get('/leaderboard/user/me') // Assuming this gets user rating
            ]);

            if (tiersRes.data?.data) {
                const apiTiers = tiersRes.data.data.map(t => ({
                    ...t,
                    ...TIERS_CONFIG[t.id],
                    unlocked: (userRes.data?.data?.rating || 0) >= t.minRating
                }));
                setTiers(apiTiers);
            }

            if (statsRes.data?.data) {
                setTestsAttempted(statsRes.data.data.total_tests);
            }
            
            if (userRes.data?.data) {
                setCurrentRating(userRes.data.data.rating || 0);
            }

        } catch (error) {
            console.error("Failed to fetch test dashboard data", error);
        }
    };

    // Timer effect
    useEffect(() => {
        let interval;
        if (testState === 'playing' && testTimer > 0) {
            interval = setInterval(() => {
                setTestTimer(prev => prev - 1);
            }, 1000);
        } else if (testTimer === 0 && testState === 'playing') {
            handleCompleteTest();
        }
        return () => clearInterval(interval);
    }, [testState, testTimer]);

    const formatTime = (seconds) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    };

    const handleStartTest = async (cert) => {
        try {
            const res = await api.post('/certification/test/start', {
                tierId: cert.id,
                language: 'en'
            });

            if (res.data?.data) {
                const data = res.data.data;
                setSelectedCert(cert);
                setCurrentTestId(data.testId);
                setQuestions(data.questions || []);
                setCurrentQuestion(0);
                setScore(0);
                setAnswers([]);
                setSelectedAnswer(null);
                setTestTimer(data.duration * 60);
                setTestState('playing');
            }
        } catch (error) {
            console.error("Failed to start test", error);
            alert("Could not start test. Please try again.");
        }
    };

    const handleSelectAnswer = (index) => {
        setSelectedAnswer(index);
    };

    const handleNextQuestion = async () => {
        const question = questions[currentQuestion];
        const isCorrect = selectedAnswer === (question.correct || 0); // Assuming correct is index
        
        const newScore = isCorrect ? score + 1 : score;
        setScore(newScore);
        
        const newAnswers = [...answers, { 
            questionId: question.id, 
            selected: selectedAnswer, 
            correct: question.correct, 
            isCorrect 
        }];
        setAnswers(newAnswers);

        // Submit answer to backend (optional, but good for tracking)
        try {
            await api.post(`/certification/test/${currentTestId}/answer`, {
                testId: currentTestId,
                questionId: question.id,
                userAnswer: selectedAnswer,
                isCorrect,
                score: isCorrect ? 1 : 0
            });
        } catch (e) { console.error("Failed to record answer", e); }

        if (currentQuestion < questions.length - 1) {
            setCurrentQuestion(prev => prev + 1);
            setSelectedAnswer(null);
        } else {
            handleCompleteTest(newScore, newAnswers);
        }
    };

    const handleCompleteTest = async (finalScore = score, finalAnswers = answers) => {
        try {
            const res = await api.post(`/certification/test/${currentTestId}/complete`, {
                testId: currentTestId,
                correctAnswers: finalScore,
                totalQuestions: questions.length
            });

            if (res.data?.data) {
                setResultData(res.data.data);
                setTestState('result');
                // Refresh dashboard data
                fetchDashboardData();
            }
        } catch (error) {
            console.error("Failed to complete test", error);
            alert("Error submitting test results.");
            setTestState('list');
        }
    };

    const handleBackToList = () => {
        setTestState('list');
        setSelectedCert(null);
        setResultData(null);
    };

    // Playing State
    if (testState === 'playing' && questions.length > 0) {
        const question = questions[currentQuestion];
        
        return (
            <div className="animate-in fade-in duration-300 h-full flex flex-col bg-gray-50/50">
                {/* Header */}
                <div className="bg-white px-4 py-3 sticky top-0 z-10 border-b border-gray-100">
                    <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                            <span className="text-xl">{selectedCert?.icon}</span>
                            <span className="text-sm font-bold text-gray-900">{selectedCert?.name} Test</span>
                        </div>
                        <span className="text-xs font-medium text-gray-500">
                            Question {currentQuestion + 1}/{questions.length}
                        </span>
                    </div>
                    
                    {/* Timer & Progress */}
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <Clock className="w-4 h-4 text-[#6C5DD3]" />
                            <span className={`text-lg font-bold ${testTimer < 60 ? 'text-red-500' : 'text-gray-900'}`}>
                                {formatTime(testTimer)}
                            </span>
                        </div>
                        <div className="flex items-center gap-2">
                            <span className="text-xs text-gray-500">Score:</span>
                            <span className="text-lg font-bold text-[#6C5DD3]">{score}</span>
                        </div>
                    </div>
                    
                    {/* Progress Bar */}
                    <div className="mt-2 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                        <div 
                            className="h-full bg-[#6C5DD3] rounded-full transition-all duration-300"
                            style={{ width: `${((currentQuestion + 1) / questions.length) * 100}%` }}
                        ></div>
                    </div>
                </div>

                <div className="p-4 flex-1 overflow-y-auto pb-32 space-y-4">
                    {/* Subject Tag */}
                    <div className="flex justify-center">
                        <span className="px-3 py-1 bg-[#EBE9FE] text-[#6C5DD3] rounded-lg text-xs font-bold">
                            {question.subject || 'General'}
                        </span>
                    </div>

                    {/* Question Card */}
                    <div className="bg-[#EBE9FE] rounded-[24px] p-5 border border-[#DCD6FC]">
                        <h3 className="text-lg font-bold text-gray-900 text-center">{question.question}</h3>
                    </div>

                    {/* MCQ Options */}
                    <div className="space-y-3">
                        {question.options.map((option, index) => (
                            <button
                                key={index}
                                onClick={() => handleSelectAnswer(index)}
                                className={`w-full p-4 rounded-2xl border-2 text-left font-bold transition-all ${
                                    selectedAnswer === index
                                        ? 'bg-[#EBE9FE] border-[#6C5DD3] text-[#6C5DD3]'
                                        : 'bg-white border-gray-200 text-gray-700 hover:border-[#6C5DD3]'
                                }`}
                            >
                                <div className="flex items-center gap-3">
                                    <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center text-xs ${
                                        selectedAnswer === index
                                            ? 'bg-[#6C5DD3] border-[#6C5DD3] text-white'
                                            : 'border-gray-300'
                                    }`}>
                                        {selectedAnswer === index && <Check className="w-3 h-3" />}
                                    </div>
                                    <span>{option}</span>
                                </div>
                            </button>
                        ))}
                    </div>

                    {/* Action Buttons */}
                    <div className="flex gap-3 justify-center py-2">
                        <button className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center text-gray-500 hover:bg-gray-200 transition-colors">
                            <MessageSquare className="w-5 h-5" />
                        </button>
                        <button className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center text-gray-500 hover:bg-gray-200 transition-colors">
                            <Lightbulb className="w-5 h-5" />
                        </button>
                        <button className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center text-gray-500 hover:bg-gray-200 transition-colors">
                            <Flag className="w-5 h-5" />
                        </button>
                        <button className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center text-gray-500 hover:bg-gray-200 transition-colors">
                            <SkipForward className="w-5 h-5" />
                        </button>
                    </div>
                </div>

                {/* Next Button */}
                <div className="fixed bottom-20 left-0 right-0 p-4 bg-gradient-to-t from-gray-50 to-transparent">
                    <button 
                        onClick={handleNextQuestion}
                        disabled={selectedAnswer === null}
                        className="w-full bg-[#6C5DD3] text-white rounded-xl py-3.5 text-sm font-bold shadow-lg shadow-[#6C5DD3]/20 hover:bg-[#5B4EC2] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {currentQuestion < questions.length - 1 ? 'Next' : 'Finish Test'}
                    </button>
                </div>
            </div>
        );
    }

    // Result State
    if (testState === 'result' && resultData) {
        const passed = resultData.isPassed;
        const percentage = Math.round((resultData.score)); // Backend returns percentage as score? Or score 0-100? Controller says int.
        
        return (
            <div className="animate-in fade-in duration-300 h-full flex flex-col bg-gray-50/50">
                {/* Header */}
                <div className="bg-white px-4 py-4 sticky top-0 z-10 border-b border-gray-100">
                    <div className="flex items-center gap-4">
                        <button onClick={handleBackToList} className="w-8 h-8 rounded-full bg-gray-50 flex items-center justify-center text-gray-600">
                            <ArrowLeft className="w-5 h-5" />
                        </button>
                        <div className="flex-1">
                            <h2 className="text-lg font-bold text-gray-900">Test Results</h2>
                            <p className="text-xs text-gray-500 font-medium">{selectedCert?.name}</p>
                        </div>
                    </div>
                </div>

                <div className="p-4 flex-1 overflow-y-auto pb-24 space-y-4">
                    {/* Result Card */}
                    <div className={`rounded-[32px] p-6 text-center ${passed ? 'bg-gradient-to-br from-green-50 to-emerald-100 border border-green-200' : 'bg-gradient-to-br from-red-50 to-orange-100 border border-red-200'}`}>
                        <div className="text-6xl mb-4">{passed ? '🎉' : '😔'}</div>
                        <h2 className={`text-2xl font-bold mb-2 ${passed ? 'text-green-700' : 'text-red-700'}`}>
                            {passed ? 'Congratulations!' : 'Keep Trying!'}
                        </h2>
                        <p className={`text-sm mb-4 ${passed ? 'text-green-600' : 'text-red-600'}`}>
                            {resultData.message}
                        </p>
                        
                        {/* Score Circle */}
                        <div className="w-32 h-32 mx-auto mb-4 relative">
                            <svg className="w-full h-full transform -rotate-90">
                                <circle cx="64" cy="64" r="56" stroke="#e5e7eb" strokeWidth="8" fill="none" />
                                <circle 
                                    cx="64" cy="64" r="56" 
                                    stroke={passed ? '#22c55e' : '#ef4444'} 
                                    strokeWidth="8" 
                                    fill="none"
                                    strokeDasharray={`${(percentage / 100) * 352} 352`}
                                    strokeLinecap="round"
                                />
                            </svg>
                            <div className="absolute inset-0 flex items-center justify-center">
                                <span className={`text-3xl font-bold ${passed ? 'text-green-600' : 'text-red-600'}`}>{percentage}%</span>
                            </div>
                        </div>
                        
                        <p className="text-gray-600 font-medium">
                            You got <span className="font-bold text-gray-900">{resultData.correctAnswers}</span> out of <span className="font-bold text-gray-900">{resultData.totalQuestions}</span> correct
                        </p>
                    </div>

                    {/* Stats */}
                    <div className="grid grid-cols-3 gap-3">
                        <div className="bg-white rounded-2xl p-3 border border-gray-100 text-center">
                            <p className="text-2xl font-bold text-green-500">{resultData.correctAnswers}</p>
                            <p className="text-[10px] font-medium text-gray-400">Correct</p>
                        </div>
                        <div className="bg-white rounded-2xl p-3 border border-gray-100 text-center">
                            <p className="text-2xl font-bold text-red-500">{resultData.totalQuestions - resultData.correctAnswers}</p>
                            <p className="text-[10px] font-medium text-gray-400">Wrong</p>
                        </div>
                        <div className="bg-white rounded-2xl p-3 border border-gray-100 text-center">
                            <p className="text-2xl font-bold text-[#6C5DD3]">{formatTime((selectedCert?.duration * 60) - testTimer)}</p>
                            <p className="text-[10px] font-medium text-gray-400">Time Taken</p>
                        </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="space-y-3">
                        <button 
                            onClick={() => handleStartTest(selectedCert)}
                            className="w-full bg-[#6C5DD3] text-white rounded-xl py-3.5 text-sm font-bold shadow-lg shadow-[#6C5DD3]/20"
                        >
                            Retry Test
                        </button>
                        <button 
                            onClick={handleBackToList}
                            className="w-full bg-gray-100 text-gray-700 rounded-xl py-3.5 text-sm font-bold"
                        >
                            Back to Tests
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    // List State (default)
    return (
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 h-full flex flex-col bg-gray-50/50">
            {/* Header */}
            <div className="bg-white px-4 py-4 sticky top-0 z-10 border-b border-gray-100">
                <div className="flex items-center gap-4 mb-2">
                    <button onClick={() => navigate('/dashboard/more')} className="w-8 h-8 rounded-full bg-gray-50 flex items-center justify-center text-gray-600">
                        <ArrowLeft className="w-5 h-5" />
                    </button>
                    <div className="flex-1">
                        <h2 className="text-lg font-bold text-gray-900">Rank Up Tests</h2>
                        <p className="text-xs text-gray-500 font-medium">Complete certification tests to increase your tier and unlock rewards</p>
                    </div>
                </div>
            </div>

            <div className="p-4 flex-1 overflow-y-auto pb-24 space-y-4">
                {/* Stats Cards */}
                <div className="grid grid-cols-3 gap-3">
                    <div className="bg-white rounded-2xl p-3 border border-gray-100 shadow-sm text-center">
                        <div className="w-8 h-8 bg-[#EBE9FE] rounded-xl flex items-center justify-center mx-auto mb-2">
                            <Trophy className="w-4 h-4 text-[#6C5DD3]" />
                        </div>
                        <p className="text-[10px] font-medium text-gray-400 uppercase mb-0.5">Current Tier</p>
                        <p className="text-sm font-bold text-gray-900">
                            {tiers.find(t => t.minRating <= currentRating && (!t.maxRating || t.maxRating > currentRating))?.name || 'Beginner'}
                        </p>
                    </div>
                    <div className="bg-white rounded-2xl p-3 border border-gray-100 shadow-sm text-center">
                        <div className="w-8 h-8 bg-blue-50 rounded-xl flex items-center justify-center mx-auto mb-2">
                            <HelpCircle className="w-4 h-4 text-blue-500" />
                        </div>
                        <p className="text-[10px] font-medium text-gray-400 uppercase mb-0.5">Tests Attempted</p>
                        <p className="text-sm font-bold text-gray-900">{testsAttempted}</p>
                    </div>
                    <div className="bg-white rounded-2xl p-3 border border-gray-100 shadow-sm text-center">
                        <div className="w-8 h-8 bg-green-50 rounded-xl flex items-center justify-center mx-auto mb-2">
                            <Target className="w-4 h-4 text-green-500" />
                        </div>
                        <p className="text-[10px] font-medium text-gray-400 uppercase mb-0.5">Rating</p>
                        <p className="text-sm font-bold text-gray-900">{currentRating}</p>
                    </div>
                </div>

                {/* Certification Cards */}
                <div className="space-y-4">
                    {tiers.map((cert) => (
                        <div 
                            key={cert.id} 
                            className={`bg-gradient-to-br ${cert.bgGradient} rounded-[24px] p-4 border ${cert.borderColor} shadow-sm relative overflow-hidden`}
                        >
                            {/* Header */}
                            <div className="flex items-start justify-between mb-3">
                                <div className="flex items-center gap-3">
                                    <div className="text-2xl">{cert.icon}</div>
                                    <div>
                                        <h3 className="font-bold text-gray-900 text-sm">{cert.name}</h3>
                                        <p className="text-[10px] text-gray-500">
                                            {cert.unlocked ? 'Prove your fundamental skills' : 'Complete previous tier to unlock'}
                                        </p>
                                    </div>
                                </div>
                                <div className={`w-8 h-8 rounded-full flex items-center justify-center ${cert.unlocked ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-400'}`}>
                                    {cert.unlocked ? <Unlock className="w-4 h-4" /> : <Lock className="w-4 h-4" />}
                                </div>
                            </div>

                            {/* Stats Row */}
                            <div className="flex items-center gap-4 text-[10px] text-gray-500 mb-3">
                                <span className="flex items-center gap-1">
                                    <HelpCircle className="w-3 h-3" /> {cert.questions} questions
                                </span>
                                <span className="flex items-center gap-1">
                                    <Clock className="w-3 h-3" /> {cert.duration} min
                                </span>
                                <span className="flex items-center gap-1">
                                    Required: <span className="font-bold text-gray-700">{cert.minRating}</span>
                                </span>
                                <span className="flex items-center gap-1">
                                    Pass: <span className="font-bold text-gray-700">{cert.minScore}%</span>
                                </span>
                            </div>

                            {/* Subject Tags */}
                            <div className="flex flex-wrap gap-1.5 mb-3">
                                {cert.subjects?.map((subject) => (
                                    <span 
                                        key={subject} 
                                        className="px-2 py-1 bg-white/80 border border-white rounded-md text-[10px] font-bold text-gray-600 shadow-sm"
                                    >
                                        {subject}
                                    </span>
                                ))}
                            </div>

                            {/* Progress Bar */}
                            <div className="mb-3">
                                <div className="flex justify-between items-center mb-1">
                                    <span className="text-[10px] font-medium text-gray-500">Progress to unlock</span>
                                    <span className="text-[10px] font-bold text-gray-700">{currentRating} / {cert.minRating}</span>
                                </div>
                                <div className="w-full h-2 bg-white/60 rounded-full overflow-hidden">
                                    <div 
                                        className="h-full bg-[#6C5DD3] rounded-full transition-all duration-500"
                                        style={{ width: `${Math.min((currentRating / cert.minRating) * 100, 100)}%` }}
                                    ></div>
                                </div>
                            </div>

                            {/* Start Button */}
                            {cert.unlocked && (
                                <button 
                                    onClick={() => handleStartTest(cert)}
                                    className="w-full bg-[#6C5DD3] text-white rounded-xl py-2.5 text-xs font-bold shadow-lg shadow-[#6C5DD3]/20 active:scale-[0.98] transition-all hover:bg-[#5B4EC2] flex items-center justify-center gap-2"
                                >
                                    <Zap className="w-3.5 h-3.5" />
                                    Start Test
                                </button>
                            )}
                        </div>
                    ))}
                </div>

                {/* How Tests Work */}
                <div className="bg-gradient-to-br from-[#6C5DD3] to-[#8B7CF7] rounded-[24px] p-5 text-white">
                    <h3 className="font-bold text-sm mb-3 flex items-center gap-2">
                        <Star className="w-4 h-4" />
                        How Tests Work
                    </h3>
                    <ul className="space-y-2 text-[11px] font-medium text-white/90">
                        <li className="flex items-start gap-2">
                            <ChevronRight className="w-3 h-3 mt-0.5 flex-shrink-0" />
                            Complete tests to rank up and increase your tier
                        </li>
                        <li className="flex items-start gap-2">
                            <ChevronRight className="w-3 h-3 mt-0.5 flex-shrink-0" />
                            Each test requires a minimum rating to unlock
                        </li>
                        <li className="flex items-start gap-2">
                            <ChevronRight className="w-3 h-3 mt-0.5 flex-shrink-0" />
                            Passing grants rating boosts and tier advancement
                        </li>
                        <li className="flex items-start gap-2">
                            <ChevronRight className="w-3 h-3 mt-0.5 flex-shrink-0" />
                            Tests cover multiple subjects at increasing difficulty
                        </li>
                    </ul>
                </div>
            </div>
        </div>
    );
}
