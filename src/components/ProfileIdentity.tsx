import React, { useEffect, useRef, useState } from 'react';
import { Camera, Disc, Pencil, X } from 'lucide-react';
import { localProfileRepository, type LocalProfile } from '../repositories/profile/LocalProfileRepository';
import { artworkService } from '../platform/artwork/WebArtworkAdapter';
import './ProfileIdentity.css';

export function ProfileIdentity({ email }: { email: string }) {
  const fallbackName = email.split('@')[0] || '唱片收藏者';
  const [profile, setProfile] = useState<LocalProfile>({ displayName: '', avatar: '' });
  const [draft, setDraft] = useState<LocalProfile>(profile);
  const [loaded, setLoaded] = useState(false);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const input = useRef<HTMLInputElement>(null);
  const editButton = useRef<HTMLButtonElement>(null);
  const avatarButton = useRef<HTMLButtonElement>(null);
  const dialog = useRef<HTMLDialogElement>(null);
  const backdropPressed = useRef(false);
  const generation = useRef(0);

  useEffect(() => {
    const modal = dialog.current;
    if (!modal) return;
    if (editing && !modal.open) {
      modal.showModal();
      avatarButton.current?.focus({ preventScroll: true });
    }
    if (!editing && modal.open) { modal.close(); editButton.current?.focus(); }
  }, [editing]);

  useEffect(() => {
    let active = true;
    void localProfileRepository.get().then(value => {
      if (active) { setProfile(value); setLoaded(true); }
    }).catch(() => { if (active) setError('本机资料读取失败，请刷新页面重试'); });
    return () => { active = false; generation.current++; };
  }, []);

  const beginEdit = () => {
    setDraft({ ...profile, displayName: profile.displayName || fallbackName });
    setError(''); setMessage(''); setEditing(true);
  };
  const close = () => {
    if (saving) return;
    generation.current++;
    setEditing(false); setProcessing(false); setError('');
  };
  const chooseAvatar = async (file?: File) => {
    if (!file) return;
    const request = ++generation.current;
    setProcessing(true); setError('');
    try {
      const avatar = await artworkService.importFile(file);
      if (request === generation.current) setDraft(value => ({ ...value, avatar }));
    } catch (error) {
      if (request === generation.current) setError(error instanceof Error ? error.message : '头像读取失败，请重新选择');
    } finally { if (request === generation.current) setProcessing(false); }
  };
  const save = async (event: React.FormEvent) => {
    event.preventDefault();
    if (saving || processing) return;
    setSaving(true); setError('');
    try {
      const value = await localProfileRepository.save(draft);
      setProfile(value); setMessage('资料已保存到本机');
      generation.current++; setEditing(false); setProcessing(false);
    } catch (error) { setError(error instanceof Error ? error.message : '资料保存失败，请重试'); }
    finally { setSaving(false); }
  };

  return <section className="profile-identity" aria-label="个人资料">
    <button type="button" className="profile-identity__avatar" aria-label="修改头像" disabled={!loaded} onClick={beginEdit}>
      {profile.avatar ? <img src={profile.avatar} alt="我的头像" /> : <Disc size={40} aria-hidden="true" />}
      <span className="profile-identity__camera"><Camera size={14} /></span>
    </button>
    <h2>{profile.displayName || fallbackName}</h2>
    <p className="profile-identity__email">{email || '你的私人唱片空间'}</p>
    <button ref={editButton} type="button" className="profile-identity__edit" disabled={!loaded} onClick={beginEdit}><Pencil size={14} />编辑资料</button>
    <dialog ref={dialog} className="profile-identity__dialog" aria-labelledby="profile-editor-title" aria-describedby="profile-editor-description" onCancel={event => { event.preventDefault(); close(); }} onPointerDown={event => { backdropPressed.current = event.target === event.currentTarget; }} onClick={event => {
      if (backdropPressed.current && event.target === event.currentTarget) close();
      backdropPressed.current = false;
    }}>
    {editing && <form className="profile-identity__form" onSubmit={save}>
      <header className="profile-identity__dialog-header"><h2 id="profile-editor-title">编辑资料</h2><button type="button" aria-label="关闭编辑资料" disabled={saving} onClick={close}><X size={20} /></button></header>
      <div className="profile-identity__dialog-body">
      <div className="profile-identity__preview"><button ref={avatarButton} type="button" className="profile-identity__avatar" aria-label="选择新头像" disabled={saving || processing} onClick={() => input.current?.click()}>
        {draft.avatar ? <img src={draft.avatar} alt="我的头像" /> : <Disc size={40} aria-hidden="true" />}
        <span className="profile-identity__camera"><Camera size={14} /></span>
      </button><span>{processing ? '正在处理头像…' : '点击更换头像'}</span></div>
      <input ref={input} className="profile-identity__file" aria-label="头像图片" type="file" accept="image/jpeg,image/png,image/webp,image/gif,image/avif" tabIndex={-1} onChange={event => {
        const file = event.target.files?.[0]; event.target.value = ''; void chooseAvatar(file);
      }} />
      <label htmlFor="profile-display-name">昵称<input id="profile-display-name" autoComplete="nickname" value={draft.displayName} maxLength={60} required disabled={saving} onChange={event => setDraft(value => ({ ...value, displayName: event.target.value }))} aria-describedby="profile-name-help" /></label>
      <p id="profile-name-help">1–30 个字符。修改昵称不会改变登录邮箱。</p>
      <div className="profile-identity__photo-actions">
        <button type="button" disabled={saving || processing} onClick={() => input.current?.click()}>{processing ? '正在处理头像…' : '选择头像图片'}</button>
        {draft.avatar && <button type="button" disabled={saving || processing} onClick={() => setDraft(value => ({ ...value, avatar: '' }))}>移除头像</button>}
      </div>
      <p id="profile-editor-description">昵称和头像仅保存在当前账号的本机空间，不上传服务器。</p>
      {error && <p className="profile-identity__error" role="alert">{error}</p>}
      </div>
      <footer className="profile-identity__actions"><button type="button" disabled={saving} onClick={close}>取消</button><button className="profile-identity__save" type="submit" disabled={saving || processing}>{saving ? '正在保存…' : '保存资料'}</button></footer>
    </form>}
    </dialog>
    {!editing && error && <p className="profile-identity__error" role="alert">{error}</p>}
    {message && <p className="profile-identity__message" role="status">{message}</p>}
  </section>;
}
