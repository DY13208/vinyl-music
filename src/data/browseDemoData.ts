import { Album } from '../types';

const names = ['静潮', '夜窗', '柔性电路', '纸月', '蓝色间奏', '日光室', '雨后', '缓慢轨道', '玻璃花园', '远方房间', '紫色时刻', '回声习作'];
const artists = ['潮汐档案', '第七房间', '低频工坊', '纸上乐团'];
/** Original artwork and fictional metadata, used only by the isolated preview. */
export const BROWSE_DEMO_ALBUMS: Album[] = Array.from({ length: 36 }, (_, index) => ({
  id: `browse-demo-${index + 1}`, title: `${names[index % names.length]}${index >= 12 ? ` · Vol. ${Math.floor(index / 12) + 1}` : ''}`,
  artist: artists[index % artists.length], artistId: `demo-artist-${index % artists.length}`,
  year: 2000 + index % 25, genre: ['电子', '爵士', '古典', '摇滚'][index % 4],
  coverUrl: `/assets/browse-demo/cover-${String(index % 12 + 1).padStart(2, '0')}.svg`,
  label: 'Studio Shelf', rpm: '33 ⅓ RPM', weight: '180g', edition: '原创封面展示版', matrixCode: `SHELF-${index + 1}`,
  trackCount: 0, totalDuration: '0:00', description: '原创封面与虚构专辑，仅用于浏览布局预览。', color: '#233a32', tracks: [],
}));
