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
  const [selectedGroup, setSelectedGroup] = useState<string>('All');

  // Initialize Data
  useEffect(() => {
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

  // Available groups
  const groups = useMemo(() => {
    const uniqueGroups = Array.from(new Set(studyData.map(item => item.group)));
    return ['All', ...uniqueGroups.sort()];
  }, [studyData]);

  // Derived filtered items based on selected group
  const filteredStudyData = useMemo(() => {
    if (selectedGroup === 'All') return studyData;
    return studyData.filter(item => item.group === selectedGroup);
  }, [studyData, selectedGroup]);

  // Derived state for stats
  const stats = useMemo(() => {
    const due = filteredStudyData.filter(i => i.nextReviewDate <= Date.now()).length;
    const mastered = filteredStudyData.filter(i => i.stage >= 6).length;
    const total = filteredStudyData.length;
    return { due, mastered, total };
  }, [filteredStudyData]);

  // Derived state for current session
  const sessionQueue = useMemo(() => {
    if (mode === StudyMode.FLASHCARD) {
        return filteredStudyData
            .filter(i => i.nextReviewDate <= Date.now())
            .sort((a, b) => a.nextReviewDate - b.nextReviewDate);
    } else if (mode === StudyMode.QUIZ) {
        return filteredStudyData.filter(i => i.stage > 0).sort(() => 0.5 - Math.random());
    }
    return [];
  }, [filteredStudyData, mode]);

  const currentItem = sessionQueue[currentCardIndex];

  const updateCardProgress = (id: string, grade: ReviewGrade) => {
    setStudyData(prevData => prevData.map(item => {
      if (item.id !== id) return item;

      let newStage = item.stage;
      let nextReview = Date.now();

      switch (grade) {
        case 'AGAIN':
          newStage = 0;
          nextReview = Date.now() + 60 * 1000;
          break;
        case 'HARD':
          newStage = Math.max(1, item.stage); 
          nextReview = Date.now() + INTERVALS[newStage];
          break;
        case 'GOOD':
          newStage = Math.min(item.stage + 1, INTERVALS.length - 1);
          nextReview = Date.now() + INTERVALS[newStage];
          break;
        case 'EASY':
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

    if (currentCardIndex < sessionQueue.length - 1) {
      setCurrentCardIndex(prev => prev + 1);
    } else {
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
      // Default new items to a group based on current selection or input if available
      const groupName = selectedGroup !== 'All' ? selectedGroup : 'Custom';
      const itemsWithGroup = newItems.map(item => ({ ...item, group: groupName }));
      
      setStudyData(prev => [...prev, ...itemsWithGroup]);
      setRawInput('');
      setMode(StudyMode.DASHBOARD);
      alert(`Successfully added ${newItems.length} new items to ${groupName}!`);
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
  
  const handleResetToDefault = () => {
      if(window.confirm("Reload standard textbook content (8AU5 & 8AU6)? Current custom content will be kept if you append.")) {
          // Find IDs from default to avoid duplicates or just replace
          if (window.confirm("Replace everything or append? Cancel to Replace, OK to Append.")) {
              setStudyData(prev => [...prev, ...DEFAULT_STUDY_DATA]);
          } else {
              setStudyData(DEFAULT_STUDY_DATA);
          }
      }
  }

  return (
    <div className="h-full flex flex-col bg-gray-50">
      <ApiKeyModal isOpen={showKeyModal} onClose={() => setShowKeyModal(false)} onSave={setApiKey} />

      <header className="bg-white border-b border-gray-200 px-4 md:px-6 py-2 md:py-4 flex justify-between items-center sticky top-0 z-10 shrink-0">
        <div className="flex items-center gap-2">
            <div className="bg-primary p-1.5 md:p-2 rounded-lg">
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"></path></svg>
            </div>
            <h1 className="text-lg md:text-xl font-bold text-gray-800">MemoCard AI</h1>
        </div>
        <div className="flex gap-2 md:gap-3">
             <button onClick={() => setMode(StudyMode.DASHBOARD)} className={`px-3 py-1.5 md:px-4 md:py-2 rounded-full text-xs md:text-sm font-medium transition-colors ${mode === StudyMode.DASHBOARD ? 'bg-gray-100 text-primary' : 'text-gray-500 hover:text-gray-900'}`}>Dashboard</button>
            <button onClick={() => setShowKeyModal(true)} className="p-1.5 md:p-2 text-gray-400 hover:text-gray-600" title="Settings">
                <svg className="w-5 h-5 md:w-6 md:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"></path><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path></svg>
            </button>
        </div>
      </header>

      <main className="flex-1 overflow-y-auto p-3 md:p-6 flex flex-col items-center">
        {mode === StudyMode.DASHBOARD && (
          <div className="w-full max-w-4xl space-y-4 md:space-y-6">
            {/* Group Switcher - Optimized for Safari Horizontal Scroll */}
            <div className="flex items-center justify-between gap-3">
                <h2 className="text-base md:text-lg font-bold text-gray-800 shrink-0">Study Group</h2>
                <div className="flex-1 min-w-0">
                    <div className="flex overflow-x-auto bg-white rounded-lg p-1 border border-gray-200 no-scrollbar touch-pan-x">
                        {groups.map(g => (
                            <button
                                key={g}
                                onClick={() => setSelectedGroup(g)}
                                className={`shrink-0 px-3 py-1.5 md:px-4 md:py-1.5 text-xs md:text-sm font-medium rounded-md whitespace-nowrap transition-all ${selectedGroup === g ? 'bg-primary text-white shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                            >
                                {g}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* Main Action Buttons */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 md:gap-6">
              <button
                onClick={() => { setMode(StudyMode.FLASHCARD); setCurrentCardIndex(0); }}
                disabled={stats.due === 0}
                className="bg-primary hover:bg-indigo-600 disabled:bg-gray-300 disabled:cursor-not-allowed text-white p-4 md:p-8 rounded-2xl shadow-lg transition-transform hover:scale-[1.02] flex flex-row md:flex-col items-center justify-start md:justify-center gap-4 group text-left md:text-center"
              >
                <div className="bg-white/20 p-3 md:p-4 rounded-full shrink-0">
                    <svg className="w-6 h-6 md:w-8 md:h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"></path></svg>
                </div>
                <div>
                    <h3 className="text-lg md:text-xl font-bold">Review Cards</h3>
                    <p className="text-blue-100 text-xs md:text-sm mt-0.5 md:mt-1">{stats.due} items due</p>
                </div>
              </button>

              <button
                onClick={() => { setMode(StudyMode.QUIZ); setCurrentCardIndex(0); }}
                className="bg-secondary hover:bg-emerald-600 text-white p-4 md:p-8 rounded-2xl shadow-lg transition-transform hover:scale-[1.02] flex flex-row md:flex-col items-center justify-start md:justify-center gap-4 text-left md:text-center"
              >
                 <div className="bg-white/20 p-3 md:p-4 rounded-full shrink-0">
                    <svg className="w-6 h-6 md:w-8 md:h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"></path></svg>
                </div>
                 <div>
                    <h3 className="text-lg md:text-xl font-bold">Practice Quiz</h3>
                    <p className="text-green-100 text-xs md:text-sm mt-0.5 md:mt-1">Fill-in-the-blanks</p>
                </div>
              </button>

              <button
                onClick={() => setMode(StudyMode.LIST)}
                className="bg-gray-800 hover:bg-gray-900 text-white p-4 md:p-8 rounded-2xl shadow-lg transition-transform hover:scale-[1.02] flex flex-row md:flex-col items-center justify-start md:justify-center gap-4 text-left md:text-center"
              >
                 <div className="bg-white/20 p-3 md:p-4 rounded-full shrink-0">
                    <svg className="w-6 h-6 md:w-8 md:h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 10h16M4 14h16M4 18h16"></path></svg>
                </div>
                 <div>
                    <h3 className="text-lg md:text-xl font-bold">View List</h3>
                    <p className="text-gray-300 text-xs md:text-sm mt-0.5 md:mt-1">Show all items</p>
                </div>
              </button>
            </div>

            {/* Stats - Compact */}
            <div className="grid grid-cols-3 gap-3 md:gap-4">
              <div className="bg-white p-3 md:p-4 rounded-xl shadow-sm border border-gray-100 flex flex-col items-center justify-center">
                <span className="text-xl md:text-2xl font-bold text-primary">{stats.due}</span>
                <span className="text-gray-400 text-[10px] md:text-xs uppercase tracking-wider font-semibold">Due</span>
              </div>
              <div className="bg-white p-3 md:p-4 rounded-xl shadow-sm border border-gray-100 flex flex-col items-center justify-center">
                <span className="text-xl md:text-2xl font-bold text-secondary">{stats.mastered}</span>
                <span className="text-gray-400 text-[10px] md:text-xs uppercase tracking-wider font-semibold">Mastered</span>
              </div>
              <div className="bg-white p-3 md:p-4 rounded-xl shadow-sm border border-gray-100 flex flex-col items-center justify-center">
                <span className="text-xl md:text-2xl font-bold text-gray-800">{stats.total}</span>
                <span className="text-gray-400 text-[10px] md:text-xs uppercase tracking-wider font-semibold">Total</span>
              </div>
            </div>

            {/* Add Content - Compacted for Mobile */}
            <div className="bg-white p-4 md:p-8 rounded-2xl shadow-sm border border-gray-100 relative">
                <div className="flex justify-between items-center mb-2 md:mb-4">
                     <h3 className="text-base md:text-lg font-bold text-gray-800">Add Content</h3>
                     <button onClick={handleResetToDefault} className="text-xs text-primary hover:text-indigo-700 hover:underline font-medium">Reset</button>
                </div>
                <p className="text-gray-500 text-xs md:text-sm mb-2 md:mb-4">Paste text to add to <strong>{selectedGroup !== 'All' ? selectedGroup : 'Custom'}</strong>.</p>
                <textarea className="w-full p-3 md:p-4 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary focus:outline-none bg-gray-50 mb-3 md:mb-4 text-sm" rows={2} placeholder="e.g. 1. apple - 苹果..." value={rawInput} onChange={(e) => setRawInput(e.target.value)} />
                <button onClick={handleParseContent} disabled={isProcessing} className="w-full md:w-auto px-4 py-2 md:px-6 md:py-3 bg-gray-900 text-white rounded-lg hover:bg-gray-800 disabled:opacity-70 transition-colors flex items-center justify-center gap-2 text-sm md:text-base">
                    {isProcessing ? (<><svg className="animate-spin h-4 w-4 md:h-5 md:w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>Processing...</>) : (<><svg className="w-4 h-4 md:w-5 md:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path></svg>Generate Cards</>)}
                </button>
            </div>
          </div>
        )}

        {mode === StudyMode.FLASHCARD && (
          <div className="w-full max-w-4xl flex flex-col items-center justify-center min-h-[60vh]">
            <div className="mb-8 w-full flex justify-between items-center px-4">
                 <button onClick={() => setMode(StudyMode.DASHBOARD)} className="text-gray-500 hover:text-gray-800 flex items-center gap-1"><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"></path></svg>Quit</button>
                 <span className="text-sm font-medium text-gray-400">{selectedGroup} - Card {currentCardIndex + 1} of {sessionQueue.length}</span>
            </div>
            {currentItem ? (<Flashcard item={currentItem} onResult={(grade) => updateCardProgress(currentItem.id, grade)} onPlayAudio={handlePlayAudio} />) : (
              <div className="text-center">
                <h2 className="text-2xl font-bold text-gray-800 mb-2">All Caught Up!</h2>
                <p className="text-gray-500 mb-6">No more cards due for {selectedGroup} right now.</p>
                <button onClick={() => setMode(StudyMode.DASHBOARD)} className="px-6 py-2 bg-primary text-white rounded-lg">Back to Dashboard</button>
              </div>
            )}
          </div>
        )}

        {mode === StudyMode.QUIZ && (
          <div className="w-full max-w-4xl flex flex-col items-center justify-center min-h-[60vh]">
             <div className="mb-8 w-full flex justify-between items-center px-4">
                 <button onClick={() => setMode(StudyMode.DASHBOARD)} className="text-gray-500 hover:text-gray-800 flex items-center gap-1"><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"></path></svg>Quit</button>
                 <span className="text-sm font-medium text-gray-400">{selectedGroup} - Question {currentCardIndex + 1} of {sessionQueue.length}</span>
            </div>
            {currentItem ? (<Quiz item={currentItem} onComplete={() => { if (currentCardIndex < sessionQueue.length - 1) { setCurrentCardIndex(prev => prev + 1); } else { alert("Quiz Complete!"); setMode(StudyMode.DASHBOARD); } }} />) : (
                <div className="text-center">
                    <h2 className="text-2xl font-bold text-gray-800 mb-2">Not Enough Data</h2>
                    <p className="text-gray-500 mb-6">Review {selectedGroup} flashcards first to unlock quizzes.</p>
                    <button onClick={() => setMode(StudyMode.DASHBOARD)} className="px-6 py-2 bg-primary text-white rounded-lg">Back to Dashboard</button>
                </div>
             )}
          </div>
        )}
        
        {mode === StudyMode.LIST && (
            <div className="w-full flex justify-center p-4 h-full">
                <VocabularyList items={studyData} onBack={() => setMode(StudyMode.DASHBOARD)} onPlayAudio={handlePlayAudio} onDelete={handleDeleteItem} />
            </div>
        )}
      </main>
    </div>
  );
}

export default App;