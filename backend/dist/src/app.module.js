"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppModule = void 0;
const substitutions_module_1 = require("./substitutions/substitutions.module");
const absences_module_1 = require("./absences/absences.module");
const availability_module_1 = require("./availability/availability.module");
const employee_weekly_schedules_module_1 = require("./employee-weekly-schedules/employee-weekly-schedules.module");
const employees_module_1 = require("./employees/employees.module");
const classes_module_1 = require("./classes/classes.module");
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const prisma_module_1 = require("./common/prisma.module");
const auth_module_1 = require("./auth/auth.module");
const tenants_module_1 = require("./tenants/tenants.module");
const users_module_1 = require("./users/users.module");
const schools_module_1 = require("./schools/schools.module");
const time_templates_module_1 = require("./time-templates/time-templates.module");
let AppModule = class AppModule {
};
exports.AppModule = AppModule;
exports.AppModule = AppModule = __decorate([
    (0, common_1.Module)({
        imports: [
            config_1.ConfigModule.forRoot({ isGlobal: true }),
            availability_module_1.AvailabilityModule,
            employee_weekly_schedules_module_1.EmployeeWeeklySchedulesModule,
            prisma_module_1.PrismaModule,
            absences_module_1.AbsencesModule,
            classes_module_1.ClassesModule,
            auth_module_1.AuthModule,
            substitutions_module_1.SubstitutionsModule,
            tenants_module_1.TenantsModule,
            users_module_1.UsersModule,
            schools_module_1.SchoolsModule,
            time_templates_module_1.TimeTemplatesModule,
            employees_module_1.EmployeesModule,
        ],
    })
], AppModule);
//# sourceMappingURL=app.module.js.map