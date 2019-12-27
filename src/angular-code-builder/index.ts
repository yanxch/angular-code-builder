import {apply, chain, forEach, mergeWith, move, noop, Rule, SchematicContext, SchematicsException, Tree, url} from '@angular-devkit/schematics';
import {getWorkspace, updateWorkspace} from '@schematics/angular/utility/config';
import {WorkspaceSchema} from '@schematics/angular/utility/workspace-models';
import {addPackageJsonDependency, NodeDependencyType as DepType} from '@schematics/angular/utility/dependencies';
import {NodePackageInstallTask} from '@angular-devkit/schematics/tasks';

export function angularCodeBuilder(options: any): Rule {
  return (tree: Tree, context: SchematicContext) => {
    // 1. Install dependency to custom webpack builder
    const customWebpack = {
      type: DepType.Dev,
      name: '@angular-builders/custom-webpack',
      version: options.customWebpackVersion || '^8.4.0',
      overwrite: true
    };

    addPackageJsonDependency(tree, customWebpack);
    context.addTask(new NodePackageInstallTask());

    // 2. Update angular.json
    const workspace = getWorkspace(tree);
    const project = getProject(options, workspace);
    const architect = workspace.projects[project].architect;

    if (!architect) throw new SchematicsException(`Expected node projects/${project}/architect in angular.json`);
    if (!architect.build) throw new SchematicsException(`Expected node projects/${project}/architect/build in angular.json`);
    if (!architect.serve) throw new SchematicsException(`Expected node projects/${project}/architect/serve in angular.json`);

    architect.build.builder =  <any> '@angular-builders/custom-webpack:browser';
    architect.serve.builder = <any> '@angular-builders/custom-webpack:dev-server';

    const buildOptions = <any> architect.build.options;
    const serveOptions = <any> architect.serve.options;

    addWebpackOption(buildOptions, context);
    addWebpackOption(serveOptions, context);

    // 3. Copy files
    return chain([
      copyFiles(options),
      updateWorkspace(workspace)
    ]);
  };
}

function getProject(options: any, workspace: WorkspaceSchema) {
  return options.project || workspace.defaultProject || Object.keys(workspace.projects)[0];
}

function addWebpackOption(options: any, context: SchematicContext) {
  if (options.customWebpackConfig) {
    context.logger.warn(`You are already using a customWebpackConfig in your angular.json. \nWe copied all necessary files to the angular-code folder in the root of your project. \nTake a look at the angular-code.webpack.js configuration and merge it with the existing webpack configuration manually. \nThat should be the only thing you'll have to do manually, all other configuration steps are already done.\n\n`);
  } else {
    options.customWebpackConfig = {
      path: 'angular-code-builder/angular-code-builder.webpack.js'
    };
  }
}

function copyFiles(options: any): Rule {
  return (tree: Tree, context: SchematicContext) => {   
    const configFiles = apply(url('./files'), [
      move('./angular-code-builder'),
      options.overwrite ? overwriteIfExists(tree) : noop()
    ]);
    return mergeWith(configFiles)(tree, context);
  };
}

function overwriteIfExists(tree: Tree): Rule {
  return forEach(fileEntry => {
    if (tree.exists(fileEntry.path)) {
      tree.overwrite(fileEntry.path, fileEntry.content);
      return null;
    }
    return fileEntry;
  });
}