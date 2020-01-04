/* jshint esversion: 6 */
let angle = 0;
let img;
let capt;

function setup() {
	createCanvas(400, 400, WEBGL);
	capt = createCapture(VIDEO);
  	capt.size(320, 320);
  	capt.hide();
}

function draw() {
	background(175);
	let dx = mouseX - width / 2;
	let dy = mouseY - height / 2;
	let v = createVector(dx, dy, 0);
	v.div(100);
	ambientLight(150, 150, 150);
	directionalLight(255, 255, 255, v);
	
	push();
	rotateX(angle);
	rotateY(angle * 0.3);
	rotateZ(angle * 1.2);

	noStroke();
	//ambientMaterial(255);
	texture(capt);
	box(100);
	pop();

	translate(0,100);
	rotateX(HALF_PI);
	ambientMaterial(0, 255, 0);
	plane(500, 500);

	angle += 0.03;
}