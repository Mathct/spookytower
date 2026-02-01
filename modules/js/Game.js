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

          case "take_card_btn":
            console.log("key", key);
            console.log("token", this.game.selected_token);
            this.bga.statusBar.addActionButton(
              _("Take Card"),
              () =>
                this.bga.actions.performAction("actButton", {
                  arg1: key,
                  arg2: this.game.selected_token,
                }),
              { color: "primary" },
            );
            break;
          case "flip_cards_btn":
            this.bga.statusBar.addActionButton(
              _("Flip Cards"),
              () =>
                this.bga.actions.performAction("actButton", {
                  arg1: key,
                  arg2: this.game.selected_token,
                }),
              { color: "primary" },
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
    this.normalTurn = new NormalTurn(this, bga);
    this.bga.states.register("NormalTurn", this.normalTurn);

    // Uncomment the next line to show debug informations about state changes in the console. Remove before going to production!
    this.bga.states.logger = console.log;

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

    this.selected_token = "";

    // variable en local storage pour le zoom
    this.zoom_factor = parseFloat(window.localStorage?.getItem("ST_zoom")) || 1;

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

    selectables.forEach((elt_id) => {
      const element = document.getElementById(elt_id);
      if (!element) return;

      // --- Carte table (building) ---
      /*      if (elt_id.startsWith("table_building_card_")) {
        const clickHandler = () => this.onSelectBuilding(elt_id);
        element.addEventListener("click", clickHandler);
        this.connections.push({
          element,
          event: "click",
          handler: clickHandler,
        });
        return;
      }*/

      // --- Cartes “token” ou autres éléments cliquables ---
      const clickHandler = () => this.onSelectToken(elt_id);
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

  async onSelectBuilding(elt_id) {
    const sourceCard = document.getElementById(elt_id);
    if (!sourceCard) return;

    const buildingNumber = Number(elt_id.split("_").pop());
    const playerId = this.bga.players.getActivePlayerId();
    const stack = document.getElementById(`player_${playerId}_stack_${buildingNumber}`);

    const counter = this.tableBuildingCounters[buildingNumber];
    if (!counter || counter.getValue() <= 0) return;

    // créer l'emplacement final

    const index = stack.children.length;
    const html = `
    <div
      id="player_${playerId}_stack_${buildingNumber}_card_${index + 1}"
      class="building_cards"
      style="
        background-position:-${buildingNumber - 1}00% 0%;
        bottom: calc(${index} * var(--card_h) * 0.2);
        z-index: ${6 - index};
      ">
    </div>
  `;

    stack.insertAdjacentHTML("beforeend", html);
    const slot = stack.lastElementChild;

    // lancer l'animation
    await this.animateBuildingToSlot(sourceCard, slot);

    counter.incValue(-1);
  }

  async animateBuildingToSlot(sourceCard, targetSlot) {
    const flyingCard = sourceCard.cloneNode(true);

    // la carte volante reste dans le DOM source
    sourceCard.parentElement.appendChild(flyingCard);

    await this.animationManager.slideAndAttach(flyingCard, targetSlot, { duration: 600, easing: "ease-in-out" });

    flyingCard.remove();
  }

  onSelectToken(token_id) {
    console.log("onSelectToken", token_id);

    const token_elt = document.getElementById(token_id);
    if (!token_elt) return;

    // Retire 'selectable' uniquement si présent
    if (token_elt.classList.contains("selectable")) {
      this.safeClass(token_elt, "remove", "selectable");
    }

    // si aucun est sélectionné
    if (this.selected_token === "") {
      this.safeClass(token_elt, "add", "selected");
      this.selected_token = token_id;
    }
    // Si on clique sur une autre case
    else {
      const old_elt = document.getElementById(this.selected_token);
      if (old_elt) {
        this.safeClass(old_elt, "remove", "selected");
        this.safeClass(old_elt, "add", "selectable");
      }
      if (this.selected_token != token_id) {
        this.safeClass(token_elt, "add", "selected");
        this.selected_token = token_id;
      } else {
        this.selected_token = "";
      }
    }
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

            <!-- Pet icon + counter -->
            <div class="icon-group">
              <div
                class="icon ic_pet"
                id="icon_pet_${player.id}"
                title="${_("Pets")}"
              ></div>
              <span
                class="icon-text"
                id="pet_counter_${player.id}"
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
          </div>

          <div class="a-board" id="middle_board_${player.id}">
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
          
            <!-- Grimoire icon + counter -->
            <div class="icon-group">
              <div
                class="icon ic_grimoire"
                id="icon_grimoire_${player.id}"
                title="${_("Grimoire")}"
              ></div>
              <span
                class="icon-text"
                id="grimoire_counter_${player.id}"
              ></span>
            </div>

            <!-- Clock icon + counter -->
            <div class="icon-group">
              <div
                class="icon ic_clock"
                id="icon_clock_${player.id}"
                title="${_("Clocks")}"
              ></div>
              <span
                class="icon-text"
                id="clock_counter_${player.id}"
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

      const ghost_counter = new ebg.counter();
      ghost_counter.create(`ghost_counter_${player.id}`, {
        value: player.ghost,
        playerCounter: "ghost",
        playerId: player.id,
      });

      const pet_counter = new ebg.counter();
      pet_counter.create(`pet_counter_${player.id}`, {
        value: player.pet,
        playerCounter: "pet",
        playerId: player.id,
      });

      const artefact_counter = new ebg.counter();
      artefact_counter.create(`artefact_counter_${player.id}`, {
        value: player.artefact,
        playerCounter: "artefact",
        playerId: player.id,
      });

      const clue_counter = new ebg.counter();
      clue_counter.create(`clue_counter_${player.id}`, {
        value: player.clue,
        playerCounter: "clue",
        playerId: player.id,
      });

      const grimoire_counter = new ebg.counter();
      grimoire_counter.create(`grimoire_counter_${player.id}`, {
        value: player.grimoire,
        playerCounter: "grimoire",
        playerId: player.id,
      });

      const clock_counter = new ebg.counter();
      clock_counter.create(`clock_counter_${player.id}`, {
        value: player.clock,
        playerCounter: "clock",
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

    // =================== PETS ET BUILDINGS ===================
    this.setupTopRow();
    this.setupPets(); // injecte les cartes pets
    this.setupBuildings(); // injecte les cartes buildings + div compteur
    this.setupHouses();
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

    deckParkSlot.classList.add("clickable");
    deckParkSlot.addEventListener("click", () => this.onFlipPark(nb_parks));

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

    deckGrimoireSlot.classList.add("clickable");
    deckGrimoireSlot.addEventListener("click", () => this.onFlipGrimoire());

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


    // ---- Injecter les dés ----
    diceTrackSlot.style.position = 'relative';

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

    diceTrackSlot.insertAdjacentHTML("beforeend", dicefaceHTML);

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

  /// INIT AND ROLL DICE

initDice() {

    
    this.diceElements = [
        document.getElementById('dice1'),
        document.getElementById('dice2')
    ];

    this.faceRotations = {
        1: { x: 0,   y: 0 },
        2: { x: 0,   y: -90 },
        3: { x: 0,   y: -180 },
        4: { x: 0,   y: 90 },
        5: { x: -90, y: 0 },
        6: { x: 90,  y: 0 }
    };

    this.forcedFaces = [this.gamedatas.dices[0], this.gamedatas.dices[1]];
    
    // Initial display of dice faces
    this.diceElements.forEach((dice, index) => {
        const face = this.forcedFaces[index];
        const rotation = this.faceRotations[face];

        // Apply the rotation instantly without animation
        dice.style.transition = "none";
        dice.style.transform = `rotateX(${rotation.x}deg) rotateY(${rotation.y}deg)`;
    });

    
}

rollDiceMultiple() {    //pour lancer les dés plusieurs fois et ainsi éviter que les dés ne tournent pas si le résultat est inchangé ou proche
    this.rollDice(); // Premier lancer
    setTimeout(() => {
        this.rollDice(); // Deuxième lancer
    }, 100);
    setTimeout(() => {
        this.rollDice(); // 3eme lancer
    }, 200);
}

rollDice() {
    

    this.diceElements.forEach((dice, index) => {
    const face = this.forcedFaces[index];
    const target = this.faceRotations[face];
        
    const fullTurnsX = Math.floor(Math.random() * 10 + 10) * 360;
    const fullTurnsY = Math.floor(Math.random() * 10 + 10) * 360;
    const finalX = fullTurnsX + target.x;
    const finalY = fullTurnsY + target.y;

    dice.style.transition = "transform 2s cubic-bezier(0.23, 1, 0.32, 1)";
    dice.style.transform = `rotateX(${finalX}deg) rotateY(${finalY}deg)`;
        
    });
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

  setupHouses() {
    const playersArea = document.getElementById("players_area");
    const players = Object.values(this.gamedatas.players);
    const playerCount = players.length;

    // indices de sprites mélangés
    const spriteIndices = [0, 1, 2, 3].sort(() => Math.random() - 0.5);
    const assignedSprites = spriteIndices.slice(0, playerCount);

    players.forEach((player, idx) => {
      const houseIndex = assignedSprites[idx];

      // Création du HTML du joueur
      const playerHTML = `
      <div class="player_board" id="player_board_${player.id}" data-player-id="${player.id}">
        <div class="building_columns">
          ${[...Array(12)].map((_, i) => `<div class="building_stack" id="player_${player.id}_stack_${i + 1}"></div>`).join("")}
        </div>
        <div class="house_slot" id="player_${player.id}_house">
          <div class="house_cards" id="player_${player.id}_house_card"></div>
        </div>
      </div>
    `;
      playersArea.insertAdjacentHTML("beforeend", playerHTML);

      // Affecter le background-position pour la maison
      const card = document.getElementById(`player_${player.id}_house_card`);
      card.style.backgroundPosition = `-${houseIndex}00% 0%`;

      // Ajouter placeholders
      const boardSlot = document.getElementById(`player_board_${player.id}`);
      for (let i = 0; i < 3; i++) {
        boardSlot.insertAdjacentHTML("afterBegin", `<div class="house_empty_slot" id="player_${player.id}_house_placeholder_${i}"></div>`);
      }

      // Exemple pour stack 1
      const stack1 = document.getElementById(`player_${player.id}_stack_1`);
      let html = "";
      for (let i = 0; i < 3; i++) {
        html += `
          <div id="player_${player.id}_stack_1_card_${i + 1}"
            class="building_cards"
            style="
              background-position:0% 0%;
              bottom: calc(${i} * var(--card_h) * 0.2);
              z-index: ${6 - i};
            ">
          </div>
        `;
      }
      stack1.insertAdjacentHTML("beforeend", html);

      // Exemple pour stack 5
      const stack5 = document.getElementById(`player_${player.id}_stack_5`);
      html = "";
      for (let i = 0; i < 1; i++) {
        html += `
          <div id="player_${player.id}_stack_5_card_${i + 1}"
            class="building_cards"
            style="
              background-position:-400% 0%;
              bottom: calc(${i} * var(--card_h) * 0.2);
              z-index: ${6 - i};
            ">
          </div>
        `;
      }
      stack5.insertAdjacentHTML("beforeend", html);
    });
  }

  setupCounters() {
    // --- Counters top row ---
    this.topRowCounters = {};

    const nb_parks = this.nb_parks || 3;

    const parkCounter = new ebg.counter();
    parkCounter.create("deck_park_counter", {
      value: nb_parks,
      playerCounter: null,
    });
    this.topRowCounters.deck_park = parkCounter;

    const grimCounter = new ebg.counter();
    grimCounter.create("deck_grimoire_counter", {
      value: 0,
      playerCounter: null,
    });
    this.topRowCounters.deck_grimoire = grimCounter;

    // --- Counters pour chaque building sur la table ---
    this.tableBuildingCounters = {};

    for (let i = 1; i <= 12; i++) {
      const counter = new ebg.counter();

      // ID cohérent avec les cartes table
      // table_building_card_1 → table_building_counter_1
      counter.create(`table_building_counter_${i}`, {
        value: 5, // valeur initiale
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

  async onFlipPark(nb_parks) {
    const park = document.querySelector("#deck_park .parkgrim_cards");
    if (!park) return;

    if (park.dataset.flipping === "true") return;
    park.dataset.flipping = "true";

    // Initialisation du recto si nécessaire
    if (!park.dataset.face) {
      park.dataset.face = "recto";
      park.style.backgroundPosition = park.style.backgroundPosition; // garde la position actuelle comme recto
    }

    const half = 200; // demi-flip en ms

    // Premier demi-flip : rotation + léger pop
    park.style.transition = `transform ${half}ms ease-in-out`;
    park.style.transform = "rotateY(90deg) translateY(-5px) scale(1.05)";

    await new Promise((resolve) => setTimeout(resolve, half));

    // Toggle background-position
    if (park.dataset.face === "recto") {
      park.dataset.face = "verso";
      const versoCol = nb_parks - 1; // numéro de colonne pour le verso
      park.style.backgroundPosition = `-${versoCol}00% 0%`;
    } else {
      park.dataset.face = "recto";
      // recto = position initiale au moment de l’injection
      const rectoStyle = park.getAttribute("style").match(/background-position:\s*([^;]+)/);
      park.style.backgroundPosition = rectoStyle ? rectoStyle[1] : "-0% 0%";
    }

    // Deuxième demi-flip : retour à la position normale
    park.style.transform = "rotateY(0deg) translateY(0px) scale(1)";

    await new Promise((resolve) => setTimeout(resolve, half));

    // Reset final
    park.style.transition = "";
    park.style.transform = "";
    delete park.dataset.flipping;
  }

  async onFlipGrimoire() {
    this.flipGrimoire();
  }

  async flipGrimoire() {
    const grimoire = document.querySelector("#deck_grimoire .parkgrim_cards");
    if (!grimoire) return;

    if (grimoire.dataset.flipping === "true") return;
    grimoire.dataset.flipping = "true";

    if (!grimoire.dataset.face) grimoire.dataset.face = "recto";

    const half = 200; // demi-flip en ms
    const grimoireVerso = 3;
    const n = grimoireVerso - 1;

    // Premier demi-flip
    grimoire.style.transition = `transform ${half}ms ease-in-out`;
    grimoire.style.transform = "rotateY(90deg) translateY(-5px) scale(1.05)";

    await new Promise((resolve) => setTimeout(resolve, half));

    // Toggle background-position
    if (grimoire.dataset.face === "recto") {
      grimoire.dataset.face = "verso";
      grimoire.style.backgroundPosition = `-${n}00% -100%`;
    } else {
      grimoire.dataset.face = "recto";
      grimoire.style.backgroundPosition = `-700% -100%`;
    }

    // Deuxième demi-flip
    grimoire.style.transform = "rotateY(0deg) translateY(0px) scale(1)";
    await new Promise((resolve) => setTimeout(resolve, half));

    // Reset
    grimoire.style.transition = "";
    grimoire.style.transform = "";
    delete grimoire.dataset.flipping;
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

  async notif_takeCard(args) {
    // on déplace une carte de la table vers sa maison

    console.log("notif_takeCard", args);

    const card_to_place = args.card;
    // position donne l'emplacement. 1 en bas

    // on créé un clone de la carte sauf si c'est la dernière
    // on enlève le compteur dans ce cas

    // attention car les cartes se positionnent sous celles qui sont en bas
    // ou sinon, on déplace vers le haut celles qui sont présentes et on place la dernière toujours en bas

    // cartes 1 2 3 4 on flipe le reroll si nécessaire
    // carte 9 on gagne un clock, activé aussitôt
  }

  async notif_flipCards(args) {
    // on retourne les cartes dans une colonne
    // on récolte
    console.log("notif_flipCards", args);

    // cartes 1
    //  bonus flip9+   : on déplace dans le conteneur si on a des cartes 9+
    //  le fantôme     : on envoie vers le panel joueur et on incrémente

    // cartes 2
    //  des clock      : on déplace dans le conteneur
    //  DEMANDER si les double clock s'activent
    //  un par un ou si on tourne de deux secteurs d'un coup.

    // cartes 3
    //  des grimoires  : on déplace dans le conteneur
    //  une torche     : on déplace dans le conteneur

    // cartes 4
    //  des cartes Pet : on déplace dans le conteneur si 0 sur la table et 2 chez 2 joueurs différents
    //  sur la table, on envoie vers le panel joueur et on incrémente pet

    //  un clock       : on déplace dans le conteneur

    // cartes 5
    //  des cartes flip8- : on déplace dans le conteneur si on a des cartes 8-
    //  des torches

    // cartes 6
    //  des cartes draw8-  : on déplace dans le conteneur s'il reste des cartes 8- à piocher
    //  des torches        : on déplace dans le conteneur
    //  un clock           : on déplace dans le conteneur

    // cartes 7
    //  le fantôme         : on envoie vers le panel joueur et on incrémente
    //  des torches        : on déplace dans le conteneur
    //  des clocks         : on déplace dans le conteneur

    // cartes 8
    //  deux fantômes      : on envoie vers le panel joueur et on incrémente
    //  deux pets          : on déplace dans le conteneur
    //  un replay          : on envoie vers le panel joueur et on anime la rotation

    // cartes 9
    //  deux fantômes      : on envoie vers le panel joueur et on incrémente
    //  deux pets          : on déplace dans le conteneur
    //  une torche         : on déplace dans le conteneur

    // cartes 10
    //  cinq fantômes      : on envoie vers le panel joueur et on incrémente

    // cartes 11
    //  quatre fantômes      : on envoie vers le panel joueur et on incrémente
    //  un pet               : on déplace dans le conteneur
    //  un grimoire          : on déplace dans le conteneur

    // cartes 12
    //  trois fantômes      : on envoie vers le panel joueur et on incrémente
  }

  async notif_goToThePark(args) {
    // on flipe une carte Park
    // on envoie vers le panel joueur et on incrémente
    // on décrémente les torches et le compteur
    console.log("notif_goToThePark", args);
  }

  async notif_drawGrimoire(args) {
    // on flipe une carte Grimoire
    // on décrémente lecompteur
    console.log("notif_drawGrimoire", args);

    this.flipGrimoire();

    // un fantôme
    // une torche
    // un clock
    // deux clock
    // un replay
    // un pet
    // un draw_any on déplace dans le conteneur s'il reste des cartes à piocher
  }

  async notif_activateClockTower(args) {
    // on tourne l'aiguille et on gagne artefact, pet ou reroll
    console.log("notif_activateClockTower", args);

    // on anime l'aiguille de -60°

    // artefact : on envoie vers le panel joueur et on incrémente
    // pet      : on déplace dans le conteneur si 0 sur la table et 2 chez 2 joueurs différents
    //            sur la table, on envoie vers le panel joueur et on incrémente pet
    // reroll   : on flipe le reroll si nécessaire
  }

  async notif_stealPet(args) {
    console.log("notif_stealPet", args);

    // on incrémente ou  décrémente le nombre de pet
  }

  async notif_rollDice(args) {
   
    this.forcedFaces = args.roll;
    this.rollDiceMultiple();
               
  }
}
