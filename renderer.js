// This file is required by the index.html file and will
// be executed in the renderer process for that window.
// All of the Node.js APIs are available in this process.
var {ipcRenderer, remote, screen} = require('electron');
let canvas;
let ctx;
let canvasInit = false;
let isRecording = false;
let prev = {};
let lastDown;
let lastCircleStart;
let points = [];
let animationInterval = 50;

ipcRenderer.on('startRecording', (event, arg) => {
  canvasInit = true;
  isRecording = true;
  canvas = document.getElementById('wasd');
  canvas.width = document.body.clientWidth; //document.width is obsolete
  canvas.height = document.body.clientHeight; //document.height is obsolete
  ctx = canvas.getContext('2d');
});

ipcRenderer.on('stopRecording', (event, arg) => {
  isRecording = false;
});


ipcRenderer.on('mouse', (event, arg) => {  
  const newCoords = mapCoords(arg.x, arg.y);
  if (canvasInit && isRecording) {
    ctx.strokeStyle = 'black';
    drawLine(prev, newCoords)
    
    points.push({type: 'point', x: newCoords.x, y: newCoords.y})

    if (arg.type === 'down') {
      lastDown = new Date().getTime();
      lastCircleStart = newCoords;
    }
    
    if (arg.type === 'up') {
      const now = new Date().getTime();
      const r = (now - lastDown) / 50;
      drawCircle(lastCircleStart.x, lastCircleStart.y, r)
      points.push({type: 'circle', x: newCoords.x, y: newCoords.y, r})
    }
    
    prev = newCoords;
  }
});

ipcRenderer.on('animateStart', (event, arg) => {
  isRecording = false;
  ctx.clearRect(0, 0, document.body.clientWidth, document.body.clientHeight);
  
  let index = 1;
  let timer = setInterval(() => {
    walker(points, index);
    index++;
  }, animationInterval)
});

const walker = function(pointsArr, indexToStartWith) {
  const currPoint = pointsArr[indexToStartWith];
  if (currPoint.type === 'point') {
    drawLine(pointsArr[indexToStartWith - 1], currPoint)
  } else {
    drawCircle(currPoint.x, currPoint.y, currPoint.r)
  }

}

const drawLine = function (prevCoords, currCoords) {
  ctx.beginPath()
  ctx.moveTo(prevCoords.x, prevCoords.y)
  ctx.lineTo(currCoords.x, currCoords.y);
  ctx.stroke()
}

const drawCircle = function (x, y, r) {
  ctx.beginPath();
  ctx.arc(x, y, r, 0, 2 * Math.PI);
  ctx.stroke();
}

const mapCoords = function (x, y) {
  const {width, height} = screen.getPrimaryDisplay().workAreaSize
  const newX = bounds(x, 0, width, 0, document.body.clientWidth)
  const newY = bounds(y, 0, height, 0, document.body.clientHeight)
  return {x: newX, y: newY}
}

const bounds = function(n, start1, stop1, start2, stop2, withinBounds) {
  var newval = (n - start1) / (stop1 - start1) * (stop2 - start2) + start2;
  if (!withinBounds) {
    return newval;
  }
  if (start2 < stop2) {
    return constrain(newval, start2, stop2);
  } else {
    return constrain(newval, stop2, start2);
  }
};

const constrain = function(n, low, high) {
  return Math.max(Math.min(n, high), low);
}