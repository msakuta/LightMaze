
/// Custom inheritance function that prevents the super class's constructor
/// from being called on inehritance.
/// Also assigns constructor property of the subclass properly.
/// @param subclass The constructor of subclass that should be inherit base
/// @param base The constructor of the base class which subclass's prototype should point to.
/// @param methods Optional argument for a table containing methods to define for subclass.
///                The table is mixed-in to subclass, so it won't be a base class of subclass.
function inherit(subclass,base,methods){
	// If the browser or ECMAScript supports Object.create, use it
	// (but don't remember to redirect constructor pointer to subclass)
	if(Object.create){
		subclass.prototype = Object.create(base.prototype);
	}
	else{
		var sub = function(){};
		sub.prototype = base.prototype;
		subclass.prototype = new sub;
	}
	if(methods)
		mixin(subclass.prototype, methods);
	subclass.prototype.constructor = subclass;
}

/// \brief Calculates parallel and perpendicular unit vectors against difference of given vectors.
/// \param para Buffer for returning vector parallel to difference of pos and dpos and have a unit length
/// \param perp Buffer for returning vector perpendicular to para and have a unit length
/// \param pos Input vector for the starting point
/// \param dpos Input vector for the destination point
/// \returns Distance of the given vectors
function calcPerp(para, perp, pos, dpos){
	perp[0] = pos[1] - dpos[1];
	perp[1] = -(pos[0] - dpos[0]);
	var norm = Math.sqrt(perp[0] * perp[0] + perp[1] * perp[1]);
	perp[0] /= norm;
	perp[1] /= norm;
	if(para !== null){
		para[0] = -(pos[0] - dpos[0]) / norm;
		para[1] = -(pos[1] - dpos[1]) / norm;
	}
	return norm;
}



/// A pseudo-random number generator distributed in Poisson distribution.
/// It uses Knuth's algorithm, which is not optimal when lambda gets
/// so high.  We probably should use an approximation.
function poissonRandom(rng,lambda){
	var L = Math.exp(-lambda);
	var k = 0;
	var p = 1;
	do{
		k++;
		p *= rng.next();
	}while(L < p);
	return k - 1;
}

/// Vector 2D addition
function vecadd(v1,v2){
	return [v1[0] + v2[0], v1[1] + v2[1]];
}

/// Vector 2D subtraction
function vecsub(v1,v2){
	return [v1[0] - v2[0], v1[1] - v2[1]];
}

/// Vector 2D scale
function vecscale(v1,s2){
	return [v1[0] * s2, v1[1] * s2];
}

/// Vector 2D distance
function vecdist(v1,v2){
	var dx = v1[0] - v2[0], dy = v1[1] - v2[1];
	return Math.sqrt(dx * dx + dy * dy);
}

function vecdot(v1,v2){
	return v1[0] * v2[0] + v1[1] * v2[1]
}



function Instrument(x,y,angle){
	this.x = x;
	this.y = y;
	this.angle = angle || 0;
}

Instrument.prototype.update = function(){

}

Instrument.prototype.getPos = function(){
	return [this.x, this.y];
}

function Mirror(x,y,angle){
	Instrument.call(this,x,y,angle);
}
inherit(Mirror, Instrument)

Mirror.prototype.getNormal = function(){
	return [Math.cos(this.angle), Math.sin(this.angle)]
}

function LaserSource(x,y,angle){
	Instrument.call(this,x,y,angle);
}
inherit(LaserSource, Instrument)

LaserSource.prototype.update = function(dt){
	this.angle = (this.angle + 0.01 * dt * Math.PI) % (2 * Math.PI)
}

function LaserSensor(x,y,angle){
	Instrument.call(this,x,y,angle);
}
inherit(LaserSensor, Instrument)

// Wall segment
function Wall(x0,y0,x1,y1){
	this.x0 = x0;
	this.y0 = y0;
	this.x1 = x1;
	this.y1 = y1;
}

Wall.prototype.getNormal = function(){
	var length = vecdist([this.x0, this.y0], [this.x1, this.y1])
	return vecscale([this.y1 - this.y0, -(this.x1 - this.x0)], 1 / length)
}

function Graph(width, height){
	//this.rng = new Xor128(); // Create Random Number Generator
	//var rng = this.rng;
	this.instruments = [];

	this.instruments.push(new Mirror(100,150,Math.PI/4));
	this.instruments.push(new Mirror(150,250,Math.PI/2));
	this.instruments.push(new LaserSource(250,100,Math.PI/6))
	this.instruments.push(new LaserSource(200,150,Math.PI*5/6))
	this.instruments.push(new LaserSensor(70,250,-Math.PI/6))

	this.walls = [];

	this.walls.push(new Wall(50,50,400,50));
	this.walls.push(new Wall(400,50,300,300));
	this.walls.push(new Wall(300,300,50,300));
	this.walls.push(new Wall(50,50,50,300));
}

Graph.prototype.global_time = 0;

Graph.prototype.update = function(dt){
	var global_time = Graph.prototype.global_time;

	for(var i = 0; i < this.instruments.length; i++){
		this.instruments[i].update(dt);
	}

//	invokes++;
	Graph.prototype.global_time += dt;
}

Graph.prototype.rayTrace = function(x,y,dx,dy){
	var r0 = [x,y]
	var d = [dx,dy]
	var bestt = 1e6
	var endpoint
	var bestn

	// First pass scans walls
	for(var i = 0; i < this.walls.length; i++){
		var wall = this.walls[i]
		var n = wall.getNormal()
		var rr = vecsub(r0, [wall.x0, wall.y0])
		var dotn = vecdot(rr, n)
		// Almost parallel
		if(Math.abs(dotn) < 1e-3)
			continue
		var t = -dotn / vecdot(d,n)
		if(1e-6 <= t && t < bestt){
			bestt = t
			endpoint = vecadd(vecscale(d,t), r0)
			bestn = n
		}
	}

	// Now scan the instrument mirrors
	for(var i = 0; i < this.instruments.length; i++){
		var inst = this.instruments[i]
		if(!(inst instanceof Mirror))
			continue
		var n = inst.getNormal()
		var rr = vecsub(r0, [inst.x, inst.y])
		var dotn = vecdot(rr, n)
		// Almost parallel
		if(Math.abs(dotn) < 1e-3)
			continue
		var t = -dotn / vecdot(d,n)
		var iendpoint = vecadd(vecscale(d,t), r0)
		if(1e-6 <= t && t < bestt && vecdist([inst.x, inst.y], iendpoint) < 15){
			bestt = t
			endpoint = iendpoint
			bestn = n
		}
	}

	return [bestt, endpoint, bestn]
}
