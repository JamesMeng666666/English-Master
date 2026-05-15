import React, { useState, useEffect, useRef } from 'react';
import { StudyItem } from '../types';

interface DictationProps {
  item: StudyItem;
  onComplete: () => void;
  onPlayAudio: (text: string) => void;
}

export default function Dictation({ item, onComplete, onPlayAudio }: DictationProps) {
  const [userInput, setUserInput] = useState('');
  const [isRevealed, setIsRevealed] = useState(false);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Auto-play audio when item changes
  useEffect(() => {
    setUserInput('');
    setIsRevealed(false);
    // Add a slight delay before playing audio to ensure the component is fully rendered
    const timeout = setTimeout(() => {
        onPlayAudio(item.english);
    }, 300);
    
    setTimeout(() => {
      if (inputRef.current) {
        inputRef.current.focus();
      }
    }, 100);

    return () => clearTimeout(timeout);
  }, [item, onPlayAudio]);

  const handleCheck = () => {
    setIsRevealed(true);
  };

  const cleanText = (text: string) => {
    return text.toLowerCase().replace(/[^a-z0-9]/gi, '');
  };

  const isCorrect = cleanText(item.english) === cleanText(userInput);

  return (
    <div className="w-full bg-white rounded-3xl shadow-sm border border-gray-100 p-6 md:p-10 flex flex-col items-center">
      <div className="w-full flex justify-between items-center mb-6">
        <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">{item.group} • 句子听写 (Sentence Dictation)</span>
        
        <button 
          onClick={() => onPlayAudio(item.english)}
          className="p-3 bg-primary/10 text-primary rounded-full hover:bg-primary hover:text-white transition-colors"
          title="播放录音 (Play Audio)"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z"></path></svg>
        </button>
      </div>

      <div className="w-full mb-6 relative">
        <textarea
          ref={inputRef}
          value={userInput}
          onChange={(e) => setUserInput(e.target.value)}
          placeholder="写下你听到的内容... (Type what you hear...)"
          disabled={isRevealed}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey && !isRevealed && userInput.trim()) {
              e.preventDefault();
              handleCheck();
            } else if (e.key === 'Enter' && !e.shiftKey && isRevealed) {
              e.preventDefault();
              onComplete();
            }
          }}
          className="w-full min-h-[120px] p-5 border-2 border-gray-100 rounded-2xl focus:border-primary focus:ring-0 resize-none text-lg text-gray-800 disabled:bg-gray-50 disabled:text-gray-600 transition-colors"
        />
        <div className="absolute right-4 bottom-4 text-xs text-gray-400">
            按 Enter 键 {isRevealed ? '继续 (continue)' : '检查 (check)'}
        </div>
      </div>

      {isRevealed ? (
        <div className="w-full mt-2 mb-8 animate-[fadeIn_0.3s_ease-out] space-y-4">
          <div className={`p-5 rounded-2xl border ${isCorrect ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
            <h4 className={`text-xs font-bold mb-2 uppercase tracking-widest ${isCorrect ? 'text-green-700' : 'text-red-700'}`}>
              {isCorrect ? '🎉 完全正确！(Perfect Match!)' : '期望句子 (Expected Sentence):'}
            </h4>
            <p className="text-xl text-gray-800 font-medium leading-relaxed">{item.english}</p>
          </div>
          
          <div className="bg-gray-50 p-5 rounded-2xl border border-gray-100">
            <h4 className="text-xs font-bold mb-2 uppercase tracking-widest text-gray-500">中文含义 (Chinese Meaning):</h4>
            <p className="text-lg text-gray-700">{item.chinese}</p>
          </div>
        </div>
      ) : null}

      <div className="w-full flex mt-auto gap-4">
        {isRevealed ? (
          <button 
            onClick={onComplete}
            className="flex-1 py-4 bg-primary text-white font-bold rounded-xl shadow-md hover:bg-primary-dark transition-all transform hover:scale-[1.02] active:scale-[0.98]"
          >
            下一题 (Next)
          </button>
        ) : (
          <button 
            onClick={handleCheck}
            disabled={!userInput.trim()}
            className="flex-1 py-4 bg-gray-800 text-white font-bold rounded-xl hover:bg-gray-900 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            检查答案 (Check Answer)
          </button>
        )}
      </div>
    </div>
  );
}
