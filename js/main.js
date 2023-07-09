import { config } from './config.js';
import { Game } from './game.js';

/*
 * TODO
 * try to fix styling with eslint
 * fix PWA
 */

function* settingsValues() {
    const player1 = document.getElementById(config.player1Id);
    const player2 = document.getElementById(config.player2Id);
    const pcLevel1 = document.getElementById(config.pcLevel1Id);
    const pcLevel2 = document.getElementById(config.pcLevel2Id);
    const maxScore = document.getElementById(config.maxScoreId);

    let finished = false;
    while(!finished) {
        finished = yield {
            player1: player1.checked,
            player2: player2.checked,
            pcLevel1: pcLevel1.value,
            pcLevel2: pcLevel2.value,
            maxScore: maxScore.value,
        };
    }
}

function* settingsVisibility(show) {
    const controls = document.querySelector(".controls");
    let visible = show;

    while(true) {
        if (visible) {
            controls.classList.remove('hidden');
        } else {
            controls.classList.add('hidden');
        }

        visible = yield;
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
        game.AI[1].level = pcLevel2;
    }

    setTimeout(() => game.ball.start(), 1000);
}

function main() {
    const startButton = document.getElementById(config.startButtonId);
    startButton.addEventListener('click', () => startGame());
}

main();
