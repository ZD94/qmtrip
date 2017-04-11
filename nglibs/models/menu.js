var Menuitem = (function () {
    function Menuitem() {
    }
    return Menuitem;
}());
var Menu = (function () {
    function Menu() {
        this.menus = [];
        this.notie = false;
    }
    Menu.prototype.get = function () {
        var self = this;
        return self.menus;
    };
    Menu.prototype.getone = function (title) {
        var self = this;
        for (var i = 0; i < self.menus.length; i++) {
            if (self.menus[i].title == title) {
                return self.menus[i];
            }
        }
    };
    Menu.prototype.del = function (title) {
        var self = this;
        for (var i = 0; i < self.menus.length; i++) {
            if (self.menus[i].title == title) {
                self.menus.splice(i, 1);
                return true;
            }
        }
        return undefined;
    };
    Menu.prototype.delall = function () {
        var self = this;
        self.menus = []; //清空原有menus
        return self.menus;
    };
    Menu.prototype.add = function (item) {
        var self = this;
        var assist = 0;
        for (var i = 0; i < self.menus.length; i++) {
            if (typeof (self.menus[i - 1]) != "undefined") {
                if (item.id == self.menus[i - 1].id) {
                    assist = 1;
                    break;
                }
            }
        }
        if (self.menus.length == 0 || assist == 0) {
            self.menus.push(item);
        }
        return self.menus;
    };
    Menu.prototype.set = function (item) {
        var self = this;
        for (var i = 0; i < self.menus.length; i++) {
            if (self.menus[i].title == item.title) {
                return self.menus[i] = item;
            }
        }
        return undefined;
    };
    Menu.prototype.badge = function (item) {
        var self = this;
        for (var i = 0; i < self.menus.length; i++) {
            if (self.menus[i].title == item.title) {
                self.menus[i].badgenum += 1;
                return self.menus[i];
            }
        }
    };
    Menu.prototype.newnotice = function (istrue) {
        var self = this;
        self.notie = istrue;
        return self.notie;
    };
    return Menu;
}());
angular.module('nglibs')
    .service('Menu', Menu);
