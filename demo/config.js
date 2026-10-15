/* Spunfor demo config. Venues, hours, addresses and coordinates are copied from the NOLA V3 trip data (research dated Oct 2026).
   Price tiers are estimates. Verify hours before you go. Swap this object for another city to re-theme the app. */
window.SPUNFOR_DEMO_CONFIG={
 "id": "nola-demo",
 "city": "New Orleans",
 "tz": "America/Chicago",
 "center": [
  29.9575,
  -90.065
 ],
 "trip": {
  "title": "New Orleans",
  "dates": "Demo trip · dates are placeholders",
  "who": "Demo traveler"
 },
 "palette": {
  "accent": "#7b2446",
  "accent2": "#d9a441",
  "name": "Mardi Gras brass & claret"
 },
 "genericPalette": {
  "accent": "#2563eb"
 },
 "walkSpeedKmh": 4.8,
 "collections": [
  {
   "key": "tonight",
   "title": "Tonight",
   "sub": "Jazz, bars & more",
   "cats": [
    "jazz",
    "drink",
    "party"
   ],
   "intro": "Where the night goes: live music, cocktails, dancing and the late spots. Open-tonight places come first."
  },
  {
   "key": "jazz",
   "title": "Jazz & cocktails",
   "sub": "Small rooms, big horns",
   "cats": [
    "jazz",
    "drink"
   ],
   "intro": "Live music rooms and cocktail bars. Use Holla Holla to see what is open right now."
  },
  {
   "key": "hidden",
   "title": "Hidden gems",
   "sub": "What most visitors miss",
   "tags": [
    "hidden"
   ],
   "intro": "The places most visitors walk right past."
  },
  {
   "key": "locals",
   "title": "Where the locals go",
   "sub": "Neighborhood favorites",
   "tags": [
    "locals"
   ],
   "intro": "Neighborhood spots with neighborhood crowds."
  },
  {
   "key": "coffee",
   "title": "Coffee & beignets",
   "sub": "Start slow",
   "cats": [
    "coffee"
   ],
   "intro": "Morning-friendly cafés and the beignet stands."
  },
  {
   "key": "eat",
   "title": "Eats",
   "sub": "Sit-down and quick bites",
   "cats": [
    "eat"
   ],
   "intro": "From po-boys to full dinners; vegetarian-friendly options are noted where the source says so."
  },
  {
   "key": "veg",
   "title": "Vegetarian eats",
   "sub": "Plant-forward picks",
   "tags": [
    "veg"
   ],
   "intro": "Places with real vegetarian options, so nobody is stuck ordering side dishes."
  },
  {
   "key": "romantic",
   "title": "Romantic",
   "sub": "Candlelight & courtyards",
   "cats": [
    "date"
   ],
   "intro": "Courtyards, candlelight and slow evenings."
  },
  {
   "key": "history",
   "title": "History & curiosities",
   "sub": "Museums and oddities",
   "cats": [
    "history",
    "spooky",
    "shop"
   ],
   "intro": "Museums, antiques and the strange little places with a story."
  },
  {
   "key": "nature",
   "title": "Green & quiet",
   "sub": "Shade and a slow walk",
   "cats": [
    "nature"
   ],
   "tags": [
    "nature"
   ],
   "intro": "Parks, oaks and a slower pace."
  }
 ],
 "moods": [
  {
   "key": "romantic",
   "label": "Romantic",
   "cats": [
    "date"
   ]
  },
  {
   "key": "locals",
   "label": "Local favorites",
   "tags": [
    "locals"
   ]
  },
  {
   "key": "nature",
   "label": "Nature",
   "cats": [
    "nature"
   ],
   "tags": [
    "nature"
   ]
  },
  {
   "key": "history",
   "label": "History",
   "cats": [
    "history",
    "spooky"
   ]
  },
  {
   "key": "veg",
   "label": "Veg-friendly",
   "tags": [
    "veg"
   ]
  },
  {
   "key": "jazz",
   "label": "Live music",
   "cats": [
    "jazz"
   ]
  },
  {
   "key": "hidden",
   "label": "Hidden gems",
   "tags": [
    "hidden"
   ]
  },
  {
   "key": "foodie",
   "label": "Foodie",
   "cats": [
    "eat",
    "coffee"
   ]
  }
 ],
 "stopMinutes": {
  "coffee": 45,
  "eat": 75,
  "drink": 60,
  "jazz": 75,
  "date": 75,
  "party": 60,
  "sports": 75,
  "history": 60,
  "spooky": 45,
  "shop": 45,
  "nature": 75
 },
 "checkoutUrl": "",
 "venues": [
  {
   "id": "cdm",
   "name": "Café du Monde",
   "cats": [
    "coffee"
   ],
   "area": "French Quarter",
   "price": "$",
   "phone": "504-587-0833",
   "address": "800 Decatur St",
   "note": "Chicory café au lait and beignets (an order is 3). Walk in for a table; the line is for to-go. Bring cash.",
   "url": "https://www.cafedumonde.com",
   "coords": [
    29.95756,
    -90.06185
   ],
   "hours": {
    "mon": [
     [
      "07:15",
      "23:00"
     ]
    ],
    "tue": [
     [
      "07:15",
      "23:00"
     ]
    ],
    "wed": [
     [
      "07:15",
      "23:00"
     ]
    ],
    "thu": [
     [
      "07:15",
      "23:00"
     ]
    ],
    "fri": [
     [
      "07:15",
      "00:00"
     ]
    ],
    "sat": [
     [
      "07:15",
      "00:00"
     ]
    ],
    "sun": [
     [
      "07:15",
      "23:00"
     ]
    ]
   },
   "hoursText": "Sun–Thu 7:15 am–11 pm; Fri–Sat 7:15 am–midnight (no longer 24 hours)",
   "reserve": "Walk-in only",
   "music": "No scheduled music; street musicians often play nearby on Decatur St / Jackson Square",
   "source": "https://shop.cafedumonde.com/locations/",
   "confidence": "high",
   "why": "The original since 1862. Hot beignets buried in powdered sugar with chicory café au lait is the New Orleans ritual.",
   "tags": []
  },
  {
   "id": "cafebeignet",
   "name": "Café Beignet on Bourbon",
   "cats": [
    "coffee",
    "jazz"
   ],
   "area": "French Quarter",
   "price": "$",
   "phone": null,
   "address": "311 Bourbon St",
   "note": "Beignets with live jazz in the Musical Legends Park courtyard.",
   "url": "https://www.cafebeignet.com",
   "coords": [
    29.95588,
    -90.0685
   ],
   "hours": {
    "mon": [
     [
      "08:00",
      "22:00"
     ]
    ],
    "tue": [
     [
      "08:00",
      "22:00"
     ]
    ],
    "wed": [
     [
      "08:00",
      "22:00"
     ]
    ],
    "thu": [
     [
      "08:00",
      "00:00"
     ]
    ],
    "fri": [
     [
      "08:00",
      "00:00"
     ]
    ],
    "sat": [
     [
      "08:00",
      "00:00"
     ]
    ],
    "sun": [
     [
      "08:00",
      "00:00"
     ]
    ]
   },
   "hoursText": "Mon–Wed 8 am–10 pm; Thu–Sun 8 am–midnight",
   "reserve": "Walk-in only",
   "music": "Live jazz daily in Musical Legends Park, 10 am until close; free, tips appreciated",
   "source": "https://www.cafebeignet.com/",
   "confidence": "high",
   "why": "The same sugar fix, plus a free live jazz band in a courtyard full of jazz-legend statues.",
   "tags": [
    "indoor"
   ]
  },
  {
   "id": "mfth",
   "name": "Meals From the Heart Café",
   "cats": [
    "eat",
    "coffee"
   ],
   "area": "French Quarter",
   "price": "$",
   "phone": "504-525-1953",
   "address": "1100 N Peters St #13 (French Market)",
   "note": "Vegan gumbo, crab cakes, jambalaya, red beans, and vegan beignets. Daytime.",
   "url": "https://www.mealsfromtheheartcafe.com",
   "coords": [
    29.95975,
    -90.05955
   ],
   "hours": {
    "mon": [
     [
      "10:00",
      "16:00"
     ]
    ],
    "tue": [
     [
      "10:00",
      "16:00"
     ]
    ],
    "wed": [
     [
      "10:00",
      "16:00"
     ]
    ],
    "thu": [
     [
      "10:00",
      "16:00"
     ]
    ],
    "fri": [
     [
      "10:00",
      "16:00"
     ]
    ],
    "sat": [
     [
      "10:00",
      "16:00"
     ]
    ],
    "sun": []
   },
   "hoursText": "Mon–Sat 10 am–4 pm; closed Sunday (official site; third-party listings differ, so call 504-525-1953 to confirm)",
   "reserve": "Walk-in only",
   "music": null,
   "source": "https://www.mealsfromtheheartcafe.com/",
   "confidence": "medium",
   "why": "A rare chance for a vegetarian to eat real Louisiana classics: vegan gumbo, crab cakes, and beignets.",
   "tags": [
    "veg",
    "locals",
    "indoor"
   ]
  },
  {
   "id": "cdmpark",
   "name": "Café du Monde, City Park",
   "cats": [
    "coffee"
   ],
   "area": "Mid-City",
   "price": "$",
   "phone": null,
   "address": "56 Dreyfous Dr",
   "note": "Same menu under the oaks, much shorter lines.",
   "url": "https://www.cafedumonde.com",
   "coords": [
    29.98543,
    -90.0951
   ],
   "hours": {
    "mon": [
     [
      "07:00",
      "21:00"
     ]
    ],
    "tue": [
     [
      "07:00",
      "21:00"
     ]
    ],
    "wed": [
     [
      "07:00",
      "21:00"
     ]
    ],
    "thu": [
     [
      "07:00",
      "21:00"
     ]
    ],
    "fri": [
     [
      "07:00",
      "22:00"
     ]
    ],
    "sat": [
     [
      "07:00",
      "22:00"
     ]
    ],
    "sun": [
     [
      "07:00",
      "21:00"
     ]
    ]
   },
   "hoursText": "Sun–Thu 7 am–9 pm; Fri–Sat 7 am–10 pm",
   "reserve": "Walk-in only",
   "music": null,
   "source": "https://shop.cafedumonde.com/locations/",
   "confidence": "high",
   "why": "Café du Monde without the line, under the live oaks by the lagoon.",
   "tags": [
    "locals",
    "nature"
   ]
  },
  {
   "id": "killer",
   "name": "Killer PoBoys",
   "cats": [
    "eat"
   ],
   "area": "French Quarter",
   "price": "$",
   "phone": "504-252-6745",
   "address": "811 Conti St",
   "note": "Thai BBQ tofu, roasted sweet potato and roasted cauliflower po-boys. The Conti St counter is inside Erin Rose bar (21+); the 219 Dauphine shop is all ages.",
   "url": "https://killerpoboys.com",
   "coords": [
    29.95655,
    -90.06794
   ],
   "hours": {
    "mon": [
     [
      "12:00",
      "20:00"
     ]
    ],
    "tue": [],
    "wed": [
     [
      "12:00",
      "20:00"
     ]
    ],
    "thu": [
     [
      "12:00",
      "20:00"
     ]
    ],
    "fri": [
     [
      "10:00",
      "00:00"
     ]
    ],
    "sat": [
     [
      "10:00",
      "00:00"
     ]
    ],
    "sun": [
     [
      "12:00",
      "20:00"
     ]
    ]
   },
   "hoursText": "Conti St (in Erin Rose bar): Mon, Wed, Thu, Sun noon–8 pm; Fri–Sat 10 am–midnight; Tue not listed (treat as closed). Second location at 219 Dauphine St: Wed–Mon 11 am–8 pm, closed Tue.",
   "reserve": "Walk-in only",
   "music": null,
   "source": "https://killerpoboys.com/",
   "confidence": "high",
   "why": "Inventive po-boys with real vegetarian options, tucked into a classic dive bar.",
   "tags": [
    "veg",
    "indoor"
   ]
  },
  {
   "id": "palmpine",
   "name": "Palm&Pine",
   "cats": [
    "eat",
    "drink",
    "date"
   ],
   "area": "French Quarter",
   "price": "$$–$$$",
   "phone": "504-814-6200",
   "address": "308 N Rampart St",
   "note": "Southern, Mexican and Caribbean-leaning dinner menu with vegetable plates and cocktails; the menu is seasonal, so check before reserving.",
   "url": "https://www.palmandpinenola.com",
   "coords": [
    29.95747,
    -90.07092
   ],
   "hours": {
    "mon": [
     [
      "17:30",
      "21:00"
     ]
    ],
    "tue": [],
    "wed": [
     [
      "17:30",
      "21:00"
     ]
    ],
    "thu": [
     [
      "17:30",
      "21:00"
     ]
    ],
    "fri": [
     [
      "17:30",
      "22:30"
     ]
    ],
    "sat": [
     [
      "11:00",
      "14:00"
     ],
     [
      "17:30",
      "22:30"
     ]
    ],
    "sun": [
     [
      "10:30",
      "14:00"
     ],
     [
      "17:30",
      "21:00"
     ]
    ]
   },
   "hoursText": "Dinner Mon & Wed–Thu 5:30–9 pm, Fri–Sat 5:30–10:30 pm, Sun 5:30–9 pm; brunch Sat 11 am–2 pm, Sun 10:30 am–2 pm; closed Tue (may open on Saenger show nights)",
   "reserve": "Reservations recommended",
   "music": null,
   "source": "https://www.palmandpinenola.com/",
   "confidence": "high",
   "why": "The best sit-down dinner in the Quarter for a vegetarian, with great cocktails.",
   "tags": [
    "veg",
    "indoor"
   ]
  },
  {
   "id": "jewel",
   "name": "Jewel of the South",
   "cats": [
    "eat",
    "drink",
    "date"
   ],
   "area": "French Quarter",
   "price": "$$$",
   "phone": "504-265-8816",
   "address": "1026 St Louis St",
   "note": "1835 Creole cottage with a garden courtyard. The cocktails are the star; some vegetarian dishes. Reserve.",
   "url": "https://www.jewelnola.com",
   "coords": [
    29.95855,
    -90.06951
   ],
   "hours": {
    "mon": [
     [
      "17:00",
      "23:00"
     ]
    ],
    "tue": [],
    "wed": [
     [
      "17:00",
      "23:00"
     ]
    ],
    "thu": [
     [
      "17:00",
      "23:00"
     ]
    ],
    "fri": [
     [
      "11:30",
      "23:00"
     ]
    ],
    "sat": [
     [
      "11:30",
      "23:00"
     ]
    ],
    "sun": [
     [
      "17:00",
      "23:00"
     ]
    ]
   },
   "hoursText": "Wed–Mon 5–11 pm (kitchen until 10 pm); Fri–Sat also lunch 11:30 am–2:30 pm and snacks 2:30–5 pm; closed Tue",
   "reserve": "Reservations recommended",
   "music": null,
   "source": "https://www.jewelnola.com/location/jewel-of-the-south/",
   "confidence": "high",
   "why": "World's 50 Best Bars cocktails in an 1835 cottage courtyard. Peak date-night atmosphere.",
   "tags": [
    "veg",
    "indoor"
   ]
  },
  {
   "id": "sneaky",
   "name": "Sneaky Pickle / Bar Brine",
   "cats": [
    "eat"
   ],
   "area": "Bywater",
   "price": "$$",
   "phone": "504-218-5651",
   "address": "3200 Burgundy St",
   "note": "Plant-driven and seasonal. Sneaky Pickle does lunch, Bar Brine dinner.",
   "url": "https://www.yousneakypickle.com",
   "coords": [
    29.96487,
    -90.04295
   ],
   "hours": {
    "mon": [
     [
      "11:00",
      "15:30"
     ],
     [
      "17:00",
      "21:30"
     ]
    ],
    "tue": [
     [
      "17:00",
      "21:30"
     ]
    ],
    "wed": [
     [
      "17:00",
      "21:30"
     ]
    ],
    "thu": [
     [
      "11:00",
      "15:30"
     ],
     [
      "17:00",
      "21:30"
     ]
    ],
    "fri": [
     [
      "11:00",
      "15:30"
     ],
     [
      "17:00",
      "21:30"
     ]
    ],
    "sat": [
     [
      "11:00",
      "15:30"
     ],
     [
      "17:00",
      "21:30"
     ]
    ],
    "sun": [
     [
      "11:00",
      "15:30"
     ],
     [
      "17:00",
      "21:30"
     ]
    ]
   },
   "hoursText": "Sneaky Pickle lunch Thu–Mon 11 am–3:30 pm; Bar Brine dinner nightly 5–9:30 pm",
   "reserve": "Reservations recommended",
   "music": null,
   "source": "https://www.yousneakypickle.com/",
   "confidence": "high",
   "why": "Plant-forward cooking in the Bywater, and a local neighborhood night away from the crowds.",
   "tags": [
    "veg",
    "locals",
    "hidden"
   ]
  },
  {
   "id": "cure",
   "name": "Cure",
   "cats": [
    "date",
    "drink"
   ],
   "area": "Uptown",
   "price": "$$–$$$",
   "phone": "504-302-2357",
   "address": "4905 Freret St",
   "note": "James Beard–winning cocktail bar, opened 2009. Rideshare home.",
   "url": "https://www.curenola.com",
   "coords": [
    29.93503,
    -90.10755
   ],
   "hours": {
    "mon": [
     [
      "16:00",
      "23:00"
     ]
    ],
    "tue": [
     [
      "16:00",
      "23:00"
     ]
    ],
    "wed": [
     [
      "16:00",
      "23:00"
     ]
    ],
    "thu": [
     [
      "16:00",
      "23:00"
     ]
    ],
    "fri": [
     [
      "15:00",
      "00:00"
     ]
    ],
    "sat": [
     [
      "15:00",
      "00:00"
     ]
    ],
    "sun": [
     [
      "16:00",
      "23:00"
     ]
    ]
   },
   "hoursText": "Sun–Thu 4–11 pm; Fri–Sat 3 pm–midnight",
   "reserve": "Reservations recommended",
   "music": null,
   "source": "https://www.curenola.com/",
   "confidence": "high",
   "why": "A pioneer of the city's craft-cocktail scene. A grown-up night off the tourist path.",
   "tags": [
    "locals",
    "hidden",
    "indoor"
   ]
  },
  {
   "id": "bayoubar",
   "name": "Bayou Bar",
   "cats": [
    "date",
    "drink",
    "jazz"
   ],
   "area": "Garden District",
   "price": "$$–$$$",
   "phone": "504-323-1500",
   "address": "2031 St Charles Ave (Pontchartrain Hotel)",
   "note": "Classy, low-key jazz cocktails. Live music Tuesday–Saturday. Streetcar out, rideshare back.",
   "url": "https://thepontchartrainhotel.com/food-drink/bayou-bar/",
   "coords": [
    29.93508,
    -90.07969
   ],
   "hours": {
    "mon": [
     [
      "11:00",
      "23:00"
     ]
    ],
    "tue": [
     [
      "11:00",
      "23:00"
     ]
    ],
    "wed": [
     [
      "11:00",
      "23:00"
     ]
    ],
    "thu": [
     [
      "11:00",
      "23:00"
     ]
    ],
    "fri": [
     [
      "11:00",
      "00:00"
     ]
    ],
    "sat": [
     [
      "11:00",
      "00:00"
     ]
    ],
    "sun": [
     [
      "11:00",
      "23:00"
     ]
    ]
   },
   "hoursText": "Sun–Thu 11 am–11 pm; Fri–Sat 11 am–midnight",
   "reserve": "Walk-in only",
   "music": "Live music Tue–Sat evenings, no cover. The official page gives no set times; past schedules ran about 7–10 pm, so check the Bayou Bar music calendar.",
   "source": "https://thepontchartrainhotel.com/food-drink/bayou-bar/",
   "confidence": "medium",
   "why": "A classy hotel bar with live music and no cover. The best spot for a low-key jazz date.",
   "tags": [
    "indoor"
   ]
  },
  {
   "id": "bacchanal",
   "name": "Bacchanal Wine",
   "cats": [
    "drink",
    "jazz",
    "date"
   ],
   "area": "Bywater",
   "price": "$$–$$$",
   "phone": "504-948-9111",
   "address": "600 Poland Ave",
   "note": "Wine garden with live music. 21+, no reservations. Rideshare late.",
   "url": "https://www.bacchanalwine.com",
   "coords": [
    29.95978,
    -90.03324
   ],
   "hours": {
    "mon": [
     [
      "16:00",
      "22:00"
     ]
    ],
    "tue": [
     [
      "16:00",
      "22:00"
     ]
    ],
    "wed": [
     [
      "16:00",
      "22:00"
     ]
    ],
    "thu": [
     [
      "16:00",
      "22:00"
     ]
    ],
    "fri": [
     [
      "12:00",
      "23:00"
     ]
    ],
    "sat": [
     [
      "12:00",
      "23:00"
     ]
    ],
    "sun": [
     [
      "12:00",
      "22:00"
     ]
    ]
   },
   "hoursText": "Mon–Thu 4–10 pm; Fri–Sat noon–11 pm; Sun noon–10 pm",
   "reserve": "No reservations",
   "music": "Live music in the backyard every day it's open, usually two sets a day (jazz, Latin, gypsy-swing). Set times are posted on bacchanalwine.com/music and were not retrievable, so check there the same day.",
   "source": "https://www.bacchanalwine.com/",
   "confidence": "high",
   "why": "Wine, a backyard band, and string lights. The locals' favorite night out.",
   "tags": [
    "locals",
    "hidden",
    "sunset"
   ]
  },
  {
   "id": "patobriens",
   "name": "Pat O'Brien's",
   "cats": [
    "party",
    "drink"
   ],
   "area": "French Quarter",
   "price": "$$",
   "phone": "504-525-4823",
   "address": "718 St Peter St",
   "note": "The famous courtyard and Hurricane. Hurricanes are strong; pace them.",
   "url": "https://www.patobriens.com",
   "coords": [
    29.95809,
    -90.06549
   ],
   "hours": {
    "mon": [
     [
      "16:00",
      "00:00"
     ]
    ],
    "tue": [],
    "wed": [
     [
      "12:00",
      "00:00"
     ]
    ],
    "thu": [
     [
      "12:00",
      "00:00"
     ]
    ],
    "fri": [
     [
      "12:00",
      "02:00"
     ]
    ],
    "sat": [
     [
      "12:00",
      "02:00"
     ]
    ],
    "sun": [
     [
      "12:00",
      "00:00"
     ]
    ]
   },
   "hoursText": "Bar: Mon 4 pm–midnight; Wed, Thu, Sun noon–midnight; Fri–Sat noon–2 am; closed Tue",
   "reserve": "Walk-in only",
   "music": "Dueling Pianos lounge: Mon 6 pm–midnight; Wed–Thu 4 pm–midnight; Fri–Sat 1 pm–2 am; Sun 5:30 pm–midnight; closed Tue. Doors open 30 minutes before the show.",
   "source": "https://www.patobriens.com/",
   "confidence": "high",
   "why": "Home of the Hurricane and the flaming fountain. Touristy, but you have to do it once.",
   "tags": [
    "indoor"
   ]
  },
  {
   "id": "cooter",
   "name": "Cooter Brown's",
   "cats": [
    "sports",
    "drink"
   ],
   "area": "Uptown",
   "price": "$$",
   "phone": "504-866-9104",
   "address": "509 S Carrollton Ave",
   "note": "Where to watch a Saints game. 84 taps, 21+.",
   "url": "https://www.cooterbrowns.com",
   "coords": [
    29.94253,
    -90.13439
   ],
   "hours": {
    "mon": [
     [
      "11:00",
      "01:00"
     ]
    ],
    "tue": [
     [
      "11:00",
      "01:00"
     ]
    ],
    "wed": [
     [
      "11:00",
      "01:00"
     ]
    ],
    "thu": [
     [
      "11:00",
      "01:00"
     ]
    ],
    "fri": [
     [
      "11:00",
      "01:00"
     ]
    ],
    "sat": [
     [
      "11:00",
      "01:00"
     ]
    ],
    "sun": [
     [
      "11:00",
      "01:00"
     ]
    ]
   },
   "hoursText": "Daily 11 am–1 am",
   "reserve": "Walk-in only",
   "music": null,
   "source": "https://www.cooterbrowns.com/",
   "confidence": "high",
   "why": "84 taps, the game on every screen, and a true Uptown crowd.",
   "tags": [
    "locals",
    "indoor"
   ]
  },
  {
   "id": "preshall",
   "name": "Preservation Hall",
   "cats": [
    "jazz"
   ],
   "area": "French Quarter",
   "price": "$$–$$$",
   "phone": "504-522-2841",
   "address": "726 St Peter St",
   "note": "Intimate acoustic traditional jazz since 1961. Reserve a set.",
   "url": "https://www.preservationhall.com",
   "coords": [
    29.9583,
    -90.06543
   ],
   "hours": {
    "mon": [
     [
      "16:40",
      "21:30"
     ]
    ],
    "tue": [
     [
      "16:40",
      "21:30"
     ]
    ],
    "wed": [
     [
      "16:40",
      "21:30"
     ]
    ],
    "thu": [
     [
      "16:40",
      "21:30"
     ]
    ],
    "fri": [
     [
      "16:40",
      "21:30"
     ]
    ],
    "sat": [
     [
      "14:10",
      "21:30"
     ]
    ],
    "sun": [
     [
      "14:10",
      "21:30"
     ]
    ]
   },
   "hoursText": "45-minute shows nightly at 5:00, 6:15, 7:30 and 8:45pm. Sat and Sun add 2:30 and 3:45pm matinee sets. Doors open about 20 minutes before each show. A few nights in Oct 2026 drop one set (Oct 15, 22, 27, 28).",
   "reserve": "Tickets required",
   "music": null,
   "source": "https://www.preservationhall.com/calendar/ ; https://www.preservationhall.com/faq/",
   "confidence": "high",
   "why": "Acoustic traditional jazz in an 18th-century room, played the way it has been since 1961. Non-negotiable.",
   "tags": [
    "indoor"
   ]
  },
  {
   "id": "snug",
   "name": "Snug Harbor",
   "cats": [
    "jazz",
    "date"
   ],
   "area": "Marigny",
   "price": "$$–$$$",
   "phone": null,
   "address": "626 Frenchmen St",
   "note": "Seated listening room with serious musicians. Check the calendar for set times.",
   "url": "https://www.snugjazz.com",
   "coords": [
    29.96413,
    -90.05792
   ],
   "hours": {
    "mon": [
     [
      "17:00",
      "22:00"
     ]
    ],
    "tue": [
     [
      "17:00",
      "22:00"
     ]
    ],
    "wed": [
     [
      "17:00",
      "22:00"
     ]
    ],
    "thu": [
     [
      "17:00",
      "22:00"
     ]
    ],
    "fri": [
     [
      "17:00",
      "23:00"
     ]
    ],
    "sat": [
     [
      "17:00",
      "23:00"
     ]
    ],
    "sun": [
     [
      "17:00",
      "22:00"
     ]
    ]
   },
   "hoursText": "Dining room is open Sun–Thu 5–10pm and Fri–Sat 5–11pm. The Music Room has two shows nightly at 7:30 and 9:30pm. Some days add an early happy-hour or matinee set (e.g. Sat 4:30pm, Wed 5pm, Sun 3pm 'Nickel-A-Dance').",
   "reserve": "Tickets required",
   "music": null,
   "source": "https://www.snugjazz.com/ ; https://snugjazz.com/events/ ; https://www.snugjazz.com/faq",
   "confidence": "high",
   "why": "The city's serious jazz club. Sit down, stay quiet, and hear world-class players.",
   "tags": [
    "locals",
    "hidden",
    "indoor"
   ]
  },
  {
   "id": "dba",
   "name": "d.b.a.",
   "cats": [
    "jazz"
   ],
   "area": "Marigny",
   "price": "$$",
   "phone": null,
   "address": "618 Frenchmen St",
   "note": "Bar with live bands. A good second stop after a ticketed show.",
   "url": "https://www.dbaneworleans.com/",
   "coords": [
    29.96394,
    -90.05804
   ],
   "hours": {
    "mon": [
     [
      "18:00",
      "01:00"
     ]
    ],
    "tue": [
     [
      "18:00",
      "01:00"
     ]
    ],
    "wed": [
     [
      "18:00",
      "01:00"
     ]
    ],
    "thu": [
     [
      "18:00",
      "01:00"
     ]
    ],
    "fri": [
     [
      "18:00",
      "01:00"
     ]
    ],
    "sat": [
     [
      "14:00",
      "01:00"
     ]
    ],
    "sun": [
     [
      "18:00",
      "01:00"
     ]
    ]
   },
   "hoursText": "Open daily 6pm–1am; Saturday opens at 2pm. Live local and regional bands play nightly. The site publishes no fixed set times. Older listings said 4pm–5am, so these hours look reduced.",
   "reserve": "Walk-in only",
   "music": null,
   "source": "https://www.dbaneworleans.com/",
   "confidence": "medium",
   "why": "Great local bands on Frenchmen in a bar with good beer and no attitude.",
   "tags": [
    "locals",
    "hidden",
    "indoor"
   ]
  },
  {
   "id": "spottedcat",
   "name": "The Spotted Cat",
   "cats": [
    "jazz"
   ],
   "area": "Marigny",
   "price": "$–$$",
   "phone": null,
   "address": "623 Frenchmen St",
   "note": "Tiny, packed, and energetic. Watch your belongings.",
   "url": "https://www.spottedcatmusicclub.com/",
   "coords": [
    29.96408,
    -90.05763
   ],
   "hours": {
    "mon": [
     [
      "14:00",
      "02:00"
     ]
    ],
    "tue": [
     [
      "14:00",
      "02:00"
     ]
    ],
    "wed": [
     [
      "14:00",
      "02:00"
     ]
    ],
    "thu": [
     [
      "14:00",
      "02:00"
     ]
    ],
    "fri": [
     [
      "14:00",
      "02:00"
     ]
    ],
    "sat": [
     [
      "14:00",
      "02:00"
     ]
    ],
    "sun": [
     [
      "14:00",
      "02:00"
     ]
    ]
   },
   "hoursText": "Open 7 days, 2pm–2am (site says times can change without notice). Three band sets daily, roughly afternoon, early evening and late night. Exact set times are not published; third-party guides cite about 2pm and 10pm.",
   "reserve": "Walk-in only",
   "music": null,
   "source": "https://www.spottedcatmusicclub.com/",
   "confidence": "medium",
   "why": "Tiny, sweaty, and packed with dancers. The most fun 20 square feet in New Orleans.",
   "tags": [
    "locals",
    "indoor"
   ]
  },
  {
   "id": "bourbono",
   "name": "Bourbon \"O\" Bar",
   "cats": [
    "party",
    "jazz"
   ],
   "area": "French Quarter",
   "price": "$$–$$$",
   "phone": null,
   "address": "730 Bourbon St (Bourbon Orleans Hotel)",
   "note": "A gentler Bourbon Street stop. 21+, candlelit, live music every day until midnight.",
   "url": "https://www.bourbonorleans.com/dining/bourbon-o-bar/",
   "coords": [
    29.95911,
    -90.06511
   ],
   "hours": {
    "mon": [
     [
      "13:00",
      "00:00"
     ]
    ],
    "tue": [
     [
      "13:00",
      "00:00"
     ]
    ],
    "wed": [
     [
      "13:00",
      "00:00"
     ]
    ],
    "thu": [
     [
      "13:00",
      "00:00"
     ]
    ],
    "fri": [
     [
      "13:00",
      "00:00"
     ]
    ],
    "sat": [
     [
      "13:00",
      "00:00"
     ]
    ],
    "sun": [
     [
      "13:00",
      "00:00"
     ]
    ]
   },
   "hoursText": "Bar open daily 1pm–midnight. Live jazz every day 4pm–midnight. Food is served Mon–Wed 1:30–9pm and Thu–Sun 1:30–10pm.",
   "reserve": "Walk-in only",
   "music": null,
   "source": "https://www.bourbonorleans.com/dining/bourbon-o-bar/",
   "confidence": "high",
   "why": "A calm, candlelit jazz bar right on Bourbon. The gentle way to start the party.",
   "tags": [
    "indoor"
   ]
  },
  {
   "id": "voodoo",
   "name": "Historic Voodoo Museum",
   "cats": [
    "spooky",
    "history"
   ],
   "area": "French Quarter",
   "price": "~$10",
   "phone": "504-680-0128",
   "address": "724 Dumaine St",
   "note": "Tiny, artifact-packed, open since 1972. About 45 minutes.",
   "url": "https://www.voodoomuseum.com/",
   "coords": [
    29.95982,
    -90.06379
   ],
   "hours": {
    "mon": [
     [
      "10:00",
      "18:00"
     ]
    ],
    "tue": [
     [
      "10:00",
      "18:00"
     ]
    ],
    "wed": [
     [
      "10:00",
      "18:00"
     ]
    ],
    "thu": [
     [
      "10:00",
      "18:00"
     ]
    ],
    "fri": [
     [
      "10:00",
      "19:00"
     ]
    ],
    "sat": [
     [
      "10:00",
      "19:00"
     ]
    ],
    "sun": [
     [
      "10:00",
      "19:00"
     ]
    ]
   },
   "hoursText": "Mon–Thu 10:00–18:00, Fri–Sun 10:00–19:00. In season it may stay open later while it is light out. Closed Christmas Day and Mardi Gras Day.",
   "reserve": "Walk-in only",
   "music": null,
   "source": "https://www.voodoomuseum.com/",
   "confidence": "high",
   "why": "Small, strange, and authentic. Twenty minutes in rooms full of altars and artifacts.",
   "tags": [
    "hidden",
    "indoor"
   ]
  },
  {
   "id": "hnoc",
   "name": "Historic New Orleans Collection",
   "cats": [
    "history"
   ],
   "area": "French Quarter",
   "price": "Free–$",
   "phone": "504-523-4662",
   "address": "520 Royal St",
   "note": "Serious, well-curated city history right on the antiques street.",
   "url": "https://www.hnoc.org/visit",
   "coords": [
    29.95669,
    -90.06571
   ],
   "hours": {
    "mon": [],
    "tue": [
     [
      "09:30",
      "16:30"
     ]
    ],
    "wed": [
     [
      "09:30",
      "16:30"
     ]
    ],
    "thu": [
     [
      "09:30",
      "16:30"
     ]
    ],
    "fri": [
     [
      "09:30",
      "16:30"
     ]
    ],
    "sat": [
     [
      "09:30",
      "16:30"
     ]
    ],
    "sun": [
     [
      "10:30",
      "16:30"
     ]
    ]
   },
   "hoursText": "520 Royal St galleries: Tue–Sat 9:30–16:30, Sun 10:30–16:30, closed Mon. The Williams Research Center at 410 Chartres St is open Tue–Sat 9:30–16:30 and closed Sun–Mon.",
   "reserve": "Tickets required",
   "music": null,
   "source": "https://www.hnoc.org/visit",
   "confidence": "high",
   "why": "Free, beautifully done city history. The context that makes everything else make sense.",
   "tags": [
    "indoor"
   ]
  },
  {
   "id": "msrau",
   "name": "M.S. Rau",
   "cats": [
    "shop"
   ],
   "area": "French Quarter",
   "price": "$$$$",
   "phone": null,
   "address": "622 Royal St",
   "note": "Fine art and antiques, a gallery-museum to browse.",
   "url": "https://www.rauantiques.com/",
   "coords": [
    29.95758,
    -90.065
   ],
   "hours": {
    "mon": [
     [
      "09:00",
      "17:15"
     ]
    ],
    "tue": [
     [
      "09:00",
      "17:15"
     ]
    ],
    "wed": [
     [
      "09:00",
      "17:15"
     ]
    ],
    "thu": [
     [
      "09:00",
      "17:15"
     ]
    ],
    "fri": [
     [
      "09:00",
      "17:15"
     ]
    ],
    "sat": [
     [
      "09:00",
      "17:15"
     ]
    ],
    "sun": []
   },
   "hoursText": "Mon–Sat 9:00am–5:15pm. Closed Sunday and major holidays. After-hours visits by appointment.",
   "reserve": "Walk-in only",
   "music": null,
   "source": "https://www.rauantiques.com/ (hours via search snippet of official site/blog)",
   "confidence": "high",
   "why": "Museum-grade antiques and actual Monets, free to browse.",
   "tags": [
    "hidden",
    "indoor"
   ]
  },
  {
   "id": "moss",
   "name": "Moss Antiques",
   "cats": [
    "shop"
   ],
   "area": "French Quarter",
   "price": "$$$",
   "phone": "504-522-3981",
   "address": "411 Royal St",
   "note": "Long-established Royal Street dealer.",
   "url": "https://www.mossantiques.com/",
   "coords": [
    29.95586,
    -90.06675
   ],
   "hours": {
    "mon": [
     [
      "09:30",
      "17:00"
     ]
    ],
    "tue": [
     [
      "09:30",
      "17:00"
     ]
    ],
    "wed": [
     [
      "09:30",
      "17:00"
     ]
    ],
    "thu": [
     [
      "09:30",
      "17:00"
     ]
    ],
    "fri": [
     [
      "09:30",
      "17:00"
     ]
    ],
    "sat": [
     [
      "09:30",
      "17:00"
     ]
    ],
    "sun": []
   },
   "hoursText": "Mon–Sat 9:30am–5:00pm; Sunday by appointment only.",
   "reserve": "Walk-in only",
   "music": null,
   "source": "https://www.mossantiques.com/contact-us/",
   "confidence": "high",
   "why": "Old-line antique jewelry and silver. The classic Royal Street treasure shop.",
   "tags": [
    "indoor"
   ]
  },
  {
   "id": "garden",
   "name": "Garden District walk",
   "cats": [
    "date",
    "history",
    "nature"
   ],
   "area": "Garden District",
   "price": "Free",
   "phone": null,
   "address": "Washington Ave & Prytania St",
   "note": "Self-guided, 1.5–2 miles, 2–3 hours. Best late afternoon. Private homes, view from the sidewalk. Lafayette Cemetery No. 1 reopened Oct 1, 2026 for small guided tours only; book at prcno.org.",
   "url": "https://prcno.org/",
   "coords": [
    29.92868,
    -90.08441
   ],
   "hours": {
    "mon": [
     [
      "07:00",
      "18:30"
     ]
    ],
    "tue": [
     [
      "07:00",
      "18:30"
     ]
    ],
    "wed": [
     [
      "07:00",
      "18:30"
     ]
    ],
    "thu": [
     [
      "07:00",
      "18:30"
     ]
    ],
    "fri": [
     [
      "07:00",
      "18:30"
     ]
    ],
    "sat": [
     [
      "07:00",
      "18:30"
     ]
    ],
    "sun": [
     [
      "07:00",
      "18:30"
     ]
    ]
   },
   "hoursText": "The Garden District streets are a public self-guided walk at any time; hours shown are approximate daylight for mid-October. NEW: Lafayette Cemetery No. 1 reopened Oct 1, 2026 after 7 years, for guided tours only through the Preservation Resource Center / Save Our Cemeteries. Tours are limited to six sessions a day, 16 people or fewer each. Specific times and price were not published.",
   "reserve": "Walk-in only",
   "music": null,
   "source": "https://www.wlox.com/2026/10/04/historic-new-orleans-cemetery-reopens-tours-after-7-year-closure/",
   "confidence": "medium",
   "why": "Antebellum mansions under live oaks. One of the prettiest walks in America.",
   "tags": [
    "hidden",
    "nature",
    "sunset"
   ]
  }
 ],
 "version": 3,
 "catLabels": {
  "coffee": "Coffee & beignets",
  "eat": "Eats",
  "drink": "Cocktails",
  "jazz": "Live music",
  "date": "Date night",
  "party": "Bourbon & party",
  "sports": "Sports bar",
  "history": "History",
  "spooky": "Voodoo & curiosities",
  "shop": "Antiques & shops",
  "nature": "Green space"
 },
 "catGroups": [
  [
   "Eat & drink",
   [
    "coffee",
    "eat",
    "drink"
   ]
  ],
  [
   "Music & nights",
   [
    "jazz",
    "party",
    "date",
    "sports"
   ]
  ],
  [
   "See & do",
   [
    "history",
    "spooky",
    "shop",
    "nature"
   ]
  ]
 ],
 "catWhy": {
  "coffee": "Beignets and chicory café au lait are the city's morning ritual, and the cheapest great moment of the trip. Go early or late to skip the line.",
  "eat": "Proof a vegetarian can eat like a local here: plant-based Creole dishes and po-boys.",
  "drink": "New Orleans invented half the classic cocktails. These are bars where the drinks are best and you can still hear each other.",
  "jazz": "The reason to come. Live trad jazz in small rooms, most of it for the price of a drink.",
  "date": "Candlelight, courtyards, river views.",
  "party": "One loud night is part of the deal. Start with the better-run Bourbon stops.",
  "sports": "A packed bar on game day is pure New Orleans.",
  "history": "Three hundred years of Creole, African, French and Spanish history, told by people who take it seriously.",
  "spooky": "Voodoo, cemeteries and the macabre: the city's spiritual side.",
  "shop": "Royal Street's antique dealers are museum-grade. Browsing is free.",
  "nature": "Live oaks and lagoons within a short ride of the Quarter."
 },
 "personas": [
  {
   "key": "sage",
   "name": "Sage",
   "color": "#2F6F8F",
   "tag": "History, jazz and keeping everyone on time",
   "line": "I'll take the history and the real jazz. Somebody has to read the plaques.",
   "cats": [
    "history",
    "jazz",
    "sports"
   ],
   "mood": "history"
  },
  {
   "key": "muse",
   "name": "Muse",
   "color": "#B8326A",
   "tag": "Romance, cocktails and the late, late night",
   "line": "Candlelight, balconies and a band that knows my name. Follow me.",
   "cats": [
    "date",
    "party",
    "drink"
   ],
   "mood": "romantic"
  },
  {
   "key": "scout",
   "name": "Scout",
   "color": "#2E7D4F",
   "tag": "Beignets, parks and wide-eyed wonder",
   "line": "Trees! Water! A pastry before ten! This is my kind of day.",
   "cats": [
    "nature",
    "coffee"
   ],
   "mood": "nature"
  },
  {
   "key": "gourmand",
   "name": "Gourmand",
   "color": "#A8641A",
   "tag": "Food, oddities and bargains",
   "line": "Picture it: a plant-based gumbo, a tarot reader and a bargain. I know where to go.",
   "cats": [
    "eat",
    "spooky",
    "shop"
   ],
   "mood": "locals"
  }
 ],
 "quips": {
  "home": [
   [
    "sage",
    "Check the hours, drink water, and tell somebody where you are going."
   ],
   [
    "muse",
    "This city was made for evenings. Start late and stay later."
   ],
   [
    "scout",
    "A beignet is a doughnut that went to finishing school."
   ],
   [
    "gourmand",
    "Eat where the line is made of locals."
   ]
  ],
  "explore": [
   [
    "sage",
    "Pick a collection. This is not a buffet."
   ],
   [
    "muse",
    "I always start in Romantic and somehow end up in Tonight."
   ],
   [
    "scout",
    "Straight to Green & quiet. My feet insist."
   ]
  ],
  "map": [
   [
    "scout",
    "Tap the ring to change how far you will walk."
   ],
   [
    "sage",
    "After dark, take a car for anything unfamiliar."
   ]
  ],
  "saved": [
   [
    "gourmand",
    "Everything you saved lives here. Vote, then go."
   ],
   [
    "muse",
    "Mark it visited and collect the stamp. A lady collects."
   ]
  ],
  "help": [
   [
    "sage",
    "Read this once. Then stop asking where the map went."
   ]
  ],
  "time": [
   [
    "sage",
    "Every building here has a story. Pick a chapter."
   ]
  ],
  "col": [
   [
    "muse",
    "Open places come first. You are welcome."
   ]
  ]
 },
 "moodQuips": {
  "romantic": [
   "muse",
   "Candlelight, a slow walk, a little jazz. Trust me."
  ],
  "locals": [
   "gourmand",
   "This is where the real people go. No tour buses."
  ],
  "nature": [
   "scout",
   "Trees! Water! Maybe a turtle!"
  ],
  "history": [
   "sage",
   "Read the plaques. All of them. There will be a quiz."
  ],
  "veg": [
   "gourmand",
   "No meat, all flavor."
  ],
  "jazz": [
   "sage",
   "Real musicians in small rooms. Tip the band and do not talk during the solo."
  ],
  "hidden": [
   "muse",
   "The best spots are the ones nobody tells you about."
  ],
  "foodie": [
   "gourmand",
   "Order the thing you cannot pronounce."
  ]
 },
 "stamps": [
  {
   "k": "beignet",
   "t": "Beignet run",
   "g": "BG",
   "ids": [
    "cdm",
    "cafebeignet",
    "cdmpark",
    "mfth"
   ]
  },
  {
   "k": "jazz",
   "t": "Jazz night",
   "g": "JZ",
   "cats": [
    "jazz"
   ]
  },
  {
   "k": "history",
   "t": "Historic quarter",
   "g": "HX",
   "cats": [
    "history"
   ]
  },
  {
   "k": "curio",
   "t": "Curiosities",
   "g": "CU",
   "cats": [
    "spooky"
   ]
  },
  {
   "k": "green",
   "t": "Into the green",
   "g": "GR",
   "cats": [
    "nature"
   ]
  },
  {
   "k": "local",
   "t": "Like a local",
   "g": "LC",
   "tags": [
    "locals"
   ]
  },
  {
   "k": "veg",
   "t": "Plant-forward",
   "g": "VG",
   "tags": [
    "veg"
   ]
  },
  {
   "k": "night",
   "t": "Cocktail hour",
   "g": "CK",
   "cats": [
    "drink"
   ]
  },
  {
   "k": "date",
   "t": "Date night",
   "g": "DN",
   "cats": [
    "date"
   ]
  },
  {
   "k": "shop",
   "t": "Antique hunt",
   "g": "AQ",
   "cats": [
    "shop"
   ]
  }
 ],
 "eras": [
  {
   "y": "Before 1718",
   "t": "Long before the city",
   "x": "Chitimacha, Choctaw, Houma, and other Native peoples lived and traded across this delta. A short portage between Bayou St. John and the river was an established route, and it's a big reason the French chose this spot.",
   "q": [
    "Bayou St. John"
   ]
  },
  {
   "y": "1718",
   "t": "A French town on the river",
   "x": "Jean-Baptiste Le Moyne de Bienville founded Nouvelle-Orléans in 1718. The original grid is today's French Quarter, laid out around the Place d'Armes, now Jackson Square.",
   "q": [
    "Jackson Square"
   ],
   "ids": [
    "hnoc"
   ]
  },
  {
   "y": "1724",
   "t": "The Code Noir",
   "x": "Louisiana's Code Noir set harsh rules for enslaved Africans and limited the rights of free people of color. Slavery shaped the colony's economy and culture for the next 140 years.",
   "ids": [
    "whitney"
   ],
   "q": [
    "f.p.c",
    "Free People"
   ]
  },
  {
   "y": "1762–1803",
   "t": "Spanish New Orleans",
   "x": "France handed Louisiana to Spain in 1762. Fires in 1788 and 1794 burned much of the town, and it was rebuilt in brick and stucco with courtyards and iron balconies. Much of the 'French' Quarter is Spanish-era architecture.",
   "q": [
    "Cabildo"
   ],
   "ids": [
    "royal"
   ]
  },
  {
   "y": "1803",
   "t": "The Louisiana Purchase",
   "x": "The United States bought Louisiana from France. The formal transfer took place at the Cabildo on December 20, 1803.",
   "q": [
    "Cabildo"
   ]
  },
  {
   "y": "1815",
   "t": "The Battle of New Orleans",
   "x": "On January 8, 1815, Andrew Jackson's mixed force of soldiers, militia, free men of color, Choctaw allies, and Lafitte's privateers defeated the British at Chalmette.",
   "ids": [
    "chalmette",
    "cq-battle"
   ]
  },
  {
   "y": "1800s",
   "t": "Sundays at Congo Square",
   "x": "On Sunday afternoons, enslaved and free Africans gathered at Congo Square to drum, dance, sing, and trade. Those rhythms fed directly into the music that became jazz.",
   "q": [
    "Congo Square",
    "Backstreet"
   ]
  },
  {
   "y": "1892",
   "t": "Plessy's stand",
   "x": "Homer Plessy, a Creole shoemaker, was arrested on June 7, 1892 for sitting in a whites-only train car at Press and Royal Streets. The 1896 Plessy v. Ferguson ruling upheld segregation for nearly 60 years.",
   "q": [
    "f.p.c",
    "Free People"
   ],
   "ids": [
    "hnoc"
   ]
  },
  {
   "y": "1900s",
   "t": "Jazz is born",
   "x": "Buddy Bolden, Jelly Roll Morton, and a young Louis Armstrong (born here in 1901) blended blues, ragtime, brass band, and Caribbean rhythms into something new: jazz.",
   "ids": [
    "preshall",
    "snug",
    "fritzels"
   ],
   "q": [
    "Congo Square"
   ]
  },
  {
   "y": "1960",
   "t": "Ruby Bridges",
   "x": "On November 14, 1960, six-year-old Ruby Bridges walked into William Frantz Elementary under federal marshal protection, integrating the city's public schools.",
   "ids": [
    "hnoc"
   ],
   "q": [
    "Backstreet"
   ]
  },
  {
   "y": "2005",
   "t": "Katrina",
   "x": "Hurricane Katrina struck on August 29, 2005. Levee failures flooded about 80 percent of the city. Recovery took years, and many neighborhoods, musicians, and traditions came back stronger.",
   "q": [
    "Crescent Park",
    "St. Claude"
   ]
  },
  {
   "y": "Today",
   "t": "Living traditions",
   "x": "Second lines, brass bands, jazz funerals, and Black Masking Indian suits are still made and paraded by the communities that created them. You'll hear it on Frenchmen any night.",
   "q": [
    "Backstreet"
   ],
   "ids": [
    "dba",
    "spottedcat"
   ]
  }
 ],
 "areas": [
  [
   "French Quarter",
   [
    29.9584,
    -90.0644
   ],
   16
  ],
  [
   "Marigny & Frenchmen",
   [
    29.9645,
    -90.0577
   ],
   16
  ],
  [
   "Garden District",
   [
    29.9286,
    -90.0845
   ],
   15
  ],
  [
   "Uptown",
   [
    29.9344,
    -90.1055
   ],
   14
  ],
  [
   "Bywater",
   [
    29.9645,
    -90.0436
   ],
   15
  ],
  [
   "Warehouse & CBD",
   [
    29.9468,
    -90.0709
   ],
   15
  ]
 ],
 "celebration": {
  "title": "Celebration night",
  "sub": "One big evening, planned stop by stop",
  "steps": [
   [
    "18:00",
    "Celebration dinner",
    [
     "palmpine",
     "jewel"
    ],
    "Palm&Pine and Jewel of the South: check the day they are open."
   ],
   [
    "20:00",
    "Live set",
    [
     "preshall",
     "snug"
    ],
    "Book a set online where you can."
   ],
   [
    "21:45",
    "A toast",
    [
     "bourbono"
    ],
    "Candlelit, live jazz."
   ],
   [
    "23:00",
    "One more round",
    [
     "patobriens",
     "spottedcat"
    ],
    "Pace the Hurricanes."
   ],
   [
    "00:30",
    "Late-night beignets",
    [
     "cdm"
    ],
    "Check closing time that night."
   ]
  ]
 },
 "weather": {
  "lat": 29.95,
  "lng": -90.07
 },
 "tripDefaults": {
  "hotel": null
 }
};
