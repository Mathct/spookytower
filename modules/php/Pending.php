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

        $txt = clienttranslate('${player_name} rolls ${dice1} and ${dice2}');
        game::$instance->notify->all(
            "rollDice",
            $txt,
            [
                'player_id' => $this->player_id,
                'dice1' => $rand_dice1,
                'dice2' => $rand_dice2,
                'roll' => $roll
            ]
        );


        game::$instance->addPending($this->player_id, "ChooseAction");
    }

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


            $rand_dice1 = bga_rand(1, 6);
            game::$instance->DbQuery("UPDATE other set dice1 = $rand_dice1");
            $rand_dice2 = bga_rand(1, 6);
            game::$instance->DbQuery("UPDATE other set dice2 = $rand_dice2");

            $roll = [$rand_dice1, $rand_dice2];

            $txt = clienttranslate('${player_name} rolls ${dice1} and ${dice2}');
            game::$instance->notify->all(
                "rollDice",
                $txt,
                [
                    'player_id' => $this->player_id,
                    'dice1' => $rand_dice1,
                    'dice2' => $rand_dice2,
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
            if ($clock != 5) {
                game::$instance->DbQuery("UPDATE other set clock = clock + 1 WHERE id=1");
            } else {
                game::$instance->DbQuery("UPDATE other set clock = 0 WHERE id=1");
            }

            $newclock = intval(game::$instance->getUniqueValueFromDB("SELECT clock FROM other WHERE id=1"));

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

                game::$instance->addPending($this->player_id, "ChoosePet");
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
            game::$instance->DbQuery("UPDATE building set position = $count_card WHERE card_id ='{$card_pick['id']}'");

            //on recupere les info pour le front
            $card =  game::$instance->getObjectFromDB("SELECT card_type type, card_location_arg location_arg, position position FROM building WHERE card_id ='{$card_pick['id']}'");


            $txt = clienttranslate('${player_name} takes card ${no_card}');
            game::$instance->notify->all(
                "takeCard",
                $txt,
                [
                    'player_id' => $this->player_id,
                    'no_card' => $no_deck,
                    'card' => $card,
                ]
            );


            //je change le compteur du deck
            game::$instance->{'deck_' . $no_deck}->inc(-1);


            // ACTION IMMEDIATE SUR UN TAKE: turn reroll token
            if ($no_deck >= 1 && $no_deck <= 4) {
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
                if ($clock != 5) {
                    game::$instance->DbQuery("UPDATE other set clock = clock + 1 WHERE id=1");
                } else {
                    game::$instance->DbQuery("UPDATE other set clock = 0 WHERE id=1");
                }

                $newclock = intval(game::$instance->getUniqueValueFromDB("SELECT clock FROM other WHERE id=1"));

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

                    game::$instance->addPending($this->player_id, "ChoosePet");
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

            ///////////////////////////////////////////////////////////////////////////////////////
            // POUR LE MOMENT JE DISCARD LES CARDS (mais on pourra les mettre en location 'hand' ou autre pour les garder visible sur le verso)
            ///////////////////////////////////////////////////////////////////////////////////////

            foreach ($cards as $card) {
                game::$instance->building_DB->moveCard($card['id'], 'discard', $this->player_id);
            }

            game::$instance->addPendingFirst($this->player_id, "PlayerTurn");
        }
    }








    function argChoosePet($parg1, $parg2)
    {
        $ret = [];
        $ret["selectable"] = [];
        $ret["selected"] = [];
        $ret['buttons'] = [];
        $ret["function"] = "PlayerTurn";
        $ret['title'] = clienttranslate('${actplayer} must choose a pet');
        $ret['titleyou'] = clienttranslate('${you} must choose a pet');

        $pets = game::$instance->getObjectFromDB( "SELECT pet1 pet1, pet2 pet2, pet3 pet3 FROM other WHERE id=1" );

        for ($i=1 ; $i<=3 ; $i++)
        {
            [$no_pet, $position] = explode('_', $pets['pet'.$i]);
            if($position == 'table')
            {
                $ret["selectable"][] = 'card_pet_'.$no_pet;
            }
        }

        if(count($ret["selectable"]) == 0)
        {
            for ($i=1 ; $i<=3 ; $i++)
            {
                [$no_pet, $position] = explode('_', $pets['pet'.$i]);
                if($position != $this->player_id)
                {
                    $ret["selectable"][] = 'card_pet_'.$no_pet;
                }
            }

        }

        if(count($ret["selectable"]) != 0)
        {
            $ret['buttons'][] = 'take_pet_btn';
        }


        


        return $ret;
    }

    function ChoosePet($parg1, $parg2, $varg1, $varg2, $varg3, $varg4)
    {
        if($varg1 == null)
        {
            game::$instance->addPendingFirst($this->player_id, "PlayerTurn");
        }

        else
        {
            [,, $no_pet] = explode('_', $varg2);

            $no_pet = intval($no_pet);

            // je recupere le nom de la colonne a modifier
            $pattern = $no_pet . '\_%';

            $sql = "
            SELECT 
                CASE
                    WHEN pet1 LIKE '{$pattern}' THEN 'pet1'
                    WHEN pet2 LIKE '{$pattern}' THEN 'pet2'
                    WHEN pet3 LIKE '{$pattern}' THEN 'pet3'
                END AS pet_column
            FROM other
            WHERE id = 1
            ";

            $result = game::$instance->DbQuery($sql);
            $row = $result->fetch_assoc();
            $pet_column = $row['pet_column'];

            //je recupere l'etat de la position du pet avant modif (pour savoir si c'est take ou steal)
            $detail_pet = game::$instance->getUniqueValueFromDB("SELECT $pet_column FROM other WHERE id=1");
            [,$position] = explode('_', $detail_pet);

            //je modifie l'etat de la position pet
            if ($pet_column !== null) {
                $newposition = $no_pet . '_' . $this->player_id;
                game::$instance->DbQuery("
                    UPDATE other 
                    SET {$pet_column} = '{$newposition}' 
                    WHERE id = 1
                ");
            }

            // je lances les notifs (take ou steal)
            if($position == 'table')
            {
                $txt = clienttranslate('${player_name} takes a pet');
                game::$instance->notify->all(
                "stealPet",
                $txt,
                [
                    'player_id' => $this->player_id,
                    'pet_id' => $varg2,
                ]
            );
            }

            else
            {
                $opponent_name = game::$instance->getUniqueValueFromDB("SELECT player_name FROM player WHERE player_id = '{$position}'");
                $opponent_color = game::$instance->getUniqueValueFromDB("SELECT player_color FROM player WHERE player_id = '{$position}'");
                $txt = clienttranslate('${player_name} steals a pet from ${opponent}');
                game::$instance->notify->all(
                "stealPet",
                $txt,
                [
                    'player_id' => $this->player_id,
                    'pet_id' => $varg2,
                    'opponent' =>    [
                        'log' => '<b style="color: #${color};">${opponent_name}</b>',
                        'args' => ['opponent_name' => $opponent_name, 'color' => $opponent_color]
                    ],
                ]
            );
            }

            //j'inc le compteur ghosts

            game::$instance->player_ghosts->inc($this->player_id, 1);
            $count_ghosts = game::$instance->player_ghosts->get($this->player_id);
            if ($count_ghosts == 5) {
                game::$instance->addPending($this->player_id, "EndGame");
            } else {
                game::$instance->addPendingFirst($this->player_id, "PlayerTurn");
            }

        }
        
    }





    ///////////////////////////////////////////////////////////////////////////////////////
    //FONCTION TRANSITOIRE POUR LA FIN DE PARTIE (tourne en boucle)
    ///////////////////////////////////////////////////////////////////////////////////////

    function argEndGame($parg1, $parg2)
    {
        $ret = [];
        $ret["selectable"] = [];
        $ret["selected"] = [];
        $ret['buttons'] = [];
        $ret["function"] = "PlayerTurn";
        $ret['title'] = clienttranslate('End of game');
        $ret['titleyou'] = clienttranslate('End of game');


        $ret['buttons'][] = 'yes_btn';


        return $ret;
    }



    function EndGame($parg1, $parg2, $varg1, $varg2, $varg3, $varg4)
    {
        game::$instance->addPending($this->player_id, "EndGame");
    }
}
