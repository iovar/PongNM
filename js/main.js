import { Game } from './pongnm.js';

var game={};

//in case it is there from a refresh or previous game that didn't end normally
sessionStorage.removeItem("playingPongNM");

//called when the game starts
function gameOver(){
    document.getElementById("start_game_button").innerHTML="Start game";
    game={};
    sessionStorage.removeItem("playingPongNM");

    const controls = document.querySelector(".controls");
    controls.style.display="block";
}

// get values from html, launch game
function startGame(){
    var player1 = (document.getElementById("player1").checked);
    var player2 = (document.getElementById("player2").checked);
    var pcLevel1=parseInt(document.getElementById("pc_level1").value);
    var pcLevel2=parseInt(document.getElementById("pc_level2").value);
    var maxScore=parseInt(document.getElementById("max_score").value);
    const controls = document.querySelector(".controls");
    controls.style.display="none";

    sessionStorage.setItem("playingPongNM",true);
    document.getElementById("start_game_button").innerHTML="Stop game";

    game = new Game(maxScore,gameOver);
    game.newGame(player1,player2);

    if(!(player1 && player2))
        game.AI[0].level=pcLevel1;
    if(!(player1 || player2))
        game.AI[1].level=pcLevel2;

    setTimeout(() => game.ball.start(), 1000);
}

document.getElementById("start_game_button").addEventListener("click", function(event){
    if(sessionStorage.getItem("playingPongNM")==="true"){
        document.getElementById("start_game_button").innerHTML="Start game";
        game.scene.stop();
        game.scene.clear();
        game={};
        sessionStorage.removeItem("playingPongNM");
    }
    else {
        startGame();
    }
});
