export interface User {
  id: number;
  google_id: string;
  email: string;
  name: string;
}

export interface Task {
  id: number;
  user_id: number;
  name: string;
}

export interface TaskCompletion {
  id: number;
  user_id: number;
  task_id: number;
  date: string;
  completed: number;
}

export interface Event {
  id: number;
  user_id: number;
  title: string;
  date: string;
  description: string;
}

export interface MonthlyReport {
  id: number;
  user_id: number;
  month_name: string;
  year: number;
  data: (TaskCompletion & { task_name: string })[];
}
