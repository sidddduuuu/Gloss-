export interface Paper {
  id: string;
  title: string;
  shortTitle: string;
  authors?: string;
  file: string; // public path or blob: URL for uploads
  uploaded?: boolean;
}

export const DEFAULT_PAPERS: Paper[] = [
  {
    id: "rl_in_brain",
    title: "Reinforcement Learning in the Brain",
    shortTitle: "RL in the Brain",
    authors: "Niv, 2009",
    file: "/papers/paper1.pdf",
  },
  {
    id: "deep_rl_overview",
    title: "Deep Reinforcement Learning: An Overview",
    shortTitle: "Deep RL Overview",
    authors: "Li, 2018",
    file: "/papers/paper2.pdf",
  },
];
