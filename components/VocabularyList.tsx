import React, { useMemo, useState } from 'react';
import { StudyItem } from '../types';

interface VocabularyListProps {
  items: StudyItem[];
  onBack: () => void;
  onPlayAudio: (text: string) => void;
  onDelete: (id: string) => void;
}

const VocabularyList: React.FC<VocabularyListProps> = ({ items, onBack, onPlayAudio, onDelete }) => {
  const [filter, setFilter] = useState<'all' | 'phrase' | 'sentence'>('all');
  const [groupFilter, setGroupFilter] = useState<string>('All');
  const [searchTerm, setSearchTerm] = useState('');

  const groups = useMemo(() => {
    return ['All', ...Array.from(new Set(items.map(i => i.group))).sort()];
  }, [items]);

  const filteredItems = useMemo(() => {
    return items.filter(item => {
      const matchesType = filter === 'all' || item.type === filter;
      const matchesGroup = groupFilter === 'All' || item.group === groupFilter;
      const lowerSearch = searchTerm.toLowerCase();
      const matchesSearch = item.english.toLowerCase().includes(lowerSearch) || 
                            item.chinese.toLowerCase().includes(lowerSearch);
      return matchesType && matchesGroup && matchesSearch;
    });
  }, [items, filter, groupFilter, searchTerm]);

  return (
    <div className="w-full max-w-5xl mx-auto bg-white rounded-2xl shadow-sm border border-gray-100 flex flex-col h-[85vh]">
      <div className="p-6 border-b border-gray-100 flex flex-col xl:flex-row justify-between items-start xl:items-center gap-4 bg-white rounded-t-2xl z-10">
        <div>
           <h2 className="text-2xl font-bold text-gray-800">Study Content ({filteredItems.length})</h2>
           <p className="text-gray-500 text-sm">Browse your textbook materials</p>
        </div>
       
        <div className="flex flex-wrap items-center gap-3 w-full xl:w-auto">
            <div className="relative flex-grow xl:flex-grow-0">
                <input 
                    type="text" 
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Search English or Chinese..."
                    className="pl-9 pr-4 py-1.5 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary outline-none w-full xl:w-64 transition-all placeholder-gray-400"
                />
                <svg className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg>
            </div>

            <select 
                value={groupFilter}
                onChange={(e) => setGroupFilter(e.target.value)}
                className="text-sm border border-gray-200 rounded-lg px-2 py-1.5 focus:ring-2 focus:ring-primary outline-none bg-white"
            >
                {groups.map(g => <option key={g} value={g}>{g}</option>)}
            </select>
            <div className="flex bg-gray-100 rounded-lg p-1">
                {(['all', 'phrase', 'sentence'] as const).map((f) => (
                    <button
                        key={f}
                        onClick={() => setFilter(f)}
                        className={`px-3 py-1.5 text-sm font-medium rounded-md capitalize transition-all ${
                            filter === f ? 'bg-white text-gray-800 shadow-sm' : 'text-gray-500 hover:text-gray-700'
                        }`}
                    >
                        {f === 'all' ? 'All' : f + 's'}
                    </button>
                ))}
            </div>
            <button onClick={onBack} className="px-4 py-2 text-gray-600 hover:text-gray-900 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors flex items-center gap-2 font-medium ml-auto xl:ml-0">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"></path></svg>
                Back
            </button>
        </div>
      </div>

      <div className="overflow-auto flex-1 p-6 bg-gray-50">
        <div className="grid gap-4">
          {filteredItems.length > 0 ? (
            filteredItems.map(item => (
            <div key={item.id} className="bg-white p-5 rounded-xl border border-gray-200 hover:border-primary/30 hover:shadow-md transition-all flex flex-col md:flex-row gap-4 items-start md:items-center justify-between group">
              <div className="flex-1 w-full">
                 <div className="flex flex-wrap items-center gap-2 mb-2">
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-gray-100 text-gray-600 border border-gray-200 uppercase">{item.group}</span>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wide border ${item.type === 'sentence' ? 'bg-purple-50 text-purple-700 border-purple-100' : 'bg-blue-50 text-blue-700 border-blue-100'}`}>{item.type}</span>
                    <h3 className="font-bold text-lg text-gray-900">{item.english}</h3>
                    <button onClick={() => onPlayAudio(item.english)} className="text-gray-400 hover:text-primary transition-colors p-1 rounded-full hover:bg-indigo-50" title="Play">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z"></path></svg>
                    </button>
                 </div>
                 <p className="text-gray-700 font-medium mb-1">{item.chinese}</p>
                 {item.example && <div className="text-gray-500 text-sm mt-2 pl-3 border-l-2 border-gray-200 italic bg-gray-50 p-2 rounded-r-lg">"{item.example}"</div>}
              </div>
              <div className="flex items-center gap-4 w-full md:w-auto mt-2 md:mt-0 justify-between md:justify-end border-t md:border-t-0 pt-3 md:pt-0 border-gray-100">
                  <div className="text-right mr-2 flex md:block items-center gap-2">
                      <div className="text-[10px] text-gray-400 uppercase tracking-wider">Memory Stage</div>
                      <div className="flex items-center gap-1 justify-end">
                        {Array.from({length: 6}).map((_, i) => (<div key={i} className={`h-1.5 w-1.5 rounded-full ${i <= item.stage ? 'bg-green-500' : 'bg-gray-200'}`} />))}
                      </div>
                  </div>
                  <button onClick={() => onDelete(item.id)} className="p-2 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors" title="Delete"><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg></button>
              </div>
            </div>
          ))) : (
              <div className="text-center py-20 text-gray-400">
                  <p>No items found matching your filters.</p>
              </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default VocabularyList;