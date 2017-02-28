/*
 * created 2017/02/28 
*/


module.exports = {
   /* check input of the user name.
    限制为中文、英文，可以有空格，英文最多30个字符，中文最多5个汉字，如果中英文混合，按照中文处理。超过不可以输入，输入特殊字符时点保存，提示『姓名格式不符合要求，请重新输入*/
    CheckUsername(str:string) : boolean{
        const MAX_CN_LENGTH = 5;
        const MAX_EN_LENGTH = 30;

        var cnReg = /^[\u4e00-\u9fa5\s]+$/
        var enReg = /^[a-zA-Z\s]+$/;
        var cnEnReg = /^[\u4e00-\u9fa5\sA-Za-z\s]+$/;
        if (cnReg.test(str)) {
            if (str.length > MAX_CN_LENGTH) {
                return false;
            }
        } else if (enReg.test(str)) {
             if (str.length > MAX_EN_LENGTH) {
                 return false;
             }
        } else if (cnEnReg) {
             if (str.length > MAX_CN_LENGTH) {
                 return false;
             }
        } else {
            return false;
        }

        return true;
    }
}