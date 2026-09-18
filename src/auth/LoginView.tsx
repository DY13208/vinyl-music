import React, { useState } from 'react';
import { Disc3, Eye, EyeOff, ArrowLeft, LockKeyhole } from 'lucide-react';
import { authService, type AuthResult } from '../platform/auth/WebAuthAdapter';
import './auth.css';

type Mode = 'login' | 'register' | 'recover' | 'password';
export function LoginView({ initialError = '', recovery = false, onAuthenticated }: { initialError?: string; recovery?: boolean; onAuthenticated: (result: AuthResult) => void }) {
  const [mode, setMode] = useState<Mode>(recovery ? 'password' : 'login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [visible, setVisible] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(initialError);
  const [message, setMessage] = useState('');
  const switchMode = (next: Mode) => { setMode(next); setPassword(''); setConfirm(''); setError(''); setMessage(''); };
  const titles = { login: '回到你的唱片架', register: '开启你的私人唱片架', recover: '找回密码', password: '设置新密码' };
  const actions = { login: '登录', register: '创建账户', recover: '发送重置邮件', password: '保存新密码' };
  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (busy) return;
    setError(''); setMessage('');
    if (['register', 'password'].includes(mode) && password !== confirm) { setError('两次输入的密码不一致'); return; }
    setBusy(true);
    try {
      const result = await authService.request(mode, { email, password });
      if (result.user) onAuthenticated({ ...result, recovery: false });
      else { setMessage(result.message || '操作成功'); setPassword(''); setConfirm(''); }
    } catch (error) { setError(error instanceof Error ? error.message : '连接失败，请稍后重试'); }
    finally { setBusy(false); }
  };

  return <main className="auth-screen">
    <div className="auth-content">
      <a className="auth-brand" href="/" aria-label="Vinyl Shelf 首页"><Disc3 size={25} /> Vinyl Shelf</a>
      <div className="auth-record" aria-hidden="true"><span>VINYL<br />SHELF</span></div>
      <header><h1>{titles[mode]}</h1><p>{mode === 'login' || mode === 'register' ? '每一张收藏，都有只属于你的故事。' : '使用注册邮箱，重新连接你的音乐生活。'}</p></header>
      <form onSubmit={submit} aria-busy={busy}>
        <fieldset disabled={busy}>
          {mode !== 'password' && <label htmlFor="auth-email">邮箱<input id="auth-email" type="email" autoComplete="email" inputMode="email" required maxLength={254} value={email} onChange={event => setEmail(event.target.value)} placeholder="you@example.com" /></label>}
          {mode !== 'recover' && <label htmlFor="auth-password">{mode === 'password' ? '新密码' : '密码'}<span className="auth-password"><input id="auth-password" type={visible ? 'text' : 'password'} autoComplete={mode === 'login' ? 'current-password' : 'new-password'} required minLength={mode === 'login' ? 1 : 10} maxLength={128} value={password} onChange={event => setPassword(event.target.value)} placeholder={mode === 'login' ? '输入你的密码' : '至少 10 个字符'} /><button type="button" aria-label={visible ? '隐藏密码' : '显示密码'} aria-pressed={visible} onClick={() => setVisible(value => !value)}>{visible ? <EyeOff size={19} /> : <Eye size={19} />}</button></span></label>}
          {['register', 'password'].includes(mode) && <label htmlFor="auth-confirm">确认密码<input id="auth-confirm" type={visible ? 'text' : 'password'} autoComplete="new-password" required minLength={10} maxLength={128} value={confirm} onChange={event => setConfirm(event.target.value)} placeholder="再次输入密码" /></label>}
          {mode === 'login' && <button className="auth-forgot" type="button" onClick={() => switchMode('recover')}>忘记密码？</button>}
          {error && <p className="auth-error" role="alert">{error}</p>}
          {message && <p className="auth-message" role="status">{message}</p>}
          <button className="auth-submit" type="submit">{busy ? '正在处理…' : actions[mode]}</button>
        </fieldset>
      </form>
      {mode === 'login' && <p className="auth-switch">还没有账户？<button type="button" disabled={busy} onClick={() => switchMode('register')}>注册</button></p>}
      {(mode === 'register' || mode === 'recover') && <button type="button" className="auth-back" disabled={busy} onClick={() => switchMode('login')}><ArrowLeft size={16} />返回登录</button>}
      <footer><LockKeyhole size={16} /><p>馆藏和私人图片只保存在当前设备。<br />登录用于账户识别，不会上传或同步你的唱片收藏。</p></footer>
    </div>
  </main>;
}
