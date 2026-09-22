(function () {
  const source = (label, url) => ({ label, url });
  const certification = (name, certifier, scope, note) => ({
    name,
    certifier,
    scope,
    note,
  });
  const additive = (name, note) => ({ name, note });

  window.DEFAULT_GROCERY_DATA = {
    generatedAt: "2026-08-13",
    version: 2,
    meta: {
      title: "Quality-First Grocery Catalog",
      primaryStore: "Aldi",
      secondaryStore: "Walmart",
      notes: [
        "Sample catalog based on official product listings where available.",
        "Credible certifications are stored separately from label claims so marketing language does not get treated as third-party verification.",
        "Prices are editable and should be treated as seed values, not live store data.",
      ],
    },
    products: [
      {
        id: "simply-nature-organic-chicken-breast",
        name: "Simply Nature Organic Chicken Breast",
        brand: "Simply Nature",
        store: "Aldi",
        category: "Protein",
        currentPrice: 6.49,
        typicalPrice: "$6.49 per lb; about $8.11 per 1.25 lb package",
        size: "per lb",
        priceLastChecked: "2026-08-13",
        foodTier: "S",
        verificationGrade: "A",
        favorite: false,
        quantityStep: 0.25,
        defaultQuantity: 1.25,
        summary:
          "Primary workhorse protein for the cart. Organic production gets real credit here; the product is still evaluated separately from nutrition quality.",
        productionNotes:
          "USDA Organic claim applies to organic handling and production standards. This entry is priced per pound so budget plans use partial quantities.",
        notes:
          "Used as the anchor protein in the $50, $80, and $100 plans. If store price rises sharply, this is the first item to re-check rather than automatically downgrading to the cheapest chicken.",
        nutrition: {
          serving: "4 oz raw",
          calories: 120,
          proteinG: 26,
          carbsG: 0,
          fatG: 1.5,
          fiberG: 0,
          sugarG: 0,
          sodiumMg: 75,
          sourceNote:
            "Nutrition is a standard lean chicken breast profile; the current ALDI page confirms the exact organic product and live pricing but does not expose a full accessible label panel.",
        },
        ingredients: ["Organic boneless skinless chicken breast."],
        additives: [],
        certifications: [
          certification(
            "USDA Organic",
            "USDA-accredited organic certifier",
            "Organic production and handling",
            "Meaningful government-regulated certification for production methods."
          ),
        ],
        marketingClaims: ["Organic", "Fresh chicken breast"],
        evidenceNotes: [
          "The current exact ALDI listing separates a $6.49 per-pound price from an estimated $8.11 total for an approximately 1.25-pound package.",
          "Organic certification is treated as production verification, not automatic proof of better nutrition.",
        ],
        sourceLinks: [
          source(
            "ALDI meat and seafood listing",
            "https://www.aldi.us/store/aldi/pages/meat-seafood"
          ),
          source(
            "ALDI product page",
            "https://www.aldi.us/store/aldi/products/21339918-simply-nature-fresh-organic-thin-sliced-chicken-fillets-per-lb"
          ),
        ],
      },
      {
        id: "goldhen-pasture-raised-eggs",
        name: "GoldHen Pasture Raised Large Brown Eggs",
        brand: "GoldHen",
        store: "Aldi",
        category: "Protein",
        currentPrice: 3.95,
        typicalPrice: "$3.55-$3.95 per dozen",
        size: "12 ct",
        priceLastChecked: "2026-08-13",
        foodTier: "S",
        verificationGrade: "A",
        favorite: false,
        quantityStep: 1,
        defaultQuantity: 1,
        summary:
          "Pasture-raised plus Certified Humane provides independently verifiable animal-welfare evidence.",
        productionNotes:
          "Animal welfare verification matters here. Certified Humane is being used specifically for husbandry standards, not as a nutrition shortcut.",
        notes:
          "The sample budget carts include two dozen eggs as a verified animal-welfare option.",
        nutrition: {
          serving: "1 egg",
          calories: 70,
          proteinG: 6,
          carbsG: 0,
          fatG: 5,
          fiberG: 0,
          sugarG: 0,
          sodiumMg: 70,
          sourceNote:
            "Standard large egg nutrition. ALDI and Certified Humane sources were used for price and verification status.",
        },
        ingredients: ["Pasture-raised eggs."],
        additives: [],
        certifications: [
          certification(
            "Certified Humane",
            "Humane Farm Animal Care",
            "Animal welfare and husbandry",
            "Independent welfare certification. Used for production-quality grading, not nutrition grading."
          ),
        ],
        marketingClaims: ["Pasture raised", "Large brown eggs"],
        evidenceNotes: [
          "Certified Humane directory includes GOLDHEN pasture-raised eggs.",
          "ALDI product listing shows this pasture-raised dozen as part of the current egg assortment.",
        ],
        sourceLinks: [
          source(
            "Certified Humane directory",
            "https://certifiedhumane.org/whos-certified/"
          ),
          source(
            "ALDI product page",
            "https://www.aldi.us/store/aldi/products/25319931-golden-star-grade-a-pasture-raised-large-brown-eggs-12-ct"
          ),
          source(
            "ALDI dairy and eggs listing",
            "https://www.aldi.us/store/aldi/pages/dairy-and-eggs?page=2"
          ),
        ],
      },
      {
        id: "millville-old-fashioned-oats",
        name: "Millville Old Fashioned Rolled Oats",
        brand: "Millville",
        store: "Aldi",
        category: "Breakfast",
        currentPrice: 4.39,
        typicalPrice: "$4.39 per container",
        size: "42 oz",
        priceLastChecked: "2026-08-13",
        foodTier: "A",
        verificationGrade: "B",
        favorite: false,
        quantityStep: 1,
        defaultQuantity: 1,
        summary:
          "Cheap, durable pantry staple with a simple single-ingredient panel. Strong value without pretending it has a special certification.",
        productionNotes:
          "No special sourcing certification captured here. This earns its place from simplicity, satiety, shelf life, and price.",
        notes:
          "A recurring base item in every budget. Easy to combine with yogurt, blueberries, chia, peanut butter, or pumpkin.",
        nutrition: {
          serving: "1/2 cup dry",
          calories: 150,
          proteinG: 5,
          carbsG: 27,
          fatG: 3,
          fiberG: 4,
          sugarG: 1,
          sodiumMg: 0,
          sourceNote:
            "Standard rolled oat label profile; ALDI accessible page confirms the single-ingredient panel and price.",
        },
        ingredients: ["Whole grain rolled oats."],
        additives: [],
        certifications: [],
        marketingClaims: ["Whole grain", "Heart healthy"],
        evidenceNotes: [
          "ALDI listing shows 42 oz at $4.39.",
          "Accessible ALDI page exposes the ingredient panel as whole grain rolled oats.",
        ],
        sourceLinks: [
          source(
            "ALDI product page",
            "https://www.aldi.us/en/products/breakfast-cereals/oatmeal/detail/ps/p/millville-old-fashioned-oats/"
          ),
        ],
      },
      {
        id: "simply-nature-graintastic-bread",
        name: "Simply Nature Graintastic Organic Thin-Sliced Bread",
        brand: "Simply Nature",
        store: "Aldi",
        category: "Bread",
        currentPrice: 3.49,
        typicalPrice: "$3.49-$3.85 per loaf",
        size: "20.4 oz",
        priceLastChecked: "2026-08-13",
        foodTier: "A",
        verificationGrade: "A",
        favorite: false,
        quantityStep: 1,
        defaultQuantity: 1,
        summary:
          "The seeded PB&J bread choice. Organic thin-sliced whole-grain bread that keeps the sandwich slot without dropping to cheap white bread.",
        productionNotes:
          "Credible certification is the organic claim. Ingredient list should still be checked against the current package if a precise additive audit is needed.",
        notes:
          "Pairs with peanut butter and blueberry spread for sandwiches.",
        nutrition: {
          serving: "2 slices",
          calories: 120,
          proteinG: 6,
          carbsG: 22,
          fatG: 2,
          fiberG: 5,
          sugarG: 3,
          sodiumMg: 230,
          sourceNote:
            "Nutrition is a representative thin-sliced organic multigrain bread profile; current ALDI listing confirms price and claims but not the full accessible ingredient panel.",
        },
        ingredients: [
          "Full ingredient panel not exposed in the accessible ALDI scrape.",
          "Check current package in store if you want a line-by-line additive review.",
        ],
        additives: [
          additive(
            "Package check needed",
            "No additive callout is being asserted until the current bread label is reviewed directly."
          ),
        ],
        certifications: [
          certification(
            "USDA Organic",
            "USDA-accredited organic certifier",
            "Organic agricultural ingredients and handling",
            "Credible government-regulated certification."
          ),
        ],
        marketingClaims: ["Whole grain", "Multigrain", "Heart healthy"],
        evidenceNotes: [
          "ALDI lists the loaf at $3.49 with an original price of $3.85.",
          "Selected as an organic multigrain sandwich bread for the sample budget carts.",
        ],
        sourceLinks: [
          source(
            "ALDI product page",
            "https://www.aldi.us/store/aldi/products/24735034-simply-nature-organic-thin-sliced-graintastic-bread-20-4-oz"
          ),
        ],
      },
      {
        id: "friendly-farms-plain-greek-yogurt",
        name: "Friendly Farms Nonfat Plain Greek Yogurt",
        brand: "Friendly Farms",
        store: "Aldi",
        category: "Dairy",
        currentPrice: 2.79,
        typicalPrice: "$2.79-$3.19 per tub",
        size: "32 oz",
        priceLastChecked: "2026-08-13",
        foodTier: "A",
        verificationGrade: "B",
        favorite: false,
        quantityStep: 1,
        defaultQuantity: 1,
        summary:
          "A simple high-protein dairy option with a clean ingredient panel. Strong value and easy to pair with oats, fruit, chia, or PB&J sides.",
        productionNotes:
          "No special third-party sourcing certification captured. Verification grade stays separate from its nutrition usefulness.",
        notes:
          "The plain version is intentionally seeded instead of flavored yogurt so sugar does not creep into the budget by default.",
        nutrition: {
          serving: "3/4 cup",
          calories: 90,
          proteinG: 17,
          carbsG: 6,
          fatG: 0,
          fiberG: 0,
          sugarG: 5,
          sodiumMg: 65,
          sourceNote:
            "Representative nonfat plain Greek yogurt profile; ingredient panel comes from the accessible ALDI listing.",
        },
        ingredients: [
          "Cultured pasteurized nonfat milk.",
          "Live cultures: Lactobacillus bulgaricus, Streptococcus thermophilus, Lactobacillus acidophilus, Bifidus, Lactobacillus casei.",
        ],
        additives: [],
        certifications: [],
        marketingClaims: ["Plain", "Nonfat", "Live active cultures"],
        evidenceNotes: [
          "Accessible ALDI listing exposes the ingredient panel directly.",
          "Current ALDI listing shows a $2.79 price for the 32 oz tub.",
        ],
        sourceLinks: [
          source(
            "ALDI product page",
            "https://www.aldi.us/store/aldi/products/20249671-friendly-farms-nonfat-plain-greek-yogurt-32-oz"
          ),
        ],
      },
      {
        id: "beaumont-regular-instant-coffee",
        name: "Beaumont Regular Instant Coffee",
        brand: "Beaumont",
        store: "Aldi",
        category: "Beverage",
        currentPrice: 6.15,
        typicalPrice: "$5.95-$6.15 per jar",
        size: "8 oz",
        priceLastChecked: "2026-08-13",
        foodTier: "A",
        verificationGrade: "B",
        favorite: false,
        quantityStep: 1,
        defaultQuantity: 1,
        summary:
          "Low-cost coffee slot for shoppers who prefer instant coffee stirred directly into hot water.",
        productionNotes:
          "No meaningful third-party certification is being claimed. This stays in the catalog as a practical preference item.",
        notes:
          "An optional addition after core groceries are covered.",
        nutrition: {
          serving: "1 tsp dry",
          calories: 0,
          proteinG: 0,
          carbsG: 0,
          fatG: 0,
          fiberG: 0,
          sugarG: 0,
          sodiumMg: 0,
          sourceNote:
            "Instant coffee nutrition is negligible per serving; ALDI source is mainly for current price and package size.",
        },
        ingredients: ["Instant coffee."],
        additives: [],
        certifications: [],
        marketingClaims: ["Regular instant coffee"],
        evidenceNotes: [
          "Current ALDI listing shows the 8 oz jar at $6.15.",
        ],
        sourceLinks: [
          source(
            "ALDI product page",
            "https://www.aldi.us/store/aldi/products/20046450-beaumont-regular-instant-coffee-8-oz"
          ),
        ],
      },
      {
        id: "simply-nature-chia-seeds",
        name: "Simply Nature Chia Seeds",
        brand: "Simply Nature",
        store: "Aldi",
        category: "Pantry",
        currentPrice: 4.29,
        typicalPrice: "$4.09-$4.29 per bag",
        size: "12 oz",
        priceLastChecked: "2026-08-13",
        foodTier: "S",
        verificationGrade: "B",
        favorite: false,
        quantityStep: 1,
        defaultQuantity: 1,
        summary:
          "A dense pantry add-on with fiber and omega-3 fats. Chosen for nutrition density, not because it carries a certification we cannot verify.",
        productionNotes:
          "Current ALDI details page emphasizes the brand's ingredient standards but does not show a third-party certification worth counting for the verification grade.",
        notes:
          "Useful in yogurt or oats and lasts longer than a one-week cycle if used in tablespoon amounts.",
        nutrition: {
          serving: "2 tbsp",
          calories: 140,
          proteinG: 5,
          carbsG: 12,
          fatG: 9,
          fiberG: 10,
          sugarG: 0,
          sodiumMg: 0,
          sourceNote:
            "Representative chia label profile. ALDI accessible page confirms single-ingredient panel and current price.",
        },
        ingredients: ["Chia seed."],
        additives: [],
        certifications: [],
        marketingClaims: [
          "Simply Nature brand note: free from over 125 artificial ingredients and preservatives",
        ],
        evidenceNotes: [
          "ALDI current listing shows $4.29 for 12 oz.",
          "Accessible ALDI page exposes the ingredient panel as chia seed.",
        ],
        sourceLinks: [
          source(
            "ALDI product page",
            "https://www.aldi.us/store/aldi/products/19540020-simply-nature-chia-seeds-12-oz"
          ),
        ],
      },
      {
        id: "large-avocado",
        name: "Large Avocado",
        brand: "Produce",
        store: "Aldi",
        category: "Produce",
        currentPrice: 0.79,
        typicalPrice: "$0.79-$0.89 each",
        size: "1 each",
        priceLastChecked: "2026-08-13",
        foodTier: "S",
        verificationGrade: "B",
        favorite: false,
        quantityStep: 1,
        defaultQuantity: 1,
        summary:
          "Simple whole food add-on used in the stricter health-first cart and the $100 quality-flex cart.",
        productionNotes:
          "No third-party production certification is stored for the conventional single avocado listing.",
        notes:
          "Included as a higher-tier produce upgrade once the base cart is already covered.",
        nutrition: {
          serving: "1/3 avocado",
          calories: 80,
          proteinG: 1,
          carbsG: 4,
          fatG: 7,
          fiberG: 3,
          sugarG: 0,
          sodiumMg: 0,
          sourceNote: "Standard avocado nutrition profile.",
        },
        ingredients: ["Avocado."],
        additives: [],
        certifications: [],
        marketingClaims: [],
        evidenceNotes: [
          "Current ALDI produce listing shows the large avocado at $0.79 each.",
        ],
        sourceLinks: [
          source(
            "ALDI product page",
            "https://www.aldi.us/store/aldi/products/3111634-avocado-each"
          ),
        ],
      },
      {
        id: "roma-tomatoes",
        name: "Roma Tomatoes",
        brand: "Produce",
        store: "Aldi",
        category: "Produce",
        currentPrice: 0.21,
        typicalPrice: "$0.21-$0.25 each",
        size: "each",
        priceLastChecked: "2026-08-13",
        foodTier: "A",
        verificationGrade: "B",
        favorite: false,
        quantityStep: 1,
        defaultQuantity: 3,
        summary:
          "Cheap fresh produce add-on for the health-first $80 variation.",
        productionNotes:
          "This is a conventional produce listing without stored third-party certification.",
        notes:
          "The Regular 80 sample cart includes three Roma tomatoes at the saved reference price.",
        nutrition: {
          serving: "1 tomato",
          calories: 11,
          proteinG: 1,
          carbsG: 2,
          fatG: 0,
          fiberG: 1,
          sugarG: 2,
          sodiumMg: 3,
          sourceNote: "Standard Roma tomato nutrition profile.",
        },
        ingredients: ["Tomato."],
        additives: [],
        certifications: [],
        marketingClaims: [],
        evidenceNotes: [
          "Current ALDI listing shows Roma tomatoes at about $0.21 each or $0.95 per pound.",
        ],
        sourceLinks: [
          source(
            "ALDI product page",
            "https://www.aldi.us/store/aldi/products/17763870-tomatoes-roma-per-lb"
          ),
        ],
      },
      {
        id: "great-value-organic-blueberries",
        name: "Great Value Organic Frozen Blueberries",
        brand: "Great Value",
        store: "Walmart",
        category: "Fruit",
        currentPrice: 3.32,
        typicalPrice: "$3.32 per bag",
        size: "10 oz",
        priceLastChecked: "2026-08-13",
        foodTier: "S",
        verificationGrade: "A",
        favorite: false,
        quantityStep: 1,
        defaultQuantity: 1,
        summary:
          "Priority fruit in the seeded plans because it matches the included food-tier priorities.",
        productionNotes:
          "Credible organic certification is stored separately from the nutrition argument for blueberries.",
        notes:
          "This item was used in the budget build when Aldi's larger organic berry option was not the better fit for the lower budget ceiling.",
        nutrition: {
          serving: "1 cup",
          calories: 80,
          proteinG: 1,
          carbsG: 19,
          fatG: 0,
          fiberG: 4,
          sugarG: 13,
          sodiumMg: 0,
          sourceNote:
            "Representative blueberry nutrition profile; Walmart source confirms organic status, size, and price.",
        },
        ingredients: ["Organic blueberries."],
        additives: [],
        certifications: [
          certification(
            "USDA Organic",
            "USDA-accredited organic certifier",
            "Organic agricultural production and handling",
            "Credible government-regulated certification."
          ),
        ],
        marketingClaims: ["Frozen whole blueberries"],
        evidenceNotes: [
          "Walmart listing shows the 10 oz bag at $3.32 and explicitly identifies it as USDA Organic.",
          "This is the seeded main fruit choice instead of bananas in the included tier model.",
        ],
        sourceLinks: [
          source(
            "Walmart product page",
            "https://www.walmart.com/ip/12512014"
          ),
        ],
      },
      {
        id: "smuckers-organic-chunky-peanut-butter",
        name: "Smucker's Organic Natural Chunky Peanut Butter",
        brand: "Smucker's",
        store: "Walmart",
        category: "Pantry",
        currentPrice: 5.68,
        typicalPrice: "$5.68 per jar",
        size: "16 oz",
        priceLastChecked: "2026-08-13",
        foodTier: "S",
        verificationGrade: "A",
        favorite: false,
        quantityStep: 1,
        defaultQuantity: 1,
        summary:
          "The seeded peanut butter choice for PB&J. Organic peanuts plus salt keeps the label simple.",
        productionNotes:
          "The USDA Organic certification is meaningful. The simple ingredient panel is a separate reason it remains in the catalog.",
        notes:
          "Organic certification and a short ingredient list support this quality option.",
        nutrition: {
          serving: "2 tbsp",
          calories: 180,
          proteinG: 8,
          carbsG: 6,
          fatG: 16,
          fiberG: 3,
          sugarG: 1,
          sodiumMg: 45,
          sourceNote:
            "Nutrition and ingredient panel from the official Smucker's product page.",
        },
        ingredients: ["Organic peanuts.", "Contains 1% or less of salt."],
        additives: [],
        certifications: [
          certification(
            "USDA Organic",
            "USDA-accredited organic certifier",
            "Organic ingredients and processing",
            "Credible government-regulated certification."
          ),
        ],
        marketingClaims: ["Gluten free", "Natural", "Kosher Pareve"],
        evidenceNotes: [
          "Official Smucker's page lists the product as organic peanuts plus salt with 8 g protein per serving.",
          "Walmart listing prices the jar at $5.68.",
        ],
        sourceLinks: [
          source(
            "Smucker's official product page",
            "https://www.smuckers.com/peanut-butter/organic/organic-chunky-peanut-butter"
          ),
          source(
            "Walmart product page",
            "https://www.walmart.com/ip/24471296"
          ),
        ],
      },
      {
        id: "st-dalfour-blueberry-fruit-spread",
        name: "St. Dalfour Blueberry Fruit Spread",
        brand: "St. Dalfour",
        store: "Walmart",
        category: "Pantry",
        currentPrice: 4.97,
        typicalPrice: "$4.97 per jar",
        size: "10 oz",
        priceLastChecked: "2026-08-13",
        foodTier: "A",
        verificationGrade: "B",
        favorite: false,
        quantityStep: 1,
        defaultQuantity: 1,
        summary:
          "The lower-price PB&J spread in the current pair, with its fruit-sweetened formulation kept separate from certification claims.",
        productionNotes:
          "This product earns points for ingredient profile and fewer obvious junk add-ins, not for a meaningful third-party sourcing certification.",
        notes:
          "This is the value choice, not a sugar-free product. It still contains fruit sugars and has no credited production certification.",
        nutrition: {
          serving: "1 tbsp",
          calories: 40,
          proteinG: 0,
          carbsG: 10,
          fatG: 0,
          fiberG: 0,
          sugarG: 9,
          sodiumMg: 0,
          sourceNote:
            "Calories from the Walmart product page; ingredient structure from St. Dalfour product information.",
        },
        ingredients: [
          "Blueberries.",
          "Fruit juice concentrates (grape and date).",
          "Fruit pectin.",
          "Lemon juice.",
        ],
        additives: [
          additive(
            "Fruit pectin",
            "Gelling agent used to set the spread. Not automatically treated as a negative."
          ),
        ],
        certifications: [],
        marketingClaims: [
          "100% from fruit",
          "Vegan",
          "Gluten free",
          "Non-GMO",
          "No cane sugar",
          "No artificial colors or flavors",
        ],
        evidenceNotes: [
          "Walmart listing prices the jar at $4.97 and frames the sweetness as fruit-juice based.",
          "The product is intentionally not credited with a strong third-party production certification in the app.",
        ],
        sourceLinks: [
          source(
            "Walmart product page",
            "https://www.walmart.com/ip/10323765"
          ),
          source(
            "St. Dalfour product page",
            "https://www.stdalfouruk.com/products/blueberry-fruit-spread"
          ),
        ],
      },
      {
        id: "great-value-long-grain-rice",
        name: "Great Value Long Grain Enriched Rice",
        brand: "Great Value",
        store: "Walmart",
        category: "Pantry",
        currentPrice: 3.67,
        typicalPrice: "$3.67 per bag",
        size: "5 lb",
        priceLastChecked: "2026-08-13",
        foodTier: "B",
        verificationGrade: "B",
        favorite: false,
        quantityStep: 1,
        defaultQuantity: 1,
        summary:
          "Extremely efficient carbohydrate base and shelf-life anchor. It stays in the system because budget logistics matter, even if it is not an S-tier food.",
        productionNotes:
          "No special sourcing certification beyond a kosher claim. The value comes from price stability and utility.",
        notes:
          "This is one of the pantry items most likely to stretch beyond a single week.",
        nutrition: {
          serving: "1/4 cup dry",
          calories: 160,
          proteinG: 3,
          carbsG: 36,
          fatG: 0,
          fiberG: 0,
          sugarG: 0,
          sodiumMg: 0,
          sourceNote:
            "Representative enriched long-grain white rice label. Walmart source confirms price and key claims.",
        },
        ingredients: [
          "Long grain rice.",
          "Ferric phosphate.",
          "Niacin.",
          "Thiamine mononitrate.",
          "Folic acid.",
        ],
        additives: [],
        certifications: [
          certification(
            "Certified Kosher",
            "Kosher certifier not specified in the accessible snippet",
            "Dietary compliance",
            "Meaningful for kosher compliance, not a general health-grade shortcut."
          ),
        ],
        marketingClaims: ["No artificial flavors or colors", "Gluten free"],
        evidenceNotes: [
          "Walmart listing shows $3.67 for the 5 lb bag.",
          "Kept in the app as a staple rather than a prestige food choice.",
        ],
        sourceLinks: [
          source(
            "Walmart product page",
            "https://www.walmart.com/ip/10315395"
          ),
        ],
      },
      {
        id: "great-value-pure-pumpkin",
        name: "Great Value 100% Pure Pumpkin",
        brand: "Great Value",
        store: "Walmart",
        category: "Pantry",
        currentPrice: 1.96,
        typicalPrice: "$1.96 per can",
        size: "15 oz",
        priceLastChecked: "2026-08-13",
        foodTier: "S",
        verificationGrade: "B",
        favorite: false,
        quantityStep: 1,
        defaultQuantity: 1,
        summary:
          "Cheap, useful whole-food-style canned item with no added sugar. Good for oats, yogurt, or baking.",
        productionNotes:
          "This is a simple ingredient product, but it does not carry a stored third-party sourcing certification in the app.",
        notes:
          "Included in the low budget build because it is unusually nutritious for the price.",
        nutrition: {
          serving: "1/2 cup",
          calories: 45,
          proteinG: 2,
          carbsG: 10,
          fatG: 0,
          fiberG: 3,
          sugarG: 4,
          sodiumMg: 5,
          sourceNote:
            "Representative canned pure pumpkin label profile; Walmart source confirms no added sugar and current price.",
        },
        ingredients: ["Pumpkin."],
        additives: [],
        certifications: [],
        marketingClaims: ["100% pure pumpkin", "No added sugar"],
        evidenceNotes: [
          "Walmart listing shows the can at $1.96 and explicitly states no added sugar.",
        ],
        sourceLinks: [
          source(
            "Walmart product page",
            "https://www.walmart.com/ip/24538777"
          ),
        ],
      },
      {
        id: "great-value-mixed-vegetables",
        name: "Great Value Mixed Vegetables",
        brand: "Great Value",
        store: "Walmart",
        category: "Vegetable",
        currentPrice: 0.98,
        typicalPrice: "$0.98 per bag",
        size: "12 oz",
        priceLastChecked: "2026-08-13",
        foodTier: "A",
        verificationGrade: "B",
        favorite: false,
        quantityStep: 1,
        defaultQuantity: 2,
        summary:
          "Fast frozen vegetable baseline. Conventional, but still a strong default because it is cheap, shelf-stable, and easy to use.",
        productionNotes:
          "No organic or similar sourcing certification is being claimed here. The app distinguishes that from the fact that it still improves the cart.",
        notes:
          "A conventional vegetable option that helps the Emergency 50 sample cart stay within budget.",
        nutrition: {
          serving: "2/3 cup",
          calories: 50,
          proteinG: 2,
          carbsG: 10,
          fatG: 0,
          fiberG: 3,
          sugarG: 4,
          sodiumMg: 30,
          sourceNote:
            "Representative mixed vegetable label profile; Walmart source confirms vegetable mix and no added chemicals, preservatives, or sugars claim.",
        },
        ingredients: ["Carrots.", "Green beans.", "Corn.", "Peas."],
        additives: [],
        certifications: [],
        marketingClaims: ["No added chemicals, preservatives, or sugars"],
        evidenceNotes: [
          "Walmart listing prices the bag at $0.98 and shows the mixed vegetable composition.",
        ],
        sourceLinks: [
          source(
            "Walmart product page",
            "https://www.walmart.com/ip/817042496"
          ),
        ],
      },
      {
        id: "wild-alaska-sockeye-salmon",
        name: "Wild Caught Alaska Sockeye Whole Salmon Portions",
        brand: "Fresh",
        store: "Walmart",
        category: "Protein",
        currentPrice: 13.74,
        typicalPrice: "$13.02-$13.74 per package",
        size: "0.7-0.85 lb package",
        priceLastChecked: "2026-08-13",
        foodTier: "S",
        verificationGrade: "A",
        favorite: false,
        quantityStep: 1,
        defaultQuantity: 1,
        summary:
          "The deliberately higher-quality seafood purchase. Added only after the base protein structure is already secure.",
        productionNotes:
          "MSC certification is used specifically for sustainability and chain-of-custody verification. It is not being overstated as a direct health certificate.",
        notes:
          "This remains in the catalog because it provides meaningful verification rather than relying on price alone.",
        nutrition: {
          serving: "4 oz",
          calories: 150,
          proteinG: 25,
          carbsG: 0,
          fatG: 7,
          fiberG: 0,
          sugarG: 0,
          sodiumMg: 70,
          sourceNote:
            "Protein figure comes directly from the Walmart product listing. Other macros are a standard sockeye profile.",
        },
        ingredients: ["Wild Alaska sockeye salmon."],
        additives: [],
        certifications: [
          certification(
            "MSC Certified",
            "Marine Stewardship Council",
            "Sustainable fishery and chain of custody",
            "Credible third-party sustainability certification."
          ),
        ],
        marketingClaims: ["Wild caught", "25 g protein per 4 oz serving"],
        evidenceNotes: [
          "Walmart seafood listing shows the package as MSC Certified with 25 g protein per 4 oz serving.",
          "MSC certification supports the seafood-sourcing grade.",
        ],
        sourceLinks: [
          source(
            "Walmart product page",
            "https://www.walmart.com/ip/895031780"
          ),
        ],
      },
      {
        id: "c4-performance-energy",
        name: "C4 Performance Energy Drink, Strawberry Blast",
        brand: "C4",
        store: "Walmart",
        category: "Beverage",
        currentPrice: 2.44,
        typicalPrice: "$2.44-$2.72 per 16 oz can",
        size: "16 fl oz can",
        priceLastChecked: "2026-08-13",
        foodTier: "A",
        verificationGrade: "A",
        favorite: false,
        quantityStep: 1,
        defaultQuantity: 4,
        summary:
          "Performance-oriented energy drink slot with a credible independent sports-testing credential.",
        productionNotes:
          "This is one of the rare packaged performance beverages where a credible third-party program actually matters for the use case.",
        notes:
          "Still treated as lower priority than core food when the budget gets tight.",
        nutrition: {
          serving: "1 can",
          calories: 5,
          proteinG: 0,
          carbsG: 0,
          fatG: 0,
          fiberG: 0,
          sugarG: 0,
          sodiumMg: 45,
          sourceNote:
            "Calories and ingredients are based on accessible retail label data for the 16 oz can. Price comes from Walmart; certification and high-level claim language also cross-check against Cellucor.",
        },
        ingredients: [
          "Carbonated water.",
          "CarnoSyn beta-alanine.",
          "L-citrulline.",
          "BetaPower betaine anhydrous.",
          "Malic acid.",
          "Citric acid.",
          "Natural flavors.",
          "Potassium sorbate.",
          "Caffeine anhydrous.",
          "Sucralose.",
          "Acesulfame potassium.",
          "Niacinamide.",
          "N-acetyl-L-tyrosine.",
          "Cyanocobalamin (vitamin B12).",
        ],
        additives: [
          additive("Potassium sorbate", "Preservative."),
          additive("Sucralose", "Non-sugar sweetener."),
          additive("Acesulfame potassium", "Non-sugar sweetener."),
        ],
        certifications: [
          certification(
            "NSF Certified for Sport",
            "NSF",
            "Banned-substance and label verification for sports products",
            "Meaningful third-party testing program for athlete-facing supplements and beverages."
          ),
        ],
        marketingClaims: [
          "Zero sugar",
          "No artificial colors",
          "200 mg caffeine",
          "Supports endurance and focus",
        ],
        evidenceNotes: [
          "The current first-party Walmart Strawberry Blast listing carries the NSF Certified for Sport label; use the live pull for its current price.",
          "Cellucor product page also emphasizes the NSF program and 200 mg caffeine position.",
        ],
        sourceLinks: [
          source(
            "Walmart product page",
            "https://www.walmart.com/ip/428615788"
          ),
          source(
            "Cellucor official product page",
            "https://cellucor.com/products/c4-original-carbonated?variant=41497370918974"
          ),
        ],
      },
      {
        id: "horizon-no-added-sugar-chocolate-milk",
        name: "Horizon Organic Shelf Stable No Added Sugar Chocolate Milk",
        brand: "Horizon Organic",
        store: "Walmart",
        category: "Beverage",
        currentPrice: 14.97,
        typicalPrice: "$14.97 per 12-pack",
        size: "12 x 8 fl oz",
        priceLastChecked: "2026-08-13",
        foodTier: "A",
        verificationGrade: "A",
        favorite: false,
        quantityStep: 1,
        defaultQuantity: 1,
        summary:
          "Chocolate milk slot selected for a no-added-sugar formulation rather than standard sweetened options.",
        productionNotes:
          "The organic certification and Horizon's disclosed production claims are counted for what they actually verify. This product is not being framed as magic health food.",
        notes:
          "Included only in the $100 quality-flex build because the price is too high for the tighter carts.",
        nutrition: {
          serving: "1 milk box",
          calories: 120,
          proteinG: 8,
          carbsG: 14,
          fatG: 2.5,
          fiberG: 0,
          sugarG: 13,
          sodiumMg: 160,
          sourceNote:
            "Nutrition and ingredient panel from Horizon's official product page. Sugar is present from milk; added sugar is listed as 0 g.",
        },
        ingredients: [
          "Organic grade A lowfat milk.",
          "Organic cocoa blend [organic cocoa (processed with alkali), organic cocoa].",
          "Less than 0.5% of organic stevia leaf extract.",
          "Organic monk fruit extract.",
          "Vitamin A palmitate.",
          "Vitamin D3.",
          "Lactase enzyme.",
          "Salt.",
          "Gellan gum.",
          "Organic natural flavor.",
        ],
        additives: [
          additive(
            "Gellan gum",
            "Stabilizer commonly used in shelf-stable beverages."
          ),
          additive(
            "Stevia leaf extract",
            "Non-sugar sweetener used to avoid added sugar."
          ),
          additive(
            "Monk fruit extract",
            "Non-sugar sweetener used to avoid added sugar."
          ),
        ],
        certifications: [
          certification(
            "USDA Organic",
            "USDA-accredited organic certifier",
            "Organic dairy production and handling",
            "Credible government-regulated certification."
          ),
        ],
        marketingClaims: [
          "No added sugar",
          "Lactose free",
          "Shelf stable",
          "Pasture-raised cows",
          "Non-GMO feed",
        ],
        evidenceNotes: [
          "Horizon official page states 8 g protein per serving and exposes the full ingredient panel.",
          "Walmart listing prices the 12-count box at $14.97.",
        ],
        sourceLinks: [
          source(
            "Horizon official product page",
            "https://horizon.com/organic-dairy-products/organic-milk/shelf-stable-no-added-sugar-lactose-free-organic-1-lowfat-milk/"
          ),
          source(
            "Walmart product page",
            "https://www.walmart.com/ip/19187615549"
          ),
        ],
      },
      {
        id: "bananas",
        name: "Fresh Banana, Each",
        brand: "Fresh Produce",
        store: "Walmart",
        category: "Fruit",
        currentPrice: 0.2,
        typicalPrice: "$0.20 each estimated; final cost by weight",
        size: "each, sold by weight",
        priceLastChecked: "2026-08-13",
        purchaseUrl: "https://www.walmart.com/ip/44390948",
        foodTier: "B",
        verificationGrade: "B",
        favorite: false,
        quantityStep: 0.25,
        defaultQuantity: 1,
        summary:
          "Kept in the catalog as the cheaper carbohydrate fruit option, but not prioritized over blueberries in this tier model.",
        productionNotes:
          "No third-party certification stored for the conventional listing.",
        notes:
          "Useful when price pressure matters more than fruit tier preference. Walmart replaces the dead Aldi product page.",
        nutrition: {
          serving: "1 medium banana",
          calories: 105,
          proteinG: 1,
          carbsG: 27,
          fatG: 0,
          fiberG: 3,
          sugarG: 14,
          sodiumMg: 1,
          sourceNote: "Standard banana nutrition profile.",
        },
        ingredients: ["Banana."],
        additives: [],
        certifications: [],
        marketingClaims: [],
        evidenceNotes: [
          "The live Walmart listing is sold and shipped by Walmart.com and is priced by weight.",
          "Stored as a lower-priority fruit relative to blueberries in this catalog.",
        ],
        sourceLinks: [
          source(
            "Walmart exact product page",
            "https://www.walmart.com/ip/44390948"
          ),
        ],
      },
    ],
    budgetPlans: [
      {
        id: "budget-50",
        name: "Emergency 50",
        target: 50,
        summary:
          "Hard-ceiling cart focused on protein, staple carbs, PB&J, frozen produce, and one priority fruit.",
        notes: [
          "This is the strictest budget view.",
          "Chicken is budgeted by weight rather than by package count.",
        ],
        items: [
          { productId: "simply-nature-organic-chicken-breast", quantity: 1.75 },
          { productId: "goldhen-pasture-raised-eggs", quantity: 2 },
          { productId: "millville-old-fashioned-oats", quantity: 1 },
          { productId: "simply-nature-graintastic-bread", quantity: 1 },
          { productId: "great-value-organic-blueberries", quantity: 1 },
          { productId: "smuckers-organic-chunky-peanut-butter", quantity: 1 },
          { productId: "st-dalfour-blueberry-fruit-spread", quantity: 1 },
          { productId: "great-value-long-grain-rice", quantity: 1 },
          { productId: "great-value-pure-pumpkin", quantity: 1 },
          { productId: "great-value-mixed-vegetables", quantity: 2 },
        ],
      },
      {
        id: "budget-80",
        name: "Regular 80",
        target: 80,
        summary:
          "Health-first version: base cart plus yogurt, salmon, four C4 cans, avocado, and Roma tomatoes.",
        notes: [
          "A sample cart with an $80 spending target.",
          "Coffee remains available in the catalog as an optional swap for avocado and tomatoes.",
        ],
        items: [
          { productId: "simply-nature-organic-chicken-breast", quantity: 2 },
          { productId: "goldhen-pasture-raised-eggs", quantity: 2 },
          { productId: "millville-old-fashioned-oats", quantity: 1 },
          { productId: "simply-nature-graintastic-bread", quantity: 1 },
          { productId: "friendly-farms-plain-greek-yogurt", quantity: 1 },
          { productId: "great-value-organic-blueberries", quantity: 1 },
          { productId: "smuckers-organic-chunky-peanut-butter", quantity: 1 },
          { productId: "st-dalfour-blueberry-fruit-spread", quantity: 1 },
          { productId: "great-value-long-grain-rice", quantity: 1 },
          { productId: "great-value-pure-pumpkin", quantity: 1 },
          { productId: "great-value-mixed-vegetables", quantity: 2 },
          { productId: "wild-alaska-sockeye-salmon", quantity: 1 },
          { productId: "c4-performance-energy", quantity: 4 },
          { productId: "large-avocado", quantity: 1 },
          { productId: "roma-tomatoes", quantity: 3 },
        ],
      },
      {
        id: "budget-100",
        name: "Premium 100",
        target: 100,
        summary:
          "The fuller recommendation: adds yogurt, coffee, chia, salmon, C4, avocado, and Horizon no-added-sugar chocolate milk.",
        notes: [
          "This seeded preset stays just under $100 at the current saved prices.",
          "The catalog keeps every item editable if local store prices change.",
        ],
        items: [
          { productId: "simply-nature-organic-chicken-breast", quantity: 1.5 },
          { productId: "goldhen-pasture-raised-eggs", quantity: 2 },
          { productId: "millville-old-fashioned-oats", quantity: 1 },
          { productId: "simply-nature-graintastic-bread", quantity: 1 },
          { productId: "friendly-farms-plain-greek-yogurt", quantity: 1 },
          { productId: "beaumont-regular-instant-coffee", quantity: 1 },
          { productId: "simply-nature-chia-seeds", quantity: 1 },
          { productId: "large-avocado", quantity: 1 },
          { productId: "great-value-organic-blueberries", quantity: 1 },
          { productId: "smuckers-organic-chunky-peanut-butter", quantity: 1 },
          { productId: "st-dalfour-blueberry-fruit-spread", quantity: 1 },
          { productId: "great-value-long-grain-rice", quantity: 1 },
          { productId: "great-value-pure-pumpkin", quantity: 1 },
          { productId: "great-value-mixed-vegetables", quantity: 1 },
          { productId: "wild-alaska-sockeye-salmon", quantity: 1 },
          { productId: "c4-performance-energy", quantity: 4 },
          { productId: "horizon-no-added-sugar-chocolate-milk", quantity: 1 },
        ],
      },
    ],
  };
})();
