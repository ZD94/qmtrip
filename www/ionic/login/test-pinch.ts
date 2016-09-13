export function TestPinchController ($scope){

    $scope.tap = function tap (event){
        console.info(event)
    }
    var img = document.getElementById('img') as HTMLImageElement;
    var canvas = document.getElementsByTagName('canvas')[0];
    var ctx = canvas.getContext('2d');
    var canvasScale = canvas.width / $(canvas).width();
    // setTimeout(function(){
    //     ctx.drawImage(img,(canvas.width-img.width)/2,(canvas.height-img.height)/2,img.width,img.height)
    // },1000)
    img.onload = function(){
        repaint();
    }
    var state = {
        offsetX: 0,
        offsetY: 0,
        centerX: 0,
        centerY: 0,
        scale: 1,
        rotate: 0
    };
    var origState: typeof state;

    function repaint(){
        //ctx.clear();
        ctx.clearRect(0,0,canvas.width,canvas.height);
        ctx.save();
        ctx.translate(state.centerX,state.centerY);
        ctx.scale(state.scale,state.scale);
        ctx.rotate(state.rotate*Math.PI/180);
        ctx.drawImage(img, state.offsetX, state.offsetY, img.width, img.height);
        ctx.restore();
    }

    $scope.hammerStart = function saveOrigState(event){
        console.info(event.type, event.deltaX, event.deltaY, event.scale, event.center, event.rotation);
        origState = _.clone(state);
        origState.rotate = origState.rotate - event.rotation;
    }

    $scope.hammerEnd = function onHammerEnd(event){
        console.info(event.type, event.deltaX, event.deltaY, event.scale, event.center);
        origState = undefined;
    }

    $scope.onHammer = function onHammer (event) {
        $scope.types = event.scale;
        console.info(event.type, event.deltaX, event.deltaY, event.scale, event.center, event.rotation);
        if(!origState){
            return;
        }
        //ctx.scale(event.scale,event.scale);
        if(event.type == 'pan'){
            let deltaX = event.deltaX * canvasScale;
            let deltaY = event.deltaY * canvasScale;
            state.centerX = origState.centerX+deltaX;
            state.centerY = origState.centerY+deltaY;
        }
        else if(event.type == 'pinch' || event.type == 'rotate'){
            let centerX = event.center.x;
            let centerY = event.center.y;
            let rect = canvas.getBoundingClientRect();
            centerX -= rect.left;
            centerY -= rect.top;
            state.offsetX = (origState.offsetX-(centerX-origState.centerX))*event.scale;
            state.offsetY = (origState.offsetY-(centerY-origState.centerY))*event.scale;
            state.centerX = centerX;
            state.centerY = centerY;

            state.scale = origState.scale*event.scale;
            state.rotate = origState.rotate + event.rotation;
        }
        repaint();
    }
}