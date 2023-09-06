import {
  Scene,
  TransformNode,
  Mesh,
  ShadowGenerator,
  Vector3,
  UniversalCamera,
  Quaternion,
  Ray,
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
  private static readonly PLAYER_SPEED: number = 0.45;
  private static readonly JUMP_FORCE: number = 0.8;
  private static readonly GRAVITY: number = -2.8;
  private static readonly DASH_FACTOR: number = 2.5;
  private static readonly DASH_TIME: number = 10;
  private static readonly ORIGINAL_TILT: Vector3 = new Vector3(
    0.5934119456780721,
    0,
    0
  );

  public dashTime: number = 0;

  // player movemen
  private _deltaTime: number = 0;
  private _h: number;
  private _v: number;

  private _moveDirection: Vector3 = new Vector3();
  private _inputAmt: number;

  // dashing
  private _dashPressed: boolean;
  private _canDash: boolean = true;

  // gravity, ground detection, jumping
  private _gravity: Vector3 = new Vector3();
  private _lastGroundPos: Vector3 = Vector3.Zero();
  private _grounded: boolean;
  private _jumpCount: number = 1;

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

    // --DASHING--
    //limit dash to once per ground/platform touch can only dash when in the air
    if (
      this._input.dashing &&
      !this._dashPressed &&
      this._canDash &&
      !this._grounded
    ) {
      this._canDash = false;
      this._dashPressed = true;
    }

    let dashFactor = 1;
    if (this._dashPressed) {
      if (this.dashTime > Player.DASH_TIME) {
        this.dashTime = 0;
        this._dashPressed = false;
      } else {
        dashFactor = Player.DASH_FACTOR;
      }
      this.dashTime++;
    }

    // --MOVEMENTS BASED ON CAMERA (as it rotates)--
    let fwd = this._camRoot.forward;
    let right = this._camRoot.right;
    let correctedVertical = fwd.scaleInPlace(this._v);
    let correctedHorizontal = right.scaleInPlace(this._h);

    let move = correctedHorizontal.addInPlace(correctedVertical);

    this._moveDirection = new Vector3(
      move.normalize().x * dashFactor,
      0,
      move.normalize().z * dashFactor
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
    this._updateGroundDetection();
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

  private _floorRaycast(
    offsetx: number,
    offsetz: number,
    raycastlen: number
  ): Vector3 {
    let raycastFloorPos = new Vector3(
      this.mesh.position.x + offsetx,
      this.mesh.position.y + 0.5,
      this.mesh.position.z + offsetz
    );
    let ray = new Ray(raycastFloorPos, Vector3.Up().scale(-1), raycastlen);

    let predicate = function (mesh) {
      return mesh.isPickable && mesh.isEnabled();
    };

    let pick = this.scene.pickWithRay(ray, predicate);

    if (pick.hit) {
      return pick.pickedPoint;
    } else {
      return Vector3.Zero();
    }
  }

  private _isGrounded(): boolean {
    if (this._floorRaycast(0, 0, 0.6).equals(Vector3.Zero())) {
      return false;
    } else {
      return true;
    }
  }

  private _checkSlope(): boolean {
    let predicate = function (mesh) {
      return mesh.isPickable && mesh.isEnabled();
    };

    // 4 raycasts outward from center
    let raycast = new Vector3(
      this.mesh.position.x,
      this.mesh.position.y + 0.5,
      this.mesh.position.z + 0.25
    );
    let ray = new Ray(raycast, Vector3.Up().scale(-1), 1.5);
    let pick = this.scene.pickWithRay(ray, predicate);

    let raycast2 = new Vector3(
      this.mesh.position.x,
      this.mesh.position.y + 0.5,
      this.mesh.position.z - 0.25
    );
    let ray2 = new Ray(raycast2, Vector3.Up().scale(-1), 1.5);
    let pick2 = this.scene.pickWithRay(ray2, predicate);

    let raycast3 = new Vector3(
      this.mesh.position.x + 0.25,
      this.mesh.position.y + 0.5,
      this.mesh.position.z
    );
    let ray3 = new Ray(raycast3, Vector3.Up().scale(-1), 1.5);
    let pick3 = this.scene.pickWithRay(ray3, predicate);

    let raycast4 = new Vector3(
      this.mesh.position.x - 0.25,
      this.mesh.position.y + 0.5,
      this.mesh.position.z
    );
    let ray4 = new Ray(raycast4, Vector3.Up().scale(-1), 1.5);
    let pick4 = this.scene.pickWithRay(ray4, predicate);

    if (pick.hit && !pick.getNormal().equals(Vector3.Up())) {
      if (pick.pickedMesh.name.includes("stair")) {
        return true;
      }
    } else if (pick2.hit && !pick2.getNormal().equals(Vector3.Up())) {
      if (pick2.pickedMesh.name.includes("stair")) {
        return true;
      }
    } else if (pick3.hit && !pick3.getNormal().equals(Vector3.Up())) {
      if (pick3.pickedMesh.name.includes("stair")) {
        return true;
      }
    } else if (pick4.hit && !pick4.getNormal().equals(Vector3.Up())) {
      if (pick4.pickedMesh.name.includes("stair")) {
        return true;
      }
    }
    return false;
  }

  private _updateGroundDetection(): void {
    this._deltaTime = this.scene.getEngine().getDeltaTime() / 1000.0;

    if (!this._isGrounded()) {
      //if the body isn't grounded, check if it's on a slope and was either falling or walking onto it
      if (this._checkSlope() && this._gravity.y <= 0) {
        console.log("slope");
        //if you are considered on a slope, you're able to jump and gravity wont affect you
        this._gravity.y = 0;
        this._jumpCount = 1;
        this._grounded = true;
      } else {
        this._gravity = this._gravity.addInPlace(
          Vector3.Up().scale(this._deltaTime * Player.GRAVITY)
        );
        this._grounded = false;
      }
    }

    if (this._gravity.y < -Player.JUMP_FORCE) {
      this._gravity.y = -Player.JUMP_FORCE;
    }

    this.mesh.moveWithCollisions(this._moveDirection.addInPlace(this._gravity));

    if (this._isGrounded()) {
      this._gravity.y = 0;
      this._grounded = true;
      this._lastGroundPos.copyFrom(this.mesh.position);

      this._jumpCount = 1;
      this._canDash = true;
      this.dashTime = 0;
      this._dashPressed = false;
    }

    if (this._input.jumpKeyDown && this._jumpCount > 0) {
      this._gravity.y = Player.JUMP_FORCE;
      this._jumpCount--;
    }
  }
}
