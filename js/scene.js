import { config, getDynamicConfig } from './config.js';

const { paddleStep, paddleOffset, paddleSpeed } = getDynamicConfig();

class Scene {
    constructor(elemid, refresh) {
        this.elemid = elemid;
        this.valid = true;
        this.refresh = refresh ? refresh : 0;
        this.redrawMutex = false;
    }

    start() {
        if (this.refresh > 0) {
            this.stop();
            var self = this;
            this.timerid = window.setInterval(
                function () {
                    self["redraw"]();
                }, this.refresh);
        }
    }

    stop() {
        if (this.timerid)
            window.clearInterval(this.timerid);
    }

    redraw() {
        this.redrawMutex = true;
        var context = this.context;

        context.fillStyle = config.background;
        context.strokeStyle = config.foreground;

        context.fillRect(0, 0, this.width, this.height);


        for (var i = 0; i < this.callbacks.length; i++) {
            this.callbacks[i].self[this.callbacks[i].callback]();
        }

        for (var i = 0; i < this.queue.length; i++) {
            this.queue[i].draw(context);
        }

        this.redrawMutex = false;
    }

    add(callback) {
        this.queue.push(callback);
    }

    remove(callback) {
        var index = this.queue.indexOf(callback);
        if (index > -1) {
            this.queue.splice(index, 1);
        }
    }

    addCallback(self, callback) {
        this.callbacks.push({ "self": self, "callback": callback });
    }

    reset() {
        for (var i = 0; i < this.queue.length; i++) {
            this.queue[i]["reset"](this.width, this.height);
        }
    }

    videoInit() {
        this.drawing = document.getElementById(this.elemid);
        if (!this.drawing.getContext)
            this.valid = false;
        else
            this.context = this.drawing.getContext("2d");
    }

    init() {
        this.videoInit();
        if (this.valid) {
            this.width = this.drawing.width;
            this.height = this.drawing.height;

            this.queue = new Array();
            this.callbacks = new Array();
            this.redraw();

        }
    }

    addPrimitive(primitive) {
        this.queue.push(primitive);

        this.queue.sort(function (a, b) {
            return ((a.z <= b.z) ? -1 : 1);
        });
    }

    clear() {
        if (this.redrawMutex) {
            var self = this;
            window.setTimeout(function () {
                self["clear"];
            }, this.refresh);
        }
        else {
            this.queue.length = 0;
        }
    }
}


/****************************Start PongNMScene Class***************************/
/*
 * Scene that is adjusted to this particular game. It paints scores and a line
 * in the middle. Also it calls the correct collision functions.
 *
 * See Scene documentation for more
 *
 *
 * @param {string} elemid
 * @param {inbt} refresh
 * @param {string} backgroundColor
 * @param {string} foregroundColor
 * @param {int} lineWidth
 * @returns {PongNMScene}
 */
export class PongNMScene extends Scene {
    constructor(elemid,refresh,backgroundColor,foregroundColor,lineWidth){
        super(elemid,refresh,backgroundColor,foregroundColor);

        this.lineWidth=lineWidth;
        this.score= new Array(0,0);
        this.fontSize=5*paddleOffset;
    }

    init(){
        Scene.prototype.init.call(this,"init");
        this.context.font = "bold "+this.fontSize+
                "px 'Share Tech Mono','monospace'";

        this.redraw();
    }

    redraw(){
        this.redrawMutex=true;
        var context=this.context;

        context.fillStyle = config.background;
        context.strokeStyle = config.foreground;
        context.lineWidth=this.lineWidth;

        context.fillRect(0,0,this.width,this.height);


        /* Text */
        context.fillStyle = config.foreground;
        context.textBaseline = "top";


        var offs_x=this.width/2;

        context.textAlign = "right";
        context.fillText(this.score[0], offs_x - 2*paddleOffset, 0);
        context.textAlign = "left";
        context.fillText(this.score[1], offs_x + 2*paddleOffset, 0);


        context.fillStyle = config.background;


        var offs_y=0;

        context.beginPath();
        while(offs_y<this.height){
            context.moveTo(offs_x,offs_y);
            context.lineTo(offs_x,offs_y+paddleOffset);
            offs_y+=2*paddleOffset;
        }
        context.stroke();

        for(var i=0;i<this.callbacks.length;i++){
            this.callbacks[i].self[this.callbacks[i].callback]();
        }

        for(var i=0;i<this.queue.length;i++){

            this.queue[i]["slide"]();
            if(this.queue[i]["collideBoundaries"])
                this.queue[i]["collideBoundaries"](this.width,this.height);

            this.queue[i]["draw"](context);
            if(this.queue[i]["collidePrimitive"]){
                for(var k=0;k<this.queue.length;k++){
                    if(!this.queue[k]["collidePrimitive"] || k>i){//only collide with remaining items
                        this.queue[i]["collidePrimitive"](this.queue[k]);
                    }
                }
            }
        }
        this.redrawMutex=false;
    }

    clear(){
        if(this.redrawMutex){
            var self=this;
            window.setTimeout(function(){
                self["clear"];
            }, this.refresh);
        }
        else{
            this.queue.length=0;
            this.score[0] = this.score[1] = 0;
        }
    }
}
