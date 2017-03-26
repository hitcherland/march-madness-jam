var Texture = {
	Texture: class {
		constructor() {
			this.image=null;
			this.texture=null;
		}

		start() {
			this.texture=gl.createTexture();
			gl.bindTexture(gl.TEXTURE_2D,this.texture);
			this.setTextureImage();
			this.setParameters();	
			gl.generateMipmap(gl.TEXTURE_2D);
			gl.bindTexture(gl.TEXTURE_2D,null);
		}
		
		setTextureImage() {
			var image=new Uint8Array(4);
			for(var i=0;i<4;i++)
				image[i]=255;
			gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 1, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE, image);
		}
	
		setParameters() {
			gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
			gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
			gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
			gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
		}

		draw() {
			gl.activeTexture(gl.TEXTURE0);
			gl.bindTexture(gl.TEXTURE_2D,this.texture);
			gl.uniform1i(shaderProgram.samplerUniform,0);
		}
	}
};

Texture.FlatColorTexture=class extends Texture.Texture {
	constructor(r,g,b,a) {
		super();
		if(r===undefined) r=255;
		if(g===undefined) g=r;
		if(b===undefined) b=r;
		if(a===undefined) a=255;
		this.color=[r,g,b,a];
	}

	setTextureImage() {
		var image=new Uint8Array(4);
		for(var i=0;i<4;i++)
			image[i]=this.color[i];
		gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 1, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE, image);
	}
};

Texture.ArrayTexture=class extends Texture.Texture {
	constructor(array,width,height) {
		super();
		this.array=array;
		this.width=width;
		this.height=height;
	}

	setTextureImage() {
		var arrayLength=this.array.length;
		var elementLength=min(4,arrayLength/(this.width*this.height));
		var image=new Uint8Array(arrayLength*4/elementLength);
		for(var i=0; i<arrayLength;i+=elementLength) {
			if(elementLength==1) {
				image[4*i+0]=this.array[i];
				image[4*i+1]=this.array[i];
				image[4*i+2]=this.array[i];
				image[4*i+3]=255;
			} else if(elementLength==2) {
				image[4*i+0]=this.array[i+0];
				image[4*i+1]=this.array[i+0];
				image[4*i+2]=this.array[i+0];
				image[4*i+3]=this.array[i+1];
			} else if(elementLength==3) {
				image[4*i+0]=this.array[i+0];
				image[4*i+1]=this.array[i+1];
				image[4*i+2]=this.array[i+2];
				image[4*i+3]=255;
			} else if(elementLength==4) {
				image[4*i+0]=this.array[i+0];
				image[4*i+1]=this.array[i+1];
				image[4*i+2]=this.array[i+2];
				image[4*i+3]=this.array[i+3];
			}
		}
		gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, width, height, 0, gl.RGBA, gl.UNSIGNED_BYTE, image);
	}
};

