
export enum Team {
  A = 'Team A',
  K = 'Team K',
  B = 'Team B',
  Four = 'Team 4',
  Graduate = '毕业生'
}

export interface Stats {
  visual: number;
  performance: number;
  variety: number;
  popularity: number;
  stamina: number;
  mood: number;
  love: number; // 运营爱
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
    currentRank: number | string;
    centerCount: number;
    hasScandal: boolean;
    isKenmin: boolean; // 兼任
  };
  members: Member[];
  time: {
    year: number;
    quarter: number;
  };
  actionsRemaining: number;
  logs: LogEntry[];
  isGameOver: boolean;
  gameStatus: 'start' | 'playing' | 'event' | 'ended';
}

export interface LogEntry {
  id: string;
  tag: string;
  message: string;
  color: string;
  timestamp: Date;
}
