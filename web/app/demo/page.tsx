import type { Metadata } from "next";
import { YouTubeDemo } from "@/components/youtube-demo";

export const metadata: Metadata = {
  title: "YouTube child-safe demo",
  description: "Watch the model filter a toxic YouTube comment section in real time.",
};

export default function DemoPage() {
  return (
    <div className="mx-auto max-w-6xl px-4 pt-14 sm:px-6 sm:pt-20">
      <p className="label-mono">Demo · what the extension does</p>
      <h1 className="mt-3 max-w-3xl font-display text-[clamp(2.25rem,1.4rem+3.6vw,4rem)] font-extrabold leading-[1.05] tracking-[-0.04em] text-peak">
        A kids’ science video, and the comments underneath it.
      </h1>
      <p className="measure mt-5 text-lg leading-relaxed text-secondary">
        Every comment below goes through the model in a single batch. Switch the filter off to see what was underneath
        and how each comment scored. Questions, jokes and polite disagreement should survive; abuse should not. Some
        borderline calls will be wrong, and seeing which ones is part of the point.
      </p>
      <div className="mt-12">
        <YouTubeDemo />
      </div>
    </div>
  );
}
