function containsAny(array, values) {
	return data=values.some(function(v) { return array.indexOf(v) >= 0; })
}

function relative(a,b) {
	var relPos=[];
	for(var i=0; i<Math.min(a.length,b.length); i++)
		relPos[i]=b[i]-a[i];
	return relPos;
}

function dist(a,b) {
	return Math.sqrt(relative(a,b).map(function(a) { return a*a; }).reduce(function(a,b) { return a+b; },0));
}

function unit(a) {
	var r=dist(a,[0,0,0]);
	return a.map(function(b){return b/r;});
}

class Actor extends Mesh {
	constructor() {
		super([],[],[]);
		this.startTime=null;
		this.lastTick=null;
		this.deltaTime=null;
		this.speedModifier=0.1;
		this.speed={
			"vert": 1,
			"horz": 1,
		}

		this.direction=[0,0];
		this.historyIndex=0;
		this.historyLength=100;
		this.positionalHistory=[];

		this.activationRange=50;
		this.personality = {
			'jitter'   :0.5, // moving around a single point 

			//friendliness
			'approach-approacher':0.5,
			'approach-stayer':0.5,
			'approach-leaver':0.5,

			//wariness
			'stay-approacher':0.5,
			'stay-stayer':0.5,
			'stay-leaver':0.5,

			//cowardice
			'leave-approacher':0.5,
			'leave-stayer':0.5,
			'leave-leaver':0.5,
		}

//		// https://en.wikipedia.org/wiki/16PF_Questionnaire
//		this.personality = {
//			'warmth':0.5,               // helping/ignoring
//			'reasoning':0.5,            //
//			'emotional stability':0.5,  //
//			'dominance':0.5,            //
//			'liveliness':0.5,           //
//			'rule-consciousness':0.5,   //
//			'social boldness':0.5,      //
//			'sensitivity':0.5,          // keep away from people/
//			'vigilance':0.5,            // ???
//			'abstractedness':0.5,       // ignores art/looks at art
//			'privateness':0.5,          // ???
//			'apprehension':0.5,         // ???
//			'openness to change':0.5,   // ???
//			'self-reliance':0.5,        // average time near others
//			'perfectionism':0.5,        // messing up / fixing patterns around the place
//			'tension':0.5,              // average std-deviation of motion vs smoothed direction
//		}

	}

	start(parent) {
		super.start();
		this.startTime=Date.now();
		this.lastTick=this.startTime;
		this.deltaTime=0;
	}

	tick(parent) {
		super.tick();
		var now = Date.now()
		this.deltaTime=now-this.lastTick;
		this.lastTick=now;
		this.positionalHistory[this.historyIndex]=[this.position[0],this.position[1],this.position[2]];
		this.historyIndex=(this.historyIndex+1)%this.historyLength;
		this.direction=this.getDirection();
	}	

	getDirection() {
		var offset=[0,0]
		for(var i=0; i<this.positionalHistory.length-1; i++) {
			offset[0]+=this.positionalHistory[i+1][0]-this.positionalHistory[i][0]
			offset[1]+=this.positionalHistory[i+1][1]-this.positionalHistory[i][1]
		}
		if(this.positionalHistory.length>1) {
			offset[0]/=this.positionalHistory.length-1;
			offset[1]/=this.positionalHistory.length-1;
		}
		return offset;
	}

}

class Player extends Actor {
	constructor() {
		super();
		this.texture=null;		
		this.inputs=[];
		this.sphere=this.addChild(new Sphere(10,10));
		this.sphere.scale=6;	
	}

	start() {
		super.start();
		this.texture=gl.createTexture();
		gl.bindTexture(gl.TEXTURE_2D,this.texture);
		var image=new Uint8Array(4*128*128);
		for(var i=0;i<128*128; i++) {
			image[4*i+0]=(i%3==1)?0:255;//i>(128*64)?255:0;
			image[4*i+1]=0;
			image[4*i+2]=0;
			image[4*i+3]=255;
		}
		gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 128,128, 0, gl.RGBA, gl.UNSIGNED_BYTE, image);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
		gl.generateMipmap(gl.TEXTURE_2D);
		gl.bindTexture(gl.TEXTURE_2D,null);
	}

	tick(parent) {
		super.tick();
		if(this.inputs.indexOf("up"   )>=0) this.position[1]+=this.speed["vert"]*this.speedModifier*this.deltaTime;
		if(this.inputs.indexOf("down" )>=0) this.position[1]-=this.speed["vert"]*this.speedModifier*this.deltaTime;
		if(this.inputs.indexOf("left" )>=0) this.position[0]-=this.speed["horz"]*this.speedModifier*this.deltaTime;
		if(this.inputs.indexOf("right")>=0) this.position[0]+=this.speed["horz"]*this.speedModifier*this.deltaTime;
		this.position[0]=Math.max(Math.min(this.position[0],390),-390)
		this.position[1]=Math.max(Math.min(this.position[1],290),-290)

		this.children[0].rotation[0]+=0.01
		//this.children[0].rotation[1]+=0.02
		//this.children[0].rotation[2]+=0.03
	}
}

class Victim extends Actor {
	constructor() {
		super();
		this.infectionLevel=0;
		this.sphere=this.addChild(new Sphere(10,10));
		this.speed['horz']=0.2;
		this.speed['vert']=0.2;
		this.sphere.scale=4;
		this.generatePersonality();
		this.impulse=[0,0];
	}
	start() {
		super.start();
		this.texture=gl.createTexture();
		gl.bindTexture(gl.TEXTURE_2D,this.texture);
		var image=new Uint8Array(4*128*128);
		for(var i=0;i<128*128; i++) {
			image[4*i+0]=Math.random()*128;
			image[4*i+1]=Math.random()*128;
			image[4*i+2]=255;
			image[4*i+3]=255;
		}
		gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 128,128, 0, gl.RGBA, gl.UNSIGNED_BYTE, image);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
		gl.generateMipmap(gl.TEXTURE_2D);
		gl.bindTexture(gl.TEXTURE_2D,null);
	}

	generatePersonality() {
		function gaussRandom(a) {
			var gauss=Math.exp(-Math.pow((Math.random()+0.5),2))
			return Math.min(Math.max(gauss,0),1);
		}
		this.personality['jitter'             ]=0.1*gaussRandom(); // moving around a single point 
		this.personality['approach-approacher']=gaussRandom();
		this.personality['approach-stayer'    ]=gaussRandom();
		this.personality['approach-leaver'    ]=gaussRandom();
		this.personality['stay-approacher'    ]=gaussRandom();
		this.personality['stay-stayer'        ]=gaussRandom();
		this.personality['stay-leaver'        ]=gaussRandom();
		this.personality['leave-approacher'   ]=gaussRandom();
		this.personality['leave-stayer'       ]=gaussRandom();
		this.personality['leave-leaver'       ]=gaussRandom();
	}

	tick() {
		super.tick();
		this.impulse=[0,0];
		this.respondToActor(this.parent.player);	
		for(var i=0; i<this.parent.victims.length; i++) {
			var actor=this.parent.victims[i];
			if(actor!=this) {
				this.respondToActor(actor);
			}
		}

		//jitter
		if(!(x==y && y==0)) {
			var x=Math.random()-0.5, y=Math.random()-0.5;
			var r=Math.sqrt(x*x+y*y);
			var jitter=this.personality['jitter'];
			this.position[0]+=x*jitter*this.deltaTime*this.speedModifier/r;
			this.position[1]+=y*jitter*this.deltaTime*this.speedModifier/r;
		}

		this.position[0]+=this.impulse[0]*this.deltaTime*this.speedModifier*this.speed['horz']
		this.position[1]+=this.impulse[1]*this.deltaTime*this.speedModifier*this.speed['vert']
		this.position[0]=Math.max(Math.min(this.position[0],390),-390)
		this.position[1]=Math.max(Math.min(this.position[1],290),-290)
	}

	respondToActor(actor) {
		var distance=dist(this.position,actor.position);
		var relPos=relative(this.position,actor.position);
		var direction=actor.direction;
		var unitDirection=unit(direction);
		relPos[0]/=distance;
		relPos[1]/=distance;
		var directionalAdjust=[];
		directionalAdjust[0]=actor.position[0]+unitDirection[0]*this.deltaTime*this.speedModifier*this.speed['horz'];
		directionalAdjust[1]=actor.position[1]+unitDirection[1]*this.deltaTime*this.speedModifier*this.speed['vert'];
		if(distance<this.activationRange) {
			var disty = dist(direction,[0,0]);
			var a=0,s=0,l=0;
			if(disty<0.01) {
				a=this.personality['approach-stayer'];
				s=this.personality['stay-stayer'];
				l=this.personality['leave-stayer'];
			} else if(distance>dist(directionalAdjust,this.position)) {
				a=this.personality['approach-approacher'];
				s=this.personality['stay-approacher'];
				l=this.personality['leave-approacher'];
			} else {
				a=this.personality['leav-leaver'];
				s=this.personality['stay-leaver'];
				l=this.personality['leave-leaver'];
			}

			if(a>s && a>l) {
				this.impulse[0]+=relPos[0]*this.deltaTime*this.speedModifier*this.speed['horz'];
				this.impulse[1]+=relPos[1]*this.deltaTime*this.speedModifier*this.speed['vert'];
			} else if (l>s && l>a) {
				this.impulse[0]-=relPos[0]*this.deltaTime*this.speedModifier*this.speed['horz'];
				this.impulse[1]-=relPos[1]*this.deltaTime*this.speedModifier*this.speed['vert'];
			}

		}
	}
}

class SuperGame extends Game {
	constructor(canvas) {
		super(canvas);
		var this_=this;
		this.keydown={};
		this.history=[];
		this.controls={
			"up"   : ["ArrowUp"   ,"w"],
			"down" : ["ArrowDown" ,"s"],
			"left" : ["ArrowLeft" ,"a"],
			"right": ["ArrowRight","d"],
		};

		this.directionalLightPosition=[1,0,0];

		this.player=this.addChild(new Player());

		this.victims=[]
		for(var i=0; i<100; i++) {
			this.victims[i]=this.addChild(new Victim());
			this.victims[i].position[0]=(Math.random()-0.5)*(this.canvas.width-20);
			this.victims[i].position[1]=(Math.random()-0.5)*(this.canvas.height-20);
		}

		addEventListener("keydown", function(ev){ this_.keydown[ev.key]=ev; });
		addEventListener("keyup"  , function(ev){ delete this_.keydown[ev.key]; });
	}

	input(dt) {
		var inputs= {"player":[]};
		if(containsAny(Object.keys(this.keydown),this.controls["up"   ])) { inputs["player"].push("up"); }
		if(containsAny(Object.keys(this.keydown),this.controls["down" ])) { inputs["player"].push("down"); }
		if(containsAny(Object.keys(this.keydown),this.controls["left" ])) { inputs["player"].push("left"); }
		if(containsAny(Object.keys(this.keydown),this.controls["right"])) { inputs["player"].push("right"); }
		return inputs;
	}

	tick(dt) {
		super.tick();
		var inputs=this.input(dt);
		this.player.inputs=inputs["player"];
		this.history.push({ "inputs"        : inputs});
	}
}
