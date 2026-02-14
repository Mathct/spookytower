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

          case "take_card_btn":
            this.bga.statusBar.addActionButton(
              _("Take Card"),
              () =>
                this.bga.actions.performAction("actButton", {
                  arg1: key,
                  arg2: this.game.selected_token,
                }),
              {
                color: "primary",
                id: "take_card_btn",
              },
            );

            if (this.game.selected_building == "") {
              this.game.safeClass("take_card_btn", "add", "disabled");
            }
            break;
          case "flip_cards_btn":
            this.bga.statusBar.addActionButton(
              _("Flip Cards"),
              () =>
                this.bga.actions.performAction("actButton", {
                  arg1: key,
                  arg2: this.game.selected_token,
                }),
              { color: "primary", id: "flip_cards_btn" },
            );

            if (this.game.selected_stack == "") {
              this.game.safeClass("flip_cards_btn", "add", "disabled");
            }
            break;
          case "take_pet_btn":
            this.bga.statusBar.addActionButton(
              _("Take Pet"),
              () =>
                this.bga.actions.performAction("actButton", {
                  arg1: key,
                  arg2: this.game.selected_pet,
                }),
              {
                color: "primary",
                id: "take_pet_btn",
              },
            );

            if (this.game.selected_pet == "") {
              this.game.safeClass("take_pet_btn", "add", "disabled");
            }
            break;

          case "take_grimoire_pet_btn":
            this.bga.statusBar.addActionButton(
              _("Take Pet"),
              () =>
                this.bga.actions.performAction("actButton", {
                  arg1: key,
                  arg2: this.game.selected_token,
                }),
              {
                color: "primary",
                id: "take_grimoire_pet_btn",
              },
            );

            if (this.game.selected_token == "") {
              this.game.safeClass("take_grimoire_pet_btn", "add", "disabled");
            }
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
          case "validate_bonus_btn":
            this.bga.statusBar.addActionButton(
              _("Validate Bonus"),
              () =>
                this.bga.actions.performAction("actValidateBonus", {
                  arg1: key,
                  arg2: this.game.selected_token,
                }),
              { color: "primary", id: "validate_bonus_btn" },
            );

            if (this.game.selected_token == "") {
              this.game.safeClass("validate_bonus_btn", "add", "disabled");
            }
            break;
          case "end_bonus_btn":
            this.bga.statusBar.addActionButton(
              _("End Bonus"),
              () =>
                this.bga.actions.performAction("actValidateBonus", {
                  arg1: key,
                  arg2: this.game.selected_token,
                }),
              { color: "primary", id: "validate_bonus_btn" },
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

  /*  onCardClick(card_id) {
    console.log("onCardClick", card_id);

    this.bga.actions
      .performAction("actPlayCard", {
        card_id,
      })
      .then(() => {
        // What to do after the server call if it succeeded
        // (most of the time, nothing, as the game will react to notifs / change of state instead, so you can delete the `then`)
      });
  }*/
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
    this.selected_building = "";
    this.selected_stack = "";
    this.selected_pet = "";
    console.log("setup function");
    this.function = "";

    // variable en local storage pour le zoom
    this.zoom_factor = parseFloat(window.localStorage?.getItem("ST_zoom")) || 1;

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

    console.log("ARGS .connections", this.function);

    selectables.forEach((elt_id) => {
      const element = document.getElementById(elt_id);
      if (!element) return;

      if (this.function == "ActionsBonus") {
        /*if (elt_id.startsWith("card_pet_")) {
          const clickHandler = () => this.onSelectPet(elt_id);
          element.addEventListener("click", clickHandler);
          this.connections.push({
            element,
            event: "click",
            handler: clickHandler,
          });
          return;
        } else */ if (elt_id.startsWith("table_building_card_")) {
          const clickHandler = () => this.onSelectBuilding(elt_id);
          element.addEventListener("click", clickHandler);
          this.connections.push({
            element,
            event: "click",
            handler: clickHandler,
          });
          return;
        } else {
          // --- Cartes “token” ou autres éléments cliquables ---
          const clickHandler = () => this.onSelectToken(elt_id);
          element.addEventListener("click", clickHandler);
          this.connections.push({
            element,
            event: "click",
            handler: clickHandler,
          });
          return;
        }
      } else {
        // --- Carte table (building) ---
        if (elt_id.startsWith("table_building_card_")) {
          const clickHandler = () => this.onSelectBuilding(elt_id);
          element.addEventListener("click", clickHandler);
          this.connections.push({
            element,
            event: "click",
            handler: clickHandler,
          });
          return;
        } else if (elt_id.includes("_stack_")) {
          // --- Cartes “token” ou autres éléments cliquables ---
          const clickHandler = () => this.onSelectStack(elt_id);
          element.addEventListener("click", clickHandler);
          this.connections.push({
            element,
            event: "click",
            handler: clickHandler,
          });
          return;
        } else if (elt_id.startsWith("card_pet_")) {
          const clickHandler = () => this.onSelectPet(elt_id);
          element.addEventListener("click", clickHandler);
          this.connections.push({
            element,
            event: "click",
            handler: clickHandler,
          });
          return;
        } else {
          // --- Cartes “token” ou autres éléments cliquables ---
          const clickHandler = () => this.onSelectToken(elt_id);
          element.addEventListener("click", clickHandler);
          this.connections.push({
            element,
            event: "click",
            handler: clickHandler,
          });
          return;
        }
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
    this.selected_token = "";
    this.selected_building = "";
    this.selected_stack = "";
    this.selected_pet = "";
    this.function = "";
  }

  // Gestion de la sélection d'un building
  onSelectBuilding(building_id) {
    const building_elt = document.getElementById(building_id);
    if (!building_elt) return;

    if (building_elt.classList.contains("selectable")) {
      this.safeClass(building_elt, "remove", "selectable");
    }

    // retire l'ancien building sélectionné
    if (this.selected_building && this.selected_building !== building_id) {
      const old_elt = document.getElementById(this.selected_building);
      if (old_elt) {
        this.safeClass(old_elt, "remove", "selected");
        this.safeClass(old_elt, "add", "selectable");
      }
    }

    // retire l'ancien stack sélectionné
    if (this.selected_stack) {
      const oldStack = document.getElementById(this.selected_stack);
      if (oldStack) {
        this.safeClass(oldStack, "remove", "selected");
        this.safeClass(oldStack, "add", "selectable");
      }
      this.selected_stack = "";
      this.safeClass("flip_cards_btn", "add", "disabled");
      this.safeClass("flip_card8_btn", "add", "disabled");
      this.safeClass("flip_card9_btn", "add", "disabled");
    }

    // toggle building
    if (this.selected_building !== building_id) {
      this.safeClass(building_elt, "add", "selected");
      this.selected_building = building_id;
      this.selected_token = building_id;
      this.safeClass("take_card_btn", "remove", "disabled");
      this.safeClass("take_card8_btn", "remove", "disabled");
      this.safeClass("take_card_any_btn", "remove", "disabled");
    } else {
      this.safeClass(building_elt, "remove", "selected");
      this.safeClass(building_elt, "add", "selectable");
      this.selected_building = "";
      this.selected_token = "";
      this.safeClass("take_card_btn", "add", "disabled");
      this.safeClass("take_card8_btn", "add", "disabled");
      this.safeClass("take_card_any_btn", "add", "disabled");
    }
  }

  onSelectStack(stack_id) {
    const stack_elt = document.getElementById(stack_id);
    if (!stack_elt) return;

    if (stack_elt.classList.contains("selectable")) {
      this.safeClass(stack_elt, "remove", "selectable");
    }

    // retire l'ancien stack sélectionné
    if (this.selected_stack && this.selected_stack !== stack_id) {
      const old_elt = document.getElementById(this.selected_stack);
      if (old_elt) {
        this.safeClass(old_elt, "remove", "selected");
        this.safeClass(old_elt, "add", "selectable");
      }
    }

    // retire l'ancien building sélectionné
    if (this.selected_building) {
      const oldBuilding = document.getElementById(this.selected_building);
      if (oldBuilding) {
        this.safeClass(oldBuilding, "remove", "selected");
        this.safeClass(oldBuilding, "add", "selectable");
      }
      this.selected_building = "";
      this.safeClass("take_card_btn", "add", "disabled");
      this.safeClass("take_card8_btn", "add", "disabled");
      this.safeClass("take_card_any_btn", "add", "disabled");
    }

    // toggle stack
    if (this.selected_stack !== stack_id) {
      this.safeClass(stack_elt, "add", "selected");
      this.selected_stack = stack_id;
      this.selected_token = stack_id;
      this.safeClass("flip_cards_btn", "remove", "disabled");
      this.safeClass("flip_card8_btn", "remove", "disabled");
      this.safeClass("flip_card9_btn", "remove", "disabled");
    } else {
      this.safeClass(stack_elt, "remove", "selected");
      this.safeClass(stack_elt, "add", "selectable");
      this.selected_stack = "";
      this.selected_token = "";
      this.safeClass("flip_cards_btn", "add", "disabled");
      this.safeClass("flip_card8_btn", "add", "disabled");
      this.safeClass("flip_card9_btn", "add", "disabled");
    }
  }

  onSelectPet(pet_id) {
    console.log("onSelectPet", pet_id);

    const pet_elt = document.getElementById(pet_id);
    if (!pet_elt) return;

    // Retire 'selectable' uniquement si présent
    if (pet_elt.classList.contains("selectable")) {
      this.safeClass(pet_elt, "remove", "selectable");
    }

    // si aucun est sélectionné
    if (this.selected_pet === "") {
      console.log("pas de selected pet");
      this.safeClass(pet_elt, "add", "selected");
      this.selected_pet = pet_id;
      this.safeClass("take_pet_btn", "remove", "disabled");
    }
    // Si on clique sur une autre case
    else {
      const old_elt = document.getElementById(this.selected_pet);
      if (old_elt) {
        this.safeClass(old_elt, "remove", "selected");
        this.safeClass(old_elt, "add", "selectable");
      }
      if (this.selected_pet != pet_id) {
        this.safeClass(pet_elt, "add", "selected");
        this.selected_pet = pet_id;
      } else {
        this.selected_pet = "";
        this.safeClass("take_pet_btn", "add", "disabled");
      }
    }
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
      this.safeClass("validate_bonus_btn", "remove", "disabled");
      this.safeClass("take_grimoire_pet_btn", "remove", "disabled");
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
        this.safeClass("validate_bonus_btn", "remove", "disabled");
        this.safeClass("take_grimoire_pet_btn", "remove", "disabled");
      } else {
        this.selected_token = "";
        this.safeClass("validate_bonus_btn", "add", "disabled");
        this.safeClass("take_grimoire_pet_btn", "add", "disabled");
      }
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

    const current_player_id = this.bga.players.getCurrentPlayerId();
    if (current_player_id) {
      const rerollIcon = document.getElementById(`icon_reroll_${current_player_id}`);
      if (rerollIcon) {
        rerollIcon.classList.add("clickable");
        rerollIcon.addEventListener("click", () => this.animClockTower());
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

                <!-- TOP ROW TABLE -->
                <div id="table_top_row">
                    <div class="table_deck_slot" id="deck_park" title="Park"></div>
                    <div class="table_deck_slot" id="deck_grimoire" title="Grimoire"></div>
                    <div class="table_track_slot" id="dice_track" title="Dice Track"></div>
                    <div class="table_clock_slot" id="clock_tower" title="Clock Tower"></div>
                </div>
                <div id="river_id" class="river_container closed"></div>
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

    // -------------------- Dice Track --------------------
    const diceTrackSlot = document.getElementById("dice_track");
    // ---- Injecter la carte + compteur à l'intérieur ----
    const diceHTML = `
        <div class="card_item building_cards" 
             style="background-position: -1100% -500%;" title="Dice Track">
        </div>
    `;
    diceTrackSlot.insertAdjacentHTML("beforeend", diceHTML);
    // ---- Injecter les dés ----
    diceTrackSlot.style.position = "relative";

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
    const clockHourRot = 60 * this.gamedatas.other.clock;

    // ---- Injecter la carte + compteur à l'intérieur ----
    const towerHTML = `
           <div class="clock_tower" id="clock_tower_id">
            <div class="clock_hand" id="clock_hand_sprite" style="transform: translate(-50%, -50%) rotate(${clockHourRot}deg);"></div>
          </div>
    `;
    clockTowerSlot.insertAdjacentHTML("beforeend", towerHTML);
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
        const iconElementId = `river_ic_${actionBonus.name}_${Math.floor(Math.random() * 100000)}`;
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
      playersArea.insertAdjacentHTML(
        "beforeend",
        `
      <div class="player_board" id="player_board_${player.id}">
        <div class="building_columns">
          ${[...Array(12)].map((_, i) => `<div class="building_stack empty clickable" id="player_${player.id}_stack_${i + 1}"></div>`).join("")}
        </div>
        <div class="house_slot" id="player_${player.id}_house_slot">
          <div class="house_clues" id="player_${player.id}_house_clues" title="Clues"></div>
          <div class="house_cards" id="player_${player.id}_house_card" ></div>
        </div>
        <div class="house_ghosts building_stack" id="player_${player.id}_house_ghost" title="Ghosts Captured"></div>
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
      });

      console.log("petzz", this.gamedatas.players[player.id].player_clues);
      const nb_clues = this.gamedatas.players[player.id].player_clues;
      if (nb_clues > 0) {
        for (let i = 0; i < nb_clues; i++) {
          const iconId = `house_ic_clue_${Math.floor(Math.random() * 1000)}`;
          const html = `<div id="${iconId}" class="icon ic_clue"></div>`;

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
      const col = (ghost.id - 1) % 7;
      const row = Math.floor((ghost.id - 1) / 7);

      const left = Math.random() * 60;
      const top = Math.random() * 75;
      const duration = 6 + Math.random() * 3;
      const delay = Math.random() * 3;

      const ghostsHTML = `
        <div id="ghost_${ghost.name}" class="ghost_sprites"
          style="
            background-position: -${col}00% -${row}00%;
            left: ${left}%;
            top: ${top}%;
            animation-duration: ${duration}s;
            animation-delay: ${delay}s;
          "></div>`;

      container.insertAdjacentHTML("beforeend", ghostsHTML);
    });
  }

  spawnGhostsOld(playerId) {
    const container = document.getElementById(`player_${playerId}_house_ghost`);
    if (!container) return;

    const ghostCount = 4;

    for (let i = 0; i < ghostCount; i++) {
      const ghost = document.createElement("div");
      ghost.classList.add("ghost_sprites");

      const col = Math.floor(Math.random() * 7);
      const row = Math.floor(Math.random() * 4);
      ghost.style.backgroundPosition = `-${col}00% -${row}00%`;

      // Position initiale adaptée au ratio vertical
      ghost.style.left = Math.random() * 60 + "%";
      ghost.style.top = Math.random() * 75 + "%";

      ghost.style.animationDuration = 6 + Math.random() * 3 + "s";
      ghost.style.animationDelay = Math.random() * 3 + "s";

      container.appendChild(ghost);
    }
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

      /*  const pet_counter = new ebg.counter();
      pet_counter.create(`pet_counter_${player.id}`, {
        value: player.pet,
        playerCounter: "player_pets",
        playerId: player.id,
      });*/

      const artefact_counter = new ebg.counter();
      artefact_counter.create(`artefact_counter_${player.id}`, {
        value: player.player_artefacts,
        playerCounter: "player_artefacts",
        playerId: player.id,
      });

      const clue_counter = new ebg.counter();
      clue_counter.create(`clue_counter_${player.id}`, {
        value: player.player_clues,
        playerCounter: "player_clues",
        playerId: player.id,
      });

      /*  const grimoire_counter = new ebg.counter();
      grimoire_counter.create(`grimoire_counter_${player.id}`, {
        value: player.grimoire,
        playerCounter: "player_grimoires",
        playerId: player.id,
      });*/

      /*  const clock_counter = new ebg.counter();
      clock_counter.create(`clock_counter_${player.id}`, {
        value: player.clock,
        playerCounter: "player_clocks",
        playerId: player.id,
      });*/
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

  rollDiceMultiple() {
    //pour lancer les dés plusieurs fois et ainsi éviter que les dés ne tournent pas si le résultat est inchangé ou proche
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

  async animFlipReroll(playerId) {
    const icon = document.getElementById(`icon_reroll_${playerId}`);
    if (!icon) return;

    if (this.instantaneousMode) {
      icon.classList.toggle("ic_reroll_0");
      icon.classList.toggle("ic_reroll_1");
      return;
    }

    if (icon.dataset.flipping === "true") return;
    icon.dataset.flipping = "true";

    const half = 200; // durée demi-flip

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
    icon.style.transition = "";
    icon.style.transform = "";
    delete icon.dataset.flipping;
  }

  async animFlipPark() {
    const park = document.getElementById("park_active");
    if (!park) return;

    park.id = `park_active_verso`;

    const nb_cards = parseInt(this.gamedatas.deck_park);
    const versoCol = this.gamedatas.park_order[5 - nb_cards];

    if (this.instantaneousMode) {
      park.style.transition = "";
      park.style.transform = "";
      park.style.backgroundPosition = `-${versoCol}00% 0%`;
      return;
    }

    // pour bloquer les multiclics
    if (park.dataset.flipping === "true") return;
    park.dataset.flipping = "true";

    const half = 200;

    // Premier demi-flip
    park.style.transition = `transform ${half}ms ease-in-out`;
    park.style.transform = "rotateY(90deg) translateY(-5px) scale(1.05)";
    await new Promise((resolve) => setTimeout(resolve, half));

    // Changement visuel : verso
    park.style.backgroundPosition = `-${versoCol}00% 0%`;

    // Deuxième demi-flip
    park.style.transform = "rotateY(0deg) translateY(0px) scale(1)";
    await new Promise((resolve) => setTimeout(resolve, half));

    delete park.dataset.flipping;
  }

  async animFlipGrimoire(grimoireType, playerId) {
    const grimoire = document.getElementById("grimoire_active");
    if (!grimoire) return;

    grimoire.id = `grimoire_active_verso`;

    const n = grimoireType - 1;

    if (this.instantaneousMode) {
      grimoire.style.transition = "";
      grimoire.style.transform = "";
      grimoire.style.backgroundPosition = `-${n}00% -100%`;
      return;
    }

    // pour bloquer les multiclics
    if (grimoire.dataset.flipping === "true") return;
    grimoire.dataset.flipping = "true";

    const half = 200;

    // Premier demi-flip
    grimoire.style.transition = `transform ${half}ms ease-in-out`;
    grimoire.style.transform = "rotateY(90deg) translateY(-5px) scale(1.05)";
    await new Promise((resolve) => setTimeout(resolve, half));

    // Changement visuel : verso
    grimoire.style.backgroundPosition = `-${n}00% -100%`;

    // Deuxième demi-flip : retour à 0°
    grimoire.style.transform = "rotateY(0deg) translateY(0px) scale(1)";
    await new Promise((resolve) => setTimeout(resolve, half));

    delete grimoire.dataset.flipping;

    if (grimoireType == 2) {
      const iconId = `house_ic_clue_${Math.floor(Math.random() * 1000)}`;
      const html = `<div id="${iconId}" class="icon ic_clue"></div>`;

      const house_clues = document.getElementById(`player_${playerId}_house_clues`);
      console.log("housse", `player_${playerId}_house_clues`);
      console.log("house_clues", house_clues);
      house_clues.insertAdjacentHTML("beforeend", html);
    }
  }

  async animClockTower() {
    const hand = document.getElementById("clock_hand_sprite");
    if (!hand) return;

    const playerId = this.bga.players.getActivePlayerId();

    const currentTransform = hand.style.transform;
    const match = currentTransform.match(/rotate\(([-\d.]+)deg\)/);
    let currentDeg = match ? parseFloat(match[1]) : this.gamedatas.other.clock * 60;

    const nextDeg = currentDeg + 60;

    // ⚡ Mode instantané
    if (this.instantaneousMode) {
      hand.style.transition = "";
      hand.style.transform = `translate(-50%, -50%) rotate(${nextDeg}deg)`;
      this.gamedatas.other.clock = (this.gamedatas.other.clock + 1) % 6;
    } else {
      hand.style.transition = `transform 600ms ease-in-out`;
      hand.style.transform = `translate(-50%, -50%) rotate(${nextDeg}deg)`;

      // attendre la fin de l'animation
      await new Promise((resolve) => {
        const onTransitionEnd = (event) => {
          if (event.propertyName === "transform") {
            hand.removeEventListener("transitionend", onTransitionEnd);
            hand.style.transition = "";
            resolve();
          }
        };
        hand.addEventListener("transitionend", onTransitionEnd);
      });

      this.gamedatas.other.clock = (this.gamedatas.other.clock + 1) % 6;
    }

    // ⚡ Animation des artefacts si clock = 0 ou 3
    if (this.gamedatas.other.clock === 0 || this.gamedatas.other.clock === 3) {
      //  artefact
      const iconId = `house_ic_artefact_${Math.floor(Math.random() * 1000)}`;
      const html = `<div id="${iconId}" class="icon ic_artefact"></div>`;
      const parent = document.getElementById("clock_hand_sprite");

      parent.insertAdjacentHTML("beforeend", html);

      const iconEl = document.getElementById(iconId);
      const panel_artefacts = document.getElementById(`icon_artefact_${playerId}`);

      // Animation slide vers le panel joueur + destruction
      await new Promise((resolve) => {
        this.animationManager.slideOutAndDestroy(iconEl, panel_artefacts, 600, 0, resolve);
      });

      // petit délai si nécessaire
      await new Promise((r) => setTimeout(r, 80));
    } else if (this.gamedatas.other.clock === 1 || this.gamedatas.other.clock === 4) {
      // PET
    } else if (this.gamedatas.other.clock === 2 || this.gamedatas.other.clock === 5) {
      this.animFlipReroll(playerId);
    }
  }

  async animTakeCard(buildingNumber) {
    const elt_id = `table_building_card_${buildingNumber}`;
    const sourceCard = document.getElementById(elt_id);
    if (!sourceCard) return;

    const playerId = this.bga.players.getActivePlayerId();

    // Stack cible
    const stack = document.getElementById(`player_${playerId}_stack_${buildingNumber}`);
    if (!stack) return;

    // Counter
    const counter = this.tableBuildingCounters[buildingNumber];
    if (!counter) return;

    // Appeler la fonction de déplacement
    await this.moveBuildingToStack(sourceCard, stack, counter);
  }

  async moveBuildingToStack(card, stackOrDeck) {
    if (!card || !stackOrDeck) return;

    const playerId = this.bga.players.getActivePlayerId();
    const stackId = card.id.split("_").pop();

    // on révèle le stack
    stackOrDeck.classList.remove("empty");

    const containers = stackOrDeck.querySelectorAll(".building_card_container");
    if (containers.length === 0) return;

    const existingCards = [];
    containers.forEach((container) => {
      if (container.children.length > 0) {
        existingCards.push(container.children[0]);
      }
    });

    // ⚡ Mode instantané : état final direct
    if (this.instantaneousMode) {
      // déplacer les cartes existantes (du bas vers le haut)
      existingCards.forEach((cardElement, i) => {
        const nextContainer = containers[i + 1];
        if (!nextContainer) return;

        nextContainer.appendChild(cardElement);
        cardElement.id = `player_${playerId}_stack_${stackId}_card_${i + 2}`;
      });

      // placer la nouvelle carte en première position
      containers[0].appendChild(card);
      card.id = `player_${playerId}_stack_${stackId}_card_1`;

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
        this.animationManager.slideAndAttach(cardElement, nextContainer, { duration: 600 }).then(() => {
          cardElement.id = `player_${playerId}_stack_${stackId}_card_${i + 2}`;
        }),
      );
    });

    const targetContainer = containers[0];
    animations.push(() =>
      this.animationManager.slideAndAttach(flyingCard, targetContainer, { duration: 600 }).then(() => {
        flyingCard.id = `player_${playerId}_stack_${stackId}_card_1`;
      }),
    );

    await this.animationManager.playParallel(animations);
  }

  async animFlipStack(stackId, cardsInfos, playerId) {
    const stack = document.getElementById(`player_${playerId}_stack_${stackId}`);
    if (!stack) return;

    const cards = Array.from(stack.querySelectorAll(".building_cards"));
    if (!cards.length) return;

    if (stack.dataset.flipping === "true") return;
    stack.dataset.flipping = "true";

    // Trier les cartes par position (bas → haut)
    cardsInfos.sort((a, b) => a.position - b.position);

    // ⚡ Mode instantané
    if (this.instantaneousMode) {
      cards.forEach((card, i) => {
        const info = cardsInfos[i];
        if (!info) return;

        const card_offset = (info.type - 1) * 5 + (info.type_arg - 1);
        const col = card_offset % 12;
        const row = 1 + Math.floor(card_offset / 12);
        card.style.backgroundPosition = `-${col * 100}% -${row * 100}%`;
        card.style.transition = "";
        card.style.transform = "";

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
            card.style.transition = "";
            card.style.transform = "";

            resolve();
          }),
      ),
    );

    delete stack.dataset.flipping;
  }

  async animGetRewards(no_house, cardsInfos, playerId) {
    const stack = document.getElementById(`player_${playerId}_stack_${no_house}`);
    if (!stack) return;

    const cards = Array.from(stack.querySelectorAll(".building_cards"));
    if (!cards.length) {
      stack.classList.add("empty");
      return;
    }

    // Empêcher l'animation simultanée
    if (stack.dataset.animating === "true") return;
    stack.dataset.animating = "true";

    // Trier les cartes par position (bas → haut)
    cardsInfos.sort((a, b) => a.position - b.position);

    const river = document.getElementById("river_id");
    if (!river) {
      console.warn("River element not found!");
      delete stack.dataset.animating;
      return;
    }

    // ⚡ Mode instantané : état final direct
    if (this.instantaneousMode) {
      for (let i = cards.length - 1; i >= 0; i--) {
        const cardEl = cards[i];
        const info = cardsInfos[i];
        if (!info) continue;

        const card_idx = info.type + info.type_arg;
        const bonuses = this.gamedatas.building_cards[card_idx] || [];

        // supprimer la carte immédiatement
        cardEl.remove();

        // créer et attacher directement les icônes dans la rivière
        bonuses.forEach((bonus) => {
          const ic = bonus.includes("_") ? bonus.split("_")[0] : bonus;
          if (!ic) return;

          const icon = document.createElement("div");
          icon.className = `river_icon ic_${ic}`;
          river.appendChild(icon);
        });
      }

      stack.classList.add("empty");
      delete stack.dataset.animating;
      return;
    }

    // 🎞️ Mode animé normal

    // Parcours décroissant pour supprimer du bas vers le haut visuellement
    for (let i = cards.length - 1; i >= 0; i--) {
      const cardEl = cards[i];
      const info = cardsInfos[i];
      if (!info) continue;

      // Récupérer les bonus pour cette carte
      const card_idx = info.type + info.type_arg;
      const bonuses = this.gamedatas.building_cards[card_idx] || [];
      const parent = cardEl.parentElement;

      // 1️⃣ Animation disparition
      cardEl.style.transition = "transform 400ms ease, opacity 400ms ease";
      cardEl.style.transform = "scale(0)";
      cardEl.style.opacity = "0";
      await new Promise((r) => setTimeout(r, 400));

      cardEl.remove();

      // 2️⃣ Création et animation des icônes pour chaque bonus
      for (let j = 0; j < bonuses.length; j++) {
        const bonus = bonuses[j];
        const ic = bonus.includes("_") ? bonus.split("_")[0] : bonus;
        if (!ic) continue;

        console.log("IC", ic);

        if (["grimoire", "clock", "flip8", "flip9", "draw8", "pet"].includes(ic)) {
          const iconId = `river_ic_${bonus}_${Math.floor(Math.random() * 1000)}`;
          const html = `<div id="${iconId}" class="river_icon ic_${ic}"></div>`;
          parent.insertAdjacentHTML("beforeend", html);

          const iconEl = document.getElementById(iconId);
          if (!iconEl || !iconEl.isConnected || !river || !river.isConnected) {
            console.warn("Skip animation: invalid node", iconId, iconEl);
            continue;
          }

          // Animation slide vers la rivière
          this.animationManager.slideAndAttach(iconEl, river, 600, 0, null);
          await new Promise((r) => setTimeout(r, 80));
        } else if (ic == "replay") {
          const iconId = `panel_ic_replay`;
          const html = `<div id="${iconId}" class="icon ic_${ic}"></div>`;
          parent.insertAdjacentHTML("beforeend", html);

          const iconEl = document.getElementById(iconId);
          if (!iconEl || !iconEl.isConnected || !river || !river.isConnected) {
            console.warn("Skip animation: invalid node", iconId, iconEl);
            continue;
          }
          const panel = document.getElementById(`bottom_board_${playerId}`);
          // Animation slide vers la rivière
          this.animationManager.slideAndAttach(iconEl, panel, 600, 0, null);
          await new Promise((r) => setTimeout(r, 80));
        } else if (ic == "clue") {
          const iconId = `house_ic_clue_${Math.floor(Math.random() * 1000)}`;
          const html = `<div id="${iconId}" class="icon ic_${ic}"></div>`;
          parent.insertAdjacentHTML("beforeend", html);

          const iconEl = document.getElementById(iconId);
          if (!iconEl || !iconEl.isConnected || !river || !river.isConnected) {
            console.warn("Skip animation: invalid node", iconId, iconEl);
            continue;
          }
          const house_clues = document.getElementById(`player_${playerId}_house_clues`);

          // Animation slide vers la rivière
          this.animationManager.slideAndAttach(iconEl, house_clues, 600, 0, null);
          await new Promise((r) => setTimeout(r, 80));
        } else if (ic == "ghost") {
          const ghost_idx = parseInt(bonus.split("_")[1]) - 1;
          const ghost_id = `ghost_${ghost_idx}`;
          await this.moveGhostToHouse(ghost_id, parent, playerId);
        }
      }

      // Petit délai avant la carte suivante pour éviter overlap visuel
      await new Promise((r) => setTimeout(r, 200));
    }

    // 3️⃣ Marquer la pile comme vide
    stack.classList.add("empty");
    delete stack.dataset.animating;
  }

  async moveGhostToHouse(ghostId, startElement, playerId) {
    // le nom du ghost dans le tableau _GHOST_ASSETS
    console.log("ghost_id", ghostId);

    // le conteneur de départ
    console.log("starelement", startElement);

    const index = this.gamedatas.ghost_assets.indexOf(ghostId);

    console.log("index ", index);

    if (index === -1) return;

    const col = index % 7;
    const row = Math.floor(index / 7);

    const duration = 6 + Math.random() * 3;
    const delay = Math.random() * 3;

    // 1️⃣ Création sans left/top
    startElement.insertAdjacentHTML(
      "beforeend",
      `
        <div id="ghost_${ghostId}" class="ghost_sprites"
          style="
            background-position: -${col}00% -${row}00%;
            animation-duration: ${duration}s;
            animation-delay: ${delay}s;
          ">
        </div>
      `,
    );

    const spriteElement = document.getElementById(`ghost_${ghostId}`);
    const destination = document.getElementById(`player_${playerId}_house_ghost`);
    if (!spriteElement || !destination) return;

    // 2️⃣ Animation avec chaînage explicite
    this.animationManager
      .slideAndAttach(spriteElement, destination, 800)
      .then(() => {
        // 3️⃣ Position aléatoire APRES reparenting
        spriteElement.style.left = `${Math.random() * 60}%`;
        spriteElement.style.top = `${Math.random() * 75}%`;
      })
      .catch((err) => {
        console.error("Animation stealPet error:", err);
      });
  }

  async toggleRiver() {
    const riverElt = document.getElementById("river_id");
    if (!riverElt) return;

    // ⚡ Mode instantané : état final direct
    if (this.instantaneousMode) {
      riverElt.style.transition = "";
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
    if (this.instantaneousMode) {
      riverElt.classList.remove("closed");
      riverElt.style.transition = "";
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
    if (this.instantaneousMode) {
      riverElt.classList.add("closed");
      riverElt.style.transition = "";
      return;
    }

    // 🎞️ Mode animé
    riverElt.classList.add("closed");
    await new Promise((resolve) => setTimeout(resolve, 400));
  }

  async animFlipSoloStack(stackId, cardsInfos, playerId) {
    const stack = document.getElementById(`player_${playerId}_stack_${stackId}`);
    if (!stack) return;

    const info = cardsInfos[0]; // on ne prend QUE la carte demandée
    if (!info) return;

    const card = Array.from(stack.querySelectorAll(".building_cards"))[0]; // première carte dans le stack
    if (!card) return;

    const half = 200;

    if (this.instantaneousMode) {
      // flip instantané : appliquer directement le verso
      const card_offset = (info.type - 1) * 5 + (info.type_arg - 1);
      const col = card_offset % 12;
      const row = 1 + Math.floor(card_offset / 12);
      card.style.backgroundPosition = `-${col * 100}% -${row * 100}%`;
      card.style.transition = "";
      card.style.transform = "";
      return;
    }

    // flip animé
    card.style.transition = `transform ${half}ms ease-in-out`;
    card.style.transform = "rotateY(90deg)";
    await new Promise((r) => setTimeout(r, half));

    const card_offset = (info.type - 1) * 5 + (info.type_arg - 1);
    const col = card_offset % 12;
    const row = 1 + Math.floor(card_offset / 12);
    card.style.backgroundPosition = `-${col * 100}% -${row * 100}%`;

    card.style.transform = "rotateY(0deg)";
    await new Promise((r) => setTimeout(r, half));

    card.style.transition = "";
    card.style.transform = "";

    // ---- Supprimer la carte ----
    card.remove();
  }

  async animGetRewardsSolo(stackId, cardsInfos, playerId) {
    console.log("GetRewardsSolo");

    const stack = document.getElementById(`player_${playerId}_stack_${stackId}`);
    if (!stack) return;

    const river = document.getElementById("river_id");
    if (!river) {
      console.warn("River element not found!");
      return;
    }

    const info = cardsInfos[0]; // seule carte concernée
    if (!info) return;

    // Récupérer les bonus
    const card_idx = info.type + info.type_arg;
    const bonuses = this.gamedatas.building_cards[card_idx] || [];

    for (let i = 0; i < bonuses.length; i++) {
      const bonus = bonuses[i];
      const ic = bonus.includes("_") ? bonus.split("_")[0] : bonus;
      if (!ic) continue;

      // créer l'icône
      const iconId = `river_ic_${bonus}_${Math.floor(Math.random() * 1000)}`;
      const html = `<div id="${iconId}" class="river_icon ic_${ic}"></div>`;
      stack.insertAdjacentHTML("beforeend", html);

      const iconEl = document.getElementById(iconId);
      if (!iconEl || !iconEl.isConnected) continue;

      // animer vers la rivière
      this.animationManager.slideAndAttach(iconEl, river, 600, 0, null);
      await new Promise((r) => setTimeout(r, 80));
    }
  }

  async animShiftStackCards(stackId, playerId) {
    const stack = document.getElementById(`player_${playerId}_stack_${stackId}`);
    if (!stack) return;

    const containers = Array.from(stack.querySelectorAll(".building_card_container"));
    if (containers.length === 0) return;

    // ⚡ Mode instantané : on déplace directement
    if (this.instantaneousMode) {
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

      const card = currentContainer.children[0];
      animations.push(() =>
        this.animationManager.slideAndAttach(card, prevContainer, { duration: 600 }).then(() => {
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

    if (this.instantaneousmode) {
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

    if (this.instantaneousmode) {
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

    if (this.instantaneousMode) {
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
    if (this.instantaneousMode) {
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

    // 1️⃣ Vérifier le compteur AVANT suppression
    const counterValue = this.topRowCounters.deck_park.getValue();

    if (counterValue > 0) {
      const counterDiv = document.getElementById("deck_park_counter");
      if (counterDiv) {
        let col;

        // Détermination du nombre de cartes à supprimer
        let numClues;
        if (counterValue >= 5) {
          col = 5;
          numClues = 3;
        } else if (counterValue >= 2 && counterValue <= 4) {
          col = 6;
          numClues = 2;
        } else {
          col = 7;
          numClues = 1;
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
        for (let i = 0; i < numClues; i++) {
          await this.animRemoveClue(playerId);
        }
      }
    }

    // 2️⃣ Mode instantané
    if (this.instantaneousMode) {
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

  async animZoomOutReward(bonus) {
    const deckGrimoireSlot = document.getElementById("deck_grimoire");
    if (!deckGrimoireSlot) return;

    const iconId = `grimoire_ic_${bonus}_${Math.floor(Math.random() * 1000)}`;
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
    const bonusElements = document.querySelectorAll('[id^="river-ic_"]');

    if (bonusElements.length === 0 && this.instantaneousMode) {
      // Pas de bonus à supprimer, mais fermer la rivière
      await this.hideRiver();
      return;
    }

    // Si mode instantané, suppression directe
    if (this.instantaneousMode) {
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
    this.animTakeCard(args.no_card);
  }

  async notif_flipCards(args) {
    // on retourne les cartes dans une colonne
    // on récolte
    console.log("notif_flipCards", args);
    await this.animFlipStack(args.no_house, args.cards, args.player_id);

    await this.showRiver();

    await this.animGetRewards(args.no_house, args.cards, args.player_id);

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

  async notif_flipCard(args) {
    // on retourne les cartes dans une colonne
    // on récolte
    console.log("notif_flipCard", args);

    await this.animFlipSoloStack(args.no_house, args.cards, args.player_id);

    await this.showRiver();

    await this.animGetRewardsSolo(args.no_house, args.cards, args.player_id);

    await this.animShiftStackCards(args.no_house, args.player_id);
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

    for (let i = 0; i < args.ghosts.length; i++) {
      await this.animFlipPark();

      const ghost_id = `ghost_${args.ghosts[i]}`;
      const parkElt = document.getElementById("deck_park");
      await this.moveGhostToHouse(ghost_id, parkElt, args.player_id);

      await this.animRemovePark(args.player_id);
    }
  }

  async notif_drawGrimoire(args) {
    // on flipe une carte Grimoire
    // on décrémente lecompteur
    console.log("notif_drawGrimoire", args);

    await this.animFlipGrimoire(args.grimoire.type, args.player_id);

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

    await this.animZoomOutReward(args.icon);

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

    await this.animClockTower();
  }

  async notif_stealPet(args) {
    console.log("notif_stealPet", args);

    // ID du pet reçu dans la notif (ex: "card_pet_2")
    const petElementId = args.pet_id;

    // Élément DOM du pet
    const petElement = document.getElementById(petElementId);

    // Joueur actif
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

    if (!args.opponent) {
      const cardId = args.pet_id;
      const petId = cardId.replace(/^card_/, "");
      const index = this.gamedatas.ghost_assets.indexOf(petId);

      this.moveGhostToHouse(index, petElement, args.player_id);
    } else {
      const cardId = args.pet_id;
      const petId = cardId.replace(/^card_/, "");
      const spriteElement = document.getElementById(`ghost_${petId}`);
      const destination = document.getElementById(`player_${args.player_id}_house_ghost`);
      if (!spriteElement || !destination) return;

      // 1️⃣ Stopper l'animation CSS
      spriteElement.style.animationPlayState = "paused";

      // 2️⃣ Lancer l'animation slide
      this.animationManager.slideAndAttach(spriteElement, destination, 800).then(() => {
        // 3️⃣ Relancer l'animation CSS
        spriteElement.style.animationPlayState = "running";

        // 4️⃣ Appliquer position aléatoire après le slide
        spriteElement.style.left = `${Math.random() * 60}%`;
        spriteElement.style.top = `${Math.random() * 75}%`;
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
    const ghostId = cardId.replace("card_", "");
    const index = this.gamedatas.ghost_assets.indexOf(ghostId);

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

    const spriteElement = document.getElementById(`ghost_${petId}`);

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
    this.rollDiceMultiple();
  }

  async notif_endBonus(args) {
    console.log("notif_endBonus", args);

    await this.animEndBonus();

    await this.hideRiver();
  }
}
