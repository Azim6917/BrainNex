import axios from 'axios';
import { auth } from './firebase';

const envUrl = import.meta.env.VITE_API_URL;
const resolvedBaseUrl = envUrl 
  ? (envUrl.replace(/\/$/, '').endsWith('/api') ? envUrl.replace(/\/$/, '') : envUrl.replace(/\/$/, '') + '/api')
  : '/api';

const api = axios.create({ baseURL: resolvedBaseUrl });

// Attach Firebase auth token to every request
api.interceptors.request.use(async (config) => {
  const user = auth.currentUser;
  if (user) {
    const token = await user.getIdToken();
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// ─── AI API ───────────────────────────────────────────────────────────────────
export const chatWithAI = (messages, subject, studentLevel, grade) =>
    api.post("/ai/chat", { messages, subject, studentLevel, grade });

export const generateQuiz = (subject, topic, difficulty, numQuestions = 5, grade) =>
    api.post("/ai/generate-quiz", { subject, topic, difficulty, numQuestions, grade });

export const detectWeakTopics = (quizHistory) =>
  api.post('/ai/detect-weak-topics', { quizHistory });

export const generateLearningPath = (subject, currentLevel, completedTopics, goal) =>
  api.post('/ai/learning-path', { subject, currentLevel, completedTopics, goal });

export const generateTopicLesson    = (subject, topic, level, goal) =>
  api.post('/ai/topic-lesson',    { subject, topic, level, goal });

export const generateTopicQuiz      = (subject, topic, level) =>
  api.post('/ai/topic-quiz',      { subject, topic, level });

export const generateTopicResources = (subject, topic) =>
  api.post('/ai/topic-resources', { subject, topic });

export const getAdaptiveDifficulty = (recentScores, currentDifficulty) =>
  api.post('/ai/adaptive-difficulty', { recentScores, currentDifficulty });

// ─── Progress API ─────────────────────────────────────────────────────────────
export const fetchProfile     = ()          => api.get('/progress/profile');
export const updateStreak     = ()          => api.post('/progress/update-streak');
export const saveQuizResult   = (data)      => api.post('/progress/quiz-result', data);
export const fetchQuizHistory = (limit)     => api.get(`/progress/quiz-history?limit=${limit || 20}`);
export const updateDifficulty = (difficulty) => api.post('/progress/update-difficulty', { difficulty });
export const fetchSubjectProgress = ()      => api.get('/progress/subject-progress');

export default api;


// ─── New AI endpoints ─────────────────────────────────────────────────────────
export const generateStudySession = (subject, topic, level, grade) =>
    api.post("/ai/study-session", { subject, topic, level, grade });

export const generateFlashcards = (subject, topic, wrongQuestions, grade) =>
    api.post("/ai/flashcards", { subject, topic, wrongQuestions, grade });

export const explainAnswer = (question, correctAnswer, subject, grade) =>
  api.post('/ai/explain-answer', { question, correctAnswer, subject, grade });

export const getWeeklyReport = (quizHistory, streak, totalXP) =>
  api.post('/ai/weekly-report', { quizHistory, streak, totalXP });
