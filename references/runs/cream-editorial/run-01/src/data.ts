export type ArticleStatus = "reading" | "finished" | "unread";

export interface Article {
  id: string;
  title: string;
  author: string;
  source: string;
  /** Estimated reading time in minutes. */
  readingTime: number;
  /** Reading progress, 0–100. */
  progress: number;
  status: ArticleStatus;
  /** Pre-formatted save date. */
  savedAt: string;
}

export interface Highlight {
  id: string;
  articleId: string;
  text: string;
  /** Optional margin note written by the reader. */
  note?: string;
  /** Position in the piece, e.g. "¶ 12". */
  location: string;
  /** Pre-formatted date. */
  date: string;
}

export const articles: Article[] = [
  {
    id: "praise-shadows",
    title: "In Praise of Shadows",
    author: "Jun'ichirō Tanizaki",
    source: "The Paris Review",
    readingTime: 32,
    progress: 64,
    status: "reading",
    savedAt: "Jun 18",
  },
  {
    id: "tyranny-convenience",
    title: "The Tyranny of Convenience",
    author: "Tim Wu",
    source: "The New York Times",
    readingTime: 14,
    progress: 100,
    status: "finished",
    savedAt: "Jun 12",
  },
  {
    id: "marginalia-poe",
    title: "Marginalia",
    author: "Edgar Allan Poe",
    source: "Southern Literary Messenger",
    readingTime: 11,
    progress: 100,
    status: "finished",
    savedAt: "Jun 28",
  },
  {
    id: "forget-books",
    title: "Why We Forget Most of the Books We Read",
    author: "Julie Beck",
    source: "The Atlantic",
    readingTime: 9,
    progress: 100,
    status: "finished",
    savedAt: "Jun 20",
  },
  {
    id: "maintenance-race",
    title: "The Maintenance Race",
    author: "Stewart Brand",
    source: "Works in Progress",
    readingTime: 22,
    progress: 41,
    status: "reading",
    savedAt: "Jun 23",
  },
  {
    id: "commonplace-books",
    title: "The Lost Practice of the Commonplace Book",
    author: "Freya Howarth",
    source: "Psyche",
    readingTime: 12,
    progress: 27,
    status: "reading",
    savedAt: "Jun 30",
  },
  {
    id: "quiet-attention",
    title: "The Quiet Art of Paying Attention",
    author: "Leah Reich",
    source: "Aeon",
    readingTime: 16,
    progress: 12,
    status: "reading",
    savedAt: "Jun 25",
  },
  {
    id: "do-nothing",
    title: "How to Do Nothing: Resisting the Attention Economy",
    author: "Jenny Odell",
    source: "Longreads",
    readingTime: 18,
    progress: 0,
    status: "unread",
    savedAt: "Jun 27",
  },
  {
    id: "slow-looking",
    title: "On Slow Looking",
    author: "Shari Tishman",
    source: "MIT Press Reader",
    readingTime: 13,
    progress: 0,
    status: "unread",
    savedAt: "Jun 29",
  },
];

export const highlights: Highlight[] = [
  // In Praise of Shadows
  {
    id: "ps-1",
    articleId: "praise-shadows",
    text: "Were it not for shadows, there would be no beauty.",
    note: "The whole essay in one sentence.",
    location: "¶ 12",
    date: "Jun 19",
  },
  {
    id: "ps-2",
    articleId: "praise-shadows",
    text: "We find beauty not in the thing itself but in the patterns of shadows, the light and the darkness, that one thing against another creates.",
    location: "¶ 14",
    date: "Jun 19",
  },
  {
    id: "ps-3",
    articleId: "praise-shadows",
    text: "The quality that we call beauty must always grow from the realities of life, and our ancestors, forced to live in dark rooms, presently came to discover beauty in shadows.",
    note: "Constraint as the mother of an aesthetic.",
    location: "¶ 21",
    date: "Jun 22",
  },
  {
    id: "ps-4",
    articleId: "praise-shadows",
    text: "A phosphorescent jewel gives off its glow and color in the dark and loses its beauty in the light of day.",
    location: "¶ 26",
    date: "Jun 24",
  },
  // The Tyranny of Convenience
  {
    id: "tc-1",
    articleId: "tyranny-convenience",
    text: "Convenience is the most underestimated and least understood force in the world today.",
    location: "¶ 1",
    date: "Jun 12",
  },
  {
    id: "tc-2",
    articleId: "tyranny-convenience",
    text: "Struggle is not always a problem. Sometimes struggle is a solution. It can be the solution to the question of who you are.",
    note: "Pair with the maintenance essay — friction as identity.",
    location: "¶ 18",
    date: "Jun 13",
  },
  {
    id: "tc-3",
    articleId: "tyranny-convenience",
    text: "Today's cult of convenience fails to acknowledge that difficulty is a constitutive feature of human experience.",
    location: "¶ 22",
    date: "Jun 13",
  },
  // Marginalia (Poe)
  {
    id: "mp-1",
    articleId: "marginalia-poe",
    text: "In the marginalia, too, we talk only to ourselves; we therefore talk freshly — boldly — originally — with abandonnement — without conceit.",
    note: "Why this app exists.",
    location: "¶ 2",
    date: "Jun 28",
  },
  {
    id: "mp-2",
    articleId: "marginalia-poe",
    text: "The circumscription of space, too, in these pencillings, has in it something more of advantage than of inconvenience.",
    location: "¶ 3",
    date: "Jun 28",
  },
  {
    id: "mp-3",
    articleId: "marginalia-poe",
    text: "All this may be whim; it may be not only a very hackneyed, but a very idle practice — yet I persist in it still.",
    location: "¶ 1",
    date: "Jun 29",
  },
  // Why We Forget Most of the Books We Read
  {
    id: "fb-1",
    articleId: "forget-books",
    text: "In the internet age, recall memory — the ability to spontaneously call up information in your mind — has become less necessary.",
    location: "¶ 6",
    date: "Jun 20",
  },
  {
    id: "fb-2",
    articleId: "forget-books",
    text: "Reading is a nuanced word, but the most common kind of reading is likely reading as consumption: where we read, especially on the internet, merely to acquire information.",
    note: "Consumption vs. rumination.",
    location: "¶ 9",
    date: "Jun 20",
  },
  {
    id: "fb-3",
    articleId: "forget-books",
    text: "The lesson from the research is that if you want to remember the things you read, space them out and revisit them.",
    location: "¶ 15",
    date: "Jun 21",
  },
  // The Maintenance Race
  {
    id: "mr-1",
    articleId: "maintenance-race",
    text: "Maintenance is the invisible work that keeps the visible world running.",
    location: "¶ 4",
    date: "Jun 23",
  },
  {
    id: "mr-2",
    articleId: "maintenance-race",
    text: "The winner, in the long run, was the one who fixed things before they broke.",
    note: "True of boats, software, and reading habits.",
    location: "¶ 19",
    date: "Jun 26",
  },
];

/** Minutes read per day, last 14 days. */
export const minutesByDay = [
  { day: "Jun 19", minutes: 22 },
  { day: "Jun 20", minutes: 35 },
  { day: "Jun 21", minutes: 18 },
  { day: "Jun 22", minutes: 41 },
  { day: "Jun 23", minutes: 26 },
  { day: "Jun 24", minutes: 12 },
  { day: "Jun 25", minutes: 30 },
  { day: "Jun 26", minutes: 38 },
  { day: "Jun 27", minutes: 24 },
  { day: "Jun 28", minutes: 16 },
  { day: "Jun 29", minutes: 44 },
  { day: "Jun 30", minutes: 29 },
  { day: "Jul 1", minutes: 33 },
  { day: "Jul 2", minutes: 27 },
];

/** Highlights saved per week, last 8 weeks. */
export const highlightsByWeek = [
  { week: "May 11", count: 9 },
  { week: "May 18", count: 14 },
  { week: "May 25", count: 11 },
  { week: "Jun 1", count: 17 },
  { week: "Jun 8", count: 8 },
  { week: "Jun 15", count: 15 },
  { week: "Jun 22", count: 21 },
  { week: "Jun 29", count: 23 },
];

export const readingActivity = [
  {
    id: "act-1",
    title: "Finished “Marginalia”",
    description: "Poe on writing in the margins — 3 passages saved.",
    meta: "Today",
  },
  {
    id: "act-2",
    title: "6 highlights in “In Praise of Shadows”",
    meta: "Yesterday",
  },
  {
    id: "act-3",
    title: "18-day reading streak",
    description: "Longest run this year.",
    meta: "Mon",
  },
  {
    id: "act-4",
    title: "Saved 3 articles",
    description: "From Psyche, Aeon, and MIT Press Reader.",
    meta: "Sun",
  },
];
