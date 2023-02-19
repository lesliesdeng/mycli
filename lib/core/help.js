const program = require('commander');

const helpOptions = () => {
  // 增加自己的options
  program.option('-w --why', 'a why cli');
  program.option('-d --dest <dest>', 'a destination folder, 例如: -d /src/components')
  program.option('-f --framework <framework>', 'your frameword')

  program.on('--help', function () {
    console.log("");
    console.log("Other:")
    console.log("  other options~");
  })
}

module.exports = helpOptions;

// 1.Buffer
// 2.理论: 事件循环(浏览器/Node)
