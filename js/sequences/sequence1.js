LittleBrother.addSequence( (function () {

  var sequence;
  var scene, animKit, rootPanelObject;
  var timeout;

  sequence = new LittleBrother.Sequence({
    name: 'Test',
    audio: 'assets/littlebrother scratch track_1-2.oga',
    popcorn: function () {
      this.popcorn
      .littlebrother({ 
        image: 'assets/seq1/storyboard0000.png',
        position: [1, 2, 0],
        start: 2,
      })
      .littlebrother({
        image: 'assets/seq1/storyboard0001.png',
        position: [0, 2, 0],
        start: 4,
      })
      .littlebrother({
        image: 'assets/seq1/storyboard0002.png',
        position: [0, 1, 0],
        start: 6,
      })
      .littlebrother({
        image: 'assets/seq1/storyboard0003a.png',
        position: [0, 0, 0],
        start: 8,
      })
      .littlebrother({
        image: 'assets/seq1/storyboard0003b.png',
        position: [-.5, 0, .5],
        rotation: [0, 90, 0],
        start: 10,
      })
      .littlebrother({
        image: 'assets/seq1/storyboard0004.png',
        position: [-.5, 0, 1.5],
        rotation: [0, 90, 0],
        start: 12,
      })
      .littlebrother({
        image: 'assets/seq1/storyboard0005.png',
        position: [-.5, 0, 2.5],
        rotation: [0, 90, 0],
        start: 14,
      })
      .littlebrother({
        image: 'assets/seq1/storyboard0006.png',
        position: [-.5, -1, 2.5],
        rotation: [0, 90, 0],
        start: 16,
      })
      .littlebrother({
        image: 'assets/seq1/storyboard0008.png',
        position: [-.5, -2, 2.5],
        rotation: [0, 90, 0],
        start: 18,
      })
      .littlebrother({
        image: 'assets/seq1/storyboard0009.png',
        position: [-.5, -2, 1.5],
        rotation: [0, 90, 0],
        start: 20,
      })
      .littlebrother({
        image: 'assets/seq1/storyboard0010.png',
        position: [-.5, -2, .5],
        rotation: [0, 90, 0],
        start: 22,
      })
      .littlebrother({
        image: 'assets/seq1/storyboard0011.png',
        position: [-.5, -2, -.5],
        rotation: [0, 90, 0],
        start: 24,
      })
      .littlebrother({
        image: 'assets/seq1/storyboard0012.png',
        position: [-.49, -2, -.5],
        rotation: [0, -90, 0],
        start: 26,
      })
      .littlebrother({
        image: 'assets/seq1/storyboard0013.png',
        position: [-.49, -2, .5],
        rotation: [0, -90, 0],
        start: 28,
      })
      .littlebrother({
        image: 'assets/seq1/storyboard0014.png',
        position: [-.49, -2, 1.5],
        rotation: [0, -90, 0],
        start: 30,
      })
      .littlebrother({
        image: 'assets/seq1/storyboard0015.png',
        position: [0, -2, 2],
        rotation: [0, 0, 0],
        start: 32,
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
    },
  });

  return sequence;

}()));
