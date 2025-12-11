import React from 'react';
import { ViewMode } from '../types';
import { Layout, History } from 'lucide-react';

interface TabSelectorProps {
  currentView: ViewMode;
  onViewChange: (view: ViewMode) => void;
  historyCount: number;
}

export const TabSelector: React.FC<TabSelectorProps> = ({ currentView, onViewChange, historyCount }) => {
  return (
    <div className="flex bg-gray-900/50 p-1 rounded-xl border border-gray-700/50 backdrop-blur-sm">
      <button
        onClick={() => onViewChange('CANVAS')}
        className={`flex items-center gap-2 px-6 py-2 rounded-lg text-sm font-medium transition-all duration-300 ${
          currentView === 'CANVAS'
            ? 'bg-gray-700 text-white shadow-lg'
            : 'text-gray-400 hover:text-white hover:bg-gray-800'
        }`}
      >
        <Layout className="w-4 h-4" />
        Live Canvas
      </button>
      <button
        onClick={() => onViewChange('HISTORY')}
        className={`flex items-center gap-2 px-6 py-2 rounded-lg text-sm font-medium transition-all duration-300 ${
          currentView === 'HISTORY'
            ? 'bg-gray-700 text-white shadow-lg'
            : 'text-gray-400 hover:text-white hover:bg-gray-800'
        }`}
      >
        <History className="w-4 h-4" />
        History
        {historyCount > 0 && (
          <span className="ml-1 bg-gray-600 text-xs px-1.5 py-0.5 rounded-full text-gray-200">
            {historyCount}
          </span>
        )}
      </button>
    </div>
  );
};