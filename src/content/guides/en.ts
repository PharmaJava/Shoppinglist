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
    relatedGuides: ["share-with-family", "save-money"],
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
  {
    key: "save-money",
    slug: "save-money-on-groceries",
    locale: "en",
    title: "How to save money on groceries without switching stores",
    metaTitle: "How to Save Money on Groceries: 6 Decisions That Work",
    metaDescription:
      "The decisions that actually lower a grocery bill: unit price over shelf price, store brands where it doesn't show, a closed list, and fewer store trips.",
    excerpt:
      "You don't need a different store or a smaller diet. Most of the savings come from six decisions made before you walk in.",
    publishedAt: "2026-08-11",
    updatedAt: "2026-08-11",
    body: [
      {
        heading: "Read the unit price, not the shelf price",
        paragraphs: [
          "It's the small number on the shelf tag, and it's the only one that lets you compare. Two boxes at the same price can hold different amounts, and a buy-two-get-one can cost more per ounce than the larger box beside it.",
          "Bigger doesn't always win. On fresh food, buying double and throwing half away is the worst unit price there is. Compare per unit, then ask whether you'll actually eat it.",
        ],
      },
      {
        heading: "Store brand where it doesn't show, name brand where it does",
        paragraphs: [
          "The gap between name brand and store brand is enormous in some products and undetectable in others. That's where most household savings live.",
        ],
        bullets: [
          "Barely noticeable: canned beans, crushed tomatoes, pasta, rice, milk, sugar, flour, frozen vegetables, cleaning supplies.",
          "Noticeable: coffee, chocolate, olive oil, cured meats, canned fish.",
          "The honest test: swap one product a week. If nobody at home mentions it, it stays.",
        ],
      },
      {
        heading: "Going less often costs less",
        paragraphs: [
          "Every trip adds unplanned purchases, however disciplined you are. Two big shops a month plus a short fresh-food run beats four full trips, and beats stopping by daily on the way home by a wide margin.",
          "It isn't about willpower. It's time inside the store, which is the most reliable lever anyone has.",
        ],
      },
      {
        heading: "Close the list before you walk in — with quantities",
        paragraphs: [
          'A list that says "tomatoes" makes you decide in the aisle. One that says "tomatoes, 2 lb" already decided at home, with the fridge in sight and on a full stomach.',
          "Putting a price on each item and watching the total changes behavior more than any tip: the number stops being a surprise at checkout and becomes something you steer during the trip.",
        ],
      },
      {
        heading: "Attack waste before price",
        paragraphs: [
          "Thrown-out food is money spent twice: you paid for it and you still have to replace it. In most homes it's produce, bread and dairy, and almost always because of good buying and bad sequencing.",
          "Freezing bread on arrival, planning leafy greens for the first two days and deliberately cooking extra to freeze saves more than chasing sales ever will.",
        ],
      },
      {
        heading: "Shop from a menu, not from instinct",
        paragraphs: [
          "Shopping without knowing what you'll cook produces loose ingredients that don't add up to meals. Five dinners decided in advance turn the list into something closed, and usually cut a quarter to a third from the cart.",
          'It doesn\'t need to be detailed. "Pasta, roast chicken, chili, tacos, fish" is enough to know what to buy and how much.',
        ],
      },
    ],
    faq: [
      {
        question: "How much can I save without switching stores?",
        answer:
          "It depends where you start, but the three big levers — store brands where it doesn't show, fewer trips, and less waste — usually beat changing chains, and cost you no extra driving.",
      },
      {
        question: "Are buy-one-get-one deals worth it?",
        answer:
          "Only if you were buying two and it won't spoil. On fresh food they rarely pay off; on canned goods and cleaning supplies they almost always do. The unit price settles it in seconds.",
      },
      {
        question: "Is warehouse club shopping cheaper?",
        answer:
          "On pantry staples, paper goods and cleaning supplies, usually yes. On fresh food it depends entirely on household size — for one or two people, bulk produce is waste with a discount.",
      },
      {
        question: "Does tracking prices on the list help?",
        answer:
          "Quite a bit. You can add a price per item and a budget for the list here, and see the running total while you shop instead of discovering it at the register.",
      },
    ],
    relatedTemplates: ["budget", "monthly", "student-flat"],
    relatedGuides: ["how-to-make"],
  },
];
