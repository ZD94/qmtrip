
class Menuitem {
    id:number;
    icon:string;
    title:string;
    link:string;
    badgenum:number;
}

class Menu {
    menus:Menuitem[] = [];
    notie:boolean = false;
    get() :any { //获得所有menus
        var self = this;
        return self.menus;

    }
    getone(title:string) :any { //获取某一项menu
        var self = this;
        for(var i =0; i<self.menus.length;i++){
            if(self.menus[i].title ==title) {
                return self.menus[i];
            }
        }

    }
    del(title:string) {  //删除某一项menu
        var self = this;
        for(var i =0; i<self.menus.length;i++){
            if(self.menus[i].title ==title) {
                self.menus.splice(i,1);
                return true;
            }
        }
        return undefined;
    }
    delall() :any { //删除所有menus
        var self = this;
        self.menus = []; //清空原有menus
        return self.menus;
    }
    add(item:Menuitem) :any { //添加menu
        var self = this;
        var assist = 0;
        for(var i =0;i<self.menus.length;i++){
            if(typeof(self.menus[i-1])!="undefined"){
                if(item.id == self.menus[i-1].id){
                    assist =1;
                    break;
                }
            }
        }
        if(self.menus.length == 0 || assist == 0){
            self.menus.push(item);
        }
        return self.menus;
    }
    set(item:Menuitem) :Menuitem { //更改item
        var self = this;
        for(var i =0; i<self.menus.length;i++){
            if(self.menus[i].title ==item.title) {
                return self.menus[i] = item;
            }
        }
        return undefined;
    }
    badge(item:Menuitem) { //如果有通知气泡,通知数量
        var self = this;
        for(var i =0; i<self.menus.length;i++){
            if(self.menus[i].title ==item.title) {
                self.menus[i].badgenum +=1;
                return self.menus[i];
            }
        }
    }
    newnotice(istrue:boolean) { //是否有通知气泡
        var self = this;
        self.notie = istrue;
        return self.notie;
    }
}

angular.module('nglibs')
    .service('Menu', Menu);
