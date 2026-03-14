# Helper 补丁说明

这个目录用于保存无法直接推送到远端仓库时的补丁文件。

当前文件：

- `xyzw_web_helper-main.patch`

用途：

- 把本地 `xyzw_web_helper` 的改动打成可应用补丁
- 方便在服务器上拉取原仓库后直接复现本地修改

当前补丁对应关系：

- 基线远端提交：`7cc2d32e93539479b4d3d465b982235ef5ac305e`
- 本地导出提交：`79c150b8b0d8caa249b5d819e47e4e69f6950fed`

## 使用方法

在服务器上进入 `xyzw_web_helper` 仓库目录后执行：

```bash
git checkout 7cc2d32e93539479b4d3d465b982235ef5ac305e
git apply --index /path/to/gongfa/exports/xyzw_web_helper-main.patch
git status
```

如果要直接形成一个本地提交，再执行：

```bash
git commit -m "feat: update helper token and import flow"
```

## 说明

- 补丁里包含二进制资源文件 `public/legacy-assets/*`
- `git apply --index` 需要在 Git 仓库内执行
- 如果你的服务器上 `xyzw_web_helper` 不是这个基线提交，建议先切到上面的基线再应用
