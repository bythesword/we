
import { ArcballCameraControl } from "../../../../src/we/base/control/arcballCameraControl"
import { optionCamreaControl } from "../../../../src/we/base/control/cameracCntrol"
import { CameraActor, optionCameraActor } from "../../../../src/we/base/actor/cameraActor"

import { sceneInputJson } from "../../../../src/we/base/scene/scene"
import { Mesh } from "../../../../src/we/base/entity/mesh/mesh"
import { ColorMaterial } from "../../../../src/we/base/material/Standard/colorMaterial"
import { PlaneGeometry } from "../../../../src/we/base/geometry/planeGeomertry"
import GUI from "muigui";
import { optionOrthProjection, OrthographicCamera } from "../../../../src/we/base/camera/orthographicCamera"
import { initScene } from "../../../../src/we/base/scene/initScene"
import { TextureMaterial } from "../../../../src/we/base/material/Standard/textureMaterial"
import { Texture } from "../../../../src/we/base/texture/texture"
//////////////////////////////////////////////////////////////////////////////////////////////
//from webgpufundemental
const hsl = (h: number, s: number, l: number) => `hsl(${h * 360 | 0}, ${s * 100}%, ${l * 100 | 0}%)`;
const hsla = (h: number, s: number, l: number, a: any) => `hsla(${h * 360 | 0}, ${s * 100}%, ${l * 100 | 0}%, ${a})`;

function createSourceImage(size: number) {
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d')!;
  ctx.translate(size / 2, size / 2);

  ctx.globalCompositeOperation = 'screen';
  const numCircles = 3;
  for (let i = 0; i < numCircles; ++i) {
    ctx.rotate(Math.PI * 2 / numCircles);
    ctx.save();
    ctx.translate(size / 6, 0);
    ctx.beginPath();

    const radius = size / 3;
    ctx.arc(0, 0, radius, 0, Math.PI * 2);

    const gradient = ctx.createRadialGradient(0, 0, radius / 2, 0, 0, radius);
    const h = i / numCircles;
    gradient.addColorStop(0.5, hsla(h, 1, 0.5, 1));
    gradient.addColorStop(1, hsla(h, 1, 0.5, 0));

    ctx.fillStyle = gradient;
    ctx.fill();
    ctx.restore();
  }
  return canvas;
}
function createDestinationImage(size: number) {
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d')!;

  const gradient = ctx.createLinearGradient(0, 0, size, size);
  for (let i = 0; i <= 6; ++i) {
    gradient.addColorStop(i / 6, hsl(i / -6, 1, 0.5));
  }

  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, size, size);

  ctx.fillStyle = 'rgba(0, 0, 0, 255)';
  ctx.globalCompositeOperation = 'destination-out';
  ctx.rotate(Math.PI / -4);
  for (let i = 0; i < size * 2; i += 32) {
    ctx.fillRect(-size, i, size * 2, 16);
  }

  return canvas;
}
const size = 300;
const srcCanvas = createSourceImage(size);
const dstCanvas = createDestinationImage(size);



///////////////////////////////////////////////////////////////////////////
//scene
declare global {
  interface Window {
    scene: any
    DC: any
    srcPlane: any
    dstPlane: any
  }
}
let input: sceneInputJson = {
  canvas: "render",
  // renderPassSetting:{color:{clearValue:[0.5,0.5,0.5,1]}}//ok
  color: {
    red: 0,
    green: 0.,
    blue: 0.,
    alpha: 0.5
  },
  ambientLight: {
    color: {
      red: 1,
      green: 1,
      blue: 1
    },
    intensity: 0.13
  },
  reversedZ: true,
  stageSetting: "world"
}

let scene = await initScene(input)
window.scene = scene;


const cameraOption: optionOrthProjection = {
  left: -1,
  right: 1,
  top: 1,
  bottom: -1,
  near: 0.01,
  far: 1,
  position: [0, 0, 1],
  lookAt: [0, 0, 0]
}
let camera = new OrthographicCamera(cameraOption);


//摄像机控制器
const controlOption: optionCamreaControl = {
  window: window,
  canvas: scene.canvas,
  camera: camera,
};
//实例化摄像机控制器
let control = new ArcballCameraControl(controlOption);

//摄像机角色参数
const ccOption: optionCameraActor = {
  camera: camera,
  // control: control,
  name: "camera_1"
}
//实例化摄像机角色
let actor = new CameraActor(ccOption)
//增加摄像机角色到scene
scene.addCameraActor(actor, true)


////enities 初始化

let planeGeometry = new PlaneGeometry({
  width: 2,
  height: 2,
  // widthSegments: 1,
  // heightSegments: 1,
});
let testColor = new ColorMaterial({
  color: { red: 1, green: 0, blue: 0, alpha: 1 },
});

//非预乘DST
let dstTextureUnPremultiplied = new Texture({
  texture: dstCanvas,
  name: "dstTextureUnPremultiplied",
  premultipliedAlpha: false,
}, scene.device);
await dstTextureUnPremultiplied.init();

//预乘DST
let dstTexturePremultiplied = new Texture({
  texture: dstCanvas,
  name: "dstTextureUnPremultiplied",
  premultipliedAlpha: true,
}, scene.device);
await dstTexturePremultiplied.init();



let dstMaterial = new TextureMaterial({
  transparent: {
    alphaTest: 0.
  },
  textures: {
    texture: dstTexturePremultiplied  //Texture 类
  }
});
let dstPlane = new Mesh({
  name: "dst",
  geometry: planeGeometry,
  material: dstMaterial,
  position: [0, 0, 0.1],
  wireFrame: false,
  // cullmode: "none"
});



//非预乘 SRC
let srcTextureUnPremultiplied = new Texture({
  texture: srcCanvas,
  name: "srcTextureUnPremultiplied",
  premultipliedAlpha: false,
}, scene.device);
await srcTextureUnPremultiplied.init();

//预乘 SRC
let srcTexturePremultiplied = new Texture({
  texture: srcCanvas,
  name: "srcTexturePremultiplied",
  premultipliedAlpha: true,
}, scene.device);
await srcTexturePremultiplied.init();




let srcMaterial = new TextureMaterial({
  transparent: {
    alphaTest: 0.
  },
  textures: {
    texture: srcTexturePremultiplied
  }
});
let srcPlane = new Mesh({
  name: "src",
  geometry: planeGeometry,
  material: srcMaterial,
  position: [0, 0, 0.5],
  wireFrame: false,
  // cullmode: "none"
});

await scene.add(dstPlane);
await scene.add(srcPlane);


window.srcPlane = srcPlane;
window.dstPlane = dstPlane;
////////////////////////////////////////////////////////////////
//GUI
const operations = [
  'add',
  'subtract',
  'reverse-subtract',
  'min',
  'max',
];

const factors = [
  'zero',
  'one',
  'src',
  'one-minus-src',
  'src-alpha',
  'one-minus-src-alpha',
  'dst',
  'one-minus-dst',
  'dst-alpha',
  'one-minus-dst-alpha',
  'src-alpha-saturated',
  'constant',
  'one-minus-constant',
];

const presets = {
  'default (copy)': {
    color: {
      operation: 'add',
      srcFactor: 'one',
      dstFactor: 'zero',
    },
  },
  'premultiplied blend (source-over)': {
    color: {
      operation: 'add',
      srcFactor: 'one',
      dstFactor: 'one-minus-src-alpha',
    },
  },
  'un-premultiplied blend': {
    color: {
      operation: 'add',
      srcFactor: 'src-alpha',
      dstFactor: 'one-minus-src-alpha',
    },
  },
  'destination-over': {
    color: {
      operation: 'add',
      srcFactor: 'one-minus-dst-alpha',
      dstFactor: 'one',
    },
  },
  'source-in': {
    color: {
      operation: 'add',
      srcFactor: 'dst-alpha',
      dstFactor: 'zero',
    },
  },
  'destination-in': {
    color: {
      operation: 'add',
      srcFactor: 'zero',
      dstFactor: 'src-alpha',
    },
  },
  'source-out': {
    color: {
      operation: 'add',
      srcFactor: 'one-minus-dst-alpha',
      dstFactor: 'zero',
    },
  },
  'destination-out': {
    color: {
      operation: 'add',
      srcFactor: 'zero',
      dstFactor: 'one-minus-src-alpha',
    },
  },
  'source-atop': {
    color: {
      operation: 'add',
      srcFactor: 'dst-alpha',
      dstFactor: 'one-minus-src-alpha',
    },
  },
  'destination-atop': {
    color: {
      operation: 'add',
      srcFactor: 'one-minus-dst-alpha',
      dstFactor: 'src-alpha',
    },
  },
  'additive (lighten)': {
    color: {
      operation: 'add',
      srcFactor: 'one',
      dstFactor: 'one',
    },
  },
};

//color blending
const color = {
  operation: 'add',
  srcFactor: 'one',
  dstFactor: 'one-minus-src',
};

//alpha blending
const alpha = {
  operation: 'add',
  srcFactor: 'one',
  dstFactor: 'one-minus-src',
};

const constant = {
  color: [1, 0.5, 0.25],
  alpha: 1,
};

//底色值，默认黑色
const clear = {
  color: [0, 0, 0],
  alpha: 0,
  premultiply: true,
};

//第一个folder
const settings = {
  alphaMode: 'premultiplied',
  textureSet: 0,
  preset: 'default (copy)',
};

const gui = new GUI().onChange(update);

//第一个folder
gui.add(settings, 'alphaMode', ['opaque', 'premultiplied']).name('canvas alphaMode');

gui.add(settings, 'textureSet', ['premultiplied alpha', 'un-premultiplied alpha']);

gui.add(settings, 'preset', Object.keys(presets)).name('blending preset').onChange((presetName: string) => {
  const preset = presets[presetName as keyof typeof presets];
  Object.assign(color, preset.color);
  Object.assign(alpha, preset.alpha || preset.color);
  gui.updateDisplay();
});

//第二个folder，color blending
const colorFolder = gui.addFolder('color');
colorFolder.add(color, 'operation', operations);
colorFolder.add(color, 'srcFactor', factors);
colorFolder.add(color, 'dstFactor', factors);

//第三个folder,alpha blending
const alphaFolder = gui.addFolder('alpha');
alphaFolder.add(alpha, 'operation', operations);
alphaFolder.add(alpha, 'srcFactor', factors);
alphaFolder.add(alpha, 'dstFactor', factors);

//第四个folder,constant blending
const constantFolder = gui.addFolder('constant');
constantFolder.addColor(constant, 'color');
constantFolder.add(constant, 'alpha', 0, 1);

//第五个folder
const clearFolder = gui.addFolder('clear color');
clearFolder.add(clear, 'premultiply');
clearFolder.add(clear, 'alpha', 0, 1);
clearFolder.addColor(clear, 'color');

/**
 * src 是三个圆形
 * dst 是一个条状图
 */
function update() {
  gui.updateDisplay();
  // console.log("onchange");
  // console.log(settings);
  // console.log("",color,alpha,constant,clear);


  //背景色，
  if (settings.alphaMode == "premultiplied") {
    scene.setBackgroudColor({
      red: clear.color[0],
      green: clear.color[1],
      blue: clear.color[2],
      alpha: clear.alpha
    });
    //alpha预乘
    if (clear.premultiply) {
      scene.setPremultiplied(true);
    } else {
      scene.setPremultiplied(false);
    }
  }
  else {
    scene.setBackgroudColor({
      red: clear.color[0],
      green: clear.color[1],
      blue: clear.color[2],
      alpha: 1
    });
  }

  /**只更新 src的（https://webgpufundamentals.org/webgpu/lessons/webgpu-transparency.html中也只更新src的）
   * 
   */

  //纹理预乘
  if (settings.textureSet == 0) {//纹理预乘
    srcMaterial.textures.texture = srcTexturePremultiplied;
    dstMaterial.textures.texture = dstTexturePremultiplied;
  }
  else {//纹理不预乘
    srcMaterial.textures.texture = srcTextureUnPremultiplied;
    dstMaterial.textures.texture = dstTextureUnPremultiplied;
  }

  //settings.preset（这个是组合，就是后面的color与alpha） || Blending的color 与alpha处理
  console.log("color", color,"alpha", alpha);
  let blendingValues: GPUBlendState = {
    color  ,
    alpha,
    // color: {
    //   operation: color.operation as GPUBlendOperation,
    //   srcFactor: color.srcFactor as GPUBlendFactor,
    //   dstFactor: color.dstFactor as GPUBlendFactor,
    // },
    // alpha: {
    //   operation: alpha.operation as GPUBlendOperation,
    //   srcFactor: alpha.srcFactor as GPUBlendFactor,
    //   dstFactor: alpha.dstFactor as GPUBlendFactor,
    // }
  }
  srcMaterial.setBlend(blendingValues);


  //blending ,constant ,todo
  let blendConstants = [...constant.color, constant.alpha];
  srcMaterial.setblendConstants(blendConstants);//20250503，目前没有在DCCC中实现流程，只是设置参数，不会产生实际功能调用

  srcPlane.needUpdate = true;
  dstPlane.needUpdate = true;

}