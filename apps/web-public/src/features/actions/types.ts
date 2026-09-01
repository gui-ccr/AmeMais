export interface Action {
  id: string;
  title: string;
  description: string;
  location: string;
  date: string;
  photo: string;
}

export interface Expense {
  id: string;
  name: string;
  percentLabel: string;
  percent: number;
  color: "primary" | "secondary";
}
