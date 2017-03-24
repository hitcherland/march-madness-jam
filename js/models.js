class Grid extends Mesh {
	constructor(width,height,unitLength) {
		var vertices=[];
		var triangles=[];
		var normals=[];

		for (var i = 0; i <= width; i++)
		{
				var x = i - width / 2;
				for (var j = 0; j <= height; j++)
				{
						var y = j - height / 2;
						vertices.push(x*unitLength);
						vertices.push(y*unitLength);
						vertices.push(0);
						normals.push(0);
						normals.push(0);
						normals.push(1);

						if (i < width && j < height)
						{
								triangles[6 * (i * height + j) + 0] = Math.floor((i + 0) * (height+1) + j + 0);
								triangles[6 * (i * height + j) + 1] = Math.floor((i + 0) * (height+1) + j + 1);
								triangles[6 * (i * height + j) + 2] = Math.floor((i + 1) * (height+1) + j + 0);
								triangles[6 * (i * height + j) + 3] = Math.floor((i + 0) * (height+1) + j + 1);
								triangles[6 * (i * height + j) + 4] = Math.floor((i + 1) * (height+1) + j + 1);
								triangles[6 * (i * height + j) + 5] = Math.floor((i + 1) * (height+1) + j + 0);

						}
				}
		}
		super(vertices,triangles,normals);
	}

	resize(width,height,unitLength) {
		var vertices=[];
		var triangles=[];
		var normals=[];

		for (var i = 0; i <= width; i++)
		{
			var x = i - width / 2;
			for (var j = 0; j <= height; j++)
			{
				var y = j - height / 2;
				vertices.push(x*unitLength);
				vertices.push(y*unitLength);
				vertices.push(0);
				normals.push(0);
				normals.push(0);
				normals.push(1);

				if (i < width && j < height)
				{
					triangles[6 * (i * height + j) + 0] = Math.floor((i + 0) * (height+1) + j + 0);
					triangles[6 * (i * height + j) + 1] = Math.floor((i + 0) * (height+1) + j + 1);
					triangles[6 * (i * height + j) + 2] = Math.floor((i + 1) * (height+1) + j + 0);
					triangles[6 * (i * height + j) + 3] = Math.floor((i + 0) * (height+1) + j + 1);
					triangles[6 * (i * height + j) + 4] = Math.floor((i + 1) * (height+1) + j + 1);
					triangles[6 * (i * height + j) + 5] = Math.floor((i + 1) * (height+1) + j + 0);

				}
			}
		}


		this.vertices=vertices;
		this.triangles=triangles;
		this.normals=normals;

	}
}


class Sphere extends Mesh {
	constructor(longitudes,latitudes) {
		var vertices=[];
		var triangles=[];
		var normals=[];

		var dX=2*Math.PI/longitudes;
		var dY=2*Math.PI/latitudes;
	
    for (var latNumber = 0; latNumber <= latitudes; latNumber++) {
      var theta = latNumber * Math.PI / latitudes;
      var sinTheta = Math.sin(theta);
      var cosTheta = Math.cos(theta);

      for (var longNumber = 0; longNumber <= longitudes; longNumber++) {
        var phi = longNumber * 2 * Math.PI / longitudes;
        var sinPhi = Math.sin(phi);
        var cosPhi = Math.cos(phi);

        var x = cosPhi * sinTheta;
        var y = cosTheta;
        var z = sinPhi * sinTheta;

        normals.push(x);
        normals.push(y);
        normals.push(z);
        vertices.push(x);
        vertices.push(y);
        vertices.push(z);
      }
    }

		for(var i=0; i<latitudes; i++) {
			for(var j=0; j<longitudes; j++) {
				var first = (i * (latitudes + 1)) + j;
        var second = first + latitudes + 1;
        triangles.push(first);
        triangles.push(second);
        triangles.push(first + 1);

        triangles.push(second);
        triangles.push(second + 1);
        triangles.push(first + 1);
			}
		}
		super(vertices,triangles,normals);
	}
}

class Cube extends Mesh {
	constructor() {
		var vertices=[
			// front face
			-0.5, -0.5,   0.5,
			 0.5, -0.5,   0.5,
			 0.5,  0.5,   0.5,
			-0.5,  0.5,   0.5,

			// back face
			-0.5, -0.5,  -0.5,
			-0.5,  0.5,  -0.5,
			 0.5,  0.5,  -0.5,
			 0.5, -0.5,  -0.5,

			// top face
			-0.5,  0.5,  -0.5,
			-0.5,  0.5,   0.5,
			 0.5,  0.5,   0.5,
			 0.5,  0.5,  -0.5,

			// bottom face
			-0.5, -0.5,  -0.5,
			 0.5, -0.5,  -0.5,
			 0.5, -0.5,   0.5,
			-0.5, -0.5,   0.5,

			// right face
			 0.5, -0.5,  -0.5,
			 0.5,  0.5,  -0.5,
			 0.5,  0.5,   0.5,
			 0.5, -0.5,   0.5,

			// left face
			-0.5, -0.5,  -0.5,
			-0.5, -0.5,   0.5,
			-0.5,  0.5,   0.5,
			-0.5,  0.5,  -0.5,
		];
		var triangles=[
			0, 1, 2,      0, 2, 3, 
			4, 5, 6,      4, 6, 7, 
			8, 9, 10,     8, 10, 11,  // Top face
			12, 13, 14,   12, 14, 15, // Bottom face
			16, 17, 18,   16, 18, 19, // Right face
			20, 21, 22,   20, 22, 23  // Left face	
		];
		var normals=[
			0,0,1,
			0,0,1,
			0,0,1,
			0,0,1,
			
			0,0,-1,
			0,0,-1,
			0,0,-1,
			0,0,-1,

			0,1,0,
			0,1,0,
			0,1,0,
			0,1,0,
			
			0,-1,0,
			0,-1,0,
			0,-1,0,
			0,-1,0,

			1,0,0,
			1,0,0,
			1,0,0,
			1,0,0,
			
			-1,0,0,
			-1,0,0,
			-1,0,0,
			-1,0,0,
		];

		super(vertices,triangles,normals);
	}
}


