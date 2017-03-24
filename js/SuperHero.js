function containsAny(array, values) {
	return data=values.some(function(v) { return array.indexOf(v) >= 0; })
}

class Actor extends Mesh {
	constructor() {
		super([],[],[]);
		this.startTime=null;
		this.lastTick=null;
		this.deltaTime=null;
		this.speedModifier=0.1;
		this.speed={
			"up": 1,
			"down": 1,
			"left": 1,
			"right": 1,
		}
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
	}	
}

class Player extends Actor {
	constructor() {
		super();
		this.inputs=[];
	}

	tick(parent) {
		super.tick();
		if(this.inputs.indexOf("up"   )>=0) this.position[1]+=this.speed["up"   ]*this.speedModifier*this.deltaTime;
		if(this.inputs.indexOf("down" )>=0) this.position[1]-=this.speed["down" ]*this.speedModifier*this.deltaTime;
		if(this.inputs.indexOf("left" )>=0) this.position[0]-=this.speed["left" ]*this.speedModifier*this.deltaTime;
		if(this.inputs.indexOf("right")>=0) this.position[0]+=this.speed["right"]*this.speedModifier*this.deltaTime;
	}
}

class Victim extends Actor {
	constructor() {
		super();
		this.infectionLevel=0;
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
		this.player.addChild(new Sphere(10,10));
		this.player.scale=10;
		this.player.children[0].scale=10;

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
