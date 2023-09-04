const canvasEl = document.querySelector("#ring_shape-canvas");
const pageEl = document.querySelector(".page");
const switchEl = document.querySelector("#transparency-switch");

const uniforms = {
    timeLocation: null,
    ratioLocation: null,
    clickTimeLocation: null,
    pointerLocation: null,
    clickLocation: null,
    transparencyLocation: null
}

let clickTime = 0;
const mouseThreshold = .6;
let wasClicked = false;

let mouse = {
    x: -.5 * window.innerWidth,
    y: .5 * window.innerHeight,
    tX: -.5 * window.innerWidth,
    tY: .5 * window.innerHeight,
}

const gl = initShader();

render();
window.addEventListener("resize", resizeCanvas);
resizeCanvas();

window.addEventListener("mousemove", e => {
    updateMousePosition(e.pageX, e.pageY);
});
window.addEventListener("touchmove", e => {
    updateMousePosition(e.targetTouches[0].pageX, e.targetTouches[0].pageY);
});
pageEl.addEventListener("click", e => {
    if (e.target !== switchEl && e.target.parentNode !== switchEl.parentNode) {
        updateMousePosition(e.pageX, e.pageY);
        gl.uniform2f(uniforms.clickLocation, mouse.x / window.innerWidth, 1. - mouse.y / window.innerHeight);
        wasClicked = true;
        clickTime = performance.now();
    }
});

function updateMousePosition(eX, eY) {
    mouse.tX = eX;
    mouse.tY = eY;
}


switchEl.addEventListener('change', function () {
    if (switchEl.checked) {
        gl.uniform1f(uniforms.transparencyLocation, 1);
        pageEl.style.color = "#333333";
    } else {
        gl.uniform1f(uniforms.transparencyLocation, 0);
        pageEl.style.color = "#eeeeee";
    }
});

function initShader() {
    const vsSource = document.getElementById("vertShader").innerHTML;
    const fsSource = document.getElementById("fragShader").innerHTML;

    const gl = canvasEl.getContext("webgl") || canvasEl.getContext("experimental-webgl");

    if (!gl) {
        alert("WebGL is not supported by your browser.");
    }

    function createShader(gl, sourceCode, type) {
        const shader = gl.createShader(type);
        gl.shaderSource(shader, sourceCode);
        gl.compileShader(shader);

        if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
            console.error("An error occurred compiling the shaders: " + gl.getShaderInfoLog(shader));
            gl.deleteShader(shader);
            return null;
        }

        return shader;
    }

    const vertexShader = createShader(gl, vsSource, gl.VERTEX_SHADER);
    const fragmentShader = createShader(gl, fsSource, gl.FRAGMENT_SHADER);

    function createShaderProgram(gl, vertexShader, fragmentShader) {
        const program = gl.createProgram();
        gl.attachShader(program, vertexShader);
        gl.attachShader(program, fragmentShader);
        gl.linkProgram(program);

        if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
            console.error("Unable to initialize the shader program: " + gl.getProgramInfoLog(program));
            return null;
        }

        return program;
    }

    const shaderProgram = createShaderProgram(gl, vertexShader, fragmentShader);

    const vertices = new Float32Array([-1., -1., 1., -1., -1., 1., 1., 1.]);

    const vertexBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STATIC_DRAW);

    gl.useProgram(shaderProgram);

    const positionLocation = gl.getAttribLocation(shaderProgram, "a_position");
    gl.enableVertexAttribArray(positionLocation);

    gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
    gl.vertexAttribPointer(positionLocation, 2, gl.FLOAT, false, 0, 0);

    uniforms.timeLocation = gl.getUniformLocation(shaderProgram, "u_time");
    uniforms.ratioLocation = gl.getUniformLocation(shaderProgram, "u_ratio");
    uniforms.clickTimeLocation = gl.getUniformLocation(shaderProgram, "u_click_time");
    uniforms.pointerLocation = gl.getUniformLocation(shaderProgram, "u_pointer");
    uniforms.clickLocation = gl.getUniformLocation(shaderProgram, "u_click");
    uniforms.transparencyLocation = gl.getUniformLocation(shaderProgram, "u_transparency");

    return gl;
}

function render() {
    const currentTime = performance.now();

    gl.uniform1f(uniforms.timeLocation, currentTime);
    if (wasClicked) {
        gl.uniform1f(uniforms.clickTimeLocation, currentTime - clickTime);
    }

    gl.clearColor(0.0, 0.0, 0.0, 1.0);
    gl.clear(gl.COLOR_BUFFER_BIT);
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);

    mouse.x += (mouse.tX - mouse.x) * mouseThreshold;
    mouse.y += (mouse.tY - mouse.y) * mouseThreshold;

    gl.uniform2f(uniforms.pointerLocation, mouse.x / window.innerWidth, 1. - mouse.y / window.innerHeight);

    requestAnimationFrame(render);
}

function resizeCanvas() {
    canvasEl.width = window.innerWidth;
    canvasEl.height = window.innerHeight;
    gl.viewport(0, 0, canvasEl.width, canvasEl.height);
    gl.uniform1f(uniforms.ratioLocation, window.innerWidth / window.innerHeight);
}