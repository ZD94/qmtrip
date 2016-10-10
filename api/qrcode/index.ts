/**
 * Created by wlh on 2016/10/10.
 */

'use strict';

const qr = require('qr-image');

class QrcodeModule {

    static async makeQrcode(params: {content: string}) {
        let {content} = params;
        let bfs = qr.imageSync(content, {type: 'png', ec_level: 'L'});
        return bfs.toString('base64');
    }
}

export= QrcodeModule