import type { ReactNode } from "react";

type ProseLayoutProps = {
  title: string;
  updatedAt?: string;
  children: ReactNode;
};

export function ProseLayout({ title, updatedAt, children }: ProseLayoutProps) {
  return (
    <article className="mx-auto max-w-[68ch] px-6 py-20 lg:px-8">
      <header className="mb-10 border-b border-store-border pb-8">
        <h1 className="font-display text-4xl font-normal tracking-tight text-store-ink md:text-5xl">
          {title}
        </h1>
        {updatedAt ? (
          <p className="mt-3 font-sans text-sm text-store-ink-muted">
            Last updated {updatedAt}
          </p>
        ) : null}
      </header>

      <div className="prose-store space-y-6 font-sans text-base leading-relaxed text-store-ink-muted [&_h2]:mt-10 [&_h2]:font-display [&_h2]:text-2xl [&_h2]:font-normal [&_h2]:text-store-ink [&_h3]:mt-8 [&_h3]:font-sans [&_h3]:text-sm [&_h3]:font-medium [&_h3]:uppercase [&_h3]:tracking-[0.15em] [&_h3]:text-store-ink [&_li]:mt-2 [&_ol]:list-decimal [&_ol]:pl-5 [&_p]:leading-relaxed [&_ul]:list-disc [&_ul]:pl-5">
        {children}
      </div>
    </article>
  );
}
