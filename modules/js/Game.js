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

class PlayerTurn {
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
      // A TESTER
      this.possibles = [];
      this.args = args.args;
      console.log(this.args);
      this.args.selectable.forEach((sid) => {
        this.game.safeClass(sid, "add", "selectable");
        //console.log("selectable ", sid);
        this.possibles.push(sid);
      });

      // selected
      this.args.selected.forEach((sid) => {
        this.game.safeClass(sid, "add", "selected");
      });

      // event listeners
      this.game.setupConnections(this.possibles);
    }

    // PART 2 Titles
    this.bga.statusBar.setTitle(
      isCurrentPlayerActive
        ? this.bga.gameui.format_string_recursive(
            args.args.titleyou
              .replace("${you}", this.divYou())
              .replace(/#opponent#/g, args.args.opponent)
              .replace("#nb#", args.args.nb)
              .replace("#nb2#", args.args.nb2)
              .replace("#icon#", args.args.icon)
              .replace("#icon2#", args.args.icon2),
            args.args,
          )
        : ($("pagemaintitletext").innerHTML = this.bga.gameui.format_string_recursive(
            _(args.args.title)
              .replace("${actplayer}", this.divActPlayer())
              .replace("#nb#", args.args.nb)
              .replace("#nb2#", args.args.nb2)
              .replace("#icon#", args.args.icon)
              .replace("#icon2#", args.args.icon2),
            args.args,
          )),
    );

    // PART 3 updateActionButtons
    if (isCurrentPlayerActive) {
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
    this.playerTurn = new PlayerTurn(this, bga);
    this.bga.states.register("PlayerTurn", this.playerTurn);

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
    this.zoom_factor = parseFloat(window.localStorage?.getItem("ST_zoom")) || 25;
    console.log("zoom_f", this.zoom_factor);

    //this.setupPlayersBoard();
    //this.setupBoard();
    //this.addSideButtons();

    //this.setupCounters();
    //this.setupTooltips();

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
        `<div class="b-board" id="ai_board_${player.id}"></div>
          <div class="b-board" id="action_board_${player.id}"></div>
            `,
      );
      /*  const counter = new ebg.counter();
      counter.create(`superbonus_hand_counter_${player.id}`, {
        value: player.superbonus_hand,
        playerCounter: "superbonus_hand",
        playerId: player.id,
      });*/
    });

    const active_player_id = this.bga.players.getActivePlayerId();

    /*    const action_elt = document.getElementById(`action_board_${active_player_id}`);
    Object.values(this.gamedatas.actions).forEach((action) => {
      const action_played = action.used == 1 ? action.action_1 : action.action_2;

      const action_x = this.actions_list.indexOf(action_played);

      action_elt.insertAdjacentHTML(
        "beforeend",
        `<div id="action_${action.action_order}"
          class="rm_actions"
          style="background-position: -${action_x}00% 0%;">
     </div>`,
      );
    });

    // on attache un listener à l'icone du joueur
    const current_player_id = this.bga.players.getCurrentPlayerId();

    if (current_player_id) {
      const icon = document.getElementById(`icon_superbonus_${current_player_id}`);

      if (icon) {
        icon.classList.add("clickable");
        icon.addEventListener("click", () => this.openSuperbonusModal());
      }
    }*/
  }

  isMobileDevice() {
    return $("ebd-body").classList.contains("mobile_version");
  }

  setupBoard() {
    console.log("Setting up the board");

    const gameBoardHTML = `
        <div id="resized_id">
          <div id="board_id">
            <div id="st_board_id" class="st_board">
            </div>
          </div>
        </div>`;
    document.getElementById("game_play_area").insertAdjacentHTML("beforeend", gameBoardHTML);

    /*const contract_counter = new ebg.counter();
    contract_counter.create(`rm_contract_deck_counter`, { value: this.gamedatas.contract_deck, tableCounter: "contract_deck" });
    */
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
    this.zoom_factor = Math.min(35, this.zoom_factor + 1);
    window.localStorage.setItem("ST_zoom", this.zoom_factor);

    this.updateBoardZoom();
  }

  zoomMinusCards() {
    this.zoom_factor = Math.max(15, this.zoom_factor - 1);
    window.localStorage.setItem("ST_zoom", this.zoom_factor);

    this.updateBoardZoom();
  }

  updateBoardZoom() {
    document.documentElement.style.setProperty("--st_scale", this.zoom_factor);
    document.documentElement.style.setProperty("--font-scale", this.zoom_factor / 25);
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
