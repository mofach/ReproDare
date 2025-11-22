// src/validators/index.js
import { z } from 'zod';

// ---------- REST schemas ----------
export const createSessionBody = z.object({
  categoryId: z.union([z.string().regex(/^\d+$/), z.number()]).transform(String),
  title: z.string().max(200).optional(),
});

export const listSessionsQuery = z.object({
  status: z.string().optional(),
});

// ---------- Session routes ----------
export const sessionIdParam = z.object({
  id: z.union([z.string().regex(/^\d+$/), z.number()]).transform(String),
});

// ---------- Socket schemas ----------
export const socketTeacherCreateSession = z.object({
  categoryId: z.union([z.string().regex(/^\d+$/), z.number()]).transform(String),
  title: z.string().max(200).optional(),
});

export const socketTeacherStartSession = z.object({
  sessionId: z.union([z.string().regex(/^\d+$/), z.number()]).transform(String),
});

export const socketStudentJoinSession = z.object({
  sessionId: z.union([z.string().regex(/^\d+$/), z.number()]).transform(String),
});

export const socketRouletteNext = z.object({
  sessionId: z.union([z.string().regex(/^\d+$/), z.number()]).transform(String),
});

export const socketSubmitAnswer = z.object({
  sessionId: z.union([z.string().regex(/^\d+$/), z.number()]).transform(String),
  turnId: z.union([z.string().regex(/^\d+$/), z.number()]).transform(String),
  answer_text: z.string().max(2000).optional(),
});

export const socketGradeTurn = z.object({
  sessionId: z.union([z.string().regex(/^\d+$/), z.number()]).transform(String),
  turnId: z.union([z.string().regex(/^\d+$/), z.number()]).transform(String),
  score: z.number().min(0).max(10).optional(),
  feedback: z.string().max(2000).optional(),
});

export const socketTeacherEndSession = z.object({
  sessionId: z.union([z.string().regex(/^\d+$/), z.number()]).transform(String),
});
