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
    // PART 1 Event listeners
    if (isCurrentPlayerActive) {
      this.possibles = [];
      console.log(args);

      console.log("enteringState function");
      this.game.function = args.function;
      //this.game.setupRiver();

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
      //this.bga.statusBar.setTitle(isCurrentPlayerActive ? _("${you} must play a card or pass") : _("${actplayer} must play a card or pass"));

      this.bga.statusBar.setTitle(
        this.bga.gameui.format_string_recursive(
          _(args.titleyou)
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
              _("Confirm"),
              () =>
                this.bga.actions.performAction("actButton", {
                  arg1: key,
                }),
              { color: "primary", autoclick: this.bga.userPreferences.get(101) == 1 },
            );
            break;

          case "no_btn":
            this.bga.statusBar.addActionButton(
              _("Cancel"),
              () =>
                this.bga.actions.performAction("actButton", {
                  arg1: key,
                }),
              { color: "alert" },
            );
            break;
          case "roll_dice_btn":
            this.bga.statusBar.addActionButton(
              _("Roll dice"),
              () =>
                this.bga.actions.performAction("actRollDice", {
                  arg1: key,
                }),
              { color: "primary" },
            );
            break;

          case "reroll_dice_btn":
            this.bga.statusBar.addActionButton(
              _("Reroll dice"),
              () =>
                this.bga.actions.performAction("actRerollDice", {
                  arg1: key,
                }),
              { color: "primary" },
            );
            break;
          case "go_to_park_btn":
            this.bga.statusBar.addActionButton(
              _("Go to Park"),
              () =>
                this.bga.actions.performAction("actButton", {
                  arg1: key,
                }),
              { color: "primary" },
            );
            break;
          case "turn_clock_btn":
            this.bga.statusBar.addActionButton(
              _("Turn clock"),
              () =>
                this.bga.actions.performAction("actClock", {
                  arg1: key,
                }),
              { color: "primary" },
            );
            break;
        }
      }
    }
  }

  /**
   * This method is called each time we are leaving the game state. You can use this method to perform some user interface changes at this moment.
   */
  onLeavingState(args, isCurrentPlayerActive) {
    this.game.safeClass(".selectable", "remove", "selectable");
    this.game.safeClass(".selected", "remove", "selected");
    this.game.removeConnections();
  }
}

export class Game {
  constructor(bga) {
    console.log("spookytower constructor");
    this.bga = bga;

    // Declare the State classes
    this.normalTurn = new NormalTurn(this, bga);
    this.bga.states.register("NormalTurn", this.normalTurn);

    // Uncomment the next line to show debug informations about state changes in the console. Remove before going to production!
    this.bga.states.logger = console.log;
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
      animationsActive: () => this.bga.gameui.bgaAnimationsActive() == true,
    });

    this.players = gamedatas.players; // A RAJOUTER POUR MOTEUR (UTILITY METHODS)
    this.players_ordered = gamedatas.players_ordered;

    this.nb_players = Object.keys(this.players).length;

    // variable en local storage pour le zoom
    this.zoom_factor = parseFloat(window.localStorage?.getItem("ST_zoom")) || 0.5;
    console.log("zoom_factor Setup", this.zoom_factor);

    this.icons = ["reroll_1", "reroll_0", "artefact", "ghost", "clue", "grimoire", "clock", "pet", "replay", "flip8", "flip9", "draw8", "draw_any"];

    this.setupPlayersBoard();
    this.setupBoard();
    this.addSideButtons();
    this.initDice();

    this.setupCounters();
    //this.setupTooltips();

    // APPLIQUE LE SCALE IMMEDIATEMENT
    this.updateBoardZoom();

    this.connections = [];

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

    // console.log("ARGS .connections", this.function);

    selectables.forEach((elt_id) => {
      const element = document.getElementById(elt_id);
      //console.log("connections elements", element);
      if (!element) return;

      const clickHandler = (evt) => this.onSelect(evt);
      element.addEventListener("click", clickHandler);
      this.connections.push({
        element,
        event: "click",
        handler: clickHandler,
      });
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

  onSelect(evt) {
    // Preventing default browser reaction
    dojo.stopEvent(evt);

    if (evt.currentTarget.classList.contains("selectable")) {
      this.bga.actions.performAction("actSelect", { arg1: evt.currentTarget.id });
    }
  }

  setupPlayersBoard() {
    console.log("Setting up the players board");

    // Setting up player boards
    Object.values(this.gamedatas.players).forEach((player) => {
      // example of setting up players boards

      console.log("player", player);
      this.bga.playerPanels.getElement(player.id).insertAdjacentHTML(
        "beforeend",
        `
          <div class="a-board" id="top_board_${player.id}">

            <!-- Ghost icon + counter -->
            <div class="icon-group">
              <div class="icon ic_ghost" id="icon_ghost_${player.id}" title="${_("Ghost")}"></div>
              <span class="icon-text" id="ghost_counter_${player.id}"></span>
            </div>

          
            <!-- Artefact icon + counter -->
            <div class="icon-group">
              <div class="icon ic_artefact" id="icon_artefact_${player.id}" title="${_("Artefacts")}" ></div>
              <span class="icon-text" id="artefact_counter_${player.id}"></span>
            </div>

            <!-- Clue icon + counter -->
            <div class="icon-group">
              <div class="icon ic_clue" id="icon_clue_${player.id}" title="${_("Clues")}"></div>
              <span class="icon-text" id="clue_counter_${player.id}"></span>
            </div>
          </div>

          <div class="a-board" id="middle_board_${player.id}">
          </div>

          <div class="b-board" id="bottom_board_${player.id}">
            <div class="icon ic_reroll_${player.reroll ?? 1}" id="icon_reroll_${player.id}" title="${_("Reroll")}"></div>
          </div>
          `,
      );
    });

    if (parseInt(this.gamedatas.replay_player_id) > 0) {
      const iconId = `panel_ic_replay`;
      const html = `<div id="${iconId}" class="icon ic_replay"></div>`;
      const bottom_board = document.getElementById(`bottom_board_${this.gamedatas.replay_player_id}`);
      bottom_board.insertAdjacentHTML("beforeend", html);
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
          <div class="table_building_slot"
              id="table_building_slot_${buildingNumber}"
              style="grid-column:${col}; grid-row:${row};"
              title="Building ${buildingNumber}">

            <div class="table_building_cards_container">
              <div class="building_cards opa_30"
                  id="table_building_card_${buildingNumber}_blank"
                  style="background-position: 0% 0%;"></div>

              <div class="building_cards"
                  id="table_building_card_${buildingNumber}"
                  style="background-position: 0% 0%;"></div>
            </div>

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
            <div id="table_center_area" style="display: flex; gap: 10px;">
                <div class="table_side_column" id="left_column" style="display: flex; flex-direction: column; gap: 10px;">
                    <div class="table_deck_slot" id="deck_park" title="Park"></div>
                    <div class="table_deck_slot" id="deck_grimoire" title="Grimoire"></div>
                </div>
                <div id="table_central_grid">
                    ${centralGridHTML.join("")}
                </div>
                <div class="table_side_column" id="right_column">
                  <div class="big_clock_tower" id="clock_tower_container">
                    <div id="clock_zone"></div>
                    <div id="dice_zone"></div>
                  </div>
                </div>
            </div>
            <div id="river_id" class="river_container closed"></div>
            <div id="players_area"></div>
        </div>
    </div>
`;

    // Injecte le board
    document.getElementById("game_play_area").insertAdjacentHTML("beforeend", gameBoardHTML);

    // =================== PETS ET BUILDINGS ===================
    this.setupTopRow();
    this.setupRiver();
    this.setupPets(); // injecte les cartes pets
    this.setupBuildings(); // injecte les cartes buildings + div compteur
    this.setupHouses();
  }

  setupTopRow() {
    // -------------------- Deck Park --------------------
    const deckParkSlot = document.getElementById("deck_park");

    // Déterminer la position dans le sprite en fonction de nb_parks
    const nb_parks = this.gamedatas.deck_park;
    let col;

    if (nb_parks >= 5) col = 5;
    else if (nb_parks >= 2 && nb_parks <= 4) col = 6;
    else col = 7;

    const posX = -(col * 100); // chaque colonne = -100%

    // Injecter la carte + compteur
    const parkHTML = `        
        <div class="card_item parkgrim_cards opa_30" id="park_opa" style="background-position: -500% 0%;"></div>
        <div class="card_item parkgrim_cards" id="park_active" style="background-position: ${posX}% 0%;"></div>
        <div class="table_building_counter" id="deck_park_counter"></div>
    `;
    deckParkSlot.insertAdjacentHTML("beforeend", parkHTML);

    // -------------------- Deck Grimoire --------------------
    const deckGrimoireSlot = document.getElementById("deck_grimoire");

    // ---- Injecter la carte + compteur à l'intérieur ----
    const cardHTML = `
      <div class="card_item parkgrim_cards opa_30" id="grimoire_opa" style="background-position: -700% -100%;"></div>
      <div class="card_item parkgrim_cards" id="grimoire_active" style="background-position: -700% -100%;"></div>
      <div class="table_building_counter" id="deck_grimoire_counter"></div>
  `;
    deckGrimoireSlot.insertAdjacentHTML("beforeend", cardHTML);
    const diceZone = document.getElementById("dice_zone");

    const dicefaceHTML = `
      <div id="scene_1" class="scene">
        <div class="dice" id="dice1">
          <div class="face face1"></div>
          <div class="face face2"></div>
          <div class="face face3"></div>
          <div class="face face4"></div>
          <div class="face face5"></div>
          <div class="face face6"></div>
        </div>
      </div>

      <div id="scene_2" class="scene">
        <div class="dice" id="dice2">
          <div class="face face1"></div>
          <div class="face face2"></div>
          <div class="face face3"></div>
          <div class="face face4"></div>
          <div class="face face5"></div>
          <div class="face face6"></div>
        </div>
      </div>
`;

    diceZone.insertAdjacentHTML("beforeend", dicefaceHTML);

    // -------------------- Clock Tower --------------------

    const clockZone = document.getElementById("clock_zone");
    const clockHourRot = 60 * this.gamedatas.other.clock;

    const towerHTML = `
      <div class="clock_tower" id="clock_tower_id">
        <div class="clock_hand" id="clock_hand_sprite"
          style="transform: translate(-50%, -50%) rotate(${clockHourRot}deg);">
        </div>
      </div>
    `;

    clockZone.insertAdjacentHTML("beforeend", towerHTML);
  }

  setupRiver() {
    const riverElement = document.getElementById("river_id");

    // Reset
    riverElement.innerHTML = "";
    let nb_icons = 0;

    this.gamedatas.actions_bonus.forEach((actionBonus) => {
      const actionCount = Number(actionBonus.count);
      nb_icons += actionCount;
      for (let i = 0; i < actionCount; i++) {
        if (!this._bonusUid) this._bonusUid = 0;
        this._bonusUid++;

        const iconElementId = `river_ic_${actionBonus.name}_${this._bonusUid}`;
        const iconHTML = `<div id="${iconElementId}" class="river_icon ic_${actionBonus.name}"></div>
      `;
        riverElement.insertAdjacentHTML("beforeend", iconHTML);
      }
    });

    if (nb_icons > 0) {
      this.safeClass("river_id", "remove", "closed");
    }
  }

  setupPets() {
    for (let i = 1; i < 4; i++) {
      const petData = this.gamedatas.other[`pet${i}`];
      const containerNb = petData.split("_")[0];
      const containerType = petData.split("_")[1]; // table ou l'id du joueur

      let containerColor = "";
      if (containerType !== "table") {
        containerColor = this.players[containerType].color; // ex: "ff0000"
      }

      const container = document.getElementById(`table_pet_slot_${containerNb}`);
      let borderStyle = "";
      if (containerColor) {
        const r = parseInt(containerColor.slice(0, 2), 16);
        const g = parseInt(containerColor.slice(2, 4), 16);
        const b = parseInt(containerColor.slice(4, 6), 16);
        borderStyle = `
        box-shadow:
          inset 0 0 0 4px #${containerColor},
          inset 0 0 0 9999px rgba(${r}, ${g}, ${b}, 0.3);
      `;
      }

      const petHTML = `<div id="card_pet_${i}" class="card_item pet_cards"
        style=" background-position: ${-(i - 1) * 100}% 0%; ${borderStyle}"></div>`;
      container.insertAdjacentHTML("beforeend", petHTML);
    }
  }

  setupBuildings() {
    for (let i = 1; i <= 12; i++) {
      const cardDiv = document.getElementById(`table_building_card_${i}`);

      const posX = -(i - 1) * 100; // carte 1 -> 0%, carte 2 -> -100%, etc.
      cardDiv.style.backgroundPosition = `${posX}% 0%`;

      const cardDivBlank = document.getElementById(`table_building_card_${i}_blank`);
      cardDivBlank.style.backgroundPosition = `${posX}% 0%`;
    }
  }

  setupHouses() {
    const playersArea = document.getElementById("players_area");
    const players = Object.values(this.gamedatas.players_ordered);

    const spriteIndices = [0, 1, 2, 3].sort(() => Math.random() - 0.5);

    players.forEach((player, idx) => {
      const houseIndex = spriteIndices[idx];

      // création du board
      // opacity affecte tout le contenu mais pas un background_color avec alpha
      playersArea.insertAdjacentHTML(
        "beforeend",
        `<div class="player_board" id="player_board_${player.id}" style="border-color: #${player.color};background-color: #${player.color}22;">
          <div class="building_columns">
            ${[...Array(12)].map((_, i) => `<div class="building_stack empty clickable" id="player_${player.id}_stack_${i + 1}"></div>`).join("")}
          </div>
          <div class="house_slot" id="player_${player.id}_house_slot">
            <div class="house_items" id="player_${player.id}_house_items">
              <div class="house_clues" id="player_${player.id}_house_clues" title="Clues"></div>
              <div class="house_amulet" id="amulet_${player.id}" title="Artefacts">
                  <div class="amulets amulet_1 opa_30"></div>
                  <div class="amulets amulet_2 opa_30"></div>
                  <div class="amulets amulet_3 opa_30"></div>
              </div>
            </div>
            <div class="house_cards" id="player_${player.id}_house_card"></div>
          </div>
          <div class="house_ghosts building_stack" id="player_${player.id}_house_ghost" title="Ghosts Captured"></div>
          <div class="player_label" id="player_${player.id}_label" style="color: #${player.color};background-color: #${player.color}88;">
            <div class="player_name_span">${player.name}</div>
          </div>
        </div>`,
      );

      // maison
      const card = document.getElementById(`player_${player.id}_house_card`);
      card.style.backgroundPosition = `-${houseIndex}00% 0%`;

      // containers vides pour toutes les stacks
      for (let stackIndex = 1; stackIndex <= 12; stackIndex++) {
        const stack = document.getElementById(`player_${player.id}_stack_${stackIndex}`);
        const maxCards = 5;
        let html = "";

        for (let i = 0; i < maxCards; i++) {
          html += `
          <div class="building_card_container"
              id="player_${player.id}_stack_${stackIndex}_container_${i + 1}"
              style="bottom: calc(${i} * var(--card_h) * 0.2); z-index: ${6 - i};">
          </div>`;
        }

        stack.insertAdjacentHTML("beforeend", html);
      }

      // ================= GÉNÉRATION DES CARTES HOUSE =================
      const houseCards = this.gamedatas.house_cards[player.id] ?? {};

      // regroupement par stack
      const cardsByStack = {};
      Object.values(houseCards).forEach((card) => {
        const stackIndex = Number(card.type);
        if (!cardsByStack[stackIndex]) {
          cardsByStack[stackIndex] = [];
        }
        cardsByStack[stackIndex].push(card);
      });

      // insertion des cartes
      Object.entries(cardsByStack).forEach(([stackIndex, cards]) => {
        const stack = document.getElementById(`player_${player.id}_stack_${stackIndex}`);
        stack.classList.remove("empty");

        cards.forEach((card, i) => {
          const container = document.getElementById(`player_${player.id}_stack_${stackIndex}_container_${i + 1}`);
          const bgPos = (Number(card.type) - 1) * 100;

          container.insertAdjacentHTML(
            "beforeend",
            `<div id="player_${player.id}_stack_${stackIndex}_card_${i + 1}" class="building_cards"
              style="background-position: -${bgPos}% 0%">
            </div>`,
          );
        });

        // ==== ZONE DE SELECTION ====
        const selectorHeight = cards.length > 0 ? `calc(var(--card_h) + (${cards.length - 1}) * var(--card_h) * 0.2)` : "0px";

        stack.insertAdjacentHTML(
          "beforeend",
          `<div class="stack_selector" 
                    id="player_${player.id}_stack_${stackIndex}_selector"
                    style="position: absolute; bottom: 0; left: 0; width: 100%; height: ${selectorHeight}; background-color: rgba(0,0,0,0);">
                 </div>`,
        );
      });

      console.log("petzz", this.gamedatas.players[player.id].player_clues);
      const nb_clues = this.gamedatas.players[player.id].player_clues;
      if (nb_clues > 0) {
        for (let i = 0; i < nb_clues; i++) {
          if (!this._bonusUid) this._bonusUid = 0;
          this._bonusUid++;

          const iconId = `house_ic_clue_${this._bonusUid}`;
          const html = `<div id="${iconId}" class="house_icon ic_clue"></div>`;
          const house_clues = document.getElementById(`player_${player.id}_house_clues`);

          house_clues.insertAdjacentHTML("beforeend", html);
        }
      }
    });

    this.spawnGhosts();
  }

  spawnGhosts() {
    this.gamedatas.ghost_sprites.forEach((ghost) => {
      const container = document.getElementById(`player_${ghost.position}_house_ghost`);
      if (!container) return;

      const ghostContainer = document.createElement("div");
      ghostContainer.id = `ghost_container_${ghost.id}`;
      ghostContainer.dataset.type = ghost.name.startsWith("pet") ? "pet" : "normal";
      ghostContainer.className = "ghost_single_container";

      if (ghostContainer.dataset.type === "pet") {
        container.prepend(ghostContainer);
      } else {
        container.appendChild(ghostContainer);
      }

      const col = (ghost.id - 1) % 7;
      const row = Math.floor((ghost.id - 1) / 7);
      ghostContainer.insertAdjacentHTML(
        "beforeend",
        `<div id="ghost_${ghost.id}" class="ghost_sprites"
           style="background-position: -${col}00% -${row}00%;">
        </div>`,
      );
    });
  }

  setupCounters() {
    // Player Board Counters
    Object.values(this.gamedatas.players).forEach((player) => {
      const ghost_counter = new ebg.counter();
      ghost_counter.create(`ghost_counter_${player.id}`, {
        value: player.player_ghosts,
        playerCounter: "player_ghosts",
        playerId: player.id,
      });

      const artefact_counter = new ebg.counter();
      artefact_counter.create(`artefact_counter_${player.id}`, {
        value: player.player_artefacts,
        playerCounter: "player_artefacts",
        playerId: player.id,
      });

      const n = artefact_counter.getValue();

      for (let i = 1; i <= n; i++) {
        document.querySelector(`#amulet_${player.id} .amulet_${i}`)?.classList.remove("opa_30");
      }

      const clue_counter = new ebg.counter();
      clue_counter.create(`clue_counter_${player.id}`, {
        value: player.player_clues,
        playerCounter: "player_clues",
        playerId: player.id,
      });
    });

    // --- Counters top row ---
    this.topRowCounters = {};

    const parkCounter = new ebg.counter();
    parkCounter.create("deck_park_counter", {
      value: this.gamedatas.deck_park,
      tableCounter: "deck_park",
    });
    this.topRowCounters.deck_park = parkCounter;

    const grimCounter = new ebg.counter();
    grimCounter.create("deck_grimoire_counter", {
      value: this.gamedatas.deck_grimoire,
      tableCounter: "deck_grimoire",
    });
    this.topRowCounters.deck_grimoire = grimCounter;

    // --- Counters pour chaque building sur la table ---
    this.tableBuildingCounters = {};

    for (let i = 1; i <= 12; i++) {
      const counter = new ebg.counter();
      // ID cohérent avec les cartes table
      // table_building_card_1 → table_building_counter_1
      counter.create(`table_building_counter_${i}`, {
        value: this.gamedatas[`deck_${i}`], // valeur initiale
        tableCounter: `deck_${i}`,
      });

      this.tableBuildingCounters[i] = counter;

      if (this.tableBuildingCounters[i].current_value == 0) {
        this.safeClass(`table_building_card_${i}`, "add", "empty");
      }
    }
  }

  /// INIT AND ROLL DICE

  initDice() {
    this.diceElements = [document.getElementById("dice1"), document.getElementById("dice2")];

    this.faceRotations = {
      1: { x: 0, y: 0 },
      2: { x: 0, y: -90 },
      3: { x: 0, y: -180 },
      4: { x: 0, y: 90 },
      5: { x: -90, y: 0 },
      6: { x: 90, y: 0 },
    };

    this.forcedFaces = [this.gamedatas.other.dice1, this.gamedatas.other.dice2];

    // Initial display of dice faces
    this.diceElements.forEach((dice, index) => {
      const face = this.forcedFaces[index];
      const rotation = this.faceRotations[face];

      // Apply the rotation instantly without animation
      dice.style.transition = "none";
      dice.style.transform = `rotateX(${rotation.x}deg) rotateY(${rotation.y}deg)`;
    });
  }

  async rollDice() {
    console.log("instantaneous ?", this.bga.gameui.bgaAnimationsActive());
    if (this.bga.gameui.bgaAnimationsActive() == false) {
      this.diceElements.forEach((dice, index) => {
        const face = this.forcedFaces[index];
        const target = this.faceRotations[face];

        dice.style.transition = "none";
        dice.style.transform = `rotateX(${target.x}deg) rotateY(${target.y}deg)`;
      });
      return;
    }
    return Promise.all(
      this.diceElements.map((dice, index) => {
        return new Promise((resolve) => {
          const face = this.forcedFaces[index];
          const target = this.faceRotations[face];

          // Tours complets aléatoires pour garantir l'animation
          const fullTurnsX = (Math.floor(Math.random() * 10) + 10) * 360;
          const fullTurnsY = (Math.floor(Math.random() * 10) + 10) * 360;

          const finalX = fullTurnsX + target.x;
          const finalY = fullTurnsY + target.y;

          dice.style.transition = "transform 2s cubic-bezier(0.23, 1, 0.32, 1)";
          dice.style.transform = `rotateX(${finalX}deg) rotateY(${finalY}deg)`;

          const handler = () => {
            dice.removeEventListener("transitionend", handler);
            resolve();
          };
          dice.addEventListener("transitionend", handler);
        });
      }),
    );
  }

  async animateDiceDropFromClock(duration = 2000) {
    if (this.bga.gameui.bgaAnimationsActive() == false) {
      return Promise.resolve();
    }

    const clockElement = document.getElementById("clock_tower_id") || document.getElementById("clock_zone");
    const sceneElements = [document.getElementById("scene_1"), document.getElementById("scene_2")];

    if (!clockElement || sceneElements.some((scene) => !scene)) {
      return;
    }

    const clockRect = clockElement.getBoundingClientRect();
    const clockCenterX = clockRect.left + clockRect.width / 2;
    const clockCenterY = clockRect.top + clockRect.height / 2;

    const sceneAnimations = sceneElements.map((scene) => {
      return new Promise((resolve) => {
        const computedTransform = getComputedStyle(scene).transform;
        const baseMatrix = new DOMMatrix(computedTransform === "none" ? undefined : computedTransform);

        const sceneRect = scene.getBoundingClientRect();
        const sceneCenterX = sceneRect.left + sceneRect.width / 2;
        const sceneCenterY = sceneRect.top + sceneRect.height / 2;

        const deltaX = clockCenterX - sceneCenterX;
        const deltaY = clockCenterY - sceneCenterY;

        const startMatrix = new DOMMatrix(baseMatrix);
        startMatrix.e += deltaX;
        startMatrix.f += deltaY;

        scene.style.transition = "none";
        scene.style.transform = startMatrix.toString();

        void scene.offsetWidth;

        scene.style.transition = `transform ${duration}ms cubic-bezier(0.23, 1, 0.32, 1)`;
        scene.style.transform = baseMatrix.toString();

        const onEnd = (event) => {
          if (event.propertyName !== "transform") return;
          scene.removeEventListener("transitionend", onEnd);
          scene.style.transition = "none";
          //scene.style.transform = "";
          resolve();
        };

        scene.addEventListener("transitionend", onEnd);
      });
    });

    await Promise.all(sceneAnimations);
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
    let offsetTopMinus = 165;

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
    if (document.getElementById("helpModal")) return;

    const modal = document.createElement("div");
    modal.id = "helpModal";
    modal.className = "modal";

    const html = `
      <div class="modal-content">
        <span class="close">&times;</span>
        <div class="tooltip_content">
          <div class="tooltip_bigtitle">${_("Bonus Effects")}</div>
          <div class="bonus_effects">
            <div class="effect">
              <div class="logo lo_reroll"></div>
              <div class="effect_desc">${_("As soon as you take a Building card with this effect, flip your Reroll token to its available side.")}</div>
            </div>
            <div class="effect">
              <div class="logo lo_clock"></div>
              <div class="effect_desc">${_("As soon as you take a Building card with this effect, move the clock hand one step clockwise and apply the effect shown by the hand.")}</div>
            </div>
          </div>

          <div class="tooltip_bigtitle">${_("Other Effects")}</div>
          <div class="other_effects">
            <div class="effect">
              <div class="icon ic_ghost"></div>
              <div class="effect_desc">${_("Once revealed, the Ghost is captured! Place it to the right of your House board.")}</div>
            </div>
            <div class="effect">
              <div class="icon ic_pet"></div>
              <div class="effect_desc">${_("Take a Ghost Pet card from the center of the table. If there aren't any left, steal a Ghost Pet from any player. Place it to the right of your House board. <b>It counts as a Ghost.</b>")}</div>
            </div>
            <div class="effect">
              <div class="icon ic_clock"></div>
              <div class="effect_desc">${_("Move the clock hand one step clockwise and apply the effect shown by the hand.")}</div>
            </div>
            <div class="effect">
              <div class="icon ic_grimoire"></div>
              <div class="effect_desc">${_("Reveal the top Grimoire card and apply its effect.")}</div>
            </div>
            <div class="effect">
              <div class="icon ic_clue"></div>
              <div class="effect_desc">${_("If you have gained one or more of these Clues, you may <i>Go to the Park.</i>")}</div>
            </div>
            <div class="effect">
              <div class="icon ic_artefact"></div>
              <div class="effect_desc">${_("Take 1 Amulet fragment from the reserve and place it in front of you.")}</div>
            </div>
            <div class="effect">
              <div class="icon ic_reroll_0"></div>
              <div class="effect_desc">${_("Place your Reroll token to its available side.")}</div>
            </div>
            <div class="effect">
              <div class="icon ic_draw8"></div>
              <div class="effect_desc">${_("Take a Building card of value 8 or less (you choose).")}</div>
            </div>
            <div class="effect">
              <div class="icon ic_draw_any"></div>
              <div class="effect_desc">${_("Take any Building card.")}</div>
            </div>
            <div class="effect">
              <div class="icon ic_flip8"></div>
              <div class="effect_desc">${_("Flip <b>one</b> of your Building cards of value 8 or less (you choose).")}</div>
            </div>
            <div class="effect">
              <div class="icon ic_flip9"></div>
              <div class="effect_desc">${_("Flip <b>one</b> of your Building cards of value 9 or more (you choose).")}</div>
            </div>
            <div class="effect">
              <div class="icon ic_replay"></div>
              <div class="effect_desc">${_("At the end of your turn, immediately take another turn.")}</div>
            </div>
            <div class="effect">
              <div class="icon ic_empty"></div>
              <div class="effect_desc">${_("No effect.")}</div>
            </div>
          </div>
        </div>
      </div>
      `;

    modal.innerHTML = html;
    document.body.appendChild(modal);

    const closeButton = modal.querySelector(".close");

    modal.style.display = "flex";

    closeButton.addEventListener("click", () => modal.remove());

    window.addEventListener(
      "click",
      (event) => {
        if (event.target === modal) modal.remove();
      },
      { once: true },
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
    this.zoom_factor = Math.max(0.3, this.zoom_factor - 0.05);
    window.localStorage.setItem("ST_zoom", this.zoom_factor);

    this.updateBoardZoom();
  }

  updateBoardZoom() {
    // Met à jour le scale CSS pour les cartes
    document.documentElement.style.setProperty("--st_scale", this.zoom_factor);
    console.log("zoom_factor update", this.zoom_factor);
  }

  //////////////////////////////////////////////////////////////
  //                                                          //
  //     _          _                 _   _                   //
  //    / \   _ __ (_)_ __ ___   __ _| |_(_) ___  _ __  ___   //
  //   / _ \ | '_ \| | '_ ` _ \ / _` | __| |/ _ \| '_ \/ __|  //
  //  / ___ \| | | | | | | | | | (_| | |_| | (_) | | | \__ \  //
  // /_/   \_\_| |_|_|_| |_| |_|\__,_|\__|_|\___/|_| |_|___/  //
  //                                                          //
  //////////////////////////////////////////////////////////////

  async animFlipReroll(playerId) {
    const icon = document.getElementById(`icon_reroll_${playerId}`);
    if (!icon) return;

    // Bloquer les multiclics
    if (icon.dataset.flipping === "true") return;
    icon.dataset.flipping = "true";

    const half = this.bga.gameui.bgaAnimationsActive() == false ? 0 : 200; // durée demi-flip

    // Premier demi-flip
    icon.style.transition = `transform ${half}ms ease-in-out`;
    icon.style.transform = "rotateY(90deg) translateY(-5px) scale(1.05)";
    await new Promise((resolve) => setTimeout(resolve, half));

    // Swap du sprite
    icon.classList.toggle("ic_reroll_0");
    icon.classList.toggle("ic_reroll_1");

    // Deuxième demi-flip
    icon.style.transform = "rotateY(0deg) translateY(0px) scale(1)";
    await new Promise((resolve) => setTimeout(resolve, half));

    // Reset
    icon.style.transition = "none";
    //icon.style.transform = "";
    delete icon.dataset.flipping;
  }

  async animFlipPark(versoCol) {
    const park = document.getElementById("park_active");
    if (!park) return;

    // Bloquer les multiclics
    if (park.dataset.flipping === "true") return;
    park.dataset.flipping = "true";

    this.safeClass(".selectable", "remove", "selectable");
    this.safeClass(".selected", "remove", "selected");

    // Changer l'id de la carte avant le flip
    park.id = "park_active_verso";

    // Durée demi-flip : 0 si instantané, 200ms sinon
    const half = this.bga.gameui.bgaAnimationsActive() == false ? 0 : 200;

    // Premier demi-flip
    park.style.transition = `transform ${half}ms ease-in-out`;
    park.style.transform = "rotateY(90deg) translateY(-5px) scale(1.05)";
    await new Promise((r) => setTimeout(r, half));

    // Changement visuel : verso
    park.style.backgroundPosition = `-${versoCol}00% 0%`;

    // Deuxième demi-flip
    park.style.transform = "rotateY(0deg) translateY(0px) scale(1)";
    await new Promise((r) => setTimeout(r, half));

    // Reset
    park.style.transition = "none";
    //park.style.transform = "";
    delete park.dataset.flipping;
  }

  async animFlipGrimoire(grimoireType, playerId) {
    const grimoire = document.getElementById("grimoire_active");
    if (!grimoire) return;

    // Bloquer les multiclics
    if (grimoire.dataset.flipping === "true") return;
    grimoire.dataset.flipping = "true";

    this.safeClass(".selectable", "remove", "selectable");
    this.safeClass(".selected", "remove", "selected");

    // Changer l'id de la carte avant le flip
    grimoire.id = "grimoire_active_verso";

    const versoCol = grimoireType - 1;
    const half = this.bga.gameui.bgaAnimationsActive() == false ? 0 : 200;

    // Premier demi-flip
    grimoire.style.transition = `transform ${half}ms ease-in-out`;
    grimoire.style.transform = "rotateY(90deg) translateY(-5px) scale(1.05)";
    await new Promise((resolve) => setTimeout(resolve, half));

    // Changement visuel : verso
    grimoire.style.backgroundPosition = `-${versoCol}00% -100%`;

    // Deuxième demi-flip
    grimoire.style.transform = "rotateY(0deg) translateY(0px) scale(1)";
    await new Promise((resolve) => setTimeout(resolve, half));

    // Reset
    grimoire.style.transition = "none";
    //grimoire.style.transform = "";
    delete grimoire.dataset.flipping;
  }

  async animClockTower(playerId) {
    const hand = document.getElementById("clock_hand_sprite");
    if (!hand) return;

    // Bloquer les multiclics si nécessaire
    if (hand.dataset.animating === "true") return;
    hand.dataset.animating = "true";

    this.safeClass(".selectable", "remove", "selectable");
    this.safeClass(".selected", "remove", "selected");

    // Récupère l’angle de rotation actuel
    const currentTransform = hand.style.transform;
    const match = currentTransform.match(/rotate\(([-\d.]+)deg\)/);
    let currentDeg = match ? parseFloat(match[1]) : this.gamedatas.other.clock * 60;

    const nextDeg = currentDeg + 60;
    const duration = this.bga.gameui.bgaAnimationsActive() == false ? 0 : 600;

    if (duration === 0) {
      hand.style.transition = "none";
      hand.style.transform = `translate(-50%, -50%) rotate(${nextDeg}deg)`;
      this.gamedatas.other.clock = (this.gamedatas.other.clock + 1) % 6;
      delete hand.dataset.animating;
    } else {
      hand.style.transition = `transform ${duration}ms ease-in-out`;
      hand.style.transform = `translate(-50%, -50%) rotate(${nextDeg}deg)`;

      // attendre la fin de l'animation
      await new Promise((resolve) => {
        const onTransitionEnd = (event) => {
          if (event.propertyName === "transform") {
            hand.removeEventListener("transitionend", onTransitionEnd);
            hand.style.transition = "none";
            resolve();
          }
        };
        hand.addEventListener("transitionend", onTransitionEnd);
      });

      this.gamedatas.other.clock = (this.gamedatas.other.clock + 1) % 6;
      delete hand.dataset.animating;
    }

    // ⚡ Animation des artefacts selon clock
    if (this.gamedatas.other.clock === 0 || this.gamedatas.other.clock === 3) {
      if (!this._bonusUid) this._bonusUid = 0;
      this._bonusUid++;

      const iconId = `house_ic_artefact_${this._bonusUid}`;
      const html = `<div id="${iconId}" class="icon ic_artefact"></div>`;
      hand.insertAdjacentHTML("beforeend", html);
      const iconElt = document.getElementById(iconId);

      const panel_artefacts = document.getElementById(`icon_artefact_${playerId}`);
      this.animationManager.slideOutAndDestroy(iconElt, panel_artefacts, 600, 0).then(() => {
        // enlever opa_30 sur la prochaine amulette encore opaque
        const nextAmulet = Array.from(document.querySelectorAll(`#amulet_${playerId} .amulets`)).find((el) => el.classList.contains("opa_30"));
        if (nextAmulet) nextAmulet.classList.remove("opa_30");
      });

      await new Promise((r) => setTimeout(r, 80));
    }
  }

  async animTakeCard(buildingNumber, playerId, nbRemaining) {
    const elt_id = `table_building_card_${buildingNumber}`;
    const sourceCard = document.getElementById(elt_id);

    this.safeClass(".selectable", "remove", "selectable");
    this.safeClass(".selected", "remove", "selected");

    // Stack cible
    const stackElt = document.getElementById(`player_${playerId}_stack_${buildingNumber}`);

    // Appeler la fonction de déplacement
    await this.moveBuildingToStack(sourceCard, stackElt, playerId, nbRemaining);
  }

  async moveBuildingToStack(card, stackElt, playerId, nbRemaining) {
    const stackId = card.id.split("_").pop();

    // on révèle le stack
    stackElt.classList.remove("empty");

    const containers = stackElt.querySelectorAll(".building_card_container");
    if (containers.length === 0) return;

    const existingCards = [];
    containers.forEach((container) => {
      if (container.children.length > 0) {
        existingCards.push(container.children[0]);
      }
    });

    // ⚡ Mode instantané : état final direct
    if (this.bga.gameui.bgaAnimationsActive() == false) {
      // déplacer les cartes existantes
      existingCards.forEach((cardElement, i) => {
        const nextContainer = containers[i + 1];
        if (!nextContainer) return;

        nextContainer.appendChild(cardElement);
        cardElement.id = `player_${playerId}_stack_${stackId}_card_${i + 2}`;
      });

      // ✅ créer une copie comme en mode animé
      const newCard = card.cloneNode(true);

      containers[0].appendChild(newCard);
      newCard.id = `player_${playerId}_stack_${stackId}_card_1`;

      // ✅ ne modifier l'original QUE si nécessaire
      if (nbRemaining == 0) {
        this.safeClass(card, "add", "empty");
      }

      return;
    }

    // 🎞️ Mode animé normal
    // on créé une copie de la carte
    const flyingCard = card.cloneNode(true);
    flyingCard.style.width = "100%";
    flyingCard.style.height = "100%";
    flyingCard.style.position = "absolute";
    card.parentElement.appendChild(flyingCard);

    const animations = [];

    existingCards.forEach((cardElement, i) => {
      const nextContainer = containers[i + 1];
      if (!nextContainer) return;

      // on envoie chaque carte existante dans le container suivant
      animations.push(() =>
        this.animationManager.slideAndAttach(cardElement, nextContainer, { duration: 600, bump: 1 }).then(() => {
          cardElement.id = `player_${playerId}_stack_${stackId}_card_${i + 2}`;
        }),
      );
    });

    const targetContainer = containers[0];
    animations.push(() =>
      this.animationManager.slideAndAttach(flyingCard, targetContainer, { duration: 600 }).then(() => {
        flyingCard.id = `player_${playerId}_stack_${stackId}_card_1`;
        if (nbRemaining == 0) {
          // ne fonctionne pas pour les autres joueurs si on compare avec le counter
          this.safeClass(card, "add", "empty");
        }
      }),
    );
    await this.animationManager.playParallel(animations);
  }

  async animFlipStack(stackId, cardsInfos, playerId) {
    // le stack à flipper
    const stack = document.getElementById(`player_${playerId}_stack_${stackId}`);
    // les cartes dans le stack
    const cards = Array.from(stack.querySelectorAll(".building_cards"));

    // pour bloquer les multiclics
    if (stack.dataset.flipping === "true") return;
    stack.dataset.flipping = "true";

    this.safeClass(".selectable", "remove", "selectable");
    this.safeClass(".selected", "remove", "selected");

    // Trier les cartes par position (bas → haut)
    cardsInfos.sort((a, b) => a.position - b.position);

    // ⚡ Mode instantané
    if (this.bga.gameui.bgaAnimationsActive() == false) {
      cards.forEach((card, i) => {
        const info = cardsInfos[i];
        if (!info) return;

        // on définit le verso de la carte
        const card_offset = (info.type - 1) * 5 + (info.type_arg - 1);
        const col = card_offset % 12;
        const row = 1 + Math.floor(card_offset / 12);
        card.style.backgroundPosition = `-${col * 100}% -${row * 100}%`;
        card.style.transition = "none";
        //card.style.transform = "";

        const container = card.parentElement;
        container.style.zIndex = 6 - parseInt(container.style.zIndex || "0", 10);
      });

      delete stack.dataset.flipping;
      return;
    }

    // 🎞️ Mode animé
    const half = 200;

    // Définir z-index des conteneurs
    cards.forEach((card) => {
      const container = card.parentElement;
      container.style.zIndex = 6 - parseInt(container.style.zIndex || "0", 10);
    });

    // le flip de chaque carte
    await Promise.all(
      cards.map(
        (card, i) =>
          new Promise(async (resolve) => {
            const info = cardsInfos[i];
            if (!info) return resolve();

            await new Promise((r) => setTimeout(r, i * 50)); // décalage entre cartes

            // Premier demi-flip
            card.style.transition = `transform ${half}ms ease-in-out`;
            card.style.transform = "rotateY(90deg)";
            await new Promise((r) => setTimeout(r, half));

            // Appliquer le verso
            const card_offset = (info.type - 1) * 5 + (info.type_arg - 1);
            const col = card_offset % 12;
            const row = 1 + Math.floor(card_offset / 12);
            card.style.backgroundPosition = `-${col * 100}% -${row * 100}%`;

            // Deuxième demi-flip
            card.style.transform = "rotateY(0deg)";
            await new Promise((r) => setTimeout(r, half));

            // Reset transition
            card.style.transition = "none";
            //card.style.transform = "";

            resolve();
          }),
      ),
    );

    delete stack.dataset.flipping;
  }

  async animGetRewards(no_house, cardsInfos, playerId) {
    const stack = document.getElementById(`player_${playerId}_stack_${no_house}`);
    const cards = Array.from(stack.querySelectorAll(".building_cards"));

    if (!cards.length) {
      stack.classList.add("empty");
      return;
    }

    if (stack.dataset.animating === "true") return;
    stack.dataset.animating = "true";

    // 🔑 compteur déterministe
    if (!this._bonusUid) this._bonusUid = 0;

    cardsInfos.sort((a, b) => a.position - b.position);

    const riverElt = document.getElementById("river_id");

    // ⚡ MODE INSTANTANÉ
    if (this.bga.gameui.bgaAnimationsActive() == false) {
      for (let i = cards.length - 1; i >= 0; i--) {
        const cardEl = cards[i];
        const info = cardsInfos[i];
        if (!info) continue;

        const card_idx = info.type + info.type_arg;
        const bonuses = this.gamedatas.building_cards[card_idx] || [];

        cardEl.remove();

        bonuses.forEach((bonus) => {
          const ic = bonus.includes("_") ? bonus.split("_")[0] : bonus;
          if (!ic) return;

          this._bonusUid++;
          const uid = this._bonusUid;

          if (["grimoire", "clock", "flip8", "flip9", "draw8", "pet"].includes(ic)) {
            const iconId = `river_ic_${bonus}_${uid}`;
            riverElt.insertAdjacentHTML("beforeend", `<div id="${iconId}" class="river_icon ic_${ic}"></div>`);
          } else if (ic === "replay") {
            const replay = document.getElementById(`panel_ic_replay`);
            if (!replay) {
              const panel = document.getElementById(`bottom_board_${playerId}`);
              const iconId = `panel_ic_replay`;
              panel.insertAdjacentHTML("beforeend", `<div id="${iconId}" class="icon ic_replay"></div>`);
            }
          } else if (ic === "clue") {
            const house_clues = document.getElementById(`player_${playerId}_house_clues`);
            const iconId = `house_ic_clue_${uid}`;
            house_clues.insertAdjacentHTML("beforeend", `<div id="${iconId}" class="icon ic_${ic}"></div>`);
          } else if (ic === "ghost") {
            const ghost_idx = parseInt(bonus.split("_")[1]);
            const ghost_id = `ghost_${ghost_idx}`;
            this.moveGhostToHouse(ghost_id, stack, playerId);
          }
        });
      }

      stack.classList.add("empty");
      delete stack.dataset.animating;
      return;
    }

    // 🎞️ MODE ANIMÉ
    for (let i = cards.length - 1; i >= 0; i--) {
      const cardEl = cards[i];
      const info = cardsInfos[i];
      if (!info) continue;

      const card_idx = info.type + info.type_arg;
      const bonuses = this.gamedatas.building_cards[card_idx] || [];
      const parent = cardEl.parentElement;

      // disparition carte
      cardEl.style.transition = "transform 400ms ease, opacity 400ms ease";
      cardEl.style.transform = "scale(0)";
      cardEl.style.opacity = "0";
      await new Promise((r) => setTimeout(r, 400));

      cardEl.remove();

      for (let bonus of bonuses) {
        const ic = bonus.includes("_") ? bonus.split("_")[0] : bonus;
        if (!ic) continue;

        this._bonusUid++;
        const uid = this._bonusUid;

        if (["grimoire", "clock", "flip8", "flip9", "draw8", "pet"].includes(ic)) {
          const iconId = `river_ic_${bonus}_${uid}`;
          parent.insertAdjacentHTML("beforeend", `<div id="${iconId}" class="river_icon ic_${ic}"></div>`);

          const iconEl = document.getElementById(iconId);

          if (riverElt.classList.contains("closed")) {
            await this.showRiver();
          }

          this.animationManager.slideAndAttach(iconEl, riverElt, 600, 0, null);
        } else if (ic === "replay") {
          const replay = document.getElementById(`panel_ic_replay`);
          if (!replay) {
            const iconId = `panel_ic_replay`;
            parent.insertAdjacentHTML("beforeend", `<div id="${iconId}" class="icon ic_replay"></div>`);

            const iconEl = document.getElementById(iconId);
            const panel = document.getElementById(`bottom_board_${playerId}`);

            this.animationManager.slideAndAttach(iconEl, panel, 600, 0, null);
          }
        } else if (ic === "clue") {
          const iconId = `house_ic_clue_${uid}`;
          parent.insertAdjacentHTML("beforeend", `<div id="${iconId}" class="icon ic_${ic}"></div>`);

          const iconEl = document.getElementById(iconId);
          const house_clues = document.getElementById(`player_${playerId}_house_clues`);

          this.animationManager.slideAndAttach(iconEl, house_clues, 600, 0, null);
        } else if (ic === "ghost") {
          const ghost_idx = parseInt(bonus.split("_")[1]);
          const ghost_id = `ghost_${ghost_idx}`;
          await this.moveGhostToHouse(ghost_id, parent, playerId);
        }
      }
    }

    stack.classList.add("empty");
    delete stack.dataset.animating;
  }

  async moveGhostToHouse(ghostId, startElement, playerId) {
    const houseContainer = document.getElementById(`player_${playerId}_house_ghost`);
    if (!houseContainer) return;
    // Type du ghost
    const ghostType = ghostId.toString().startsWith("pet_") ? "pet" : "normal";

    const index = this.gamedatas.ghost_assets.indexOf(ghostId);
    if (index === -1) return;

    const idx = index + 1;

    // Créer le container
    const ghostContainer = document.createElement("div");
    ghostContainer.id = `ghost_container_${idx}`;
    ghostContainer.dataset.type = ghostType;
    ghostContainer.className = "ghost_single_container";

    if (ghostType === "pet") {
      houseContainer.prepend(ghostContainer);
    } else {
      houseContainer.appendChild(ghostContainer);
    }

    // ✅ Utiliser le bon index dans ghost_assets

    const col = index % 7;
    const row = Math.floor(index / 7);

    // Créer le sprite correctement
    startElement.insertAdjacentHTML(
      "beforeend",
      `<div id="ghost_${idx}" class="ghost_sprites"
       style="background-position: -${col}00% -${row}00%;"></div>`,
    );

    const spriteElement = document.getElementById(`ghost_${idx}`);
    if (!spriteElement) return;

    // Animation vers le container
    try {
      await this.animationManager.slideAndAttach(spriteElement, ghostContainer, 800);
      ghostContainer.appendChild(spriteElement);
    } catch (err) {
      console.error("Animation moveGhostToHouse error:", err);
    }
  }

  async toggleRiver() {
    const riverElt = document.getElementById("river_id");
    if (!riverElt) return;

    // ⚡ Mode instantané : état final direct
    if (this.bga.gameui.bgaAnimationsActive() == false) {
      riverElt.style.transition = "none";
      riverElt.classList.toggle("closed");
      return;
    }

    // 🎞️ Mode animé normal
    riverElt.classList.toggle("closed");

    await new Promise((resolve) => setTimeout(resolve, 400));
  }

  async showRiver() {
    const riverElt = document.getElementById("river_id");
    if (!riverElt) return;

    // Si déjà ouvert, rien à faire
    if (!riverElt.classList.contains("closed")) return;

    // ⚡ Mode instantané : état final
    if (this.bga.gameui.bgaAnimationsActive() == false) {
      riverElt.classList.remove("closed");
      riverElt.style.transition = "none";
      return;
    }

    // 🎞️ Mode animé
    riverElt.classList.remove("closed");
    await new Promise((resolve) => setTimeout(resolve, 400));
  }

  async hideRiver() {
    const riverElt = document.getElementById("river_id");
    if (!riverElt) return;

    // Si déjà fermé, rien à faire
    if (riverElt.classList.contains("closed")) return;

    // ⚡ Mode instantané : état final
    if (this.bga.gameui.bgaAnimationsActive() == false) {
      riverElt.classList.add("closed");
      riverElt.style.transition = "none";
      return;
    }

    // 🎞️ Mode animé
    riverElt.classList.add("closed");
    await new Promise((resolve) => setTimeout(resolve, 400));
  }

  async animFlipSoloStack(stackId, cardsInfos, playerId) {
    console.log("animFlipSolo");
    const stack = document.getElementById(`player_${playerId}_stack_${stackId}`);
    if (!stack) return;

    if (stack.dataset.flipping === "true") return;
    stack.dataset.flipping = "true";

    this.safeClass(".selectable", "remove", "selectable");
    this.safeClass(".selected", "remove", "selected");

    const card = stack.querySelector(".building_cards");
    const info = cardsInfos?.[0];

    if (!card || !info) {
      delete stack.dataset.flipping;
      return;
    }

    const half = 200;

    const card_offset = (info.type - 1) * 5 + (info.type_arg - 1);
    const col = card_offset % 12;
    const row = 1 + Math.floor(card_offset / 12);

    if (this.bga.gameui.bgaAnimationsActive() == false) {
      card.style.backgroundPosition = `-${col * 100}% -${row * 100}%`;
      card.style.transition = "none";
      //card.style.transform = "";
      delete stack.dataset.flipping;
      return;
    }

    card.style.transition = `transform ${half}ms ease-in-out`;
    card.style.transform = "rotateY(90deg)";
    await new Promise((r) => setTimeout(r, half));

    card.style.backgroundPosition = `-${col * 100}% -${row * 100}%`;

    card.style.transform = "rotateY(0deg)";
    await new Promise((r) => setTimeout(r, half));

    card.style.transition = "none";
    //card.style.transform = "";

    //card.remove(); // uniquement si c’est vraiment voulu

    delete stack.dataset.flipping;
  }

  async animGetRewardsSolo(no_house, cardsInfos, playerId) {
    console.log("animGetRewardsSolo");

    const river = document.getElementById("river_id");
    const stack = document.getElementById(`player_${playerId}_stack_${no_house}`);
    const cards = Array.from(stack.querySelectorAll(".building_cards"));

    this.safeClass(".selectable", "remove", "selectable");
    this.safeClass(".selected", "remove", "selected");

    if (!cards.length) {
      stack.classList.add("empty");
      return;
    }

    if (stack.dataset.animating === "true") return;
    stack.dataset.animating = "true";

    // 🔑 compteur déterministe global
    if (!this._bonusUid) this._bonusUid = 0;

    cardsInfos.sort((a, b) => a.position - b.position);

    const cardEl = cards[0];
    const info = cardsInfos[0];

    if (!info) {
      stack.classList.add("empty");
      delete stack.dataset.animating;
      return;
    }

    const card_idx = info.type + info.type_arg;
    const bonuses = this.gamedatas.building_cards[card_idx] || [];
    const parent = cardEl.parentElement;

    // ⚡ MODE INSTANTANÉ
    if (this.bga.gameui.bgaAnimationsActive() == false) {
      cardEl.remove();

      for (let bonus of bonuses) {
        const ic = bonus.includes("_") ? bonus.split("_")[0] : bonus;
        if (!ic) continue;

        this._bonusUid++;
        const uid = this._bonusUid;

        if (["grimoire", "clock", "flip8", "flip9", "draw8", "pet"].includes(ic)) {
          const iconId = `river_ic_${bonus}_${uid}`;
          river.insertAdjacentHTML("beforeend", `<div id="${iconId}" class="river_icon ic_${ic}"></div>`);
        } else if (ic === "replay") {
          const panel = document.getElementById(`bottom_board_${playerId}`);
          const iconId = `panel_ic_replay_${uid}`;
          panel.insertAdjacentHTML("beforeend", `<div id="${iconId}" class="icon ic_${ic}"></div>`);
        } else if (ic === "clue") {
          const house_clues = document.getElementById(`player_${playerId}_house_clues`);
          const iconId = `house_ic_clue_${uid}`;
          house_clues.insertAdjacentHTML("beforeend", `<div id="${iconId}" class="icon ic_${ic}"></div>`);
        } else if (ic === "ghost") {
          const ghost_idx = parseInt(bonus.split("_")[1]);
          const ghost_id = `ghost_${ghost_idx}`;
          await this.moveGhostToHouse(ghost_id, parent, playerId);
        }
      }

      if (cards.length == 1) {
        stack.classList.add("empty");
      }

      delete stack.dataset.animating;
      return;
    }

    // 🎞️ MODE ANIMÉ
    cardEl.style.transition = "transform 400ms ease, opacity 400ms ease";
    cardEl.style.transform = "scale(0)";
    cardEl.style.opacity = "0";

    await new Promise((r) => setTimeout(r, 400));

    cardEl.remove();

    for (let bonus of bonuses) {
      const ic = bonus.includes("_") ? bonus.split("_")[0] : bonus;
      if (!ic) continue;

      this._bonusUid++;
      const uid = this._bonusUid;

      if (["grimoire", "clock", "flip8", "flip9", "draw8", "pet"].includes(ic)) {
        const iconId = `river_ic_${bonus}_${uid}`;
        parent.insertAdjacentHTML("beforeend", `<div id="${iconId}" class="river_icon ic_${ic}"></div>`);

        const iconEl = document.getElementById(iconId);

        if (river.classList.contains("closed")) {
          await this.showRiver();
        }

        this.animationManager.slideAndAttach(iconEl, river, 600, 0, null);
      } else if (ic === "replay") {
        const iconId = `panel_ic_replay_${uid}`;
        parent.insertAdjacentHTML("beforeend", `<div id="${iconId}" class="icon ic_${ic}"></div>`);

        const iconEl = document.getElementById(iconId);
        const panel = document.getElementById(`bottom_board_${playerId}`);

        this.animationManager.slideAndAttach(iconEl, panel, 600, 0, null);
      } else if (ic === "clue") {
        const iconId = `house_ic_clue_${uid}`;
        parent.insertAdjacentHTML("beforeend", `<div id="${iconId}" class="icon ic_${ic}"></div>`);

        const iconEl = document.getElementById(iconId);
        const house_clues = document.getElementById(`player_${playerId}_house_clues`);

        this.animationManager.slideAndAttach(iconEl, house_clues, 600, 0, null);
      } else if (ic === "ghost") {
        const ghost_idx = parseInt(bonus.split("_")[1]);
        const ghost_id = `ghost_${ghost_idx}`;
        await this.moveGhostToHouse(ghost_id, parent, playerId);
      }
    }

    if (cards.length == 1) {
      stack.classList.add("empty");
    }

    delete stack.dataset.animating;
  }

  async animShiftStackCards(stackId, playerId) {
    // on décale les cartes après avoir flippé l'une d'entre elles
    const stack = document.getElementById(`player_${playerId}_stack_${stackId}`);

    const containers = Array.from(stack.querySelectorAll(".building_card_container"));
    if (containers.length === 0) return;

    console.log("Stack Length", containers.length);

    // ⚡ Mode instantané : on déplace directement
    if (this.bga.gameui.bgaAnimationsActive() == false) {
      // Parcours croissant
      for (let i = 1; i < containers.length; i++) {
        const currentContainer = containers[i];
        const prevContainer = containers[i - 1];
        if (currentContainer.children.length === 0) continue;

        const card = currentContainer.children[0];
        prevContainer.appendChild(card);

        // Renommer correctement
        card.id = `player_${playerId}_stack_${stackId}_card_${i}`;
      }
      return;
    }

    // 🎞️ Mode animé : glisser les cartes vers le container précédent
    const animations = [];
    for (let i = 1; i < containers.length; i++) {
      const currentContainer = containers[i];
      const prevContainer = containers[i - 1];
      if (currentContainer.children.length === 0) continue;

      // on décale les cartes
      const card = currentContainer.children[0];
      animations.push(() =>
        this.animationManager.slideAndAttach(card, prevContainer, { duration: 600, bump: 1 }).then(() => {
          card.id = `player_${playerId}_stack_${stackId}_card_${i}`;
        }),
      );
    }

    await this.animationManager.playParallel(animations);
  }

  async animRemoveBonus(bonus_type) {
    // Sélecteur du premier élément correspondant
    const selector = `[id^="river_ic_${bonus_type}"]`;
    const bonusElement = document.querySelector(selector);

    if (!bonusElement) {
      console.log("No bonus element found for", bonus_type);
      return;
    }

    if (this.bga.gameui.bgaAnimationsActive() == false) {
      // Mode instantané : suppression directe
      bonusElement.remove();
      console.log("Bonus removed instantly:", bonusElement.id);
      return;
    }

    // 1️⃣ Animation disparition
    bonusElement.style.transition = "transform 400ms ease, opacity 400ms ease";
    bonusElement.style.transform = "scale(0)";
    bonusElement.style.opacity = "0";

    // Attente de la fin de l'animation
    await new Promise((resolve) => setTimeout(resolve, 400));

    // Suppression du DOM
    bonusElement.remove();

    console.log("Bonus removed:", bonusElement.id);
  }

  async animRemoveClue(playerId) {
    // Sélecteur du conteneur des indices du joueur
    console.log(`player_${playerId}_house_clues`);
    const container = document.getElementById(`player_${playerId}_house_clues`);

    if (!container || container.children.length === 0) {
      console.log("No clue found for player", playerId);
      return;
    }

    // On prend le premier enfant
    const clueElement = container.children[0];

    if (this.bga.gameui.bgaAnimationsActive() == false) {
      // Mode instantané : suppression directe
      clueElement.remove();
      console.log("Clue removed instantly:", clueElement.id);
      return;
    }

    // 1️⃣ Animation disparition
    clueElement.style.transition = "transform 400ms ease, opacity 400ms ease";
    clueElement.style.transform = "scale(0)";
    clueElement.style.opacity = "0";

    // Attente de la fin de l'animation
    await new Promise((resolve) => setTimeout(resolve, 400));

    // Suppression du DOM
    clueElement.remove();

    console.log("Clue removed:", clueElement.id);
  }

  async animRemoveReplay() {
    const replayElement = document.getElementById("panel_ic_replay");
    if (!replayElement) {
      console.log("No replay element found");
      return;
    }

    if (this.bga.gameui.bgaAnimationsActive() == false) {
      replayElement.remove();
      console.log("Replay removed instantly");
      return;
    }

    // Animation de disparition
    replayElement.style.transition = "transform 400ms ease, opacity 400ms ease";
    replayElement.style.transform = "scale(0)";
    replayElement.style.opacity = "0";

    await new Promise((resolve) => setTimeout(resolve, 400));

    replayElement.remove();

    console.log("Replay removed");
  }

  async animRemoveGrimoire() {
    const oldCard = document.getElementById("grimoire_active_verso");
    if (!oldCard) {
      console.log("No grimoire element found");
      return;
    }

    // 1️⃣ Vérifier le compteur AVANT suppression
    const counterValue = this.topRowCounters.deck_grimoire.getValue();

    if (counterValue > 0) {
      const counterDiv = document.getElementById("deck_grimoire_counter");
      if (counterDiv) {
        counterDiv.insertAdjacentHTML(
          "afterend",
          `
        <div class="card_item parkgrim_cards"
             id="grimoire_active"
             style="background-position: -700% -100%;">
        </div>
        `,
        );
      }
    }

    // 2️⃣ Mode instantané
    if (this.bga.gameui.bgaAnimationsActive() == false) {
      oldCard.remove();
      return;
    }

    // 3️⃣ Animation disparition ancienne carte
    oldCard.style.transition = "transform 400ms ease, opacity 400ms ease";
    oldCard.style.transform = "scale(0)";
    oldCard.style.opacity = "0";

    await new Promise((resolve) => setTimeout(resolve, 400));

    oldCard.remove();
  }

  async animRemovePark(playerId) {
    const oldCard = document.getElementById("park_active_verso");
    if (!oldCard) {
      console.log("No park element found");
      return;
    }

    // 1️⃣ Vérifier le compteur APRES suppression
    const counterValue = this.topRowCounters.deck_park.getValue();

    console.log("ARP park counterValue", counterValue);

    if (counterValue > 0) {
      const counterDiv = document.getElementById("deck_park_counter");
      if (counterDiv) {
        let col;

        // Détermination du nombre de cartes à supprimer
        let numClues;
        if (counterValue == 4) {
          numClues = 1;
        } else if (counterValue >= 1 && counterValue <= 3) {
          numClues = 2;
        } else {
          numClues = 3;
        }

        if (counterValue >= 2 && counterValue <= 4) {
          col = 6;
        } else {
          col = 7;
        }

        // Calcul position pour la nouvelle carte
        const posX = -(col * 100); // chaque colonne = -100%

        // Insertion de la nouvelle carte
        counterDiv.insertAdjacentHTML(
          "afterend",
          `
        <div class="card_item parkgrim_cards"
             id="park_active"
             style="background-position: ${posX}% 0%;">
        </div>
        `,
        );

        // 🔹 Suppression des indices correspondants
        console.log("ARP park numClues", numClues);
        for (let i = 0; i < numClues; i++) {
          await this.animRemoveClue(playerId);
        }
      }
    }

    // 2️⃣ Mode instantané
    if (this.bga.gameui.bgaAnimationsActive() == false) {
      oldCard.remove();
      return;
    }

    // 3️⃣ Animation disparition ancienne carte
    oldCard.style.transition = "transform 400ms ease, opacity 400ms ease";
    oldCard.style.transform = "scale(0)";
    oldCard.style.opacity = "0";

    await new Promise((resolve) => setTimeout(resolve, 400));

    oldCard.remove();
  }

  async animZoomOutReward() {
    const deckGrimoireSlot = document.getElementById("deck_grimoire");
    if (!deckGrimoireSlot) return;

    console.log("bonus", bonus);

    if (!this._bonusUid) this._bonusUid = 0;
    this._bonusUid++;

    const iconId = `grimoire_ic_${bonus}_${this._bonusUid}`;
    const html = `<div id="${iconId}" class="river_icon ic_${bonus}"></div>`;
    deckGrimoireSlot.insertAdjacentHTML("beforeend", html);

    const icon = document.getElementById(iconId);
    if (!icon) return;

    // Force le navigateur à appliquer l’état initial
    icon.offsetWidth;

    // 🎬 Déclenche l'animation
    icon.style.transform = "translate(-50%, -50%) scale(3)";
    icon.style.opacity = "1";

    await new Promise((resolve) => setTimeout(resolve, 600));

    icon.style.opacity = "0";
    icon.style.transform = "translate(-50%, -50%) scale(4)";

    await new Promise((resolve) => setTimeout(resolve, 300));

    icon.remove();
  }

  async animEndBonus() {
    // Sélectionne tous les éléments restants river_ic_
    const bonusElements = document.querySelectorAll('[id^="river_ic_"]');

    if (bonusElements.length === 0 && this.bga.gameui.bgaAnimationsActive() == false) {
      // Pas de bonus à supprimer, mais fermer la rivière
      await this.hideRiver();
      return;
    }

    // Si mode instantané, suppression directe
    if (this.bga.gameui.bgaAnimationsActive() == false) {
      bonusElements.forEach((el) => el.remove());
      console.log("All remaining bonus elements removed instantly");

      // Fermer la rivière
      await this.hideRiver();
      return;
    }

    // Animation pour chaque élément
    for (const el of bonusElements) {
      el.style.transition = "transform 400ms ease, opacity 400ms ease";
      el.style.transform = "scale(0)";
      el.style.opacity = "0";
    }

    // Attendre la fin de l'animation des bonus
    await new Promise((resolve) => setTimeout(resolve, 400));

    // Supprimer du DOM
    bonusElements.forEach((el) => el.remove());
    console.log("All remaining bonus elements removed with animation");
  }

  updateStackSelector(playerId, stackIndex, count) {
    console.log("SelectoR", `player_${playerId}_stack_${stackIndex}_selector`);
    let selector = document.getElementById(`player_${playerId}_stack_${stackIndex}_selector`);
    console.log("Selector El", selector);

    if (count === 0) {
      selector?.remove();
      return;
    }

    const height = `calc(var(--card_h) + (${count - 1}) * var(--card_h) * 0.2)`;

    if (!selector) {
      console.log("Stack", `player_${playerId}_stack_${stackIndex}`);
      const stack = document.getElementById(`player_${playerId}_stack_${stackIndex}`);
      console.log("Stack El", stack);
      stack.insertAdjacentHTML(
        "beforeend",
        `<div class="stack_selector"
         id="player_${playerId}_stack_${stackIndex}_selector"
         style="position:absolute;bottom:0;left:0;width:100%;height:${height}">
       </div>`,
      );
    } else {
      selector.style.height = height;
    }
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

  async notif_takeCard(args) {
    // on déplace une carte de la table vers sa maison

    console.log("notif_takeCard", args);

    // on créé un clone de la carte sauf si c'est la dernière
    // on enlève le compteur dans ce cas

    // attention car les cartes se positionnent sous celles qui sont en bas
    // ou sinon, on déplace vers le haut celles qui sont présentes et on place la dernière toujours en bas
    await this.animTakeCard(args.no_house, args.player_id, args.nb_remaining);

    // on met à jour / créé le selector
    this.updateStackSelector(args.player_id, args.no_house, args.count_card);
  }

  async notif_flipCards(args) {
    // on retourne les cartes dans une colonne
    // on récolte
    console.log("notif_flipCards", args);
    await this.animFlipStack(args.no_house, args.cards, args.player_id);

    // la pile est maintenant vide → suppression du selector
    this.updateStackSelector(args.player_id, args.no_house, 0);

    //await this.showRiver();

    await this.animGetRewards(args.no_house, args.cards, args.player_id);
  }

  async notif_flipCard(args) {
    // on retourne les cartes dans une colonne
    // on récolte
    console.log("notif_flipCard", args);

    await this.animFlipSoloStack(args.no_house, args.cards, args.player_id);

    //await this.showRiver();

    await this.animGetRewardsSolo(args.no_house, args.cards, args.player_id);

    await this.animShiftStackCards(args.no_house, args.player_id);

    this.updateStackSelector(args.player_id, args.no_house, args.count_cards);
  }

  async notif_removeBonus(args) {
    console.log("notif_removeBonus", args);

    await this.animRemoveBonus(args.bonus);
  }

  async notif_removeReplay(args) {
    console.log("notif_removeBonus", args);

    await this.animRemoveReplay(args.bonus);
  }

  async notif_goToThePark(args) {
    // on flipe une carte Park
    // on envoie vers le panel joueur et on incrémente
    // on décrémente les torches et le compteur
    console.log("notif_goToThePark", args);
    console.log("notif_goToThePark", args.ghosts.length);

    for (let i = 0; i < args.ghosts.length; i++) {
      console.log("iiiii", i);
      await this.animFlipPark(Number(args.ghosts[i]) - 1);

      //const ghost_id = `ghost_${Number(args.ghosts[i]) + 20}`;

      const ghost_id = `park_${Number(args.ghosts[i])}`;

      console.log("ghost_id", ghost_id);
      const parkElt = document.getElementById("deck_park");

      await this.moveGhostToHouse(ghost_id, parkElt, args.player_id);

      await this.animRemovePark(args.player_id);
    }
  }

  async notif_drawGrimoire(args) {
    // on flipe une carte Grimoire
    // on décrémente lecompteur
    console.log("notif_drawGrimoire", args);

    const grimoireType = parseInt(args.grimoire.type);
    await this.animFlipGrimoire(parseInt(grimoireType), args.player_id);

    console.log("grimoireType", grimoireType);
    // Gestion du clue si c’est la deuxième carte
    if (grimoireType == 2) {
      if (!this._bonusUid) this._bonusUid = 0;
      this._bonusUid++;

      const grimoireElt = document.getElementById("deck_grimoire");
      const iconId = `grimoire_ic_clue_${this._bonusUid}`;
      const html = `<div id="${iconId}" class="icon ic_clue"></div>`;

      grimoireElt.insertAdjacentHTML("beforeend", html);
      const iconEl = document.getElementById(iconId);

      const house_clues = document.getElementById(`player_${args.player_id}_house_clues`);

      if (this.bga.gameui.bgaAnimationsActive() == false) {
        house_clues.appendChild(iconEl);
      } else {
        this.animationManager.slideAndAttach(iconEl, house_clues, 600, 0, null);
      }
    }
    // Gestion du ghost si c’est la première carte
    if (grimoireType == 1) {
      const ghost_id = `grimoire_1`;

      const grimoireElt = document.getElementById("deck_grimoire");
      await this.moveGhostToHouse(ghost_id, grimoireElt, args.player_id);
    }

    // Gestion du replay si c’est la 4eme carte
    if (grimoireType == 4) {
      const replay = document.getElementById(`panel_ic_replay`);
      if (!replay) {
        const grimoireElt = document.getElementById("deck_grimoire");
        const iconId = `panel_ic_replay`;
        const html = `<div id="${iconId}" class="icon ic_replay"></div>`;

        grimoireElt.insertAdjacentHTML("beforeend", html);
        const iconEl = document.getElementById(iconId);

        const panel = document.getElementById(`bottom_board_${args.player_id}`);
        this.animationManager.slideAndAttach(iconEl, panel, 600, 0, null);
      }
    }

    // un fantôme
    // une torche
    // un clock
    // deux clock
    // un replay
    // un pet
    // un draw_any on déplace dans le conteneur s'il reste des cartes à piocher
  }

  async notif_removeGrimoire(args) {
    console.log("notif_removeGrimoire", args);

    // récupérer le type de la carte pour l'animation du token
    //await this.animZoomOutReward();

    await this.animRemoveGrimoire();
  }

  async notif_activateClockTower(args) {
    // on tourne l'aiguille et on gagne artefact, pet ou reroll
    console.log("notif_activateClockTower", args);

    // on anime l'aiguille de -60°

    // artefact : on envoie vers le panel joueur et on incrémente
    // pet      : on déplace dans le conteneur si 0 sur la table et 2 chez 2 joueurs différents
    //            sur la table, on envoie vers le panel joueur et on incrémente pet
    // reroll   : on flipe le reroll si nécessaire

    await this.animClockTower(args.player_id);
  }

  async notif_stealPet(args) {
    console.log("notif_stealPet", args);

    // ID du pet reçu dans la notif (ex: "card_pet_2")
    const petElementId = args.pet_id;
    const petElement = document.getElementById(petElementId);

    const activePlayerColor = this.players[args.player_id].color; // ex: "ff0000"
    // Conversion hex → rgb
    const red = parseInt(activePlayerColor.slice(0, 2), 16);
    const green = parseInt(activePlayerColor.slice(2, 4), 16);
    const blue = parseInt(activePlayerColor.slice(4, 6), 16);

    // Application de la bordure + fond semi-transparent
    petElement.style.boxShadow = `
      inset 0 0 0 4px #${activePlayerColor},
      inset 0 0 0 9999px rgba(${red}, ${green}, ${blue}, 0.3)
      `;

    console.log("opponent ?", args.opponent);
    if (!args.opponent) {
      const cardId = args.pet_id;

      const petId = cardId.replace(/^card_/, "");
      const index = this.gamedatas.ghost_assets.indexOf(petId);
      console.log("moveGhostToHouse no opponent");
      await this.moveGhostToHouse(petId, petElement, args.player_id);
    } else {
      const cardId = args.pet_id;
      //card_pet_2 devient ghost_19
      const petId = cardId.replace(/^card_/, "");
      const index = this.gamedatas.ghost_assets.indexOf(petId) + 1;

      const spriteElement = document.getElementById(`ghost_${index}`);
      // 1️⃣ Stopper l'animation CSS
      spriteElement.style.animationPlayState = "paused";

      const oldContainer = document.getElementById(`ghost_container_${index}`);

      const houseContainer = document.getElementById(`player_${args.player_id}_house_ghost`);
      const ghostContainer = document.createElement("div");
      ghostContainer.id = `ghost_container_${index}`;
      ghostContainer.dataset.type = "pet";
      ghostContainer.className = "ghost_single_container";
      houseContainer.prepend(ghostContainer);

      // 2️⃣ Lancer l'animation slide
      this.animationManager.slideAndAttach(spriteElement, ghostContainer, 800).then(() => {
        // 3️⃣ Relancer l'animation CSS
        spriteElement.style.animationPlayState = "running";
        oldContainer.remove();
        console.log("old conatainer removed", oldContainer);
      });
    }
  }

  async notif_winGhost(args) {
    console.log("notif_winGhost", args);

    //TODO A MODIFIER SELON L'ARG RECU

    // ID du pet reçu dans la notif (ex: "card_pet_2")
    const ghostElementId = args.ghost_id;

    // Élément DOM du pet
    const ghostElement = document.getElementById(ghostElementId);

    // Joueur actif
    const cardId = args.ghost_id;
    const ghostIdx = cardId.replace("card_", "");
    const index = this.gamedatas.ghost_assets.indexOf(ghostIdx);

    const ghostId = index + 1;

    const col = index % 7;
    const row = Math.floor(index / 7);

    const duration = 6 + Math.random() * 3;
    const delay = Math.random() * 3;

    const ghostsHTML = `
        <div id="ghost_${ghostId}" class="ghost_sprites"
          style="
            background-position: -${col}00% -${row}00%;
            animation-duration: ${duration}s;
            animation-delay: ${delay}s;
          "></div>`;

    ghostElement.insertAdjacentHTML("beforeend", ghostsHTML);

    const spriteElement = document.getElementById(`ghost_${ghostId}`);

    const destination = document.getElementById(`player_${args.player_id}_house_ghost`);
    await this.animationManager.slideAndAttach(spriteElement, destination, 800).then(() => {
      // 3️⃣ Position aléatoire APRES reparenting
      spriteElement.style.left = `${Math.random() * 60}%`;
      spriteElement.style.top = `${Math.random() * 75}%`;
    });
  }

  async notif_flipReroll(args) {
    console.log("notif_flipReroll", args);

    await this.animFlipReroll(args.player_id);
  }

  async notif_rollDice(args) {
    console.log("notif_rollDice", args);

    this.forcedFaces = args.roll;
    await Promise.all([this.rollDice(), this.animateDiceDropFromClock(2000)]);
  }

  async notif_endBonus(args) {
    console.log("notif_endBonus", args);

    await this.animEndBonus();

    await this.hideRiver();
  }
}
