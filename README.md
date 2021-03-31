<p align="center">
  <a href="https://github.com/diddlesnaps/snapcraft-review-action/actions"><img alt="snapcraft-publish-action status" src="https://github.com/diddlesnaps/snapcraft-review-action/workflows/build-test/badge.svg"></a>
</p>

# Snapcraft Snap Review Action

This is a Github Action that can be used to review [snap packages](https://snapcraft.io/) using the same [review tools](https://snapcraft.io/review-tools) as the Snap Store. In most cases, it will be used with the snapcraft-build-action action to build the package. The following workflow should be sufficient:

```yaml
jobs:
  build:
    runs-on: ubuntu-latest
    steps:
    - uses: actions/checkout@v2
    - uses: snapcore/action-build@v1
      id: build
    - uses: diddlesnaps/snapcraft-review-tools-action@v1
      with:
        snap: ${{ steps.build.outputs.snap }}
```

This will build the project and run the review-tools Snap Review program on the result. In addition to the configuration parameter `snap` you may also optionally specify paths for plugs and slots declaration files in the `plugs` and `slots` keys respectively. The final configuration parameter that may be specified is called `isClassic` which you must set to `true` to indicate that the Snap is expected to use `classic` confinement.

A full configuration could look like below:

```yaml
jobs:
  build:
    runs-on: ubuntu-latest
    steps:
    - uses: actions/checkout@v2
    - uses: snapcore/action-build@v1
      id: build
    - uses: diddlesnaps/snapcraft-review-action@v1
      with:
        snap: ${{ steps.build.outputs.snap }}
        plugs: ./plug-declaration.json
        slots: ./slot-declaration.json
        isClassic: 'false'
```

# Other Snapcraft actions

The Snapcraft community has created other actions that may be useful for Snap Packagers:

* [Snapcraft Build Action](https://github.com/snapcore/action-build)
* [Snapcraft Publish Action](https://github.com/snapcore/action-publish)
