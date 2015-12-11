/**
 * Created by wlh on 15/7/22.
 */
/**
 * Created by think on 2015/1/19.
 */

/**
 * @class 分页类 Paginate
 * @constructor
 * @param page {Number} 当前页
 * @param perPage {Number} 每页记录数
 * @param total {Number} 总记录数
 * @param items {Array} 当前页记录列表
 *
 * @example
 *  ```
 *  var Paginate = require(REAL_PATH+'/paginator')
 *  var paginate = new Paginate(1, 20, 100, users);
 *  //总页数
 *  var pages = paginate.pages;
 *  //是否有下一页
 *  if (paginate.hasNextPage() === true){}
 *  //是否有上一页
 *  if (paginate.hasPrevPage() === true){}
 *  //上一页
 *  paginate.prevPage()
 *  //下一页
 *  paginate.nextPage()
 *  //总条数
 *  paginate.total()
 *  //当前页条数
 *  paginate.currentPageTotal()
 *  //当前页所有数据
 *  paginate.items()
 *  ```
 */
function Paginate(page, perPage, total, items){
  if(!page || page <1){
    page = 1;
  }else{
    page = parseInt(page)
  }
  if(!perPage || perPage<1){
    perPage = 20;
  }else{
    perPage = parseInt(perPage);
  }

  if(!total || total <0){
    total = 0;
  }else{
    total = parseInt(total);
  }
  if(!items){
    items = [];
  }
  /**
   * @property page 当前页
   * @type {Number}
   */
  this.page = page;

  /**
   * @property perPage 每页条数
   * @type {Number}
   */
  this.perPage = perPage;
  /**
   * @property total 总条数
   * @type {Number}
   */
  this.total = total;
  /**
   * @property items 当前页所包含数据
   * @type {Array}
   */
  this.items = items;
  /**
   * @property currentPageTotal 当前页条目数
   * @type {Number}
   */
  this.currentPageTotal = items.length;
  /**
   * @property pages 总页数
   * @type {number}
   */
  this.pages = 0;
  if(this.total%this.perPage ===0){
    this.pages = parseInt(this.total/this.perPage);
  }else{
    this.pages = parseInt(this.total /this.perPage) + 1;
  }
}

/**
 * 设置当前页数
 * @method setPage
 * @param page {Number}
 */
Paginate.prototype.setPage = function(page){
  this.page = page;
}

/**
 * 设置每页条数
 * @method setPerPage
 * @param perPage {Number}
 */
Paginate.prototype.setPerPage = function(perPage){
  this.perPage = perPage;
}

/**
 * 是否有上一页
 * @method hasPrevPage
 * @returns {Boolean}
 */
Paginate.prototype.hasPrevPage = function(){
  if(this.page >1){
    return true;
  }
  return false;
}

/**
 * 上一页
 * @method prevPage
 * @returns {Number}
 */
Paginate.prototype.prevPage = function(){
  if(this.page <= 1){
    return 1;
  }
  return this.page-1;
}

/**
 * 是否有下一页
 * @method hasNextPage
 * @returns {Boolean}
 */
Paginate.prototype.hasNextPage = function(){
  if(this.page < this.pages){
    return true;
  }
  return false;
}

/**
 * 下一页
 * @method nextPage
 * @returns {Number}
 */
Paginate.prototype.nextPage = function(){
  if(this.page < this.pages){
    return this.page+1;
  }
  return this.pages;
}

module.exports = Paginate;
module.exports.Paginate = Paginate;