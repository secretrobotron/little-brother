LittleBrother.addSequence( (function () {

  var sequence;
  var scene, animKit, rootPanelObject;
  var timeout;
  var bf3d, winstonObjs = [];
  var currentTimer;

  function faceCamera(obj, camPos, camTar, ray, diff) {
    obj.position = ray;
    var b = 180 + Math.atan2(diff[0], diff[2])*180/Math.PI;
    var a = CubicVR.vec3.angle(diff, [diff[0], 0, diff[2]])*180/Math.PI;
    a *= camPos[1] > camTar[1] ? -1 : 1;
    obj.rotation = [a, b, 0];
  } //faceCamera

  sequence = new LittleBrother.Sequence({
    name: 'Test',
    audio: 'assets/littlebrother scratch track_1-2.oga',
    popcorn: function () {
      this.popcorn
      .littlebrother({ 
        image: 'assets/seq1/storyboard0000.png',
        position: [1, 2, 0],
        start: 2,
        onStart: function (options) {
        },
        onEnd: function (options) {
        },
      })
      .littlebrother({
        image: 'assets/seq1/storyboard0001.png',
        position: [0, 2, 0],
        start: 14,
      })
      .littlebrother({
        image: 'assets/seq1/storyboard0002.png',
        position: [0, 1, 0],
        start: 20,
      })
      .littlebrother({
        image: 'assets/seq1/storyboard0003a.png',
        position: [0, 0, 0],
        start: 23,
      })
      .littlebrother({
        image: 'assets/seq1/storyboard0003b.png',
        position: [-.5, 0, .5],
        rotation: [0, 90, 0],
        start: 25,
      })
      .littlebrother({
        image: 'assets/seq1/storyboard0004.png',
        position: [-.5, 0, 1.5],
        rotation: [0, 90, 0],
        start: 27,
      })
      .littlebrother({
        image: 'assets/seq1/storyboard0005.png',
        position: [-.5, 0, 2.5],
        rotation: [0, 90, 0],
        start: 74,
      })
      .littlebrother({
        image: 'assets/seq1/storyboard0006.png',
        position: [-.5, -1, 2.5],
        rotation: [0, 90, 0],
        start: 76,
      })
      .littlebrother({
        image: 'assets/seq1/storyboard0008.png',
        position: [-.5, -2, 2.5],
        rotation: [0, 90, 0],
        start: 78,
      })
      .littlebrother({
        image: 'assets/seq1/storyboard0009.png',
        position: [-.5, -2, 1.5],
        rotation: [0, 90, 0],
        start: 80,
      })
      .littlebrother({
        image: 'assets/seq1/storyboard0010.png',
        position: [-.5, -2, .5],
        rotation: [0, 90, 0],
        start: 82,
      })
      .littlebrother({
        image: 'assets/seq1/storyboard0011.png',
        position: [-.5, -2, -.5],
        rotation: [0, 90, 0],
        start: 84,
      })
      .littlebrother({
        image: 'assets/seq1/storyboard0012.png',
        position: [-.49, -2, -.5],
        rotation: [0, -90, 0],
        start: 86,
      })
      .littlebrother({
        image: 'assets/seq1/storyboard0013.png',
        position: [-.49, -2, .5],
        rotation: [0, -90, 0],
        start: 88,
      })
      .littlebrother({
        image: 'assets/seq1/storyboard0014.png',
        position: [-.49, -2, 1.5],
        rotation: [0, -90, 0],
        start: 90,
      })
      .littlebrother({
        image: 'assets/seq1/storyboard0015.png',
        position: [0, -2, 2],
        rotation: [0, 0, 0],
        start: 92,
      })
      .code({
        start: 13,
        end: 30,
        onStart: function (options) {
          LittleBrother.clearConsole();
          LittleBrother.toggleConsole(true);
          LittleBrother.addToConsole('READY.');
          LittleBrother.typeToConsole('4550 REM AWESOME STRING EXPANDER ROUTINE');
          LittleBrother.pauseConsole(1000);
          LittleBrother.typeToConsole('4570 NAME="w1n5t0n"');
          LittleBrother.typeToConsole('4580 GOSUB 1000');
          LittleBrother.typeToConsole('SYS 4096');
          LittleBrother.pauseConsole(1000);
          LittleBrother.addToConsole('doubleyouoneenfiveteezeroen');
          LittleBrother.addToConsole('READY.');
          LittleBrother.pauseConsole(1000);
          LittleBrother.typeToConsole('LST');
          LittleBrother.addToConsole('?SYNTAX ERROR');
          LittleBrother.addToConsole('READY.');
        },
        onEnd: function (options) {
          LittleBrother.toggleConsole(false);
        },
      })
      .code({
        start: 15,
        end: 25,
        onStart: function (options) {
          var underscore = winstonObjs[0].children[winstonObjs[0].children.length-1];
          var underscorePosition = [underscore.position[0], underscore.position[1], underscore.position[2]];
          options.interval = setInterval(function(){
            var v = underscore.visible;
            underscore.visible = !v;
          }, 1000);
          for (var i=0, j=0, lastObj; i<winstonObjs[0].children.length; ++i) {
            j += Math.random()*100 + 200;
            (function (show, obj, time) {
              setTimeout(function () {
                if (show) {
                  show.visible = true;
                } //if
                if (obj !== underscore) {
                  underscore.position = obj.position;
                }
                else {
                  underscore.position = underscorePosition;
                } //if
              }, time);
            })(lastObj, winstonObjs[0].children[i], j);
            lastObj = winstonObjs[0].children[i];
          } //for
          scene.bindSceneObject(winstonObjs[0]);
          scene.bindSceneObject(winstonObjs[1]);
          winstonObjs[1].visible = false;
          for (var i=0; i<winstonObjs[0].children.length; ++i) {
            winstonObjs[0].children[i].visible = false;
            if (winstonObjs[0].children[i] && winstonObjs[1].children[i]) {
              winstonObjs[0].children[i].position = winstonObjs[1].children[i].position;
            } //if
          }
          animKit.transition(currentTimer.getSeconds()+7, 15, 2, winstonObjs[1], "explode", "out");
        },
        onEnd: function (options) {
          scene.removeSceneObject(winstonObjs[0]);
          scene.removeSceneObject(winstonObjs[1]);
        },
      })
      .code({
        start: 20,
        end: 21,
        onStart: function (options) {
          winstonObjs[1].visible = true;
          winstonObjs[0].visible = false;
        },
      });
    },

    prepare: function (options) {
      var that = this;
      var panels = this.panels;

      scene = options.scene;
      animKit = new AnimationKit();

      rootPanelObject = new CubicVR.SceneObject(new CubicVR.Mesh());
      for (var i=0; i<this.panels.length; ++i) {
        rootPanelObject.bindChild(panels[i].sceneObject);
      } //for
      rootPanelObject.position = [0, 0, 1];

      for (var i=0; i<panels.length; ++i)  {
        (function (panel) {
          that.popcorn.code({
            start: panel.start,
            end: panel.start+1,
            onStart: function (options) {
              that.focusOnPanel(panel, [
                rootPanelObject.position[0],
                rootPanelObject.position[1],
                rootPanelObject.position[2],
              ]);
            },
          });
        })(panels[i]);
      } //for

      bfMaterial = new CubicVR.Material({
        color: [0.8,0.3,0.2],
        specular: [1, 5, 0],
        shininess: 0.9,
      });
 
      var bfUV = new CubicVR.UVMapper({
        projectionMode: CubicVR.enums.uv.projection.CUBIC,
        scale: [1, 1, 1]
      });
 
      bf3d = new bitFont3D("box", bfMaterial, bfUV);
      bf3d.loadFont();

      winstonObjs[0] = bf3d.genString("w1n5t0n_");
      winstonObjs[0].scale = [.5, .5, .5];
      winstonObjs[1] = bf3d.genString("winston");
      winstonObjs[1].scale = [.5, .5, .5];

    },
    show: function () {
      scene.bindSceneObject(rootPanelObject); 
      scene.setSkyBox(new CubicVR.SkyBox({texture:'assets/classroom-skybox.png'}));
    },
    start: function (timer) {
      if (this.popcorn.currentTime() === 0) {
        animKit.transition(timer.getSeconds(), 5, 1, rootPanelObject, "explode", "in");
      } //if
    },
    pause: function (timer) {
    },
    stop: function (timer) {
      animKit.transition(timer.getSeconds(), 5, 1, rootPanelObject, "explode", "out");
      var panels = this.panels;
      timeout = setTimeout(function () { 
        scene.removeSceneObject(rootPanelObject);
        for (var i=0; i<panels.length; ++i) {
          panels[i].sceneObject.position = [
            panels[i].originalPosition[0],
            panels[i].originalPosition[1],
            panels[i].originalPosition[2],
          ];
        } //for
      }, 1000);
    }, 
    update: function (timer) {
    },
    updateGraphics: function (timer, gl) {
      currentTimer = timer;
      var camPos = scene.camera.position;
      var camTar = scene.camera.target;
      var diff = CubicVR.vec3.subtract(camTar, camPos);
      diff = CubicVR.vec3.normalize(diff);
      diff = CubicVR.vec3.multiply(diff, 1);
      var ray = CubicVR.vec3.add(diff, camPos);

      faceCamera(winstonObjs[0], camPos, camTar, ray, diff);
      faceCamera(winstonObjs[1], camPos, camTar, ray, diff);

    },
  });

  return sequence;

}()));
