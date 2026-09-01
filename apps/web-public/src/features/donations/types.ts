export interface Urgency {
  id: string;
  title: string;
  tag: string;
  progressLabel: string;
  percent: number;
  color: "primary" | "secondary";
}

export interface CollectionPoint {
  id: string;
  name: string;
  address: string;
  hours: string;
}
