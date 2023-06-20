import { getDynamicConfig } from './config.js';
import { PongNMScene } from './scene.js';

const { paddleStep, paddleOffset, paddleSpeed } = getDynamicConfig();

export class AIPlayer {
    /*
     * @param {PongNMScene} scene
     * @param {BoxPaddle} paddle
     * @param {BoxBall} ball
     * @param {int} level, 0,1 or 2
     */
    constructor(scene, paddle, ball, level) {
        this.paddle = paddle;
        this.ball = ball;
        this.scene = scene;
        this.level = ((level)?level:2);
    }

    makeMove() {
        let height = this.scene.height;
        let paddleCenter = this.paddle.y+this.paddle.height/2;
        let ballCenter = this.ball.y+this.ball.height/2;
        let ballDistance =  Math.abs(this.ball.x - this.paddle.x);

        if ((this.paddle.side == "left" && this.ball.speedx>0) ||
            (this.paddle.side == "right" && this.ball.speedx<0) ) { //move to middle
            if (Math.abs(paddleCenter - height/2) > paddleStep) { //prevent wiggling
                if (this.level<=1)
                    return;

                if (paddleCenter >height/2)
                    this.paddle.moveUp();
                else
                    this.paddle.moveDown();
            }
        } else if ((Math.abs(paddleCenter - ballCenter) > ballDistance
            && ballDistance < 2 *Math.abs(paddleCenter -ballCenter)  )
            || (this.level>=3 && Math.abs(paddleCenter - ballCenter)>Math.abs(this.ball.speedy) )
        ) {
            if (paddleCenter >ballCenter)
                this.paddle.moveUp();
            else
                this.paddle.moveDown();
        }
    }
}
