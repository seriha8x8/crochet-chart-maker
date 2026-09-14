export type YarnPlan = "free" | "premium";

export type Yarn = {
  id: string;
  user_id: string;
  name: string;
  color: string[];
  manufacturer: string | null;
  material: string[];
  thickness: string[];
  stock_count: number;
  photo_url: string | null;
  created_at: string;
};

export type Project = {
  id: string;
  user_id: string;
  title: string;
  made_on: string | null;
  photo_url: string | null;
  created_at: string;
};
