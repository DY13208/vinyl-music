import React from 'react';
import { Compass, Library, House, UserRound, type LucideIcon } from 'lucide-react';
import { MainTab } from '../types';
import { hapticsService } from '../platform/platformService';
import './BottomNav.css';

interface BottomNavProps {
  activeTab: MainTab;
  onChangeTab: (tab: MainTab) => void;
}

const tabs: { id: MainTab; label: string; icon: LucideIcon }[] = [
  { id: 'home', label: '首页', icon: House },
  { id: 'discover', label: '发现', icon: Compass },
  { id: 'collection', label: '唱片架', icon: Library },
  { id: 'profile', label: '我的', icon: UserRound },
];

export const BottomNav: React.FC<BottomNavProps> = ({ activeTab, onChangeTab }) => (
  <nav id="bottom-navigation-bar" className="bottom-nav" aria-label="主要导航">
    {tabs.map((tab, index) => {
      const active = activeTab === tab.id;
      const Icon = tab.icon;
      return <React.Fragment key={tab.id}>{index === 2 && <span className="bottom-nav__player-slot" aria-hidden="true" />}<button id={`nav-tab-${tab.id}`} type="button" className="bottom-nav__item" aria-current={active ? 'page' : undefined} onClick={() => { onChangeTab(tab.id); hapticsService.triggerHaptic('light'); }}>
        <span className="bottom-nav__icon" aria-hidden="true"><Icon size={22} strokeWidth={1.8} /></span>
        <span className="bottom-nav__label">{tab.label}</span>
      </button></React.Fragment>;
    })}
  </nav>
);
