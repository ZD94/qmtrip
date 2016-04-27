/**
 * Created by wlh on 16/4/27.
 */

class TrafficBudget{
    from: string
    to: string
    price: number
    trafficType: string // 'air'飞机 'train'火车
    bookUrl: string
    recommend: any

    constructor(obj: any) {
        this.price = obj.price;
        this.trafficType = obj.trafficType;
        this.bookUrl = obj.bookUrl;
        this.recommend = obj.recommend;
    }
}

class HotelBudget {
    price: number
    bookUrl: string
    recommend: any
    city: string

    constructor(obj: any) {
        this.price = obj.price;
        this.bookUrl = obj.bookUrl;
        this.recommend = obj.recommend;
        this.city = obj.city;
    }
}

export {TrafficBudget}
export {HotelBudget}