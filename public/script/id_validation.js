/**
 * Created by YCXJ-wanglihui on 2014/8/13.
 */
'use strict';
(function(name, definition) {
  if (typeof define === 'function') {
    define([name], definition());
  } else if (typeof exports === 'object' && typeof module === 'object' && module.exports === 'object') {
    //如果是node，导出模块
    module.exports = definition();
  } else {
    //浏览器下，直接赋值到window
    window[name] = definition();
  }
})("Card", function() {
  /**
   * class 身份证 Card
   * @constructor
   * @param {String} card 身份证号
   */
  function Card(card) {
    this.card = card;
  }

  /**
   * @method 身份证是否合法 isValid
   * @returns {boolean}
   */
  Card.prototype.isValid = function() {
    //如果长度不符合，返回false
    if (!this.card || (this.card.length != 15 && this.card.length != 18)) {
      return false;
    }

    //如果身份证不全数字或前N位数字，最后一位X,返回false
    if (!/^\d+[\dxX]$/.test(this.card)) {
      return false;
    }

    //sum += 身份证[i]* checkNum[i]
    var checkNum = [7,9,10,5,8,4,2,1,6,3,7,9,10,5,8,4,2];
    var sum = 0;
    for(var i=0;i<this.card.length-1;i++){
      sum += parseInt(this.card[i]) * checkNum[i];
    }
    var endFix = this.card[i];
    // sum = sum % 11
    sum = sum % 11;
    //sum 对应关系
    //0 1 2 3 4 5 6 7 8 9 10
    //1 0 X 9 8 7 6 5 4 3 2
    if ((sum == 0 && endFix == '1') ||
      (sum == 1 && endFix == '0') ||
      (sum == 2 && (endFix == 'X'|| endFix == 'x' )) ||
      (sum == 3 && endFix == '9') ||
      (sum == 4 && endFix == '8') ||
      (sum == 5 && endFix == '7') ||
      (sum == 6 && endFix == '6') ||
      (sum == 7 && endFix == '5') ||
      (sum == 8 && endFix == '4') ||
      (sum == 9 && endFix == '3') ||
      (sum == 10 && endFix == '2')){
      return true;
    }
    return false;
  }

  /**
   * @method 获取生日 getBirthDay
   * @returns {Date|false}
   */
  Card.prototype.getBirthDay = function(){
    if (this.isValid()) {
      var year = null;
      var month = null;
      var day = null;
      if (this.length == 15) {
        year = this.card.substr(6, 2);
        month = this.card.substr(8, 2);
        day = this.card(10, 2);
      } else {
        year = this.card.substr(6, 4);
        month = this.card.substr(10 ,2);
        day = this.card.substr(12, 2);
      }

      year = parseInt(year)
      month = parseInt(month);
      day = parseInt(day);
      var d = new Date(year, month-1, day);
      return d;
    }
    return false;
  }

  /**
   * @method 获取性别 getSex
   * @returns 1.男 2.女 false不合法
   */
  Card.prototype.getSex = function() {
    if (this.isValid()) {
      var sex = null;
      if (this.length == 15) {
        sex = this.card.substr(14, 1);
      } else {
        sex = this.card.substr(17, 1);
      }
      if (parseInt(sex) % 2) {
        return 2;
      } else {
        return 1
      }
    }
    return false;
  }

  /**
   * @method 获取年龄 getAge
   * @returns {Number}
   */
  Card.prototype.getAge = function() {
    var birthDay = this.getBirthDay();
    var year = (new Date().getTime() - birthDay) / (1000 * 60 * 60 * 24 * 365);
    var intYear = parseInt(year);
    if (year > intYear) {
      intYear += 1;
    }
    return intYear;
  }

  return Card;
});