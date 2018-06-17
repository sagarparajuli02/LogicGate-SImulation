var $$ = window.jQuery;
var logicBoard;
window.loaded = { "class": "go.GraphLinksModel",
"linkFromPortIdProperty": "fromPort",
"linkToPortIdProperty": "toPort",
"nodeDataArray": [ 
{"category":"input", "key":"input1", "loc":"-290 10"},
{"category":"or", "key":"or1", "loc":"-70 0"},
{"category":"not", "key":"not1", "loc":"10 0"},
{"category":"xor", "key":"xor1", "loc":"40 120"},
{"category":"or", "key":"or2", "loc":"260 -60"},
{"category":"xnor", "key":-9, "loc":"-180 -180"},
{"category":"input", "key":-1, "loc":"-300 -80"},
{"category":"output", "key":-2, "loc":"280 -150"}
],
"linkDataArray": [ 
{"from":"input1", "fromPort":"out", "to":"or1", "toPort":"in1"},
{"from":"or1", "fromPort":"out", "to":"not1", "toPort":"in"},
{"from":"not1", "fromPort":"out", "to":"or1", "toPort":"in2"},
{"from":"not1", "fromPort":"out", "to":"xor1", "toPort":"in1"},
{"from":"xor1", "fromPort":"out", "to":"or2", "toPort":"in1"},
{"from":"or2", "fromPort":"out", "to":"xor1", "toPort":"in2"},
{"from":"input1", "to":-9, "fromPort":"", "toPort":"in2"},
{"from":-1, "to":-9, "fromPort":"", "toPort":"in1"},
{"from":-9, "to":"or2", "fromPort":"out", "toPort":"in2"},
{"from":"or2", "to":-2, "fromPort":"out", "toPort":""}
]};
var palette = new go.Palette("palette-sidebar");
var $ = go.GraphObject.make;
var currentCircuit = null;

//Logics
var red = 'gray';
var green = 'forestgreen';

logicBoard =
  $(go.Diagram, "diagram",  // create a new Diagram in the HTML DIV element "myDiagramDiv"
    {
      initialContentAlignment: go.Spot.Center,
      allowDrop: true,  // Nodes from the Palette can be dropped into the Diagram
      "draggingTool.isGridSnapEnabled": true,  // dragged nodes will snap to a grid of 10x10 cells
      "undoManager.isEnabled": true,
      "toolManager.hoverDelay": 100,
    }
  );

function ZoomIn(level) {
  var max = 2.5;
  var current = logicBoard.scale;
  if (current < max) {
    current += 0.25;
  } else {
    current = max;
  }
  logicBoard.scale = current;
}

function ZoomOut(level) {
  var min = 0.25;
  var current = logicBoard.scale;
  if (current > min) {
    current -= 0.25;
  } else {
    current = min;
  }
  logicBoard.scale = current;
}

var u = document.getElementById('diagram');
var t = document.createElement('div');
var ui = document.createElement('div');
var uo = document.createElement('div');
var zoomIn = document.createElement('i');
var zoomOut = document.createElement('i');
t.className = 'zoom-holder';
uo.classList = 'left text-center';
ui.className = 'right';
zoomIn.classList = 'fa fa-search-plus';
zoomOut.classList = 'fa fa-search-minus';

uo.addEventListener('click', function (e) {
  e.preventDefault();
  ZoomIn();
})

ui.addEventListener('click', function (e) {
  e.preventDefault();
  ZoomOut();
})

uo.appendChild(zoomIn);
ui.appendChild(zoomOut);
t.appendChild(uo);
t.appendChild(ui);
u.appendChild(t);

var redo = document.getElementById('redo');
var undo = document.getElementById('undo');
var _clear = document.getElementById('_clear');

_clear.addEventListener('click', function (e) {
  e.preventDefault();
  logicBoard.clear();
});

undo.addEventListener('click', function () {
  if (undo.disabled == true) return;
  logicBoard.commandHandler.undo();
  if (logicBoard.undoManager.canRedo() == true)
    redo.disabled = false;
  if (logicBoard.undoManager.canUndo() == false)
    undo.disabled = true;
});


redo.addEventListener('click', function () {
  if (redo.disabled == true) return;
  logicBoard.commandHandler.redo();
  if (logicBoard.undoManager.canUndo() == true)
    undo.disabled = false;
  if (logicBoard.undoManager.canRedo() == false)
    redo.disabled = true;
});

var saveer = document.getElementById('save');
saveer.addEventListener('click', save);

var loader = document.getElementById('loadButton');
loader.addEventListener('change', function (e) {
  console.log('event Tiggred');
  if (loader.files[0] == '') return;
  var reader = new FileReader();
  reader.onload = function(){
    var dataMODEL = reader.result;
    load(JSON.parse(dataMODEL));
  };
  reader.readAsText(loader.files[0]);
  var u = loader.parentElement;
  console.log(u);
  u.reset();
})

var loads = document.getElementById('load');
loads.addEventListener('click', function (e) {
  loader.click();
})




logicBoard.addDiagramListener("Modified", function (e) {
  undo.disabled = false;
  var button = document.getElementById("save");
  if (button) button.disabled = !logicBoard.isModified;
  var idx = document.title.indexOf("*");
  if (logicBoard.isModified) {
    if (idx < 0) document.title += "*";
  } else {
    if (idx >= 0) document.title = document.title.substr(0, idx);
  }
});

logicBoard.linkTemplate =
  $(go.Link,
    {
      routing: go.Link.AvoidsNodes,
      curve: go.Link.JumpOver,
      corner: 3,
      relinkableFrom: true, relinkableTo: true,
      selectionAdorned: false, // Links are not adorned when selected so that their color remains visible.
      shadowOffset: new go.Point(0, 0), shadowBlur: 5, shadowColor: "blue",
    },
    new go.Binding("isShadowed", "isSelected").ofObject(),
    $(go.Shape, { name: "SHAPE", strokeWidth: 2, stroke: red })
  );

var sharedToolTip =
  $(go.Adornment, "Auto",
    $(go.Shape, "RoundedRectangle", { fill: "lightyellow" }),
    $(go.TextBlock, { margin: 2 },
      new go.Binding("text", "", function (d) { return d.category; })
    )
  );

function nodeStyle() {
  return [new go.Binding("location", "loc", go.Point.parse).makeTwoWay(go.Point.stringify),
  new go.Binding("isShadowed", "isSelected").ofObject(),
  {
    selectionAdorned: false,
    shadowOffset: new go.Point(0, 0),
    shadowBlur: 15,
    shadowColor: "blue",
    toolTip: sharedToolTip
  }];
}

function shapeStyle() {
  return {
    name: "NODESHAPE",
    fill: "white",
    stroke: "black",
    desiredSize: new go.Size(40, 40),
    strokeWidth: 2
  };
}

function portStyle(input) {
  return {
    desiredSize: new go.Size(6, 6),
    fill: "black",
    fromSpot: go.Spot.Right,
    fromLinkable: !input,
    toSpot: go.Spot.Left,
    toLinkable: input,
    toMaxLinks: 1,
    cursor: "pointer"
  };
}

var inputTemplate =
  $(go.Node, "Spot", nodeStyle(),
    $(go.Shape, "Circle", shapeStyle(),
      { fill: red }),  // override the default fill (from shapeStyle()) to be red
    $(go.Shape, "Rectangle", portStyle(false),  // the only port
      { portId: "", alignment: new go.Spot(1, 0.5) }),
    { // if double-clicked, an input node will change its value, represented by the color.
      doubleClick: function (e, obj) {
        e.diagram.startTransaction("Toggle Input");
        var shp = obj.findObject("NODESHAPE");
        shp.fill = (shp.fill === green) ? red : green;
        updateStates();
        e.diagram.commitTransaction("Toggle Input");
      }
    }
  );

var outputTemplate =
  $(go.Node, "Spot", nodeStyle(),
    $(go.Shape, "Rectangle", shapeStyle(),
      { fill: green }),  // override the default fill (from shapeStyle()) to be green
    $(go.Shape, "Rectangle", portStyle(true),  // the only port
      { portId: "", alignment: new go.Spot(0, 0.5) })
  );

var andTemplate =
  $(go.Node, "Spot", nodeStyle(),
    $(go.Shape, "AndGate", shapeStyle()),
    $(go.Shape, "Rectangle", portStyle(true),
      { portId: "in1", alignment: new go.Spot(0, 0.3) }),
    $(go.Shape, "Rectangle", portStyle(true),
      { portId: "in2", alignment: new go.Spot(0, 0.7) }),
    $(go.Shape, "Rectangle", portStyle(false),
      { portId: "out", alignment: new go.Spot(1, 0.5) })
  );

var orTemplate =
  $(go.Node, "Spot", nodeStyle(),
    $(go.Shape, "OrGate", shapeStyle()),
    $(go.Shape, "Rectangle", portStyle(true),
      { portId: "in1", alignment: new go.Spot(0.16, 0.3) }),
    $(go.Shape, "Rectangle", portStyle(true),
      { portId: "in2", alignment: new go.Spot(0.16, 0.7) }),
    $(go.Shape, "Rectangle", portStyle(false),
      { portId: "out", alignment: new go.Spot(1, 0.5) })
  );

var xorTemplate =
  $(go.Node, "Spot", nodeStyle(),
    $(go.Shape, "XorGate", shapeStyle()),
    $(go.Shape, "Rectangle", portStyle(true),
      { portId: "in1", alignment: new go.Spot(0.26, 0.3) }),
    $(go.Shape, "Rectangle", portStyle(true),
      { portId: "in2", alignment: new go.Spot(0.26, 0.7) }),
    $(go.Shape, "Rectangle", portStyle(false),
      { portId: "out", alignment: new go.Spot(1, 0.5) })
  );

var norTemplate =
  $(go.Node, "Spot", nodeStyle(),
    $(go.Shape, "NorGate", shapeStyle()),
    $(go.Shape, "Rectangle", portStyle(true),
      { portId: "in1", alignment: new go.Spot(0.16, 0.3) }),
    $(go.Shape, "Rectangle", portStyle(true),
      { portId: "in2", alignment: new go.Spot(0.16, 0.7) }),
    $(go.Shape, "Rectangle", portStyle(false),
      { portId: "out", alignment: new go.Spot(1, 0.5) })
  );

var xnorTemplate =
  $(go.Node, "Spot", nodeStyle(),
    $(go.Shape, "XnorGate", shapeStyle()),
    $(go.Shape, "Rectangle", portStyle(true),
      { portId: "in1", alignment: new go.Spot(0.26, 0.3) }),
    $(go.Shape, "Rectangle", portStyle(true),
      { portId: "in2", alignment: new go.Spot(0.26, 0.7) }),
    $(go.Shape, "Rectangle", portStyle(false),
      { portId: "out", alignment: new go.Spot(1, 0.5) })
  );

var nandTemplate =
  $(go.Node, "Spot", nodeStyle(),
    $(go.Shape, "NandGate", shapeStyle()),
    $(go.Shape, "Rectangle", portStyle(true),
      { portId: "in1", alignment: new go.Spot(0, 0.3) }),
    $(go.Shape, "Rectangle", portStyle(true),
      { portId: "in2", alignment: new go.Spot(0, 0.7) }),
    $(go.Shape, "Rectangle", portStyle(false),
      { portId: "out", alignment: new go.Spot(1, 0.5) })
  );

var notTemplate =
  $(go.Node, "Spot", nodeStyle(),
    $(go.Shape, "Inverter", shapeStyle()),
    $(go.Shape, "Rectangle", portStyle(true),
      { portId: "in", alignment: new go.Spot(0, 0.5) }),
    $(go.Shape, "Rectangle", portStyle(false),
      { portId: "out", alignment: new go.Spot(1, 0.5) })
  );

logicBoard.nodeTemplateMap.add("input", inputTemplate);
logicBoard.nodeTemplateMap.add("output", outputTemplate);
logicBoard.nodeTemplateMap.add("and", andTemplate);
logicBoard.nodeTemplateMap.add("or", orTemplate);
logicBoard.nodeTemplateMap.add("xor", xorTemplate);
logicBoard.nodeTemplateMap.add("not", notTemplate);
logicBoard.nodeTemplateMap.add("nand", nandTemplate);
logicBoard.nodeTemplateMap.add("nor", norTemplate);
logicBoard.nodeTemplateMap.add("xnor", xnorTemplate);

palette.nodeTemplateMap = logicBoard.nodeTemplateMap;

palette.model.nodeDataArray = [
  { category: "input" },
  { category: "output" },
  { category: "and" },
  { category: "or" },
  { category: "xor" },
  { category: "not" },
  { category: "nand" },
  { category: "nor" },
  { category: "xnor" }
];


load(JSON.stringify(window.loaded));

loop();

function loop() {
  setTimeout(function () { updateStates(); loop(); }, 250);
}

function updateStates() {
  var oldskip = logicBoard.skipsUndoManager;
  logicBoard.skipsUndoManager = true;
  // do all "input" nodes first
  logicBoard.nodes.each(function (node) {
    if (node.category === "input") {
      doInput(node);
    }
  });
  // now we can do all other kinds of nodes
  logicBoard.nodes.each(function (node) {
    switch (node.category) {
      case "and": doAnd(node); break;
      case "or": doOr(node); break;
      case "xor": doXor(node); break;
      case "not": doNot(node); break;
      case "nand": doNand(node); break;
      case "nor": doNor(node); break;
      case "xnor": doXnor(node); break;
      case "output": doOutput(node); break;
      case "input": break;  // doInput already called, above
    }
  });
  logicBoard.skipsUndoManager = oldskip;
}

// helper predicate
function linkIsTrue(link) {  // assume the given Link has a Shape named "SHAPE"
  return link.findObject("SHAPE").stroke === green;
}

// helper function for propagating results
function setOutputLinks(node, color) {
  node.findLinksOutOf().each(function (link) { link.findObject("SHAPE").stroke = color; });
}

// update nodes by the specific function for its type
// determine the color of links coming out of this node based on those coming in and node type

function doInput(node) {
  // the output is just the node's Shape.fill
  setOutputLinks(node, node.findObject("NODESHAPE").fill);
}

function doAnd(node) {
  var color = node.findLinksInto().all(linkIsTrue) ? green : red;
  setOutputLinks(node, color);
}
function doNand(node) {
  var color = !node.findLinksInto().all(linkIsTrue) ? green : red;
  setOutputLinks(node, color);
}
function doNot(node) {
  var color = !node.findLinksInto().all(linkIsTrue) ? green : red;
  setOutputLinks(node, color);
}

function doOr(node) {
  var color = node.findLinksInto().any(linkIsTrue) ? green : red;
  setOutputLinks(node, color);
}
function doNor(node) {
  var color = !node.findLinksInto().any(linkIsTrue) ? green : red;
  setOutputLinks(node, color);
}

function doXor(node) {
  var truecount = 0;
  node.findLinksInto().each(function (link) { if (linkIsTrue(link)) truecount++; });
  var color = truecount % 2 === 0 ? green : red;
  setOutputLinks(node, color);
}
function doXnor(node) {
  var truecount = 0;
  node.findLinksInto().each(function (link) { if (linkIsTrue(link)) truecount++; });
  var color = truecount % 2 !== 0 ? green : red;
  setOutputLinks(node, color);
}

function doOutput(node) {
  // assume there is just one input link
  // we just need to update the node's Shape.fill
  node.linksConnected.each(function (link) {
    node.findObject("NODESHAPE").fill = link.findObject("SHAPE").stroke;
  });
}

function load(jsons) {
  currentCircuit = jsons;
  logicBoard.model = go.Model.fromJson(jsons);
}

function save() {
  currentCircuit = JSON.stringify(logicBoard.model.toJson());
  var fileName = 'logiCircuit.v.0.1@pagal.json';
  var blob = new Blob([currentCircuit], { type: "application/json;charset=utf-8" });
  saveAs(blob, fileName);
  logicBoard.isModified = false;
}



