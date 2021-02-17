let draw = false;
let x = 0;
let y = 0;

const signCanvas = document.getElementById("signCanvas");
const inputDataUrl = document.getElementById("forDataUrl");
const context = signCanvas.getContext("2d");

signCanvas.addEventListener("mousedown", (e) => {
    x = e.offsetX;
    y = e.offsetY;
    draw = true;
});

signCanvas.addEventListener("mousemove", (e) => {
    if (draw === true) {
        drawSign(context, x, y, e.offsetX, e.offsetY);
        x = e.offsetX;
        y = e.offsetY;
    }
});

signCanvas.addEventListener("mouseup", (e) => {
    if (draw === true) {
        drawSign(context, x, y, e.offsetX, e.offsetY);
        x = 0;
        y = 0;
        draw = false;
    }
    let dataUrl = signCanvas.toDataURL();
    inputDataUrl.value = dataUrl;
});

function drawSign(context, x, y, offX, offY) {
    context.beginPath();
    context.strokestyle = "black";
    context.linewidth = 1;
    context.moveTo(x, y);
    context.lineTo(offX, offY);
    context.stroke();
    context.closePath();
}
