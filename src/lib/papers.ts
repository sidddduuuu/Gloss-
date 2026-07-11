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
    id: "temporal_differences",
    title: "Learning to Predict by the Methods of Temporal Differences (Sutton, 1988)",
    shortTitle: "Temporal Differences",
    file: "/papers/paper2.pdf",
  },
];
