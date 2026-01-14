import React, { useState, useEffect } from 'react';
import { StudyItem, ReviewGrade } from '../types';

interface FlashcardProps {
  item: StudyItem;
  onResult: (grade: ReviewGrade) => void;
  onPlayAudio: (text: string) => void;
}

const Flashcard: React.FC<FlashcardProps> = ({ item, onResult, onPlayAudio }) => {
  const [isFlipped, setIsFlipped] = useState(false);

  useEffect(() => {
    setIsFlipped(false);
  }, [item.id]);

  const handleFlip = () => setIsFlipped(!isFlipped);

  const handleAudioClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onPlayAudio(item.english);
  };

  return (
    <div className="w-full max-w-lg mx-auto h-96 perspective-1000 relative mb-8">
      <div
        className={`relative w-full h-full text-center transition-transform duration-500 transform-style-3d cursor-pointer ${
          isFlipped ? 'rotate-y-180' : ''
        }`}
        onClick={handleFlip}
      >
        <div className="absolute w-full h-full bg-white rounded-2xl shadow-xl border border-gray-100 flex flex-col items-center justify-center p-8 backface-hidden">
          <div className="flex gap-2 mb-4">
              <span className="px-3 py-1 bg-gray-100 text-gray-600 text-[10px] font-bold rounded-full uppercase tracking-widest border border-gray-200">
                {item.group}
              </span>
              <span className="px-3 py-1 bg-blue-100 text-blue-800 text-[10px] font-bold rounded-full uppercase tracking-widest border border-blue-200">
                {item.type}
              </span>
          </div>
          <h2 className="text-3xl font-bold text-gray-800 mb-6 leading-tight">{item.chinese}</h2>
          <p className="text-gray-400 text-sm absolute bottom-4">Tap to see English</p>
        </div>

        <div className="absolute w-full h-full bg-slate-800 rounded-2xl shadow-xl flex flex-col items-center justify-center p-8 backface-hidden rotate-y-180 overflow-y-auto">
           <span className="inline-block px-3 py-1 bg-emerald-900 text-emerald-300 text-xs font-semibold rounded-full mb-4 uppercase tracking-wide">
            Answer
          </span>
          <div className="flex flex-col items-center gap-4 w-full">
            <h2 className="text-2xl font-medium text-white leading-relaxed">{item.english}</h2>
            {item.example && <div className="mt-2 p-3 bg-slate-700 rounded-lg text-emerald-100 italic text-sm w-full">"{item.example}"</div>}
            <button onClick={handleAudioClick} className="mt-2 p-3 rounded-full bg-emerald-500 text-white hover:bg-emerald-600 transition-colors shadow-lg" title="Play Audio">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" /></svg>
            </button>
          </div>
        </div>
      </div>

      <div className={`transition-opacity duration-300 grid grid-cols-4 gap-2 mt-8 ${isFlipped ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
        <button onClick={() => onResult('AGAIN')} className="flex flex-col items-center justify-center bg-rose-500 hover:bg-rose-600 text-white py-3 px-2 rounded-lg shadow-lg transform transition active:scale-95"><span className="font-bold text-sm">Again</span><span className="text-[10px] opacity-80">1m</span></button>
        <button onClick={() => onResult('HARD')} className="flex flex-col items-center justify-center bg-amber-500 hover:bg-amber-600 text-white py-3 px-2 rounded-lg shadow-lg transform transition active:scale-95"><span className="font-bold text-sm">Hard</span><span className="text-[10px] opacity-80">Same</span></button>
        <button onClick={() => onResult('GOOD')} className="flex flex-col items-center justify-center bg-blue-500 hover:bg-blue-600 text-white py-3 px-2 rounded-lg shadow-lg transform transition active:scale-95"><span className="font-bold text-sm">Good</span><span className="text-[10px] opacity-80">Next</span></button>
        <button onClick={() => onResult('EASY')} className="flex flex-col items-center justify-center bg-emerald-500 hover:bg-emerald-600 text-white py-3 px-2 rounded-lg shadow-lg transform transition active:scale-95"><span className="font-bold text-sm">Easy</span><span className="text-[10px] opacity-80">2x</span></button>
      </div>
    </div>
  );
};

export default Flashcard;