import React from 'react';
import { MainTab } from '../types';
import { Home, Heart, Compass, User } from 'lucide-react';
import { hapticsService } from '../platform/platformService';

interface BottomNavProps {
  activeTab: MainTab;
  onChangeTab: (tab: MainTab) => void;
}

export const BottomNav: React.FC<BottomNavProps> = ({ activeTab, onChangeTab }) => {
  const tabs: { id: MainTab; label: string; icon: (isActive: boolean) => React.ReactNode }[] = [
    {
      id: 'home',
      label: '首页',
      icon: (isActive) => (
        <Home
          className={`w-5 h-5 transition-colors ${
            isActive ? 'text-[#2FE92B]' : 'text-[#6B6B78]'
          }`}
        />
      ),
    },
    {
      id: 'collection',
      label: '收藏',
      icon: (isActive) => (
        <Heart
          className={`w-5 h-5 transition-colors ${
            isActive ? 'fill-[#2FE92B] text-[#2FE92B]' : 'text-[#6B6B78]'
          }`}
        />
      ),
    },
    {
      id: 'discover',
      label: '发现',
      icon: (isActive) => (
        <Compass
          className={`w-5 h-5 transition-colors ${
            isActive ? 'text-[#2FE92B]' : 'text-[#6B6B78]'
          }`}
        />
      ),
    },
    {
      id: 'profile',
      label: '我的',
      icon: (isActive) => (
        <User
          className={`w-5 h-5 transition-colors ${
            isActive ? 'text-[#2FE92B]' : 'text-[#6B6B78]'
          }`}
        />
      ),
    },
  ];

  return (
    <nav
      id="bottom-navigation-bar"
      className="w-full h-[58px] bg-[#000000] border-t border-[#26272D] px-4 flex items-center justify-around select-none z-30 flex-shrink-0"
    >
      {tabs.map((tab) => {
        const isActive = activeTab === tab.id;
        const color = isActive ? '#2FE92B' : '#6B6B78';

        return (
          <button
            key={tab.id}
            id={`nav-tab-${tab.id}`}
            type="button"
            onClick={() => {
              onChangeTab(tab.id);
              hapticsService.triggerHaptic('light');
            }}
            className="flex-1 flex flex-col items-center justify-center py-1 transition-colors"
            style={{ color }}
          >
            {tab.icon(isActive)}
            <span
              className="text-[11px] mt-1 font-medium tracking-tight transition-colors"
              style={{ color }}
            >
              {tab.label}
            </span>
          </button>
        );
      })}
    </nav>
  );
};
