export const PURPOSES = ["development", "hiring", "wellbeing"] as const;
// "0" once, a number of months, or a start-date rule.
export const REPEATS = ["0", "1", "3", "6", "12", "start30", "start90", "anniversary"] as const;

// Everything the composer holds; saved as a draft while it's edited.
export type RoundDraftData = {
  name: string;
  purpose: (typeof PURPOSES)[number];
  items: string[];
  teamIds: string[];
  userIds: string[];
  invitationIds: string[];
  candidateText: string;
  dueDate: string;
  message: string;
  repeat: (typeof REPEATS)[number];
};

export const EMPTY_ROUND: RoundDraftData = {
  name: "",
  purpose: "development",
  items: [],
  teamIds: [],
  userIds: [],
  invitationIds: [],
  candidateText: "",
  dueDate: "",
  message: "",
  repeat: "0",
};

