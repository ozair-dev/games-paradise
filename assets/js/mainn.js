/*
 * Goal for making this is app is to apply concepts like, async programming,
 * try catch blocks, fetch Api etc
 * I'll also try to keep the code as clean and simple as possible
 */

// types of games available
const tags = `mmorpg, shooter, strategy, moba, racing, sports, social, sandbox, open-world, survival, pvp, pve, pixel, voxel, zombie, turn-based, first-person, third-Person, top-down, tank, space, sailing, side-scroller, superhero, permadeath, card, battle-royale, mmo, mmofps, mmotps, 3d, 2d, anime, fantasy, sci-fi, fighting, action-rpg, action, military, martial-arts, flight, low-spec, tower-defense, horror, mmorts`;

// to store queries to include in the fetch url
const queryOptions = { tag: [] };

// stores all fetched games data
let gamesData = [];

// windows and browser options font-awesome icons
const platformIcons = {
  Windows: `<i class="fa-brands fa-windows"></i>`,
  "PC (Windows)": `<i class="fa-brands fa-windows"></i>`,
  "Web Browser": `<i class="fa-brands fa-chrome"></i>`,
};

const baseURL = "https://free-to-play-games-database.p.rapidapi.com/api";
const headers = {
  "x-rapidapi-host": "free-to-play-games-database.p.rapidapi.com",
  "x-rapidapi-key": "db842b64e6mshe74b2941bee3771p19c61djsnc6ff159750db",
};

const app = document.querySelector("#app");
const tagsFiltersElem = app.querySelector(".filters__tags");
const gamesDiv = app.querySelector(".games");
const dummyGameCardSekeleton = app.querySelector(".dummy-card-skeleton");
const gameInfoModel = app.querySelector(".game-info-model");

let imagesSlidesInterval; // to store interval id

//  to manually adds checkbox inputs in html
addCheckboxInputs({ data: tags, param: "tag", elem: tagsFiltersElem });

app
  .querySelectorAll('input[type="checkbox"]')
  .forEach((inp) => (inp.onchange = handleCheckboxChange));

app
  .querySelectorAll('input[type="radio"]')
  .forEach((inp) => (inp.onchange = handleRadioChange));

gameInfoModel.onclick = handleModelClick;

updateData(); // to show games on page load

// Helper functions
function updateData() {
  showCardSkeletons();
  let requestURL = "";
  let query = getQuery();

  // choosing between filter/games path based on query
  if (query.includes("tag")) {
    requestURL = baseURL + "/filter?" + query;
  } else {
    requestURL = baseURL + "/games?" + query;
  }

  fetchData(requestURL)
    .then((data) => {
      if (Array.isArray(data)) gamesData = data;
      else throw new Error();
    })
    .catch(() => (gamesData = []))
    .finally(() => updateGameCards());
}

// convert queryOptions to a valid url query
function getQuery() {
  const query = Object.keys(queryOptions)
    .map((key) => {
      if (key == "platform" || key == "sort-by") {
        return `${key}=${queryOptions[key]}`;
      } else if (queryOptions[key].toString()) {
        return `${key}=${queryOptions[key].join(".")}`;
      }
    })
    .filter(Boolean)
    .join("&");
  return query;
}

function showCardSkeletons() {
  gamesDiv.innerHTML = "";
  Array(12)
    .fill(null)
    .forEach(() => {
      const cardSkeleton = dummyGameCardSekeleton.cloneNode(true);
      cardSkeleton.classList.remove("hidden");
      gamesDiv.appendChild(cardSkeleton);
    });
}

function handleModelClick(e) {
  const modelContent = this.querySelector(".game-info-model__content");
  if (!e.path.includes(modelContent)) {
    this.classList.add("hidden");
    clearInterval(imagesSlidesInterval);
  }
}

function handleGameCardClick(e) {
  const playButton = this.querySelector(".games__card__info__play-button");
  if (!e.path.includes(playButton)) {
    gameInfoModel.dataset.currentGameId = this.dataset.id;

    fetchData(`${baseURL}/game?id=${gameInfoModel.dataset.currentGameId}`)
      .then(showModel)
      .catch((err) => console.log(err));
  }
}

function showModel(gameData) {
  gameInfoModel.innerHTML = `
    <div class="game-info-model__content">
      <div class="game-info-model__images-div">
        ${gameData.screenshots
          .map(
            (ss) =>
              `<img src="${ss.image}" alt="${gameData.title}" loading="lazy" >`
          )
          .join("")}
      </div>
      <div>
        <p class=".game-info-model__name">${gameData.title}</p>
        <a class="game-info-model__play-button" href="${
          gameData["game_url"]
        }"><i class="fa-brands fa-playstation"></i>Play</a>
      </div>

      <div>
        <p class="game-info-model__genre">${gameData.genre}</p>
        <ul class="game-info-model__platforms">
        ${gameData.platform
          .split(", ")
          .map((pt) => `<li>${platformIcons[pt]}</li>`)
          .join("")}
        </ul>
      </div>
      <p class="game-info-model__description">${gameData.description}</p>
      ${
        gameData["minimum_system_requirements"]
          ? `
      <div class="game-info-model__requirements">
        <p>System Requirements</p>
        <table>
          <tbody>
          ${Object.keys(gameData["minimum_system_requirements"])
            .map(
              (key) => `
            <tr>
              <th>${key}</th>
              <td>${gameData["minimum_system_requirements"][key]}</td>
            </tr>
          `
            )
            .join("")}
          </tbody>
        </table>
      </div>
      `
          : ""
      }
  </div>
`;
  startSlideShow(gameData);
  gameInfoModel.classList.remove("hidden");
}

function startSlideShow(gameData) {
  let currentImageIndex = 0;
  const imagesDiv = gameInfoModel.querySelector(".game-info-model__images-div");

  imagesSlidesInterval = setInterval(async () => {
    if (imagesDiv.querySelectorAll("img")[currentImageIndex].complete) {
      if (currentImageIndex === gameData.screenshots.length - 1) {
        imagesDiv.scrollTo({ left: 0, behavior: "smooth" });
        currentImageIndex = 0;
      } else {
        slideImage(imagesDiv, currentImageIndex++ + 1);
      }
    }
  }, 6 * 1000);
}

function updateGameCards() {
  if (gamesData.length) {
    gamesDiv.innerHTML = gamesData
      .map((game) => {
        const platforms = game.platform
          .split(", ")
          .map((pt) => `<li title="Platform: ${pt}">${platformIcons[pt]}</li>`)
          .join("");

        return `
        <div class="games__card" data-id="${game.id}">
          <img class="games__card__thumbnail" loading="lazy" src="${game.thumbnail}" alt="${game.title}">
          <div class="games__card__info">
            <div>
              <p class="games__card__info__name" title="${game.title}">${game.title}</p>
              <a class="games__card__info__play-button" href="${game["game_url"]}" target="_blank"><i class="fa-brands fa-playstation"></i>Play</a>
            </div>
            <p class="games__card__info__description" title="${game["short_description"]}">${game["short_description"]}</p>
            <div>
              <p class="games__card__info__genre" title="GENRE: ${game.genre}">${game.genre}</p>
              <ul class="games__card__info__platforms">
              ${platforms}
              </ul>
            </div>
          </div>
        </div>`;
      })
      .join("");
  } else {
    gamesDiv.innerHTML = `<p class="failure">No Results Found...</p>`;
  }
  app
    .querySelectorAll(".games__card")
    .forEach((gamesCard) => (gamesCard.onclick = handleGameCardClick));
}

function handleCheckboxChange() {
  const param = this.dataset.param;
  const value = this.value;
  let array = queryOptions[param];
  if (!array.includes(value)) {
    array.push(value);
  } else {
    const index = array.indexOf(value);
    queryOptions[param] = array.slice(0, index).concat(array.slice(index + 1));
  }
  updateData();
}

function handleRadioChange() {
  queryOptions[this.name] = this.value;
  updateData();
}

function addCheckboxInputs({ data, param, elem }) {
  const inputsHTML = data
    .split(", ")
    .map(
      (item) => `
    <li>
      <label>
        <input type="checkbox" data-param="${param}"  value="${item}"/>
        ${item.toUpperCase().replace("-", " ")}
      </label>
    </li>
  `
    )
    .join("");
  const ul = document.createElement("ul");
  ul.innerHTML = inputsHTML;
  elem.appendChild(ul);
}

async function fetchData(url) {
  let response = await fetch(url, { method: "GET", headers });
  if (!response.ok) throw new Error();
  return response.json();
}

function encodeHTML(str) {
  const elem = document.createElement("div");
  elem.innerHTML = elem.textContent = str;
  return elem.innerHTML;
}

async function slideImage(elem, imgIdx) {
  const { width } = elem.getBoundingClientRect();
  await elem.scroll({ left: width * imgIdx, behavior: "smooth" });
}
