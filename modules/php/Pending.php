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

        $txt = clienttranslate('${player_name} ${dice1} and ${dice2}');
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

       

        
        game::$instance->addPending($this->player_id, "ChooseAction", $rand_dice1, $rand_dice2);
        
        
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

        $addition = $parg1 + $parg2;

        $ret["selectable"][] = 'table_building_card_'.$parg1;
        if($parg1 != $parg2)
        {
            $ret["selectable"][] = 'table_building_card_'.$parg2;
        }
        $ret["selectable"][] = 'table_building_card_'.$addition;
       
        $ret['buttons'][] = 'take_card_btn';
       
    
        return $ret;
    }



    function ChooseAction($parg1, $parg2, $varg1, $varg2, $varg3, $varg4)
    {
        
        if($varg2 == '')
        {
            game::$instance->addPending($this->player_id, "ChooseAction", $parg1, $parg2);
        }

        else
        {
            
            //on recupree le numero du deck
            [, , , $no_deck] = explode('_', $varg2);
            $deck = 'deck'.$no_deck;

            //on pick la carte et on recupere les info du pickcard (pour la card_id)
            $card_pick = game::$instance->building_DB->pickCardForLocation( $deck, 'house', $this->player_id);

            //on met a jour sa position
            $count_card = count(game::$instance->getObjectListFromDB( "SELECT card_id id FROM building WHERE card_type = '{$no_deck}' AND card_location = 'house' AND card_location_arg = '{$this->player_id}'", true ));
            game::$instance->DbQuery("UPDATE building set position = $count_card WHERE card_id ='{$card_pick['id']}'");

            //on recupere les info pour le front
            $card =  game::$instance->getObjectFromDB( "SELECT card_type type, card_location_arg location_arg, position position FROM building WHERE card_id ='{$card_pick['id']}'" );


            $txt = clienttranslate('${player_name} take card ${no_card}');
                game::$instance->notify->all(
                    "takeCard",
                    $txt,
                    [
                        'player_id' => $this->player_id,
                        'no_card' => $no_deck,
                        'card' => $card,
                    ]
                );
        
        game::$instance->addPendingFirst($this->player_id, "PlayerTurn");

        }
        
    }



}
