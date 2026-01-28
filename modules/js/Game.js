/**
 *------
 * BGA framework: Gregory Isabelli & Emmanuel Colin & BoardGameArena
 * spookytower implementation : © <Your name here> <Your email address here>
 *
 * This code has been produced on the BGA studio platform for use on http://boardgamearena.com.
 * See http://en.boardgamearena.com/#!doc/Studio for more information.
 * -----
 *
 * Game.js
 *
 * spookytower user interface script
 *
 * In this file, you are describing the logic of your user interface, in Javascript language.
 *
 */

/**
 * We create one State class per declared state on the PHP side, to handle all state specific code here.
 * onEnteringState, onLeavingState and onPlayerActivationChange are predefined names that will be called by the framework.
 * When executing code in this state, you can access the args using this.args
 */

const BgaAnimations = await importEsmLib("bga-animations", "1.x");

class NormalTurn {
  constructor(game, bga) {
    this.game = game;
    this.bga = bga;
  }

  /**
   * This method is called each time we are entering the game state. You can use this method to perform some user interface changes at this moment.
   */
  onEnteringState(args, isCurrentPlayerActive) {
    //this.bga.statusBar.setTitle(isCurrentPlayerActive ? _("${you} must play a card or pass") : _("${actplayer} must play a card or pass"));
    
    // PART 1 Event listeners
    if (isCurrentPlayerActive) {
      this.possibles = [];
      console.log(args);

      // selectable
      if (Array.isArray(args.selectable) && args.selectable.length > 0) {
        args.selectable.forEach((sid) => {
          this.game.safeClass(sid, "add", "selectable");
          this.possibles.push(sid);
        });
      }

      // selected
      if (Array.isArray(args.selected) && args.selected.length > 0) {
        args.selected.forEach((sid) => {
          this.game.safeClass(sid, "add", "selected");
        });
      }

      // event listeners uniquement s'il y a quelque chose à connecter
      if (this.possibles.length > 0) {
        this.game.setupConnections(this.possibles);
      }
    }

    // PART 2 Titles
    if (isCurrentPlayerActive && args.titleyou) {
      this.bga.statusBar.setTitle(
        this.bga.gameui.format_string_recursive(
          args.titleyou
            .replace("${you}", this.game.divYou())
            .replace(/#opponent#/g, args.opponent ?? "")
            .replace("#nb#", args.nb ?? "")
            .replace("#nb2#", args.nb2 ?? "")
            .replace("#icon#", args.icon ?? "")
            .replace("#icon2#", args.icon2 ?? ""),
          args,
        ),
      );
    } else if (args.title) {
      $("pagemaintitletext").innerHTML = this.bga.gameui.format_string_recursive(
        _(args.title)
          .replace("${actplayer}", this.game.divActPlayer())
          .replace("#nb#", args.nb ?? "")
          .replace("#nb2#", args.nb2 ?? "")
          .replace("#icon#", args.icon ?? "")
          .replace("#icon2#", args.icon2 ?? ""),
        args,
      );
    }

    // PART 3 updateActionButtons
    if (isCurrentPlayerActive && Array.isArray(args.buttons) && args.buttons.length > 0) {
      for (const key of args.buttons) {
        switch (key) {
          case "yes_btn":
            this.bga.statusBar.addActionButton(
              _("Yes"),
              () =>
                this.bga.actions.performAction("actButton", {
                  arg1: key,
                }),
              { color: "primary" },
            );
            break;

          case "no_btn":
            this.bga.statusBar.addActionButton(
              _("No"),
              () =>
                this.bga.actions.performAction("actButton", {
                  arg1: key,
                }),
              { color: "primary" },
            );
            break;

          case "take_btn":
            this.bga.statusBar.addActionButton(_("Take Cards"), "onOpTakeCards", null, null, "blue");
            this.game.safeClass("#take_btn", "add", "disabled");
            break;

          case "end_turn_btn":
            this.bga.statusBar.addActionButton(
              _("End Turn"),
              () =>
                this.bga.actions.performAction("actEndTurn", {
                  arg1: key,
                }),
              { color: "secondary" },
            );
            break;
        }
      }
    }

    //const playableCardsIds = args.playableCardsIds; // returned by the PlayerTurn::getArgs

    // Add test action buttons in the action status bar, simulating a card click:
    //playableCardsIds.forEach((cardId) => this.bga.statusBar.addActionButton(_("Play card with id ${card_id}").replace("${card_id}", cardId), () => this.onCardClick(cardId)));

    //this.bga.statusBar.addActionButton(_("Pass"), () => this.bga.actions.performAction("actPass"), { color: "secondary" });
  }

  /**
   * This method is called each time we are leaving the game state. You can use this method to perform some user interface changes at this moment.
   */
  onLeavingState(args, isCurrentPlayerActive) {
    this.game.safeClass(".selectable", "remove", "selectable");
    this.game.safeClass(".selected", "remove", "selected");
    this.game.removeConnections();
  }

  /**
   * This method is called each time the current player becomes active or inactive in a MULTIPLE_ACTIVE_PLAYER state. You can use this method to perform some user interface changes at this moment.
   * on MULTIPLE_ACTIVE_PLAYER states, you may want to call this function in onEnteringState using `this.onPlayerActivationChange(args, isCurrentPlayerActive)` at the end of onEnteringState.
   * If your state is not a MULTIPLE_ACTIVE_PLAYER one, you can delete this function.
   */
  onPlayerActivationChange(args, isCurrentPlayerActive) {}

  onCardClick(card_id) {
    console.log("onCardClick", card_id);

    this.bga.actions
      .performAction("actPlayCard", {
        card_id,
      })
      .then(() => {
        // What to do after the server call if it succeeded
        // (most of the time, nothing, as the game will react to notifs / change of state instead, so you can delete the `then`)
      });
  }
}

export class Game {
  constructor(bga) {
    console.log("spookytower constructor");
    this.bga = bga;

    // Declare the State classes
    this.playerTurn = new NormalTurn(this, bga);
    this.bga.states.register("NormalTurn", this.playerTurn);

    // Uncomment the next line to show debug informations about state changes in the console. Remove before going to production!
    // this.bga.states.logger = console.log;

    // Here, you can init the global variables of your user interface
    // Example:
    // this.myGlobalValue = 0;
  }

  /*
        setup:
        
        This method must set up the game user interface according to current game situation specified
        in parameters.
        
        The method is called each time the game interface is displayed to a player, ie:
        _ when the game starts
        _ when a player refreshes the game page (F5)
        
        "gamedatas" argument contains all datas retrieved by your "getAllDatas" PHP method.
    */

  setup(gamedatas) {
    console.log("Starting game setup");
    this.gamedatas = gamedatas;
    console.log("gamedatas", this.gamedatas);

    this.animationManager = new BgaAnimations.Manager({
      animationsActive: () => this.bga.gameui.bgaAnimationsActive(),
    });

    this.players = gamedatas.players; // A RAJOUTER POUR MOTEUR (UTILITY METHODS)
    this.players_ordered = gamedatas.players_ordered;

    this.nb_players = Object.keys(this.players).length;

    // variable en local storage pour le zoom
    this.zoom_factor = parseFloat(window.localStorage?.getItem("ST_zoom")) || 1;

    this.setupPlayersBoard();
    this.setupBoard();
    this.addSideButtons();

    this.setupCounters();
    //this.setupTooltips();

    // APPLIQUE LE SCALE IMMEDIATEMENT
    this.updateBoardZoom();

    this.connections = [];

    /*
        // Example to add a div on the game area
        this.bga.gameArea.getElement().insertAdjacentHTML('beforeend', `
            <div id="player-tables"></div>
        `);
        

        // Setting up player boards
        Object.values(gamedatas.players).forEach(player => {
            // example of setting up players boards
            this.bga.playerPanels.getElement(player.id).insertAdjacentHTML('beforeend', `
                <span id="energy-player-counter-${player.id}"></span> Energy
            `);
            const counter = new ebg.counter();
            counter.create(`energy-player-counter-${player.id}`, {
                value: player.energy,
                playerCounter: 'energy',
                playerId: player.id
            });

            // example of adding a div for each player
            document.getElementById('player-tables').insertAdjacentHTML('beforeend', `
                <div id="player-table-${player.id}">
                    <strong>${player.name}</strong>
                    <div>Player zone content goes here</div>
                </div>
            `);
        });
        */
    // TODO: Set up your game interface here, according to "gamedatas"

    // Setup game notifications to handle (see "setupNotifications" method below)
    this.setupNotifications();

    console.log("Ending game setup");
  }

  ///////////////////////////////////////////////////
  //// Utility methods

  /*
    
        Here, you can defines some utility methods that you can use everywhere in your javascript
        script. Typically, functions that are used in multiple state classes or outside a state class.
    
    */

  divYou() {
    var color = this.players[this.bga.players.getCurrentPlayerId()].color;
    var color_bg = "";
    var you = '<span style="font-weight:bold;color:#' + color + ";" + color_bg + '">' + _("You") + "</span>";
    return you;
  }

  divActPlayer() {
    var color = this.players[this.bga.players.getActivePlayerId()].color;
    var name = this.players[this.bga.players.getActivePlayerId()].name;
    var color_bg = "";
    var you = '<span style="font-weight:bold;color:#' + color + ";" + color_bg + '">' + name + "</span>";
    return you;
  }

  safeClass(target, action, className) {
    let elements = [];

    if (typeof target == "string") {
      // c’est un sélecteur ou id brut
      let selectors = [];
      if (target.startsWith("#") || target.startsWith(".")) {
        selectors = [target];
      } else {
        selectors = [`#${target}`, `.${target}`];
      }
      selectors.forEach((sel) => {
        const els = document.querySelectorAll(sel);
        if (els.length > 0) elements.push(...els);
      });
    } else if (target instanceof Element) {
      // c’est un élément DOM direct
      elements = [target];
    }

    if (elements.length == 0) {
      //console.log(`❌ No element found for "${target}"`);
      return;
    }

    elements.forEach((el) => {
      try {
        if (typeof el.classList[action] == "function") {
          el.classList[action](className);
        } else {
          console.log(`❌ Invalid action "${action}" on "${target}"`);
        }
      } catch (e) {
        console.log(`❌ Error on "${target}": ${e.message}`);
      }
    });
  }

  /*************************************************
   *
   *  setup connections from this.args.selectable
   * on each beginning of new State (Player Turn)
   *
   ************************************************/

  setupConnections(selectables) {
    this.connections = [];

    selectables.forEach((elt_id) => {
      const element = document.getElementById(elt_id);

      if (elt_id.startsWith("square_")) {
        const resourceClickHandler = () => this.onSelectSquare(elt_id);
        element.addEventListener("click", resourceClickHandler);
        this.connections.push({
          element,
          event: "click",
          handler: resourceClickHandler,
        });
      }
    });
  }

  /*************************************************
   *
   *  reset all connections
   *  on leaving a State
   *
   ************************************************/

  removeConnections() {
    this.connections.forEach((connection) => {
      const { element, event, handler } = connection;
      if (element) {
        element.removeEventListener(event, handler);
      }
    });
    this.connections = [];
  }

  setupPlayersBoard() {
    console.log("Setting up the players board");

    // Setting up player boards
    Object.values(this.gamedatas.players).forEach((player) => {
      // example of setting up players boards
      this.bga.playerPanels.getElement(player.id).insertAdjacentHTML(
        "beforeend",
        `
          <div class="a-board" id="top_board_${player.id}">
            <!-- Ghost icon + counter -->
            <div class="icon-group">
              <div
                class="icon ic_ghost"
                id="icon_ghost_${player.id}"
                title="${_("Ghost")}"
              ></div>
              <span
                class="icon-text"
                id="ghost_counter_${player.id}"
              ></span>
            </div>
            <!-- Artefact icon + counter -->
            <div class="icon-group">
              <div
                class="icon ic_artefact"
                id="icon_artefact_${player.id}"
                title="${_("Artefacts")}"
              ></div>
              <span
                class="icon-text"
                id="artefact_counter_${player.id}"
              ></span>
            </div>
                        <!-- Clue icon + counter -->
            <div class="icon-group">
              <div
                class="icon ic_clue"
                id="icon_clue_${player.id}"
                title="${_("Clues")}"
              ></div>
              <span
                class="icon-text"
                id="clue_counter_${player.id}"
              ></span>
            </div>
          </div>

          <div class="b-board" id="bottom_board_${player.id}">
                      <!-- Reroll icon -->

              <div
                class="icon ic_reroll_${player.reroll ?? 1}"
                id="icon_reroll_${player.id}"
                title="${_("Reroll")}"
              ></div>
            </div>

          `,
      );

      const artefact_counter = new ebg.counter();
      artefact_counter.create(`artefact_counter_${player.id}`, {
        value: player.artefact,
        playerCounter: "artefact",
        playerId: player.id,
      });

      const ghost_counter = new ebg.counter();
      ghost_counter.create(`ghost_counter_${player.id}`, {
        value: player.ghost,
        playerCounter: "ghost",
        playerId: player.id,
      });
      const clue_counter = new ebg.counter();
      clue_counter.create(`clue_counter_${player.id}`, {
        value: player.clue,
        playerCounter: "clue",
        playerId: player.id,
      });
    });

    const current_player_id = this.bga.players.getCurrentPlayerId();

    if (current_player_id) {
      const rerollIcon = document.getElementById(`icon_reroll_${current_player_id}`);

      if (rerollIcon) {
        rerollIcon.classList.add("clickable");
        rerollIcon.addEventListener("click", () => this.onFlipReroll());
      }
    }
  }

  isMobileDevice() {
    return $("ebd-body").classList.contains("mobile_version");
  }

  setupBoard() {
    console.log("Setting up the board");

    const centralGridHTML = [];

    // =================== PETS → colonne 1 ===================
    centralGridHTML.push('<div class="table_pet_card" id="table_pet_slot_1" style="grid-column:1; grid-row:1;"></div>');
    centralGridHTML.push('<div class="table_pet_card" id="table_pet_slot_2" style="grid-column:1; grid-row:2;"></div>');
    centralGridHTML.push('<div class="table_pet_card" id="table_pet_slot_3" style="grid-column:1; grid-row:3;"></div>');

    // =================== BUILDINGS → colonnes 2 à 5, ligne par ligne ===================
    let buildingNumber = 1;
    for (let row = 1; row <= 3; row++) {
      for (let col = 2; col <= 5; col++) {
        centralGridHTML.push(`
                <div class="table_building_slot" id="table_building_slot_${buildingNumber}" style="grid-column:${col}; grid-row:${row};">
                    <div class="building_cards" id="table_building_card_${buildingNumber}" style="background-position: 0% 0%;"></div>
                    <div class="table_building_counter" id="table_building_counter_${buildingNumber}"></div>
                </div>
            `);
        buildingNumber++;
      }
    }

    // =================== HTML complet ===================
    const gameBoardHTML = `
        <div id="resized_id">
            <div id="board_id">

                <!-- TOP ROW TABLE -->
                <div id="table_top_row">
                    <div class="table_deck_slot" id="deck_park"></div>
                    <div class="table_deck_slot" id="deck_grimoire"></div>
                    <div class="table_track_slot" id="dice_track"></div>
                    <div class="table_clock_slot" id="clock_tower"></div>
                </div>

                <!-- CENTER GRID 5x3 TABLE -->
                <div id="table_center_area">
                    <div id="table_central_grid">
                        ${centralGridHTML.join("")}
                    </div>
                </div>

                <!-- ZONE JOUEURS -->
                <div id="players_area"></div>

            </div>
        </div>
    `;

    // Injecte le board
    document.getElementById("game_play_area").insertAdjacentHTML("beforeend", gameBoardHTML);

    // =================== ZONE JOUEURS ===================
    const playersArea = document.getElementById("players_area");
    Object.values(this.gamedatas.players).forEach((player) => {
      const playerHTML = `
            <div class="player_board" id="player_${player.id}" data-player-id="${player.id}">
                <div class="building_columns">
                    ${[...Array(12)].map((_, i) => `<div class="building_stack" id="player_${player.id}_building_stack_${i + 1}"></div>`).join("")}
                </div>
                <div class="house_slot" id="player_${player.id}_house"></div>
            </div>
        `;
      playersArea.insertAdjacentHTML("beforeend", playerHTML);
    });

    // =================== PETS ET BUILDINGS ===================
    this.setupTopRow();
    this.setupPets(); // injecte les cartes pets
    this.setupBuildings(); // injecte les cartes buildings + div compteur
  }

  setupTopRow() {
    // -------------------- Deck Park --------------------
    const deckParkSlot = document.getElementById("deck_park");
    if (!deckParkSlot) return;

    // Déterminer la position dans le sprite en fonction de nb_parks
    const nb_parks = this.nb_parks || 3; // exemple, à adapter selon ton état
    let col;

    if (nb_parks >= 5) col = 7;
    else if (nb_parks >= 2 && nb_parks <= 4) col = 6;
    else col = 5;

    const posX = -(col * 100); // chaque colonne = -100%

    // Injecter la carte + compteur
    const parkHTML = `
        <div class="card_item parkgrim_cards" style="background-position: ${posX}% 0%; " title="Park">
            <div class="table_building_counter" id="deck_park_counter"></div>
        </div>
    `;

    deckParkSlot.insertAdjacentHTML("beforeend", parkHTML);

    // -------------------- Deck Grimoire --------------------
    const deckGrimoireSlot = document.getElementById("deck_grimoire");
    if (!deckGrimoireSlot) return;

    // ---- Injecter la carte + compteur à l'intérieur ----
    const cardHTML = `
        <div class="card_item parkgrim_cards" 
             style="background-position: -700% -100%;" title="Grimoire">
            <div class="table_building_counter" id="deck_grimoire_counter"></div>
        </div>
    `;

    deckGrimoireSlot.insertAdjacentHTML("beforeend", cardHTML);

    // -------------------- Dice Track --------------------
    const diceTrackSlot = document.getElementById("dice_track");
    if (!diceTrackSlot) return;

    // ---- Injecter la carte + compteur à l'intérieur ----
    const diceHTML = `
        <div class="card_item building_cards" 
             style="background-position: -1000% -500%;" title="Dice Track">
        </div>
    `;

    diceTrackSlot.insertAdjacentHTML("beforeend", diceHTML);

    // -------------------- Clock Tower --------------------
    const clockTowerSlot = document.getElementById("clock_tower");
    if (!clockTowerSlot) return;

    // ---- Injecter la carte + compteur à l'intérieur ----
    const towerHTML = `
        <div class="card_item building_cards" 
             style="background-position: -1100% -500%;" title="Clock Tower">
        </div>
    `;

    clockTowerSlot.insertAdjacentHTML("beforeend", towerHTML);
  }

  setupPets() {
    // Ordre haut → bas, exemple : "213"
    const order = this.petsOrder || "312";

    // Conteneurs table fixes pour les pets
    const petContainers = [document.getElementById("table_pet_slot_1"), document.getElementById("table_pet_slot_2"), document.getElementById("table_pet_slot_3")];

    // Vider tous les conteneurs avant insertion
    petContainers.forEach((c) => (c.innerHTML = ""));

    // Parcourir l'ordre et injecter le HTML directement
    for (let i = 0; i < 3; i++) {
      const petType = parseInt(order[i], 10);
      if (![1, 2, 3].includes(petType)) continue;

      const container = petContainers[i];

      const petHTML = `
          <div class="card_item pet_cards" 
               style="background-position: ${-(petType - 1) * 100}% 0%;">
          </div>
        `;
      container.insertAdjacentHTML("beforeend", petHTML);
    }
  }

  setupBuildings() {
    for (let i = 1; i <= 12; i++) {
      const cardDiv = document.getElementById(`table_building_card_${i}`);
      if (!cardDiv) continue;

      const posX = -(i - 1) * 100; // carte 1 -> 0%, carte 2 -> -100%, etc.
      cardDiv.style.backgroundPosition = `${posX}% 0%`;
    }
  }

  setupCounters() {
    this.topRowCounters = {};

    const nb_parks = this.nb_parks || 3;

    const Parkcounter = new ebg.counter();
    Parkcounter.create("deck_park_counter", {
      value: nb_parks,
      playerCounter: null,
    });
    this.topRowCounters.deck_park = Parkcounter;

    const Grimcounter = new ebg.counter();
    Grimcounter.create("deck_grimoire_counter", {
      value: 0, // valeur initiale
      playerCounter: null,
    });
    this.topRowCounters.deck_grimoire = Grimcounter;

    this.tableBuildingCounters = {};

    for (let i = 1; i <= 12; i++) {
      const counter = new ebg.counter();

      counter.create(`table_building_counter_${i}`, {
        value: 0, // valeur initiale
      });

      this.tableBuildingCounters[i] = counter;
    }
  }

  addSideButtons() {
    document.body.insertAdjacentHTML(
      "beforeend",
      `<div id="st_help_button">?</div>
       <div id="st_zoom_plus_button">+</div>
       <div id="st_zoom_minus_button">-</div>`,
    );

    document.getElementById("st_help_button").addEventListener("click", () => this.showHelpModal());

    const zoomPlusButton = document.getElementById("st_zoom_plus_button");
    zoomPlusButton.addEventListener("click", () => this.zoomPlusCards());

    const zoomMinusButton = document.getElementById("st_zoom_minus_button");
    zoomMinusButton.addEventListener("click", () => this.zoomMinusCards());

    const rightPanel = document.getElementById("right-side");

    let offsetRight = 10; // marge par défaut desktop
    let offsetTopPlus = 125; // top desktop
    let offsetTopMinus = 185;

    const mobile = this.isMobileDevice();

    // Si on n'est PAS mobile et que le panel existe → décalage classique
    if (!mobile && rightPanel) {
      offsetRight = rightPanel.offsetWidth + 10;
    }

    // 📱 Sur mobile :
    if (mobile) {
      // Boutons plus petits → 30px
      zoomPlusButton.style.width = "30px";
      zoomPlusButton.style.height = "30px";

      zoomMinusButton.style.width = "30px";
      zoomMinusButton.style.height = "30px";

      // Police réduite
      zoomPlusButton.style.fontSize = "18pt";
      zoomMinusButton.style.fontSize = "18pt";

      // ✔ Positions verticales compactées pour mobile
      offsetTopPlus = 80;
      offsetTopMinus = 115;

      // ✔ Si un panel existe, on place tout sous celui-ci
      if (rightPanel) {
        offsetTopPlus += rightPanel.offsetHeight;
        offsetTopMinus += rightPanel.offsetHeight;
      }
    }

    // Application des positions finales
    zoomPlusButton.style.right = `${offsetRight}px`;
    zoomMinusButton.style.right = `${offsetRight}px`;

    zoomPlusButton.style.top = `${offsetTopPlus}px`;
    zoomMinusButton.style.top = `${offsetTopMinus}px`;
  }

  showHelpModal() {
    // Vérifie si la modale existe déjà
    if (document.getElementById("helpModal")) return;

    // Création de la modale
    const modal = document.createElement("div");
    modal.id = "helpModal";
    modal.className = "modal";

    // Contenu HTML de la modale
    const html = `
    <div class="modal-content">
      <span class="close">&times;</span>
      <div class="tooltip_content">
        <p>Besoin d'aide ? Voici quelques instructions...</p>
        <div class="info_container">
          <!-- Exemple d'information -->
          <div class="tooltip_bigtitle">${_("Turn Summary")}</div>
          <div class="tooltip_subtitle">${_("Select a Card and a Token")}</div>
          <div class="tooltip_desc">${_("You must select 1 Item Token and 1 Card (Plant or Room) from the same column.")}</div>
        </div>
      </div>
    </div>
  `;

    modal.innerHTML = html;
    document.body.appendChild(modal);

    // Sélection des éléments de la modale
    const closeButton = modal.querySelector(".close");

    // Affichage de la modale
    modal.style.display = "flex";

    // Fermeture en cliquant sur la croix
    closeButton.addEventListener("click", () => modal.remove());

    // Fermeture en cliquant en dehors de la modale
    window.addEventListener(
      "click",
      (event) => {
        if (event.target === modal) modal.remove();
      },
      { once: true }, // le listener ne se déclenche qu'une fois
    );
  }

  zoomPlusCards() {
    // On augmente le zoom par pas de 0.05, max 1
    this.zoom_factor = Math.min(1, this.zoom_factor + 0.05);
    window.localStorage.setItem("ST_zoom", this.zoom_factor);

    this.updateBoardZoom();
  }

  zoomMinusCards() {
    // On diminue le zoom par pas de 0.05, min 0.5
    this.zoom_factor = Math.max(0.5, this.zoom_factor - 0.05);
    window.localStorage.setItem("ST_zoom", this.zoom_factor);

    this.updateBoardZoom();
  }

  updateBoardZoom() {
    // Met à jour le scale CSS pour les cartes
    document.documentElement.style.setProperty("--st_scale", this.zoom_factor);
  }

  async onFlipReroll() {
    const playerId = this.bga.players.getCurrentPlayerId();
    const icon = document.getElementById(`icon_reroll_${playerId}`);
    if (!icon) return;

    if (icon.dataset.flipping === "true") return;
    icon.dataset.flipping = "true";

    const half = 200; // demi-flip en ms

    // Premier demi-flip : rotation + léger pop + translation Y
    icon.style.transition = `transform ${half}ms ease-in-out`;
    icon.style.transform = "rotateY(90deg) translateY(-5px) scale(1.05)";

    await new Promise((resolve) => setTimeout(resolve, half));

    // Changement du sprite exactement à mi-flip
    if (icon.classList.contains("ic_reroll_1")) {
      icon.classList.remove("ic_reroll_1");
      icon.classList.add("ic_reroll_0");
    } else {
      icon.classList.remove("ic_reroll_0");
      icon.classList.add("ic_reroll_1");
    }

    // Deuxième demi-flip : retour à la position normale avec léger rebond
    icon.style.transform = "rotateY(0deg) translateY(0px) scale(1)";

    await new Promise((resolve) => setTimeout(resolve, half));

    // Reset final
    icon.style.transition = "";
    icon.style.transform = "";
    delete icon.dataset.flipping;
  }

  ///////////////////////////////////////////////////
  //// Reaction to cometD notifications

  /*
        setupNotifications:
        
        In this method, you associate each of your game notifications with your local method to handle it.
        
        Note: game notification names correspond to "notifyAllPlayers" and "notifyPlayer" calls in
                your spookytower.game.php file.
    
    */
  setupNotifications() {
    console.log("notifications subscriptions setup");

    // automatically listen to the notifications, based on the `notif_xxx` function on this class.
    // Uncomment the logger param to see debug information in the console about notifications.
    this.bga.notifications.setupPromiseNotifications({
      // logger: console.log
    });
  }

  // TODO: from this point and below, you can write your game notifications handling methods

  /*
    Example:
    async notif_cardPlayed( args ) {
        // Note: args contains the arguments specified during you "notifyAllPlayers" / "notifyPlayer" PHP call
        
        // TODO: play the card in the user interface.
    }
    */

  async notif_placeTruck(args) {
    // mise à jour du truck

    console.log("notif_placeTruck", args);
  }
}
