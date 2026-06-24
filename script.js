App.js

// =====================================================================
// OUTFIT PLANNER - FRONTEND LOGIC
// =====================================================================
// What this file does, in plain English:
//   1. Listens for the form submit (age + event).
//   2. Sends that to the backend server and waits for matching outfits.
//   3. Draws an outfit "card" for each result.
//   4. On each card: handles "Do you have this?" -> Yes/No
//        - Yes  -> shows a done message
//        - No   -> asks for a budget, then shows shopping links
// =====================================================================


// ---- STEP 1: Grab the HTML elements we'll need to read/update ----
const step1 = document.getElementById('step1');
const step2 = document.getElementById('step2');
const stepsNavItems = document.querySelectorAll('#stepsNav li');

const form = document.getElementById('detailsForm');
const ageInput = document.getElementById('ageInput');
const eventInput = document.getElementById('eventInput');

const resultsTitle = document.getElementById('resultsTitle');
const resultsSub = document.getElementById('resultsSub');
const resultsGrid = document.getElementById('resultsGrid');
const noticeBox = document.getElementById('notice');
const backButton = document.getElementById('backTo1');


// ---- STEP 2: Small bits of "content" data used while drawing the page ----

// One simple icon per outfit category. Swap these for real photos later.
const ICONS = {
  ethnic: '<svg viewBox="0 0 64 64"><path d="M32 6c-3 4-3 8 0 11-9 3-15 13-16 31h32C47 30 41 20 32 17c3-3 3-7 0-11z" fill="none" stroke="#e7c987" stroke-width="2"/><path d="M22 30q10 6 20 0" fill="none" stroke="#c97b63" stroke-width="1.5"/><path d="M20 40q12 6 24 0" fill="none" stroke="#c97b63" stroke-width="1.5"/></svg>',
  formal: '<svg viewBox="0 0 64 64"><path d="M24 10l8 6 8-6 10 6-4 8-6-3v27H20V21l-6 3-4-8z" fill="none" stroke="#e7c987" stroke-width="2" stroke-linejoin="round"/><path d="M32 16l-3 6 3 5 3-5z" fill="none" stroke="#c97b63" stroke-width="1.5" stroke-linejoin="round"/></svg>',
  casual: '<svg viewBox="0 0 64 64"><path d="M22 12l-10 6 4 8 6-3v25h20V23l6 3 4-8-10-6-6 4h-8z" fill="none" stroke="#e7c987" stroke-width="2" stroke-linejoin="round"/></svg>',
  party: '<svg viewBox="0 0 64 64"><path d="M24 8h16l2 14-4 4 8 26H22l8-26-4-4z" fill="none" stroke="#e7c987" stroke-width="2" stroke-linejoin="round"/><path d="M24 8q8 5 16 0" fill="none" stroke="#c97b63" stroke-width="1.5"/></svg>'
};

// Friendly text for each event, used in the results heading
const EVENT_LABELS = {
  wedding: 'a wedding',
  festival: 'a festival',
  office: 'the office',
  interview: 'an interview',
  casual: 'a casual outing',
  party: 'a party',
  date: 'a date night'
};

// Shopping sites we will build search links for
const SHOPPING_SITES = [
  { name: 'Amazon', searchUrl: 'https://www.amazon.in/s?k=' },
  { name: 'Flipkart', searchUrl: 'https://www.flipkart.com/search?q=' },
  { name: 'Meesho', searchUrl: 'https://www.meesho.com/search?q=' }
];


// ---- STEP 3: Switching between Step 1 (the form) and Step 2 (results) ----
function goToStep(stepNumber) {
  step1.classList.toggle('active', stepNumber === 1);
  step2.classList.toggle('active', stepNumber === 2);

  stepsNavItems.forEach(function (item) {
    const itemStep = Number(item.dataset.step);
    item.classList.toggle('active', itemStep === stepNumber);
    item.classList.toggle('done', itemStep < stepNumber);
  });

  window.scrollTo({ top: 0, behavior: 'smooth' });
}


// ---- STEP 4: Ask the backend server for outfits ----
// This calls our Express route: GET /api/outfits?age=..&event=..
async function getOutfitsFromServer(age, event) {
  const url = 'http://localhost:4000/api/outfits?age=' + age + '&event=' + event;
  const response = await fetch(url);

  if (!response.ok) {
    throw new Error('Server responded with an error.');
  }

  const data = await response.json(); // looks like: { results: [...], relaxed: true/false }
  return data;
}


// ---- STEP 5: Handle the form submit ----
form.addEventListener('submit', async function (event) {
  event.preventDefault(); // stop the browser from refreshing the page

  const age = Number(ageInput.value);
  const chosenEvent = eventInput.value;

  let data;
  try {
    data = await getOutfitsFromServer(age, chosenEvent);
  } catch (error) {
    alert('Could not reach the server. Make sure the backend is running (npm start in the backend folder).');
    return;
  }

  const outfits = data.results;
  const wasRelaxed = data.relaxed;

  // Update the results heading
  resultsTitle.textContent = 'Looks for ' + EVENT_LABELS[chosenEvent];
  resultsSub.textContent = 'Age ' + age;

  // Show a small notice if we had to loosen the age match
  if (wasRelaxed) {
    noticeBox.hidden = false;
    noticeBox.textContent = 'No exact age match yet, here are the closest picks for this occasion.';
  } else {
    noticeBox.hidden = true;
  }

  drawOutfitCards(outfits, chosenEvent);
  goToStep(2);
});

backButton.addEventListener('click', function () {
  goToStep(1);
});


// ---- STEP 6: Draw one card per outfit on the results page ----
function drawOutfitCards(outfits, event) {
  resultsGrid.innerHTML = ''; // clear any old cards first

  outfits.forEach(function (outfit) {
    const card = createOutfitCard(outfit, event);
    resultsGrid.appendChild(card);
  });
}

function createOutfitCard(outfit, event) {
  const card = document.createElement('article');
  card.className = 'card';

  const icon = ICONS[outfit.category] || ICONS.casual;

  card.innerHTML =
    '<div class="iconWrap">' + icon + '</div>' +
    '<span class="tag">' + outfit.event + '</span>' +
    '<h3>' + outfit.name + '</h3>' +
    '<p class="desc">' + outfit.desc + '</p>' +

    '<div class="ownQuestion">' +
      '<span>Already have this?</span>' +
      '<div class="btnRow">' +
        '<button type="button" class="yesBtn">Yes</button>' +
        '<button type="button" class="noBtn">No</button>' +
      '</div>' +
    '</div>' +

    '<div class="ownedMsg" hidden>You\'re set &mdash; enjoy the occasion.</div>' +

    '<div class="budgetBox" hidden>' +
      '<label>Your budget (&#8377;)</label>' +
      '<div class="budgetRow">' +
        '<input type="number" min="100" step="50" class="budgetInput" placeholder="e.g. 1500" />' +
        '<button type="button" class="findShopsBtn">Show shops</button>' +
      '</div>' +
      '<div class="shopLinks" hidden></div>' +
    '</div>';

  setupCardButtons(card, outfit, event);
  return card;
}


// ---- STEP 7: Wire up the Yes / No / Show shops buttons on one card ----
function setupCardButtons(card, outfit, event) {
  const ownQuestion = card.querySelector('.ownQuestion');
  const ownedMsg = card.querySelector('.ownedMsg');
  const budgetBox = card.querySelector('.budgetBox');
  const yesBtn = card.querySelector('.yesBtn');
  const noBtn = card.querySelector('.noBtn');
  const findShopsBtn = card.querySelector('.findShopsBtn');
  const budgetInput = card.querySelector('.budgetInput');
  const shopLinksBox = card.querySelector('.shopLinks');

  // Case 1: user already owns this outfit
  yesBtn.addEventListener('click', function () {
    ownQuestion.hidden = true;
    ownedMsg.hidden = false;
  });

  // Case 2: user does NOT own it - ask for their budget instead
  noBtn.addEventListener('click', function () {
    ownQuestion.hidden = true;
    budgetBox.hidden = false;
    budgetInput.focus();
  });

  // Case 3: user typed a budget and clicked "Show shops"
  findShopsBtn.addEventListener('click', function () {
    const budget = Number(budgetInput.value);

    if (!budget || budget <= 0) {
      budgetInput.focus(); // nothing useful to show yet, stop here
      return;
    }

    shopLinksBox.innerHTML = buildShoppingLinksHTML(outfit, event, budget);
    shopLinksBox.hidden = false;
  });
}


// ---- STEP 8: Build the Amazon / Flipkart / Meesho search links ----
function buildShoppingLinksHTML(outfit, event, budget) {
  const searchText = outfit.keywords + ' for ' + event + ' under ' + budget;
  const encodedSearch = encodeURIComponent(searchText);

  let linksHTML = '';

  SHOPPING_SITES.forEach(function (site) {
    const fullUrl = site.searchUrl + encodedSearch;
    linksHTML +=
      '<a class="shopLink" href="' + fullUrl + '" target="_blank" rel="noopener noreferrer">' +
        '<span class="siteName">' + site.name + '</span>' +
        '<span class="arrow">search &rarr;</span>' +
      '</a>';
  });

  linksHTML +=
    '<p class="budgetNote">Searching for "' + outfit.keywords + '" near &#8377;' + budget +
    '. Use each site\'s price filter for an exact cap.</p>';

  return linksHTML;
}
Server.js

// =====================================================================
// OUTFIT PLANNER - BACKEND SERVER
// =====================================================================
// What this file does, in plain English:
//   1. Starts a small web server using Express.
//   2. Loads our outfit data from a JSON file (our "database").
//   3. Listens for requests like:  GET /api/outfits?age=24&event=wedding
//   4. Looks through the outfit list and sends back the matches.
//
// That's it. No database, no authentication - just enough to explain
// how a frontend talks to a backend.
// =====================================================================


// ---- STEP 1: Import the tools (packages) we need ----
const express = require('express'); // makes building a web server easy
const cors = require('cors');       // allows the frontend to call this server
const fs = require('fs');           // lets us read files from disk
const path = require('path');       // helps us build safe file paths


// ---- STEP 2: Create the server and set the port it will run on ----
const app = express();
const PORT = 4000;


// ---- STEP 3: Basic server setup ----
app.use(cors());                  // let other origins (like a frontend on a different port) call us
app.use(express.json());          // let us read JSON sent in request bodies

// Also serve our frontend folder, so we can open everything from ONE server
app.use(express.static(path.join(__dirname, '..', 'frontend')));


// ---- STEP 4: Load the outfit data once, when the server starts ----
// Think of outfits.json as our "database table".
const dataFilePath = path.join(__dirname, 'data', 'outfits.json');
const rawData = fs.readFileSync(dataFilePath, 'utf-8');
const outfitList = JSON.parse(rawData);

console.log('Loaded ' + outfitList.length + ' outfits from outfits.json');


// ---- STEP 5: The main route - find outfits by age + event ----
// Example request the frontend sends:
//   GET /api/outfits?age=24&event=wedding
app.get('/api/outfits', function (req, res) {

  // req.query holds anything after the "?" in the URL
  const age = Number(req.query.age);
  const event = req.query.event;

  // Always check the input before using it
  if (!age || !event) {
    res.status(400).json({ error: 'Please provide both "age" and "event".' });
    return;
  }

  // 5a) First, try to find outfits that match BOTH the event and the age range.
  // We use a plain for-loop here so each step is easy to follow.
  const exactMatches = [];
  for (let i = 0; i < outfitList.length; i++) {
    const outfit = outfitList[i];
    const eventMatches = outfit.event === event;
    const ageMatches = age >= outfit.ageMin && age <= outfit.ageMax;

    if (eventMatches && ageMatches) {
      exactMatches.push(outfit);
    }
  }

  // 5b) If we found exact matches, send them back and stop here.
  if (exactMatches.length > 0) {
    res.json({ results: exactMatches, relaxed: false });
    return;
  }

  // 5c) Otherwise, "relax" the rule: ignore age, just match the event.
  const eventOnlyMatches = [];
  for (let i = 0; i < outfitList.length; i++) {
    if (outfitList[i].event === event) {
      eventOnlyMatches.push(outfitList[i]);
    }
  }

  // "relaxed: true" tells the frontend "we had to loosen the age filter"
  res.json({ results: eventOnlyMatches, relaxed: true });
});


// ---- STEP 6: A small extra route to look up ONE outfit by its id ----
// Handy for testing, e.g. GET /api/outfits/3
app.get('/api/outfits/:id', function (req, res) {
  const outfitId = Number(req.params.id);

  let foundOutfit = null;
  for (let i = 0; i < outfitList.length; i++) {
    if (outfitList[i].id === outfitId) {
      foundOutfit = outfitList[i];
      break;
    }
  }

  if (!foundOutfit) {
    res.status(404).json({ error: 'No outfit found with that id.' });
    return;
  }

  res.json(foundOutfit);
});


// ---- STEP 7: Start the server ----
app.listen(PORT, function () {
  console.log('Server is running! Visit http://localhost:' + PORT);
});
Outfit.json
[
  { "id": 1,  "name": "Pastel Lehenga Set",     "desc": "Soft pastel lehenga with light embroidery, easy to move and dance in.", "event": "wedding",   "ageMin": 13, "ageMax": 25,  "category": "ethnic", "keywords": "pastel lehenga set" },
  { "id": 2,  "name": "Banarasi Silk Saree",    "desc": "Classic Banarasi weave in deep jewel tones for the grown-up guest look.", "event": "wedding",   "ageMin": 26, "ageMax": 45,  "category": "ethnic", "keywords": "banarasi silk saree" },
  { "id": 3,  "name": "Bandhgala Suit",         "desc": "Structured bandhgala jacket, sharp and traditional, no tie required.", "event": "wedding",   "ageMin": 18, "ageMax": 45,  "category": "formal", "keywords": "bandhgala suit" },
  { "id": 4,  "name": "Kanjeevaram Drape",      "desc": "Heavyweight Kanjeevaram silk for the senior-most seat near the mandap.", "event": "wedding",   "ageMin": 46, "ageMax": 100, "category": "ethnic", "keywords": "kanjeevaram silk saree" },
  { "id": 5,  "name": "Block-Print Kurta Set",  "desc": "Cotton block-print kurta with churidar, breathable and festival-ready.", "event": "festival",  "ageMin": 13, "ageMax": 35,  "category": "ethnic", "keywords": "block print kurta set" },
  { "id": 6,  "name": "Silk Kurta Pyjama",      "desc": "Rich silk kurta pyjama for a dressed-up festival evening.", "event": "festival",  "ageMin": 36, "ageMax": 100, "category": "ethnic", "keywords": "silk kurta pyjama" },
  { "id": 7,  "name": "Tailored Blazer Set",    "desc": "Single-breasted blazer with matching trousers, boardroom-sharp.", "event": "office",    "ageMin": 21, "ageMax": 60,  "category": "formal", "keywords": "tailored blazer set" },
  { "id": 8,  "name": "Crisp Shirt & Trousers", "desc": "Cotton shirt and straight trousers, the everyday office uniform done right.", "event": "office",    "ageMin": 18, "ageMax": 60,  "category": "formal", "keywords": "formal shirt trousers" },
  { "id": 9,  "name": "Smart Casual Co-ord",    "desc": "Matching shirt-and-pants co-ord for a relaxed but put-together desk day.", "event": "office",    "ageMin": 18, "ageMax": 30,  "category": "casual", "keywords": "smart casual co-ord set" },
  { "id": 10, "name": "Graphic Tee & Denims",   "desc": "Oversized graphic tee with straight denims, the weekend uniform.", "event": "casual",    "ageMin": 13, "ageMax": 30,  "category": "casual", "keywords": "oversized graphic tee denim" },
  { "id": 11, "name": "Linen Shirt & Chinos",   "desc": "Breathable linen shirt with tapered chinos for easy weekend polish.", "event": "casual",    "ageMin": 25, "ageMax": 55,  "category": "casual", "keywords": "linen shirt chinos" },
  { "id": 12, "name": "Comfort Co-ord Set",     "desc": "Soft jersey co-ord, built for errands, naps, and everything between.", "event": "casual",    "ageMin": 40, "ageMax": 100, "category": "casual", "keywords": "comfort co-ord set" },
  { "id": 13, "name": "Sequin Bodycon Dress",   "desc": "Sequinned bodycon dress that catches every bit of dance-floor light.", "event": "party",     "ageMin": 16, "ageMax": 32,  "category": "party",  "keywords": "sequin bodycon dress" },
  { "id": 14, "name": "Satin Slip Dress",       "desc": "Bias-cut satin slip, quiet glamour for a grown-up house party.", "event": "party",     "ageMin": 25, "ageMax": 50,  "category": "party",  "keywords": "satin slip dress" },
  { "id": 15, "name": "Velvet Shirt Combo",     "desc": "Velvet shirt with tailored trousers for a night that means business, then doesn't.", "event": "party",     "ageMin": 18, "ageMax": 45,  "category": "party",  "keywords": "velvet shirt party" },
  { "id": 16, "name": "Floral Wrap Dress",      "desc": "Wrap dress in a soft floral print, flattering, easy, first-date-proof.", "event": "date",      "ageMin": 18, "ageMax": 40,  "category": "party",  "keywords": "floral wrap dress" },
  { "id": 17, "name": "Knit Polo & Trousers",   "desc": "Fitted knit polo with tapered trousers, undone but not really.", "event": "date",      "ageMin": 18, "ageMax": 45,  "category": "casual", "keywords": "knit polo trousers" },
  { "id": 18, "name": "Structured Pantsuit",    "desc": "Monochrome pantsuit that reads composed, capable, hireable.", "event": "interview", "ageMin": 18, "ageMax": 60,  "category": "formal", "keywords": "structured pantsuit" },
  { "id": 19, "name": "Light Grey Suit",        "desc": "Single-breasted light grey suit, safe, sharp, says you prepared.", "event": "interview", "ageMin": 18, "ageMax": 60,  "category": "formal", "keywords": "light grey formal suit" }
]
Package.json
{
  "name": "outfit-planner-backend",
  "version": "1.0.0",
  "description": "REST API serving outfit data for the Outfit Planner frontend.",
  "main": "server.js",
  "scripts": {
    "start": "node server.js",
    "dev": "node --watch server.js"
  },
  "dependencies": {
    "cors": "^2.8.5",
    "express": "^4.19.2"
  }
}
