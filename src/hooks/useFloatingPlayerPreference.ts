import { useState } from 'react';
import { storageService } from '../platform/platformService';

export function useFloatingPlayerPreference() {
  const key = 'vinyl_floating_player_visible_v1';
  const [visible, updateVisible] = useState(() => {
    try { return storageService.getItem(key) !== 'false'; }
    catch { return true; }
  });
  const [message, setMessage] = useState('');
  const setVisible = (next: boolean) => {
    updateVisible(next);
    try { storageService.setItem(key, String(next)); setMessage(''); }
    catch { setMessage('显示设置已生效，暂时无法保存到此设备。'); }
  };
  return { visible, setVisible, message };
}
