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
    relatedTemplates: ["family-of-4", "pantry", "healthy"],
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
    relatedTemplates: ["weekly", "pantry", "healthy"],
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
    relatedTemplates: ["weekly", "family-of-4", "healthy"],
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
    relatedTemplates: ["weekly", "family-of-4", "pantry"],
    relatedGuides: ["how-to-make"],
  },
];
