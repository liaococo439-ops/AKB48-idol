
export enum Team {
  A = 'Team A',
  K = 'Team K',
  B = 'Team B',
  Four = 'Team 4',
  SKE = 'SKE48',
  NMB = 'NMB48',
  HKT = 'HKT48',
  Graduate = '毕业生'
}

export interface Stats {
  visual: number;
  performance: number;
  variety: number;
  popularity: number;
  stamina: number;
  mood: number;
  love: number;
  exposure: number;
}

export interface Member {
  name: string;
  bond: number;
  isCP: boolean;
}

export interface GameState {
  player: {
    name: string;
    team: Team;
    role: string;
    stats: Stats;
    currentRank: string; // Center, 神七, 选拔组, 圈内, 圈外
    numericalRank: number;
    centerCount: number;
    hasScandal: boolean;
    isKenmin: boolean; // 兼任
    currentSingleStatus: 'None' | 'Senbatsu' | 'Center';
  };
  members: Member[];
  time: {
    year: number;
    quarter: number;
  };
  actionsRemaining: number;
  logs: LogEntry[];
  isGameOver: boolean;
  gameStatus: 'start' | 'playing' | 'event' | 'janken' | 'ended';
  jankenWinner: boolean;
}

export interface LogEntry {
  id: string;
  tag: string;
  message: string;
  color: string;
  timestamp: Date;
}
