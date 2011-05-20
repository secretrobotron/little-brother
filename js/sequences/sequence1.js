LittleBrother.addSequence( (function () {

  var sequence;
  var scene, animKit, rootPanelObject;
  var timeout;

  sequence = new LittleBrother.Sequence({
    name: 'Test',
    audio: 'assets/littlebrother scratch track_1-2.oga',
    panels: [
      { image: 'assets/seq1/storyboard0000.png',
        position: [0, 1, 0],
        time: 2,
      },
      { image: 'assets/seq1/storyboard0001.png',
        position: [0, 0, 0],
        time: 10,
      },
      { image: 'assets/seq1/storyboard0002.png',
        position: [1, 0, 0],
        time: 12,
      },
      { image: 'assets/seq1/storyboard0003a.png',
        position: [1, -1, 0],
        time: 15,
      },
      { image: 'assets/seq1/storyboard0003b.png',
        position: [1, -2, 0],
        time: 16,
      },
      { image: 'assets/seq1/storyboard0004.png',
        position: [1, -3, 0],
        time: 20,
      },
      { image: 'assets/seq1/storyboard0005.png',
        position: [0, -3, 0],
        time: 25,
      },
    ],

    prepare: function (options) {
      scene = options.scene;
      animKit = new AnimationKit();
      rootPanelObject = new CubicVR.SceneObject(new CubicVR.Mesh());
      for (var i=0; i<this.panels.length; ++i) {
        rootPanelObject.bindChild(this.panels[i].sceneObject);
      } //for
      rootPanelObject.position = [0, 0, 1];
      var that = this;
      var panels = this.panels;
      for (var i=0; i<panels.length; ++i)  {
        (function (panel) {
          that.popcorn.code({
            start: panel.time,
            end: panel.time+1,
            onStart: function (options) {
              that.focusOnPanel(panel, [Math.random()*.2, Math.random()*.1, 0]);
            },
          });
        })(panels[i]);
      } //for
    },

    start: function (timer) {
      scene.bindSceneObject(rootPanelObject); 
      animKit.transition(timer.getSeconds(), 5, 1, rootPanelObject, "explode", "in");
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
    },
  });

  return sequence;

}()));
