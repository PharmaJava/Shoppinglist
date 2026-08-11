import type { LegalDocument } from "../types";

/** Versión inglesa de los mismos textos. A diferencia del contenido editorial,
 *  aquí sí se traduce: describen las mismas obligaciones, y divergir sería un
 *  problema legal, no una oportunidad de SEO. */
export const privacyEn: LegalDocument = {
  slug: "privacy",
  title: "Privacy policy",
  metaTitle: "Privacy Policy",
  metaDescription:
    "What ListaSupermercado stores, why, who it's shared with, and how to exercise your rights. No runaround.",
  updatedAt: "2026-08-10",
  blocks: [
    {
      heading: "The short version",
      paragraphs: [
        "You don't have to give us any personal data to use the app: you can create and share lists with no email, no name and no password.",
        "If you choose to create an account, we store your email address to identify you. That's it.",
        "We don't sell data, we don't build advertising profiles, and we don't use tracking cookies.",
        "You can delete your account and everything attached to it from inside the app, yourself, without emailing anyone.",
      ],
    },
    {
      heading: "Who is responsible",
      paragraphs: [
        "The data controller is [LEGAL NAME], [TAX ID], registered at [ADDRESS]. You can write to [CONTACT EMAIL] about anything related to your data.",
      ],
    },
    {
      heading: "What we process and why",
      paragraphs: ["Only what the app needs to work:"],
      bullets: [
        "Guest identifier: created when you make your first list. It's a random identifier with none of your details in it, and it exists so your lists are yours and nobody else can edit them. Legal basis: performance of the service you requested.",
        "Email address: only if you create an account. Used to identify you and to send the sign-in or password-reset link. Legal basis: performance of contract.",
        "Password: only if you choose that method. We don't store it: it's hashed irreversibly, and nobody — including us — can read it.",
        "Display name: optional. If you set one, people who share a list with you will see it, so they know who added or checked each item.",
        "Your list content: the items, quantities and notes you write. They're yours, and only people with the link you shared can see them.",
        "Aggregate technical data: page visits and performance, with no cookies and no identification.",
      ],
    },
    {
      heading: "Who we share it with",
      paragraphs: [
        "Nobody, commercially. Only the providers the service needs to exist, acting as processors on our instructions:",
      ],
      bullets: [
        "Supabase: database and authentication. Stores your lists, and your email if you have an account.",
        "Vercel: web hosting and aggregate usage and performance metrics, with no cookies and no individual identification.",
      ],
    },
    {
      heading: "How long we keep it",
      paragraphs: [
        "Your lists and account are kept while you keep using them. If you delete your account, they're removed immediately, along with the lists you own.",
        "Guest identities with no lists attached are purged periodically — they serve no purpose and still take up space.",
      ],
    },
    {
      heading: "Your rights",
      paragraphs: [
        "You can access, correct, delete and port your data, and object to or restrict its processing. For the common cases you don't even need to write to us:",
      ],
      bullets: [
        "Access and correction: from your account and your lists, any time.",
        "Deletion: there's a delete-account button on your account page. Immediate and permanent.",
        "Portability: from your account you can download your data, your lists and your product history as a JSON file.",
        "For anything else, write to [CONTACT EMAIL].",
      ],
    },
    {
      heading: "Complaints",
      paragraphs: [
        "If you think we're mishandling your data, tell us first — that usually settles it. You also have the right to complain to your national data protection authority; in Spain that's the Agencia Española de Protección de Datos (aepd.es).",
      ],
    },
    {
      heading: "Changes to this policy",
      paragraphs: [
        "If something material changes we'll update this page and its revision date. If the change genuinely affects you and you have an account, we'll email you rather than wait for you to notice.",
      ],
    },
  ],
};

export const termsEn: LegalDocument = {
  slug: "terms",
  title: "Terms of use",
  metaTitle: "Terms of Use",
  metaDescription:
    "The terms for using ListaSupermercado: what you can expect from the service, and what we expect from you.",
  updatedAt: "2026-08-10",
  blocks: [
    {
      heading: "What this service is",
      paragraphs: [
        "ListaSupermercado is a free web app for making and sharing shopping lists. Using it means accepting these terms; if you disagree with any of them, the sensible thing is not to use it.",
        "The service is operated by [LEGAL NAME], [CONTACT EMAIL].",
      ],
    },
    {
      heading: "With and without an account",
      paragraphs: [
        "You can use the app without signing up. In that case your identity lives in the browser you're using: clear its data or switch devices and you'll lose access to those lists unless you saved the link.",
        "With an account, your lists stop depending on one browser. Keeping your access safe is on you: whoever has your email or password can get in.",
      ],
    },
    {
      heading: "Shared links",
      paragraphs: [
        "Sharing a list means exactly that: anyone with the link can view and edit it, without signing up. There's no password and no guest list.",
        "Only share it with people you want involved, and bear in mind they can forward it. If a link gets away from you, make a new list.",
      ],
    },
    {
      heading: "What you can't do",
      paragraphs: ["The predictable things, stated plainly:"],
      bullets: [
        "Use the service for illegal activity or to store unlawful content.",
        "Try to reach other people's lists, or reverse-engineer the access mechanisms.",
        "Automate usage in ways that degrade the service for others.",
        "Impersonate someone else.",
      ],
    },
    {
      heading: "Availability and warranties",
      paragraphs: [
        "The service is provided as is, free of charge. We take care to keep it working and not to lose data, but we can't guarantee uninterrupted availability or freedom from errors.",
        "Plainly: for a shopping list that's a reasonable trade, but don't make this app the only place you keep something you can't afford to lose.",
      ],
    },
    {
      heading: "Price",
      paragraphs: [
        "Creating, sharing and using lists is free, and the intention is to keep it that way. If we add paid features later they'll be optional and announced clearly before anything is charged.",
      ],
    },
    {
      heading: "Ending it",
      paragraphs: [
        "You can stop using the service whenever you like and delete your account from inside the app. We may suspend accounts that break these terms, giving notice where possible.",
      ],
    },
    {
      heading: "Governing law",
      paragraphs: [
        "These terms are governed by Spanish law. For any dispute, the competent courts will be those of the consumer's domicile where the law provides for it.",
      ],
    },
  ],
};
