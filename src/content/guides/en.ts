import type { Guide } from "../types";

export const guidesEn: Guide[] = [
  {
    key: "how-to-make",
    slug: "how-to-make-a-grocery-list",
    locale: "en",
    title: "How to make a grocery list that actually works",
    metaTitle: "How to Make a Grocery List: A 5-Step Method",
    metaDescription:
      "The method for building a grocery list with no forgotten items and no overbuying: start from meals, order it by aisle, and keep it open all week.",
    excerpt:
      "Making a list is not writing down what ran out. It is a five-step method that decides what you spend and what you throw away.",
    publishedAt: "2026-08-10",
    updatedAt: "2026-08-10",
    body: [
      {
        heading: "Start from meals, not from the fridge",
        paragraphs: [
          "Most people start by opening the fridge and noting what is missing. The result is predictable: you buy the same things every week, then improvise dinner every night.",
          'Flip the order. Decide what you are going to eat first — five dinners and two lunches is usually enough — and derive the list from that. It does not need to be a detailed meal plan. Writing down "pasta, roast chicken, chili, omelette, fish" already tells you which proteins and sides you need.',
          "This one change removes most food waste, because everything in the cart has a job before you buy it.",
        ],
      },
      {
        heading: "Check what you already have",
        paragraphs: [
          "With the meals in front of you, look through the fridge, freezer and pantry. This is not an inventory — it is confirming you do not already own what you are about to buy.",
          "It is the step people skip most, and the one that prevents the most duplicates. Three jars of paprika in the cabinet is always a symptom of skipping it.",
        ],
      },
      {
        heading: "Order the list by aisle",
        paragraphs: [
          "A list written in the order things occurred to you forces you to crisscross the store. It also stretches the time you spend inside, and time in store is the factor most strongly linked to unplanned purchases.",
          "Group by section following the real layout: produce, bakery, meat and seafood, dairy, frozen, then the center aisles for canned goods and household. This app does it automatically — items are sorted into their aisle as you add them.",
        ],
      },
      {
        heading: "Write quantities, not just names",
        paragraphs: [
          '"Tomatoes" is not a list item, it is an ambiguous reminder. You will still have to decide at the shelf, and deciding in a hurry is how overbuying happens.',
          'Writing "tomatoes, 2 lb" or "milk, 1 gallon" closes the decision before you walk in. It is also what makes it possible for someone else to do the shopping without calling you.',
        ],
      },
      {
        heading: "Keep the list open all week",
        paragraphs: [
          "The best moment to add something is not before the trip — it is the moment it runs out. If you wait for shopping day, you are relying on memory.",
          "A pad on the fridge does this, but only for whoever is standing in the kitchen. A shared list on your phone can be updated by anyone from anywhere, which is what actually keeps things from being forgotten.",
        ],
      },
    ],
    faq: [
      {
        question: "What is the best way to organize a grocery list?",
        answer:
          "By aisle, following the layout of the store you actually shop at. It cuts time in store and prevents the backtracking that leads to unplanned purchases.",
      },
      {
        question: "Is a paper list or a phone list better?",
        answer:
          "Paper is faster to write, but only the person holding it can see it and nobody can update it remotely. A shared phone list wins as soon as more than one person shops for the household.",
      },
      {
        question: "How often should I grocery shop?",
        answer:
          "One larger weekly trip plus a short midweek run for fresh items generally wastes less than two large trips, and considerably less than shopping daily.",
      },
      {
        question: "How do I stop buying things I don't need?",
        answer:
          "A closed list with quantities, not shopping hungry, and not walking aisles you have no items in. Aisle ordering does more than willpower.",
      },
    ],
    relatedTemplates: ["weekly", "pantry", "family-of-4"],
    relatedGuides: ["share-with-family"],
  },
  {
    key: "share-with-family",
    slug: "share-grocery-list-with-family",
    locale: "en",
    title: "How to share a grocery list with your family",
    metaTitle: "How to Share a Grocery List With Your Family (No App to Install)",
    metaDescription:
      "Group chats fall apart as grocery lists within four messages. How to keep one shared list everyone can update, with no accounts and nothing to install.",
    excerpt:
      "The hard part is not writing the list. It is everyone seeing it, and it still being one list when you get to the store.",
    publishedAt: "2026-08-10",
    updatedAt: "2026-08-10",
    body: [
      {
        heading: "Why the group chat stops working",
        paragraphs: [
          "Almost every household starts the same way: someone types the list into the family chat. It works for about ten minutes.",
          'Then the one-line messages arrive — "add milk", "and bread" — and the original list is buried. At the store you end up scrolling back through the thread reassembling it, with no idea whether someone already grabbed the bread. A chat is a good place to notify people and a bad place to hold shared state.',
        ],
      },
      {
        heading: "What a household list actually needs",
        paragraphs: ["Four things, and most improvised solutions miss at least one."],
        bullets: [
          "One list, not copies on several phones that drift apart.",
          "Everyone can add, not just whoever created it.",
          "Checked-off items show up immediately, so nothing gets bought twice.",
          "No barrier to entry: if it requires installing an app and creating an account, half the household will not do it.",
        ],
      },
      {
        heading: "Doing it with a link",
        paragraphs: [
          "Create the list, tap share, and send the link. Whoever opens it sees the list and can add and check off items right in the browser — nothing to install, no sign-up.",
          "From then on it works like a shared whiteboard: if your partner checks off milk while standing in the store, you watch it happen. And if someone adds something on a Tuesday evening, it is still there on Saturday when someone goes shopping.",
        ],
      },
      {
        heading: "Splitting the trip between two people",
        paragraphs: [
          "A shared list lets you divide the store by section: one person takes produce and bakery, the other takes canned goods and household. Each checks items off, and both see the progress.",
          "The same works when you are in two different stores on the same day, which is common when one person hits the warehouse store and the other the local supermarket.",
        ],
      },
      {
        heading: "Bad reception in the store should not break it",
        paragraphs: [
          "Plenty of stores have poor cell service in the middle of the building. That is exactly when you need the list, so it has to work without a connection.",
          "This app saves what you check off even with no signal and syncs it as soon as you are back online. Nothing is lost, and there is nothing to refresh.",
        ],
      },
    ],
    faq: [
      {
        question: "Does everyone need to create an account?",
        answer:
          "No. Anyone with the link can view and edit the list without signing up. That is what makes it work in a real household — it does not depend on convincing anyone to install an app.",
      },
      {
        question: "How many people can share one list?",
        answer:
          "There is no practical limit for household use. Everyone sees the same items, and changes appear on every phone immediately.",
      },
      {
        question: "Can I share the list without giving out my phone number?",
        answer:
          "Yes. You share a link, not a contact. Send it however you like — whoever opens it sees no personal information about you.",
      },
      {
        question: "What if two people check off the same item at once?",
        answer:
          "There is no conflict: the item ends up checked once and both people see it that way. That is precisely what stops it being bought twice.",
      },
    ],
    relatedTemplates: ["family-of-4", "weekly"],
    relatedGuides: ["how-to-make"],
  },
];
