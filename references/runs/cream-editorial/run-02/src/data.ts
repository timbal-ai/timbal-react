export type ArticleStatus = "unread" | "reading" | "finished";

export interface Article {
  id: string;
  title: string;
  source: string;
  author: string;
  readingMinutes: number;
  /** 0–100 percent read. */
  progress: number;
  status: ArticleStatus;
  addedAt: string;
}

export interface Highlight {
  id: string;
  articleId: string;
  text: string;
  note?: string;
  savedAt: string;
}

export const articles: Article[] = [
  {
    id: "a1",
    title: "The tyranny of the churn",
    source: "Aeon",
    author: "Marta Figlerowicz",
    readingMinutes: 22,
    progress: 64,
    status: "reading",
    addedAt: "Jun 21",
  },
  {
    id: "a2",
    title: "What we lose when we skim",
    source: "The Atlantic",
    author: "Naomi Ostrander",
    readingMinutes: 14,
    progress: 100,
    status: "finished",
    addedAt: "Jun 14",
  },
  {
    id: "a3",
    title: "Notes on the long sentence",
    source: "The Paris Review",
    author: "Brian Dillon",
    readingMinutes: 18,
    progress: 100,
    status: "finished",
    addedAt: "Jun 8",
  },
  {
    id: "a4",
    title: "Reading in the age of constant interruption",
    source: "Longreads",
    author: "Adele Marsh",
    readingMinutes: 26,
    progress: 31,
    status: "reading",
    addedAt: "Jun 18",
  },
  {
    id: "a5",
    title: "The margins are the message",
    source: "Real Life",
    author: "Theo Waring",
    readingMinutes: 12,
    progress: 0,
    status: "unread",
    addedAt: "Jun 27",
  },
  {
    id: "a6",
    title: "A defense of the commonplace book",
    source: "The New Yorker",
    author: "Ruth Delgado",
    readingMinutes: 19,
    progress: 82,
    status: "reading",
    addedAt: "Jun 24",
  },
  {
    id: "a7",
    title: "Slow looking: on paintings and patience",
    source: "London Review of Books",
    author: "Ines Kaplan",
    readingMinutes: 31,
    progress: 0,
    status: "unread",
    addedAt: "Jun 29",
  },
  {
    id: "a8",
    title: "Why paper persists",
    source: "Works in Progress",
    author: "Samuel Ode",
    readingMinutes: 16,
    progress: 100,
    status: "finished",
    addedAt: "May 30",
  },
];

export const highlights: Highlight[] = [
  {
    id: "h1",
    articleId: "a1",
    text: "We do not abandon books because we are busy; we abandon them because we have stopped believing the next page owes us anything.",
    note: "The whole essay in one line.",
    savedAt: "Jun 22",
  },
  {
    id: "h2",
    articleId: "a1",
    text: "Novelty is a rent that attention pays weekly, and the rate keeps going up.",
    savedAt: "Jun 22",
  },
  {
    id: "h3",
    articleId: "a1",
    text: "To reread is to refuse the churn — a small act of loyalty in an economy of replacement.",
    note: "Pair with the commonplace-book piece.",
    savedAt: "Jun 23",
  },
  {
    id: "h4",
    articleId: "a2",
    text: "Skimming is not a smaller kind of reading. It is a different activity that happens to use the eyes.",
    savedAt: "Jun 14",
  },
  {
    id: "h5",
    articleId: "a2",
    text: "Comprehension arrives on foot; we keep sending a car.",
    note: "Steal this cadence.",
    savedAt: "Jun 15",
  },
  {
    id: "h6",
    articleId: "a3",
    text: "The long sentence is a held breath; the reader agrees to surface only when the writer does.",
    savedAt: "Jun 9",
  },
  {
    id: "h7",
    articleId: "a3",
    text: "Punctuation is choreography. The comma is a hesitation you can dance to.",
    note: "cf. Dillon on Sebald.",
    savedAt: "Jun 9",
  },
  {
    id: "h8",
    articleId: "a3",
    text: "Every clause postponed is a promise made; the period is where the writer settles accounts.",
    savedAt: "Jun 10",
  },
  {
    id: "h9",
    articleId: "a4",
    text: "An interruption is never one interruption. It is the toll paid twice — once leaving the text, once finding the way back.",
    savedAt: "Jun 19",
  },
  {
    id: "h10",
    articleId: "a6",
    text: "A commonplace book is a conversation with everyone you have read, conducted at a pace you can bear.",
    note: "This is what Marginalia should feel like.",
    savedAt: "Jun 25",
  },
  {
    id: "h11",
    articleId: "a6",
    text: "Copying a passage by hand is the slowest form of agreement.",
    savedAt: "Jun 25",
  },
  {
    id: "h12",
    articleId: "a6",
    text: "The point was never storage. The point was the transcribing hand learning what the reading eye had only visited.",
    savedAt: "Jun 26",
  },
  {
    id: "h13",
    articleId: "a8",
    text: "Paper is a technology whose battery is always full.",
    note: "Obvious, but it lands.",
    savedAt: "May 31",
  },
  {
    id: "h14",
    articleId: "a8",
    text: "A book does not refresh. That is not a limitation; it is the entire offer.",
    savedAt: "Jun 1",
  },
];

/** Daily reading minutes, last 14 days. */
export const minutesByDay = [
  { day: "Jun 16", minutes: 21 },
  { day: "Jun 17", minutes: 34 },
  { day: "Jun 18", minutes: 0 },
  { day: "Jun 19", minutes: 18 },
  { day: "Jun 20", minutes: 42 },
  { day: "Jun 21", minutes: 27 },
  { day: "Jun 22", minutes: 35 },
  { day: "Jun 23", minutes: 12 },
  { day: "Jun 24", minutes: 48 },
  { day: "Jun 25", minutes: 22 },
  { day: "Jun 26", minutes: 31 },
  { day: "Jun 27", minutes: 16 },
  { day: "Jun 28", minutes: 39 },
  { day: "Jun 29", minutes: 25 },
];

/** Highlights saved per week, last 8 weeks. */
export const highlightsByWeek = [
  { week: "May 4", highlightCount: 4 },
  { week: "May 11", highlightCount: 7 },
  { week: "May 18", highlightCount: 3 },
  { week: "May 25", highlightCount: 6 },
  { week: "Jun 1", highlightCount: 8 },
  { week: "Jun 8", highlightCount: 5 },
  { week: "Jun 15", highlightCount: 11 },
  { week: "Jun 22", highlightCount: 9 },
];

export const readingStats = {
  streakDays: 11,
  minutesThisWeek: 193,
  highlightsThisWeek: 9,
  articlesFinishedThisMonth: 3,
};
