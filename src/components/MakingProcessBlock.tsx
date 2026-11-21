import React from "react";

interface StepItem {
  heading: string;
  subheading?: string;
}

export function MakingProcessBlock({
  title,
  subtitle,
  videoUrl,
  steps,
  headingOnly = false,
}: {
  title: string;
  subtitle?: string | null;
  videoUrl?: string | null;
  steps: StepItem[];
  headingOnly?: boolean;
}) {
  const cappedSteps = steps.slice(0, 9);

  return (
    <section className="rounded-3xl border border-espresso/10 bg-cream-soft p-6 md:p-10">
      <div className="mb-6">
        <h2 className="font-serif text-2xl font-bold text-espresso md:text-3xl">{title}</h2>
        {subtitle && <p className="mt-1 text-sm text-taupe">{subtitle}</p>}
      </div>

      <div className="grid gap-8 lg:grid-cols-2 lg:items-center">
        <div className="overflow-hidden rounded-2xl border border-espresso/10 bg-espresso aspect-video flex items-center justify-center">
          {videoUrl ? (
            <video
              src={videoUrl}
              controls
              autoPlay
              muted
              loop
              playsInline
              className="h-full w-full object-cover"
            />
          ) : (
            <div className="p-8 text-center text-cream/70">
              <p className="font-serif text-lg text-ghee-light">Making Process Video</p>
              <p className="mt-1 text-xs">Upload video from Admin Panel → CMS → Making Process</p>
            </div>
          )}
        </div>

        <div className="space-y-3">
          {cappedSteps.map((step, idx) => (
            <div
              key={idx}
              className="flex items-start gap-3 rounded-xl border border-espresso/10 bg-white p-3.5 shadow-sm"
            >
              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-ghee text-xs font-bold text-white">
                {idx + 1}
              </span>
              <div>
                <h3 className="text-sm font-semibold text-espresso">{step.heading}</h3>
                {!headingOnly && step.subheading && (
                  <p className="mt-0.5 text-xs text-taupe">{step.subheading}</p>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
