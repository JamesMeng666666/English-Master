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
  const [targetGroup, setTargetGroup] = useState<string>('Custom');

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

  // Sync target group when selected group changes
  useEffect(() => {
    setTargetGroup(selectedGroup === 'All' ? 'Custom' : selectedGroup);
  }, [selectedGroup]);

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
      // Use the user-defined target group
      const groupName = targetGroup.trim() || 'Custom';
      const itemsWithGroup = newItems.map(item => ({ ...item, group: groupName }));
      
      setStudyData(prev => [...prev, ...itemsWithGroup]);
      setRawInput('');
      
      // Auto-switch to the new group if needed so user sees their new items immediately
      if (selectedGroup !== groupName && selectedGroup !== 'All') {
          setSelectedGroup(groupName);
      }
      
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
      if(window.confirm("Reload standard textbook content (8AU1, 8AU2, 8AU3, 8AU4, 8AU5, 8AU6, 8AU7, 8AU8)? Current custom content will be kept if you append.")) {
          // Find IDs from default to avoid duplicates or just replace
          if (window.confirm("Replace everything or append? Cancel to Replace, OK to Append.")) {
              setStudyData(prev => [...prev, ...DEFAULT_STUDY_DATA]);
          } else {
              setStudyData(DEFAULT_STUDY_DATA);
          }
      }
  }

  return (
    <div className="h-full flex flex-col bg-paper">
      <ApiKeyModal isOpen={showKeyModal} onClose={() => setShowKeyModal(false)} onSave={setApiKey} />

      <header className="bg-surface border-b border-gray-100 px-4 md:px-6 py-2 md:py-4 flex justify-between items-center sticky top-0 z-10 shrink-0 shadow-sm">
        <div className="flex items-center gap-2">
            <div className="bg-primary p-1.5 md:p-2 rounded-lg shadow-sm">
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"></path></svg>
            </div>
            <h1 className="text-lg md:text-xl font-bold text-gray-800 tracking-tight">MemoCard AI</h1>
        </div>
        <div className="flex gap-2 md:gap-3">
             <button onClick={() => setMode(StudyMode.DASHBOARD)} className={`px-3 py-1.5 md:px-4 md:py-2 rounded-full text-xs md:text-sm font-medium transition-colors ${mode === StudyMode.DASHBOARD ? 'bg-indigo-50 text-primary' : 'text-gray-500 hover:text-gray-900'}`}>Dashboard</button>
            <button onClick={() => setShowKeyModal(true)} className="p-1.5 md:p-2 text-gray-400 hover:text-gray-600" title="Settings">
                <svg className="w-5 h-5 md:w-6 md:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"></path><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path></svg>
            </button>
        </div>
      </header>

      <main className="flex-1 overflow-y-auto p-3 md:p-6 flex flex-col items-center">
        {mode === StudyMode.DASHBOARD && (
          <div className="w-full max-w-4xl space-y-4 md:space-y-6">
            {/* Group Switcher */}
            <div className="flex items-center justify-between gap-3">
                <h2 className="text-base md:text-lg font-bold text-gray-800 shrink-0">Study Group</h2>
                <div className="flex-1 min-w-0">
                    <div className="flex overflow-x-auto bg-surface rounded-xl p-1.5 border border-gray-100 no-scrollbar touch-pan-x shadow-sm">
                        {groups.map(g => (
                            <button
                                key={g}
                                onClick={() => setSelectedGroup(g)}
                                className={`shrink-0 px-3 py-1.5 md:px-4 md:py-1.5 text-xs md:text-sm font-medium rounded-lg whitespace-nowrap transition-all ${selectedGroup === g ? 'bg-primary text-white shadow-md' : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'}`}
                            >
                                {g}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* Main Action Buttons - Eye Friendly Colors */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 md:gap-6">
              <button
                onClick={() => { setMode(StudyMode.FLASHCARD); setCurrentCardIndex(0); }}
                disabled={stats.due === 0}
                className="bg-white border-2 border-primary/10 hover:border-primary/30 text-gray-800 p-4 md:p-8 rounded-2xl shadow-sm hover:shadow-md transition-all flex flex-row md:flex-col items-center justify-start md:justify-center gap-4 group text-left md:text-center"
              >
                <div className="bg-primary/10 p-3 md:p-4 rounded-full shrink-0 group-hover:bg-primary group-hover:text-white transition-colors text-primary">
                    <svg className="w-6 h-6 md:w-8 md:h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"></path></svg>
                </div>
                <div>
                    <h3 className="text-lg md:text-xl font-bold text-gray-800 group-hover:text-primary transition-colors">Review Cards</h3>
                    <p className="text-gray-400 text-xs md:text-sm mt-0.5 md:mt-1">{stats.due} items due</p>
                </div>
              </button>

              <button
                onClick={() => { setMode(StudyMode.QUIZ); setCurrentCardIndex(0); }}
                className="bg-white border-2 border-secondary/10 hover:border-secondary/30 text-gray-800 p-4 md:p-8 rounded-2xl shadow-sm hover:shadow-md transition-all flex flex-row md:flex-col items-center justify-start md:justify-center gap-4 group text-left md:text-center"
              >
                 <div className="bg-secondary/10 p-3 md:p-4 rounded-full shrink-0 group-hover:bg-secondary group-hover:text-white transition-colors text-secondary">
                    <svg className="w-6 h-6 md:w-8 md:h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"></path></svg>
                </div>
                 <div>
                    <h3 className="text-lg md:text-xl font-bold text-gray-800 group-hover:text-secondary transition-colors">Practice Quiz</h3>
                    <p className="text-gray-400 text-xs md:text-sm mt-0.5 md:mt-1">Fill-in-the-blanks</p>
                </div>
              </button>

              <button
                onClick={() => setMode(StudyMode.LIST)}
                className="bg-white border-2 border-gray-100 hover:border-gray-300 text-gray-800 p-4 md:p-8 rounded-2xl shadow-sm hover:shadow-md transition-all flex flex-row md:flex-col items-center justify-start md:justify-center gap-4 group text-left md:text-center"
              >
                 <div className="bg-gray-100 p-3 md:p-4 rounded-full shrink-0 group-hover:bg-gray-800 group-hover:text-white transition-colors text-gray-500">
                    <svg className="w-6 h-6 md:w-8 md:h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 10h16M4 14h16M4 18h16"></path></svg>
                </div>
                 <div>
                    <h3 className="text-lg md:text-xl font-bold text-gray-800 group-hover:text-gray-900 transition-colors">View List</h3>
                    <p className="text-gray-400 text-xs md:text-sm mt-0.5 md:mt-1">Show all items</p>
                </div>
              </button>
            </div>

            {/* Stats - Compact */}
            <div className="grid grid-cols-3 gap-3 md:gap-4">
              <div className="bg-surface p-3 md:p-4 rounded-xl shadow-sm border border-gray-100 flex flex-col items-center justify-center">
                <span className="text-xl md:text-2xl font-bold text-primary">{stats.due}</span>
                <span className="text-gray-400 text-[10px] md:text-xs uppercase tracking-wider font-semibold">Due</span>
              </div>
              <div className="bg-surface p-3 md:p-4 rounded-xl shadow-sm border border-gray-100 flex flex-col items-center justify-center">
                <span className="text-xl md:text-2xl font-bold text-secondary">{stats.mastered}</span>
                <span className="text-gray-400 text-[10px] md:text-xs uppercase tracking-wider font-semibold">Mastered</span>
              </div>
              <div className="bg-surface p-3 md:p-4 rounded-xl shadow-sm border border-gray-100 flex flex-col items-center justify-center">
                <span className="text-xl md:text-2xl font-bold text-gray-800">{stats.total}</span>
                <span className="text-gray-400 text-[10px] md:text-xs uppercase tracking-wider font-semibold">Total</span>
              </div>
            </div>

            {/* Add Content - Redesigned Input for Visibility */}
            <div className="bg-surface p-4 md:p-8 rounded-2xl shadow-sm border border-gray-100 relative">
                <div className="flex justify-between items-center mb-4 md:mb-5">
                     <h3 className="text-base md:text-lg font-bold text-gray-800">Add New Content</h3>
                     <button onClick={handleResetToDefault} className="text-xs text-gray-400 hover:text-primary hover:underline font-medium">Reset Default</button>
                </div>
                
                <div className="space-y-4">
                  {/* High visibility Input Group */}
                  <div className="flex items-center gap-3 bg-gray-50 p-1.5 rounded-xl border border-gray-200 focus-within:ring-2 focus-within:ring-primary focus-within:border-primary transition-all">
                     <div className="bg-white px-3 py-2 rounded-lg border border-gray-100 shadow-sm shrink-0">
                        <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Group</label>
                     </div>
                     <input 
                        type="text" 
                        value={targetGroup} 
                        onChange={(e) => setTargetGroup(e.target.value)}
                        className="flex-1 bg-transparent px-2 py-2 text-base font-semibold text-gray-800 placeholder-gray-400 outline-none w-full"
                        placeholder="e.g. 8AU1"
                     />
                  </div>
                  
                  <textarea 
                    className="w-full p-4 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary focus:outline-none bg-gray-50 text-sm text-gray-700 leading-relaxed resize-none" 
                    rows={3} 
                    placeholder="Paste text here to generate cards...&#10;e.g. 1. apple - 苹果 (An apple a day...)" 
                    value={rawInput} 
                    onChange={(e) => setRawInput(e.target.value)} 
                  />
                  
                  <button onClick={handleParseContent} disabled={isProcessing} className="w-full md:w-auto px-6 py-3 bg-gray-800 text-white rounded-xl hover:bg-gray-900 disabled:opacity-70 transition-colors flex items-center justify-center gap-2 text-sm md:text-base font-medium shadow-md hover:shadow-lg transform active:scale-[0.98] duration-100">
                      {isProcessing ? (<><svg className="animate-spin h-4 w-4 md:h-5 md:w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>Processing...</>) : (<><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19.428 15.428a2 2 0 00-1.022-.547l-2.384-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z"></path></svg>Generate Cards with AI</>)}
                  </button>
                </div>
            </div>
          </div>
        )}

        {mode === StudyMode.FLASHCARD && (
          <div className="w-full max-w-4xl flex flex-col items-center justify-center min-h-[60vh]">
            <div className="mb-8 w-full flex justify-between items-center px-4">
                 <button onClick={() => setMode(StudyMode.DASHBOARD)} className="text-gray-500 hover:text-gray-800 flex items-center gap-1 font-medium"><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"></path></svg>Back to Dashboard</button>
                 <span className="text-xs md:text-sm font-bold px-3 py-1 bg-white rounded-full text-gray-500 border border-gray-100 shadow-sm">{selectedGroup} <span className="text-gray-300 mx-1">|</span> {currentCardIndex + 1} / {sessionQueue.length}</span>
            </div>
            {currentItem ? (<Flashcard item={currentItem} onResult={(grade) => updateCardProgress(currentItem.id, grade)} onPlayAudio={handlePlayAudio} />) : (
              <div className="text-center bg-surface p-8 rounded-3xl shadow-sm border border-gray-100">
                <div className="w-16 h-16 bg-green-100 text-green-500 rounded-full flex items-center justify-center mx-auto mb-4">
                    <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg>
                </div>
                <h2 className="text-2xl font-bold text-gray-800 mb-2">All Caught Up!</h2>
                <p className="text-gray-500 mb-6">No more cards due for <strong>{selectedGroup}</strong> right now.</p>
                <button onClick={() => setMode(StudyMode.DASHBOARD)} className="px-6 py-3 bg-primary text-white rounded-xl shadow-md hover:bg-primary-dark transition-colors font-medium">Back to Dashboard</button>
              </div>
            )}
          </div>
        )}

        {mode === StudyMode.QUIZ && (
          <div className="w-full max-w-4xl flex flex-col items-center justify-center min-h-[60vh]">
             <div className="mb-8 w-full flex justify-between items-center px-4">
                 <button onClick={() => setMode(StudyMode.DASHBOARD)} className="text-gray-500 hover:text-gray-800 flex items-center gap-1 font-medium"><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"></path></svg>Quit Quiz</button>
                 <span className="text-xs md:text-sm font-bold px-3 py-1 bg-white rounded-full text-gray-500 border border-gray-100 shadow-sm">Question {currentCardIndex + 1} / {sessionQueue.length}</span>
            </div>
            {currentItem ? (<Quiz item={currentItem} onComplete={() => { if (currentCardIndex < sessionQueue.length - 1) { setCurrentCardIndex(prev => prev + 1); } else { alert("Quiz Complete!"); setMode(StudyMode.DASHBOARD); } }} />) : (
                <div className="text-center bg-surface p-8 rounded-3xl shadow-sm border border-gray-100">
                    <h2 className="text-2xl font-bold text-gray-800 mb-2">Not Enough Data</h2>
                    <p className="text-gray-500 mb-6">Review {selectedGroup} flashcards first to unlock quizzes.</p>
                    <button onClick={() => setMode(StudyMode.DASHBOARD)} className="px-6 py-3 bg-primary text-white rounded-xl shadow-md hover:bg-primary-dark transition-colors font-medium">Back to Dashboard</button>
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