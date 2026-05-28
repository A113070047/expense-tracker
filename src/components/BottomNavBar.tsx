import React from 'react';
import { PlusCircle, List, BarChart3, Settings } from 'lucide-react';
import { AppTab } from '../types';

interface BottomNavBarProps {
  activeTab: AppTab;
  onTabChange: (tab: AppTab) => void;
}

export const BottomNavBar: React.FC<BottomNavBarProps> = ({ activeTab, onTabChange }) => {
  return (
    <nav className="fixed bottom-0 left-0 w-full flex justify-around items-center px-4 py-2.5 bg-[#eceef0]/95 dark:bg-[#2d3133]/95 backdrop-blur-md shadow-[0_-4px_25px_0_rgba(0,0,0,0.06)] rounded-t-2xl z-40 transition-all border-t border-zinc-200/40 dark:border-zinc-800/20">
      
      {/* Entry tab button */}
      <button
        onClick={() => onTabChange(AppTab.ENTRY)}
        className={`flex flex-col items-center justify-center p-2 rounded-xl transition-all duration-200 active:scale-90 cursor-pointer ${
          activeTab === AppTab.ENTRY
            ? 'bg-[#ff7f50] text-[#6c2000] px-5 py-1.5 rounded-full shadow-sm'
            : 'text-[#57423b] hover:bg-zinc-200/50 dark:hover:bg-zinc-800/40'
        }`}
        type="button"
      >
        <PlusCircle className={`w-6 h-6 ${activeTab === AppTab.ENTRY ? 'stroke-[2.5px]' : 'stroke-[2px]'}`} />
        <span className="text-[12px] font-bold tracking-wider mt-0.5">記帳</span>
      </button>

      {/* Timeline tab button */}
      <button
        onClick={() => onTabChange(AppTab.TIMELINE)}
        className={`flex flex-col items-center justify-center p-2 rounded-xl transition-all duration-200 active:scale-90 cursor-pointer ${
          activeTab === AppTab.TIMELINE
            ? 'bg-[#ff7f50] text-[#6c2000] px-5 py-1.5 rounded-full shadow-sm'
            : 'text-[#57423b] hover:bg-zinc-200/50 dark:hover:bg-zinc-800/40'
        }`}
        type="button"
      >
        <List className={`w-6 h-6 ${activeTab === AppTab.TIMELINE ? 'stroke-[2.5px]' : 'stroke-[2px]'}`} />
        <span className="text-[12px] font-bold tracking-wider mt-0.5">明細</span>
      </button>

      {/* Analytics tab button */}
      <button
        onClick={() => onTabChange(AppTab.ANALYTICS)}
        className={`flex flex-col items-center justify-center p-2 rounded-xl transition-all duration-200 active:scale-90 cursor-pointer ${
          activeTab === AppTab.ANALYTICS
            ? 'bg-[#ff7f50] text-[#6c2000] px-5 py-1.5 rounded-full shadow-sm'
            : 'text-[#57423b] hover:bg-zinc-200/50 dark:hover:bg-zinc-800/40'
        }`}
        type="button"
      >
        <BarChart3 className={`w-6 h-6 ${activeTab === AppTab.ANALYTICS ? 'stroke-[2.5px]' : 'stroke-[2px]'}`} />
        <span className="text-[12px] font-bold tracking-wider mt-0.5">分析</span>
      </button>

      {/* Settings tab button */}
      <button
        onClick={() => onTabChange(AppTab.SETTINGS)}
        className={`flex flex-col items-center justify-center p-2 rounded-xl transition-all duration-200 active:scale-90 cursor-pointer ${
          activeTab === AppTab.SETTINGS
            ? 'bg-[#ff7f50] text-[#6c2000] px-5 py-1.5 rounded-full shadow-sm'
            : 'text-[#57423b] hover:bg-zinc-200/50 dark:hover:bg-zinc-800/40'
        }`}
        type="button"
      >
        <Settings className={`w-6 h-6 ${activeTab === AppTab.SETTINGS ? 'stroke-[2.5px]' : 'stroke-[2px]'}`} />
        <span className="text-[12px] font-bold tracking-wider mt-0.5">設定</span>
      </button>

    </nav>
  );
};
