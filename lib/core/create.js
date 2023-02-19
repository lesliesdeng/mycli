const program = require('commander');

const {
  createProjectAction,
  addComponentAction,
  addPageAndRouteAction,
  addStoreAction,
  addServiceAction,
  addViewAction,
  addRouterAction,
  addVue3ViewAction
} = require('./actions');

const createCommands = () => {
    program
        .command('create <project> [others...]')
        .description('clone a repository into a folder')
        .action(createProjectAction);

    // 常规组件
    program
        .command('addcpn <name>')
        .description('例如: lesliecli addcpn HelloWorld [-d src/components]')
        .action((name) => {
            addComponentAction(name, program.dest || 'src/components');
        });

    // 常规页面
    program
        .command('addp <page>')
        .description('例如: lesliecli addpage Home [-d src/views]')
        .action((page) => {
            addPageAndRouteAction(page, program.dest || 'src/views')
        })

    program
        .command('addstore <store> [parent]')
        .description(' 例如: lesliecli addpage Home [-d src/pages]')
        .action((store,parent) => {
            addStoreAction(store, parent,program.dest || 'src/store')
        })
    program
        .command('addservice <store> [parent]')
        .description(' 例如: lesliecli addpage Home [-d src/pages]')
        .action((store,parent) => {
            addServiceAction(store, parent, program.dest || 'src/service')
        })
    
    // 定制化页面
    program
        .command('addv <view> [parent]')
        .description(' 例如: lesliecli addview Home [-d src/pages]')
        .action((view,parent) => {
            addViewAction(view, parent,program.dest || 'src/views')
        })

    // 定制化组件
    program
        .command('addc <view> [parent]')
        .description(' 例如: lesliecli addc Home [-d src/pages]')
        .action((view,parent) => {
            addViewAction(view, parent,program.dest || 'src/components')
        })
    program
        .command('addr <router> [parent]')
        .description(' 例如: lesliecli addpage Home [-d src/pages]')
        .action((router,parent) => {
            addRouterAction(router, parent,program.dest || 'src/view')
        })
    //定制化页面-vue3 
    program
        .command('addv3 <view> [parent]')
        .description(' 例如: lesliecli addview Home [-d src/pages]')
        .action((view,parent) => {
            addVue3ViewAction(view, parent,program.dest || 'src/views/main')
        })
    program
        .command('addc3 <view> [parent]')
        .description(' 例如: lesliecli addc Home [-d src/pages]')
        .action((view,parent) => {
            addVue3ViewAction(view, parent,program.dest || 'src/components')
        })

}


module.exports = createCommands;
