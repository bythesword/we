# WE 3D引擎(webGPU engine 3D)

## 基础说明

WE 3D 是一个从底层完全独立架构的B端三维渲染引擎；

以TypeScript为开发语言；

在光栅化是以webGPU进行架构处理的，而且只支持webGPU的光栅化库；

渲染引擎架构架构上，参考了UE、cesium的部分工作原理；

在底层形成以command集合-->webGPU的command的流程；

在更新机制上形成以对象和类的update为更新入口的按需更新机制；

在GPU的shader上支持Draw shader、Compute shader，以及多重shader串行输出一个Draw或Compute的command；（封装了webGPU原生的功能并集成与扩展）

## 更多功能

渲染模式支持前向渲染和延迟渲染；

延迟渲染可能会由两种方式：延迟单像素前向方式和前向颜色延迟光照渲染；（这两个名字自己起的）

延迟渲染的G-Buffer相关数量目前有五个，depth、normal、uv、position、id；（后期会融合部分到一个buffer，尽量减少对于内存带宽的占用）

材质部分提供了简单材质Buli-Phong为基础的基础材质，和以PBR（进行中）为核心的物理材质。在PBR材质上是主要参考filament的文档进行的，并借鉴了UE的材质（材质编辑器）；

在物体对象（entities）上将支持多种扩展形式，包括基础的点、线、面，几何体（mesh）、有限元仿真数据、各种模型文件、大地形、体素对象等；

物体的空间组织上采用BVH和BOX3结合的方式；

光源支持环境光、点光源、定向光源、聚光灯、以及shape光源（短期todo）；

光源长期todo的有光体积（前端计算量不不太适用，即便在worker中）、光探针；

在阴影部分以shadowmap为主；

在活动对象上以Actor对象理念为核心；

摄像机支持投射、正交、多视口功能；摄像机是Actor对象形式存在（CameraActor），摄像机的运动与控制也和Actor的理念；

在光线拾取上有GPU拾取和CPU拾取两种模式；

后期处理的效果上目前基本是参照threejs的方式，会形成一个有意思的特效吧，比如丁达尔效果等；

在后期处理及之后的渲染工作流中，会保存scene、stage的输出纹理，为cache渲染、TAA等流程使用；

在Stage舞台目前初步设定五个：UI、sky、world、dynamic、actor。其中后三个分别有透明和不透明两个子舞台；

## Todo

短期的规划还有：SSGI、SSR、SSAO、IBL、GI with Reflective shadow maps(这个感觉babylon的挺好的)；

例子系统目前还没有开始设计；

流体模拟系统刚刚开始架构，这部分可能会有两个部分，模拟效果部分和数据驱动部分（仿真数据或计算数据）；

PBR的材质编辑器；

材质预计算部分；

场景编辑器；

预加载与资格管理部分；

资源打包格式与输出部分；

## 相关资料与推荐

https://www.w3.org/TR/webgpu/

https://www.w3.org/TR/wgsl/

https://github.com/webgpu/webgpu-samples

https://github.com/gfx-rs/wgpu

https://developer.mozilla.org/zh-CN/docs/Web/API/WebGPU_API

https://webgpufundamentals.org/

https://github.com/webgpu/webgpufundamentals

https://github.com/webgpu/webgpu-samples

https://github.com/greggman/wgpu-matrix

https://github.com/toji/gl-matrix

WebGPU API reference https://gpuweb.github.io/types/index.html

https://github.com/greggman/webgpu-utils

https://github.com/google/filament

https://github.com/google/dawn

## 感谢

从入坑图形学到现在，陆陆续续学习了较多的知识，感谢图形学方面无私奉献开源工作者和进行图形学公开课的老师们。

感谢胡事民老师的计算机图形学公开课程；

感谢闫令琪老师的Games101和Games202的课程；

感谢LearnOpenGL中文化工程 https://learnopengl-cn.github.io/ ；

感谢LearnOpengl的原书作者 JoeyDeVries https://learnopengl.com ；

感谢Filament的文档作者Romain Guy,Mathias Agopian ；

## 写在最后

开发WE引擎还是工作量比较重的，学习、设计、代码、测试、文档、示例都是一个人，但收获也是满满的。

希望将WE 引擎一直迭代下去，也希望若有志同道合的道友可以一起开发；