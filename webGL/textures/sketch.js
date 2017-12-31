/* jshint esversion: 6 */
let angle = 0;
let img;
let capture;

function setup() {
	createCanvas(400,400,WEBGL);
	capture = createCapture(VIDEO);
  	capture.size(320, 240);
}

function preload() {
	img = loadImage('https://i0.wp.com/deathensemble.com/blog/wp-content/uploads/2013/08/Christopher-Lloyd-as-Doc-Brown.jpg');
}

function draw() {
	background(175);
	let dx = mouseX - width / 2;
	let dy = mouseY - height / 2;
	let v = createVector(dx, dy, 0);
	v.div(100);
	ambientLight(150, 150, 150);
	directionalLight(255, 255, 255, v);
	rotateX(angle);
	rotateY(angle * 0.3);
	rotateZ(angle * 1.2);

	noStroke();
	//ambientMaterial(255);
	texture(img);

	box(200,200);

	angle += 0.003;
}