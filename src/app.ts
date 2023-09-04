import "@babylonjs/core/Debug/debugLayer";
import "@babylonjs/loaders/glTF/2.0/glTFLoader";
import {
  Engine,
  Scene,
  ArcRotateCamera,
  Vector3,
  HemisphericLight,
  Mesh,
  MeshBuilder,
  Color4,
  FreeCamera,
  EngineFactory,
} from "@babylonjs/core";
import { Inspector } from "@babylonjs/inspector";
import { AdvancedDynamicTexture, Button, Control } from "@babylonjs/gui";

enum State {
  START = 0,
  GAME,
  LOSE,
  CUTSCENE,
}

class App {
  private _scene: Scene;
  private _canvas: HTMLCanvasElement;
  private _engine: Engine;

  private _state: number = 0;
  private _gamescene: Scene;
  private _cutScene: Scene;

  constructor() {
    this._canvas = this._createCanvas();

    this._init();
  }

  private async _init(): Promise<void> {
    this._engine = (await EngineFactory.CreateAsync(
      this._canvas,
      undefined
    )) as Engine;
    this._scene = new Scene(this._engine);

    window.addEventListener("keydown", (ev) => {
      if (ev.shiftKey && ev.ctrlKey && ev.altKey && ev.keyCode === 73) {
        if (this._scene.debugLayer.isVisible()) {
          this._scene.debugLayer.hide();
        } else {
          this._scene.debugLayer.show();
        }
      }
    });

    await this._main();
  }

  private async _main(): Promise<void> {
    await this._goToStart();

    this._engine.runRenderLoop(() => {
      switch (this._state) {
        case State.START:
          this._scene.render();
          break;
        case State.CUTSCENE:
          this._scene.render();
          break;
        case State.GAME:
          this._scene.render();
          break;
        case State.LOSE:
          this._scene.render();
          break;
        default:
          break;
      }
    });

    window.addEventListener("resize", () => {
      this._engine.resize();
    });
  }

  private _createCanvas(): HTMLCanvasElement {
    document.documentElement.style["overflow"] = "hidden";
    document.documentElement.style.overflow = "hidden";
    document.documentElement.style.width = "100%";
    document.documentElement.style.height = "100%";
    document.documentElement.style.margin = "0";
    document.documentElement.style.padding = "0";
    document.body.style.overflow = "hidden";
    document.body.style.width = "100%";
    document.body.style.height = "100%";
    document.body.style.margin = "0";
    document.body.style.padding = "0";

    this._canvas = document.createElement("canvas");
    this._canvas.style.width = "100%";
    this._canvas.style.height = "100%";
    this._canvas.id = "gameCanvas";
    document.body.appendChild(this._canvas);

    return this._canvas;
  }

  private async _goToStart() {
    this._engine.displayLoadingUI();

    this._scene.detachControl();
    let scene = new Scene(this._engine);
    scene.clearColor = new Color4(0, 0, 0, 1);
    let camera = new FreeCamera("camera1", new Vector3(0, 0, 0), scene);
    camera.setTarget(Vector3.Zero());

    const guiMenu = AdvancedDynamicTexture.CreateFullscreenUI("UI");
    guiMenu.idealHeight = 720;

    const startBtn = Button.CreateSimpleButton("start", "PLAY");
    startBtn.width = 0.2;
    startBtn.height = "40px";
    startBtn.color = "white";
    startBtn.top = "-14px";
    startBtn.thickness = 0;
    startBtn.verticalAlignment = Control.VERTICAL_ALIGNMENT_BOTTOM;
    guiMenu.addControl(startBtn);

    startBtn.onPointerDownObservable.add(() => {
      this._goToCutScene();
      scene.detachControl();
    });

    await scene.whenReadyAsync();
    this._engine.hideLoadingUI();

    this._scene.dispose();
    this._scene = scene;
    this._state = State.START;
  }

  private async _goToCutScene(): Promise<void> {
    this._engine.displayLoadingUI();

    this._scene.detachControl();
    this._cutScene = new Scene(this._engine);
    this._cutScene.clearColor = new Color4(0, 0, 0, 1);
    let camera = new FreeCamera(
      "camera1",
      new Vector3(0, 0, 0),
      this._cutScene
    );
    camera.setTarget(Vector3.Zero());

    const cutScene = AdvancedDynamicTexture.CreateFullscreenUI("UI");
    cutScene.idealHeight = 720;

    const next = Button.CreateSimpleButton("next", "NEXT");
    next.color = "white";
    next.thickness = 0;
    next.verticalAlignment = Control.VERTICAL_ALIGNMENT_BOTTOM;
    next.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_RIGHT;
    next.width = "64px";
    next.height = "64px";
    next.top = "-3%";
    next.left = "-12%";
    cutScene.addControl(next);

    next.onPointerUpObservable.add(() => {
      this._goToGame();
    });

    await this._cutScene.whenReadyAsync();
    this._scene.dispose();
    this._state = State.CUTSCENE;
    this._scene = this._cutScene;

    let finishedLoading = false;
    await this._setUpGame().then((res) => {
      finishedLoading = true;
    });
  }

  private async _setUpGame() {
    let scene = new Scene(this._engine);
    this._gamescene = scene;
  }

  private async _goToGame() {
    this._scene.detachControl();
    let scene = this._gamescene;
    scene.clearColor = new Color4(
      0.01568627450980392,
      0.01568627450980392,
      0.20392156862745098
    );
    let camera: ArcRotateCamera = new ArcRotateCamera(
      "Camera",
      Math.PI / 2,
      Math.PI / 2,
      2,
      Vector3.Zero(),
      scene
    );
    camera.setTarget(Vector3.Zero());

    const playerUI = AdvancedDynamicTexture.CreateFullscreenUI("UI");
    scene.detachControl();

    const loseBtn = Button.CreateSimpleButton("lose", "LOSE");
    loseBtn.width = 0.2;
    loseBtn.height = "40px";
    loseBtn.color = "white";
    loseBtn.top = "-14px";
    loseBtn.thickness = 0;
    loseBtn.verticalAlignment = Control.VERTICAL_ALIGNMENT_BOTTOM;
    playerUI.addControl(loseBtn);

    loseBtn.onPointerDownObservable.add(() => {
      this._goToLose();
      scene.detachControl();
    });

    const light1: HemisphericLight = new HemisphericLight(
      "light1",
      new Vector3(1, 1, 0),
      scene
    );
    const sphere: Mesh = MeshBuilder.CreateSphere(
      "sphere",
      { diameter: 1 },
      scene
    );

    this._scene.dispose();
    this._state = State.GAME;
    this._scene = scene;
    this._engine.hideLoadingUI();

    this._scene.attachControl();
  }

  private async _goToLose(): Promise<void> {
    this._engine.displayLoadingUI();

    let scene = new Scene(this._engine);
    scene.clearColor = new Color4(0, 0, 0, 1);
    let camera = new FreeCamera("camera1", new Vector3(0, 0, 0), scene);
    camera.setTarget(Vector3.Zero());

    const guiMenu = AdvancedDynamicTexture.CreateFullscreenUI("UI");
    const mainBtn = Button.CreateSimpleButton("mainmenu", "MAIN MENU");
    mainBtn.width = 0.2;
    mainBtn.height = "40px";
    mainBtn.color = "white";
    guiMenu.addControl(mainBtn);
    mainBtn.onPointerUpObservable.add(() => {
      this._goToStart();
    });

    await scene.whenReadyAsync();
    this._engine.hideLoadingUI();

    this._scene.dispose();
    this._scene = scene;
    this._state = State.LOSE;
  }
}

new App();
