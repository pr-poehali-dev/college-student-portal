export interface User {
  id: number;
  username: string;
  role: 'student' | 'admin';
  display_name: string;
  avatar_url: string | null;
}

export interface ScheduleItem {
  id: number;
  day_of_week: number;
  lesson_number: number;
  subject: string;
  teacher: string | null;
  room: string | null;
  time_start: string | null;
  time_end: string | null;
}

export interface Absence {
  id: number;
  student_id: number;
  student_name: string;
  schedule_id: number;
  subject: string;
  day_of_week: number;
  lesson_number: number;
  time_start: string | null;
  date: string;
  reason: string | null;
  is_valid: boolean;
  created_at: string;
}

export interface Notification {
  id: number;
  message: string;
  is_read: boolean;
  created_at: string;
}
