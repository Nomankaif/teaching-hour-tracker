export type Student = {
  _id: string;
  name: string;
  parentName?: string;
  email?: string;
  hourlyRate?: number;
  status: "active" | "inactive";
  createdAt: string;
};

export type Entry = {
  _id: string;
  studentId: string;
  studentName: string;
  date: string;
  hours: number;
  notes?: string;
  createdAt: string;
};

export type Summary = {
  todayHours: number;
  weekHours: number;
  monthHours: number;
  activeStudents: number;
  recentEntries: Entry[];
  weeklyRows: ReportRow[];
  monthlyRows: ReportRow[];
};

export type ReportRow = {
  studentId: string;
  studentName: string;
  totalHours: number;
  totalEarnings: number;
  days: Record<string, number>;
};
