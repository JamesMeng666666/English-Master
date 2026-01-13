import { StudyItem } from './types';

const generateId = () => Math.random().toString(36).substr(2, 9);

export const DEFAULT_STUDY_DATA: StudyItem[] = [
  // --- 30 Phrases ---
  {
    id: generateId(),
    english: "catch sight of",
    chinese: "看见，瞥见",
    type: "phrase",
    example: "I caught sight of him in the crowd.",
    stage: 0,
    nextReviewDate: Date.now(),
    easeFactor: 2.5
  },
  {
    id: generateId(),
    english: "pay attention to",
    chinese: "注意",
    type: "phrase",
    example: "Please pay attention to the safety instructions.",
    stage: 0,
    nextReviewDate: Date.now(),
    easeFactor: 2.5
  },
  {
    id: generateId(),
    english: "run out of",
    chinese: "用完，耗尽",
    type: "phrase",
    example: "We have ran out of milk, so I need to buy some.",
    stage: 0,
    nextReviewDate: Date.now(),
    easeFactor: 2.5
  },
  {
    id: generateId(),
    english: "keep up with",
    chinese: "跟上，赶上",
    type: "phrase",
    example: "It is hard to keep up with the rapid changes in technology.",
    stage: 0,
    nextReviewDate: Date.now(),
    easeFactor: 2.5
  },
  {
    id: generateId(),
    english: "look after",
    chinese: "照顾，照料",
    type: "phrase",
    example: "Can you look after my dog while I am away?",
    stage: 0,
    nextReviewDate: Date.now(),
    easeFactor: 2.5
  },
  {
    id: generateId(),
    english: "give up",
    chinese: "放弃",
    type: "phrase",
    example: "Don't give up on your dreams regardless of the difficulties.",
    stage: 0,
    nextReviewDate: Date.now(),
    easeFactor: 2.5
  },
  {
    id: generateId(),
    english: "turn down",
    chinese: "拒绝；调低",
    type: "phrase",
    example: "He turned down the job offer because the salary was too low.",
    stage: 0,
    nextReviewDate: Date.now(),
    easeFactor: 2.5
  },
  {
    id: generateId(),
    english: "put off",
    chinese: "推迟",
    type: "phrase",
    example: "The meeting was put off until next week due to the storm.",
    stage: 0,
    nextReviewDate: Date.now(),
    easeFactor: 2.5
  },
  {
    id: generateId(),
    english: "come up with",
    chinese: "想出，提出",
    type: "phrase",
    example: "She came up with a brilliant idea for the project.",
    stage: 0,
    nextReviewDate: Date.now(),
    easeFactor: 2.5
  },
  {
    id: generateId(),
    english: "get along with",
    chinese: "与...相处",
    type: "phrase",
    example: "I find it easy to get along with my new colleagues.",
    stage: 0,
    nextReviewDate: Date.now(),
    easeFactor: 2.5
  },
  {
    id: generateId(),
    english: "take advantage of",
    chinese: "利用",
    type: "phrase",
    example: "You should take advantage of this opportunity to learn.",
    stage: 0,
    nextReviewDate: Date.now(),
    easeFactor: 2.5
  },
  {
    id: generateId(),
    english: "in charge of",
    chinese: "负责，主管",
    type: "phrase",
    example: "Who is in charge of organizing the event?",
    stage: 0,
    nextReviewDate: Date.now(),
    easeFactor: 2.5
  },
  {
    id: generateId(),
    english: "regardless of",
    chinese: "不管，不顾",
    type: "phrase",
    example: "The game will continue regardless of the weather.",
    stage: 0,
    nextReviewDate: Date.now(),
    easeFactor: 2.5
  },
  {
    id: generateId(),
    english: "due to",
    chinese: "由于，因为",
    type: "phrase",
    example: "The flight was cancelled due to heavy fog.",
    stage: 0,
    nextReviewDate: Date.now(),
    easeFactor: 2.5
  },
  {
    id: generateId(),
    english: "as a result",
    chinese: "结果",
    type: "phrase",
    example: "He studied hard and, as a result, passed the exam with flying colors.",
    stage: 0,
    nextReviewDate: Date.now(),
    easeFactor: 2.5
  },
  {
    id: generateId(),
    english: "in addition to",
    chinese: "除...之外",
    type: "phrase",
    example: "In addition to English, she speaks French and Spanish.",
    stage: 0,
    nextReviewDate: Date.now(),
    easeFactor: 2.5
  },
  {
    id: generateId(),
    english: "make sure",
    chinese: "确保，务必",
    type: "phrase",
    example: "Please make sure you lock the door before leaving.",
    stage: 0,
    nextReviewDate: Date.now(),
    easeFactor: 2.5
  },
  {
    id: generateId(),
    english: "rely on",
    chinese: "依赖，依靠",
    type: "phrase",
    example: "You can rely on him to help you when you are in trouble.",
    stage: 0,
    nextReviewDate: Date.now(),
    easeFactor: 2.5
  },
  {
    id: generateId(),
    english: "cope with",
    chinese: "处理，应付",
    type: "phrase",
    example: "It is difficult to cope with stress without support.",
    stage: 0,
    nextReviewDate: Date.now(),
    easeFactor: 2.5
  },
  {
    id: generateId(),
    english: "figure out",
    chinese: "弄清楚，解决",
    type: "phrase",
    example: "I can't figure out why the computer isn't working.",
    stage: 0,
    nextReviewDate: Date.now(),
    easeFactor: 2.5
  },
  {
    id: generateId(),
    english: "look into",
    chinese: "调查，研究",
    type: "phrase",
    example: "The police promised to look into the matter immediately.",
    stage: 0,
    nextReviewDate: Date.now(),
    easeFactor: 2.5
  },
  {
    id: generateId(),
    english: "stand for",
    chinese: "代表，象征",
    type: "phrase",
    example: "What do the letters 'UN' stand for?",
    stage: 0,
    nextReviewDate: Date.now(),
    easeFactor: 2.5
  },
  {
    id: generateId(),
    english: "break down",
    chinese: "发生故障；分解",
    type: "phrase",
    example: "Our car broke down on the highway.",
    stage: 0,
    nextReviewDate: Date.now(),
    easeFactor: 2.5
  },
  {
    id: generateId(),
    english: "carry out",
    chinese: "执行，实施",
    type: "phrase",
    example: "They plan to carry out the experiment next week.",
    stage: 0,
    nextReviewDate: Date.now(),
    easeFactor: 2.5
  },
  {
    id: generateId(),
    english: "set up",
    chinese: "建立，设立",
    type: "phrase",
    example: "They decided to set up a new branch in the city.",
    stage: 0,
    nextReviewDate: Date.now(),
    easeFactor: 2.5
  },
  {
    id: generateId(),
    english: "focus on",
    chinese: "集中于，专注于",
    type: "phrase",
    example: "You need to focus on your studies to get good grades.",
    stage: 0,
    nextReviewDate: Date.now(),
    easeFactor: 2.5
  },
  {
    id: generateId(),
    english: "remind of",
    chinese: "使想起",
    type: "phrase",
    example: "This song reminds me of my childhood.",
    stage: 0,
    nextReviewDate: Date.now(),
    easeFactor: 2.5
  },
  {
    id: generateId(),
    english: "consist of",
    chinese: "由...组成",
    type: "phrase",
    example: "The team consists of five members.",
    stage: 0,
    nextReviewDate: Date.now(),
    easeFactor: 2.5
  },
  {
    id: generateId(),
    english: "apply for",
    chinese: "申请",
    type: "phrase",
    example: "He decided to apply for the scholarship.",
    stage: 0,
    nextReviewDate: Date.now(),
    easeFactor: 2.5
  },
  {
    id: generateId(),
    english: "participate in",
    chinese: "参加",
    type: "phrase",
    example: "Everyone is encouraged to participate in the discussion.",
    stage: 0,
    nextReviewDate: Date.now(),
    easeFactor: 2.5
  },
  // --- 5 Sentences ---
  {
    id: generateId(),
    english: "It is important to maintain a balanced diet for good health.",
    chinese: "保持均衡饮食对健康很重要。",
    type: "sentence",
    stage: 0,
    nextReviewDate: Date.now(),
    easeFactor: 2.5
  },
  {
    id: generateId(),
    english: "Technology has changed the way we communicate with each other.",
    chinese: "科技改变了我们要彼此交流的方式。",
    type: "sentence",
    stage: 0,
    nextReviewDate: Date.now(),
    easeFactor: 2.5
  },
  {
    id: generateId(),
    english: "Environmental protection is a global issue that concerns everyone.",
    chinese: "环境保护是一个关乎每个人的全球性问题。",
    type: "sentence",
    stage: 0,
    nextReviewDate: Date.now(),
    easeFactor: 2.5
  },
  {
    id: generateId(),
    english: "Learning a foreign language can broaden your horizons.",
    chinese: "学习外语可以开阔你的视野。",
    type: "sentence",
    stage: 0,
    nextReviewDate: Date.now(),
    easeFactor: 2.5
  },
  {
    id: generateId(),
    english: "Practice makes perfect when acquiring a new skill.",
    chinese: "在掌握一项新技能时，熟能生巧。",
    type: "sentence",
    stage: 0,
    nextReviewDate: Date.now(),
    easeFactor: 2.5
  }
];

// Ebbinghaus Intervals in minutes/hours converted to milliseconds
export const INTERVALS = [
  0,
  5 * 60 * 1000,
  30 * 60 * 1000,
  12 * 60 * 60 * 1000,
  24 * 60 * 60 * 1000,
  2 * 24 * 60 * 60 * 1000,
  4 * 24 * 60 * 60 * 1000,
  7 * 24 * 60 * 60 * 1000,
  15 * 24 * 60 * 60 * 1000,
];