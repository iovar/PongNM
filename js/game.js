import { getDynamicConfig } from './config.js';
import { PongNMScene } from './scene.js';
import { AIPlayer } from './aiplayer.js';
import { BoxBall, BoxPaddle } from './box.js';

const { paddleStep, paddleOffset, paddleSpeed } = getDynamicConfig();

/*************************Start Game Class*************************************/
/*
 * This class holds the game data and maps the controls to the players.
 *
 * @param {int} score, first to reach this score wins
 * @param {Object} endGame, object that holds callback for when the game is over
 *                  the object must have a self and a callback attribute, the
 *                  first being the context and the sencond being the name of
 *                  the called method. If the self attribute is missing, the
 *                  endGame attribute is presumed to be not an object, but a
 *                  global method, so it is called directly.
 * @returns {Game}
 */
export function Game(score,endGame) {
    this.scene=new PongNMScene("mainCanvas",30,paddleOffset);
    this.scene.init();
    this.scene.addCallback(this,"keysFix");
    this.maxScore=score;

    this.players=new Array( new BoxPaddle(paddleStep*8,"left"),
                            new  BoxPaddle(paddleStep*8,"right"));
    this.ball = new BoxBall(Math.floor(paddleStep*2),Math.floor(paddleStep/2));
    this.ball.setGoalCallback(this,"goal");
    this.end=false;
    this.endGame=endGame;

    this.keycodeFix=new Array(0,0);
    this.keydownFix=new Array(0,0);
    this.human=new Array(false,false);
    this.AI = new Array();
    this.controls = new Array({"up":38,"down":40},{"up":87,"down":83} );
}

/*
 * Map controls to players, create AI players if needed and start
 * scene rendering
 *
 * @param {boolean} left, true if player is human, false if AI
 * @param {boolean} right, true if player is human, false if AI
 */
Game.prototype.newGame = function(left,right) {

    this.scene.clear();
    this.scene.addPrimitive(this.players[0]);
    this.scene.addPrimitive(this.players[1]);
    this.scene.addPrimitive(this.ball);
    this.scene.reset();
    this.human=new Array(left,right);

    if (left && right) {
        this.addPlayers(0,this.controls[1]);
        this.addPlayers(1,this.controls[0]);
    }
    else if (left) {
        this.AI.push(new AIPlayer(this.scene,this.players[1],this.ball));
        this.addPlayers(0,this.controls[0]);
    }
    else if (right) {
        this.AI.push(new AIPlayer(this.scene,this.players[0],this.ball));
        this.addPlayers(1,this.controls[0]);
    }
    else {
        this.AI.push(
            new AIPlayer(this.scene,this.players[0],this.ball),
            new AIPlayer(this.scene,this.players[1],this.ball)
        );
    }

    for (let i=0;i<this.AI.length;i++) {
        this.scene.addCallback(this.AI[i],"makeMove");
    }
    this.scene.start();
};

/*
 *  When a key is pressed, it fires an event, then does nothing for a while,
 *  then fires repeated events. This translates into movement stopping right
 *  after it begun for a moment, which is bad for the gameplay. So this method
 *  acts as if the pressed key keeps firing events for a while. The reason the
 *  movement isn't tied up to the first keydown and stop isn't mapped to the
 *  first keyup, is to achieve a smoother speedup and slowdown and to avoid
 *  missed keyups that can make the paddle get stuck moving towards one side.
 *
 */
Game.prototype.keysFix = function() {

    for (let i=0;i<this.players.length;i++) {

        if (this.human[i]) {
            if (this.keydownFix[i]>0) {
                this.players[i].moveUp();
                this.keydownFix[i]--;
            }
            else if (this.keydownFix[i]<0) {
                this.players[i].moveDown();
                this.keydownFix[i]++;
            }
        }
    }
};

/*
 * Map players to their controls.
 * If both players are human, left gets 'w' for up 's' for down,
 * while right gets up and down arrows
 * If one player is human, the arrows are used,regardless of side.
 *
 * @param {int} player, player number [0,1]
 * @param {object} controls, controls object with up and down attributes
*/
Game.prototype.addPlayers = function(player,controls) {

    var that=this;
    window.addEventListener("keydown", function(event) {

        const kcode=((event.charCode)?(event.charCode):(event.keyCode));

        if (kcode===controls.up) {
            that.players[player].moveUp();
            that.keydownFix[player]=50;
            event.preventDefault();

        }
        else if (kcode===controls.down) {
            that.players[player].moveDown() ;
            that.keydownFix[player]=-50;
            event.preventDefault();

        }
        that.keycodeFix[player]=kcode;
    });

    window.addEventListener("keyup", function(event) {
        const kcode=((event.charCode)?(event.charCode):(event.keyCode));

        if (kcode===that.keycodeFix[player]) {
            that.keycodeFix[player]=0;
            that.keydownFix[player]=0;
            event.preventDefault();
        }
        event.preventDefault();
    });
};

/*
 * This is added as a callback in BoxBall. When there is a goal, the score
 * changes and there is a reset and a small pause before the game resumes.
 * If the goal is a winning one, the game stops and an appropriate message
 * appears.
 *
 * @param {int} who, [0,1] array index of player that scored.
 */
Game.prototype.goal = function(who) {

    this.scene.score[who]++;
    var self=this;

    if (this.scene.score[who]>=this.maxScore) {
        this.scene.stop();
        this.scene.clear();
//        console.log("final score : Level ",this.AI[0].level,": ", this.scene.score[0],". Level ",this.AI[1].level,": ", this.scene.score[1]);
        this.scene.score[0]="Player "+(who+1);
        while(this.scene.context.measureText(this.scene.score[0]).width > (this.scene.width/2 - 2*paddleOffset)
              && (this.scene.fontSize>0)) {
            this.scene.fontSize--;
            this.scene.context.font = "bold "+this.scene.fontSize+
            "px 'Share Tech Mono','monospace'";
        }
        this.scene.score[1]="wins!!! ";
        this.end=true;
        this.scene.redraw();
        if (this.endGame) {
            if (this.endGame.self)
                this.endGame.self[this.endGame.callback]();
            else
                this.endGame();
        }

    }
    else {
        this.scene.reset();
        this.ball.stop();
        setTimeout(function() {
            if (!self["end"])
                self["ball"].start();
        },1000);
    }

};

/*************************End Game Class*************************************/


