
var LittleBrother = (function () {

  var scene, mainLoop, mvc;

  var sequences = [], currentEditingSequence, currentPlayingSequence;
  var editorProperties = {};

  var shaderList = [], shaders = {}, fxChain;

  var mainLightTarget = [0,0,0], mainLightPoint = [0,0,0];

  /******************************************************************************
   * Internal LB Functions
   ******************************************************************************/
  function setMotionTo(object, position, startTime, duration) {
    var endTime = startTime + duration;
    var m = object.motion = new CubicVR.Motion();
    var p = object.position;
    m.setKey(CubicVR.enums.motion.POS, CubicVR.enums.motion.X, startTime, p[0]).tension=1;
    m.setKey(CubicVR.enums.motion.POS, CubicVR.enums.motion.Y, startTime, p[1]).tension=1;
    m.setKey(CubicVR.enums.motion.POS, CubicVR.enums.motion.Z, startTime, p[2]).tension=1;
    m.setKey(CubicVR.enums.motion.POS, CubicVR.enums.motion.X, endTime, position[0]).tension=1;
    m.setKey(CubicVR.enums.motion.POS, CubicVR.enums.motion.Y, endTime, position[1]).tension=1;
    m.setKey(CubicVR.enums.motion.POS, CubicVR.enums.motion.Z, endTime, position[2]).tension=1;
    m.setBehavior(CubicVR.enums.motion.POS, CubicVR.enums.motion.X, CubicVR.enums.envelope.behavior.CONSTANT, CubicVR.enums.envelope.behavior.CONSTANT);
    m.setBehavior(CubicVR.enums.motion.POS, CubicVR.enums.motion.Y, CubicVR.enums.envelope.behavior.CONSTANT, CubicVR.enums.envelope.behavior.CONSTANT);
    m.setBehavior(CubicVR.enums.motion.POS, CubicVR.enums.motion.Z, CubicVR.enums.envelope.behavior.CONSTANT, CubicVR.enums.envelope.behavior.CONSTANT);

  }; //setMotionTo

  function stopCurrentSequence () {
    if (currentPlayingSequence) {
      currentPlayingSequence.stop();
    } //if
  }; //stopCurrentSequence

  function toggleEditorProperties (state) {
    var editor = document.getElementById('editor-properties');
    var inputs = editor.getElementsByTagName('input');
    var selects = editor.getElementsByTagName('select');
    if (state) {
      for (var i=0; i<inputs.length; ++i) {
        inputs[i].removeAttribute('disabled');
      } //for
      for (var i=0; i<selects.length; ++i) {
        selects[i].removeAttribute('disabled');
      } //for
    }
    else {
      for (var i=0; i<inputs.length; ++i) {
        inputs[i].setAttribute('disabled', 'disabled');
      } //for
      for (var i=0; i<selects.length; ++i) {
        selects[i].setAttribute('disabled', 'disabled');
      } //for
    } //if
  }; //toggleEditorProperties

  function saveEditingSequence() {
    var sequence = currentEditingSequence;
    sequence.name = editorProperties['name'].value;
    sequence.editorOptionElement.innerHTML = sequence.name;
  }; //saveEditingSequence

  function setupEditorProperties(sequence) {
    editorProperties.name.value=sequence.name;
    if (editorProperties.audioElement.children) {
      for (var i=0; i<editorProperties.audioElement.children.length; ++i) {
        editorProperties.audioElement.removeChild(editorProperties.audioElement.children[i]);
      } //for
    } //if
    if (editorProperties.panels.children) {
      while (editorProperties.panels.children.length > 0) {
        editorProperties.panels.removeChild(editorProperties.panels.children[0]);
      } //for
    } //if
    for (var i=0; i<sequence.panels.length; ++i) {
      (function (panel) {
        var option = document.createElement('OPTION');
        option.innerHTML = '['+ panel.time +'] ' + panel.image;
        option.addEventListener('dblclick', function (e) {
          if (currentEditingSequence === currentPlayingSequence) {
            currentEditingSequence.focusOnPanel(panel);
          } //if
        }, false);
        editorProperties.panels.appendChild(option);
      })(sequence.panels[i]);
    } //for
    editorProperties.audioElement.appendChild(sequence.audioElement);
    currentEditingSequence = sequence;
  }; //setupEditorProperties

  function addSequenceToEditor(sequence) {
    var sequencesList = document.getElementById('editor-sequences');
    var option = document.createElement('OPTION');
    option.innerHTML = sequence.name;
    option.value = sequences.indexOf(sequence);
    sequencesList.appendChild(option);

    sequence.editorOptionElement = option;

    option.addEventListener('dblclick', function (e) {
      toggleEditorProperties(true);
      setupEditorProperties(sequence);
    }, false);
  }; //addSequenceToEditor


  /******************************************************************************
   * DOM Ready
   ******************************************************************************/
  document.addEventListener( 'DOMContentLoaded', function (e) {

    var canvas = document.createElement('canvas');
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
          
    var gl = CubicVR.GLCore.init(canvas, 'lib/cubicvr/CubicVR_Core.vs', 'lib/cubicvr/CubicVR_Core.fs');
        
    if (!gl) {
      return;
    } //if

    var shaderDepth = new CubicVR.PostProcessShader({
      shader_vertex: "lib/cubicvr/post_shaders/fx_general.vs",
      shader_fragment: "lib/cubicvr/post_shaders/alpha_depth.fs",
    });
    shaders['depth'] = shaderDepth;

    var shaderInvert = new CubicVR.PostProcessShader({
      shader_vertex: "lib/cubicvr/post_shaders/fx_general.vs",
      shader_fragment: "lib/cubicvr/post_shaders/invert.fs"
    });
    shaders['invert'] = shaderInvert;

    var shaderDOF6 = new CubicVR.PostProcessShader({
      shader_vertex: "lib/cubicvr/post_shaders/fx_general.vs",
      shader_fragment: "lib/cubicvr/post_shaders/dof_6tap.fs",
      init: function(shader) {
        shader.addFloat("near_depth");
        shader.addFloat("far_depth");
      },
      onupdate: function(shader) {
        // linear depth
        var d = CubicVR.vec3.length(scene.camera.position, scene.camera.target);

        shader.setFloat("near_depth", (d - 0.5 - scene.camera.nearclip) / scene.camera.farclip);
        shader.setFloat("far_depth", (d + 4 - scene.camera.nearclip) / scene.camera.farclip);
      }
    });
    shaders['dof'] = shaderDOF6;

    var shaderSSAO = new CubicVR.PostProcessShader({
      shader_vertex: "lib/cubicvr/post_shaders/fx_general.vs",
      shader_fragment: "lib/cubicvr/post_shaders/ssao.fs",
    });
    shaders['ssao'] = shaderSSAO;

    var shaderHalfBloom = new CubicVR.PostProcessShader({
      shader_vertex: "lib/cubicvr/post_shaders/fx_general.vs",
      shader_fragment: "lib/cubicvr/post_shaders/bloom_6tap.fs",
      outputMode: CubicVR.enums.post.output.ADD,
      outputDivisor: 2
    });
    shaders['halfbloom'] = shaderHalfBloom;

    var shaderQuarterBloom = new CubicVR.PostProcessShader({
        shader_vertex: "lib/cubicvr/post_shaders/fx_general.vs",
        shader_fragment: "lib/cubicvr/post_shaders/bloom_6tap.fs",
        outputMode: CubicVR.enums.post.output.ADD,
        outputDivisor: 4
    });
    shaders['quarterbloom'] = shaderQuarterBloom;

    shaderList.push(shaderDepth);
    shaderList.push(shaderInvert);
    shaderList.push(shaderSSAO);
    shaderList.push(shaderDOF6);
    shaderList.push(shaderHalfBloom);
    shaderList.push(shaderQuarterBloom);

    fxChain = new CubicVR.PostProcessChain(canvas.width, canvas.height, true);
    fxChain.setBlurOpacity(1);
    fxChain.setBlurIntensity(0);

    for (var i = 0; i < shaderList.length; i++) {
      fxChain.addShader(shaderList[i]);
      shaderList[i].enabled = false;
    } //for

    scene = new CubicVR.Scene(canvas.width, canvas.height, 80, 0.01, 100);

    mvc = new CubicVR.MouseViewController(canvas, scene.camera);

    targetObject = new CubicVR.SceneObject(null);
    scene.bindSceneObject(targetObject);
    targetObject.position = [0,0,0];

    var defaultObjectMesh = CubicVR.primitives.plane({
      size: 1,
      material: new CubicVR.Material({
        color: [0.3, 0.6, 0.1],
      }),
      uvmapper: {
        projectionMode: CubicVR.enums.uv.projection.PLANAR,
        projectionAxis: CubicVR.enums.uv.axis.Z,
        scale: [1, 1, 1]
      }
    });

    defaultObjectMesh.triangulateQuads().compile().clean();
    var defaultObject = new CubicVR.SceneObject(defaultObjectMesh);

    scene.bindSceneObject(defaultObject);
    defaultObject.position = [0, 0, 20];
    defaultObject.rotation = [0, 0, 0];

    var mainLight = new CubicVR.Light({
      type: CubicVR.enums.light.type.SPOT,
      specular: [1, 1, 1],
      diffuse: [1, 1, 1],
      intensity: 20,
      distance: 100,
      position: [0, 0, -10],
      cutoff: 10,
     });
    mainLight.lookat([0, 0, 0]);
    scene.bindLight(mainLight);

    scene.camera.position = [0, 0, -2];
    scene.camera.target = [0, 0, 0];

    CubicVR.setGlobalAmbient([0.2, 0.2, 0.2]);
    //CubicVR.setGlobalDepthAlpha(true, scene.camera.nearclip, scene.camera.farclip);

    mainLoop = new CubicVR.MainLoop( function (timer, gl) {

      mainLightPoint[0] -= (mainLightPoint[0] - mainLightTarget[0])*.015;
      mainLightPoint[1] -= (mainLightPoint[1] - mainLightTarget[1])*.015;
      mainLightPoint[2] -= (mainLightPoint[2] - mainLightTarget[2])*.015;

      mainLight.lookat(mainLightPoint);

      scene.camera.target = targetObject.position;
      if (currentPlayingSequence) {
        currentPlayingSequence.updateGraphics(timer, gl);
      } //if

      scene.evaluate(timer.getSeconds());
      fxChain.begin();
      gl.clearColor(0.0, 0.0, 0.0, 1.0);
      gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
      scene.render();
      fxChain.end();
      fxChain.render();

    });

    document.body.appendChild(canvas);

    editorProperties = {
      name: document.getElementById('editor-sequence-name'),
      audioElement: document.getElementById('editor-sequence-audio'),
      panels: document.getElementById('editor-sequence-panels'),
    };

    toggleEditorProperties(false);

    for (var i=0; i<sequences.length; ++i) {
      addSequenceToEditor(sequences[i]);
    } //for

    //document.getElementById('editor-sequence-panels').addEventListener('dblclick', function (e) {
    //}, false);

    document.getElementById('editor-save-sequence').addEventListener('click', function (e) {
      saveEditingSequence();
    }, false);

    document.getElementById('editor-show-sequence').addEventListener('click', function (e) {
      LittleBrother.showSequence(currentEditingSequence);
    }, false);

    /*
    document.getElementById('editor-play-sequence').addEventListener('click', function (e) {
      LittleBrother.playSequence(currentEditingSequence);
    }, false);

    document.getElementById('editor-pause-sequence').addEventListener('click', function (e) {
      LittleBrother.pauseSequence(currentEditingSequence);
    }, false);
    */

    for (var i=0; i<sequences.length; ++i) {
      sequences[i].prepare(scene);
    } //for
    
  }, false); //DOM ready

  /******************************************************************************
   * Little Brother Object
   ******************************************************************************/
  return {
    getSequences: function () {
      return sequences;
    },

    addSequence: function (sequence) {
      sequences.push(sequence);
    }, //addSequence

    stopCurrentSequence: stopCurrentSequence,

    playSequence: function (sequence) {
      stopCurrentSequence();
      sequence.popcorn.currentTime(0);
      sequence.play();
    }, //playSequence

    showSequence: function (sequence) {
      if (sequence !== currentPlayingSequence) {
        currentPlayingSequence = sequence;
        sequence.show();
      } //if
    },

    pauseSequence: function (sequence) {
      sequence.pause();
    }, //stopSequence

    stopSequence: function (sequence) {
      sequence.stop();
    }, //stopSequence

    /*******************************
     * Panel
     *******************************/
    Panel: function (options) {
      this.image = options.image;
      this.time = options.time;
      this.position = options.position;
      var texture = new CubicVR.Texture(options.image);
      var so = new CubicVR.SceneObject( CubicVR.primitives.plane( {
        size: 1.0,
        material: new CubicVR.Material({
          color: [1, 1, 1],
          specular: [.01, .01, .01],
          diffuse: [1, 1, 1],
          textures: {
            color: texture,
          },
        }),
        uvmapper: {
          projectionMode: CubicVR.enums.uv.projection.PLANAR,
          projectionAxis: CubicVR.enums.uv.axis.Z,
          scale: [1, 1, 1],
        },
      }).triangulateQuads().compile().clean() );

      this.sceneObject = so;

      so.position = [options.position[0], options.position[1], options.position[2]] || [0, 0, 0];
      this.originalPosition = [options.position[0], options.position[1], options.position[2]] || [0, 0, 0];
    }, //Panel

    /*******************************
     * Sequence
     *******************************/
    Sequence: function (options) {

      var that = this;

      this.name = options.name || 'Untitled';
      this.panels = [];

      this.getScene = function () {
        return scene;
      };

      this.options = options;

      this.addPanel = function (options) {
        var panel = options.panel || new LittleBrother.Panel(options);
        this.panels.push(panel);
      }; //addPanel

      this.addAudio = function (audio) {
        var audioElement = this.audioElement = document.createElement('AUDIO');
        var audioSource = document.createElement('SOURCE');
        audioSource.src = audio;
        audioElement.appendChild(audioSource);
        audioElement.setAttribute('controls', true);
        this.popcorn = Popcorn(audioElement);
        this.popcorn.listen('play', function () {
          LittleBrother.showSequence(that);
          that.options.start.apply(that, [mainLoop.timer]);
        });
        this.popcorn.listen('pause', function () {
          that.options.pause.apply(that, [mainLoop.timer]);
        });
      }; //addAudio

      this.update = that.options.update || function () {};
      this.updateGraphics = that.options.updateGraphics || function () {};

      if (that.options.audio) {
        this.addAudio(that.options.audio);
      } //if

      this.show = function () {
        that.options.show.apply(that);
      }; //show

      this.prepare = function (scene) {
        if (that.options.panels) {
          for (var i=0; i<that.options.panels.length; ++i) {
            this.addPanel(that.options.panels[i]);
          } //for
          that.options.prepare.apply(that, [{scene: scene}]);
        } //if
      };

      this.play = function () {
        this.popcorn.play();
      }; //play

      this.stop = function () {
        this.popcorn.pause();
      }; //stop

      this.pause = function () {
        this.popcorn.pause();
      }; //pause

      this.popcorn.listen('timeupdate', function (e) {
        that.update();
      });

      this.focusOnPanel = function (panel, offset) {
        offset = offset || [0,0,0];
        var s = mainLoop.timer.getSeconds();
        var p = [
          panel.sceneObject.position[0] + offset[0],
          panel.sceneObject.position[1] + offset[1],
          panel.sceneObject.position[2] + offset[2] - 0.2,
        ];

        mainLightTarget = panel.sceneObject.position;

        setMotionTo(scene.camera, p, s, 1);
        setMotionTo(targetObject, panel.sceneObject.position, s, 1);
      };

    }, //Sequence

  };

}()); //LittleBrother

