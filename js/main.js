import { Game } from './pongnm.js';

const START_BUTTON_ID = "start_game_button";
const PLAYER1_ID = "player1";
const PLAYER2_ID = "player2";
const PC_LEVEL1_ID = "pc_level1";
const PC_LEVEL2_ID = "pc_level2";
const MAX_SCORE_ID = "max_score";
const CONTROLS_ID = "controls";

function* settingsValues() {
    const player1 = document.getElementById(PLAYER1_ID);
    const player2 = document.getElementById(PLAYER2_ID);
    const pcLevel1 = document.getElementById(PC_LEVEL1_ID);
    const pcLevel2 = document.getElementById(PC_LEVEL2_ID);
    const maxScore = document.getElementById(MAX_SCORE_ID);

    let finished = false;
    while(!finished) {
        const finished = yield {
            player1: player1.checked,
            player2: player2.checked,
            pcLevel1: pcLevel1.value,
            pcLevel2: pcLevel2.value,
            maxScore: maxScore.value,
        };
    }
};

function* settingsVisibility(show) {
    const controls = document.querySelector(".controls");
    let visible = show;

    while(true) {
        if (visible) {
            controls.classList.remove('hidden');
        } else {
            controls.classList.add('hidden');
        }

        visibl = yield;
    }
}

function startGame(){
    const values = settingsValues();
    const visibility = settingsVisibility();

    const {
        player1,
        player2,
        pcLevel1,
        pcLevel2,
        maxScore,
    } = values.next().value;

    const game = new Game(
        maxScore,
        () => visibility.next(true)
    );

    visibility.next(false);
    game.newGame(player1, player2);

    if(!(player1 && player2)) {
        game.AI[0].level = pcLevel1;
    }
    if(!(player1 || player2)) {
        game.AI[1].level=  pcLevel2;
    }

    setTimeout(() => game.ball.start(), 1000);
}

function main() {
    const startButton = document.getElementById(START_BUTTON_ID);
    startButton.addEventListener('click', () => startGame());
}

main();
