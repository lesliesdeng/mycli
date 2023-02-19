const { promisify } = require('util');
const path = require('path');
const inquirer = require('inquirer');
const fs = require('fs');

const download = promisify(require('download-git-repo'));
const open = require('open');

const { repoMap } = require('../config/repo-config');
const { commandSpawn } = require('../utils/terminal');
const { compile, writeToFile, createDirSync } = require('../utils/utils');

const typeCheckbox = async () => {
  let { list } = await inquirer.prompt([
    {
      name: 'list',
      type: 'list',
      message: 'list',
      // choices: ['vue2', 'vue3', 'react','vue2Admin','vue3Admin'],
      choices: ['vue2Admin','vue3Admin'],
      default: ['vue3Admin']
    }
  ]);
  return list
}

// callback -> promisify(函数) -> Promise -> async await
const createProjectAction = async (project) => {
  // 用户选项
  const type = await typeCheckbox();
  console.log(repoMap[type])
  // 1.clone项目
  await download(repoMap[type], project, { clone: true });

  // 2.执行npm install
  const command = process.platform === 'win32' ? 'npm.cmd' : 'npm';
  await commandSpawn(command, ['install'], { cwd: `./${project}` })

  // 3.运行npm run serve
  commandSpawn(command, ['run', 'serve'], { cwd: `./${project}` });

  // 4.打开浏览器
  open("http://localhost:8080/");
}

// 添加组件的action
const addComponentAction = async (name, dest) => {
  // 1.编译ejs模板 result
  const result = await compile("vue-component.ejs", { name, lowerName: name.toLowerCase() });

  // 2.写入文件的操作
  const targetPath = path.resolve(dest, `${name}.vue`);
  console.log(targetPath);
  writeToFile(targetPath, result);
}


// 添加组件和路由
const addPageAndRouteAction = async (name, dest) => {
  // 1.编译ejs模板
  const data = { name, lowerName: name.toLowerCase() };
  const pageResult = await compile('vue-component.ejs', data);
  const routeResult = await compile('vue-router.ejs', data);

  // 3.写入文件
  const targetDest = path.resolve(dest, name.toLowerCase());
  if (createDirSync(targetDest)) {
    const targetPagePath = path.resolve(targetDest, `${name}.vue`);
    const targetRoutePath = path.resolve(targetDest, 'router.js')
    writeToFile(targetPagePath, pageResult);
    writeToFile(targetRoutePath, routeResult);
  }
}

// 创建store
const addStoreAction = async (name, parent,dest) => {
    const nameUp = name.charAt(0).toUpperCase() + name.slice(1);
    const parentUp = parent?parent.charAt(0).toUpperCase() + parent.slice(1):''
    const storeResult = await compile('vue-store.ejs', {name,parent,nameUp,parentUp});
    const targetDest = parent?path.resolve(dest, parent.toLowerCase()):path.resolve(dest);
    if (createDirSync(targetDest)) {
      const targetPagePath = path.resolve(targetDest, `${name}.js`);
      writeToFile(targetPagePath, storeResult);
    }
}

// 创建路由
const addRouterAction = async (name, parent,dest) => {
    const nameUp = name.charAt(0).toUpperCase() + name.slice(1);
    const parentUp = parent?parent.charAt(0).toUpperCase() + parent.slice(1):''
    const routeResult = await compile('vue-router.ejs', {name,parent,nameUp,parentUp});
    const destUrl = parent?`${dest}/${parent}/${name}`:`${dest}/${name}`
    const targetDest = path.resolve(destUrl);
    if (createDirSync(targetDest)) {
      const targetRoutePath = path.resolve(targetDest, 'router.js')
      writeToFile(targetRoutePath, routeResult);
    }
  }

// 添加service
const addServiceAction = async (name, parent,dest) => {
    const nameUp = name.charAt(0).toUpperCase() + name.slice(1);
    const parentUp = parent?parent.charAt(0).toUpperCase() + parent.slice(1):''
    const serviceResult = await compile('vue-service.ejs', {name,parent,nameUp,parentUp});
    const targetDest = parent?path.resolve(dest, parent.toLowerCase()):path.resolve(dest);
    if (createDirSync(targetDest)) {
      const targetPagePath = path.resolve(targetDest, `${name}.js`);
      writeToFile(targetPagePath, serviceResult);
    }
}

//   创建完整页面=>vue2
  const addViewAction = async (name, parent,dest) => {
    const apiUrl = 'src/service/api.json';
    const nameUp = name.charAt(0).toUpperCase() + name.slice(1);
    const parentUp = parent?parent.charAt(0).toUpperCase() + parent.slice(1):''
    // 创建service
    addServiceAction(name, parent,'src/service')
    // 创建store
    addStoreAction(name, parent,'src/store')

    // 创建路由：只有在view路径下的才创建路由
    if(!dest || dest === 'src/views'){
        addRouterAction(name, parent,dest)
    }

    const pageResult = await compile('vue-page.ejs', {name,parent,nameUp,parentUp});
    const pageContentResult = await compile('vue-page-content.ejs', {name,parent,nameUp,parentUp});
    const pageModalResult = await compile('vue-page-modal.ejs', {name,parent,nameUp,parentUp});
    const pageSearchResult = await compile('vue-page-search.ejs', {name,parent,nameUp,parentUp});

    const destUrl = parent?`${dest}/${parent}/${name}`:`${dest}/${name}`
    const targetDest = path.resolve(destUrl);
    const targetDestConfig = path.resolve(`${destUrl}/config`);
    // api文件中每个页面的接口模板
    const apiJsonItem = {
        query: "",
        deleteItem: "",
        create: "",
        edit: ""
    }
    const dealApi = function(){
        const apiFile = fs.readFileSync(apiUrl,'utf-8',function(err){
            console.log(err);
        });

        const apiJson = JSON.parse(apiFile)
        apiJson[`${parent}${nameUp}`] = apiJsonItem
        fs.writeFileSync(apiUrl,JSON.stringify(apiJson,null,4))
    }
    if (createDirSync(targetDest)) {
      const targetPagePath = path.resolve(targetDest, `index.vue`);
      writeToFile(targetPagePath, pageResult);
    }
    if (createDirSync(targetDestConfig)){
        const targetPageContentPath = path.resolve(targetDestConfig, `content.config.js`);
        const targetPageModalPath = path.resolve(targetDestConfig, `modal.config.js`);
        const targetPageSearchPath = path.resolve(targetDestConfig, `search.config.js`);
        writeToFile(targetPageContentPath, pageContentResult);
        writeToFile(targetPageModalPath, pageModalResult);
        writeToFile(targetPageSearchPath, pageSearchResult);
    }
    // 处理api文件
    if (createDirSync(path.resolve(`src/service`))){
        fs.access(apiUrl,fs.constants.F_OK,(error)=>{
            // 没有api文件新建，有则写入
            if(error){
                fs.writeFile(apiUrl, JSON.stringify(apiJsonItem,null,4),'utf8', function(err){
                    console.log(err);
                })
            }else{
                dealApi();
            }
        })
    }
  }

  // 创建完整页面 vue3
  const addVue3ViewAction = async (name, parent,dest) => {
    const folderName = dest?dest.split('/')[dest.split('/').length-1]:'main'
    const nameUp = name.charAt(0).toUpperCase() + name.slice(1);
    const parentUp = parent?parent.charAt(0).toUpperCase() + parent.slice(1):''
    // 创建service
    // addServiceAction(name, parent,'src/service')

    // 创建store
    const storeResultIndex = await compile('vue3/vue-store-index.ejs', {name,parent,nameUp,parentUp,folderName});
    const storeResultType = await compile('vue3/vue-store-type.ejs', {name,parent,nameUp,parentUp,folderName});

    const targetDestStore = parent?path.resolve(`src/store/${folderName}/${parent}/${name}`):path.resolve(`src/store/${folderName}/${name}`);
    if (createDirSync(targetDestStore)) {
      const targetPagePathIndex = path.resolve(targetDestStore, `index.ts`);
      writeToFile(targetPagePathIndex, storeResultIndex);
      const targetPagePathType = path.resolve(targetDestStore, `types.ts`);
      writeToFile(targetPagePathType, storeResultType);
    }

    // 创建路由：只有在view路径下的才创建路由
    if(!dest || dest.indexOf('src/views') !== -1){
        const routeResult = await compile('vue3/vue-router.ejs', {name,parent,nameUp,parentUp,folderName});
        const destUrl = parent?`src/router/${folderName}/${parent}/${name}`:`src/router/${folderName}/${name}`
        const targetDest = path.resolve(destUrl);
        if (createDirSync(targetDest)) {
          const targetRoutePath = path.resolve(targetDest, `${name}.ts`)
          writeToFile(targetRoutePath, routeResult);
        }
    }

    const pageResult = await compile('vue3/vue-page.ejs', {name,parent,nameUp,parentUp});
    const pageContentResult = await compile('vue3/vue-page-content.ejs', {name,parent,nameUp,parentUp});
    const pageModalResult = await compile('vue3/vue-page-modal.ejs', {name,parent,nameUp,parentUp});
    const pageSearchResult = await compile('vue3/vue-page-search.ejs', {name,parent,nameUp,parentUp});
    const destUrl = parent?`${dest}/${parent}/${name}`:`${dest}/${name}`
    const targetDest = path.resolve(destUrl);
    const targetDestConfig = path.resolve(`${destUrl}/config`);
    if (createDirSync(targetDest)) {
      const targetPagePath = path.resolve(targetDest, `${name}.vue`);
      writeToFile(targetPagePath, pageResult);
    }
    if (createDirSync(targetDestConfig)){
        const targetPageContentPath = path.resolve(targetDestConfig, `content.config.ts`);
        const targetPageModalPath = path.resolve(targetDestConfig, `modal.config.ts`);
        const targetPageSearchPath = path.resolve(targetDestConfig, `search.config.ts`);
        writeToFile(targetPageContentPath, pageContentResult);
        writeToFile(targetPageModalPath, pageModalResult);
        writeToFile(targetPageSearchPath, pageSearchResult);
    }
  }

  
module.exports = {
  createProjectAction,
  addComponentAction,
  addPageAndRouteAction,
  addStoreAction,
  addServiceAction,
  addRouterAction,
  addViewAction,
  addVue3ViewAction
}