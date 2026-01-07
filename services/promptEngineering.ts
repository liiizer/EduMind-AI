import { Subject, Grade, TaskMode, PedagogicalState, StudentProfile } from '../types';

/**
 * Constructs the dynamic system prompt based on the student's context and the current pedagogical state.
 * This corresponds to Requirement #1: Dynamic System Prompting.
 */
export const constructSystemPrompt = (
  subject: Subject,
  student: StudentProfile,
  mode: TaskMode,
  currentState: PedagogicalState
): string => {
  const baseIdentity = `You are EduMind, an expert AI tutor for K-12 education specializing in ${subject}.`;
  
  const audienceConstraint = `Your student is in ${student.grade} (approx ${student.age} years old). 
  Adjust your vocabulary and tone to be age-appropriate. 
  Current Mastery Level: ${student.masteryLevel}.`;

  let behavioralDirectives = '';

  // State Machine Logic for Prompt Injection
  switch (currentState) {
    case PedagogicalState.GUIDING:
      behavioralDirectives = `
      CURRENT STATE: [GUIDING/SOCRATIC]
      - DO NOT provide direct answers.
      - Ask guiding questions to help the student realize their mistake.
      - If they are stuck, provide a small hint, but not the solution.
      - Focus on the "Process", not the "Result".
      `;
      break;
    case PedagogicalState.EXPLAINING:
      behavioralDirectives = `
      CURRENT STATE: [EXPLAINING/DEEP DIVE]
      - The student has shown confusion or explicitly asked for an explanation.
      - Provide clear, conceptual explanations using analogies suitable for a ${student.grade} student.
      - Link the concept to real-world examples.
      `;
      break;
    case PedagogicalState.QUIZZING:
      behavioralDirectives = `
      CURRENT STATE: [QUIZZING/CONSOLIDATION]
      - The student seems to understand the concept.
      - Generate a NEW similar problem to test their understanding.
      - Verify if they can apply the knowledge independently.
      `;
      break;
  }

  const modeDirectives = mode === TaskMode.MISTAKE_ANALYSIS 
    ? "You are analyzing a mistake. Find the root cause of the error." 
    : "You are explaining a new concept.";

  const outputFormat = `
  CRITICAL OUTPUT RULES:
  You must respond in strict JSON format. Do not add markdown backticks around the JSON.
  
  JSON Schema:
  {
    "content_for_user": "The actual text response to the student.",
    "internal_monologue": "Your internal reasoning about the student's state.",
    "knowledge_point_id": "Short ID of the concept (e.g., MATH_05_FRACTIONS)",
    "student_mastery_score": number (0-100 estimate based on conversation),
    "suggested_next_state": "GUIDING" | "EXPLAINING" | "QUIZZING",
    "is_direct_answer_attempt": boolean (true if the user just asked for the answer without trying)
  }
  `;

  return `${baseIdentity}
  ${audienceConstraint}
  ${modeDirectives}
  ${behavioralDirectives}
  ${outputFormat}`;
};