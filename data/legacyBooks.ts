
export interface LegacyBookItem {
  title: string;
  type?: string;
  tags?: string[];
  rating?: number | string | null;
  comment?: string;
  status?: string;
}

export const legacyBooks: LegacyBookItem[] = [];
