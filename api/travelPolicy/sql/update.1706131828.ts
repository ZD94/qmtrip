"use strict";
import { Sequelize,Transaction } from 'sequelize';

var _=require("lodash");
var uuid=require("uuid");
var moment=require("moment");


export default async function update(DB: Sequelize, t: Transaction){
    //await DB.query(sql, {transaction: t});
    var querySql='select * from travel_policy.travel_policies order by created_at desc';
    let [children] = await DB.query(querySql) as any[];
    for(var i=0; i < children.length; i++){
        let plane_levels = children[i].plane_levels ? `'{${children[i].plane_levels.join(",")}}'` : null;
        let train_levels=children[i].train_levels ? `'{${children[i].train_levels.join(",")}}'` : null;
        let hotel_levels=children[i].hotel_levels ? `'{${children[i].hotel_levels.join(",")}}'` : null;
        let abroad_plane_levels = children[i].abroad_plane_levels ? `'{${children[i].abroad_plane_levels.join(",")}}'` : null;
        let abroad_train_levels = children[i].abroad_train_levels ? `'{${children[i].abroad_train_levels.join(",")}}'` : null;
        let abroad_hotel_levels = children[i].abroad_hotel_levels ? `'{${children[i].abroad_hotel_levels.join(",")}}'` : null;

        var insertSql;
        var createdAt  = moment(children[i].created_at).format();
        var updatedAt = moment(children[i].updated_at).format();
        var deletedAt;
        if(children[i].deleted_at){
            deletedAt = "'"+moment(children[i].deleted_at).format()+"'";
        }else{
            deletedAt = null;
        }

        insertSql = `insert into travel_policy.travel_policy_regions( id, region_id, policy_id, plane_levels, train_levels, hotel_levels,
                   plane_discount, traffic_prefer, hotel_prefer, created_at, updated_at, deleted_at)
                   values('${uuid.v1()}', 'CTW_5', '${children[i].id}', ${plane_levels}, ${train_levels}, ${hotel_levels},
                   ${children[i].plane_discount}, ${children[i].traffic_prefer}, ${children[i].hotel_prefer}, '${createdAt}',
                   '${updatedAt}', ${deletedAt})`;

        DB.query(insertSql).spread(function(children,row){
        });

        if(children[i].is_open_abroad){
            insertSql = `insert into travel_policy.travel_policy_regions( id, name, region_id, policy_id, plane_levels, train_levels, hotel_levels,
               plane_discount, traffic_prefer, hotel_prefer, created_at, updated_at, deleted_at)
               values('${uuid.v1()}', 'Globe', '${children[i].id}', ${abroad_plane_levels}, ${abroad_train_levels}, ${abroad_hotel_levels},
               ${children[i].plane_discount}, ${children[i].traffic_prefer}, ${children[i].hotel_prefer}, '${createdAt}',
               '${updatedAt}', ${deletedAt}) `;

            DB.query(insertSql).spread(function(children,row){
            });
        }
    }

}



