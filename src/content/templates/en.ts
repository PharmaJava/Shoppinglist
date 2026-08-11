import type { Template } from "../types";

/**
 * Plantillas en inglés. Escritas para el mercado anglosajón, no traducidas del
 * español (ver docs/02-SEO.md §4.3): allí la compra es semanal, en grandes
 * superficies, y la consulta dominante es "grocery", no "shopping".
 */
export const templatesEn: Template[] = [
  {
    key: "weekly",
    slug: "weekly-grocery-list",
    locale: "en",
    title: "Weekly grocery list for two",
    metaTitle: "Weekly Grocery List for Two (With Quantities)",
    metaDescription:
      "A complete weekly grocery list for two people, with real quantities and aisle-by-aisle order. Use it in one click and share it with whoever shops with you.",
    excerpt:
      "One week of groceries for two, with quantities set so you are not throwing out half the produce drawer on Sunday.",
    serves: "2 people · 7 days",
    budget: "$85-110 per week",
    updatedAt: "2026-08-10",
    sections: [
      {
        categoryId: "produce",
        items: [
          { name: "Bananas", qty: 6 },
          { name: "Apples", qty: 4 },
          { name: "Baby spinach", qty: 1, unit: "bag" },
          { name: "Romaine lettuce", qty: 1 },
          { name: "Tomatoes", qty: 4 },
          { name: "Yellow onions", qty: 3 },
          { name: "Garlic", qty: 1, unit: "head" },
          { name: "Bell peppers", qty: 3 },
          { name: "Carrots", qty: 1, unit: "bag" },
          { name: "Broccoli", qty: 2, unit: "heads" },
          { name: "Russet potatoes", qty: 5, unit: "lb" },
        ],
      },
      {
        categoryId: "dairy",
        items: [
          { name: "Milk", qty: 1, unit: "gallon" },
          { name: "Eggs", qty: 12 },
          { name: "Greek yogurt", qty: 1, unit: "large tub" },
          { name: "Shredded cheese", qty: 1, unit: "bag" },
          { name: "Butter", qty: 1 },
        ],
      },
      {
        categoryId: "meat",
        items: [
          { name: "Chicken breast", qty: 2, unit: "lb" },
          { name: "Ground beef", qty: 1, unit: "lb" },
        ],
      },
      {
        categoryId: "fish",
        items: [{ name: "Salmon fillets", qty: 2 }],
      },
      {
        categoryId: "bakery",
        items: [
          { name: "Sandwich bread", qty: 1, unit: "loaf" },
          { name: "Tortillas", qty: 1, unit: "pack" },
        ],
      },
      {
        categoryId: "pantry",
        items: [
          { name: "Rice", qty: 1, unit: "bag" },
          { name: "Pasta", qty: 2, unit: "boxes" },
          { name: "Marinara sauce", qty: 2, unit: "jars" },
          { name: "Black beans", qty: 2, unit: "cans" },
          { name: "Canned tuna", qty: 4 },
          { name: "Olive oil", qty: 1 },
          { name: "Peanut butter", qty: 1 },
        ],
      },
      {
        categoryId: "breakfast",
        items: [
          { name: "Rolled oats", qty: 1, unit: "container" },
          { name: "Coffee", qty: 1, unit: "bag" },
        ],
      },
    ],
    body: [
      {
        heading: "Who this list is built for",
        paragraphs: [
          "This is sized for two adults who eat dinner at home five or six nights a week and pack lunch at least a few days. That is the most common setup, and it is exactly the one that breaks when you take a family-sized list and cut it in half.",
          "The protein math is simple: two pounds of chicken, one pound of ground beef and two salmon fillets cover the week's main dishes without anything getting buried in the freezer. Produce is intentionally generous, because it absorbs the nights when you skip the plan.",
        ],
      },
      {
        heading: "Shop the perimeter, then fill in",
        paragraphs: [
          "The list is ordered the way most US supermarkets are laid out: produce, dairy, meat and bakery around the outside, packaged goods through the middle. Following that order cuts the trip noticeably, and it also cuts impulse buys, because you spend less time wandering the center aisles.",
        ],
        bullets: [
          "Days 1-2: salmon, lettuce and tomatoes. Shortest shelf life, eat them first.",
          "Days 3-5: chicken, peppers, broccoli, the ripest fruit.",
          "Days 6-7: potatoes, onions, carrots, canned beans, anything frozen.",
          "Freeze on arrival: half the ground beef, flat in a zip bag so it thaws fast.",
        ],
      },
      {
        heading: "Adjusting the list",
        paragraphs: [
          "Eating out twice during the week? Drop the salmon and cut the chicken to a pound. That single change is where most of the savings are, and variety barely suffers.",
          "Buying in bulk only pays off here on rice, pasta, oats and peanut butter. Bulk produce and bulk dairy are how a cheap grocery run turns into food waste.",
        ],
      },
    ],
    faq: [
      {
        question: "How much does a weekly grocery list for two cost?",
        answer:
          "Roughly $85-110 at a mid-range US supermarket, depending on region and whether you buy store brands. Produce and meat drive most of the variation.",
      },
      {
        question: "Can I use this list for one person?",
        answer:
          "Yes, halve the protein — but do not halve the pantry or produce. Minimum package sizes are the same, so cooking full recipes and freezing portions works out cheaper than buying smaller.",
      },
      {
        question: "How do I split this between two stores?",
        answer:
          "Produce and meat at whichever store you trust, packaged goods wherever is cheapest. Share the list and check items off as you go — the other person sees what is already in the cart in real time.",
      },
      {
        question: "How do I share this list with my partner?",
        answer:
          'Tap "Use this template" and share the link. Whoever opens it can add and check off items from their own phone, with no sign-up, and both phones stay in sync.',
      },
    ],
    relatedTemplates: ["single", "family-of-4", "batch-cooking"],
    relatedGuides: ["how-to-make", "share-with-family"],
  },
  {
    key: "family-of-4",
    slug: "grocery-list-family-of-4",
    locale: "en",
    title: "Weekly grocery list for a family of 4",
    metaTitle: "Weekly Grocery List for a Family of 4 (With Quantities)",
    metaDescription:
      "A realistic weekly grocery list for a family of four, with quantities, aisle order and the three categories that quietly blow up your total.",
    excerpt:
      "A week of groceries for four, scaled the way families actually scale: some things double, most things do not.",
    serves: "4 people · 7 days",
    budget: "$175-230 per week",
    updatedAt: "2026-08-10",
    sections: [
      {
        categoryId: "produce",
        items: [
          { name: "Bananas", qty: 12 },
          { name: "Apples", qty: 8 },
          { name: "Grapes", qty: 2, unit: "bags" },
          { name: "Baby carrots", qty: 2, unit: "bags" },
          { name: "Broccoli", qty: 2, unit: "heads" },
          { name: "Yellow onions", qty: 1, unit: "bag" },
          { name: "Bell peppers", qty: 4 },
          { name: "Romaine lettuce", qty: 2 },
          { name: "Tomatoes", qty: 6 },
          { name: "Russet potatoes", qty: 10, unit: "lb" },
        ],
      },
      {
        categoryId: "dairy",
        items: [
          { name: "Milk", qty: 2, unit: "gallons" },
          { name: "Eggs", qty: 24 },
          { name: "Yogurt cups", qty: 12 },
          { name: "Sliced cheese", qty: 1, unit: "pack" },
          { name: "Shredded cheese", qty: 2, unit: "bags" },
          { name: "Butter", qty: 1 },
        ],
      },
      {
        categoryId: "meat",
        items: [
          { name: "Whole chicken", qty: 1 },
          { name: "Ground beef", qty: 2, unit: "lb" },
          { name: "Pork chops", qty: 4 },
        ],
      },
      {
        categoryId: "deli",
        items: [{ name: "Sandwich turkey", qty: 1, unit: "lb" }],
      },
      {
        categoryId: "bakery",
        items: [
          { name: "Sandwich bread", qty: 2, unit: "loaves" },
          { name: "Bagels", qty: 1, unit: "pack" },
          { name: "Tortillas", qty: 1, unit: "pack" },
        ],
      },
      {
        categoryId: "pantry",
        items: [
          { name: "Rice", qty: 1, unit: "large bag" },
          { name: "Pasta", qty: 4, unit: "boxes" },
          { name: "Marinara sauce", qty: 3, unit: "jars" },
          { name: "Canned black beans", qty: 4 },
          { name: "Peanut butter", qty: 1, unit: "large jar" },
          { name: "Olive oil", qty: 1 },
        ],
      },
      {
        categoryId: "breakfast",
        items: [
          { name: "Cereal", qty: 2, unit: "boxes" },
          { name: "Rolled oats", qty: 1, unit: "container" },
          { name: "Coffee", qty: 1, unit: "bag" },
        ],
      },
      {
        categoryId: "cleaning",
        items: [
          { name: "Laundry detergent", qty: 1 },
          { name: "Dish soap", qty: 1 },
          { name: "Paper towels", qty: 1, unit: "pack" },
        ],
      },
    ],
    body: [
      {
        heading: "A family of four is not two couples",
        paragraphs: [
          "The classic mistake when scaling a grocery list is doubling everything. In practice, three groups behave very differently.",
          "Breakfast and packed lunches more than double once kids are involved — milk, cereal, fruit and bread go fastest. Dinner protein grows less than you would expect, because kid portions are smaller. And pantry staples barely move week to week: you buy the large size and it lasts a month.",
        ],
      },
      {
        heading: "Where the total actually goes",
        paragraphs: [
          "The gap between a $175 week and a $230 week almost always comes down to the same three categories.",
        ],
        bullets: [
          "Snacks: the one category that grows without anyone deciding to grow it. Put a fixed quantity on the list and it stops.",
          "Pre-cut and pre-packaged produce: convenience costs two to three times the whole version of the same vegetable.",
          "Small meat packs: a whole chicken runs well under the per-pound price of boneless breast, and it stretches across two dinners.",
        ],
      },
      {
        heading: "Cook once, eat twice",
        paragraphs: [
          "Three items on this list are chosen specifically because they carry two meals. Ground beef covers taco night and pasta sauce. A whole chicken covers a roast dinner and then soup or quesadillas from the leftovers. A pot of rice covers a side and then fried rice.",
          "That is what makes a weekly list survive a work week: it does not need you to cook from scratch every night, it needs one afternoon.",
        ],
      },
    ],
    faq: [
      {
        question: "How much does a family of four spend on groceries per week?",
        answer:
          "This list runs about $175-230 depending on region and store brands, which is in line with USDA moderate-cost plan estimates for a family of four.",
      },
      {
        question: "What if two of the four are young kids?",
        answer:
          "Cut dinner protein by about 25% and increase fruit, milk and yogurt. Pantry quantities stay the same.",
      },
      {
        question: "How do we stop buying duplicates?",
        answer:
          "Usually the issue is that each person keeps their own list. Share this one link with the household — when someone adds milk, everyone sees it immediately.",
      },
      {
        question: "Is one big weekly trip better than two small ones?",
        answer:
          "One large trip plus a short midweek run for milk, bread and produce tends to waste less than two large trips, without making you carry everything at once.",
      },
    ],
    relatedTemplates: ["weekly", "holiday-rental", "monthly"],
    relatedGuides: ["share-with-family", "how-to-make"],
  },
  {
    key: "pantry",
    slug: "pantry-staples-list",
    locale: "en",
    title: "Pantry staples list",
    metaTitle: "Pantry Staples List: What to Always Keep at Home",
    metaDescription:
      "The staples worth keeping stocked so you can cook any night without a store run. Full list by aisle, with the rule for what earns a spot.",
    excerpt:
      "Not a weekly shop — the kitchen's foundation. What makes dinner possible on a night you planned nothing.",
    serves: "Any household · restock, don't repeat",
    budget: "$110-140 to stock from scratch",
    updatedAt: "2026-08-10",
    sections: [
      {
        categoryId: "pantry",
        items: [
          { name: "Olive oil", qty: 1 },
          { name: "Neutral cooking oil", qty: 1 },
          { name: "Salt", qty: 1 },
          { name: "Black pepper", qty: 1 },
          { name: "Garlic powder", qty: 1 },
          { name: "Paprika", qty: 1 },
          { name: "Dried oregano", qty: 1 },
          { name: "Soy sauce", qty: 1 },
          { name: "Vinegar", qty: 1 },
          { name: "Rice", qty: 1, unit: "large bag" },
          { name: "Pasta", qty: 3, unit: "boxes" },
          { name: "Canned diced tomatoes", qty: 4 },
          { name: "Canned black beans", qty: 4 },
          { name: "Canned chickpeas", qty: 2 },
          { name: "Canned tuna", qty: 6 },
          { name: "Chicken broth", qty: 2, unit: "cartons" },
          { name: "Peanut butter", qty: 1 },
          { name: "All-purpose flour", qty: 1, unit: "bag" },
        ],
      },
      {
        categoryId: "frozen",
        items: [
          { name: "Frozen peas", qty: 1, unit: "bag" },
          { name: "Frozen broccoli", qty: 1, unit: "bag" },
          { name: "Frozen berries", qty: 1, unit: "bag" },
        ],
      },
      {
        categoryId: "produce",
        items: [
          { name: "Yellow onions", qty: 1, unit: "bag" },
          { name: "Garlic", qty: 1, unit: "head" },
          { name: "Potatoes", qty: 5, unit: "lb" },
        ],
      },
      {
        categoryId: "dairy",
        items: [
          { name: "Eggs", qty: 12 },
          { name: "Butter", qty: 1 },
        ],
      },
      {
        categoryId: "cleaning",
        items: [
          { name: "Dish soap", qty: 1 },
          { name: "Laundry detergent", qty: 1 },
          { name: "Trash bags", qty: 1, unit: "box" },
          { name: "Paper towels", qty: 1, unit: "pack" },
          { name: "Toilet paper", qty: 1, unit: "pack" },
        ],
      },
    ],
    body: [
      {
        heading: "What a staples list actually is",
        paragraphs: [
          "This is not a weekly shop. It is the base that lets you cook without a plan: onion, garlic, oil, canned tomatoes, pasta or rice and an egg is dinner. Everything else is a variation on that.",
          "Stocking it from scratch costs $110-140, but it does not repeat. After the first time you are only replacing what ran out. Keep this list saved and review it monthly, not weekly.",
        ],
      },
      {
        heading: "The rule: keeps, solves, combines",
        paragraphs: [
          "An item earns a permanent spot only if it does all three. It keeps for months, it can carry a meal on its own, and it works with most of the other things on the list.",
        ],
        bullets: [
          "Canned beans: protein in two minutes, no soaking and no planning.",
          "Canned tomatoes: the base of half of all weeknight dinners.",
          "Frozen vegetables: the only realistic way to always have vegetables on hand without throwing them out.",
          "Eggs: still the cheapest emergency meal there is.",
        ],
      },
      {
        heading: "What not to stock",
        paragraphs: [
          "Single-recipe spices, specialty sauces, and warehouse sizes of things you barely use. They take up space, expire quietly, and create the illusion of a full pantry.",
          "The test is simple: if you will not use it three times in the next two months, it is not a staple. Buy it when the recipe comes up.",
        ],
      },
    ],
    faq: [
      {
        question: "How often should I restock the pantry?",
        answer:
          "A monthly review is enough. The practical trick is not waiting for things to run out — when you open the last can of tomatoes, add it to the shared list right then.",
      },
      {
        question: "Is buying in bulk worth it for staples?",
        answer:
          "Only for what you genuinely use: rice, pasta, oil, beans, paper goods. For spices and sauces, the large size usually expires before you finish it.",
      },
      {
        question: "Does this work for one person?",
        answer:
          "Especially for one person. Living alone is when a stocked pantry pays off most, because it replaces the daily store run and the delivery orders that quietly cost the most.",
      },
    ],
    relatedTemplates: ["monthly", "weekly", "budget"],
    relatedGuides: ["how-to-make"],
  },
  {
    key: "healthy",
    slug: "healthy-grocery-list",
    locale: "en",
    title: "Healthy grocery list",
    metaTitle: "Healthy Grocery List: What to Buy (and What to Skip)",
    metaDescription:
      "A genuinely healthy grocery list, with the rule for reading a label in ten seconds and no expensive diet products. Use it in one click.",
    excerpt:
      "Eating better is decided in the store, not in the kitchen. Here is the cart, plus how to choose standing in front of the shelf.",
    serves: "2 people · 7 days",
    budget: "$95-120 per week",
    updatedAt: "2026-08-10",
    sections: [
      {
        categoryId: "produce",
        items: [
          { name: "Baby spinach", qty: 2, unit: "bags" },
          { name: "Broccoli", qty: 2, unit: "heads" },
          { name: "Bell peppers", qty: 3 },
          { name: "Cucumber", qty: 2 },
          { name: "Tomatoes", qty: 5 },
          { name: "Sweet potatoes", qty: 4 },
          { name: "Avocados", qty: 3 },
          { name: "Apples", qty: 6 },
          { name: "Bananas", qty: 6 },
          { name: "Blueberries", qty: 1, unit: "container" },
          { name: "Lemons", qty: 3 },
        ],
      },
      {
        categoryId: "meat",
        items: [{ name: "Chicken breast", qty: 1.5, unit: "lb" }],
      },
      {
        categoryId: "fish",
        items: [
          { name: "Salmon fillets", qty: 2 },
          { name: "Canned sardines", qty: 3, note: "Packed in olive oil, not soybean oil" },
        ],
      },
      {
        categoryId: "dairy",
        items: [
          { name: "Plain Greek yogurt", qty: 1, unit: "large tub" },
          { name: "Eggs", qty: 12 },
          { name: "Cottage cheese", qty: 1 },
        ],
      },
      {
        categoryId: "pantry",
        items: [
          { name: "Brown rice", qty: 1, unit: "bag" },
          { name: "Lentils", qty: 1, unit: "bag" },
          { name: "Canned chickpeas", qty: 3 },
          { name: "Olive oil", qty: 1 },
          { name: "Walnuts", qty: 1, unit: "bag" },
          { name: "Almonds", qty: 1, unit: "bag" },
        ],
      },
      {
        categoryId: "breakfast",
        items: [
          { name: "Rolled oats", qty: 1, unit: "container" },
          {
            name: "100% whole wheat bread",
            qty: 1,
            note: "First ingredient must be whole wheat flour",
          },
        ],
      },
    ],
    body: [
      {
        heading: "Make the cart look like the plate",
        paragraphs: [
          "The simplest way to keep a grocery run healthy is to shape the cart like the plate you want to eat: half produce, a quarter protein, a quarter whole grains or legumes.",
          "If you reach the register and produce is not filling half the cart, the week is already decided. No amount of willpower in the kitchen fixes a cart that was filled wrong.",
        ],
      },
      {
        heading: "Reading a label in ten seconds",
        paragraphs: [
          "You do not need the full nutrition panel. The ingredient list answers almost everything on its own.",
        ],
        bullets: [
          "Fewer ingredients is better. More than five, several unrecognizable? Put it back.",
          "Order matters — ingredients are listed by weight. If sugar is in the top three, it is a dessert.",
          '"Wheat bread" is not enough: the first ingredient has to be whole wheat flour, not enriched flour.',
          '"Light", "natural" and "organic" say nothing about processing. A product can be organic and still be ultra-processed.',
        ],
      },
      {
        heading: "What this list leaves out on purpose",
        paragraphs: [
          "No juice, no sweetened breakfast cereal, no flavored yogurt, no protein bars. Not a moral position — those are simply the items that add the most added sugar to an average US cart without anyone noticing.",
          "It also leaves out expensive health-food substitutes. This cart runs $95-120 for two, close to a regular weekly shop. What makes healthy eating expensive is not produce; it is the diet-branded products.",
        ],
      },
    ],
    faq: [
      {
        question: "Is a healthy grocery list more expensive?",
        answer:
          "Not inherently. This cart runs $95-120 for two people, close to a conventional weekly shop. Lentils, eggs, frozen vegetables, seasonal produce and canned fish are among the cheapest foods per gram of protein.",
      },
      {
        question: "Are frozen vegetables as good as fresh?",
        answer:
          "Essentially yes — they are frozen right after harvest, so nutrient retention is comparable, and they eliminate the waste of produce going bad in the drawer.",
      },
      {
        question: "What if I don't eat fish?",
        answer:
          "Replace it with legumes and eggs rather than more red meat. Two extra lentil or chickpea meals a week cover the protein at a lower cost.",
      },
      {
        question: "How do I adapt this for vegetarian eating?",
        answer:
          "Drop the chicken and fish, raise chickpeas to five cans and lentils to two bags, and add tofu or tempeh. The rest of the structure stays the same.",
      },
    ],
    relatedTemplates: ["gluten-free", "vegetarian", "weekly"],
    relatedGuides: ["how-to-make"],
  },
  {
    key: "monthly",
    slug: "monthly-grocery-list",
    locale: "en",
    title: "Monthly grocery list",
    metaTitle: "Monthly Grocery List: What to Stock Up On (and What Not To)",
    metaDescription:
      "The big monthly haul, split by what actually keeps and what can't wait. Quantities for two, plus the freezer strategy that makes it work.",
    excerpt:
      "A monthly shop isn't four weekly ones at once. It's separating what keeps from what doesn't — and that changes the whole list.",
    serves: "2 people · 1 month",
    budget: "$260-320 for the big trip",
    updatedAt: "2026-08-10",
    sections: [
      {
        categoryId: "pantry",
        items: [
          { name: "Rice", qty: 10, unit: "lb" },
          { name: "Pasta", qty: 8, unit: "boxes" },
          { name: "Dried lentils", qty: 3, unit: "lb" },
          { name: "Canned black beans", qty: 10 },
          { name: "Canned diced tomatoes", qty: 12 },
          { name: "Canned tuna", qty: 12 },
          { name: "Olive oil", qty: 2, unit: "large bottles" },
          { name: "Peanut butter", qty: 2, unit: "large jars" },
          { name: "All-purpose flour", qty: 1, unit: "large bag" },
          { name: "Chicken broth", qty: 6, unit: "cartons" },
          { name: "Coffee", qty: 2, unit: "bags" },
          { name: "Rolled oats", qty: 2, unit: "large containers" },
        ],
      },
      {
        categoryId: "frozen",
        items: [
          { name: "Chicken thighs", qty: 6, unit: "lb" },
          { name: "Ground beef", qty: 4, unit: "lb" },
          { name: "Frozen fish fillets", qty: 2, unit: "bags" },
          { name: "Frozen broccoli", qty: 4, unit: "bags" },
          { name: "Frozen berries", qty: 3, unit: "bags" },
          {
            name: "Sandwich bread",
            qty: 3,
            unit: "loaves",
            note: "Freeze on arrival, toasts from frozen",
          },
        ],
      },
      {
        categoryId: "produce",
        items: [
          { name: "Russet potatoes", qty: 10, unit: "lb" },
          { name: "Yellow onions", qty: 5, unit: "lb" },
          { name: "Garlic", qty: 2, unit: "heads" },
          { name: "Carrots", qty: 3, unit: "lb" },
          { name: "Butternut squash", qty: 2, note: "Whole, keeps for weeks somewhere cool" },
        ],
      },
      {
        categoryId: "dairy",
        items: [
          { name: "Shelf-stable milk", qty: 6, unit: "cartons" },
          { name: "Butter", qty: 2, unit: "lb", note: "Freezes perfectly" },
        ],
      },
      {
        categoryId: "cleaning",
        items: [
          { name: "Laundry detergent", qty: 1, unit: "large" },
          { name: "Dish soap", qty: 2 },
          { name: "Toilet paper", qty: 1, unit: "bulk pack" },
          { name: "Paper towels", qty: 1, unit: "bulk pack" },
          { name: "Trash bags", qty: 2, unit: "boxes" },
        ],
      },
      {
        categoryId: "personal",
        items: [
          { name: "Shampoo", qty: 2 },
          { name: "Body wash", qty: 2 },
          { name: "Toothpaste", qty: 3 },
        ],
      },
    ],
    body: [
      {
        heading: "Shelf life decides this list, not quantity",
        paragraphs: [
          "A monthly grocery run isn't a weekly one times four. Try it and half the produce is in the trash by week two — you paid to throw it away.",
          "The rule here is different: in goes anything that survives a month unattended — pantry, frozen, root vegetables, cleaning and personal care. Fresh stays out and gets its own short weekly trip.",
        ],
      },
      {
        heading: "What actually keeps a month",
        paragraphs: [
          "More than people expect, if it's stored right. And considerably less produce than people assume.",
        ],
        bullets: [
          "Keeps easily: rice, pasta, beans, canned goods, oil, coffee, shelf-stable milk, paper goods, toiletries.",
          "Keeps in a cool dark spot: potatoes, onions, garlic, carrots, whole winter squash.",
          "Keeps only frozen: meat, fish, bread, butter, vegetables. This is why the freezer is the whole strategy.",
          "Doesn't keep: fresh fruit, salad greens, fresh dairy, eggs much past three weeks.",
        ],
      },
      {
        heading: "Your freezer is the real limit",
        paragraphs: [
          "This list only works if it fits. Six pounds of chicken thighs and four of ground beef take real space, and it's worth freezing them the same day in flat one-meal portions: they thaw in an hour and you avoid hacking at a six-pound brick for two servings.",
          "If your freezer is the drawer on top of a small fridge, this shop isn't for you — a biweekly run makes more sense. That's the honest limitation of monthly shopping, and almost nobody mentions it.",
        ],
      },
      {
        heading: "What stays weekly",
        paragraphs: [
          "Fruit, salad, tomatoes, yogurt, eggs and fresh bread. Ten minutes midweek, and it's the difference between a monthly shop and a month of canned dinners.",
          "The practical setup is two running lists: this one, reviewed monthly, and a short fresh list that fills itself during the week. On a shared list, anyone in the household can top up either.",
        ],
      },
    ],
    faq: [
      {
        question: "Does shopping monthly actually save money?",
        answer:
          "The savings come from entering the store less often, not from bulk pricing — fewer trips means fewer impulse buys. Bulk sizes genuinely pay off on rice, oil, beans, paper goods and detergent, and rarely on much else.",
      },
      {
        question: "What about fruit and vegetables?",
        answer:
          "They don't go in the monthly run except the ones that keep — potatoes, onions, carrots, winter squash. Everything else gets a short weekly trip; trying to buy produce monthly is the fastest way to waste food.",
      },
      {
        question: "Do I need a big freezer?",
        answer:
          "For this list as written, yes — meat alone fills a drawer. With a small freezer, biweekly shopping is the sensible alternative.",
      },
      {
        question: "How do I track what's left mid-month?",
        answer:
          "By noting things the moment they run out, not on shopping day. That's exactly what a shared list on your phone is for: whoever opens the last can of tomatoes adds it right then.",
      },
    ],
    relatedTemplates: ["batch-cooking", "pantry", "weekly"],
    relatedGuides: ["how-to-make"],
  },
  {
    key: "budget",
    slug: "cheap-grocery-list",
    locale: "en",
    title: "Cheap grocery list for a full week",
    metaTitle: "Cheap Grocery List: Eat Well on a Tight Budget",
    metaDescription:
      "A full week of food for two under $60, without living on pasta. Includes the rule for what to cut and what never to touch.",
    excerpt:
      "Eating cheap isn't eating worse. It's knowing which foods deliver the most meals per dollar — these are them.",
    serves: "2 people · 7 days",
    budget: "$50-60 per week",
    updatedAt: "2026-08-10",
    sections: [
      {
        categoryId: "pantry",
        items: [
          { name: "Dried lentils", qty: 2, unit: "lb" },
          { name: "Dried black beans", qty: 2, unit: "lb" },
          { name: "Rice", qty: 5, unit: "lb" },
          { name: "Pasta", qty: 3, unit: "boxes" },
          { name: "Canned diced tomatoes", qty: 4 },
          { name: "Vegetable oil", qty: 1 },
          { name: "Canned tuna", qty: 4 },
          { name: "Peanut butter", qty: 1 },
        ],
      },
      {
        categoryId: "produce",
        items: [
          { name: "Russet potatoes", qty: 5, unit: "lb" },
          { name: "Yellow onions", qty: 3, unit: "lb" },
          { name: "Carrots", qty: 2, unit: "lb" },
          { name: "Cabbage", qty: 1, note: "Cheapest vegetable per pound, keeps two weeks" },
          { name: "Bananas", qty: 8 },
          { name: "Apples", qty: 6 },
        ],
      },
      {
        categoryId: "dairy",
        items: [
          { name: "Eggs", qty: 24 },
          { name: "Milk", qty: 1, unit: "gallon" },
          { name: "Plain yogurt", qty: 1, unit: "large tub" },
        ],
      },
      {
        categoryId: "meat",
        items: [
          {
            name: "Chicken thighs",
            qty: 3,
            unit: "lb",
            note: "Half the price of breast, better in stews",
          },
          { name: "Ground beef", qty: 1, unit: "lb" },
        ],
      },
      {
        categoryId: "frozen",
        items: [
          { name: "Frozen mixed vegetables", qty: 3, unit: "bags" },
          { name: "Frozen spinach", qty: 1, unit: "bag" },
        ],
      },
      {
        categoryId: "bakery",
        items: [{ name: "Sandwich bread", qty: 2, unit: "loaves", note: "Freeze one" }],
      },
    ],
    body: [
      {
        heading: "Cost per serving, not the price on the tag",
        paragraphs: [
          "What makes a cart expensive isn't expensive products — it's how few meals come out of it. Two pounds of dried lentils cost about what one tray of chicken breast does, and produce ten servings instead of four.",
          "This list is built on that arithmetic. Protein comes from beans, eggs, cheap cuts of chicken and canned fish. That combination delivers the most food per dollar without turning the week into pasta and sauce.",
        ],
      },
      {
        heading: "Where the money actually goes",
        paragraphs: [
          "Almost all the avoidable spending in an average cart sits in four places, and none of them is food you need.",
        ],
        bullets: [
          "Drinks: soda, juice and beer can be a third of the receipt while providing zero meals.",
          "Snacks and packaged sweets: expensive per pound and they don't fill anyone up. First to go.",
          "Prepared and frozen entrées: you're paying restaurant markup for the assembly.",
          "Premium meat cuts: thighs cost half what breast does and hold up better in a stew.",
        ],
      },
      {
        heading: "What not to cut",
        paragraphs: [
          "Cooking oil, fruit and eggs. Cutting there backfires: cheap oil shows up in everything you cook, fruit is the first thing anyone misses, and eggs are already among the cheapest protein per gram there is.",
          "Frozen vegetables either. They look like a luxury next to fresh on sale, but they don't spoil — and what you don't throw away you don't have to buy again.",
        ],
      },
      {
        heading: "How the week breaks down",
        paragraphs: [
          "This cart yields roughly twelve main meals: lentil soup twice, beans and rice twice, chicken and potato stew twice, pasta with beef and tomato, tuna sandwiches, and the rest eggs, fried rice and cabbage slaw.",
          "Cooking the beans and lentils in one batch on Sunday is what makes it survive a work week. Without that, one takeout order eats the savings of three grocery trips.",
        ],
      },
    ],
    faq: [
      {
        question: "Can two people really eat on $55 a week?",
        answer:
          "Yes, if protein comes mostly from beans and eggs and vegetables are seasonal or frozen. What doesn't fit that budget is daily red meat, prepared foods or drinks.",
      },
      {
        question: "Store brand for everything?",
        answer:
          "On staples — beans, rice, pasta, canned goods, milk, frozen vegetables — the quality gap rarely justifies the brand premium. Coffee and oil are where it's most noticeable and where paying a bit more can be worth it.",
      },
      {
        question: "Do sales help?",
        answer:
          "Only if you were buying that item anyway. Two-for-one on something that wasn't on your list isn't a saving, it's an unplanned purchase with a discount attached.",
      },
      {
        question: "What if I have no time to cook?",
        answer:
          "Cook once, eat twice: the beans and the stew each cover two days. Cheap eating on a tight schedule rests on batch cooking, not on cooking fast every night.",
      },
    ],
    relatedTemplates: ["student-flat", "weekly", "single"],
    relatedGuides: ["how-to-make"],
  },
  {
    key: "single",
    slug: "grocery-list-for-one",
    locale: "en",
    title: "Grocery list for one person",
    metaTitle: "Grocery List for One (Without Half of It Going Bad)",
    metaDescription:
      "Shopping for one isn't about smaller amounts — it's about package sizes. A weekly list built around that problem, so nothing rots in the drawer.",
    excerpt:
      "Cooking for one isn't half of cooking for two: package sizes don't shrink with you. This list is built around that.",
    serves: "1 person · 7 days",
    budget: "$50-65 per week",
    updatedAt: "2026-08-10",
    sections: [
      {
        categoryId: "produce",
        items: [
          { name: "Yellow onions", qty: 3, note: "Loose, not a five-pound bag" },
          { name: "Carrots", qty: 1, unit: "small bag" },
          { name: "Bell peppers", qty: 2 },
          { name: "Tomatoes", qty: 3 },
          { name: "Russet potatoes", qty: 3 },
          { name: "Apples", qty: 4 },
          { name: "Bananas", qty: 4 },
          { name: "Lemons", qty: 2 },
        ],
      },
      {
        categoryId: "frozen",
        items: [
          { name: "Frozen broccoli", qty: 2, unit: "bags", note: "Where bulk genuinely pays off" },
          { name: "Frozen fish fillets", qty: 1, unit: "bag" },
          { name: "Frozen peas", qty: 1, unit: "bag" },
          { name: "Frozen berries", qty: 1, unit: "bag" },
        ],
      },
      {
        categoryId: "dairy",
        items: [
          { name: "Eggs", qty: 12 },
          { name: "Milk", qty: 1, unit: "half gallon" },
          { name: "Greek yogurt", qty: 1, unit: "tub" },
          {
            name: "Hard cheese",
            qty: 1,
            unit: "wedge",
            note: "Keeps for weeks, unlike fresh cheese",
          },
        ],
      },
      {
        categoryId: "meat",
        items: [{ name: "Chicken thighs", qty: 1, unit: "lb", note: "Freeze half on arrival" }],
      },
      {
        categoryId: "pantry",
        items: [
          { name: "Rice", qty: 2, unit: "lb" },
          { name: "Pasta", qty: 2, unit: "boxes" },
          { name: "Canned black beans", qty: 3 },
          { name: "Canned diced tomatoes", qty: 2 },
          { name: "Canned tuna", qty: 4 },
          { name: "Olive oil", qty: 1 },
          { name: "Peanut butter", qty: 1 },
        ],
      },
      {
        categoryId: "bakery",
        items: [{ name: "Sandwich bread", qty: 1, unit: "loaf", note: "Straight to the freezer" }],
      },
    ],
    body: [
      {
        heading: "The problem isn't quantity, it's package size",
        paragraphs: [
          "Someone living alone doesn't spend half of what a couple spends — they spend considerably more than half. The reason is that minimum package sizes don't divide. A head of lettuce, a five-pound bag of onions, a can of tomatoes: same size for one as for four, and the remainder goes in the trash.",
          "So this list favors what you can buy loose, what keeps for weeks, and what freezes well. It isn't a list of small portions — it's a list of forgiving formats.",
        ],
      },
      {
        heading: "Freezing in portions is what makes it work",
        paragraphs: [
          "Cooking for one every night pays off in neither time nor money. What works is cooking four servings and freezing three, so most of the week is reheating.",
        ],
        bullets: [
          "Right after shopping: split the chicken and freeze half; the whole loaf of bread goes in the freezer.",
          "When you cook: make four portions of rice, beans or stew and freeze three in single-serving containers.",
          "Label with the date. Without it, the freezer becomes a museum of unidentifiable objects.",
        ],
      },
      {
        heading: "Where bulk does pay off",
        paragraphs: [
          "On anything that doesn't spoil: rice, pasta, oil, canned goods, paper products. There the unit price rules and there's no risk.",
          "And on frozen vegetables, which are the single best thing for someone living alone: take exactly what you're cooking, the rest stays in the drawer unharmed. It's the difference between eating vegetables daily and buying them with good intentions and tossing them Thursday.",
        ],
      },
      {
        heading: "Compared to ordering in",
        paragraphs: [
          "This cart runs about $55 and covers a full week. Two delivery orders cost the same and cover two dinners. The math isn't close: cooking for one is expensive next to cooking for four, but it's still far cheaper than the alternative.",
        ],
      },
    ],
    faq: [
      {
        question: "How much does one person spend on groceries per week?",
        answer:
          "Around $50-65 with this list. It doesn't drop much lower because minimum package sizes set a floor — the pantry costs nearly the same whether you cook for one or two.",
      },
      {
        question: "How do I stop throwing food away?",
        answer:
          "Buy fresh items loose, freeze in portions on the day you shop, and lean on frozen vegetables for weeknights. Waste when you live alone almost always comes from a package that was too big, not from buying too much.",
      },
      {
        question: "Is grocery delivery worth it for one?",
        answer:
          "Often yes, if you consolidate into one order to clear the delivery minimum — mainly because you don't buy on impulse. The trade-off is not picking your own produce.",
      },
      {
        question: "What if I eat out several nights?",
        answer:
          "Cut the chicken and fish, not the produce or pantry. That's the adjustment that wastes least, because fresh protein is what tolerates a change of plans worst.",
      },
    ],
    relatedTemplates: ["weekly", "budget", "pantry"],
    relatedGuides: ["how-to-make"],
  },
  {
    key: "vegetarian",
    slug: "vegetarian-grocery-list",
    locale: "en",
    title: "Vegetarian grocery list",
    metaTitle: "Weekly Vegetarian Grocery List (With the Protein Covered)",
    metaDescription:
      "A week of vegetarian groceries for two, with protein spread across the week and no expensive meat substitutes.",
    excerpt:
      "Dropping the meat is the easy part. What decides whether a vegetarian cart works is where the protein comes from.",
    serves: "2 people · 7 days",
    budget: "$70-90 per week",
    updatedAt: "2026-08-10",
    sections: [
      {
        categoryId: "pantry",
        items: [
          { name: "Dried lentils", qty: 2, unit: "lb" },
          { name: "Canned chickpeas", qty: 4 },
          { name: "Canned black beans", qty: 3 },
          { name: "Brown rice", qty: 2, unit: "lb" },
          { name: "Pasta", qty: 2, unit: "boxes" },
          { name: "Quinoa", qty: 1, unit: "bag" },
          { name: "Canned diced tomatoes", qty: 3 },
          { name: "Olive oil", qty: 1 },
          { name: "Walnuts", qty: 1, unit: "bag" },
          { name: "Almonds", qty: 1, unit: "bag" },
          { name: "Tahini", qty: 1, note: "Homemade hummus costs a fraction of the tub" },
        ],
      },
      {
        categoryId: "produce",
        items: [
          { name: "Baby spinach", qty: 2, unit: "bags" },
          { name: "Broccoli", qty: 2, unit: "heads" },
          { name: "Bell peppers", qty: 4 },
          { name: "Zucchini", qty: 3 },
          { name: "Eggplant", qty: 1 },
          { name: "Yellow onions", qty: 3, unit: "lb" },
          { name: "Garlic", qty: 1, unit: "head" },
          { name: "Tomatoes", qty: 5 },
          { name: "Avocados", qty: 3 },
          { name: "Mushrooms", qty: 1, unit: "lb" },
          { name: "Oranges", qty: 6 },
        ],
      },
      {
        categoryId: "dairy",
        items: [
          { name: "Eggs", qty: 18 },
          { name: "Greek yogurt", qty: 1, unit: "large tub" },
          { name: "Feta cheese", qty: 1 },
          { name: "Milk", qty: 1, unit: "half gallon" },
        ],
      },
      {
        categoryId: "frozen",
        items: [
          { name: "Firm tofu", qty: 2, unit: "blocks" },
          { name: "Frozen peas", qty: 1, unit: "bag" },
          { name: "Edamame", qty: 1, unit: "bag" },
        ],
      },
      {
        categoryId: "bakery",
        items: [{ name: "100% whole wheat bread", qty: 1, unit: "loaf" }],
      },
    ],
    body: [
      {
        heading: "Protein, spread out and without the fuss",
        paragraphs: [
          "The usual worry when dropping meat is where the protein comes from. Short answer: legumes, eggs, dairy, tofu and nuts — and this cart covers it comfortably without a single specialty product.",
          "You also don't need to pair legumes with grains in the same meal, the way people were told decades ago. Eating varied across the day handles it, which frees the list from rules that only complicate cooking.",
        ],
      },
      {
        heading: "What makes a vegetarian cart expensive",
        paragraphs: [
          "Not the vegetables — the substitutes. Veggie burgers, plant-based deli slices and branded plant milks can double the receipt, and most are ultra-processed with a healthy-looking label.",
        ],
        bullets: [
          "Dried beans instead of canned when you have soaking time: a fraction of the price per pound.",
          "Homemade hummus from chickpeas, tahini and lemon instead of tubs: less than half the cost.",
          "Plain tofu instead of pre-marinated, which charges triple for the sauce.",
          "Nuts from the bulk bin, where the per-pound gap is widest.",
        ],
      },
      {
        heading: "What's actually worth watching",
        paragraphs: [
          "Two things, and neither is protein. Plant-based iron absorbs less readily, and pairing legumes and spinach with some vitamin C helps — a squeeze of lemon or an orange afterward is enough. That's why the lemons and oranges on this list aren't decorative.",
          "Vitamin B12 is the other one. In an ovo-lacto vegetarian diet, eggs and dairy usually cover it, but if you're leaning vegan it's worth supplementing. That stops being a grocery question and becomes one for your doctor.",
        ],
      },
      {
        heading: "How the week breaks down",
        paragraphs: [
          "About twelve meals: lentil soup twice, chickpea curry and chickpea salad, tofu stir fry, mushroom pasta, frittatas and scrambles, quinoa bowls with roasted vegetables, and black beans with rice.",
          "The Sunday tray of roasted vegetables — peppers, eggplant, zucchini, onion — earns its keep hardest: it's a side, a filling, a bowl topping and a sandwich.",
        ],
      },
    ],
    faq: [
      {
        question: "Is a vegetarian grocery list more expensive?",
        answer:
          "The opposite, when it's built on legumes, eggs and seasonal produce — legumes are among the cheapest protein per gram there is. It gets expensive when processed substitutes and branded plant milks come in.",
      },
      {
        question: "Do I get enough protein without meat or fish?",
        answer:
          "With this cart, comfortably: legumes nearly daily, eighteen eggs, dairy, tofu and nuts. There's nothing to calculate and no need to combine foods within a single meal.",
      },
      {
        question: "Does this work for a vegan diet?",
        answer:
          "Drop the eggs, yogurt, feta and milk, and raise legumes, tofu and nuts. In that case vitamin B12 needs supplementing, which is worth discussing with a professional.",
      },
      {
        question: "What if the rest of the household eats meat?",
        answer:
          "Sharing one list and letting everyone add their own works better than keeping two: the produce, legume and pantry base is shared, and only the main protein differs.",
      },
    ],
    relatedTemplates: ["healthy", "weekly", "budget"],
    relatedGuides: ["how-to-make"],
  },
  {
    key: "batch-cooking",
    slug: "meal-prep-grocery-list",
    locale: "en",
    title: "Meal prep grocery list",
    metaTitle: "Meal Prep Grocery List: Cook Once, Eat All Week",
    metaDescription:
      "A grocery list built for meal prep: ingredients that reheat well, quantities by batch, and what to cook on Sunday so Thursday still tastes good.",
    excerpt:
      "The list for cooking once and eating from it five days. Not your regular weekly list — here, what reheats well wins.",
    serves: "2-3 people · 5 prepped meals",
    budget: "$55-70 per week",
    updatedAt: "2026-08-11",
    sections: [
      {
        categoryId: "produce",
        items: [
          {
            name: "Yellow onions",
            qty: 3,
            unit: "lb",
            note: "The base of nearly everything you'll cook",
          },
          { name: "Carrots", qty: 2, unit: "lb" },
          { name: "Bell peppers", qty: 4 },
          { name: "Butternut squash", qty: 1, note: "Roasted, it holds up for five days" },
          { name: "Sweet potatoes", qty: 4 },
          { name: "Broccoli", qty: 2, unit: "heads", note: "Blanch it, don't cook it through" },
          { name: "Garlic", qty: 1, unit: "head" },
          { name: "Lemons", qty: 3 },
        ],
      },
      {
        categoryId: "meat",
        items: [
          {
            name: "Boneless chicken thighs",
            qty: 2,
            unit: "lb",
            note: "Reheats far better than breast",
          },
          { name: "Ground beef", qty: 1.5, unit: "lb" },
        ],
      },
      {
        categoryId: "pantry",
        items: [
          { name: "Brown rice", qty: 2, unit: "lb" },
          { name: "Dried lentils", qty: 1, unit: "lb" },
          { name: "Canned chickpeas", qty: 3, unit: "cans" },
          { name: "Crushed tomatoes", qty: 3, unit: "cans" },
          { name: "Chicken stock", qty: 2, unit: "cartons" },
          { name: "Olive oil", qty: 1 },
          {
            name: "Smoked paprika, cumin, curry powder",
            qty: 1,
            note: "What turns one base into five meals",
          },
        ],
      },
      {
        categoryId: "dairy",
        items: [
          { name: "Eggs", qty: 12 },
          {
            name: "Greek yogurt",
            qty: 1,
            unit: "tub",
            note: "For quick sauces with lemon and garlic",
          },
          { name: "Feta cheese", qty: 1 },
        ],
      },
      {
        categoryId: "frozen",
        items: [
          { name: "Peas", qty: 1, unit: "bag" },
          { name: "Spinach", qty: 2, unit: "bags" },
        ],
      },
      {
        categoryId: "other",
        items: [
          {
            name: "Glass meal prep containers",
            qty: 6,
            note: "First time only, but this doesn't work without them",
          },
        ],
      },
    ],
    body: [
      {
        heading: "Why this isn't your regular weekly list",
        paragraphs: [
          "Meal prep doesn't change how much you eat, it changes when you cook. That changes what's worth buying: what's great straight off the stove is rarely what's still good on day four.",
          "That's why this list has chicken thighs instead of breast, brown rice instead of white, and squash instead of salad greens. Breast dries out on reheat, white rice turns to paste, and leafy greens don't survive a container. Every choice here is made for Thursday, not Sunday.",
        ],
      },
      {
        heading: "How this becomes five meals",
        paragraphs: [
          "The trick is cooking three bases and combining them, not five separate dishes. From this list: a big onion-carrot-tomato base, a tray of lemon roast chicken, and a pot of lentils.",
        ],
        bullets: [
          "Base + ground beef = bolognese, and the filling for a quick bake.",
          "Base + chickpeas + spinach = stew hot, grain bowl cold with feta.",
          "Chicken + brown rice + blanched broccoli = the classic bowl, done well.",
          "Roasted squash + stock = soup, which freezes better than anything else here.",
          "Eggs: Friday's safety net, when the containers are empty.",
        ],
      },
      {
        heading: "What to double and what to leave alone",
        paragraphs: [
          "Double the base, the lentils and the soup without hesitation. They keep, they freeze, and they lose nothing — this is where meal prep actually pays.",
          "Don't double fish, salad or anything fried. And if you only cook once a month, this isn't your list: the monthly one is built around pantry and freezer instead.",
        ],
      },
    ],
    faq: [
      {
        question: "How long does meal prep food last in the fridge?",
        answer:
          "Three to four days in the coldest part, packed once cooled and sealed. Anything you plan to eat on day five should go in the freezer the day you cook it, not after three days in the fridge.",
      },
      {
        question: "How long does this take to cook?",
        answer:
          "Two and a half to three hours, with the oven working while you're at the stove. Most of that is cooking time, not hands-on time.",
      },
      {
        question: "Does this work for one person?",
        answer:
          "It's where meal prep pays off most, since cooking daily for one wastes the most time. Halve the meat and freeze half of each base in single portions.",
      },
      {
        question: "Do I need glass containers?",
        answer:
          "Plastic works, but it holds onto smells and doesn't go in the oven. It's the one item on this list you'll never buy twice.",
      },
    ],
    relatedTemplates: ["weekly", "healthy", "monthly"],
    relatedGuides: ["how-to-make", "save-money"],
  },
  {
    key: "student-flat",
    slug: "college-apartment-grocery-list",
    locale: "en",
    title: "College apartment grocery list",
    metaTitle: "College Apartment Grocery List: Move-In Day and Every Week After",
    metaDescription:
      "What to buy for your first college apartment: the move-in stock-up of pantry and cleaning basics, plus the cheap weekly list that follows.",
    excerpt:
      "Two lists in one: what an empty apartment needs on day one, and what roommates actually restock every week.",
    serves: "3-4 roommates · move-in + one week",
    budget: "$90-120 to stock up, $45-60 per week",
    updatedAt: "2026-08-11",
    sections: [
      {
        categoryId: "pantry",
        items: [
          { name: "Cooking oil", qty: 1 },
          { name: "Salt and pepper", qty: 1 },
          { name: "Pasta", qty: 4, unit: "boxes" },
          { name: "Rice", qty: 2, unit: "lb" },
          { name: "Pasta sauce", qty: 3, unit: "jars" },
          { name: "Canned tuna", qty: 6 },
          { name: "Canned black beans", qty: 4 },
          { name: "Peanut butter", qty: 1 },
          { name: "Flour and sugar", qty: 1 },
        ],
      },
      {
        categoryId: "produce",
        items: [
          { name: "Onions", qty: 3, unit: "lb" },
          { name: "Potatoes", qty: 5, unit: "lb" },
          { name: "Garlic", qty: 1, unit: "head" },
          { name: "Tomatoes", qty: 4 },
          { name: "Bananas", qty: 6, note: "Cheapest thing you'll eat without cooking" },
        ],
      },
      {
        categoryId: "dairy",
        items: [
          { name: "Milk", qty: 1, unit: "gallon" },
          { name: "Eggs", qty: 18, note: "Everyone's emergency dinner" },
          { name: "Shredded cheese", qty: 1 },
        ],
      },
      {
        categoryId: "meat",
        items: [
          { name: "Whole chicken", qty: 1, note: "Cheaper per pound than a tray of breasts" },
          { name: "Ground beef or turkey", qty: 1, unit: "lb" },
        ],
      },
      {
        categoryId: "frozen",
        items: [
          { name: "Mixed vegetables", qty: 2, unit: "bags" },
          { name: "Frozen pizza", qty: 2, note: "Be honest about this one" },
        ],
      },
      {
        categoryId: "bakery",
        items: [
          { name: "Sandwich bread", qty: 2, unit: "loaves", note: "One straight into the freezer" },
        ],
      },
      {
        categoryId: "cleaning",
        items: [
          { name: "Laundry detergent", qty: 1 },
          { name: "Dish soap", qty: 1 },
          { name: "Sponges", qty: 1, unit: "pack" },
          { name: "Toilet paper", qty: 12, unit: "rolls" },
          { name: "Trash bags", qty: 1, unit: "box" },
          { name: "Paper towels", qty: 1, unit: "pack" },
        ],
      },
      {
        categoryId: "personal",
        items: [
          { name: "Hand soap", qty: 1 },
          { name: "Foil and plastic wrap", qty: 1 },
        ],
      },
    ],
    body: [
      {
        heading: "Move-in day isn't a normal grocery run",
        paragraphs: [
          "Walk into an empty apartment and half of what you spend isn't food: it's oil, salt, toilet paper and detergent. Things you buy once and use for months, which is why the first receipt looks alarming next to every one after it.",
          "This template mixes both on purpose. Week two, drop the cleaning supplies and the dry pantry and the bill roughly halves.",
        ],
      },
      {
        heading: "The hard part isn't what to buy",
        paragraphs: [
          "It's who buys, who pays, and whose food is whose. Sharing works well for basics — oil, salt, paper goods, cleaning supplies — and badly for everything else, because nobody eats the same thing at the same time.",
        ],
        bullets: [
          "Share the pantry and cleaning supplies: everyone uses them without noticing.",
          "Keep fresh food separate, and nobody has to police the fridge.",
          'A shared list on everyone\'s phone kills the classic "I thought you were buying it": whoever finishes something adds it right then.',
          "One jar of each thing. Three open jars of paprika is money and shelf space gone.",
        ],
      },
      {
        heading: "Where the money actually goes",
        paragraphs: [
          "Takeout and delivery on the nights nobody feels like cooking. No list fixes that entirely, but having pasta, eggs and sauce in the apartment removes the most common excuse.",
          "A whole chicken and frozen vegetables are the two lines that cut cost per meal the most without requiring anyone to cook better or have more time.",
        ],
      },
    ],
    faq: [
      {
        question: "How much is the first grocery run for an apartment?",
        answer:
          "Around $90-120 for three or four people including cleaning supplies and pantry staples. From week two it drops to $45-60, because the months-long stuff is already bought.",
      },
      {
        question: "Should roommates shop together or separately?",
        answer:
          "Together for basics and cleaning supplies — cheaper and used equally. Separately for fresh food, since schedules and diets don't line up, and that's where friction starts.",
      },
      {
        question: "How do we split what everyone spends?",
        answer:
          "Put prices on the shared list itself and snap the receipt. You can add a price per item here and see the running total, which is the number you need to split without arguing.",
      },
      {
        question: "What's safe to buy store brand?",
        answer:
          "Canned beans, pasta sauce, pasta, rice, milk and cleaning supplies. That's where most of the savings are and where the difference is hardest to taste.",
      },
    ],
    relatedTemplates: ["budget", "single", "pantry"],
    relatedGuides: ["save-money", "share-with-family"],
  },
  {
    key: "gluten-free",
    slug: "gluten-free-grocery-list",
    locale: "en",
    title: "Gluten-free grocery list",
    metaTitle: "Gluten-Free Grocery List for Celiacs (Full Week)",
    metaDescription:
      "A full week of gluten-free groceries: what's naturally safe, where gluten hides on the label, and what has to be certified rather than just read.",
    excerpt:
      "A full gluten-free week, separating what's naturally safe from the short list that has to be certified.",
    serves: "2 people · 7 days",
    budget: "$95-120 per week",
    updatedAt: "2026-08-11",
    sections: [
      {
        categoryId: "produce",
        items: [
          { name: "Potatoes", qty: 5, unit: "lb" },
          { name: "Tomatoes", qty: 4 },
          { name: "Onions", qty: 3 },
          { name: "Zucchini", qty: 2 },
          { name: "Baby spinach", qty: 1, unit: "bag" },
          { name: "Apples", qty: 6 },
          { name: "Bananas", qty: 6 },
          { name: "Avocados", qty: 2 },
        ],
      },
      {
        categoryId: "meat",
        items: [
          { name: "Chicken breast", qty: 1.5, unit: "lb" },
          {
            name: "Ground beef",
            qty: 1,
            unit: "lb",
            note: "Plain: pre-formed patties often contain breadcrumbs",
          },
          { name: "Pork loin", qty: 1, unit: "lb" },
        ],
      },
      {
        categoryId: "fish",
        items: [
          { name: "Salmon fillets", qty: 2 },
          { name: "Frozen shrimp", qty: 1, unit: "lb" },
        ],
      },
      {
        categoryId: "dairy",
        items: [
          { name: "Milk", qty: 1, unit: "half gallon" },
          { name: "Eggs", qty: 12 },
          {
            name: "Plain yogurt",
            qty: 1,
            unit: "tub",
            note: "Plain, not flavored: fewer thickeners to check",
          },
          { name: "Block cheese", qty: 1, note: "A block rather than pre-shredded" },
        ],
      },
      {
        categoryId: "bakery",
        items: [
          {
            name: "Certified gluten-free bread",
            qty: 2,
            unit: "loaves",
            note: "Freeze one: it stales in a day",
          },
          { name: "Corn tortillas", qty: 1, unit: "pack" },
        ],
      },
      {
        categoryId: "pantry",
        items: [
          { name: "Rice", qty: 2, unit: "lb" },
          { name: "Certified gluten-free pasta", qty: 2, unit: "boxes" },
          { name: "Canned beans", qty: 3 },
          { name: "Crushed tomatoes", qty: 2, unit: "cans" },
          { name: "Rice or almond flour", qty: 1 },
          { name: "Olive oil", qty: 1 },
          { name: "Certified gluten-free stock", qty: 2, unit: "cartons" },
          { name: "Tamari", qty: 1, note: "Soy sauce is wheat-based; tamari usually isn't" },
        ],
      },
      {
        categoryId: "breakfast",
        items: [
          {
            name: "Certified gluten-free oats",
            qty: 1,
            note: "Regular oats are cross-contaminated at the mill",
          },
          { name: "Coffee", qty: 1 },
        ],
      },
    ],
    body: [
      {
        heading: "Most of this is naturally safe",
        paragraphs: [
          "The bulk of any grocery list is already gluten-free: fresh produce, meat and fish, eggs, beans, rice, oil and milk. Starting there is what keeps this list from feeling overwhelming — or costing twice as much.",
          "The premium isn't on food, it's on substitutes. Gluten-free bread and pasta run two to four times the price of the regular versions. The more the week leans on rice, potatoes and beans, the less that shows up at the register.",
        ],
      },
      {
        heading: "Where gluten hides when you don't expect it",
        paragraphs: [
          "Bread is obvious. The problems come from products nobody associates with wheat and that slip into any normal cart.",
        ],
        bullets: [
          "Soy sauce: wheat-based unless it's labeled tamari.",
          "Stocks, bouillon cubes and packet soups.",
          "Deli meats and sausages, which often use wheat starch as a binder.",
          "Pre-formed burger patties and meatballs.",
          "Oats: naturally fine, milled alongside wheat. Only certified oats are safe.",
          "Pre-shredded cheese and flavored yogurts, because of anti-caking agents and thickeners.",
        ],
      },
      {
        heading: "Certified or just labeled: when each is enough",
        paragraphs: [
          "For single-ingredient food — rice, potatoes, chicken — reading the label is enough. For anything processed, certification covers cross-contamination in the facility, which an ingredient list simply can't tell you.",
          "In a shared kitchen, cross-contact matters as much as the shopping: a separate toaster, a separate cutting board and clean utensils in shared jars prevent most accidents.",
        ],
      },
    ],
    faq: [
      {
        question: "How much more expensive is gluten-free shopping?",
        answer:
          "Roughly 20-40% more when bread and pasta are swapped for certified versions. Lean the week on rice, potatoes and beans and the gap narrows a lot.",
      },
      {
        question: "Are oats gluten-free?",
        answer:
          "Oats contain no gluten themselves, but they're grown and milled alongside wheat, so only certified oats are safe for celiacs. It's one of the most common oversights.",
      },
      {
        question: "Does this list work for gluten sensitivity rather than celiac disease?",
        answer:
          'Yes, with more room. Without celiac disease, cross-contamination matters less, so "may contain traces" products are usually fine and the list gets noticeably cheaper.',
      },
      {
        question: "How do I tell someone shopping for me what's safe?",
        answer:
          'Share the list and use each item\'s note to write "certified" where it matters. Whoever opens it sees the note next to the product, without texting you from the aisle.',
      },
    ],
    relatedTemplates: ["healthy", "weekly", "pantry"],
    relatedGuides: ["how-to-make", "share-with-family"],
  },
  {
    key: "holiday-rental",
    slug: "vacation-rental-grocery-list",
    locale: "en",
    title: "Vacation rental grocery list",
    metaTitle: "Vacation Rental Grocery List: The First-Day Shop",
    metaDescription:
      "What to buy when you arrive at a vacation rental: a first-day grocery list for an empty kitchen, without hauling half your pantry or overbuying.",
    excerpt:
      "The first-day shop for a kitchen that isn't yours: enough for a week, without buying a jar of spice you'll leave behind.",
    serves: "4 people · 7 days",
    budget: "$140-180 for the arrival shop",
    updatedAt: "2026-08-11",
    sections: [
      {
        categoryId: "pantry",
        items: [
          { name: "Olive oil", qty: 1, note: "Small bottle: the big one stays behind" },
          { name: "Salt and pepper", qty: 1 },
          { name: "Pasta", qty: 2, unit: "boxes" },
          { name: "Pasta sauce", qty: 2, unit: "jars" },
          { name: "Rice", qty: 1, unit: "lb" },
          { name: "Canned tuna", qty: 4 },
          { name: "Chips and salsa", qty: 1 },
        ],
      },
      {
        categoryId: "produce",
        items: [
          { name: "Tomatoes", qty: 4 },
          { name: "Lettuce or salad mix", qty: 1, unit: "bag" },
          { name: "Onions", qty: 3 },
          { name: "Lemons", qty: 3 },
          {
            name: "Seasonal fruit",
            qty: 4,
            unit: "lb",
            note: "Whatever looks good and needs no cooking",
          },
          { name: "Potatoes", qty: 3, unit: "lb" },
        ],
      },
      {
        categoryId: "dairy",
        items: [
          { name: "Milk", qty: 1, unit: "gallon" },
          { name: "Eggs", qty: 12 },
          { name: "Sliced cheese", qty: 1 },
          { name: "Butter", qty: 1 },
          { name: "Yogurt", qty: 8 },
        ],
      },
      {
        categoryId: "deli",
        items: [
          { name: "Sliced turkey or ham", qty: 1, unit: "lb" },
          { name: "Bacon", qty: 1 },
        ],
      },
      {
        categoryId: "meat",
        items: [
          { name: "Chicken for the grill", qty: 2, unit: "lb" },
          {
            name: "Burgers or hot dogs",
            qty: 8,
            note: "The easy dinner for the night you get back late from the beach",
          },
        ],
      },
      {
        categoryId: "bakery",
        items: [
          { name: "Bread", qty: 1, unit: "loaf" },
          { name: "Burger buns", qty: 8 },
          { name: "Cookies or muffins", qty: 1 },
        ],
      },
      {
        categoryId: "drinks",
        items: [
          { name: "Bottled water", qty: 24 },
          { name: "Soda", qty: 12 },
          { name: "Beer or wine", qty: 1 },
          { name: "Coffee", qty: 1, note: "Ground, unless you know exactly what machine is there" },
        ],
      },
      {
        categoryId: "cleaning",
        items: [
          { name: "Toilet paper", qty: 4, unit: "rolls" },
          { name: "Trash bags", qty: 1, unit: "box" },
          { name: "Dish soap", qty: 1 },
          { name: "Paper towels", qty: 1 },
        ],
      },
      {
        categoryId: "personal",
        items: [
          { name: "Sunscreen", qty: 1 },
          { name: "Aloe gel", qty: 1 },
        ],
      },
    ],
    body: [
      {
        heading: "The borrowed-kitchen rule",
        paragraphs: [
          "In a rental you never know what's there until you open the cabinets: sometimes oil and salt, sometimes not a single decent pan. The temptation is to shop like you're at home, which is exactly how people end up leaving half a pantry behind.",
          "The rule that works: small sizes of anything you won't finish, and no spices past salt and pepper. Vacation cooking is simpler than home cooking, and the list should say so.",
        ],
      },
      {
        heading: "What to bring and what to buy there",
        paragraphs: [
          "Packing from home only pays for what's small and expensive: good coffee, a decent olive oil, a couple of spices in a bag.",
        ],
        bullets: [
          "Before leaving: water for the drive, snacks, and day-one breakfast.",
          "On arrival, same day: breakfast, one easy dinner, toilet paper. Nothing else.",
          "Next morning, kitchen inspected: the rest of the list, adjusted to what's actually there.",
          "Last real shop on the second-to-last day. Anything left over gets thrown out.",
        ],
      },
      {
        heading: "The three things everyone forgets",
        paragraphs: [
          "Trash bags, paper towels and dish soap. They're never on a mental list because at home they restock themselves, and in a rental you miss them the first night.",
          "Fourth, if there are kids: a breakfast they already like. An unfamiliar kitchen at 8am is a bad start to a beach day.",
        ],
      },
    ],
    faq: [
      {
        question: "How much is the arrival shop for a vacation rental?",
        answer:
          "Around $140-180 for four people and a week, including drinks and cleaning supplies. It runs higher than expected because it includes basics you already own at home.",
      },
      {
        question: "What should I bring from home?",
        answer:
          "Small and expensive things: coffee, spices, a good oil in a small bottle. Buy the bulky items and anything fresh there — it won't survive the drive anyway.",
      },
      {
        question: "Should I do one big shop on arrival?",
        answer:
          "No. Buy breakfast and one dinner, look at the kitchen properly, then do the rest the next morning. Shopping before you know whether there's an oven is how you end up with extras.",
      },
      {
        question: "How do we coordinate with everyone coming?",
        answer:
          "Share the list before you leave. Everyone adds what they want from their own phone, and whoever hits the store first has the whole thing — no calls from the aisle.",
      },
    ],
    relatedTemplates: ["weekly", "family-of-4", "pantry"],
    relatedGuides: ["share-with-family", "save-money"],
  },
];
