// Types for the Cheat Code Practice Game feature

export type AnswerType = 'negative' | 'helpful' | 'optimal';
export type ScenarioType = 'internal' | 'external';

export interface GameOption {
  text: string;
  type: AnswerType;
  feedback: string;
}

export interface GameScenario {
  id: string;
  cheat_code_id: string;
  user_id: string;
  situation: string;
  current_thought: string;
  options: GameOption[];
  scenario_type: ScenarioType;
  created_at: string;
}

export interface GameSession {
  id: string;
  cheat_code_id: string;
  user_id: string;
  score: number; // 0-3
  total_questions: number; // always 3
  scenario_ids: string[];
  user_answers: number[]; // indices of selected options
  momentum_awarded: number;
  is_first_play: boolean;
  created_at: string;
  completed_at?: string;
}

export interface GameSessionResult {
  session_id: string;
  score: number;
  total_questions: number;
  momentum_awarded: number;
  is_first_play: boolean;
  previous_momentum: number;
  new_momentum: number;
  no_momentum_reason?: 'daily_cap' | 'code_limit' | 'daily_code_limit' | null;
}

// Request/Response types for API

export interface GenerateScenariosRequest {
  cheat_code_id: string;
  cheat_code_data: {
    title: string;
    category: string;
    what?: string;
    when?: string;
    how?: string;
    why?: string;
    phrase?: string;
    original_situation?: string; // The user's original issue/situation
    original_thought?: string; // The negative thought they were having
  };
  initial?: boolean; // If true, generate 3 scenarios for fast loading, otherwise 7
  count?: number; // Explicit count of scenarios to generate (overrides initial)
}

export interface GenerateScenariosResponse {
  success: boolean;
  scenarios_count?: number;
  error?: string;
}

export interface FetchScenariosRequest {
  cheat_code_id: string;
}

export interface FetchScenariosResponse {
  success: boolean;
  scenarios?: GameScenario[];
  has_scenarios?: boolean;
  error?: string;
}

export interface SubmitGameSessionRequest {
  cheat_code_id: string;
  scenario_ids: string[];
  user_answers: number[]; // indices of options selected
  is_first_play: boolean;
}

export interface SubmitGameSessionResponse {
  success: boolean;
  result?: GameSessionResult;
  error?: string;
}
