import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { 
  ChevronRight, Mic, BookOpen, Zap, Square, RotateCcw, ArrowRight, Volume2, CheckCircle, XCircle 
} from 'lucide-react';
import { LearnCard, CourseLevelCard, LessonCard, SkillBar } from '../components/DashboardComponents';
import api from '../api/api';

export default function Learn() {
    const navigate = useNavigate();
    const location = useLocation();
    
    // Data States
    const [subjects, setSubjects] = useState([]);
    const [courses, setCourses] = useState([]);
    const [lessons, setLessons] = useState([]);
    
    // Selection States
    const [selectedSubject, setSelectedSubject] = useState(null);
    const [selectedCourse, setSelectedCourse] = useState(null);
    const [loading, setLoading] = useState(false);
    
    // Tab States
    const [activeChapterTab, setActiveChapterTab] = useState('lessons'); 
    
    // Speaking Feature States
    const [speakingStatus, setSpeakingStatus] = useState('idle'); // idle, recording, processing, result
    const [speakingResult, setSpeakingResult] = useState(null);
    const mediaRecorderRef = useRef(null);
    const audioChunksRef = useRef([]);

    // Quiz Feature States
    const [quiz, setQuiz] = useState(null);
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
    const [userAnswers, setUserAnswers] = useState({}); // { questionId: selectedIndex }
    const [quizResult, setQuizResult] = useState(null);
    const [isSubmittingQuiz, setIsSubmittingQuiz] = useState(false);

    // 1. Fetch Subjects
    useEffect(() => {
        const fetchSubjects = async () => {
            try {
                const res = await api.get('/courses/subjects');
                setSubjects(res.data.subjects || []);
            } catch (err) {
                console.error("Failed to fetch subjects", err);
            }
        };
        fetchSubjects();
    }, []);

    // Handle auto-selection from navigation state
    useEffect(() => {
        if (location.state?.subjectName && subjects.length > 0) {
            const found = subjects.find(s => s.name.toLowerCase() === location.state.subjectName.toLowerCase());
            if (found) {
                setSelectedSubject(found);
            }
        }
    }, [location.state, subjects]);

    // 2. Fetch Courses
    useEffect(() => {
        if (selectedSubject) {
            setLoading(true);
            const fetchCourses = async () => {
                try {
                    const res = await api.get(`/courses/subjects/${selectedSubject.id}/courses`);
                    setCourses(res.data.courses || []);
                } catch (err) {
                    console.error("Failed to fetch courses", err);
                } finally {
                    setLoading(false);
                }
            };
            fetchCourses();
        }
    }, [selectedSubject]);

    // 3. Fetch Lessons
    useEffect(() => {
        if (selectedCourse) {
            setLoading(true);
            const fetchLessons = async () => {
                try {
                    const res = await api.get('/lessons/course/' + selectedCourse.id);
                    setLessons(res.data.lessons || []);
                } catch (err) {
                    console.error("Failed to fetch lessons", err);
                } finally {
                    setLoading(false);
                }
            };
            fetchLessons();
        }
    }, [selectedCourse]);

    // 4. Load Quiz when tab selected
    useEffect(() => {
        if (activeChapterTab === 'quick-start' && !quiz) {
            api.get('/quiz/daily')
               .then(res => setQuiz(res.data.quiz))
               .catch(err => console.error("Failed to fetch quiz", err));
        }
    }, [activeChapterTab, quiz]);

    // --- Speaking Logic ---
    const startRecording = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            const mediaRecorder = new MediaRecorder(stream);
            mediaRecorderRef.current = mediaRecorder;
            audioChunksRef.current = [];
            
            mediaRecorder.ondataavailable = (event) => {
                if (event.data.size > 0) audioChunksRef.current.push(event.data);
            };

            mediaRecorder.onstop = () => {
                // In a real app, upload blob to S3. Here we simulate upload.
                const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
                const blobUrl = URL.createObjectURL(audioBlob);
                submitSpeaking(blobUrl);
                
                // Stop all tracks to release mic
                stream.getTracks().forEach(track => track.stop());
            };

            mediaRecorder.start();
            setSpeakingStatus('recording');
        } catch (err) {
            console.error('Microphone error:', err);
            alert('Could not access microphone. Please allow permissions.');
        }
    };

    const stopRecording = () => {
        if (mediaRecorderRef.current && speakingStatus === 'recording') {
            mediaRecorderRef.current.stop();
            setSpeakingStatus('processing');
        }
    };

    const submitSpeaking = async (audioUrl) => {
        try {
            const res = await api.post('/speaking/submit', {
                prompt: 'Describe your daily routine',
                audioUrl: 'simulated_upload.mp3' // We send a string as DB expects string
            });
            setSpeakingResult(res.data);
            setSpeakingStatus('result');
        } catch (err) {
            console.error('Submission failed', err);
            setSpeakingStatus('idle');
            alert('Failed to submit recording.');
        }
    };

    // --- Quiz Logic ---
    const handleQuizSelect = (optionIndex) => {
        if (!quiz) return;
        const currentQ = quiz.questions[currentQuestionIndex];
        setUserAnswers(prev => ({ ...prev, [currentQ.id]: optionIndex }));
    };

    const handleQuizNext = () => {
        if (currentQuestionIndex < quiz.questions.length - 1) {
            setCurrentQuestionIndex(prev => prev + 1);
        } else {
            submitQuiz();
        }
    };

    const submitQuiz = async () => {
        setIsSubmittingQuiz(true);
        try {
            const res = await api.post('/quiz/submit', {
                quizId: quiz.id,
                answers: userAnswers
            });
            setQuizResult(res.data);
        } catch (err) {
            console.error('Quiz submission failed', err);
            alert('Failed to submit quiz.');
        } finally {
            setIsSubmittingQuiz(false);
        }
    };

    // Helper
    const getSubjectMeta = (name) => {
        const metas = {
            'English': { color: 'bg-blue-500', badge: 'Beginner' },
            'Spanish': { color: 'bg-orange-500', badge: 'Beginner' },
            'French': { color: 'bg-purple-500', badge: 'Intermediate' },
            'German': { color: 'bg-orange-500', badge: 'Fluent' },
            'Math': { color: 'bg-emerald-500', badge: 'Advanced' }
        };
        return metas[name] || { color: 'bg-blue-500', badge: 'Beginner' };
    };

    return (
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 h-full">
            {!selectedSubject ? (
                /* SUBJECT LIST */
                <>
                    <div className="mb-6">
                        <h2 className="text-2xl font-bold text-gray-900">Learn</h2>
                        <p className="text-gray-500 text-sm">Choose a subject to start training</p>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                        {subjects.map((sub) => {
                            const meta = getSubjectMeta(sub.name);
                            return (
                                <LearnCard key={sub.id} title={`Learn ${sub.name}`} badge={meta.badge} flag={sub.icon} mastery={0} pvp={0} color={meta.color} onClick={() => setSelectedSubject(sub)} />
                            );
                        })}
                        {subjects.length === 0 && <div className="col-span-full py-10 text-center text-gray-400">Loading subjects...</div>}
                    </div>
                </>
            ) : !selectedCourse ? (
                /* COURSE LIST */
                <div className="h-full">
                    <div className="flex items-center gap-4 mb-6">
                        <button onClick={() => setSelectedSubject(null)} className="w-10 h-10 rounded-full bg-white border border-gray-100 flex items-center justify-center text-gray-600 shadow-sm active:scale-90 transition-transform">
                            <ChevronRight className="w-5 h-5 rotate-180" />
                        </button>
                        <h2 className="text-xl font-bold text-gray-900 mx-auto pr-10">Browse Course</h2>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                        {courses.map((course) => {
                             const meta = getSubjectMeta(selectedSubject.name);
                             return (
                                <CourseLevelCard key={course.id} title={course.title} level={course.level} progress={0} flag={selectedSubject.icon} color={meta.color} onClick={() => setSelectedCourse(course)} />
                             );
                        })}
                        {courses.length === 0 && !loading && <div className="col-span-full py-10 text-center text-gray-400">No courses available.</div>}
                    </div>
                </div>
            ) : (
                /* LESSON / INTERACTIVE VIEW */
                <div className="h-full animate-in fade-in slide-in-from-bottom-4 duration-500 flex flex-col bg-gray-50/50">
                     {/* Header */}
                     <div className="bg-white px-4 py-4 border-b border-gray-100 sticky top-0 z-10 transition-all">
                         <div className="flex items-center justify-between mb-4">
                             <button onClick={() => setSelectedCourse(null)} className="w-8 h-8 rounded-full bg-gray-50 border border-gray-100 flex items-center justify-center text-gray-600 active:bg-gray-200">
                                 <ChevronRight className="w-5 h-5 rotate-180" />
                             </button>
                             <h2 className="text-lg font-bold text-gray-900">{selectedCourse.title}</h2>
                             <div className="w-8"></div>
                         </div>
                         <div className="flex justify-between items-end mb-2 px-1">
                              <h3 className="font-bold text-gray-900 text-base">{selectedCourse.level}</h3>
                              <span className="text-blue-600 font-bold text-lg">0%</span>
                         </div>
                         <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                              <div className="w-[0%] h-full bg-blue-600 rounded-full"></div>
                         </div>
                     </div>

                     <div className="flex-1 overflow-y-auto p-4 pb-24">
                        {/* Tabs */}
                        <div className="flex items-center gap-2 mb-4 overflow-x-auto hide-scrollbar pb-2">
                            {['lessons', 'speaking', 'quick-start'].map(tab => (
                                <button key={tab} onClick={() => setActiveChapterTab(tab)} 
                                    className={`px-4 py-2.5 rounded-full text-xs font-bold shrink-0 flex items-center gap-2 border transition-all ${
                                        activeChapterTab === tab ? 'bg-[#6C5DD3] text-white border-transparent shadow-md' : 'bg-white text-gray-500 border-gray-200'
                                    }`}>
                                    {tab === 'lessons' ? <BookOpen className="w-4 h-4" /> : tab === 'speaking' ? <Mic className="w-4 h-4" /> : <Zap className="w-4 h-4" />}
                                    {tab === 'lessons' ? 'Lessons' : tab === 'speaking' ? 'Speaking Practice' : 'Quick Quiz'}
                                </button>
                            ))}
                        </div>

                        {/* 1. LESSONS TAB */}
                        {activeChapterTab === 'lessons' && (
                            <div className="space-y-4">
                                {lessons.length > 0 && (
                                    <div className="bg-[#F0F2FF] border border-indigo-50 p-5 rounded-[24px] relative shadow-sm">
                                        <div className="flex gap-4 mb-4">
                                            <div className="w-12 h-12 bg-indigo-100 rounded-2xl flex items-center justify-center text-indigo-600 shrink-0"><Mic className="w-6 h-6" /></div>
                                            <div className="flex-1"><h4 className="font-bold text-gray-900 text-base mb-1">{lessons[0].title}</h4><p className="text-xs text-gray-500 leading-tight">Current Lesson</p></div>
                                        </div>
                                        <button onClick={() => navigate(`${lessons[0].id}`)} className="w-full py-3 bg-[#6C5DD3] text-white rounded-xl text-sm font-bold shadow-lg shadow-indigo-200 flex items-center justify-center gap-2 hover:bg-indigo-600 active:scale-95 transition-all">
                                            <span className="bg-white/20 p-1 rounded-full"><Zap className="w-3 h-3 fill-current" /></span> Continue
                                        </button>
                                    </div>
                                )}
                                {lessons.map((lesson) => (
                                    <LessonCard key={lesson.id} title={lesson.title} desc={`Learn about ${lesson.title}`} time="5 min" progress={0} 
                                        type={lesson.title.includes('Speaking') ? 'Speaking' : undefined} 
                                        icon={lesson.title.includes('Speaking') ? <Mic className="w-5 h-5 text-indigo-500" /> : <BookOpen className="w-5 h-5 text-gray-400" />} 
                                        onClick={() => navigate(`${lesson.id}`)} />
                                ))}
                                {lessons.length === 0 && !loading && <div className="text-center text-gray-400 py-10">No lessons found.</div>}
                            </div>
                        )}

                        {/* 2. SPEAKING TAB */}
                        {activeChapterTab === 'speaking' && (
                            <div className="space-y-6">
                                {speakingStatus === 'idle' || speakingStatus === 'recording' || speakingStatus === 'processing' ? (
                                    <div className="bg-white border border-gray-100 p-6 rounded-[24px] flex flex-col items-center text-center shadow-sm min-h-[400px]">
                                         <h3 className="text-lg font-bold text-gray-900 mb-2">Practice Speaking</h3>
                                         <p className="text-gray-500 text-sm mb-6">"Describe your daily routine."</p>
                                         <div className="flex-1 flex flex-col items-center justify-center w-full">
                                             <div className="relative">
                                                 {speakingStatus === 'recording' && <div className="absolute inset-0 bg-red-500 rounded-full animate-ping opacity-20 scale-150"></div>}
                                                 <button onClick={speakingStatus === 'recording' ? stopRecording : startRecording}
                                                    className={`w-24 h-24 rounded-full flex items-center justify-center text-white shadow-xl transition-all z-10 relative ${speakingStatus === 'recording' ? 'bg-red-500' : 'bg-[#6C5DD3]'}`}>
                                                     {speakingStatus === 'recording' ? <Square className="w-8 h-8 fill-current" /> : <Mic className="w-8 h-8" />}
                                                 </button>
                                             </div>
                                             <p className="text-xs text-gray-400 mt-6 font-bold uppercase tracking-wider">
                                                {speakingStatus === 'idle' ? 'Tap to Record' : speakingStatus === 'recording' ? 'Recording...' : 'Analyzing...'}
                                             </p>
                                         </div>
                                    </div>
                                ) : (
                                    <div className="space-y-4 animate-in slide-in-from-bottom-5">
                                        <div className="bg-emerald-50 border border-emerald-100 p-5 rounded-[24px] flex items-center justify-between">
                                            <span className="font-bold text-gray-500 text-xs">Overall Score</span>
                                            <span className="font-bold text-emerald-500 text-3xl">{speakingResult?.result?.overall_score || 0}</span>
                                        </div>
                                        <SkillBar label="Pronunciation" value={speakingResult?.result?.pronunciation_score || 0} color="bg-emerald-500" />
                                        <SkillBar label="Fluency" value={speakingResult?.result?.fluency_score || 0} color="bg-emerald-500" />
                                        <div className="bg-yellow-50 border border-yellow-100 p-4 rounded-[20px] text-yellow-800 text-xs">
                                            <strong>Feedback:</strong> {speakingResult?.feedback}
                                        </div>
                                        <button onClick={() => setSpeakingStatus('idle')} className="w-full py-3.5 border border-gray-200 rounded-xl text-xs font-bold text-gray-900 hover:bg-gray-50 flex items-center justify-center gap-2">
                                            <RotateCcw className="w-4 h-4" /> Try Again
                                        </button>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* 3. QUIZ TAB */}
                        {activeChapterTab === 'quick-start' && (
                            <div className="h-full">
                                {!quiz ? (
                                    <div className="text-center py-20 text-gray-400">Loading quiz...</div>
                                ) : !quizResult ? (
                                    <div className="bg-white border border-gray-100 p-6 rounded-[24px] shadow-sm min-h-[400px] flex flex-col">
                                        <div className="flex justify-between items-center mb-6">
                                            <span className="text-xs font-bold text-gray-400">Question {currentQuestionIndex + 1} of {quiz.questions.length}</span>
                                            <span className="px-2 py-0.5 bg-blue-50 text-blue-600 rounded text-[10px] font-bold">Daily Challenge</span>
                                        </div>
                                        <h3 className="text-lg font-bold text-gray-900 mb-6">{quiz.questions[currentQuestionIndex].question}</h3>
                                        
                                        <div className="space-y-3 flex-1">
                                            {quiz.questions[currentQuestionIndex].options.map((opt, idx) => (
                                                <button key={idx} onClick={() => handleQuizSelect(idx)}
                                                    className={`w-full p-4 rounded-xl text-left text-sm font-medium border transition-all ${
                                                        userAnswers[quiz.questions[currentQuestionIndex].id] === idx 
                                                        ? 'bg-indigo-50 border-indigo-500 text-indigo-700' 
                                                        : 'bg-white border-gray-200 text-gray-700 hover:border-gray-300'
                                                    }`}>
                                                    {opt}
                                                </button>
                                            ))}
                                        </div>

                                        <button 
                                            onClick={handleQuizNext}
                                            disabled={userAnswers[quiz.questions[currentQuestionIndex].id] === undefined || isSubmittingQuiz}
                                            className="w-full mt-6 py-3 bg-black text-white rounded-xl font-bold disabled:opacity-50 flex items-center justify-center gap-2"
                                        >
                                            {isSubmittingQuiz ? 'Submitting...' : currentQuestionIndex < quiz.questions.length - 1 ? 'Next Question' : 'Submit Quiz'}
                                            {!isSubmittingQuiz && <ArrowRight className="w-4 h-4" />}
                                        </button>
                                    </div>
                                ) : (
                                    <div className="bg-white border border-gray-100 p-6 rounded-[24px] shadow-sm text-center">
                                        <div className="w-20 h-20 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-4">
                                            <Zap className="w-10 h-10 fill-current" />
                                        </div>
                                        <h3 className="text-2xl font-bold text-gray-900 mb-1">Quiz Complete!</h3>
                                        <p className="text-gray-500 mb-6">You scored {quizResult.score} out of {quizResult.total}</p>
                                        
                                        <div className="space-y-3 mb-6">
                                            {quiz.questions.map((q, i) => {
                                                const res = quizResult.results[q.id];
                                                return (
                                                    <div key={q.id} className={`p-3 rounded-xl border text-left text-xs ${res.correct ? 'bg-emerald-50 border-emerald-100 text-emerald-800' : 'bg-red-50 border-red-100 text-red-800'}`}>
                                                        <div className="flex items-center gap-2 font-bold mb-1">
                                                            {res.correct ? <CheckCircle className="w-4 h-4" /> : <XCircle className="w-4 h-4" />}
                                                            Question {i+1}
                                                        </div>
                                                        <p className="opacity-80">{q.question}</p>
                                                        {!res.correct && <p className="mt-1 font-bold">Answer: {q.options[res.correctAnswer]}</p>}
                                                    </div>
                                                )
                                            })}
                                        </div>

                                        <button onClick={() => { setQuizResult(null); setCurrentQuestionIndex(0); setUserAnswers({}); }} 
                                            className="w-full py-3 border border-gray-200 rounded-xl font-bold text-gray-900">
                                            Retake Quiz
                                        </button>
                                    </div>
                                )}
                            </div>
                        )}

                    </div>
                </div>
            )}
        </div>
    );
}
