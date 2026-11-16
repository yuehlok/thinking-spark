export type ThinkingSparkVariant = "breathe" | "orbit" | "shimmer" | "pulse" | "typing";

export interface StarPathOptions {
  rays?: number;
  inner?: number;
  jitter?: number;
  seed?: number;
  outer?: number;
}

export declare function starPath(opts?: StarPathOptions): string;
export declare const VARIANTS: ThinkingSparkVariant[];

export default class ThinkingSpark extends HTMLElement {
  variant: ThinkingSparkVariant;
  speed: number;
  paused: boolean;
}

declare global {
  interface HTMLElementTagNameMap {
    "thinking-spark": ThinkingSpark;
  }
}
