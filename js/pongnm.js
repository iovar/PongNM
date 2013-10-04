/*
 *  Currently used global variables:
 *  
 *  
 *  paddleStep: how much the paddle(or any box minus the Ball) goes up and down
 *  also used for the size of the paddle and the precision of the movement  of 
 *  the AI players paddle.
 *  paddleOffset: minimum distance of a paddle from the scene edges, also used 
 *  for the rendering of the middle line and the text, in PongNMScene
 *  paddleSpeed: adds motion towards a direction to the Box. This motion is 
 *  applied gradually, by adding paddleStep to the location and removing that 
 *  much from paddleSpeed, until it is zero.
 */


var paddleStep=Math.floor(document.getElementById("drawing").width/50);
var paddleSpeed=2*paddleStep;
var paddleOffset = paddleStep;

/*****************************End Global Variables*****************************/

/****************************Start Scene Class*********************************/
/*
 *  Scene Class handles rendering, positioning and calling any specified 
 *  functions that must run on every loop.
 *  
 * @param {string} elemid , id of DOM element that is out canvas
 * @param {int} refresh, msecs between calls to redraw. 1000/refresh= framerate
 * @param {string} backgroundColor, optional, background color , default black
 * @param {string} foregroundColor, optional, foreground color , default white
 * @returns {Scene}
 */
function Scene(elemid,refresh,  backgroundColor, foregroundColor) {
    
    this.__elemid__=elemid;
    this.valid=true;
    this.backgroundColor=(backgroundColor)?backgroundColor:"#fff";
    this.foregroundColor=(foregroundColor)?foregroundColor:"#000";
    this.__refresh__=((refresh)?refresh:0);
    this.redrawMutex=false;
}

/*  
 * Start the rendering and processing loop of the scene
 * 
 */
Scene.prototype.start = function(){
    if(this.__refresh__>0){
        this.stop();
        var self=this;
        this.__timerid__=window.setInterval(
            function(){
                self["redraw"]();
            },this.__refresh__);
    }
};

/*
 *  Stop scene loop
 */
Scene.prototype.stop = function(){
    if(this.__timerid__)
        window.clearInterval(this.__timerid__);      
};

/*  
 *  Basic loop of the Scene
 *  Paints objects on the scene and calls any functions on the 
 *  callback functions queue. ALso calls the collideBoundaries fucntion
 *  for those objects that have it (object to containing box collision check).
 *  
 *  The redrawMutex: when a game is finished, the function clear is called
 *  that empties the queue with the drawable items. It also stops the timer
 *  that calls redraw(this function). But, because the timer works 
 *  asynchronously, the redraw() function may already be running when clear() 
 *  is called, which causes Undefined references errors on accessing the queue.
 *  To prevent this we set a simple mutex (a flag really), that prevents clear() 
 *  from running.
 *  
 */
Scene.prototype.redraw = function(){
    this.redrawMutex=true;
    var context=this.context;

    context.fillStyle = this.backgroundColor;
    context.strokeStyle = this.foregroundColor;

    context.fillRect(0,0,this.width,this.height);


    for(var i=0;i<this.callbacks.length;i++){
        this.callbacks[i].self[this.callbacks[i].callback]();
    }

    for(var i=0;i<this.queue.length;i++){
        if(this.queue[i]["collideBoundaries"])
            this.queue[i]["collideBoundaries"](this.width,this.height);
        this.queue[i]["draw"](context);
    }
    this.redrawMutex=false;

};

/* add functions that will be executed at every redraw loop, before the 
 * rendering of the items on the scene. The functions are called array-style,
 * i.e. object_reference["method_name"]. This is the easiest way to call them 
 * with the right context for 'this' , without passing it as a separate 
 * argument in the function (which would mess up it's code)
 * 
 * @param {Object} self, pointer to the object that will have its method called
 * @param {String} callback, name of the method
  */
Scene.prototype.addCallback = function(self,callback) {
    this.callbacks.push({"self":self,"callback":callback});
};

/*
 *  Place all items on their resetting position, by calling their reset method
 */
Scene.prototype.reset = function(){
    for(var i=0;i<this.queue.length;i++){
        this.queue[i]["reset"](this.width,this.height);
    }
};

/*
 * get the drawing context from the Canvas
 */
Scene.prototype.__videoInit__ = function(){
    
    this.__drawing__=document.getElementById(this.__elemid__);
    if(!this.__drawing__.getContext)
        this.valid=false;
    else
        this.context=this.__drawing__.getContext("2d");

};


/*
 *  Initialize scene. 
 */
Scene.prototype.init = function(){
    this.__videoInit__();
    if(this.valid){
        this.width = this.__drawing__.width;
        this.height = this.__drawing__.height;

        this.queue = new Array();
        this.callbacks = new Array();
        this.redraw();

    }
};

/*
 * Add objects,(child classes of Primitive) in the scene.
 * 
 * @param {Primitve} primitive that gets added for rendering
 */
Scene.prototype.addPrimitive = function(primitive){
    this.queue.push(primitive);

    this.queue.sort(function(a,b) {
        return ((a.z<=b.z)?-1:1);
    });
};

/*
 *  Clear scene, if it isn't currently drawing, or reschedule for later if 
 *  it is. 
 *  
 *  To really function as a mutex, redrawMutex should be locked by 
 *  this function, preventing redraw() from working, while clear() works.
 *  It isn't needed here, because stop(), is always called before clear, 
 *  so as soon as redraw exits, it doesn't happen again. In a more generic 
 *  scenario, clear() will need to properly lock the Mutex, too, to prevent 
 *  any race conditions.
 */
Scene.prototype.clear = function(){
    if(this.redrawMutex){
        var self=this;
        window.setTimeout(function(){
            self["clear"];
        }, this.__refresh__);
    }
    else{
        this.queue.length=0;
    }
};
/****************************End Scene Class***********************************/


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
function PongNMScene(elemid,refresh,backgroundColor,foregroundColor,lineWidth){
    Scene.call(this,elemid,refresh,backgroundColor,foregroundColor);
    
    this.lineWidth=lineWidth;
    this.score= new Array(0,0);
    this.fontSize=5*paddleOffset;
}

PongNMScene.prototype=new Scene();

/*
 *  Intialize the scene and the text that is used on it.
 */
PongNMScene.prototype.init = function (){

    Scene.prototype.init.call(this,"init");
    this.context.font = "bold "+this.fontSize+
            "px 'Share Tech Mono','monospace'";
    
    this.redraw();

};

/*  
 *  Basic loop of the PongNMScene. Does what Scene.redraw() does, plus paints 
 *  middle line and score text. It also calls oject to object collision 
 *  fucnctions.
 *  
 *  See Scene documentation for more
 */
PongNMScene.prototype.redraw = function(){
    this.redrawMutex=true;
    var context=this.context;

    context.fillStyle = this.backgroundColor;
    context.strokeStyle = this.foregroundColor;
    context.lineWidth=this.lineWidth;
    
    context.fillRect(0,0,this.width,this.height);

    
    /* Text */
    context.fillStyle = this.foregroundColor;
    context.textBaseline = "top";
    
    
    var offs_x=this.width/2;

    context.textAlign = "right";
    context.fillText(this.score[0], offs_x - 2*paddleOffset, 0);
    context.textAlign = "left";
    context.fillText(this.score[1], offs_x + 2*paddleOffset, 0);
    
    
    context.fillStyle = this.backgroundColor;


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
};
/*
 *  Clear scene and the scores. 
 *  See Scene.clear() for more
 */
PongNMScene.prototype.clear = function(){
    if(this.redrawMutex){
        var self=this;
        window.setTimeout(function(){
            self["clear"];
        }, this.__refresh__);
    }
    else{
        this.queue.length=0;
        this.score[0] = this.score[1] = 0;
    }
};
/****************************End PongNMScene Class*****************************/


/****************************Start Primitive Class*****************************/
/*
 * 
 * @param {string} shape. box, ball etc
 * @param {int} x
 * @param {int} y
 * @param {int} z   Draw order. Higher z is drawn last and is visible in a stack
 * @param {string} color. Color of the object, in html notation    
 * @returns {Primitive} 
 */
function Primitive(shape,x,y,z,color){

    this.shape=shape;
    this.x=x;
    this.y=y;
    this.z=z;
    this.angle=0;
    this.color=color;
    this.speedx=0;
    this.speedy=0;

}

/*
 *  The slide function is called in every frame and it applies the speed 
 *  to the position. There is a slowdown by default. So if speed is applied to 
 *  and object, it fades after a while. paddleStep is a global for now.
 */
Primitive.prototype.slide = function() {

    if(this.speedx<0 ){
        this.x-=paddleStep;
        this.speedx+=paddleStep;
    }
    else if(this.speedx>0){
        this.x+=paddleStep;
        this.speedx-=paddleStep;
    }
    if(this.speedy<0){
        this.y-=paddleStep;
        this.speedy+=paddleStep;
    }
    else if(this.speedy>0){
        this.y+=paddleStep;
        this.speedy-=paddleStep;
    }
};

/* 
 * Draw a primitve on the correct position. We move the scene, not the object,
 * so the context has to be saved and restored, or next objects will appear 
 * in wrong positions. This function doesn't draw anything. It calls the 
 * child functions __drawShape__ that will do the actual drawing
 *  
 * @param {canvas 2d context} context, to draw in
 */
Primitive.prototype.draw = function(context) {

    context.save();
    context.fillStyle= this.color;
    context.translate(this.x,this.y);
    context.rotate(this.angle);
    
    this.__drawShape__(context);
    
    context.restore();
};


/*  Move to x,y
 * 
 * @param {int} x
 * @param {int} y
 */
Primitive.prototype.move = function(x,y){
    this.x=x;
    this.y=y;
};
/*
 * Apply rotation, center is top left corner of object by default
 * 
 * @param {type} angle
  */
Primitive.prototype.rotate = function(angle){
    this.angle=angle;
};

/*  With this method, an object changes it's speed based on it's current one
 *  This function is useful for immediate change of direction and more
 *  acceleration when the object has a low speed. Currently it's used only 
 *  for the paddles but it could be usefull elsewhere.
 * 
 * @param {type} current, current speed
 * @param {type} added, speed to add
 * @returns {Number}    new speed
 */
Primitive.prototype.speedup = function(current,added){
    if(current==0 || (current*added<0)){
        return added;
    }
    else if(Math.abs(current)<2*Math.abs(added))
        return current+added;
    else if(Math.abs(current)<4*Math.abs(added))
        return current;
    else
        return 0;
};

/*
 * Chenge speed of object. TODO change name, since BoxBall ovewrites the method 
 * with and attribute of the same name, which can be confusing.
 * 
 * @param {object} spo, object with x and/or y properties, to apply to speedup
  */
Primitive.prototype.speed = function(spo){
    if(spo.x) this.speedx=this.speedup(this.speedx,spo.x);
    if(spo.y) this.speedy=this.speedup(this.speedy,spo.y);
};

/*
 * Reset for simple primitive puts the object at (0,0)
 *  
 * @param {type} width
 * @param {type} height
 */
Primitive.prototype.reset =function(width,height){
    this.x=0;
    this.y=0;
};

/*****************************End Primitive Class******************************/


/********************Start BoxPrimitive Class**********************************/
/*
 * BoxPrimitive, see Primitive for more. A primitive with set width and height.
 * 
 * @param {type} x
 * @param {type} y
 * @param {type} w, width new attribute in this object
 * @param {type} h, height new attribute in this object
 * @param {type} z
 * @param {type} color
 * @returns {BoxPrimitive}
 */
function BoxPrimitive(x,y,w,h,z,color){
    
    Primitive.call(this,"box",x,y,z,color);
    this.width=w;
    this.height=h;
   
}

BoxPrimitive.prototype = new Primitive();

/*
 * Draw a rectangle in Canvas
 * See Primitve.draw()
 * 
 * @param {type} context
 * @returns {undefined}
 */
BoxPrimitive.prototype.__drawShape__ = function(context){
    context.fillRect(0,0,this.width,this.height);
};

/**********************End BoxPrimitive Class**********************************/


/************************Start BoxColliding Class******************************/
/*
 * A box tha cannot leave the Scene. 
 * see BoxPrimitive and Primitive  for more
 * 
 * @param {type} x
 * @param {type} y
 * @param {type} w
 * @param {type} h
 * @param {type} z
 * @param {type} color
 * @returns {BoxColliding}
 */
function BoxColliding(x,y,w,h,z,color){
    
    BoxPrimitive.call(this,x,y,w,h,z,color);

}

BoxColliding.prototype = new BoxPrimitive();

/*
 *  Do not allow the box to go within a certain distance of the edges.
 *  paddleOffset is a global. Colliding triggers on less than the allowed 
 *  distance, so there is a bouncing effect on the edges.
 *  
 * @param {type} width
 * @param {type} height
 */
BoxColliding.prototype.collideBoundaries = function(width,height){
    
    if(this.width+this.x+paddleOffset > width+paddleOffset/2){
        this.x=width-this.width-paddleOffset;
        this.speedx=0;
    }
    else if(this.x<paddleOffset/2){
        this.x=paddleOffset;
        this.speedx=0;
    }
    
    if(this.height+this.y+paddleOffset > height+paddleOffset/2){
        this.y=height-this.height-paddleOffset;
        this.speedy=0;   
    }
    else if(this.y<paddleOffset/2){
        this.y=paddleOffset;
        this.speedy=0;
    }            
};


/************************End BoxColliding Class********************************/


/*************************Start BoxPaddle Class********************************/
/*
 * 
 * @param {int} size , long side (height) of the paddle, 
 *                      it's width being 1/4 of this
 * @param {string} side, left or right
 * @param {type} color, optional, white by default
 * @returns {BoxPaddle}
 * 
 */
function BoxPaddle(size,side,color){
    
    BoxColliding.call(this,0,0,size/4,size,0,((color)?color:"#fff"));
    this.side=side;
    
};

BoxPaddle.prototype = new BoxColliding();

/*  Return position and size information of the curent BoxPaddle
 *  
 * @returns {Object} x,y,width,height of object
 */
BoxPaddle.prototype.box = function() {
    return {"x":this.x,"y":this.y,"width":this.width,"height":this.height};
};

/*
 * Move paddle Up
 */
BoxPaddle.prototype.moveUp = function(){
    this.speed({"y":-paddleSpeed});
};

/*
 * Move paddle Down
 */
BoxPaddle.prototype.moveDown = function(){
    this.speed({"y":paddleSpeed});
};

/*
 * Rest paddles, based on their side
 * 
 * @param {type} width, width of scene
 * @param {type} height, height of scene
 * @returns {undefined}
 */
BoxPaddle.prototype.reset =function(width,height){
  
    if(this.side=="left"){
        this.x=paddleOffset;
        this.y=(height-this.height)/2;
    }
    else if(this.side=="right"){
        this.x=(width-this.width)-paddleOffset;
        this.y=(height-this.height)/2;
    }
};

/***********************End BoxPaddle Class************************************/


/*************************Start BoxBall Class**********************************/
/*  BoxBall is the square "ball" of the game
 * 
 * @param {type} size, width and height of ball
 * @param {type} speed, base speed
 * @param {type} color
 * @returns {BoxBall}
 */
function BoxBall(size,speed,color){
    this.speed=speed;
    BoxColliding.call(this,0,0,size,size,1,((color)?color:"#fff"));
    this.stopped=true;
    this.lastHit="none";

}

BoxBall.prototype= new BoxColliding();

/*
 * Hold the ball into position. speed and direction information isn't lost 
 *
 */
BoxBall.prototype.stop = function(){
    this.stopped=true;
};

/*
 * Let the ball roll!
 */
BoxBall.prototype.start= function(){
    this.stopped=false;
};

/*
 * Reset ball in the middle of the scene
 * 
 * @param {type} width , width of the scene
 * @param {type} height, height of the scene
 */
BoxBall.prototype.reset =function(width,height){
        this.x=(width-this.width)/2;
        this.y=(height-this.height)/2;
        this.speedx=(2*Math.round(Math.random())-1)*this.speed;
        this.speedy=(2*Math.round(Math.random())-1)*this.speed;
        this.lastHit="none";
};

/*
 *  Move ball to new position,based on speed, if it isn't stoppped
 */
BoxBall.prototype.slide = function() {
    if(!this.stopped)
        this.move(this.x+this.speedx,this.y+this.speedy);
};

/*
 * Collide the ball to the boundaries. Unlike other Boxes, the ball, doesn't 
 * stop and it doesn't have an offset to the boundary. It goes right untill the 
 * edge and when it hits, it changes direction.
 * 
 * Also, this method calls the goal callback function, if the ball hits 
 * on a left or right side.
 * 
 * @param {type} width
 * @param {type} height
 */
BoxBall.prototype.collideBoundaries = function(width,height){
    
    if(this.width+this.x >= width){
        if(this.__goalCallback__){
            this.__goalCallback__.self[this.__goalCallback__.callback](0);
        }
            
        this.speedx=-Math.abs(this.speedx);
    }
    else if(this.x<=0){
        if(this.__goalCallback__)
            this.__goalCallback__.self[this.__goalCallback__.callback](1);
        this.speedx=Math.abs(this.speedx);
    }
    
    if(this.height+this.y>= height){
        this.speedy=-Math.abs(this.speedy);   
    }
    else if(this.y<=0){
        this.speedy=Math.abs(this.speedy);   
    }         

};

/*
 * Check if the ball hits a Box object (a paddle) and change direction 
 * if it does, taking into account the speed of that object.
 * 
 * @param {type} box, Box that is checked against the ball
 */
BoxBall.prototype.collideBox = function (box){
    var x1=this.x,y1=this.y,w1=this.width,h1=this.height,
        x2=box.x,y2=box.y,w2=box.width,h2=box.height;
    var left=false,right=false,top=false,bottom=false, vert=false,horiz=false;  //left - right  , up - down

    if(x1>=x2 && x1<=x2+w2 && x1+w1> x2+w2 )   
        left=true; //left
    else if(x1+w1>=x2 && x1+w1<=x2+w2 && x1 < x2)
        right=true; //right
    else if(x1>=x2 && x1+w1<= x2+w2 ){
        if((x1-x2)<(x2+w2-x1-w1))
            right=true;
        else if((x1-x2)<(x2+w2-x1-w1))
            left=true;
        else
            vert=true;
    }
    else if(x1<=x2 && x1+w1>= x2+w2){   
        if((x2-x1)<(x1+w1-x2-w2))
            left=true;
        else if((x2-x1)>(x1+w1-x2-w2))
            right=true;
        else
            vert=true;
    }
    
    if(y1>=y2 && y1<=y2+h2 && y1+h1> y2+h2 )   
        top=true; //top
    else if(y1+h1>=y2 && y1+h1<=y2+h2 && y1 < y2)
        bottom=true; //bottom
    else if(y1>=y2 && y1+h1<= y2+h2 ){
        if((y1-y2)<(y2+h2-y1-h1))
            bottom=true;
        else if((y1-y2)<(y2+h2-y1-h1))
            top=true;
        else
            horiz=true;
    }
    else if(y1<=y2 && y1+h1>= y2+h2){   
        if((y2-y1)<(y1+h1-y2-h2))
            top=true;
        else if((y2-y1)>(y1+h1-y2-h2))
            bottom=true;
        else
            horiz=true;
    }
    
    
    if((top || bottom || horiz) && (left || right)){
        
        if((this.lastHit == box.side) ){
            return;
        }
        else
            this.lastHit=((left)?"left":"right");
        
        if(box.speedy * this.speedy < 0){
            if(Math.abs(box.speedy)-Math.abs(this.speedy)<8*this.speed){
                if(left)
                    this.speedx=- this.speedx-((Math.abs(this.speedx)>this.speed)?this.speed:0);
                else
                    this.speedx=-this.speedx+((Math.abs(this.speedx)>this.speed)?this.speed:0);
            }
            else
                this.speedx=-this.speedx;
            
            if(this.speedy>0)
                this.speedy=this.speedy-(this.speed);
            else
                this.speedy=this.speedy+(this.speed);
        }
        else if((box.speedy * this.speedy >0) || (this.speedy==0 && box.speedy!=0)){
            if(Math.abs(box.speedy)-Math.abs(this.speedy)<=2*this.speed){
                if(left)
                    this.speedx=-this.speedx+((Math.abs(this.speedx)<4*this.speed)?this.speed:0);
                else
                    this.speedx=-this.speedx-((Math.abs(this.speedx)>4*this.speed)?this.speed:0);
            }
            else
                this.speedx=-this.speedx;
            
            if(this.speedy>0 || (this.speedy==0 && box.speedy>0) )
                this.speedy=this.speedy+((this.speedy<4*this.speed)?this.speed:0);
            else
                this.speedy=this.speedy-((-this.speedy<4*this.speed)?this.speed:0);
        }
        else{
            this.speedx=-this.speedx;
        }
    }
    
};

/*
 * This is the generic form of the collideBox() method, though it doesn't 
 * support anything else than boxes for now
 * 
 * @param {Primitive} primitive 
 */
BoxBall.prototype.collidePrimitive = function (primitive){
    if(primitive.shape === "box"){
        this.collideBox(primitive);
    }
    
};

/*
 * Add a function callback, that is activated whenever the ball hits the 
 * left or right side. The callback must accept a single int parameter, that 
 * holds the scorer.
 * 
 * @param {Object} self, the object in the context of which the callback 
 *                     is activated. The call is made array-style, ie
 *                     self["callback"]
 * @param {String} callback, name of callback function
  */
BoxBall.prototype.goalCallback = function (self,callback){
    this.__goalCallback__={"self":self,"callback":callback};
};
/*************************End BoxBall Class************************************/


/***************************Start AIPlayer Class*******************************/
/*
 *  A basic deterministic AI player tha moves a paddle
 * 
 * @param {PongNMScene} scene
 * @param {BoxPaddle} paddle
 * @param {BoxBall} ball
 * @param {int} level, 0,1 or 2
 * @returns {AIPlayer}
 */
function AIPlayer(scene,paddle,ball,level){
    this.paddle=paddle;
    this.ball=ball;
    this.scene=scene;
    this.level=((level)?level:2);
}

/*
 *  Decide move, based on what happens in the scene
 * 
 *  level 1: hits the ball and is  activated only when it starts coming back 
 *  and after it has reached somewhat close
 *  level 2: hits and resets own position to middle. It then is activated like 
 *  level 1, when the ball comes close
 *  level 3: resets postion after hit and tracks it as soon as opponent 
 *  hits it back.
 * 
 * 
 *  Note: level 2 appears to be the worse of the 3 for now, as level 1's
 *  behavior ends up making faster and more difficult to catch shots. level 1
 *  consistently beats level2. against human opponents it isn't certain who is 
 *  better.
 */
AIPlayer.prototype.makeMove = function(){
    var height=this.scene.height;
    var paddleCenter=this.paddle.y+this.paddle.height/2;
    var ballCenter=this.ball.y+this.ball.height/2;
    var ballDistance= Math.abs(this.ball.x - this.paddle.x);

    if((this.paddle.side=="left" && this.ball.speedx>0) || 
       (this.paddle.side=="right" && this.ball.speedx<0) ){ //move to middle
        if(Math.abs(paddleCenter - height/2) > paddleStep){ //prevent wiggling
            if(this.level<=1)
                return;
                
            if(paddleCenter >height/2)
                this.paddle.moveUp();
            else
                this.paddle.moveDown();
        }
    }
    else{
        if((Math.abs(paddleCenter - ballCenter) > ballDistance  &&
           ballDistance < 2 *Math.abs(paddleCenter -ballCenter)  ) ||
           (this.level>=3 && Math.abs(paddleCenter - ballCenter)>Math.abs(this.ball.speedy) )){ 
            if(paddleCenter >ballCenter)
                this.paddle.moveUp();
            else
                this.paddle.moveDown();
        }
    }
};

/***************************End AIPlayer Class*********************************/
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
function Game(score,endGame){
    this.scene=new PongNMScene("drawing",30,"#000","#fff",paddleOffset);
    this.scene.init();
    this.scene.addCallback(this,"keysFix");
    this.maxScore=score;
    
    this.players=new Array( new BoxPaddle(paddleStep*8,"left"),
                            new  BoxPaddle(paddleStep*8,"right"));
    this.ball = new BoxBall(Math.floor(paddleStep*2),Math.floor(paddleStep/2));
    this.ball.goalCallback(this,"goal");
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
Game.prototype.newGame = function(left,right){
    
    this.scene.clear();
    this.scene.addPrimitive(this.players[0]);
    this.scene.addPrimitive(this.players[1]);
    this.scene.addPrimitive(this.ball);
    this.scene.reset();
    this.human=new Array(left,right);

    if(left && right){
        this.addPlayers(0,this.controls[1]);
        this.addPlayers(1,this.controls[0]);
    }
    else if(left){
        this.AI.push(new AIPlayer(this.scene,this.players[1],this.ball));
        this.addPlayers(0,this.controls[0]);
    }
    else if(right){
        this.AI.push(new AIPlayer(this.scene,this.players[0],this.ball));
        this.addPlayers(1,this.controls[0]);
    }
    else{
        this.AI.push(new AIPlayer(this.scene,this.players[0],this.ball),
                     new AIPlayer(this.scene,this.players[1],this.ball));
    }
    for(var i=0;i<this.AI.length;i++){
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
Game.prototype.keysFix = function(){
    
    for(var i=0;i<this.players.length;i++){
        
        if(this.human[i]){
            if(this.keydownFix[i]>0){
                this.players[i].moveUp();
                this.keydownFix[i]--;
            }
            else if(this.keydownFix[i]<0){
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
    window.addEventListener("keydown", function(event){
    
        var kcode=((event.charCode)?(event.charCode):(event.keyCode));

        if(kcode===controls.up){
            that.players[player].moveUp();
            that.keydownFix[player]=50;
            event.preventDefault();

        }
        else if(kcode===controls.down){
            that.players[player].moveDown() ;
            that.keydownFix[player]=-50;
            event.preventDefault();

        }
        that.keycodeFix[player]=kcode;
    });

    window.addEventListener("keyup", function(event){

        var kcode=((event.charCode)?(event.charCode):(event.keyCode));
        
        if(kcode===that.keycodeFix[player]){
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
Game.prototype.goal = function(who){

    this.scene.score[who]++;
    var self=this;
    
    if(this.scene.score[who]>=this.maxScore){
        this.scene.stop();
        this.scene.clear();
//        console.log("final score : Level ",this.AI[0].level,": ", this.scene.score[0],". Level ",this.AI[1].level,": ", this.scene.score[1]);
        this.scene.score[0]="Player "+(who+1);
        while(this.scene.context.measureText(this.scene.score[0]).width > (this.scene.width/2 - 2*paddleOffset) 
              && (this.scene.fontSize>0)){
            this.scene.fontSize--;
            this.scene.context.font = "bold "+this.scene.fontSize+
            "px 'Share Tech Mono','monospace'";
        }
        this.scene.score[1]="wins!!! ";
        this.end=true;
        this.scene.redraw();
        if(this.endGame){
            if(this.endGame.self)
                this.endGame.self[this.endGame.callback]();
            else
                this.endGame();
        }   
        
    }
    else{
        this.scene.reset();
        this.ball.stop();
        setTimeout(function(){
            if(!self["end"])
                self["ball"].start();
        },1000);
    }
        
};

/*************************End Game Class*************************************/


