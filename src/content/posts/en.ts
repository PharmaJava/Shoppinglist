import type { Post } from "../types";

/**
 * Posts en inglés. Tema equivalente a los españoles (misma clave, lo exige
 * hreflang) pero escritos para el mercado anglosajón: otros ejemplos, otras
 * costumbres de compra, otro vocabulario.
 */
export const postsEn: Post[] = [
  {
    key: "overspending-mistakes",
    slug: "grocery-shopping-mistakes-that-cost-you-money",
    locale: "en",
    title: "7 grocery shopping mistakes that quietly cost you money",
    metaTitle: "7 Grocery Shopping Mistakes That Quietly Cost You Money",
    metaDescription:
      "The most common grocery mistakes — shopping without a list, shopping hungry, paying for convenience — and the concrete fix for each one.",
    excerpt:
      "None of these mistakes feels expensive on its own. Together, they are the gap between the total you expected and the one on your receipt.",
    publishedAt: "2026-08-10",
    updatedAt: "2026-08-10",
    body: [
      {
        heading: "1. Shopping without a list (a mental list doesn't count)",
        paragraphs: [
          "This is the root mistake that feeds all the others. Without a list, every aisle is a fresh decision, and decisions made at the shelf are decisions the store usually wins — that is what endcaps, eye-level placement and the checkout lane are for.",
          'A list in your head does not count. The moment you walk in, working memory fills up with stimuli, and "I\'ll definitely remember" turns into a second trip on Tuesday — with its own second round of unplanned purchases.',
        ],
      },
      {
        heading: "2. Shopping hungry",
        paragraphs: [
          "The oldest advice in the book, and it still works against you. Hungry shoppers do not buy groceries; they buy cravings with a short shelf life. The fix is not discipline, it is scheduling — shop after a meal, not before dinner.",
        ],
      },
      {
        heading: "3. Paying for convenience without deciding to",
        paragraphs: [
          "Pre-cut fruit, shredded cheese, washed salad kits: you pay two to three times the per-pound price of the same food whole. Sometimes convenience is worth it — if the alternative is not eating vegetables at all, the salad kit is a bargain. The mistake is not paying for convenience; it is paying for it by default instead of by decision.",
          'The fix is putting it on the list by name. "Bagged spinach" is a decision; grabbing the bag because it was at hand is not.',
        ],
      },
      {
        heading: "4. Ignoring the unit price",
        paragraphs: [
          'The big number on the tag is the package price; the one that matters is the small one — per ounce or per pound. "Family size" does not always mean cheaper, and brands use odd package sizes precisely so comparing in your head is hard. Ten seconds of unit-price reading beats any coupon.',
        ],
      },
      {
        heading: "5. Only shopping at eye level",
        paragraphs: [
          "Eye level is the most expensive real estate in the store, and brands pay to be there. The equivalent, cheaper option is usually one shelf down or one shelf up. It is literally one squat per aisle.",
        ],
      },
      {
        heading: "6. Frequent small trips instead of a weekly plan",
        paragraphs: [
          'Every store visit is a fresh exposure to everything above. Five quick trips a week means paying the "door toll" five times: the craving, the deal, the while-I\'m-here. One main weekly trip plus a short midweek top-up for fresh items cuts the visits — and with them, the purchases that were never in the plan.',
        ],
      },
      {
        heading: "7. Everyone shopping separately",
        paragraphs: [
          "In a household where two people shop without a shared list, duplicates are not bad luck — they are the expected outcome. Two jars of pasta sauce, two heads of lettuce, and half of it ends up in the trash.",
          "The fix is one shared list that everyone updates, with items checked off in real time so nothing gets bought twice. That is exactly what this app does, free and with no sign-up: create the list, send the link, and the duplicates stop.",
        ],
      },
    ],
    faq: [
      {
        question: "How much does shopping with a list actually save?",
        answer:
          "It depends on your starting point, but the mechanism is simple: a list eliminates improvised decisions, which is where unplanned spending concentrates. The savings come less from coupons and more from what never enters the cart.",
      },
      {
        question: "Is one big weekly trip really better?",
        answer:
          "For your wallet, almost always — fewer visits mean fewer impulse buys. For food waste, pair it with a short midweek run for fresh items instead of overbuying produce on Saturday.",
      },
      {
        question: "Are store brands always cheaper?",
        answer:
          "Per unit, almost always; on quality it depends on the category. Check the unit price and test for yourself: on staples like beans, rice, milk or frozen vegetables, the price gap rarely comes with a proportional quality gap.",
      },
    ],
    relatedTemplates: ["weekly", "pantry"],
    relatedGuides: ["how-to-make"],
    relatedPosts: ["forget-items", "what-to-freeze"],
  },
  {
    key: "forget-items",
    slug: "why-you-always-forget-something-at-the-store",
    locale: "en",
    title: "Why you always forget something at the store (and how to stop)",
    metaTitle: "Why You Always Forget Something at the Store (and How to Stop)",
    metaDescription:
      "Forgetting groceries isn't carelessness — it's how memory works. Three concrete changes that get you home with everything, no second trip.",
    excerpt:
      "Coming home without the one thing you actually needed is not a personal failure. It is a failure of the system you use to remember.",
    publishedAt: "2026-08-10",
    updatedAt: "2026-08-10",
    body: [
      {
        heading: "The forgetting doesn't happen at the store — it happens at home",
        paragraphs: [
          'You do not lose the shampoo when you walk past the toiletries aisle. You lose it three days earlier, when the bottle ran out and you thought "I\'ll remember that." Prospective memory — remembering to remember — is among the least reliable things we have, and it gets worse the busier your head is.',
          "That is why the only system that works is capturing in the moment: the bottle runs out, the item goes on the list. Not later, not on Saturday when you write the list. Right then.",
        ],
      },
      {
        heading: "A paper list gets forgotten along with everything else",
        paragraphs: [
          "The irony of the paper list is that it adds its own things to remember: writing it, finishing it, and bringing it. Your phone solves half the problem by default — it is always with you. A shared list solves the other half: anyone in the household can add the shampoo the moment it runs out, wherever they are.",
        ],
      },
      {
        heading: "Inside the store, order is everything",
        paragraphs: [
          "The second kind of forgetting happens with the list in hand: you still skip things. That is almost always an ordering problem. An unordered list forces you to re-read the whole thing in every aisle, and re-reading while pushing a cart is how items get skipped.",
          "With the list grouped by aisle — produce, dairy, meat, pantry — each section of the store has its own block: check it off, move on. This app groups items automatically as you add them, and store mode keeps the screen on with big touch targets, so you can check things off one-handed at the cart.",
        ],
      },
      {
        heading: "Three changes that eliminate the second trip",
        paragraphs: ["You do not need a complex system. You need three small habits."],
        bullets: [
          'Immediate capture: when something runs out, it goes on the list right then — not "later".',
          "One shared list: a single source of truth the whole household can edit.",
          "Aisle order: in the store you work through sections, not re-read from the top.",
        ],
      },
    ],
    faq: [
      {
        question: "Why do I forget exactly the thing I needed most?",
        answer:
          'Because urgent items get "noted" mentally at the worst moment — while you are busy with something else — and prospective memory drops those reminders easily. The fix is not trying harder to remember: it is capturing the item immediately in a list you always carry.',
      },
      {
        question: "Does aisle ordering help if my store is laid out differently?",
        answer:
          "Yes. Exact aisle order varies by chain, but the grouping — fresh together, pantry together, household together — works everywhere, because it eliminates the re-reading where skips happen.",
      },
      {
        question: "What if I lose signal inside the store?",
        answer:
          "Nothing breaks: this app works offline and syncs automatically once you are back online. Whatever you check off inside is safe.",
      },
    ],
    relatedTemplates: ["weekly", "pantry"],
    relatedGuides: ["how-to-make", "share-with-family"],
    relatedPosts: ["overspending-mistakes", "what-to-freeze"],
  },
  {
    key: "what-to-freeze",
    slug: "what-to-freeze-when-you-get-home-from-the-store",
    locale: "en",
    title: "What to freeze the moment you get home from the store (and what not to)",
    metaTitle: "What to Freeze When You Get Home From the Grocery Store",
    metaDescription:
      "Freezing the right things while you're still unpacking is what decides how much you throw out on Friday. What goes in, how, and what should never go near a freezer.",
    excerpt:
      "Food waste doesn't start on Friday. It starts on Saturday, while you're putting the groceries away.",
    publishedAt: "2026-08-11",
    updatedAt: "2026-08-11",
    body: [
      {
        heading: "Waste is decided while you unpack",
        paragraphs: [
          "Almost everything that gets thrown out was perfectly good the day it came home. It spoils because it went in the fridge whole, waiting for a day of the week that never arrives.",
          "Freezing isn't for leftovers. It's a decision made with the bags still on the kitchen floor. Ten minutes, and half the groceries stop having an expiration date.",
        ],
      },
      {
        heading: "What goes in the freezer immediately",
        paragraphs: [
          "You don't need to freeze half the cart. These few things cover most of what usually ends up in the trash.",
        ],
        bullets: [
          "Bread: whatever loaf you won't finish today, sliced first. Frozen whole, you have to thaw the whole thing, and nobody does.",
          "Ground meat: flat in a bag, not in a ball. Thaws in twenty minutes instead of overnight.",
          "Chicken breasts and steaks: separated by parchment, so you can pull one without pulling all four.",
          "Fresh fish you won't eat within two days. Buying it fresh and freezing it at home beats leaving it in the fridge until Thursday.",
          "Shredded cheese, butter and bacon: they keep for months and go straight from frozen into the pan.",
          "Overripe bananas, peeled and chunked. It's the only future a black banana has.",
        ],
      },
      {
        heading: "What shouldn't go in",
        paragraphs: [
          "Freezing the wrong thing wastes it twice: the food and the space. These come out worse than they went in, and no technique fixes it.",
        ],
        bullets: [
          "Salad greens and lettuce: they come out as a wet rag.",
          "Raw potatoes, cucumber, and tomatoes meant to be eaten raw.",
          "Eggs in the shell.",
          "Yogurt, heavy cream and soft cheeses: they split.",
          "Anything fried, which loses everything that made it worth frying.",
        ],
      },
      {
        heading: "Three rules that make it work",
        paragraphs: [
          "Freezing well isn't just putting it in there. The difference between a useful freezer and a graveyard of unlabeled bags comes down to three things.",
        ],
        bullets: [
          "Meal-sized portions, never one solid block. A frozen three-pound brick is three pounds you won't use.",
          "Flat, in bags, not tubs. Less space, faster freeze, much faster thaw.",
          "Date written on it. Not for safety — so you know what to use first, which is what prevents the geological layer at the bottom.",
        ],
      },
      {
        heading: "And the part that keeps you from forgetting",
        paragraphs: [
          "The expensive mistake isn't freezing badly, it's freezing and forgetting. Anything at the bottom of the freezer effectively doesn't exist, and you end up buying it again.",
          'Adding "chicken in the freezer" to the shared list takes five seconds and the whole household sees it. It\'s the same reason a list works better on a phone than on the fridge door: the person standing in the store can see it, not just the person standing in the kitchen.',
        ],
      },
    ],
    faq: [
      {
        question: "How long does meat last in the freezer?",
        answer:
          "Three to six months for raw cuts and a bit less for ground meat, which has more exposed surface. Beyond that it stays safe if the cold chain held, but texture and flavor suffer.",
      },
      {
        question: "Can you freeze bread already sliced?",
        answer:
          "It's the best way to do it. Separate slices let you pull two and toast them straight from frozen, without thawing the loaf.",
      },
      {
        question: "Can you refreeze something that's been thawed?",
        answer:
          "Not raw. Cooked, yes: thawing chicken, cooking it and freezing the finished dish is fine, and it's the whole basis of meal prep.",
      },
      {
        question: "How do I keep track of what's in there?",
        answer:
          "Write it where you already look. A shared list on your phone does that: whoever is standing in the store can see there's already a pound of ground beef at home.",
      },
    ],
    relatedTemplates: ["batch-cooking", "monthly", "weekly"],
    relatedGuides: ["save-money", "how-to-make"],
    relatedPosts: ["overspending-mistakes", "forget-items"],
  },
];
