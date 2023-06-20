import { getDynamicConfig } from './config.js';
import { PongNMScene } from './scene.js';

const { paddleStep, paddleOffset, paddleSpeed } = getDynamicConfig();

class Primitive {
    constructor(shape,x,y,z,color) {
        this.shape=shape;
        this.x=x;
        this.y=y;
        this.z=z;
        this.angle=0;
        this.color=color;
        this.speedx=0;
        this.speedy=0;
    }

    slide() {
        if (this.speedx<0 ) {
            this.x-=paddleStep;
            this.speedx+=paddleStep;
        }
        else if (this.speedx>0) {
            this.x+=paddleStep;
            this.speedx-=paddleStep;
        }
        if (this.speedy<0) {
            this.y-=paddleStep;
            this.speedy+=paddleStep;
        }
        else if (this.speedy>0) {
            this.y+=paddleStep;
            this.speedy-=paddleStep;
        }
    }

    draw(context) {

        context.save();
        context.fillStyle= this.color;
        context.translate(this.x,this.y);
        context.rotate(this.angle);

        this.drawShape(context);

        context.restore();
    }

    move(x,y) {
        this.x=x;
        this.y=y;
    }

    rotate(angle) {
        this.angle=angle;
    }

    speedup(current,added) {
        if (current==0 || (current*added<0)) {
            return added;
        }
        else if (Math.abs(current)<2*Math.abs(added))
            return current+added;
        else if (Math.abs(current)<4*Math.abs(added))
            return current;
        else
            return 0;
    }

    speed(spo) {
        if (spo.x) this.speedx=this.speedup(this.speedx,spo.x);
        if (spo.y) this.speedy=this.speedup(this.speedy,spo.y);
    }

    reset(width,height) {
        this.x=0;
        this.y=0;
    }
}

class BoxPrimitive extends Primitive {
    constructor(x,y,w,h,z,color) {
        super("box",x,y,z,color);
        this.width=w;
        this.height=h;
    }

    drawShape(context) {
        context.fillRect(0,0,this.width,this.height);
    }
}

class BoxColliding extends BoxPrimitive {
    constructor(x,y,w,h,z,color) {
        super(x,y,w,h,z,color);
    }

    collideBoundaries(width,height) {
        if (this.width+this.x+paddleOffset > width+paddleOffset/2) {
            this.x=width-this.width-paddleOffset;
            this.speedx=0;
        }
        else if (this.x<paddleOffset/2) {
            this.x=paddleOffset;
            this.speedx=0;
        }

        if (this.height+this.y+paddleOffset > height+paddleOffset/2) {
            this.y=height-this.height-paddleOffset;
            this.speedy=0;
        }
        else if (this.y<paddleOffset/2) {
            this.y=paddleOffset;
            this.speedy=0;
        }
    }
}

export class BoxPaddle extends BoxColliding {
    constructor(size,side,color) {
        super(0,0,size/4,size,0,((color)?color:"#fff"));
        this.side=side;
    }

    box() {
        return {
            x:this.x,
            y:this.y,
            width:this.width,
            height:this.height,
        };
    }

    moveUp() {
        this.speed({"y":-paddleSpeed});
    }

    moveDown() {
        this.speed({"y":paddleSpeed});
    }

    reset(width,height) {
        if (this.side=="left") {
            this.x=paddleOffset;
            this.y=(height-this.height)/2;
        } else if (this.side=="right") {
            this.x=(width-this.width)-paddleOffset;
            this.y=(height-this.height)/2;
        }
    }
}

export class BoxBall extends BoxColliding {
    constructor(size,speed,color) {
        super(0,0,size,size,1,((color)?color:"#fff"));

        this.speed=speed;
        this.stopped=true;
        this.lastHit="none";
    }

    stop() {
        this.stopped=true;
    }

    start() {
        this.stopped=false;
    }

    reset(width,height) {
        this.x=(width-this.width)/2;
        this.y=(height-this.height)/2;
        this.speedx=(2*Math.round(Math.random())-1)*this.speed;
        this.speedy=(2*Math.round(Math.random())-1)*this.speed;
        this.lastHit="none";
    }

    slide() {
        if (!this.stopped) {
            this.move(this.x+this.speedx,this.y+this.speedy);
        }
    }

    collideBoundaries(width, height) {
        if (this.width+this.x >= width) {
            if (this.goalCallback) {
                this.goalCallback.self[this.goalCallback.callback](0);
            }

            this.speedx=-Math.abs(this.speedx);
        } else if (this.x<=0) {
            if (this.goalCallback)
                this.goalCallback.self[this.goalCallback.callback](1);
            this.speedx=Math.abs(this.speedx);
        }

        if (this.height+this.y>= height) {
            this.speedy=-Math.abs(this.speedy);
        } else if (this.y<=0) {
            this.speedy=Math.abs(this.speedy);
        }
    }

    collideBox(box) {
        let x1=this.x,y1=this.y,w1=this.width,h1=this.height,
            x2=box.x,y2=box.y,w2=box.width,h2=box.height;
        let left=false,right=false,top=false,bottom=false, vert=false,horiz=false;  //left - right  , up - down

        if (x1>=x2 && x1<=x2+w2 && x1+w1> x2+w2 )
            left=true; //left
        else if (x1+w1>=x2 && x1+w1<=x2+w2 && x1 < x2)
            right=true; //right
        else if (x1>=x2 && x1+w1<= x2+w2 ) {
            if ((x1-x2)<(x2+w2-x1-w1))
                right=true;
            else if ((x1-x2)<(x2+w2-x1-w1))
                left=true;
            else
                vert=true;
        }
        else if (x1<=x2 && x1+w1>= x2+w2) {
            if ((x2-x1)<(x1+w1-x2-w2))
                left=true;
            else if ((x2-x1)>(x1+w1-x2-w2))
                right=true;
            else
                vert=true;
        }

        if (y1>=y2 && y1<=y2+h2 && y1+h1> y2+h2 )
            top=true; //top
        else if (y1+h1>=y2 && y1+h1<=y2+h2 && y1 < y2)
            bottom=true; //bottom
        else if (y1>=y2 && y1+h1<= y2+h2 ) {
            if ((y1-y2)<(y2+h2-y1-h1))
                bottom=true;
            else if ((y1-y2)<(y2+h2-y1-h1))
                top=true;
            else
                horiz=true;
        }
        else if (y1<=y2 && y1+h1>= y2+h2) {
            if ((y2-y1)<(y1+h1-y2-h2))
                top=true;
            else if ((y2-y1)>(y1+h1-y2-h2))
                bottom=true;
            else
                horiz=true;
        }


        if ((top || bottom || horiz) && (left || right)) {

            if ((this.lastHit == box.side) ) {
                return;
            }
            else
                this.lastHit=((left)?"left":"right");

            if (box.speedy * this.speedy < 0) {
                if (Math.abs(box.speedy)-Math.abs(this.speedy)<8*this.speed) {
                    if (left)
                        this.speedx=- this.speedx-((Math.abs(this.speedx)>this.speed)?this.speed:0);
                    else
                        this.speedx=-this.speedx+((Math.abs(this.speedx)>this.speed)?this.speed:0);
                }
                else
                    this.speedx=-this.speedx;

                if (this.speedy>0)
                    this.speedy=this.speedy-(this.speed);
                else
                    this.speedy=this.speedy+(this.speed);
            }
            else if ((box.speedy * this.speedy >0) || (this.speedy==0 && box.speedy!=0)) {
                if (Math.abs(box.speedy)-Math.abs(this.speedy)<=2*this.speed) {
                    if (left)
                        this.speedx=-this.speedx+((Math.abs(this.speedx)<4*this.speed)?this.speed:0);
                    else
                        this.speedx=-this.speedx-((Math.abs(this.speedx)>4*this.speed)?this.speed:0);
                }
                else
                    this.speedx=-this.speedx;

                if (this.speedy>0 || (this.speedy==0 && box.speedy>0) )
                    this.speedy=this.speedy+((this.speedy<4*this.speed)?this.speed:0);
                else
                    this.speedy=this.speedy-((-this.speedy<4*this.speed)?this.speed:0);
            }
            else {
                this.speedx=-this.speedx;
            }
        }
    }

    collidePrimitive = function (primitive) {
        if (primitive.shape === "box") {
            this.collideBox(primitive);
        }
    }

    setGoalCallback(self, callback) {
        this.goalCallback={"self":self,"callback":callback};
    }
}
