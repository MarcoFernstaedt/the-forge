export interface User {
  id: number;
  username: string;
  display_name: string | null;
  api_key?: string | null;
  created_at: string;
  last_active: string | null;
}

export interface SkillTree {
  id: number;
  name: string;
  description: string | null;
  category: string | null;
  is_template: boolean;
  is_public: boolean;
  created_at: string;
  updated_at: string | null;
  skill_count: number;
}

export interface SkillNode {
  id: number;
  name: string;
  description: string;
  category: string;
  x: number;
  y: number;
  xp_required: number;
  max_xp: number;
  icon: string;
  prerequisite_ids: number[];
  current_xp: number;
  status: 'locked' | 'unlocked' | 'mastered';
  unlocked_at?: string;
  mastered_at?: string;
}

export interface TreeData {
  id: number;
  name: string;
  description: string | null;
  category: string | null;
  is_template: boolean;
  is_public: boolean;
  skills: SkillNode[];
}

export interface Activity {
  id: number;
  skill_id: number | null;
  description: string;
  xp_amount: number;
  source: string;
  source_url: string | null;
  created_at: string;
}

export interface Stats {
  user: User;
  trees_created: number;
  total_activities: number;
  total_xp: number;
  skills_unlocked: number;
  skills_mastered: number;
  current_level: number;
  next_level_xp: number;
  level_progress: number;
  streak_days: number;
  longest_streak: number;
}

export interface ObsidianNote {
  id: number;
  note_title: string;
  vault_path: string;
  file_path: string;
  tags: string[];
  links: string[];
  extracted_activities: string[];
  word_count: number;
  last_sync: string;
}

export interface GraphNode {
  id: string;
  label: string;
  group: string;
  val: number;
}

export interface GraphLink {
  source: string;
  target: string;
}

export interface GraphData {
  nodes: GraphNode[];
  links: GraphLink[];
}

export interface Goal {
  id: number;
  title: string;
  description: string | null;
  category: string | null;
  target_value: number;
  current_value: number;
  status: 'active' | 'completed' | 'paused';
  target_date: string | null;
  linked_tree_id: number | null;
  created_at: string;
  updated_at: string;
}

export interface ProgressNote {
  id: number;
  title: string;
  content: string;
  tags: string[];
  linked_skill_id: number | null;
  linked_tree_id: number | null;
  mood: string | null;
  created_at: string;
  updated_at: string;
}
