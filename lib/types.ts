// Memory Layer V1 TypeScript Types

export type SectionType = 'pre_game' | 'in_game' | 'post_game' | 'locker_room' | 'off_court';
export type ColorType = 'red' | 'orange' | 'yellow' | 'green';
export type MessageRole = 'user' | 'assistant' | 'system';
export type CodeStatus = 'active' | 'archived';

export interface User {
  id: string;
  handle: string;
  created_at: string;
}

export interface Session {
  id: string;
  user_id: string;
  section: SectionType;
  started_at: string;
  ended_at: string | null;
  is_active: boolean;
}

export interface Message {
  id: string;
  session_id: string;
  role: MessageRole;
  text: string;
  created_at: string;
}

export interface Code {
  id: string;
  user_id: string;
  section: SectionType;
  name: string;
  one_line: string;
  status: CodeStatus;
  power_pct: number;
  created_at: string;
  updated_at: string;
}

export interface Log {
  id: string;
  code_id: string;
  user_id: string;
  section: SectionType;
  timestamp: string;
  counted: boolean;
}

export interface SectionProgress {
  id: string;
  user_id: string;
  section: SectionType;
  section_score: number;
  color: ColorType;
  total_valid_logs: number;
  unique_codes_used: number;
  last_active_at: string;
  grace_started_at: string | null;
  streak_days_7: number;
  green_hold_started_at: string | null;
  longest_green_hold_sec: number;
}

export interface RadarState {
  user_id: string;
  pre_game_score: number;
  in_game_score: number;
  post_game_score: number;
  locker_room_score: number;
  off_court_score: number;
  radar_score: number;
  updated_at: string;
}

// API Request/Response types
export interface CreateChatRequest {
  section: SectionType;
  message: string;
}

export interface CreateChatResponse {
  session_id: string;
  message: Message;
  coach_response: Message;
  conversation_state: {
    question_count: number;
    readiness_signals: {
      trigger_identified: boolean;
      goal_clarified: boolean;
      context_scoped: boolean;
      user_buy_in: boolean;
    };
    can_offer_code: boolean;
    contains_code_offer: boolean;
    is_valid_offer: boolean;
  };
}

export interface CreateCodeRequest {
  section: SectionType;
  name: string;
  one_line: string;
}

export interface CreateCodeResponse {
  code: Code;
  active_codes_count: number;
}

export interface CreateLogRequest {
  code_id: string;
}

export interface CreateLogResponse {
  log: Log;
  code: Code;
  section_progress: SectionProgress;
  radar_state: RadarState;
  should_count: boolean;
}

export interface GetProgressResponse {
  radar_state: RadarState;
  section_progress: SectionProgress[];
}

// Error types
export interface APIError {
  error: string;
  code?: string;
}

// Growth calculation helpers
export interface GrowthCalculation {
  new_power_pct: number;
  growth_amount: number;
  is_honeymoon: boolean;
  log_count: number;
}

export interface SectionPromotionRules {
  red_to_orange: { min_logs: number; min_codes: number };
  orange_to_yellow: { min_logs: number; min_codes: number };
  yellow_to_green: { min_logs: number; min_codes: number };
}

export const SECTION_PROMOTION_RULES: SectionPromotionRules = {
  red_to_orange: { min_logs: 2, min_codes: 1 },
  orange_to_yellow: { min_logs: 6, min_codes: 2 },
  yellow_to_green: { min_logs: 12, min_codes: 3 }
};

export const SECTIONS: SectionType[] = [
  'pre_game',
  'in_game',
  'post_game',
  'locker_room',
  'off_court'
];

export const DAILY_LOG_LIMIT = 3;
export const MAX_ACTIVE_CODES_PER_SECTION = 7;
export const DECAY_THRESHOLD_HOURS = 48;
export const DECAY_AMOUNT = 5;
export const GREEN_MAINTENANCE_DAYS = 4;
export const GREEN_GRACE_PERIOD_DAYS = 2;