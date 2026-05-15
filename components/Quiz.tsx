import React, { useState, useEffect } from 'react';
import { StudyItem } from '../types';

interface QuizProps {
  item: StudyItem;
  onComplete: (success: boolean) => void;
}

const Quiz: React.FC<QuizProps> = ({ item, onComplete }) => {
  const [input, setInput] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [feedback, setFeedback] = useState<'correct' | 'incorrect' | null>(null);

  useEffect(() => {
    setInput('');
    setSubmitted(false);
    setFeedback(null);
  }, [item.id]);

  const normalize = (str: string) => str.toLowerCase().replace(/[.,!?;:()]/g, '').trim();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
    
    const isCorrect = normalize(input) === normalize(item.english);
    setFeedback(isCorrect ? 'correct' : 'incorrect');

    // Auto advance after short delay if correct
    if (isCorrect) {
      setTimeout(() => onComplete(true), 1500);
    }
  };

  const handleNext = () => {
    onComplete(feedback === 'correct');
  };

  return (
    <div className="w-full max-w-2xl mx-auto bg-white rounded-2xl shadow-lg border border-gray-100 p-8">
      <div className="mb-6">
        <span className="text-sm font-bold text-gray-400 uppercase tracking-wider">翻译下面内容 (Translate this)</span>
        <h3 className="text-xl md:text-2xl text-gray-800 mt-2 font-medium">{item.chinese}</h3>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            英文翻译 (English Translation)
          </label>
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            disabled={submitted && feedback === 'correct'}
            className={`w-full px-4 py-3 text-lg border-2 rounded-lg focus:outline-none transition-colors ${
              feedback === 'correct' 
                ? 'border-green-500 bg-green-50 text-green-900' 
                : feedback === 'incorrect'
                ? 'border-red-500 bg-red-50'
                : 'border-gray-200 focus:border-primary'
            }`}
            placeholder="输入英文翻译 (Type the English translation...)"
            autoFocus
          />
        </div>

        {feedback === 'incorrect' && (
          <div className="p-4 bg-red-50 rounded-lg text-red-700">
            <p className="font-bold">正确答案 (Correct Answer):</p>
            <p>{item.english}</p>
          </div>
        )}

        <div className="pt-4 flex justify-end">
          {!submitted ? (
             <button
             type="submit"
             disabled={!input.trim()}
             className="px-6 py-2 bg-primary text-white rounded-lg hover:bg-opacity-90 disabled:opacity-50 disabled:cursor-not-allowed font-medium shadow-md transition-transform active:scale-95"
           >
             检查答案 (Check Answer)
           </button>
          ) : (
            <button
              type="button"
              onClick={handleNext}
              className={`px-6 py-2 rounded-lg text-white font-medium shadow-md transition-transform active:scale-95 ${
                  feedback === 'correct' ? 'bg-green-600 hover:bg-green-700' : 'bg-gray-800 hover:bg-gray-900'
              }`}
            >
              下一题 (Next Question) &rarr;
            </button>
          )}
        </div>
      </form>
    </div>
  );
};

export default Quiz;
