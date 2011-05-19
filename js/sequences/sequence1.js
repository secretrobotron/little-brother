LittleBrother.addSequence( (function () {

  var sequence;
  var scene, animKit, rootPanelObject;
  var timeout;

  sequence = new LittleBrother.Sequence({
    name: 'Test',
    audio: 'assets/littlebrother scratch track_1-2.oga',
    panels: [
      { image: 'assets/test.jpg',
        position: [0, 1, 0],
      },
      { image: 'assets/test.jpg',
        position: [0, 0, 0],
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
    },

    start: function (timer) {
      scene.bindSceneObject(rootPanelObject); 
      animKit.transition(timer.getSeconds(), 5, 1, rootPanelObject, "explode", "in");
      console.log('happened');
    },
    stop: function (timer) {
      animKit.transition(timer.getSeconds(), 5, 1, rootPanelObject, "explode", "out");
      timeout = setTimeout(function () { 
        scene.removeSceneObject(rootPanelObject);
      }, 3000);
    }, 
    update: function (timer) {
    },
    updateGraphics: function (timer, gl) {
    },
  });

  return sequence;

}()));
