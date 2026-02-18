
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { GameState, Team, Stats, LogEntry, Member } from './types';
import { INITIAL_STATS, TEAMS, REAL_MEMBERS, SISTER_GROUPS } from './constants';
import { generateEventNarrative } from './services/gemini';
import { 
  Users, Music, Tv, Briefcase, Heart, Coffee, 
  ArrowRight, ShieldAlert, Trophy, GraduationCap 
} from 'lucide-react';

const App: React.FC = () => {
  const [state, setState] = useState<GameState>({
    player: {
      name: "新人成员",
      team: Team.A,
      role: "正式成员",
      stats: { ...INITIAL_STATS },
      currentRank: "圏外",
      centerCount: 0,
      hasScandal: false,
      isKenmin: false,
    },
    members: [],
    time: { year: 1, quarter: 1 },
    actionsRemaining: 3,
    logs: [],
    isGameOver: false,
    gameStatus: 'start',
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
    const initialMembers: Member[] = shuffled.slice(0, 3).map(name => ({
      name,
      bond: Math.floor(Math.random() * 20) + 15,
      isCP: false
    }));

    setState(prev => ({
      ...prev,
      player: {
        ...prev.player,
        team: randomTeam,
        stats: {
          ...INITIAL_STATS,
          visual: Math.floor(Math.random() * 30) + 40,
          performance: Math.floor(Math.random() * 30) + 35,
          popularity: Math.floor(Math.random() * 100) + 200,
        }
      },
      members: initialMembers,
      gameStatus: 'playing'
    }));
    addLog("系统", `欢迎加入AKB48 Group！你被分配到了 ${randomTeam}。努力开启你的偶像生涯吧！`, "text-blue-600");
  };

  const doAction = (type: 'lesson' | 'variety' | 'work' | 'bond' | 'rest') => {
    if (state.actionsRemaining <= 0 || state.isGameOver) return;

    setState(prev => {
      const p = prev.player;
      const costMultiplier = p.isKenmin ? 1.5 : 1.0;
      let newStats = { ...p.stats };
      let logMsg = "";
      let logTag = "";

      switch(type) {
        case 'lesson':
          if (newStats.stamina < 20 * costMultiplier) return prev;
          newStats.performance += 6;
          newStats.popularity += 100;
          newStats.stamina -= 20 * costMultiplier;
          logTag = "剧场"; logMsg = "努力成为剧场女神，汗水打湿了练习室的地面。";
          break;
        case 'variety':
          if (newStats.stamina < 15 * costMultiplier) return prev;
          newStats.variety += 7;
          newStats.love += 4;
          newStats.stamina -= 15 * costMultiplier;
          logTag = "综艺"; logMsg = "录制《AKBINGO!》，你的综艺感让工作人员印象深刻。";
          break;
        case 'work':
          if (newStats.stamina < 20 * costMultiplier) return prev;
          newStats.popularity += 150;
          newStats.exposure += 15;
          newStats.stamina -= 20 * costMultiplier;
          logTag = "外务"; logMsg = "全国握手会爆满，你极佳的对应能力圈粉无数。";
          break;
        case 'bond':
          const members = [...prev.members];
          const targetIndex = Math.floor(Math.random() * members.length);
          members[targetIndex].bond += 15;
          newStats.mood = Math.min(100, newStats.mood + 10);
          logTag = "社交"; logMsg = `和 ${members[targetIndex].name} 一起去吃了下午茶，心情变好了。`;
          if (members[targetIndex].bond >= 80 && !members[targetIndex].isCP) {
              members[targetIndex].isCP = true;
              newStats.popularity += 300;
              logMsg = `你与 ${members[targetIndex].name} 正式组成了官方CP，引发了粉丝热烈讨论！`;
          }
          return {
            ...prev,
            player: { ...p, stats: newStats },
            members,
            actionsRemaining: prev.actionsRemaining - 1
          };
        case 'rest':
          newStats.stamina = Math.min(100, newStats.stamina + 50);
          newStats.mood = Math.min(100, newStats.mood + 20);
          newStats.popularity -= 20;
          logTag = "假期"; logMsg = "在家中彻底放松，充好了电。";
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
    const q = state.time.quarter;
    let eventType = "日常运营";

    if (Math.random() < 0.08) eventType = "文春炮爆料";
    else if (q === 2) eventType = "总选举开票";
    else if (q === 4) eventType = "组阁祭与升格";

    const narrative = await generateEventNarrative(state, eventType);
    setOverlay(narrative);

    // Update logic based on event
    setState(prev => {
      let nextQ = prev.time.quarter + 1;
      let nextY = prev.time.year;
      if (nextQ > 4) {
        nextQ = 1;
        nextY += 1;
      }

      const p = prev.player;
      let newRank = p.currentRank;
      let newStats = { ...p.stats };
      let newTeam = p.team;
      let isGameOver = prev.isGameOver;

      if (eventType === "总选举开票") {
        const rank = Math.max(1, 301 - Math.floor(newStats.popularity / 25));
        newRank = rank <= 100 ? rank : "圏外";
        if (rank === 1) p.centerCount++;
      }

      if (eventType === "文春炮爆料") {
        newStats.popularity = Math.max(0, newStats.popularity - 1500);
        newStats.love = 0;
        newStats.mood -= 40;
      }

      if (nextY > 8 || newStats.stamina <= 0 || newStats.mood <= 0) {
        isGameOver = true;
      }

      return {
        ...prev,
        player: { ...p, stats: newStats, currentRank: newRank, team: newTeam },
        time: { year: nextY, quarter: nextQ },
        actionsRemaining: 3,
        isGameOver,
        gameStatus: isGameOver ? 'ended' : 'playing'
      };
    });

    setIsLoading(false);
  };

  const closeOverlay = () => {
    setOverlay(null);
    if (state.isGameOver) {
      setState(prev => ({ ...prev, gameStatus: 'ended' }));
    }
  };

  if (state.gameStatus === 'start') {
    return (
      <div className="fixed inset-0 bg-gradient-to-br from-pink-500 to-rose-600 flex flex-col items-center justify-center text-white p-6 text-center">
        <h1 className="text-5xl font-bold mb-4 drop-shadow-lg">AKB48 GENERATION</h1>
        <p className="text-xl mb-8 opacity-90 italic">“梦想、汗水、以及无处不在的文春”</p>
        <button 
          onClick={startGame}
          className="bg-white text-rose-600 px-10 py-4 rounded-full text-xl font-bold shadow-2xl hover:scale-105 transition-transform"
        >
          开始偶像生涯
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen max-w-6xl mx-auto flex flex-col bg-white shadow-xl">
      {/* Overlay for events */}
      {overlay && (
        <div className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-6">
          <div className="bg-white rounded-2xl p-8 max-w-2xl w-full text-center">
            <h2 className="text-3xl font-bold text-pink-600 mb-4">{overlay.title}</h2>
            <p className="text-gray-700 text-lg leading-relaxed mb-8 whitespace-pre-wrap">{overlay.description}</p>
            <button 
              onClick={closeOverlay}
              className="bg-pink-600 text-white px-8 py-3 rounded-full font-bold hover:bg-pink-700 transition"
            >
              确 认
            </button>
          </div>
        </div>
      )}

      {/* Header */}
      <header className="bg-pink-600 text-white p-4 flex justify-between items-center shrink-0">
        <h2 className="text-lg font-bold">第 {state.time.year} 年 · 第 {state.time.quarter} 季度</h2>
        <div className="flex gap-4 text-sm font-medium">
          <span>{state.player.team}</span>
          <span className="bg-white/20 px-2 rounded">中心位: {state.player.centerCount}</span>
        </div>
      </header>

      {/* Stats Board */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-2 p-3 bg-pink-50 border-b border-pink-100">
        <StatItem label="颜值" value={state.player.stats.visual} />
        <StatItem label="表现" value={state.player.stats.performance} />
        <StatItem label="综艺" value={state.player.stats.variety} />
        <StatItem label="人气" value={state.player.stats.popularity} max={10000} color="bg-orange-400" />
        <StatItem label="体力" value={state.player.stats.stamina} max={100} color="bg-blue-400" />
        <StatItem label="心情" value={state.player.stats.mood} max={100} color="bg-green-400" />
        <StatItem label="运营爱" value={state.player.stats.love} max={100} color="bg-purple-400" />
        <StatItem label="曝光度" value={state.player.stats.exposure} max={100} color="bg-pink-400" />
      </div>

      {/* Main Game Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Side: Companion list */}
        <aside className="w-56 bg-gray-50 p-4 border-r border-gray-200 overflow-y-auto hidden md:block">
          <h3 className="text-pink-600 font-bold mb-3 flex items-center gap-2">
            <Users size={18} /> 剧场战友
          </h3>
          {state.members.map(m => (
            <div key={m.name} className="bg-white p-3 rounded-lg border border-gray-100 mb-2 shadow-sm">
              <div className="font-bold text-sm">{m.name}</div>
              <div className="text-xs text-gray-500 mt-1">羁绊: {m.bond}</div>
              {m.isCP && <div className="text-[10px] text-pink-500 font-bold mt-1">❤ 官方CP</div>}
            </div>
          ))}
        </aside>

        {/* Center: Log Display */}
        <main className="flex-1 flex flex-col p-4 overflow-hidden bg-white">
          <div className="flex-1 overflow-y-auto space-y-2 pr-2">
            {state.logs.map(log => (
              <div key={log.id} className="border-b border-pink-50 pb-2 animate-fade-in">
                <span className={`font-bold text-xs ${log.color}`}>[{log.tag}]</span>
                <span className="text-sm text-gray-700 ml-2">{log.message}</span>
              </div>
            ))}
            <div ref={logEndRef} />
          </div>
        </main>

        {/* Right Side: Actions */}
        <aside className="w-64 bg-gray-50 p-4 border-l border-gray-200 flex flex-col gap-3">
          <div className="bg-white rounded-xl p-4 text-center border-2 border-pink-100 mb-2">
            <div className="text-xs text-gray-400 mb-1">本季行动力</div>
            <div className="text-3xl font-black text-pink-600">{state.actionsRemaining}</div>
          </div>

          <ActionButton 
            onClick={() => doAction('lesson')} 
            icon={<Music size={18} />} 
            label="剧场练习" 
            desc="表现+ 人气+" 
            disabled={state.actionsRemaining === 0}
          />
          <ActionButton 
            onClick={() => doAction('variety')} 
            icon={<Tv size={18} />} 
            label="综艺外务" 
            desc="综艺+ 运营爱+" 
            disabled={state.actionsRemaining === 0}
          />
          <ActionButton 
            onClick={() => doAction('work')} 
            icon={<Briefcase size={18} />} 
            label="握手会" 
            desc="人气++ 曝光+" 
            disabled={state.actionsRemaining === 0}
          />
          <ActionButton 
            onClick={() => doAction('bond')} 
            icon={<Heart size={18} />} 
            label="队友交流" 
            desc="羁绊+ 心情+" 
            disabled={state.actionsRemaining === 0}
          />
          <ActionButton 
            onClick={() => doAction('rest')} 
            icon={<Coffee size={18} />} 
            label="彻底休假" 
            desc="恢复体力和心情" 
            disabled={state.actionsRemaining === 0}
          />

          <div className="mt-auto pt-4 border-t border-gray-200">
            <button 
              onClick={nextQuarter}
              disabled={isLoading || state.actionsRemaining > 0}
              className={`w-full py-3 rounded-xl font-bold flex items-center justify-center gap-2 transition ${isLoading || state.actionsRemaining > 0 ? 'bg-gray-300 cursor-not-allowed' : 'bg-pink-600 text-white hover:bg-pink-700 shadow-lg'}`}
            >
              {isLoading ? '处理中...' : '推进至下一季度'} <ArrowRight size={18} />
            </button>
            <div className="text-center mt-3">
               <div className="text-[10px] text-gray-400 uppercase tracking-widest mb-1">当前预估排名</div>
               <div className="text-2xl font-black text-pink-600">
                 {typeof state.player.currentRank === 'number' ? `#${state.player.currentRank}` : state.player.currentRank}
               </div>
            </div>
          </div>
        </aside>
      </div>

      {state.isGameOver && (
        <div className="fixed inset-0 bg-pink-600 z-[100] flex flex-col items-center justify-center text-white p-10 text-center">
           <GraduationCap size={80} className="mb-6" />
           <h1 className="text-5xl font-bold mb-4">偶像生涯 毕业</h1>
           <p className="text-2xl mb-8 opacity-90 max-w-lg">
             你在舞台上留下了无数汗水。最终人气达到 {state.player.stats.popularity}，累计担任过 {state.player.centerCount} 次中心位。
           </p>
           <button 
             onClick={() => window.location.reload()}
             className="bg-white text-pink-600 px-10 py-4 rounded-full text-xl font-bold shadow-2xl"
           >
             再次启航
           </button>
        </div>
      )}
    </div>
  );
};

const StatItem: React.FC<{ label: string; value: number; max?: number; color?: string }> = ({ label, value, max = 100, color = 'bg-pink-500' }) => {
  const percentage = Math.min(100, (value / max) * 100);
  return (
    <div className="bg-white p-2 rounded border border-pink-100 flex flex-col justify-between h-14">
      <div className="flex justify-between items-center mb-1">
        <span className="text-[10px] text-pink-600 font-bold">{label}</span>
        <span className="text-xs font-bold">{Math.floor(value)}</span>
      </div>
      <div className="h-1 bg-gray-100 rounded-full overflow-hidden">
        <div className={`h-full ${color} transition-all duration-500`} style={{ width: `${percentage}%` }} />
      </div>
    </div>
  );
};

const ActionButton: React.FC<{ onClick: () => void; icon: React.ReactNode; label: string; desc: string; disabled: boolean }> = ({ onClick, icon, label, desc, disabled }) => (
  <button 
    onClick={onClick}
    disabled={disabled}
    className={`w-full p-3 rounded-xl border-2 flex items-start gap-3 transition group ${disabled ? 'border-gray-200 opacity-50 cursor-not-allowed' : 'border-pink-200 bg-white hover:border-pink-600 hover:bg-pink-50'}`}
  >
    <div className={`p-2 rounded-lg ${disabled ? 'bg-gray-100 text-gray-400' : 'bg-pink-100 text-pink-600 group-hover:bg-pink-600 group-hover:text-white'}`}>
      {icon}
    </div>
    <div className="text-left">
      <div className="font-bold text-sm text-gray-800">{label}</div>
      <div className="text-[10px] text-gray-400">{desc}</div>
    </div>
  </button>
);

export default App;
