'use strict';

class A{
    static funca(){
        console.log('a');
    }
}
class B extends A{
    static funcb(){
        console.log('b');
    }
}
console.log(Object.keys(B));
console.log(Object.getOwnPropertyNames(B));
console.log(Object.getOwnPropertyNames(B['__proto__']));

for(let k in B){
    console.log(k);
}

B.funca();
B.funcb();

