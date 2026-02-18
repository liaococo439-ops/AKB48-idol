
import { Team } from './types';

export const REAL_MEMBERS = [
  "柏木由纪", "向井地美音", "小嶋阳菜", "冈田奈奈", "小栗有以", 
  "大岛优子", "千叶惠里", "本田仁美", "仓野尾成美", "下尾美羽",
  "篠田麻里子", "武藤十梦", "渡边麻友", "板野友美", "宮脇咲良",
  "前田敦子", "横山由衣", "高桥南"
];

export const SISTER_GROUPS = ["SKE48", "NMB48", "HKT48", "NGT48", "STU48"];

export const TEAMS: Team[] = [Team.A, Team.K, Team.B, Team.Four];

export const INITIAL_STATS = {
  visual: 50,
  performance: 40,
  variety: 35,
  popularity: 150,
  stamina: 100,
  mood: 100,
  love: 20,
  exposure: 50
};
