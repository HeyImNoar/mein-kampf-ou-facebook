const URL_FACEBOOK = "https://docs.google.com/spreadsheets/d/e/2PACX-1vTnydrhvq9oPxrenyHrglqOUc5rmF0DVywWds1BFFcNM2xDLNL_Yzc4FdcBNSqJ9ZQoTY1wI5nLe9sd/pub?gid=0&single=true&output=csv";

const URL_MEINKAMPF = "https://docs.google.com/spreadsheets/d/e/2PACX-1vTnydrhvq9oPxrenyHrglqOUc5rmF0DVywWds1BFFcNM2xDLNL_Yzc4FdcBNSqJ9ZQoTY1wI5nLe9sd/pub?gid=671395623&single=true&output=csv";

let citations = [];
let citationActuelle = null;
let score = 0;
let total = 0;
let aDejaRepondu = false;
let citationsAffichees = [];
const NOMBRE_QUESTIONS = 10;

// Éléments des écrans
const screenHome = document.getElementById("screen-home");
const screenGame = document.getElementById("screen-game");
const screenRules = document.getElementById("screen-rules");
const screenOptions = document.getElementById("screen-options");
const screenEnd = document.getElementById("screen-end");

// Boutons de navigation
const startButton = document.getElementById("start-button");
const rulesButton = document.getElementById("rules-button");
const optionsButton = document.getElementById("options-button");
const backFromRulesButton = document.getElementById("back-from-rules");
const backFromOptionsButton = document.getElementById("back-from-options");
const backFromGameButton = document.getElementById("back-from-game");
const replayButton = document.getElementById("replay-button");
const homeFromEndButton = document.getElementById("home-from-end-button");

// Éléments du jeu
const citationElement = document.getElementById("quote");
const scoreElement = document.getElementById("score");
const resultatElement = document.getElementById("result");
const finalScoreElement = document.getElementById("final-score");
const finalMessageElement = document.getElementById("final-message");

const boutonFacebook = document.getElementById("btn-facebook");
const boutonMeinkampf = document.getElementById("btn-meinkampf");

// Fonction pour afficher un écran et cacher les autres
function showScreen(screenId) {
  const screens = document.querySelectorAll(".screen");

  screens.forEach(function (screen) {
    screen.classList.add("hidden");
  });

  const screenToShow = document.getElementById(screenId);
  screenToShow.classList.remove("hidden");
}

// Navigation entre les écrans
startButton.addEventListener("click", function () {
  commencerPartie();
});

rulesButton.addEventListener("click", function () {
  showScreen("screen-rules");
});

optionsButton.addEventListener("click", function () {
  showScreen("screen-options");
});

backFromRulesButton.addEventListener("click", function () {
  showScreen("screen-home");
});

backFromOptionsButton.addEventListener("click", function () {
  showScreen("screen-home");
});

backFromGameButton.addEventListener("click", function () {
  showScreen("screen-home");
});

replayButton.addEventListener("click", function () {
  commencerPartie();
});

homeFromEndButton.addEventListener("click", function () {
  showScreen("screen-home");
});

// Chargement des citations depuis Google Sheets
async function chargerCitationsDepuisGoogleSheets() {
  citationElement.textContent = "Chargement des citations...";

  let citationsFacebook = [];
  let citationsMeinKampf = [];

  try {
    citationsFacebook = await chargerCsv(URL_FACEBOOK, "facebook");
    console.log("Citations Facebook chargées :", citationsFacebook);
  } catch (erreur) {
    console.error("Erreur Facebook :", erreur);
  }

  try {
    citationsMeinKampf = await chargerCsv(URL_MEINKAMPF, "meinkampf");
    console.log("Citations Mein Kampf chargées :", citationsMeinKampf);
  } catch (erreur) {
    console.error("Erreur Mein Kampf :", erreur);
  }

  citations = [...citationsFacebook, ...citationsMeinKampf];

  if (citations.length === 0) {
    citationElement.textContent = "Aucune citation trouvée dans les Google Sheets.";
    resultatElement.textContent = "Vérifie que les citations commencent bien à la ligne 2.";
    return;
  }

  afficherNouvelleCitation();
}

async function chargerCsv(url, source) {
  const reponse = await fetch(url);

  if (!reponse.ok) {
    throw new Error("Impossible de charger le CSV : " + url);
  }

  const texte = await reponse.text();
  const lignes = lireCsvComplet(texte);

  // On retire la première ligne de titre.
  // Facebook : profil | post | citation
  // Mein Kampf : citation
  const lignesSansTitre = lignes.slice(1);

  return lignesSansTitre
    .map(colonnes => {
      if (source === "facebook") {
        return {
          profil: nettoyerCellule(colonnes[0]),
          post: nettoyerCellule(colonnes[1]),
          citation: nettoyerCellule(colonnes[2]),
          source: "facebook"
        };
      }

      if (source === "meinkampf") {
        return {
          profil: "Mein Kampf",
          post: "",
          citation: nettoyerCellule(colonnes[0]),
          source: "meinkampf"
        };
      }

      return null;
    })
    .filter(item => item !== null)
    .filter(item => item.citation !== "")
    .filter(item => item.citation.toLowerCase() !== "citation")
    .filter(item => item.citation.toLowerCase() !== "com");
}

function nettoyerCellule(cellule) {
  if (cellule === undefined || cellule === null) {
    return "";
  }

  return cellule.trim();
}

function lireCsvComplet(texte) {
  const lignes = [];
  let ligne = [];
  let cellule = "";
  let dansGuillemets = false;

  for (let i = 0; i < texte.length; i++) {
    const caractere = texte[i];
    const prochainCaractere = texte[i + 1];

    if (caractere === '"' && dansGuillemets && prochainCaractere === '"') {
      cellule += '"';
      i++;
    } else if (caractere === '"') {
      dansGuillemets = !dansGuillemets;
    } else if (caractere === "," && !dansGuillemets) {
      ligne.push(cellule);
      cellule = "";
    } else if ((caractere === "\n" || caractere === "\r") && !dansGuillemets) {
      if (caractere === "\r" && prochainCaractere === "\n") {
        i++;
      }

      ligne.push(cellule);

      const ligneEstVide = ligne.every(cellule => cellule.trim() === "");

      if (!ligneEstVide) {
        lignes.push(ligne);
      }

      ligne = [];
      cellule = "";
    } else {
      cellule += caractere;
    }
  }

  ligne.push(cellule);

  const derniereLigneEstVide = ligne.every(cellule => cellule.trim() === "");

  if (!derniereLigneEstVide) {
    lignes.push(ligne);
  }

  return lignes;
}
async function commencerPartie() {
  score = 0;
  total = 0;
  aDejaRepondu = false;
  citationsAffichees = [];

  scoreElement.textContent = score;
  resultatElement.textContent = "";
  resultatElement.style.color = "";

  await chargerCitationsDepuisGoogleSheets();
  showScreen("screen-game");
}

function terminerPartie() {
  finalScoreElement.textContent = "Score final : " + score + " / " + NOMBRE_QUESTIONS;

  if (score === NOMBRE_QUESTIONS) {
    finalMessageElement.textContent = "Score parfait.";
  } else if (score >= 7) {
    finalMessageElement.textContent = "Très bon score.";
  } else if (score >= 4) {
    finalMessageElement.textContent = "Score moyen. La frontière est trouble";
  } else {
    finalMessageElement.textContent = "Score bas. On te laisse tirer tes propres conclusions.";
  }

  showScreen("screen-end");
}

function afficherNouvelleCitation() {
  let indexAleatoire;
  
  // Chercher un indice qui n'a pas encore été affiché
  do {
    indexAleatoire = Math.floor(Math.random() * citations.length);
  } while (citationsAffichees.includes(indexAleatoire));
  
  // Ajouter cet indice à la liste des citations affichées
  citationsAffichees.push(indexAleatoire);
  
  citationActuelle = citations[indexAleatoire];

  citationElement.textContent =
    citationActuelle.citation.charAt(0).toUpperCase() +
    citationActuelle.citation.slice(1).toLowerCase();

  resultatElement.textContent = "";
  resultatElement.style.color = "";

  document.body.classList.remove("flash-good", "flash-bad");

  document.querySelectorAll(".feedback-plus").forEach(element => {
    element.remove();
  });

  document.querySelectorAll("button").forEach(bouton => {
    bouton.classList.remove("button-correct", "button-wrong");
  });

  aDejaRepondu = false;
}

function montrerFeedbackCorrect(bouton) {
  document.body.classList.remove("flash-bad");
  document.body.classList.add("flash-good");

  bouton.classList.remove("button-wrong");
  bouton.classList.add("button-correct");

  const plusUn = document.createElement("span");
  plusUn.className = "feedback-plus";
  plusUn.textContent = "+1";
  bouton.appendChild(plusUn);

  setTimeout(() => {
    plusUn.remove();
    bouton.classList.remove("button-correct");
    document.body.classList.remove("flash-good");
  }, 700);
}

function montrerFeedbackIncorrect(bouton) {
  document.body.classList.remove("flash-good");
  document.body.classList.add("flash-bad");

  bouton.classList.remove("button-correct");
  bouton.classList.add("button-wrong");

  setTimeout(() => {
    bouton.classList.remove("button-wrong");
    document.body.classList.remove("flash-bad");
  }, 500);
}

function verifierReponse(reponseUtilisateur, boutonClique) {
  if (!citationActuelle) return;
  if (aDejaRepondu) return;

  aDejaRepondu = true;
  total++;

  if (reponseUtilisateur === citationActuelle.source) {
    score++;
    resultatElement.textContent = "Bonne réponse.";
    resultatElement.style.color = "#4caf50";
    montrerFeedbackCorrect(boutonClique);
  } else {
    resultatElement.textContent = "Mauvaise réponse.";
    resultatElement.style.color = "#ff5252";
    montrerFeedbackIncorrect(boutonClique);
  }

  scoreElement.textContent = score;

    setTimeout(() => {
    if (total >= NOMBRE_QUESTIONS) {
      terminerPartie();
    } else {
      afficherNouvelleCitation();
    }
  }, 1200);
}

// Boutons du jeu
boutonFacebook.addEventListener("click", () => {
  verifierReponse("facebook", boutonFacebook);
});

boutonMeinkampf.addEventListener("click", () => {
  verifierReponse("meinkampf", boutonMeinkampf);
});