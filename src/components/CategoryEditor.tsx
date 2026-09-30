import { useState } from 'react';
import type { Categories, CategoryKind } from '../hooks/useCollectionCategories';

export function CategoryEditor({ categories, kind, selected, onSelect, onChange, message }: {
  categories: Categories;
  kind: CategoryKind;
  selected: string[];
  onSelect: (values: string[]) => void;
  onChange: (kind: CategoryKind, oldName: string | null, newName: string | null) => Promise<boolean>;
  message: string;
}) {
  const [input, setInput] = useState('');
  const [editing, setEditing] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const title = kind === 'genres' ? '流派' : '唱片架标签';
  const submit = async () => {
    const name = input.trim();
    if (!name) { setError(`请输入${title}名称`); return; }
    if (name.includes(' · ')) { setError('名称不能包含“ · ”'); return; }
    if (categories[kind].some(item => item.toLocaleLowerCase() === name.toLocaleLowerCase() && item !== editing)) { setError('名称已存在'); return; }
    setBusy(true); setError('');
    try {
      if (await onChange(kind, editing, name)) {
        if (editing) onSelect(selected.map(item => item === editing ? name : item));
        else onSelect([...selected, name]);
        setEditing(null); setInput('');
      }
    } finally { setBusy(false); }
  };
  const remove = async (name: string) => {
    setBusy(true); setError('');
    try {
      if (await onChange(kind, name, null)) {
        onSelect(selected.filter(item => item !== name));
        if (editing === name) { setEditing(null); setInput(''); }
      }
    } finally { setBusy(false); }
  };
  return <fieldset className="add-chip-group category-editor"><legend>{title}</legend>
    <div>{categories[kind].map(item => <span className="category-editor__item" key={item}>
      <button type="button" className={selected.includes(item) ? 'is-selected' : ''} aria-pressed={selected.includes(item)} onClick={() => onSelect(selected.includes(item) ? selected.filter(value => value !== item) : [...selected, item])}>{item}</button>
      <button type="button" className="category-editor__action" aria-label={`修改${title} ${item}`} disabled={busy} onClick={() => { setEditing(item); setInput(item); setError(''); }}>改</button>
      <button type="button" className="category-editor__action" aria-label={`删除${title} ${item}`} disabled={busy} onClick={() => void remove(item)}>删</button>
    </span>)}</div>
    <div className="category-editor__input"><input aria-label={`${editing ? '修改' : '新增'}${title}名称`} value={input} maxLength={40} onChange={event => setInput(event.target.value)} onKeyDown={event => { if (event.key === 'Enter') { event.preventDefault(); void submit(); } }} placeholder={`输入${title}名称`} /><button type="button" disabled={busy} onClick={() => void submit()}>{editing ? '保存修改' : '添加'}</button>{editing && <button type="button" onClick={() => { setEditing(null); setInput(''); setError(''); }}>取消</button>}</div>
    {(error || message) && <p className="category-editor__error" role="alert">{error || message}</p>}
  </fieldset>;
}
