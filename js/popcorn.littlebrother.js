(function (Popcorn) {
  
  Popcorn.plugin( "littlebrother" , {
    
    manifest: {
      about:{
        name: "Popcorn Little Brother Plugin",
        version: "0.1",
        author: "@secretrobotron",
        website: "robothaus.org/secretrobotron"
      },
      options:{
        start    : {elem:'input', type:'text', label:'In'},
        end      : {elem:'input', type:'text', label:'Out'},
        image    : {elem:'input', type:'text', label:'Image'},
        x        : {elem:'input', type:'number', label:'X Position'},
        y        : {elem:'input', type:'number', label:'Y Position'},
        z        : {elem:'input', type:'number', label:'Z Position'},
        width    : {elem:'input', type:'number', label:'Width'},
        height   : {elem:'input', type:'number', label:'Heigt'},
        position : {elem:'input', type:'text', label:'Position'},
        onStart  : {elem:'input', type:'text', label:'onStart'}
        onEnd    : {elem:'input', type:'text', label:'onEnd'}
      }
    },
    _setup: function(options) {
      var position = options.position || [options.x, options.y, options.z];
      options.panel = {
        image: options.image,
        position: position,
        start: options.start,
      }

      options.onStart = options.onStart || function () {};
      options.onEnd = options.onEnd || function () {};
    },
    start: function(event, options){
      options.onStart(options);
    },
    end: function(event, options){
      options.onEnd(options);
    }
  });

})( Popcorn );
