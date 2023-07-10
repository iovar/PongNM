import { config, getDynamicConfig } from './config.js';

const { paddleStep, paddleOffset, paddleSpeed } = getDynamicConfig();

class Scene {
    constructor() {}

    start() {
            this.stop();
            this.timerid = window.setInterval(
                () => this.redraw(),
                config.refreshInterval
            );
    }

    stop() {
        if (this.timerid) {
            window.clearInterval(this.timerid);
            this.timerid = null;
        }
    }

    remove(callback) {
        const index = this.queue.indexOf(callback);
        if (index > -1) {
            this.queue.splice(index, 1);
        }
    }

    addCallback(callback) {
        this.callbacks.push(callback);
    }

    reset() {
        for (let i = 0; i < this.queue.length; i++) {
            this.queue[i]["reset"](this.width, this.height);
        }
    }

    addPrimitive(primitive) {
        this.queue.push(primitive);

        this.queue.sort(function (a, b) {
            return ((a.z <= b.z) ? -1 : 1);
        });
    }
}


/*
 * Scene that is adjusted to this particular game. It paints scores and a line
 * in the middle. Also it calls the correct collision functions.
 */
export class PongNMScene extends Scene {
    constructor() {
        super();

        this.score= new Array(0,0);
        this.fontSize=5*paddleOffset;
    }

    videoInit() {
        this.drawing = document.getElementById(config.canvasId);
        this.context = this.drawing.getContext("2d");
        this.width = this.drawing.width;
        this.height = this.drawing.height;
    }

    init() {
        this.videoInit();

        this.queue = [];
        this.callbacks = [];
        this.context.font = "bold "+this.fontSize+
                "px 'Share Tech Mono','monospace'";

        this.redraw();
    }

    redraw() {
        const context=this.context;

        context.fillStyle = config.background;
        context.strokeStyle = config.foreground;
        context.lineWidth= paddleOffset;

        context.fillRect(0,0,this.width,this.height);


        /* Text */
        context.fillStyle = config.foreground;
        context.textBaseline = "top";


        let offs_x=this.width/2;

        context.textAlign = "right";
        context.fillText(this.score[0], offs_x - 2*paddleOffset, 0);
        context.textAlign = "left";
        context.fillText(this.score[1], offs_x + 2*paddleOffset, 0);


        context.fillStyle = config.background;


        let offs_y=0;

        context.beginPath();
        while(offs_y<this.height) {
            context.moveTo(offs_x,offs_y);
            context.lineTo(offs_x,offs_y+paddleOffset);
            offs_y+=2*paddleOffset;
        }
        context.stroke();

        for (let i=0;i<this.callbacks.length;i++) {
            this.callbacks[i]();
        }

        for (let i=0;i<this.queue.length;i++) {
            const l = this.queue.length;
            this.queue[i]["slide"]();
            if (this.queue[i]["collideBoundaries"])
                this.queue[i]["collideBoundaries"](this.width,this.height);

            if (this.queue.length!=l) {
                console.trace("Scene.queue changed during iteration");
            }
            this.queue[i]["draw"](context);
            if (this.queue[i]["collidePrimitive"]) {
                for (let k=0;k<this.queue.length;k++) {
                    if (!this.queue[k]["collidePrimitive"] || k>i) {//only collide with remaining items
                        this.queue[i]["collidePrimitive"](this.queue[k]);
                    }
                }
            }
        }
    }

    clear() {
        this.queue.length=0;
        this.score[0] = this.score[1] = 0;
    }
}
