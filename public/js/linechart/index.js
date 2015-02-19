//module.exports = canvasLineChart;

// var elem = document.createElement('canvas');
//setInterval(function() {
// canvasLineChart(elem, [[0, 0], [20, 5]], [10, 5]);

//=elem

function canvasLineChart(c, width, data, base, marker, step) {
  width = 200 * 2;
  var height = 30 * 2;
  var chartHeight = 18 * 2;
  c.width = width;
  c.height = height;
  c.style.width = width/2 + 'px';
  c.style.height = height/2 + 'px';

  var margin = 8;

  var ctx = c.getContext('2d');
  ctx.fillStyle = 'transparent';
  ctx.fillRect(0, 0, width, height);

  // draw 20 x axis ticks
  ctx.fillStyle = 'rgba(0,0,0,0.05)';
  for (var i = 0; i < 21; i++) {
    ctx.fillRect(xScale(i), 0, 4, chartHeight + margin);
  }

  var yScale = (function() {
    var yMax = data.reduce(function(memo, d) {
      return Math.max(d[1], memo);
    }, -Infinity);
    var yMin = data.reduce(function(memo, d) {
      return Math.min(d[1], memo);
    }, Infinity);
    return function(_) {
      var scaled = (_ - yMin) / ((yMax - yMin) || 1);
      return (chartHeight - (scaled * (chartHeight - margin)));
    };
  })();

  function xScale(_) {
    return ~~(((_ / 20) * (width - margin*2)) + margin);
  }

  function curveMidpoint(a, b) {
    var mx = a[0] + (b[0]-a[0]) / 2;
    var t = base === 1 ?
      (mx - a[0]) / (b[0] - a[0]) :
      (Math.pow(base, mx - a[0]) - 1) / (Math.pow(base, b[0] - a[0]) - 1);
    var my = (a[1] * (1 - t)) + (b[1] * t);
    return [mx, my];
  }

  function getControlPoints(a, b){
    // thanks to http://scaledinnovation.com/analytics/splines/aboutSplines.html
    var c = curveMidpoint(a, b);
    var x0 = a[0], y0 = a[1], x1 = c[0], y1 = c[1], x2 = b[0], y2 = b[1], t=0.5;
    var d01 = Math.sqrt(Math.pow(x1 - x0, 2) + Math.pow(y1 - y0, 2));
    var d12 = Math.sqrt(Math.pow(x2 - x1, 2)+Math.pow(y2 - y1, 2));
    var fa = t * d01 / (d01 + d12);
    var fb = t * d12 / (d01 + d12);
    var p1x = x1 - fa * (x2 - x0);
    var p1y = y1 - fa * (y2 - y0);
    var p2x = x1 + fb * (x2 - x0);
    var p2y = y1 + fb * (y2 - y0);
    return [[p1x, p1y], [p2x, p2y]];
  }

  // draw the data line
  ctx.strokeStyle = '#777';
  ctx.lineWidth = 4;

  data.forEach(function(d, i) {
    if (i === 0) ctx.lineTo(xScale(d[0]), yScale(d[1]));
    else if (step) {
      ctx.lineTo(xScale(d[0]), yScale(data[i-1][1]));
      ctx.lineTo(xScale(d[0]), yScale(d[1]));
    } else {
      var cp = getControlPoints(data[i-1], d);
      ctx.bezierCurveTo(xScale(cp[0][0]), yScale(cp[0][1]),
        xScale(cp[1][0]), yScale(cp[1][1]),
        xScale(d[0]), yScale(d[1]));
    }
  });
  ctx.stroke();

  if (marker) {
    ctx.fillStyle = '#3bb2d0';
    ctx.fillRect(xScale(marker[0]), 0, 3, chartHeight + margin);
  }

  ctx.fillStyle = '#fff';
  ctx.lineWidth = 4;
  data.forEach(function(data, i) {
    ctx.beginPath();
    ctx.strokeStyle = '#777';
    var r = 5;
    if (data[2] && data[2].focus) {
      ctx.strokeStyle = '#3bb2d0';
      r = 6;
    }
    if (!data[2] || !data[2].end) ctx.arc(xScale(data[0]), yScale(data[1]), r, 0, 2 * Math.PI, false);
    ctx.fill();
    ctx.stroke();
  });


  if (marker) {
    var xAnchor = xScale(marker[0]);
    if (xAnchor < 20) xAnchor = 20;
    if (xAnchor > (width - 20)) xAnchor = width - 20;
    ctx.fillStyle = '#3bb2d0';
    ctx.font = 'bold 20px monospace';
    ctx.textAlign = 'center';
    ctx.fillText('' + marker[1], xAnchor, chartHeight + 22);
  }
}
