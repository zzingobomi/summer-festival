import {
  Mesh,
  MeshBuilder,
  Scene,
  SceneLoader,
  TransformNode,
  Vector3,
} from "@babylonjs/core";

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

    // --LANTERNS--
    assets.lantern.isVisible = false;
    const lanternHolder = new TransformNode("lanternHolder", this._scene);
    for (let i = 0; i < 22; i++) {
      let lanternInstance = assets.lantern.clone("lantern" + i);
      lanternInstance.isVisible = true;
      lanternInstance.setParent(lanternHolder);

      //let newLantern = new Lantern(.....)
    }
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
