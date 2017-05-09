
export interface LandMark{
    latitude:number,
    longitude:number
}
export interface RemarkCondition{
    landmark?:LandMark,
    isAbroad?:boolean,
    channel?:string
}