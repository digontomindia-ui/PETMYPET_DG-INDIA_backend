import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, CheckCircle, Play, FileText } from 'lucide-react';
import api from '../api/api';

export default function Lesson() {
    const { lessonId } = useParams();
    const navigate = useNavigate();
    const [lesson, setLesson] = useState(null);
    const [loading, setLoading] = useState(true);
    const [completing, setCompleting] = useState(false);

    useEffect(() => {
        const fetchLesson = async () => {
            try {
                const res = await api.get(`/lessons/${lessonId}`);
                setLesson(res.data.lesson);
            } catch (err) {
                console.error("Failed to fetch lesson", err);
            } finally {
                setLoading(false);
            }
        };
        fetchLesson();
    }, [lessonId]);

    const handleComplete = async () => {
        setCompleting(true);
        try {
            await api.post(`/lessons/${lessonId}/complete`);
            // Go back to course view
            navigate('/dashboard/learn');
        } catch (err) {
            console.error("Failed to complete lesson", err);
        } finally {
            setCompleting(false);
        }
    };

    if (loading) return <div className="p-8 text-center text-gray-500">Loading lesson...</div>;
    if (!lesson) return <div className="p-8 text-center text-gray-500">Lesson not found.</div>;

    return (
        <div className="h-full bg-white rounded-[32px] p-6 shadow-sm border border-gray-100 flex flex-col">
            <div className="flex items-center gap-4 mb-6">
                <button 
                    onClick={() => navigate('/dashboard/learn')}
                    className="w-10 h-10 rounded-full bg-gray-50 border border-gray-100 flex items-center justify-center text-gray-600 hover:bg-gray-100 transition-colors"
                >
                    <ArrowLeft className="w-5 h-5" />
                </button>
                <div className="flex-1">
                    <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Lesson {lesson.lesson_order}</p>
                    <h1 className="text-xl font-bold text-gray-900">{lesson.title}</h1>
                </div>
            </div>

            <div className="flex-1 bg-gray-50 rounded-2xl p-8 flex flex-col items-center justify-center text-center mb-6 border border-gray-100">
                <div className="w-20 h-20 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center mb-6">
                    <Play className="w-8 h-8 fill-current ml-1" />
                </div>
                <h3 className="text-lg font-bold text-gray-900 mb-2">Video Content Placeholder</h3>
                <p className="text-gray-500 text-sm max-w-md">
                    Imagine an engaging video lesson here teaching you about <strong>{lesson.title}</strong>.
                </p>
            </div>

            <div className="space-y-4">
                 <div className="bg-blue-50 p-4 rounded-xl border border-blue-100 flex gap-3 text-blue-800">
                    <FileText className="w-5 h-5 shrink-0" />
                    <div className="text-sm">
                        <p className="font-bold mb-1">Study Notes</p>
                        <p className="opacity-80 text-xs">Read the key concepts before completing this lesson.</p>
                    </div>
                 </div>

                 <button 
                    onClick={handleComplete}
                    disabled={completing}
                    className="w-full py-4 bg-[#6C5DD3] text-white rounded-xl font-bold shadow-lg shadow-indigo-200 flex items-center justify-center gap-2 hover:bg-indigo-600 active:scale-[0.98] transition-all disabled:opacity-50"
                 >
                    {completing ? 'Completing...' : (
                        <>
                            <CheckCircle className="w-5 h-5" /> Complete Lesson
                        </>
                    )}
                 </button>
            </div>
        </div>
    );
}
