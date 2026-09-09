import React, { useState, useRef } from 'react';
import { Album, Track } from '../types';
import {
  X,
  Upload,
  Disc,
  Barcode,
  Library,
  FileCode,
  Check,
  Sparkles,
  Plus,
  Trash2,
  Image as ImageIcon,
  Download,
  AlertCircle,
} from 'lucide-react';
import { audioEngine } from '../services/audioEngine';
import { PRESET_IMPORT_VINYLS, BARCODE_PRESET_MAP } from '../data/importPresets';

interface ImportVinylModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddAlbum: (album: Album) => void;
  onImportMultiple: (albums: Album[]) => void;
  currentAlbums: Album[];
}

export const ImportVinylModal: React.FC<ImportVinylModalProps> = ({
  isOpen,
  onClose,
  onAddAlbum,
  onImportMultiple,
  currentAlbums,
}) => {
  const [activeTab, setActiveTab] = useState<'manual' | 'presets' | 'barcode' | 'batch'>('manual');

  // Manual Form State
  const [title, setTitle] = useState('');
  const [artist, setArtist] = useState('');
  const [year, setYear] = useState(new Date().getFullYear());
  const [genre, setGenre] = useState('摇滚');
  const [label, setLabel] = useState('Columbia Records');
  const [rpm, setRpm] = useState<'33 ⅓ RPM' | '45 RPM' | '78 RPM'>('33 ⅓ RPM');
  const [weight, setWeight] = useState('180g 重磅黑胶');
  const [edition, setEdition] = useState('标准黑胶立体声版');
  const [matrixCode, setMatrixCode] = useState('VINYL-2026-LP01');
  const [condition, setCondition] = useState('Mint (M)');
  const [waxColor, setWaxColor] = useState('经典纯黑');
  const [price, setPrice] = useState(268);
  const [description, setDescription] = useState('');
  const [coverUrl, setCoverUrl] = useState('https://images.unsplash.com/photo-1539185441755-769473a23570?w=800&auto=format&fit=crop&q=80');
  const [coverFileName, setCoverFileName] = useState('');
  const [isDragOver, setIsDragOver] = useState(false);

  // Manual Tracklist State
  const [tracks, setTracks] = useState<Track[]>([
    { id: 't-1', number: 1, title: 'Track 01 · A面首曲', duration: '3:45', durationSec: 225 },
    { id: 't-2', number: 2, title: 'Track 02 · 主打旋律', duration: '4:12', durationSec: 252 },
    { id: 't-3', number: 3, title: 'Track 03 · 模拟音浪', duration: '3:50', durationSec: 230 },
    { id: 't-4', number: 4, title: 'Track 04 · B面尾声', duration: '5:04', durationSec: 304 },
  ]);

  // Barcode search state
  const [barcodeInput, setBarcodeInput] = useState('');
  const [barcodeSuccess, setBarcodeSuccess] = useState(false);

  // Batch JSON state
  const [jsonText, setJsonText] = useState('');
  const [batchError, setBatchError] = useState('');
  const [batchSuccessCount, setBatchSuccessCount] = useState<number | null>(null);

  // File input ref for cover
  const fileInputRef = useRef<HTMLInputElement>(null);
  const jsonFileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  // Preset cover selections
  const PRESET_COVERS = [
    { name: '爵士蓝调', url: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=800&auto=format&fit=crop&q=80' },
    { name: '复古黑胶', url: 'https://images.unsplash.com/photo-1539185441755-769473a23570?w=800&auto=format&fit=crop&q=80' },
    { name: '现代合成器', url: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=800&auto=format&fit=crop&q=80' },
    { name: '古典声学', url: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=800&auto=format&fit=crop&q=80' },
    { name: '天青之境', url: 'https://images.unsplash.com/photo-1534447677768-be436bb09401?w=800&auto=format&fit=crop&q=80' },
  ];

  const GENRE_TAGS = ['前卫摇滚', '经典爵士', '华语流行', '流行/Funk', '电子合成器', '民谣/原声', '硬摇滚', '古典交响'];

  // Handle Cover File Drag & Drop + Manual Selection
  const handleCoverFile = (file: File) => {
    if (!file.type.startsWith('image/')) {
      alert('请上传有效的图片文件 (JPG / PNG / WEBP)');
      return;
    }
    const reader = new FileReader();
    reader.onload = (e) => {
      if (e.target?.result) {
        setCoverUrl(e.target.result as string);
        setCoverFileName(file.name);
      }
    };
    reader.readAsDataURL(file);
  };

  // Submit manual album
  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !artist.trim()) {
      alert('请填写黑胶专辑名称与艺术家姓名');
      return;
    }

    const newAlbum: Album = {
      id: `imported-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
      title: title.trim(),
      artist: artist.trim(),
      artistId: artist.toLowerCase().replace(/\s+/g, '-'),
      year: Number(year) || new Date().getFullYear(),
      genre,
      coverUrl,
      label: label.trim() || 'Custom Pressing',
      rpm,
      weight,
      edition: edition.trim() || '首版限定压制',
      matrixCode: matrixCode.trim() || `MX-${Date.now().toString().slice(-6)}`,
      price: Number(price) || 280,
      trackCount: tracks.length,
      totalDuration: `${Math.floor(tracks.reduce((acc, t) => acc + t.durationSec, 0) / 60)}:${(tracks.reduce((acc, t) => acc + t.durationSec, 0) % 60).toString().padStart(2, '0')}`,
      description: description.trim() || `${artist} 于 ${year} 年发行的经典黑胶唱片，采用 ${weight} ${rpm} 实体刻录。`,
      color: '#131316',
      isCollected: true,
      condition,
      waxColor,
      addedAt: new Date().toISOString().split('T')[0],
      tracks: tracks.length > 0 ? tracks : [
        { id: `trk-${Date.now()}-1`, number: 1, title: 'Side A1 · Master Track', duration: '4:15', durationSec: 255 },
      ],
    };

    onAddAlbum(newAlbum);
    audioEngine.triggerHaptic('medium');
    onClose();
  };

  // Add track in manual form
  const handleAddTrack = () => {
    const nextNum = tracks.length + 1;
    setTracks((prev) => [
      ...prev,
      {
        id: `trk-${Date.now()}-${nextNum}`,
        number: nextNum,
        title: `Track 0${nextNum} · 新增音轨`,
        duration: '3:30',
        durationSec: 210,
      },
    ]);
  };

  // Remove track
  const handleRemoveTrack = (index: number) => {
    setTracks((prev) => prev.filter((_, idx) => idx !== index));
  };

  // Update track
  const handleUpdateTrack = (index: number, field: keyof Track, val: string | number) => {
    setTracks((prev) => {
      const copy = [...prev];
      copy[index] = { ...copy[index], [field]: val };
      return copy;
    });
  };

  // Barcode Lookup
  const handleBarcodeLookup = () => {
    const cleaned = barcodeInput.trim();
    if (!cleaned) return;
    const match = BARCODE_PRESET_MAP[cleaned];
    if (match) {
      setTitle(match.title || title);
      setArtist(match.artist || artist);
      setYear(match.year || year);
      setLabel(match.label || label);
      setRpm(match.rpm as any || rpm);
      setWeight(match.weight || weight);
      setEdition(match.edition || edition);
      setMatrixCode(match.matrixCode || matrixCode);
      setBarcodeSuccess(true);
      audioEngine.triggerHaptic('medium');
      setTimeout(() => setBarcodeSuccess(false), 3000);
      setActiveTab('manual');
    } else {
      // Simulate quick auto-generation from barcode
      setMatrixCode(`BC-${cleaned.slice(-6)}`);
      setEdition(`UPC 国际条码压片版 (${cleaned})`);
      setBarcodeSuccess(true);
      audioEngine.triggerHaptic('light');
      setActiveTab('manual');
    }
  };

  // Batch JSON Import
  const handleBatchJsonImport = (rawText: string) => {
    setBatchError('');
    try {
      const parsed = JSON.parse(rawText);
      const list = Array.isArray(parsed) ? parsed : [parsed];
      if (list.length === 0) {
        setBatchError('未解析到有效的黑胶数据');
        return;
      }
      // Sanitize items
      const sanitized: Album[] = list.map((item, i) => ({
        id: item.id || `imported-${Date.now()}-${i}`,
        title: item.title || '未命名黑胶唱片',
        artist: item.artist || '未知艺术家',
        artistId: item.artistId || 'artist-unknown',
        year: Number(item.year) || 2020,
        genre: item.genre || '黑胶典藏',
        coverUrl: item.coverUrl || 'https://images.unsplash.com/photo-1539185441755-769473a23570?w=800&auto=format&fit=crop&q=80',
        label: item.label || 'Private Collection',
        rpm: item.rpm || '33 ⅓ RPM',
        weight: item.weight || '180g 重磅黑胶',
        edition: item.edition || '收藏版',
        matrixCode: item.matrixCode || `MX-${Date.now()}-${i}`,
        price: Number(item.price) || 280,
        trackCount: item.tracks?.length || 4,
        totalDuration: item.totalDuration || '38:00',
        description: item.description || '导入的私人实体黑胶档案',
        color: item.color || '#131316',
        isCollected: true,
        condition: item.condition || 'Near Mint (NM)',
        waxColor: item.waxColor || '经典纯黑',
        addedAt: new Date().toISOString().split('T')[0],
        tracks: Array.isArray(item.tracks) && item.tracks.length > 0 ? item.tracks : [
          { id: `trk-${i}-1`, number: 1, title: 'Track 01', duration: '4:00', durationSec: 240 },
        ],
      }));

      onImportMultiple(sanitized);
      setBatchSuccessCount(sanitized.length);
      audioEngine.triggerHaptic('medium');
      setTimeout(() => {
        setBatchSuccessCount(null);
        onClose();
      }, 1500);
    } catch (err: any) {
      setBatchError(`JSON 解析失败: ${err.message}`);
    }
  };

  // Export current collection to JSON file
  const handleExportJson = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(currentAlbums, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `vinyl_collection_backup_${new Date().toISOString().split('T')[0]}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
    audioEngine.triggerHaptic('light');
  };

  return (
    <div
      id="import-vinyl-modal"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-3 sm:p-4 overflow-y-auto"
    >
      <div
        className="relative w-full max-w-2xl bg-[#0F0F12] border border-[#26272D] rounded-[10px] shadow-2xl overflow-hidden flex flex-col my-auto max-h-[92vh]"
        style={{
          boxShadow: '0 24px 64px rgba(0,0,0,0.95), 0 0 1px 1px rgba(255,255,255,0.06)',
        }}
      >
        {/* Top Header */}
        <div className="px-5 py-3.5 border-b border-[#26272D] flex items-center justify-between bg-[#141418]">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-[4px] bg-[#1B1B1D] border border-[#26272D] flex items-center justify-center text-[#2FE92B]">
              <Disc className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-[15px] font-bold text-white tracking-tight flex items-center gap-2">
                <span>录入 / 导入实体黑胶</span>
                <span className="text-[10px] font-mono px-1.5 py-0.5 rounded-[2px] bg-[#2FE92B]/10 text-[#2FE92B] border border-[#2FE92B]/30">
                  VINYL ARCHIVE
                </span>
              </h2>
              <p className="text-[11px] text-[#BBCBB2] opacity-75">
                支持手动建档、母带母盘库一键入库、条形码扫码与 JSON 批量备份导入
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-[4px] bg-[#1B1B1D] border border-[#26272D] hover:border-white/40 text-white/70 hover:text-white flex items-center justify-center transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* 4 Mode Tabs */}
        <div className="px-5 pt-3 pb-2 border-b border-[#26272D] flex items-center gap-2 bg-[#0B0B0E] overflow-x-auto no-scrollbar">
          <button
            type="button"
            onClick={() => setActiveTab('manual')}
            className={`px-3 py-1.5 rounded-[4px] text-[11.5px] font-medium flex items-center gap-1.5 transition-all ${
              activeTab === 'manual'
                ? 'bg-[#2FE92B] text-[#0F0F0F] font-bold shadow-[0_0_8px_rgba(47,233,43,0.3)]'
                : 'bg-[#16161A] text-white/60 hover:text-white border border-[#26272D]'
            }`}
          >
            <Plus className="w-3.5 h-3.5" />
            <span>手动录入黑胶档案</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('presets')}
            className={`px-3 py-1.5 rounded-[4px] text-[11.5px] font-medium flex items-center gap-1.5 transition-all ${
              activeTab === 'presets'
                ? 'bg-[#2FE92B] text-[#0F0F0F] font-bold shadow-[0_0_8px_rgba(47,233,43,0.3)]'
                : 'bg-[#16161A] text-white/60 hover:text-white border border-[#26272D]'
            }`}
          >
            <Library className="w-3.5 h-3.5" />
            <span>典藏母盘库一键入库</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('barcode')}
            className={`px-3 py-1.5 rounded-[4px] text-[11.5px] font-medium flex items-center gap-1.5 transition-all ${
              activeTab === 'barcode'
                ? 'bg-[#2FE92B] text-[#0F0F0F] font-bold shadow-[0_0_8px_rgba(47,233,43,0.3)]'
                : 'bg-[#16161A] text-white/60 hover:text-white border border-[#26272D]'
            }`}
          >
            <Barcode className="w-3.5 h-3.5" />
            <span>条码/矩阵识别</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('batch')}
            className={`px-3 py-1.5 rounded-[4px] text-[11.5px] font-medium flex items-center gap-1.5 transition-all ${
              activeTab === 'batch'
                ? 'bg-[#2FE92B] text-[#0F0F0F] font-bold shadow-[0_0_8px_rgba(47,233,43,0.3)]'
                : 'bg-[#16161A] text-white/60 hover:text-white border border-[#26272D]'
            }`}
          >
            <FileCode className="w-3.5 h-3.5" />
            <span>JSON 批量导入/导出</span>
          </button>
        </div>

        {/* Modal Body Container */}
        <div className="flex-1 overflow-y-auto p-5 space-y-5">
          {/* TAB 1: MANUAL ENTRY */}
          {activeTab === 'manual' && (
            <form onSubmit={handleManualSubmit} className="space-y-4">
              {/* Cover Art Section (Drag & Drop + Click File Picker + Presets) */}
              <div className="p-3.5 rounded-[6px] bg-[#141418] border border-[#26272D] space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-[12px] font-bold text-white flex items-center gap-1.5">
                    <ImageIcon className="w-3.5 h-3.5 text-[#2FE92B]" />
                    唱片封套艺术 (Cover Art)
                  </span>
                  <span className="text-[10px] text-white/40">
                    支持文件拖拽上传、点击选择、网络图源或经典预设
                  </span>
                </div>

                <div className="flex flex-col sm:flex-row gap-3.5 items-start">
                  {/* Preview of Cover */}
                  <div className="relative w-28 h-28 rounded-[4px] overflow-hidden border border-[#26272D] bg-black flex-shrink-0 group">
                    <img src={coverUrl} alt="Cover Preview" className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center pointer-events-none">
                      <span className="text-[9px] text-[#2FE92B] font-mono">预览封面</span>
                    </div>
                  </div>

                  {/* Drag & Drop Upload Zone */}
                  <div
                    onDragOver={(e) => {
                      e.preventDefault();
                      setIsDragOver(true);
                    }}
                    onDragLeave={() => setIsDragOver(false)}
                    onDrop={(e) => {
                      e.preventDefault();
                      setIsDragOver(false);
                      if (e.dataTransfer.files && e.dataTransfer.files[0]) {
                        handleCoverFile(e.dataTransfer.files[0]);
                      }
                    }}
                    onClick={() => fileInputRef.current?.click()}
                    className={`flex-1 w-full h-28 rounded-[4px] border-2 border-dashed p-3 flex flex-col items-center justify-center text-center cursor-pointer transition-colors ${
                      isDragOver
                        ? 'border-[#2FE92B] bg-[#2FE92B]/10'
                        : 'border-[#2A2B32] hover:border-[#2FE92B]/60 bg-[#16161A]'
                    }`}
                  >
                    <Upload className="w-5 h-5 text-[#2FE92B] mb-1" />
                    <p className="text-[11px] text-white font-medium">
                      点击选择或将封面图片拖拽至此
                    </p>
                    <p className="text-[9.5px] text-white/40 mt-0.5 font-mono">
                      {coverFileName ? `已选择: ${coverFileName}` : '支持 JPG、PNG、WEBP 正方形大图'}
                    </p>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => {
                        if (e.target.files && e.target.files[0]) {
                          handleCoverFile(e.target.files[0]);
                        }
                      }}
                    />
                  </div>
                </div>

                {/* Cover URL input & Quick Presets */}
                <div className="space-y-2 pt-1 border-t border-[#26272D]">
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] text-white/60 whitespace-nowrap">图片 URL:</span>
                    <input
                      type="text"
                      value={coverUrl}
                      onChange={(e) => setCoverUrl(e.target.value)}
                      placeholder="https://..."
                      className="flex-1 bg-[#1A1A1E] border border-[#26272D] rounded-[4px] px-2.5 py-1 text-[11.5px] text-white focus:border-[#2FE92B] focus:outline-none"
                    />
                  </div>

                  <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar">
                    <span className="text-[10px] text-white/40 whitespace-nowrap">推荐艺术图库:</span>
                    {PRESET_COVERS.map((preset) => (
                      <button
                        key={preset.name}
                        type="button"
                        onClick={() => {
                          setCoverUrl(preset.url);
                          setCoverFileName(preset.name);
                        }}
                        className="px-2 py-0.5 rounded-[3px] bg-[#1A1A1E] border border-[#26272D] hover:border-[#2FE92B]/60 text-[10.5px] text-white/70 whitespace-nowrap"
                      >
                        {preset.name}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Core Album Metadata Fields */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div className="space-y-1">
                  <label className="text-[11px] font-medium text-white/80 flex items-center justify-between">
                    <span>黑胶专辑名称 *</span>
                    <span className="text-[9px] text-[#2FE92B]">必填</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="例: Kind of Blue / 范特西 / Dark Side of the Moon"
                    className="w-full bg-[#141418] border border-[#26272D] rounded-[4px] px-3 py-1.5 text-[12.5px] text-white placeholder:text-white/30 focus:border-[#2FE92B] focus:outline-none"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-medium text-white/80 flex items-center justify-between">
                    <span>艺术家 / 乐团 *</span>
                    <span className="text-[9px] text-[#2FE92B]">必填</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={artist}
                    onChange={(e) => setArtist(e.target.value)}
                    placeholder="例: Miles Davis / 周杰伦 / Pink Floyd"
                    className="w-full bg-[#141418] border border-[#26272D] rounded-[4px] px-3 py-1.5 text-[12.5px] text-white placeholder:text-white/30 focus:border-[#2FE92B] focus:outline-none"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-medium text-white/80">发行年份</label>
                  <input
                    type="number"
                    value={year}
                    onChange={(e) => setYear(Number(e.target.value))}
                    className="w-full bg-[#141418] border border-[#26272D] rounded-[4px] px-3 py-1.5 text-[12.5px] text-white focus:border-[#2FE92B] focus:outline-none"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-medium text-white/80">录制 / 压模厂牌</label>
                  <input
                    type="text"
                    value={label}
                    onChange={(e) => setLabel(e.target.value)}
                    placeholder="例: Blue Note / Columbia / EMI / 阿尔发"
                    className="w-full bg-[#141418] border border-[#26272D] rounded-[4px] px-3 py-1.5 text-[12.5px] text-white focus:border-[#2FE92B] focus:outline-none"
                  />
                </div>
              </div>

              {/* Genre Selector with Quick Chips */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-medium text-white/80">流派风格</label>
                <div className="flex flex-wrap gap-1.5">
                  {GENRE_TAGS.map((g) => (
                    <button
                      key={g}
                      type="button"
                      onClick={() => setGenre(g)}
                      className={`px-2 py-0.5 rounded-[3px] text-[10.5px] font-medium transition-colors ${
                        genre === g
                          ? 'bg-[#2FE92B] text-[#0F0F0F] font-bold'
                          : 'bg-[#16161A] text-white/60 hover:text-white border border-[#26272D]'
                      }`}
                    >
                      {g}
                    </button>
                  ))}
                </div>
              </div>

              {/* Physical Vinyl Audio Specs (RPM, Weight, Edition, Wax Style, Matrix) */}
              <div className="p-3.5 rounded-[6px] bg-[#141418] border border-[#26272D] space-y-3">
                <span className="text-[12px] font-bold text-white flex items-center gap-1.5">
                  <Disc className="w-3.5 h-3.5 text-[#2FE92B]" />
                  物理黑胶发烧规格 (Audiophile Vinyl Specifications)
                </span>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  <div className="space-y-1">
                    <label className="text-[10.5px] text-white/70">转速 (RPM)</label>
                    <select
                      value={rpm}
                      onChange={(e) => setRpm(e.target.value as any)}
                      className="w-full bg-[#1B1B1D] border border-[#26272D] rounded-[4px] px-2.5 py-1.5 text-[11.5px] text-[#2FE92B] font-mono focus:border-[#2FE92B] focus:outline-none"
                    >
                      <option value="33 ⅓ RPM">33 ⅓ RPM (标准长篇 LP)</option>
                      <option value="45 RPM">45 RPM (高保真发烧/EP)</option>
                      <option value="78 RPM">78 RPM (老式留声机 SP)</option>
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10.5px] text-white/70">黑胶克重 (Weight)</label>
                    <select
                      value={weight}
                      onChange={(e) => setWeight(e.target.value)}
                      className="w-full bg-[#1B1B1D] border border-[#26272D] rounded-[4px] px-2.5 py-1.5 text-[11.5px] text-white font-mono focus:border-[#2FE92B] focus:outline-none"
                    >
                      <option value="180g 重磅黑胶">180g 重磅黑胶 (Audiophile)</option>
                      <option value="200g 顶级原始母盘">200g 顶级原始母盘</option>
                      <option value="140g 标准黑胶">140g 标准黑胶</option>
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10.5px] text-white/70">胶体形态 / 颜色</label>
                    <select
                      value={waxColor}
                      onChange={(e) => setWaxColor(e.target.value)}
                      className="w-full bg-[#1B1B1D] border border-[#26272D] rounded-[4px] px-2.5 py-1.5 text-[11.5px] text-white focus:border-[#2FE92B] focus:outline-none"
                    >
                      <option value="经典纯黑">经典纯黑 (Virgin Vinyl)</option>
                      <option value="晶莹透明胶">晶莹透明胶 (Clear Vinyl)</option>
                      <option value="炫彩泼墨彩胶">炫彩泼墨彩胶 (Splatter)</option>
                      <option value="留影图案胶">留影图案胶 (Picture Disc)</option>
                      <option value="复古古铜金胶">复古古铜金胶 (Gold Marble)</option>
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10.5px] text-white/70">内圈刻字矩阵码 (Matrix)</label>
                    <input
                      type="text"
                      value={matrixCode}
                      onChange={(e) => setMatrixCode(e.target.value)}
                      placeholder="SHVL 804 A-2"
                      className="w-full bg-[#1B1B1D] border border-[#26272D] rounded-[4px] px-2.5 py-1 text-[11.5px] text-white font-mono focus:border-[#2FE92B] focus:outline-none"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10.5px] text-white/70">品相等级 (Goldmine)</label>
                    <select
                      value={condition}
                      onChange={(e) => setCondition(e.target.value)}
                      className="w-full bg-[#1B1B1D] border border-[#26272D] rounded-[4px] px-2.5 py-1.5 text-[11.5px] text-[#2FE92B] focus:border-[#2FE92B] focus:outline-none"
                    >
                      <option value="Mint (M)">Mint (全新未拆封)</option>
                      <option value="Near Mint (NM)">Near Mint (近乎全新/试听品)</option>
                      <option value="Very Good Plus (VG+)">Very Good Plus (优良微痕)</option>
                      <option value="Very Good (VG)">Very Good (正常岁月划痕)</option>
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10.5px] text-white/70">预估收藏价值 (¥)</label>
                    <input
                      type="number"
                      value={price}
                      onChange={(e) => setPrice(Number(e.target.value))}
                      className="w-full bg-[#1B1B1D] border border-[#26272D] rounded-[4px] px-2.5 py-1 text-[11.5px] text-white font-mono focus:border-[#2FE92B] focus:outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* Tracklist Editor */}
              <div className="p-3.5 rounded-[6px] bg-[#141418] border border-[#26272D] space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-[12px] font-bold text-white">
                    音轨曲目列表 ({tracks.length} 首)
                  </span>
                  <button
                    type="button"
                    onClick={handleAddTrack}
                    className="flex items-center gap-1 text-[10.5px] text-[#2FE92B] hover:text-[#28d124] px-2 py-0.5 rounded-[3px] bg-[#1B1B1D] border border-[#26272D]"
                  >
                    <Plus className="w-3 h-3" />
                    <span>添加一轨</span>
                  </button>
                </div>

                <div className="space-y-1.5 max-h-40 overflow-y-auto no-scrollbar">
                  {tracks.map((t, idx) => (
                    <div key={t.id || idx} className="flex items-center gap-2 bg-[#1B1B1D] p-1.5 rounded-[4px] border border-[#26272D]">
                      <span className="text-[10px] font-mono text-white/40 w-5 text-center">
                        {idx + 1}
                      </span>
                      <input
                        type="text"
                        value={t.title}
                        onChange={(e) => handleUpdateTrack(idx, 'title', e.target.value)}
                        placeholder="音轨标题"
                        className="flex-1 bg-transparent text-[11.5px] text-white focus:outline-none"
                      />
                      <input
                        type="text"
                        value={t.duration}
                        onChange={(e) => handleUpdateTrack(idx, 'duration', e.target.value)}
                        placeholder="3:45"
                        className="w-14 bg-[#141418] text-[11px] font-mono text-center text-white/70 border border-[#26272D] rounded-[2px] py-0.5 focus:outline-none"
                      />
                      <button
                        type="button"
                        onClick={() => handleRemoveTrack(idx)}
                        disabled={tracks.length <= 1}
                        className="text-white/30 hover:text-red-400 p-1 disabled:opacity-20"
                        title="删除曲目"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Submit Buttons */}
              <div className="pt-2 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 rounded-[4px] bg-[#1B1B1D] border border-[#26272D] text-white/70 hover:text-white text-[12px] font-medium"
                >
                  取消
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-[4px] bg-[#2FE92B] text-[#0F0F0F] font-bold text-[12.5px] hover:bg-[#28d124] shadow-[0_0_12px_rgba(47,233,43,0.3)] transition-all flex items-center gap-1.5"
                >
                  <Check className="w-4 h-4" />
                  <span>正式入库此黑胶</span>
                </button>
              </div>
            </form>
          )}

          {/* TAB 2: MASTER PRESETS (ONE-CLICK IMPORT) */}
          {activeTab === 'presets' && (
            <div className="space-y-4">
              <div className="p-3 rounded-[6px] bg-[#141418] border border-[#26272D] flex items-center justify-between">
                <div>
                  <h3 className="text-[13px] font-bold text-white flex items-center gap-1.5">
                    <Sparkles className="w-4 h-4 text-[#2FE92B]" />
                    殿堂级发烧黑胶典藏库
                  </h3>
                  <p className="text-[11px] text-[#BBCBB2] opacity-75 mt-0.5">
                    精选世界知名模拟录音母盘版本，已预置完整克重、矩阵号、曲目与高保真封套，点击即可直接入库收藏
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                {PRESET_IMPORT_VINYLS.map((preset) => {
                  const isAlreadyAdded = currentAlbums.some((a) => a.title === preset.title);
                  return (
                    <div
                      key={preset.id}
                      className="p-3 rounded-[6px] bg-[#141418] border border-[#26272D] hover:border-[#3A3B42] flex flex-col justify-between transition-colors"
                    >
                      <div className="flex gap-3">
                        <img
                          src={preset.coverUrl}
                          alt={preset.title}
                          className="w-16 h-16 rounded-[4px] object-cover flex-shrink-0 border border-[#26272D]"
                        />
                        <div className="overflow-hidden">
                          <span className="text-[9px] font-mono px-1.5 py-0.2 rounded-[2px] bg-[#2FE92B]/10 text-[#2FE92B] border border-[#2FE92B]/30">
                            {preset.rpm} · {preset.weight}
                          </span>
                          <h4 className="text-[13px] font-bold text-white truncate mt-1">
                            {preset.title}
                          </h4>
                          <p className="text-[11px] text-[#BBCBB2] truncate opacity-80">
                            {preset.artist} · {preset.year}
                          </p>
                          <p className="text-[10px] text-white/40 font-mono mt-0.5 truncate">
                            厂牌: {preset.label}
                          </p>
                        </div>
                      </div>

                      <div className="mt-3 pt-2 border-t border-[#1F2024] flex items-center justify-between">
                        <div className="text-[10px] text-white/50 font-mono">
                          <span>矩阵号: {preset.matrixCode.split('/')[0]}</span>
                        </div>
                        <button
                          type="button"
                          disabled={isAlreadyAdded}
                          onClick={() => {
                            onAddAlbum({
                              ...preset,
                              id: `preset-${Date.now()}-${preset.id}`,
                              addedAt: new Date().toISOString().split('T')[0],
                            });
                            audioEngine.triggerHaptic('medium');
                          }}
                          className={`px-3 py-1 rounded-[3px] text-[11px] font-bold transition-all ${
                            isAlreadyAdded
                              ? 'bg-[#1B1B1D] text-white/30 border border-[#26272D] cursor-not-allowed'
                              : 'bg-[#2FE92B] hover:bg-[#28d124] text-[#0F0F0F] shadow-[0_0_8px_rgba(47,233,43,0.25)]'
                          }`}
                        >
                          {isAlreadyAdded ? '已在藏库' : '一键入库'}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* TAB 3: BARCODE SCANNER */}
          {activeTab === 'barcode' && (
            <div className="space-y-4">
              <div className="p-4 rounded-[6px] bg-[#141418] border border-[#26272D] space-y-3">
                <div className="flex items-center gap-2">
                  <Barcode className="w-5 h-5 text-[#2FE92B]" />
                  <div>
                    <h3 className="text-[13px] font-bold text-white">
                      黑胶封底条形码 / 矩阵刻字识别录入
                    </h3>
                    <p className="text-[11px] text-[#BBCBB2] opacity-75">
                      输入黑胶封套背面的 12/13 位 EAN/UPC 条码，或内圈径向刻字号即可自动匹配档案
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={barcodeInput}
                    onChange={(e) => setBarcodeInput(e.target.value)}
                    placeholder="输入或粘贴条形码号 (如 077774644517, 093624979357, 074643811218)"
                    className="flex-1 bg-[#1A1A1E] border border-[#26272D] rounded-[4px] px-3 py-2 text-[12.5px] text-white font-mono focus:border-[#2FE92B] focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={handleBarcodeLookup}
                    className="px-4 py-2 rounded-[4px] bg-[#2FE92B] text-[#0F0F0F] font-bold text-[12px] hover:bg-[#28d124] transition-all whitespace-nowrap"
                  >
                    查询并填充
                  </button>
                </div>

                {barcodeSuccess && (
                  <div className="p-2.5 rounded-[4px] bg-[#2FE92B]/10 border border-[#2FE92B]/40 text-[11px] text-[#2FE92B] flex items-center gap-2">
                    <Check className="w-4 h-4" />
                    <span>成功识别唱片信息！已自动填入录入表单。</span>
                  </div>
                )}

                {/* Quick Barcode Testing Presets */}
                <div className="pt-2 border-t border-[#26272D]">
                  <p className="text-[10.5px] text-white/50 mb-1.5">快速点击测试示例条码：</p>
                  <div className="flex flex-wrap gap-2">
                    {Object.keys(BARCODE_PRESET_MAP).map((code) => (
                      <button
                        key={code}
                        type="button"
                        onClick={() => {
                          setBarcodeInput(code);
                        }}
                        className="px-2 py-1 rounded-[3px] bg-[#1A1A1E] border border-[#26272D] hover:border-[#2FE92B]/60 text-[10.5px] font-mono text-white/80"
                      >
                        {code} ({BARCODE_PRESET_MAP[code].title?.slice(0, 16)}...)
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: BATCH JSON IMPORT & EXPORT */}
          {activeTab === 'batch' && (
            <div className="space-y-4">
              <div className="p-4 rounded-[6px] bg-[#141418] border border-[#26272D] space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <FileCode className="w-5 h-5 text-[#2FE92B]" />
                    <div>
                      <h3 className="text-[13px] font-bold text-white">
                        批量 JSON 数据导入与备份
                      </h3>
                      <p className="text-[11px] text-[#BBCBB2] opacity-75">
                        支持 Discogs / 自建库导出的标准 JSON 格式批量导入或全量备份
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={handleExportJson}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-[4px] bg-[#1B1B1D] border border-[#26272D] hover:border-[#2FE92B]/60 text-[#2FE92B] text-[11px] font-medium"
                    title="备份导出当前所有黑胶藏品"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>导出黑胶库 ({currentAlbums.length} 张)</span>
                  </button>
                </div>

                {/* Drag & drop JSON file */}
                <div
                  onClick={() => jsonFileInputRef.current?.click()}
                  className="w-full h-24 rounded-[4px] border-2 border-dashed border-[#2A2B32] hover:border-[#2FE92B]/60 bg-[#16161A] p-3 flex flex-col items-center justify-center cursor-pointer transition-colors"
                >
                  <Upload className="w-5 h-5 text-[#2FE92B] mb-1" />
                  <p className="text-[11px] text-white font-medium">
                    点击选择或将 JSON 格式黑胶文件拖入此处
                  </p>
                  <input
                    ref={jsonFileInputRef}
                    type="file"
                    accept=".json,application/json"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        const reader = new FileReader();
                        reader.onload = (event) => {
                          const content = event.target?.result as string;
                          setJsonText(content);
                          handleBatchJsonImport(content);
                        };
                        reader.readAsText(file);
                      }
                    }}
                  />
                </div>

                {/* Paste JSON text */}
                <div className="space-y-1.5">
                  <label className="text-[11px] text-white/70">或在此粘贴 JSON 代码：</label>
                  <textarea
                    rows={5}
                    value={jsonText}
                    onChange={(e) => setJsonText(e.target.value)}
                    placeholder="[ { 'title': 'Abbey Road', 'artist': 'The Beatles', 'year': 1969, ... } ]"
                    className="w-full bg-[#18181C] border border-[#26272D] rounded-[4px] p-2 text-[11px] font-mono text-white/90 focus:border-[#2FE92B] focus:outline-none"
                  />
                </div>

                {batchError && (
                  <div className="p-2.5 rounded-[4px] bg-red-900/20 border border-red-500/40 text-[11px] text-red-400 flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 flex-shrink-0" />
                    <span>{batchError}</span>
                  </div>
                )}

                {batchSuccessCount !== null && (
                  <div className="p-2.5 rounded-[4px] bg-[#2FE92B]/10 border border-[#2FE92B]/40 text-[11px] text-[#2FE92B] flex items-center gap-2">
                    <Check className="w-4 h-4" />
                    <span>成功批量导入 {batchSuccessCount} 张黑胶藏品！</span>
                  </div>
                )}

                <div className="flex justify-end">
                  <button
                    type="button"
                    disabled={!jsonText.trim()}
                    onClick={() => handleBatchJsonImport(jsonText)}
                    className="px-4 py-2 rounded-[4px] bg-[#2FE92B] text-[#0F0F0F] font-bold text-[12px] hover:bg-[#28d124] disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                  >
                    解析并导入黑胶
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
