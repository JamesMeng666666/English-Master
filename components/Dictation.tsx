import React, { useState, useEffect, useRef } from 'react';
import { StudyItem } from '../types';
import { getAudioFileNameCandidates } from '../constants';

interface DictationProps {
  item: StudyItem;
  onComplete: () => void;
  onPlayAudio: (item: StudyItem | string) => void;
}

const formatTime = (seconds: number) => {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
};

const computeWaveform = (audioBuffer: AudioBuffer, bars = 80) => {
  const data = audioBuffer.getChannelData(0);
  const blockSize = Math.max(1, Math.floor(data.length / bars));
  const peaks: number[] = [];

  for (let i = 0; i < bars; i += 1) {
    const start = i * blockSize;
    const end = Math.min(start + blockSize, data.length);
    let max = 0;
    for (let j = start; j < end; j += 1) {
      max = Math.max(max, Math.abs(data[j]));
    }
    peaks.push(max);
  }

  return peaks;
};

export default function Dictation({ item, onComplete, onPlayAudio }: DictationProps) {
  const [userInput, setUserInput] = useState('');
  const [isRevealed, setIsRevealed] = useState(false);
  const [audioStatus, setAudioStatus] = useState<'loading' | 'ready' | 'missing' | 'error'>('loading');
  const [audioMessage, setAudioMessage] = useState('');
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [waveformData, setWaveformData] = useState<number[]>([]);
  const [isPlaying, setIsPlaying] = useState(false);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const audioRef = useRef<HTMLAudioElement>(null);

  useEffect(() => {
    setUserInput('');
    setIsRevealed(false);
    setAudioStatus('loading');
    setAudioUrl(null);
    setAudioMessage('');
    setDuration(0);
    setCurrentTime(0);
    setWaveformData([]);
    setIsPlaying(false);

    const loadLocalAudio = async () => {
      const audioNames = getAudioFileNameCandidates(item);
      const urls = audioNames.map(fileName => `/audio/${fileName}`);

      for (const url of urls) {
        try {
          const response = await fetch(url);
          if (!response.ok) continue;

          const arrayBuffer = await response.arrayBuffer();
          const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
          if (!AudioContextClass) throw new Error('AudioContext not supported');

          const ctx = new AudioContextClass({ sampleRate: 24000 });
          const audioBuffer = await new Promise<AudioBuffer>((resolve, reject) => {
            const promise = ctx.decodeAudioData(arrayBuffer, resolve, reject);
            if (promise) {
              promise.catch(reject);
            }
          });
          await ctx.close();

          setAudioUrl(url);
          setDuration(audioBuffer.duration);
          setWaveformData(computeWaveform(audioBuffer));
          setAudioStatus('ready');
          return;
        } catch (error) {
          continue;
        }
      }

      setAudioStatus('missing');
      setAudioMessage(
        `预生成音频文件未下载或文件名不匹配。请检查链接： ${urls.join(' 或 ')}`
      );
    };

    loadLocalAudio();

    const timeout = setTimeout(() => {
      if (inputRef.current) {
        inputRef.current.focus();
      }
    }, 100);

    return () => {
      clearTimeout(timeout);
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.currentTime = 0;
      }
    };
  }, [item]);

  useEffect(() => {
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.play().catch(() => {
        setIsPlaying(false);
      });
    } else {
      audioRef.current.pause();
    }
  }, [isPlaying]);

  const handleCheck = () => {
    setIsRevealed(true);
  };

  const cleanText = (text: string) => {
    return text.toLowerCase().replace(/[^a-z0-9]/gi, '');
  };

  const isCorrect = cleanText(item.english) === cleanText(userInput);

  const handleSeek = (event: React.MouseEvent<HTMLDivElement>) => {
    if (!audioRef.current || duration === 0) return;
    const rect = event.currentTarget.getBoundingClientRect();
    const percent = Math.min(1, Math.max(0, (event.clientX - rect.left) / rect.width));
    audioRef.current.currentTime = percent * duration;
  };

  const handleAudioButton = () => {
    if (audioStatus === 'ready' && audioRef.current) {
      setIsPlaying(prev => !prev);
      return;
    }
    onPlayAudio(item);
  };

  const progress = duration > 0 ? Math.min(100, (currentTime / duration) * 100) : 0;

  return (
    <div className="w-full bg-white rounded-3xl shadow-sm border border-gray-100 p-6 md:p-10 flex flex-col items-center gap-6">
          <div className="w-full flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">{item.group} • 句子听写 (Sentence Dictation)</span>
              {/* 不在题目前展示句子文本，只有揭示答案后显示 */}
              {isRevealed && (
                <h2 className="mt-3 text-xl md:text-2xl font-bold text-gray-800">{item.english}</h2>
              )}
            </div>
          </div>

      {audioStatus === 'loading' && (
        <div className="w-full p-4 rounded-2xl bg-gray-50 border border-gray-100 text-sm text-gray-500">正在检测本地音频文件...</div>
      )}

      {audioStatus === 'missing' && (
        <div className="w-full p-4 rounded-2xl border border-rose-200 bg-rose-50 text-rose-700 text-sm">
          <div className="font-semibold">音频文件未下载或文件名不匹配</div>
          <div className="mt-2 text-xs leading-relaxed break-all">{audioMessage}</div>
          <div className="mt-3 text-xs text-gray-500">如果不能播放，请点击按钮使用 Microsoft TTS。</div>
        </div>
      )}

      {audioStatus === 'ready' && audioUrl && (
        <div className="w-full space-y-3">
          <div className="relative w-full h-24 bg-gray-100 rounded-2xl overflow-hidden cursor-pointer" onClick={handleSeek}>
            {/* 中心播放/暂停按钮，点击波形任意位置可 seek；中心按钮用于播放/暂停或触发回退 TTS */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                if (audioStatus === 'ready' && audioRef.current) {
                  setIsPlaying(prev => !prev);
                } else {
                  onPlayAudio(item);
                }
              }}
              aria-label={isPlaying ? '暂停' : '播放'}
              className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-10 bg-white/90 p-2 rounded-full shadow-md"
            >
              {isPlaying ? (
                <svg className="w-5 h-5 text-gray-800" viewBox="0 0 24 24" fill="none" stroke="currentColor"><rect x="6" y="5" width="4" height="14" rx="1" /><rect x="14" y="5" width="4" height="14" rx="1" /></svg>
              ) : (
                <svg className="w-5 h-5 text-gray-800" viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M5 3v18l15-9-15-9z" /></svg>
              )}
            </button>

            <div className="absolute inset-y-0 left-0 bg-primary/20" style={{ width: `${progress}%` }} />
            <div className="absolute inset-y-0 left-0 w-[2px] bg-primary" style={{ left: `${progress}%` }} />
            <div className="relative flex items-end h-full px-2 gap-1">
              {waveformData.map((peak, index) => (
                <div
                  key={index}
                  className="bg-gray-300 rounded-sm"
                  style={{ width: `${100 / waveformData.length}%`, height: `${Math.max(4, peak * 100)}%` }}
                />
              ))}
            </div>
          </div>
          <div className="flex items-center justify-between text-xs text-gray-500">
            <span>{formatTime(currentTime)}</span>
            <span>{formatTime(duration)}</span>
          </div>
          <audio
            ref={audioRef}
            src={audioUrl}
            onTimeUpdate={(e) => setCurrentTime(e.currentTarget.currentTime)}
            onEnded={() => setIsPlaying(false)}
            onPause={() => setIsPlaying(false)}
            onPlay={() => setIsPlaying(true)}
          />
        </div>
      )}

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
