/**
 * Synthetic comment thread for the demo, written for this project (not scraped). It mixes the
 * kinds of comments a kids' science video actually attracts: genuine questions, jokes, mild
 * disagreement (should stay visible), and insults, obscenity, threats and identity attacks
 * (should be filtered). The same file feeds the launch video (video/scripts/sync-data.mjs).
 */
import data from "./demo-comments.json";

export type DemoComment = { id: number; author: string; ago: string; likes: number; text: string };

export const VIDEO = data.video;
export const COMMENTS: DemoComment[] = data.comments;
