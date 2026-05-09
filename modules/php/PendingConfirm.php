<?php

namespace Bga\Games\spookytower;   // ATTENTION NOM DU JEU

trait PendingConfirmTrait  // ATTENTION
{
    public function argConfirmChooseAction($parg1, $parg2)
    {
        $ret = [];
        $ret["selectable"] = [];
        $ret["selected"] = [];
        $ret['buttons'] = [];
        $ret["function"] = "ChooseAction";
        $ret['title'] = clienttranslate('${actplayer} must confirm');
        $ret['titleyou'] = clienttranslate('${you} must confirm');

        $ret["selected"][] = $parg1;

        $ret['buttons'][] = 'yes_btn';
        $ret['buttons'][] = 'no_btn';
        

        return $ret;
    }

    public function ConfirmChooseAction($parg1, $parg2, $varg1, $varg2)
    {
        if ($varg1 == "no_btn")
        {
            game::$instance->addPending($this->player_id, "ChooseAction");
        }

        else
        {
        ///////////////////////////////////////////////////////////////////////////////////////
        //REROLL DICE TOKEN SI TOKEN OK
        ///////////////////////////////////////////////////////////////////////////////////////

        if ($parg1 == 'reroll_dice_btn' || $parg1 == 'dice_zone') {
            
            game::$instance->addPending($this->player_id, "Reroll");
        }

        ///////////////////////////////////////////////////////////////////////////////////////
        //TURN CLOCK SI LE JOUEUR N'A PAS DE CHOIX POSSIBLE
        ///////////////////////////////////////////////////////////////////////////////////////

        elseif ($parg1 == 'turn_clock_btn') {
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

        elseif (str_starts_with($parg1, "table_building_card")) {

            //on recupere le numero du deck
            [,,, $no_deck] = explode('_', $parg1);
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

            $txt = clienttranslate('${player_name} takes card ${log}');
            game::$instance->notify->all(
                "takeCard",
                $txt,
                [
                    'player_id' => $this->player_id,
                    'no_house' => $no_deck,
                    'log' => $this->getNumbersLogs($no_deck),
                    'card' => $card,
                    'count_card' => $count_card,
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

        elseif (str_starts_with($parg1, "player_")) {
            //on recupere le numero de la maison
            [,,, $no_house] = explode('_', $parg1);

            $cards = game::$instance->getObjectListFromDB("SELECT card_id id, card_type type, card_type_arg type_arg, card_location location, card_location_arg location_arg, position position FROM building WHERE card_location ='house' AND card_location_arg = '{$this->player_id}' AND card_type ='{$no_house}'");

            $txt = clienttranslate('${player_name} flips Building ${log}');
            game::$instance->notify->all(
                "flipCards",
                $txt,
                [
                    'player_id' => $this->player_id,
                    'no_house' => $no_house,
                    'log' => $this->getNumbersLogs($no_house),
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
        
    }


    public function argConfirmActionsBonus($parg1, $parg2)
    {
        $ret = [];
        $ret["selectable"] = [];
        $ret["selected"] = [];
        $ret['buttons'] = [];
        $ret["function"] = "ActionsBonus";
        $ret['title'] = clienttranslate('${actplayer} must confirm');
        $ret['titleyou'] = clienttranslate('${you} must confirm');

        $ret["selected"][] = $parg1;

        $ret['buttons'][] = 'yes_btn';
        $ret['buttons'][] = 'no_btn';
        

        return $ret;
    }

    public function ConfirmActionsBonus($parg1, $parg2, $varg1, $varg2)
    {
        if ($varg1 == "no_btn")
        {
            game::$instance->addPending($this->player_id, "ActionsBonus");
        }

        else
        {

            ///////////////////////////////////////////////////////////////////////////////////////
            // FLIP CARD 8- ou 9+
            ///////////////////////////////////////////////////////////////////////////////////////
            if (str_starts_with($parg1, 'player_')) {

                [,,, $no_house] = explode('_', $parg1);

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

                $count_cards = game::$instance->getUniqueValueFromDb("SELECT COUNT(card_id) FROM building 
                WHERE card_location = 'house'
                AND card_location_arg = '{$this->player_id}'
                AND card_type = '{$no_house}'");


                game::$instance->notify->all(
                    "flipCard",
                    '',
                    [
                        'player_id' => $this->player_id,
                        'no_house' => $no_house,
                        'cards' => $cards,
                        'count_cards' => (int) $count_cards - 1
                    ]
                );

                if ($no_house <= 8) {

                    $txt = clienttranslate('${player_name} uses ${log} and flips ${log2}');
                    game::$instance->notify->all(
                        "message",
                        $txt,
                        [
                            'player_id' => $this->player_id,
                            'log' => $this->getLogs('flip8'),
                            'log2' => $this->getNumbersLogs($no_house),

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

                    $txt = clienttranslate('${player_name} uses ${log} and flips ${log2}');
                    game::$instance->notify->all(
                        "message",
                        $txt,
                        [
                            'player_id' => $this->player_id,
                            'log' => $this->getLogs('flip9'),
                            'log2' => $this->getNumbersLogs($no_house),

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
            if (str_starts_with($parg1, 'table_building_')) {

                //on recupere le numero du deck
                [,,, $no_deck] = explode('_', $parg1);
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
                        'no_house' => $no_deck,
                        'card' => $card,
                        'count_card' => $count_card,
                        'nb_remaining' => game::$instance->{'deck_' . $no_deck}->get()
                    ]
                );

                $txt = clienttranslate('${player_name} uses ${log} and takes card ${log2}');
                game::$instance->notify->all(
                    "message",
                    $txt,
                    [
                        'player_id' => $this->player_id,
                        'log' => $this->getLogs('draw8'),
                        'log2' => $this->getNumbersLogs($no_deck),

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
            // TAKE PET
            ///////////////////////////////////////////////////////////////////////////////////////
            if (str_starts_with($parg1, 'card_pet_')) {

                [,, $no_pet] = explode('_', $parg1);

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
                            'pet_id' => $parg1,
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
                            'pet_id' => $parg1,
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
            if (str_starts_with($parg1, 'deck_grimoire')) {

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

    
}