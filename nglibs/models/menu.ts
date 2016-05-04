
class Menuitem {
    icon:string;
    title:string;
    link:string;
    badgenum:number;
}

class Menu {
    menus:Menuitem[] = [];
    notie:boolean = false;
    get() :any {
        var self = this;
        return self.menus;

    }
    getone(title:string) :any {
        var self = this;
        for(var i =0; i<self.menus.length;i++){
            if(self.menus[i].title ==title) {
                return self.menus[i];
            }
        }

    }
    del(title:string) {
        var self = this;
        for(var i =0; i<self.menus.length;i++){
            if(self.menus[i].title ==title) {
                self.menus.splice(i,1);
                return true;
            }
        }
        return undefined;
    }
    delall() :any {
        var self = this;
        self.menus = []; //清空原有menus
        return self.menus;
    }
    add(item:Menuitem) {
        var self = this;
        self.menus.push(item);
        return self.menus;
    }
    set(item:Menuitem) :Menuitem {
        var self = this;
        for(var i =0; i<self.menus.length;i++){
            if(self.menus[i].title ==item.title) {
                return self.menus[i] = item;
            }
        }
        return undefined;
    }
    badge(item:Menuitem) {
        var self = this;
        for(var i =0; i<self.menus.length;i++){
            if(self.menus[i].title ==item.title) {
                self.menus[i].badgenum +=1;
                return self.menus[i];
            }
        }
    }
    newnotice(istrue:boolean) {
        var self = this;
        self.notie = istrue;
        return self.notie;
    }
}

angular.module('nglibs')
    .service('Menu', Menu);
