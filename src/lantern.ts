import {
  Scene,
  PBRMetallicRoughnessMaterial,
  Mesh,
  Vector3,
  AnimationGroup,
  PointLight,
  MeshBuilder,
} from "@babylonjs/core";

export class Lantern {
  public _scene: Scene;

  public mesh: Mesh;
  public isLit: boolean = false;
  private _lightmtl: PBRMetallicRoughnessMaterial;
  private _light: PointLight;

  private _lightSphere: Mesh;

  constructor(
    lightmtl: PBRMetallicRoughnessMaterial,
    mesh: Mesh,
    scene: Scene,
    position: Vector3,
    animationGroups?: AnimationGroup
  ) {
    this._scene = scene;
    this._lightmtl = lightmtl;

    const lightSphere = MeshBuilder.CreateSphere(
      "illum",
      { segments: 4, diameter: 20 },
      this._scene
    );
    lightSphere.scaling.y = 2;
    lightSphere.setAbsolutePosition(position);
    lightSphere.parent = this.mesh;
    lightSphere.isVisible = false;
    lightSphere.isPickable = false;
    this._lightSphere = lightSphere;

    this._loadLantern(mesh, position);
  }

  private _loadLantern(mesh: Mesh, position: Vector3) {
    this.mesh = mesh;
    this.mesh.scaling = new Vector3(0.8, 0.8, 0.8);
    this.mesh.setAbsolutePosition(position);
    this.mesh.isPickable = false;
  }
}
