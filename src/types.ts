/**
 * Shared Type Definitions for Collaborative Study Rooms
 */

export interface UserProfile {
  userId: string;
  displayName: string;
  email: string;
  totalStudyTime: number; // in seconds
  totalSessions: number;  // completed sessions count
  updatedAt: string;
  photoUrl?: string;
}

export interface StudyRoom {
  id: string;
  name: string;
  description: string;
  creatorId: string;
  createdAt: string;
  activeCount: number;
  timerDuration: number; // in seconds
  timerStatus: "idle" | "work" | "break"; // Pomodoro statuses
  timerEndsAt: string | null; // ISO string representing when the currently playing timer ends
  timerType: "pomodoro" | "custom";
}

export interface Message {
  id: string;
  roomId: string;
  senderId: string;
  senderName: string;
  text: string;
  createdAt: string; // ISO string
}

export interface StudyLog {
  id: string;
  userId: string;
  subject: string;
  duration: number; // in seconds
  taskTitle?: string;
  createdAt: string; // ISO string for history tracking
}

export interface Task {
  id: string;
  userId: string;
  title: string;
  subject: string;
  completed: boolean;
  createdAt: string; // ISO string
}

export interface ChatMessage {
  id: string;
  roomId: string;
  senderId: string;
  senderName: string;
  text: string;
  createdAt: string;
}
