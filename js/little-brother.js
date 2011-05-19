
var LittleBrother = (function () {

  var scene, mainLoop;

  var sequences = [], currentEditingSequence, currentPlayingSequence;
  var editorProperties = {};

  var shaderList = [], shaders = {}, fxChain;

  /******************************************************************************
   * Internal LB Functions
   ******************************************************************************/
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

    option.addEventListener('click', function (e) {
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
      cutoff: 25,
     });
    mainLight.lookat([0, 0, 0]);
    scene.bindLight(mainLight);

    scene.camera.position = [0, 0, -2];
    scene.camera.target = [0, 0, 0];

    CubicVR.setGlobalAmbient([0.2, 0.2, 0.2]);
    //CubicVR.setGlobalDepthAlpha(true, scene.camera.nearclip, scene.camera.farclip);

    mainLoop = new CubicVR.MainLoop( function (timer, gl) {
      scene.evaluate(timer.getSeconds());
      fxChain.begin();
      gl.clearColor(0.0, 0.0, 0.0, 1.0);
      gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
      scene.render();
      fxChain.end();
      fxChain.render();

      mainLight.lookat([Math.sin(timer.getSeconds()), Math.cos(timer.getSeconds()/2), 0]);
      if (currentPlayingSequence) {
        currentPlayingSequence.updateGraphics(timer, gl);
      } //if
    });

    document.body.appendChild(canvas);

    editorProperties = {
      name: document.getElementById('editor-sequence-name'),
      audioElement: document.getElementById('editor-sequence-audio')
    };

    toggleEditorProperties(false);

    for (var i=0; i<sequences.length; ++i) {
      addSequenceToEditor(sequences[i]);
    } //for

    document.getElementById('editor-save-sequence').addEventListener('click', function (e) {
      saveEditingSequence();
    }, false);

    document.getElementById('editor-play-sequence').addEventListener('click', function (e) {
      LittleBrother.playSequence(currentEditingSequence);
    }, false);

    document.getElementById('editor-stop-sequence').addEventListener('click', function (e) {
      LittleBrother.stopSequence(currentEditingSequence);
    }, false);

    for (var i=0; i<sequences.length; ++i) {
      sequences[i].prepareSequence(scene);
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
      currentPlayingSequence = sequence;
      sequence.popcorn.currentTime(0);
      sequence.play();
    }, //playSequence

    stopSequence: function (sequence) {
      sequence.stop();
    }, //stopSequence

    /*******************************
     * Panel
     *******************************/
    Panel: function (options) {
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

      so.position = options.position || [0, 0, 0];
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

      this.startSequence = options.start || function () {};
      this.stopSequence = options.stop || function () {};

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
          that.startSequence.apply(that, [mainLoop.timer]);
        });
        this.popcorn.listen('pause', function () {
          that.stopSequence.apply(that, [mainLoop.timer]);
        });
      }; //addAudio

      this.update = options.update || function () {};
      this.updateGraphics = options.updateGraphics || function () {};

      if (options.audio) {
        this.addAudio(options.audio);
      } //if

      this.prepare = options.prepare || function () {};

      this.prepareSequence = function (scene) {
        if (options.panels) {
          for (var i=0; i<options.panels.length; ++i) {
            this.addPanel(options.panels[i]);
          } //for
          options.prepare.apply(that, [{scene: scene}]);
        } //if
      };

      this.play = function () {
        this.popcorn.play();
        this.startSequence(mainLoop.timer);
      }; //play

      this.stop = function () {
        this.popcorn.pause();
        this.stopSequence(mainLoop.timer);
      }; //stop

      this.popcorn.listen('timeupdate', function (e) {
        that.update();
      });

    }, //Sequence

  };

}()); //LittleBrother

