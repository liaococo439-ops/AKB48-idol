
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { GameState, Team, Stats, LogEntry, Member } from './types';
import { INITIAL_STATS, TEAMS, REAL_MEMBERS, SISTER_GROUPS } from './constants';
import { generateEventNarrative } from './services/gemini';
import { 
  Users, Music, Tv, Briefcase, Heart, Coffee, 
  ArrowRight, ShieldAlert, Trophy, GraduationCap, Star, Zap
} from 'lucide-react';

const App: React.FC = () => {
  const [state, setState] = useState<GameState>({
    player: {
      name: "新人成员",
      team: Team.A,
      role: "正式成员",
      stats: { ...INITIAL_STATS },
      currentRank: "圏外",
      numericalRank: 0,
      centerCount: 0,
      hasScandal: false,
      isKenmin: false,
      currentSingleStatus: 'None',
    },
    members: [],
    time: { year: 1, quarter: 1 },
    actionsRemaining: 3,
    logs: [],
    isGameOver: false,
    gameStatus: 'start',
    jankenWinner: false,
  });

  const [overlay, setOverlay] = useState<{ title: string; description: string } | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const logEndRef = useRef<HTMLDivElement>(null);

  const addLog = useCallback((tag: string, message: string, color: string = 'text-pink-600') => {
    const newLog: LogEntry = {
      id: Math.random().toString(36).substr(2, 9),
      tag,
      message,
      color,
      timestamp: new Date(),
    };
    setState(prev => ({
      ...prev,
      logs: [newLog, ...prev.logs.slice(0, 49)]
    }));
  }, []);

  const startGame = () => {
    const randomTeam = TEAMS[Math.floor(Math.random() * TEAMS.length)];
    const shuffled = [...REAL_MEMBERS].sort(() => 0.5 - Math.random());
    const initialMembers: Member[] = shuffled.slice(0, 5).map(name => ({
      name,
      bond: Math.floor(Math.random() * 20) + 10,
      isCP: false
    }));

    setState(prev => ({
      ...prev,
      player: {
        ...prev.player,
        team: randomTeam,
        stats: { ...INITIAL_STATS }
      },
      members: initialMembers,
      gameStatus: 'playing'
    }));
    addLog("系统", `加入AKB48！分属于 ${randomTeam}。属于你的篇章开始了。`, "text-blue-600");
  };

  const doAction = (type: 'lesson' | 'variety' | 'work' | 'bond' | 'rest') => {
    if (state.actionsRemaining <= 0 || state.isGameOver) return;

    setState(prev => {
      const p = prev.player;
      const costMultiplier = p.isKenmin ? 1.5 : 1.0;
      let newStats = { ...p.stats };
      let logMsg = "";
      let logTag = "";

      if (newStats.stamina < 15 * costMultiplier && type !== 'rest') {
        alert("体力不足，请休息！");
        return prev;
      }

      switch(type) {
        case 'lesson':
          newStats.performance += 6;
          newStats.popularity += 100;
          newStats.stamina -= 20 * costMultiplier;
          logTag = "训练"; logMsg = "在剧场练习室挥洒汗水。";
          break;
        case 'variety':
          newStats.variety += 7;
          newStats.love += 4;
          newStats.stamina -= 15 * costMultiplier;
          logTag = "综艺"; logMsg = "参与节目收录，表现亮眼。";
          break;
        case 'work':
          newStats.popularity += 180;
          newStats.exposure += 12;
          newStats.stamina -= 20 * costMultiplier;
          logTag = "外务"; logMsg = "大型握手会，对应力MAX。";
          break;
        case 'bond':
          const members = [...prev.members];
          const targetIndex = Math.floor(Math.random() * members.length);
          members[targetIndex].bond += 15;
          newStats.mood = Math.min(100, newStats.mood + 10);
          logTag = "社交"; logMsg = `与 ${members[targetIndex].name} 深度交流。`;
          if (members[targetIndex].bond >= 85 && !members[targetIndex].isCP) {
              members[targetIndex].isCP = true;
              newStats.popularity += 150; // CP对人气有一定提升但不过大
              logMsg = `你与 ${members[targetIndex].name} 组成了官方CP！`;
          }
          return {
            ...prev,
            player: { ...p, stats: newStats },
            members,
            actionsRemaining: prev.actionsRemaining - 1
          };
        case 'rest':
          newStats.stamina = Math.min(100, newStats.stamina + 60);
          newStats.mood = Math.min(100, newStats.mood + 25);
          logTag = "休息"; logMsg = "充足的睡眠是偶像的本钱。";
          break;
      }

      addLog(logTag, logMsg);
      return {
        ...prev,
        player: { ...p, stats: newStats },
        actionsRemaining: prev.actionsRemaining - 1
      };
    });
  };

  const nextQuarter = async () => {
    setIsLoading(true);
    const p = state.player;
    const y = state.time.year;
    const q = state.time.quarter;
    
    let eventType = "日常运营";
    let summary = "";

    // 1. 单曲选拔逻辑
    const calcSingleSelection = (weights: { pop: number; love: number; perf: number }) => {
      const score = (p.stats.popularity / 100) * weights.pop + p.stats.love * weights.love + p.stats.performance * weights.perf;
      if (score > 70) return 'Center';
      if (score > 50) return 'Senbatsu';
      return 'None';
    };

    if (q === 1) {
      const status = calcSingleSelection({ pop: 0.3, love: 0.5, perf: 0.2 });
      eventType = "樱花单选拔";
      summary = status === 'Center' ? "你成为了樱花单Center！" : (status === 'Senbatsu' ? "你入选了樱花单选拔！" : "你落选了樱花单选拔。");
      state.player.currentSingleStatus = status;
    } else if (q === 2) {
      const status = calcSingleSelection({ pop: 0.5, love: 0.3, perf: 0.2 });
      eventType = "夏日单选拔";
      summary = status === 'Center' ? "你成为了夏日单Center！" : (status === 'Senbatsu' ? "你入选了夏日单选拔！" : "你落选了。");
      state.player.currentSingleStatus = status;
    } else if (q === 3) {
      eventType = "总选举开票";
      if (y % 2 === 0) eventType = "总选举与猜拳大会";
    } else if (q === 4) {
      eventType = "年终盛典(RH100/组阁/红白)";
    }

    const narrative = await generateEventNarrative(state, eventType);
    setOverlay({ title: narrative.title, description: (summary ? summary + "\n\n" : "") + narrative.description });

    // 2. 状态更新逻辑
    setState(prev => {
      let nextQ = prev.time.quarter + 1;
      let nextY = prev.time.year;
      if (nextQ > 4) {
        nextQ = 1;
        nextY += 1;
      }

      const player = { ...prev.player };
      let newStats = { ...player.stats };
      let isGameOver = prev.isGameOver;

      // 总选举排名逻辑
      if (q === 2) {
        const pop = player.stats.popularity;
        if (pop > 8000) { player.currentRank = "Center"; player.centerCount++; }
        else if (pop > 6000) player.currentRank = "神七";
        else if (pop > 4000) player.currentRank = "选拔组";
        else if (pop > 2000) player.currentRank = "圈内";
        else player.currentRank = "圈外";
      }

      // 猜拳逻辑 (两年一度 Q3 判定)
      if (q === 3 && nextY % 2 === 0) {
        const win = Math.random() > 0.9; // 10% 几率赢
        if (win) {
          player.centerCount++;
          player.currentSingleStatus = 'Center';
          const effect = (newStats.visual + newStats.performance + newStats.popularity / 100) / 3;
          if (effect > 60) {
            newStats.popularity += 2000;
            addLog("猜拳", "凭借强运和过人素质，你的猜拳单曲大爆！", "text-yellow-500");
          } else {
            newStats.popularity -= 500;
            addLog("猜拳", "虽然赢了猜拳，但素质不足引发了德不配位的争议。", "text-red-500");
          }
        }
      }

      // 组阁与红白 (Q4)
      if (q === 4) {
        // RH100
        if (player.stats.popularity > 3000) {
          newStats.popularity += 500;
          addLog("RH100", "你的曲目进入了TOP100，获得了表演机会！", "text-green-500");
        }
        
        // 组阁祭
        if (Math.random() < 0.15) {
          if (newStats.performance > 80 && newStats.love > 70 && !player.isKenmin) {
            player.isKenmin = true;
            addLog("组阁", "你被任命为兼任成员，活动范围扩大了！", "text-purple-600");
          } else {
            const sister = SISTER_GROUPS[Math.floor(Math.random() * SISTER_GROUPS.length)];
            player.team = sister as any;
            addLog("组阁", `你被移籍到了 ${sister}，开始新的征程。`, "text-orange-600");
          }
        }

        // 红白选拔
        if (player.stats.love > 60 || player.stats.popularity > 5000) {
          newStats.exposure += 30;
          newStats.popularity += 1000;
          addLog("红白", "你入选了NHK红白歌合战，国民度大增！", "text-red-600");
        }
      }

      if (nextY > 10 || newStats.stamina <= -20) isGameOver = true;

      return {
        ...prev,
        player,
        time: { year: nextY, quarter: nextQ },
        actionsRemaining: 3,
        isGameOver,
        gameStatus: isGameOver ? 'ended' : 'playing'
      };
    });

    setIsLoading(false);
  };

  if (state.gameStatus === 'start') {
    return (
      <div className="fixed inset-0 bg-gradient-to-br from-pink-500 to-rose-600 flex flex-col items-center justify-center text-white p-6 text-center">
        <h1 className="text-6xl font-black mb-4 drop-shadow-2xl">AKB48 终极养成 v8.5</h1>
        <p className="text-xl mb-12 opacity-80 tracking-widest italic">“梦想在远方，汗水在脚下”</p>
        <div className="space-y-4">
          <button 
            onClick={startGame}
            className="bg-white text-rose-600 px-12 py-5 rounded-full text-2xl font-bold shadow-[0_10px_0_0_#be123c] active:translate-y-1 active:shadow-none transition-all"
          >
            开启偶像篇章
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen max-w-7xl mx-auto flex flex-col bg-white shadow-2xl overflow-hidden">
      {overlay && (
        <div className="fixed inset-0 bg-black/95 z-[100] flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white rounded-3xl p-10 max-w-3xl w-full border-4 border-pink-500 relative overflow-hidden">
            <div className="absolute top-0 right-0 p-4 opacity-10"><Star size={120} /></div>
            <h2 className="text-4xl font-black text-pink-600 mb-6 flex items-center gap-3">
              <Zap className="fill-pink-600" /> {overlay.title}
            </h2>
            <p className="text-gray-700 text-xl leading-relaxed mb-10 whitespace-pre-wrap font-medium">{overlay.description}</p>
            <button 
              onClick={() => setOverlay(null)}
              className="w-full bg-pink-600 text-white py-5 rounded-2xl text-2xl font-bold hover:bg-pink-700 shadow-xl"
            >
              确 定
            </button>
          </div>
        </div>
      )}

      {/* Header Info */}
      <header className="bg-gradient-to-r from-pink-600 to-rose-500 text-white p-5 flex justify-between items-center shadow-lg">
        <div>
          <h2 className="text-2xl font-black tracking-tighter">Year {state.time.year} / Q{state.time.quarter}</h2>
          <div className="text-xs opacity-80 uppercase font-bold">{state.player.team} · {state.player.isKenmin ? '兼任中' : '全职'}</div>
        </div>
        <div className="flex gap-6 items-center">
          <div className="text-right">
            <div className="text-xs opacity-70">总选排名</div>
            <div className="text-xl font-black">{state.player.currentRank}</div>
          </div>
          <div className="h-10 w-px bg-white/30" />
          <div className="text-right">
            <div className="text-xs opacity-70">Center次数</div>
            <div className="text-xl font-black">{state.player.centerCount}</div>
          </div>
        </div>
      </header>

      {/* Stats Bar */}
      <div className="grid grid-cols-4 md:grid-cols-8 gap-1 p-2 bg-pink-50 border-b-2 border-pink-100">
        <StatBar label="颜值" value={state.player.stats.visual} color="bg-rose-400" />
        <StatBar label="表现" value={state.player.stats.performance} color="bg-orange-400" />
        <StatBar label="综艺" value={state.player.stats.variety} color="bg-amber-400" />
        <StatBar label="人气" value={state.player.stats.popularity} max={10000} color="bg-pink-500" />
        <StatBar label="体力" value={state.player.stats.stamina} max={100} color="bg-cyan-500" />
        <StatBar label="心情" value={state.player.stats.mood} max={100} color="bg-green-500" />
        <StatBar label="运营爱" value={state.player.stats.love} max={100} color="bg-purple-500" />
        <StatBar label="曝光" value={state.player.stats.exposure} max={100} color="bg-indigo-500" />
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* Left: Members & Social */}
        <aside className="w-64 bg-gray-50 p-6 border-r flex flex-col hidden lg:flex">
          <h3 className="font-black text-pink-600 mb-4 flex items-center gap-2 text-lg">
            <Users size={22} /> 核心成员
          </h3>
          <div className="space-y-3">
            {state.members.map(m => (
              <div key={m.name} className="bg-white p-4 rounded-2xl border-2 border-gray-100 shadow-sm">
                <div className="font-bold flex justify-between items-center">
                  {m.name} 
                  {m.isCP && <Heart size={14} className="text-red-500 fill-red-500" />}
                </div>
                <div className="text-xs text-gray-400 mt-1">羁绊: {m.bond}</div>
                <div className="w-full h-1 bg-gray-100 mt-2 rounded-full overflow-hidden">
                  <div className="h-full bg-pink-400" style={{ width: `${Math.min(100, m.bond)}%` }} />
                </div>
              </div>
            ))}
          </div>
        </aside>

        {/* Center: Logs */}
        <main className="flex-1 p-6 overflow-y-auto bg-white scroll-smooth">
          <div className="max-w-3xl mx-auto space-y-4">
            {state.logs.length === 0 && <div className="text-center py-20 text-gray-300 italic">尚未开始活动...</div>}
            {state.logs.map(log => (
              <div key={log.id} className="flex gap-4 p-4 rounded-2xl bg-gray-50 border-l-4 border-pink-400 animate-in slide-in-from-bottom-4 duration-500">
                <div className="shrink-0 flex items-center justify-center w-12 h-12 bg-white rounded-full shadow-sm text-lg font-bold">
                  {log.tag[0]}
                </div>
                <div>
                   <div className={`text-xs font-black uppercase tracking-wider ${log.color}`}>{log.tag}</div>
                   <div className="text-gray-700 mt-1 font-medium">{log.message}</div>
                </div>
              </div>
            ))}
          </div>
        </main>

        {/* Right: Actions */}
        <aside className="w-80 bg-gray-50 p-6 border-l flex flex-col gap-4">
          <div className="bg-pink-600 text-white rounded-3xl p-6 shadow-xl mb-4 text-center">
            <div className="text-sm font-bold opacity-80 mb-1">本季行动力</div>
            <div className="text-5xl font-black">{state.actionsRemaining}</div>
          </div>

          <div className="space-y-3">
            <ActionBtn 
              onClick={() => doAction('lesson')} 
              icon={<Music />} 
              title="剧场 lessons" 
              sub="表现 & 人气" 
              disabled={state.actionsRemaining === 0}
            />
            <ActionBtn 
              onClick={() => doAction('variety')} 
              icon={<Tv />} 
              title="综艺外务" 
              sub="综艺 & 运营爱" 
              disabled={state.actionsRemaining === 0}
            />
            <ActionBtn 
              onClick={() => doAction('work')} 
              icon={<Briefcase />} 
              title="全国握手会" 
              sub="人气 & 曝光" 
              disabled={state.actionsRemaining === 0}
            />
            <ActionBtn 
              onClick={() => doAction('bond')} 
              icon={<Heart />} 
              title="成员私联" 
              sub="羁绊 & 炒CP" 
              disabled={state.actionsRemaining === 0}
            />
            <ActionBtn 
              onClick={() => doAction('rest')} 
              icon={<Coffee />} 
              title="完全离线" 
              sub="恢复体力" 
              disabled={state.actionsRemaining === 0}
            />
          </div>

          <button 
            onClick={nextQuarter}
            disabled={isLoading || state.actionsRemaining > 0}
            className={`mt-auto w-full py-5 rounded-3xl font-black text-xl flex items-center justify-center gap-3 transition-all ${isLoading || state.actionsRemaining > 0 ? 'bg-gray-300 text-gray-500' : 'bg-black text-white hover:bg-gray-800 shadow-2xl active:scale-95'}`}
          >
            {isLoading ? '结算中...' : '推 进 季 度'} <ArrowRight />
          </button>
        </aside>
      </div>

      {state.isGameOver && (
        <div className="fixed inset-0 bg-black z-[200] flex flex-col items-center justify-center p-10 text-center animate-in fade-in duration-1000">
           <GraduationCap size={120} className="text-pink-600 mb-8" />
           <h1 className="text-7xl font-black text-white mb-6 italic">毕业仪式</h1>
           <p className="text-2xl text-gray-400 mb-12 max-w-2xl leading-relaxed">
             你在 AKB48 的光辉岁月结束了。
             最终人气: <span className="text-pink-500 font-bold">{state.player.stats.popularity}</span><br/>
             累计 Center: <span className="text-pink-500 font-bold">{state.player.centerCount}</span>
           </p>
           <button 
             onClick={() => window.location.reload()}
             className="bg-pink-600 text-white px-16 py-6 rounded-full text-3xl font-black shadow-[0_10px_0_0_#9d174d] hover:bg-pink-700 transition-all active:translate-y-2 active:shadow-none"
           >
             再续传奇
           </button>
        </div>
      )}
    </div>
  );
};

const StatBar: React.FC<{ label: string; value: number; max?: number; color: string }> = ({ label, value, max = 100, color }) => {
  const percent = Math.min(100, (value / max) * 100);
  return (
    <div className="bg-white p-2 rounded-xl border border-pink-100 shadow-sm flex flex-col justify-between h-16">
      <div className="flex justify-between items-center text-[10px] font-black text-gray-400 uppercase tracking-tighter">
        <span>{label}</span>
        <span className="text-gray-800">{Math.floor(value)}</span>
      </div>
      <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
        <div className={`h-full ${color} transition-all duration-700 ease-out`} style={{ width: `${percent}%` }} />
      </div>
    </div>
  );
};

const ActionBtn: React.FC<{ onClick: () => void; icon: React.ReactNode; title: string; sub: string; disabled: boolean }> = ({ onClick, icon, title, sub, disabled }) => (
  <button 
    onClick={onClick}
    disabled={disabled}
    className={`w-full p-4 rounded-2xl border-2 flex items-center gap-4 transition-all group ${disabled ? 'bg-gray-100 border-transparent opacity-40 cursor-not-allowed' : 'bg-white border-gray-100 hover:border-pink-500 hover:shadow-lg active:scale-95'}`}
  >
    <div className={`p-3 rounded-xl transition-colors ${disabled ? 'bg-gray-200' : 'bg-pink-50 text-pink-600 group-hover:bg-pink-600 group-hover:text-white'}`}>
      {icon}
    </div>
    <div className="text-left">
      <div className="font-black text-gray-800 text-sm group-hover:text-pink-600 transition-colors">{title}</div>
      <div className="text-[10px] text-gray-400 font-bold uppercase">{sub}</div>
    </div>
  </button>
);

export default App;
