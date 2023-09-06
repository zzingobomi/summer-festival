import { MeshBuilder, Scene, SceneLoader, Vector3 } from "@babylonjs/core";

export class Environment {
  private _scene: Scene;

  constructor(scene: Scene) {
    this._scene = scene;
  }

  public async load() {
    const assets = await this._loadAsset();

    assets.allMeshes.forEach((m) => {
      m.receiveShadows = true;
      m.checkCollisions = true;
    });
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

    return {
      env: env,
      allMeshes: allMeshes,
    };
  }
}
