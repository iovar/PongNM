const MAIN_CANVAS_ID = "mainCanvas";
const STEP_FACTOR = 50;

export function getDynamicConfig() {
    const mainCanvas = document.getElementById(MAIN_CANVAS_ID);
    const paddleStep = Math.floor(mainCanvas.width / STEP_FACTOR);

    return {
        paddleStep,
        paddleOffset: paddleStep,
        paddleSpeed: 2 * paddleStep,
    };
}

export const config = {
    background: "#000000",
    foreground: "#FFFFFF",
    startButtonId: "start_game_button",
    player1Id: "player1",
    player2Id: "player2",
    pcLevel1Id: "pc_level1",
    pcLevel2Id: "pc_level2",
    maxScoreId: "max_score",
    settingsContainerId: "settings-container",
    canvasId: "mainCanvas",
    refreshInterval: 30,
};
