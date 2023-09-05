import {
  Scene,
  TransformNode,
  Mesh,
  ShadowGenerator,
  Vector3,
  UniversalCamera,
  Quaternion,
} from "@babylonjs/core";

export class Player extends TransformNode {
  public camera: UniversalCamera;
  public scene: Scene;
  private _input;

  // Player
  public mesh: Mesh; // outer collisionbox of player

  // Camera
  private _camRoot: TransformNode;
  private _yTilt: TransformNode;

  // const values
  private static readonly PLAYER_SPEED = 0.45;
  private static readonly ORIGINAL_TILT: Vector3 = new Vector3(
    0.5934119456780721,
    0,
    0
  );

  // player movemen
  private _deltaTime: number = 0;
  private _h: number;
  private _v: number;

  private _moveDirection: Vector3 = new Vector3();
  private _inputAmt: number;

  constructor(assets, scene: Scene, shadowGenerator: ShadowGenerator, input?) {
    super("player", scene);
    this.scene = scene;
    this._setupPlayerCamera();

    this.mesh = assets.mesh;
    this.mesh.parent = this;

    shadowGenerator.addShadowCaster(assets.mesh);

    this._input = input;
  }

  private _updateFromControls(): void {
    this._deltaTime = this.scene.getEngine().getDeltaTime() / 1000.0;

    this._moveDirection = Vector3.Zero();
    this._h = this._input.horizontal; // x-axis
    this._v = this._input.vertical; // z-axis

    let fwd = this._camRoot.forward;
    let right = this._camRoot.right;
    let correctedVertical = fwd.scaleInPlace(this._v);
    let correctedHorizontal = right.scaleInPlace(this._h);

    let move = correctedHorizontal.addInPlace(correctedVertical);

    this._moveDirection = new Vector3(
      move.normalize().x,
      0,
      move.normalize().z
    );

    let inputMag = Math.abs(this._h) + Math.abs(this._v);
    if (inputMag < 0) {
      this._inputAmt = 0;
    } else if (inputMag > 1) {
      this._inputAmt = 1;
    } else {
      this._inputAmt = inputMag;
    }

    this._moveDirection = this._moveDirection.scaleInPlace(
      this._inputAmt * Player.PLAYER_SPEED
    );

    let input = new Vector3(
      this._input.horizontalAxis,
      0,
      this._input.verticalAxis
    );
    if (input.length() === 0) {
      return;
    }

    let angle = Math.atan2(
      this._input.horizontalAxis,
      this._input.verticalAxis
    );
    angle += this._camRoot.rotation.y;
    let targ = Quaternion.FromEulerAngles(0, angle, 0);
    this.mesh.rotationQuaternion = Quaternion.Slerp(
      this.mesh.rotationQuaternion,
      targ,
      10 * this._deltaTime
    );
  }

  private _beforeRenderUpdate(): void {
    this._updateFromControls();
    this.mesh.moveWithCollisions(this._moveDirection);
  }

  public activatePlayerCamera(): UniversalCamera {
    this.scene.registerBeforeRender(() => {
      this._beforeRenderUpdate();
      this._updateCamera();
    });
    return this.camera;
  }

  private _updateCamera(): void {
    let centerPlayer = this.mesh.position.y + 2;
    this._camRoot.position = Vector3.Lerp(
      this._camRoot.position,
      new Vector3(this.mesh.position.x, centerPlayer, this.mesh.position.z),
      0.4
    );
  }

  private _setupPlayerCamera(): UniversalCamera {
    this._camRoot = new TransformNode("root");
    this._camRoot.position = new Vector3(0, 0, 0);
    //to face the player from behind (180 degrees)
    this._camRoot.rotation = new Vector3(0, Math.PI, 0);

    let yTilt = new TransformNode("ytilt");
    yTilt.rotation = Player.ORIGINAL_TILT;
    this._yTilt = yTilt;
    yTilt.parent = this._camRoot;

    this.camera = new UniversalCamera(
      "cam",
      new Vector3(0, 0, -30),
      this.scene
    );
    this.camera.lockedTarget = this._camRoot.position;
    this.camera.fov = 0.47350045992678597;
    this.camera.parent = yTilt;

    this.scene.activeCamera = this.camera;
    return this.camera;
  }

  private _floorRaycast() {

  }
}
