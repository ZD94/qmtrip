/**
 * Created by seven on 2017/1/20.
 */
"use strict";
import {IndexController} from "./controller";

export async function IndexInsteadController($scope,$injector){
    console.info(",,,,")
    return $injector.invoke(IndexController,this,{$scope})
}