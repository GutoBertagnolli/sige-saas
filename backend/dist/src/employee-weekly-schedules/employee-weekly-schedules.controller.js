"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.EmployeeWeeklySchedulesController = void 0;
const common_1 = require("@nestjs/common");
const employee_weekly_schedules_service_1 = require("./employee-weekly-schedules.service");
let EmployeeWeeklySchedulesController = class EmployeeWeeklySchedulesController {
    constructor(service) {
        this.service = service;
    }
    findByEmployee(employeeId) {
        return this.service.findByEmployee(employeeId);
    }
    create(body) {
        return this.service.create(body);
    }
    update(id, body) {
        return this.service.update(id, body);
    }
    bulk(body) {
        return this.service.bulkReplace(body.employeeId, body.items || []);
    }
    remove(id) {
        return this.service.remove(id);
    }
};
exports.EmployeeWeeklySchedulesController = EmployeeWeeklySchedulesController;
__decorate([
    (0, common_1.Get)('employee/:employeeId'),
    __param(0, (0, common_1.Param)('employeeId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], EmployeeWeeklySchedulesController.prototype, "findByEmployee", null);
__decorate([
    (0, common_1.Post)(),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], EmployeeWeeklySchedulesController.prototype, "create", null);
__decorate([
    (0, common_1.Put)(':id'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], EmployeeWeeklySchedulesController.prototype, "update", null);
__decorate([
    (0, common_1.Post)('bulk'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], EmployeeWeeklySchedulesController.prototype, "bulk", null);
__decorate([
    (0, common_1.Delete)(':id'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], EmployeeWeeklySchedulesController.prototype, "remove", null);
exports.EmployeeWeeklySchedulesController = EmployeeWeeklySchedulesController = __decorate([
    (0, common_1.Controller)('employee-weekly-schedules'),
    __metadata("design:paramtypes", [employee_weekly_schedules_service_1.EmployeeWeeklySchedulesService])
], EmployeeWeeklySchedulesController);
//# sourceMappingURL=employee-weekly-schedules.controller.js.map