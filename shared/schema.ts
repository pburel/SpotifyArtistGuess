import { pgTable, text, serial, integer, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
});

export const artists = pgTable("artists", {
  id: serial("id").primaryKey(),
  spotifyId: text("spotify_id").notNull().unique(),
  name: text("name").notNull(),
  imageUrl: text("image_url"),
  genres: text("genres").array(),
  popularity: integer("popularity"),
  monthlyListeners: integer("monthly_listeners"),
});

export const gameHistory = pgTable("game_history", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id),
  targetArtistId: text("target_artist_id").notNull(),
  attemptsUsed: integer("attempts_used").notNull(),
  isCorrect: boolean("is_correct").notNull(),
  score: integer("score").notNull(),
  timestamp: text("timestamp").notNull(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

export const insertArtistSchema = createInsertSchema(artists).omit({
  id: true,
});

export const insertGameHistorySchema = createInsertSchema(gameHistory).omit({
  id: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

export type InsertArtist = z.infer<typeof insertArtistSchema>;
export type Artist = typeof artists.$inferSelect;

export type InsertGameHistory = z.infer<typeof insertGameHistorySchema>;
export type GameHistory = typeof gameHistory.$inferSelect;
