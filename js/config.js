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
};
