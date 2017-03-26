var gl = null;
var canvas = null;
var shaderProgram = null;
var mvMatrix = mat4.create();
var pMatrix = mat4.create();
var mvMatrixStack = [];
var nMatrix = mat3.create();
var rttFramebuffer;
var rttTexture;

function mvPushMatrix() {
	var copy = mat4.create();
	mat4.set(mvMatrix, copy);
	mvMatrixStack.push(copy);
}

function mvPopMatrix() {
	if (mvMatrixStack.length == 0) { throw "Invalid popMatrix!"; }
	mvMatrix = mvMatrixStack.pop();
}

function	setMatrixUniforms() {
	gl.uniformMatrix4fv(shaderProgram.pMatrixUniform, false, pMatrix);
	gl.uniformMatrix4fv(shaderProgram.mvMatrixUniform, false, mvMatrix);
	var normalMatrix = mat3.create();
	mat4.toInverseMat3(mvMatrix, normalMatrix);
	mat3.transpose(normalMatrix);
	gl.uniformMatrix3fv(shaderProgram.nMatrixUniform, false, normalMatrix);
}

class GameObject {
	constructor() { 
		this.children = [];
	}
	onStart(parentObject) { this.start(parentObject); for(var i=0; i<this.children.length; i++) this.children[i].onStart(this); this.onTick(); }
	onTick(parentObject) { this.tick(parentObject); for(var i=0; i<this.children.length; i++) this.children[i].onTick(this); }
	onDraw(parentObject) { mvPushMatrix(); this.draw(parentObject); for(var i=0; i<this.children.length; i++) this.children[i].onDraw(this); this.postdraw(parentObject); mvPopMatrix() }
	start(parentObject) { }
	tick(parentObject) { }
	draw(parentObject) { }
	postdraw(parentObject) { }
	addChild(child) { this.children.push(child); child.parent=this; return child;}
}

class Collider extends GameObject {
	constructor() { 
		super();
		this.watchers=[];
		this.partitionSizes=[20,20,20];
	}	

	addCollisionDetection(child) {
		if(child.onCollision!==undefined) this.watchers.push(child);
	}

	tick() {
		var partitions={};
		for(var i=0; i<this.watchers.length; i++) {
			var position=this.watchers[i].position;
			var X=position[0]-position[0]%this.partitionSizes[0];	
			var Y=position[1]-position[1]%this.partitionSizes[1];	
			var Z=position[2]-position[2]%this.partitionSizes[2];
			if(partitions[Z]===undefined) partitions[Z]={}
			if(partitions[Z][Y]===undefined) partitions[Z][Y]={}
			if(partitions[Z][Y][X]===undefined) partitions[Z][Y][X]=[]
			partitions[Z][Y][X].push(this.watchers[i]);
		}
		for(var Z in partitions) {
			for(var Y in partitions[Z]) {
				for(var X in partitions[Z][Y]) {
					var partition=partitions[Z][Y][X];
					for(var i=0; i<partition.length; i++) {
						for(var j=i+1;j<partition.length; j++) {
							var A=partition[i];
							var B=partition[j];
							var dist = Math.sqrt(Math.pow(A.position[0]-B.position[0],2)+Math.pow(A.position[1]-B.position[1],2)+Math.pow(A.position[2]-B.position[2],2));
							var sizeA = Math.sqrt(Math.pow(A.scale[0],2)+Math.pow(A.scale[1],2)+Math.pow(A.scale[2],2));
							var sizeB = Math.sqrt(Math.pow(B.scale[0],2)+Math.pow(B.scale[1],2)+Math.pow(B.scale[2],2));
							if(dist<(sizeA+sizeB)/2) {
								A.onCollision(B);
								B.onCollision(A);
							}
						}
					}
				}
			}
		}
	}
}

class Mesh extends GameObject {
	constructor(vertices,triangles,normals,textureCoords) {
		super();
		this.parent=null;
		this.__scale=[1,1,1];
		this.rotation=[0,0,0];
		this.position=[0,0,0];
		this.__actualrotation=null;
		this.__actualposition=null;
		this.__actualscale=null;
		this.__blur=null;

		this.vertexBuffer = null;
		this.normalBuffer = null;
		this.triangleBuffer = null;
		this.textureBuffer = null;
		this.texture=null;

		this.__vertices=vertices;
		this.__triangles=triangles
		this.__normals=normals;
		this.__textureCoords=textureCoords;
		this.__started=false;
	}

	start() {
		this.vertexBuffer = gl.createBuffer();
		this.normalBuffer = gl.createBuffer();
		this.triangleBuffer = gl.createBuffer();
		this.textureBuffer = gl.createBuffer();

		this.vertices=this.__vertices;
		this.triangles=this.__triangles
		this.normals=this.__normals;
		this.textureCoords=this.__textureCoords;
		this.__started=true;
		this.scale=this.__scale;

		if(this.texture !== null) {
			this.texture.start();
		} else {
			this.texture=new Texture.Texture();
			this.texture.start();
		}

	}

	get blur() {
		var blur=this.__blur;
		var active=this.parent;
		while(blur===null && active!==null && active!==undefined) {
			blur=active.blur;
			active=active.parent;
		}
		if(blur===null || blur===undefined) return [0,0,0,0,1,0,0,0,0];
		return blur;
	}
	set blur(s) {
		this.__blur=s;
	}

	get scale() { return this.__scale; }
	set scale(s) {
		if(s.constructor!==Array) s=[s,s,s];
		this.__scale=s;
		if(!this.__started) return;
		var vertices=[]
		for(var i=0; i<this.vertices.length; i++) {
			vertices[i]=this.vertices[i]*s[i%3];
		}
		this.vertices=vertices;
	}

	get vertices() { return this.__vertices; }
	set vertices(vs) {
		this.__vertices=vs;
		gl.bindBuffer(gl.ARRAY_BUFFER, this.vertexBuffer);
		gl.bufferData(gl.ARRAY_BUFFER,new Float32Array(this.__vertices), gl.STATIC_DRAW);
		this.vertexBuffer.itemSize=3;
		this.vertexBuffer.numItems=Math.floor(this.__vertices.length/this.vertexBuffer.itemSize);
	}

	get triangles() { return this.__triangles; }
	set triangles(ts) {
		this.__triangles=ts;
		gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER,this.triangleBuffer);
		gl.bufferData(gl.ELEMENT_ARRAY_BUFFER,new Uint16Array(this.__triangles),gl.STATIC_DRAW);
		this.triangleBuffer.itemSize=1;
		this.triangleBuffer.numItems=this.__triangles.length;
	}


	get normals() { return this.__normals; }
	set normals(ns) {
		this.__normals=ns;
		gl.bindBuffer(gl.ARRAY_BUFFER,this.normalBuffer);
		gl.bufferData(gl.ARRAY_BUFFER,new Float32Array(this.__normals),gl.STATIC_DRAW);
		this.normalBuffer.itemSize=3;
		this.normalBuffer.numItems=Math.floor(this.__normals.length/this.normalBuffer.itemSize);
	}

	get textureCoords() { return this.__textureCoords; }
	set textureCoords(ts) {
		this.__textureCoords=ts;
		if(ts===undefined) {
			this.__textureCoords=[];
		}
		gl.bindBuffer(gl.ARRAY_BUFFER,this.textureBuffer);
		gl.bufferData(gl.ARRAY_BUFFER,new Float32Array(this.__textureCoords),gl.STATIC_DRAW);
		this.textureBuffer.itemSize=2;
		this.textureBuffer.numItems=Math.floor(this.__textureCoords.length/this.textureBuffer.itemSize);
	}


	draw() {
		super.draw();
		mat4.translate(mvMatrix, this.position);
		mat4.rotate(mvMatrix, this.rotation[0], [1, 0, 0]);
		mat4.rotate(mvMatrix, this.rotation[1], [0, 1, 0]);
		mat4.rotate(mvMatrix, this.rotation[2], [0, 0, 1]);

		gl.bindBuffer(gl.ARRAY_BUFFER, this.vertexBuffer);
		gl.vertexAttribPointer(shaderProgram.vertexPositionAttribute, this.vertexBuffer.itemSize, gl.FLOAT, false, 0, 0);

    gl.bindBuffer(gl.ARRAY_BUFFER, this.normalBuffer);
    gl.vertexAttribPointer(shaderProgram.vertexNormalAttribute, this.normalBuffer.itemSize, gl.FLOAT, false, 0, 0);

    gl.bindBuffer(gl.ARRAY_BUFFER, this.textureBuffer);
    gl.vertexAttribPointer(shaderProgram.textureCoordAttribute, this.textureBuffer.itemSize, gl.FLOAT, false, 0, 0);

		gl.uniform1fv(shaderProgram.blurKernelUniform,this.blur);
		gl.uniform1f(shaderProgram.blurWeightUniform,this.blur.reduce(function(a,b){return a+b;},0));

		if(this.texture !== null) {
			if (this.texture instanceof Texture.Texture) {
				this.texture.draw();
			} else {	
				gl.activeTexture(gl.TEXTURE0);
				gl.bindTexture(gl.TEXTURE_2D,this.texture);
				gl.uniform1i(shaderProgram.samplerUniform,0);
			}
		} else {
			gl.uniform1i(shaderProgram.samplerUniform,0);
		}

		setMatrixUniforms();
		gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER,this.triangleBuffer);
		gl.drawElements(gl.TRIANGLES, this.triangleBuffer.numItems, gl.UNSIGNED_SHORT, 0);

	}
}

class Game extends GameObject {
	constructor(canvas_id) {
		super();
		this.canvas=document.getElementById(canvas_id);
		canvas = this.canvas;
		this.clearColor=[0,0,0,0];		
		this.cameraPosition=[0,0,-100];
		this.ambientLight=[0.05,0.05,0.05];
		this.directionalLightColor=[1,1,1];
		this.directionalLightPosition=[1,1,0];
		//this.onStart();

		//this.drawQuad=new Grid(1,1,[this.canvas.width/1,this.canvas.height/1]);
	}

	initGL() {
		gl = this.canvas.getContext('webgl') || this.canvas.getContext('experimental-webgl');
		if (!gl) { alert('Unable to initialize WebGL. Your browser may not support it.'); return; }
		gl.viewportWidth = this.canvas.width;
		gl.viewportHeight = this.canvas.height;
	  gl.clearColor(...this.clearColor);
		gl.enable(gl.DEPTH_TEST);
	}

	initShaders() {
		var fragmentShader = this.getShader("shader-fs");
		var vertexShader = this.getShader("shader-vs");

		shaderProgram = gl.createProgram();
		gl.attachShader(shaderProgram, vertexShader);
		gl.attachShader(shaderProgram, fragmentShader);
		gl.linkProgram(shaderProgram);

		if (!gl.getProgramParameter(shaderProgram, gl.LINK_STATUS)) { alert("Could not initialise shaders"); }

		gl.useProgram(shaderProgram);

		shaderProgram.vertexPositionAttribute = gl.getAttribLocation(shaderProgram, "aVertexPosition");
		gl.enableVertexAttribArray(shaderProgram.vertexPositionAttribute);

		shaderProgram.vertexNormalAttribute = gl.getAttribLocation(shaderProgram, "aVertexNormal");
		gl.enableVertexAttribArray(shaderProgram.vertexNormalAttribute);

		shaderProgram.textureCoordAttribute = gl.getAttribLocation(shaderProgram, "aTextureCoord");
		gl.enableVertexAttribArray(shaderProgram.textureCoordAttribute);

		shaderProgram.samplerUniform = gl.getUniformLocation(shaderProgram, "uSampler");
		shaderProgram.blurKernelUniform = gl.getUniformLocation(shaderProgram, "uBlurKernel[0]");
		shaderProgram.blurWeightUniform = gl.getUniformLocation(shaderProgram, "uBlurWeight");

		shaderProgram.pMatrixUniform = gl.getUniformLocation(shaderProgram, "uPMatrix");
		shaderProgram.mvMatrixUniform = gl.getUniformLocation(shaderProgram, "uMVMatrix");
		shaderProgram.nMatrixUniform = gl.getUniformLocation(shaderProgram, "uNMatrix");
		shaderProgram.lightingDirectionUniform = gl.getUniformLocation(shaderProgram, "uLightingDirection");
		shaderProgram.directionalColorUniform = gl.getUniformLocation(shaderProgram, "uDirectionalColor");
		shaderProgram.ambientColorUniform = gl.getUniformLocation(shaderProgram, "uAmbientLightColor");
	}

	getShader(id) {
		var shaderScript = document.getElementById(id);
		if (!shaderScript) { return null; }

		var str = "";
		var k = shaderScript.firstChild;
		while (k) {
			if (k.nodeType == 3) { str += k.textContent; }
			k = k.nextSibling;
		}

		var shader;
		if (shaderScript.type == "x-shader/x-fragment") {
			shader = gl.createShader(gl.FRAGMENT_SHADER);
		} else if (shaderScript.type == "x-shader/x-vertex") {
			shader = gl.createShader(gl.VERTEX_SHADER);
		} else {
			return null;
		}

		gl.shaderSource(shader, str);
		gl.compileShader(shader);

		if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
			alert(gl.getShaderInfoLog(shader));
			return null;
		}

		return shader;
	}

	initTextureFramebuffer() {
		rttFramebuffer = gl.createFramebuffer();
		gl.bindFramebuffer(gl.FRAMEBUFFER, rttFramebuffer);
		rttFramebuffer.width=Math.pow(2,Math.floor(Math.log(this.canvas.width*2)/Math.LN2)+1);
		rttFramebuffer.height=Math.pow(2,Math.floor(Math.log(this.canvas.height*2)/Math.LN2)+1);

		rttTexture = gl.createTexture();
		gl.bindTexture(gl.TEXTURE_2D, rttTexture);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_NEAREST);
		gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, rttFramebuffer.width, rttFramebuffer.height, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
		gl.generateMipmap(gl.TEXTURE_2D);

		var renderbuffer = gl.createRenderbuffer();
		gl.bindRenderbuffer(gl.RENDERBUFFER, renderbuffer);
		gl.renderbufferStorage(gl.RENDERBUFFER, gl.DEPTH_COMPONENT16, rttFramebuffer.width, rttFramebuffer.height);

		gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, rttTexture, 0);
		gl.framebufferRenderbuffer(gl.FRAMEBUFFER, gl.DEPTH_ATTACHMENT, gl.RENDERBUFFER, renderbuffer);

		gl.bindTexture(gl.TEXTURE_2D, null);
		gl.bindRenderbuffer(gl.RENDERBUFFER, null);
		gl.bindFramebuffer(gl.FRAMEBUFFER, null);
	}


	start() {
		super.start();
		this.initGL();
		this.initShaders();
		//this.initTextureFramebuffer();
		//this.drawQuad.texture=rttTexture;
		//this.drawQuad.blur=[1,1,1,1,1,1,1,1,1];
		//this.drawQuad.start();


		//this.drawQuad.position[2]=0;

		//this.onTick();
	}	
	
	draw() {
		super.draw();
		//gl.bindFramebuffer(gl.FRAMEBUFFER, rttFramebuffer);
		//gl.viewport(0, 0, rttFramebuffer.width, rttFramebuffer.height);
		gl.viewport(0, 0, gl.viewportWidth, gl.viewportHeight);
		gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

		//mat4.perspective(90, gl.viewportWidth / gl.viewportHeight, 0.1, 100.0, pMatrix);
		mat4.ortho(-this.canvas.width/2, this.canvas.width/2, -this.canvas.height/2, this.canvas.height/2, 0.1, 200,pMatrix);
		mat4.identity(mvMatrix);
		mat4.translate(mvMatrix, this.cameraPosition);
		
		gl.uniform3f(shaderProgram.ambientColorUniform,...this.ambientLight);
		gl.uniform3f(shaderProgram.directionalColorUniform,...this.directionalLightColor);
		var adjustedLD = vec3.create();
		vec3.normalize(this.directionalLightPosition, adjustedLD);
		vec3.scale(adjustedLD, -1);
		gl.uniform3fv(shaderProgram.lightingDirectionUniform, adjustedLD);
	}

	postdraw() {
		super.postdraw();

		//gl.bindTexture(gl.TEXTURE_2D, rttTexture);
		//gl.generateMipmap(gl.TEXTURE_2D);
		//gl.bindTexture(gl.TEXTURE_2D, null);

		//gl.bindFramebuffer(gl.FRAMEBUFFER, null);
		//gl.viewport(0, 0, gl.viewportWidth, gl.viewportHeight);
		//gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
		//this.drawQuad.draw();
	}

	tick() {
		super.tick();
		this.onDraw();
		requestAnimFrame(this.onTick.bind(this));
	}
}
