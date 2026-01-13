import { StudyItem } from './types';

const generateId = () => Math.random().toString(36).substr(2, 9);

export const DEFAULT_STUDY_DATA: StudyItem[] = [
  // Phrases
  { id: generateId(), english: "at the weekend/at weekends", chinese: "在周末/在每个周末", type: 'phrase', stage: 0, nextReviewDate: Date.now(), easeFactor: 2.5 },
  { id: generateId(), english: "go on tours with...", chinese: "和……去游览", type: 'phrase', stage: 0, nextReviewDate: Date.now(), easeFactor: 2.5 },
  { id: generateId(), english: "visit places of interest", chinese: "参观名胜古迹", type: 'phrase', stage: 0, nextReviewDate: Date.now(), easeFactor: 2.5 },
  { id: generateId(), english: "such as /for example /for instance", chinese: "比如", type: 'phrase', stage: 0, nextReviewDate: Date.now(), easeFactor: 2.5 },
  { id: generateId(), english: "in person", chinese: "亲自", type: 'phrase', stage: 0, nextReviewDate: Date.now(), easeFactor: 2.5 },
  { id: generateId(), english: "snake its way through", chinese: "蜿蜒穿过", type: 'phrase', stage: 0, nextReviewDate: Date.now(), easeFactor: 2.5 },
  { id: generateId(), english: "get to do sth.", chinese: "有机会做某事", type: 'phrase', stage: 0, nextReviewDate: Date.now(), easeFactor: 2.5 },
  { id: generateId(), english: "so far", chinese: "到目前为止", type: 'phrase', stage: 0, nextReviewDate: Date.now(), easeFactor: 2.5 },
  { id: generateId(), english: "a bit of+n. / a bit+adj./adv.", chinese: "一点....../有点......", type: 'phrase', stage: 0, nextReviewDate: Date.now(), easeFactor: 2.5 },
  { id: generateId(), english: "introduce sb to sth.", chinese: "使某人了解某物", type: 'phrase', stage: 0, nextReviewDate: Date.now(), easeFactor: 2.5 },
  { id: generateId(), english: "as well", chinese: "也", type: 'phrase', stage: 0, nextReviewDate: Date.now(), easeFactor: 2.5 },
  { id: generateId(), english: "be different from……", chinese: "与……不同", type: 'phrase', stage: 0, nextReviewDate: Date.now(), easeFactor: 2.5 },
  { id: generateId(), english: "keep trying", chinese: "继续尝试", type: 'phrase', stage: 0, nextReviewDate: Date.now(), easeFactor: 2.5 },
  { id: generateId(), english: "plan to do sth.", chinese: "计划做某事", type: 'phrase', stage: 0, nextReviewDate: Date.now(), easeFactor: 2.5 },
  { id: generateId(), english: "keep in touch with sb", chinese: "与某人保持联系", type: 'phrase', stage: 0, nextReviewDate: Date.now(), easeFactor: 2.5 },
  { id: generateId(), english: "one another", chinese: "互相，彼此", type: 'phrase', stage: 0, nextReviewDate: Date.now(), easeFactor: 2.5 },
  { id: generateId(), english: "come over to", chinese: "来到", type: 'phrase', stage: 0, nextReviewDate: Date.now(), easeFactor: 2.5 },
  { id: generateId(), english: "can’t wait (to do sth.)", chinese: "迫不及待（做......）", type: 'phrase', stage: 0, nextReviewDate: Date.now(), easeFactor: 2.5 },
  { id: generateId(), english: "be grateful for……", chinese: "对……心存感激", type: 'phrase', stage: 0, nextReviewDate: Date.now(), easeFactor: 2.5 },
  { id: generateId(), english: "culture shock", chinese: "文化冲击", type: 'phrase', stage: 0, nextReviewDate: Date.now(), easeFactor: 2.5 },
  { id: generateId(), english: "feel unhappy about life", chinese: "对生活感到不满", type: 'phrase', stage: 0, nextReviewDate: Date.now(), easeFactor: 2.5 },
  { id: generateId(), english: "find it difficult to do sth.", chinese: "发现做某事很难", type: 'phrase', stage: 0, nextReviewDate: Date.now(), easeFactor: 2.5 },
  { id: generateId(), english: "deal with", chinese: "处理；应对", type: 'phrase', stage: 0, nextReviewDate: Date.now(), easeFactor: 2.5 },
  { id: generateId(), english: "in most situations", chinese: "在大多数情况下", type: 'phrase', stage: 0, nextReviewDate: Date.now(), easeFactor: 2.5 },
  { id: generateId(), english: "no longer/not...any more", chinese: "不再……", type: 'phrase', stage: 0, nextReviewDate: Date.now(), easeFactor: 2.5 },
  { id: generateId(), english: "feel at home", chinese: "感到舒适自在", type: 'phrase', stage: 0, nextReviewDate: Date.now(), easeFactor: 2.5 },
  { id: generateId(), english: "adapt to change", chinese: "适应变化", type: 'phrase', stage: 0, nextReviewDate: Date.now(), easeFactor: 2.5 },
  { id: generateId(), english: "depend on", chinese: "取决于", type: 'phrase', stage: 0, nextReviewDate: Date.now(), easeFactor: 2.5 },
  { id: generateId(), english: "see things from different points of view", chinese: "从不同的角度看待事物", type: 'phrase', stage: 0, nextReviewDate: Date.now(), easeFactor: 2.5 },
  { id: generateId(), english: "get along (well) with sb", chinese: "与……相处（得好）", type: 'phrase', stage: 0, nextReviewDate: Date.now(), easeFactor: 2.5 },

  // Sentences
  { 
    id: generateId(), 
    english: "At the weekend, they go on tours with their host families around Beijing and visit places of interest, such as the Great Wall, the Summer Palace and the National Museum.", 
    chinese: "在周末，他们与寄宿家庭一起游览北京，参观名胜古迹，例如长城、颐和园和国家博物馆。", 
    type: 'sentence', 
    stage: 0, nextReviewDate: Date.now(), easeFactor: 2.5 
  },
  { 
    id: generateId(), 
    english: "The Great Wall is no doubt one of the most amazing achievements in human history!", 
    chinese: "长城无疑是人类历史上最惊人的成就之一！", 
    type: 'sentence', 
    stage: 0, nextReviewDate: Date.now(), easeFactor: 2.5 
  },
  { 
    id: generateId(), 
    english: "The students also spend time learning about Chinese culture.", 
    chinese: "学生们还花时间了解中国文化。", 
    type: 'sentence', 
    stage: 0, nextReviewDate: Date.now(), easeFactor: 2.5 
  },
  { 
    id: generateId(), 
    english: "It's been a fantastic experience so far.", 
    chinese: "到目前为止，这是一次极好的经历。", 
    type: 'sentence', 
    stage: 0, nextReviewDate: Date.now(), easeFactor: 2.5 
  },
  { 
    id: generateId(), 
    english: "If you travel to a foreign country, you may feel confused, strange or anxious.", 
    chinese: "如果你去国外旅行，你可能会感到困惑、陌生或焦虑。", 
    type: 'sentence', 
    stage: 0, nextReviewDate: Date.now(), easeFactor: 2.5 
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