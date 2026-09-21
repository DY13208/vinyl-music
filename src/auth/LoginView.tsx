import React, { useState } from 'react';
import { Disc3, Eye, EyeOff, ArrowLeft, LockKeyhole } from 'lucide-react';
import { authService, type AuthResult } from '../platform/auth/WebAuthAdapter';
import './auth.css';
type Mode = 'login'|'register'|'recover'|'password';
type Props = { recoveryToken?: string | null; onAuthenticated: (result: AuthResult) => void };
export function LoginView({ recoveryToken = null, onAuthenticated }: Props) {
  const [mode, setMode] = useState<Mode>(recoveryToken ? 'password' : 'login'); const [username, setUsername] = useState(''); const [email, setEmail] = useState(''); const [displayName, setDisplayName] = useState(''); const [password, setPassword] = useState(''); const [currentPassword, setCurrentPassword] = useState(''); const [confirm, setConfirm] = useState(''); const [visible, setVisible] = useState(false); const [busy, setBusy] = useState(false); const [error, setError] = useState(''); const [message, setMessage] = useState('');
  const switchMode = (next: Mode) => { setMode(next); setError(''); setMessage(''); setPassword(''); setConfirm(''); setCurrentPassword(''); };
  const submit = async (event: React.FormEvent) => { event.preventDefault(); if (busy) return; setError(''); setMessage(''); if (password !== confirm && (mode === 'register' || mode === 'password')) { setError('两次输入的密码不一致'); return; } setBusy(true); try {
      let result: AuthResult;
      if (mode === 'login') result = await authService.request('login', { username, password });
      else if (mode === 'register') result = await authService.request('register', { username, email, displayName, password });
      else if (mode === 'recover') result = await authService.request('recovery-request', { email });
      else result = await authService.request('recovery-confirm', { token: recoveryToken, newPassword: password });
      if (mode === 'login') onAuthenticated(result); else if (mode === 'register') { setMessage('账户已创建，请登录'); switchMode('login'); } else if (mode === 'recover') { setMessage(result.message || '如果该邮箱已注册，将收到重置邮件'); } else { setMessage('密码已更新，请重新登录'); switchMode('login'); }
    } catch (err) { setError(err instanceof Error ? err.message : '操作失败，请稍后重试'); } finally { setBusy(false); } };
  const title = { login: '回到你的唱片架', register: '开启你的私人唱片架', recover: '找回密码', password: '设置新密码' }[mode];
  return <main className="auth-screen"><div className="auth-content"><a className="auth-brand" href="/" aria-label="Vinyl Shelf 首页"><Disc3 size={25}/> Vinyl Shelf</a><div className="auth-record" aria-hidden="true"><span>VINYL<br/>SHELF</span></div><header><h1>{title}</h1><p>{mode === 'recover' || mode === 'password' ? '使用注册邮箱，重新连接你的音乐生活。' : '每一张唱片，都有只属于你的故事。'}</p></header><form onSubmit={submit} aria-busy={busy}><fieldset disabled={busy}>
    {mode === 'login' && <label htmlFor="auth-username">用户名<input id="auth-username" required value={username} onChange={e => setUsername(e.target.value)} autoComplete="username" /></label>}
    {mode === 'register' && <><label htmlFor="auth-username">用户名<input id="auth-username" required minLength={3} maxLength={32} value={username} onChange={e => setUsername(e.target.value)} autoComplete="username" /></label><label htmlFor="auth-email">邮箱<input id="auth-email" required type="email" maxLength={254} value={email} onChange={e => setEmail(e.target.value)} autoComplete="email" /></label><label htmlFor="auth-display">显示名称<input id="auth-display" required minLength={2} maxLength={40} value={displayName} onChange={e => setDisplayName(e.target.value)} /></label></>}
    {mode === 'recover' && <label htmlFor="auth-email">注册邮箱<input id="auth-email" required type="email" maxLength={254} value={email} onChange={e => setEmail(e.target.value)} autoComplete="email" /></label>}
    {mode === 'password' && !recoveryToken && <label htmlFor="auth-current">当前密码<input id="auth-current" required type="password" value={currentPassword} onChange={e => setCurrentPassword(e.target.value)} /></label>}
    {mode !== 'recover' && <label htmlFor="auth-password">{mode === 'password' ? '新密码' : '密码'}<span className="auth-password"><input id="auth-password" required type={visible ? 'text' : 'password'} minLength={mode === 'login' ? 1 : 12} maxLength={128} value={password} onChange={e => setPassword(e.target.value)} autoComplete={mode === 'login' ? 'current-password' : 'new-password'} /><button type="button" aria-label={visible ? '隐藏密码' : '显示密码'} onClick={() => setVisible(v => !v)}>{visible ? <EyeOff size={19}/> : <Eye size={19}/>}</button></span></label>}
    {(mode === 'register' || mode === 'password') && <label htmlFor="auth-confirm">确认密码<input id="auth-confirm" required type={visible ? 'text' : 'password'} minLength={12} maxLength={128} value={confirm} onChange={e => setConfirm(e.target.value)} autoComplete="new-password" /></label>}
    {mode === 'login' && <button className="auth-forgot" type="button" onClick={() => switchMode('recover')}>忘记密码？</button>}
    {error && <p className="auth-error" role="alert">{error}</p>}{message && <p className="auth-message" role="status">{message}</p>}
    <button className="auth-submit" type="submit">{busy ? '正在处理…' : ({ login: '登录', register: '创建账户', recover: '发送重置邮件', password: '保存新密码' }[mode])}</button>
  </fieldset></form>{mode === 'login' && <p className="auth-switch">还没有账户？<button type="button" onClick={() => switchMode('register')}>注册</button></p>}{(mode === 'register' || mode === 'recover') && <button type="button" className="auth-back" onClick={() => switchMode('login')}><ArrowLeft size={16}/>返回登录</button>}<footer><LockKeyhole size={16}/><p>馆藏和私人图片只保存在当前设备。<br/>登录用于账户识别，不会上传或同步你的唱片架。</p></footer></div></main>;
}
