import React, { useState, useEffect } from 'react';
import { StudyItem, ReviewGrade } from '../types';

interface FlashcardProps {
  item: StudyItem;
  onResult: (grade: ReviewGrade) => void;
  onPlayAudio: (item: StudyItem | string) => void;
}

const Flashcard: React.FC<FlashcardProps> = ({ item, onResult, onPlayAudio }) => {
  const [isFlipped, setIsFlipped] = useState(false);

  useEffect(() => {
    setIsFlipped(false);
  }, [item.id]);

  const handleFlip = () => setIsFlipped(!isFlipped);

  const handleAudioClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onPlayAudio(item);
  };

  return (
    <div className="w-full max-w-lg mx-auto h-96 perspective-1000 relative mb-8">
      {/* Front */}
      <div
        className={`relative w-full h-full text-center transition-transform duration-500 transform-style-3d cursor-pointer ${
          isFlipped ? 'rotate-y-180' : ''
        }`}
        onClick={handleFlip}
      >
        <div className="absolute w-full h-full bg-white rounded-2xl shadow-xl border border-gray-100 flex flex-col items-center justify-center p-8 backface-hidden">
          <div className="flex gap-2 mb-6">
              <span className="px-3 py-1 bg-gray-100 text-gray-600 text-[10px] font-bold rounded-full uppercase tracking-widest border border-gray-200">
                {item.group}
              </span>
              <span className={`px-3 py-1 text-[10px] font-bold rounded-full uppercase tracking-widest border ${item.type === 'sentence' ? 'bg-purple-50 text-purple-600 border-purple-100' : 'bg-blue-50 text-blue-600 border-blue-100'}`}>
                {item.type}
              </span>
          </div>
          <h2 className="text-3xl font-bold text-gray-800 mb-6 leading-snug">{item.chinese}</h2>
          <div className="text-gray-400 text-xs font-medium uppercase tracking-widest absolute bottom-6 flex items-center gap-2">
            <span>点击查看答案 (Tap to Reveal)</span>
          </div>
        </div>

        {/* Back */}
        <div className="absolute w-full h-full bg-gray-800 rounded-2xl shadow-xl flex flex-col items-center justify-center p-8 backface-hidden rotate-y-180 overflow-y-auto border border-gray-700">
           <span className="inline-block px-3 py-1 bg-gray-700 text-gray-300 text-xs font-bold rounded-full mb-6 uppercase tracking-wide border border-gray-600">
            English
          </span>
          <div className="flex flex-col items-center gap-6 w-full">
            <h2 className="text-2xl font-medium text-white leading-relaxed">{item.english}</h2>
            {item.example && <div className="p-4 bg-gray-700/50 rounded-xl text-gray-300 italic text-sm w-full border border-gray-600">"{item.example}"</div>}
            <button onClick={handleAudioClick} className="p-3 rounded-full bg-primary text-white hover:bg-primary-dark transition-colors shadow-lg transform active:scale-95" title="Play Audio">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" /></svg>
            </button>
          </div>
        </div>
      </div>

      {/* Grading Buttons */}
      <div className={`transition-opacity duration-300 grid grid-cols-4 gap-3 mt-6 ${isFlipped ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
        <button onClick={() => onResult('AGAIN')} className="flex flex-col items-center justify-center bg-white border border-rose-100 hover:bg-rose-50 text-rose-600 py-3 rounded-xl shadow-sm hover:shadow-md transition-all active:scale-95"><span className="font-bold text-sm">重来 (Again)</span><span className="text-[10px] opacity-70">1m</span></button>
        <button onClick={() => onResult('HARD')} className="flex flex-col items-center justify-center bg-white border border-orange-100 hover:bg-orange-50 text-orange-600 py-3 rounded-xl shadow-sm hover:shadow-md transition-all active:scale-95"><span className="font-bold text-sm">困难 (Hard)</span><span className="text-[10px] opacity-70">不变</span></button>
        <button onClick={() => onResult('GOOD')} className="flex flex-col items-center justify-center bg-white border border-blue-100 hover:bg-blue-50 text-blue-600 py-3 rounded-xl shadow-sm hover:shadow-md transition-all active:scale-95"><span className="font-bold text-sm">良好 (Good)</span><span className="text-[10px] opacity-70">1d</span></button>
        <button onClick={() => onResult('EASY')} className="flex flex-col items-center justify-center bg-white border border-emerald-100 hover:bg-emerald-50 text-emerald-600 py-3 rounded-xl shadow-sm hover:shadow-md transition-all active:scale-95"><span className="font-bold text-sm">简单 (Easy)</span><span className="text-[10px] opacity-70">4d</span></button>
      </div>
    </div>
  );
};

export default Flashcard;