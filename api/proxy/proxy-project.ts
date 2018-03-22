const config = require("@jingli/config");

const projects = [
    'java-jingli-mall',
    'java-jingli-order1',
    'java-jingli-ordervalidate'
]

const setting = {};
projects.forEach((project) => { 
    setting[project] = config[project];
})
export = setting;