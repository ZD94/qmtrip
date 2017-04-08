'use strict';

var fs = require('fs');
var esprima = require('esprima');
var escodegen = require('escodegen');

var content = fs.readFileSync('tmp/tsreq/api/tripPlan/index.js', 'utf8');

var ast = esprima.parse(content, {
    loc: true,
    //range: true,
    //tokens: true,
    //comment: true,
    source: 'tmp/tsreq/_types/staff.js',
});
//ast = escodegen.attachComments(ast, ast.comments, ast.tokens);

//console.log(JSON.stringify(ast, null, ' '));

var traverse = require("ast-traverse");

var paths = [];


function checkTsDecorator(node){
    if(node.type !== 'ExpressionStatement')
        return false;
    var exp = node.expression;
    if(!exp || exp.type !== 'CallExpression')
        return false;
    if(!exp.callee || exp.callee.name !== '__decorate')
        return false;
    var args = exp.arguments;
    if(!args || !Array.isArray(args) || args.length !== 4)
        return false;

    //第一个参数为数组
    if(args[0].type !== 'ArrayExpression')
        return false;
    //第二个参数必须为 *.prototype
    if(args[1].type !== 'Identifier' && (args[1].type !== 'MemberExpression' || args[1].property.name !== 'prototype'))
        return false;
    //第三个参数是方法名
    if(args[2].type != 'Literal')
        return false;

    return true;
}

function hasTsDecorator(node, name){
    //检查第一个参数数组中的decorator
    var decorators = node.expression.arguments[0].elements;
    for(let i=0; i<decorators.length; i++){
        let d = decorators[i];
        if(d.type === 'CallExpression')
            d = d.callee;
        if(d.type === 'MemberExpression')
            d = d.property;
        if(d.type === 'Identifier' && d.name === name){
            return true;
        }
    }
    return false;
}

function findRemoteFunc(node){
    if(!checkTsDecorator(node))
        return null;
    if(!hasTsDecorator(node, 'clientExport'))
        return null;
    console.log(node.expression.arguments[0].type)

    var arg1 = node.expression.arguments[1];
    if(arg1.type == 'MemberExpression')
        arg1 = arg1.object;
    var clsname = arg1.name;
    var funcname = node.expression.arguments[2].value;
    return { clsname, funcname };
}

function findDeclaration(node, idx, varname){
    for(let i=idx; i>=0; i--){
        let n = node.body[i];
        if(n.type !== 'VariableDeclaration')
            continue;
        for(let j=0; j<n.declarations.length; j++){
            let d = n.declarations[j];
            if(d.type === 'VariableDeclarator'
                && d.id && d.id.type === 'Identifier'
                && d.id.name === varname
            ){
                return d;
            }
        }
    }
    return null;
}

function findClassExpression(node, idx, clsname){
    if(!node)
        return null;
    console.log(node.type);
    for(let i=idx; i>=0; i--){
        let n = node.body[i];
        if(n.type === 'ClassDeclaration'){
            if(checkClass(n, clsname))
                return n;
        }else if(n.type === 'VariableDeclaration'){
            for(let j=0; j<n.declarations.length; j++){
                let d = n.declarations[j];
                if(d.type !== 'VariableDeclarator' || d.init.type !== 'ClassExpression'){
                    continue;
                }
                //console.log('> >', d.type, init.type);
                if(checkClass(d.init, clsname)){
                    return d.init;
                }
            }
        }
    }
    return null;
    function checkClass(node, clsname){
        if(node.id && node.id.type === 'Identifier' && node.id.name === clsname)
            return true;
        return false;
    }
}

function findMethodDefinition(node, funcname){
    if(!node || (node.type !== 'ClassDeclaration' && node.type !== 'ClassExpression'))
        return null;
    if(!node.body || node.body.type !== 'ClassBody' || !node.body.body)
        return null;
    let body = node.body.body;
    for(let i=0; i<body.length; i++){
        let n = body[i];
        if(!n || n.type !== 'MethodDefinition' || !n.key || n.key.type !== 'Identifier')
            continue;
        if(n.key.name === funcname)
            return n;
    }
    return null;
}

// print AST node types, pre-order (node first, then its children)
traverse(ast, {
    pre: function (node, parent, prop, idx) {
        paths.push(node);

        var remoteFunc = findRemoteFunc(node);
        if(remoteFunc == null)
            return;

        console.log(node.type + (parent ? " from parent " + parent.type +
            " via " + prop + (idx !== undefined ? "[" + idx + "]" : "") : ""));

        console.log('Remote function:', remoteFunc.clsname, remoteFunc.funcname);

        var clsnode = findClassExpression(parent, idx, remoteFunc.clsname);
        //console.log(JSON.stringify(clsnode, null, ' '));

        var funcnode = findMethodDefinition(clsnode, remoteFunc.funcname);
        //console.log(JSON.stringify(funcnode, null, ' '));

        var funcbody = funcnode.value.body;
        funcbody.body = [];

        //console.log(JSON.stringify(parent, null, ' '));
        //for(let i=0; i<paths.length; i++){
        //    console.log(paths[i].type);
        //}

    },
    post: function(node){
        var last = paths.pop();
        if(last !== node)
            console.error('ERROR: node is not last parent.');
    }
});

var output = escodegen.generate(ast, {
    comment: true,
    sourceMap: true,
    sourceMapWithCode: true,
    sourceContent: content
});


var newCode = output.code; // Does not include the extra newlines!
//console.log(newCode);
var map = output.map.toString();
//console.log(map);
