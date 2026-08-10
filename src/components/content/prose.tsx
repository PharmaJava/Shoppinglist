import type { ContentBlock, FaqItem } from "@/content/types";

export function ProseBlocks({ blocks }: { blocks: ContentBlock[] }) {
  return (
    <div className="flex flex-col gap-8">
      {blocks.map((block) => (
        <section key={block.heading} className="flex flex-col gap-3">
          <h2 className="text-2xl font-bold tracking-tight text-on-surface">{block.heading}</h2>
          {block.paragraphs.map((paragraph) => (
            <p key={paragraph} className="text-on-surface-muted leading-relaxed">
              {paragraph}
            </p>
          ))}
          {block.bullets && (
            <ul className="flex list-disc flex-col gap-2 pl-5 text-on-surface-muted">
              {block.bullets.map((bullet) => (
                <li key={bullet} className="leading-relaxed">
                  {bullet}
                </li>
              ))}
            </ul>
          )}
        </section>
      ))}
    </div>
  );
}

export function FaqSection({ title, faq }: { title: string; faq: FaqItem[] }) {
  return (
    <section className="flex flex-col gap-4">
      <h2 className="text-2xl font-bold tracking-tight text-on-surface">{title}</h2>
      <dl className="flex flex-col gap-5">
        {faq.map((entry) => (
          <div key={entry.question} className="flex flex-col gap-1">
            <dt className="font-semibold text-on-surface">{entry.question}</dt>
            <dd className="text-on-surface-muted leading-relaxed">{entry.answer}</dd>
          </div>
        ))}
      </dl>
    </section>
  );
}

/** JSON-LD ya serializado. Se emite uno por bloque para que un error en uno no
 *  invalide los demás a ojos del rastreador. */
export function JsonLd({ blocks }: { blocks: object[] }) {
  return (
    <>
      {blocks.map((block) => (
        <script
          key={JSON.stringify(block).slice(0, 64)}
          type="application/ld+json"
          // biome-ignore lint/security/noDangerouslySetInnerHtml: JSON-LD propio, sin datos de usuario.
          dangerouslySetInnerHTML={{ __html: JSON.stringify(block) }}
        />
      ))}
    </>
  );
}
