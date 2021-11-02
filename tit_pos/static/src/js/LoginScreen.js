odoo.define('tit_pos.LoginScreen', function(require) {
    'use strict';

    const LoginScreen = require('pos_hr.LoginScreen');
    const Registries = require('point_of_sale.Registries');
    var { Gui } = require('point_of_sale.Gui');
    var models = require('point_of_sale.models');
    const { useState } = owl.hooks;
    const { update_css } = require('tit_pos_order.CustomCashierScreen')
    var rpc = require('web.rpc');
    const {verif_groupe} = require('tit_pos_order.verif_group_user')
    
    models.load_fields('res.partner',[ 'property_account_position_id', 'company_type', 'child_ids', 'type', 'website', 'siren_company', 'nic_company','credit_limit']);

    const LoginScreenOverride = LoginScreen =>
        class extends LoginScreen {

            /**
            * @override
            */

            async selectCashier() {
	            const list = this.env.pos.employees.map((employee) => {
	                return {
	                    id: employee.id,
	                    item: employee,
	                    label: employee.name,
	                    isSelected: false,
	                };
	            });
	            const employee = await this.selectEmployee(list);
	            if (employee) {
	                this.env.pos.set_cashier(employee);
	                this.back();
	                this.showScreen('profile_page');
	                verif_groupe()//verifier groupe de l'utilisateur connecté sur le pos
	            }
	        }
        };
    Registries.Component.extend(LoginScreen, LoginScreenOverride);
    return LoginScreen;
});
