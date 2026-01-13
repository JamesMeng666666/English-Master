import React, { useState, useEffect, useMemo } from 'react';
import { StudyItem, StudyMode, ReviewGrade } from './types';
import { DEFAULT_STUDY_DATA, INTERVALS } from './constants';
import { parseContentWithGemini, playAudio } from './services/geminiService';
import Flashcard from './components/Flashcard';
import Quiz from './components/Quiz';
import VocabularyList from './components/VocabularyList';
import ApiKeyModal from './components/ApiKeyModal';

function App() {
  const [studyData, setStudyData] = useState<StudyItem[]>([]);
  const [mode, setMode] = useState<StudyMode>(StudyMode.DASHBOARD);
  const [apiKey, setApiKey] = useState<string>('');
  const [showKeyModal, setShowKeyModal] = useState(false);
  const [rawInput, setRawInput] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [currentCardIndex, setCurrentCardIndex] = useState(0);

  // Initialize Data
  useEffect(() => {
    // Try to load from local storage
    const savedData = localStorage.getItem('ebbinghaus_data');
    const savedKey = localStorage.getItem('gemini_api_key');

    if (savedData) {
      setStudyData(JSON.parse(savedData));
    } else {
      setStudyData(DEFAULT_STUDY_DATA);
    }

    if (savedKey) setApiKey(savedKey);
  }, []);

  // Save Data on Change
  useEffect(() => {
    if (studyData.length > 0) {
      localStorage.setItem('ebbinghaus_data', JSON.stringify(studyData));
    }
  }, [studyData]);

  // Derived state for stats
  const stats = useMemo(() => {
    const due = studyData.filter(i => i.nextReviewDate <= Date.now()).length;
    const mastered = studyData.filter(i => i.stage >= 6).length;
    const total = studyData.length;
    return { due, mastered, total };
  }, [studyData]);

  // Derived state for current session
  const sessionQueue = useMemo(() => {
    if (mode === StudyMode.FLASHCARD) {
        // Sort by priority: due date asc, then stage asc
        return studyData
            .filter(i => i.nextReviewDate <= Date.now())
            .sort((a, b) => a.nextReviewDate - b.nextReviewDate);
    } else if (mode === StudyMode.QUIZ) {
        // Quiz mode uses items that are at least stage 1 (somewhat familiar)
        return studyData.filter(i => i.stage > 0).sort(() => 0.5 - Math.random());
    }
    return [];
  }, [studyData, mode]);

  const currentItem = sessionQueue[currentCardIndex];

  // Logic to update Ebbinghaus stage based on grade
  const updateCardProgress = (id: string, grade: ReviewGrade) => {
    setStudyData(prevData => prevData.map(item => {
      if (item.id !== id) return item;

      let newStage = item.stage;
      let nextReview = Date.now();

      switch (grade) {
        case 'AGAIN':
          // Reset to beginning.
          newStage = 0;
          nextReview = Date.now() + 60 * 1000; // 1 minute delay (conceptually "immediately")
          break;
        case 'HARD':
          // Don't advance stage, just reschedule for the same interval
          // This reinforces difficult cards without resetting them completely
          // or use a shorter interval (e.g. 0.5 * current interval)
          newStage = Math.max(1, item.stage); 
          nextReview = Date.now() + INTERVALS[newStage];
          break;
        case 'GOOD':
          // Standard progression
          newStage = Math.min(item.stage + 1, INTERVALS.length - 1);
          nextReview = Date.now() + INTERVALS[newStage];
          break;
        case 'EASY':
          // Jump ahead - accelerator
          newStage = Math.min(item.stage + 2, INTERVALS.length - 1);
          nextReview = Date.now() + INTERVALS[newStage];
          break;
      }

      return {
        ...item,
        stage: newStage,
        nextReviewDate: nextReview,
        lastReviewedDate: Date.now()
      };
    }));

    // Move to next card
    if (currentCardIndex < sessionQueue.length - 1) {
      setCurrentCardIndex(prev => prev + 1);
    } else {
      // Session complete
      alert("Session Complete! Great job.");
      setMode(StudyMode.DASHBOARD);
      setCurrentCardIndex(0);
    }
  };

  const handleParseContent = async () => {
    if (!rawInput.trim()) return;
    setIsProcessing(true);
    try {
      const newItems = await parseContentWithGemini(rawInput, apiKey);
      setStudyData(prev => [...prev, ...newItems]);
      setRawInput('');
      setMode(StudyMode.DASHBOARD);
      alert(`Successfully added ${newItems.length} new items!`);
    } catch (error) {
      console.error(error);
      alert("Failed to process content. Please ensure your API Key is valid.");
    } finally {
      setIsProcessing(false);
    }
  };

  const handlePlayAudio = (text: string) => {
    playAudio(text);
  };

  const handleDeleteItem = (id: string) => {
    if (window.confirm('Are you sure you want to delete this item?')) {
        setStudyData(prev => prev.filter(item => item.id !== id));
    }
  };

  return (
    <div className="h-full flex flex-col bg-gray-50">
      <ApiKeyModal 
        isOpen={showKeyModal} 
        onClose={() => setShowKeyModal(false)} 
        onSave={setApiKey} 
      />

      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center sticky top-0 z-10">
        <div className="flex items-center gap-2">
            <div className="bg-primary p-2 rounded-lg">
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"></path></svg>
            </div>
            <h1 className="text-xl font-bold text-gray-800 hidden md:block">MemoCard AI</h1>
        </div>
        <div className="flex gap-4">
             <button 
                onClick={() => setMode(StudyMode.DASHBOARD)} 
                className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${mode === StudyMode.DASHBOARD ? 'bg-gray-100 text-primary' : 'text-gray-500 hover:text-gray-900'}`}
            >
                Dashboard
            </button>
            <button 
                onClick={() => setShowKeyModal(true)}
                className="p-2 text-gray-400 hover:text-gray-600"
                title="Settings"
            >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"></path><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path></svg>
            </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto p-6 flex flex-col items-center">
        
        {/* Dashboard Mode */}
        {mode === StudyMode.DASHBOARD && (
          <div className="w-full max-w-4xl space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col items-center">
                <span className="text-4xl font-bold text-primary mb-2">{stats.due}</span>
                <span className="text-gray-500 font-medium">Cards Due</span>
              </div>
              <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col items-center">
                <span className="text-4xl font-bold text-secondary mb-2">{stats.mastered}</span>
                <span className="text-gray-500 font-medium">Mastered</span>
              </div>
              <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col items-center">
                <span className="text-4xl font-bold text-gray-800 mb-2">{stats.total}</span>
                <span className="text-gray-500 font-medium">Total Items</span>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <button
                onClick={() => {
                    setMode(StudyMode.FLASHCARD);
                    setCurrentCardIndex(0);
                }}
                disabled={stats.due === 0}
                className="bg-primary hover:bg-indigo-600 disabled:bg-gray-300 disabled:cursor-not-allowed text-white p-8 rounded-2xl shadow-lg transition-transform hover:scale-[1.02] flex flex-col items-center justify-center gap-4 group text-center"
              >
                <div className="bg-white/20 p-4 rounded-full">
                    <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"></path></svg>
                </div>
                <div>
                    <h3 className="text-xl font-bold">Review Cards</h3>
                    <p className="text-blue-100 text-sm mt-1">{stats.due} items due</p>
                </div>
              </button>

              <button
                onClick={() => {
                    setMode(StudyMode.QUIZ);
                    setCurrentCardIndex(0);
                }}
                className="bg-secondary hover:bg-emerald-600 text-white p-8 rounded-2xl shadow-lg transition-transform hover:scale-[1.02] flex flex-col items-center justify-center gap-4 text-center"
              >
                 <div className="bg-white/20 p-4 rounded-full">
                    <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"></path></svg>
                </div>
                 <div>
                    <h3 className="text-xl font-bold">Practice Quiz</h3>
                    <p className="text-green-100 text-sm mt-1">Fill-in-the-blanks</p>
                </div>
              </button>

              <button
                onClick={() => setMode(StudyMode.LIST)}
                className="bg-gray-800 hover:bg-gray-900 text-white p-8 rounded-2xl shadow-lg transition-transform hover:scale-[1.02] flex flex-col items-center justify-center gap-4 text-center"
              >
                 <div className="bg-white/20 p-4 rounded-full">
                    <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 10h16M4 14h16M4 18h16"></path></svg>
                </div>
                 <div>
                    <h3 className="text-xl font-bold">View List</h3>
                    <p className="text-gray-300 text-sm mt-1">Show all {stats.total} items</p>
                </div>
              </button>
            </div>

            <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100">
                <h3 className="text-lg font-bold text-gray-800 mb-4">Add New Content</h3>
                <p className="text-gray-500 text-sm mb-4">Paste text, vocabulary lists, or sentences. AI will format it for you.</p>
                <textarea 
                    className="w-full p-4 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary focus:outline-none bg-gray-50 mb-4"
                    rows={4}
                    placeholder="e.g. 1. apple - 苹果 2. banana - 香蕉..."
                    value={rawInput}
                    onChange={(e) => setRawInput(e.target.value)}
                />
                <button 
                    onClick={handleParseContent}
                    disabled={isProcessing}
                    className="w-full md:w-auto px-6 py-3 bg-gray-900 text-white rounded-lg hover:bg-gray-800 disabled:opacity-70 transition-colors flex items-center justify-center gap-2"
                >
                    {isProcessing ? (
                        <>
                            <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                            Processing...
                        </>
                    ) : (
                         <>
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path></svg>
                            Generate Cards with AI
                         </>
                    )}
                </button>
            </div>
          </div>
        )}

        {/* Flashcard Mode */}
        {mode === StudyMode.FLASHCARD && (
          <div className="w-full max-w-4xl flex flex-col items-center justify-center min-h-[60vh]">
            <div className="mb-8 w-full flex justify-between items-center px-4">
                 <button onClick={() => setMode(StudyMode.DASHBOARD)} className="text-gray-500 hover:text-gray-800 flex items-center gap-1">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"></path></svg>
                    Quit
                 </button>
                 <span className="text-sm font-medium text-gray-400">Card {currentCardIndex + 1} of {sessionQueue.length}</span>
            </div>
            
            {currentItem ? (
              <Flashcard 
                item={currentItem} 
                onResult={(grade) => updateCardProgress(currentItem.id, grade)}
                onPlayAudio={handlePlayAudio}
              />
            ) : (
              <div className="text-center">
                <h2 className="text-2xl font-bold text-gray-800 mb-2">All Caught Up!</h2>
                <p className="text-gray-500 mb-6">You have no cards due for review right now.</p>
                <button onClick={() => setMode(StudyMode.DASHBOARD)} className="px-6 py-2 bg-primary text-white rounded-lg">Back to Dashboard</button>
              </div>
            )}
          </div>
        )}

        {/* Quiz Mode */}
        {mode === StudyMode.QUIZ && (
          <div className="w-full max-w-4xl flex flex-col items-center justify-center min-h-[60vh]">
             <div className="mb-8 w-full flex justify-between items-center px-4">
                 <button onClick={() => setMode(StudyMode.DASHBOARD)} className="text-gray-500 hover:text-gray-800 flex items-center gap-1">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"></path></svg>
                    Quit
                 </button>
                 <span className="text-sm font-medium text-gray-400">Question {currentCardIndex + 1} of {sessionQueue.length}</span>
            </div>

            {currentItem ? (
              <Quiz 
                item={currentItem}
                onComplete={(success) => {
                    // Quiz results don't necessarily update flashcard progress in this simplified version,
                    // but we move to next.
                     if (currentCardIndex < sessionQueue.length - 1) {
                        setCurrentCardIndex(prev => prev + 1);
                    } else {
                        alert("Quiz Complete!");
                        setMode(StudyMode.DASHBOARD);
                    }
                }}
              />
             ) : (
                <div className="text-center">
                    <h2 className="text-2xl font-bold text-gray-800 mb-2">Not Enough Data</h2>
                    <p className="text-gray-500 mb-6">Review some flashcards first to unlock quizzes.</p>
                    <button onClick={() => setMode(StudyMode.DASHBOARD)} className="px-6 py-2 bg-primary text-white rounded-lg">Back to Dashboard</button>
                </div>
             )}
          </div>
        )}
        
        {/* List Mode */}
        {mode === StudyMode.LIST && (
            <div className="w-full flex justify-center p-4 h-full">
                <VocabularyList 
                    items={studyData} 
                    onBack={() => setMode(StudyMode.DASHBOARD)}
                    onPlayAudio={handlePlayAudio}
                    onDelete={handleDeleteItem}
                />
            </div>
        )}

      </main>
    </div>
  );
}

export default App;