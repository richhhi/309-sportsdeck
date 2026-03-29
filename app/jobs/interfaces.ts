export interface FootballDataResponse {
  count: number;
  filters: Filters;
  competition: Competition;
  season: Season;
  teams: Team[];
}

export interface Filters {
  season: string;
}

export interface Competition {
  id: number;
  name: string;
  code: string;
  type: string;
  emblem: string;
}

export interface Season {
  id: number;
  startDate: string; // ISO date string
  endDate: string;   // ISO date string
  currentMatchday: number;
  winner: string | null;
}

export interface Team {
  area: Area;
  id: number;
  name: string;
  shortName: string;
  tla: string;
  crest: string;
  address: string;
  website: string;
  founded: number;
  clubColors: string;
  venue: string;
  runningCompetitions: RunningCompetition[];
  coach: Coach;
  squad: Player[];
  staff: StaffMember[]; // Based on empty array in JSON
  lastUpdated: string; // ISO date string
}

export interface Area {
  id: number;
  name: string;
  code: string;
  flag: string;
}

export interface RunningCompetition {
  id: number;
  name: string;
  code: string;
  type: string;
  emblem: string;
}

export interface StaffMember {
  id: number;
  firstName: string;
  lastName: string;
  name: string;
  dateOfBirth: string;
  nationality: string;
  contract: Contract;
}

// Since Coach and StaffMember share the exact same structure in this API:
export type Coach = StaffMember;

export interface Contract {
  start: string;
  until: string;
}

export interface Player {
  id: number;
  name: string;
  position: string;
  dateOfBirth: string | null; // Some entries have null dateOfBirth
  nationality: string;
}

export interface StandingsResponse {
  filters: Filters;
  area: Area;
  competition: Competition;
  season: Season;
  standings: StandingGroup[];
}

export interface StandingGroup {
  stage: string;   // e.g., "REGULAR_SEASON"
  type: string;    // e.g., "TOTAL"
  group: string | null;
  table: TableEntry[];
}

export interface TableEntry {
  position: number;
  team: StandingTeam;
  playedGames: number;
  form: string | null;
  won: number;
  draw: number;
  lost: number;
  points: number;
  goalsFor: number;
  goalsAgainst: number;
  goalDifference: number;
}

export interface StandingTeam {
  id: number;
  name: string;
  shortName: string;
  tla: string;
  crest: string;
}

export interface MatchesResponse {
  filters: MatchFilters;
  resultSet: ResultSet;
  matches: Match[];
}

export interface MatchFilters {
  dateFrom: string;
  dateTo: string;
  permission: string;
}

export interface ResultSet {
  count: number;
  competitions: string;
  first: string;
  last: string;
  played: number;
}

export interface Match {
  area: Area;
  competition: Competition;
  season: Season;
  id: number;
  utcDate: string;
  status: "FINISHED" | "TIMED" | "SCHEDULED" | "LIVE" | "IN_PLAY" | "PAUSED";
  matchday: number;
  stage: string;
  group: string | null;
  lastUpdated: string;
  homeTeam: MatchTeam;
  awayTeam: MatchTeam;
  score: Score;
  odds: Odds;
  referees: Referee[];
}

export interface MatchTeam {
  id: number;
  name: string;
  shortName: string;
  tla: string;
  crest: string;
}

export interface Score {
  winner: "HOME_TEAM" | "AWAY_TEAM" | "DRAW" | null;
  duration: string;
  fullTime: GoalStats;
  halfTime: GoalStats;
}

export interface GoalStats {
  home: number | null;
  away: number | null;
}

export interface Odds {
  msg: string;
}

export interface Referee {
  id: number;
  name: string;
  type: string;
  nationality: string | null;
}