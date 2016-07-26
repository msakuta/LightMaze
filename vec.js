/// @file
/// @brief A basic vector arithmetic library
///
/// We could use existing framework of linear algebra, but it's enough for now.


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

/// Squared length of a vector
function vecslen(v){
	return vecdot(v,v)
}

/// Length of a vector
function veclen(v){
	return Math.sqrt(vecslen(v))
}

/// Vector 2D distance
function vecdist(v1,v2){
	var dx = v1[0] - v2[0], dy = v1[1] - v2[1];
	return Math.sqrt(dx * dx + dy * dy);
}

function vecnorm(v){
	return vecscale(v, 1 / veclen(v));
}

function vecdot(v1,v2){
	return v1[0] * v2[0] + v1[1] * v2[1]
}

/// @brief Calculates product of an (augumented) matrix and a vector
function matvp(ma,vb){
	var ret = []
	for(var j = 0; j < 2; j++){
		var val = 0;
		for(var k = 0; k < 2; k++)
			val += ma[k * 2 + j] * vb[k];
		val += ma[2 * 2 + j];
		ret[j] = val;
	}
	return ret
}

/// \brief Calculates product of matrices
///
/// Note that this function assumes arguments augmented matrices, see http://en.wikipedia.org/wiki/Augmented_matrix
/// The least significant suffix is rows.
/// To put it simply, array of coefficients as the same order as parameters to canvas.setTransform().
function matmp(a,b){
	var ret = new Array(6);
	for(var i = 0; i < 3; i++){
		for(var j = 0; j < 2; j++){
			var val = 0;
			for(var k = 0; k < 2; k++)
				val += a[k * 2 + j] * b[i * 2 + k];
			if(i === 2)
				val += a[2 * 2 + j];
			ret[i * 2 + j] = val;
		}
	}
	return ret;
}

function matscale(m,s){
	return [m[0] / s, m[1] / s, m[2] / s, m[3] / s, m[4] / s, m[5] / s]
}

/// @brief Compute inverse of an augmented matrix
function matinv(m){
	var det = m[0] * m[3] - m[1] * m[2]
	if(det === 0)
		return false
	var ret = [m[0] / det, -m[2], -m[1] / det, m[3] / det, 0, 0]
	var ofs = matvp(ret,[m[4], m[5]])
	ret[4] = -ofs[0]
	ret[5] = -ofs[1]
	return ret
}


/// A generic algorithm to determine if a ray hits a circls' border.
/// @param src The ray source position.
/// @param dir The direction of the ray.
/// @param dt The delta-time, or, length of the ray to check.
/// @param obj The center point of the circle.
/// @param radius The radius of the circle.
function jHitCircle(src,dir,dt,obj,radius){
	var del = vecsub(src, obj);

	/* scalar product of the ray and the vector. */
	var b = vecdot(dir, del);

	var dirslen = vecslen(dir);
	var c = dirslen * (vecslen(del) - radius * radius);

	/* Discriminant */
	var D = b * b - c;
	if(D <= 0)
		return [false];

	var d = Math.sqrt(D);

	/* Avoid zerodiv */
	if(dirslen == 0.)
		return [false];
	var t0 = (-b - d) / dirslen;
	var t1 = (-b + d) / dirslen;

	return [0. <= t1 && t0 < dt, 0 <= t0 && t0 < dt ? t0 : t1];
}
