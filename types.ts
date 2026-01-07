export enum Subject {
  MATH = 'Mathematics',
  CHINESE = 'Chinese Literature',
  ENGLISH = 'English',
  SCIENCE = 'Science'
}

export enum Grade {
  PRIMARY = 'Primary School',
  MIDDLE = 'Middle School'
}

export enum TaskMode {
  MISTAKE_ANALYSIS = 'Mistake Analysis',
  CONCEPT_EXPLANATION = 'Concept Explanation',
  HOMEWORK_HELP = 'Homework Help'
}

export enum PedagogicalState {
  GUIDING = 'GUIDING',     // Socratic questioning
  EXPLAINING = 'EXPLAINING', // Direct instruction/Deep dive
  QUIZZING = 'QUIZZING'    // Consolidation/Testing
}

export interface StudentProfile {
  name: string;
  age: number;
  grade: Grade;
  masteryLevel: 'Novice' | 'Intermediate' | 'Advanced';
}

export interface StructuredAIResponse {
  content_for_user: string;
  internal_monologue: string;
  knowledge_point_id: string;
  student_mastery_score: number; // 0-100
  suggested_next_state: PedagogicalState;
  is_direct_answer_attempt: boolean;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  metadata?: StructuredAIResponse;
  timestamp: number;
}

export interface AppState {
  subject: Subject;
  mode: TaskMode;
  pedagogicalState: PedagogicalState;
}