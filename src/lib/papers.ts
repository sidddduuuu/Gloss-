export interface Paper {
  id: string;
  title: string;
  shortTitle: string;
  file: string;
}

export const PAPERS: Paper[] = [
  {
    id: "rl_in_brain",
    title: "Reinforcement Learning in the Brain (Niv, 2009)",
    shortTitle: "RL in the Brain",
    file: "/papers/paper1.pdf",
  },
  {
    id: "deep_rl_overview",
    title: "Deep Reinforcement Learning: An Overview (Li, 2018)",
    shortTitle: "Deep RL Overview",
    file: "/papers/paper2.pdf",
  },
];
