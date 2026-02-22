import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Swords, Users, Clock, Shield, ChevronDown, ChevronUp, ChevronLeft, Mic, Sparkles, Shuffle, X, Check, MessageSquare, Lightbulb, Flag, SkipForward, Search, Bell, Play, Pause, Trophy, Filter, Calendar, Award, Zap, Home, BookOpen, BarChart2, Menu, Star, RefreshCw } from 'lucide-react';
import api from '../api/api';
import { useAuth } from '../context/AuthContext';

// === WIN CELEBRATION ANIMATION STYLES ===
const celebrationStyles = `
@keyframes confetti-fall {
  0% { transform: translateY(-100vh) rotate(0deg) scale(1); opacity: 1; }
  70% { opacity: 1; }
  100% { transform: translateY(100vh) rotate(720deg) scale(0.3); opacity: 0; }
}
@keyframes confetti-sway {
  0%, 100% { transform: translateX(0px); }
  25% { transform: translateX(30px); }
  50% { transform: translateX(-20px); }
  75% { transform: translateX(15px); }
}
@keyframes trophy-bounce {
  0% { transform: scale(0) rotate(-20deg); opacity: 0; }
  50% { transform: scale(1.3) rotate(5deg); opacity: 1; }
  70% { transform: scale(0.9) rotate(-3deg); }
  85% { transform: scale(1.05) rotate(1deg); }
  100% { transform: scale(1) rotate(0deg); opacity: 1; }
}
@keyframes glow-pulse {
  0%, 100% { box-shadow: 0 0 20px rgba(34, 197, 94, 0.3), 0 0 40px rgba(34, 197, 94, 0.1); }
  50% { box-shadow: 0 0 40px rgba(34, 197, 94, 0.5), 0 0 80px rgba(34, 197, 94, 0.2); }
}
@keyframes star-burst {
  0% { transform: scale(0) rotate(0deg); opacity: 0; }
  50% { transform: scale(1.2) rotate(180deg); opacity: 1; }
  100% { transform: scale(1) rotate(360deg); opacity: 0.8; }
}
@keyframes star-twinkle {
  0%, 100% { opacity: 0.4; transform: scale(0.8); }
  50% { opacity: 1; transform: scale(1.2); }
}
@keyframes victory-text {
  0% { transform: scale(0.5) translateY(20px); opacity: 0; }
  60% { transform: scale(1.1) translateY(-5px); }
  100% { transform: scale(1) translateY(0); opacity: 1; }
}
@keyframes slide-up-fade {
  0% { transform: translateY(30px); opacity: 0; }
  100% { transform: translateY(0); opacity: 1; }
}
@keyframes shimmer {
  0% { background-position: -200% center; }
  100% { background-position: 200% center; }
}
@keyframes ring-expand {
  0% { transform: scale(0.5); opacity: 0.8; border-width: 4px; }
  100% { transform: scale(2.5); opacity: 0; border-width: 1px; }
}
`;

const CONFETTI_COLORS = [
    '#FFD700', '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4',
    '#FFEAA7', '#DDA0DD', '#98D8C8', '#F7DC6F', '#BB8FCE',
    '#85C1E9', '#F1948A', '#82E0AA', '#F8C471', '#AED6F1'
];

function ConfettiCelebration() {
    const particles = useMemo(() => {
        return Array.from({ length: 60 }, (_, i) => ({
            id: i,
            left: Math.random() * 100,
            delay: Math.random() * 3,
            duration: 2.5 + Math.random() * 2,
            color: CONFETTI_COLORS[Math.floor(Math.random() * CONFETTI_COLORS.length)],
            size: 6 + Math.random() * 10,
            shape: Math.random() > 0.5 ? 'circle' : 'rect',
            swayDuration: 2 + Math.random() * 3,
        }));
    }, []);

    return (
        <div style={{ position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 100, overflow: 'hidden' }}>
            {particles.map(p => (
                <div
                    key={p.id}
                    style={{
                        position: 'absolute',
                        left: `${p.left}%`,
                        top: '-20px',
                        width: p.shape === 'circle' ? `${p.size}px` : `${p.size * 0.6}px`,
                        height: `${p.size}px`,
                        backgroundColor: p.color,
                        borderRadius: p.shape === 'circle' ? '50%' : '2px',
                        animation: `confetti-fall ${p.duration}s ease-in ${p.delay}s forwards, confetti-sway ${p.swayDuration}s ease-in-out ${p.delay}s infinite`,
                        opacity: 0,
                    }}
                />
            ))}
        </div>
    );
}

function VictoryStars() {
    const stars = useMemo(() => {
        return Array.from({ length: 12 }, (_, i) => ({
            id: i,
            left: 10 + Math.random() * 80,
            top: 5 + Math.random() * 30,
            delay: 0.3 + Math.random() * 1.5,
            size: 10 + Math.random() * 16,
            twinkleDuration: 1.5 + Math.random() * 2,
        }));
    }, []);

    return (
        <>
            {stars.map(s => (
                <div
                    key={s.id}
                    style={{
                        position: 'absolute',
                        left: `${s.left}%`,
                        top: `${s.top}%`,
                        zIndex: 5,
                        animation: `star-burst 0.8s ease-out ${s.delay}s forwards, star-twinkle ${s.twinkleDuration}s ease-in-out ${s.delay + 0.8}s infinite`,
                        opacity: 0,
                    }}
                >
                    <Star style={{ width: s.size, height: s.size, color: '#FFD700', fill: '#FFD700' }} />
                </div>
            ))}
        </>
    );
}

const duels = [
    { id: 'quiz', name: 'Quiz Duel', icon: Swords, iconBg: 'bg-[#EBE9FE]', iconColor: 'text-[#6C5DD3]', language: 'English', inQueue: 25, waitTime: '< 30s', minRating: null, type: 'mcq' },
    { id: 'speaking', name: 'Speaking Duel', icon: Mic, iconBg: 'bg-amber-50', iconColor: 'text-amber-500', language: 'English', inQueue: 8, waitTime: '< 1 min', minRating: null, type: 'speaking' },
    { id: 'mixed', name: 'Mixed Duel', icon: Shuffle, iconBg: 'bg-pink-50', iconColor: 'text-pink-500', language: 'English', inQueue: 19, waitTime: '< 2 min', minRating: 1100, type: 'mixed' }
];

export default function Arena() {
    const navigate = useNavigate();
    const location = useLocation();
    const { user } = useAuth();

    // UI State
    const [selectedLanguage, setSelectedLanguage] = useState('English');
    const [selectedMode, setSelectedMode] = useState('Free Play');
    const [activeTab, setActiveTab] = useState(location.state?.tab || 'arena');
    // Tournament States
    const [tournamentSubTab, setTournamentSubTab] = useState('active'); // active, upcoming, completed
    const [searchQuery, setSearchQuery] = useState('');
    const [showFilters, setShowFilters] = useState(false);

    // Data State
    const [tournaments, setTournaments] = useState([]);
    const [userStats, setUserStats] = useState(null);
    const [loading, setLoading] = useState(true);

    // Competition Lobby
    const [showCompetitionLobby, setShowCompetitionLobby] = useState(false);
    const [selectedTournament, setSelectedTournament] = useState(null);

    // Game states
    const [gameState, setGameState] = useState('lobby');
    const [searchTimer, setSearchTimer] = useState(0);
    const [selectedDuel, setSelectedDuel] = useState(null);

    // Match Data
    const [activeMatch, setActiveMatch] = useState(null); // { id, opponent, questions }
    const [matchQuestions, setMatchQuestions] = useState([]);
    const [currentQuestion, setCurrentQuestion] = useState(0);
    const [selectedAnswer, setSelectedAnswer] = useState(null);
    const [yourScore, setYourScore] = useState(0);
    const [opponentScore, setOpponentScore] = useState(0);
    const [matchTimer, setMatchTimer] = useState(180);
    const [subjectiveAnswer, setSubjectiveAnswer] = useState('');
    const [isRecording, setIsRecording] = useState(false);
    const [recordingTime, setRecordingTime] = useState(0);
    const [finalScore, setFinalScore] = useState(0);
    const [matchResult, setMatchResult] = useState(null); // Result from backend
    const [answerHistory, setAnswerHistory] = useState([]); // Track each question's result
    const [waitTimeout, setWaitTimeout] = useState(300); // 5 mins in seconds for waiting screen

    // Fetch Stats & Tournaments on Mount
    useEffect(() => {
        const fetchInitialData = async () => {
            try {
                const [statsRes, tournamentsRes] = await Promise.all([
                    api.get('/matches/stats/summary').catch(e => ({ data: { data: {} } })), // Fallback if fails
                    api.get('/tournaments').catch(e => ({ data: { data: [] } }))
                ]);

                setUserStats(statsRes.data?.data);
                setTournaments(tournamentsRes.data?.data || []);
            } catch (error) {
                console.error("Failed to load arena data", error);
            } finally {
                setLoading(false);
            }
        };
        fetchInitialData();
    }, []);

    // Timer Effects
    useEffect(() => {
        let interval;
        if (gameState === 'searching') {
            // Timer for the UI
            interval = setInterval(() => {
                setSearchTimer(prev => {
                    const next = prev + 1;
                    if (next >= 60) { // 1 minute timeout
                        setGameState('noOpponent');
                        // Tell backend to remove from queue
                        api.post('/matches/cancel-search').catch(e => console.error(e));
                    }
                    return next;
                });
            }, 1000);

            // Separate Polling for match (every 2s for faster pairing)
            const pollInterval = setInterval(async () => {
                try {
                    const statusRes = await api.get('/matches/queue/status');
                    if (statusRes.data.data.status === 'matched') {
                        const data = statusRes.data.data;
                        setActiveMatch({
                            id: data.matchId,
                            opponent: data.opponent,
                        });
                        setMatchQuestions(data.questions);
                        setGameState('matchFound');
                    }
                } catch (e) {
                    console.error("Queue poll error", e);
                }
            }, 2000);

            return () => {
                clearInterval(interval);
                clearInterval(pollInterval);
            };
        }
        return () => clearInterval(interval);
    }, [gameState]);

    // Results Polling Effect
    useEffect(() => {
        let interval;
        if (gameState === 'waitingOpponent') {
            interval = setInterval(async () => {
                setWaitTimeout(prev => (prev > 0 ? prev - 1 : 0));
                try {
                    const matchRes = await api.get(`/matches/${activeMatch.id}`);
                    const matchData = matchRes.data.data;

                    if (matchData.status === 'completed') {
                        setMatchResult(matchData);
                        setGameState('result');
                    } else if (matchData.status === 'rematch') {
                        // IT'S A DRAW! Show rematch screen for both users
                        const newQuestions = matchData.questions;
                        setGameState('rematch');
                        // After 3 second visual countdown, start the new round
                        setTimeout(() => {
                            setCurrentQuestion(0);
                            setYourScore(0);
                            setOpponentScore(0);
                            setAnswerHistory([]);
                            setSelectedAnswer(null);
                            setMatchQuestions(newQuestions);
                            setMatchTimer(300);
                            setGameState('playing');
                        }, 3000);
                    }
                } catch (e) {
                    console.error("Result poll error", e);
                }
            }, 3000);
        }
        return () => clearInterval(interval);
    }, [gameState, activeMatch]);

    useEffect(() => {
        let interval;
        if (gameState === 'playing' && matchTimer > 0) {
            interval = setInterval(() => setMatchTimer(prev => prev - 1), 1000);
        }
        return () => clearInterval(interval);
    }, [gameState, matchTimer]);

    useEffect(() => {
        let interval;
        if (isRecording) {
            interval = setInterval(() => setRecordingTime(prev => prev + 1), 1000);
        }
        return () => clearInterval(interval);
    }, [isRecording]);

    // Heartbeat Effect - Track presence during match
    useEffect(() => {
        let interval;
        if ((gameState === 'playing' || gameState === 'waitingOpponent') && activeMatch) {
            // Send initial heartbeat
            api.post(`/matches/${activeMatch.id}/heartbeat`).catch(() => { });

            interval = setInterval(() => {
                api.post(`/matches/${activeMatch.id}/heartbeat`).catch(() => { });
            }, 10000); // Every 10 seconds
        }
        return () => clearInterval(interval);
    }, [gameState, activeMatch]);

    const formatTime = (seconds) => `${Math.floor(seconds / 60).toString().padStart(2, '0')}:${(seconds % 60).toString().padStart(2, '0')}`;

    // --- Actions ---

    const handleFindMatch = async (duel) => {
        setSelectedDuel(duel);
        setSearchTimer(0);
        setGameState('searching');

        try {
            // Initiate Match Finding
            const res = await api.post('/matches/find-opponent', {
                duelType: duel.id,
                language: selectedLanguage,
                entryFee: 0 // For free play
            });

            const data = res.data.data;
            if (data.status === 'matched') {
                setActiveMatch({
                    id: data.matchId,
                    opponent: data.opponent || { name: 'Opponent', id: data.opponentId },
                });
                setMatchQuestions(data.questions);
                setGameState('matchFound');
            }
            // If status is 'searching', the useEffect poll will handle it
        } catch (error) {
            console.error("Match finding failed", error);
            alert("Failed to find opponent. Please try again.");
            setGameState('lobby');
        }
    };

    const handleCancelSearch = async () => {
        setGameState('lobby');
        setSelectedDuel(null);
        try {
            await api.post('/matches/cancel-search');
        } catch (e) {
            console.error("Failed to cancel search on server", e);
        }
    };

    const handleStartMatch = () => {
        setGameState('playing');
        setCurrentQuestion(0);
        setYourScore(0);
        setOpponentScore(0);
        setMatchTimer(180);
        setSelectedAnswer(null);
    };

    const handleSelectAnswer = (index) => setSelectedAnswer(index);

    const handleJoinTournament = (tournament) => {
        setSelectedTournament(tournament);
        setShowCompetitionLobby(true);
    };

    const handleStartRound = (round) => {
        // Map tournament round to duel structure
        const duel = { id: 'tournament_round', name: round.name };
        handleFindMatch(duel); // Reuse matchmaking logic
        setShowCompetitionLobby(false);
    };

    const handleNextQuestion = async () => {
        if (!matchQuestions[currentQuestion]) return;

        const question = matchQuestions[currentQuestion];
        let correct = false;

        if (question.type === 'mcq' && selectedAnswer === question.correct) correct = true;

        setAnswerHistory(prev => [...prev, {
            question: question.question,
            type: question.type,
            selectedAnswer: selectedAnswer,
            correctAnswer: question.correct,
            options: question.options || [],
            isCorrect: correct
        }]);

        if (correct) setYourScore(prev => prev + 1);

        if (currentQuestion < matchQuestions.length - 1) {
            setCurrentQuestion(prev => prev + 1);
            setSelectedAnswer(null);
            setSubjectiveAnswer('');
            setRecordingTime(0);
            setIsRecording(false);
        } else {
            // END MATCH - Player finished
            const final = ((yourScore + (correct ? 1 : 0)) / matchQuestions.length) * 100;
            setFinalScore(final);

            try {
                // Submit SCORE to Backend (Individual completion)
                await api.post(`/matches/${activeMatch.id}/result`, {
                    matchId: activeMatch.id,
                    score: yourScore + (correct ? 1 : 0)
                });

                // ALWAYS go to waiting screen - polling will detect 'completed' for BOTH users
                setGameState('waitingOpponent');
                setWaitTimeout(60); // 1 min
            } catch (err) {
                console.error("Failed to submit score", err);
                setGameState('lobby');
            }
        }
    };

    // --- Renders ---

    // Competition Lobby View
    if (showCompetitionLobby) {
        return (
            <div className="animate-in fade-in duration-300 h-full flex flex-col bg-gray-50/50">
                <div className="bg-white px-4 py-4 border-b border-gray-100">
                    <div className="flex items-center gap-3">
                        <button onClick={() => setShowCompetitionLobby(false)} className="w-8 h-8 rounded-full bg-gray-50 flex items-center justify-center">
                            <ChevronLeft className="w-5 h-5 text-gray-600" />
                        </button>
                        <h2 className="text-lg font-bold text-gray-900">Competition Lobby</h2>
                    </div>
                </div>

                <div className="p-4 flex-1 overflow-y-auto pb-24 space-y-3">
                    {/* Hardcoded rounds for tournament view demo since API might not return rounds fully */}
                    <div className="bg-white rounded-[24px] p-4 border border-gray-100 shadow-sm">
                        <div className="flex items-center gap-3 mb-3">
                            <div className="w-10 h-10 bg-[#EBE9FE] rounded-xl flex items-center justify-center">
                                <Swords className="w-5 h-5 text-[#6C5DD3]" />
                            </div>
                            <h3 className="font-bold text-gray-900">Qualifier Round</h3>
                        </div>
                        <p className="text-sm font-medium text-gray-600 mb-1">English</p>
                        <button
                            onClick={() => handleStartRound({ name: 'Qualifier Round', id: 'qualifier' })}
                            className="w-full bg-gray-900 text-white rounded-xl py-3 text-xs font-bold shadow-lg active:scale-[0.98] transition-all flex items-center justify-center gap-2"
                        >
                            <Zap className="w-3.5 h-3.5" /> Start Round
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    // Searching Screen
    if (gameState === 'searching') {
        return (
            <div className="animate-in fade-in duration-300 h-full flex flex-col bg-gray-50/50">
                <div className="bg-white px-4 py-4 border-b border-gray-100">
                    <h2 className="text-lg font-bold text-gray-900">PvP Arena</h2>
                </div>
                <div className="flex-1 flex items-center justify-center p-4">
                    <div className="bg-white rounded-[32px] p-8 w-full max-w-sm shadow-xl border border-gray-100 text-center animate-in zoom-in-95 duration-300">
                        <div className="w-20 h-20 mx-auto mb-6 bg-[#EBE9FE] rounded-full flex items-center justify-center animate-pulse">
                            <Swords className="w-10 h-10 text-[#6C5DD3]" />
                        </div>
                        <p className="text-4xl font-bold text-gray-900 mb-2">{formatTime(searchTimer)}</p>
                        <p className="text-sm text-gray-500 mb-6">Searching for an opponent with similar skill level</p>
                        <button onClick={handleCancelSearch} className="w-full bg-gray-100 text-gray-700 rounded-xl py-3 text-sm font-bold hover:bg-gray-200 flex items-center justify-center gap-2">
                            <X className="w-4 h-4" /> Cancel Search
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    // No Opponent Found
    if (gameState === 'noOpponent') {
        return (
            <div className="animate-in fade-in duration-300 h-full flex flex-col bg-gray-50/50">
                <div className="bg-white px-4 py-4 border-b border-gray-100">
                    <h2 className="text-lg font-bold text-gray-900">PvP Arena</h2>
                </div>
                <div className="flex-1 flex items-center justify-center p-4">
                    <div className="bg-white rounded-[32px] p-8 w-full max-w-sm shadow-xl border border-gray-100 text-center animate-in zoom-in-95 duration-300">
                        <div className="w-20 h-20 mx-auto mb-6 bg-red-50 rounded-full flex items-center justify-center">
                            <Users className="w-10 h-10 text-red-500" />
                        </div>
                        <h3 className="text-xl font-bold text-gray-900 mb-2">No Users Online</h3>
                        <p className="text-sm text-gray-500 mb-8">We couldn't find a compatible opponent within your rating range right now. Please try again later or change your settings.</p>

                        <div className="flex flex-col gap-3">
                            <button onClick={() => handleFindMatch(selectedDuel)} className="w-full bg-[#6C5DD3] text-white rounded-xl py-3.5 text-sm font-bold shadow-lg shadow-[#6C5DD3]/20 flex items-center justify-center gap-2">
                                <Search className="w-4 h-4" /> Try Again
                            </button>
                            <button onClick={() => setGameState('lobby')} className="w-full bg-gray-100 text-gray-700 rounded-xl py-3.5 text-sm font-bold hover:bg-gray-200 transition-colors">
                                Return to Lobby
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    // Match Found
    if (gameState === 'matchFound') {
        return (
            <div className="animate-in fade-in duration-300 h-full flex flex-col bg-gray-50/50">
                <div className="bg-white px-4 py-4 border-b border-gray-100">
                    <h2 className="text-lg font-bold text-gray-900">PvP Arena</h2>
                </div>
                <div className="flex-1 flex items-center justify-center p-4">
                    <div className="bg-white rounded-[32px] p-8 w-full max-w-sm shadow-xl border border-gray-100 text-center animate-in zoom-in-95 duration-300">
                        <h3 className="text-xl font-bold text-gray-900 mb-6">Match Found!</h3>
                        <div className="flex items-center justify-center gap-6 mb-8">
                            <div className="text-center">
                                <div className="w-16 h-16 rounded-full bg-gradient-to-br from-[#6C5DD3] to-[#8B7CF7] flex items-center justify-center text-white text-xl font-bold mb-2 mx-auto">Y</div>
                                <p className="font-bold text-gray-900 text-sm">You</p>
                            </div>
                            <div className="text-2xl font-black text-gray-300">VS</div>
                            <div className="text-center">
                                <div className="w-16 h-16 rounded-full bg-gradient-to-br from-orange-400 to-red-500 flex items-center justify-center text-white text-xl font-bold mb-2 mx-auto">
                                    {activeMatch?.opponent?.name?.[0] || 'O'}
                                </div>
                                <p className="font-bold text-gray-900 text-sm">{activeMatch?.opponent?.name || 'Opponent'}</p>
                            </div>
                        </div>
                        <button onClick={handleStartMatch} className="w-full bg-[#6C5DD3] text-white rounded-xl py-3.5 text-sm font-bold shadow-lg shadow-[#6C5DD3]/20 flex items-center justify-center gap-2">
                            <Sparkles className="w-4 h-4" /> Start Match
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    // Waiting for Opponent
    if (gameState === 'waitingOpponent') {
        return (
            <div className="animate-in fade-in duration-300 h-full flex flex-col bg-gray-50/50">
                <div className="bg-white px-4 py-4 border-b border-gray-100">
                    <h2 className="text-lg font-bold text-gray-900">Finalizing Duel</h2>
                </div>
                <div className="flex-1 flex items-center justify-center p-4">
                    <div className="bg-white rounded-[32px] p-8 w-full max-w-sm shadow-xl border border-gray-100 text-center">
                        <div className="w-20 h-20 mx-auto mb-6 bg-orange-50 rounded-full flex items-center justify-center">
                            <Clock className="w-10 h-10 text-orange-500 animate-spin-slow" />
                        </div>
                        <h3 className="text-xl font-bold text-gray-900 mb-2">Waiting for Opponent</h3>
                        <p className="text-sm text-gray-500 mb-6">Your opponent is still completing their test. Results will be declared once they finish or the time expires.</p>
                        <div className="bg-gray-50 rounded-2xl p-4 mb-6">
                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Time Remaining</p>
                            <p className="text-3xl font-black text-gray-900">{formatTime(waitTimeout)}</p>
                        </div>
                        <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                            <div className="h-full bg-orange-400 transition-all duration-1000" style={{ width: `${(waitTimeout / 60) * 100}%` }}></div>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    // 🤝 REMATCH Screen — Beautiful Draw Visual
    if (gameState === 'rematch') {
        return (
            <div className="animate-in fade-in duration-300 h-full flex flex-col bg-gradient-to-br from-amber-50 via-orange-50 to-yellow-50" style={{ position: 'relative', overflow: 'hidden' }}>
                <style>{`
                    @keyframes rematch-pulse {
                        0%, 100% { transform: scale(1); opacity: 1; }
                        50% { transform: scale(1.15); opacity: 0.8; }
                    }
                    @keyframes rematch-ring {
                        0% { transform: scale(0.8); opacity: 0.8; }
                        100% { transform: scale(2.5); opacity: 0; }
                    }
                    @keyframes rematch-shake {
                        0%, 100% { transform: translateX(0); }
                        25% { transform: translateX(-5px) rotate(-2deg); }
                        75% { transform: translateX(5px) rotate(2deg); }
                    }
                    @keyframes countdown-pop {
                        0% { transform: scale(0.5); opacity: 0; }
                        50% { transform: scale(1.2); }
                        100% { transform: scale(1); opacity: 1; }
                    }
                    @keyframes gradient-shift {
                        0% { background-position: 0% 50%; }
                        50% { background-position: 100% 50%; }
                        100% { background-position: 0% 50%; }
                    }
                `}</style>

                {/* Animated ring effects */}
                <div style={{ position: 'absolute', top: '35%', left: '50%', transform: 'translate(-50%, -50%)', zIndex: 1, pointerEvents: 'none' }}>
                    {[0, 0.4, 0.8, 1.2].map((delay, i) => (
                        <div key={i} style={{
                            position: 'absolute', left: '50%', top: '50%',
                            width: '100px', height: '100px',
                            marginLeft: '-50px', marginTop: '-50px',
                            borderRadius: '50%',
                            border: '2px solid rgba(245, 158, 11, 0.3)',
                            animation: `rematch-ring 2s ease-out ${delay}s infinite`,
                        }} />
                    ))}
                </div>

                <div className="flex-1 flex items-center justify-center p-6" style={{ position: 'relative', zIndex: 10 }}>
                    <div className="text-center max-w-sm mx-auto">
                        {/* Draw Icon */}
                        <div style={{ animation: 'rematch-pulse 1.5s ease-in-out infinite' }} className="mb-6">
                            <div className="w-28 h-28 mx-auto rounded-full flex items-center justify-center"
                                style={{
                                    background: 'linear-gradient(135deg, #F59E0B 0%, #EF4444 50%, #F59E0B 100%)',
                                    backgroundSize: '200% 200%',
                                    animation: 'gradient-shift 2s ease infinite',
                                    boxShadow: '0 8px 32px rgba(245, 158, 11, 0.4)'
                                }}>
                                <span style={{ fontSize: '48px' }}>🤝</span>
                            </div>
                        </div>

                        {/* Draw Text */}
                        <h2 className="text-3xl font-black mb-2" style={{
                            background: 'linear-gradient(90deg, #F59E0B, #EF4444, #F59E0B)',
                            backgroundSize: '200% auto',
                            animation: 'gradient-shift 2s linear infinite',
                            WebkitBackgroundClip: 'text',
                            WebkitTextFillColor: 'transparent',
                            backgroundClip: 'text',
                        }}>
                            It's a Draw!
                        </h2>
                        <p className="text-gray-600 text-base mb-8" style={{ animation: 'rematch-shake 0.5s ease-in-out 0.3s' }}>
                            Both players scored equally! Preparing rematch with new questions...
                        </p>

                        {/* Countdown Dots */}
                        <div className="flex items-center justify-center gap-4 mb-6">
                            {[1, 2, 3].map((dot) => (
                                <div key={dot} className="w-4 h-4 rounded-full" style={{
                                    background: 'linear-gradient(135deg, #F59E0B, #EF4444)',
                                    animation: `countdown-pop 0.4s ease-out ${dot * 0.8}s forwards`,
                                    opacity: 0,
                                    boxShadow: '0 2px 8px rgba(245, 158, 11, 0.4)',
                                }} />
                            ))}
                        </div>

                        {/* Rematch Starting Text */}
                        <div className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full" style={{
                            background: 'rgba(245, 158, 11, 0.1)',
                            border: '1px solid rgba(245, 158, 11, 0.3)',
                        }}>
                            <RefreshCw className="w-4 h-4 text-amber-600 animate-spin" />
                            <span className="text-sm font-bold text-amber-700">Rematch Starting...</span>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    // Result Screen
    if (gameState === 'result') {
        // Determine win/loss from backend match data
        const isUser1 = matchResult && matchResult.user_1_id === user?.id;
        const myScore = matchResult ? (isUser1 ? matchResult.user_1_score : matchResult.user_2_score) : yourScore;
        const oppScore = matchResult ? (isUser1 ? matchResult.user_2_score : matchResult.user_1_score) : 0;
        const passed = matchResult ? matchResult.winner_id === user?.id : finalScore >= 50;
        const isDraw = matchResult && !matchResult.winner_id;
        const correctCount = answerHistory.filter(a => a.isCorrect).length;
        const wrongCount = answerHistory.filter(a => !a.isCorrect).length;
        const displayScore = matchResult ? ((myScore / (matchQuestions.length || 5)) * 100) : finalScore;
        return (
            <div className="animate-in fade-in duration-300 h-full flex flex-col bg-gray-50/50" style={{ position: 'relative', overflow: 'hidden' }}>
                {/* Inject celebration keyframe styles */}
                <style>{celebrationStyles}</style>

                {/* Confetti overlay for winners */}
                {passed && <ConfettiCelebration />}

                {/* Expanding ring effects for winners */}
                {passed && (
                    <div style={{ position: 'absolute', top: '18%', left: '50%', transform: 'translateX(-50%)', zIndex: 4, pointerEvents: 'none' }}>
                        {[0, 0.5, 1].map((delay, i) => (
                            <div key={i} style={{
                                position: 'absolute', left: '50%', top: '50%',
                                width: '80px', height: '80px',
                                marginLeft: '-40px', marginTop: '-40px',
                                borderRadius: '50%', border: '3px solid rgba(34, 197, 94, 0.4)',
                                animation: `ring-expand 2s ease-out ${delay}s infinite`,
                            }} />
                        ))}
                    </div>
                )}

                <div className="bg-white px-4 py-4 border-b border-gray-100" style={{ position: 'relative', zIndex: 10 }}>
                    <h2 className="text-lg font-bold text-gray-900">{selectedDuel?.name || 'Quiz Duel'}</h2>
                </div>
                <div className="flex-1 overflow-y-auto p-4 md:p-6 pb-24 space-y-5 md:space-y-6" style={{ position: 'relative', zIndex: 10 }}>
                    {/* Score Card */}
                    <div
                        className={`rounded-[24px] md:rounded-[28px] p-6 md:p-8 w-full max-w-lg mx-auto shadow-lg text-center ${passed ? 'bg-gradient-to-br from-green-50 to-emerald-50 border border-green-200' : 'bg-gradient-to-br from-red-50 to-orange-50 border border-red-200'}`}
                        style={passed ? { animation: 'glow-pulse 2s ease-in-out infinite', position: 'relative', overflow: 'visible' } : {}}
                    >
                        {/* Victory stars scattered around the card */}
                        {passed && <VictoryStars />}

                        <div className="md:flex md:items-center md:gap-8">
                            {/* Trophy + Score */}
                            <div className="md:flex-shrink-0">
                                {/* Animated Trophy Icon for winners */}
                                {passed && (
                                    <div style={{ animation: 'trophy-bounce 1s ease-out 0.3s forwards', opacity: 0, marginBottom: '8px' }} className="flex justify-center">
                                        <div className="w-16 h-16 rounded-full flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #FFD700 0%, #FFA500 100%)', boxShadow: '0 4px 20px rgba(255,215,0,0.4)' }}>
                                            <Trophy style={{ width: 32, height: 32, color: '#fff' }} />
                                        </div>
                                    </div>
                                )}
                                {/* Score Circle */}
                                <div className="w-24 h-24 md:w-28 md:h-28 mx-auto mb-3 md:mb-0 relative" style={passed ? { animation: 'slide-up-fade 0.8s ease-out 0.6s forwards', opacity: 0 } : {}}>
                                    <svg className="w-full h-full transform -rotate-90" viewBox="0 0 112 112">
                                        <circle cx="56" cy="56" r="48" stroke="#e5e7eb" strokeWidth="8" fill="none" />
                                        <circle cx="56" cy="56" r="48" stroke={passed ? '#22c55e' : '#ef4444'} strokeWidth="8" fill="none"
                                            strokeDasharray={`${(displayScore / 100) * 301} 301`} strokeLinecap="round"
                                            style={passed ? { transition: 'stroke-dasharray 1.5s ease-out' } : {}}
                                        />
                                    </svg>
                                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                                        <span className={`text-2xl font-bold ${passed ? 'text-green-600' : 'text-red-600'}`}>{displayScore.toFixed(0)}%</span>
                                        <span className={`text-[10px] font-medium ${passed ? 'text-green-500' : 'text-red-500'}`}>{isDraw ? 'Draw' : (passed ? 'Winner' : 'Defeated')}</span>
                                    </div>
                                </div>
                            </div>

                            {/* Info */}
                            <div className="md:flex-1 md:text-left">
                                <h2
                                    className={`text-xl font-bold mb-1 ${passed ? 'text-green-700' : 'text-red-700'}`}
                                    style={passed ? {
                                        animation: 'victory-text 0.8s ease-out 0.5s forwards',
                                        opacity: 0,
                                        background: 'linear-gradient(90deg, #22c55e, #16a34a, #FFD700, #22c55e)',
                                        backgroundSize: '200% auto',
                                        WebkitBackgroundClip: 'text',
                                        WebkitTextFillColor: 'transparent',
                                        backgroundClip: 'text',
                                    } : {}}
                                >
                                    {isDraw ? '🤝 Draw!' : (passed ? '🏆 Victory!' : 'Defeat')}
                                </h2>
                                {/* Score comparison */}
                                <div className="flex items-center justify-center md:justify-start gap-3 mb-2">
                                    <span className="text-lg font-bold text-blue-600">You: {myScore}</span>
                                    <span className="text-gray-400">vs</span>
                                    <span className="text-lg font-bold text-orange-600">{activeMatch?.opponent?.name}: {oppScore}</span>
                                </div>
                                <p
                                    className={`text-sm mb-4 ${passed ? 'text-green-600' : 'text-red-600'}`}
                                    style={passed ? { animation: 'slide-up-fade 0.6s ease-out 0.8s forwards', opacity: 0 } : {}}
                                >
                                    {isDraw ? 'Both players scored equally!' : (passed ? `You won against ${activeMatch?.opponent?.name}! 🎉` : 'Keep practicing to improve your rating!')}
                                </p>

                                {/* Rewards Badge for winners */}
                                {passed && (
                                    <div
                                        className="flex items-center gap-2 mb-4 px-3 py-2 rounded-xl w-fit mx-auto md:mx-0"
                                        style={{
                                            background: 'linear-gradient(135deg, rgba(255,215,0,0.15), rgba(255,165,0,0.1))',
                                            border: '1px solid rgba(255,215,0,0.3)',
                                            animation: 'slide-up-fade 0.6s ease-out 1s forwards',
                                            opacity: 0,
                                        }}
                                    >
                                        <Sparkles style={{ width: 16, height: 16, color: '#FFD700' }} />
                                        <span className="text-xs font-bold" style={{ color: '#B8860B' }}>+10 Rating Points</span>
                                        <Zap style={{ width: 14, height: 14, color: '#FFD700' }} />
                                    </div>
                                )}

                                {/* Stats Row */}
                                <div
                                    className="flex justify-center md:justify-start gap-5 mb-4"
                                    style={passed ? { animation: 'slide-up-fade 0.6s ease-out 1.1s forwards', opacity: 0 } : {}}
                                >
                                    <div className="flex items-center gap-2">
                                        <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center">
                                            <Check className="w-4 h-4 text-green-600" />
                                        </div>
                                        <div className="text-left">
                                            <p className="text-base font-bold text-green-600 leading-none">{correctCount}</p>
                                            <p className="text-[10px] text-gray-500 font-medium">Correct</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <div className="w-8 h-8 rounded-full bg-red-100 flex items-center justify-center">
                                            <X className="w-4 h-4 text-red-600" />
                                        </div>
                                        <div className="text-left">
                                            <p className="text-base font-bold text-red-600 leading-none">{wrongCount}</p>
                                            <p className="text-[10px] text-gray-500 font-medium">Wrong</p>
                                        </div>
                                    </div>
                                </div>

                                <button
                                    onClick={() => { setGameState('lobby'); setAnswerHistory([]); }}
                                    className="w-full md:w-auto md:px-10 bg-gray-900 text-white rounded-xl py-2.5 text-sm font-bold hover:bg-gray-800 transition-colors active:scale-[0.98]"
                                    style={passed ? { animation: 'slide-up-fade 0.6s ease-out 1.3s forwards', opacity: 0 } : {}}
                                >
                                    {passed ? '🎮 Play Again' : 'Exit'}
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Question Review Section */}
                    {answerHistory.length > 0 && (
                        <div className="max-w-full mx-auto space-y-3">
                            <h3 className="text-base font-bold text-gray-900 px-1">Question Review</h3>
                            <div className="space-y-3">
                                {answerHistory.map((item, idx) => (
                                    <div key={idx} className={`rounded-2xl p-4 border transition-all ${item.isCorrect
                                        ? 'bg-white border-green-200'
                                        : 'bg-white border-red-200'
                                        }`}
                                        style={{ animation: `slide-up-fade 0.4s ease-out ${1.4 + idx * 0.1}s forwards`, opacity: 0 }}
                                    >
                                        {/* Question Header */}
                                        <div className="flex items-start gap-2.5 mb-3">
                                            <div className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 mt-0.5 ${item.isCorrect ? 'bg-green-100' : 'bg-red-100'
                                                }`}>
                                                {item.isCorrect
                                                    ? <Check className="w-3.5 h-3.5 text-green-600" />
                                                    : <X className="w-3.5 h-3.5 text-red-600" />
                                                }
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="text-[10px] font-bold text-gray-400 mb-0.5">Question {idx + 1}</p>
                                                <p className="text-sm font-semibold text-gray-900 leading-snug">{item.question}</p>
                                            </div>
                                        </div>

                                        {/* Answer Options Review */}
                                        {item.type === 'mcq' && item.options.length > 0 && (
                                            <div className="space-y-1.5 ml-8">
                                                {item.options.map((opt, optIdx) => {
                                                    const isUserAnswer = optIdx === item.selectedAnswer;
                                                    const isCorrectAnswer = optIdx === item.correctAnswer;
                                                    let optionStyle = 'bg-gray-50 border-gray-100 text-gray-500';
                                                    let icon = null;

                                                    if (isCorrectAnswer) {
                                                        optionStyle = 'bg-green-50 border-green-200 text-green-700';
                                                        icon = <Check className="w-3 h-3 text-green-600 shrink-0" />;
                                                    }
                                                    if (isUserAnswer && !isCorrectAnswer) {
                                                        optionStyle = 'bg-red-50 border-red-200 text-red-600 line-through';
                                                        icon = <X className="w-3 h-3 text-red-500 shrink-0" />;
                                                    }

                                                    return (
                                                        <div key={optIdx} className={`flex items-center gap-2 px-2.5 py-1.5 rounded-lg border text-xs font-medium ${optionStyle}`}>
                                                            <span className="flex-1">{opt}</span>
                                                            {icon}
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        )}

                                        {/* Correct Answer Label for wrong answers */}
                                        {!item.isCorrect && item.type === 'mcq' && (
                                            <div className="mt-2 ml-8">
                                                <p className="text-[11px] font-medium text-green-600">
                                                    ✓ Correct: {item.options[item.correctAnswer]}
                                                </p>
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        );
    }

    // Playing State
    if (gameState === 'playing' && matchQuestions.length > 0) {
        const question = matchQuestions[currentQuestion];
        const isSpeaking = question.type === 'speaking';
        const isSubjective = question.type === 'subjective';
        const isMcq = question.type === 'mcq';

        return (
            <div className="animate-in fade-in duration-300 h-full flex flex-col bg-gray-50/50">
                <div className="bg-white px-4 py-3 border-b border-gray-100">
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-bold text-gray-900">{selectedDuel?.name || 'Duel'}</span>
                        <span className="text-xs font-medium text-gray-500">Question {currentQuestion + 1}/{matchQuestions.length}</span>
                    </div>
                    <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#6C5DD3] to-[#8B7CF7] flex items-center justify-center text-white text-xs font-bold">Y</div>
                            <span className="text-sm font-bold text-[#6C5DD3]">{yourScore}</span>
                        </div>
                        <p className="text-lg font-bold text-gray-900">{formatTime(matchTimer)}</p>
                        <div className="flex items-center gap-2">
                            <span className="text-sm font-bold text-orange-500">{opponentScore}</span>
                            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-orange-400 to-red-500 flex items-center justify-center text-white text-xs font-bold">
                                {activeMatch?.opponent?.name?.[0] || 'O'}
                            </div>
                        </div>
                    </div>
                    <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                        <div className="h-full bg-[#6C5DD3] rounded-full transition-all" style={{ width: `${((currentQuestion + 1) / matchQuestions.length) * 100}%` }}></div>
                    </div>
                </div>

                <div className="p-4 flex-1 overflow-y-auto pb-32 space-y-4">
                    <div className="bg-[#EBE9FE] rounded-[24px] p-5 border border-[#DCD6FC]">
                        <h3 className="text-lg font-bold text-gray-900 text-center">{question.question}</h3>
                    </div>

                    {isMcq && (
                        <div className="flex flex-col gap-3">
                            {question.options.map((option, index) => (
                                <button key={index} onClick={() => handleSelectAnswer(index)}
                                    className={`w-full px-4 py-3.5 rounded-2xl border-2 font-bold transition-all flex items-center gap-3 group ${selectedAnswer === index ? 'bg-[#6C5DD3] border-[#6C5DD3] text-white shadow-lg shadow-[#6C5DD3]/20' : 'bg-white border-gray-100 text-gray-700 hover:border-[#6C5DD3]/30 hover:bg-gray-50'}`}>
                                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-colors ${selectedAnswer === index ? 'bg-white text-[#6C5DD3]' : 'bg-gray-100 text-gray-500 group-hover:bg-[#EBE9FE] group-hover:text-[#6C5DD3]'}`}>
                                        {index + 1}
                                    </div>
                                    <span className="text-base">{option}</span>
                                </button>
                            ))}
                        </div>
                    )}

                    <div className="fixed bottom-20 md:bottom-6 left-0 md:left-72 right-0 p-4 bg-gradient-to-t from-gray-50 to-transparent md:from-transparent flex justify-center z-40">
                        <button onClick={handleNextQuestion}
                            disabled={(isMcq && selectedAnswer === null)}
                            className="w-full md:w-auto md:min-w-[200px] md:max-w-xs md:px-16 bg-[#6C5DD3] text-white rounded-xl py-3.5 text-sm font-bold shadow-lg shadow-[#6C5DD3]/20 disabled:opacity-50 active:scale-[0.98] transition-transform">
                            {currentQuestion < matchQuestions.length - 1 ? 'Next' : 'Submit'}
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    // Main Lobby
    return (
        <div className="animate-in fade-in duration-300 h-full flex flex-col bg-gray-50/50">
            {/* SkillArena Header */}
            {/* Header */}
            <div className="bg-white px-4 py-3 border-b border-gray-100 sticky top-0 z-20">
                {/* Logo Row */}
                <div className="flex justify-center mb-4">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-[#6C5DD3] rounded-xl flex items-center justify-center shadow-lg shadow-[#6C5DD3]/20">
                            <Swords className="w-5 h-5 text-white" />
                        </div>
                        <div>
                            <h1 className="text-base font-bold text-gray-900 leading-tight">SkillArena</h1>
                            <p className="text-[10px] font-medium text-gray-500">Learn. Compete. Win.</p>
                        </div>
                    </div>
                </div>

                {/* Search & Actions Row */}
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-gray-100 border-2 border-white shadow-sm overflow-hidden flex-shrink-0">
                        <img src={`https://ui-avatars.com/api/?name=${encodeURIComponent('User')}&background=random`} alt="Profile" className="w-full h-full object-cover" />
                    </div>

                    <div className="flex-1 relative">
                        <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                            <Search className="w-4 h-4" />
                        </div>
                        <input
                            type="text"
                            placeholder="Search"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full bg-white border border-gray-200 rounded-full py-2.5 pl-9 pr-9 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-[#6C5DD3]/20 focus:border-[#6C5DD3] transition-all shadow-sm"
                        />
                        <div className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
                            <Mic className="w-4 h-4" />
                        </div>
                    </div>

                    <button className="w-10 h-10 rounded-full bg-white border border-gray-100 flex items-center justify-center text-gray-600 shadow-sm relative hover:bg-gray-50 transition-colors">
                        <Bell className="w-5 h-5" />
                        <span className="absolute top-2 right-2.5 w-2 h-2 bg-red-500 rounded-full border border-white"></span>
                    </button>
                </div>
            </div>

            {/* Tabs */}
            <div className="bg-white px-4 py-2 border-b border-gray-100">
                <div className="flex gap-4">
                    {['arena', 'tournaments'].map(tab => (
                        <button key={tab} onClick={() => setActiveTab(tab)}
                            className={`pb-2 text-sm font-bold transition-colors ${activeTab === tab ? 'text-[#6C5DD3] border-b-2 border-[#6C5DD3]' : 'text-gray-400'}`}>
                            {tab === 'arena' ? 'PvP Arena' : 'Tournaments'}
                        </button>
                    ))}
                </div>
            </div>

            <div className="p-4 flex-1 overflow-y-auto pb-24 space-y-4">
                {activeTab === 'arena' && (
                    <>
                        {/* User Stats Card */}
                        <div className="bg-gradient-to-br from-[#F8F7FC] to-[#EBE9FE] rounded-[24px] p-4 border border-[#E8E5F8]">
                            <div className="flex items-center justify-between mb-3">
                                <div className="flex items-center gap-3">
                                    <div className="w-12 h-12 bg-gray-200 rounded-full border-2 border-[#6C5DD3] flex items-center justify-center font-bold text-[#6C5DD3]">
                                        You
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-gray-900 text-sm">Player</h3>
                                        <div className="flex items-center gap-2 text-[10px]">
                                            <span className="px-2 py-0.5 bg-[#6C5DD3] text-white rounded-md font-bold">Rookie</span>
                                            <span className="text-gray-500">Rating: <span className="font-bold text-gray-700">{userStats?.overall_rating || 1000}</span></span>
                                        </div>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <p className="text-[10px] text-gray-400 font-medium">Balance</p>
                                    <p className="text-lg font-bold text-gray-900">$0.00</p>
                                </div>
                            </div>
                        </div>

                        <div className="space-y-3">
                            {duels.map((duel) => {
                                const IconComponent = duel.icon;
                                return (
                                    <div key={duel.id} className="bg-white rounded-[24px] p-4 border border-gray-100 shadow-sm">
                                        <div className="flex items-center gap-3 mb-3">
                                            <div className={`w-10 h-10 ${duel.iconBg} rounded-xl flex items-center justify-center`}>
                                                <IconComponent className={`w-5 h-5 ${duel.iconColor}`} />
                                            </div>
                                            <h3 className="font-bold text-gray-900">{duel.name}</h3>
                                        </div>
                                        <div className="mb-3 space-y-1">
                                            <p className="text-sm font-medium text-gray-600">{duel.language}</p>
                                            <div className="flex items-center gap-4 text-[11px] text-gray-500">
                                                <span className="flex items-center gap-1"><Users className="w-3 h-3" /> {duel.inQueue} in queue</span>
                                            </div>
                                        </div>
                                        <button onClick={() => handleFindMatch(duel)}
                                            className="w-full bg-gray-900 text-white rounded-xl py-3 text-xs font-bold shadow-lg active:scale-[0.98] transition-all flex items-center justify-center gap-2">
                                            <Swords className="w-3.5 h-3.5" /> Find Match
                                        </button>
                                    </div>
                                );
                            })}
                        </div>
                    </>
                )}

                {activeTab === 'tournaments' && (
                    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 space-y-6">
                        {/* Title Section */}
                        <div>
                            <h2 className="text-xl font-bold text-gray-900 mb-1">Tournaments</h2>
                            <p className="text-sm text-gray-500 font-medium">Compete in organized competitions for prizes</p>
                        </div>

                        {/* Rank Card */}
                        <div className="bg-white p-2 pr-4 rounded-full border border-gray-100 shadow-sm flex items-center gap-3 w-fit">
                            <div className="w-10 h-10 rounded-full bg-[#EBE9FE] flex items-center justify-center text-[#6C5DD3]">
                                <Shield className="w-5 h-5" />
                            </div>
                            <div>
                                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Your Rating</p>
                                <p className="text-lg font-black text-gray-900 leading-none">{userStats?.overall_rating || 1000}</p>
                            </div>
                            <span className="px-3 py-1 bg-gray-100 text-gray-600 rounded-lg text-xs font-bold ml-2">Beginner</span>
                        </div>

                        {/* Filters & Tabs */}
                        <div className="space-y-4">
                            {/* Filter Row */}
                            <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-hide">
                                <span className="flex items-center gap-1 text-xs font-bold text-gray-400 mr-1 flex-shrink-0">
                                    <Filter className="w-3 h-3" /> Filters:
                                </span>
                                <button className="px-3 py-1.5 bg-white border border-gray-200 rounded-lg text-xs font-bold text-gray-600 flex items-center gap-1 flex-shrink-0 whitespace-nowrap shadow-sm">
                                    All Subjects <ChevronDown className="w-3 h-3 text-gray-400" />
                                </button>
                                <button className="px-3 py-1.5 bg-white border border-gray-200 rounded-lg text-xs font-bold text-gray-600 flex items-center gap-1 flex-shrink-0 whitespace-nowrap shadow-sm">
                                    All Types <ChevronDown className="w-3 h-3 text-gray-400" />
                                </button>
                            </div>

                            {/* Status Tabs */}
                            <div className="bg-white p-1 rounded-xl border border-gray-100 shadow-sm flex">
                                {['active', 'upcoming', 'completed'].map(tab => (
                                    <button
                                        key={tab}
                                        onClick={() => setTournamentSubTab(tab)}
                                        className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all capitalize flex items-center justify-center gap-1.5 ${tournamentSubTab === tab
                                            ? 'bg-[#6C5DD3] text-white shadow-md shadow-[#6C5DD3]/20'
                                            : 'text-gray-500 hover:bg-gray-50'
                                            }`}
                                    >
                                        {tab === 'active' && <Clock className="w-3.5 h-3.5" />}
                                        {tab === 'upcoming' && <Calendar className="w-3.5 h-3.5" />}
                                        {tab}
                                        <span className={`ml-0.5 px-1.5 py-0.5 rounded text-[9px] ${tournamentSubTab === tab ? 'bg-white/20 text-white' : 'bg-gray-100 text-gray-500'}`}>
                                            {tab === 'active' ? '2' : tab === 'upcoming' ? '1' : '0'}
                                        </span>
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Tournament List */}
                        <div className="space-y-4">
                            {tournaments.length === 0 && (
                                <div className="text-center py-10 bg-white rounded-3xl border border-gray-100 border-dashed">
                                    <div className="w-12 h-12 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-3">
                                        <Trophy className="w-6 h-6 text-gray-300" />
                                    </div>
                                    <p className="text-sm font-bold text-gray-900">No tournaments found</p>
                                    <p className="text-xs text-gray-500">Check back later for new competitions</p>
                                </div>
                            )}

                            {tournaments.map(t => (
                                <div key={t.id} className="bg-white rounded-[28px] p-5 border border-gray-100 shadow-sm relative overflow-hidden group hover:border-[#6C5DD3]/30 transition-all">
                                    {/* Header */}
                                    <div className="flex justify-between items-start mb-4">
                                        <div className="flex gap-4">
                                            <div className="w-12 h-12 bg-orange-100 rounded-2xl flex items-center justify-center shadow-inner">
                                                <Trophy className="w-6 h-6 text-orange-500" />
                                            </div>
                                            <div>
                                                <h3 className="font-bold text-gray-900 text-base leading-tight mb-1">{t.name}</h3>
                                                <p className="text-xs font-bold text-[#6C5DD3] bg-[#EBE9FE] px-2 py-0.5 rounded-md inline-block">
                                                    {t.subject || 'General'}
                                                </p>
                                            </div>
                                        </div>
                                        <span className={`px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wide ${t.status === 'upcoming' ? 'bg-gray-100 text-gray-500' : 'bg-green-100 text-green-600'
                                            }`}>
                                            {t.status === 'upcoming' ? 'Upcoming' : 'Open'}
                                        </span>
                                    </div>

                                    {/* Details Row */}
                                    <div className="flex items-center gap-4 mb-5 text-xs font-medium text-gray-500">
                                        <span className="flex items-center gap-1.5">
                                            <Star className="w-3.5 h-3.5 text-gray-400" /> Swiss System
                                        </span>
                                        <span className="flex items-center gap-1.5">
                                            <Calendar className="w-3.5 h-3.5 text-gray-400" /> TBD
                                        </span>
                                    </div>

                                    {/* Prize Pool */}
                                    <div className="bg-gradient-to-r from-orange-50 to-amber-50 rounded-2xl p-4 mb-5 border border-orange-100/50">
                                        <div className="flex justify-between items-center mb-3">
                                            <div>
                                                <p className="text-xs font-medium text-orange-800/60 mb-0.5">Prize Pool</p>
                                                <p className="text-2xl font-black text-orange-500">${t.prize_pool || t.prizePool || 500}</p>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <div className="flex flex-col items-center">
                                                    <span className="text-[10px] font-bold text-orange-400">50%</span>
                                                    <div className="w-1.5 h-1.5 rounded-full bg-orange-400"></div>
                                                </div>
                                                <div className="flex flex-col items-center">
                                                    <span className="text-[10px] font-bold text-gray-400">30%</span>
                                                    <div className="w-1.5 h-1.5 rounded-full bg-gray-300"></div>
                                                </div>
                                                <div className="flex flex-col items-center">
                                                    <span className="text-[10px] font-bold text-orange-300">20%</span>
                                                    <div className="w-1.5 h-1.5 rounded-full bg-orange-200"></div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Progress */}
                                    <div className="mb-2">
                                        <div className="flex justify-between text-xs font-bold text-gray-700 mb-1.5">
                                            <span>{Math.floor(Math.random() * 100) + 20}/128 players</span>
                                            <span className="text-gray-400">39 spots left</span>
                                        </div>
                                        <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                                            <div className="h-full bg-gray-900 rounded-full w-3/4"></div>
                                        </div>
                                    </div>

                                    {/* Rating Req */}
                                    <div className="flex items-center gap-1.5 text-[11px] font-medium text-gray-500 mb-5">
                                        <Star className="w-3 h-3 text-gray-300" />
                                        Rating: <span className="text-gray-900 font-bold">1000 - ∞</span>
                                    </div>

                                    {/* Footer */}
                                    <div className="flex items-center justify-between pt-4 border-t border-gray-50">
                                        <div className="flex items-center gap-1">
                                            <span className="text-lg font-bold text-gray-900">
                                                {t.entry_fee ? `$${t.entry_fee}` : '$20.00'}
                                            </span>
                                            <span className="text-xs text-gray-400 font-medium">entry</span>
                                        </div>
                                        <button
                                            onClick={() => handleJoinTournament(t)}
                                            className="bg-gray-600 text-white px-6 py-3 rounded-xl text-xs font-bold hover:bg-gray-800 transition-colors shadow-lg active:scale-95"
                                        >
                                            Join Tournament
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>

            <BottomNav />
        </div>
    );
}

function BottomNav() {
    const navigate = useNavigate();
    const navItems = [
        { icon: Home, label: 'Home', path: '/dashboard' },
        { icon: BookOpen, label: 'Learn', path: '/dashboard/learn' },
        { icon: Swords, label: 'Arena', path: '/dashboard/arena', active: true },
        { icon: BarChart2, label: 'Leaderboard', path: '/dashboard/leaderboard' },
        { icon: Menu, label: 'More', path: '/dashboard/more' }
    ];
    return (
        <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 flex justify-between items-stretch z-50 shadow-[0_-4px_20px_rgba(0,0,0,0.05)] h-[72px]">
            {navItems.map((item) => (
                <button key={item.label} onClick={() => navigate(item.path)}
                    className={`flex-1 flex flex-col items-center justify-center gap-1 ${item.active ? 'text-[#6C5DD3]' : 'text-gray-400'}`}>
                    <item.icon className="w-5 h-5" />
                    <span className="text-[10px] font-medium">{item.label}</span>
                </button>
            ))}
        </div>
    );
}
