import React, { useState, useEffect } from 'react';
import { StudyItem } from '../types';

interface Props {
  onBack: () => void;
  onAddItem?: (item: StudyItem) => void;
  items: StudyItem[];
  selectedGroup: string;
}

const Translate: React.FC<Props> = ({ onBack, onAddItem, items, selectedGroup }) => {
  const [index, setIndex] = useState(0);
  const [selectedChinese, setSelectedChinese] = useState<string>('');
  const [answer, setAnswer] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [checkResult, setCheckResult] = useState<'correct' | 'wrong' | null>(null);
  const [correctAnswer, setCorrectAnswer] = useState<string>('');

  const available = items.filter(it => it.group === selectedGroup && it.type === 'sentence');

  useEffect(() => {
    setIndex(0);
  }, [selectedGroup]);

  useEffect(() => {
    // If available list shrank or changed, ensure index is valid
    if (index >= available.length) {
      setIndex(0);
      return;
    }
    setSelectedChinese(available[index]?.chinese || '');
    setAnswer('');
    // Only re-run when index or available length change (not on every mutation of items)
  }, [index, available.length]);

  const handleAdd = () => {
    if (!selectedChinese) {
      setError('当前分组没有可用句子');
      return;
    }
    if (!answer.trim()) {
      setError('请先在输入框中填写你的英文译文（不会显示正确答案）');
      return;
    }

    const newItem: StudyItem = {
      id: Math.random().toString(36).substring(2, 9),
      english: answer.trim(),
      chinese: selectedChinese,
      group: selectedGroup || 'Custom',
      type: 'sentence',
      example: answer.trim(),
      audioBase64: '',
      audioFileName: '',
      stage: 0,
      nextReviewDate: Date.now(),
      easeFactor: 2.5
    };

    onAddItem && onAddItem(newItem);
    setAnswer('');
    setError(null);
    onBack();
  };

  return (
    <div className="w-full max-w-4xl">
      <div className="mb-8 w-full flex justify-between items-center px-4">
        <button onClick={onBack} className="text-gray-500 hover:text-gray-800 flex items-center gap-1 font-medium">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"></path></svg>返回
        </button>
        <h2 className="text-lg font-bold">句子听写：每次显示一句中文句子（不显示英文）</h2>
      </div>

      <div className="bg-surface p-6 rounded-2xl shadow-sm border border-gray-100">
        <h4 className="text-sm font-medium text-gray-600">当前分组: {selectedGroup}</h4>

        <div className="mt-6">
          {available.length === 0 ? (
            <div className="text-gray-500">当前分组没有句子可用。</div>
          ) : (
            <div>
              <div className="text-2xl font-semibold text-gray-800 p-6 bg-white rounded-lg border border-gray-100 text-left">{selectedChinese}</div>
              <div className="text-sm text-gray-400 mt-2">句子 {index + 1} / {available.length}</div>
            </div>
          )}
        </div>

        <div className="mt-4">
          <label className="text-sm font-medium text-gray-600 mt-4 block">在下方输入你的英文译文（答案将被检查）</label>
          <textarea value={answer} onChange={(e) => setAnswer(e.target.value)} rows={2} className="w-full mt-2 p-3 rounded-lg border border-gray-200 bg-white text-gray-800" placeholder="在此输入你的英文译文" />

          <div className="mt-4 flex gap-2">
            <button onClick={() => {
              setError(null);
              setCheckResult(null);
              const target = available[index];
              if (!target) { setError('当前没有可检查的句子'); return; }
              const correct = (target.english || '').trim();
              setCorrectAnswer(correct);
              const norm = (s: string) => s.replace(/[\p{P}\p{S}]/gu, '').trim().toLowerCase();
              if (norm(answer) === norm(correct)) {
                setCheckResult('correct');
              } else {
                setCheckResult('wrong');
              }
            }} className="px-4 py-2 bg-indigo-600 text-white rounded-lg">检查答案</button>
            <button onClick={() => { setAnswer(''); setError(null); setCheckResult(null); setCorrectAnswer(''); }} className="px-4 py-2 bg-gray-100 rounded-lg">清空答案</button>
            <button onClick={() => { if (available.length>0) setIndex((idx) => (idx + 1) % available.length); setCheckResult(null); setCorrectAnswer(''); setAnswer(''); }} className="ml-auto px-4 py-2 bg-blue-500 text-white rounded-lg">下一句</button>
          </div>

          {checkResult === 'correct' && <div className="mt-3 text-green-600 font-semibold">正确 ✅</div>}
          {checkResult === 'wrong' && <div className="mt-3 text-red-600 font-semibold">不正确 ❌</div>}
          {correctAnswer && (
            <div className="mt-3 bg-white p-3 rounded border border-gray-100">
              <div className="text-sm text-gray-500">内置翻译（参考）</div>
              <div className="text-gray-800 mt-1">{correctAnswer}</div>
            </div>
          )}

          {error && <div className="mt-4 text-red-500">{error}</div>}
        </div>
      </div>
    </div>
  );
};

export default Translate;
