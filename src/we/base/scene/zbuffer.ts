enum DepthBufferMode {
    Default = 0,
    Reversed,
  }
  
  const depthBufferModes: DepthBufferMode[] = [
    DepthBufferMode.Default,
    DepthBufferMode.Reversed,
  ];
  const depthCompareFuncs = {
    [DepthBufferMode.Default]: 'less' as GPUCompareFunction,
    [DepthBufferMode.Reversed]: 'greater' as GPUCompareFunction,
  };
  const depthClearValues = {
    [DepthBufferMode.Default]: 1.0,
    [DepthBufferMode.Reversed]: 0.0,
  };

  