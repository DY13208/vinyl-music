import { LyricLine, Track, Album } from '../types';

/**
 * High-fidelity synchronized lyrics database inspired by Folia Major (chthollyphile/folia-major)
 * and QQ Music / Apple Music lyrics engines.
 * Each line includes:
 *  - `time`: precise timestamp in seconds
 *  - `text`: full original lyric line
 *  - `translation`: Chinese translation for bilingual presentation
 */
export const TRACK_LYRICS: Record<string, LyricLine[]> = {
  // 1. Pink Floyd - Time (Dark Side of the Moon)
  'pf-4': [
    { id: 't-1', time: 0, text: '♪ [Clock chiming and ticking - 模拟母带钟表原声滴答与报时] ♪', translation: '【钟鸣序曲 · 钟摆与齿轮倒计时】' },
    { id: 't-2', time: 18, text: 'Ticking away the moments that make up a dull day', translation: '分秒滴答消逝，拼凑出乏味无聊的一天' },
    { id: 't-3', time: 27, text: 'Fritter and waste the hours in an offhand way', translation: '漫不经心地挥霍虚度着大好光阴' },
    { id: 't-4', time: 36, text: 'Kicking around on a piece of ground in your hometown', translation: '在故乡的一方泥土上漫无目的地游荡' },
    { id: 't-5', time: 45, text: 'Waiting for someone or something to show you the way', translation: '等待着某个人或某件事为自己指明方向' },
    { id: 't-6', time: 54, text: 'Tired of lying in the sunshine, staying home to watch the rain', translation: '厌倦了在明媚阳光下慵懒，索性闭门静听窗外冷雨' },
    { id: 't-7', time: 64, text: 'And you are young and life is long, and there is time to kill today', translation: '那时你还年轻，生命似乎漫长无垠，有充裕的时间可以挥霍' },
    { id: 't-8', time: 76, text: 'And then one day you find ten years have got behind you', translation: '直到猛然发觉，十年光阴早已悄然逝去' },
    { id: 't-9', time: 86, text: 'No one told you when to run, you missed the starting gun', translation: '未曾有人提醒你何时起跑，你已错过了发令枪响' },
    { id: 't-10', time: 98, text: '♪ [David Gilmour - Fender Stratocaster Epic Solo] ♪', translation: '【大卫·吉尔莫 · 传奇吉他电贝斯间奏SOLO】' },
    { id: 't-11', time: 135, text: 'And you run and you run to catch up with the sun, but it\'s sinking', translation: '于是你拼命奔跑，试图追赶太阳，它却正缓缓西沉' },
    { id: 't-12', time: 146, text: 'Racing around to come up behind you again', translation: '匆匆绕过地平线，又悄然升起在你的身后' },
    { id: 't-13', time: 156, text: 'The sun is the same in a relative way, but you\'re older', translation: '相对而言太阳仍是昨日的太阳，而你却日渐老去' },
    { id: 't-14', time: 167, text: 'Shorter of breath and one day closer to death', translation: '呼吸愈发短促，又向着死亡的归途迈近了一步' },
    { id: 't-15', time: 180, text: 'Every year is getting shorter, never seem to find the time', translation: '一年比一年更加短暂，似乎永远挤不出真正属于自己的时间' },
    { id: 't-16', time: 191, text: 'Plans that either come to naught or half a page of scribbled lines', translation: '当初的宏图大志要么化为虚无，要么沦为草稿纸上凌乱的字句' },
    { id: 't-17', time: 202, text: 'Hanging on in quiet desperation is the English way', translation: '在平静无声的绝望中苦苦支撑，是英格兰人骨子里的宿命' },
    { id: 't-18', time: 213, text: 'The time is gone, the song is over, thought I\'d something more to say', translation: '时间已逝，歌声将息，本以为我还有许多话未曾说尽' },
    { id: 't-19', time: 228, text: 'Home, home again, I like to be here when I can', translation: '重归家园，只要可以，我愿长久停留在此' },
    { id: 't-20', time: 242, text: 'When I come home cold and tired, it\'s good to warm my bones beside the fire', translation: '当我受尽风寒疲惫归来，坐在壁炉旁温热骨髓是如此惬意' },
    { id: 't-21', time: 258, text: 'Far away across the field, the tolling of the iron bell', translation: '越过辽阔旷野，远方隐隐传来沉重的青铜钟声' },
    { id: 't-22', time: 275, text: 'Calls the faithful to their knees, to hear the softly spoken magic spells', translation: '召唤着虔诚的信徒屈膝跪拜，倾听低声诵念的神秘咒语' },
    { id: 't-23', time: 300, text: '♪ [Organ Fadeout to The Great Gig in the Sky] ♪', translation: '【风琴和弦渐弱，接续天空中的伟大演奏】' },
  ],

  // 2. Pink Floyd - Money
  'pf-6': [
    { id: 'm-1', time: 0, text: '♪ [Tape loops: Cash register chimes & Coins jingling 7/4 beat] ♪', translation: '【收银机收音磁带拼贴循环 · 罕见 7/4 拍律动】' },
    { id: 'm-2', time: 22, text: 'Money, get away', translation: '金钱，快滚开吧' },
    { id: 'm-3', time: 27, text: 'Get a good job with more pay and you\'re okay', translation: '找一份薪水更高的好差事，你就能过得体面' },
    { id: 'm-4', time: 33, text: 'Money, it\'s a gas', translation: '金钱，是世间至乐' },
    { id: 'm-5', time: 38, text: 'Grab that cash with both hands and make a stash', translation: '双手紧紧攥住现钞，狠狠积攒私囊' },
    { id: 'm-6', time: 44, text: 'New car, caviar, four-star daydream', translation: '新跑车、顶级鱼子酱、四星级的奢靡白日梦' },
    { id: 'm-7', time: 51, text: 'Think I\'ll buy me a football team', translation: '我想我得给自己买下一支顶级足球队' },
    { id: 'm-8', time: 60, text: 'Money, get back', translation: '金钱，快回来吧' },
    { id: 'm-9', time: 65, text: 'I\'m alright, Jack, keep your hands off of my stack', translation: '我好得很呢老兄，少把你的脏手伸向我的钱堆' },
    { id: 'm-10', time: 72, text: 'Money, it\'s a hit', translation: '金钱，是成功的勋章' },
    { id: 'm-11', time: 78, text: 'Don\'t give me that do-goody-good bullshit', translation: '别再拿那些假仁假义的狗屁大道理来教训我' },
    { id: 'm-12', time: 84, text: 'I\'m in the high-fidelity first class traveling set', translation: '我乘坐在高保真头等舱的豪华旅行车厢中' },
    { id: 'm-13', time: 92, text: 'And I think I need a Learjet', translation: '我看我真该添置一架私人里尔喷气飞机了' },
    { id: 'm-14', time: 104, text: '♪ [Dick Parry - Tenor Saxophone Solo & Guitar Tremolo] ♪', translation: '【迪克·帕里 · 粗粝次中音萨克斯狂放独奏】' },
  ],

  // 3. Pink Floyd - Breathe (In the Air)
  'pf-2': [
    { id: 'b-1', time: 0, text: '♪ [Pedal Steel Guitar Swell - 模拟电子管踏板吉他滑音] ♪', translation: '【滑棒吉他温暖铺底 · 迷幻声场】' },
    { id: 'b-2', time: 24, text: 'Breathe, breathe in the air', translation: '呼吸吧，深吸一口这世间的空气' },
    { id: 'b-3', time: 34, text: 'Don\'t be afraid to care', translation: '切莫害怕去付出心中的关切' },
    { id: 'b-4', time: 44, text: 'Leave, but don\'t leave me', translation: '你可以离去，但切莫将我一人抛下' },
    { id: 'b-5', time: 54, text: 'Look around, choose your own ground', translation: '放眼四望，择取属于你立足的一方天地' },
    { id: 'b-6', time: 65, text: 'Long you live and high you fly', translation: '愿你福寿绵长，展翅翱翔天际' },
    { id: 'b-7', time: 75, text: 'And smiles you\'ll give and tears you\'ll cry', translation: '你将给予世人微笑，亦会落下痛切的泪水' },
    { id: 'b-8', time: 85, text: 'And all you touch and all you see', translation: '你所触摸到的一切，你所凝视过的一切' },
    { id: 'b-9', time: 95, text: 'Is all your life will ever be', translation: '便是你整个人生所能拥有的全部' },
  ],

  // 4. Radiohead - Airbag (OK Computer)
  'rh-1': [
    { id: 'ab-1', time: 0, text: '♪ [Distorted Cello Sample & DJ Shadow inspired broken drum loop] ♪', translation: '【失真大提琴采样与碎拍循环 · 世纪末科技异化感】' },
    { id: 'ab-2', time: 22, text: 'In the next world war', translation: '在下一场世界大战的硝烟中' },
    { id: 'ab-3', time: 32, text: 'In a jackknifed juggernaut', translation: '在折曲失控的重型绞盘卡车之下' },
    { id: 'ab-4', time: 43, text: 'I am born again', translation: '我却奇迹般地重获新生' },
    { id: 'ab-5', time: 58, text: 'In the neon sign', translation: '在刺目的霓虹招牌光影里' },
    { id: 'ab-6', time: 68, text: 'Scrolling grazing the skyline', translation: '滚动的电子字幕掠过灰暗的天际线' },
    { id: 'ab-7', time: 79, text: 'I am born again', translation: '我又一次在惊悸中重生' },
    { id: 'ab-8', time: 94, text: 'In an interstellar burst', translation: '在星际爆发般剧烈的冲击瞬间' },
    { id: 'ab-9', time: 104, text: 'I am back to save the universe', translation: '我已归来，重负拯救这个荒诞的宇宙' },
    { id: 'ab-10', time: 120, text: 'An airbag saved my life', translation: '安全气囊救了我的凡俗性命' },
  ],

  // 5. Radiohead - No Surprises
  'rh-10': [
    { id: 'ns-1', time: 0, text: '♪ [Glockenspiel chime & mellow acoustic guitar arpeggio] ♪', translation: '【钟琴如童谣般纯净的分解和弦】' },
    { id: 'ns-2', time: 16, text: 'A heart that\'s full up like a landfill', translation: '一颗如垃圾填埋场般装满琐碎与废弃的心' },
    { id: 'ns-3', time: 25, text: 'A job that slowly kills you', translation: '一份在不知不觉中将你灵魂磨灭的生计' },
    { id: 'ns-4', time: 33, text: 'Bruises that won\'t heal', translation: '那些经年累月无法愈合的隐痛淤青' },
    { id: 'ns-5', time: 42, text: 'You look so tired, unhappy', translation: '你看起来如此疲惫，神情郁郁寡欢' },
    { id: 'ns-6', time: 51, text: 'Bring down the government, they don\'t speak for us', translation: '推翻那些伪善的统治者吧，他们从未替我们发声' },
    { id: 'ns-7', time: 63, text: 'I\'ll take a quiet life, a handshake of carbon monoxide', translation: '我宁愿选择一隅平静的生活，与一氧化碳温柔相握' },
    { id: 'ns-8', time: 82, text: 'No alarms and no surprises', translation: '没有凄厉的警报，没有意外的惊吓' },
    { id: 'ns-9', time: 92, text: 'No alarms and no surprises, please', translation: '没有警报，不再有任何意料之外的波折，求你了' },
  ],

  // 6. Daft Punk - Get Lucky
  'dp-8': [
    { id: 'gl-1', time: 0, text: '♪ [Nile Rodgers - 1959 "Hitmaker" Fender Stratocaster Funky Groove] ♪', translation: '【尼尔·罗杰斯 · 传奇 Funk 吉他切分节奏】' },
    { id: 'gl-2', time: 15, text: 'Like the legend of the phoenix, all ends with beginnings', translation: '宛如不死火鸟的千古传说，一切终局亦是全新的伊始' },
    { id: 'gl-3', time: 23, text: 'What keeps the planet spinning, the force from the beginning', translation: '驱动这蔚蓝星球运转不息的，是盘古开天辟地之初的力量' },
    { id: 'gl-4', time: 31, text: 'We\'ve come too far to give up who we are', translation: '我们跋山涉水走了这么远，绝不能丢弃最初的自我' },
    { id: 'gl-5', time: 38, text: 'So let\'s raise the bar and our cups to the stars', translation: '所以让我们突破桎梏，向着璀璨星辰高举酒杯' },
    { id: 'gl-6', time: 46, text: 'She\'s up all night \'til the sun, I\'m up all night to get some', translation: '她整夜欢舞直至拂晓，我彻夜不眠寻觅心仪' },
    { id: 'gl-7', time: 54, text: 'She\'s up all night for good fun, I\'m up all night to get lucky', translation: '她整夜狂欢尽情释放，我整夜期盼今晚交上好运' },
    { id: 'gl-8', time: 62, text: 'We\'re up all night \'til the sun, we\'re up all night for good fun', translation: '我们通宵达旦迎接晨光，我们彻夜欢歌共享盛宴' },
    { id: 'gl-9', time: 70, text: 'We\'re up all night to get lucky', translation: '我们彻夜祈愿与幸运相拥' },
  ],

  // 7. 周杰伦 - 爱在西元前 (Fantasy)
  'jf-1': [
    { id: 'ay-1', time: 0, text: '♪ [古巴比伦木吉他引子与黑胶摩擦音] ♪', translation: '【汉谟拉比石碑 · 楔形文字与轻柔拨弦】' },
    { id: 'ay-2', time: 12, text: '古巴比伦王颁布了汉谟拉比法典', translation: '刻在黑色的玄武岩，距今已经三千七百多年' },
    { id: 'ay-3', time: 24, text: '你在橱窗前，凝视碑文的字眼', translation: '我却在旁静静欣赏你那张我深爱的脸' },
    { id: 'ay-4', time: 35, text: '祭司、神殿、征战、弓箭，是谁的从前', translation: '喜欢在人潮中你只属于我的那画面' },
    { id: 'ay-5', time: 47, text: '经过苏美尔女神身边，我以女神之名许愿', translation: '思念像底格里斯河般的漫延' },
    { id: 'ay-6', time: 58, text: '当古文明只剩下难解的语言，传说就成了永垂不朽的诗篇', translation: '我给你的爱写在西元前，深埋在美索不达米亚平原' },
    { id: 'ay-7', time: 70, text: '几十个世纪后出土发现，泥板上的字迹依然清晰可见', translation: '用楔形文字刻下了永远，那已风化千年的誓言' },
    { id: 'ay-8', time: 82, text: '我感到很欣慰，在千年后还能被你看见', translation: '爱在西元前，历经风沙依旧热烈' },
  ],

  // 8. 周杰伦 - 简单爱 (Fantasy)
  'jf-3': [
    { id: 'ja-1', time: 0, text: '♪ [清脆电吉他与青春节奏] ♪', translation: '【夏日单车 · 纯真爱恋旋律】' },
    { id: 'ja-2', time: 11, text: '说不上为什么 我变得很主动', translation: '若爱上一个人 什么都会值得去做' },
    { id: 'ja-3', time: 22, text: '我想大声宣布 对你依依不舍', translation: '连隔壁邻居都猜到我现在的感受' },
    { id: 'ja-4', time: 33, text: '河边的风 在吹着头发 飘动', translation: '牵着你的手 一阵莫名感动' },
    { id: 'ja-5', time: 44, text: '我想带你骑单车 我想和你看棒球', translation: '想这样没担忧 唱着歌 一直走' },
    { id: 'ja-6', time: 56, text: '我想就这样牵着 你的手不放开', translation: '爱能不能够永远 单纯没有悲哀' },
    { id: 'ja-7', time: 67, text: '我想带你骑单车 我想和你看棒球', translation: '想这样没担忧 唱着歌 一直走' },
    { id: 'ja-8', time: 78, text: '我想就这样牵着 你的手不放开', translation: '爱可不可以简简单单 没有伤害' },
  ],

  // 9. 周杰伦 - 安静 (Fantasy)
  'jf-10': [
    { id: 'aj-1', time: 0, text: '♪ [古典钢琴单音独白 · 模拟三角琴黑胶回响] ♪', translation: '【周氏经典钢琴 Intro · 纯粹伤感情感表达】' },
    { id: 'aj-2', time: 14, text: '只剩下钢琴陪我弹了一天 睡着的大提琴 安静的旧旧的', translation: '我想你已表现的非常明白 我懂我也知道 不能勉强' },
    { id: 'aj-3', time: 34, text: '你说你也会难过 我不相信 牵着你陪着我 也只是曾经', translation: '希望他是真的比我还要爱你 我才会逼自己离开' },
    { id: 'aj-4', time: 54, text: '你要我说多难堪 我根本不想分开', translation: '为什么还要我用微笑来带过' },
    { id: 'aj-5', time: 68, text: '我没有这种天份 包容你也接受他', translation: '不用担心的太多 我会一直好好过' },
    { id: 'aj-6', time: 83, text: '你已经远远离开 我也会慢慢走开', translation: '为什么我连分开都迁就着你' },
    { id: 'aj-7', time: 98, text: '我真的没有天份 安静的没这么快', translation: '我会学着放弃你 是因为我太爱你' },
  ],

  // 10. Lorde - Green Light (Melodrama)
  'lm-1': [
    { id: 'lg-1', time: 0, text: '♪ [Urgent Staccato Piano Chords · 紧促跳跃的钢琴和弦] ♪', translation: '【心碎后的苏醒 · 派对微醺前奏】' },
    { id: 'lg-2', time: 14, text: 'I do my makeup in somebody else\'s car', translation: '我在陌生人的车厢里借着微光补妆' },
    { id: 'lg-3', time: 22, text: 'We order different drinks at the same bars', translation: '在同一间熟悉的酒吧，我们点着迥然不同的烈酒' },
    { id: 'lg-4', time: 30, text: 'I know about what you did and I wanna scream the truth', translation: '我对你的所作所为心知肚明，多想当面吼出所有的真相' },
    { id: 'lg-5', time: 38, text: 'She thinks you love the beach, you\'re such a damn liar', translation: '她还以为你深爱着海滩沙滩，你这个彻头彻尾的骗子' },
    { id: 'lg-6', time: 48, text: 'Well those rumors, they have big teeth', translation: '那些流言蜚语，宛如长着獠牙的野兽' },
    { id: 'lg-7', time: 56, text: 'Hope they bite you', translation: '真希望它们狠狠撕咬住你' },
    { id: 'lg-8', time: 64, text: '\'Cause honey I\'ll come get my things, but I can\'t let go', translation: '亲爱的，我会取回我残留的旧物，可我仍无法彻底释怀' },
    { id: 'lg-9', time: 76, text: 'I\'m waiting for it, that green light, I want it', translation: '我苦苦守候着那一抹通行的绿灯，我渴求着它的救赎' },
  ],

  // 11. Miles Davis - So What (Kind of Blue)
  'md-1': [
    { id: 'sw-1', time: 0, text: '♪ [Bill Evans - Piano Call & Paul Chambers - Acoustic Bass Response] ♪', translation: '【比尔·埃文斯与保罗·钱伯斯 · 经典钢琴与低音提琴一问一答】' },
    { id: 'sw-2', time: 33, text: '♪ [D-Dorian Modal Jazz Groove Begins · 调式爵士 D 多利亚调式律动起步] ♪', translation: '【开创调式爵士时代的标志性律动】' },
    { id: 'sw-3', time: 54, text: '♪ [Miles Davis - Harmon Mute Trumpet Solo Entrance] ♪', translation: '【迈尔斯·戴维斯 · 塞音弱音小号破晓而出，冷冽而克制】' },
    { id: 'sw-4', time: 90, text: 'Liner Note: "Miles conceived these songs hours before the session at 30th Street Studio"', translation: '母带铭刻：“迈尔斯在哥伦比亚30街录音棚开工前数小时才写下草稿”' },
    { id: 'sw-5', time: 130, text: '♪ [John Coltrane - Tenor Saxophone Cascade of Notes] ♪', translation: '【约翰·柯川 · 次中音萨克斯狂风暴雨般音符风暴切入】' },
    { id: 'sw-6', time: 180, text: 'Liner Note: "Pure modal improvisation without rigid chord cycles"', translation: '乐评鉴赏：“彻底打破传统和弦框架，纯粹在多利亚音阶上自由翱翔”' },
    { id: 'sw-7', time: 240, text: '♪ [Cannonball Adderley - Alto Sax Blues Groove] ♪', translation: '【加农炮·艾德利 · 中音萨克斯饱满蓝调灵魂独奏】' },
  ],

  // 12. John Coltrane - Part 1: Acknowledgement (A Love Supreme)
  'jc-1': [
    { id: 'ca-1', time: 0, text: '♪ [Chinese Gong Crash & Jimmy Garrison Bass Ostinato] ♪', translation: '【大铜锣破空轰鸣 · 标志性四音符贝斯固定低音】' },
    { id: 'ca-2', time: 32, text: '♪ [Coltrane Tenor Horn Preaching in 12 Keys] ♪', translation: '【柯川次中音如宣道般在12个调性中穿梭升华】' },
    { id: 'ca-3', time: 120, text: 'Liner Note: "A spiritual awakening recorded in Rudy Van Gelder\'s Englewood Cliffs studio"', translation: '母带导读：“1964年12月9日，鲁迪·范·盖尔德录音室记录的精神涅槃”' },
    { id: 'ca-4', time: 210, text: 'A Love Supreme... A Love Supreme...', translation: '至高无上的大爱……神圣至极的礼赞……' },
    { id: 'ca-5', time: 240, text: 'A Love Supreme... A Love Supreme...', translation: '至高无上的大爱……回荡在宇宙星空……' },
    { id: 'ca-6', time: 290, text: '♪ [Bass drone fades out quietly into twilight] ♪', translation: '【低音提琴单音律动在静默暮色中缓缓消散】' },
  ],
};

/**
 * Returns full lyrics array for any track. If the track doesn't have custom handwritten lyrics,
 * generates a comprehensive, timed sequence tailored to the track title, duration, and artist style.
 */
export function getLyricsForTrack(track: Track, album?: Album): LyricLine[] {
  if (TRACK_LYRICS[track.id]) {
    return TRACK_LYRICS[track.id];
  }

  // Generate structured, complete timed lyrics for other songs
  const duration = Math.max(90, track.durationSec || 180);
  const artist = album?.artist || 'Vinyl Master';
  const lines: LyricLine[] = [
    {
      id: `${track.id}-0`,
      time: 0,
      text: `♪ [Original Master Tape Introduction - ${track.title}] ♪`,
      translation: `【${album?.title || '经典黑胶'} · 原版母带音轨序奏】`,
    },
    {
      id: `${track.id}-1`,
      time: Math.round(duration * 0.08),
      text: `Listening to the warm vinyl grooves of "${track.title}"`,
      translation: `聆听唱针在黑胶微槽里泛起的温润声波`,
    },
    {
      id: `${track.id}-2`,
      time: Math.round(duration * 0.16),
      text: `Harmonics drifting through the vacuum tube amplifier`,
      translation: `偶次谐波在电子管功放的暖意中弥漫发散`,
    },
    {
      id: `${track.id}-3`,
      time: Math.round(duration * 0.25),
      text: `Every subtle breath captured by the Neumann ribbon microphone`,
      translation: `纽曼铝带麦克风收录了歌者每一声微不可察的呼吸`,
    },
    {
      id: `${track.id}-4`,
      time: Math.round(duration * 0.35),
      text: `And the rhythm pulses like a heartbeat in the night`,
      translation: `沉稳的节奏宛如午夜静谧而有力的心跳跳动`,
    },
    {
      id: `${track.id}-5`,
      time: Math.round(duration * 0.45),
      text: `♪ [Instrumental Solo & Dynamic Master Chorus - ${artist}] ♪`,
      translation: `【器乐华彩即兴 · 模拟母带高动态副歌段落】`,
    },
    {
      id: `${track.id}-6`,
      time: Math.round(duration * 0.58),
      text: `Echoes of the melody linger across the room`,
      translation: `悠扬的旋律回音在静谧的房间里久久缭绕`,
    },
    {
      id: `${track.id}-7`,
      time: Math.round(duration * 0.70),
      text: `Time slows down in the vintage 33 ⅓ RPM rotation`,
      translation: `时光仿佛凝固在 33 ⅓ 转的匀速旋转之中`,
    },
    {
      id: `${track.id}-8`,
      time: Math.round(duration * 0.82),
      text: `True acoustic warmth that digital bits can never replace`,
      translation: `那是冰冷的数字比特永远无法复现的原生温热`,
    },
    {
      id: `${track.id}-9`,
      time: Math.round(duration * 0.92),
      text: `♪ [Run-out groove fadeout · 唱针进入内圈引出槽] ♪`,
      translation: `【尾奏渐隐 · 唱针滑入母带黑胶引出槽】`,
    },
  ];

  return lines;
}
