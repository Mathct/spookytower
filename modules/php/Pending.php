<?php

namespace Bga\Games\spookytower;   // ATTENTION NOM DU JEU
use APP_GameClass;

//require_once 'PendingConfirm.php'; // ATTENTION

class Pending extends APP_GameClass
{
    //use ConfirmPendingTrait; // ATTENTION TRAIT

    public $player_id;
    public $player_no;
    public $player_name;
    public $player_score;
    public $player_color;
    public $player_pref_confirm;

    public function __construct($player_id)
    {
        $this->player_id = $player_id;
        $p = game::$instance->getObjectFromDB("SELECT * FROM player WHERE player_id = {$player_id}");
        $this->player_no = $p['player_no'];
        $this->player_id = $p['player_id'];
        $this->player_name = $p['player_name'];
        $this->player_score = $p['player_score'];
        $this->player_color = $p['player_color'];

        /// PREFERENCE DE CONFIRMATION
        $sql = "SELECT pgp_value FROM bga_user_preferences WHERE pgp_player = '{$this->player_id}' AND pgp_preference_id = 100";
        $this->player_pref_confirm = game::$instance->getUniqueValueFromDB($sql);
    }

    /*
     _______               
    |__   __|              
        | |_   _ _ __ _ __  
        | | | | | '__| '_ \ 
        | | |_| | |  | | | |
        |_|\__,_|_|  |_| |_|

    */


    function argPlayerTurn($parg1, $parg2)
    {
        $ret = [];
        $ret["selectable"] = [];
        $ret["selected"] = [];
        $ret['buttons'] = [];
        $ret["function"] = "PlayerTurn";
        $ret['title'] = clienttranslate('${actplayer} must roll the dice');
        $ret['titleyou'] = clienttranslate('${you} must roll the dice');


        $ret['buttons'][] = 'roll_dice_btn';


        return $ret;
    }



    function PlayerTurn($parg1, $parg2, $varg1, $varg2, $varg3, $varg4)
    {

        $rand_dice1 = bga_rand(1, 6);
        game::$instance->DbQuery("UPDATE other set dice1 = $rand_dice1");
        $rand_dice2 = bga_rand(1, 6);
        game::$instance->DbQuery("UPDATE other set dice2 = $rand_dice2");

        $roll = [$rand_dice1, $rand_dice2];

        $log1 = 'dice_' . $rand_dice1;
        $log2 = 'dice_' . $rand_dice2;

        $txt = clienttranslate('${player_name} rolls ${dice1} ${dice2}');
        game::$instance->notify->all(
            "rollDice",
            $txt,
            [
                'player_id' => $this->player_id,
                'dice1' => $this->getLogs($log1),
                'dice2' => $this->getLogs($log2),
                'roll' => $roll
            ]
        );


        game::$instance->addPending($this->player_id, "ChooseAction");
    }

    /*
      _____ _                                         _   _             
     / ____| |                              /\       | | (_)            
    | |    | |__   ___   ___  ___  ___     /  \   ___| |_ _  ___  _ __  
    | |    | '_ \ / _ \ / _ \/ __|/ _ \   / /\ \ / __| __| |/ _ \| '_ \ 
    | |____| | | | (_) | (_) \__ \  __/  / ____ \ (__| |_| | (_) | | | |
     \_____|_| |_|\___/ \___/|___/\___| /_/    \_\___|\__|_|\___/|_| |_|
                                                                        
    */

    function argChooseAction($parg1, $parg2)
    {
        $ret = [];
        $ret["selectable"] = [];
        $ret["selected"] = [];
        $ret['buttons'] = [];
        $ret["function"] = "ChooseAction";
        $ret['title'] = clienttranslate('${actplayer} must choose an action');
        $ret['titleyou'] = clienttranslate('${you} must choose an action');

        $dice1 = intval(game::$instance->getUniqueValueFromDB("SELECT dice1 FROM other WHERE id=1"));
        $dice2 = intval(game::$instance->getUniqueValueFromDB("SELECT dice2 FROM other WHERE id=1"));
        $addition = $dice1 + $dice2;

        $reroll = game::$instance->getUniqueValueFromDB("SELECT reroll FROM player WHERE player_id='{$this->player_id}'");

        //COMPTEUR DE CARTES BUILDING RESTANTES
        $count_deck1 = game::$instance->{'deck_' . $dice1}->get();
        $count_deck2 = game::$instance->{'deck_' . $dice2}->get();
        $count_addition = game::$instance->{'deck_' . $addition}->get();

        //COMPTEUR DE HOUSES
        $count_house1 = count(game::$instance->getObjectListFromDB("SELECT card_id id FROM building WHERE card_type = '{$dice1}' AND card_location = 'house' AND card_location_arg = '{$this->player_id}'", true));
        $count_house2 = count(game::$instance->getObjectListFromDB("SELECT card_id id FROM building WHERE card_type = '{$dice2}' AND card_location = 'house' AND card_location_arg = '{$this->player_id}'", true));
        $count_houseaddition = count(game::$instance->getObjectListFromDB("SELECT card_id id FROM building WHERE card_type = '{$addition}' AND card_location = 'house' AND card_location_arg = '{$this->player_id}'", true));

        //POSSIBLE BUTTON TAKE
        $btn_take = 0;
        //POSSIBLE BUTTON FLIP
        $btn_flip = 0;


        //SELECT BUILDING
        if ($count_deck1 >= 1) {
            $ret["selectable"][] = 'table_building_card_' . $dice1;
            $btn_take = 1;
        }
        if ($count_deck2 >= 1 && $dice1 != $dice2) {
            $ret["selectable"][] = 'table_building_card_' . $dice2;
            $btn_take = 1;
        }
        if ($count_addition >= 1) {
            $ret["selectable"][] = 'table_building_card_' . $addition;
            $btn_take = 1;
        }

        if ($btn_take == 1) {
            $ret['buttons'][] = 'take_card_btn';
        }


        //SELECT HOUSE
        if ($count_house1 >= 1) {
            $ret["selectable"][] = 'player_' . $this->player_id . '_stack_' . $dice1;
            $btn_flip = 1;
        }
        if ($count_house2 >= 1 && $dice1 != $dice2) {
            $ret["selectable"][] = 'player_' . $this->player_id . '_stack_' . $dice2;
            $btn_flip = 1;
        }
        if ($count_houseaddition >= 1) {
            $ret["selectable"][] = 'player_' . $this->player_id . '_stack_' . $addition;
            $btn_flip = 1;
        }

        if ($btn_flip == 1) {
            $ret['buttons'][] = 'flip_cards_btn';
        }


        //REROLL DICE
        if ($reroll == 1) {
            $ret['buttons'][] = 'reroll_dice_btn';
        }

        //CLOCK SI RIEN N'EST POSSIBLE
        if ($btn_take == 0 && $btn_flip == 0 && $reroll == 0) {
            $ret['buttons'][] = 'turn_clock_btn';
        }


        return $ret;
    }



    function ChooseAction($parg1, $parg2, $varg1, $varg2, $varg3, $varg4)
    {
        ///////////////////////////////////////////////////////////////////////////////////////
        //SI POUR X RAISONS LE JOUEUR ARRIVE A CLICKER SUR UN DES BOUTONS SANS SELECTION (en modifiant sur l'inspecteur)
        ///////////////////////////////////////////////////////////////////////////////////////

        if (($varg1 == 'flip_cards_btn' || $varg1 == 'take_card_btn') && $varg2 == '') {
            game::$instance->addPending($this->player_id, "ChooseAction");
        }

        ///////////////////////////////////////////////////////////////////////////////////////
        //REROLL DICE TOKEN SI TOKEN OK
        ///////////////////////////////////////////////////////////////////////////////////////

        elseif ($varg1 == 'reroll_dice_btn') {
            game::$instance->DbQuery("UPDATE player set reroll = 0 WHERE player_id='{$this->player_id}'");

            game::$instance->notify->all(
                "flipReroll",
                '',
                [
                    'player_id' => $this->player_id,

                ]
            );

            $txt = clienttranslate('${player_name} uses ${log}');
            game::$instance->notify->all(
                "message",
                $txt,
                [
                    'player_id' => $this->player_id,
                    'log' => $this->getLogs('reroll'),

                ]
            );

            $rand_dice1 = bga_rand(1, 6);
            $rand_dice2 = bga_rand(1, 6);
            game::$instance->DbQuery("UPDATE other SET dice1 = $rand_dice1, dice2 = $rand_dice2");

            $roll = [$rand_dice1, $rand_dice2];

            $log1 = 'dice_' . $rand_dice1;
            $log2 = 'dice_' . $rand_dice2;

            $txt = clienttranslate('${player_name} rolls ${dice1} ${dice2}');
            game::$instance->notify->all(
                "rollDice",
                $txt,
                [
                    'player_id' => $this->player_id,
                    'dice1' => $this->getLogs($log1),
                    'dice2' => $this->getLogs($log2),
                    'roll' => $roll
                ]
            );

            game::$instance->addPending($this->player_id, "ChooseAction");
        }

        ///////////////////////////////////////////////////////////////////////////////////////
        //TURN CLOCK SI LE JOUEUR N'A PAS DE CHOIX POSSIBLE
        ///////////////////////////////////////////////////////////////////////////////////////

        elseif ($varg1 == 'turn_clock_btn') {
            $clock = intval(game::$instance->getUniqueValueFromDB("SELECT clock FROM other WHERE id=1"));
            $newclock = ($clock + 1) % 6;
            game::$instance->DbQuery("UPDATE other set clock = $newclock WHERE id=1");

            $txt = clienttranslate('${player_name} turns ${log}');
            game::$instance->notify->all(
                "activateClockTower",
                $txt,
                [
                    'player_id' => $this->player_id,
                    'clock' => $newclock,
                    'log' => $this->getLogs('clock'),

                ]
            );

            //Position Artefact
            if ($newclock == 0 || $newclock == 3) {

                $txt = clienttranslate('${player_name} gains ${log}');
                game::$instance->notify->all(
                    "message",
                    $txt,
                    [
                        'player_id' => $this->player_id,
                        'log' => $this->getLogs('artefact'),

                    ]
                );
                game::$instance->player_artefacts->inc($this->player_id, 1);
                $count_artefact = game::$instance->player_artefacts->get($this->player_id);
                if ($count_artefact == 3) {
                    game::$instance->addPending($this->player_id, "EndGame");
                } else {
                    game::$instance->addPendingFirst($this->player_id, "PlayerTurn");
                }
            }

            // Position Turn reroll token
            if ($newclock == 2 || $newclock == 5) {
                $txt = clienttranslate('${player_name} gains ${log}');
                game::$instance->notify->all(
                    "message",
                    $txt,
                    [
                        'player_id' => $this->player_id,
                        'log' => $this->getLogs('reroll'),

                    ]
                );
                $reroll = game::$instance->getUniqueValueFromDB("SELECT reroll FROM player WHERE player_id='{$this->player_id}'");
                if ($reroll == 0) {
                    game::$instance->DbQuery("UPDATE player set reroll = 1 WHERE player_id='{$this->player_id}'");

                    game::$instance->notify->all(
                        "flipReroll",
                        '',
                        [
                            'player_id' => $this->player_id,

                        ]
                    );
                }

                game::$instance->addPendingFirst($this->player_id, "PlayerTurn");
            }

            // Position pet
            if ($newclock == 1 || $newclock == 4) {

                game::$instance->addPending($this->player_id, "ClockChoosePet");
            }
        }

        ///////////////////////////////////////////////////////////////////////////////////////
        // LE JOUEUR TAKE UNE CARTE
        ///////////////////////////////////////////////////////////////////////////////////////

        elseif ($varg1 == 'take_card_btn') {

            //on recupere le numero du deck
            [,,, $no_deck] = explode('_', $varg2);
            $deck = 'deck' . $no_deck;

            //on pick la carte et on recupere les info du pickcard (pour la card_id)
            $card_pick = game::$instance->building_DB->pickCardForLocation($deck, 'house', $this->player_id);

            //on met a jour sa position
            $count_card = count(game::$instance->getObjectListFromDB("SELECT card_id id FROM building WHERE card_type = '{$no_deck}' AND card_location = 'house' AND card_location_arg = '{$this->player_id}'", true));
            game::$instance->DbQuery("UPDATE building SET position = $count_card WHERE card_id ='{$card_pick['id']}'");

            //on recupere les info pour le front
            $card =  game::$instance->getObjectFromDB("SELECT card_type type, card_location_arg location_arg, position position FROM building WHERE card_id ='{$card_pick['id']}'");

            //je change le compteur du deck
            game::$instance->{'deck_' . $no_deck}->inc(-1);

            $txt = clienttranslate('${player_name} takes card ${no_card}');
            game::$instance->notify->all(
                "takeCard",
                $txt,
                [
                    'player_id' => $this->player_id,
                    'no_card' => $no_deck,
                    'card' => $card,
                    'nb_remaining' => game::$instance->{'deck_' . $no_deck}->get()
                ]
            );





            // ACTION IMMEDIATE SUR UN TAKE: turn reroll token
            if ($no_deck >= 1 && $no_deck <= 4) {

                $txt = clienttranslate('${player_name} gains ${log}');
                game::$instance->notify->all(
                    "message",
                    $txt,
                    [
                        'player_id' => $this->player_id,
                        'log' => $this->getLogs('reroll'),

                    ]
                );

                $reroll = game::$instance->getUniqueValueFromDB("SELECT reroll FROM player WHERE player_id='{$this->player_id}'");
                if ($reroll == 0) {
                    game::$instance->DbQuery("UPDATE player set reroll = 1 WHERE player_id='{$this->player_id}'");

                    game::$instance->notify->all(
                        "flipReroll",
                        '',
                        [
                            'player_id' => $this->player_id,

                        ]
                    );
                }

                game::$instance->addPendingFirst($this->player_id, "PlayerTurn");
            }

            // ACTION IMMEDIATE SUR UN TAKE: turn clock
            elseif ($no_deck == 9) {
                $clock = intval(game::$instance->getUniqueValueFromDB("SELECT clock FROM other WHERE id=1"));
                $newclock = ($clock + 1) % 6;
                game::$instance->DbQuery("UPDATE other SET clock = $newclock WHERE id=1");

                $txt = clienttranslate('${player_name} turns ${log}');
                game::$instance->notify->all(
                    "activateClockTower",
                    $txt,
                    [
                        'player_id' => $this->player_id,
                        'clock' => $newclock,
                        'log' => $this->getLogs('clock'),
                    ]
                );

                //Position Artefact
                if ($newclock == 0 || $newclock == 3) {

                    $txt = clienttranslate('${player_name} gains ${log}');
                    game::$instance->notify->all(
                        "message",
                        $txt,
                        [
                            'player_id' => $this->player_id,
                            'log' => $this->getLogs('artefact'),

                        ]
                    );

                    game::$instance->player_artefacts->inc($this->player_id, 1);
                    $count_artefact = game::$instance->player_artefacts->get($this->player_id);
                    if ($count_artefact == 3) {
                        game::$instance->addPending($this->player_id, "EndGame");
                    } else {
                        game::$instance->addPendingFirst($this->player_id, "PlayerTurn");
                    }
                }

                // Position Turn reroll token
                if ($newclock == 2 || $newclock == 5) {

                    $txt = clienttranslate('${player_name} gains ${log}');
                    game::$instance->notify->all(
                        "message",
                        $txt,
                        [
                            'player_id' => $this->player_id,
                            'log' => $this->getLogs('reroll'),

                        ]
                    );

                    $reroll = game::$instance->getUniqueValueFromDB("SELECT reroll FROM player WHERE player_id='{$this->player_id}'");
                    if ($reroll == 0) {
                        game::$instance->DbQuery("UPDATE player set reroll = 1 WHERE player_id='{$this->player_id}'");

                        game::$instance->notify->all(
                            "flipReroll",
                            '',
                            [
                                'player_id' => $this->player_id,

                            ]
                        );
                    }

                    game::$instance->addPendingFirst($this->player_id, "PlayerTurn");
                }

                // Position pet
                if ($newclock == 1 || $newclock == 4) {

                    game::$instance->addPending($this->player_id, "ClockChoosePet");
                }
            }

            // AUCUNE ACTION IMMEDIATE SUR UN TAKE
            else {
                game::$instance->addPendingFirst($this->player_id, "PlayerTurn");
            }
        }

        ///////////////////////////////////////////////////////////////////////////////////////
        // LE JOUEUR FLIP UNE MAISON
        ///////////////////////////////////////////////////////////////////////////////////////

        elseif ($varg1 == 'flip_cards_btn') {
            //on recupere le numero de la maison
            [,,, $no_house] = explode('_', $varg2);

            $cards = game::$instance->getObjectListFromDB("SELECT card_id id, card_type type, card_type_arg type_arg, card_location location, card_location_arg location_arg, position position FROM building WHERE card_location ='house' AND card_location_arg = '{$this->player_id}' AND card_type ='{$no_house}'");

            $txt = clienttranslate('${player_name} flips house ${no_house}');
            game::$instance->notify->all(
                "flipCards",
                $txt,
                [
                    'player_id' => $this->player_id,
                    'no_house' => $no_house,
                    'cards' => $cards,
                ]
            );

            // je mets toutes les actions recupérées par le flip dans la table actionpending et j'incremente les compteurs ghosts et torches

            $actions = game::$instance->getObjectListFromDB("SELECT card_id id, card_type type, card_type_arg type_arg FROM building WHERE card_location = 'house' AND card_location_arg = '{$this->player_id}' AND card_type = '{$no_house}'");

            foreach ($actions as $action) {
                $type_card = $action['type'] . $action['type_arg'];
                $bonus = game::$instance->_BUILDING_CARD[$type_card];
                foreach ($bonus as $name) {
                    if ($name == 'flip8') {
                        game::$instance->DbQuery("UPDATE actionpending set count = count + 1 WHERE name = '{$name}'");
                    }
                    if ($name == 'flip9') {
                        game::$instance->DbQuery("UPDATE actionpending set count = count + 1 WHERE name = '{$name}'");
                    }
                    if ($name == 'draw8') {
                        game::$instance->DbQuery("UPDATE actionpending set count = count + 1 WHERE name = '{$name}'");
                    }
                    if ($name == 'clock') {
                        game::$instance->DbQuery("UPDATE actionpending set count = count + 1 WHERE name = '{$name}'");
                    }
                    if ($name == 'pet') {
                        game::$instance->DbQuery("UPDATE actionpending set count = count + 1 WHERE name = '{$name}'");
                    }
                    if ($name == 'grimoire') {
                        game::$instance->DbQuery("UPDATE actionpending set count = count + 1 WHERE name = '{$name}'");
                    }
                    if (str_starts_with($name, "ghost")) {
                        if ($type_card == 121 || $type_card == 122 || $type_card == 123) {
                            game::$instance->DbQuery("UPDATE actionpending set count = count + 2 WHERE name = 'ghost'");
                            game::$instance->player_ghosts->inc($this->player_id, 2);

                            $txt = clienttranslate('${player_name} gains ${log} ${log}');
                            game::$instance->notify->all(
                                "message",
                                $txt,
                                [
                                    'player_id' => $this->player_id,
                                    'log' => $this->getLogs('ghost'),

                                ]
                            );
                        } else {
                            game::$instance->DbQuery("UPDATE actionpending set count = count + 1 WHERE name = 'ghost'");
                            game::$instance->player_ghosts->inc($this->player_id, 1);

                            $txt = clienttranslate('${player_name} gains ${log}');
                            game::$instance->notify->all(
                                "message",
                                $txt,
                                [
                                    'player_id' => $this->player_id,
                                    'log' => $this->getLogs('ghost'),

                                ]
                            );
                        }

                        //MAJ TABLE GHOST
                        $name_ghost = 'building_' . $type_card;
                        game::$instance->DbQuery("UPDATE ghost set position = '{$this->player_id}' WHERE name = '{$name_ghost}'");
                    }
                    if ($name == 'clue') {
                        game::$instance->DbQuery("UPDATE actionpending set count = count + 1 WHERE name = '{$name}'");
                        game::$instance->player_clues->inc($this->player_id, 1);

                        $txt = clienttranslate('${player_name} gains ${log}');
                        game::$instance->notify->all(
                            "message",
                            $txt,
                            [
                                'player_id' => $this->player_id,
                                'log' => $this->getLogs('clue'),

                            ]
                        );
                    }
                    if ($name == 'replay') {
                        game::$instance->setGameStateInitialValue('replay', $this->player_id);

                        $txt = clienttranslate('${player_name} gains ${log}');
                        game::$instance->notify->all(
                            "message",
                            $txt,
                            [
                                'player_id' => $this->player_id,
                                'log' => $this->getLogs('replay'),

                            ]
                        );
                    }
                }
            }

            // je discard les cards
            foreach ($cards as $card) {
                game::$instance->building_DB->moveCard($card['id'], 'discard', $this->player_id);
            }

            // verif nombre de ghosts

            $count_ghosts = game::$instance->player_ghosts->get($this->player_id);
            if ($count_ghosts >= 5) {
                game::$instance->addPending($this->player_id, "EndGame");
            } else {
                game::$instance->addPending($this->player_id, "ActionsBonus");
            }
        }
    }



    /*
                  _   _                   ____                        
        /\       | | (_)                 |  _ \                       
       /  \   ___| |_ _  ___  _ __  ___  | |_) | ___  _ __  _   _ ___ 
      / /\ \ / __| __| |/ _ \| '_ \/ __| |  _ < / _ \| '_ \| | | / __|
     / ____ \ (__| |_| | (_) | | | \__ \ | |_) | (_) | | | | |_| \__ \
    /_/    \_\___|\__|_|\___/|_| |_|___/ |____/ \___/|_| |_|\__,_|___/
                                                                    
    */

    function argActionsBonus($parg1, $parg2)
    {
        $ret = [];
        $ret["selectable"] = [];
        $ret["selected"] = [];
        $ret['buttons'] = [];
        $ret["function"] = "ActionsBonus";
        $ret['title'] = clienttranslate('${actplayer} must choose an action');
        $ret['titleyou'] = clienttranslate('${you} must choose an action');


        $flip8 = game::$instance->getUniqueValueFromDB("SELECT count FROM actionpending WHERE name = 'flip8'");
        $flip9 = game::$instance->getUniqueValueFromDB("SELECT count FROM actionpending WHERE name = 'flip9'");
        $draw8 = game::$instance->getUniqueValueFromDB("SELECT count FROM actionpending WHERE name = 'draw8'");
        $clock = game::$instance->getUniqueValueFromDB("SELECT count FROM actionpending WHERE name = 'clock'");
        $pet = game::$instance->getUniqueValueFromDB("SELECT count FROM actionpending WHERE name = 'pet'");
        $grimoire = game::$instance->getUniqueValueFromDB("SELECT count FROM actionpending WHERE name = 'grimoire'");



        if ($flip8 >= 1) {
            $cards_8 = game::$instance->getObjectListFromDB("SELECT card_id id, card_type type, card_type_arg type_arg, card_location location, card_location_arg location_arg, position position FROM building WHERE card_location ='house' AND card_location_arg = '{$this->player_id}' AND card_type <= 8");
            if (count($cards_8) >= 1) {
                foreach ($cards_8 as $card_8) {
                    $value = 'player_' . $this->player_id . '_stack_' . $card_8['type'];

                    if (!in_array($value, $ret["selectable"], true)) {
                        $ret["selectable"][] = $value;
                    }
                }
            }
        }

        if ($flip9 >= 1) {
            $cards_9 = game::$instance->getObjectListFromDB("SELECT card_id id, card_type type, card_type_arg type_arg, card_location location, card_location_arg location_arg, position position FROM building WHERE card_location ='house' AND card_location_arg = '{$this->player_id}' AND card_type >= 9");
            if (count($cards_9) >= 1) {
                foreach ($cards_9 as $card_9) {
                    $value = 'player_' . $this->player_id . '_stack_' . $card_9['type'];

                    if (!in_array($value, $ret["selectable"], true)) {
                        $ret["selectable"][] = $value;
                    }
                }
            }
        }

        if ($draw8 >= 1) {
            for ($i = 1; $i <= 8; $i++) {
                $count = game::$instance->{'deck_' . $i}->get();
                if ($count >= 1) {
                    $ret["selectable"][] = 'table_building_card_' . $i;
                }
            }
        }

        if ($clock >= 1) {
            $ret["selectable"][] = 'clock_tower_id';
        }

        if ($pet >= 1) {

            $pets = game::$instance->getObjectFromDB("SELECT pet1 pet1, pet2 pet2, pet3 pet3 FROM other WHERE id=1");

            for ($i = 1; $i <= 3; $i++) {
                [, $position] = explode('_', $pets['pet' . $i]);
                if ($position == 'table') {
                    $ret["selectable"][] = 'card_pet_' . $i;
                }
            }

            if (count($ret["selectable"]) == 0) {
                for ($i = 1; $i <= 3; $i++) {
                    [, $position] = explode('_', $pets['pet' . $i]);
                    if ($position != $this->player_id) {
                        $ret["selectable"][] = 'card_pet_' . $i;
                    }
                }
            }
        }

        if ($grimoire >= 1) {
            $deck_grimoire = game::$instance->deck_grimoire->get();

            if ($deck_grimoire >= 1) {
                $ret["selectable"][] = 'deck_grimoire';
            }
        }



        if (count($ret["selectable"]) >= 1) {
            $ret['buttons'][] = 'validate_bonus_btn';
        }



        return $ret;
    }



    function ActionsBonus($parg1, $parg2, $varg1, $varg2, $varg3, $varg4)
    {
        if ($varg1 == null) {

            $actions_restantes = game::$instance->getObjectListFromDB( "SELECT name FROM actionpending WHERE count >= 1", true );
            $liste = '';

            foreach($actions_restantes as $action)
            {
                if($action == 'flip8')
                {
                    $liste = $liste.$this->getLogs('flip8');
                }

                if($action == 'flip9')
                {
                    $liste = $liste.$this->getLogs('flip9');
                }

                if($action == 'draw8')
                {
                    $liste = $liste.$this->getLogs('draw8');
                }

                if($action == 'pet')
                {
                    $liste = $liste.$this->getLogs('pet');
                }

                if($action == 'grimoire')
                {
                    $liste = $liste.$this->getLogs('grimoire');
                }
            }

            if(count($actions_restantes) >= 1)
            {
                $txt = clienttranslate('${player_name} cannot use ${log}');
                game::$instance->notify->all(
                "endBonus",
                $txt,
                [
                    'player_id' => $this->player_id,
                    'log' => $liste,

                ]
                );

            }

            else
            {
                game::$instance->notify->all(
                "endBonus",
                '',
                [
                    'player_id' => $this->player_id,

                ]
                );

            }

            
            $clue = game::$instance->getUniqueValueFromDB("SELECT count FROM actionpending WHERE name = 'clue'");
            $count_park = game::$instance->deck_park->get();

            if (($clue >= 1 && $count_park == 5)||($clue >= 2 && $count_park >=2 && $count_park <= 4)||($clue >= 3 && $count_park == 1)) {
                game::$instance->addPending($this->player_id, "Park");
            } else {

                if (game::$instance->getGameStateValue('replay') != 0) {
                    game::$instance->setGameStateInitialValue('replay', 0);
                    $txt = clienttranslate('${player_name} replays');
                    game::$instance->notify->all(
                        "removeReplay",
                        $txt,
                        [
                            'player_id' => $this->player_id,

                        ]
                    );
                    game::$instance->addPending($this->player_id, "PlayerTurn");
                } else {
                    game::$instance->addPendingFirst($this->player_id, "PlayerTurn");
                }
            }

            game::$instance->DbQuery("UPDATE actionpending set count = 0");
        } else {
            ///////////////////////////////////////////////////////////////////////////////////////
            // FLIP CARD 8- ou 9+
            ///////////////////////////////////////////////////////////////////////////////////////
            if (str_starts_with($varg2, 'player_')) {

                [,,, $no_house] = explode('_', $varg2);

                $cards = game::$instance->getObjectListFromDB("
                SELECT 
                    card_id id,
                    card_type type,
                    card_type_arg type_arg,
                    card_location location,
                    card_location_arg location_arg,
                    position position
                FROM building
                WHERE card_location = 'house'
                AND card_location_arg = '{$this->player_id}'
                AND card_type = '{$no_house}'
                ORDER BY position DESC
                LIMIT 1
                ");


                game::$instance->notify->all(
                    "flipCard",
                    '',
                    [
                        'player_id' => $this->player_id,
                        'no_house' => $no_house,
                        'cards' => $cards,
                    ]
                );

                if ($no_house <= 8) {

                    $txt = clienttranslate('${player_name} uses ${log}');
                    game::$instance->notify->all(
                        "message",
                        $txt,
                        [
                            'player_id' => $this->player_id,
                            'log' => $this->getLogs('flip8'),

                        ]
                    );

                    // DECREMENTE LA VALEUR DE LA TABLE ACTIONPENDING
                    game::$instance->DbQuery("UPDATE actionpending set count = count - 1 WHERE name = 'flip8'");
                    // Notif pour enlever l'icone
                    game::$instance->notify->all(
                        "removeBonus",
                        '',
                        [
                            'player_id' => $this->player_id,
                            'bonus' => 'flip8'

                        ]
                    );
                } else {

                    $txt = clienttranslate('${player_name} uses ${log}');
                    game::$instance->notify->all(
                        "message",
                        $txt,
                        [
                            'player_id' => $this->player_id,
                            'log' => $this->getLogs('flip9'),

                        ]
                    );

                    // DECREMENTE LA VALEUR DE LA TABLE ACTIONPENDING
                    game::$instance->DbQuery("UPDATE actionpending set count = count - 1 WHERE name = 'flip9'");
                    // Notif pour enlever l'icone
                    game::$instance->notify->all(
                        "removeBonus",
                        '',
                        [
                            'player_id' => $this->player_id,
                            'bonus' => 'flip9'

                        ]
                    );
                }

                // je mets toutes les actions recupérées par le flip dans la table actionpending et j'incremente les compteurs ghosts et torches
                $type_card = $cards[0]['type'] . $cards[0]['type_arg'];
                $bonus = game::$instance->_BUILDING_CARD[$type_card];
                foreach ($bonus as $name) {
                    if ($name == 'flip8') {
                        game::$instance->DbQuery("UPDATE actionpending set count = count + 1 WHERE name = '{$name}'");
                    }
                    if ($name == 'flip9') {
                        game::$instance->DbQuery("UPDATE actionpending set count = count + 1 WHERE name = '{$name}'");
                    }
                    if ($name == 'draw8') {
                        game::$instance->DbQuery("UPDATE actionpending set count = count + 1 WHERE name = '{$name}'");
                    }
                    if ($name == 'clock') {
                        game::$instance->DbQuery("UPDATE actionpending set count = count + 1 WHERE name = '{$name}'");
                    }
                    if ($name == 'pet') {
                        game::$instance->DbQuery("UPDATE actionpending set count = count + 1 WHERE name = '{$name}'");
                    }
                    if ($name == 'grimoire') {
                        game::$instance->DbQuery("UPDATE actionpending set count = count + 1 WHERE name = '{$name}'");
                    }
                    if (str_starts_with($name, "ghost")) {
                        if ($type_card == 121 || $type_card == 122 || $type_card == 123) {
                            game::$instance->DbQuery("UPDATE actionpending set count = count + 2 WHERE name = 'ghost'");
                            game::$instance->player_ghosts->inc($this->player_id, 2);

                            $txt = clienttranslate('${player_name} gains ${log} ${log}');
                            game::$instance->notify->all(
                                "message",
                                $txt,
                                [
                                    'player_id' => $this->player_id,
                                    'log' => $this->getLogs('ghost'),

                                ]
                            );
                        } else {
                            game::$instance->DbQuery("UPDATE actionpending set count = count + 1 WHERE name = 'ghost'");
                            game::$instance->player_ghosts->inc($this->player_id, 1);

                            $txt = clienttranslate('${player_name} gains ${log}');
                            game::$instance->notify->all(
                                "message",
                                $txt,
                                [
                                    'player_id' => $this->player_id,
                                    'log' => $this->getLogs('ghost'),

                                ]
                            );
                        }

                        //MAJ TABLE GHOST
                        $name_ghost = 'building_' . $type_card;
                        game::$instance->DbQuery("UPDATE ghost set position = '{$this->player_id}' WHERE name = '{$name_ghost}'");
                    }
                    if ($name == 'clue') {
                        game::$instance->DbQuery("UPDATE actionpending set count = count + 1 WHERE name = '{$name}'");
                        game::$instance->player_clues->inc($this->player_id, 1);

                        $txt = clienttranslate('${player_name} gains ${log}');
                        game::$instance->notify->all(
                            "message",
                            $txt,
                            [
                                'player_id' => $this->player_id,
                                'log' => $this->getLogs('clue'),

                            ]
                        );
                    }
                    if ($name == 'replay') {
                        game::$instance->setGameStateInitialValue('replay', $this->player_id);

                        $txt = clienttranslate('${player_name} gains ${log}');
                        game::$instance->notify->all(
                            "message",
                            $txt,
                            [
                                'player_id' => $this->player_id,
                                'log' => $this->getLogs('replay'),

                            ]
                        );
                    }
                }


                // je discard la card
                game::$instance->building_DB->moveCard($cards[0]['id'], 'discard', $this->player_id);

                // verif nombre de ghosts

                $count_ghosts = game::$instance->player_ghosts->get($this->player_id);
                if ($count_ghosts >= 5) {
                    game::$instance->addPending($this->player_id, "EndGame");
                } else {
                    game::$instance->addPending($this->player_id, "ActionsBonus");
                }
            }

            ///////////////////////////////////////////////////////////////////////////////////////
            // TAKE CARD 8-
            ///////////////////////////////////////////////////////////////////////////////////////
            if (str_starts_with($varg2, 'table_building_')) {

                //on recupere le numero du deck
                [,,, $no_deck] = explode('_', $varg2);
                $deck = 'deck' . $no_deck;

                //on pick la carte et on recupere les info du pickcard (pour la card_id)
                $card_pick = game::$instance->building_DB->pickCardForLocation($deck, 'house', $this->player_id);

                //on met a jour sa position
                $count_card = count(game::$instance->getObjectListFromDB("SELECT card_id id FROM building WHERE card_type = '{$no_deck}' AND card_location = 'house' AND card_location_arg = '{$this->player_id}'", true));
                game::$instance->DbQuery("UPDATE building SET position = $count_card WHERE card_id ='{$card_pick['id']}'");

                //on recupere les info pour le front
                $card =  game::$instance->getObjectFromDB("SELECT card_type type, card_location_arg location_arg, position position FROM building WHERE card_id ='{$card_pick['id']}'");


                //je change le compteur du deck
                game::$instance->{'deck_' . $no_deck}->inc(-1);

                game::$instance->notify->all(
                    "takeCard",
                    '',
                    [
                        'player_id' => $this->player_id,
                        'no_card' => $no_deck,
                        'card' => $card,
                        'nb_remaining' => game::$instance->{'deck_' . $no_deck}->get()
                    ]
                );

                $txt = clienttranslate('${player_name} uses ${log}');
                game::$instance->notify->all(
                    "message",
                    $txt,
                    [
                        'player_id' => $this->player_id,
                        'log' => $this->getLogs('draw8'),

                    ]
                );


                // DECREMENTE LA VALEUR DE LA TABLE ACTIONPENDING
                game::$instance->DbQuery("UPDATE actionpending set count = count - 1 WHERE name = 'draw8'");

                // Notif pour enlever l'icone
                game::$instance->notify->all(
                    "removeBonus",
                    '',
                    [
                        'player_id' => $this->player_id,
                        'bonus' => 'draw8'

                    ]
                );


                // ACTION IMMEDIATE SUR UN TAKE: turn reroll token
                if ($no_deck >= 1 && $no_deck <= 4) {

                    $txt = clienttranslate('${player_name} gains ${log}');
                    game::$instance->notify->all(
                        "message",
                        $txt,
                        [
                            'player_id' => $this->player_id,
                            'log' => $this->getLogs('reroll'),

                        ]
                    );

                    $reroll = game::$instance->getUniqueValueFromDB("SELECT reroll FROM player WHERE player_id='{$this->player_id}'");
                    if ($reroll == 0) {
                        game::$instance->DbQuery("UPDATE player set reroll = 1 WHERE player_id='{$this->player_id}'");

                        game::$instance->notify->all(
                            "flipReroll",
                            '',
                            [
                                'player_id' => $this->player_id,

                            ]
                        );
                    }

                    game::$instance->addPending($this->player_id, "ActionsBonus");
                }


                // AUCUNE ACTION IMMEDIATE SUR UN TAKE
                else {
                    game::$instance->addPending($this->player_id, "ActionsBonus");
                }
            }

            ///////////////////////////////////////////////////////////////////////////////////////
            // TURN CLOCK
            ///////////////////////////////////////////////////////////////////////////////////////
            if (str_starts_with($varg2, 'clock_')) {

                $clock = intval(game::$instance->getUniqueValueFromDB("SELECT clock FROM other WHERE id=1"));
                $newclock = ($clock + 1) % 6;
                game::$instance->DbQuery("UPDATE other SET clock = $newclock WHERE id=1");

                game::$instance->notify->all(
                    "activateClockTower",
                    '',
                    [
                        'player_id' => $this->player_id,
                        'clock' => $newclock,

                    ]
                );

                $txt = clienttranslate('${player_name} uses ${log}');
                game::$instance->notify->all(
                    "message",
                    $txt,
                    [
                        'player_id' => $this->player_id,
                        'log' => $this->getLogs('clock'),

                    ]
                );

                // DECREMENTE LA VALEUR DE LA TABLE ACTIONPENDING
                game::$instance->DbQuery("UPDATE actionpending set count = count - 1 WHERE name = 'clock'");

                // Notif pour enlever l'icone
                game::$instance->notify->all(
                    "removeBonus",
                    '',
                    [
                        'player_id' => $this->player_id,
                        'bonus' => 'clock'

                    ]
                );


                //Position Artefact
                if ($newclock == 0 || $newclock == 3) {

                    $txt = clienttranslate('${player_name} gains ${log}');
                    game::$instance->notify->all(
                        "message",
                        $txt,
                        [
                            'player_id' => $this->player_id,
                            'log' => $this->getLogs('artefact'),

                        ]
                    );

                    game::$instance->player_artefacts->inc($this->player_id, 1);
                    $count_artefact = game::$instance->player_artefacts->get($this->player_id);
                    if ($count_artefact == 3) {
                        game::$instance->addPending($this->player_id, "EndGame");
                    } else {
                        game::$instance->addPending($this->player_id, "ActionsBonus");
                    }
                }

                // Position Turn reroll token
                if ($newclock == 2 || $newclock == 5) {

                    $txt = clienttranslate('${player_name} gains ${log}');
                    game::$instance->notify->all(
                        "message",
                        $txt,
                        [
                            'player_id' => $this->player_id,
                            'log' => $this->getLogs('reroll'),

                        ]
                    );

                    $reroll = game::$instance->getUniqueValueFromDB("SELECT reroll FROM player WHERE player_id='{$this->player_id}'");
                    if ($reroll == 0) {
                        game::$instance->DbQuery("UPDATE player set reroll = 1 WHERE player_id='{$this->player_id}'");

                        game::$instance->notify->all(
                            "flipReroll",
                            '',
                            [
                                'player_id' => $this->player_id,

                            ]
                        );
                    }
                    game::$instance->addPending($this->player_id, "ActionsBonus");
                }

                // Position pet
                if ($newclock == 1 || $newclock == 4) {

                    game::$instance->addPending($this->player_id, "ClockChoosePet", 1);
                }
            }

            ///////////////////////////////////////////////////////////////////////////////////////
            // TAKE PET
            ///////////////////////////////////////////////////////////////////////////////////////
            if (str_starts_with($varg2, 'card_pet_')) {

                [,, $no_pet] = explode('_', $varg2);

                $pet = 'pet' . $no_pet;

                //je recupere le détail du pet avant modif (pour savoir si c'est take ou steal)
                $detail_pet = game::$instance->getUniqueValueFromDB("SELECT $pet FROM other WHERE id=1");
                [$slot, $position] = explode('_', $detail_pet);

                //je modifie l'etat du pet
                if ($pet !== null) {
                    $newposition = $slot . '_' . $this->player_id;
                    game::$instance->DbQuery("
                        UPDATE other 
                        SET {$pet} = '{$newposition}' 
                        WHERE id = 1
                    ");
                }

                // je lances les notifs (take ou steal)
                if ($position == 'table') {
                    $txt = clienttranslate('${player_name} takes ${log}');
                    game::$instance->notify->all(
                        "stealPet",
                        $txt,
                        [
                            'player_id' => $this->player_id,
                            'pet_id' => $varg2,
                            'log' => $this->getLogs('pet'),
                        ]
                    );
                } else {
                    $opponent_infos = game::$instance->getObjectFromDb("SELECT player_id, player_name, player_color FROM player WHERE player_id = '{$position}'");
                    $txt = clienttranslate('${player_name} steals ${log} from ${opponent}');
                    game::$instance->notify->all(
                        "stealPet",
                        $txt,
                        [
                            'player_id' => $this->player_id,
                            'pet_id' => $varg2,
                            'opponent_id' => $opponent_infos['player_id'],
                            'log' => $this->getLogs('pet'),
                            'opponent' =>    [
                                'log' => '<b style="color: #${color};">${opponent_name}</b>',
                                'args' => ['opponent_name' => $opponent_infos['player_name'], 'color' => $opponent_infos['player_color']]
                            ],
                        ]
                    );

                    // on a volé un pet, on décrémente le compteur
                    game::$instance->player_ghosts->inc($opponent_infos['player_id'], -1);
                }

                // DECREMENTE LA VALEUR DE LA TABLE ACTIONPENDING
                game::$instance->DbQuery("UPDATE actionpending set count = count - 1 WHERE name = 'pet'");

                // Notif pour enlever l'icone
                game::$instance->notify->all(
                    "removeBonus",
                    '',
                    [
                        'player_id' => $this->player_id,
                        'bonus' => 'pet'

                    ]
                );

                //MAJ TABLE GHOST
                $name_ghost = 'pet_' . $no_pet;
                game::$instance->DbQuery("UPDATE ghost set position = '{$this->player_id}' WHERE name = '{$name_ghost}'");


                //j'inc le compteur ghosts

                game::$instance->player_ghosts->inc($this->player_id, 1);
                $count_ghosts = game::$instance->player_ghosts->get($this->player_id);
                if ($count_ghosts >= 5) {
                    game::$instance->addPending($this->player_id, "EndGame");
                } else {
                    game::$instance->addPending($this->player_id, "ActionsBonus");
                }
            }

            ///////////////////////////////////////////////////////////////////////////////////////
            // GRIMOIRE
            ///////////////////////////////////////////////////////////////////////////////////////
            if (str_starts_with($varg2, 'deck_grimoire')) {

                // DECREMENTE LA VALEUR DE LA TABLE ACTIONPENDING
                game::$instance->DbQuery("UPDATE actionpending set count = count - 1 WHERE name = 'grimoire'");

                // Notif pour enlever l'icone
                game::$instance->notify->all(
                    "removeBonus",
                    '',
                    [
                        'player_id' => $this->player_id,
                        'bonus' => 'grimoire'

                    ]
                );

                $txt = clienttranslate('${player_name} uses ${log}');
                game::$instance->notify->all(
                    "message",
                    $txt,
                    [
                        'player_id' => $this->player_id,
                        'log' => $this->getLogs('grimoire'),

                    ]
                );

                game::$instance->addPending($this->player_id, "Grimoire");
            }
        }
    }


    /*
      _____      _                 _          
     / ____|    (_)               (_)         
    | |  __ _ __ _ _ __ ___   ___  _ _ __ ___ 
    | | |_ | '__| | '_ ` _ \ / _ \| | '__/ _ \
    | |__| | |  | | | | | | | (_) | | | |  __/
     \_____|_|  |_|_| |_| |_|\___/|_|_|  \___|
                                           
    */

    function argGrimoire($parg1, $parg2)
    {
        $ret = [];
        $ret["selectable"] = [];
        $ret["selected"] = [];
        $ret['buttons'] = [];
        $ret["function"] = "Grimoire";
        $ret['title'] = clienttranslate('${actplayer} reads the grimoire');
        $ret['titleyou'] = clienttranslate('${you} are reading the grimoire');


        return $ret;
    }



    function Grimoire($parg1, $parg2, $varg1, $varg2, $varg3, $varg4)
    {
        $card_pick = game::$instance->grimoire_DB->pickCardForLocation('deck', 'table', $this->player_id);

        game::$instance->notify->all(
            "drawGrimoire",
            '',
            [
                'player_id' => $this->player_id,
                'grimoire' => $card_pick

            ]
        );

        game::$instance->deck_grimoire->inc(-1);


        if ($card_pick['type'] == 1) {
            game::$instance->player_ghosts->inc($this->player_id, 1);
            $count_ghosts = game::$instance->player_ghosts->get($this->player_id);
            if ($count_ghosts >= 5) {
                game::$instance->addPending($this->player_id, "EndGame");
            } else {
                game::$instance->addPending($this->player_id, "ActionsBonus");
            }

            //MAJ TABLE GHOST
            $name_ghost = 'grimoire_1';
            game::$instance->DbQuery("UPDATE ghost set position = '{$this->player_id}' WHERE name = '{$name_ghost}'");

            //AJOUTER LA NOTIF MESSAGE
            $grimoire_id = game::$instance->getUniqueValueFromDB("SELECT card_id FROM grimoire WHERE card_location = 'table'");
            game::$instance->grimoire_DB->moveCard($grimoire_id, 'discard', $this->player_id);

            $txt = clienttranslate('${player_name} gains ${log}');
            game::$instance->notify->all(
                "message",
                $txt,
                [
                    'player_id' => $this->player_id,
                    'log' => $this->getLogs('ghost'),

                ]
            );

            game::$instance->notify->all(
                "removeGrimoire",
                '',
                [
                    'player_id' => $this->player_id,
                ]
            );
        }

        if ($card_pick['type'] == 2) {
            game::$instance->player_clues->inc($this->player_id, 1);
            game::$instance->DbQuery("UPDATE actionpending set count = count + 1 WHERE name = 'clue'");
            game::$instance->addPending($this->player_id, "ActionsBonus");

            $grimoire_id = game::$instance->getUniqueValueFromDB("SELECT card_id FROM grimoire WHERE card_location = 'table'");
            game::$instance->grimoire_DB->moveCard($grimoire_id, 'discard', $this->player_id);

            $txt = clienttranslate('${player_name} gains ${log}');
            game::$instance->notify->all(
                "message",
                $txt,
                [
                    'player_id' => $this->player_id,
                    'log' => $this->getLogs('clue'),

                ]
            );

            game::$instance->notify->all(
                "removeGrimoire",
                '',
                [
                    'player_id' => $this->player_id,
                ]
            );
        }

        if ($card_pick['type'] == 3) {
            game::$instance->addPending($this->player_id, "GrimoireTake");

            $txt = clienttranslate('${player_name} gains ${log}');
            game::$instance->notify->all(
                "message",
                $txt,
                [
                    'player_id' => $this->player_id,
                    'log' => $this->getLogs('take'),

                ]
            );
        }

        if ($card_pick['type'] == 4) {
            game::$instance->setGameStateInitialValue('replay', $this->player_id);
            game::$instance->addPending($this->player_id, "ActionsBonus");

            $txt = clienttranslate('${player_name} gains ${log}');
            game::$instance->notify->all(
                "message",
                $txt,
                [
                    'player_id' => $this->player_id,
                    'log' => $this->getLogs('replay'),

                ]
            );

            $grimoire_id = game::$instance->getUniqueValueFromDB("SELECT card_id FROM grimoire WHERE card_location = 'table'");
            game::$instance->grimoire_DB->moveCard($grimoire_id, 'discard', $this->player_id);

            game::$instance->notify->all(
                "removeGrimoire",
                '',
                [
                    'player_id' => $this->player_id,
                ]
            );
        }

        if ($card_pick['type'] == 5) {
            game::$instance->addPending($this->player_id, "GrimoireClock", 2);

            $txt = clienttranslate('${player_name} gains ${log} ${log}');
            game::$instance->notify->all(
                "message",
                $txt,
                [
                    'player_id' => $this->player_id,
                    'log' => $this->getLogs('clock'),

                ]
            );
        }

        if ($card_pick['type'] == 6) {
            game::$instance->addPending($this->player_id, "GrimoireClock", 1);

            $txt = clienttranslate('${player_name} gains ${log}');
            game::$instance->notify->all(
                "message",
                $txt,
                [
                    'player_id' => $this->player_id,
                    'log' => $this->getLogs('clock'),

                ]
            );
        }

        if ($card_pick['type'] == 7) {
            game::$instance->addPending($this->player_id, "GrimoirePet", 1);

            $txt = clienttranslate('${player_name} gains ${log}');
            game::$instance->notify->all(
                "message",
                $txt,
                [
                    'player_id' => $this->player_id,
                    'log' => $this->getLogs('pet'),

                ]
            );
        }
    }

    function argGrimoireTake($parg1, $parg2)
    {
        $ret = [];
        $ret["selectable"] = [];
        $ret["selected"] = [];
        $ret['buttons'] = [];
        $ret["function"] = "Grimoire";
        $ret['title'] = clienttranslate('${actplayer} reads the grimoire');
        $ret['titleyou'] = clienttranslate('${you} must take a card');


        for ($i = 1; $i <= 12; $i++) {
            $deck = "deck_$i";
            $count = game::$instance->$deck->get();

            if ($count >= 1) {
                $ret["selectable"][] = 'table_building_card_' . $i;
            }
        }

        if (count($ret["selectable"]) >= 1) {
            $ret['buttons'][] = 'take_card_btn';
        }

        return $ret;
    }



    function GrimoireTake($parg1, $parg2, $varg1, $varg2, $varg3, $varg4)
    {
        if ($varg1 == null) {
            game::$instance->addPending($this->player_id, "ActionsBonus");

            $grimoire_id = game::$instance->getUniqueValueFromDB("SELECT card_id FROM grimoire WHERE card_location = 'table'");
            game::$instance->grimoire_DB->moveCard($grimoire_id, 'discard', $this->player_id);

            game::$instance->notify->all(
                "removeGrimoire",
                '',
                [
                    'player_id' => $this->player_id,
                ]
            );
        } else {
            //on recupere le numero du deck
            [,,, $no_deck] = explode('_', $varg2);
            $deck = 'deck' . $no_deck;

            //on pick la carte et on recupere les info du pickcard (pour la card_id)
            $card_pick = game::$instance->building_DB->pickCardForLocation($deck, 'house', $this->player_id);

            //on met a jour sa position
            $count_card = count(game::$instance->getObjectListFromDB("SELECT card_id id FROM building WHERE card_type = '{$no_deck}' AND card_location = 'house' AND card_location_arg = '{$this->player_id}'", true));
            game::$instance->DbQuery("UPDATE building SET position = $count_card WHERE card_id ='{$card_pick['id']}'");

            //on recupere les info pour le front
            $card =  game::$instance->getObjectFromDB("SELECT card_type type, card_location_arg location_arg, position position FROM building WHERE card_id ='{$card_pick['id']}'");

            //je change le compteur du deck
            game::$instance->{'deck_' . $no_deck}->inc(-1);

            $txt = clienttranslate('${player_name} takes card ${no_card}');
            game::$instance->notify->all(
                "takeCard",
                $txt,
                [
                    'player_id' => $this->player_id,
                    'no_card' => $no_deck,
                    'card' => $card,
                    'nb_remaining' => game::$instance->{'deck_' . $no_deck}->get()
                ]
            );

            // ACTION IMMEDIATE SUR UN TAKE: turn reroll token
            if ($no_deck >= 1 && $no_deck <= 4) {

                $txt = clienttranslate('${player_name} gains ${log}');
                game::$instance->notify->all(
                    "message",
                    $txt,
                    [
                        'player_id' => $this->player_id,
                        'log' => $this->getLogs('reroll'),

                    ]
                );

                $reroll = game::$instance->getUniqueValueFromDB("SELECT reroll FROM player WHERE player_id='{$this->player_id}'");
                if ($reroll == 0) {
                    game::$instance->DbQuery("UPDATE player set reroll = 1 WHERE player_id='{$this->player_id}'");

                    game::$instance->notify->all(
                        "flipReroll",
                        '',
                        [
                            'player_id' => $this->player_id,

                        ]
                    );
                }

                game::$instance->addPending($this->player_id, "ActionsBonus");

                $grimoire_id = game::$instance->getUniqueValueFromDB("SELECT card_id FROM grimoire WHERE card_location = 'table'");
                game::$instance->grimoire_DB->moveCard($grimoire_id, 'discard', $this->player_id);

                game::$instance->notify->all(
                    "removeGrimoire",
                    '',
                    [
                        'player_id' => $this->player_id,
                    ]
                );
            }

            // ACTION IMMEDIATE SUR UN TAKE: turn clock
            elseif ($no_deck == 9) {
                $clock = intval(game::$instance->getUniqueValueFromDB("SELECT clock FROM other WHERE id=1"));
                $newclock = ($clock + 1) % 6;
                game::$instance->DbQuery("UPDATE other SET clock = $newclock WHERE id=1");

                $txt = clienttranslate('${player_name} turns ${log}');
                game::$instance->notify->all(
                    "message",
                    $txt,
                    [
                        'player_id' => $this->player_id,
                        'log' => $this->getLogs('clock'),
                    ]
                );

                game::$instance->notify->all(
                    "activateClockTower",
                    "",
                    [
                        'player_id' => $this->player_id,
                        'clock' => $newclock,

                    ]
                );

                //Position Artefact
                if ($newclock == 0 || $newclock == 3) {

                    $txt = clienttranslate('${player_name} gains ${log}');
                    game::$instance->notify->all(
                        "message",
                        $txt,
                        [
                            'player_id' => $this->player_id,
                            'log' => $this->getLogs('artefact'),

                        ]
                    );

                    game::$instance->player_artefacts->inc($this->player_id, 1);
                    $count_artefact = game::$instance->player_artefacts->get($this->player_id);
                    if ($count_artefact == 3) {
                        game::$instance->addPending($this->player_id, "EndGame");
                    } else {
                        game::$instance->addPending($this->player_id, "ActionsBonus");
                    }

                    $grimoire_id = game::$instance->getUniqueValueFromDB("SELECT card_id FROM grimoire WHERE card_location = 'table'");
                    game::$instance->grimoire_DB->moveCard($grimoire_id, 'discard', $this->player_id);

                    game::$instance->notify->all(
                        "removeGrimoire",
                        '',
                        [
                            'player_id' => $this->player_id,
                        ]
                    );
                }

                // Position Turn reroll token
                if ($newclock == 2 || $newclock == 5) {

                    $txt = clienttranslate('${player_name} gains ${log}');
                    game::$instance->notify->all(
                        "message",
                        $txt,
                        [
                            'player_id' => $this->player_id,
                            'log' => $this->getLogs('reroll'),

                        ]
                    );

                    $reroll = game::$instance->getUniqueValueFromDB("SELECT reroll FROM player WHERE player_id='{$this->player_id}'");
                    if ($reroll == 0) {
                        game::$instance->DbQuery("UPDATE player set reroll = 1 WHERE player_id='{$this->player_id}'");

                        game::$instance->notify->all(
                            "flipReroll",
                            '',
                            [
                                'player_id' => $this->player_id,

                            ]
                        );
                    }

                    $grimoire_id = game::$instance->getUniqueValueFromDB("SELECT card_id FROM grimoire WHERE card_location = 'table'");
                    game::$instance->grimoire_DB->moveCard($grimoire_id, 'discard', $this->player_id);

                    game::$instance->notify->all(
                        "removeGrimoire",
                        '',
                        [
                            'player_id' => $this->player_id,
                        ]
                    );

                    game::$instance->addPending($this->player_id, "ActionsBonus");
                }

                // Position pet
                if ($newclock == 1 || $newclock == 4) {

                    game::$instance->addPending($this->player_id, "GrimoirePet");
                }
            }

            // AUCUNE ACTION IMMEDIATE SUR UN TAKE
            else {
                game::$instance->addPending($this->player_id, "ActionsBonus");

                $grimoire_id = game::$instance->getUniqueValueFromDB("SELECT card_id FROM grimoire WHERE card_location = 'table'");
                game::$instance->grimoire_DB->moveCard($grimoire_id, 'discard', $this->player_id);

                game::$instance->notify->all(
                    "removeGrimoire",
                    '',
                    [
                        'player_id' => $this->player_id,
                    ]
                );
            }
        }
    }

    function argGrimoireClock($parg1, $parg2)
    {
        $ret = [];
        $ret["selectable"] = [];
        $ret["selected"] = [];
        $ret['buttons'] = [];
        $ret["function"] = "Grimoire";
        $ret['title'] = clienttranslate('${actplayer} reads the grimoire');
        $ret['titleyou'] = clienttranslate('${you} are reading the grimoire');



        return $ret;
    }



    function GrimoireClock($parg1, $parg2, $varg1, $varg2, $varg3, $varg4)
    {
        $clock = intval(game::$instance->getUniqueValueFromDB("SELECT clock FROM other WHERE id=1"));
        $newclock = ($clock + 1) % 6;
        game::$instance->DbQuery("UPDATE other SET clock = $newclock WHERE id=1");

        $txt = clienttranslate('${player_name} turns ${log}');
        game::$instance->notify->all(
            "message",
            $txt,
            [
                'player_id' => $this->player_id,
                'log' => $this->getLogs('clock'),
            ]
        );

        game::$instance->notify->all(
            "activateClockTower",
            '',
            [
                'player_id' => $this->player_id,
                'clock' => $newclock,

            ]
        );

        //Position Artefact
        if ($newclock == 0 || $newclock == 3) {

            $txt = clienttranslate('${player_name} gains ${log}');
            game::$instance->notify->all(
                "message",
                $txt,
                [
                    'player_id' => $this->player_id,
                    'log' => $this->getLogs('artefact'),

                ]
            );

            game::$instance->player_artefacts->inc($this->player_id, 1);
            $count_artefact = game::$instance->player_artefacts->get($this->player_id);
            if ($count_artefact == 3) {
                game::$instance->addPending($this->player_id, "EndGame");
            } else {
                if ($parg1 == 2) {
                    game::$instance->addPending($this->player_id, "GrimoireClock", 1);
                } else {
                    game::$instance->addPending($this->player_id, "ActionsBonus");

                    $grimoire_id = game::$instance->getUniqueValueFromDB("SELECT card_id FROM grimoire WHERE card_location = 'table'");
                    game::$instance->grimoire_DB->moveCard($grimoire_id, 'discard', $this->player_id);

                    game::$instance->notify->all(
                        "removeGrimoire",
                        '',
                        [
                            'player_id' => $this->player_id,
                        ]
                    );
                }
            }
        }

        // Position Turn reroll token
        if ($newclock == 2 || $newclock == 5) {

            $txt = clienttranslate('${player_name} gains ${log}');
            game::$instance->notify->all(
                "message",
                $txt,
                [
                    'player_id' => $this->player_id,
                    'log' => $this->getLogs('reroll'),

                ]
            );

            $reroll = game::$instance->getUniqueValueFromDB("SELECT reroll FROM player WHERE player_id='{$this->player_id}'");
            if ($reroll == 0) {
                game::$instance->DbQuery("UPDATE player set reroll = 1 WHERE player_id='{$this->player_id}'");

                game::$instance->notify->all(
                    "flipReroll",
                    '',
                    [
                        'player_id' => $this->player_id,

                    ]
                );
            }

            if ($parg1 == 2) {
                game::$instance->addPending($this->player_id, "GrimoireClock", 1);
            } else {
                game::$instance->addPending($this->player_id, "ActionsBonus");

                $grimoire_id = game::$instance->getUniqueValueFromDB("SELECT card_id FROM grimoire WHERE card_location = 'table'");
                game::$instance->grimoire_DB->moveCard($grimoire_id, 'discard', $this->player_id);

                game::$instance->notify->all(
                    "removeGrimoire",
                    '',
                    [
                        'player_id' => $this->player_id,
                    ]
                );
            }
        }

        // Position pet
        if ($newclock == 1 || $newclock == 4) {

            game::$instance->addPending($this->player_id, "GrimoirePet", $parg1);
        }
    }

    function argGrimoirePet($parg1, $parg2)
    {
        $ret = [];
        $ret["selectable"] = [];
        $ret["selected"] = [];
        $ret['buttons'] = [];
        $ret["function"] = "Grimoire";
        $ret['title'] = clienttranslate('${actplayer} reads the grimoire');
        $ret['titleyou'] = clienttranslate('${you} must choose a pet');


        $pets = game::$instance->getObjectFromDB("SELECT pet1 pet1, pet2 pet2, pet3 pet3 FROM other WHERE id=1");

        for ($i = 1; $i <= 3; $i++) {
            [, $position] = explode('_', $pets['pet' . $i]);
            if ($position == 'table') {
                $ret["selectable"][] = 'card_pet_' . $i;
            }
        }

        if (count($ret["selectable"]) == 0) {
            for ($i = 1; $i <= 3; $i++) {
                [, $position] = explode('_', $pets['pet' . $i]);
                if ($position != $this->player_id) {
                    $ret["selectable"][] = 'card_pet_' . $i;
                }
            }
        }

        if (count($ret["selectable"]) != 0) {
            $ret['buttons'][] = 'take_grimoire_pet_btn';
        }


        return $ret;
    }



    function GrimoirePet($parg1, $parg2, $varg1, $varg2, $varg3, $varg4)
    {
        if ($varg1 == null) {

            if ($parg1 == 2) {
                game::$instance->addPending($this->player_id, "GrimoireClock", 1);
            } else {
                game::$instance->addPending($this->player_id, "ActionsBonus");

                $grimoire_id = game::$instance->getUniqueValueFromDB("SELECT card_id FROM grimoire WHERE card_location = 'table'");
                game::$instance->grimoire_DB->moveCard($grimoire_id, 'discard', $this->player_id);

                game::$instance->notify->all(
                    "removeGrimoire",
                    '',
                    [
                        'player_id' => $this->player_id,
                    ]
                );
            }
        } else {

            [,, $no_pet] = explode('_', $varg2);

            $pet = 'pet' . $no_pet;

            //je recupere le détail du pet avant modif (pour savoir si c'est take ou steal)
            $detail_pet = game::$instance->getUniqueValueFromDB("SELECT $pet FROM other WHERE id=1");
            [$slot, $position] = explode('_', $detail_pet);

            //je modifie l'etat du pet
            if ($pet !== null) {
                $newposition = $slot . '_' . $this->player_id;
                game::$instance->DbQuery("
                    UPDATE other 
                    SET {$pet} = '{$newposition}' 
                    WHERE id = 1
                ");
            }

            // je lances les notifs (take ou steal)
            if ($position == 'table') {
                $txt = clienttranslate('${player_name} takes ${log}');
                game::$instance->notify->all(
                    "stealPet",
                    $txt,
                    [
                        'player_id' => $this->player_id,
                        'pet_id' => $varg2,
                        'log' => $this->getLogs('pet'),
                    ]
                );
            } else {
                $opponent_infos = game::$instance->getObjectFromDb("SELECT player_id, player_name, player_color FROM player WHERE player_id = '{$position}'");
                $txt = clienttranslate('${player_name} steals ${log} from ${opponent}');
                game::$instance->notify->all(
                    "stealPet",
                    $txt,
                    [
                        'player_id' => $this->player_id,
                        'pet_id' => $varg2,
                        'opponent_id' => $opponent_infos['player_id'],
                        'log' => $this->getLogs('pet'),
                        'opponent' =>    [
                            'log' => '<b style="color: #${color};">${opponent_name}</b>',
                            'args' => ['opponent_name' => $opponent_infos['player_name'], 'color' => $opponent_infos['player_color']]
                        ],
                    ]
                );

                // on a volé un pet, on décrémente le compteur
                game::$instance->player_ghosts->inc($opponent_infos['player_id'], -1);
            }

            if ($parg1 == 1) {
                $grimoire_id = game::$instance->getUniqueValueFromDB("SELECT card_id FROM grimoire WHERE card_location = 'table'");
                game::$instance->grimoire_DB->moveCard($grimoire_id, 'discard', $this->player_id);

                game::$instance->notify->all(
                    "removeGrimoire",
                    '',
                    [
                        'player_id' => $this->player_id,
                    ]
                );
            }

            //MAJ TABLE GHOST
            $name_ghost = 'pet_' . $no_pet;
            game::$instance->DbQuery("UPDATE ghost set position = '{$this->player_id}' WHERE name = '{$name_ghost}'");

            //j'inc le compteur ghosts

            game::$instance->player_ghosts->inc($this->player_id, 1);
            $count_ghosts = game::$instance->player_ghosts->get($this->player_id);
            if ($count_ghosts >= 5) {
                game::$instance->addPending($this->player_id, "EndGame");
            } else {
                if ($parg1 == 2) {
                    game::$instance->addPending($this->player_id, "GrimoireClock", 1);
                } else {
                    game::$instance->addPending($this->player_id, "ActionsBonus");
                }
            }
        }
    }


    /*
     _____           _    
    |  __ \         | |   
    | |__) |_ _ _ __| | __
    |  ___/ _` | '__| |/ /
    | |  | (_| | |  |   < 
    |_|   \__,_|_|  |_|\_\
                       
    */

    function argPark($parg1, $parg2)
    {
        $ret = [];
        $ret["selectable"] = [];
        $ret["selected"] = [];
        $ret['buttons'] = [];
        $ret["function"] = "Park";
        $ret['title'] = clienttranslate('${actplayer} goes to the park');
        $ret['titleyou'] = clienttranslate('${you} are going to the park');


        $ret['buttons'][] = 'go_to_park_btn';

        return $ret;
    }



    function Park($parg1, $parg2, $varg1, $varg2, $varg3, $varg4)
    {
        $count_clues = game::$instance->player_clues->get($this->player_id);
        $count_park = game::$instance->deck_park->get();
        $order = game::$instance->getGameStateValue('park_order');

        $tableau_order = array_map('intval', str_split((string)$order));

        $ghosts_win = [];


        if ($count_park == 5) {
            if ($count_clues >= 1) {
                $ghosts_win[] = $tableau_order[0];
                game::$instance->player_clues->inc($this->player_id, -1);
                game::$instance->DbQuery("UPDATE ghost set position = '{$this->player_id}' WHERE name = 'park_1'");
            }

            if ($count_clues >= 3) {
                $ghosts_win[] = $tableau_order[1];
                game::$instance->player_clues->inc($this->player_id, -2);
                game::$instance->DbQuery("UPDATE ghost set position = '{$this->player_id}' WHERE name = 'park_2'");
            }

            if ($count_clues >= 5) {
                $ghosts_win[] = $tableau_order[2];
                game::$instance->player_clues->inc($this->player_id, -2);
                game::$instance->DbQuery("UPDATE ghost set position = '{$this->player_id}' WHERE name = 'park_3'");
            }

            if ($count_clues >= 7) {
                $ghosts_win[] = $tableau_order[3];
                game::$instance->player_clues->inc($this->player_id, -2);
                game::$instance->DbQuery("UPDATE ghost set position = '{$this->player_id}' WHERE name = 'park_4'");
            }

            if ($count_clues >= 10) {
                $ghosts_win[] = $tableau_order[4];
                game::$instance->player_clues->inc($this->player_id, -3);
                game::$instance->DbQuery("UPDATE ghost set position = '{$this->player_id}' WHERE name = 'park_5'");
            }
        }

        if ($count_park == 4) {
            if ($count_clues >= 2) {
                $ghosts_win[] = $tableau_order[1];
                game::$instance->player_clues->inc($this->player_id, -2);
                game::$instance->DbQuery("UPDATE ghost set position = '{$this->player_id}' WHERE name = 'park_2'");
            }

            if ($count_clues >= 4) {
                $ghosts_win[] = $tableau_order[2];
                game::$instance->player_clues->inc($this->player_id, -2);
                game::$instance->DbQuery("UPDATE ghost set position = '{$this->player_id}' WHERE name = 'park_3'");
            }

            if ($count_clues >= 6) {
                $ghosts_win[] = $tableau_order[3];
                game::$instance->player_clues->inc($this->player_id, -2);
                game::$instance->DbQuery("UPDATE ghost set position = '{$this->player_id}' WHERE name = 'park_4'");
            }

            if ($count_clues >= 9) {
                $ghosts_win[] = $tableau_order[4];
                game::$instance->player_clues->inc($this->player_id, -3);
                game::$instance->DbQuery("UPDATE ghost set position = '{$this->player_id}' WHERE name = 'park_5'");
            }
        }

        if ($count_park == 3) {

            if ($count_clues >= 2) {
                $ghosts_win[] = $tableau_order[2];
                game::$instance->player_clues->inc($this->player_id, -2);
                game::$instance->DbQuery("UPDATE ghost set position = '{$this->player_id}' WHERE name = 'park_3'");
            }

            if ($count_clues >= 4) {
                $ghosts_win[] = $tableau_order[3];
                game::$instance->player_clues->inc($this->player_id, -2);
                game::$instance->DbQuery("UPDATE ghost set position = '{$this->player_id}' WHERE name = 'park_4'");
            }

            if ($count_clues >= 7) {
                $ghosts_win[] = $tableau_order[4];
                game::$instance->player_clues->inc($this->player_id, -3);
                game::$instance->DbQuery("UPDATE ghost set position = '{$this->player_id}' WHERE name = 'park_5'");
            }
        }

        if ($count_park == 2) {

            if ($count_clues >= 2) {
                $ghosts_win[] = $tableau_order[3];
                game::$instance->player_clues->inc($this->player_id, -2);
                game::$instance->DbQuery("UPDATE ghost set position = '{$this->player_id}' WHERE name = 'park_4'");
            }

            if ($count_clues >= 5) {
                $ghosts_win[] = $tableau_order[4];
                game::$instance->player_clues->inc($this->player_id, -3);
                game::$instance->DbQuery("UPDATE ghost set position = '{$this->player_id}' WHERE name = 'park_5'");
            }
        }

        if ($count_park == 1) {

            if ($count_clues >= 3) {
                $ghosts_win[] = $tableau_order[4];
                game::$instance->player_clues->inc($this->player_id, -3);
                game::$instance->DbQuery("UPDATE ghost set position = '{$this->player_id}' WHERE name = 'park_5'");
            }
        }

        $count_ghosts_win = count($ghosts_win);
        if ($count_ghosts_win >= 1) {
            game::$instance->deck_park->inc(-$count_ghosts_win);
            game::$instance->player_ghosts->inc($this->player_id, $count_ghosts_win);

            $count_clues_after = game::$instance->player_clues->get($this->player_id);

            for ($i = 1; $i <= $count_ghosts_win; $i++) {
                $txt = clienttranslate('${player_name} gains ${log}');
                game::$instance->notify->all(
                    "message",
                    $txt,
                    [
                        'player_id' => $this->player_id,
                        'log' => $this->getLogs('ghost'),

                    ]
                );
            }

            game::$instance->notify->all(
                "goToThePark",
                '',
                [
                    'player_id' => $this->player_id,
                    'ghosts' => $ghosts_win,
                    'clues' => $count_clues - $count_clues_after,

                ]
            );
        }

        // verif nombre de ghosts

        $count_ghosts = game::$instance->player_ghosts->get($this->player_id);
        if ($count_ghosts >= 5) {
            game::$instance->addPending($this->player_id, "EndGame");
        } else {

            if (game::$instance->getGameStateValue('replay') != 0) {
                game::$instance->setGameStateInitialValue('replay', 0);
                $txt = clienttranslate('${player_name} replays');
                game::$instance->notify->all(
                    "removeReplay",
                    $txt,
                    [
                        'player_id' => $this->player_id,

                    ]
                );

                game::$instance->addPending($this->player_id, "PlayerTurn");
            } else {
                game::$instance->addPendingFirst($this->player_id, "PlayerTurn");
            }
        }
    }




    /*
      _____ _            _       _____ _                            _____     _   
     / ____| |          | |     / ____| |                          |  __ \   | |  
    | |    | | ___   ___| | __ | |    | |__   ___   ___  ___  ___  | |__) |__| |_ 
    | |    | |/ _ \ / __| |/ / | |    | '_ \ / _ \ / _ \/ __|/ _ \ |  ___/ _ \ __|
    | |____| | (_) | (__|   <  | |____| | | | (_) | (_) \__ \  __/ | |  |  __/ |_ 
     \_____|_|\___/ \___|_|\_\  \_____|_| |_|\___/ \___/|___/\___| |_|   \___|\__|
                                                                               
    */


    function argClockChoosePet($parg1, $parg2)
    {
        $ret = [];
        $ret["selectable"] = [];
        $ret["selected"] = [];
        $ret['buttons'] = [];
        $ret["function"] = "ClockChoosePet";
        $ret['title'] = clienttranslate('${actplayer} must choose a pet');
        $ret['titleyou'] = clienttranslate('${you} must choose a pet');

        $pets = game::$instance->getObjectFromDB("SELECT pet1 pet1, pet2 pet2, pet3 pet3 FROM other WHERE id=1");

        for ($i = 1; $i <= 3; $i++) {
            [, $position] = explode('_', $pets['pet' . $i]);
            if ($position == 'table') {
                $ret["selectable"][] = 'card_pet_' . $i;
            }
        }

        if (count($ret["selectable"]) == 0) {
            for ($i = 1; $i <= 3; $i++) {
                [, $position] = explode('_', $pets['pet' . $i]);
                if ($position != $this->player_id) {
                    $ret["selectable"][] = 'card_pet_' . $i;
                }
            }
        }

        if (count($ret["selectable"]) != 0) {
            $ret['buttons'][] = 'take_pet_btn';
        }


        return $ret;
    }

    function ClockChoosePet($parg1, $parg2, $varg1, $varg2, $varg3, $varg4)
    {
        if ($varg1 == null) {

            if ($parg1 == 1) {
                game::$instance->addPending($this->player_id, "ActionsBonus");
            } else {
                game::$instance->addPendingFirst($this->player_id, "PlayerTurn");
            }
        } else {
            [,, $no_pet] = explode('_', $varg2);

            $pet = 'pet' . $no_pet;

            //je recupere le détail du pet avant modif (pour savoir si c'est take ou steal)
            $detail_pet = game::$instance->getUniqueValueFromDB("SELECT $pet FROM other WHERE id=1");
            [$slot, $position] = explode('_', $detail_pet);

            //je modifie l'etat du pet
            if ($pet !== null) {
                $newposition = $slot . '_' . $this->player_id;
                game::$instance->DbQuery("
                    UPDATE other 
                    SET {$pet} = '{$newposition}' 
                    WHERE id = 1
                ");
            }

            // je lances les notifs (take ou steal)
            if ($position == 'table') {
                $txt = clienttranslate('${player_name} takes ${log}');
                game::$instance->notify->all(
                    "stealPet",
                    $txt,
                    [
                        'player_id' => $this->player_id,
                        'pet_id' => $varg2,
                        'log' => $this->getLogs('pet'),
                    ]
                );
            } else {
                $opponent_infos = game::$instance->getObjectFromDb("SELECT player_id, player_name, player_color FROM player WHERE player_id = '{$position}'");
                $txt = clienttranslate('${player_name} steals ${log} from ${opponent}');
                game::$instance->notify->all(
                    "stealPet",
                    $txt,
                    [
                        'player_id' => $this->player_id,
                        'pet_id' => $varg2,
                        'opponent_id' => $opponent_infos['player_id'],
                        'log' => $this->getLogs('pet'),
                        'opponent' =>    [
                            'log' => '<b style="color: #${color};">${opponent_name}</b>',
                            'args' => ['opponent_name' => $opponent_infos['player_name'], 'color' => $opponent_infos['player_color']]
                        ],
                    ]
                );

                // on a volé un pet, on décrémente le compteur
                game::$instance->player_ghosts->inc($opponent_infos['player_id'], -1);
            }

            //MAJ TABLE GHOST
            $name_ghost = 'pet_' . $no_pet;
            game::$instance->DbQuery("UPDATE ghost set position = '{$this->player_id}' WHERE name = '{$name_ghost}'");

            //j'inc le compteur ghosts

            game::$instance->player_ghosts->inc($this->player_id, 1);
            $count_ghosts = game::$instance->player_ghosts->get($this->player_id);
            if ($count_ghosts >= 5) {
                game::$instance->addPending($this->player_id, "EndGame");
            } else {
                if ($parg1 == 1) {
                    game::$instance->addPending($this->player_id, "ActionsBonus");
                } else {
                    game::$instance->addPendingFirst($this->player_id, "PlayerTurn");
                }
            }
        }
    }


    /*
     ______           _    _____                      
    |  ____|         | |  / ____|                     
    | |__   _ __   __| | | |  __  __ _ _ __ ___   ___ 
    |  __| | '_ \ / _` | | | |_ |/ _` | '_ ` _ \ / _ \
    | |____| | | | (_| | | |__| | (_| | | | | | |  __/
    |______|_| |_|\__,_|  \_____|\__,_|_| |_| |_|\___|
                                                   
    */


    ///////////////////////////////////////////////////////////////////////////////////////
    //FONCTION TRANSITOIRE POUR LA FIN DE PARTIE (tourne en boucle)
    ///////////////////////////////////////////////////////////////////////////////////////

    function argEndGame($parg1, $parg2)
    {
        $ret = [];
        $ret["selectable"] = [];
        $ret["selected"] = [];
        $ret['buttons'] = [];
        $ret["function"] = "EndGame";
        $ret['title'] = clienttranslate('End of game');
        $ret['titleyou'] = clienttranslate('End of game');



        return $ret;
    }



    function EndGame($parg1, $parg2, $varg1, $varg2, $varg3, $varg4)
    {
        game::$instance->DbQuery("UPDATE player set player_score = 1 WHERE player_id = '{$this->player_id}'");
        game::$instance->bga->playerScore->set($this->player_id, 1);

        $ghots = game::$instance->player_ghosts->get($this->player_id);
        $artefacts = game::$instance->player_artefacts->get($this->player_id);

        if ($ghots >= 5) {
            $txt = clienttranslate('${player_name} wins the game thank to ${log}');
            game::$instance->notify->all(
                "message",
                $txt,
                [
                    'player_id' => $this->player_id,
                    'log' => $this->getLogs('ghost'),

                ]
            );
        }

        if ($artefacts >= 3) {
            $txt = clienttranslate('${player_name} wins the game thank to ${log}');
            game::$instance->notify->all(
                "message",
                $txt,
                [
                    'player_id' => $this->player_id,
                    'log' => $this->getLogs('artefact'),

                ]
            );
        }

        //stats
        $players = game::$instance->getObjectListFromDB("SELECT player_id name FROM player", true);
        foreach ($players as $player) {
            $ghost = game::$instance->player_ghosts->get($player);
            game::$instance->bga->playerStats->set('ghost_number', $ghost, $player);
            $artefact = game::$instance->player_artefacts->get($player);
            game::$instance->bga->playerStats->set('artefact_number', $artefact, $player);
        }

        // on vide la table pending pour mettre fin à la partie
        game::$instance->DbQuery("DELETE FROM `pending`;");
    }


    /*
     _                     
    | |                    
    | |     ___   __ _ ___ 
    | |    / _ \ / _` / __|
    | |___| (_) | (_| \__ \
    |______\___/ \__, |___/
                __/ |    
                |___/     

    */

    function getLogs($type)
    {
        if ($type == 'dice_1') {
            return "<div class='dice_log' title='' style='background-position-x : 0%;'></div>";
        } elseif ($type == 'dice_2') {
            return "<div class='dice_log' title='' style='background-position-x : -100%;'></div>";
        } elseif ($type == 'dice_3') {
            return "<div class='dice_log' title='' style='background-position-x : -200%;'></div>";
        } elseif ($type == 'dice_4') {
            return "<div class='dice_log' title='' style='background-position-x : -300%;'></div>";
        } elseif ($type == 'dice_5') {
            return "<div class='dice_log' title='' style='background-position-x : -400%;'></div>";
        } elseif ($type == 'dice_6') {
            return "<div class='dice_log' title='' style='background-position-x : -500%;'></div>";
        } elseif ($type == 'reroll') {
            return "<div class='icone_log' title='' style='background-position-x : 0%; background-position-y : 0%;'></div>";
        } elseif ($type == 'clock') {
            return "<div class='icone_log' title='' style='background-position-x : -100%; background-position-y : -100%;'></div>";
        } elseif ($type == 'artefact') {
            return "<div class='icone_log' title='' style='background-position-x : -200%; background-position-y : 0%;'></div>";
        } elseif ($type == 'ghost') {
            return "<div class='icone_log' title='' style='background-position-x : -300%; background-position-y : 0%;'></div>";
        } elseif ($type == 'clue') {
            return "<div class='icone_log' title='' style='background-position-x : -400%; background-position-y : 0%;'></div>";
        } elseif ($type == 'replay') {
            return "<div class='icone_log' title='' style='background-position-x : -300%; background-position-y : -100%;'></div>";
        } elseif ($type == 'flip8') {
            return "<div class='icone_log' title='' style='background-position-x : 0%; background-position-y : -200%;'></div>";
        } elseif ($type == 'flip9') {
            return "<div class='icone_log' title='' style='background-position-x : -100%; background-position-y : -200%;'></div>";
        } elseif ($type == 'draw8') {
            return "<div class='icone_log' title='' style='background-position-x : -200%; background-position-y : -200%;'></div>";
        } elseif ($type == 'pet') {
            return "<div class='icone_log' title='' style='background-position-x : -200%; background-position-y : -100%;'></div>";
        } elseif ($type == 'grimoire') {
            return "<div class='icone_log' title='' style='background-position-x : 0%; background-position-y : -100%;'></div>";
        } elseif ($type == 'take') {
            return "<div class='icone_log' title='' style='background-position-x : -300%; background-position-y : -200%;'></div>";
        } else {
            return "";
        }
    }
}
