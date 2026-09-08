import React from 'react';
import { MainTab } from '../types';
import { Disc, Library, Compass, User } from 'lucide-react';
import { audioEngine } from '../services/audioEngine';

interface BottomNavProps {
  activeTab: MainTab;
  onChangeTab: (tab: MainTab) => void;
}

export const BottomNav: React.FC<BottomNavProps> = ({ activeTab, onChangeTab }) => {
  const tabs: { id: MainTab; label: string; icon: React.ReactNode }[] = [
    {
      id: 'home',
      label: '首页',
      icon: <Disc className="w-5 h-5" />,
    },
    {
      id: 'collection',
      label: '收藏',
      icon: <Library className="w-5 h-5" />,
    },
    {
      id: 'discover',
      label: '发现',
      icon: <Compass className="w-5 h-5" />,
    },
    {
      id: 'profile',
      label: '我的',
      icon: <User className="w-5 h-5" />,
    },
  ];

  return (
    <nav
      id="bottom-navigation-bar"
      className="w-full bg-[#000000] border-t border-[#26272D] px-3 pt-1.5 pb-2 select-none flex items-center justify-around z-30"
    >
      {tabs.map((tab) => {
        const isActive = activeTab === tab.id;
        return (
          <button
            key={tab.id}
            id={`nav-tab-${tab.id}`}
            type="button"
            onClick={() => {
              onChangeTab(tab.id);
              audioEngine.triggerHaptic('light');
            }}
            className="flex-1 flex flex-col items-center justify-center py-1 transition-colors relative"
            style={{
              color: isActive ? '#2FE92B' : '#6B7367',
            }}
          >
            <div className="relative">
              {tab.icon}
              {isActive && (
                <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-[#2FE92B]" />
              )}
            </div>
            <span
              className="text-[10.5px] mt-1 tracking-tight font-medium"
              style={{
                color: isActive ? '#2FE92B' : '#6B7367',
              }}
            >
              {tab.label}
            </span>
          </button>
        );
      })}
    </nav>
  );
};
