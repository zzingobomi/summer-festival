import {
  Color3,
  Mesh,
  MeshBuilder,
  PBRMetallicRoughnessMaterial,
  Scene,
  SceneLoader,
  Texture,
  TransformNode,
  Vector3,
} from "@babylonjs/core";
import { Lantern } from "./lantern";

export class Environment {
  private _scene: Scene;

  // Meshes
  private _lanternObjs: Array<Lantern>;
  private _lightmtl: PBRMetallicRoughnessMaterial;

  constructor(scene: Scene) {
    this._scene = scene;
    this._lanternObjs = [];

    const lightmtl = new PBRMetallicRoughnessMaterial(
      "lantern mesh light",
      this._scene
    );
    lightmtl.emissiveTexture = new Texture(
      "/textures/litLantern.png",
      this._scene,
      true,
      false
    );
    lightmtl.emissiveColor = new Color3(
      0.8784313725490196,
      0.7568627450980392,
      0.6235294117647059
    );
    this._lightmtl = lightmtl;
  }

  public async load() {
    const assets = await this._loadAsset();

    assets.allMeshes.forEach((m) => {
      m.receiveShadows = true;
      m.checkCollisions = true;
    });

    // --LANTERNS--
    assets.lantern.isVisible = false;
    const lanternHolder = new TransformNode("lanternHolder", this._scene);
    for (let i = 0; i < 22; i++) {
      let lanternInstance = assets.lantern.clone("lantern" + i);
      lanternInstance.isVisible = true;
      lanternInstance.setParent(lanternHolder);

      let newLantern = new Lantern(
        this._lightmtl,
        lanternInstance,
        this._scene,
        assets.env
          .getChildTransformNodes(false)
          .find((m) => m.name === "lantern " + i)
          .getAbsolutePosition()
      );
      this._lanternObjs.push(newLantern);
    }

    assets.lantern.dispose();
  }

  public async _loadAsset() {
    const result = await SceneLoader.ImportMeshAsync(
      null,
      "./models/",
      "envSetting.glb",
      this._scene
    );

    let env = result.meshes[0];
    let allMeshes = env.getChildMeshes();

    // loads lantern mesh
    const res = await SceneLoader.ImportMeshAsync(
      "",
      "./models/",
      "lantern.glb",
      this._scene
    );

    let lantern = res.meshes[0].getChildren()[0];
    lantern.parent = null;
    res.meshes[0].dispose();

    return {
      env: env,
      allMeshes: allMeshes,
      lantern: lantern as Mesh,
    };
  }
}
