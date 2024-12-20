
  //////////////////////////////////////////////////////////////////////
  //start: defer_depth_replace.fs.wgsl
      let depth_defer = textureLoad(u_DeferDepth, vec2i(floor(fsInput.position.xy)), 0);
      // if abs(depth_defer - fsInput.position.z) > weZero {
      //   discard;
      // }
  //end: defer_depth_replace.fs.wgsl    
  //////////////////////////////////////////////////////////////////////