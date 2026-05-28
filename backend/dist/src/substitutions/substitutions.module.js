"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SubstitutionsModule = void 0;
const common_1 = require("@nestjs/common");
const prisma_module_1 = require("../common/prisma.module");
const substitutions_controller_1 = require("./substitutions.controller");
const substitutions_service_1 = require("./substitutions.service");
let SubstitutionsModule = class SubstitutionsModule {
};
exports.SubstitutionsModule = SubstitutionsModule;
exports.SubstitutionsModule = SubstitutionsModule = __decorate([
    (0, common_1.Module)({
        imports: [prisma_module_1.PrismaModule],
        controllers: [substitutions_controller_1.SubstitutionsController],
        providers: [substitutions_service_1.SubstitutionsService],
    })
], SubstitutionsModule);
//# sourceMappingURL=substitutions.module.js.map