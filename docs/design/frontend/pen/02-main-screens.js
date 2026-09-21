home=screen('P01 · 首页 · 唱片展示',0);
hero=frame(home,'暗室唱片台','fill_container','fill_container',{layout:'none',fill:[{type:'image',url:'./assets/home-room-bg.webp',mode:'fill'},{type:'color',color:'#00000075'}]});
Insert(hero,{type:'ref',name:'搜索唱片',ref:comp('C02'),x:322,y:22});
stage=frame(hero,'唱片陈列',342,333,{x:24,y:177,layout:'none'});
img(stage,'木质台面','./assets/shelf-dark-wood.webp',342,106,{x:0,y:227});
disc(stage,268,70,14);
img(stage,'主封套','./assets/demo-cover.png',245,245,{x:8,y:15,cornerRadius:3,effect:{type:'shadow',color:'#000000B0',blur:20,offset:{x:6,y:12}}});
caption=frame(hero,'唱片信息',342,110,{x:24,y:539,gap:9,alignItems:'center'});
txt(caption,'专辑名','Abbey Road',23,'$text',{fontWeight:'600'});txt(caption,'艺术家','The Beatles',14,'$secondary');txt(caption,'翻阅说明','左右翻阅 · 轻触查看唱片',12,'$muted');
navInsert(home,'home');finish(home);
collection=screen('P02 · 我的收藏 · 木质唱片柜',1);
ch=frame(collection,'收藏柜题头','fill_container',155,{fill:[{type:'image',url:'./assets/collection-header-bg.webp',mode:'fill'},{type:'color',color:'#00000066'}],padding:24,gap:10,justifyContent:'end'});
txt(ch,'标题','我的收藏',30,'$text',{fontFamily:'$display',fontWeight:'600'});txt(ch,'数量','6 张唱片 · 黑胶，是时光的收藏。',12,'$secondary');
filters=frame(collection,'分类与操作','fill_container',68,{layout:'horizontal',padding:[12,18],gap:8,alignItems:'center'});
for(const [label,sel] of [['全部',true],['摇滚',false],['爵士',false]])Insert(filters,{type:'ref',name:label,ref:comp('C04'),width:62,fill:sel?'#102418':'$surface',stroke:sel?'#268C3B':'$border',descendants:{[find('筛选文案',comp('C04'))]:{content:label}}});
ib(filters,'录入唱片','plus');ib(filters,'搜索与排序','sliders-horizontal');
shelf=frame(collection,'木纹唱片柜','fill_container','fill_container',{padding:[12,20],gap:12,fill:[{type:'image',url:'./assets/shelf-dark-wood.webp',mode:'fill'},{type:'color',color:'#00000044'}]});
for(const pair of [[['Abbey Road','The Beatles','./assets/demo-cover.png'],['OK Computer','Radiohead','./assets/demo-mic.png']],[['月之暗面','Pink Floyd','./assets/demo-prism.png'],['Kind of Blue','Miles Davis','./assets/demo-sax.png']]]){
 const r=frame(shelf,'唱片层','fill_container',208,{layout:'horizontal',gap:18});for(const [title,artist,url] of pair){const c=frame(r,title,'fill_container','fit_content',{gap:7});record(c,url,124);txt(c,'名称',title,13,'$text',{fontWeight:'600'});txt(c,'艺人',artist,11,'$secondary');}divider(shelf);
}
txt(shelf,'分页提示','最近添加     1 / 2 层     下一层 →',12,'$secondary');navInsert(collection,'collection');finish(collection);
detail=screen('P03 · 发行版详情 · 入藏',2);
header(detail,'唱片档案');db=body(detail,14);record(db,'./assets/demo-cover.png',204);
txt(db,'专辑名','Abbey Road',26,'$text',{fontWeight:'600'});txt(db,'艺术家','The Beatles · 1969',14,'$secondary');source(db,'示例目录 · 待核验');
txt(db,'发行版','50 周年版 · 180g · 33⅓ RPM',13,'$secondary');txt(db,'版本信息','Apple Records / EMI\n刻字矩阵 PCS 7088',12,'$muted',{textGrowth:'fixed-width',width:'fill_container',lineHeight:1.7});
actions=frame(db,'收藏操作','fill_container',48,{layout:'horizontal',gap:10});btn(actions,'加入收藏');ib(actions,'喜欢','heart');ib(actions,'加入愿望单','bookmark-plus');
divider(db);txt(db,'曲目标题','曲目档案',17,'$text',{fontWeight:'600'});
for(const [n,t,d] of [['01','Come Together','4:20'],['02','Something','3:03']]){const r=frame(db,'曲目 '+t,'fill_container',34,{layout:'horizontal',gap:12,alignItems:'center'});txt(r,'序号',n,12,'$muted');txt(r,'曲名',t,13,'$text',{textGrowth:'fixed-width',width:'fill_container'});txt(r,'时长',d,12,'$muted');}
txt(db,'音源状态','暂无可用音源 · 仍可收藏与整理唱片',12,'$secondary');navInsert(detail,'discover');finish(detail);
player=screen('P04 · 播放器 · 平台未接入',3);
header(player,'唱机',true,'list-music');pb=body(player,16);
tabs=frame(pb,'播放模式','fill_container',38,{layout:'horizontal',gap:8,justifyContent:'center'});source(tabs,'唱机');source(tabs,'歌词');
img(pb,'现有拟物唱机参考','./assets/turntable-reference.png','fill_container',320,{cornerRadius:8});
txt(pb,'曲名','Come Together',23,'$text',{fontWeight:'600'});txt(pb,'艺人','The Beatles · Abbey Road',13,'$secondary');
line=frame(pb,'进度','fill_container',34,{layout:'horizontal',justifyContent:'space_between'});txt(line,'当前时间','0:00',12,'$muted');txt(line,'音源不可用','暂无音源',12,'$muted');
controls=frame(pb,'播放控制','fill_container',56,{layout:'horizontal',gap:24,justifyContent:'center',alignItems:'center'});ib(controls,'上一首','skip-back');btn(controls,'暂无音源','disabled',166);ib(controls,'下一首','skip-forward');
txt(pb,'提示','音乐平台尚未接入。接入后可开始播放；当前不会模拟歌曲进度。',13,'$secondary',{textGrowth:'fixed-width',width:'fill_container',lineHeight:1.7});btn(pb,'查看音乐来源','secondary');finish(player);
Export([home,collection,detail,player],'png','./exports',{scale:1});
