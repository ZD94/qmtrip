"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
var language_1 = require("common/language");
var _types_1 = require("_types");
var cached_1 = require("common/model/cached");
var remote_1 = require("common/model/remote");
var index_1 = require("../index");
var staff_1 = require("_types/staff");
var company_1 = require("_types/company");
var promoCode_1 = require("_types/promoCode");
var department_1 = require("_types/department");
var travelPolicy_1 = require("_types/travelPolicy");
var accordHotel_1 = require("_types/accordHotel");
var notice_1 = require("_types/notice");
var agency_1 = require("_types/agency");
var tripPlan_1 = require("_types/tripPlan");
var auth_1 = require("_types/auth");
var seed_1 = require("_types/seed");
var coin_1 = require("_types/coin");
var tripPlan_2 = require("_types/tripPlan");
var approve_1 = require("_types/approve");
var agency_operate_log_1 = require("_types/agency/agency-operate-log");
var tripBasicPackage_1 = require("_types/tripPackage/tripBasicPackage");
var tripFuelAddPackage_1 = require("_types/tripPackage/tripFuelAddPackage");
var API = require('common/api');
function resolverAPIModule(modname) {
    return function () {
        if (API[modname])
            return Promise.resolve();
        API.require(modname);
        return API.onload();
    };
}
function DummyGet() {
    return {
        save: function () { return Promise.resolve(this); },
        destroy: function () { Promise.resolve(); },
    };
}
var Services = {
    staff: { type: staff_1.Staff, modname: 'staff',
        funcs: ['getStaff', 'getStaffs', 'createStaff', 'updateStaff', 'deleteStaff']
    },
    credential: { type: staff_1.Credential, modname: 'staff',
        funcs: ['getPapersById', null, 'createPapers', 'updatePapers', 'deletePapers']
    },
    pointChange: { type: staff_1.PointChange, modname: 'staff',
        funcs: ['getPointChange', 'getPointChanges']
    },
    invitedLink: { type: staff_1.InvitedLink, modname: 'staff',
        funcs: ['getInvitedLink', 'getInvitedLinks', 'createInvitedLink', 'updateInvitedLink']
    },
    staffSupplierInfo: { type: staff_1.StaffSupplierInfo, modname: 'staff',
        funcs: ['getStaffSupplierInfo', 'getStaffSupplierInfos', 'createStaffSupplierInfo', 'updateStaffSupplierInfo', 'deleteStaffSupplierInfo']
    },
    company: { type: company_1.Company, modname: 'company',
        funcs: ['getCompany', 'listCompany', 'registerCompany', 'updateCompany', 'deleteCompany']
    },
    moneyChange: { type: company_1.MoneyChange, modname: 'company',
        funcs: ['getMoneyChange', 'listMoneyChange', 'saveMoneyChange']
    },
    tripPlanNumChange: { type: company_1.TripPlanNumChange, modname: 'company',
        funcs: ['getTripPlanNumChange', 'getTripPlanNumChanges', 'createTripPlanNumChange']
    },
    supplier: { type: company_1.Supplier, modname: 'company',
        funcs: ['getSupplier', 'getSuppliers', 'createSupplier', 'updateSupplier', 'deleteSupplier']
    },
    promoCode: { type: promoCode_1.PromoCode, modname: 'promoCode',
        funcs: ['getPromoCode', 'getPromoCodes', 'createPromoCode', 'updatePromoCode', 'deletePromoCode']
    },
    department: { type: department_1.Department, modname: 'department',
        funcs: ['getDepartment', 'getDepartments', 'createDepartment', 'updateDepartment', 'deleteDepartment']
    },
    staffDepartment: { type: department_1.StaffDepartment, modname: 'department',
        funcs: ['getStaffDepartment', 'getStaffDepartments', 'createStaffDepartment', 'updateStaffDepartment', 'deleteStaffDepartment']
    },
    travelPolicy: { type: travelPolicy_1.TravelPolicy, modname: 'travelPolicy',
        funcs: ['getTravelPolicy', 'getTravelPolicies', 'createTravelPolicy', 'updateTravelPolicy', 'deleteTravelPolicy']
    },
    subsidyTemplate: { type: travelPolicy_1.SubsidyTemplate, modname: 'travelPolicy',
        funcs: ['getSubsidyTemplate', 'getSubsidyTemplates', 'createSubsidyTemplate', 'updateSubsidyTemplate', 'deleteSubsidyTemplate']
    },
    accordHotel: { type: accordHotel_1.AccordHotel, modname: 'accordHotel',
        funcs: ['getAccordHotel', 'getAccordHotels', 'createAccordHotel', 'updateAccordHotel', 'deleteAccordHotel']
    },
    notice: { type: notice_1.Notice, modname: 'notice',
        funcs: ['getNotice', 'getNotices', 'createNotice', 'updateNotice', 'deleteNotice']
    },
    noticeAccount: { type: notice_1.NoticeAccount, modname: 'notice',
        funcs: ['getNoticeAccount', 'getNoticeAccounts', 'createNoticeAccount', 'updateNoticeAccount', 'deleteNoticeAccount']
    },
    agency: { type: agency_1.Agency, modname: 'agency',
        funcs: ['getAgencyById', 'listAgency', 'registerAgency', 'updateAgency', 'deleteAgency']
    },
    agencyUser: { type: agency_1.AgencyUser, modname: 'agency',
        funcs: ['getAgencyUser', 'listAgencyUser', 'createAgencyUser', 'updateAgencyUser', 'deleteAgencyUser']
    },
    tripApprove: { type: tripPlan_1.TripApprove, modname: 'tripApprove',
        funcs: ['getTripApprove', 'getTripApproves', 'saveTripApprove', 'updateTripApprove', 'deleteTripApprove']
    },
    approve: { type: approve_1.Approve, modname: 'approve', funcs: [null, null, 'submitApprove'] },
    tripPlan: { type: tripPlan_1.TripPlan, modname: 'tripPlan',
        funcs: ['getTripPlan', 'listTripPlans', 'saveTripPlan', 'updateTripPlan', 'deleteTripPlan']
    },
    tripDetail: { type: tripPlan_1.TripDetail, modname: 'tripPlan',
        funcs: ['getTripDetail', 'getTripDetails', 'saveTripDetail', 'updateTripDetail', 'deleteTripDetail']
    },
    tripPlanLog: { type: tripPlan_1.TripPlanLog, modname: 'tripPlan',
        funcs: ['getTripPlanLog', 'getTripPlanLogs', 'saveTripPlanLog', 'updateTripPlanLog', 'deleteTripPlanLog']
    },
    project: { type: tripPlan_1.Project, modname: 'tripPlan',
        funcs: ['getProjectById', 'getProjectList', 'createProject']
    },
    // place: { type: Place, modname: 'place',
    //     funcs: ['getCityInfo', 'queryPlace']
    // },
    account: { type: auth_1.Account, modname: 'auth',
        funcs: ['getAccount', 'getAccounts', null, 'updateAccount', 'deleteAccount']
    },
    seed: { type: seed_1.Seed, modname: 'seeds',
        funcs: []
    },
    token: { type: auth_1.Token, modname: 'token', funcs: [] },
    //鲸币账户
    coinAccount: { type: coin_1.CoinAccount, modname: 'coin', funcs: ['getCoinAccount'] },
    coinAccountChange: { type: coin_1.CoinAccountChange, modname: 'coin', funcs: ['getCoinAccountChange', 'getCoinAccountChanges'] },
    financeCheckCode: { type: tripPlan_1.FinanceCheckCode, modname: 'tripPlan', funcs: ['getTripDetail'] },
    tripDetailInvoice: { type: tripPlan_2.TripDetailInvoice, modname: 'tripPlan', funcs: ['getTripDetailInvoice', 'getTripDetailInvoices', 'saveTripDetailInvoice', 'updateTripDetailInvoice', 'deleteTripDetailInvoice'] },
    tripDetailTraffic: { type: tripPlan_2.TripDetailTraffic, modname: 'tripPlan', funcs: ['getTripDetailTraffic'] },
    tripDetailHotel: { type: tripPlan_2.TripDetailHotel, modname: 'tripPlan', funcs: ['getTripDetailHotel'] },
    tripDetailSubsidy: { type: tripPlan_2.TripDetailSubsidy, modname: 'tripPlan', funcs: ['getTripDetailSubsidy'] },
    tripDetailSpecial: { type: tripPlan_2.TripDetailSpecial, modname: 'tripPlan', funcs: ['getTripDetailSpecial'] },
    agencyOperateLog: { type: agency_operate_log_1.AgencyOperateLog, modname: 'agency', funcs: ['getAgencyOperateLog', 'getAgencyOperateLogs'] },
    tripBasicPackage: { type: tripBasicPackage_1.TripBasicPackage, modname: 'tripPackage', funcs: [] },
    tripFuelAddPackage: { type: tripFuelAddPackage_1.TripFuelAddPackage, modname: 'tripPackage', funcs: [] },
};
function throwNotImplemented() {
    throw language_1.default.ERR.NOT_IMPLEMENTED();
}
function createService(options, cacheFactory) {
    options.cache = cacheFactory(options.type.name);
    options.resolve = resolverAPIModule(options.modname);
    options.funcGet = options.funcs[0] || throwNotImplemented;
    options.funcFind = options.funcs[1] || throwNotImplemented;
    options.funcCreate = options.funcs[2] || throwNotImplemented;
    options.funcUpdate = options.funcs[3] || throwNotImplemented;
    options.funcDelete = options.funcs[4] || throwNotImplemented;
    return new remote_1.ModelRemoteOld(options);
}
function createRemoteService(options, cacheFactory) {
    options.cache = cacheFactory(options.type.name);
    options.resolve = resolverAPIModule('model');
    return new remote_1.ModelRemote(options);
}
var ClientModels = (function () {
    function ClientModels($cacheFactory, $rootScope) {
        var _this = this;
        this.$resetObjects = [];
        this.staff = createService(Services.staff, $cacheFactory);
        this.credential = createService(Services.credential, $cacheFactory);
        this.pointChange = createService(Services.pointChange, $cacheFactory);
        this.supplier = createService(Services.supplier, $cacheFactory);
        this.tripPlanNumChange = createService(Services.tripPlanNumChange, $cacheFactory);
        this.invitedLink = createService(Services.invitedLink, $cacheFactory);
        this.staffSupplierInfo = createService(Services.staffSupplierInfo, $cacheFactory);
        this.company = createService(Services.company, $cacheFactory);
        this.promoCode = createService(Services.promoCode, $cacheFactory);
        this.department = createService(Services.department, $cacheFactory);
        this.staffDepartment = createService(Services.staffDepartment, $cacheFactory);
        this.travelPolicy = createService(Services.travelPolicy, $cacheFactory);
        this.subsidyTemplate = createService(Services.subsidyTemplate, $cacheFactory);
        this.accordHotel = createService(Services.accordHotel, $cacheFactory);
        this.notice = createService(Services.notice, $cacheFactory);
        this.noticeAccount = createService(Services.noticeAccount, $cacheFactory);
        this.agency = createService(Services.agency, $cacheFactory);
        this.agencyUser = createService(Services.agencyUser, $cacheFactory);
        this.tripPlan = createService(Services.tripPlan, $cacheFactory);
        this.tripDetail = createService(Services.tripDetail, $cacheFactory);
        this.tripPlanLog = createService(Services.tripPlanLog, $cacheFactory);
        this.moneyChange = createService(Services.moneyChange, $cacheFactory);
        this.project = createService(Services.project, $cacheFactory);
        this.tripApprove = createService(Services.tripApprove, $cacheFactory);
        this.account = createService(Services.account, $cacheFactory);
        this.token = createService(Services.token, $cacheFactory);
        this.seed = createService(Services.seed, $cacheFactory);
        this.coinAccount = createService(Services.coinAccount, $cacheFactory);
        this.coinAccountChange = createService(Services.coinAccountChange, $cacheFactory);
        this.tripDetailInvoice = createService(Services.tripDetailInvoice, $cacheFactory);
        this.tripDetailTraffic = createService(Services.tripDetailTraffic, $cacheFactory);
        this.tripDetailHotel = createService(Services.tripDetailHotel, $cacheFactory);
        this.tripDetailSubsidy = createService(Services.tripDetailSubsidy, $cacheFactory);
        this.tripDetailSpecial = createService(Services.tripDetailSpecial, $cacheFactory);
        this.approve = createService(Services.approve, $cacheFactory);
        this.agencyOperateLog = createService(Services.agencyOperateLog, $cacheFactory);
        this.tripBasicPackage = createService(Services.tripBasicPackage, $cacheFactory);
        this.tripFuelAddPackage = createService(Services.tripFuelAddPackage, $cacheFactory);
        _types_1.initModels(this);
        $rootScope.$on('$locationChangeSuccess', function () {
            for (var _i = 0, _a = _this.$resetObjects; _i < _a.length; _i++) {
                var obj = _a[_i];
                obj.$reset();
            }
            _this.$resetObjects = [];
        });
        API.on('beforeConnect', this.clearCache.bind(this));
    }
    ClientModels.prototype.clearCache = function () {
        for (var k in this) {
            var v = this[k];
            if (v instanceof cached_1.ModelCached)
                v.clearCache();
        }
    };
    ClientModels.prototype.resetOnPageChange = function (obj) {
        this.$resetObjects.push(obj);
    };
    return ClientModels;
}());
ClientModels = __decorate([
    index_1.ngService('Models')
], ClientModels);
require("./menu");
require("./place");
