import React, { useState, useEffect } from 'react';

interface ApiKeyModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (key: string) => void;
}

const ApiKeyModal: React.FC<ApiKeyModalProps> = ({ isOpen, onClose, onSave }) => {
  const [key, setKey] = useState('');

  useEffect(() => {
    const stored = localStorage.getItem('gemini_api_key');
    if (stored) setKey(stored);
  }, []);

  const handleSave = () => {
    localStorage.setItem('gemini_api_key', key);
    onSave(key);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6 transform transition-all">
        <h2 className="text-xl font-bold text-gray-900 mb-4">Settings</h2>
        <p className="text-sm text-gray-600 mb-4">
          Enter your Google Gemini API Key to enable AI-powered content parsing and high-quality Neural TTS voice.
        </p>
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">API Key</label>
          <input
            type="password"
            value={key}
            onChange={(e) => setKey(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
            placeholder="AIzaSy..."
          />
        </div>
        <div className="flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-600 hover:text-gray-800"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="px-4 py-2 bg-primary text-white rounded-md hover:bg-opacity-90 transition-colors"
          >
            Save Key
          </button>
        </div>
      </div>
    </div>
  );
};

export default ApiKeyModal;
